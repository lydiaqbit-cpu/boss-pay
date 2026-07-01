import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'

export interface AuthRequest extends Request {
  userId?: string
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ code: 401, message: '未登录' })
    return
  }
  try {
    const token = header.slice(7)
    const { userId } = verifyToken(token)
    req.userId = userId
    next()
  } catch {
    res.status(401).json({ code: 401, message: 'token 已过期，请重新登录' })
  }
}
