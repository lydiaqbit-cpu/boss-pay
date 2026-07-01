import { v4 as uuidv4 } from 'uuid'

// Simulates WeChat Pay QR code creation
export function createMockOrder(params: {
  orderId: string
  amount: number
  description: string
}): { qrUrl: string; wechatOrderNo: string } {
  // In prod: call wx.unifiedorder API, get code_url, convert to QR image
  const wechatOrderNo = `MOCK${Date.now()}${uuidv4().slice(0, 8).toUpperCase()}`
  // Use a stable QR placeholder that encodes the order info
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=bossPay_${params.orderId}`
  return { qrUrl, wechatOrderNo }
}

// Simulates async payment callback (called after 3s delay in mock mode)
export async function simulatePaymentCallback(
  orderId: string,
  onSuccess: (orderId: string) => Promise<void>
) {
  await new Promise(r => setTimeout(r, 3000))
  await onSuccess(orderId)
}
