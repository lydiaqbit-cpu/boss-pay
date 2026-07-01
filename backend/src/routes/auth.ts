import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { signToken } from '../utils/jwt'
import { prisma } from '../utils/prisma'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { phone, password, nickname } = req.body
  if (!phone || !password || !nickname) {
    res.status(400).json({ code: 400, message: '手机号、密码、昵称不能为空' })
    return
  }
  const exists = await prisma.user.findUnique({ where: { phone } })
  if (exists) {
    res.status(400).json({ code: 400, message: '该手机号已注册' })
    return
  }
  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { phone, password: hashed, nickname }
  })
  const token = signToken(user.id)
  res.json({ code: 0, data: { token, user: { id: user.id, nickname: user.nickname, phone: user.phone, balance: user.balance } } })
})

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { phone, password } = req.body
  const user = await prisma.user.findUnique({ where: { phone } })
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ code: 401, message: '手机号或密码错误' })
    return
  }
  const token = signToken(user.id)
  res.json({ code: 0, data: { token, user: { id: user.id, nickname: user.nickname, phone: user.phone, balance: user.balance, avatar: user.avatar, bio: user.bio } } })
})

// GET /api/auth/me  (protected)
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, nickname: true, phone: true, balance: true, avatar: true, bio: true }
  })
  res.json({ code: 0, data: user })
})

export default router
