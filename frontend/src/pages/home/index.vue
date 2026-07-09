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
          <svg width="52" height="52" viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="60" cy="100" rx="42" ry="28" fill="#8B6914"/>
            <path d="M18 85 Q18 50 60 45 Q102 50 102 85 L102 100 Q102 128 60 128 Q18 128 18 100Z" fill="#C4A020"/>
            <path d="M22 88 Q22 55 60 50 Q98 55 98 88" fill="#D4B030" opacity="0.4"/>
            <ellipse cx="60" cy="46" rx="28" ry="10" fill="#8B6914"/>
            <ellipse cx="60" cy="43" rx="22" ry="8" fill="#C4A020"/>
            <path d="M38 43 Q60 30 82 43" fill="#A08010" stroke="none"/>
            <path d="M42 40 Q60 22 78 40" fill="none" stroke="#8B6914" stroke-width="3" stroke-linecap="round"/>
            <circle cx="48" cy="26" r="5" fill="#D94F3D"/>
            <circle cx="60" cy="20" r="6" fill="#D94F3D"/>
            <circle cx="72" cy="26" r="5" fill="#D94F3D"/>
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
        <view class="a-icon-wrap">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="5" width="16" height="2.5" rx="1.2" fill="#8B6040" opacity="0.4"/>
            <rect x="8" y="24.5" width="16" height="2.5" rx="1.2" fill="#8B6040" opacity="0.4"/>
            <line x1="11.5" y1="7.5" x2="11.5" y2="24.5" stroke="#8B6040" stroke-width="2" stroke-linecap="round"/>
            <line x1="16" y1="7.5" x2="16" y2="24.5" stroke="#8B6040" stroke-width="2" stroke-linecap="round"/>
            <line x1="20.5" y1="7.5" x2="20.5" y2="24.5" stroke="#8B6040" stroke-width="2" stroke-linecap="round"/>
            <line x1="8" y1="13.5" x2="24" y2="13.5" stroke="#A8402E" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="8" y1="18.5" x2="24" y2="18.5" stroke="#A8402E" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </view>
        <text class="a-label">加班套餐</text>
        <text class="a-sub">定好价，一字不让</text>
      </view>
      <view class="action-item" @click="toOrders">
        <view class="a-icon-wrap">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="7" y="5" width="3" height="22" rx="1.5" fill="#8B6040" opacity="0.35"/>
            <rect x="10" y="5" width="15" height="22" rx="1" stroke="#8B6040" stroke-width="1.8"/>
            <line x1="13" y1="11" x2="22" y2="11" stroke="#8B6040" stroke-width="1.4" stroke-linecap="round"/>
            <line x1="13" y1="15" x2="22" y2="15" stroke="#8B6040" stroke-width="1.4" stroke-linecap="round"/>
            <line x1="13" y1="19" x2="19" y2="19" stroke="#8B6040" stroke-width="1.4" stroke-linecap="round"/>
            <circle cx="20.5" cy="22" r="2.5" stroke="#A8402E" stroke-width="1.4"/>
            <line x1="20.5" y1="19.8" x2="20.5" y2="24.2" stroke="#A8402E" stroke-width="0.9" stroke-linecap="round"/>
            <line x1="18.3" y1="22" x2="22.7" y2="22" stroke="#A8402E" stroke-width="0.9" stroke-linecap="round"/>
          </svg>
        </view>
        <text class="a-label">收款记录</text>
        <text class="a-sub">每笔都是泪</text>
      </view>
      <view class="action-item" @click="toPaymentSetting">
        <view class="a-icon-wrap">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="11" stroke="#8B6040" stroke-width="1.8"/>
            <rect x="13" y="13" width="6" height="6" rx="0.5" stroke="#A8402E" stroke-width="1.6"/>
            <line x1="16" y1="4" x2="16" y2="7" stroke="#8B6040" stroke-width="1.4" stroke-linecap="round"/>
            <line x1="16" y1="25" x2="16" y2="28" stroke="#8B6040" stroke-width="1.4" stroke-linecap="round"/>
            <line x1="4" y1="16" x2="7" y2="16" stroke="#8B6040" stroke-width="1.4" stroke-linecap="round"/>
            <line x1="25" y1="16" x2="28" y2="16" stroke="#8B6040" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
        </view>
        <text class="a-label">收款方式</text>
        <text class="a-sub">钱往哪打</text>
      </view>
      <view class="action-item" @click="previewCashier">
        <view class="a-icon-wrap">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 16 Q10 7 16 7 Q22 7 29 16 Q22 25 16 25 Q10 25 3 16Z" stroke="#8B6040" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="16" cy="16" r="4.5" stroke="#8B6040" stroke-width="1.6"/>
            <circle cx="16" cy="16" r="2" fill="#A8402E"/>
            <line x1="10.5" y1="8.5" x2="9.5" y2="6.5" stroke="#8B6040" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="16" y1="7" x2="16" y2="5" stroke="#8B6040" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="21.5" y1="8.5" x2="22.5" y2="6.5" stroke="#8B6040" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </view>
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
      <view v-if="packages.length === 0" class="empty-state">
        <view class="beggar-wrap">
          <svg width="160" height="175" viewBox="0 0 680 540" xmlns="http://www.w3.org/2000/svg">
            <!-- shirt body -->
            <path d="M218 318 Q234 300 274 290 L316 280 L340 304 L364 280 L406 290 Q446 300 462 318 L474 510 Q340 526 206 510 Z" fill="#5B7A8F"/>
            <!-- collar -->
            <path d="M316 280 L340 315 L364 280 L340 288 Z" fill="#4A6A7E"/>
            <path d="M276 292 L316 280 L340 315 L314 310 Z" fill="#EBF0F5"/>
            <path d="M404 292 L364 280 L340 315 L366 310 Z" fill="#EBF0F5"/>
            <circle cx="340" cy="340" r="5" fill="#4A6A7E"/>
            <circle cx="340" cy="365" r="5" fill="#4A6A7E"/>
            <circle cx="340" cy="390" r="5" fill="#4A6A7E"/>
            <!-- left arm shrug -->
            <path d="M220 334 Q183 348 168 382 Q158 405 164 424" stroke="#D4A96A" stroke-width="42" fill="none" stroke-linecap="round"/>
            <!-- left hand palm up -->
            <path d="M134 445 Q140 412 162 408 Q184 408 192 424 Q198 440 186 452 Q166 462 148 456 Q134 452 134 445Z" fill="#D4A96A"/>
            <!-- right arm shrug -->
            <path d="M460 334 Q497 348 512 382 Q522 405 516 424" stroke="#D4A96A" stroke-width="42" fill="none" stroke-linecap="round"/>
            <!-- right hand palm up -->
            <path d="M546 445 Q540 412 518 408 Q496 408 488 424 Q482 440 494 452 Q514 462 532 456 Q546 452 546 445Z" fill="#D4A96A"/>
            <!-- neck -->
            <rect x="316" y="274" width="48" height="28" rx="5" fill="#D4A96A"/>
            <!-- head -->
            <ellipse cx="340" cy="200" rx="85" ry="90" fill="#D4A96A"/>
            <!-- ears -->
            <ellipse cx="255" cy="208" rx="14" ry="17" fill="#D4A96A"/>
            <ellipse cx="425" cy="208" rx="14" ry="17" fill="#D4A96A"/>
            <!-- hair cap modern short -->
            <path d="M257 188 Q263 118 340 106 Q417 118 423 188 Q410 148 340 138 Q270 148 257 188 Z" fill="#2A1A08"/>
            <path d="M257 188 Q252 162 258 140 Q264 118 276 108" stroke="#2A1A08" stroke-width="22" fill="none" stroke-linecap="round"/>
            <path d="M423 188 Q428 162 422 140 Q416 118 404 108" stroke="#2A1A08" stroke-width="22" fill="none" stroke-linecap="round"/>
            <!-- eyes -->
            <ellipse cx="306" cy="198" rx="20" ry="15" fill="white"/>
            <circle cx="309" cy="201" r="9" fill="#1A0A00"/>
            <circle cx="313" cy="197" r="3.5" fill="white"/>
            <ellipse cx="374" cy="198" rx="20" ry="15" fill="white"/>
            <circle cx="377" cy="201" r="9" fill="#1A0A00"/>
            <circle cx="381" cy="197" r="3.5" fill="white"/>
            <!-- tired eyelids -->
            <path d="M286 194 Q306 188 326 194" fill="#D4A96A"/>
            <path d="M354 194 Q374 188 394 194" fill="#D4A96A"/>
            <!-- frustrated eyebrows (angled down at inner edge) -->
            <path d="M286 181 Q306 175 324 179" stroke="#2A1A08" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M356 179 Q374 175 394 181" stroke="#2A1A08" stroke-width="5" fill="none" stroke-linecap="round"/>
            <!-- nose -->
            <path d="M331 217 Q337 226 348 224" stroke="#B07040" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <!-- resigned flat mouth -->
            <path d="M318 247 Q340 242 362 247" stroke="#8B4513" stroke-width="3" fill="none" stroke-linecap="round"/>
            <!-- blush -->
            <ellipse cx="284" cy="228" rx="16" ry="10" fill="#D4857A" opacity="0.26"/>
            <ellipse cx="396" cy="228" rx="16" ry="10" fill="#D4857A" opacity="0.26"/>
            <!-- sweat drops -->
            <path d="M440 132 Q445 124 440 116 Q435 124 440 132Z" fill="#87CEEB" opacity="0.75"/>
            <path d="M242 137 Q237 129 242 121 Q247 129 242 137Z" fill="#87CEEB" opacity="0.65"/>
            <!-- stress × marks -->
            <path d="M457 97 L465 105 M465 97 L457 105" stroke="#A8402E" stroke-width="4" stroke-linecap="round" opacity="0.65"/>
            <path d="M218 102 L226 110 M226 102 L218 110" stroke="#A8402E" stroke-width="3.5" stroke-linecap="round" opacity="0.55"/>
          </svg>
        </view>
        <text class="empty-text">尚未立价，老板正偷着乐呢</text>
        <view class="empty-btn" @click="toPackages">立即定价，要钱要命</view>
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
  background: #D94F3D; color: #fff; font-size: 24rpx; font-weight: 700;
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
  flex-shrink: 0; background: #D94F3D; color: #F7F4F0;
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
}
.a-icon-wrap { width: 72rpx; height: 72rpx; border-radius: 8rpx; background: #F0EAE2; display: flex; align-items: center; justify-content: center; margin-bottom: 10rpx; }
.a-label { font-size: 19rpx; color: #6B5040; font-weight: 600; white-space: nowrap; }
.a-sub { font-size: 17rpx; color: #C4A882; margin-top: 4rpx; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.pkg-row { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid #E5D8C4; }
.pkg-row:last-child { border-bottom: none; }
.pkg-left { display: flex; align-items: center; gap: 14rpx; }
.pkg-index { width: 40rpx; height: 40rpx; border-radius: 4rpx; background: #F0EAE2; color: #A8402E; font-size: 22rpx; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1rpx solid #C8B89A; }
.pkg-name { font-size: 28rpx; font-weight: 600; color: #1E1A14; display: block; }
.pkg-desc { font-size: 22rpx; color: #8B7355; margin-top: 4rpx; display: block; }
.pkg-price { font-size: 32rpx; font-weight: 700; color: #D94F3D; }

.empty-state { text-align: center; padding: 36rpx 0; }
.empty-text { font-size: 26rpx; color: #8B7355; margin-top: 14rpx; display: block; }
.empty-btn { display: inline-block; margin-top: 18rpx; background: #1E1A14; color: #F7F4F0; font-size: 26rpx; font-weight: 600; padding: 12rpx 32rpx; border-radius: 6rpx; }

.beggar-wrap { display: flex; justify-content: center; margin-bottom: 8rpx; }

.footer-gap { height: 60rpx; }
</style>
