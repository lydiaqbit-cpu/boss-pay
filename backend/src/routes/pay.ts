import { Router, Request, Response } from 'express'
import rateLimit from 'express-rate-limit'
import sharp from 'sharp'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { prisma } from '../utils/prisma'
import { notifyUser } from '../ws/notifier'
import { asyncHandler } from '../utils/asyncHandler'

async function compressQr(dataUrl: string): Promise<string> {
  try {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) return dataUrl
    const buf = Buffer.from(match[2], 'base64')
    // 已经够小就直接返回（小于 50KB）
    if (buf.length < 50 * 1024) return dataUrl
    const compressed = await sharp(buf)
      .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 60 })
      .toBuffer()
    return 'data:image/jpeg;base64,' + compressed.toString('base64')
  } catch {
    return dataUrl
  }
}

const router = Router()

const rawRate = Number(process.env.PLATFORM_FEE_RATE ?? '0.05')
const FEE_RATE = isNaN(rawRate) || rawRate < 0 || rawRate > 1 ? 0.05 : rawRate

const bossPaidLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { code: 429, message: '操作太频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
})

// GET /api/pay/page/:userId — 公开收款页（老板访问，无需登录）
// 不返回 base64 图片，减少响应体积
router.get('/page/:userId', asyncHandler(async (req: Request, res: Response) => {
  const [userRow, packages] = await Promise.all([
    prisma.user.findUnique({
      where: { id: req.params.userId },
      select: { id: true, nickname: true, bio: true,
        defaultPaymentMethod: true, wechatQrUrl: true, alipayQrUrl: true }
    }),
    prisma.package.findMany({
      where: { userId: req.params.userId, isActive: true },
      orderBy: { sortOrder: 'asc' }
    })
  ])
  if (!userRow) { res.status(404).json({ code: 404, message: '收款页不存在' }); return }

  // 剥掉大体积 base64，只返回标志位；图片走 /pay/qr/:userId 单独拉
  const { wechatQrUrl, alipayQrUrl, ...userInfo } = userRow
  res.json({
    code: 0,
    data: {
      user: { ...userInfo, hasWechat: !!wechatQrUrl, hasAlipay: !!alipayQrUrl },
      packages
    }
  })
}))

// GET /api/pay/qr/:userId — 单独返回收款码图片（按需加载）
router.get('/qr/:userId', asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.userId },
    select: { wechatQrUrl: true, alipayQrUrl: true }
  })
  if (!user) { res.status(404).json({ code: 404, message: '用户不存在' }); return }
  const [wechatQrUrl, alipayQrUrl] = await Promise.all([
    user.wechatQrUrl ? compressQr(user.wechatQrUrl) : Promise.resolve(''),
    user.alipayQrUrl ? compressQr(user.alipayQrUrl) : Promise.resolve('')
  ])
  res.json({ code: 0, data: { wechatQrUrl, alipayQrUrl } })
}))

// GET /api/pay/receipt/:orderId — 公开凭证（老板付款后查看，无需登录）
router.get('/receipt/:orderId', asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.orderId },
    select: {
      id: true, amount: true, netAmount: true, payerName: true, payerNote: true,
      status: true, createdAt: true, confirmedAt: true,
      package: { select: { name: true, hours: true } },
      user: { select: { nickname: true } }
    }
  })
  if (!order) { res.status(404).json({ code: 404, message: '凭证不存在' }); return }
  res.json({ code: 0, data: order })
}))

// POST /api/pay/boss-paid — 老板申报已转账，创建订单
router.post('/boss-paid', bossPaidLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { userId, packageId, payerName, payerNote } = req.body
  if (!userId || !packageId || !payerName) {
    res.status(400).json({ code: 400, message: '缺少必要参数' }); return
  }

  const pkg = await prisma.package.findUnique({ where: { id: packageId } })
  if (!pkg || pkg.userId !== userId) {
    res.status(400).json({ code: 400, message: '套餐不存在' }); return
  }

  // 用整数分运算避免浮点误差
  const priceCents = Math.round(pkg.price * 100)
  const feeCents = Math.round(priceCents * FEE_RATE)
  const netCents = priceCents - feeCents
  const platformFee = feeCents / 100
  const netAmount = netCents / 100

  const order = await prisma.order.create({
    data: { userId, packageId, payerName, payerNote: payerNote || '', amount: pkg.price, platformFee, netAmount, status: 'boss_paid' }
  })

  notifyUser(userId, {
    type: 'boss_paid',
    orderId: order.id,
    amount: pkg.price,
    payerName,
    message: `💰 ${payerName} 说已转账 ¥${pkg.price}，快去确认！`
  })

  res.json({ code: 0, data: { orderId: order.id } })
}))

// GET /api/pay/orders — 员工查看自己的订单（需登录）
router.get('/orders', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.userId! },
    include: { package: { select: { name: true, hours: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50
  })
  res.json({ code: 0, data: orders })
}))

// POST /api/pay/orders/:id/confirm — 员工确认收款（原子操作防竞态）
router.post('/orders/:id/confirm', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } })
  if (!order || order.userId !== req.userId) {
    res.status(404).json({ code: 404, message: '订单不存在' }); return
  }
  const result = await prisma.order.updateMany({
    where: { id: req.params.id, userId: req.userId!, status: 'boss_paid' },
    data: { status: 'confirmed', confirmedAt: new Date() }
  })
  if (result.count === 0) {
    res.status(409).json({ code: 409, message: '订单已处理或状态不正确' }); return
  }
  res.json({ code: 0, message: '已确认收款' })
}))

// POST /api/pay/orders/:id/reject — 员工拒绝（原子操作防竞态）
router.post('/orders/:id/reject', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } })
  if (!order || order.userId !== req.userId) {
    res.status(404).json({ code: 404, message: '订单不存在' }); return
  }
  const result = await prisma.order.updateMany({
    where: { id: req.params.id, userId: req.userId!, status: 'boss_paid' },
    data: { status: 'rejected' }
  })
  if (result.count === 0) {
    res.status(409).json({ code: 409, message: '订单已处理或状态不正确' }); return
  }
  res.json({ code: 0, message: '已拒绝' })
}))

// POST /api/pay/orders/:id/restore — 员工撤销拒绝，恢复为待确认
router.post('/orders/:id/restore', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } })
  if (!order || order.userId !== req.userId) {
    res.status(404).json({ code: 404, message: '订单不存在' }); return
  }
  const result = await prisma.order.updateMany({
    where: { id: req.params.id, userId: req.userId!, status: 'rejected' },
    data: { status: 'boss_paid' }
  })
  if (result.count === 0) {
    res.status(409).json({ code: 409, message: '订单状态不正确' }); return
  }
  res.json({ code: 0, message: '已恢复待确认' })
}))

export default router
