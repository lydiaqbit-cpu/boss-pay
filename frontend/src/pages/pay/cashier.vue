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

      <!-- 支付宝 -->
      <view v-if="activeTab === 'alipay'" class="account-panel">
        <view class="account-row" @click="copy(pageData.user?.alipayAccount)">
          <view class="account-left">
            <text class="account-field">账号</text>
            <text class="account-val">{{ pageData.user?.alipayAccount }}</text>
          </view>
          <view class="copy-chip"><text>复制</text></view>
        </view>
        <view class="account-row">
          <text class="account-field">姓名</text>
          <text class="account-val">{{ pageData.user?.alipayName }}</text>
        </view>
        <text class="humor-tip">转完别忘了备注，让 TA 知道是你付的 💙</text>
      </view>

      <!-- 银行卡 -->
      <view v-if="activeTab === 'bank'" class="account-panel">
        <view class="bank-card-visual">
          <text class="bank-card-num">{{ formatCard(pageData.user?.bankCard) }}</text>
          <text class="bank-card-bank">{{ pageData.user?.bankName }}</text>
        </view>
        <view class="account-row" @click="copy(pageData.user?.bankCard)">
          <view class="account-left">
            <text class="account-field">卡号</text>
            <text class="account-val">{{ formatCard(pageData.user?.bankCard) }}</text>
          </view>
          <view class="copy-chip"><text>复制</text></view>
        </view>
        <view class="account-row">
          <text class="account-field">持卡人</text>
          <text class="account-val">{{ pageData.user?.bankHolder }}</text>
        </view>
        <text class="humor-tip">转完截图发给 TA，感情维系靠证据 🏦</text>
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
  if (def === 'alipay' && u.alipayAccount) { activeTab.value = 'alipay'; return }
  if (def === 'bank' && u.bankCard) { activeTab.value = 'bank'; return }
  if (u.wechatQrUrl) activeTab.value = 'wechat'
  else if (u.alipayAccount) activeTab.value = 'alipay'
  else if (u.bankCard) activeTab.value = 'bank'
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
  if (u.alipayAccount) tabs.push({ key: 'alipay', label: '支付宝', icon: '💙', isDefault: def.value === 'alipay' })
  if (u.bankCard) tabs.push({ key: 'bank', label: '银行卡', icon: '🏦', isDefault: def.value === 'bank' })
  return tabs
})

const hasPayment = computed(() => availableTabs.value.length > 0)

function copy(text: string) {
  uni.setClipboardData({ data: text, success: () => uni.showToast({ title: '已复制', icon: 'success' }) })
}

function formatCard(card: string) {
  if (!card) return ''
  return card.replace(/(\d{4})(?=\d)/g, '$1 ')
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
page { background: #f4f4f8; }
.page { min-height: 100vh; padding-bottom: 60rpx; }

/* 顶部 */
.cashier-header {
  background: linear-gradient(135deg, #3D2010, #5C3218);
  padding: 80rpx 36rpx 36rpx;
}
.shop-info { display: flex; align-items: center; gap: 20rpx; }
.shop-avatar { width: 80rpx; height: 80rpx; border-radius: 40rpx; border: 3rpx solid rgba(255,216,92,0.5); }
.shop-avatar-placeholder {
  width: 80rpx; height: 80rpx; border-radius: 40rpx;
  background: rgba(255,216,92,0.2); display: flex; align-items: center; justify-content: center;
  text { font-size: 34rpx; color: #FFD85C; font-weight: 700; }
}
.shop-name { font-size: 30rpx; font-weight: 800; color: #fff; display: block; }
.shop-sub { font-size: 22rpx; color: rgba(255,255,255,0.5); margin-top: 4rpx; display: block; }

/* 金额面板 */
.amount-panel {
  background: #fff; margin: 0 28rpx;
  border-radius: 24rpx; padding: 32rpx 36rpx;
  margin-top: -24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.1);
  text-align: center;
}
.amount-label { font-size: 24rpx; color: #999; display: block; margin-bottom: 8rpx; }
.amount-row { display: flex; align-items: baseline; justify-content: center; gap: 4rpx; }
.amount-currency { font-size: 36rpx; color: #1a1a1a; font-weight: 700; }
.amount-value { font-size: 72rpx; font-weight: 900; color: #1a1a1a; line-height: 1; }
.amount-panel.has-amount .amount-value { color: #C9883D; }
.amount-pkg-name { font-size: 24rpx; color: #999; display: block; margin-top: 8rpx; }

/* 套餐列表 */
.pkg-list { background: #fff; margin: 20rpx 28rpx; border-radius: 20rpx; overflow: hidden; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); }
.pkg-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 28rpx 28rpx; border-bottom: 1rpx solid #f0f0f0;
}
.pkg-item:last-child { border-bottom: none; }
.pkg-item.selected { background: #FFF9EE; }
.pkg-item.locked { pointer-events: none; }
.pkg-item-left { display: flex; align-items: center; gap: 20rpx; flex: 1; }
.pkg-radio {
  width: 40rpx; height: 40rpx; border-radius: 20rpx;
  border: 2rpx solid #ddd; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.pkg-radio.checked { border-color: #C9883D; background: #C9883D; }
.pkg-radio-dot { width: 16rpx; height: 16rpx; border-radius: 8rpx; background: #fff; }
.pkg-item-name { font-size: 28rpx; font-weight: 700; color: #1a1a1a; display: block; }
.pkg-item-desc { font-size: 22rpx; color: #999; margin-top: 4rpx; display: block; }
.pkg-item-price { font-size: 40rpx; font-weight: 900; color: #C9883D; flex-shrink: 0; }

/* 支付面板 */
.pay-panel { background: #fff; margin: 0 28rpx 20rpx; border-radius: 20rpx; overflow: hidden; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); }
.pay-panel-header { padding: 24rpx 28rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.pay-panel-title { font-size: 26rpx; font-weight: 700; color: #333; display: block; padding-bottom: 20rpx; }

/* 方式 tab */
.method-tabs { display: flex; padding: 20rpx 28rpx; gap: 16rpx; border-bottom: 1rpx solid #f0f0f0; }
.method-tab {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8rpx;
  padding: 16rpx 10rpx; border-radius: 16rpx; border: 2rpx solid #eee;
  position: relative;
}
.method-tab.active { border-color: #C9883D; background: #FFF9EE; }
.method-tab-icon { font-size: 32rpx; }
.method-tab-label { font-size: 22rpx; color: #666; }
.method-tab.active .method-tab-label { color: #C9883D; font-weight: 700; }
.default-tag {
  position: absolute; top: -1rpx; right: -1rpx;
  background: #C9883D; color: #fff; font-size: 16rpx;
  padding: 3rpx 10rpx; border-radius: 0 14rpx 0 10rpx;
}

/* 二维码 */
.qr-panel { padding: 32rpx 28rpx; text-align: center; }
.qr-box {
  display: inline-block; background: #fff; border: 1rpx solid #eee;
  border-radius: 20rpx; padding: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
}
.qr-img { width: 280rpx; height: 280rpx; display: block; }
.scan-tip { font-size: 24rpx; color: #666; display: block; margin-top: 20rpx; }

/* 账号面板 */
.account-panel { padding: 0 28rpx; }
.bank-card-visual {
  background: linear-gradient(135deg, #3D2010, #5C3218);
  border-radius: 16rpx; padding: 28rpx; margin: 20rpx 0;
}
.bank-card-num { font-size: 28rpx; color: #fff; letter-spacing: 6rpx; display: block; font-weight: 700; }
.bank-card-bank { font-size: 22rpx; color: rgba(255,255,255,0.6); margin-top: 8rpx; display: block; }
.account-row {
  display: flex; align-items: center; padding: 22rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.account-row:last-of-type { border-bottom: none; }
.account-left { flex: 1; display: flex; align-items: center; gap: 20rpx; }
.account-field { font-size: 24rpx; color: #999; width: 100rpx; flex-shrink: 0; }
.account-val { font-size: 28rpx; color: #1a1a1a; font-weight: 600; }
.copy-chip {
  background: #FFF3E0; border: 1rpx solid #FFD085; border-radius: 20rpx;
  padding: 8rpx 20rpx; flex-shrink: 0;
  text { font-size: 22rpx; color: #C9883D; font-weight: 600; }
}

.humor-tip { font-size: 22rpx; color: #bbb; display: block; text-align: center; padding: 16rpx 0 24rpx; }

/* 老板填写 */
.payer-row-wrap { padding: 0 28rpx; border-top: 1rpx solid #f0f0f0; }
.payer-input {
  width: 100%; height: 88rpx; font-size: 28rpx; color: #1a1a1a;
  border-bottom: 1rpx solid #f0f0f0; background: transparent;
}
.payer-input.note { border-bottom: none; }
.ph { color: #ccc; }

/* 按钮 */
.btn-paid {
  width: calc(100% - 56rpx); margin: 24rpx 28rpx 0;
  height: 100rpx; background: linear-gradient(135deg, #C9883D, #B8772A);
  color: #fff; border-radius: 50rpx; font-size: 30rpx; font-weight: 800; border: none;
  box-shadow: 0 8rpx 24rpx rgba(180,110,40,0.35);
}
.paid-tip { font-size: 22rpx; color: #bbb; display: block; text-align: center; padding: 16rpx 0 24rpx; }

.no-payment { text-align: center; padding: 80rpx 40rpx; }
.no-icon { font-size: 80rpx; display: block; }
.no-text { font-size: 26rpx; color: #999; margin-top: 20rpx; display: block; line-height: 1.7; }
.loading { text-align: center; padding: 200rpx 0; color: #ccc; }
</style>
