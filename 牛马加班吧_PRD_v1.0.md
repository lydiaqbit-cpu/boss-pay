# 牛马加班吧 · 产品需求说明书（PRD）v1.0

> Product Requirements Document · 2026-07-03

| 项目 | 信息 |
|------|------|
| 产品名称 | 牛马加班吧 |
| 定位 | 职场加班费在线收款工具 |
| 目标用户 | 中国职场打工人（员工端）& 需付加班费的雇主（老板端） |
| 文档版本 | v1.0 |
| 文档日期 | 2026-07-03 |
| 技术栈 | uni-app Vue3 / Express TypeScript / Prisma / Turso SQLite |
| 前端部署 | Vercel（H5 SPA） |
| 后端部署 | Railway（Node.js） |

---

## 目录

1. [产品概述](#1-产品概述)
2. [用户角色与使用场景](#2-用户角色与使用场景)
3. [信息架构](#3-信息架构)
4. [功能详情](#4-功能详情)
5. [数据模型](#5-数据模型)
6. [接口清单](#6-接口清单)
7. [实时通知（WebSocket）](#7-实时通知websocket)
8. [视觉设计规范](#8-视觉设计规范)
9. [技术架构](#9-技术架构)
10. [非功能需求](#10-非功能需求)
11. [后续迭代规划（Backlog）](#11-后续迭代规划backlog)

---

## 1. 产品概述

### 1.1 背景与价值主张

国内职场中，员工加班却长期无法及时获得加班费，主要原因是：缺乏便捷的主张工具、申请流程繁琐、开口尴尬。

牛马加班吧通过一条「讨薪令牌」链接，让打工人将加班费定价权拿在自己手里，老板扫码付款，员工确认收款，全流程闭环。

### 1.2 核心价值

- **员工端**：3 步生成专属收款链接，发给老板即可
- **老板端**：打开链接选套餐 → 填信息 → 截图/转账，无需下载 APP
- **平台端**：每笔订单收取 5% 平台管理费

### 1.3 产品目标（MVP）

- 员工注册/登录并设置收款二维码
- 员工创建加班费套餐（定价）
- 生成专属收款页链接分享给老板
- 老板填写信息申报已转账，生成订单
- 员工收到通知，确认收款，生成凭证

---

## 2. 用户角色与使用场景

### 2.1 角色定义

| 角色 | 身份 | 行为 | 平台权限 |
|------|------|------|----------|
| 打工人（员工） | 需要收取加班费的员工 | 注册登录、设置定价和收款方式、分享链接、确认收款 | 完整账号权限，需登录 |
| 东家（老板） | 需支付加班费的雇主 | 打开链接、选套餐、填信息、申报已转账 | 无需注册，匿名访问 |
| 平台 | 系统后台 | 收取 5% 管理费、发送实时通知 | —— |

### 2.2 典型使用场景

#### 场景一：普通加班费收取

员工小李周末被临时叫来加班 4 小时。她打开牛马加班吧，已预设「继续工作 4h · ¥499」套餐，复制链接发给老板。老板打开链接，选择该套餐，填写姓名并备注「周末项目紧急」，截图转账。小李收到通知确认收款后，生成凭证图片，证明老板已付血汗钱。

#### 场景二：老板赖账留证

老板口头答应付加班费但迟迟未付。员工用「讨薪令牌」链接给老板，若老板始终未提交申报，账簿中有明确的「东家一文未付」记录，可作追溯凭据。

---

## 3. 信息架构

### 3.1 页面结构总览

| 模块 | 页面路径 | 访问权限 | 说明 |
|------|----------|----------|------|
| 登录 | `/pages/auth/login` | 公开 | 微信授权一键登录 |
| 聚宝堂（首页） | `/pages/home/index` | 需登录 | 员工主控台：统计/快捷入口/套餐预览 |
| 血汗账簿（订单） | `/pages/orders/index` | 需登录 | 员工查看所有收款订单 |
| 劳役簿（个人中心） | `/pages/profile/index` | 需登录 | 设置收款方式/套餐/分享链接/退出 |
| 银两收取方式 | `/pages/profile/payment` | 需登录 | 上传微信/支付宝收款码 |
| 劳役价目管理 | `/pages/packages/index` | 需登录 | 套餐列表、增删改 |
| 创建/编辑套餐 | `/pages/packages/edit` | 需登录 | 填写套餐名/说明/时长/价格 |
| 老板收款页（Cashier） | `/pages/pay/cashier` | 公开 | 老板端：选套餐+填信息+查看付款方式 |
| 支付成功页 | `/pages/pay/success` | 公开 | 老板提交后展示订单编号 |
| 收款凭证 | `/pages/pay/receipt` | 需登录 | 员工生成凭证并截图分享 |

### 3.2 底部导航（Tab Bar）

| Tab | 图标 | 文案 | 页面路径 | 选中色 |
|-----|------|------|----------|--------|
| 首页 | 🏠 | 聚宝堂 | `/pages/home/index` | #C0392B |
| 订单 | 📖 | 讨债本 | `/pages/orders/index` | #C0392B |
| 个人中心 | 👤 | 劳役簿 | `/pages/profile/index` | #C0392B |

Tab Bar 背景色：`#1E1A14`，未选中色：`#8B7355`

---

## 4. 功能详情

### 4.1 登录模块（`/pages/auth/login`）

#### 功能描述

仅支持微信授权一键登录，无手机号/密码注册。登录后后端创建或更新用户记录，返回 JWT token（有效期 30 天）。

#### 交互流程

1. 用户点击「微信授权登录」按钮
2. H5 端：调用 `uni.login` 获取微信 code，发送至后端 `POST /api/auth/wechat`
3. 后端用 code 换取 openid，查询或创建用户，返回 JWT token + 用户信息
4. 前端存储 token 至 localStorage，跳转首页

#### 字段说明

| 字段 | 来源 | 说明 |
|------|------|------|
| openid | 微信服务端 | 唯一标识，不展示给用户 |
| nickname | 微信授权 | 默认「微信打工人」，可在个人中心修改 |
| avatar | 微信授权 | URL，可为空 |
| bio | 用户填写 | 个人签名，选填，最长 50 字 |

#### 错误处理

- 微信授权失败：Toast「授权失败，请重试」
- 网络超时：Toast「网络异常，请检查网络后重试」
- Token 过期：静默跳转登录页，重新授权

---

### 4.2 首页 · 聚宝堂（`/pages/home/index`）

#### 页面区块

| 区块 | 内容 | 数据来源 | 交互 |
|------|------|----------|------|
| 用户卡 | 头像 + 昵称 + 在线状态（「在线收钱中」） | userStore | 点击 → 劳役簿 |
| 统计卡 | 入账银两 / 东家未认 / 东家出手 | `/api/pay/orders` 聚合 | 无 |
| 收款设置提示 | 未设置收款码时展示金色钱袋 Banner | hasPaymentMethod | 点击 → 银两收取方式 |
| 讨薪令牌 | 已设置收款码时展示可复制链接 | hasPaymentMethod + userInfo.id | 点击复制，Toast 反馈 |
| 快捷入口 Grid | 卖身价目 / 血汗账簿 / 银两去处 / 东家视角（2×2） | 静态 | 各自跳转对应页面 |
| 加班价目表 | 套餐列表预览（最多 3 条）；无套餐时展示乞丐牛马 SVG 空态 | `/api/packages` | 「管理 →」跳转套餐管理 |

#### 统计数值计算逻辑

- **入账银两**：`status = "confirmed"` 的 `order.netAmount` 求和（保留 2 位小数）
- **东家未认**：`status = "boss_paid"` 的订单数量
- **东家出手**：所有订单总数（不限状态）

#### 讨薪令牌 URL 格式

```
https://{domain}/#/pages/pay/cashier?userId={userId}&packageId={packageId}
```

> 当员工有多个套餐时，URL 仅含 userId，老板在收款页自行选择套餐

#### 快捷入口文案

| 入口 | 图标 | 主文案 | 副文案 |
|------|------|--------|--------|
| 套餐定价 | 📜 | 卖身价目 | 定好价，一字不让 |
| 收款记录 | 📖 | 血汗账簿 | 每笔都是泪 |
| 收款方式 | 🪙 | 银两去处 | 钱往哪打 |
| 老板视角 | 🎭 | 东家视角 | 甲方看到啥 |

---

### 4.3 老板收款页 · Cashier（`/pages/pay/cashier`）

#### 功能描述

无需登录的公开页面，老板通过员工分享的链接访问。页面展示员工信息、收款套餐及付款方式（二维码），老板填写姓名和备注后提交申报。

#### 页面区块

| 区块 | 内容 | 说明 |
|------|------|------|
| 员工信息头部 | 头像 + 昵称 + 签名 | 从 `/api/pay/page/:userId` 获取 |
| 套餐列表 | 套餐名 / 时长 / 描述 / 价格，支持单选 | 按 sortOrder 升序；最贵套餐标「🔥 最划算」 |
| 付款方式切换 | 微信 / 支付宝 Tab，展示对应二维码 | defaultPaymentMethod 决定默认 Tab |
| 付款人信息表单 | 付款人姓名（必填，最长 20 字）+ 备注（选填，最长 50 字） | 前端校验非空 |
| 提交按钮 | 「我已转账，申报付款」 | 调用 `POST /api/pay/boss-paid` |

#### 提交逻辑

1. 校验：未选套餐 → Toast「请选择加班套餐」；未填姓名 → Toast「请填写付款人姓名」
2. 调用 `POST /api/pay/boss-paid`，body: `{ userId, packageId, payerName, payerNote }`
3. 成功 → 跳转 `/pages/pay/success?orderId=xxx`
4. 失败 → Toast 展示错误信息

#### 收款方式展示规则

- `wechatQrUrl` 有值 → 展示微信二维码 Tab
- `alipayQrUrl` 有值 → 展示支付宝二维码 Tab
- 两个都有 → 展示切换 Tab，`defaultPaymentMethod` 决定默认选中项
- 都没有 → 展示「员工尚未设置收款方式」提示

---

### 4.4 血汗账簿 · 订单管理（`/pages/orders/index`）

#### 页面区块

| 区块 | 内容 | 说明 |
|------|------|------|
| 统计栏 | 东家认账笔数 / 累计入账银两 / 悬而未决 | 从订单列表聚合 |
| 空态 | 乞丐牛马 SVG + 「东家一文未付，账簿形同虚设」 | 无订单时展示 |
| 订单卡片列表 | 付款方头像/姓名/备注 + 套餐名 + 金额 + 状态 + 操作按钮 | 按 createdAt 倒序，最多 50 条 |

#### 订单状态流转

| 状态值 | 显示文案 | 颜色 | 可用操作 |
|--------|----------|------|----------|
| `boss_paid` | ⏳ 待确认（东家说已付） | 橙色 | 「确认收款」+「未收到，拒绝」 |
| `confirmed` | ✅ 已确认 | 绿色 | 「查看凭证」 |
| `rejected` | ❌ 已拒绝 | 灰色 | 无 |

#### 操作接口

- 确认收款：`POST /api/pay/orders/:id/confirm` → status 改为 confirmed，记录 confirmedAt
- 拒绝：`POST /api/pay/orders/:id/reject` → status 改为 rejected
- 查看凭证：navigateTo `/pages/pay/receipt?orderId=xxx`

---

### 4.5 劳役价目管理 · 套餐（`/pages/packages/index` & `edit`）

#### 套餐列表页

- 展示员工创建的所有套餐（`isActive = true`），按 `sortOrder` 升序
- 每条套餐：时长 Badge + 套餐名 + 描述 + 价格 + [复制链接 / 编辑 / 删除]
- 空态：「😤 还没有加班费定价，没有定价 = 老板白嫖合法，快去加！」
- 底部入口「新增加班费套餐」→ 跳转 edit 页

#### 套餐编辑页字段

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| 套餐名称 | 文本 | 是 | 最长 20 字 | 如：继续工作 2 小时 |
| 套餐说明 | 文本 | 否 | 最长 30 字 | 如：适合处理遗留事项 |
| 时长（小时） | 数字 | 是 | 正数，最多 2 位小数 | |
| 价格（元） | 数字 | 是 | 正数，最多 2 位小数 | |

#### 预设套餐（快速套用）

| 标签 | 套餐名 | 时长 | 价格 | 说明 |
|------|--------|------|------|------|
| ⏰ 2h · ¥199 | 继续工作 2 小时 | 2h | ¥199 | 适合处理遗留事项 |
| 🌙 4h · ¥499 | 继续工作 4 小时 | 4h | ¥499 | 适合紧急汇报与临时需求 |
| 🌃 通宵 · ¥1199 | 工作到凌晨 | 6h | ¥1199 | 帮助员工适应狼性文化 |

> 删除套餐前不检查关联订单，删除后老板已生成的订单仍保留历史数据

---

### 4.6 银两收取方式（`/pages/profile/payment`）

#### 功能描述

员工上传微信/支付宝收款码图片（Base64 存储）及默认收款方式，老板在收款页将看到对应二维码。

#### 字段与接口

| 字段 | 类型 | 说明 |
|------|------|------|
| wechatQrUrl | String（Base64 或 URL） | 微信收款码图片 |
| alipayQrUrl | String（Base64 或 URL） | 支付宝收款码图片 |
| defaultPaymentMethod | Enum: `'wechat'` \| `'alipay'` | 老板收款页默认选中项 |

#### 保存逻辑

- 调用 `PUT /api/auth/profile`，body 含以上三个字段
- 上传前预览：图片选取后立即展示预览，点击「保存」再提交
- 图片大小限制：< 2MB，超出提示「图片过大，请压缩后重试」

> 当前版本使用 Base64 存储，后续可迁移至 OSS，接口字段不变

---

### 4.7 收款凭证（`/pages/pay/receipt`）

#### 功能描述

员工确认收款后，可在订单详情进入凭证页，查看并截图保存凭证图片，发给老板作为支付证明。

#### 凭证卡片信息

| 字段 | 来源 | 展示格式 |
|------|------|----------|
| 凭证编号 | `order.id` 前 8 位大写 | 凭证编号：XXXXXXXX |
| 实际支付金额 | `order.amount` | ¥ {amount} |
| 到账金额 | `order.netAmount` | 打工人到账 ¥{netAmount}（已扣平台 5% 管理费） |
| 付款方 | `order.payerName` | |
| 收款方 | `userStore.userInfo.nickname` | |
| 加班套餐 | `order.package.name` | |
| 付款时间 | `order.paidAt` | YYYY年MM月DD日 HH:mm |
| 状态 | 固定 | ✓ 已完成 |

#### 截图功能

- **H5 端**：使用 `html2canvas` 捕捉 `#receipt-card` 元素，生成 PNG 文件并触发浏览器下载
- **微信小程序端**：提示「长按屏幕截图后发给老板」，使用原生截图
- 按钮文案：「📸 截图保存，发给老板」，截图中状态：「生成中...」

---

## 5. 数据模型

### 5.1 User（打工人）

```prisma
model User {
  id                    String    @id @default(cuid())
  openid                String    @unique
  nickname              String    @default("微信打工人")
  avatar                String?
  bio                   String?   // 最长 50 字
  wechatQrUrl           String?   // 微信收款码（Base64 或 URL）
  alipayQrUrl           String?   // 支付宝收款码（Base64 或 URL）
  defaultPaymentMethod  String?   // 'wechat' | 'alipay'
  subscriptionExpiry    DateTime? // 会员到期时间，null = 非会员
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  packages              Package[]
  orders                Order[]
}
```

### 5.2 Package（加班套餐）

```prisma
model Package {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  name        String   // 最长 20 字
  description String?  // 最长 30 字
  hours       Float
  price       Float
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  orders      Order[]
}
```

### 5.3 Order（订单）

```prisma
model Order {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  packageId   String
  package     Package  @relation(fields: [packageId], references: [id])
  payerName   String   // 付款方姓名（老板填写）
  payerNote   String?  // 付款备注
  amount      Float    // 原始金额（= Package.price）
  platformFee Float    // 平台管理费（amount × 5%）
  netAmount   Float    // 员工实际到账（amount - platformFee）
  status      String   // 'boss_paid' | 'confirmed' | 'rejected'
  paidAt      DateTime? // 老板申报时间（≈ createdAt）
  confirmedAt DateTime? // 员工确认时间
  createdAt   DateTime @default(now())
}
```

---

## 6. 接口清单

**Base URL**：`https://boss-pay-production.up.railway.app/api`

**认证方式**：Bearer Token（JWT），Header：`Authorization: Bearer {token}`

### 6.1 认证接口

| 方法 | 路径 | 认证 | 描述 | 关键参数 |
|------|------|------|------|----------|
| POST | `/auth/wechat` | 无 | 微信授权登录，返回 JWT + 用户信息 | body: `{ code }` |
| PUT | `/auth/profile` | 需登录 | 更新用户资料及收款方式 | body: `{ nickname, bio, wechatQrUrl, alipayQrUrl, defaultPaymentMethod }` |

### 6.2 套餐接口

| 方法 | 路径 | 认证 | 描述 | 关键参数 |
|------|------|------|------|----------|
| GET | `/packages` | 需登录 | 获取当前员工的所有套餐 | 无 |
| POST | `/packages` | 需登录 | 创建套餐 | body: `{ name, description, hours, price, sortOrder }` |
| PUT | `/packages/:id` | 需登录 | 更新套餐 | body: 同上 |
| DELETE | `/packages/:id` | 需登录 | 软删除套餐（isActive = false） | 无 |

### 6.3 支付接口

| 方法 | 路径 | 认证 | 描述 | 关键参数 |
|------|------|------|------|----------|
| GET | `/pay/page/:userId` | 无 | 公开收款页数据（老板访问） | params: `userId` |
| POST | `/pay/boss-paid` | 无 | 老板申报已转账，创建订单 | body: `{ userId, packageId, payerName, payerNote }` |
| GET | `/pay/orders` | 需登录 | 员工获取自己的订单列表（最近 50 条） | 无 |
| POST | `/pay/orders/:id/confirm` | 需登录 | 员工确认收款 | params: `id` |
| POST | `/pay/orders/:id/reject` | 需登录 | 员工拒绝（未收到款） | params: `id` |

### 6.4 统一响应格式

```json
// 成功
{ "code": 0, "data": { ... } }

// 失败
{ "code": 400, "message": "错误描述" }
```

---

## 7. 实时通知（WebSocket）

服务端通过 WebSocket 向在线的员工推送事件，前端监听后展示 Toast 或刷新列表。

### 7.1 连接方式

- 前端建立连接：`ws://{backend_host}/ws?token={JWT}`
- 服务端解析 token，将连接与 userId 绑定
- 前端在 `App.vue` `onLaunch` 时建立连接，`onHide` 时保活

### 7.2 事件类型

| 事件 type | 触发时机 | 消息内容 | 前端处理 |
|-----------|----------|----------|----------|
| `boss_paid` | 老板提交申报成功 | `{ orderId, amount, payerName, message }` | Toast「💰 {payerName} 说已转账 ¥{amount}，快去确认！」，订单列表自动刷新 |

---

## 8. 视觉设计规范

**设计风格**：方案九·纸白国风（Paper White Chinese Style）——米黄宣纸底色 × 墨色头部 × 朱砂红点缀

### 8.1 色彩系统

| 用途 | 色值 | 说明 |
|------|------|------|
| 页面背景 | `#F2EBE0` | 米黄宣纸色 |
| 顶部渐变 | `#1E1A14 → #3D3526` | 浓墨色 |
| 主色 CTA | `#C0392B` | 朱砂红，用于按钮、金额、强调文字 |
| 金色点缀 | `#C4A882 / #8B7355` | 用于次级文字、边框、装饰 |
| 卡片背景 | `#FFFFFF` + border `#D4C4A8` | 白色卡片 + 米黄边框 |
| 次级文字 | `#8B7355 / #6B5040` | 标签、说明文字 |
| 分割线 | `#EDE0CC / #D4C4A8` | 轻量分割 |

### 8.2 字体

- 中文：系统字体（PingFang SC / Noto Sans SC）
- 数字/凭证编号：monospace 等宽字体
- 凭证金额：`font-weight: 900`，`font-size: 80rpx`

### 8.3 文案风格（古风搞笑）

| 场景 | 文案 |
|------|------|
| 套餐定价入口 | 卖身价目 · 定好价，一字不让 |
| 订单列表入口 | 血汗账簿 · 每笔都是泪 |
| 收款方式入口 | 银两去处 · 钱往哪打 |
| 老板视角入口 | 东家视角 · 甲方看到啥 |
| 统计：已到手 | 入账银两 |
| 统计：待确认 | 东家未认 |
| 统计：老板次数 | 东家出手 |
| 空订单 | 东家一文未付，账簿形同虚设 |
| 空套餐 | 尚未立价，老板正偷着乐呢 |
| 凭证底部 | 老板请付牛马钱 · 正规收款凭证 · 不接受赖账 |
| Tab：首页 | 聚宝堂 |
| Tab：订单 | 讨债本 |
| Tab：个人中心 | 劳役簿 |
| 个人中心：收款方式 | 银两收取方式 |
| 个人中心：套餐管理 | 劳役价目管理 |
| 个人中心：复制链接 | 复制讨薪令牌 |
| 个人中心：退出登录 | 溜了溜了 |
| 个人中心：会员 | 纳贡升级，解锁全部功能 |

### 8.4 空态插画

所有空态统一使用手绘 SVG「乞丐牛马」形象：

- 破草帽 + 乱发
- 愁眉苦脸（倒八字眉、流眼泪）
- 衣衫褴褛（麻布打补丁）
- 草绳腰带
- 左手捧空碗，碗内标「空」

---

## 9. 技术架构

### 9.1 前端

| 技术 | 版本/说明 |
|------|-----------|
| 框架 | uni-app + Vue 3 Composition API |
| 语言 | TypeScript |
| 状态管理 | Pinia（useUserStore 管理登录态） |
| 平台 | H5（主要）+ MP-WEIXIN（微信小程序，用 `#ifdef` 区分） |
| 构建命令 | `npm run build:h5` → `dist/build/h5` |
| 部署 | Vercel（从 `frontend/` 子目录 `npx vercel deploy --prod`） |
| 截图库 | html2canvas@1.4.1（H5 端凭证截图） |

### 9.2 后端

| 技术 | 版本/说明 |
|------|-----------|
| 框架 | Express + TypeScript |
| ORM | Prisma 5（schema-first） |
| 数据库 | Turso（libsql，SQLite 云版） |
| 认证 | JWT（jsonwebtoken），Bearer Token，有效期 30 天 |
| 实时通知 | WebSocket（ws 库），与 userId 绑定 |
| 部署 | Railway（GitHub 源自动部署） |
| 平台费率 | `PLATFORM_FEE_RATE` 环境变量，默认 `0.05`（5%） |

### 9.3 数据库注意事项

- Turso **不自动**运行 Prisma migrations，字段变更需手动 `ALTER TABLE`（通过 Turso HTTP API `POST /v2/pipeline`）
- 生产 DB：`libsql://boss-pay-db-lydia2026.aws-us-west-2.turso.io`
- ORM schema 变更后必须同步更新 Turso 表结构，否则会产生「no such column」运行时错误

### 9.4 目录结构

```
boss-pay/
├── frontend/                # uni-app 前端
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/login.vue
│   │   │   ├── home/index.vue
│   │   │   ├── orders/index.vue
│   │   │   ├── packages/index.vue
│   │   │   ├── packages/edit.vue
│   │   │   ├── pay/cashier.vue
│   │   │   ├── pay/receipt.vue
│   │   │   ├── pay/success.vue
│   │   │   └── profile/
│   │   │       ├── index.vue
│   │   │       └── payment.vue
│   │   ├── store/user.ts
│   │   ├── utils/request.ts
│   │   └── App.vue
│   └── src/pages.json       # 路由 & Tab Bar 配置
└── backend/                 # Express 后端
    └── src/
        ├── routes/
        │   ├── auth.ts
        │   ├── packages.ts
        │   └── pay.ts
        ├── middleware/auth.ts
        ├── utils/prisma.ts
        └── ws/notifier.ts
```

---

## 10. 非功能需求

### 10.1 性能

- 页面首屏加载 < 3s（4G 网络）
- API 响应时间 P95 < 500ms
- 订单列表最多返回 50 条，不分页（MVP 阶段）

### 10.2 安全

- 所有写接口（创建套餐、确认/拒绝订单、更新个人资料）均需 JWT 认证
- 老板申报接口（`POST /pay/boss-paid`）无需认证，但需校验 `packageId` 与 `userId` 的关联关系
- 图片上传采用前端 Base64，不经过服务器直接存数据库（MVP 简化，生产建议迁移 OSS）
- JWT 密钥通过环境变量 `JWT_SECRET` 配置，不可硬编码

### 10.3 兼容性

- H5：支持 iOS Safari 14+、Android Chrome 88+
- 微信小程序：基础库 2.20+
- 老板端（公开收款页）：需在微信内置浏览器及普通手机浏览器中正常显示二维码

### 10.4 错误处理原则

- 所有 API 错误统一通过 `uni.showToast` 展示
- 网络错误：「网络异常，请检查网络后重试」
- Token 过期：静默跳转登录页，不弹额外错误
- 业务错误：展示后端返回的 `message` 字段

---

## 11. 后续迭代规划（Backlog）

| 优先级 | 功能 | 说明 |
|--------|------|------|
| 高 | 会员订阅 | 纳贡升级解锁无限套餐；当前 MVP 订阅入口存在但未接入支付 |
| 高 | 图片 OSS 存储 | 收款码从 Base64 迁移至云存储（七牛/阿里 OSS），减少 DB 体积 |
| 中 | 微信小程序支付 | 替代手动转账申报，实现真实资金流转 |
| 中 | 统计图表 | 历史收款走势、最常被付款的套餐等数据可视化 |
| 中 | 订单搜索/筛选 | 按状态、时间、付款方筛选订单 |
| 低 | 多语言 | 英文版本（海外打工人） |
| 低 | 套餐排序拖拽 | 管理页支持拖拽调整套餐展示顺序 |

---

*文档结束 · 牛马加班吧产品需求说明书 v1.0 · 2026-07-03*
