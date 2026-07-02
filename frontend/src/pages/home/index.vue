<template>
  <view class="page">
    <!-- 浮动金钱动画 -->
    <view
      v-for="burst in moneyBursts"
      :key="burst.id"
      class="money-float"
      :style="{ left: burst.x + 'px', top: burst.y + 'px' }"
    >💰</view>

    <!-- ── Header 渐变卡片 ── -->
    <view class="header-card">
      <view class="header-top">
        <view class="app-name-row">
          <image class="header-logo" src="/static/logo.svg" mode="aspectFit"/>
          <text class="app-name">老板请付牛马钱</text>
        </view>
        <text class="logout-btn" @click="handleLogout">退出</text>
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

      <!-- 余额卡 -->
      <view class="balance-panel">
        <view class="balance-left">
          <text class="balance-label">老板已上交</text>
          <view class="balance-row">
            <text class="balance-unit">¥</text>
            <text class="balance-value" :class="{ 'balance-pop': balancePopped }">{{ displayBalance }}</text>
          </view>
          <text class="balance-sub">已扣除平台 5% 管理费</text>
        </view>
        <view class="withdraw-btn" @click="handleWithdraw">
          <image class="withdraw-btn-monk" src="/static/cashout.svg" mode="aspectFit"/>
          <text class="withdraw-btn-text">立即提取牛马钱</text>
          <text class="withdraw-btn-arrow">›</text>
        </view>
      </view>

    </view>

    <!-- 到账通知 -->
    <view v-if="latestNotify" class="notify-banner" @click="latestNotify = null">
      <text class="n-emoji">🎉</text>
      <view class="n-body">
        <text class="n-title">收到款项</text>
        <text class="n-text">{{ latestNotify }}</text>
      </view>
      <text class="n-close">✕</text>
    </view>

    <!-- 收款链接 -->
    <view class="section-card link-card">
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
      <view class="action-item" style="animation-delay:0.05s" @click="toPackages">
        <view class="a-icon-wrap a-blue">
          <text class="a-icon">📦</text>
        </view>
        <text class="a-label">定价套餐</text>
      </view>
      <view class="action-item" style="animation-delay:0.1s" @click="toOrders">
        <view class="a-icon-wrap a-green">
          <text class="a-icon">🧾</text>
        </view>
        <text class="a-label">收款记录</text>
      </view>
      <view class="action-item" style="animation-delay:0.15s" @click="sharePayLink">
        <view class="a-icon-wrap a-orange">
          <text class="a-icon">📤</text>
        </view>
        <text class="a-label">催款</text>
      </view>
      <view class="action-item" style="animation-delay:0.2s" @click="previewCashier">
        <view class="a-icon-wrap a-purple">
          <text class="a-icon">👁️</text>
        </view>
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
const latestNotify = ref<string | null>(null)
const displayBalance = ref('0.00')
const balancePopped = ref(false)
const copied = ref(false)
let ws: UniApp.SocketTask | null = null

interface MoneyBurst { id: number; x: number; y: number }
const moneyBursts = ref<MoneyBurst[]>([])
let burstId = 0

const avatarChar = computed(() => {
  const name = userStore.userInfo?.nickname || '工'
  return name.charAt(0)
})

const balance = computed(() =>
  (userStore.userInfo?.balance ?? 0)
)

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

function animateBalance(target: number) {
  const duration = 1200
  const start = Date.now()
  const from = 0
  const timer = setInterval(() => {
    const t = Math.min((Date.now() - start) / duration, 1)
    const ease = 1 - Math.pow(1 - t, 3)
    displayBalance.value = (from + (target - from) * ease).toFixed(2)
    if (t >= 1) clearInterval(timer)
  }, 16)
}

function triggerMoneyBurst() {
  const x = 100 + Math.random() * 150
  const y = 200 + Math.random() * 100
  const id = burstId++
  moneyBursts.value.push({ id, x, y })
  setTimeout(() => {
    moneyBursts.value = moneyBursts.value.filter(b => b.id !== id)
  }, 1600)
  // Spawn a few more with slight delay
  for (let i = 1; i <= 3; i++) {
    setTimeout(() => {
      const bid = burstId++
      moneyBursts.value.push({
        id: bid,
        x: 80 + Math.random() * 220,
        y: 180 + Math.random() * 140
      })
      setTimeout(() => {
        moneyBursts.value = moneyBursts.value.filter(b => b.id !== bid)
      }, 1600)
    }, i * 120)
  }
}

onMounted(async () => {
  await userStore.fetchMe()
  await loadPackages()
  animateBalance(balance.value)
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
        balancePopped.value = false
        setTimeout(() => { balancePopped.value = true }, 50)
        animateBalance(balance.value)
        triggerMoneyBurst()
        uni.vibrateShort({})
      }
    } catch {}
  })
}

function toPackages() { uni.navigateTo({ url: '/pages/packages/index' }) }
function toOrders() { uni.switchTab({ url: '/pages/orders/index' }) }

function copyLink() {
  uni.setClipboardData({
    data: payLink.value,
    success: () => {
      copied.value = true
      setTimeout(() => { copied.value = false }, 2000)
    }
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
    title: '提取辛苦费',
    content: `老板已上交 ¥${balance.value.toFixed(2)}，接入微信商户号后即可秒到账～`,
    showCancel: false,
    confirmText: '好嘞，等着'
  })
}

onShareAppMessage(() => ({
  title: `${userStore.userInfo?.nickname || '打工人'} 请老板扫码付加班费 💰`,
  path: `/pages/pay/cashier?userId=${userStore.userInfo?.id || ''}`,
}))

function handleLogout() {
  uni.showModal({
    title: '真的要退出？',
    content: '退出后就看不到老板有没有付钱了哦',
    cancelText: '再等等',
    confirmText: '退出',
    success: (res) => { if (res.confirm) userStore.logout() }
  })
}
</script>

<style lang="scss">
page { background: #F5EAD8; }
.page { min-height: 100vh; padding-bottom: 40rpx; position: relative; overflow: hidden; }

/* ── 浮动金钱 ── */
.money-float {
  position: fixed;
  font-size: 48rpx;
  pointer-events: none;
  z-index: 9999;
  animation: floatMoney 1.5s ease-out forwards;
}

/* ── Header ── */
.header-card {
  background: linear-gradient(160deg, #3D2010 0%, #5C3218 60%, #3D2010 100%);
  padding: 64rpx 36rpx 36rpx;
  border-radius: 0 0 48rpx 48rpx;
  box-shadow: 0 16rpx 48rpx rgba(180, 110, 40, 0.35);
  animation: slideUp 0.5s ease-out;
}
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 36rpx;
  .app-name-row { display: flex; align-items: center; gap: 14rpx; }
  .header-logo { width: 52rpx; height: 52rpx; border-radius: 12rpx; }
  .app-name { font-size: 30rpx; font-weight: 800; color: #fff; letter-spacing: 2rpx; }
  .logout-btn { font-size: 24rpx; color: rgba(255,255,255,0.55); }
}
.user-row {
  display: flex;
  align-items: center;
  margin-bottom: 32rpx;
}
.avatar-wrap {
  width: 92rpx; height: 92rpx;
  border-radius: 46rpx;
  background: rgba(255,255,255,0.2);
  border: 2rpx solid rgba(255,255,255,0.35);
  display: flex; align-items: center; justify-content: center;
  margin-right: 22rpx; flex-shrink: 0;
  .avatar-text { font-size: 40rpx; font-weight: 700; color: #fff; }
}
.user-text {
  flex: 1; min-width: 0;
  .nickname { font-size: 34rpx; font-weight: 700; color: #fff; display: block; margin-bottom: 10rpx; }
  .bio-row { display: flex; align-items: center; gap: 10rpx; }
  .bio { font-size: 22rpx; color: rgba(255,255,255,0.6); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}
.work-badge {
  display: flex; align-items: center; gap: 6rpx;
  background: rgba(74,222,128,0.2); border: 1rpx solid rgba(74,222,128,0.4);
  padding: 4rpx 12rpx; border-radius: 20rpx; flex-shrink: 0;
  .work-badge-dot { display: block; width: 10rpx; height: 10rpx; border-radius: 5rpx; background: #4ADE80; }
  .work-badge-text { font-size: 18rpx; color: #4ADE80; font-weight: 600; }
}

/* 余额面板 */
.balance-panel {
  background: rgba(255,255,255,0.15);
  border: 1rpx solid rgba(255,255,255,0.2);
  border-radius: 24rpx;
  padding: 28rpx 32rpx;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
  margin-bottom: 0;
  .balance-label { font-size: 22rpx; color: rgba(255,255,255,0.7); display: block; margin-bottom: 8rpx; }
  .balance-row { display: flex; align-items: baseline; gap: 6rpx; }
  .balance-unit { font-size: 28rpx; font-weight: 600; color: rgba(255,255,255,0.9); }
  .balance-value {
    font-size: 60rpx; font-weight: 800; color: #fff;
    display: block;
    transition: all 0.3s;
    &.balance-pop { animation: balancePop 0.5s ease-out; }
  }
  .balance-sub { font-size: 18rpx; color: rgba(255,255,255,0.45); margin-top: 6rpx; display: block; }
}
.balance-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24rpx;
}
.monk-img { width: 80rpx; height: 80rpx; flex-shrink: 0; opacity: 0.9; }
.balance-top { display: none; }
.monk-img { display: none; }
.withdraw-btn {
  width: 100%;
  height: 84rpx;
  background: linear-gradient(135deg, #C9883D 0%, #B8772A 100%);
  border-radius: 42rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  box-shadow: 0 6rpx 20rpx rgba(180,110,40,0.45);
  margin-top: 24rpx;
}
.withdraw-btn-monk { width: 40rpx; height: 40rpx; flex-shrink: 0; }
.withdraw-btn-text { font-size: 28rpx; font-weight: 800; color: #fff; white-space: nowrap; }
.withdraw-btn-arrow { font-size: 30rpx; color: rgba(255,255,255,0.75); line-height: 1; flex-shrink: 0; }

/* ── 通知 ── */
.notify-banner {
  margin: 20rpx 28rpx 0;
  background: #fff;
  border-radius: 18rpx;
  padding: 20rpx 24rpx;
  display: flex; align-items: center; gap: 16rpx;
  box-shadow: 0 4rpx 24rpx rgba(5, 150, 105, 0.15);
  border-left: 6rpx solid #C9883D;
  animation: notifySlide 0.4s ease-out;
  .n-emoji { font-size: 36rpx; flex-shrink: 0; }
  .n-body { flex: 1;
    .n-title { font-size: 22rpx; color: #C9883D; font-weight: 600; display: block; }
    .n-text { font-size: 24rpx; color: #374151; margin-top: 2rpx; display: block; }
  }
  .n-close { font-size: 28rpx; color: #C4A888; }
}

/* ── 公共卡片 ── */
.section-card {
  margin: 24rpx 28rpx 0;
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx 28rpx 20rpx;
  box-shadow: 0 2rpx 16rpx rgba(180, 110, 40, 0.07);
  animation: slideUp 0.6s ease-out;
}
.section-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx;
  .section-title { font-size: 28rpx; font-weight: 700; color: #1C1208; }
  .section-more { font-size: 24rpx; color: #C9883D; }
}

/* ── 收款链接卡 ── */
.link-card { animation-delay: 0.1s; }
.link-header {
  display: flex; align-items: center; gap: 14rpx; margin-bottom: 16rpx;
  .link-title { font-size: 28rpx; font-weight: 700; color: #1C1208; }
  .link-tip-badge {
    background: #EFE0C8; color: #C9883D;
    font-size: 20rpx; font-weight: 600;
    padding: 4rpx 14rpx; border-radius: 20rpx;
  }
}
.link-url {
  display: block; font-size: 22rpx; color: #8A6A50;
  word-break: break-all; line-height: 1.6;
  background: #F9F2E8; border-radius: 12rpx;
  padding: 16rpx 18rpx; margin-bottom: 20rpx;
  border: 1rpx solid #E8C89A;
}
.copy-btn {
  width: 100%; height: 88rpx;
  background: linear-gradient(135deg, #C9883D 0%, #B8772A 100%);
  color: #fff; border-radius: 44rpx;
  font-size: 28rpx; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6rpx 24rpx rgba(180, 110, 40, 0.35);
  transition: all 0.3s;
  animation: pulse 2.5s infinite;
  &.copied {
    background: linear-gradient(135deg, #16A34A 0%, #22C55E 100%);
    animation: none;
    box-shadow: 0 6rpx 24rpx rgba(5, 150, 105, 0.35);
  }
}

/* ── 快捷操作 ── */
.action-grid {
  display: flex; gap: 16rpx;
  margin: 24rpx 28rpx 0;
}
.action-item {
  flex: 1;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx 10rpx;
  display: flex; flex-direction: column; align-items: center;
  box-shadow: 0 2rpx 12rpx rgba(180, 110, 40, 0.07);
  animation: slideUp 0.6s ease-out both;
}
.a-icon-wrap {
  width: 80rpx; height: 80rpx; border-radius: 22rpx;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 12rpx;
  .a-icon { font-size: 38rpx; }
}
.a-blue   { background: #EFE0C8; }
.a-green  { background: #EFE0C8; }
.a-orange { background: #EAD8C0; }
.a-purple { background: #EFE0C8; }
.a-label { font-size: 22rpx; color: #6A4E38; font-weight: 500; }

/* ── 套餐行 ── */
.pkg-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 22rpx 0;
  border-bottom: 1rpx solid #F3F4F6;
  &:last-child { border-bottom: none; }
}
.pkg-left {
  display: flex; align-items: center; gap: 16rpx;
  .pkg-index {
    width: 44rpx; height: 44rpx; border-radius: 22rpx;
    background: #EFE0C8; color: #C9883D;
    font-size: 22rpx; font-weight: 700;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .pkg-name { font-size: 28rpx; font-weight: 600; color: #1C1208; display: block; }
  .pkg-desc { font-size: 22rpx; color: #8A6A50; margin-top: 4rpx; display: block; }
}
.pkg-price { font-size: 32rpx; font-weight: 700; color: #16A34A; }

/* ── 空状态 ── */
.empty-state {
  text-align: center; padding: 40rpx 0;
  .empty-emoji { font-size: 60rpx; display: block; }
  .empty-text { font-size: 26rpx; color: #8A6A50; margin-top: 16rpx; display: block; }
}
.empty-btn {
  display: inline-block; margin-top: 20rpx;
  background: #EFE0C8; color: #C9883D;
  font-size: 26rpx; font-weight: 600;
  padding: 14rpx 36rpx; border-radius: 40rpx;
}

.footer-gap { height: 60rpx; }
</style>
