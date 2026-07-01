<template>
  <view class="page">
    <view class="hero">
      <image class="logo-img" src="/static/logo.svg" mode="aspectFit"/>
      <text class="subtitle">打工人的最后一道防线</text>
    </view>

    <view class="card">
      <text class="card-slogan">🕐 已超过下班时间，请让老板先划款</text>
      <view class="field">
        <text class="label">手机号</text>
        <input
          v-model="form.phone"
          type="number"
          maxlength="11"
          placeholder="输入你的打工人编号"
          class="input"
          placeholder-class="placeholder"
        />
      </view>
      <view class="field">
        <text class="label">密码</text>
        <input
          v-model="form.password"
          password
          placeholder="只有你知道的秘密"
          class="input"
          placeholder-class="placeholder"
        />
      </view>
      <button class="btn-primary" :loading="loading" @click="handleLogin">进入收款界面 →</button>
      <view class="divider"><text class="divider-text">新来的打工人？</text></view>
      <button class="btn-secondary" @click="toRegister">注册，开始向老板收钱</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { post } from '../../utils/request'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()
const loading = ref(false)
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

function toRegister() {
  uni.navigateTo({ url: '/pages/auth/register' })
}
</script>

<style lang="scss">
page { background: #0d0d1a; }
.page {
  min-height: 100vh;
  background: linear-gradient(160deg, #0d0d1a 0%, #1a1035 60%, #0d0d1a 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 48rpx 60rpx;
}
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 56rpx;
  .logo-img { width: 220rpx; height: 220rpx; margin-bottom: 20rpx; border-radius: 48rpx; }
  .subtitle { font-size: 26rpx; color: rgba(255,255,255,0.5); margin-top: 4rpx; }
}
.card {
  width: 100%;
  background: #161630;
  border-radius: 28rpx;
  padding: 48rpx 44rpx 44rpx;
  border: 1rpx solid rgba(255,255,255,0.07);
  box-shadow: 0 20rpx 60rpx rgba(0,0,0,0.5);
}
.card-slogan { font-size: 22rpx; color: #FFD85C; background: rgba(255,216,92,0.1); border-radius: 8rpx; padding: 12rpx 16rpx; display: block; margin-bottom: 28rpx; border: 1rpx solid rgba(255,216,92,0.2); }
.field {
  margin-bottom: 32rpx;
  .label { font-size: 24rpx; color: rgba(255,255,255,0.45); display: block; margin-bottom: 12rpx; font-weight: 500; letter-spacing: 1rpx; }
}
.input {
  width: 100%;
  height: 92rpx;
  background: rgba(255,255,255,0.05);
  border-radius: 14rpx;
  padding: 0 28rpx;
  font-size: 30rpx;
  color: #fff;
  box-sizing: border-box;
  border: 1rpx solid rgba(255,255,255,0.12);
}
.placeholder { color: rgba(255,255,255,0.2); }
.btn-primary {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(90deg, #F4A800, #FFD85C);
  color: #0d0d1a;
  border-radius: 50rpx;
  font-size: 34rpx;
  font-weight: 800;
  border: none;
  margin-top: 8rpx;
  letter-spacing: 4rpx;
  box-shadow: 0 8rpx 28rpx rgba(244,168,0,0.4);
}
.divider {
  text-align: center;
  margin: 32rpx 0 20rpx;
  .divider-text { font-size: 26rpx; color: rgba(255,255,255,0.25); }
}
.btn-secondary {
  width: 100%;
  height: 92rpx;
  background: rgba(255,255,255,0.05);
  color: #FFD85C;
  border-radius: 50rpx;
  font-size: 30rpx;
  font-weight: 600;
  border: 1rpx solid rgba(255,216,92,0.3);
}
</style>
