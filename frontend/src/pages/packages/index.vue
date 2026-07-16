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
          <text class="action-link" @click="copyPkgLink(pkg)">复制链接</text>
          <text class="action-sep">|</text>
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
import { onShow } from '@dcloudio/uni-app'
import { get, del as apiDel } from '../../utils/request'
import { useUserStore } from '../../store/user'

const packages = ref<any[]>([])
const userStore = useUserStore()

function pkgPayLink(pkg: any) {
  const uid = userStore.userInfo?.id || ''
  // #ifdef MP-WEIXIN
  return `https://boss-pay.vercel.app/#/pages/pay/cashier?userId=${uid}&packageId=${pkg.id}`
  // #endif
  // #ifdef H5
  return `${location.origin}/#/pages/pay/cashier?userId=${uid}&packageId=${pkg.id}`
  // #endif
}

function copyPkgLink(pkg: any) {
  uni.setClipboardData({
    data: pkgPayLink(pkg),
    success: () => uni.showToast({ title: `"${pkg.name}" 链接已复制`, icon: 'success' })
  })
}

onMounted(loadPackages)
onShow(loadPackages)

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
    content: '此套餐将不再显示给老板，已有订单记录不受影响',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await apiDel(`/packages/${id}`)
        await loadPackages()
        uni.showToast({ title: '已删除', icon: 'success' })
      } catch {
        uni.showToast({ title: '删除失败，请重试', icon: 'none' })
      }
    }
  })
}
</script>

<style lang="scss">
page { background: #F7F4F0; }
.page { min-height: 100vh; padding: 24rpx 28rpx 160rpx; }

.empty {
  text-align: center;
  padding: 100rpx 0 60rpx;
  .e-icon { font-size: 80rpx; display: block; }
  .e-tip { font-size: 30rpx; color: #1E1A14; margin-top: 24rpx; display: block; font-weight: 600; }
  .e-subtip { font-size: 24rpx; color: #8B7355; margin-top: 10rpx; display: block; }
}

.pkg-card {
  background: #fff;
  border-radius: 8rpx;
  padding: 28rpx 28rpx 28rpx 20rpx;
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  border: 1rpx solid #C8B89A;
}
.pkg-badge {
  width: 72rpx;
  height: 72rpx;
  border-radius: 6rpx;
  background: #F0EAE2;
  color: #A8402E;
  font-size: 22rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1rpx solid #C8B89A;
}
.pkg-body {
  flex: 1;
  .pkg-name { font-size: 30rpx; font-weight: 600; color: #1E1A14; display: block; }
  .pkg-desc { font-size: 24rpx; color: #8B7355; margin-top: 6rpx; display: block; }
}
.pkg-right { text-align: right; flex-shrink: 0; }
.pkg-price { font-size: 36rpx; font-weight: 800; color: #D94F3D; display: block; }
.pkg-actions {
  display: flex;
  gap: 8rpx;
  margin-top: 8rpx;
  justify-content: flex-end;
  .action-link { font-size: 24rpx; color: #A8402E; }
  .action-edit { font-size: 24rpx; color: #8B7355; }
  .action-sep { font-size: 24rpx; color: #C8B89A; }
  .action-del { font-size: 24rpx; color: #D94F3D; }
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  background: #1E1A14;
  border-radius: 8rpx;
  padding: 36rpx;
  margin-bottom: 24rpx;
  .add-icon { font-size: 36rpx; color: #C4A882; }
  .add-text { font-size: 30rpx; font-weight: 800; color: #F7F4F0; letter-spacing: 2rpx; }
}

.tip-card {
  background: #F8F5F2;
  border-radius: 8rpx;
  padding: 20rpx 24rpx;
  display: flex;
  gap: 12rpx;
  border: 1rpx solid #C8B89A;
  .tip-icon { font-size: 28rpx; flex-shrink: 0; }
  .tip-text { font-size: 24rpx; color: #6B5040; line-height: 1.6; }
}
</style>
