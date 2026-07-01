#!/bin/bash
echo "🚀 启动 老板请付费..."

# 后端
cd "$(dirname "$0")/backend"
npx ts-node-dev --transpile-only src/index.ts &
BACKEND_PID=$!
echo "✅ 后端启动 PID=$BACKEND_PID (http://localhost:3000)"

# 前端
cd "$(dirname "$0")/frontend"
npm run dev:h5 &
FRONTEND_PID=$!
echo "✅ 前端启动 PID=$FRONTEND_PID (http://localhost:5173)"

echo ""
echo "📱 收款页地址（老板扫这个）:"
echo "   http://localhost:5173/pages/pay/cashier?userId=<你的userId>"
echo ""
echo "按 Ctrl+C 停止所有服务"
wait
