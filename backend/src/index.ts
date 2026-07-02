import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import http from 'http'
import { setupWS } from './ws/notifier'
import { authMiddleware } from './middleware/auth'
import authRouter from './routes/auth'
import packagesRouter from './routes/packages'
import payRouter from './routes/pay'
import userRouter from './routes/user'

const app = express()
const server = http.createServer(app)

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}))
app.use(express.json({ limit: '5mb' }))

// Auth routes (me is protected inside the router)
app.use('/api/auth', authRouter)

// Package routes — all protected
app.use('/api/packages', authMiddleware, packagesRouter)

// Pay routes — mixed (create/page are public, orders is protected)
app.use('/api/pay', payRouter)

// User routes — all protected
app.use('/api/user', userRouter)

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }))

// WebSocket
setupWS(server)

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`🚀 老板请付费后端启动: http://localhost:${PORT}`)
  console.log(`📡 WebSocket: ws://localhost:${PORT}/ws?userId=<id>`)
})
