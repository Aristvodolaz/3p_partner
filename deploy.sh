#!/bin/bash
set -e

echo "=== 3P Partner — Full Redeploy ==="
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

mkdir -p "$ROOT_DIR/logs"

# --- Backend ---
echo ""
echo "[1/4] Backend: установка и сборка..."
cd "$ROOT_DIR/backend"

rm -rf node_modules dist

npm install --no-audit --no-fund

# Убедиться что binaryTargets есть в schema.prisma
if ! grep -q "debian-openssl-3.0.x" prisma/schema.prisma; then
  sed -i 's/provider      = "prisma-client-js"/provider      = "prisma-client-js"\n  binaryTargets = ["native", "debian-openssl-3.0.x"]/' prisma/schema.prisma
  echo "  → binaryTargets добавлен в schema.prisma"
fi

./node_modules/.bin/prisma generate
./node_modules/.bin/nest build

# Оставляем только production-зависимости
npm prune --omit=dev

echo "  → Backend собран: dist/main.js"

# --- Frontend ---
echo ""
echo "[2/4] Frontend: установка и сборка..."
cd "$ROOT_DIR/frontend"

rm -rf node_modules dist

npm install --no-audit --no-fund
npm run build

echo "  → Frontend собран: dist/"

# --- PM2 ---
echo ""
echo "[3/4] Перезапуск PM2..."
cd "$ROOT_DIR"

if ! command -v pm2 &> /dev/null; then
  echo "  PM2 не найден, устанавливаем глобально..."
  npm install -g pm2
fi

pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

# --- Проверка ---
echo ""
echo "[4/4] Проверка..."
sleep 3
pm2 status

echo ""
echo "=============================="
echo "  Деплой завершён!"
echo "  Приложение → http://$(hostname -I | awk '{print $1}'):3032"
echo "  Swagger    → http://$(hostname -I | awk '{print $1}'):3032/api/docs"
echo "  Логи       → pm2 logs 3p-partner-backend"
echo "=============================="
