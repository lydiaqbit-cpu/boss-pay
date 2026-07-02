<template>
  <view class="page">
    <view v-if="loading" class="loading-screen">
      <text class="loading-text">加载中...</text>
    </view>

    <view v-else-if="!payee" class="error-screen">
      <text class="error-icon">😔</text>
      <text class="error-text">收款页不存在或已失效</text>
    </view>

    <template v-else>
      <!-- 顶部状态栏 -->
      <view class="top-bar">
        <view class="time-row">
          <text class="moon-icon">🌙</text>
          <text class="current-time">当前时间 {{ currentTime }}</text>
          <text class="overtime-tag">⚠️ 已超下班时间</text>
        </view>
        <text class="page-title">加班费管理系统 · 专业版</text>
      </view>

      <!-- 员工信息 -->
      <view class="employee-section">
        <view class="avatar-circle">
          <text class="avatar-text">{{ payee.nickname?.charAt(0) || '👩' }}</text>
        </view>
        <text class="overtime-badge">🔔 员工已超下班时间</text>
        <text class="headline">
          {{ payerName || '老板' }} 支付加班费，让 {{ payee.nickname }} 继续燃烧
        </text>
        <text class="subheadline">请选择续命套餐 · 付完即可继续压榨 · 合法合规 ✅</text>
      </view>

      <!-- 付款人姓名 -->
      <view class="payer-section">
        <text class="payer-label">👤 你是哪位老板（付款通知会带上你的大名）</text>
        <input
          v-model="payerName"
          placeholder="如：Michael · 仁慈的老板"
          class="payer-input"
          placeholder-class="ph"
        />
      </view>

      <!-- 套餐列表 -->
      <view class="pkg-list">
        <view
          v-for="(pkg, i) in (lockedPackageId ? pkgList.filter(p => p.id === lockedPackageId) : pkgList)"
          :key="pkg.id"
          class="pkg-option"
          :class="{ selected: selectedId === pkg.id, locked: !!lockedPackageId }"
          @click="!lockedPackageId && (selectedId = pkg.id)"
        >
          <view class="radio-wrap">
            <view class="radio" :class="{ active: selectedId === pkg.id }">
              <view v-if="selectedId === pkg.id" class="radio-dot" />
            </view>
          </view>
          <view class="option-body">
            <text class="option-name">{{ pkg.name }}</text>
            <text class="option-time">🕐 预计撑到：{{ calcEnd(pkg.hours) }}</text>
          </view>
          <view class="option-right">
            <view v-if="i === pkgList.length - 1" class="recommend-badge">🔥 老板最爱</view>
            <text class="option-price">¥{{ pkg.price }}</text>
            <text class="option-desc">{{ pkg.description }}</text>
          </view>
        </view>
      </view>

      <!-- 支付按钮 -->
      <view class="pay-bar">
        <view class="pay-meta">
          <text v-if="selectedPkg" class="pay-total">¥{{ selectedPkg.price }}</text>
          <text v-if="selectedPkg" class="pay-name">{{ selectedPkg.name }}</text>
        </view>
        <button
          class="btn-pay"
          :loading="paying"
          :disabled="!selectedId || !payerName.trim()"
          @click="handlePay"
        >
          💳 立即付款，员工继续为你奋斗
        </button>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { get, post } from '../../utils/request'

const payee = ref<any>(null)
const pkgList = ref<any[]>([])
const selectedId = ref('')
const payerName = ref('')
const loading = ref(true)
const paying = ref(false)
const userId = ref('')

const currentTime = computed(() => {
  const n = new Date()
  return `${pad(n.getHours())}:${pad(n.getMinutes())}`
})

const selectedPkg = computed(() =>
  pkgList.value.find(p => p.id === selectedId.value)
)

const lockedPackageId = ref('')

onLoad((options: any) => {
  userId.value = options?.userId || ''
  lockedPackageId.value = options?.packageId || ''
})

onMounted(async () => {
  if (!userId.value) { loading.value = false; return }
  try {
    const data = await get<{ user: any; packages: any[] }>(`/pay/page/${userId.value}`, false)
    payee.value = data.user
    pkgList.value = data.packages
    if (lockedPackageId.value) {
      selectedId.value = lockedPackageId.value
    } else if (pkgList.value.length > 0) {
      selectedId.value = pkgList.value[pkgList.value.length - 1].id
    }
  } catch {}
  loading.value = false
})

function pad(n: number) { return String(n).padStart(2, '0') }

function calcEnd(hours: number) {
  const d = new Date()
  d.setTime(d.getTime() + hours * 3600000)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function handlePay() {
  if (!payerName.value.trim()) {
    uni.showToast({ title: '请输入你的称呼', icon: 'none' })
    return
  }
  paying.value = true
  try {
    const data = await post<any>('/pay/create', {
      userId: userId.value,
      packageId: selectedId.value,
      payerName: payerName.value.trim()
    }, false)
    uni.navigateTo({
      url: `/pages/pay/qrcode?orderId=${data.orderId}&qrUrl=${encodeURIComponent(data.qrUrl)}&amount=${data.amount}&packageName=${encodeURIComponent(data.packageName)}`
    })
  } finally {
    paying.value = false
  }
}
</script>

<style lang="scss">
page { background: #0d0d1a; }
.page { min-height: 100vh; padding-bottom: 180rpx; }

.loading-screen, .error-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  background: #0d0d1a;
  .loading-text, .error-text { font-size: 30rpx; color: rgba(255,255,255,0.4); }
  .error-icon { font-size: 80rpx; }
}

.top-bar {
  background: #0d0d1a;
  padding: 60rpx 32rpx 24rpx;
  border-bottom: 1rpx solid rgba(255,255,255,0.06);
  .page-title { font-size: 36rpx; font-weight: 800; color: #FFD85C; display: block; margin-bottom: 12rpx; }
}
.time-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 8rpx;
  .moon-icon { font-size: 28rpx; }
  .current-time { font-size: 24rpx; color: rgba(255,255,255,0.4); }
  .overtime-tag { font-size: 24rpx; color: #FF4757; font-weight: 700; }
}

.employee-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36rpx 40rpx 28rpx;
  background: #0d0d1a;
  border-bottom: 1rpx solid rgba(255,255,255,0.06);
  margin-bottom: 8rpx;
}
.avatar-circle {
  width: 140rpx;
  height: 140rpx;
  border-radius: 70rpx;
  background: rgba(255,216,92,0.12);
  border: 3rpx solid rgba(255,216,92,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  .avatar-text { font-size: 64rpx; font-weight: 800; color: #FFD85C; }
}
.overtime-badge { font-size: 22rpx; color: rgba(255,255,255,0.35); margin-bottom: 16rpx; }
.headline {
  font-size: 36rpx;
  font-weight: 800;
  color: #fff;
  text-align: center;
  line-height: 1.4;
  margin-bottom: 12rpx;
}
.subheadline { font-size: 26rpx; color: rgba(255,255,255,0.4); text-align: center; }

.payer-section {
  background: #161630;
  padding: 24rpx 32rpx;
  margin: 0 28rpx 16rpx;
  border-radius: 16rpx;
  border: 1rpx solid rgba(255,255,255,0.07);
  .payer-label { font-size: 24rpx; color: rgba(255,255,255,0.4); display: block; margin-bottom: 14rpx; }
}
.payer-input {
  width: 100%;
  height: 80rpx;
  background: rgba(255,255,255,0.05);
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  color: #fff;
  box-sizing: border-box;
  border: 1rpx solid rgba(255,255,255,0.1);
}
.ph { color: rgba(255,255,255,0.2); }

.pkg-list { padding: 0 28rpx; }
.pkg-option {
  background: #161630;
  border: 1rpx solid rgba(255,255,255,0.08);
  border-radius: 18rpx;
  padding: 24rpx 20rpx;
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  &.selected {
    border-color: #FFD85C;
    background: rgba(255,216,92,0.06);
  }
  &.locked {
    border-color: #FFD85C;
    background: rgba(255,216,92,0.08);
    pointer-events: none;
  }
}
.radio-wrap { flex-shrink: 0; }
.radio {
  width: 40rpx;
  height: 40rpx;
  border-radius: 20rpx;
  border: 2rpx solid rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  &.active { border-color: #FFD85C; }
}
.radio-dot {
  width: 22rpx;
  height: 22rpx;
  border-radius: 11rpx;
  background: #FFD85C;
}
.option-body {
  flex: 1;
  .option-name { font-size: 30rpx; font-weight: 700; color: #fff; display: block; }
  .option-time { font-size: 22rpx; color: rgba(255,255,255,0.35); margin-top: 6rpx; display: block; }
}
.option-right {
  text-align: right;
  flex-shrink: 0;
  .option-price { font-size: 36rpx; font-weight: 800; color: #FFD85C; display: block; }
  .option-desc { font-size: 20rpx; color: rgba(255,255,255,0.3); margin-top: 4rpx; display: block; max-width: 160rpx; }
}
.recommend-badge {
  background: #FF4757;
  color: #fff;
  font-size: 18rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  margin-bottom: 8rpx;
  display: inline-block;
}

.pay-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #161630;
  padding: 16rpx 28rpx 60rpx;
  border-top: 1rpx solid rgba(255,255,255,0.07);
}
.pay-meta {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  margin-bottom: 14rpx;
  .pay-total { font-size: 44rpx; font-weight: 800; color: #FFD85C; }
  .pay-name { font-size: 24rpx; color: rgba(255,255,255,0.35); }
}
.btn-pay {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(90deg, #F4A800, #FFD85C);
  color: #0d0d1a;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 800;
  border: none;
  box-shadow: 0 8rpx 28rpx rgba(244,168,0,0.4);
  &[disabled] { opacity: 0.35; box-shadow: none; }
}
</style>
