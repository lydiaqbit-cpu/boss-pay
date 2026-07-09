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
        <svg width="200" height="220" viewBox="0 0 680 540" xmlns="http://www.w3.org/2000/svg">
          <path d="M218 318 Q234 300 274 290 L316 280 L340 304 L364 280 L406 290 Q446 300 462 318 L474 510 Q340 526 206 510 Z" fill="#5B7A8F"/>
          <path d="M316 280 L340 315 L364 280 L340 288 Z" fill="#4A6A7E"/>
          <path d="M276 292 L316 280 L340 315 L314 310 Z" fill="#EBF0F5"/>
          <path d="M404 292 L364 280 L340 315 L366 310 Z" fill="#EBF0F5"/>
          <circle cx="340" cy="340" r="5" fill="#4A6A7E"/>
          <circle cx="340" cy="365" r="5" fill="#4A6A7E"/>
          <circle cx="340" cy="390" r="5" fill="#4A6A7E"/>
          <path d="M220 334 Q183 348 168 382 Q158 405 164 424" stroke="#D4A96A" stroke-width="42" fill="none" stroke-linecap="round"/>
          <path d="M134 445 Q140 412 162 408 Q184 408 192 424 Q198 440 186 452 Q166 462 148 456 Q134 452 134 445Z" fill="#D4A96A"/>
          <path d="M460 334 Q497 348 512 382 Q522 405 516 424" stroke="#D4A96A" stroke-width="42" fill="none" stroke-linecap="round"/>
          <path d="M546 445 Q540 412 518 408 Q496 408 488 424 Q482 440 494 452 Q514 462 532 456 Q546 452 546 445Z" fill="#D4A96A"/>
          <rect x="316" y="274" width="48" height="28" rx="5" fill="#D4A96A"/>
          <ellipse cx="340" cy="200" rx="85" ry="90" fill="#D4A96A"/>
          <ellipse cx="255" cy="208" rx="14" ry="17" fill="#D4A96A"/>
          <ellipse cx="425" cy="208" rx="14" ry="17" fill="#D4A96A"/>
          <path d="M257 188 Q263 118 340 106 Q417 118 423 188 Q410 148 340 138 Q270 148 257 188 Z" fill="#2A1A08"/>
          <path d="M257 188 Q252 162 258 140 Q264 118 276 108" stroke="#2A1A08" stroke-width="22" fill="none" stroke-linecap="round"/>
          <path d="M423 188 Q428 162 422 140 Q416 118 404 108" stroke="#2A1A08" stroke-width="22" fill="none" stroke-linecap="round"/>
          <ellipse cx="306" cy="198" rx="20" ry="15" fill="white"/>
          <circle cx="309" cy="201" r="9" fill="#1A0A00"/>
          <circle cx="313" cy="197" r="3.5" fill="white"/>
          <ellipse cx="374" cy="198" rx="20" ry="15" fill="white"/>
          <circle cx="377" cy="201" r="9" fill="#1A0A00"/>
          <circle cx="381" cy="197" r="3.5" fill="white"/>
          <path d="M286 194 Q306 188 326 194" fill="#D4A96A"/>
          <path d="M354 194 Q374 188 394 194" fill="#D4A96A"/>
          <path d="M286 181 Q306 175 324 179" stroke="#2A1A08" stroke-width="5" fill="none" stroke-linecap="round"/>
          <path d="M356 179 Q374 175 394 181" stroke="#2A1A08" stroke-width="5" fill="none" stroke-linecap="round"/>
          <path d="M331 217 Q337 226 348 224" stroke="#B07040" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <path d="M318 247 Q340 242 362 247" stroke="#8B4513" stroke-width="3" fill="none" stroke-linecap="round"/>
          <ellipse cx="284" cy="228" rx="16" ry="10" fill="#D4857A" opacity="0.26"/>
          <ellipse cx="396" cy="228" rx="16" ry="10" fill="#D4857A" opacity="0.26"/>
          <path d="M440 132 Q445 124 440 116 Q435 124 440 132Z" fill="#87CEEB" opacity="0.75"/>
          <path d="M242 137 Q237 129 242 121 Q247 129 242 137Z" fill="#87CEEB" opacity="0.65"/>
          <path d="M457 97 L465 105 M465 97 L457 105" stroke="#A8402E" stroke-width="4" stroke-linecap="round" opacity="0.65"/>
          <path d="M218 102 L226 110 M226 102 L218 110" stroke="#A8402E" stroke-width="3.5" stroke-linecap="round" opacity="0.55"/>
        </svg>
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
