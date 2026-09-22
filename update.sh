#!/bin/bash
set -e

echo "=== 3P Partner — Update Deploy (ВХП/ИСП/Инвентаризация) ==="
echo "Быстрое обновление уже развёрнутого приложения: git pull + миграции + сборка + рестарт."
echo "Для чистой переустановки (новый сервер / поломанный node_modules) используйте deploy.sh."
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

mkdir -p "$ROOT_DIR/logs"

# --- Git ---
echo ""
echo "[1/5] Git: подтягиваем свежий main..."

if [ -n "$(git status --porcelain)" ]; then
  echo "  ! В рабочей копии есть незакоммиченные изменения — останавливаюсь, чтобы их не затереть."
  git status --short
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$BRANCH" != "main" ]; then
  echo "  ! Текущая ветка «$BRANCH», ожидается «main» — останавливаюсь."
  exit 1
fi

git fetch origin
BEFORE="$(git rev-parse HEAD)"
git pull --ff-only origin main
AFTER="$(git rev-parse HEAD)"

if [ "$BEFORE" = "$AFTER" ]; then
  echo "  → Уже на последнем коммите ($AFTER), новых изменений нет."
else
  echo "  → Обновлено: $BEFORE → $AFTER"
  git log --oneline "$BEFORE..$AFTER"
fi

# --- Backend ---
echo ""
echo "[2/5] Backend: зависимости, миграции, сборка..."
cd "$ROOT_DIR/backend"

npm install --no-audit --no-fund

# Прогоняем все SQL-миграции по порядку — каждая идемпотентна (IF NOT EXISTS),
# повторный запуск уже применённых безопасен. Новые (например 013 —
# ВХП/ИСП/Инвентаризация) применятся, если ещё не были применены на этой БД.
echo "  → Применяю миграции prisma/migrations/*.sql..."
for f in prisma/migrations/*.sql; do
  echo "    - $(basename "$f")"
  ./node_modules/.bin/prisma db execute --file "$f" --schema prisma/schema.prisma
done

./node_modules/.bin/prisma generate
./node_modules/.bin/nest build

echo "  → Backend собран: dist/main.js"

# --- Frontend ---
echo ""
echo "[3/5] Frontend: зависимости, сборка..."
cd "$ROOT_DIR/frontend"

npm install --no-audit --no-fund
npm run build

echo "  → Frontend собран: dist/ (раздаётся бэкендом статикой)"

# --- PM2 ---
echo ""
echo "[4/5] Перезапуск PM2..."
cd "$ROOT_DIR"

if ! command -v pm2 &> /dev/null; then
  echo "  PM2 не найден, устанавливаем глобально..."
  npm install -g pm2
fi

if pm2 describe 3p-partner-backend > /dev/null 2>&1; then
  pm2 restart 3p-partner-backend --update-env
else
  pm2 start ecosystem.config.cjs
fi
pm2 save

# --- Проверка ---
echo ""
echo "[5/5] Проверка..."
sleep 3
pm2 status

echo ""
echo "=============================="
echo "  Обновление завершено!"
echo "  Приложение → http://$(hostname -I | awk '{print $1}'):3032"
echo "  Swagger    → http://$(hostname -I | awk '{print $1}'):3032/api/docs"
echo "  Логи       → pm2 logs 3p-partner-backend"
echo "=============================="
