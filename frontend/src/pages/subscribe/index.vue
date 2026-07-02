<template>
  <view class="page">
    <view class="hero">
      <text class="hero-icon">👑</text>
      <text class="hero-title">牛马会员</text>
      <text class="hero-sub">让每一分加班费都有保障</text>
    </view>

    <!-- 对比 -->
    <view class="compare-card">
      <view class="compare-header">
        <view class="compare-col header-col"><text>功能</text></view>
        <view class="compare-col header-col center"><text>免费版</text></view>
        <view class="compare-col header-col center yellow"><text>会员版</text></view>
      </view>
      <view v-for="row in features" :key="row.name" class="compare-row">
        <view class="compare-col"><text class="feat-name">{{ row.name }}</text></view>
        <view class="compare-col center"><text class="feat-val gray">{{ row.free }}</text></view>
        <view class="compare-col center"><text class="feat-val yellow">{{ row.vip }}</text></view>
      </view>
    </view>

    <!-- 价格 -->
    <view class="price-section">
      <view
        class="price-card"
        :class="{ selected: selectedPlan === 'month' }"
        @click="selectedPlan = 'month'"
      >
        <text class="plan-name">月度会员</text>
        <view class="plan-price-row">
          <text class="plan-price">¥29</text>
          <text class="plan-unit">/月</text>
        </view>
      </view>
      <view
        class="price-card"
        :class="{ selected: selectedPlan === 'year' }"
        @click="selectedPlan = 'year'"
      >
        <view class="best-tag">最划算</view>
        <text class="plan-name">年度会员</text>
        <view class="plan-price-row">
          <text class="plan-price">¥199</text>
          <text class="plan-unit">/年</text>
        </view>
        <text class="plan-avg">相当于 ¥16.6/月</text>
      </view>
    </view>

    <!-- 支付方式说明 -->
    <view class="pay-tip-card">
      <text class="pay-tip-title">如何开通？</text>
      <text class="pay-tip-text">扫描下方收款码，备注"月度会员"或"年度会员"，转账后联系客服开通（微信：niumajiaban）</text>
      <view class="qr-area">
        <text class="qr-placeholder-text">[ 收款码 ]</text>
        <text class="qr-tip">扫码转账后联系客服</text>
      </view>
    </view>

    <text class="footer-tip">开通后 24 小时内人工审核激活</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const selectedPlan = ref('year')

const features = [
  { name: '加班套餐数量', free: '1个', vip: '无限' },
  { name: '每月确认次数', free: '10次', vip: '无限' },
  { name: '收款凭证导出', free: '✗', vip: '✓' },
  { name: '收款方式数量', free: '1种', vip: '3种' },
  { name: '数据统计', free: '基础', vip: '详细' },
]
</script>

<style lang="scss">
page { background: #0d0d1a; }
.page { min-height: 100vh; padding: 0 28rpx 120rpx; }

.hero { text-align: center; padding: 80rpx 0 48rpx; }
.hero-icon { font-size: 80rpx; display: block; }
.hero-title { font-size: 48rpx; font-weight: 800; color: #FFD85C; display: block; margin-top: 16rpx; }
.hero-sub { font-size: 26rpx; color: rgba(255,255,255,0.4); display: block; margin-top: 12rpx; }

.compare-card {
  background: #161630; border-radius: 20rpx; overflow: hidden;
  border: 1rpx solid rgba(255,255,255,0.07); margin-bottom: 32rpx;
}
.compare-header { display: flex; background: rgba(255,255,255,0.05); padding: 20rpx 24rpx; }
.compare-row { display: flex; padding: 20rpx 24rpx; border-top: 1rpx solid rgba(255,255,255,0.05); }
.compare-col { flex: 1; }
.compare-col.center { text-align: center; }
.header-col text { font-size: 24rpx; color: rgba(255,255,255,0.5); font-weight: 600; }
.header-col.yellow text { color: #FFD85C; }
.feat-name { font-size: 26rpx; color: rgba(255,255,255,0.7); }
.feat-val { font-size: 26rpx; }
.feat-val.gray { color: rgba(255,255,255,0.3); }
.feat-val.yellow { color: #FFD85C; font-weight: 600; }

.price-section { display: flex; gap: 20rpx; margin-bottom: 28rpx; }
.price-card {
  flex: 1; background: #161630; border-radius: 20rpx; padding: 28rpx 20rpx;
  border: 2rpx solid rgba(255,255,255,0.08); text-align: center; position: relative;
}
.price-card.selected { border-color: #FFD85C; background: rgba(255,216,92,0.06); }
.best-tag {
  position: absolute; top: -1rpx; right: 20rpx;
  background: #FFD85C; color: #1a0d00; font-size: 18rpx; font-weight: 700;
  padding: 4rpx 14rpx; border-radius: 0 0 12rpx 12rpx;
}
.plan-name { font-size: 24rpx; color: rgba(255,255,255,0.5); display: block; margin-bottom: 12rpx; }
.plan-price-row { display: flex; align-items: baseline; justify-content: center; gap: 4rpx; }
.plan-price { font-size: 52rpx; font-weight: 800; color: #FFD85C; }
.plan-unit { font-size: 24rpx; color: rgba(255,216,92,0.6); }
.plan-avg { font-size: 20rpx; color: rgba(255,255,255,0.3); display: block; margin-top: 8rpx; }

.pay-tip-card {
  background: #161630; border-radius: 20rpx; padding: 32rpx 28rpx;
  border: 1rpx solid rgba(255,255,255,0.07); margin-bottom: 24rpx;
}
.pay-tip-title { font-size: 28rpx; font-weight: 700; color: #fff; display: block; margin-bottom: 16rpx; }
.pay-tip-text { font-size: 24rpx; color: rgba(255,255,255,0.5); line-height: 1.7; display: block; }
.qr-area { text-align: center; padding: 32rpx 0 8rpx; }
.qr-placeholder-text { font-size: 28rpx; color: rgba(255,255,255,0.15); display: block; }
.qr-tip { font-size: 22rpx; color: rgba(255,255,255,0.25); display: block; margin-top: 12rpx; }

.footer-tip { font-size: 22rpx; color: rgba(255,255,255,0.2); display: block; text-align: center; }
</style>
