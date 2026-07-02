<template>
  <view class="page">
    <!-- 背景装饰圆 -->
    <view class="bg-circle bg-circle-1" />
    <view class="bg-circle bg-circle-2" />

    <view class="hero">
      <image class="logo-img" src="/static/logo.svg" mode="aspectFit"/>
      <text class="app-title">老板请付牛马钱</text>
      <text class="subtitle">打工人的最后一道防线</text>
    </view>

    <view class="card">
      <view class="field">
        <text class="label">手机号</text>
        <view class="input-wrap">
          <text class="input-icon">📱</text>
          <input
            v-model="form.phone"
            type="number"
            maxlength="11"
            placeholder="输入你的手机号"
            class="input"
            placeholder-class="placeholder"
          />
        </view>
      </view>
      <view class="field">
        <text class="label">密码</text>
        <view class="input-wrap">
          <text class="input-icon">🔒</text>
          <input
            v-model="form.password"
            password
            placeholder="输入密码"
            class="input"
            placeholder-class="placeholder"
          />
        </view>
      </view>
      <button class="btn-primary" :loading="loading" @click="handleLogin">进入收款界面</button>

      <view class="or-divider">
        <view class="or-line" /><text class="or-text">或</text><view class="or-line" />
      </view>

      <button class="btn-wechat" :loading="wxLoading" @click="handleWechatLogin">
        <text class="wechat-icon">&#x25CF;</text>
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
    uni.showToast({ title: '请填写手机号和密码', icon: 'none' })
    return
  }
  loading.value = true
  try {
    const data = await post<{ token: string; user: any }>('/auth/login', form.value, false)
    userStore.setToken(data.token)
    userStore.setUser(data.user)
    uni.switchTab({ url: '/pages/home/index' })
  } finally {
    loading.value = false
  }
}

async function handleWechatLogin() {
  wxLoading.value = true
  try {
    // #ifdef MP-WEIXIN
    const loginRes = await new Promise<WechatMiniprogram.LoginSuccessCallbackResult>((resolve, reject) => {
      wx.login({ success: resolve, fail: reject })
    })
    const profileRes = await new Promise<WechatMiniprogram.GetUserProfileSuccessCallbackResult>((resolve, reject) => {
      wx.getUserProfile({ desc: '用于展示你的昵称和头像', success: resolve, fail: reject })
    })
    const data = await post<{ token: string; user: any }>('/auth/wechat', {
      code: loginRes.code,
      nickname: profileRes.userInfo.nickName,
      avatar: profileRes.userInfo.avatarUrl
    }, false)
    // #endif
    // #ifdef H5
    const mockOpenId = 'mock_' + Math.random().toString(36).slice(2, 10)
    const data = await post<{ token: string; user: any }>('/auth/wechat-mock', {
      openId: mockOpenId,
      nickname: '微信打工人'
    }, false)
    // #endif
    userStore.setToken(data.token)
    userStore.setUser(data.user)
    uni.switchTab({ url: '/pages/home/index' })
  } catch {
    uni.showToast({ title: '微信登录失败，请重试', icon: 'none' })
  } finally {
    wxLoading.value = false
  }
}

function toRegister() {
  uni.navigateTo({ url: '/pages/auth/register' })
}
</script>

<style lang="scss">
page { background: #F5EAD8; }
.page {
  min-height: 100vh;
  background: #F5EAD8;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 48rpx 60rpx;
  position: relative;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.bg-circle-1 {
  width: 500rpx;
  height: 500rpx;
  background: rgba(180, 110, 40, 0.08);
  top: -120rpx;
  right: -100rpx;
  animation: fadeIn 0.8s ease-out;
}
.bg-circle-2 {
  width: 360rpx;
  height: 360rpx;
  background: rgba(124, 58, 237, 0.06);
  bottom: 100rpx;
  left: -80rpx;
  animation: fadeIn 1s ease-out;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 56rpx;
  animation: slideUp 0.6s ease-out;
  .logo-img {
    width: 180rpx;
    height: 180rpx;
    margin-bottom: 24rpx;
    border-radius: 40rpx;
    box-shadow: 0 16rpx 48rpx rgba(180, 110, 40, 0.3);
  }
  .app-title {
    font-size: 48rpx;
    font-weight: 800;
    color: #1C1208;
    letter-spacing: 4rpx;
  }
  .subtitle {
    font-size: 26rpx;
    color: #8A6A50;
    margin-top: 10rpx;
  }
}

.card {
  width: 100%;
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 52rpx 44rpx 44rpx;
  box-shadow: 0 8rpx 48rpx rgba(180, 110, 40, 0.1), 0 2rpx 8rpx rgba(0,0,0,0.04);
  animation: slideUp 0.7s ease-out;
}

.field {
  margin-bottom: 28rpx;
  .label {
    font-size: 24rpx;
    color: #6A4E38;
    display: block;
    margin-bottom: 12rpx;
    font-weight: 500;
    letter-spacing: 1rpx;
  }
}
.input-wrap {
  display: flex;
  align-items: center;
  background: #F9F2E8;
  border-radius: 16rpx;
  border: 1.5rpx solid #E8C89A;
  padding: 0 24rpx;
  height: 96rpx;
  transition: border-color 0.2s;
  &:focus-within { border-color: #C9883D; }
  .input-icon { font-size: 32rpx; margin-right: 16rpx; }
}
.input {
  flex: 1;
  height: 96rpx;
  font-size: 30rpx;
  color: #1C1208;
  background: transparent;
}
.placeholder { color: #C4A888; }

.btn-primary {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #C9883D 0%, #B8772A 100%);
  color: #fff;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: 700;
  border: none;
  margin-top: 12rpx;
  letter-spacing: 3rpx;
  box-shadow: 0 8rpx 28rpx rgba(180, 110, 40, 0.4);
  animation: pulse 2.5s infinite;
}

.divider {
  text-align: center;
  margin: 32rpx 0 20rpx;
  .divider-text { font-size: 24rpx; color: #C4A888; }
}

.btn-secondary {
  width: 100%;
  height: 92rpx;
  background: transparent;
  color: #C9883D;
  border-radius: 50rpx;
  font-size: 28rpx;
  font-weight: 600;
  border: 1.5rpx solid #C9883D;
}

.footer-tip {
  font-size: 22rpx;
  color: #C4A888;
  margin-top: 48rpx;
  animation: fadeIn 1s ease-out;
}

.or-divider {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin: 28rpx 0;
  .or-line { flex: 1; height: 1rpx; background: #E8C89A; }
  .or-text { font-size: 22rpx; color: #C4A888; white-space: nowrap; }
}

.btn-wechat {
  width: 100%;
  height: 100rpx;
  background: #07C160;
  color: #fff;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: 700;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.35);
  .wechat-icon { font-size: 36rpx; }
}
</style>
