import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

// 管理端防暴力破解
import rateLimit from 'express-rate-limit'
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { code: 429, message: '请求太频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
})

// 管理员鉴权中间件
function adminAuth(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers['x-admin-secret']
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    res.status(403).json({ code: 403, message: '无权访问' }); return
  }
  next()
}

router.use(adminLimiter, adminAuth)

// 提取公共时间范围计算
function getPeriodRange(period: string): { since: Date; groupFormat: string } {
  const now = new Date()
  if (period === 'month') {
    return { since: new Date(now.getFullYear(), now.getMonth() - 11, 1), groupFormat: '%Y-%m' }
  } else if (period === 'week') {
    return { since: new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000), groupFormat: '%Y-%W' }
  } else {
    return { since: new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000), groupFormat: '%Y-%m-%d' }
  }
}

// GET /api/admin/overview — 总览数字
router.get('/overview', asyncHandler(async (_req: Request, res: Response) => {
  const [totalUsers, totalOrders, totalEvents] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.event.count(),
  ])
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayUsers = await prisma.user.count({ where: { createdAt: { gte: todayStart } } })
  const confirmedOrders = await prisma.order.aggregate({
    where: { status: 'confirmed' },
    _sum: { amount: true }
  })
  res.json({ code: 0, data: { totalUsers, todayUsers, totalOrders, totalEvents, totalRevenue: confirmedOrders._sum.amount || 0 } })
}))

// GET /api/admin/registrations?period=day|week|month — 注册趋势
router.get('/registrations', asyncHandler(async (req: Request, res: Response) => {
  const { since, groupFormat } = getPeriodRange((req.query.period as string) || 'day')
  const rows = await prisma.$queryRawUnsafe<{ label: string; count: bigint }[]>(
    `SELECT strftime('${groupFormat}', createdAt) as label, COUNT(*) as count
     FROM User WHERE createdAt >= ? GROUP BY label ORDER BY label`,
    since.toISOString()
  )
  res.json({ code: 0, data: rows.map(r => ({ label: r.label, count: Number(r.count) })) })
}))

// GET /api/admin/events?period=day|week|month — 功能点击统计
router.get('/events', asyncHandler(async (req: Request, res: Response) => {
  const { since, groupFormat } = getPeriodRange((req.query.period as string) || 'day')
  const [byType, trend] = await Promise.all([
    prisma.$queryRawUnsafe<{ event: string; count: bigint }[]>(
      `SELECT event, COUNT(*) as count FROM Event WHERE createdAt >= ? GROUP BY event ORDER BY count DESC`,
      since.toISOString()
    ),
    prisma.$queryRawUnsafe<{ label: string; count: bigint }[]>(
      `SELECT strftime('${groupFormat}', createdAt) as label, COUNT(*) as count
       FROM Event WHERE createdAt >= ? GROUP BY label ORDER BY label`,
      since.toISOString()
    )
  ])
  res.json({
    code: 0,
    data: {
      byType: byType.map(r => ({ event: r.event, count: Number(r.count) })),
      trend: trend.map(r => ({ label: r.label, count: Number(r.count) }))
    }
  })
}))

// GET /api/admin/users?page=1&size=20 — 用户列表
router.get('/users', asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const size = Math.min(100, Number(req.query.size) || 20)
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * size,
      take: size,
      select: { id: true, nickname: true, phone: true, avatar: true, createdAt: true,
        _count: { select: { orders: true, packages: true } } }
    }),
    prisma.user.count()
  ])
  res.json({ code: 0, data: { users, total, page, size } })
}))

export default router
