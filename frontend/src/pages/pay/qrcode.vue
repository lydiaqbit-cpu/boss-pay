<template>
  <view class="page">
    <view class="amount-section">
      <text class="amount-label">需支付金额</text>
      <text class="amount-value">¥{{ amount }}</text>
      <text class="pkg-name">{{ packageName }}</text>
    </view>

    <view class="qr-card">
      <view class="qr-wrap" :class="{ paid: paid }">
        <image :src="qrUrl" mode="aspectFit" class="qr-image" />
        <view v-if="paid" class="paid-mask">
          <view class="check-circle">
            <text class="check-icon">✓</text>
          </view>
          <text class="paid-label">支付成功</text>
        </view>
      </view>

      <view v-if="!paid" class="wechat-tip">
        <text class="wechat-icon">💚</text>
        <text class="wechat-text">微信扫码，钱到人到，童叟无欺</text>
      </view>
      <view v-else class="success-tip">
        <text class="success-text">🎉 老板出手阔绰！员工感激涕零～</text>
      </view>

      <view v-if="!paid" class="mock-hint">
        <text class="mock-text">🔧 演示模式：3秒模拟付款，真实接入微信支付后替换</text>
      </view>
    </view>

    <view v-if="!paid" class="polling-row">
      <view class="dot-pulse">
        <view class="dot" /><view class="dot" /><view class="dot" />
      </view>
      <text class="polling-text">员工正在翘首以盼，老板快扫码吧 👀</text>
    </view>

    <view v-if="paid" class="action-row">
      <button class="btn-detail" @click="toSuccess">查看付款凭证，截图存档 📸</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { get } from '../../utils/request'

const qrUrl = ref('')
const amount = ref('')
const packageName = ref('')
const orderId = ref('')
const paid = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

onLoad((options: any) => {
  qrUrl.value = decodeURIComponent(options?.qrUrl || '')
  amount.value = options?.amount || ''
  packageName.value = decodeURIComponent(options?.packageName || '')
  orderId.value = options?.orderId || ''
})

onMounted(() => {
  timer = setInterval(poll, 1500)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

async function poll() {
  if (!orderId.value || paid.value) return
  try {
    const data = await get<any>(`/pay/order/${orderId.value}`, false)
    if (data.status === 'paid') {
      paid.value = true
      if (timer) clearInterval(timer)
    }
  } catch {}
}

function toSuccess() {
  uni.redirectTo({ url: `/pages/pay/success?orderId=${orderId.value}` })
}
</script>

<style lang="scss">
page { background: #0d0d1a; }
.page { min-height: 100vh; padding: 0 0 60rpx; }

.amount-section {
  background: linear-gradient(160deg, #0d0d1a, #1a1035);
  padding: 60rpx 40rpx 64rpx;
  text-align: center;
  border-bottom: 1rpx solid rgba(255,255,255,0.06);
  .amount-label { font-size: 26rpx; color: rgba(255,255,255,0.4); display: block; margin-bottom: 8rpx; }
  .amount-value { font-size: 80rpx; font-weight: 800; color: #FFD85C; display: block; }
  .pkg-name { font-size: 26rpx; color: rgba(255,255,255,0.4); margin-top: 8rpx; display: block; }
}

.qr-card {
  background: #161630;
  margin: -28rpx 32rpx 0;
  border-radius: 24rpx;
  padding: 40rpx;
  border: 1rpx solid rgba(255,255,255,0.08);
  box-shadow: 0 16rpx 48rpx rgba(0,0,0,0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.qr-wrap {
  width: 360rpx;
  height: 360rpx;
  border: 2rpx solid rgba(255,255,255,0.1);
  border-radius: 18rpx;
  overflow: hidden;
  position: relative;
  margin-bottom: 28rpx;
  &.paid { border-color: #4ade80; }
}
.qr-image { width: 100%; height: 100%; }
.paid-mask {
  position: absolute;
  inset: 0;
  background: rgba(13,13,26,0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
}
.check-circle {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background: linear-gradient(135deg, #22c55e, #4ade80);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 28rpx rgba(34,197,94,0.4);
}
.check-icon { font-size: 60rpx; color: #fff; font-weight: 800; }
.paid-label { font-size: 32rpx; font-weight: 700; color: #4ade80; }

.wechat-tip, .success-tip {
  display: flex;
  align-items: center;
  gap: 10rpx;
  .wechat-icon { font-size: 32rpx; }
  .wechat-text { font-size: 26rpx; color: rgba(255,255,255,0.5); }
  .success-text { font-size: 28rpx; color: #4ade80; font-weight: 600; }
}
.mock-hint {
  margin-top: 24rpx;
  background: rgba(255,216,92,0.07);
  border-radius: 10rpx;
  padding: 14rpx 20rpx;
  border: 1rpx solid rgba(255,216,92,0.15);
  .mock-text { font-size: 22rpx; color: rgba(255,216,92,0.6); }
}

.polling-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  margin-top: 48rpx;
  .polling-text { font-size: 26rpx; color: rgba(255,255,255,0.3); }
}
.dot-pulse {
  display: flex;
  gap: 8rpx;
  .dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 6rpx;
    background: #FFD85C;
    opacity: 0.4;
    animation: pulse 1.2s infinite;
    &:nth-child(2) { animation-delay: 0.3s; }
    &:nth-child(3) { animation-delay: 0.6s; }
  }
}
@keyframes pulse {
  0%, 100% { opacity: 0.2; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
}

.action-row {
  padding: 32rpx 32rpx 0;
  .btn-detail {
    width: 100%;
    height: 96rpx;
    background: linear-gradient(90deg, #F4A800, #FFD85C);
    color: #0d0d1a;
    border-radius: 48rpx;
    font-size: 30rpx;
    font-weight: 800;
    border: none;
    box-shadow: 0 8rpx 28rpx rgba(244,168,0,0.35);
  }
}
</style>
