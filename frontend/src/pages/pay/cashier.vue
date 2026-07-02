<template>
  <view class="page">
    <view class="header">
      <view class="employee-info">
        <image v-if="pageData.user?.avatar" :src="pageData.user.avatar" class="avatar" mode="aspectFill"/>
        <view v-else class="avatar-placeholder"><text>{{ pageData.user?.nickname?.[0] }}</text></view>
        <view class="employee-text">
          <text class="employee-name">{{ pageData.user?.nickname }}</text>
          <text class="employee-bio">{{ pageData.user?.bio || '打工人' }}</text>
        </view>
      </view>
    </view>

    <view class="section-title">选择加班套餐</view>
    <view
      v-for="pkg in displayPackages"
      :key="pkg.id"
      class="pkg-card"
      :class="{ selected: selectedId === pkg.id, locked: !!lockedPackageId }"
      @click="!lockedPackageId && (selectedId = pkg.id)"
    >
      <view class="pkg-left">
        <text class="pkg-name">{{ pkg.name }}</text>
        <text class="pkg-desc">{{ pkg.description || `加班 ${pkg.hours}h` }}</text>
      </view>
      <view class="pkg-right">
        <text class="pkg-price">¥{{ pkg.price }}</text>
        <view v-if="selectedId === pkg.id" class="check">✓</view>
      </view>
    </view>

    <view v-if="selectedId" class="pay-section">
      <view class="section-title">你的称呼</view>
      <view class="input-wrap">
        <input v-model="payerName" placeholder="老板怎么称呼？" class="input" placeholder-class="ph"/>
      </view>

      <view class="section-title">转账方式</view>
      <view class="pay-tabs">
        <view
          v-for="tab in availableTabs"
          :key="tab.key"
          class="pay-tab"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >{{ tab.label }}</view>
      </view>

      <view v-if="activeTab === 'wechat'" class="qr-wrap">
        <image :src="pageData.user?.wechatQrUrl" class="qr-img" mode="aspectFit"/>
        <text class="qr-tip">长按识别或截图扫码转账</text>
      </view>

      <view v-if="activeTab === 'alipay'" class="info-card">
        <view class="info-row">
          <text class="info-label">支付宝账号</text>
          <text class="info-value">{{ pageData.user?.alipayAccount }}</text>
          <text class="copy-btn" @click="copy(pageData.user?.alipayAccount)">复制</text>
        </view>
        <view class="info-row">
          <text class="info-label">收款姓名</text>
          <text class="info-value">{{ pageData.user?.alipayName }}</text>
        </view>
      </view>

      <view v-if="activeTab === 'bank'" class="info-card">
        <view class="info-row">
          <text class="info-label">银行卡号</text>
          <text class="info-value">{{ pageData.user?.bankCard }}</text>
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
      </view>

      <view class="amount-tip">转账金额：<text class="amount-highlight">¥{{ selectedPkg?.price }}</text></view>

      <view class="note-wrap">
        <input v-model="payerNote" placeholder="备注（可选，如：周五加班费）" class="input" placeholder-class="ph"/>
      </view>

      <button class="btn-confirm" :loading="submitting" @click="handleBossPaid">
        我已转账，通知对方确认
      </button>
      <text class="bottom-tip">转账后点击按钮，对方确认到账后生成凭证</text>
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
    const u = json.data.user
    if (u.wechatQrUrl) activeTab.value = 'wechat'
    else if (u.alipayAccount) activeTab.value = 'alipay'
    else if (u.bankCard) activeTab.value = 'bank'
  }
})

const displayPackages = computed(() =>
  lockedPackageId.value
    ? pageData.value.packages.filter((p: any) => p.id === lockedPackageId.value)
    : pageData.value.packages
)

const selectedPkg = computed(() =>
  pageData.value.packages.find((p: any) => p.id === selectedId.value)
)

const availableTabs = computed(() => {
  const u = pageData.value.user
  if (!u) return []
  const tabs: any[] = []
  if (u.wechatQrUrl) tabs.push({ key: 'wechat', label: '微信' })
  if (u.alipayAccount) tabs.push({ key: 'alipay', label: '支付宝' })
  if (u.bankCard) tabs.push({ key: 'bank', label: '银行卡' })
  return tabs
})

function copy(text: string) {
  uni.setClipboardData({ data: text, success: () => uni.showToast({ title: '已复制', icon: 'success' }) })
}

async function handleBossPaid() {
  if (!payerName.value.trim()) {
    uni.showToast({ title: '请填写你的称呼', icon: 'none' }); return
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
      uni.showToast({ title: '已通知对方确认！', icon: 'success' })
      setTimeout(() => {
        uni.navigateTo({ url: `/pages/pay/receipt?orderId=${json.data.orderId}&readonly=1` })
      }, 1200)
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
  padding: 100rpx 40rpx 48rpx;
  border-bottom-left-radius: 40rpx;
  border-bottom-right-radius: 40rpx;
}
.employee-info { display: flex; align-items: center; gap: 24rpx; }
.avatar { width: 96rpx; height: 96rpx; border-radius: 48rpx; border: 3rpx solid rgba(255,216,92,0.4); }
.avatar-placeholder {
  width: 96rpx; height: 96rpx; border-radius: 48rpx;
  background: rgba(255,216,92,0.2); display: flex; align-items: center; justify-content: center;
}
.avatar-placeholder text { font-size: 40rpx; color: #FFD85C; font-weight: 700; }
.employee-text { flex: 1; }
.employee-name { font-size: 36rpx; font-weight: 700; color: #fff; display: block; }
.employee-bio { font-size: 24rpx; color: rgba(255,255,255,0.5); margin-top: 6rpx; display: block; }

.section-title { font-size: 24rpx; color: rgba(255,255,255,0.4); padding: 32rpx 40rpx 16rpx; letter-spacing: 2rpx; }

.pkg-card {
  margin: 0 28rpx 16rpx;
  background: #161630;
  border: 2rpx solid rgba(255,255,255,0.08);
  border-radius: 20rpx;
  padding: 28rpx;
  display: flex; align-items: center; justify-content: space-between;
}
.pkg-card.selected { border-color: #FFD85C; background: rgba(255,216,92,0.08); }
.pkg-card.locked { pointer-events: none; }
.pkg-left { flex: 1; }
.pkg-name { font-size: 30rpx; font-weight: 600; color: #fff; display: block; }
.pkg-desc { font-size: 24rpx; color: rgba(255,255,255,0.4); margin-top: 6rpx; display: block; }
.pkg-right { text-align: right; }
.pkg-price { font-size: 40rpx; font-weight: 800; color: #FFD85C; display: block; }
.check { font-size: 24rpx; color: #FFD85C; margin-top: 4rpx; text-align: right; }

.pay-section { padding: 0 28rpx; }
.input-wrap {
  background: #161630; border-radius: 16rpx; border: 1rpx solid rgba(255,255,255,0.1);
  padding: 0 28rpx; height: 88rpx; display: flex; align-items: center; margin-bottom: 4rpx;
}
.note-wrap {
  background: #161630; border-radius: 16rpx; border: 1rpx solid rgba(255,255,255,0.1);
  padding: 0 28rpx; height: 80rpx; display: flex; align-items: center; margin-bottom: 32rpx; margin-top: 16rpx;
}
.input { flex: 1; height: 88rpx; font-size: 28rpx; color: #fff; background: transparent; }
.ph { color: rgba(255,255,255,0.25); }

.pay-tabs { display: flex; gap: 16rpx; margin-bottom: 24rpx; }
.pay-tab {
  padding: 14rpx 36rpx; border-radius: 40rpx; font-size: 26rpx;
  border: 1rpx solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.5);
}
.pay-tab.active { background: rgba(255,216,92,0.15); border-color: #FFD85C; color: #FFD85C; }

.qr-wrap { text-align: center; padding: 24rpx 0 16rpx; }
.qr-img { width: 320rpx; height: 320rpx; border-radius: 16rpx; background: #fff; }
.qr-tip { font-size: 22rpx; color: rgba(255,255,255,0.35); display: block; margin-top: 16rpx; }

.info-card {
  background: #161630; border-radius: 16rpx; border: 1rpx solid rgba(255,255,255,0.08);
  padding: 8rpx 28rpx; margin-bottom: 4rpx;
}
.info-row {
  display: flex; align-items: center; padding: 20rpx 0;
  border-bottom: 1rpx solid rgba(255,255,255,0.06);
}
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 24rpx; color: rgba(255,255,255,0.4); width: 140rpx; flex-shrink: 0; }
.info-value { flex: 1; font-size: 28rpx; color: #fff; }
.copy-btn { font-size: 22rpx; color: #FFD85C; padding: 6rpx 16rpx; }

.amount-tip { font-size: 26rpx; color: rgba(255,255,255,0.5); text-align: center; padding: 24rpx 0 8rpx; }
.amount-highlight { font-size: 40rpx; font-weight: 800; color: #FFD85C; }

.btn-confirm {
  width: 100%; height: 100rpx;
  background: linear-gradient(135deg, #C9883D, #B8772A);
  color: #fff; border-radius: 50rpx; font-size: 30rpx; font-weight: 700; border: none;
  box-shadow: 0 8rpx 28rpx rgba(180,110,40,0.4);
}
.bottom-tip { font-size: 22rpx; color: rgba(255,255,255,0.3); display: block; text-align: center; margin-top: 20rpx; }
.loading-tip { text-align: center; padding: 200rpx 0; color: rgba(255,255,255,0.3); }
</style>
