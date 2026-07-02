import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { prisma } from '../utils/prisma'

const router = Router()

// PUT /api/user/profile — 更新昵称/头像/介绍
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { nickname, avatar, bio } = req.body
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: { nickname, avatar, bio },
    select: { id: true, nickname: true, avatar: true, bio: true }
  })
  res.json({ code: 0, data: user })
})

// PUT /api/user/payment — 保存收款方式
router.put('/payment', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { wechatQrUrl, alipayAccount, alipayName, bankCard, bankName, bankHolder } = req.body
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: { wechatQrUrl, alipayAccount, alipayName, bankCard, bankName, bankHolder },
    select: { id: true, wechatQrUrl: true, alipayAccount: true, alipayName: true, bankCard: true, bankName: true, bankHolder: true }
  })
  res.json({ code: 0, data: user })
})

// GET /api/user/payment — 获取自己的收款方式
router.get('/payment', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { wechatQrUrl: true, alipayAccount: true, alipayName: true, bankCard: true, bankName: true, bankHolder: true }
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
