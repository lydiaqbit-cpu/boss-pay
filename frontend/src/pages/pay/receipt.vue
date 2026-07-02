<template>
  <view class="page">
    <view v-if="loading" class="loading-wrap">
      <text class="loading-text">生成凭证中...</text>
    </view>

    <view v-else-if="order" class="receipt-wrap">
      <!-- 顶部提示 -->
      <text class="screenshot-tip">📸 截图后发给老板，证明他付过血汗钱</text>

      <!-- 凭证卡 -->
      <view class="receipt-card" id="receipt-card">
        <!-- 顶部印章区 -->
        <view class="receipt-header">
          <view class="stamp-circle">
            <text class="stamp-text">已付款</text>
          </view>
          <view class="header-texts">
            <text class="receipt-title">加班费支付凭证</text>
            <text class="receipt-no">凭证编号：{{ order.id.slice(0, 8).toUpperCase() }}</text>
          </view>
        </view>

        <view class="divider-dots" />

        <!-- 核心金额 -->
        <view class="amount-section">
          <text class="amount-label">实际支付金额</text>
          <view class="amount-row">
            <text class="amount-unit">¥</text>
            <text class="amount-val">{{ order.amount }}</text>
          </view>
          <text class="amount-sub">打工人到账 ¥{{ order.netAmount }}（已扣平台 5% 管理费）</text>
        </view>

        <view class="divider-solid" />

        <!-- 详情列表 -->
        <view class="detail-list">
          <view class="detail-row">
            <text class="d-label">付款方</text>
            <text class="d-val bold">{{ order.payerName }}</text>
          </view>
          <view class="detail-row">
            <text class="d-label">收款方</text>
            <text class="d-val">{{ order.user?.nickname || '打工人' }}</text>
          </view>
          <view class="detail-row">
            <text class="d-label">加班套餐</text>
            <text class="d-val">{{ order.package?.name }}</text>
          </view>
          <view class="detail-row">
            <text class="d-label">付款时间</text>
            <text class="d-val">{{ fmtTime(order.paidAt) }}</text>
          </view>
          <view class="detail-row">
            <text class="d-label">状态</text>
            <text class="d-val green">✓ 已完成</text>
          </view>
        </view>

        <view class="divider-dots" />

        <!-- 底部声明 -->
        <view class="receipt-footer">
          <text class="footer-seal">老板请付牛马钱 · 正规收款凭证 · 不接受赖账</text>
          <text class="footer-sub">本凭证由系统自动生成，员工已将青春卖给公司</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="actions">
        <view class="btn-share" @click="shareReceipt">
          <text>📤 分享给老板</text>
        </view>
        <view class="btn-back" @click="uni.navigateBack()">
          <text>返回记录</text>
        </view>
      </view>
    </view>

    <view v-else class="error-wrap">
      <text class="error-text">凭证不存在</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { get } from '../../utils/request'
import { useUserStore } from '../../store/user'

const order = ref<any>(null)
const orderId = ref('')
const loading = ref(true)
const userStore = useUserStore()

onLoad((opt: any) => { orderId.value = opt?.orderId || '' })

onMounted(async () => {
  if (!orderId.value) { loading.value = false; return }
  try {
    // 从员工自己的订单列表里找（已含 package 信息，且有权限）
    const orders = await get<any[]>('/pay/orders')
    order.value = orders.find((o: any) => o.id === orderId.value) || null
    // 补充员工昵称
    if (order.value) order.value.user = { nickname: userStore.userInfo?.nickname }
  } catch {}
  loading.value = false
})

function fmtTime(t: string) {
  if (!t) return '-'
  const d = new Date(t)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function shareReceipt() {
  uni.showActionSheet({
    itemList: ['截图保存后分享', '复制凭证编号'],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.showToast({ title: '截图后发给老板即可 📸', icon: 'none', duration: 2500 })
      } else if (res.tapIndex === 1) {
        uni.setClipboardData({
          data: order.value?.id.slice(0, 8).toUpperCase() || '',
          success: () => uni.showToast({ title: '凭证编号已复制', icon: 'success' })
        })
      }
    }
  })
}

onShareAppMessage(() => ({
  title: `收款凭证 · ${order.value?.payerName} 已付 ¥${order.value?.amount}`,
  path: `/pages/pay/receipt?orderId=${orderId.value}`
}))
</script>

<style lang="scss">
page { background: #1a1008; }
.page { min-height: 100vh; padding: 0 0 60rpx; }

.loading-wrap, .error-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  .loading-text, .error-text { font-size: 28rpx; color: rgba(255,255,255,0.4); }
}

.screenshot-tip {
  display: block;
  text-align: center;
  font-size: 24rpx;
  color: rgba(255,255,255,0.35);
  padding: 32rpx 0 20rpx;
}

.receipt-wrap { padding: 0 28rpx; }

/* ── 凭证卡 ── */
.receipt-card {
  background: #FFFBF4;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 16rpx 60rpx rgba(0,0,0,0.5);
}

.receipt-header {
  background: linear-gradient(135deg, #3D2010 0%, #5C3218 100%);
  padding: 36rpx 36rpx 32rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
}
.stamp-circle {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50rpx;
  border: 4rpx solid #FFD85C;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transform: rotate(-12deg);
}
.stamp-text { font-size: 22rpx; font-weight: 800; color: #FFD85C; letter-spacing: 2rpx; }
.header-texts { flex: 1; }
.receipt-title { font-size: 32rpx; font-weight: 800; color: #fff; display: block; }
.receipt-no { font-size: 20rpx; color: rgba(255,255,255,0.45); margin-top: 8rpx; display: block; font-family: monospace; }

.divider-dots {
  border-top: 3rpx dashed #E8D8C0;
  margin: 0 28rpx;
}

.amount-section {
  padding: 36rpx 36rpx 28rpx;
  text-align: center;
  .amount-label { font-size: 22rpx; color: #8A6A50; display: block; margin-bottom: 12rpx; }
}
.amount-row {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4rpx;
  .amount-unit { font-size: 36rpx; font-weight: 700; color: #C9883D; }
  .amount-val { font-size: 80rpx; font-weight: 900; color: #3D2010; line-height: 1; }
}
.amount-sub { font-size: 20rpx; color: #A08060; margin-top: 12rpx; display: block; }

.divider-solid { height: 1rpx; background: #E8D8C0; margin: 0 28rpx; }

.detail-list { padding: 8rpx 36rpx 8rpx; }
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #F0E4D0;
  &:last-child { border-bottom: none; }
}
.d-label { font-size: 26rpx; color: #8A6A50; }
.d-val {
  font-size: 26rpx;
  color: #3D2010;
  &.bold { font-weight: 700; }
  &.green { color: #16A34A; font-weight: 700; }
}

.receipt-footer {
  background: #FDF5E8;
  padding: 24rpx 36rpx;
  text-align: center;
  border-top: 1rpx solid #E8D8C0;
  .footer-seal { font-size: 20rpx; color: #8A6A50; display: block; font-weight: 600; letter-spacing: 1rpx; }
  .footer-sub { font-size: 18rpx; color: #C4A888; margin-top: 8rpx; display: block; }
}

/* ── 操作按钮 ── */
.actions { margin-top: 32rpx; display: flex; flex-direction: column; gap: 16rpx; }
.btn-share {
  background: linear-gradient(135deg, #C9883D 0%, #B8772A 100%);
  border-radius: 50rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 700;
  color: #fff;
  box-shadow: 0 8rpx 24rpx rgba(180,110,40,0.4);
}
.btn-back {
  border-radius: 50rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: rgba(255,255,255,0.4);
  border: 1rpx solid rgba(255,255,255,0.1);
}
</style>
