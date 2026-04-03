#!/bin/bash
# MOM 수준진단 시스템 — 서비스 시작
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

echo ""
echo -e "${BOLD}MOM 수준진단 시스템 시작 중...${NC}"

# Docker 모드
if command -v docker &>/dev/null && [ -f docker-compose.yml ]; then
  if docker compose version &>/dev/null 2>&1; then
    DC="docker compose"
  elif command -v docker-compose &>/dev/null; then
    DC="docker-compose"
  fi

  if [ -n "$DC" ]; then
    $DC up -d
    echo ""
    echo -e "${GREEN}✅ 서비스 시작됨${NC}"
    echo -e "  🌐 프론트엔드: ${GREEN}http://localhost:5173${NC}"
    echo -e "  🔧 백엔드 API: ${GREEN}http://localhost:3001${NC}"
    echo ""
    sleep 2
    if command -v open &>/dev/null; then open "http://localhost:5173"
    elif command -v xdg-open &>/dev/null; then xdg-open "http://localhost:5173"; fi
    exit 0
  fi
fi

# 로컬 모드
if [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
  echo -e "${YELLOW}패키지가 설치되지 않았습니다. install.sh를 먼저 실행하세요.${NC}"
  exit 1
fi

echo -e "${BLUE}백엔드 시작...${NC}"
cd backend && npm run dev &
BE_PID=$!
cd "$SCRIPT_DIR"

echo -e "${BLUE}프론트엔드 시작...${NC}"
cd frontend && npm run dev &
FE_PID=$!
cd "$SCRIPT_DIR"

echo "$BE_PID $FE_PID" > .pids

echo ""
echo -e "${GREEN}✅ 서비스 시작됨${NC}"
echo -e "  🌐 프론트엔드: ${GREEN}http://localhost:5173${NC}"
echo -e "  🔧 백엔드:     ${GREEN}http://localhost:3001${NC}"
echo ""
echo -e "종료: ${YELLOW}bash stop.sh${NC}  또는  ${YELLOW}Ctrl+C${NC}"

trap "kill $BE_PID $FE_PID 2>/dev/null; rm -f .pids; echo ''; echo '서비스 종료됨'; exit" INT TERM
wait
