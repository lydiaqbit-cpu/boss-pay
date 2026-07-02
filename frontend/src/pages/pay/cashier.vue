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
        <text class="pay-panel-title">选择付款方式</text>
      </view>

      <!-- 方式 tab -->
      <view class="method-tabs">
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

      <!-- 微信收款码 -->
      <view v-if="activeTab === 'wechat'" class="qr-panel">
        <view class="qr-box">
          <image :src="pageData.user?.wechatQrUrl" class="qr-img" mode="aspectFit"/>
        </view>
        <text class="scan-tip">📱 长按识别二维码扫码付款</text>
        <text class="humor-tip">转账备注"{{ selectedPkg?.name }}"，老板有情有义 😇</text>
      </view>

      <!-- 支付宝收款码 -->
      <view v-if="activeTab === 'alipay'" class="qr-panel">
        <view class="qr-box">
          <image :src="pageData.user?.alipayQrUrl" class="qr-img" mode="aspectFit"/>
        </view>
        <text class="scan-tip">📱 长按识别二维码扫码付款</text>
        <text class="humor-tip">转账备注"{{ selectedPkg?.name }}"，老板仁义 💙</text>
      </view>

      <!-- 老板填写 -->
      <view class="payer-row-wrap">
        <input v-model="payerName" class="payer-input" placeholder="老板，留个大名吧（必填）" placeholder-class="ph"/>
        <input v-model="payerNote" class="payer-input note" placeholder="备注（可选）" placeholder-class="ph"/>
      </view>

      <button class="btn-paid" :loading="submitting" @click="handleBossPaid">
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

const userId = ref('')
const lockedPackageId = ref('')
const pageData = ref<any>({ user: null, packages: [] })
const selectedId = ref('')
const payerName = ref('')
const payerNote = ref('')
const activeTab = ref('')
const submitting = ref(false)

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

onLoad((options: any) => {
  userId.value = options?.userId || ''
  lockedPackageId.value = options?.packageId || ''
})

onMounted(async () => {
  if (!userId.value) return
  const res = await fetch(`${API_BASE}/pay/page/${userId.value}`)
  const json = await res.json()
  if (json.code === 0) {
    pageData.value = json.data
    if (lockedPackageId.value) selectedId.value = lockedPackageId.value
    initTab(json.data.user)
  }
})

function initTab(u: any) {
  if (!u) return
  const def = u.defaultPaymentMethod
  if (def === 'wechat' && u.wechatQrUrl) { activeTab.value = 'wechat'; return }
  if (def === 'alipay' && u.alipayQrUrl) { activeTab.value = 'alipay'; return }
  if (u.wechatQrUrl) activeTab.value = 'wechat'
  else if (u.alipayQrUrl) activeTab.value = 'alipay'
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
  if (u.wechatQrUrl) tabs.push({ key: 'wechat', label: '微信', icon: '💚', isDefault: def.value === 'wechat' })
  if (u.alipayQrUrl) tabs.push({ key: 'alipay', label: '支付宝', icon: '💙', isDefault: def.value === 'alipay' })
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
    const res = await fetch(`${API_BASE}/pay/boss-paid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId.value, packageId: selectedId.value, payerName: payerName.value, payerNote: payerNote.value })
    })
    const json = await res.json()
    if (json.code === 0) {
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
page { background: #F5F7FA; }
.page { min-height: 100vh; padding-bottom: 60rpx; }

/* 顶部 */
.cashier-header {
  background: linear-gradient(150deg, #43B89C, #2A9B82);
  padding: 80rpx 32rpx 32rpx;
}
.shop-info { display: flex; align-items: center; gap: 18rpx; }
.shop-avatar { width: 72rpx; height: 72rpx; border-radius: 36rpx; border: 2rpx solid rgba(255,255,255,0.5); }
.shop-avatar-placeholder {
  width: 72rpx; height: 72rpx; border-radius: 36rpx;
  background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center;
  text { font-size: 30rpx; color: #fff; font-weight: 700; }
}
.shop-name { font-size: 30rpx; font-weight: 800; color: #fff; display: block; }
.shop-sub { font-size: 22rpx; color: rgba(255,255,255,0.7); margin-top: 4rpx; display: block; }

/* 金额面板 */
.amount-panel {
  background: #fff; margin: 0 24rpx;
  border-radius: 20rpx; padding: 28rpx 32rpx;
  margin-top: -20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
  text-align: center;
}
.amount-label { font-size: 24rpx; color: #A0AEC0; display: block; margin-bottom: 8rpx; }
.amount-row { display: flex; align-items: baseline; justify-content: center; gap: 4rpx; }
.amount-currency { font-size: 32rpx; color: #2D3748; font-weight: 700; }
.amount-value { font-size: 72rpx; font-weight: 900; color: #2D3748; line-height: 1; }
.amount-panel.has-amount .amount-value { color: #FF6B4A; }
.amount-pkg-name { font-size: 24rpx; color: #A0AEC0; display: block; margin-top: 8rpx; }

/* 套餐列表 */
.pkg-list { background: #fff; margin: 16rpx 24rpx; border-radius: 18rpx; overflow: hidden; box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05); }
.pkg-item { display: flex; align-items: center; justify-content: space-between; padding: 24rpx; border-bottom: 1rpx solid #F0F4F8; }
.pkg-item:last-child { border-bottom: none; }
.pkg-item.selected { background: #F0FBF7; }
.pkg-item.locked { pointer-events: none; }
.pkg-item-left { display: flex; align-items: center; gap: 18rpx; flex: 1; }
.pkg-radio {
  width: 40rpx; height: 40rpx; border-radius: 20rpx;
  border: 2rpx solid #CBD5E0; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.pkg-radio.checked { border-color: #43B89C; background: #43B89C; }
.pkg-radio-dot { width: 16rpx; height: 16rpx; border-radius: 8rpx; background: #fff; }
.pkg-item-name { font-size: 28rpx; font-weight: 700; color: #1A202C; display: block; }
.pkg-item-desc { font-size: 22rpx; color: #A0AEC0; margin-top: 4rpx; display: block; }
.pkg-item-price { font-size: 38rpx; font-weight: 900; color: #FF6B4A; flex-shrink: 0; }

/* 支付面板 */
.pay-panel { background: #fff; margin: 0 24rpx 20rpx; border-radius: 18rpx; overflow: hidden; box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05); }
.pay-panel-header { padding: 22rpx 24rpx 0; border-bottom: 1rpx solid #F0F4F8; }
.pay-panel-title { font-size: 26rpx; font-weight: 700; color: #2D3748; display: block; padding-bottom: 18rpx; }

/* 方式 tab */
.method-tabs { display: flex; padding: 18rpx 24rpx; gap: 14rpx; border-bottom: 1rpx solid #F0F4F8; }
.method-tab {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8rpx;
  padding: 14rpx 10rpx; border-radius: 14rpx; border: 2rpx solid #EDF2F7; position: relative;
}
.method-tab.active { border-color: #43B89C; background: #F0FBF7; }
.method-tab-icon { font-size: 32rpx; }
.method-tab-label { font-size: 22rpx; color: #718096; }
.method-tab.active .method-tab-label { color: #2A9B82; font-weight: 700; }
.default-tag {
  position: absolute; top: -1rpx; right: -1rpx;
  background: #43B89C; color: #fff; font-size: 16rpx;
  padding: 3rpx 10rpx; border-radius: 0 12rpx 0 10rpx;
}

/* 二维码 */
.qr-panel { padding: 28rpx 24rpx; text-align: center; }
.qr-box {
  display: inline-block; background: #fff; border: 1rpx solid #EDF2F7;
  border-radius: 18rpx; padding: 18rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.07);
}
.qr-img { width: 280rpx; height: 280rpx; display: block; }
.scan-tip { font-size: 24rpx; color: #718096; display: block; margin-top: 18rpx; }
.humor-tip { font-size: 22rpx; color: #CBD5E0; display: block; text-align: center; padding: 12rpx 0 20rpx; }

/* 老板填写 */
.payer-row-wrap { padding: 0 24rpx; border-top: 1rpx solid #F0F4F8; }
.payer-input { width: 100%; height: 88rpx; font-size: 28rpx; color: #1A202C; border-bottom: 1rpx solid #F0F4F8; background: transparent; }
.payer-input.note { border-bottom: none; }
.ph { color: #CBD5E0; }

/* 按钮 */
.btn-paid {
  width: calc(100% - 48rpx); margin: 20rpx 24rpx 0;
  height: 100rpx; background: linear-gradient(135deg, #FF8547, #FF6B4A);
  color: #fff; border-radius: 50rpx; font-size: 30rpx; font-weight: 800; border: none;
  box-shadow: 0 6rpx 20rpx rgba(255,107,74,0.3);
}
.paid-tip { font-size: 22rpx; color: #CBD5E0; display: block; text-align: center; padding: 14rpx 0 20rpx; }

.no-payment { text-align: center; padding: 80rpx 40rpx; }
.no-icon { font-size: 80rpx; display: block; }
.no-text { font-size: 26rpx; color: #A0AEC0; margin-top: 20rpx; display: block; line-height: 1.7; }
.loading { text-align: center; padding: 200rpx 0; color: #CBD5E0; }
</style>
