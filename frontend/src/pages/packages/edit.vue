<template>
  <view class="page">
    <view class="field">
      <text class="label">套餐名称 <text class="req">*</text></text>
      <input v-model="form.name" placeholder="如：继续工作 2 小时" class="input" placeholder-class="ph" maxlength="20" />
      <text class="char-count">{{ form.name.length }}/20</text>
    </view>

    <view class="field">
      <text class="label">套餐说明（选填）</text>
      <input v-model="form.description" placeholder="如：适合处理遗留事项" class="input" placeholder-class="ph" maxlength="30" />
    </view>

    <view class="field-row">
      <view class="field half">
        <text class="label">时长（小时）<text class="req">*</text></text>
        <input v-model="form.hours" type="digit" placeholder="如：2" class="input" placeholder-class="ph" />
      </view>
      <view class="field half">
        <text class="label">价格（元）<text class="req">*</text></text>
        <input v-model="form.price" type="digit" placeholder="如：199" class="input" placeholder-class="ph" />
      </view>
    </view>

    <text class="preset-title">⚡ 行业内卷价参考，一键套用</text>
    <view class="preset-list">
      <view v-for="p in presets" :key="p.label" class="preset-chip" @click="applyPreset(p)">
        {{ p.label }}
      </view>
    </view>

    <!-- 预览 -->
    <view v-if="form.name && form.price" class="preview-card">
      <text class="preview-label">👀 老板打开链接看到这个：</text>
      <view class="preview-row">
        <view>
          <text class="preview-name">{{ form.name }}</text>
          <text class="preview-desc">{{ form.description || `延长工时 ${form.hours || '?'} 小时` }}</text>
        </view>
        <text class="preview-price">¥{{ form.price }}</text>
      </view>
    </view>

    <button class="btn-save" :loading="loading" @click="handleSave">
      {{ isEdit ? '保存修改' : '创建套餐' }}
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { post, put } from '../../utils/request'

const isEdit = ref(false)
const pkgId = ref('')
const loading = ref(false)
const form = ref({ name: '', description: '', hours: '', price: '' })

const presets = [
  { label: '⏰ 2h · ¥199', hours: '2', price: '199', name: '继续工作 2 小时', description: '适合处理遗留事项' },
  { label: '🌙 4h · ¥499', hours: '4', price: '499', name: '继续工作 4 小时', description: '适合紧急汇报与临时需求' },
  { label: '🌃 通宵 · ¥1199', hours: '6', price: '1199', name: '工作到凌晨', description: '帮助员工适应狼性文化' },
]

onLoad((options: any) => {
  if (options?.id) {
    isEdit.value = true
    pkgId.value = options.id
    try {
      const data = JSON.parse(decodeURIComponent(options.data || '{}'))
      form.value = {
        name: data.name || '',
        description: data.description || '',
        hours: String(data.hours || ''),
        price: String(data.price || '')
      }
    } catch {}
  }
})

function applyPreset(p: any) {
  form.value = { name: p.name, description: p.description, hours: p.hours, price: p.price }
}

async function handleSave() {
  if (!form.value.name || !form.value.hours || !form.value.price) {
    uni.showToast({ title: '请填写必填项', icon: 'none' })
    return
  }
  loading.value = true
  try {
    const payload = {
      name: form.value.name,
      description: form.value.description,
      hours: Number(form.value.hours),
      price: Number(form.value.price),
      sortOrder: 0
    }
    if (isEdit.value) {
      await put(`/packages/${pkgId.value}`, payload)
    } else {
      await post('/packages', payload)
    }
    uni.showToast({ title: isEdit.value ? '修改成功' : '创建成功', icon: 'success' })
    // 通知上一页刷新
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2] as any
    if (prevPage?.$vm?.refresh) prevPage.$vm.refresh()
    setTimeout(() => uni.navigateBack(), 800)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss">
page { background: #F2EBE0; }
.page { min-height: 100vh; padding: 28rpx 28rpx 80rpx; }

.field {
  background: #fff;
  border-radius: 8rpx;
  padding: 24rpx 28rpx;
  margin-bottom: 16rpx;
  position: relative;
  border: 1rpx solid #D4C4A8;
  .label { font-size: 24rpx; color: #6B5040; display: block; margin-bottom: 12rpx; font-weight: 500; }
  .req { color: #C0392B; }
  .char-count { position: absolute; right: 28rpx; bottom: 24rpx; font-size: 20rpx; color: #C4A882; }
}
.field-row {
  display: flex;
  gap: 16rpx;
  .half { flex: 1; }
}
.input {
  width: 100%;
  height: 80rpx;
  font-size: 30rpx;
  color: #1E1A14;
  border-bottom: 1rpx solid #EDE0CC;
  box-sizing: border-box;
  background: transparent;
}
.ph { color: #C4A882; }

.preset-title { font-size: 24rpx; color: #8B7355; padding: 16rpx 4rpx 10rpx; display: block; }
.preset-list {
  display: flex;
  gap: 14rpx;
  margin-bottom: 24rpx;
  flex-wrap: wrap;
}
.preset-chip {
  background: #F5EDE0;
  color: #8B3A2A;
  font-size: 24rpx;
  padding: 12rpx 24rpx;
  border-radius: 6rpx;
  border: 1rpx solid #D4C4A8;
}

.preview-card {
  background: #fff;
  border-radius: 8rpx;
  padding: 24rpx 28rpx;
  margin-bottom: 24rpx;
  border: 1rpx solid #D4C4A8;
  .preview-label { font-size: 22rpx; color: #8B7355; display: block; margin-bottom: 16rpx; }
}
.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .preview-name { font-size: 30rpx; font-weight: 600; color: #1E1A14; display: block; }
  .preview-desc { font-size: 24rpx; color: #8B7355; margin-top: 4rpx; display: block; }
  .preview-price { font-size: 38rpx; font-weight: 800; color: #C0392B; }
}

.btn-save {
  width: 100%;
  height: 100rpx;
  background: #1E1A14;
  color: #F2EBE0;
  border-radius: 8rpx;
  font-size: 32rpx;
  font-weight: 800;
  border: none;
  letter-spacing: 2rpx;
}
</style>
