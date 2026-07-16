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
          <image v-if="userStore.userInfo?.avatar" :src="userStore.userInfo.avatar" class="avatar-img" mode="aspectFill"/>
          <text v-else class="avatar-text">{{ avatarChar }}</text>
        </view>
        <view class="user-text">
          <text class="nickname">{{ userStore.userInfo?.nickname || '打工人' }}</text>
          <view class="bio-row">
            <view class="work-badge" :class="{ 'badge-ready': isSetupDone }">
              <view class="work-dot" />
              <text class="work-badge-text">{{ isSetupDone ? '在线收钱中' : '待激活' }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 新用户：隐藏全零统计，改为激励文案 -->
      <view v-if="isSetupDone" class="stats-panel">
        <view class="stat-col">
          <text class="stat-val">¥{{ totalConfirmed }}</text>
          <text class="stat-key">累计到账</text>
        </view>
        <view class="stat-divider"/>
        <view class="stat-col">
          <text class="stat-val pending">{{ pendingCount }}</text>
          <text class="stat-key">待确认</text>
        </view>
        <view class="stat-divider"/>
        <view class="stat-col">
          <text class="stat-val">{{ confirmedCount }}</text>
          <text class="stat-key">已收款</text>
        </view>
      </view>
      <view v-else class="onboard-hint">
        <text class="onboard-hint-text">完成下方 3 步，开始向老板讨钱 👇</text>
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

    <!-- 新用户引导 checklist -->
    <view v-if="!isSetupDone" class="onboard-card">
      <view class="onboard-title-row">
        <text class="onboard-title">三步开始收钱</text>
        <text class="onboard-progress">{{ setupProgress }}/3 完成</text>
      </view>

      <view class="onboard-step" :class="{ done: hasPaymentMethod }" @click="!hasPaymentMethod && toPaymentSetting()">
        <view class="step-check" :class="{ done: hasPaymentMethod }">
          <text class="check-icon">{{ hasPaymentMethod ? '✓' : '1' }}</text>
        </view>
        <view class="step-body">
          <text class="step-label">设置收款码</text>
          <text class="step-desc">{{ hasPaymentMethod ? '微信/支付宝收款码已就位' : '上传你的收款二维码' }}</text>
        </view>
        <text v-if="!hasPaymentMethod" class="step-arrow">›</text>
      </view>

      <view class="onboard-step" :class="{ done: packages.length > 0 }" @click="packages.length === 0 && toPackages()">
        <view class="step-check" :class="{ done: packages.length > 0 }">
          <text class="check-icon">{{ packages.length > 0 ? '✓' : '2' }}</text>
        </view>
        <view class="step-body">
          <text class="step-label">添加加班套餐</text>
          <text class="step-desc">{{ packages.length > 0 ? `已添加 ${packages.length} 个套餐` : '定好价，老板别想赖账' }}</text>
        </view>
        <text v-if="packages.length === 0" class="step-arrow">›</text>
      </view>

      <view class="onboard-step" :class="{ done: false, disabled: !hasPaymentMethod || packages.length === 0 }" @click="copyLinkOnboard">
        <view class="step-check">
          <text class="check-icon">3</text>
        </view>
        <view class="step-body">
          <text class="step-label">复制链接发老板</text>
          <text class="step-desc">{{ (!hasPaymentMethod || packages.length === 0) ? '完成前两步后解锁' : '点这里复制，发进群里' }}</text>
        </view>
        <view v-if="hasPaymentMethod && packages.length > 0" class="step-copy-btn" :class="{ copied }">
          <text>{{ copied ? '✓ 已复制' : '复制' }}</text>
        </view>
        <text v-else class="step-lock">🔒</text>
      </view>
    </view>

    <!-- 已完成引导：显示复制链接 banner -->
    <view v-if="isSetupDone" class="ready-banner">
      <view class="ready-left">
        <view class="setup-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="36" cy="12" r="6" stroke="#C4A882" stroke-width="2" fill="none"/>
            <circle cx="36" cy="36" r="6" stroke="#C4A882" stroke-width="2" fill="none"/>
            <circle cx="12" cy="24" r="6" stroke="#C4A882" stroke-width="2" fill="none"/>
            <line x1="17.5" y1="21" x2="30.5" y2="14.5" stroke="#C4A882" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="17.5" y1="27" x2="30.5" y2="33.5" stroke="#C4A882" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </view>
        <view class="ready-text-wrap">
          <text class="setup-title">讨薪令已就绪，发给老板！</text>
          <text class="ready-link-preview">{{ payLinkShort }}</text>
        </view>
      </view>
      <view class="ready-copy-btn" :class="{ copied }" @click="copyLink">
        <text>{{ copied ? '✓ 已复制' : '复制链接' }}</text>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="action-grid">
      <view class="action-item" @click="toPackages">
        <view class="a-icon-wrap"><text class="a-emoji">📋</text></view>
        <text class="a-label">加班套餐</text>
        <text class="a-sub">定好价，一字不让</text>
      </view>
      <view class="action-item" @click="toOrders">
        <view class="a-icon-wrap"><text class="a-emoji">📒</text></view>
        <text class="a-label">收款记录</text>
        <text class="a-sub">每笔都是泪</text>
      </view>
      <view class="action-item" @click="toPaymentSetting">
        <view class="a-icon-wrap"><text class="a-emoji">💳</text></view>
        <text class="a-label">收款方式</text>
        <text class="a-sub">钱往哪打</text>
      </view>
      <view class="action-item" @click="previewCashier">
        <view class="a-icon-wrap"><text class="a-emoji">👁️</text></view>
        <text class="a-label">老板视角</text>
        <text class="a-sub">甲方看到啥</text>
      </view>
    </view>

    <!-- 套餐价目表 -->
    <view class="section-card">
      <view class="section-header">
        <text class="section-title">加班价目表</text>
        <text class="section-more" @click="toPackages">管理 →</text>
      </view>
      <view v-if="loading" class="skeleton-wrap">
        <view v-for="i in 2" :key="i" class="skeleton-row">
          <view class="skeleton-line short" />
          <view class="skeleton-price" />
        </view>
      </view>
      <view v-else-if="packages.length === 0" class="empty-state">
        <view class="beggar-wrap">
          <image src="/static/cat-hungry.png" class="cat-img" mode="aspectFit"/>
        </view>
        <text class="empty-text">碗都空了，快去定套餐！</text>
        <view class="empty-btn" @click="toPackages">立即定价，要钱要命</view>
      </view>
      <view v-else v-for="(pkg, i) in packages" :key="pkg.id" class="pkg-row">
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
import { onShareAppMessage, onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../store/user'
import { get } from '../../utils/request'
import { track } from '../../utils/track'

const userStore = useUserStore()
const packages = ref<any[]>([])
const orders = ref<any[]>([])
const latestNotify = ref<string | null>(null)
const copied = ref(false)
const loading = ref(true)
const paymentInfo = ref<any>(null)
let ws: UniApp.SocketTask | null = null

const hasPaymentMethod = computed(() => {
  const p = paymentInfo.value
  return !!(p?.wechatQrUrl || p?.alipayQrUrl)
})

const isSetupDone = computed(() => hasPaymentMethod.value && packages.value.length > 0)

const setupProgress = computed(() => {
  let n = 0
  if (hasPaymentMethod.value) n++
  if (packages.value.length > 0) n++
  return n
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

const payLinkShort = computed(() => {
  const id = userStore.userInfo?.id || ''
  // #ifdef H5
  return `${location.hostname}/pay/${id.slice(0, 8)}…`
  // #endif
  // #ifdef MP-WEIXIN
  return `小程序收款页 · ${id.slice(0, 8)}…`
  // #endif
})

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
  loading.value = false
  connectWS()
})

onShow(async () => {
  await Promise.all([loadPackages(), loadPaymentInfo()])
  connectWS() // ws 内部有 if(ws) return，不会重复
})

onUnmounted(() => { ws?.close() })

async function loadPackages() { try { packages.value = await get<any[]>('/packages') } catch {} }
async function loadOrders() { try { orders.value = await get<any[]>('/pay/orders') } catch {} }
async function loadPaymentInfo() { try { paymentInfo.value = await get<any>('/user/payment') } catch {} }

function connectWS() {
  if (!userStore.userInfo?.id || !userStore.token) return
  if (ws) return // 已有连接，不重复建立
  // #ifdef H5
  const wsBase = (import.meta.env.VITE_WS_BASE_URL || '').replace(/\/$/, '')
  if (!wsBase) return
  // #endif
  // #ifdef MP-WEIXIN
  const wsBase = (import.meta.env.VITE_WS_BASE_URL || '').replace(/\/$/, '')
  if (!wsBase) return
  // #endif
  ws = uni.connectSocket({ url: `${wsBase}/ws?token=${userStore.token}`, complete: () => {} })
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
  ws.onError(() => { ws = null })
  ws.onClose(() => { ws = null })
}

function toPackages() { uni.navigateTo({ url: '/pages/packages/index' }) }
function toOrders() { uni.switchTab({ url: '/pages/orders/index' }) }
function toPaymentSetting() { uni.navigateTo({ url: '/pages/profile/payment' }) }

function buildLink(pkgId?: string) {
  const uid = userStore.userInfo?.id || ''
  // #ifdef H5
  return `${location.origin}/#/pages/pay/cashier?userId=${uid}${pkgId ? `&packageId=${pkgId}` : ''}`
  // #endif
  // #ifdef MP-WEIXIN
  return `/pages/pay/cashier?userId=${uid}${pkgId ? `&packageId=${pkgId}` : ''}`
  // #endif
}

function doCopy(link: string) {
  uni.setClipboardData({ data: link, success: () => { copied.value = true; setTimeout(() => { copied.value = false }, 2000) } })
  track('copy_pay_link')
}

function copyLink() {
  const pkgs = packages.value
  if (pkgs.length === 0) {
    doCopy(buildLink())
  } else if (pkgs.length === 1) {
    doCopy(buildLink(pkgs[0].id))
  } else {
    uni.showActionSheet({
      itemList: pkgs.map(p => `${p.name}  ¥${p.price}`).concat(['复制通用链接（不指定套餐）']),
      success: (res) => {
        if (res.tapIndex < pkgs.length) {
          doCopy(buildLink(pkgs[res.tapIndex].id))
        } else {
          doCopy(buildLink())
        }
      }
    })
  }
}

function copyLinkOnboard() {
  if (!hasPaymentMethod.value || packages.value.length === 0) return
  copyLink()
}

function previewCashier() { uni.navigateTo({ url: `/pages/pay/cashier?userId=${userStore.userInfo?.id}` }) }

onShareAppMessage(() => ({
  title: `${userStore.userInfo?.nickname || '打工人'} 请老板扫码付加班费 💰`,
  path: `/pages/pay/cashier?userId=${userStore.userInfo?.id || ''}`,
}))
</script>

<style lang="scss">
page { background: #F7F4F0; }
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
@keyframes stepIn {
  from { opacity: 0; transform: translateX(-12rpx); }
  to { opacity: 1; transform: translateX(0); }
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
.app-name { font-size: 28rpx; font-weight: 800; color: #F7F4F0; letter-spacing: 3rpx; }

.user-row { display: flex; align-items: center; margin-bottom: 28rpx; }
.avatar-wrap {
  width: 88rpx; height: 88rpx; border-radius: 44rpx;
  background: rgba(255,255,255,0.15); border: 2rpx solid rgba(196,168,130,0.5);
  display: flex; align-items: center; justify-content: center;
  margin-right: 20rpx; flex-shrink: 0;
}
.avatar-text { font-size: 38rpx; font-weight: 700; color: #C4A882; }
.avatar-img { width: 88rpx; height: 88rpx; border-radius: 44rpx; }
.user-text { flex: 1; }
.nickname { font-size: 34rpx; font-weight: 700; color: #F7F4F0; display: block; margin-bottom: 8rpx; }
.bio-row { display: flex; align-items: center; }
.work-badge { display: flex; align-items: center; gap: 6rpx; background: rgba(196,168,130,0.2); padding: 4rpx 14rpx; border-radius: 4rpx; }
.work-badge.badge-ready { background: rgba(80,160,80,0.2); }
.work-dot { width: 10rpx; height: 10rpx; border-radius: 5rpx; background: #D94F3D; }
.badge-ready .work-dot { background: #5AA050; }
.work-badge-text { font-size: 20rpx; color: #C4A882; font-weight: 600; letter-spacing: 1rpx; }
.badge-ready .work-badge-text { color: #90C880; }

.stats-panel { background: rgba(0,0,0,0.2); border-radius: 8rpx; padding: 20rpx 24rpx; display: flex; align-items: center; border: 1rpx solid rgba(196,168,130,0.2); }
.stat-col { flex: 1; text-align: center; }
.stat-val { font-size: 36rpx; font-weight: 800; color: #F7F4F0; display: block; }
.stat-val.pending { color: #E8A090; }
.stat-key { font-size: 19rpx; color: rgba(196,168,130,0.7); margin-top: 4rpx; display: block; white-space: nowrap; }
.stat-divider { width: 1rpx; height: 44rpx; background: rgba(196,168,130,0.25); }

.onboard-hint {
  background: rgba(0,0,0,0.15); border-radius: 8rpx; padding: 16rpx 20rpx;
  border: 1rpx dashed rgba(196,168,130,0.3);
}
.onboard-hint-text { font-size: 24rpx; color: rgba(196,168,130,0.8); text-align: center; display: block; }

/* 新用户引导 checklist */
.onboard-card {
  margin: 20rpx 28rpx 0; background: #fff;
  border-radius: 12rpx; overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(30,26,20,0.1);
  border: 1rpx solid #C8B89A;
}
.onboard-title-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 24rpx 28rpx 18rpx; background: #F8F5F2;
  border-bottom: 1rpx solid #E5D8C4;
}
.onboard-title { font-size: 28rpx; font-weight: 700; color: #1E1A14; }
.onboard-progress { font-size: 22rpx; color: #8B7355; font-weight: 600; }

.onboard-step {
  display: flex; align-items: center; gap: 18rpx;
  padding: 24rpx 28rpx; border-bottom: 1rpx solid #F0E8DC;
  animation: stepIn 0.3s ease both;
}
.onboard-step:last-child { border-bottom: none; }
.onboard-step.disabled { opacity: 0.45; }
.onboard-step.done { background: #F8FFF6; }

.step-check {
  width: 48rpx; height: 48rpx; border-radius: 24rpx;
  background: #E5D8C4; border: 2rpx solid #C4A882;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.step-check.done { background: #5AA050; border-color: #5AA050; }
.check-icon { font-size: 22rpx; font-weight: 700; color: #8B7355; }
.step-check.done .check-icon { color: #fff; }

.step-body { flex: 1; }
.step-label { font-size: 28rpx; font-weight: 600; color: #1E1A14; display: block; }
.onboard-step.done .step-label { color: #5AA050; }
.step-desc { font-size: 22rpx; color: #8B7355; margin-top: 4rpx; display: block; }

.step-arrow { font-size: 40rpx; color: #C4A882; }
.step-lock { font-size: 28rpx; }
.step-copy-btn {
  background: #1E1A14; color: #F7F4F0; font-size: 24rpx; font-weight: 700;
  padding: 10rpx 22rpx; border-radius: 6rpx; flex-shrink: 0;
  animation: pulse 2s infinite;
}
.step-copy-btn.copied { background: #5AA050; animation: none; }

.pending-banner {
  margin: 20rpx 28rpx 0;
  background: #FBF8F5; border: 1rpx solid #E8C8A8;
  border-radius: 8rpx; padding: 18rpx 24rpx;
  display: flex; align-items: center; justify-content: space-between;
  border-left: 4rpx solid #D94F3D;
}
.pending-text { font-size: 26rpx; color: #A8402E; flex: 1; }

.notify-banner {
  margin: 20rpx 28rpx 0; background: #fff; border-radius: 8rpx;
  padding: 20rpx 24rpx; display: flex; align-items: center; gap: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(30,26,20,0.1); border-left: 4rpx solid #D94F3D;
  border: 1rpx solid #C8B89A;
}
.n-emoji { font-size: 36rpx; }
.n-body { flex: 1; }
.n-title { font-size: 22rpx; color: #D94F3D; font-weight: 600; display: block; }
.n-text { font-size: 24rpx; color: #3D3526; margin-top: 2rpx; display: block; }
.n-close { font-size: 28rpx; color: #C4A882; }

.ready-banner {
  margin: 20rpx 28rpx 0;
  background: linear-gradient(135deg, #3D3526, #1E1A14);
  border-radius: 8rpx; padding: 24rpx;
  display: flex; align-items: center; gap: 16rpx;
  border: 1rpx solid rgba(196,168,130,0.3);
}
.ready-left { display: flex; align-items: center; gap: 14rpx; flex: 1; overflow: hidden; }
.setup-icon { flex-shrink: 0; display: flex; align-items: center; }
.ready-text-wrap { flex: 1; overflow: hidden; }
.setup-title { font-size: 28rpx; font-weight: 700; color: #F7F4F0; display: block; }
.ready-link-preview { font-size: 20rpx; color: rgba(196,168,130,0.7); margin-top: 6rpx; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ready-copy-btn {
  flex-shrink: 0; background: #1E1A14; color: #F7F4F0;
  font-size: 24rpx; font-weight: 700; padding: 14rpx 24rpx;
  border-radius: 6rpx; white-space: nowrap;
  animation: pulse 2.5s infinite;
}
.ready-copy-btn.copied { background: #5A6A30; animation: none; }
.banner-arrow { font-size: 48rpx; color: rgba(196,168,130,0.6); flex-shrink: 0; }

.section-card {
  margin: 20rpx 28rpx 0; background: #fff; border-radius: 8rpx;
  padding: 28rpx; box-shadow: 0 2rpx 10rpx rgba(30,26,20,0.07);
  border: 1rpx solid #C8B89A;
}
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.section-title { font-size: 28rpx; font-weight: 700; color: #1E1A14; }
.section-more { font-size: 24rpx; color: #A8402E; }

.action-grid { display: flex; gap: 14rpx; margin: 20rpx 28rpx 0; }
.action-item {
  flex: 1; background: #fff; border-radius: 8rpx; padding: 24rpx 10rpx;
  display: flex; flex-direction: column; align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(30,26,20,0.07); border: 1rpx solid #C8B89A;
  transition: transform 0.1s, box-shadow 0.1s;
}
.action-item:active { transform: scale(0.95); box-shadow: none; }
.a-icon-wrap { width: 72rpx; height: 72rpx; border-radius: 8rpx; background: #F0EAE2; display: flex; align-items: center; justify-content: center; margin-bottom: 10rpx; }
.a-emoji { font-size: 36rpx; line-height: 1; }
.a-label { font-size: 19rpx; color: #6B5040; font-weight: 600; white-space: nowrap; }
.a-sub { font-size: 17rpx; color: #C4A882; margin-top: 4rpx; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.pkg-row { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid #E5D8C4; }
.pkg-row:last-child { border-bottom: none; }
.pkg-left { display: flex; align-items: center; gap: 14rpx; }
.pkg-index { width: 40rpx; height: 40rpx; border-radius: 4rpx; background: #F0EAE2; color: #A8402E; font-size: 22rpx; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1rpx solid #C8B89A; }
.pkg-name { font-size: 28rpx; font-weight: 600; color: #1E1A14; display: block; }
.pkg-desc { font-size: 22rpx; color: #8B7355; margin-top: 4rpx; display: block; }
.pkg-price { font-size: 40rpx; font-weight: 800; color: #D94F3D; }

.empty-state { text-align: center; padding: 36rpx 0; }
.empty-text { font-size: 26rpx; color: #8B7355; margin-top: 14rpx; display: block; }
.empty-btn { display: inline-block; margin-top: 18rpx; background: #1E1A14; color: #F7F4F0; font-size: 26rpx; font-weight: 600; padding: 12rpx 32rpx; border-radius: 6rpx; }

.beggar-wrap { display: flex; justify-content: center; margin-bottom: 8rpx; }
.cat-img { width: 320rpx; height: 320rpx; }

.footer-gap { height: 60rpx; }

@keyframes shimmer {
  0% { background-position: -400rpx 0; }
  100% { background-position: 400rpx 0; }
}
.skeleton-wrap { padding: 8rpx 0; }
.skeleton-row { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid #E5D8C4; }
.skeleton-row:last-child { border-bottom: none; }
.skeleton-line { height: 28rpx; border-radius: 4rpx; background: linear-gradient(90deg, #E5D8C4 25%, #F0EAE2 50%, #E5D8C4 75%); background-size: 400rpx 100%; animation: shimmer 1.4s infinite; }
.skeleton-line.short { width: 180rpx; }
.skeleton-price { width: 90rpx; height: 36rpx; border-radius: 4rpx; background: linear-gradient(90deg, #E5D8C4 25%, #F0EAE2 50%, #E5D8C4 75%); background-size: 400rpx 100%; animation: shimmer 1.4s infinite; }
</style>
