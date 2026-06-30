#!/bin/bash
set -e

echo "=== 3P Partner — Deploy ==="
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

mkdir -p "$ROOT_DIR/logs"

# --- Backend ---
echo "[1/4] Backend: сборка..."
cd "$ROOT_DIR/backend"

# Устанавливаем ВСЕ зависимости (включая devDeps — нужен @nestjs/cli для сборки)
npm ci
npm audit fix --force 2>/dev/null || true
./node_modules/.bin/prisma generate
./node_modules/.bin/nest build

# После сборки удаляем devDeps — в production они не нужны
npm prune --omit=dev

# --- Frontend ---
echo "[2/4] Frontend: сборка..."
cd "$ROOT_DIR/frontend"
npm ci
npm run build

# --- PM2 ---
echo "[3/4] Перезапускаем PM2..."
cd "$ROOT_DIR"

if ! command -v pm2 &> /dev/null; then
  echo "PM2 не найден, устанавливаем..."
  npm install -g pm2
fi

pm2 stop ecosystem.config.cjs 2>/dev/null || true
pm2 delete ecosystem.config.cjs 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "[4/4] Готово!"
echo "  Backend  → http://localhost:3032"
echo "  Frontend → http://localhost:3033"
echo "  Swagger  → http://localhost:3032/api/docs"
echo ""
echo "Статус : pm2 status"
echo "Логи   : pm2 logs"
