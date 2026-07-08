import jwt from 'jsonwebtoken'

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET env var is required')
const SECRET = process.env.JWT_SECRET as string

export function signToken(userId: string) {
  return jwt.sign({ userId }, SECRET, { expiresIn: '30d' })
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, SECRET) as unknown as { userId: string }
}
