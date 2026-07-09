<template>
  <view class="page">
    <!-- 登录态 -->
    <view v-if="!authed" class="login-wrap">
      <text class="login-title">🔐 管理后台</text>
      <input v-model="secret" class="secret-input" type="password" placeholder="输入管理密钥" placeholder-class="ph"/>
      <button class="btn-login" @click="doLogin">进入后台</button>
    </view>

    <view v-else class="dashboard">
      <!-- 顶部总览 -->
      <view class="overview-grid">
        <view class="ov-card">
          <text class="ov-val">{{ overview.totalUsers }}</text>
          <text class="ov-label">总注册用户</text>
        </view>
        <view class="ov-card red">
          <text class="ov-val">{{ overview.todayUsers }}</text>
          <text class="ov-label">今日新增</text>
        </view>
        <view class="ov-card">
          <text class="ov-val">{{ overview.totalOrders }}</text>
          <text class="ov-label">总订单数</text>
        </view>
        <view class="ov-card gold">
          <text class="ov-val">¥{{ overview.totalRevenue?.toFixed(0) }}</text>
          <text class="ov-label">累计流水</text>
        </view>
      </view>

      <!-- 周期切换 -->
      <view class="period-tabs">
        <view v-for="p in periods" :key="p.key" class="period-tab" :class="{ active: period === p.key }" @click="switchPeriod(p.key)">
          {{ p.label }}
        </view>
      </view>

      <!-- 注册趋势图 -->
      <view class="chart-card">
        <text class="chart-title">📈 注册趋势</text>
        <!-- #ifdef H5 -->
        <canvas id="reg-chart" class="chart-canvas"></canvas>
        <!-- #endif -->
        <!-- #ifndef H5 -->
        <view class="chart-bars">
          <view v-for="(item, i) in regData" :key="i" class="bar-wrap">
            <view class="bar" :style="{ height: barHeight(item.count, regMax) + 'rpx' }"></view>
            <text class="bar-label">{{ shortLabel(item.label) }}</text>
          </view>
        </view>
        <!-- #endif -->
        <view class="chart-legend">
          <view v-for="(item, i) in regData.slice(-6)" :key="i" class="legend-row">
            <text class="legend-date">{{ item.label }}</text>
            <text class="legend-val">{{ item.count }} 人</text>
          </view>
        </view>
      </view>

      <!-- 功能点击统计 -->
      <view class="chart-card">
        <text class="chart-title">🖱️ 功能点击排行</text>
        <view v-for="item in eventData.byType" :key="item.event" class="event-row">
          <text class="event-name">{{ eventLabel(item.event) }}</text>
          <view class="event-bar-wrap">
            <view class="event-bar" :style="{ width: (item.count / eventMax * 100) + '%' }"></view>
          </view>
          <text class="event-count">{{ item.count }}</text>
        </view>
      </view>

      <!-- 事件趋势图 -->
      <view class="chart-card">
        <text class="chart-title">📊 操作趋势</text>
        <!-- #ifdef H5 -->
        <canvas id="evt-chart" class="chart-canvas"></canvas>
        <!-- #endif -->
        <!-- #ifndef H5 -->
        <view class="chart-bars">
          <view v-for="(item, i) in eventData.trend" :key="i" class="bar-wrap">
            <view class="bar evt-bar" :style="{ height: barHeight(item.count, evtMax) + 'rpx' }"></view>
            <text class="bar-label">{{ shortLabel(item.label) }}</text>
          </view>
        </view>
        <!-- #endif -->
      </view>

      <!-- 用户列表 -->
      <view class="chart-card">
        <text class="chart-title">👥 用户列表（最新 {{ users.length }} 位）</text>
        <view v-for="u in users" :key="u.id" class="user-row">
          <view class="u-avatar">
            <image v-if="u.avatar" :src="u.avatar" class="u-img" mode="aspectFill"/>
            <text v-else class="u-abbr">{{ u.nickname?.[0] }}</text>
          </view>
          <view class="u-info">
            <text class="u-name">{{ u.nickname }}</text>
            <text class="u-meta">{{ fmtTime(u.createdAt) }} · {{ u._count.packages }} 套餐 · {{ u._count.orders }} 订单</text>
          </view>
        </view>
        <view v-if="userPage < userTotal / userSize" class="load-more" @click="loadMoreUsers">加载更多</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

const authed = ref(false)
const secret = ref('')
const period = ref('day')
const periods = [
  { key: 'day', label: '按天' },
  { key: 'week', label: '按周' },
  { key: 'month', label: '按月' },
]

const overview = ref<any>({})
const regData = ref<{ label: string; count: number }[]>([])
const eventData = ref<{ byType: any[]; trend: any[] }>({ byType: [], trend: [] })
const users = ref<any[]>([])
const userPage = ref(1)
const userSize = 20
const userTotal = ref(0)

const regMax = computed(() => Math.max(1, ...regData.value.map(r => r.count)))
const evtMax = computed(() => Math.max(1, ...eventData.value.trend.map(r => r.count)))
const eventMax = computed(() => Math.max(1, ...eventData.value.byType.map(r => r.count)))

function headers() { return { 'x-admin-secret': secret.value } }

async function adminGet<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) =>
    uni.request({ url: `${API_BASE}/admin${url}`, method: 'GET', header: headers(),
      success: (r: any) => r.data?.code === 0 ? resolve(r.data.data) : reject(r.data?.message),
      fail: reject })
  )
}

async function doLogin() {
  if (!secret.value) return
  try {
    const data = await adminGet<any>('/overview')
    overview.value = data
    authed.value = true
    await loadAll()
  } catch {
    uni.showToast({ title: '密钥错误', icon: 'none' })
  }
}

async function loadAll() {
  await Promise.all([loadRegistrations(), loadEvents(), loadUsers(true)])
  // #ifdef H5
  await nextTick()
  drawCharts()
  // #endif
}

async function switchPeriod(p: string) {
  period.value = p
  await Promise.all([loadRegistrations(), loadEvents()])
  // #ifdef H5
  await nextTick()
  drawCharts()
  // #endif
}

async function loadRegistrations() {
  regData.value = await adminGet<any[]>(`/registrations?period=${period.value}`)
}

async function loadEvents() {
  eventData.value = await adminGet<any>(`/events?period=${period.value}`)
}

async function loadUsers(reset = false) {
  if (reset) { userPage.value = 1; users.value = [] }
  const result = await adminGet<any>(`/users?page=${userPage.value}&size=${userSize}`)
  users.value = [...users.value, ...result.users]
  userTotal.value = result.total
}

async function loadMoreUsers() {
  userPage.value++
  await loadUsers()
}

function barHeight(val: number, max: number) {
  return Math.max(4, Math.round((val / max) * 200))
}

function shortLabel(label: string) {
  if (!label) return ''
  const parts = label.split('-')
  if (parts.length === 3) return `${parts[1]}/${parts[2]}`
  if (parts.length === 2) return parts[1]
  return label
}

const eventNameMap: Record<string, string> = {
  login: '登录',
  copy_pay_link: '复制收款链接',
  copy_my_link: '复制个人链接',
  boss_paid: '老板付款',
  confirm_order: '确认收款',
  reject_order: '拒绝收款',
  create_package: '新建套餐',
  edit_package: '编辑套餐',
  view_receipt: '查看凭证',
  upload_avatar: '更换头像',
}
function eventLabel(e: string) { return eventNameMap[e] || e }

function fmtTime(t: string) {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// #ifdef H5
function drawCharts() {
  drawLineChart('reg-chart', regData.value, '#C0392B')
  drawLineChart('evt-chart', eventData.value.trend, '#C4A882')
}

function drawLineChart(id: string, data: { label: string; count: number }[], color: string) {
  const canvas = document.getElementById(id) as HTMLCanvasElement
  if (!canvas || !data.length) return
  const ctx = canvas.getContext('2d')!
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)
  const W = rect.width, H = rect.height
  const pad = { top: 20, right: 16, bottom: 40, left: 40 }
  const w = W - pad.left - pad.right
  const h = H - pad.top - pad.bottom
  const max = Math.max(1, ...data.map(d => d.count))
  ctx.clearRect(0, 0, W, H)

  // 网格线
  ctx.strokeStyle = '#EDE0CC'; ctx.lineWidth = 0.5
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (h / 4) * i
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke()
    ctx.fillStyle = '#8B7355'; ctx.font = `${10 * dpr / dpr}px sans-serif`; ctx.textAlign = 'right'
    ctx.fillText(String(Math.round(max * (1 - i / 4))), pad.left - 4, y + 4)
  }

  // 折线
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round'
  ctx.beginPath()
  data.forEach((d, i) => {
    const x = pad.left + (i / (data.length - 1 || 1)) * w
    const y = pad.top + (1 - d.count / max) * h
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  })
  ctx.stroke()

  // 填充渐变
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + h)
  grad.addColorStop(0, color + '40'); grad.addColorStop(1, color + '00')
  ctx.lineTo(pad.left + w, pad.top + h); ctx.lineTo(pad.left, pad.top + h)
  ctx.closePath(); ctx.fillStyle = grad; ctx.fill()

  // 圆点 + X轴标签
  const step = Math.ceil(data.length / 8)
  data.forEach((d, i) => {
    const x = pad.left + (i / (data.length - 1 || 1)) * w
    const y = pad.top + (1 - d.count / max) * h
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fillStyle = color; ctx.fill()
    if (i % step === 0 || i === data.length - 1) {
      ctx.fillStyle = '#8B7355'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(shortLabel(d.label), x, H - pad.bottom + 14)
    }
  })
}
// #endif
</script>

<style lang="scss">
page { background: #F2EBE0; }
.page { min-height: 100vh; padding-bottom: 80rpx; }

/* 登录 */
.login-wrap {
  min-height: 100vh; display: flex; flex-direction: column;
  align-items: center; justify-content: center; padding: 60rpx;
}
.login-title { font-size: 40rpx; font-weight: 800; color: #1E1A14; margin-bottom: 48rpx; }
.secret-input {
  width: 100%; height: 88rpx; background: #fff; border-radius: 8rpx;
  border: 1rpx solid #D4C4A8; padding: 0 24rpx; font-size: 28rpx; color: #1E1A14;
  box-sizing: border-box; margin-bottom: 24rpx;
}
.ph { color: #C4A882; }
.btn-login {
  width: 100%; height: 96rpx; background: #1E1A14; color: #F2EBE0;
  border-radius: 8rpx; font-size: 30rpx; font-weight: 800; border: none;
}

/* 总览 */
.dashboard { padding: 24rpx; }
.overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; margin-bottom: 24rpx; }
.ov-card {
  background: #fff; border-radius: 8rpx; padding: 28rpx 24rpx;
  border: 1rpx solid #D4C4A8; text-align: center;
}
.ov-card.red { border-color: #C0392B; background: #FDF5EE; }
.ov-card.gold { border-color: #C4A882; background: #FAF6F0; }
.ov-val { font-size: 44rpx; font-weight: 900; color: #1E1A14; display: block; }
.ov-card.red .ov-val { color: #C0392B; }
.ov-card.gold .ov-val { color: #8B3A2A; }
.ov-label { font-size: 22rpx; color: #8B7355; margin-top: 8rpx; display: block; }

/* 周期切换 */
.period-tabs { display: flex; gap: 12rpx; margin-bottom: 20rpx; }
.period-tab {
  flex: 1; text-align: center; padding: 16rpx; font-size: 26rpx;
  background: #fff; border-radius: 6rpx; border: 1rpx solid #D4C4A8; color: #8B7355;
}
.period-tab.active { background: #1E1A14; color: #F2EBE0; border-color: #1E1A14; font-weight: 700; }

/* 图表卡 */
.chart-card {
  background: #fff; border-radius: 8rpx; padding: 28rpx;
  border: 1rpx solid #D4C4A8; margin-bottom: 20rpx;
}
.chart-title { font-size: 28rpx; font-weight: 700; color: #1E1A14; display: block; margin-bottom: 24rpx; }
.chart-canvas { width: 100%; height: 220rpx; display: block; }

/* 小程序柱状图 */
.chart-bars {
  display: flex; align-items: flex-end; gap: 6rpx; height: 200rpx; padding-bottom: 28rpx;
  border-bottom: 1rpx solid #EDE0CC;
}
.bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
.bar { width: 100%; background: #C0392B; border-radius: 4rpx 4rpx 0 0; min-height: 4rpx; }
.evt-bar { background: #C4A882; }
.bar-label { font-size: 18rpx; color: #8B7355; margin-top: 6rpx; text-align: center; }

/* 注册明细 */
.chart-legend { margin-top: 20rpx; }
.legend-row { display: flex; justify-content: space-between; padding: 10rpx 0; border-bottom: 1rpx solid #EDE0CC; }
.legend-date { font-size: 24rpx; color: #6B5040; }
.legend-val { font-size: 24rpx; color: #C0392B; font-weight: 700; }

/* 事件排行 */
.event-row { display: flex; align-items: center; gap: 16rpx; padding: 14rpx 0; border-bottom: 1rpx solid #EDE0CC; }
.event-row:last-child { border-bottom: none; }
.event-name { font-size: 24rpx; color: #1E1A14; width: 180rpx; flex-shrink: 0; }
.event-bar-wrap { flex: 1; background: #F5EDE0; border-radius: 4rpx; height: 20rpx; overflow: hidden; }
.event-bar { height: 100%; background: #C0392B; border-radius: 4rpx; transition: width 0.4s; min-width: 4rpx; }
.event-count { font-size: 24rpx; color: #8B7355; width: 60rpx; text-align: right; flex-shrink: 0; }

/* 用户列表 */
.user-row { display: flex; align-items: center; gap: 16rpx; padding: 16rpx 0; border-bottom: 1rpx solid #EDE0CC; }
.user-row:last-child { border-bottom: none; }
.u-avatar {
  width: 72rpx; height: 72rpx; border-radius: 36rpx; flex-shrink: 0;
  background: #F5EDE0; display: flex; align-items: center; justify-content: center;
  overflow: hidden; border: 1rpx solid #D4C4A8;
}
.u-img { width: 72rpx; height: 72rpx; }
.u-abbr { font-size: 28rpx; color: #8B3A2A; font-weight: 700; }
.u-info { flex: 1; }
.u-name { font-size: 28rpx; font-weight: 600; color: #1E1A14; display: block; }
.u-meta { font-size: 22rpx; color: #8B7355; margin-top: 4rpx; display: block; }
.load-more { text-align: center; padding: 24rpx; color: #8B3A2A; font-size: 26rpx; }
</style>
