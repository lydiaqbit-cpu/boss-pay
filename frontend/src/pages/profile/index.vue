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
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="11" stroke="#8B6040" stroke-width="1.8"/>
            <rect x="13" y="13" width="6" height="6" rx="0.5" stroke="#A8402E" stroke-width="1.6"/>
            <line x1="16" y1="4" x2="16" y2="7" stroke="#8B6040" stroke-width="1.4" stroke-linecap="round"/>
            <line x1="16" y1="25" x2="16" y2="28" stroke="#8B6040" stroke-width="1.4" stroke-linecap="round"/>
            <line x1="4" y1="16" x2="7" y2="16" stroke="#8B6040" stroke-width="1.4" stroke-linecap="round"/>
            <line x1="25" y1="16" x2="28" y2="16" stroke="#8B6040" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
        </view>
        <text class="menu-label">收款方式</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="toPackages">
        <view class="menu-icon">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="5" width="16" height="2.5" rx="1.2" fill="#8B6040" opacity="0.4"/>
            <rect x="8" y="24.5" width="16" height="2.5" rx="1.2" fill="#8B6040" opacity="0.4"/>
            <line x1="11.5" y1="7.5" x2="11.5" y2="24.5" stroke="#8B6040" stroke-width="2" stroke-linecap="round"/>
            <line x1="16" y1="7.5" x2="16" y2="24.5" stroke="#8B6040" stroke-width="2" stroke-linecap="round"/>
            <line x1="20.5" y1="7.5" x2="20.5" y2="24.5" stroke="#8B6040" stroke-width="2" stroke-linecap="round"/>
            <line x1="8" y1="13.5" x2="24" y2="13.5" stroke="#A8402E" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="8" y1="18.5" x2="24" y2="18.5" stroke="#A8402E" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </view>
        <text class="menu-label">加班套餐管理</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="copyMyLink">
        <view class="menu-icon">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="12" y="3" width="8" height="6" rx="1" stroke="#8B6040" stroke-width="1.8"/>
            <rect x="10" y="9" width="12" height="4" rx="0" stroke="#8B6040" stroke-width="1.5"/>
            <rect x="8" y="13" width="16" height="14" rx="1" stroke="#8B6040" stroke-width="1.8"/>
            <line x1="8" y1="17.5" x2="24" y2="17.5" stroke="#A8402E" stroke-width="1"/>
            <line x1="8" y1="21.5" x2="24" y2="21.5" stroke="#A8402E" stroke-width="1"/>
            <line x1="12.5" y1="13" x2="12.5" y2="27" stroke="#A8402E" stroke-width="1"/>
            <line x1="19.5" y1="13" x2="19.5" y2="27" stroke="#A8402E" stroke-width="1"/>
          </svg>
        </view>
        <text class="menu-label">复制讨薪令牌</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <view class="menu-section">
      <view class="menu-item danger" @click="handleLogout">
        <view class="menu-icon">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="22" cy="6" r="3" stroke="#A8402E" stroke-width="1.8"/>
            <path d="M22 9 L20 17 M20 17 L15 23 M20 17 L25 20 M20 13 L24 11 M20 13 L16 11" stroke="#A8402E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="5" y1="13" x2="9" y2="13" stroke="#8B6040" stroke-width="1.4" stroke-linecap="round"/>
            <line x1="4" y1="17" x2="8" y2="17" stroke="#8B6040" stroke-width="1.4" stroke-linecap="round"/>
            <line x1="5" y1="21" x2="9" y2="21" stroke="#8B6040" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
        </view>
        <text class="menu-label">溜了溜了</text>
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
  padding: 30rpx 24rpx; border-bottom: 1rpx solid #E5D8C4;
}
.menu-item:last-child { border-bottom: none; }
.menu-item.danger .menu-label { color: #D94F3D; }
.menu-icon { width: 56rpx; height: 56rpx; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.menu-label { flex: 1; font-size: 28rpx; color: #1E1A14; }
.menu-arrow { font-size: 36rpx; color: #C8B89A; }

.version { display: block; text-align: center; font-size: 22rpx; color: #C4A882; padding: 40rpx 0; letter-spacing: 1rpx; }
</style>
