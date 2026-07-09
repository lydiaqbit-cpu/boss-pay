import { useUserStore } from '../store/user'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

export function track(event: string, extra?: Record<string, any>) {
  const userStore = useUserStore()
  const page = getCurrentPages?.()?.slice(-1)?.[0]?.route || ''
  const payload = {
    event,
    page,
    userId: userStore.userInfo?.id || null,
    extra: extra || null
  }
  // fire-and-forget，不阻塞业务
  uni.request({ url: `${BASE}/track`, method: 'POST', data: payload, header: { 'Content-Type': 'application/json' } })
}
