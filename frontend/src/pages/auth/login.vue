<template>
  <view class="page">
    <view class="hero">
      <image class="logo-img" src="/static/logo.svg" mode="aspectFit"/>
      <text class="app-title">牛马加班吧</text>
      <text class="subtitle">打工人的最后一道防线</text>
    </view>

    <view class="card">
      <view class="field">
        <text class="label">手机号</text>
        <view class="input-wrap">
          <text class="input-icon">📱</text>
          <input v-model="form.phone" type="number" maxlength="11" placeholder="输入你的手机号" class="input" placeholder-class="placeholder"/>
        </view>
      </view>
      <view class="field">
        <text class="label">密码</text>
        <view class="input-wrap">
          <text class="input-icon">🔒</text>
          <input v-model="form.password" password placeholder="输入密码" class="input" placeholder-class="placeholder"/>
        </view>
      </view>
      <button class="btn-primary" :loading="loading" @click="handleLogin">💰 老板欠我的，我来收了</button>

      <view class="or-divider">
        <view class="or-line"/><text class="or-text">或</text><view class="or-line"/>
      </view>

      <button class="btn-wechat" :loading="wxLoading" @click="handleWechatLogin">
        <text>微信一键登录</text>
      </button>

      <view class="divider"><text class="divider-text">还没账号？</text></view>
      <button class="btn-secondary" @click="toRegister">注册，开始向老板收钱</button>
    </view>

    <text class="footer-tip">让每一分加班费都有着落</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { post } from '../../utils/request'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()
const loading = ref(false)
const wxLoading = ref(false)
const form = ref({ phone: '', password: '' })

async function handleLogin() {
  if (!form.value.phone || !form.value.password) {
    uni.showToast({ title: '请填写手机号和密码', icon: 'none' }); return
  }
  loading.value = true
  try {
    const data = await post<{ token: string; user: any }>('/auth/login', form.value, false)
    userStore.setToken(data.token); userStore.setUser(data.user)
    uni.switchTab({ url: '/pages/home/index' })
  } finally { loading.value = false }
}

async function handleWechatLogin() {
  wxLoading.value = true
  try {
    // #ifdef MP-WEIXIN
    const loginRes = await new Promise<WechatMiniprogram.LoginSuccessCallbackResult>((resolve, reject) => { wx.login({ success: resolve, fail: reject }) })
    const profileRes = await new Promise<WechatMiniprogram.GetUserProfileSuccessCallbackResult>((resolve, reject) => { wx.getUserProfile({ desc: '用于展示你的昵称和头像', success: resolve, fail: reject }) })
    const data = await post<{ token: string; user: any }>('/auth/wechat', { code: loginRes.code, nickname: profileRes.userInfo.nickName, avatar: profileRes.userInfo.avatarUrl }, false)
    // #endif
    // #ifdef H5
    const mockOpenId = 'mock_' + Math.random().toString(36).slice(2, 10)
    const data = await post<{ token: string; user: any }>('/auth/wechat-mock', { openId: mockOpenId, nickname: '微信打工人' }, false)
    // #endif
    userStore.setToken(data.token); userStore.setUser(data.user)
    uni.switchTab({ url: '/pages/home/index' })
  } catch { uni.showToast({ title: '微信登录失败，请重试', icon: 'none' }) }
  finally { wxLoading.value = false }
}

function toRegister() { uni.navigateTo({ url: '/pages/auth/register' }) }
</script>

<style lang="scss">
page { background: #F2EBE0; }
.page {
  min-height: 100vh; background: #F2EBE0;
  display: flex; flex-direction: column; align-items: center;
  padding: 80rpx 40rpx 60rpx;
}

.hero {
  display: flex; flex-direction: column; align-items: center; margin-bottom: 48rpx;
  .logo-img { width: 160rpx; height: 160rpx; margin-bottom: 20rpx; border-radius: 12rpx; box-shadow: 0 12rpx 36rpx rgba(30,26,20,0.2); }
  .app-title { font-size: 44rpx; font-weight: 800; color: #1E1A14; letter-spacing: 5rpx; }
  .subtitle { font-size: 26rpx; color: #8B7355; margin-top: 10rpx; }
}

.card {
  width: 100%; background: #fff; border-radius: 8rpx;
  padding: 48rpx 40rpx 40rpx; box-shadow: 0 4rpx 20rpx rgba(30,26,20,0.08);
  border: 1rpx solid #D4C4A8;
}

.field { margin-bottom: 24rpx; }
.label { font-size: 24rpx; color: #6B5040; display: block; margin-bottom: 10rpx; font-weight: 600; }
.input-wrap {
  display: flex; align-items: center; background: #FAF6F0;
  border-radius: 6rpx; border: 1.5rpx solid #D4C4A8; padding: 0 20rpx; height: 92rpx;
  &:focus-within { border-color: #C0392B; }
  .input-icon { font-size: 30rpx; margin-right: 14rpx; }
}
.input { flex: 1; height: 92rpx; font-size: 30rpx; color: #1E1A14; background: transparent; }
.placeholder { color: #C4A882; }

.btn-primary {
  width: 100%; height: 100rpx;
  background: #1E1A14;
  color: #F2EBE0; border-radius: 8rpx; font-size: 30rpx; font-weight: 700; border: none;
  margin-top: 8rpx; letter-spacing: 2rpx;
}

.or-divider {
  display: flex; align-items: center; gap: 16rpx; margin: 28rpx 0;
  .or-line { flex: 1; height: 1rpx; background: #D4C4A8; }
  .or-text { font-size: 22rpx; color: #C4A882; white-space: nowrap; }
}

.btn-wechat {
  width: 100%; height: 100rpx; background: #07C160;
  color: #fff; border-radius: 8rpx; font-size: 30rpx; font-weight: 700; border: none;
}

.divider { text-align: center; margin: 28rpx 0 16rpx; }
.divider-text { font-size: 24rpx; color: #C4A882; }

.btn-secondary {
  width: 100%; height: 92rpx; background: transparent;
  color: #8B3A2A; border-radius: 8rpx; font-size: 28rpx; font-weight: 600;
  border: 1.5rpx solid #C4A882;
}

.footer-tip { font-size: 22rpx; color: #C4A882; margin-top: 44rpx; letter-spacing: 1rpx; }
</style>
