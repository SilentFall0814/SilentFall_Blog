#!/bin/bash
set -e

BLOG_DIR="$(cd "$(dirname "$0")" && pwd)"
MANAGER_DIR="$(dirname "$BLOG_DIR")/my-blog-manager"

export MONGO_URI="${MONGO_URI:-mongodb://localhost:27017}"
export MONGO_DB_NAME="${MONGO_DB_NAME:-nowin_blog}"
export CMS_BACKEND_URL="${CMS_BACKEND_URL:-http://127.0.0.1:8765}"
export PORT="${PORT:-3000}"

echo "========================================="
echo "  NoWin_Blog 服务器部署启动脚本"
echo "========================================="
echo ""
echo "博客目录:   $BLOG_DIR"
echo "后端目录:   $MANAGER_DIR"
echo "MongoDB:    $MONGO_URI / $MONGO_DB_NAME"
echo "后端地址:   $CMS_BACKEND_URL"
echo "前端端口:   $PORT"
echo ""

if [ ! -d "$BLOG_DIR/.next/standalone" ]; then
    echo "❌ 未检测到构建产物，正在执行 npm run build ..."
    cd "$BLOG_DIR"
    npm run build
    echo "✅ 构建完成"
fi

echo "🚀 启动 Python 后端..."
cd "$MANAGER_DIR"
python3 -c "from cms_core.main import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8765)" &
BACKEND_PID=$!
echo "   后端 PID: $BACKEND_PID"

sleep 2

echo "🚀 启动 Next.js 前端..."
cd "$BLOG_DIR/.next/standalone"
HOSTNAME="0.0.0.0" node server.js &
FRONTEND_PID=$!
echo "   前端 PID: $FRONTEND_PID"

echo ""
echo "✅ 全部启动完成！"
echo "   博客地址: http://localhost:$PORT"
echo "   后端 API: http://localhost:8765/api/status"
echo ""
echo "按 Ctrl+C 停止所有服务"

cleanup() {
    echo ""
    echo "🛑 正在停止服务..."
    kill $FRONTEND_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    echo "✅ 已停止"
    exit 0
}

trap cleanup SIGINT SIGTERM

wait
