<template>
  <view class="page">
    <view
      v-for="burst in moneyBursts"
      :key="burst.id"
      class="money-float"
      :style="{ left: burst.x + 'px', top: burst.y + 'px' }"
    >💰</view>

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
              <text class="work-badge-dot" />
              <text class="work-badge-text">在线</text>
            </view>
            <text class="bio">{{ userStore.userInfo?.bio || '准时下班，合理摸鱼' }}</text>
          </view>
        </view>
      </view>

      <!-- 统计面板 -->
      <view class="stats-panel">
        <view class="stat-col">
          <view class="stat-row">
            <text class="stat-icon">💸</text>
            <text class="stat-val">¥{{ totalConfirmed }}</text>
          </view>
          <text class="stat-key">已确认到手</text>
        </view>
        <view class="stat-divider"/>
        <view class="stat-col">
          <view class="stat-row">
            <text class="stat-icon">👀</text>
            <text class="stat-val orange">{{ pendingCount }}</text>
          </view>
          <text class="stat-key">待确认笔数</text>
        </view>
        <view class="stat-divider"/>
        <view class="stat-col">
          <view class="stat-row">
            <text class="stat-icon">🤵</text>
            <text class="stat-val">{{ confirmedCount }}</text>
          </view>
          <text class="stat-key">老板付款次数</text>
        </view>
      </view>
    </view>

    <!-- 待确认提醒 -->
    <view v-if="pendingCount > 0" class="pending-banner" @click="toOrders">
      <text class="pending-icon">⏳</text>
      <text class="pending-text">有 {{ pendingCount }} 笔待确认，老板说已转账了</text>
      <text class="pending-arrow">›</text>
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

    <!-- 未设置收款方式提醒 -->
    <view v-if="!hasPaymentMethod" class="setup-banner" @click="toPaymentSetting">
      <view class="setup-left">
        <text class="setup-icon">💳</text>
        <view>
          <text class="setup-title">先设置收款方式</text>
          <text class="setup-sub">设置微信/支付宝/银行卡后才能生成收款链接</text>
        </view>
      </view>
      <text class="setup-arrow">›</text>
    </view>

    <!-- 收款链接（设置了收款方式才显示） -->
    <view v-if="hasPaymentMethod" class="section-card link-card">
      <view class="link-header">
        <text class="link-title">我的收款链接</text>
        <text class="link-tip-badge">发给老板</text>
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
  if (!p) return false
  return !!(p.wechatQrUrl || p.alipayAccount || p.bankCard)
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
const payLink = computed(() =>
  `${location.origin}/#/pages/pay/cashier?userId=${userStore.userInfo?.id || ''}`
)
// #endif
// #ifdef MP-WEIXIN
const payLink = computed(() =>
  `/pages/pay/cashier?userId=${userStore.userInfo?.id || ''}`
)
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

async function loadPackages() {
  try { packages.value = await get<any[]>('/packages') } catch {}
}

async function loadOrders() {
  try { orders.value = await get<any[]>('/pay/orders') } catch {}
}

async function loadPaymentInfo() {
  try { paymentInfo.value = await get<any>('/user/payment') } catch {}
}

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
  uni.setClipboardData({
    data: payLink.value,
    success: () => { copied.value = true; setTimeout(() => { copied.value = false }, 2000) }
  })
}

function previewCashier() {
  uni.navigateTo({ url: `/pages/pay/cashier?userId=${userStore.userInfo?.id}` })
}

onShareAppMessage(() => ({
  title: `${userStore.userInfo?.nickname || '打工人'} 请老板扫码付加班费 💰`,
  path: `/pages/pay/cashier?userId=${userStore.userInfo?.id || ''}`,
}))
</script>

<style lang="scss">
page { background: #F5EAD8; }
.page { min-height: 100vh; padding-bottom: 40rpx; position: relative; overflow: hidden; }

.money-float {
  position: fixed; font-size: 48rpx; pointer-events: none; z-index: 9999;
  animation: floatMoney 1.5s ease-out forwards;
}

.header-card {
  background: linear-gradient(160deg, #3D2010 0%, #5C3218 60%, #3D2010 100%);
  padding: 64rpx 36rpx 36rpx;
  border-radius: 0 0 48rpx 48rpx;
  box-shadow: 0 16rpx 48rpx rgba(180,110,40,0.35);
}
.header-top {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 36rpx;
}
.app-name-row { display: flex; align-items: center; gap: 14rpx; }
.header-logo { width: 52rpx; height: 52rpx; border-radius: 12rpx; }
.app-name { font-size: 30rpx; font-weight: 800; color: #fff; letter-spacing: 2rpx; }

.user-row { display: flex; align-items: center; margin-bottom: 32rpx; }
.avatar-wrap {
  width: 92rpx; height: 92rpx; border-radius: 46rpx;
  background: rgba(255,255,255,0.2); border: 2rpx solid rgba(255,255,255,0.35);
  display: flex; align-items: center; justify-content: center;
  margin-right: 22rpx; flex-shrink: 0;
}
.avatar-text { font-size: 40rpx; font-weight: 700; color: #fff; }
.user-text { flex: 1; min-width: 0; }
.nickname { font-size: 34rpx; font-weight: 700; color: #fff; display: block; margin-bottom: 10rpx; }
.bio-row { display: flex; align-items: center; gap: 10rpx; }
.bio { font-size: 22rpx; color: rgba(255,255,255,0.6); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.work-badge {
  display: flex; align-items: center; gap: 6rpx;
  background: rgba(74,222,128,0.2); border: 1rpx solid rgba(74,222,128,0.4);
  padding: 4rpx 12rpx; border-radius: 20rpx; flex-shrink: 0;
}
.work-badge-dot { display: block; width: 10rpx; height: 10rpx; border-radius: 5rpx; background: #4ADE80; }
.work-badge-text { font-size: 18rpx; color: #4ADE80; font-weight: 600; }

.stats-panel {
  background: rgba(255,255,255,0.12); border-radius: 20rpx; padding: 24rpx 28rpx;
  display: flex; align-items: center;
}
.stat-col { flex: 1; text-align: center; }
.stat-row { display: flex; align-items: center; justify-content: center; gap: 8rpx; }
.stat-icon { font-size: 28rpx; }
.stat-val { font-size: 34rpx; font-weight: 800; color: #fff; }
.stat-val.orange { color: #FF9F43; }
.stat-key { font-size: 20rpx; color: rgba(255,255,255,0.5); margin-top: 6rpx; display: block; }
.stat-divider { width: 1rpx; height: 48rpx; background: rgba(255,255,255,0.15); }

.setup-banner {
  margin: 20rpx 28rpx 0;
  background: linear-gradient(135deg, #C9883D, #B8772A);
  border-radius: 20rpx;
  padding: 28rpx 24rpx; display: flex; align-items: center; gap: 16rpx;
  box-shadow: 0 8rpx 24rpx rgba(180,110,40,0.4);
}
.setup-left { display: flex; align-items: center; gap: 20rpx; flex: 1; }
.setup-icon { font-size: 44rpx; flex-shrink: 0; }
.setup-title { font-size: 30rpx; font-weight: 800; color: #fff; display: block; }
.setup-sub { font-size: 22rpx; color: rgba(255,255,255,0.8); margin-top: 6rpx; display: block; }
.setup-arrow { font-size: 48rpx; color: rgba(255,255,255,0.7); }

.pending-banner {
  margin: 20rpx 28rpx 0; background: rgba(255,159,67,0.12);
  border: 1rpx solid rgba(255,159,67,0.3); border-radius: 16rpx;
  padding: 20rpx 24rpx; display: flex; align-items: center; gap: 12rpx;
}
.pending-icon { font-size: 28rpx; flex-shrink: 0; }
.pending-text { flex: 1; font-size: 24rpx; color: #FF9F43; }
.pending-arrow { font-size: 36rpx; color: rgba(255,159,67,0.6); }

.notify-banner {
  margin: 20rpx 28rpx 0; background: #fff; border-radius: 18rpx;
  padding: 20rpx 24rpx; display: flex; align-items: center; gap: 16rpx;
  box-shadow: 0 4rpx 24rpx rgba(5,150,105,0.15); border-left: 6rpx solid #C9883D;
}
.n-emoji { font-size: 36rpx; flex-shrink: 0; }
.n-body { flex: 1; }
.n-title { font-size: 22rpx; color: #C9883D; font-weight: 600; display: block; }
.n-text { font-size: 24rpx; color: #374151; margin-top: 2rpx; display: block; }
.n-close { font-size: 28rpx; color: #C4A888; }

.section-card {
  margin: 24rpx 28rpx 0; background: #fff; border-radius: 24rpx;
  padding: 28rpx 28rpx 20rpx; box-shadow: 0 2rpx 16rpx rgba(180,110,40,0.07);
}
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.section-title { font-size: 28rpx; font-weight: 700; color: #1C1208; }
.section-more { font-size: 24rpx; color: #C9883D; }

.link-card { }
.link-header { display: flex; align-items: center; gap: 14rpx; margin-bottom: 16rpx; }
.link-title { font-size: 28rpx; font-weight: 700; color: #1C1208; }
.link-tip-badge { background: #EFE0C8; color: #C9883D; font-size: 20rpx; font-weight: 600; padding: 4rpx 14rpx; border-radius: 20rpx; }
.link-url {
  display: block; font-size: 22rpx; color: #8A6A50; word-break: break-all; line-height: 1.6;
  background: #F9F2E8; border-radius: 12rpx; padding: 16rpx 18rpx; margin-bottom: 20rpx; border: 1rpx solid #E8C89A;
}
.copy-btn {
  width: 100%; height: 88rpx; background: linear-gradient(135deg, #C9883D 0%, #B8772A 100%);
  color: #fff; border-radius: 44rpx; font-size: 28rpx; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6rpx 24rpx rgba(180,110,40,0.35); animation: pulse 2.5s infinite;
}
.copy-btn.copied {
  background: linear-gradient(135deg, #16A34A 0%, #22C55E 100%);
  animation: none; box-shadow: 0 6rpx 24rpx rgba(5,150,105,0.35);
}

.action-grid { display: flex; gap: 16rpx; margin: 24rpx 28rpx 0; }
.action-item {
  flex: 1; background: #fff; border-radius: 20rpx; padding: 28rpx 10rpx;
  display: flex; flex-direction: column; align-items: center;
  box-shadow: 0 2rpx 12rpx rgba(180,110,40,0.07);
}
.a-icon-wrap { width: 80rpx; height: 80rpx; border-radius: 22rpx; background: #EFE0C8; display: flex; align-items: center; justify-content: center; margin-bottom: 12rpx; }
.a-icon { font-size: 38rpx; }
.a-label { font-size: 22rpx; color: #6A4E38; font-weight: 500; }

.pkg-row { display: flex; justify-content: space-between; align-items: center; padding: 22rpx 0; border-bottom: 1rpx solid #F3F4F6; }
.pkg-row:last-child { border-bottom: none; }
.pkg-left { display: flex; align-items: center; gap: 16rpx; }
.pkg-index { width: 44rpx; height: 44rpx; border-radius: 22rpx; background: #EFE0C8; color: #C9883D; font-size: 22rpx; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.pkg-name { font-size: 28rpx; font-weight: 600; color: #1C1208; display: block; }
.pkg-desc { font-size: 22rpx; color: #8A6A50; margin-top: 4rpx; display: block; }
.pkg-price { font-size: 32rpx; font-weight: 700; color: #16A34A; }

.empty-state { text-align: center; padding: 40rpx 0; }
.empty-emoji { font-size: 60rpx; display: block; }
.empty-text { font-size: 26rpx; color: #8A6A50; margin-top: 16rpx; display: block; }
.empty-btn { display: inline-block; margin-top: 20rpx; background: #EFE0C8; color: #C9883D; font-size: 26rpx; font-weight: 600; padding: 14rpx 36rpx; border-radius: 40rpx; }

.footer-gap { height: 60rpx; }
</style>
