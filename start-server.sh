#!/bin/bash

# 启动本地HTTP服务器预览项目
# 默认端口: 8000
# 访问地址: http://localhost:8000

PORT=${1:-8000}

echo "正在启动本地服务器..."
echo "访问地址: http://localhost:$PORT"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

cd "$(dirname "$0")"
python3 -m http.server $PORT
