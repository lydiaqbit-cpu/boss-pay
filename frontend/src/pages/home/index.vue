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
          <text class="stat-key">🪙 入账银两</text>
        </view>
        <view class="stat-divider"/>
        <view class="stat-col">
          <text class="stat-val pending">{{ pendingCount }}</text>
          <text class="stat-key">⌛ 东家未认</text>
        </view>
        <view class="stat-divider"/>
        <view class="stat-col">
          <text class="stat-val">{{ confirmedCount }}</text>
          <text class="stat-key">👨‍💼 东家出手</text>
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

    <!-- Banner：未设置收款方式 / 已设置则显示复制链接 -->
    <view v-if="!hasPaymentMethod" class="setup-banner" @click="toPaymentSetting">
      <view class="setup-left">
        <view class="setup-icon">
          <svg width="52" height="52" viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="60" cy="100" rx="42" ry="28" fill="#8B6914"/>
            <path d="M18 85 Q18 50 60 45 Q102 50 102 85 L102 100 Q102 128 60 128 Q18 128 18 100Z" fill="#C4A020"/>
            <path d="M22 88 Q22 55 60 50 Q98 55 98 88" fill="#D4B030" opacity="0.4"/>
            <ellipse cx="60" cy="46" rx="28" ry="10" fill="#8B6914"/>
            <ellipse cx="60" cy="43" rx="22" ry="8" fill="#C4A020"/>
            <path d="M38 43 Q60 30 82 43" fill="#A08010" stroke="none"/>
            <path d="M42 40 Q60 22 78 40" fill="none" stroke="#8B6914" stroke-width="3" stroke-linecap="round"/>
            <circle cx="48" cy="26" r="5" fill="#C0392B"/>
            <circle cx="60" cy="20" r="6" fill="#C0392B"/>
            <circle cx="72" cy="26" r="5" fill="#C0392B"/>
            <circle cx="48" cy="26" r="2.5" fill="#FF6B6B"/>
            <circle cx="60" cy="20" r="3" fill="#FF6B6B"/>
            <circle cx="72" cy="26" r="2.5" fill="#FF6B6B"/>
            <text x="60" y="96" text-anchor="middle" font-size="22" font-weight="700" fill="#8B6914" font-family="sans-serif">錢</text>
            <circle cx="38" cy="80" r="5" fill="#E8C040" opacity="0.6"/>
            <circle cx="82" cy="90" r="4" fill="#E8C040" opacity="0.5"/>
            <circle cx="50" cy="110" r="3.5" fill="#E8C040" opacity="0.4"/>
          </svg>
        </view>
        <view>
          <text class="setup-title">老板的钱还在他口袋里！</text>
          <text class="setup-sub">设置收款码，让它乖乖转移到你这来 👉</text>
        </view>
      </view>
      <text class="banner-arrow">›</text>
    </view>

    <view v-else class="ready-banner">
      <view class="ready-left">
        <view class="setup-icon">
          <svg width="52" height="52" viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="60" cy="100" rx="42" ry="28" fill="#8B6914"/>
            <path d="M18 85 Q18 50 60 45 Q102 50 102 85 L102 100 Q102 128 60 128 Q18 128 18 100Z" fill="#C4A020"/>
            <path d="M22 88 Q22 55 60 50 Q98 55 98 88" fill="#D4B030" opacity="0.4"/>
            <ellipse cx="60" cy="46" rx="28" ry="10" fill="#8B6914"/>
            <ellipse cx="60" cy="43" rx="22" ry="8" fill="#C4A020"/>
            <path d="M38 43 Q60 30 82 43" fill="#A08010" stroke="none"/>
            <path d="M42 40 Q60 22 78 40" fill="none" stroke="#8B6914" stroke-width="3" stroke-linecap="round"/>
            <circle cx="48" cy="26" r="5" fill="#C0392B"/>
            <circle cx="60" cy="20" r="6" fill="#C0392B"/>
            <circle cx="72" cy="26" r="5" fill="#C0392B"/>
            <circle cx="48" cy="26" r="2.5" fill="#FF6B6B"/>
            <circle cx="60" cy="20" r="3" fill="#FF6B6B"/>
            <circle cx="72" cy="26" r="2.5" fill="#FF6B6B"/>
            <text x="60" y="96" text-anchor="middle" font-size="22" font-weight="700" fill="#8B6914" font-family="sans-serif">錢</text>
            <circle cx="38" cy="80" r="5" fill="#E8C040" opacity="0.6"/>
            <circle cx="82" cy="90" r="4" fill="#E8C040" opacity="0.5"/>
            <circle cx="50" cy="110" r="3.5" fill="#E8C040" opacity="0.4"/>
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
        <view class="a-icon-wrap"><text class="a-icon">📜</text></view>
        <text class="a-label">卖身价目</text>
        <text class="a-sub">定好价，一字不让</text>
      </view>
      <view class="action-item" @click="toOrders">
        <view class="a-icon-wrap"><text class="a-icon">📖</text></view>
        <text class="a-label">血汗账簿</text>
        <text class="a-sub">每笔都是泪</text>
      </view>
      <view class="action-item" @click="toPaymentSetting">
        <view class="a-icon-wrap"><text class="a-icon">🪙</text></view>
        <text class="a-label">银两去处</text>
        <text class="a-sub">钱往哪打</text>
      </view>
      <view class="action-item" @click="previewCashier">
        <view class="a-icon-wrap"><text class="a-icon">🎭</text></view>
        <text class="a-label">东家视角</text>
        <text class="a-sub">甲方看到啥</text>
      </view>
    </view>

    <!-- 套餐价目表 -->
    <view class="section-card">
      <view class="section-header">
        <text class="section-title">⏰ 加班价目表</text>
        <text class="section-more" @click="toPackages">管理 →</text>
      </view>
      <view v-if="packages.length === 0" class="empty-state">
        <view class="beggar-wrap">
          <svg width="160" height="175" viewBox="0 0 680 540" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="340" cy="160" rx="100" ry="18" fill="#5A4A28"/>
            <path d="M260 160 Q280 120 340 112 Q400 120 420 160Z" fill="#5A4A28"/>
            <path d="M260 160 L248 165 L262 162 L255 170 L270 163" fill="#4A3A18"/>
            <path d="M420 160 L432 165 L418 162 L425 170 L410 163" fill="#4A3A18"/>
            <path d="M305 113 Q340 105 375 113" stroke="#8B6914" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M295 148 Q288 130 292 115" stroke="#2A1A05" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M375 148 Q380 128 378 114" stroke="#2A1A05" stroke-width="3" fill="none" stroke-linecap="round"/>
            <ellipse cx="340" cy="240" rx="88" ry="95" fill="#D4A96A"/>
            <ellipse cx="272" cy="258" rx="22" ry="14" fill="#C07040" opacity="0.3"/>
            <ellipse cx="408" cy="258" rx="22" ry="14" fill="#C07040" opacity="0.3"/>
            <path d="M288 200 Q308 192 322 200" stroke="#2A1A05" stroke-width="4" fill="none" stroke-linecap="round"/>
            <path d="M358 200 Q372 192 392 200" stroke="#2A1A05" stroke-width="4" fill="none" stroke-linecap="round"/>
            <path d="M332 196 Q340 188 348 196" stroke="#2A1A05" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <ellipse cx="308" cy="215" rx="20" ry="14" fill="white"/>
            <ellipse cx="372" cy="215" rx="20" ry="14" fill="white"/>
            <circle cx="308" cy="220" r="9" fill="#1A0A00"/>
            <circle cx="372" cy="220" r="9" fill="#1A0A00"/>
            <circle cx="312" cy="217" r="3" fill="white"/>
            <circle cx="376" cy="217" r="3" fill="white"/>
            <ellipse cx="294" cy="234" rx="4" ry="6" fill="#6AABDF" opacity="0.8"/>
            <ellipse cx="385" cy="236" rx="3.5" ry="5.5" fill="#6AABDF" opacity="0.8"/>
            <ellipse cx="340" cy="244" rx="12" ry="9" fill="#D4A96A"/>
            <ellipse cx="328" cy="248" rx="10" ry="7" fill="#B08040"/>
            <ellipse cx="352" cy="248" rx="10" ry="7" fill="#B08040"/>
            <path d="M312 278 Q325 284 340 280 Q355 284 368 278" stroke="#8B4513" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <path d="M312 278 Q306 290 310 294" stroke="#8B4513" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            <path d="M368 278 Q374 290 370 294" stroke="#8B4513" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            <path d="M252 330 Q270 315 340 308 Q410 315 428 330 L445 490 Q340 510 235 490 Z" fill="#7A6A50"/>
            <rect x="285" y="355" width="50" height="38" rx="3" fill="#6A5840" stroke="#4A3820" stroke-width="1" stroke-dasharray="3,2"/>
            <rect x="348" y="375" width="42" height="32" rx="3" fill="#6A5840" stroke="#4A3820" stroke-width="1" stroke-dasharray="3,2" transform="rotate(-5 369 391)"/>
            <path d="M255 400 Q340 388 425 400" stroke="#8B6914" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M255 350 Q225 380 210 420" stroke="#D4A96A" stroke-width="28" fill="none" stroke-linecap="round"/>
            <path d="M185 420 Q195 450 235 452 Q275 450 272 420 Z" fill="#8B7355" stroke="#5A4A30" stroke-width="2"/>
            <ellipse cx="228" cy="420" rx="45" ry="10" fill="#8B7355" stroke="#5A4A30" stroke-width="2"/>
            <text x="228" y="445" text-anchor="middle" font-size="22" fill="#5A4030" font-family="sans-serif">空</text>
            <path d="M425 355 Q455 390 460 425" stroke="#D4A96A" stroke-width="26" fill="none" stroke-linecap="round"/>
            <ellipse cx="463" cy="432" rx="18" ry="14" fill="#D4A96A"/>
          </svg>
        </view>
        <text class="empty-text">尚未立价，老板正偷着乐呢</text>
        <view class="empty-btn" @click="toPackages">📜 立即定价，要钱要命</view>
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
import { track } from '../../utils/track'

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
  connectWS()
})

onUnmounted(() => { ws?.close() })

async function loadPackages() { try { packages.value = await get<any[]>('/packages') } catch {} }
async function loadOrders() { try { orders.value = await get<any[]>('/pay/orders') } catch {} }
async function loadPaymentInfo() { try { paymentInfo.value = await get<any>('/user/payment') } catch {} }

function connectWS() {
  if (!userStore.userInfo?.id || !userStore.token) return
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
}

function toPackages() { uni.navigateTo({ url: '/pages/packages/index' }) }
function toOrders() { uni.switchTab({ url: '/pages/orders/index' }) }
function toPaymentSetting() { uni.navigateTo({ url: '/pages/profile/payment' }) }
function copyLink() {
  uni.setClipboardData({ data: payLink.value, success: () => { copied.value = true; setTimeout(() => { copied.value = false }, 2000) } })
  track('copy_pay_link')
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
.avatar-img { width: 88rpx; height: 88rpx; border-radius: 44rpx; }
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
.stat-key { font-size: 19rpx; color: rgba(196,168,130,0.7); margin-top: 4rpx; display: block; white-space: nowrap; }
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
.setup-icon { flex-shrink: 0; display: flex; align-items: center; }
.setup-title { font-size: 28rpx; font-weight: 700; color: #F2EBE0; display: block; }
.setup-sub { font-size: 22rpx; color: rgba(196,168,130,0.85); margin-top: 6rpx; display: block; }
.banner-arrow { font-size: 48rpx; color: rgba(196,168,130,0.6); flex-shrink: 0; }

.ready-banner {
  margin: 20rpx 28rpx 0;
  background: linear-gradient(135deg, #3D3526, #1E1A14);
  border-radius: 8rpx; padding: 24rpx;
  display: flex; align-items: center; gap: 16rpx;
  border: 1rpx solid rgba(196,168,130,0.3);
}
.ready-left { display: flex; align-items: center; gap: 14rpx; flex: 1; overflow: hidden; }
.ready-text-wrap { flex: 1; overflow: hidden; }
.ready-link-preview { font-size: 20rpx; color: rgba(196,168,130,0.7); margin-top: 6rpx; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ready-copy-btn {
  flex-shrink: 0; background: #C0392B; color: #F2EBE0;
  font-size: 24rpx; font-weight: 700; padding: 14rpx 24rpx;
  border-radius: 6rpx; white-space: nowrap;
  animation: pulse 2.5s infinite;
}
.ready-copy-btn.copied { background: #5A6A30; animation: none; }

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
.a-label { font-size: 19rpx; color: #6B5040; font-weight: 600; white-space: nowrap; }
.a-sub { font-size: 17rpx; color: #C4A882; margin-top: 4rpx; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.pkg-row { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid #EDE0CC; }
.pkg-row:last-child { border-bottom: none; }
.pkg-left { display: flex; align-items: center; gap: 14rpx; }
.pkg-index { width: 40rpx; height: 40rpx; border-radius: 4rpx; background: #F5EDE0; color: #8B3A2A; font-size: 22rpx; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1rpx solid #D4C4A8; }
.pkg-name { font-size: 28rpx; font-weight: 600; color: #1E1A14; display: block; }
.pkg-desc { font-size: 22rpx; color: #8B7355; margin-top: 4rpx; display: block; }
.pkg-price { font-size: 32rpx; font-weight: 700; color: #C0392B; }

.empty-state { text-align: center; padding: 36rpx 0; }
.empty-text { font-size: 26rpx; color: #8B7355; margin-top: 14rpx; display: block; }
.empty-btn { display: inline-block; margin-top: 18rpx; background: #1E1A14; color: #F2EBE0; font-size: 26rpx; font-weight: 600; padding: 12rpx 32rpx; border-radius: 6rpx; }

.beggar-wrap { display: flex; justify-content: center; margin-bottom: 8rpx; }

.footer-gap { height: 60rpx; }
</style>
