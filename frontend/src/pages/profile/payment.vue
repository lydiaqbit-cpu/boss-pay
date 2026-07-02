<template>
  <view class="page">

    <!-- 微信收款码 -->
    <view class="method-card" :class="{ 'is-default': form.defaultPaymentMethod === 'wechat' }">
      <view class="card-header">
        <view class="card-title-row">
          <text class="method-icon">💚</text>
          <text class="method-name">微信收款码</text>
          <text v-if="form.wechatQrUrl" class="status-dot">已设置</text>
        </view>
        <view
          v-if="form.wechatQrUrl"
          class="default-btn"
          :class="{ active: form.defaultPaymentMethod === 'wechat' }"
          @click="setDefault('wechat')"
        >
          <text>{{ form.defaultPaymentMethod === 'wechat' ? '⭐ 默认' : '设为默认' }}</text>
        </view>
      </view>

      <view class="qr-upload" @click="uploadWechatQr">
        <image v-if="form.wechatQrUrl" :src="form.wechatQrUrl" class="qr-preview" mode="aspectFit"/>
        <view v-else class="qr-placeholder">
          <text class="qr-plus">＋</text>
          <text class="qr-hint">上传微信收款码</text>
        </view>
      </view>
      <text class="field-tip">微信 → 收付款 → 二维码收款 → 保存图片</text>
      <text v-if="form.wechatQrUrl" class="reupload-tip" @click="uploadWechatQr">重新上传</text>
    </view>

    <!-- 支付宝 -->
    <view class="method-card" :class="{ 'is-default': form.defaultPaymentMethod === 'alipay' }">
      <view class="card-header">
        <view class="card-title-row">
          <text class="method-icon">💙</text>
          <text class="method-name">支付宝</text>
          <text v-if="form.alipayAccount" class="status-dot">已设置</text>
        </view>
        <view
          v-if="form.alipayAccount"
          class="default-btn"
          :class="{ active: form.defaultPaymentMethod === 'alipay' }"
          @click="setDefault('alipay')"
        >
          <text>{{ form.defaultPaymentMethod === 'alipay' ? '⭐ 默认' : '设为默认' }}</text>
        </view>
      </view>
      <view class="field-row">
        <text class="field-label">账号</text>
        <input v-model="form.alipayAccount" class="field-input" placeholder="手机号或邮箱" placeholder-class="ph"/>
      </view>
      <view class="field-row">
        <text class="field-label">姓名</text>
        <input v-model="form.alipayName" class="field-input" placeholder="真实姓名（老板转账时要对上）" placeholder-class="ph"/>
      </view>
    </view>

    <!-- 银行卡 -->
    <view class="method-card" :class="{ 'is-default': form.defaultPaymentMethod === 'bank' }">
      <view class="card-header">
        <view class="card-title-row">
          <text class="method-icon">🏦</text>
          <text class="method-name">银行卡</text>
          <text v-if="form.bankCard" class="status-dot">已设置</text>
        </view>
        <view
          v-if="form.bankCard"
          class="default-btn"
          :class="{ active: form.defaultPaymentMethod === 'bank' }"
          @click="setDefault('bank')"
        >
          <text>{{ form.defaultPaymentMethod === 'bank' ? '⭐ 默认' : '设为默认' }}</text>
        </view>
      </view>
      <view class="field-row">
        <text class="field-label">卡号</text>
        <input v-model="form.bankCard" class="field-input" placeholder="银行卡号" placeholder-class="ph" type="number"/>
      </view>
      <view class="field-row">
        <text class="field-label">开户行</text>
        <input v-model="form.bankName" class="field-input" placeholder="如：工商银行" placeholder-class="ph"/>
      </view>
      <view class="field-row">
        <text class="field-label">持卡人</text>
        <input v-model="form.bankHolder" class="field-input" placeholder="真实姓名" placeholder-class="ph"/>
      </view>
    </view>

    <button class="btn-save" :loading="saving" @click="handleSave">保存收款方式</button>

    <view class="tip-card">
      <text class="tip-text">💡 建议设置多种收款方式，老板用哪个方便用哪个，钱到手才是真的</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get, put } from '../../utils/request'

const saving = ref(false)
const form = ref({
  wechatQrUrl: '',
  alipayAccount: '',
  alipayName: '',
  bankCard: '',
  bankName: '',
  bankHolder: '',
  defaultPaymentMethod: ''
})

onMounted(async () => {
  try {
    const data = await get<any>('/user/payment')
    if (data) Object.assign(form.value, data)
  } catch {}
})

function setDefault(method: string) {
  form.value.defaultPaymentMethod = form.value.defaultPaymentMethod === method ? '' : method
}

function uploadWechatQr() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      form.value.wechatQrUrl = res.tempFilePaths[0]
      if (!form.value.defaultPaymentMethod) form.value.defaultPaymentMethod = 'wechat'
      uni.showToast({ title: '已选择图片', icon: 'success' })
    }
  })
}

async function handleSave() {
  saving.value = true
  try {
    await put('/user/payment', form.value)
    uni.showToast({ title: '保存成功 💰', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 800)
  } catch {
    uni.showToast({ title: '保存失败，再试一次', icon: 'none' })
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss">
page { background: #0d0d1a; }
.page { min-height: 100vh; padding: 24rpx 28rpx 120rpx; }

.method-card {
  background: #161630; border-radius: 24rpx; padding: 28rpx;
  margin-bottom: 24rpx; border: 2rpx solid rgba(255,255,255,0.07);
  transition: all 0.2s;
}
.method-card.is-default {
  border-color: #FFD85C;
  background: rgba(255,216,92,0.05);
}

.card-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 20rpx;
}
.card-title-row { display: flex; align-items: center; gap: 12rpx; }
.method-icon { font-size: 36rpx; }
.method-name { font-size: 30rpx; font-weight: 700; color: #fff; }
.status-dot {
  font-size: 20rpx; color: #4ade80; background: rgba(74,222,128,0.12);
  padding: 4rpx 14rpx; border-radius: 20rpx;
}
.default-btn {
  font-size: 22rpx; color: rgba(255,255,255,0.4);
  border: 1rpx solid rgba(255,255,255,0.15); border-radius: 30rpx;
  padding: 8rpx 20rpx;
}
.default-btn.active {
  color: #FFD85C; border-color: #FFD85C;
  background: rgba(255,216,92,0.1);
}

.qr-upload { display: flex; justify-content: center; margin-bottom: 16rpx; }
.qr-preview { width: 260rpx; height: 260rpx; border-radius: 16rpx; background: #fff; }
.qr-placeholder {
  width: 260rpx; height: 260rpx; border-radius: 16rpx;
  border: 2rpx dashed rgba(255,255,255,0.15);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12rpx;
}
.qr-plus { font-size: 64rpx; color: rgba(255,255,255,0.2); line-height: 1; }
.qr-hint { font-size: 24rpx; color: rgba(255,255,255,0.3); }
.field-tip { font-size: 22rpx; color: rgba(255,255,255,0.25); display: block; text-align: center; }
.reupload-tip { font-size: 22rpx; color: #FFD85C; display: block; text-align: center; margin-top: 10rpx; }

.field-row {
  display: flex; align-items: center; padding: 20rpx 0;
  border-bottom: 1rpx solid rgba(255,255,255,0.06);
}
.field-row:last-child { border-bottom: none; }
.field-label { font-size: 26rpx; color: rgba(255,255,255,0.45); width: 120rpx; flex-shrink: 0; }
.field-input { flex: 1; font-size: 28rpx; color: #fff; height: 60rpx; background: transparent; }
.ph { color: rgba(255,255,255,0.18); }

.btn-save {
  width: 100%; height: 100rpx;
  background: linear-gradient(135deg, #C9883D, #B8772A);
  color: #fff; border-radius: 50rpx; font-size: 32rpx; font-weight: 800; border: none;
  box-shadow: 0 8rpx 28rpx rgba(180,110,40,0.4); margin-bottom: 24rpx;
}

.tip-card {
  background: rgba(255,216,92,0.07); border-radius: 16rpx; padding: 20rpx 24rpx;
  border: 1rpx solid rgba(255,216,92,0.15);
}
.tip-text { font-size: 24rpx; color: rgba(255,216,92,0.7); line-height: 1.7; }
</style>
