<template>
  <view class="page">
    <!-- 用户信息头部 -->
    <view class="profile-header">
      <image v-if="user.avatar" :src="user.avatar" class="avatar" mode="aspectFill"/>
      <view v-else class="avatar-placeholder"><text>{{ user.nickname?.[0] }}</text></view>
      <view class="user-info">
        <text class="nickname">{{ user.nickname }}</text>
        <text class="bio">{{ user.bio || '点击编辑介绍' }}</text>
      </view>
      <view v-if="isVip" class="vip-badge">VIP</view>
    </view>

    <!-- 会员卡 -->
    <view class="vip-card" @click="toSubscribe">
      <view class="vip-left">
        <text class="vip-title">{{ isVip ? '✨ 会员有效期至' : '🔓 开通会员' }}</text>
        <text class="vip-sub">{{ isVip ? fmtDate(vipExpiry) : '无限套餐 · 无限确认次数' }}</text>
      </view>
      <text class="vip-arrow">›</text>
    </view>

    <!-- 功能菜单 -->
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

    <text class="version">牛马加班吧 v1.0</text>
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
    title: '退出登录',
    content: '确认退出？',
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
page { background: #0d0d1a; }
.page { min-height: 100vh; padding-bottom: 120rpx; }

.profile-header {
  background: linear-gradient(135deg, #1a0d00, #2d1a00);
  padding: 80rpx 40rpx 48rpx;
  display: flex; align-items: center; gap: 28rpx;
}
.avatar { width: 120rpx; height: 120rpx; border-radius: 60rpx; border: 3rpx solid rgba(255,216,92,0.4); }
.avatar-placeholder {
  width: 120rpx; height: 120rpx; border-radius: 60rpx;
  background: rgba(255,216,92,0.15); display: flex; align-items: center; justify-content: center;
}
.avatar-placeholder text { font-size: 52rpx; color: #FFD85C; font-weight: 700; }
.user-info { flex: 1; }
.nickname { font-size: 36rpx; font-weight: 700; color: #fff; display: block; }
.bio { font-size: 24rpx; color: rgba(255,255,255,0.4); margin-top: 8rpx; display: block; }
.vip-badge {
  background: linear-gradient(135deg, #FFD85C, #C9883D);
  color: #1a0d00; font-size: 20rpx; font-weight: 800;
  padding: 6rpx 16rpx; border-radius: 20rpx;
}

.vip-card {
  margin: 24rpx 28rpx;
  background: linear-gradient(135deg, #2d1a00, #1a0d00);
  border: 1rpx solid rgba(255,216,92,0.3);
  border-radius: 20rpx; padding: 32rpx 28rpx;
  display: flex; align-items: center; justify-content: space-between;
}
.vip-left { flex: 1; }
.vip-title { font-size: 28rpx; font-weight: 700; color: #FFD85C; display: block; }
.vip-sub { font-size: 24rpx; color: rgba(255,216,92,0.6); margin-top: 8rpx; display: block; }
.vip-arrow { font-size: 40rpx; color: rgba(255,216,92,0.5); }

.menu-section {
  background: #161630; margin: 0 28rpx 20rpx;
  border-radius: 20rpx; border: 1rpx solid rgba(255,255,255,0.07);
  overflow: hidden;
}
.menu-item {
  display: flex; align-items: center; gap: 20rpx;
  padding: 32rpx 28rpx; border-bottom: 1rpx solid rgba(255,255,255,0.05);
}
.menu-item:last-child { border-bottom: none; }
.menu-item.danger .menu-label { color: #FF4757; }
.menu-icon { font-size: 36rpx; flex-shrink: 0; }
.menu-label { flex: 1; font-size: 28rpx; color: #fff; }
.menu-arrow { font-size: 36rpx; color: rgba(255,255,255,0.2); }

.version { display: block; text-align: center; font-size: 22rpx; color: rgba(255,255,255,0.15); padding: 40rpx 0; }
</style>
