#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
docker compose down
echo "周易读书卡已停止。"
