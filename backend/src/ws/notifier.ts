import { WebSocketServer, WebSocket } from 'ws'
import { Server } from 'http'

// userId -> WebSocket connection
const clients = new Map<string, WebSocket>()

export function setupWS(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', 'http://localhost')
    const userId = url.searchParams.get('userId')
    if (!userId) { ws.close(); return }

    clients.set(userId, ws)

    ws.on('close', () => clients.delete(userId))
    ws.on('error', () => clients.delete(userId))

    ws.send(JSON.stringify({ type: 'connected', message: '实时推送已连接' }))
  })
}

export function notifyUser(userId: string, payload: object) {
  const ws = clients.get(userId)
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload))
  }
}
