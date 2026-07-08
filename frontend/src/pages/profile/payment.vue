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
        <view v-if="form.wechatQrUrl" class="default-btn" :class="{ active: form.defaultPaymentMethod === 'wechat' }" @click="setDefault('wechat')">
          <text>{{ form.defaultPaymentMethod === 'wechat' ? '⭐ 默认' : '设为默认' }}</text>
        </view>
      </view>
      <view class="qr-upload" @click="uploadQr('wechat')">
        <image v-if="form.wechatQrUrl" :src="form.wechatQrUrl" class="qr-preview" mode="aspectFit"/>
        <view v-else class="qr-placeholder">
          <text class="qr-plus">＋</text>
          <text class="qr-hint">上传微信收款码</text>
        </view>
      </view>
      <text class="field-tip">微信 → 收付款 → 二维码收款 → 保存图片</text>
      <text v-if="form.wechatQrUrl" class="reupload-tip" @click="uploadQr('wechat')">重新上传</text>
    </view>

    <!-- 支付宝收款码 -->
    <view class="method-card" :class="{ 'is-default': form.defaultPaymentMethod === 'alipay' }">
      <view class="card-header">
        <view class="card-title-row">
          <text class="method-icon">💙</text>
          <text class="method-name">支付宝收款码</text>
          <text v-if="form.alipayQrUrl" class="status-dot">已设置</text>
        </view>
        <view v-if="form.alipayQrUrl" class="default-btn" :class="{ active: form.defaultPaymentMethod === 'alipay' }" @click="setDefault('alipay')">
          <text>{{ form.defaultPaymentMethod === 'alipay' ? '⭐ 默认' : '设为默认' }}</text>
        </view>
      </view>
      <view class="qr-upload" @click="uploadQr('alipay')">
        <image v-if="form.alipayQrUrl" :src="form.alipayQrUrl" class="qr-preview" mode="aspectFit"/>
        <view v-else class="qr-placeholder">
          <text class="qr-plus">＋</text>
          <text class="qr-hint">上传支付宝收款码</text>
        </view>
      </view>
      <text class="field-tip">支付宝 → 收钱 → 保存收款码图片</text>
      <text v-if="form.alipayQrUrl" class="reupload-tip" @click="uploadQr('alipay')">重新上传</text>
    </view>

    <button class="btn-save" :loading="saving" @click="handleSave">保存收款方式</button>

    <view class="tip-card">
      <text class="tip-text">💡 建议两种都设置，老板用哪个方便用哪个，钱到手才是真的</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get, put } from '../../utils/request'

const saving = ref(false)
const form = ref({ wechatQrUrl: '', alipayQrUrl: '', defaultPaymentMethod: '' })

onMounted(async () => {
  try { const data = await get<any>('/user/payment'); if (data) Object.assign(form.value, data) } catch {}
})

function setDefault(method: string) {
  form.value.defaultPaymentMethod = form.value.defaultPaymentMethod === method ? '' : method
}

function uploadQr(type: 'wechat' | 'alipay') {
  uni.chooseImage({
    count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'],
    success: (res) => {
      const path = res.tempFilePaths[0]
      // #ifdef H5
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width; canvas.height = img.height
        canvas.getContext('2d')!.drawImage(img, 0, 0)
        const b64 = canvas.toDataURL('image/jpeg', 0.7)
        if (type === 'wechat') { form.value.wechatQrUrl = b64; if (!form.value.defaultPaymentMethod) form.value.defaultPaymentMethod = 'wechat' }
        else { form.value.alipayQrUrl = b64; if (!form.value.defaultPaymentMethod) form.value.defaultPaymentMethod = 'alipay' }
        uni.showToast({ title: '图片已选择', icon: 'success' })
      }
      img.src = path
      // #endif
      // #ifdef MP-WEIXIN
      uni.getFileSystemManager().readFile({
        filePath: path, encoding: 'base64',
        success: (r) => {
          const b64 = 'data:image/jpeg;base64,' + r.data
          if (type === 'wechat') { form.value.wechatQrUrl = b64; if (!form.value.defaultPaymentMethod) form.value.defaultPaymentMethod = 'wechat' }
          else { form.value.alipayQrUrl = b64; if (!form.value.defaultPaymentMethod) form.value.defaultPaymentMethod = 'alipay' }
          uni.showToast({ title: '图片已选择', icon: 'success' })
        },
        fail: () => uni.showToast({ title: '图片读取失败，请重试', icon: 'none' })
      })
      // #endif
    }
  })
}

async function handleSave() {
  saving.value = true
  try {
    await put('/user/payment', form.value)
    uni.showToast({ title: '保存成功 💰', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 800)
  } catch (e: any) {
    console.error('save payment failed', e)
    uni.showToast({ title: e?.message || '保存失败，再试一次', icon: 'none' })
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss">
page { background: #F2EBE0; }
.page { min-height: 100vh; padding: 24rpx 24rpx 120rpx; }

.method-card {
  background: #fff; border-radius: 8rpx; padding: 28rpx;
  margin-bottom: 20rpx; border: 1rpx solid #D4C4A8;
  box-shadow: 0 2rpx 8rpx rgba(30,26,20,0.07);
  transition: border-color 0.2s;
}
.method-card.is-default { border-color: #C0392B; border-width: 2rpx; }

.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20rpx; }
.card-title-row { display: flex; align-items: center; gap: 12rpx; }
.method-icon { font-size: 36rpx; }
.method-name { font-size: 30rpx; font-weight: 700; color: #1E1A14; }
.status-dot { font-size: 20rpx; color: #8B3A2A; background: #F5EDE0; padding: 4rpx 14rpx; border-radius: 4rpx; border: 1rpx solid #D4C4A8; }
.default-btn { font-size: 22rpx; color: #8B7355; border: 1rpx solid #D4C4A8; border-radius: 4rpx; padding: 8rpx 20rpx; }
.default-btn.active { color: #8B3A2A; border-color: #C0392B; background: #FDF5EE; }

.qr-upload { display: flex; justify-content: center; margin-bottom: 16rpx; }
.qr-preview { width: 260rpx; height: 260rpx; border-radius: 6rpx; background: #FAF6F0; }
.qr-placeholder {
  width: 260rpx; height: 260rpx; border-radius: 6rpx;
  border: 2rpx dashed #D4C4A8;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12rpx;
  background: #FAF6F0;
}
.qr-plus { font-size: 64rpx; color: #D4C4A8; line-height: 1; }
.qr-hint { font-size: 24rpx; color: #8B7355; }
.field-tip { font-size: 22rpx; color: #C4A882; display: block; text-align: center; }
.reupload-tip { font-size: 22rpx; color: #8B3A2A; display: block; text-align: center; margin-top: 10rpx; }

.btn-save {
  width: 100%; height: 100rpx;
  background: #1E1A14;
  color: #F2EBE0; border-radius: 8rpx; font-size: 32rpx; font-weight: 800; border: none;
  margin-bottom: 24rpx; letter-spacing: 2rpx;
}

.tip-card { background: #FAF6F0; border-radius: 8rpx; padding: 20rpx 24rpx; border: 1rpx solid #D4C4A8; }
.tip-text { font-size: 24rpx; color: #6B5040; line-height: 1.7; }
</style>
