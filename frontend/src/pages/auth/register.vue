<template>
  <view class="page">
    <view class="nav-back" @click="uni.navigateBack()">← 返回</view>

    <view class="hero">
      <text class="logo">💼</text>
      <text class="title">加入打工人联盟</text>
      <text class="subtitle">注册后即可向老板发起付款请求</text>
    </view>

    <view class="card">
      <text class="card-slogan">📝 让老板知道你是谁，才能精准转账</text>
      <view class="field">
        <text class="label">你的大名 *</text>
        <input v-model="form.nickname" placeholder="老板看到这个名字就得掏钱" class="input" placeholder-class="placeholder" />
      </view>
      <view class="field">
        <text class="label">手机号 *</text>
        <input v-model="form.phone" type="number" maxlength="11" placeholder="打工人专属联系方式" class="input" placeholder-class="placeholder" />
      </view>
      <view class="field">
        <text class="label">密码 *</text>
        <input v-model="form.password" password placeholder="至少 6 位，比工资还要保密" class="input" placeholder-class="placeholder" />
      </view>
      <view class="field">
        <text class="label">职位 / 部门（选填）</text>
        <input v-model="form.bio" placeholder="如：被迫营业的 UI 设计师" class="input" placeholder-class="placeholder" />
      </view>
      <button class="btn-primary" :loading="loading" @click="handleRegister">注册，开始收钱 💰</button>
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
page { background: #0d0d1a; }
.page {
  min-height: 100vh;
  background: linear-gradient(160deg, #0d0d1a 0%, #1a1035 60%, #0d0d1a 100%);
  padding: 60rpx 48rpx 60rpx;
}
.nav-back { font-size: 28rpx; color: rgba(255,255,255,0.5); margin-bottom: 40rpx; padding: 10rpx 0; }
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 48rpx;
  .logo { font-size: 70rpx; margin-bottom: 16rpx; }
  .title { font-size: 44rpx; font-weight: 800; color: #fff; }
  .subtitle { font-size: 24rpx; color: rgba(255,255,255,0.5); margin-top: 8rpx; }
}
.card {
  background: #161630;
  border-radius: 28rpx;
  padding: 48rpx 44rpx 44rpx;
  border: 1rpx solid rgba(255,255,255,0.07);
  box-shadow: 0 20rpx 60rpx rgba(0,0,0,0.5);
}
.card-slogan { font-size: 22rpx; color: #FFD85C; background: rgba(255,216,92,0.1); border-radius: 8rpx; padding: 12rpx 16rpx; display: block; margin-bottom: 24rpx; border: 1rpx solid rgba(255,216,92,0.2); }
.field {
  margin-bottom: 28rpx;
  .label { font-size: 24rpx; color: rgba(255,255,255,0.45); display: block; margin-bottom: 10rpx; font-weight: 500; }
}
.input {
  width: 100%;
  height: 88rpx;
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
  font-size: 32rpx;
  font-weight: 800;
  border: none;
  margin-top: 16rpx;
  letter-spacing: 4rpx;
  box-shadow: 0 8rpx 28rpx rgba(244,168,0,0.4);
}
</style>
