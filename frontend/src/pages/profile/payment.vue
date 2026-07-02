<template>
  <view class="page">
    <view class="tip-banner">
      <text class="tip-icon">💡</text>
      <text class="tip-text">至少设置一种收款方式，老板才能扫码转账给你</text>
    </view>

    <!-- 微信收款码 -->
    <view class="section">
      <text class="section-title">微信收款码</text>
      <view class="qr-upload" @click="uploadWechatQr">
        <image v-if="form.wechatQrUrl" :src="form.wechatQrUrl" class="qr-preview" mode="aspectFit"/>
        <view v-else class="qr-placeholder">
          <text class="qr-plus">＋</text>
          <text class="qr-hint">上传微信收款码</text>
        </view>
      </view>
      <text class="field-tip">微信 → 收付款 → 二维码收款 → 保存图片</text>
    </view>

    <!-- 支付宝 -->
    <view class="section">
      <text class="section-title">支付宝</text>
      <view class="field-row">
        <text class="field-label">账号</text>
        <input v-model="form.alipayAccount" class="field-input" placeholder="手机号或邮箱" placeholder-class="ph"/>
      </view>
      <view class="field-row">
        <text class="field-label">姓名</text>
        <input v-model="form.alipayName" class="field-input" placeholder="真实姓名" placeholder-class="ph"/>
      </view>
    </view>

    <!-- 银行卡 -->
    <view class="section">
      <text class="section-title">银行卡</text>
      <view class="field-row">
        <text class="field-label">卡号</text>
        <input v-model="form.bankCard" class="field-input" placeholder="银行卡号" placeholder-class="ph" type="number"/>
      </view>
      <view class="field-row">
        <text class="field-label">开户行</text>
        <input v-model="form.bankName" class="field-input" placeholder="如：中国工商银行" placeholder-class="ph"/>
      </view>
      <view class="field-row">
        <text class="field-label">持卡人</text>
        <input v-model="form.bankHolder" class="field-input" placeholder="真实姓名" placeholder-class="ph"/>
      </view>
    </view>

    <button class="btn-save" :loading="saving" @click="handleSave">保存收款方式</button>
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
  bankHolder: ''
})

onMounted(async () => {
  try {
    const data = await get<any>('/user/payment')
    Object.assign(form.value, data)
  } catch {}
})

function uploadWechatQr() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      // 临时路径直接用于预览，实际项目应上传到OSS/CDN
      form.value.wechatQrUrl = res.tempFilePaths[0]
      uni.showToast({ title: '已选择图片', icon: 'success' })
    }
  })
}

async function handleSave() {
  saving.value = true
  try {
    await put('/user/payment', form.value)
    uni.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 800)
  } catch {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss">
page { background: #0d0d1a; }
.page { min-height: 100vh; padding: 24rpx 28rpx 120rpx; }

.tip-banner {
  display: flex; align-items: flex-start; gap: 16rpx;
  background: rgba(255,216,92,0.08); border: 1rpx solid rgba(255,216,92,0.2);
  border-radius: 16rpx; padding: 20rpx 24rpx; margin-bottom: 32rpx;
}
.tip-icon { font-size: 28rpx; flex-shrink: 0; }
.tip-text { font-size: 24rpx; color: rgba(255,216,92,0.8); line-height: 1.6; }

.section { background: #161630; border-radius: 20rpx; padding: 28rpx; margin-bottom: 24rpx; border: 1rpx solid rgba(255,255,255,0.07); }
.section-title { font-size: 26rpx; font-weight: 700; color: #FFD85C; display: block; margin-bottom: 20rpx; }

.qr-upload { display: flex; justify-content: center; }
.qr-preview { width: 240rpx; height: 240rpx; border-radius: 12rpx; }
.qr-placeholder {
  width: 240rpx; height: 240rpx; border-radius: 12rpx;
  border: 2rpx dashed rgba(255,255,255,0.2);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12rpx;
}
.qr-plus { font-size: 60rpx; color: rgba(255,255,255,0.2); }
.qr-hint { font-size: 24rpx; color: rgba(255,255,255,0.3); }
.field-tip { font-size: 22rpx; color: rgba(255,255,255,0.25); display: block; text-align: center; margin-top: 16rpx; }

.field-row {
  display: flex; align-items: center; padding: 20rpx 0;
  border-bottom: 1rpx solid rgba(255,255,255,0.06);
}
.field-row:last-child { border-bottom: none; }
.field-label { font-size: 26rpx; color: rgba(255,255,255,0.5); width: 120rpx; flex-shrink: 0; }
.field-input { flex: 1; font-size: 28rpx; color: #fff; height: 60rpx; background: transparent; }
.ph { color: rgba(255,255,255,0.2); }

.btn-save {
  width: 100%; height: 100rpx;
  background: linear-gradient(135deg, #C9883D, #B8772A);
  color: #fff; border-radius: 50rpx; font-size: 32rpx; font-weight: 700; border: none;
  box-shadow: 0 8rpx 28rpx rgba(180,110,40,0.4); margin-top: 16rpx;
}
</style>
