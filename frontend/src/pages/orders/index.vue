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
          <ellipse cx="340" cy="518" rx="145" ry="16" fill="#C8A870" opacity="0.22"/>
          <path d="M252 478 Q255 500 340 504 Q425 500 428 478 Z" fill="#C8B89A"/>
          <ellipse cx="340" cy="477" rx="90" ry="18" fill="#D8C8A8"/>
          <ellipse cx="340" cy="477" rx="90" ry="18" fill="none" stroke="#A89878" stroke-width="3"/>
          <path d="M280 470 Q340 474 400 470" stroke="#A89878" stroke-width="1.5" fill="none" opacity="0.5"/>
          <path d="M448 430 Q520 405 528 348 Q532 308 505 295 Q482 286 474 308" stroke="#E09848" stroke-width="30" fill="none" stroke-linecap="round"/>
          <ellipse cx="330" cy="388" rx="132" ry="118" fill="#E8AA60"/>
          <ellipse cx="330" cy="402" rx="82" ry="76" fill="#F5D898" opacity="0.65"/>
          <path d="M200 348 Q212 336 222 348" stroke="#C88840" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.5"/>
          <path d="M196 372 Q208 360 220 372" stroke="#C88840" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.5"/>
          <path d="M196 396 Q208 384 220 396" stroke="#C88840" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.5"/>
          <ellipse cx="232" cy="476" rx="52" ry="30" fill="#E8AA60"/>
          <path d="M208 468 Q218 460 228 468" stroke="#C88840" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.6"/>
          <path d="M228 464 Q238 456 248 464" stroke="#C88840" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.6"/>
          <path d="M248 468 Q258 460 268 468" stroke="#C88840" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.6"/>
          <path d="M440 390 Q470 360 475 310 Q478 280 460 268" stroke="#E8AA60" stroke-width="48" fill="none" stroke-linecap="round"/>
          <ellipse cx="458" cy="262" rx="36" ry="30" fill="#E8AA60"/>
          <path d="M440 250 Q450 240 460 250" stroke="#C88840" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.6"/>
          <path d="M458 245 Q468 236 476 246" stroke="#C88840" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.6"/>
          <circle cx="310" cy="218" r="112" fill="#E8AA60"/>
          <path d="M268 116 Q278 104 290 116" stroke="#C88840" stroke-width="5.5" fill="none" stroke-linecap="round" opacity="0.5"/>
          <path d="M300 108 Q310 96 322 108" stroke="#C88840" stroke-width="5.5" fill="none" stroke-linecap="round" opacity="0.5"/>
          <path d="M332 116 Q342 104 352 116" stroke="#C88840" stroke-width="5.5" fill="none" stroke-linecap="round" opacity="0.5"/>
          <path d="M215 162 L232 108 L272 158 Z" fill="#E8AA60"/>
          <path d="M222 158 L235 122 L266 154 Z" fill="#E8758A" opacity="0.55"/>
          <path d="M348 158 L388 108 L405 162 Z" fill="#E8AA60"/>
          <path d="M354 154 L384 122 L397 158 Z" fill="#E8758A" opacity="0.55"/>
          <ellipse cx="252" cy="250" rx="38" ry="30" fill="#F0C070" opacity="0.25"/>
          <ellipse cx="368" cy="250" rx="38" ry="30" fill="#F0C070" opacity="0.25"/>
          <ellipse cx="278" cy="214" rx="28" ry="32" fill="white"/>
          <ellipse cx="342" cy="214" rx="28" ry="32" fill="white"/>
          <ellipse cx="280" cy="220" rx="17" ry="22" fill="#1A0800"/>
          <ellipse cx="344" cy="220" rx="17" ry="22" fill="#1A0800"/>
          <circle cx="290" cy="208" r="7" fill="white"/>
          <circle cx="354" cy="208" r="7" fill="white"/>
          <circle cx="272" cy="228" r="3.5" fill="white"/>
          <circle cx="336" cy="228" r="3.5" fill="white"/>
          <path d="M252 194 Q278 185 304 191" stroke="#C88840" stroke-width="5" fill="none" stroke-linecap="round"/>
          <path d="M318 191 Q342 185 368 194" stroke="#C88840" stroke-width="5" fill="none" stroke-linecap="round"/>
          <path d="M300 252 L310 263 L320 252 Z" fill="#E8758A"/>
          <path d="M283 278 Q295 288 310 286 Q325 288 337 278" stroke="#8B4513" stroke-width="3" fill="none" stroke-linecap="round"/>
          <path d="M283 278 Q278 290 280 295" stroke="#8B4513" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path d="M337 278 Q342 290 340 295" stroke="#8B4513" stroke-width="2" fill="none" stroke-linecap="round"/>
          <ellipse cx="244" cy="265" rx="24" ry="15" fill="#E8758A" opacity="0.22"/>
          <ellipse cx="376" cy="265" rx="24" ry="15" fill="#E8758A" opacity="0.22"/>
          <line x1="245" y1="260" x2="168" y2="248" stroke="#8B6040" stroke-width="1.8" stroke-linecap="round" opacity="0.55"/>
          <line x1="243" y1="270" x2="165" y2="268" stroke="#8B6040" stroke-width="1.8" stroke-linecap="round" opacity="0.55"/>
          <line x1="246" y1="280" x2="172" y2="288" stroke="#8B6040" stroke-width="1.8" stroke-linecap="round" opacity="0.55"/>
          <line x1="375" y1="260" x2="452" y2="248" stroke="#8B6040" stroke-width="1.8" stroke-linecap="round" opacity="0.55"/>
          <line x1="377" y1="270" x2="455" y2="268" stroke="#8B6040" stroke-width="1.8" stroke-linecap="round" opacity="0.55"/>
          <line x1="374" y1="280" x2="448" y2="288" stroke="#8B6040" stroke-width="1.8" stroke-linecap="round" opacity="0.55"/>
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
