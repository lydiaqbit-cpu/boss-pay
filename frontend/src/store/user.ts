import { defineStore } from 'pinia'
import { ref } from 'vue'
import { get } from '../utils/request'

interface UserInfo {
  id: string
  nickname: string
  phone: string
  balance: number
  avatar?: string
  bio?: string
}

export const useUserStore = defineStore('user', () => {
  const token = ref(uni.getStorageSync('token') || '')
  const userInfo = ref<UserInfo | null>(null)

  function setToken(t: string) {
    token.value = t
    uni.setStorageSync('token', t)
  }

  function setUser(u: UserInfo) {
    userInfo.value = u
  }

  async function fetchMe() {
    const data = await get<UserInfo>('/auth/me')
    userInfo.value = data
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    uni.removeStorageSync('token')
    uni.reLaunch({ url: '/pages/auth/login' })
  }

  return { token, userInfo, setToken, setUser, fetchMe, logout }
}, {
  persist: true
})
