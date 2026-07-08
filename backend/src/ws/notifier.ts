import { WebSocketServer, WebSocket } from 'ws'
import { Server } from 'http'
import { verifyToken } from '../utils/jwt'

const clients = new Map<string, Set<WebSocket>>()

export function setupWS(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', 'http://localhost')
    const token = url.searchParams.get('token')
    let userId: string
    try {
      userId = verifyToken(token || '').userId
    } catch {
      ws.close(1008, 'Unauthorized'); return
    }

    if (!clients.has(userId)) clients.set(userId, new Set())
    clients.get(userId)!.add(ws)

    const cleanup = () => {
      clients.get(userId)?.delete(ws)
      if (clients.get(userId)?.size === 0) clients.delete(userId)
    }
    ws.on('close', cleanup)
    ws.on('error', cleanup)

    ws.on('close', () => clients.delete(userId))
    ws.on('error', () => clients.delete(userId))

    ws.send(JSON.stringify({ type: 'connected', message: '实时推送已连接' }))
  })
}

export function notifyUser(userId: string, payload: object) {
  clients.get(userId)?.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload))
  })
}
