<template>
  <view class="page">

    <!-- Tab 切换 -->
    <view class="tab-bar">
      <view class="tab-item" :class="{ active: tab === 'wechat' }" @click="tab = 'wechat'">
        <text class="tab-label">微信</text>
        <view v-if="form.wechatQrUrl" class="tab-dot" />
      </view>
      <view class="tab-item" :class="{ active: tab === 'alipay' }" @click="tab = 'alipay'">
        <text class="tab-label">支付宝</text>
        <view v-if="form.alipayQrUrl" class="tab-dot" />
      </view>
    </view>

    <!-- 微信面板 -->
    <view v-if="tab === 'wechat'" class="panel">
      <view class="status-row">
        <text class="status-text">{{ form.wechatQrUrl ? '已设置收款码 · 可重新上传' : '还没上传，老板想转账也没地儿扫' }}</text>
        <view v-if="form.wechatQrUrl" class="default-pill" :class="{ active: form.defaultPaymentMethod === 'wechat' }" @click="setDefault('wechat')">
          <text>{{ form.defaultPaymentMethod === 'wechat' ? '✓ 默认' : '设为默认' }}</text>
        </view>
      </view>

      <view class="qr-card" @click="uploadQr('wechat')">
        <image v-if="form.wechatQrUrl" :src="form.wechatQrUrl" class="qr-img" mode="aspectFit"/>
        <view v-else class="qr-empty">
          <view class="upload-circle">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="16" y1="6" x2="16" y2="26" stroke="#C4A882" stroke-width="2" stroke-linecap="round"/>
              <line x1="6" y1="16" x2="26" y2="16" stroke="#C4A882" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </view>
          <text class="qr-empty-label">点击上传微信收款码</text>
        </view>
      </view>

      <view class="guide-steps">
        <text class="guide-title">怎么找到收款码？</text>
        <view class="step-row"><text class="step-num">1</text><text class="step-text">打开微信</text></view>
        <view class="step-row"><text class="step-num">2</text><text class="step-text">点「收付款」→「二维码收款」</text></view>
        <view class="step-row"><text class="step-num">3</text><text class="step-text">长按图片保存，再上传到这里</text></view>
      </view>
    </view>

    <!-- 支付宝面板 -->
    <view v-if="tab === 'alipay'" class="panel">
      <view class="status-row">
        <text class="status-text">{{ form.alipayQrUrl ? '已设置收款码 · 可重新上传' : '还没上传，花呗付不了你的血汗钱' }}</text>
        <view v-if="form.alipayQrUrl" class="default-pill" :class="{ active: form.defaultPaymentMethod === 'alipay' }" @click="setDefault('alipay')">
          <text>{{ form.defaultPaymentMethod === 'alipay' ? '✓ 默认' : '设为默认' }}</text>
        </view>
      </view>

      <view class="qr-card" @click="uploadQr('alipay')">
        <image v-if="form.alipayQrUrl" :src="form.alipayQrUrl" class="qr-img" mode="aspectFit"/>
        <view v-else class="qr-empty">
          <view class="upload-circle">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="16" y1="6" x2="16" y2="26" stroke="#C4A882" stroke-width="2" stroke-linecap="round"/>
              <line x1="6" y1="16" x2="26" y2="16" stroke="#C4A882" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </view>
          <text class="qr-empty-label">点击上传支付宝收款码</text>
        </view>
      </view>

      <view class="guide-steps">
        <text class="guide-title">怎么找到收款码？</text>
        <view class="step-row"><text class="step-num">1</text><text class="step-text">打开支付宝</text></view>
        <view class="step-row"><text class="step-num">2</text><text class="step-text">点首页「收钱」</text></view>
        <view class="step-row"><text class="step-num">3</text><text class="step-text">长按二维码保存，再上传到这里</text></view>
      </view>
    </view>

    <!-- 默认提示 -->
    <view v-if="(form.wechatQrUrl || form.alipayQrUrl) && !form.defaultPaymentMethod" class="remind-bar">
      <text class="remind-text">建议设置一个默认收款方式，老板打开页面会优先看到它</text>
    </view>

    <button class="btn-save" :loading="saving" @click="handleSave">保存，开始收钱</button>

    <text class="bottom-tip">两种都设最稳，老板用哪个扫哪个</text>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get, put } from '../../utils/request'

const tab = ref<'wechat' | 'alipay'>('wechat')
const saving = ref(false)
const form = ref({ wechatQrUrl: '', alipayQrUrl: '', defaultPaymentMethod: '' })

onMounted(async () => {
  try {
    const data = await get<any>('/user/payment')
    if (data) Object.assign(form.value, data)
    if (!form.value.wechatQrUrl && form.value.alipayQrUrl) tab.value = 'alipay'
  } catch {}
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
        applyQr(type, b64)
      }
      img.src = path
      // #endif
      // #ifdef MP-WEIXIN
      uni.getFileSystemManager().readFile({
        filePath: path, encoding: 'base64',
        success: (r) => applyQr(type, 'data:image/jpeg;base64,' + r.data),
        fail: () => uni.showToast({ title: '图片读取失败，请重试', icon: 'none' })
      })
      // #endif
    }
  })
}

function applyQr(type: 'wechat' | 'alipay', b64: string) {
  if (type === 'wechat') {
    form.value.wechatQrUrl = b64
    if (!form.value.defaultPaymentMethod) form.value.defaultPaymentMethod = 'wechat'
  } else {
    form.value.alipayQrUrl = b64
    if (!form.value.defaultPaymentMethod) form.value.defaultPaymentMethod = 'alipay'
  }
  uni.showToast({ title: '图片已选择', icon: 'success' })
}

async function handleSave() {
  saving.value = true
  try {
    await put('/user/payment', form.value)
    uni.showToast({ title: '保存成功 💰', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 800)
  } catch (e: any) {
    uni.showToast({ title: e?.message || '保存失败，再试一次', icon: 'none' })
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss">
page { background: #F7F4F0; }
.page { min-height: 100vh; padding: 24rpx 24rpx 120rpx; }

/* Tab */
.tab-bar {
  display: flex; gap: 12rpx; margin-bottom: 24rpx;
}
.tab-item {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 10rpx;
  padding: 20rpx 0; border-radius: 10rpx; position: relative;
  background: #fff; border: 1.5rpx solid #C8B89A;
  transition: all 0.15s;
}
.tab-item.active {
  background: #1E1A14; border-color: #1E1A14;
}
.tab-label {
  font-size: 28rpx; font-weight: 700; color: #8B7355;
}
.tab-item.active .tab-label { color: #F7F4F0; }
.tab-dot {
  position: absolute; top: 12rpx; right: 12rpx;
  width: 10rpx; height: 10rpx; border-radius: 5rpx;
  background: #1E1A14;
}

/* 面板 */
.panel { animation: fadeIn 0.18s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6rpx); } to { opacity: 1; transform: translateY(0); } }

.status-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16rpx; min-height: 48rpx;
}
.status-text { font-size: 22rpx; color: #8B7355; flex: 1; line-height: 1.5; }

.default-pill {
  flex-shrink: 0; margin-left: 16rpx;
  font-size: 20rpx; padding: 8rpx 20rpx; border-radius: 20rpx;
  border: 1rpx solid #C8B89A; color: #8B7355; background: #fff;
}
.default-pill.active {
  background: #1E1A14; color: #F7F4F0; border-color: #1E1A14; font-weight: 700;
}

/* QR 卡片 */
.qr-card {
  background: #fff; border-radius: 12rpx;
  border: 1.5rpx solid #C8B89A;
  box-shadow: 0 2rpx 12rpx rgba(30,26,20,0.07);
  display: flex; align-items: center; justify-content: center;
  min-height: 360rpx; margin-bottom: 28rpx; overflow: hidden;
}
.qr-img { width: 300rpx; height: 300rpx; border-radius: 4rpx; }
.qr-empty {
  display: flex; flex-direction: column; align-items: center; gap: 20rpx;
  padding: 60rpx 0;
}
.upload-circle {
  width: 80rpx; height: 80rpx; border-radius: 40rpx;
  border: 2rpx dashed #C4A882;
  display: flex; align-items: center; justify-content: center;
  background: #F8F5F2;
}
.qr-empty-label { font-size: 26rpx; color: #8B7355; font-weight: 600; }

/* 操作指引 */
.guide-steps {
  background: #fff; border-radius: 10rpx;
  border: 1rpx solid #E5D8C4; padding: 20rpx 24rpx;
  margin-bottom: 28rpx;
}
.guide-title { font-size: 22rpx; color: #C4A882; display: block; margin-bottom: 16rpx; }
.step-row { display: flex; align-items: center; gap: 16rpx; padding: 8rpx 0; }
.step-num {
  width: 36rpx; height: 36rpx; border-radius: 18rpx;
  background: #F0EAE2; border: 1rpx solid #C8B89A;
  font-size: 20rpx; font-weight: 700; color: #A8402E;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.step-text { font-size: 24rpx; color: #3D3526; }

/* 默认提示 */
.remind-bar {
  background: #FBF8F5; border-left: 3rpx solid #C4A882;
  border-radius: 0 6rpx 6rpx 0; padding: 14rpx 18rpx;
  margin-bottom: 24rpx;
}
.remind-text { font-size: 22rpx; color: #8B7355; line-height: 1.6; display: block; }

/* 保存按钮 */
.btn-save {
  width: 80%; height: 96rpx;
  background: #1E1A14; color: #F7F4F0;
  border-radius: 48rpx; font-size: 30rpx; font-weight: 800; border: none;
  margin: 0 auto 20rpx; display: block; letter-spacing: 2rpx;
  box-shadow: 0 4rpx 16rpx rgba(30,26,20,0.25);
}

.bottom-tip {
  display: block; text-align: center;
  font-size: 22rpx; color: #C4A882;
}
</style>
