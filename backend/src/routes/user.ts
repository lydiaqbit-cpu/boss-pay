import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { prisma } from '../utils/prisma'

const router = Router()

// PUT /api/user/profile — 更新昵称/头像/介绍（只更新传入的字段）
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { nickname, avatar, bio } = req.body
  const data = Object.fromEntries(
    Object.entries({ nickname, avatar, bio }).filter(([, v]) => v !== undefined)
  )
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data,
    select: { id: true, nickname: true, avatar: true, bio: true }
  })
  res.json({ code: 0, data: user })
})

// PUT /api/user/payment — 保存收款方式（只更新传入的字段）
router.put('/payment', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { wechatQrUrl, alipayQrUrl, defaultPaymentMethod } = req.body
  const data = Object.fromEntries(
    Object.entries({ wechatQrUrl, alipayQrUrl, defaultPaymentMethod }).filter(([, v]) => v !== undefined)
  )
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data,
    select: { id: true, wechatQrUrl: true, alipayQrUrl: true, defaultPaymentMethod: true }
  })
  res.json({ code: 0, data: user })
})

// GET /api/user/payment — 获取自己的收款方式
router.get('/payment', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { wechatQrUrl: true, alipayQrUrl: true, defaultPaymentMethod: true }
  })
  res.json({ code: 0, data: user })
})

// GET /api/user/subscribe — 会员状态
router.get('/subscribe', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { subscriptionExpiry: true }
  })
  const expiry = user?.subscriptionExpiry
  const isVip = expiry ? new Date(expiry) > new Date() : false
  res.json({ code: 0, data: { isVip, expiry } })
})

export default router
