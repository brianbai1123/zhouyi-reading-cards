# 周易读书卡

六十四卦交互式读书卡：原文、彖象、通俗讲解、名家对比（五步法）、背诵卡。

## 本机 Docker（推荐）

```bash
cd zhouyi
chmod +x docker-start.sh docker-stop.sh
./docker-start.sh          # 启动 → http://localhost:8080
./docker-stop.sh           # 停止
```

- 源码目录挂载进容器，改 `html/css/js/data` 后浏览器会**自动刷新**。
- 需要已安装并启动 Docker。

等价命令：

```bash
docker compose up -d
docker compose down
docker compose logs -f
```

## 在线访问

`https://brianbai1123.github.io/zhouyi-reading-cards/`

## 本地不经 Docker

```bash
python3 -m http.server 8765
```
