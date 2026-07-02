<template>
  <view class="page">
    <view class="bg-circle bg-circle-1" />
    <view class="bg-circle bg-circle-2" />

    <view class="nav-back" @click="uni.navigateBack()">
      <text class="back-arrow">←</text>
      <text class="back-text">返回</text>
    </view>

    <view class="hero">
      <image class="logo-img" src="/static/logo.svg" mode="aspectFit"/>
      <text class="title">加入打工人联盟</text>
      <text class="subtitle">注册后即可向老板发起付款请求</text>
    </view>

    <view class="card">
      <view class="field">
        <text class="label">你的大名</text>
        <view class="input-wrap">
          <text class="input-icon">👤</text>
          <input v-model="form.nickname" placeholder="老板看到这个名字就得掏钱" class="input" placeholder-class="placeholder" />
        </view>
      </view>
      <view class="field">
        <text class="label">手机号</text>
        <view class="input-wrap">
          <text class="input-icon">📱</text>
          <input v-model="form.phone" type="number" maxlength="11" placeholder="打工人专属联系方式" class="input" placeholder-class="placeholder" />
        </view>
      </view>
      <view class="field">
        <text class="label">密码</text>
        <view class="input-wrap">
          <text class="input-icon">🔒</text>
          <input v-model="form.password" password placeholder="至少 6 位" class="input" placeholder-class="placeholder" />
        </view>
      </view>
      <view class="field">
        <text class="label">职位 / 部门（选填）</text>
        <view class="input-wrap">
          <text class="input-icon">💼</text>
          <input v-model="form.bio" placeholder="如：被迫营业的 UI 设计师" class="input" placeholder-class="placeholder" />
        </view>
      </view>
      <button class="btn-primary" :loading="loading" @click="handleRegister">注册，开始收钱</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { post } from '../../utils/request'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()
const loading = ref(false)
const form = ref({ nickname: '', phone: '', password: '', bio: '' })

async function handleRegister() {
  if (!form.value.nickname || !form.value.phone || !form.value.password) {
    uni.showToast({ title: '请填写昵称、手机号和密码', icon: 'none' })
    return
  }
  if (form.value.password.length < 6) {
    uni.showToast({ title: '密码至少 6 位', icon: 'none' })
    return
  }
  loading.value = true
  try {
    const data = await post<{ token: string; user: any }>('/auth/register', form.value, false)
    userStore.setToken(data.token)
    userStore.setUser(data.user)
    uni.switchTab({ url: '/pages/home/index' })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss">
page { background: #F5EAD8; }
.page {
  min-height: 100vh;
  background: #F5EAD8;
  padding: 56rpx 48rpx 60rpx;
  position: relative;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.bg-circle-1 {
  width: 500rpx; height: 500rpx;
  background: rgba(180, 110, 40, 0.07);
  top: -100rpx; right: -100rpx;
}
.bg-circle-2 {
  width: 300rpx; height: 300rpx;
  background: rgba(124, 58, 237, 0.05);
  bottom: 200rpx; left: -60rpx;
}

.nav-back {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 40rpx;
  .back-arrow { font-size: 36rpx; color: #C9883D; }
  .back-text { font-size: 28rpx; color: #C9883D; font-weight: 500; }
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 48rpx;
  animation: slideUp 0.5s ease-out;
  .logo-img { width: 110rpx; height: 110rpx; margin-bottom: 20rpx; border-radius: 24rpx; box-shadow: 0 10rpx 32rpx rgba(180,110,40,0.25); }
  .title { font-size: 42rpx; font-weight: 800; color: #1C1208; }
  .subtitle { font-size: 24rpx; color: #8A6A50; margin-top: 8rpx; }
}

.card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 48rpx 44rpx 44rpx;
  box-shadow: 0 8rpx 48rpx rgba(180, 110, 40, 0.1), 0 2rpx 8rpx rgba(0,0,0,0.04);
  animation: slideUp 0.6s ease-out;
}

.field {
  margin-bottom: 24rpx;
  .label { font-size: 24rpx; color: #6A4E38; display: block; margin-bottom: 10rpx; font-weight: 500; }
}
.input-wrap {
  display: flex;
  align-items: center;
  background: #F9F2E8;
  border-radius: 16rpx;
  border: 1.5rpx solid #E8C89A;
  padding: 0 24rpx;
  height: 92rpx;
  .input-icon { font-size: 30rpx; margin-right: 14rpx; }
}
.input {
  flex: 1;
  height: 92rpx;
  font-size: 29rpx;
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
  margin-top: 16rpx;
  letter-spacing: 2rpx;
  box-shadow: 0 8rpx 28rpx rgba(180, 110, 40, 0.4);
}
</style>
