<template>
  <view class="page">
    <!-- 员工信息头部 -->
    <view class="header">
      <view class="employee-info">
        <image v-if="pageData.user?.avatar" :src="pageData.user.avatar" class="avatar" mode="aspectFill"/>
        <view v-else class="avatar-placeholder"><text>{{ pageData.user?.nickname?.[0] }}</text></view>
        <view class="employee-text">
          <text class="employee-name">{{ pageData.user?.nickname }}</text>
          <text class="employee-bio">{{ pageData.user?.bio || '辛勤打工中 🐂' }}</text>
        </view>
      </view>
      <view class="humor-tag"><text>老板，该结账了 👀</text></view>
    </view>

    <!-- 套餐选择 -->
    <view class="section-label">选择本次加班套餐</view>
    <view
      v-for="pkg in displayPackages"
      :key="pkg.id"
      class="pkg-card"
      :class="{ selected: selectedId === pkg.id, locked: !!lockedPackageId }"
      @click="!lockedPackageId && (selectedId = pkg.id)"
    >
      <view class="pkg-left">
        <text class="pkg-name">{{ pkg.name }}</text>
        <text class="pkg-desc">{{ pkg.description || `加班 ${pkg.hours}h，青春无价` }}</text>
      </view>
      <view class="pkg-right">
        <text class="pkg-price">¥{{ pkg.price }}</text>
        <view v-if="selectedId === pkg.id" class="check">✓</view>
      </view>
    </view>

    <!-- 收款码区域（选了套餐才展示） -->
    <view v-if="selectedId && hasPayment">

      <view class="pay-section">
        <view class="pay-title-row">
          <text class="pay-title">转账到这里 👇</text>
          <text class="pay-amount-badge">¥{{ selectedPkg?.price }}</text>
        </view>

        <!-- 收款方式 tab -->
        <view class="pay-tabs">
          <view
            v-for="tab in availableTabs"
            :key="tab.key"
            class="pay-tab"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            <text>{{ tab.label }}</text>
            <text v-if="tab.isDefault" class="default-star">⭐</text>
          </view>
        </view>

        <!-- 微信收款码 -->
        <view v-if="activeTab === 'wechat'" class="qr-wrap">
          <view class="qr-card">
            <image :src="pageData.user?.wechatQrUrl" class="qr-img" mode="aspectFit"/>
          </view>
          <text class="qr-tip">长按图片识别二维码，转账 ¥{{ selectedPkg?.price }}</text>
          <text class="humor-tip">💬 备注"{{ selectedPkg?.name }}"，老板有情有义</text>
        </view>

        <!-- 支付宝 -->
        <view v-if="activeTab === 'alipay'" class="info-card">
          <view class="info-hero">
            <text class="info-amount">¥{{ selectedPkg?.price }}</text>
            <text class="info-amount-label">转账金额</text>
          </view>
          <view class="info-row">
            <text class="info-label">支付宝账号</text>
            <text class="info-value">{{ pageData.user?.alipayAccount }}</text>
            <text class="copy-btn" @click="copy(pageData.user?.alipayAccount)">复制</text>
          </view>
          <view class="info-row">
            <text class="info-label">收款姓名</text>
            <text class="info-value">{{ pageData.user?.alipayName }}</text>
          </view>
          <text class="humor-tip">💬 转账备注"{{ selectedPkg?.name }}"，下次加班还找你</text>
        </view>

        <!-- 银行卡 -->
        <view v-if="activeTab === 'bank'" class="info-card">
          <view class="info-hero">
            <text class="info-amount">¥{{ selectedPkg?.price }}</text>
            <text class="info-amount-label">转账金额</text>
          </view>
          <view class="info-row">
            <text class="info-label">卡号</text>
            <text class="info-value card-num">{{ formatCard(pageData.user?.bankCard) }}</text>
            <text class="copy-btn" @click="copy(pageData.user?.bankCard)">复制</text>
          </view>
          <view class="info-row">
            <text class="info-label">开户行</text>
            <text class="info-value">{{ pageData.user?.bankName }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">持卡人</text>
            <text class="info-value">{{ pageData.user?.bankHolder }}</text>
          </view>
          <text class="humor-tip">💬 转完截图发给 TA，感情维系靠证据</text>
        </view>
      </view>

      <!-- 老板填写称呼 -->
      <view class="payer-section">
        <text class="section-label">老板，留个名吧</text>
        <view class="input-wrap">
          <input v-model="payerName" placeholder="你的称呼（如：张总、老王、亲爱的老板）" class="input" placeholder-class="ph"/>
        </view>
        <view class="note-wrap">
          <input v-model="payerNote" placeholder="备注（可选，如：周五深夜加班费）" class="input" placeholder-class="ph"/>
        </view>
      </view>

      <button class="btn-confirm" :loading="submitting" @click="handleBossPaid">
        💸 钱已转，通知 TA 确认
      </button>
      <text class="bottom-tip">点击后对方会收到通知，确认到账后自动生成凭证</text>
    </view>

    <!-- 没有设置收款方式 -->
    <view v-if="selectedId && !hasPayment" class="no-payment">
      <text class="no-payment-icon">😅</text>
      <text class="no-payment-text">对方还没设置收款方式，让 TA 先去设置一下吧</text>
    </view>

    <view v-if="!pageData.user" class="loading-tip"><text>加载中...</text></view>
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
    initDefaultTab(json.data.user)
  }
})

function initDefaultTab(u: any) {
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

const selectedPkg = computed(() =>
  pageData.value.packages.find((p: any) => p.id === selectedId.value)
)

const def = computed(() => pageData.value.user?.defaultPaymentMethod)

const availableTabs = computed(() => {
  const u = pageData.value.user
  if (!u) return []
  const tabs: any[] = []
  if (u.wechatQrUrl) tabs.push({ key: 'wechat', label: '微信', isDefault: def.value === 'wechat' })
  if (u.alipayAccount) tabs.push({ key: 'alipay', label: '支付宝', isDefault: def.value === 'alipay' })
  if (u.bankCard) tabs.push({ key: 'bank', label: '银行卡', isDefault: def.value === 'bank' })
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
      body: JSON.stringify({
        userId: userId.value,
        packageId: selectedId.value,
        payerName: payerName.value,
        payerNote: payerNote.value
      })
    })
    const json = await res.json()
    if (json.code === 0) {
      uni.showToast({ title: '已通知，等 TA 确认 🎉', icon: 'success' })
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
page { background: #0d0d1a; }
.page { min-height: 100vh; padding: 0 0 120rpx; }

.header {
  background: linear-gradient(135deg, #1a0d00, #2d1a00);
  padding: 100rpx 40rpx 40rpx;
  border-bottom-left-radius: 40rpx;
  border-bottom-right-radius: 40rpx;
}
.employee-info { display: flex; align-items: center; gap: 24rpx; margin-bottom: 24rpx; }
.avatar { width: 96rpx; height: 96rpx; border-radius: 48rpx; border: 3rpx solid rgba(255,216,92,0.4); }
.avatar-placeholder {
  width: 96rpx; height: 96rpx; border-radius: 48rpx;
  background: rgba(255,216,92,0.2); display: flex; align-items: center; justify-content: center;
}
.avatar-placeholder text { font-size: 40rpx; color: #FFD85C; font-weight: 700; }
.employee-name { font-size: 36rpx; font-weight: 800; color: #fff; display: block; }
.employee-bio { font-size: 24rpx; color: rgba(255,255,255,0.5); margin-top: 6rpx; display: block; }
.humor-tag {
  background: rgba(255,216,92,0.12); border: 1rpx solid rgba(255,216,92,0.25);
  border-radius: 20rpx; padding: 12rpx 24rpx; display: inline-block;
  text { font-size: 24rpx; color: #FFD85C; font-weight: 600; }
}

.section-label { font-size: 24rpx; color: rgba(255,255,255,0.4); padding: 28rpx 40rpx 16rpx; letter-spacing: 2rpx; }

.pkg-card {
  margin: 0 28rpx 16rpx; background: #161630;
  border: 2rpx solid rgba(255,255,255,0.08); border-radius: 20rpx;
  padding: 28rpx; display: flex; align-items: center; justify-content: space-between;
}
.pkg-card.selected { border-color: #FFD85C; background: rgba(255,216,92,0.08); }
.pkg-card.locked { pointer-events: none; }
.pkg-left { flex: 1; }
.pkg-name { font-size: 30rpx; font-weight: 700; color: #fff; display: block; }
.pkg-desc { font-size: 24rpx; color: rgba(255,255,255,0.4); margin-top: 6rpx; display: block; }
.pkg-right { text-align: right; }
.pkg-price { font-size: 44rpx; font-weight: 900; color: #FFD85C; display: block; }
.check { font-size: 24rpx; color: #FFD85C; margin-top: 4rpx; text-align: right; }

.pay-section { padding: 0 28rpx; }
.pay-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20rpx; }
.pay-title { font-size: 28rpx; font-weight: 700; color: #fff; }
.pay-amount-badge {
  background: linear-gradient(135deg, #C9883D, #B8772A);
  color: #fff; font-size: 28rpx; font-weight: 800;
  padding: 8rpx 24rpx; border-radius: 30rpx;
}

.pay-tabs { display: flex; gap: 14rpx; margin-bottom: 24rpx; flex-wrap: wrap; }
.pay-tab {
  display: flex; align-items: center; gap: 6rpx;
  padding: 14rpx 28rpx; border-radius: 40rpx; font-size: 26rpx;
  border: 1rpx solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.5);
}
.pay-tab.active { background: rgba(255,216,92,0.15); border-color: #FFD85C; color: #FFD85C; }
.default-star { font-size: 20rpx; }

.qr-wrap { text-align: center; padding: 8rpx 0 4rpx; }
.qr-card {
  display: inline-block; background: #fff; border-radius: 20rpx;
  padding: 16rpx; box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.4);
}
.qr-img { width: 300rpx; height: 300rpx; display: block; }
.qr-tip { font-size: 24rpx; color: rgba(255,255,255,0.5); display: block; margin-top: 20rpx; }

.info-card {
  background: #161630; border-radius: 20rpx; border: 1rpx solid rgba(255,255,255,0.08);
  overflow: hidden; margin-bottom: 4rpx;
}
.info-hero {
  background: linear-gradient(135deg, #2d1a00, #1a0d00);
  padding: 28rpx; text-align: center; border-bottom: 1rpx solid rgba(255,255,255,0.06);
}
.info-amount { font-size: 64rpx; font-weight: 900; color: #FFD85C; display: block; }
.info-amount-label { font-size: 22rpx; color: rgba(255,255,255,0.4); margin-top: 4rpx; display: block; }
.info-row {
  display: flex; align-items: center; padding: 22rpx 28rpx;
  border-bottom: 1rpx solid rgba(255,255,255,0.06);
}
.info-row:last-of-type { border-bottom: none; }
.info-label { font-size: 24rpx; color: rgba(255,255,255,0.4); width: 120rpx; flex-shrink: 0; }
.info-value { flex: 1; font-size: 28rpx; color: #fff; font-weight: 600; }
.card-num { letter-spacing: 4rpx; font-size: 26rpx; }
.copy-btn { font-size: 22rpx; color: #FFD85C; padding: 6rpx 18rpx; flex-shrink: 0; }

.humor-tip { font-size: 22rpx; color: rgba(255,216,92,0.5); display: block; padding: 16rpx 28rpx 20rpx; }

.payer-section { padding: 0 28rpx; }
.input-wrap {
  background: #161630; border-radius: 16rpx; border: 1rpx solid rgba(255,255,255,0.1);
  padding: 0 28rpx; height: 88rpx; display: flex; align-items: center; margin-bottom: 16rpx;
}
.note-wrap {
  background: #161630; border-radius: 16rpx; border: 1rpx solid rgba(255,255,255,0.1);
  padding: 0 28rpx; height: 80rpx; display: flex; align-items: center; margin-bottom: 32rpx;
}
.input { flex: 1; height: 88rpx; font-size: 28rpx; color: #fff; background: transparent; }
.ph { color: rgba(255,255,255,0.2); }

.btn-confirm {
  width: calc(100% - 56rpx); margin: 0 28rpx;
  height: 104rpx; background: linear-gradient(135deg, #C9883D, #B8772A);
  color: #fff; border-radius: 52rpx; font-size: 32rpx; font-weight: 800; border: none;
  box-shadow: 0 8rpx 32rpx rgba(180,110,40,0.5);
}
.bottom-tip { font-size: 22rpx; color: rgba(255,255,255,0.25); display: block; text-align: center; margin-top: 20rpx; }

.no-payment { text-align: center; padding: 80rpx 40rpx; }
.no-payment-icon { font-size: 80rpx; display: block; }
.no-payment-text { font-size: 26rpx; color: rgba(255,255,255,0.4); margin-top: 20rpx; display: block; line-height: 1.7; }
.loading-tip { text-align: center; padding: 200rpx 0; color: rgba(255,255,255,0.3); }
</style>
