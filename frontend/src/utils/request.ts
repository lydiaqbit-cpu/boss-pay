const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

function getToken() {
  return uni.getStorageSync('token') || ''
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: object
  auth?: boolean
}

export function request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', data, auth = true } = options
  const header: Record<string, string> = { 'Content-Type': 'application/json' }
  if (auth) header['Authorization'] = `Bearer ${getToken()}`

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header,
      success: (res: any) => {
        const body = res.data as any
        if (body.code === 0) {
          resolve(body.data as T)
        } else if (body.code === 401) {
          uni.removeStorageSync('token')
          uni.reLaunch({ url: '/pages/auth/login' })
          reject(new Error(body.message))
        } else {
          uni.showToast({ title: body.message || '请求失败', icon: 'none' })
          reject(new Error(body.message))
        }
      },
      fail: () => {
        uni.showToast({ title: '网络异常，请检查连接', icon: 'none' })
        reject(new Error('network error'))
      }
    })
  })
}

export const get = <T>(url: string, auth = true) => request<T>(url, { method: 'GET', auth })
export const post = <T>(url: string, data?: object, auth = true) => request<T>(url, { method: 'POST', data, auth })
export const put = <T>(url: string, data?: object) => request<T>(url, { method: 'PUT', data })
export const del = <T>(url: string) => request<T>(url, { method: 'DELETE' })
