<template>
  <view class="page">
    <view class="profile-header">
      <view class="avatar-wrap" @click="uploadAvatar">
        <image v-if="user.avatar" :src="user.avatar" class="avatar" mode="aspectFill"/>
        <view v-else class="avatar-placeholder"><text>{{ user.nickname?.[0] }}</text></view>
        <view class="avatar-edit-badge"><text>📷</text></view>
      </view>
      <view class="user-info">
        <view class="name-row">
          <text class="nickname">{{ user.nickname }}</text>
        </view>
        <text class="bio">{{ user.bio || '加班人，收款中' }}</text>
      </view>
    </view>

    <view class="menu-section">
      <view class="menu-item" @click="toPayment">
        <view class="menu-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- QR code: 3 corner squares + data dots -->
            <rect x="3" y="3" width="9" height="9" rx="1.5" stroke="#8B6040" stroke-width="1.8" fill="none"/>
            <rect x="5.5" y="5.5" width="4" height="4" fill="#8B6040"/>
            <rect x="16" y="3" width="9" height="9" rx="1.5" stroke="#8B6040" stroke-width="1.8" fill="none"/>
            <rect x="18.5" y="5.5" width="4" height="4" fill="#8B6040"/>
            <rect x="3" y="16" width="9" height="9" rx="1.5" stroke="#8B6040" stroke-width="1.8" fill="none"/>
            <rect x="5.5" y="18.5" width="4" height="4" fill="#8B6040"/>
            <rect x="16" y="16" width="4" height="4" fill="#A8402E"/>
            <rect x="21" y="16" width="4" height="4" fill="#8B6040"/>
            <rect x="16" y="21" width="4" height="4" fill="#8B6040"/>
            <rect x="21" y="21" width="4" height="4" fill="#A8402E"/>
          </svg>
        </view>
        <view class="menu-text">
          <text class="menu-label">收款方式</text>
          <text class="menu-sub">微信 / 支付宝收款码</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="toPackages">
        <view class="menu-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Price tag -->
            <path d="M5 4 L19 4 L25 14 L19 24 L5 24 Z" stroke="#8B6040" stroke-width="1.8" fill="none" stroke-linejoin="round"/>
            <circle cx="9" cy="14" r="2" stroke="#8B6040" stroke-width="1.8" fill="none"/>
            <line x1="13" y1="9" x2="22" y2="9" stroke="#A8402E" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="13" y1="14" x2="22" y2="14" stroke="#8B6040" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="13" y1="19" x2="20" y2="19" stroke="#8B6040" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </view>
        <view class="menu-text">
          <text class="menu-label">加班套餐</text>
          <text class="menu-sub">设置加班费价目表</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="copyMyLink">
        <view class="menu-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Chain link / share icon -->
            <path d="M5 14 Q5 8 10 8 L14 8 Q19 8 19 14 Q19 20 14 20 L10 20 Q5 20 5 14 Z" stroke="#8B6040" stroke-width="1.8" fill="none"/>
            <path d="M9 14 Q9 8 14 8 L18 8 Q23 8 23 14 Q23 20 18 20 L14 20 Q9 20 9 14 Z" stroke="#A8402E" stroke-width="1.8" fill="none"/>
          </svg>
        </view>
        <view class="menu-text">
          <text class="menu-label">收款链接</text>
          <text class="menu-sub">复制后发给老板扫码付款</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <view class="menu-section">
      <view class="menu-item danger" @click="handleLogout">
        <view class="menu-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Exit door -->
            <path d="M11 4 L6 4 L6 24 L11 24" stroke="#8B6040" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="14" y1="14" x2="24" y2="14" stroke="#D94F3D" stroke-width="2" stroke-linecap="round"/>
            <path d="M20 10 L24 14 L20 18" stroke="#D94F3D" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="10" cy="14" r="1.5" fill="#8B6040"/>
          </svg>
        </view>
        <view class="menu-text">
          <text class="menu-label danger-label">退出登录</text>
          <text class="menu-sub">下次记得回来要钱</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <text class="version">牛马加班吧 v1.0 · 打工人互助平台</text>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { put } from '../../utils/request'
import { useUserStore } from '../../store/user'
import { track } from '../../utils/track'

const userStore = useUserStore()
const user = ref<any>({})

onMounted(() => {
  user.value = userStore.userInfo || {}
})

function uploadAvatar() {
  uni.chooseImage({
    count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'],
    success: (res) => {
      const path = res.tempFilePaths[0]
      // #ifdef H5
      const img = new Image()
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        const MAX = 400
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        const b64 = canvas.toDataURL('image/jpeg', 0.8)
        await saveAvatar(b64)
      }
      img.src = path
      // #endif
      // #ifdef MP-WEIXIN
      uni.getFileSystemManager().readFile({
        filePath: path, encoding: 'base64',
        success: async (r) => {
          const b64 = 'data:image/jpeg;base64,' + r.data
          await saveAvatar(b64)
        },
        fail: () => uni.showToast({ title: '图片读取失败，请重试', icon: 'none' })
      })
      // #endif
    }
  })
}

async function saveAvatar(avatar: string) {
  try {
    uni.showLoading({ title: '上传中...' })
    await put('/user/profile', { avatar })
    user.value = { ...user.value, avatar }
    userStore.setUser({ ...userStore.userInfo, avatar })
    uni.hideLoading()
    uni.showToast({ title: '头像已更新', icon: 'success' })
  } catch {
    uni.hideLoading()
    uni.showToast({ title: '上传失败，请重试', icon: 'none' })
  }
}

function toPayment() { uni.navigateTo({ url: '/pages/profile/payment' }) }
function toPackages() { uni.navigateTo({ url: '/pages/packages/index' }) }

function copyMyLink() {
  // #ifdef H5
  const link = `${location.origin}/#/pages/pay/cashier?userId=${user.value.id}`
  // #endif
  // #ifdef MP-WEIXIN
  const link = `/pages/pay/cashier?userId=${user.value.id}`
  // #endif
  uni.setClipboardData({ data: link, success: () => uni.showToast({ title: '讨薪令牌已复制', icon: 'success' }) })
  track('copy_my_link')
}

function handleLogout() {
  uni.showModal({
    title: '退出登录', content: '确认退出？',
    success: (res) => {
      if (!res.confirm) return
      userStore.logout()
      uni.reLaunch({ url: '/pages/auth/login' })
    }
  })
}
</script>

<style lang="scss">
page { background: #F7F4F0; }
.page { min-height: 100vh; padding-bottom: 120rpx; }

.profile-header {
  background: linear-gradient(160deg, #1E1A14, #3D3526);
  padding: 80rpx 36rpx 48rpx;
  display: flex; align-items: center; gap: 24rpx;
  border-radius: 0 0 40rpx 40rpx;
}
.avatar-wrap { position: relative; flex-shrink: 0; width: 110rpx; height: 110rpx; }
.avatar { width: 110rpx; height: 110rpx; border-radius: 55rpx; border: 3rpx solid rgba(196,168,130,0.5); }
.avatar-placeholder {
  width: 110rpx; height: 110rpx; border-radius: 55rpx;
  background: rgba(196,168,130,0.2); display: flex; align-items: center; justify-content: center;
  text { font-size: 48rpx; color: #C4A882; font-weight: 700; }
}
.avatar-edit-badge {
  position: absolute; bottom: 0; right: 0;
  width: 36rpx; height: 36rpx; border-radius: 18rpx;
  background: #D94F3D; display: flex; align-items: center; justify-content: center;
  border: 2rpx solid #1E1A14;
  text { font-size: 20rpx; }
}
.user-info { flex: 1; }
.name-row { display: flex; align-items: center; gap: 12rpx; margin-bottom: 8rpx; }
.nickname { font-size: 34rpx; font-weight: 700; color: #F7F4F0; }
.bio { font-size: 24rpx; color: rgba(196,168,130,0.75); display: block; }

.menu-section {
  background: #fff; margin: 20rpx 24rpx 0;
  border-radius: 8rpx; overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(30,26,20,0.07);
  border: 1rpx solid #C8B89A;
}
.menu-item {
  display: flex; align-items: center; gap: 18rpx;
  padding: 26rpx 24rpx; border-bottom: 1rpx solid #E5D8C4;
}
.menu-item:last-child { border-bottom: none; }
.menu-icon { width: 56rpx; height: 56rpx; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.menu-text { flex: 1; display: flex; flex-direction: column; gap: 5rpx; }
.menu-label { font-size: 28rpx; color: #1E1A14; }
.menu-label.danger-label { color: #D94F3D; }
.menu-sub { font-size: 22rpx; color: #8B7355; }
.menu-arrow { font-size: 36rpx; color: #C8B89A; }

.version { display: block; text-align: center; font-size: 22rpx; color: #C4A882; padding: 40rpx 0; letter-spacing: 1rpx; }
</style>
