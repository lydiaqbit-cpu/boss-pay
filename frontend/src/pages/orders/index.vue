<template>
  <view class="page">
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-val">{{ confirmedOrders.length }}</text>
        <text class="stat-key">已收款笔数</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-val green">¥{{ totalNet }}</text>
        <text class="stat-key">累计到账</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-val orange">{{ pendingOrders.length }}</text>
        <text class="stat-key">悬而未决</text>
      </view>
    </view>

    <view v-if="orders.length === 0" class="empty">
      <view class="beggar-wrap">
        <image src="/static/cat-hungry.png" class="cat-img" mode="aspectFit"/>
      </view>
      <text class="e-tip">老板一文未付，快去要钱</text>
      <text class="e-sub">把收款链接甩给老板，今日不付来日加倍奉陪</text>
    </view>

    <view v-for="order in orders" :key="order.id" class="order-card">
      <view class="order-header">
        <view class="payer-row">
          <view class="payer-avatar"><text>{{ order.payerName?.charAt(0) || '?' }}</text></view>
          <view class="payer-info">
            <text class="payer-name">{{ order.payerName }}</text>
            <text class="order-pkg">{{ order.package?.name }}</text>
            <text v-if="order.payerNote" class="order-note">备注：{{ order.payerNote }}</text>
          </view>
        </view>
        <view class="right-col">
          <text class="order-amount">¥{{ order.amount }}</text>
          <view class="status-chip" :class="order.status">{{ statusText(order.status) }}</view>
        </view>
      </view>

      <view v-if="order.status === 'boss_paid'" class="action-bar">
        <view class="btn-reject" @click="handleReject(order.id)">未收到，拒绝</view>
        <view class="btn-confirm" @click="handleConfirm(order.id)">已收到，确认</view>
      </view>

      <view class="order-footer">
        <text class="net-amount">到账 ¥{{ order.netAmount }}</text>
        <view class="footer-right">
          <text class="order-time">{{ fmtTime(order.confirmedAt || order.createdAt) }}</text>
          <view v-if="order.status === 'confirmed'" class="receipt-btn" @click="viewReceipt(order.id)">
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
import { get, post } from '../../utils/request'
import { track } from '../../utils/track'

const orders = ref<any[]>([])
const confirmedOrders = computed(() => orders.value.filter(o => o.status === 'confirmed'))
const pendingOrders = computed(() => orders.value.filter(o => o.status === 'boss_paid'))
const totalNet = computed(() => confirmedOrders.value.reduce((s, o) => s + o.netAmount, 0).toFixed(2))

onMounted(loadOrders)

async function loadOrders() {
  try { orders.value = await get<any[]>('/pay/orders') } catch {}
}

function statusText(status: string) {
  if (status === 'boss_paid') return '⏳ 待确认'
  if (status === 'confirmed') return '✓ 已到账'
  if (status === 'rejected') return '✗ 已拒绝'
  return '等待'
}

async function handleConfirm(orderId: string) {
  uni.showModal({
    title: '确认收款', content: '确认已收到这笔转账？',
    success: async (res) => {
      if (!res.confirm) return
      try { await post(`/pay/orders/${orderId}/confirm`, {}); track('confirm_order'); uni.showToast({ title: '已确认收款！', icon: 'success' }); await loadOrders() }
      catch { uni.showToast({ title: '操作失败', icon: 'none' }) }
    }
  })
}

async function handleReject(orderId: string) {
  uni.showModal({
    title: '拒绝收款', content: '确认未收到这笔转账？',
    success: async (res) => {
      if (!res.confirm) return
      try { await post(`/pay/orders/${orderId}/reject`, {}); track('reject_order'); uni.showToast({ title: '已拒绝', icon: 'none' }); await loadOrders() }
      catch { uni.showToast({ title: '操作失败', icon: 'none' }) }
    }
  })
}

function viewReceipt(orderId: string) { uni.navigateTo({ url: `/pages/pay/receipt?orderId=${orderId}` }) }
function fmtTime(t: string) {
  if (!t) return '-'
  const d = new Date(t)
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function pad(n: number) { return String(n).padStart(2, '0') }
</script>

<style lang="scss">
page { background: #F7F4F0; }
.page { min-height: 100vh; padding-bottom: 40rpx; }

.stats-card {
  background: linear-gradient(160deg, #1E1A14, #3D3526);
  padding: 48rpx 40rpx 40rpx;
  display: flex; align-items: center;
  border-radius: 0 0 40rpx 40rpx;
  box-shadow: 0 8rpx 24rpx rgba(30,26,20,0.3);
  margin-bottom: 24rpx;
}
.stat-item { flex: 1; text-align: center; }
.stat-val { font-size: 40rpx; font-weight: 800; color: #F7F4F0; display: block; }
.stat-val.green { color: #C4A882; }
.stat-val.orange { color: #E8A090; }
.stat-key { font-size: 22rpx; color: rgba(196,168,130,0.7); margin-top: 6rpx; display: block; letter-spacing: 1rpx; }
.stat-divider { width: 1rpx; height: 56rpx; background: rgba(196,168,130,0.25); }

.empty { text-align: center; padding: 80rpx 0; }
.e-tip { font-size: 30rpx; font-weight: 600; color: #1E1A14; margin-top: 20rpx; display: block; }
.e-sub { font-size: 24rpx; color: #8B7355; margin-top: 10rpx; display: block; padding: 0 40rpx; line-height: 1.6; }

.beggar-wrap { display: flex; justify-content: center; margin-bottom: 8rpx; }
.cat-img { width: 240rpx; height: 240rpx; }

.order-card {
  background: #fff; margin: 0 24rpx 16rpx;
  border-radius: 8rpx; overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(30,26,20,0.07);
  border: 1rpx solid #C8B89A;
}
.order-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 24rpx 24rpx 16rpx;
}
.payer-row { display: flex; align-items: flex-start; gap: 14rpx; flex: 1; }
.payer-avatar {
  width: 68rpx; height: 68rpx; border-radius: 4rpx;
  background: #F0EAE2; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  text { font-size: 30rpx; color: #A8402E; font-weight: 800; }
}
.payer-info { flex: 1; }
.payer-name { font-size: 28rpx; font-weight: 700; color: #1E1A14; display: block; }
.order-pkg { font-size: 22rpx; color: #8B7355; margin-top: 4rpx; display: block; }
.order-note { font-size: 22rpx; color: #C4A882; margin-top: 4rpx; display: block; }
.right-col { text-align: right; flex-shrink: 0; }
.order-amount { font-size: 36rpx; font-weight: 800; color: #D94F3D; display: block; }
.status-chip {
  font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 4rpx;
  display: inline-block; margin-top: 6rpx;
}
.status-chip.boss_paid { color: #A8402E; background: #FBF8F5; border: 1rpx solid #E8C8A8; }
.status-chip.confirmed { color: #5A6A30; background: #EEF2E0; border: 1rpx solid #C8D4A0; }
.status-chip.rejected { color: #8B7355; background: #F0EAE2; border: 1rpx solid #C8B89A; }

.action-bar { display: flex; gap: 12rpx; padding: 0 24rpx 16rpx; }
.btn-reject {
  flex: 1; height: 72rpx; border-radius: 6rpx;
  border: 1rpx solid #C8B89A; color: #8B7355;
  font-size: 26rpx; display: flex; align-items: center; justify-content: center;
  background: #F8F5F2;
}
.btn-confirm {
  flex: 2; height: 72rpx; border-radius: 6rpx;
  background: #1E1A14; color: #F7F4F0;
  font-size: 26rpx; font-weight: 700; display: flex; align-items: center; justify-content: center;
  letter-spacing: 1rpx;
}

.order-footer {
  background: #F8F5F2; padding: 14rpx 24rpx;
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1rpx solid #E5D8C4;
}
.net-amount { font-size: 24rpx; color: #D94F3D; font-weight: 700; }
.footer-right { display: flex; align-items: center; gap: 14rpx; }
.order-time { font-size: 22rpx; color: #C4A882; }
.receipt-btn {
  background: #F0EAE2; border: 1rpx solid #C8B89A;
  border-radius: 4rpx; padding: 6rpx 16rpx; font-size: 22rpx; color: #A8402E;
}
.bottom-gap { height: 40rpx; }
</style>
