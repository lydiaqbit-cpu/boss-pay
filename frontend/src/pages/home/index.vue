<template>
  <view class="page">
    <!-- Header 渐变卡片 -->
    <view class="header-card">
      <view class="header-top">
        <view class="app-name-row">
          <image class="header-logo" src="/static/logo.svg" mode="aspectFit"/>
          <text class="app-name">老板请付费</text>
        </view>
        <text class="logout-btn" @click="handleLogout">下班跑路</text>
      </view>

      <view class="user-row">
        <view class="avatar-wrap">
          <text class="avatar-emoji">👩‍💼</text>
        </view>
        <view class="user-text">
          <text class="nickname">{{ userStore.userInfo?.nickname || '打工人' }} 🫡</text>
          <text class="bio">{{ userStore.userInfo?.bio || '人在工位，心在家里' }}</text>
        </view>
      </view>

      <view class="balance-panel">
        <view>
          <text class="balance-label">💰 老板已上交</text>
          <text class="balance-value">¥{{ balance }}</text>
          <text class="balance-sub">（已扣除平台 5% 管理费）</text>
        </view>
        <view class="balance-right">
          <button class="btn-withdraw" size="mini" @click="handleWithdraw">提现犒劳自己</button>
        </view>
      </view>
    </view>

    <!-- 到账通知 -->
    <view v-if="latestNotify" class="notify-banner" @click="latestNotify = null">
      <text class="n-icon">🤑</text>
      <text class="n-text">{{ latestNotify }}</text>
      <text class="n-close">✕</text>
    </view>

    <!-- 我的收款链接 -->
    <view class="section-card">
      <view class="section-header">
        <text class="section-title">🔗 我的收款暗号</text>
      </view>
      <view class="link-row">
        <text class="link-url" selectable>{{ payLink }}</text>
        <view class="copy-btn" @click="copyLink">一键复制</view>
      </view>
      <text class="link-tip">📮 把这条链接甩给老板，他打开就知道该干啥</text>
    </view>

    <!-- 快捷操作 -->
    <view class="action-grid">
      <view class="action-item" @click="toPackages">
        <text class="a-icon">📦</text>
        <text class="a-label">定价套餐</text>
      </view>
      <view class="action-item" @click="toOrders">
        <text class="a-icon">🧾</text>
        <text class="a-label">收款流水</text>
      </view>
      <view class="action-item" @click="sharePayLink">
        <text class="a-icon">📤</text>
        <text class="a-label">催款链接</text>
      </view>
      <view class="action-item" @click="previewCashier">
        <text class="a-icon">👁️</text>
        <text class="a-label">老板视角</text>
      </view>
    </view>

    <!-- 套餐预览 -->
    <view class="section-card">
      <view class="section-header">
        <text class="section-title">⏰ 加班价目表</text>
        <text class="section-more" @click="toPackages">去改价 →</text>
      </view>

      <view v-if="packages.length === 0" class="empty-state">
        <text class="empty-icon">😴</text>
        <text class="empty-text">还没设置加班费，老板偷着乐呢</text>
        <view class="empty-btn" @click="toPackages">+ 马上定价，别让他白嫖</view>
      </view>

      <view v-for="(pkg, i) in packages" :key="pkg.id" class="pkg-row">
        <view class="pkg-left">
          <view class="pkg-index">{{ i + 1 }}</view>
          <view>
            <text class="pkg-name">{{ pkg.name }}</text>
            <text class="pkg-desc">{{ pkg.description }}</text>
          </view>
        </view>
        <text class="pkg-price">¥{{ pkg.price }}</text>
      </view>
    </view>

    <view class="footer-gap" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onShareAppMessage } from '@dcloudio/uni-app'
import { useUserStore } from '../../store/user'
import { get } from '../../utils/request'

const userStore = useUserStore()
const packages = ref<any[]>([])
const latestNotify = ref<string | null>(null)
let ws: UniApp.SocketTask | null = null

const balance = computed(() =>
  (userStore.userInfo?.balance ?? 0).toFixed(2)
)

// #ifdef H5
const payLink = computed(() =>
  `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5173'}/pages/pay/cashier?userId=${userStore.userInfo?.id || ''}`
)
// #endif
// #ifdef MP-WEIXIN
const payLink = computed(() =>
  `/pages/pay/cashier?userId=${userStore.userInfo?.id || ''}`
)
// #endif

onMounted(async () => {
  await userStore.fetchMe()
  await loadPackages()
  connectWS()
})

onUnmounted(() => {
  ws?.close()
})

async function loadPackages() {
  try {
    packages.value = await get<any[]>('/packages')
  } catch {}
}

function connectWS() {
  if (!userStore.userInfo?.id) return
  const wsBase = (import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:3000').replace(/\/$/, '')
  ws = uni.connectSocket({
    url: `${wsBase}/ws?userId=${userStore.userInfo.id}`,
    complete: () => {}
  })
  ws.onMessage((res) => {
    try {
      const msg = JSON.parse(res.data as string)
      if (msg.type === 'payment_received') {
        latestNotify.value = msg.message
        if (userStore.userInfo) {
          userStore.userInfo.balance = (userStore.userInfo.balance || 0) + msg.netAmount
        }
        uni.vibrateShort({})
      }
    } catch {}
  })
}

function toPackages() {
  uni.navigateTo({ url: '/pages/packages/index' })
}

function toOrders() {
  uni.switchTab({ url: '/pages/orders/index' })
}

function copyLink() {
  uni.setClipboardData({
    data: payLink.value,
    success: () => uni.showToast({ title: '链接已复制', icon: 'success' })
  })
}

function sharePayLink() {
  // #ifdef MP-WEIXIN
  uni.showActionSheet({
    itemList: ['分享给老板（微信好友）', '复制小程序路径'],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.showToast({ title: '点右上角菜单→转发给老板', icon: 'none', duration: 2500 })
      } else {
        uni.setClipboardData({ data: payLink.value, success: () => uni.showToast({ title: '路径已复制', icon: 'success' }) })
      }
    }
  })
  // #endif
  // #ifdef H5
  copyLink()
  // #endif
}

function previewCashier() {
  uni.navigateTo({ url: `/pages/pay/cashier?userId=${userStore.userInfo?.id}` })
}

function handleWithdraw() {
  uni.showModal({
    title: '🏧 提现犒劳自己',
    content: `老板已上交 ¥${balance.value}，等微信商户号到位就能秒到账～`,
    showCancel: false,
    confirmText: '好嘞，等着'
  })
}

// 小程序右上角转发
onShareAppMessage(() => ({
  title: `${userStore.userInfo?.nickname || '打工人'} 请老板扫码付加班费 💰`,
  path: `/pages/pay/cashier?userId=${userStore.userInfo?.id || ''}`,
}))

function handleLogout() {
  uni.showModal({
    title: '😴 真的要下班跑路？',
    content: '退出后就看不到老板有没有付钱了哦',
    cancelText: '再等等',
    confirmText: '跑！',
    success: (res) => { if (res.confirm) userStore.logout() }
  })
}
</script>

<style lang="scss">
page { background: #0d0d1a; }
.page { min-height: 100vh; padding-bottom: 40rpx; }

.header-card {
  background: linear-gradient(160deg, #0d0d1a 0%, #1a1035 100%);
  padding: 56rpx 36rpx 36rpx;
  border-bottom: 1rpx solid rgba(255,255,255,0.06);
}
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 36rpx;
  .app-name-row { display: flex; align-items: center; gap: 12rpx; }
  .header-logo { width: 52rpx; height: 52rpx; border-radius: 12rpx; }
  .app-name { font-size: 30rpx; font-weight: 700; color: #FFD85C; }
  .logout-btn { font-size: 24rpx; color: rgba(255,255,255,0.35); }
}
.user-row {
  display: flex;
  align-items: center;
  margin-bottom: 32rpx;
}
.avatar-wrap {
  width: 96rpx;
  height: 96rpx;
  border-radius: 48rpx;
  background: rgba(255,216,92,0.15);
  border: 2rpx solid rgba(255,216,92,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  flex-shrink: 0;
  .avatar-emoji { font-size: 52rpx; }
}
.user-text {
  .nickname { font-size: 36rpx; font-weight: 700; color: #fff; display: block; }
  .bio { font-size: 24rpx; color: rgba(255,255,255,0.45); margin-top: 6rpx; display: block; }
}
.balance-panel {
  background: rgba(255,216,92,0.08);
  border: 1rpx solid rgba(255,216,92,0.2);
  border-radius: 18rpx;
  padding: 28rpx 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .balance-label { font-size: 22rpx; color: rgba(255,255,255,0.45); display: block; margin-bottom: 6rpx; }
  .balance-value { font-size: 52rpx; font-weight: 800; color: #FFD85C; display: block; }
  .balance-sub { font-size: 18rpx; color: rgba(255,255,255,0.3); margin-top: 4rpx; display: block; }
}
.btn-withdraw {
  background: rgba(255,216,92,0.15) !important;
  color: #FFD85C !important;
  border: 1rpx solid rgba(255,216,92,0.4) !important;
  border-radius: 40rpx !important;
  font-size: 24rpx !important;
  padding: 0 28rpx !important;
}

.notify-banner {
  margin: 20rpx 28rpx 0;
  background: rgba(255,216,92,0.1);
  border: 1rpx solid rgba(255,216,92,0.3);
  border-radius: 14rpx;
  padding: 20rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  .n-icon { font-size: 36rpx; }
  .n-text { flex: 1; font-size: 26rpx; color: #FFD85C; line-height: 1.5; }
  .n-close { font-size: 32rpx; color: rgba(255,255,255,0.3); }
}

.section-card {
  margin: 24rpx 28rpx 0;
  background: #161630;
  border-radius: 20rpx;
  padding: 28rpx 28rpx 20rpx;
  border: 1rpx solid rgba(255,255,255,0.07);
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  .section-title { font-size: 28rpx; font-weight: 700; color: #fff; }
  .section-more { font-size: 24rpx; color: #FFD85C; }
}
.link-row {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.04);
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  gap: 16rpx;
  margin-bottom: 12rpx;
  border: 1rpx solid rgba(255,255,255,0.08);
  .link-url { flex: 1; font-size: 22rpx; color: rgba(255,255,255,0.4); word-break: break-all; line-height: 1.5; }
}
.copy-btn {
  background: #F4A800;
  color: #0d0d1a;
  font-size: 22rpx;
  font-weight: 700;
  padding: 10rpx 20rpx;
  border-radius: 8rpx;
  white-space: nowrap;
  flex-shrink: 0;
}
.link-tip { font-size: 22rpx; color: rgba(255,255,255,0.3); }

.action-grid {
  display: flex;
  gap: 16rpx;
  margin: 24rpx 28rpx 0;
}
.action-item {
  flex: 1;
  background: #161630;
  border-radius: 18rpx;
  padding: 28rpx 10rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1rpx solid rgba(255,255,255,0.07);
  .a-icon { font-size: 40rpx; }
  .a-label { font-size: 20rpx; color: rgba(255,255,255,0.55); margin-top: 10rpx; text-align: center; }
}

.pkg-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid rgba(255,255,255,0.06);
  &:last-child { border-bottom: none; }
}
.pkg-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  .pkg-index {
    width: 40rpx;
    height: 40rpx;
    border-radius: 20rpx;
    background: rgba(255,216,92,0.12);
    color: #FFD85C;
    font-size: 22rpx;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .pkg-name { font-size: 28rpx; font-weight: 600; color: #fff; display: block; }
  .pkg-desc { font-size: 22rpx; color: rgba(255,255,255,0.35); margin-top: 4rpx; display: block; }
}
.pkg-price { font-size: 32rpx; font-weight: 700; color: #FFD85C; }

.empty-state {
  text-align: center;
  padding: 40rpx 0;
  .empty-icon { font-size: 60rpx; display: block; }
  .empty-text { font-size: 26rpx; color: rgba(255,255,255,0.3); margin-top: 16rpx; display: block; }
}
.empty-btn {
  display: inline-block;
  margin-top: 20rpx;
  background: rgba(255,216,92,0.12);
  color: #FFD85C;
  font-size: 26rpx;
  padding: 14rpx 32rpx;
  border-radius: 40rpx;
  border: 1rpx solid rgba(255,216,92,0.3);
}

.footer-gap { height: 60rpx; }
</style>
