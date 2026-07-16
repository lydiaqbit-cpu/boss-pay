<template>
  <view class="page">

    <!-- 顶部收银台头 -->
    <view class="cashier-header">
      <view class="shop-info">
        <image v-if="pageData.user?.avatar" :src="pageData.user.avatar" class="shop-avatar" mode="aspectFill"/>
        <view v-else class="shop-avatar-placeholder"><text>{{ pageData.user?.nickname?.[0] }}</text></view>
        <view>
          <text class="shop-name">{{ pageData.user?.nickname }} 的收银台</text>
          <text class="shop-sub">{{ pageData.user?.bio || '加班费专属收款' }}</text>
        </view>
      </view>
    </view>

    <!-- 金额展示区（选了套餐才出现） -->
    <view class="amount-panel" :class="{ 'has-amount': !!selectedId }">
      <text class="amount-label">{{ selectedId ? '本次应付' : '请选择套餐' }}</text>
      <view class="amount-row">
        <text class="amount-currency">¥</text>
        <text class="amount-value">{{ selectedPkg?.price ?? '--' }}</text>
      </view>
      <text v-if="selectedPkg" class="amount-pkg-name">{{ selectedPkg.name }}</text>
    </view>

    <!-- 套餐选择 -->
    <view class="pkg-list">
      <view
        v-for="pkg in displayPackages"
        :key="pkg.id"
        class="pkg-item"
        :class="{ selected: selectedId === pkg.id, locked: !!lockedPackageId }"
        @click="!lockedPackageId && (selectedId = pkg.id)"
      >
        <view class="pkg-item-left">
          <view class="pkg-radio" :class="{ checked: selectedId === pkg.id }">
            <view v-if="selectedId === pkg.id" class="pkg-radio-dot"/>
          </view>
          <view>
            <text class="pkg-item-name">{{ pkg.name }}</text>
            <text class="pkg-item-desc">{{ pkg.description || `加班 ${pkg.hours}h` }}</text>
          </view>
        </view>
        <text class="pkg-item-price">¥{{ pkg.price }}</text>
      </view>
    </view>

    <!-- 支付方式区 -->
    <view v-if="selectedId && hasPayment" class="pay-panel">
      <view class="pay-panel-header">
        <text class="pay-panel-title">{{ availableTabs.length > 1 ? '选择付款方式' : '扫码付款' }}</text>
      </view>

      <!-- 只有多种方式时才显示 tab -->
      <view v-if="availableTabs.length > 1" class="method-tabs">
        <view
          v-for="tab in availableTabs"
          :key="tab.key"
          class="method-tab"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <text class="method-tab-icon">{{ tab.icon }}</text>
          <text class="method-tab-label">{{ tab.label }}</text>
          <view v-if="tab.isDefault" class="default-tag">默认</view>
        </view>
      </view>

      <!-- 收款码加载中 -->
      <view v-if="qrLoading" class="qr-loading"><text>收款码加载中…</text></view>

      <!-- 微信收款码 -->
      <view v-if="!qrLoading && qrData.wechatQrUrl && (activeTab === 'wechat' || availableTabs.length === 1)" class="qr-panel">
        <view class="qr-label-row" v-if="availableTabs.length === 1">
          <text class="qr-method-label">💚 微信扫码付款</text>
        </view>
        <view class="qr-box">
          <image :src="qrData.wechatQrUrl" class="qr-img" mode="aspectFit"/>
        </view>
        <text class="scan-tip">📱 长按识别二维码扫码付款</text>
        <text class="humor-tip">转账备注"{{ selectedPkg?.name }}"，老板有情有义 😇</text>
      </view>

      <!-- 支付宝收款码 -->
      <view v-if="!qrLoading && qrData.alipayQrUrl && (activeTab === 'alipay' || availableTabs.length === 1)" class="qr-panel">
        <view class="qr-label-row" v-if="availableTabs.length === 1">
          <text class="qr-method-label">💙 支付宝扫码付款</text>
        </view>
        <view class="qr-box">
          <image :src="qrData.alipayQrUrl" class="qr-img" mode="aspectFit"/>
        </view>
        <text class="scan-tip">📱 长按识别二维码扫码付款</text>
        <text class="humor-tip">转账备注"{{ selectedPkg?.name }}"，老板仁义 💙</text>
      </view>

      <!-- 老板填写 -->
      <view class="payer-row-wrap">
        <input v-model="payerName" class="payer-input" placeholder="老板，留个大名吧（必填）" placeholder-class="ph"/>
        <input v-model="payerNote" class="payer-input note" placeholder="备注（可选）" placeholder-class="ph"/>
      </view>

    </view>

    <!-- 固定底部按钮 -->
    <view v-if="selectedId && hasPayment" class="bottom-bar">
      <button class="btn-paid" :loading="submitting" :disabled="submitting" @click="handleBossPaid">
        ✅ 已转账，通知收款方确认
      </button>
      <text class="paid-tip">对方确认收款后，双方均可查看凭证</text>
    </view>

    <view v-if="selectedId && !hasPayment" class="no-payment">
      <text class="no-icon">😅</text>
      <text class="no-text">对方还没设置收款方式，让 TA 先去设置一下</text>
    </view>

    <view v-if="!pageData.user" class="loading"><text>加载中...</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { track } from '../../utils/track'

const userId = ref('')
const lockedPackageId = ref('')
const pageData = ref<any>({ user: null, packages: [] })
const qrData = ref<any>({ wechatQrUrl: '', alipayQrUrl: '' })
const qrLoading = ref(false)
const selectedId = ref('')
const payerName = ref('')
const payerNote = ref('')
const activeTab = ref('')
const submitting = ref(false)

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// #ifdef MP-WEIXIN
onLoad((options: any) => {
  userId.value = options?.userId || ''
  lockedPackageId.value = options?.packageId || ''
})
// #endif

onMounted(async () => {
  // #ifdef H5
  const hash = location.hash || ''
  const qIndex = hash.indexOf('?')
  const params = new URLSearchParams(qIndex >= 0 ? hash.slice(qIndex + 1) : location.search)
  userId.value = params.get('userId') || ''
  lockedPackageId.value = params.get('packageId') || ''
  // #endif

  const uid = userId.value
  if (!uid) return
  try {
    const json = await new Promise<any>((resolve, reject) =>
      uni.request({ url: `${API_BASE}/pay/page/${uid}`, method: 'GET', success: r => resolve(r.data), fail: reject })
    )
    if (json.code === 0) {
      pageData.value = json.data
      if (lockedPackageId.value) selectedId.value = lockedPackageId.value
      initTab(json.data.user)
      // 主数据加载完后，异步拉取 QR 图片（体积大，单独请求）
      loadQr(uid)
    } else {
      uni.showToast({ title: json.message || '加载失败', icon: 'none' })
    }
  } catch (e) {
    console.error('[cashier] load failed', e)
    uni.showToast({ title: '网络异常，请刷新重试', icon: 'none' })
  }
})

async function loadQr(uid: string) {
  qrLoading.value = true
  try {
    const json = await new Promise<any>((resolve, reject) =>
      uni.request({ url: `${API_BASE}/pay/qr/${uid}`, method: 'GET', success: r => resolve(r.data), fail: reject })
    )
    if (json.code === 0) qrData.value = json.data
  } catch {} finally {
    qrLoading.value = false
  }
}

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.switchTab({ url: '/pages/home/index' })
  }
}

function initTab(u: any) {
  if (!u) return
  const def = u.defaultPaymentMethod
  if (def === 'wechat' && u.hasWechat) { activeTab.value = 'wechat'; return }
  if (def === 'alipay' && u.hasAlipay) { activeTab.value = 'alipay'; return }
  if (u.hasWechat) activeTab.value = 'wechat'
  else if (u.hasAlipay) activeTab.value = 'alipay'
}

const displayPackages = computed(() =>
  lockedPackageId.value
    ? pageData.value.packages.filter((p: any) => p.id === lockedPackageId.value)
    : pageData.value.packages
)
const selectedPkg = computed(() => pageData.value.packages.find((p: any) => p.id === selectedId.value))
const def = computed(() => pageData.value.user?.defaultPaymentMethod)

const availableTabs = computed(() => {
  const u = pageData.value.user
  if (!u) return []
  const tabs: any[] = []
  if (u.hasWechat) tabs.push({ key: 'wechat', label: '微信', icon: '💚', isDefault: def.value === 'wechat' })
  if (u.hasAlipay) tabs.push({ key: 'alipay', label: '支付宝', icon: '💙', isDefault: def.value === 'alipay' })
  return tabs
})

const hasPayment = computed(() => availableTabs.value.length > 0)

function copy(text: string) {
  uni.setClipboardData({ data: text, success: () => uni.showToast({ title: '已复制', icon: 'success' }) })
}

async function handleBossPaid() {
  if (!payerName.value.trim()) {
    uni.showToast({ title: '老板，留个大名呗 😊', icon: 'none' }); return
  }
  submitting.value = true
  try {
    const json = await new Promise<any>((resolve, reject) =>
      uni.request({ url: `${API_BASE}/pay/boss-paid`, method: 'POST', header: { 'Content-Type': 'application/json' },
        data: { userId: userId.value, packageId: selectedId.value, payerName: payerName.value, payerNote: payerNote.value },
        success: r => resolve(r.data), fail: reject })
    )
    if (json.code === 0) {
      track('boss_paid', { amount: selectedPkg.value?.price, packageId: selectedId.value })
      uni.showToast({ title: '已通知，等确认 🎉', icon: 'success' })
      setTimeout(() => uni.navigateTo({ url: `/pages/pay/receipt?orderId=${json.data.orderId}&readonly=1` }), 1200)
    }
  } catch {
    uni.showToast({ title: '提交失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss">
page { background: #F7F4F0; }
.page { min-height: 100vh; padding-bottom: 220rpx; }

.cashier-header {
  background: linear-gradient(160deg, #1E1A14, #3D3526);
  padding: 40rpx 32rpx 32rpx;
}
.header-nav { position: absolute; top: 44rpx; left: 24rpx; }
.btn-back { display: flex; align-items: center; gap: 4rpx; padding: 10rpx 16rpx; background: rgba(255,255,255,0.12); border-radius: 30rpx; }
.btn-back-icon { font-size: 28rpx; color: #F7F4F0; line-height: 1; }
.btn-back-text { font-size: 24rpx; color: #F7F4F0; }
.shop-info { display: flex; align-items: center; gap: 18rpx; }
.shop-avatar { width: 72rpx; height: 72rpx; border-radius: 36rpx; border: 2rpx solid rgba(196,168,130,0.5); }
.shop-avatar-placeholder {
  width: 72rpx; height: 72rpx; border-radius: 36rpx;
  background: rgba(196,168,130,0.2); display: flex; align-items: center; justify-content: center;
  text { font-size: 30rpx; color: #C4A882; font-weight: 700; }
}
.shop-name { font-size: 30rpx; font-weight: 800; color: #F7F4F0; display: block; }
.shop-sub { font-size: 22rpx; color: rgba(196,168,130,0.75); margin-top: 4rpx; display: block; }

.amount-panel {
  background: #fff; margin: 0 24rpx;
  border-radius: 8rpx; padding: 28rpx 32rpx;
  margin-top: -20rpx;
  box-shadow: 0 4rpx 20rpx rgba(30,26,20,0.12);
  text-align: center; border: 1rpx solid #C8B89A;
}
.amount-label { font-size: 24rpx; color: #8B7355; display: block; margin-bottom: 8rpx; }
.amount-row { display: flex; align-items: baseline; justify-content: center; gap: 4rpx; }
.amount-currency { font-size: 32rpx; color: #1E1A14; font-weight: 700; }
.amount-value { font-size: 72rpx; font-weight: 900; color: #1E1A14; line-height: 1; }
.amount-panel.has-amount .amount-value { color: #D94F3D; }
.amount-pkg-name { font-size: 24rpx; color: #8B7355; display: block; margin-top: 8rpx; }

.pkg-list { background: #fff; margin: 16rpx 24rpx; border-radius: 8rpx; overflow-y: auto; max-height: 360rpx; box-shadow: 0 2rpx 8rpx rgba(30,26,20,0.07); border: 1rpx solid #C8B89A; }
.pkg-item { display: flex; align-items: center; justify-content: space-between; padding: 24rpx; border-bottom: 1rpx solid #E5D8C4; }
.pkg-item:last-child { border-bottom: none; }
.pkg-item.selected { background: #F8F5F2; }
.pkg-item.locked { pointer-events: none; }
.pkg-item-left { display: flex; align-items: center; gap: 18rpx; flex: 1; }
.pkg-radio {
  width: 40rpx; height: 40rpx; border-radius: 20rpx;
  border: 2rpx solid #C8B89A; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.pkg-radio.checked { border-color: #D94F3D; background: #D94F3D; }
.pkg-radio-dot { width: 16rpx; height: 16rpx; border-radius: 8rpx; background: #fff; }
.pkg-item-name { font-size: 28rpx; font-weight: 700; color: #1E1A14; display: block; }
.pkg-item-desc { font-size: 22rpx; color: #8B7355; margin-top: 4rpx; display: block; }
.pkg-item-price { font-size: 38rpx; font-weight: 900; color: #D94F3D; flex-shrink: 0; }

.pay-panel { background: #fff; margin: 0 24rpx 20rpx; border-radius: 8rpx; overflow: hidden; box-shadow: 0 2rpx 8rpx rgba(30,26,20,0.07); border: 1rpx solid #C8B89A; }
.pay-panel-header { padding: 22rpx 24rpx 0; border-bottom: 1rpx solid #E5D8C4; }
.pay-panel-title { font-size: 26rpx; font-weight: 700; color: #1E1A14; display: block; padding-bottom: 18rpx; }

.method-tabs { display: flex; padding: 18rpx 24rpx; gap: 14rpx; border-bottom: 1rpx solid #E5D8C4; }
.method-tab {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8rpx;
  padding: 14rpx 10rpx; border-radius: 6rpx; border: 1rpx solid #C8B89A; position: relative;
}
.method-tab.active { border-color: #D94F3D; background: #FBF8F5; }
.method-tab-icon { font-size: 32rpx; }
.method-tab-label { font-size: 22rpx; color: #8B7355; }
.method-tab.active .method-tab-label { color: #D94F3D; font-weight: 700; }
.default-tag {
  position: absolute; top: -1rpx; right: -1rpx;
  background: #D94F3D; color: #fff; font-size: 16rpx;
  padding: 3rpx 10rpx; border-radius: 0 6rpx 0 6rpx;
}

.qr-label-row { padding: 18rpx 0 0; }
.qr-method-label { font-size: 26rpx; font-weight: 600; color: #1E1A14; }
.qr-panel { padding: 28rpx 24rpx; text-align: center; }
.qr-box {
  display: inline-block; background: #fff; border: 1rpx solid #C8B89A;
  border-radius: 8rpx; padding: 18rpx;
  box-shadow: 0 4rpx 12rpx rgba(30,26,20,0.08);
}
.qr-img { width: 280rpx; height: 280rpx; display: block; }
.scan-tip { font-size: 24rpx; color: #6B5040; display: block; margin-top: 18rpx; }
.humor-tip { font-size: 22rpx; color: #C4A882; display: block; text-align: center; padding: 12rpx 0 20rpx; }

.payer-row-wrap { padding: 0 24rpx; border-top: 1rpx solid #E5D8C4; }
.payer-input { width: 100%; height: 88rpx; font-size: 28rpx; color: #1E1A14; border-bottom: 1rpx solid #E5D8C4; background: transparent; }
.payer-input.note { border-bottom: none; }
.ph { color: #C4A882; }

.bottom-bar {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 390px; max-width: 100vw;
  background: #F7F4F0; padding: 16rpx 24rpx 40rpx;
  border-top: 1rpx solid #E5D8C4;
  box-shadow: 0 -4rpx 16rpx rgba(30,26,20,0.08);
}
.btn-paid {
  width: 100%;
  height: 100rpx; background: #1E1A14;
  color: #F7F4F0; border-radius: 8rpx; font-size: 30rpx; font-weight: 800; border: none;
  letter-spacing: 1rpx;
}
.paid-tip { font-size: 22rpx; color: #C4A882; display: block; text-align: center; padding: 10rpx 0 0; }

.no-payment { text-align: center; padding: 80rpx 40rpx; }
.no-icon { font-size: 80rpx; display: block; }
.no-text { font-size: 26rpx; color: #8B7355; margin-top: 20rpx; display: block; line-height: 1.7; }
.loading { text-align: center; padding: 200rpx 0; color: #C4A882; }
.qr-loading { text-align: center; padding: 40rpx 0; color: #C4A882; font-size: 26rpx; }
</style>
