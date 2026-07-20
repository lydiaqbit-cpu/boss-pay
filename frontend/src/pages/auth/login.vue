<template>
  <view class="page">
    <view class="hero">
      <image class="logo-img" src="/static/logo.svg" mode="aspectFit"/>
      <text class="app-title">牛马加班吧</text>
      <text class="subtitle">打工人的血汗钱，一分不能少 🐂</text>
    </view>

    <view class="card">
      <text class="card-title">老板欠你的，今天来要回来</text>
      <text class="card-sub">用微信登录，30 秒生成你的专属收款链接</text>

      <button class="btn-wechat" :loading="wxLoading" @click="handleWechatLogin">
        <text class="wx-icon">💬</text>
        <text>微信授权登录</text>
      </button>

      <view class="tips-row">
        <text class="tip-item">✅ 无需注册</text>
        <text class="tip-item">✅ 一键开始</text>
        <text class="tip-item">✅ 老板直接转</text>
      </view>

      <button class="btn-skip" @click="handleSkip">先看看长什么样 →</button>
    </view>

    <text class="footer-tip">已帮 2,381 位打工人成功要回加班费 💰</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { post } from '../../utils/request'
import { useUserStore } from '../../store/user'
import { track } from '../../utils/track'

const userStore = useUserStore()
const wxLoading = ref(false)

function handleSkip() {
  uni.switchTab({ url: '/pages/home/index' })
}

async function handleWechatLogin() {
  wxLoading.value = true
  try {
    // #ifdef MP-WEIXIN
    const loginRes = await new Promise<WechatMiniprogram.LoginSuccessCallbackResult>((resolve, reject) => { wx.login({ success: resolve, fail: reject }) })
    const data = await post<{ token: string; user: any }>('/auth/wechat', { code: loginRes.code }, false)
    // #endif
    // #ifdef H5
    const mockOpenId = 'mock_' + Math.random().toString(36).slice(2, 10)
    const data = await post<{ token: string; user: any }>('/auth/wechat-mock', { openId: mockOpenId, nickname: '微信打工人' }, false)
    // #endif
    userStore.setToken(data.token); userStore.setUser(data.user)
    track('login', { userId: data.user.id })
    uni.switchTab({ url: '/pages/home/index' })
  } catch { uni.showToast({ title: '登录失败，再试一次吧 😅', icon: 'none' }) }
  finally { wxLoading.value = false }
}
</script>

<style lang="scss">
page { background: #F7F4F0; }
.page {
  min-height: 100vh; background: #F7F4F0;
  display: flex; flex-direction: column; align-items: center;
  padding: 100rpx 40rpx 60rpx;
}

.hero {
  display: flex; flex-direction: column; align-items: center; margin-bottom: 60rpx;
  .logo-img { width: 160rpx; height: 160rpx; margin-bottom: 24rpx; border-radius: 12rpx; box-shadow: 0 12rpx 36rpx rgba(30,26,20,0.2); }
  .app-title { font-size: 48rpx; font-weight: 800; color: #1E1A14; letter-spacing: 6rpx; }
  .subtitle { font-size: 26rpx; color: #8B7355; margin-top: 14rpx; }
}

.card {
  width: 100%; background: #fff; border-radius: 8rpx;
  padding: 48rpx 40rpx 44rpx;
  box-shadow: 0 4rpx 20rpx rgba(30,26,20,0.08);
  border: 1rpx solid #C8B89A;
}

.card-title { font-size: 32rpx; font-weight: 800; color: #1E1A14; display: block; text-align: center; margin-bottom: 10rpx; }
.card-sub { font-size: 24rpx; color: #8B7355; display: block; text-align: center; margin-bottom: 48rpx; }

.btn-wechat {
  width: 100%; height: 104rpx; background: #07C160;
  color: #fff; border-radius: 8rpx; font-size: 32rpx; font-weight: 700; border: none;
  display: flex; align-items: center; justify-content: center; gap: 12rpx;
  letter-spacing: 2rpx;
}
.wx-icon { font-size: 34rpx; }

.tips-row {
  display: flex; justify-content: center; gap: 24rpx; margin-top: 28rpx;
}
.tip-item { font-size: 22rpx; color: #8B7355; }

.btn-skip {
  width: 100%; height: 80rpx; background: transparent;
  color: #8B7355; border: 1rpx solid #C8B89A; border-radius: 8rpx;
  font-size: 28rpx; margin-top: 24rpx;
}

.footer-tip { font-size: 22rpx; color: #C4A882; margin-top: 48rpx; letter-spacing: 1rpx; text-align: center; }
</style>
