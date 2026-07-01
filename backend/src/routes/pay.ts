import { Router, Request, Response } from 'express'
import { createMockOrder, simulatePaymentCallback } from '../services/mockPay'
import { notifyUser } from '../ws/notifier'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { prisma } from '../utils/prisma'

const router = Router()
const FEE_RATE = Number(process.env.PLATFORM_FEE_RATE || 0.05)

// GET /api/pay/page/:userId — 公开收款页（老板扫码进来，无需登录）
router.get('/page/:userId', async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.userId },
    select: { id: true, nickname: true, avatar: true, bio: true }
  })
  if (!user) { res.status(404).json({ code: 404, message: '收款页不存在' }); return }

  const packages = await prisma.package.findMany({
    where: { userId: req.params.userId, isActive: true },
    orderBy: { sortOrder: 'asc' }
  })
  res.json({ code: 0, data: { user, packages } })
})

// POST /api/pay/create — 老板选套餐，创建支付订单
router.post('/create', async (req: Request, res: Response) => {
  const { userId, packageId, payerName } = req.body
  if (!userId || !packageId || !payerName) {
    res.status(400).json({ code: 400, message: '缺少必要参数' })
    return
  }

  const pkg = await prisma.package.findUnique({ where: { id: packageId } })
  if (!pkg || pkg.userId !== userId) {
    res.status(400).json({ code: 400, message: '套餐不存在' })
    return
  }

  const platformFee = Number((pkg.price * FEE_RATE).toFixed(2))
  const netAmount = Number((pkg.price - platformFee).toFixed(2))

  const order = await prisma.order.create({
    data: {
      userId,
      packageId,
      payerName,
      amount: pkg.price,
      platformFee,
      netAmount,
      status: 'pending'
    }
  })

  const { qrUrl, wechatOrderNo } = createMockOrder({
    orderId: order.id,
    amount: pkg.price,
    description: pkg.name
  })

  await prisma.order.update({
    where: { id: order.id },
    data: { mockQrUrl: qrUrl, wechatOrderNo }
  })

  // Mock: auto-complete payment after 3s
  simulatePaymentCallback(order.id, async (orderId) => {
    await handlePaymentSuccess(orderId)
  })

  res.json({ code: 0, data: { orderId: order.id, qrUrl, amount: pkg.price, packageName: pkg.name } })
})

// GET /api/pay/order/:orderId — 轮询订单状态（老板端）
router.get('/order/:orderId', async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.orderId },
    include: { package: true }
  })
  if (!order) { res.status(404).json({ code: 404, message: '订单不存在' }); return }
  res.json({ code: 0, data: order })
})

// POST /api/pay/wechat/notify — 微信支付回调（真实接入时使用）
router.post('/wechat/notify', async (req: Request, res: Response) => {
  // TODO: verify wechat signature, parse XML
  const orderId = req.body.out_trade_no
  if (orderId) await handlePaymentSuccess(orderId)
  res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>')
})

// GET /api/pay/orders — 收款人查看自己的订单（需登录）
router.get('/orders', authMiddleware, async (req: AuthRequest, res: Response) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.userId! },
    include: { package: { select: { name: true, hours: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50
  })
  res.json({ code: 0, data: orders })
})

async function handlePaymentSuccess(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order || order.status === 'paid') return

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: 'paid', paidAt: new Date() }
    }),
    prisma.user.update({
      where: { id: order.userId },
      data: { balance: { increment: order.netAmount } }
    })
  ])

  // 实时推送到收款人
  notifyUser(order.userId, {
    type: 'payment_received',
    orderId,
    amount: order.amount,
    netAmount: order.netAmount,
    payerName: order.payerName,
    message: `🤑 ${order.payerName} 付款啦！¥${order.amount} 已到账 ¥${order.netAmount}，打工人今晚加班有意义了！`
  })
}

export default router
