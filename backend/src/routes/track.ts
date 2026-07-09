import { Router, Request, Response } from 'express'
import { prisma } from '../utils/prisma'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

// POST /api/track — 前端埋点（无需登录）
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { event, page, extra, userId } = req.body
  if (!event) { res.status(400).json({ code: 400, message: 'event required' }); return }
  await prisma.event.create({
    data: { event, page: page || null, extra: extra ? JSON.stringify(extra) : null, userId: userId || null }
  })
  res.json({ code: 0 })
}))

export default router
