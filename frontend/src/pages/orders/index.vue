<template>
  <view class="page">
    <!-- 统计卡片 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-val">{{ paidOrders.length }}</text>
        <text class="stat-key">老板付款次数</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-val green">¥{{ totalNet }}</text>
        <text class="stat-key">打工人实得</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-val gray">¥{{ totalFee }}</text>
        <text class="stat-key">平台辛苦费</text>
      </view>
    </view>

    <view v-if="orders.length === 0" class="empty">
      <text class="e-icon">🥲</text>
      <text class="e-tip">老板还没付过钱</text>
      <text class="e-sub">把收款链接甩给他，今天不付明天还得加班</text>
    </view>

    <view v-for="order in orders" :key="order.id" class="order-card">
      <view class="order-header">
        <view class="payer-row">
          <text class="payer-avatar">{{ order.payerName?.charAt(0) || '?' }}</text>
          <view>
            <text class="payer-name">{{ order.payerName }}</text>
            <text class="order-pkg">{{ order.package?.name }}</text>
          </view>
        </view>
        <view>
          <text class="order-amount">¥{{ order.amount }}</text>
          <view class="status-chip" :class="order.status">
            {{ order.status === 'paid' ? '✓ 已到账' : '⏳ 等待' }}
          </view>
        </view>
      </view>

      <view class="order-footer">
        <text class="net-amount">到账 ¥{{ order.netAmount }}</text>
        <view class="footer-right">
          <text class="order-time">{{ fmtTime(order.paidAt || order.createdAt) }}</text>
          <view v-if="order.status === 'paid'" class="receipt-btn" @click="viewReceipt(order.id)">
            <text>🧾 凭证</text>
          </view>
        </view>
      </view>
    </view>

    <view class="bottom-gap" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { get } from '../../utils/request'

const orders = ref<any[]>([])

const paidOrders = computed(() => orders.value.filter(o => o.status === 'paid'))
const totalNet = computed(() => paidOrders.value.reduce((s, o) => s + o.netAmount, 0).toFixed(2))
const totalFee = computed(() => paidOrders.value.reduce((s, o) => s + o.platformFee, 0).toFixed(2))

onMounted(async () => {
  try { orders.value = await get<any[]>('/pay/orders') } catch {}
})

function viewReceipt(orderId: string) {
  uni.navigateTo({ url: `/pages/pay/receipt?orderId=${orderId}` })
}

function fmtTime(t: string) {
  if (!t) return '-'
  const d = new Date(t)
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function pad(n: number) { return String(n).padStart(2, '0') }
</script>

<style lang="scss">
page { background: #0d0d1a; }
.page { min-height: 100vh; padding-bottom: 40rpx; }

.stats-card {
  background: linear-gradient(160deg, #0d0d1a, #1a1035);
  padding: 48rpx 40rpx;
  display: flex;
  align-items: center;
  border-bottom: 1rpx solid rgba(255,255,255,0.06);
  margin-bottom: 24rpx;
}
.stat-item {
  flex: 1;
  text-align: center;
  .stat-val { font-size: 40rpx; font-weight: 800; color: #fff; display: block; &.green { color: #FFD85C; } &.gray { color: rgba(255,255,255,0.35); } }
  .stat-key { font-size: 22rpx; color: rgba(255,255,255,0.4); margin-top: 6rpx; display: block; }
}
.stat-divider { width: 1rpx; height: 60rpx; background: rgba(255,255,255,0.1); }

.empty {
  text-align: center;
  padding: 100rpx 0;
  .e-icon { font-size: 80rpx; display: block; }
  .e-tip { font-size: 32rpx; font-weight: 600; color: rgba(255,255,255,0.6); margin-top: 24rpx; display: block; }
  .e-sub { font-size: 26rpx; color: rgba(255,255,255,0.3); margin-top: 10rpx; display: block; }
}

.order-card {
  background: #161630;
  margin: 0 28rpx 16rpx;
  border-radius: 20rpx;
  overflow: hidden;
  border: 1rpx solid rgba(255,255,255,0.07);
}
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 28rpx 28rpx 20rpx;
}
.payer-row { display: flex; align-items: center; gap: 16rpx; }
.payer-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 36rpx;
  background: rgba(255,216,92,0.15);
  color: #FFD85C;
  font-size: 32rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.payer-name { font-size: 30rpx; font-weight: 700; color: #fff; display: block; }
.order-pkg { font-size: 24rpx; color: rgba(255,255,255,0.35); margin-top: 4rpx; display: block; }
.order-amount { font-size: 40rpx; font-weight: 800; color: #FFD85C; display: block; text-align: right; }
.status-chip {
  font-size: 20rpx;
  padding: 4rpx 14rpx;
  border-radius: 20rpx;
  display: inline-block;
  margin-top: 6rpx;
  float: right;
  &.paid { background: rgba(34,197,94,0.15); color: #4ade80; }
  &.pending { background: rgba(255,216,92,0.12); color: #FFD85C; }
}
.order-footer {
  background: rgba(0,0,0,0.2);
  padding: 16rpx 28rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1rpx solid rgba(255,255,255,0.05);
  .net-amount { font-size: 26rpx; color: #4ade80; font-weight: 700; }
}
.footer-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.order-time { font-size: 24rpx; color: rgba(255,255,255,0.25); }
.receipt-btn {
  background: rgba(255,216,92,0.12);
  border: 1rpx solid rgba(255,216,92,0.3);
  border-radius: 20rpx;
  padding: 6rpx 18rpx;
  font-size: 22rpx;
  color: #FFD85C;
}

.bottom-gap { height: 40rpx; }
</style>
