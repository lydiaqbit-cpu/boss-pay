<template>
  <view class="page">
    <view class="success-area">
      <view class="check-wrap">
        <text class="check">✓</text>
      </view>
      <text class="title">到账了！到账了！</text>
      <text class="sub">{{ order?.payerName || '老板' }} 是个体面人 🫡 员工铭记于心</text>
    </view>

    <view v-if="order" class="detail-card">
      <view class="detail-row">
        <text class="d-key">套餐</text>
        <text class="d-val">{{ order.package?.name }}</text>
      </view>
      <view class="detail-row">
        <text class="d-key">付款金额</text>
        <text class="d-val highlight">¥{{ order.amount }}</text>
      </view>
      <view class="detail-row">
        <text class="d-key">付款人</text>
        <text class="d-val">{{ order.payerName }}</text>
      </view>
      <view class="detail-row">
        <text class="d-key">付款时间</text>
        <text class="d-val">{{ fmtTime(order.paidAt) }}</text>
      </view>
      <view class="detail-row">
        <text class="d-key">订单号</text>
        <text class="d-val mono">{{ order.id.slice(0,8).toUpperCase() }}</text>
      </view>
    </view>

    <view class="divider-line" />
    <text class="share-tip">截图发给员工，证明你是个好老板 📸</text>

    <button class="btn-close" @click="uni.reLaunch({ url: '/pages/auth/login' })">关闭页面，继续摸鱼 🐟</button>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { get } from '../../utils/request'

const order = ref<any>(null)
const orderId = ref('')

onLoad((opt: any) => { orderId.value = opt?.orderId || '' })

onMounted(async () => {
  if (!orderId.value) return
  order.value = await get<any>(`/pay/order/${orderId.value}`, false)
})

function fmtTime(t: string) {
  if (!t) return '-'
  const d = new Date(t)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function pad(n: number) { return String(n).padStart(2, '0') }
</script>

<style lang="scss">
page { background: #0d0d1a; }
.page { min-height: 100vh; padding: 0 32rpx 60rpx; display: flex; flex-direction: column; align-items: center; background: #0d0d1a; }

.success-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0 48rpx;
}
.check-wrap {
  width: 160rpx;
  height: 160rpx;
  border-radius: 80rpx;
  background: linear-gradient(135deg, #F4A800, #FFD85C);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 48rpx rgba(244,168,0,0.45);
  margin-bottom: 32rpx;
  .check { font-size: 80rpx; color: #0d0d1a; font-weight: 800; }
}
.title { font-size: 48rpx; font-weight: 800; color: #fff; margin-bottom: 12rpx; }
.sub { font-size: 28rpx; color: rgba(255,255,255,0.4); }

.detail-card {
  width: 100%;
  background: #161630;
  border-radius: 20rpx;
  padding: 8rpx 28rpx;
  border: 1rpx solid rgba(255,255,255,0.07);
  margin-bottom: 32rpx;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 0;
  border-bottom: 1rpx solid rgba(255,255,255,0.06);
  &:last-child { border-bottom: none; }
  .d-key { font-size: 28rpx; color: rgba(255,255,255,0.35); }
  .d-val { font-size: 28rpx; color: rgba(255,255,255,0.8); &.highlight { color: #FFD85C; font-weight: 800; font-size: 32rpx; } &.mono { font-family: monospace; color: rgba(255,255,255,0.4); } }
}

.divider-line { width: 100%; height: 1rpx; background: rgba(255,255,255,0.07); margin-bottom: 24rpx; }
.share-tip { font-size: 24rpx; color: rgba(255,255,255,0.3); margin-bottom: 40rpx; }

.btn-close {
  width: 100%;
  height: 96rpx;
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.5);
  border-radius: 48rpx;
  font-size: 30rpx;
  border: 1rpx solid rgba(255,255,255,0.1);
}
</style>
