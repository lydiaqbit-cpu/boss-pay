<template>
  <view class="page">
    <view v-for="burst in moneyBursts" :key="burst.id" class="money-float" :style="{ left: burst.x + 'px', top: burst.y + 'px' }">💰</view>

    <!-- 顶部 -->
    <view class="header-card">
      <view class="header-top">
        <view class="app-name-row">
          <image class="header-logo" src="/static/logo.svg" mode="aspectFit"/>
          <text class="app-name">牛马加班吧</text>
        </view>
      </view>
      <view class="user-row">
        <view class="avatar-wrap">
          <text class="avatar-text">{{ avatarChar }}</text>
        </view>
        <view class="user-text">
          <text class="nickname">{{ userStore.userInfo?.nickname || '打工人' }}</text>
          <view class="bio-row">
            <view class="work-badge">
              <view class="work-dot" />
              <text class="work-badge-text">在线收钱中</text>
            </view>
          </view>
        </view>
      </view>

      <view class="stats-panel">
        <view class="stat-col">
          <text class="stat-val">¥{{ totalConfirmed }}</text>
          <text class="stat-key">💸 已到手</text>
        </view>
        <view class="stat-divider"/>
        <view class="stat-col">
          <text class="stat-val pending">{{ pendingCount }}</text>
          <text class="stat-key">⏳ 待确认</text>
        </view>
        <view class="stat-divider"/>
        <view class="stat-col">
          <text class="stat-val">{{ confirmedCount }}</text>
          <text class="stat-key">🤵 老板次数</text>
        </view>
      </view>
    </view>

    <!-- 待确认提醒 -->
    <view v-if="pendingCount > 0" class="pending-banner" @click="toOrders">
      <text class="pending-text">⏳ 有 {{ pendingCount }} 笔待确认，老板说已转了</text>
      <text class="banner-arrow">›</text>
    </view>

    <!-- 到账通知 -->
    <view v-if="latestNotify" class="notify-banner" @click="latestNotify = null">
      <text class="n-emoji">🎉</text>
      <view class="n-body">
        <text class="n-title">收到转账通知</text>
        <text class="n-text">{{ latestNotify }}</text>
      </view>
      <text class="n-close">✕</text>
    </view>

    <!-- 未设置收款方式 -->
    <view v-if="!hasPaymentMethod" class="setup-banner" @click="toPaymentSetting">
      <view class="setup-left">
        <text class="setup-icon">🫙</text>
        <view>
          <text class="setup-title">老板的钱还在他口袋里！</text>
          <text class="setup-sub">设置收款码，让它乖乖转移到你这来 👉</text>
        </view>
      </view>
      <text class="banner-arrow">›</text>
    </view>

    <!-- 收款链接 -->
    <view v-if="hasPaymentMethod" class="section-card link-card">
      <view class="link-header">
        <text class="link-title">我的收款链接</text>
        <view class="badge-green">发给老板</view>
      </view>
      <text class="link-url" selectable>{{ payLink }}</text>
      <view class="copy-btn" :class="{ copied }" @click="copyLink">
        <text>{{ copied ? '✓ 已复制' : '一键复制链接' }}</text>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="action-grid">
      <view class="action-item" @click="toPackages">
        <view class="a-icon-wrap"><text class="a-icon">📦</text></view>
        <text class="a-label">套餐定价</text>
      </view>
      <view class="action-item" @click="toOrders">
        <view class="a-icon-wrap"><text class="a-icon">🧾</text></view>
        <text class="a-label">收款记录</text>
      </view>
      <view class="action-item" @click="toPaymentSetting">
        <view class="a-icon-wrap"><text class="a-icon">💳</text></view>
        <text class="a-label">收款方式</text>
      </view>
      <view class="action-item" @click="previewCashier">
        <view class="a-icon-wrap"><text class="a-icon">👁️</text></view>
        <text class="a-label">老板视角</text>
      </view>
    </view>

    <!-- 套餐价目表 -->
    <view class="section-card">
      <view class="section-header">
        <text class="section-title">⏰ 加班价目表</text>
        <text class="section-more" @click="toPackages">管理 →</text>
      </view>
      <view v-if="packages.length === 0" class="empty-state">
        <text class="empty-emoji">😴</text>
        <text class="empty-text">还没设置加班费，老板偷着乐呢</text>
        <view class="empty-btn" @click="toPackages">+ 马上定价</view>
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
const orders = ref<any[]>([])
const latestNotify = ref<string | null>(null)
const copied = ref(false)
const paymentInfo = ref<any>(null)
let ws: UniApp.SocketTask | null = null

const hasPaymentMethod = computed(() => {
  const p = paymentInfo.value
  return !!(p?.wechatQrUrl || p?.alipayQrUrl)
})

interface MoneyBurst { id: number; x: number; y: number }
const moneyBursts = ref<MoneyBurst[]>([])
let burstId = 0

const avatarChar = computed(() => (userStore.userInfo?.nickname || '工').charAt(0))
const confirmedOrders = computed(() => orders.value.filter(o => o.status === 'confirmed'))
const pendingCount = computed(() => orders.value.filter(o => o.status === 'boss_paid').length)
const confirmedCount = computed(() => confirmedOrders.value.length)
const totalConfirmed = computed(() => confirmedOrders.value.reduce((s, o) => s + o.netAmount, 0).toFixed(2))

// #ifdef H5
const payLink = computed(() => `${location.origin}/#/pages/pay/cashier?userId=${userStore.userInfo?.id || ''}`)
// #endif
// #ifdef MP-WEIXIN
const payLink = computed(() => `/pages/pay/cashier?userId=${userStore.userInfo?.id || ''}`)
// #endif

function triggerMoneyBurst() {
  for (let i = 0; i <= 4; i++) {
    setTimeout(() => {
      const id = burstId++
      moneyBursts.value.push({ id, x: 80 + Math.random() * 220, y: 180 + Math.random() * 140 })
      setTimeout(() => { moneyBursts.value = moneyBursts.value.filter(b => b.id !== id) }, 1600)
    }, i * 120)
  }
}

onMounted(async () => {
  await userStore.fetchMe()
  await Promise.all([loadPackages(), loadOrders(), loadPaymentInfo()])
  connectWS()
})

onUnmounted(() => { ws?.close() })

async function loadPackages() { try { packages.value = await get<any[]>('/packages') } catch {} }
async function loadOrders() { try { orders.value = await get<any[]>('/pay/orders') } catch {} }
async function loadPaymentInfo() { try { paymentInfo.value = await get<any>('/user/payment') } catch {} }

function connectWS() {
  if (!userStore.userInfo?.id) return
  const wsBase = (import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:3000').replace(/\/$/, '')
  ws = uni.connectSocket({ url: `${wsBase}/ws?userId=${userStore.userInfo.id}`, complete: () => {} })
  ws.onMessage((res) => {
    try {
      const msg = JSON.parse(res.data as string)
      if (msg.type === 'boss_paid') {
        latestNotify.value = msg.message
        loadOrders()
        triggerMoneyBurst()
        uni.vibrateShort({})
      }
    } catch {}
  })
}

function toPackages() { uni.navigateTo({ url: '/pages/packages/index' }) }
function toOrders() { uni.switchTab({ url: '/pages/orders/index' }) }
function toPaymentSetting() { uni.navigateTo({ url: '/pages/profile/payment' }) }
function copyLink() {
  uni.setClipboardData({ data: payLink.value, success: () => { copied.value = true; setTimeout(() => { copied.value = false }, 2000) } })
}
function previewCashier() { uni.navigateTo({ url: `/pages/pay/cashier?userId=${userStore.userInfo?.id}` }) }

onShareAppMessage(() => ({
  title: `${userStore.userInfo?.nickname || '打工人'} 请老板扫码付加班费 💰`,
  path: `/pages/pay/cashier?userId=${userStore.userInfo?.id || ''}`,
}))
</script>

<style lang="scss">
page { background: #F2EBE0; }
.page { min-height: 100vh; padding-bottom: 40rpx; position: relative; overflow: hidden; }

.money-float {
  position: fixed; font-size: 48rpx; pointer-events: none; z-index: 9999;
  animation: floatMoney 1.5s ease-out forwards;
}
@keyframes floatMoney {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-120rpx) scale(1.4); }
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.header-card {
  background: linear-gradient(160deg, #1E1A14 0%, #3D3526 100%);
  padding: 64rpx 36rpx 36rpx;
  border-radius: 0 0 40rpx 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(30,26,20,0.35);
}
.header-top { margin-bottom: 32rpx; }
.app-name-row { display: flex; align-items: center; gap: 12rpx; }
.header-logo { width: 48rpx; height: 48rpx; border-radius: 10rpx; }
.app-name { font-size: 28rpx; font-weight: 800; color: #F2EBE0; letter-spacing: 3rpx; }

.user-row { display: flex; align-items: center; margin-bottom: 28rpx; }
.avatar-wrap {
  width: 88rpx; height: 88rpx; border-radius: 44rpx;
  background: rgba(255,255,255,0.15); border: 2rpx solid rgba(196,168,130,0.5);
  display: flex; align-items: center; justify-content: center;
  margin-right: 20rpx; flex-shrink: 0;
}
.avatar-text { font-size: 38rpx; font-weight: 700; color: #C4A882; }
.user-text { flex: 1; }
.nickname { font-size: 34rpx; font-weight: 700; color: #F2EBE0; display: block; margin-bottom: 8rpx; }
.bio-row { display: flex; align-items: center; }
.work-badge { display: flex; align-items: center; gap: 6rpx; background: rgba(196,168,130,0.2); padding: 4rpx 14rpx; border-radius: 4rpx; }
.work-dot { width: 10rpx; height: 10rpx; border-radius: 5rpx; background: #C0392B; }
.work-badge-text { font-size: 20rpx; color: #C4A882; font-weight: 600; letter-spacing: 1rpx; }

.stats-panel { background: rgba(0,0,0,0.2); border-radius: 8rpx; padding: 20rpx 24rpx; display: flex; align-items: center; border: 1rpx solid rgba(196,168,130,0.2); }
.stat-col { flex: 1; text-align: center; }
.stat-val { font-size: 36rpx; font-weight: 800; color: #F2EBE0; display: block; }
.stat-val.pending { color: #E8A090; }
.stat-key { font-size: 20rpx; color: rgba(196,168,130,0.7); margin-top: 4rpx; display: block; letter-spacing: 1rpx; }
.stat-divider { width: 1rpx; height: 44rpx; background: rgba(196,168,130,0.25); }

.pending-banner {
  margin: 20rpx 28rpx 0;
  background: #FDF5EE; border: 1rpx solid #E8C8A8;
  border-radius: 8rpx; padding: 18rpx 24rpx;
  display: flex; align-items: center; justify-content: space-between;
  border-left: 4rpx solid #C0392B;
}
.pending-text { font-size: 26rpx; color: #8B3A2A; flex: 1; }

.notify-banner {
  margin: 20rpx 28rpx 0; background: #fff; border-radius: 8rpx;
  padding: 20rpx 24rpx; display: flex; align-items: center; gap: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(30,26,20,0.1); border-left: 4rpx solid #C0392B;
  border: 1rpx solid #D4C4A8;
}
.n-emoji { font-size: 36rpx; }
.n-body { flex: 1; }
.n-title { font-size: 22rpx; color: #C0392B; font-weight: 600; display: block; }
.n-text { font-size: 24rpx; color: #3D3526; margin-top: 2rpx; display: block; }
.n-close { font-size: 28rpx; color: #C4A882; }

.setup-banner {
  margin: 20rpx 28rpx 0;
  background: linear-gradient(135deg, #3D3526, #1E1A14);
  border-radius: 8rpx; padding: 28rpx 24rpx;
  display: flex; align-items: center;
  border: 1rpx solid rgba(196,168,130,0.3);
}
.setup-left { display: flex; align-items: center; gap: 18rpx; flex: 1; }
.setup-icon { font-size: 44rpx; flex-shrink: 0; }
.setup-title { font-size: 28rpx; font-weight: 700; color: #F2EBE0; display: block; }
.setup-sub { font-size: 22rpx; color: rgba(196,168,130,0.85); margin-top: 6rpx; display: block; }
.banner-arrow { font-size: 48rpx; color: rgba(196,168,130,0.6); flex-shrink: 0; }

.section-card {
  margin: 20rpx 28rpx 0; background: #fff; border-radius: 8rpx;
  padding: 28rpx; box-shadow: 0 2rpx 10rpx rgba(30,26,20,0.07);
  border: 1rpx solid #D4C4A8;
}
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.section-title { font-size: 28rpx; font-weight: 700; color: #1E1A14; }
.section-more { font-size: 24rpx; color: #8B3A2A; }

.link-header { display: flex; align-items: center; gap: 12rpx; margin-bottom: 14rpx; }
.link-title { font-size: 28rpx; font-weight: 700; color: #1E1A14; }
.badge-green { background: #F5EDE0; color: #8B3A2A; font-size: 20rpx; font-weight: 600; padding: 4rpx 14rpx; border-radius: 4rpx; border: 1rpx solid #D4C4A8; }
.link-url {
  display: block; font-size: 22rpx; color: #8B7355; word-break: break-all; line-height: 1.7;
  background: #FAF6F0; border-radius: 6rpx; padding: 14rpx 16rpx; margin-bottom: 18rpx;
  border: 1rpx solid #D4C4A8;
}
.copy-btn {
  height: 88rpx; background: #1E1A14;
  color: #F2EBE0; border-radius: 8rpx; font-size: 28rpx; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  letter-spacing: 2rpx; animation: pulse 2.5s infinite;
}
.copy-btn.copied { background: #5A6A30; animation: none; }

.action-grid { display: flex; gap: 14rpx; margin: 20rpx 28rpx 0; }
.action-item {
  flex: 1; background: #fff; border-radius: 8rpx; padding: 24rpx 10rpx;
  display: flex; flex-direction: column; align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(30,26,20,0.07); border: 1rpx solid #D4C4A8;
}
.a-icon-wrap { width: 72rpx; height: 72rpx; border-radius: 8rpx; background: #F5EDE0; display: flex; align-items: center; justify-content: center; margin-bottom: 10rpx; }
.a-icon { font-size: 36rpx; }
.a-label { font-size: 21rpx; color: #6B5040; font-weight: 500; }

.pkg-row { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid #EDE0CC; }
.pkg-row:last-child { border-bottom: none; }
.pkg-left { display: flex; align-items: center; gap: 14rpx; }
.pkg-index { width: 40rpx; height: 40rpx; border-radius: 4rpx; background: #F5EDE0; color: #8B3A2A; font-size: 22rpx; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1rpx solid #D4C4A8; }
.pkg-name { font-size: 28rpx; font-weight: 600; color: #1E1A14; display: block; }
.pkg-desc { font-size: 22rpx; color: #8B7355; margin-top: 4rpx; display: block; }
.pkg-price { font-size: 32rpx; font-weight: 700; color: #C0392B; }

.empty-state { text-align: center; padding: 36rpx 0; }
.empty-emoji { font-size: 56rpx; display: block; }
.empty-text { font-size: 26rpx; color: #8B7355; margin-top: 14rpx; display: block; }
.empty-btn { display: inline-block; margin-top: 18rpx; background: #F5EDE0; color: #8B3A2A; font-size: 26rpx; font-weight: 600; padding: 12rpx 32rpx; border-radius: 6rpx; border: 1rpx solid #D4C4A8; }

.footer-gap { height: 60rpx; }
</style>
