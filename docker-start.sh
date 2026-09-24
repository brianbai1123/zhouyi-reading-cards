#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Docker 未运行，尝试启动..."
  if command -v sudo >/dev/null; then
    # 嵌套环境可用 vfs 驱动
    if [ ! -f /etc/docker/daemon.json ]; then
      sudo mkdir -p /etc/docker
      echo '{"storage-driver":"vfs"}' | sudo tee /etc/docker/daemon.json >/dev/null
    fi
    sudo dockerd >/tmp/dockerd.log 2>&1 &
    sleep 4
  fi
fi

docker compose up -d --pull missing
echo ""
echo "周易读书卡已启动"
echo "本机访问: http://localhost:8080"
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -n "${IP:-}" ]; then
  echo "同网手机: http://${IP}:8080"
fi
echo ""
echo "在 Cursor 里改本目录文件后，浏览器会自动刷新。"
echo "停止: ./docker-stop.sh"
echo "日志: docker compose logs -f"
