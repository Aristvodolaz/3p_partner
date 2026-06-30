#!/bin/bash
set -e

echo "=== 3P Partner — Deploy ==="
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Создаём папку для логов
mkdir -p "$ROOT_DIR/logs"

# --- Backend ---
echo "[1/4] Устанавливаем зависимости backend..."
cd "$ROOT_DIR/backend"
npm ci --omit=dev
npx prisma generate
npm run build

# --- Frontend ---
echo "[2/4] Устанавливаем зависимости frontend..."
cd "$ROOT_DIR/frontend"
npm ci
npm run build

# --- PM2 ---
echo "[3/4] Перезапускаем PM2..."
cd "$ROOT_DIR"

# Проверяем, установлен ли PM2
if ! command -v pm2 &> /dev/null; then
  echo "PM2 не найден, устанавливаем глобально..."
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
echo "Логи: pm2 logs"
echo "Статус: pm2 status"
