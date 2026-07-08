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
  res.json({ code: 0, data: { token, user: { id: user.id, nickname: user.nickname, phone: user.phone } } })
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
  res.json({ code: 0, data: { token, user: { id: user.id, nickname: user.nickname, phone: user.phone, avatar: user.avatar, bio: user.bio } } })
})

// POST /api/auth/wechat  — 真实微信小程序登录，前端传 code
router.post('/wechat', async (req: Request, res: Response) => {
  const { code, nickname, avatar } = req.body
  if (!code) {
    res.status(400).json({ code: 400, message: 'code 不能为空' })
    return
  }

  const appid = process.env.WECHAT_APPID!
  const secret = process.env.WECHAT_SECRET!
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`

  const wxRes = await fetch(url)
  const wxData = await wxRes.json() as any
  if (wxData.errcode) {
    res.status(400).json({ code: 400, message: `微信登录失败: ${wxData.errmsg}` })
    return
  }

  const openid = wxData.openid as string
  const phone = `wx_${openid}`

  let user = await prisma.user.findUnique({ where: { phone } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        phone,
        password: '',
        nickname: nickname || '微信用户',
        bio: '用微信登录的打工人',
        avatar: avatar || ''
      }
    })
  } else if (nickname && !user.nickname) {
    user = await prisma.user.update({ where: { phone }, data: { nickname, avatar } })
  }

  const token = signToken(user.id)
  res.json({ code: 0, data: { token, user: { id: user.id, nickname: user.nickname, phone: user.phone, avatar: user.avatar, bio: user.bio } } })
})

// POST /api/auth/wechat-mock  — 仅开发环境
router.post('/wechat-mock', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') { res.status(404).json({ code: 404, message: 'Not found' }); return }
  const mockOpenId = (req.body.openId as string) || 'wx_mock_default'
  const mockPhone = `wx_${mockOpenId}`

  let user = await prisma.user.findUnique({ where: { phone: mockPhone } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        phone: mockPhone,
        password: '',
        nickname: req.body.nickname || '微信用户',
        bio: '用微信登录的打工人',
        avatar: req.body.avatar || ''
      }
    })
  }
  const token = signToken(user.id)
  res.json({ code: 0, data: { token, user: { id: user.id, nickname: user.nickname, phone: user.phone, avatar: user.avatar, bio: user.bio } } })
})

// GET /api/auth/me  (protected)
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, nickname: true, phone: true, avatar: true, bio: true }
  })
  if (!user) { res.status(404).json({ code: 404, message: '用户不存在' }); return }
  res.json({ code: 0, data: user })
})

export default router
