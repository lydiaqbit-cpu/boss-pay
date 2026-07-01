import { Router, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../utils/prisma'

const router = Router()

// GET /api/packages — 当前用户的套餐列表
router.get('/', async (req: AuthRequest, res: Response) => {
  const packages = await prisma.package.findMany({
    where: { userId: req.userId!, isActive: true },
    orderBy: { sortOrder: 'asc' }
  })
  res.json({ code: 0, data: packages })
})

// POST /api/packages — 新建套餐
router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, description, hours, price, sortOrder } = req.body
  if (!name || !hours || !price) {
    res.status(400).json({ code: 400, message: '套餐名称、时长、价格不能为空' })
    return
  }
  const pkg = await prisma.package.create({
    data: { userId: req.userId!, name, description, hours: Number(hours), price: Number(price), sortOrder: sortOrder ?? 0 }
  })
  res.json({ code: 0, data: pkg })
})

// PUT /api/packages/:id — 更新套餐
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const pkg = await prisma.package.findUnique({ where: { id: req.params.id } })
  if (!pkg || pkg.userId !== req.userId) {
    res.status(403).json({ code: 403, message: '无权操作' })
    return
  }
  const updated = await prisma.package.update({
    where: { id: req.params.id },
    data: req.body
  })
  res.json({ code: 0, data: updated })
})

// DELETE /api/packages/:id — 软删除
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const pkg = await prisma.package.findUnique({ where: { id: req.params.id } })
  if (!pkg || pkg.userId !== req.userId) {
    res.status(403).json({ code: 403, message: '无权操作' })
    return
  }
  await prisma.package.update({ where: { id: req.params.id }, data: { isActive: false } })
  res.json({ code: 0, message: '已删除' })
})

export default router
