import { Router, Response } from 'express'
import sharp from 'sharp'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { prisma } from '../utils/prisma'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

async function compressBase64(dataUrl: string, maxDim = 600, quality = 60): Promise<string> {
  try {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) return dataUrl
    const buf = Buffer.from(match[2], 'base64')
    const compressed = await sharp(buf)
      .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer()
    return 'data:image/jpeg;base64,' + compressed.toString('base64')
  } catch {
    return dataUrl
  }
}

// PUT /api/user/profile — 更新昵称/头像/介绍（只更新传入的字段）
router.put('/profile', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  let { nickname, avatar, bio } = req.body
  if (avatar && avatar.startsWith('data:')) avatar = await compressBase64(avatar, 400, 70)
  const data = Object.fromEntries(
    Object.entries({ nickname, avatar, bio }).filter(([, v]) => v !== undefined && v !== null)
  )
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data,
    select: { id: true, nickname: true, avatar: true, bio: true }
  })
  res.json({ code: 0, data: user })
}))

// PUT /api/user/payment — 保存收款方式（只更新传入的字段）
router.put('/payment', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  let { wechatQrUrl, alipayQrUrl, defaultPaymentMethod } = req.body
  if (wechatQrUrl?.startsWith('data:')) wechatQrUrl = await compressBase64(wechatQrUrl, 600, 60)
  if (alipayQrUrl?.startsWith('data:')) alipayQrUrl = await compressBase64(alipayQrUrl, 600, 60)
  const data = Object.fromEntries(
    Object.entries({ wechatQrUrl, alipayQrUrl, defaultPaymentMethod }).filter(([, v]) => v !== undefined)
  )
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data,
    select: { id: true, wechatQrUrl: true, alipayQrUrl: true, defaultPaymentMethod: true }
  })
  res.json({ code: 0, data: user })
}))

// GET /api/user/payment — 获取自己的收款方式
router.get('/payment', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { wechatQrUrl: true, alipayQrUrl: true, defaultPaymentMethod: true }
  })
  res.json({ code: 0, data: user })
}))

// GET /api/user/subscribe — 会员状态
router.get('/subscribe', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { subscriptionExpiry: true }
  })
  const expiry = user?.subscriptionExpiry
  const isVip = expiry ? new Date(expiry) > new Date() : false
  res.json({ code: 0, data: { isVip, expiry } })
}))

export default router
