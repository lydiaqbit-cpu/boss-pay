<template>
  <view class="page">
    <view v-if="packages.length === 0" class="empty">
      <text class="e-icon">😤</text>
      <text class="e-tip">还没有加班费定价</text>
      <text class="e-subtip">没有定价 = 老板白嫖合法，快去加！</text>
    </view>

    <view v-for="pkg in packages" :key="pkg.id" class="pkg-card">
      <view class="pkg-badge">{{ pkg.hours }}h</view>
      <view class="pkg-body">
        <text class="pkg-name">{{ pkg.name }}</text>
        <text class="pkg-desc">{{ pkg.description || '暂无说明' }}</text>
      </view>
      <view class="pkg-right">
        <text class="pkg-price">¥{{ pkg.price }}</text>
        <view class="pkg-actions">
          <text class="action-edit" @click="editPkg(pkg)">编辑</text>
          <text class="action-sep">|</text>
          <text class="action-del" @click="deletePkg(pkg.id)">删除</text>
        </view>
      </view>
    </view>

    <view class="add-btn" @click="addPkg">
      <text class="add-icon">＋</text>
      <text class="add-text">新增加班费套餐</text>
    </view>

    <view class="tip-card">
      <text class="tip-icon">💡</text>
      <text class="tip-text">建议设 2-4 档，从低到高排列，最贵的自动贴"🔥 老板最爱"标签，专治老板选贵的冲动</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get, del as apiDel } from '../../utils/request'

const packages = ref<any[]>([])

onMounted(loadPackages)

async function loadPackages() {
  try {
    packages.value = await get<any[]>('/packages')
  } catch {}
}

function addPkg() {
  uni.navigateTo({
    url: '/pages/packages/edit',
    events: { refresh: loadPackages }
  })
}

function editPkg(pkg: any) {
  uni.navigateTo({
    url: `/pages/packages/edit?id=${pkg.id}&data=${encodeURIComponent(JSON.stringify(pkg))}`,
    events: { refresh: loadPackages }
  })
}

async function deletePkg(id: string) {
  uni.showModal({
    title: '确认删除',
    content: '删除后老板将看不到这个套餐',
    success: async (res) => {
      if (!res.confirm) return
      await apiDel(`/packages/${id}`)
      await loadPackages()
      uni.showToast({ title: '已删除', icon: 'success' })
    }
  })
}
</script>

<style lang="scss">
page { background: #0d0d1a; }
.page { min-height: 100vh; padding: 24rpx 28rpx 160rpx; }

.empty {
  text-align: center;
  padding: 100rpx 0 60rpx;
  .e-icon { font-size: 80rpx; display: block; }
  .e-tip { font-size: 30rpx; color: rgba(255,255,255,0.6); margin-top: 24rpx; display: block; font-weight: 600; }
  .e-subtip { font-size: 24rpx; color: rgba(255,255,255,0.3); margin-top: 10rpx; display: block; }
}

.pkg-card {
  background: #161630;
  border-radius: 20rpx;
  padding: 28rpx 28rpx 28rpx 20rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  border: 1rpx solid rgba(255,255,255,0.07);
}
.pkg-badge {
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  background: rgba(255,216,92,0.12);
  color: #FFD85C;
  font-size: 22rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pkg-body {
  flex: 1;
  .pkg-name { font-size: 30rpx; font-weight: 600; color: #fff; display: block; }
  .pkg-desc { font-size: 24rpx; color: rgba(255,255,255,0.35); margin-top: 6rpx; display: block; }
}
.pkg-right { text-align: right; flex-shrink: 0; }
.pkg-price { font-size: 36rpx; font-weight: 800; color: #FFD85C; display: block; }
.pkg-actions {
  display: flex;
  gap: 8rpx;
  margin-top: 8rpx;
  justify-content: flex-end;
  .action-edit { font-size: 24rpx; color: rgba(255,216,92,0.8); }
  .action-sep { font-size: 24rpx; color: rgba(255,255,255,0.15); }
  .action-del { font-size: 24rpx; color: #FF4757; }
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  background: linear-gradient(90deg, #F4A800, #FFD85C);
  border-radius: 20rpx;
  padding: 36rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 28rpx rgba(244,168,0,0.35);
  .add-icon { font-size: 36rpx; color: #0d0d1a; }
  .add-text { font-size: 30rpx; font-weight: 800; color: #0d0d1a; }
}

.tip-card {
  background: rgba(255,216,92,0.07);
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  display: flex;
  gap: 12rpx;
  border: 1rpx solid rgba(255,216,92,0.15);
  .tip-icon { font-size: 28rpx; flex-shrink: 0; }
  .tip-text { font-size: 24rpx; color: rgba(255,216,92,0.75); line-height: 1.6; }
}
</style>
