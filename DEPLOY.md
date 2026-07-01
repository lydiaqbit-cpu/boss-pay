# 老板请付费 · 部署指南

## 第一步：创建 Turso 云数据库（免费）

1. 注册 https://turso.tech
2. 安装 CLI：`brew install tursodatabase/tap/turso`
3. 登录：`turso auth login`
4. 创建数据库：
   ```bash
   turso db create boss-pay-db
   ```
5. 获取连接信息：
   ```bash
   turso db show boss-pay-db          # 复制 URL（libsql://...）
   turso db tokens create boss-pay-db # 复制 Token
   ```
6. 在 `backend/.env` 填入：
   ```
   DATABASE_URL=libsql://boss-pay-db-xxxx.turso.io
   TURSO_AUTH_TOKEN=your-token-here
   JWT_SECRET=随机字符串（越长越好）
   PLATFORM_FEE_RATE=0.05
   ```
7. 初始化线上数据库（在 backend 目录）：
   ```bash
   npx prisma migrate deploy
   ```

---

## 第二步：部署后端到 Railway（免费）

1. 注册 https://railway.app，连接 GitHub
2. 把代码推到 GitHub：
   ```bash
   cd /Users/lydia/boss-pay
   git init && git add . && git commit -m "init"
   git remote add origin https://github.com/你的账号/boss-pay.git
   git push -u origin main
   ```
3. Railway → New Project → Deploy from GitHub → 选择 boss-pay 仓库
4. 选择 `backend` 子目录部署
5. 在 Railway 项目设置 → Variables 里填入上面的环境变量
6. 部署完成后复制 Railway 给的域名，例如：
   `https://boss-pay-backend-production.railway.app`

---

## 第三步：更新前端生产环境配置

打开 `frontend/.env.production`，填入 Railway 域名：
```
VITE_API_BASE_URL=https://boss-pay-backend-production.railway.app/api
VITE_WS_BASE_URL=wss://boss-pay-backend-production.railway.app
```

---

## 第四步：注册微信小程序

1. 打开 https://mp.weixin.qq.com → 注册 → 选"小程序"
2. 注册完成后，在"开发管理 → 开发设置"里找到 **AppID**
3. 填入 `frontend/src/manifest.json`：
   ```json
   "mp-weixin": {
     "appid": "wx你的AppID"
   }
   ```
4. 在微信公众平台 → 开发管理 → 开发设置 → **服务器域名** 里添加：
   - request 合法域名：`https://boss-pay-backend-production.railway.app`
   - socket 合法域名：`wss://boss-pay-backend-production.railway.app`

---

## 第五步：构建 & 上传小程序

```bash
cd frontend
npm run build:mp-weixin
```

构建产物在 `frontend/dist/build/mp-weixin/`

1. 下载安装**微信开发者工具**：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
2. 打开微信开发者工具 → 导入项目 → 选择 `dist/build/mp-weixin/`
3. 填入你的 AppID
4. 点"上传"→ 填写版本号 → 提交审核

---

## 本地开发（不变）

```bash
# 后端
cd backend && npm run dev

# 前端 H5
cd frontend && npm run dev:h5

# 前端小程序预览（需要微信开发者工具）
cd frontend && npm run dev:mp-weixin
```
