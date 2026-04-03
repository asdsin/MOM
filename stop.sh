#!/bin/bash
# MOM 수준진단 시스템 — 서비스 중지
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo "MOM 수준진단 시스템 중지 중..."

if command -v docker &>/dev/null && [ -f docker-compose.yml ]; then
  if docker compose version &>/dev/null 2>&1; then
    docker compose down
  else
    docker-compose down
  fi
  echo -e "${GREEN}✅ Docker 서비스 중지됨${NC}"
  exit 0
fi

if [ -f .pids ]; then
  kill $(cat .pids) 2>/dev/null; rm -f .pids
  echo -e "${GREEN}✅ 서비스 중지됨${NC}"
else
  for PORT in 3001 5173; do
    PID=$(lsof -ti ":$PORT" 2>/dev/null)
    [ -n "$PID" ] && kill "$PID" 2>/dev/null && echo -e "${YELLOW}포트 $PORT 종료됨${NC}"
  done
fi
echo ""
