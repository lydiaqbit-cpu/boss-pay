<template>
  <view class="page">
    <view class="profile-header">
      <image v-if="user.avatar" :src="user.avatar" class="avatar" mode="aspectFill"/>
      <view v-else class="avatar-placeholder"><text>{{ user.nickname?.[0] }}</text></view>
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
        <text class="vip-title">{{ isVip ? '会员有效期至 ' + fmtDate(vipExpiry) : '开通会员，解锁全部功能' }}</text>
        <text class="vip-sub">{{ isVip ? '感谢支持牛马事业 🐂' : '无限套餐 · 优先客服 · 更多特权' }}</text>
      </view>
      <text class="vip-arrow">›</text>
    </view>

    <view class="menu-section">
      <view class="menu-item" @click="toPayment">
        <text class="menu-icon">💳</text>
        <text class="menu-label">收款方式设置</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="toPackages">
        <text class="menu-icon">📦</text>
        <text class="menu-label">加班套餐管理</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="copyMyLink">
        <text class="menu-icon">🔗</text>
        <text class="menu-label">复制我的收款链接</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <view class="menu-section">
      <view class="menu-item danger" @click="handleLogout">
        <text class="menu-icon">🚪</text>
        <text class="menu-label">退出登录</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <text class="version">牛马加班吧 v1.0 · 打工人互助平台</text>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get } from '../../utils/request'
import { useUserStore } from '../../store/user'

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

function toPayment() { uni.navigateTo({ url: '/pages/profile/payment' }) }
function toPackages() { uni.navigateTo({ url: '/pages/packages/index' }) }
function toSubscribe() { uni.navigateTo({ url: '/pages/subscribe/index' }) }

function copyMyLink() {
  // #ifdef H5
  const link = `${location.origin}/#/pages/pay/cashier?userId=${user.value.id}`
  uni.setClipboardData({ data: link, success: () => uni.showToast({ title: '收款链接已复制', icon: 'success' }) })
  // #endif
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
page { background: #F5F7FA; }
.page { min-height: 100vh; padding-bottom: 120rpx; }

.profile-header {
  background: linear-gradient(150deg, #43B89C, #2A9B82);
  padding: 80rpx 36rpx 48rpx;
  display: flex; align-items: center; gap: 24rpx;
  border-radius: 0 0 40rpx 40rpx;
}
.avatar { width: 110rpx; height: 110rpx; border-radius: 55rpx; border: 3rpx solid rgba(255,255,255,0.5); }
.avatar-placeholder {
  width: 110rpx; height: 110rpx; border-radius: 55rpx;
  background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  text { font-size: 48rpx; color: #fff; font-weight: 700; }
}
.user-info { flex: 1; }
.name-row { display: flex; align-items: center; gap: 12rpx; margin-bottom: 8rpx; }
.nickname { font-size: 34rpx; font-weight: 700; color: #fff; }
.bio { font-size: 24rpx; color: rgba(255,255,255,0.75); display: block; }
.vip-badge {
  background: #FFE066; color: #92400E;
  font-size: 20rpx; font-weight: 800; padding: 4rpx 14rpx; border-radius: 20rpx;
}

.vip-card {
  margin: 24rpx 24rpx 0;
  background: #fff; border-radius: 20rpx;
  border-left: 6rpx solid #FFB020;
  padding: 28rpx 24rpx;
  display: flex; align-items: center; gap: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}
.vip-icon { font-size: 40rpx; flex-shrink: 0; }
.vip-left { flex: 1; }
.vip-title { font-size: 28rpx; font-weight: 700; color: #1A202C; display: block; }
.vip-sub { font-size: 22rpx; color: #A0AEC0; margin-top: 6rpx; display: block; }
.vip-arrow { font-size: 40rpx; color: #CBD5E0; }

.menu-section {
  background: #fff; margin: 20rpx 24rpx 0;
  border-radius: 20rpx; overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}
.menu-item {
  display: flex; align-items: center; gap: 18rpx;
  padding: 30rpx 24rpx; border-bottom: 1rpx solid #F0F4F8;
}
.menu-item:last-child { border-bottom: none; }
.menu-item.danger .menu-label { color: #E53E3E; }
.menu-icon { font-size: 36rpx; flex-shrink: 0; }
.menu-label { flex: 1; font-size: 28rpx; color: #2D3748; }
.menu-arrow { font-size: 36rpx; color: #CBD5E0; }

.version { display: block; text-align: center; font-size: 22rpx; color: #CBD5E0; padding: 40rpx 0; }
</style>
