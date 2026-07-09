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
          <view v-if="isVip" class="vip-badge">VIP</view>
        </view>
        <text class="bio">{{ user.bio || '加班人，收款中' }}</text>
      </view>
    </view>

    <view class="vip-card" @click="toSubscribe">
      <view class="vip-icon">✨</view>
      <view class="vip-left">
        <text class="vip-title">{{ isVip ? '令牌有效，身价已定 · ' + fmtDate(vipExpiry) + ' 到期' : '纳贡升级，解锁全部功能' }}</text>
        <text class="vip-sub">{{ isVip ? '尊贵牛马，已享免徭役特权 🐂' : '无限套餐 · 优先待诏 · 更多特权' }}</text>
      </view>
      <text class="vip-arrow">›</text>
    </view>

    <view class="menu-section">
      <view class="menu-item" @click="toPayment">
        <text class="menu-icon">🪙</text>
        <text class="menu-label">银两收取方式</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="toPackages">
        <text class="menu-icon">📜</text>
        <text class="menu-label">劳役价目管理</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="copyMyLink">
        <text class="menu-icon">📮</text>
        <text class="menu-label">复制讨薪令牌</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <view class="menu-section">
      <view class="menu-item danger" @click="handleLogout">
        <text class="menu-icon">🏃</text>
        <text class="menu-label">溜了溜了</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <text class="version">牛马加班吧 v1.0 · 打工人互助平台</text>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get, put } from '../../utils/request'
import { useUserStore } from '../../store/user'
import { track } from '../../utils/track'

const userStore = useUserStore()
const user = ref<any>({})
const isVip = ref(false)
const vipExpiry = ref('')

onMounted(async () => {
  user.value = userStore.userInfo || {}
  try {
    const sub = await get<any>('/user/subscribe')
    isVip.value = sub.isVip
    vipExpiry.value = sub.expiry
  } catch {}
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
function toSubscribe() { uni.navigateTo({ url: '/pages/subscribe/index' }) }

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

function fmtDate(t: string) {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}
</script>

<style lang="scss">
page { background: #F2EBE0; }
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
  background: #C0392B; display: flex; align-items: center; justify-content: center;
  border: 2rpx solid #1E1A14;
  text { font-size: 20rpx; }
}
.user-info { flex: 1; }
.name-row { display: flex; align-items: center; gap: 12rpx; margin-bottom: 8rpx; }
.nickname { font-size: 34rpx; font-weight: 700; color: #F2EBE0; }
.bio { font-size: 24rpx; color: rgba(196,168,130,0.75); display: block; }
.vip-badge {
  background: #C4A882; color: #1E1A14;
  font-size: 20rpx; font-weight: 800; padding: 4rpx 14rpx; border-radius: 4rpx;
}

.vip-card {
  margin: 24rpx 24rpx 0;
  background: #fff; border-radius: 8rpx;
  border-left: 5rpx solid #C0392B;
  padding: 28rpx 24rpx;
  display: flex; align-items: center; gap: 16rpx;
  box-shadow: 0 2rpx 10rpx rgba(30,26,20,0.08);
  border-top: 1rpx solid #D4C4A8; border-right: 1rpx solid #D4C4A8; border-bottom: 1rpx solid #D4C4A8;
}
.vip-icon { font-size: 40rpx; flex-shrink: 0; }
.vip-left { flex: 1; }
.vip-title { font-size: 28rpx; font-weight: 700; color: #1E1A14; display: block; }
.vip-sub { font-size: 22rpx; color: #8B7355; margin-top: 6rpx; display: block; }
.vip-arrow { font-size: 40rpx; color: #D4C4A8; }

.menu-section {
  background: #fff; margin: 20rpx 24rpx 0;
  border-radius: 8rpx; overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(30,26,20,0.07);
  border: 1rpx solid #D4C4A8;
}
.menu-item {
  display: flex; align-items: center; gap: 18rpx;
  padding: 30rpx 24rpx; border-bottom: 1rpx solid #EDE0CC;
}
.menu-item:last-child { border-bottom: none; }
.menu-item.danger .menu-label { color: #C0392B; }
.menu-icon { font-size: 36rpx; flex-shrink: 0; }
.menu-label { flex: 1; font-size: 28rpx; color: #1E1A14; }
.menu-arrow { font-size: 36rpx; color: #D4C4A8; }

.version { display: block; text-align: center; font-size: 22rpx; color: #C4A882; padding: 40rpx 0; letter-spacing: 1rpx; }
</style>
