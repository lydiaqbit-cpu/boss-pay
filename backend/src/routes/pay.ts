import { Router, Request, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { prisma } from '../utils/prisma'
import { notifyUser } from '../ws/notifier'

const router = Router()
const FEE_RATE = Number(process.env.PLATFORM_FEE_RATE || 0.05)

// GET /api/pay/page/:userId — 公开收款页（老板访问，无需登录）
router.get('/page/:userId', async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.userId },
    select: {
      id: true, nickname: true, avatar: true, bio: true,
      wechatQrUrl: true, alipayAccount: true, alipayName: true,
      bankCard: true, bankName: true, bankHolder: true
    }
  })
  if (!user) { res.status(404).json({ code: 404, message: '收款页不存在' }); return }

  const packages = await prisma.package.findMany({
    where: { userId: req.params.userId, isActive: true },
    orderBy: { sortOrder: 'asc' }
  })
  res.json({ code: 0, data: { user, packages } })
})

// POST /api/pay/boss-paid — 老板申报已转账，创建订单
router.post('/boss-paid', async (req: Request, res: Response) => {
  const { userId, packageId, payerName, payerNote } = req.body
  if (!userId || !packageId || !payerName) {
    res.status(400).json({ code: 400, message: '缺少必要参数' }); return
  }

  const pkg = await prisma.package.findUnique({ where: { id: packageId } })
  if (!pkg || pkg.userId !== userId) {
    res.status(400).json({ code: 400, message: '套餐不存在' }); return
  }

  const platformFee = Number((pkg.price * FEE_RATE).toFixed(2))
  const netAmount = Number((pkg.price - platformFee).toFixed(2))

  const order = await prisma.order.create({
    data: {
      userId,
      packageId,
      payerName,
      payerNote: payerNote || '',
      amount: pkg.price,
      platformFee,
      netAmount,
      status: 'boss_paid'
    }
  })

  notifyUser(userId, {
    type: 'boss_paid',
    orderId: order.id,
    amount: pkg.price,
    payerName,
    message: `💰 ${payerName} 说已转账 ¥${pkg.price}，快去确认！`
  })

  res.json({ code: 0, data: { orderId: order.id } })
})

// GET /api/pay/orders — 员工查看自己的订单（需登录）
router.get('/orders', authMiddleware, async (req: AuthRequest, res: Response) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.userId! },
    include: { package: { select: { name: true, hours: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50
  })
  res.json({ code: 0, data: orders })
})

// POST /api/pay/orders/:id/confirm — 员工确认收款
router.post('/orders/:id/confirm', authMiddleware, async (req: AuthRequest, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } })
  if (!order || order.userId !== req.userId) {
    res.status(404).json({ code: 404, message: '订单不存在' }); return
  }
  if (order.status !== 'boss_paid') {
    res.status(400).json({ code: 400, message: '订单状态不正确' }); return
  }
  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'confirmed', confirmedAt: new Date() }
  })
  res.json({ code: 0, message: '已确认收款' })
})

// POST /api/pay/orders/:id/reject — 员工拒绝（未收到钱）
router.post('/orders/:id/reject', authMiddleware, async (req: AuthRequest, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } })
  if (!order || order.userId !== req.userId) {
    res.status(404).json({ code: 404, message: '订单不存在' }); return
  }
  if (order.status !== 'boss_paid') {
    res.status(400).json({ code: 400, message: '订单状态不正确' }); return
  }
  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'rejected' }
  })
  res.json({ code: 0, message: '已拒绝' })
})

export default router
