#!/bin/bash
# ============================================================
#  MOM 수준진단 시스템 — 원클릭 설치 스크립트 (Mac/Linux)
#  사용법: bash install.sh
# ============================================================
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║    MOM 수준진단 시스템 설치 시작             ║${NC}"
echo -e "${BOLD}║    React + Node.js + MySQL                   ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}설치 방식을 선택하세요:${NC}"
echo "  1) Docker (권장 — MySQL 포함 자동 설치)"
echo "  2) 로컬 설치 (Node.js v18+ 및 MySQL 별도 필요)"
echo ""
read -p "선택 (1 또는 2, 기본값 1): " INSTALL_MODE
INSTALL_MODE=${INSTALL_MODE:-1}

# ══════════════════════════════════════════════════════════
# 방식 1: Docker Compose
# ══════════════════════════════════════════════════════════
if [ "$INSTALL_MODE" = "1" ]; then
  echo ""
  echo -e "${BLUE}[Docker 설치 모드]${NC}"

  # Docker 확인
  if ! command -v docker &>/dev/null; then
    echo -e "${RED}❌ Docker가 설치되어 있지 않습니다.${NC}"
    echo "   https://www.docker.com/products/docker-desktop 에서 설치 후 재실행하세요."
    exit 1
  fi

  DOCKER_COMPOSE_CMD=""
  if docker compose version &>/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
  elif command -v docker-compose &>/dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
  else
    echo -e "${RED}❌ Docker Compose가 없습니다. Docker Desktop을 설치해주세요.${NC}"
    exit 1
  fi

  echo -e "${GREEN}✅ Docker 확인 완료 (${DOCKER_COMPOSE_CMD})${NC}"
  echo ""

  # 포트 충돌 확인
  for PORT in 3306 3001 5173; do
    if lsof -i ":$PORT" &>/dev/null 2>&1; then
      echo -e "${YELLOW}⚠️  포트 $PORT 이미 사용 중입니다.${NC}"
    fi
  done

  # .env 파일 생성
  [ ! -f backend/.env ]  && cp backend/.env.example  backend/.env  && echo -e "${GREEN}✅ backend/.env 생성됨${NC}"
  [ ! -f frontend/.env ] && cp frontend/.env.example frontend/.env && echo -e "${GREEN}✅ frontend/.env 생성됨${NC}"

  echo ""
  echo -e "${BLUE}🐳 Docker 이미지 빌드 및 서비스 시작 중...${NC}"
  echo -e "   (최초 실행 시 이미지 빌드로 ${YELLOW}3~8분${NC} 소요됩니다)"
  echo ""

  $DOCKER_COMPOSE_CMD up -d --build

  # MySQL 헬스체크 대기
  echo ""
  echo -e "${BLUE}⏳ MySQL 초기화 대기 중...${NC}"
  RETRY=0
  until $DOCKER_COMPOSE_CMD exec -T mysql mysqladmin ping -h localhost -u root -proot1234 &>/dev/null 2>&1; do
    RETRY=$((RETRY+1))
    if [ $RETRY -ge 30 ]; then
      echo -e "${YELLOW}⚠️  MySQL 초기화 타임아웃 — 서비스는 계속 시작됩니다.${NC}"
      break
    fi
    printf "."
    sleep 3
  done
  echo ""

  # 백엔드 헬스체크 대기
  echo -e "${BLUE}⏳ 백엔드 API 대기 중...${NC}"
  RETRY=0
  until curl -sf http://localhost:3001/api/health &>/dev/null 2>&1; do
    RETRY=$((RETRY+1))
    if [ $RETRY -ge 20 ]; then
      echo -e "${YELLOW}⚠️  백엔드 응답 대기 중 (백그라운드에서 계속 시작됩니다)${NC}"
      break
    fi
    printf "."
    sleep 3
  done
  echo ""

  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║    ✅  설치 및 시작 완료!                    ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${BOLD}  🌐 프론트엔드:  ${GREEN}http://localhost:5173${NC}"
  echo -e "${BOLD}  🔧 백엔드 API:  ${GREEN}http://localhost:3001/api/health${NC}"
  echo -e "${BOLD}  🗄️  MySQL:       localhost:3306${NC}"
  echo ""
  echo -e "${BOLD}  초기 로그인 계정${NC}"
  echo -e "  📧 이메일:   ${YELLOW}admin@wizfactory.com${NC}"
  echo -e "  🔑 비밀번호: ${YELLOW}admin1234!${NC}"
  echo ""
  echo -e "  서비스 시작: ${BLUE}bash start.sh${NC}"
  echo -e "  서비스 중지: ${BLUE}bash stop.sh${NC}  또는  ${BLUE}docker compose down${NC}"
  echo -e "  로그 확인:   ${BLUE}docker compose logs -f${NC}"
  echo ""

  # 브라우저 자동 열기
  sleep 2
  if command -v open &>/dev/null; then
    open "http://localhost:5173"
  elif command -v xdg-open &>/dev/null; then
    xdg-open "http://localhost:5173"
  fi

# ══════════════════════════════════════════════════════════
# 방식 2: 로컬 설치
# ══════════════════════════════════════════════════════════
else
  echo ""
  echo -e "${BLUE}[로컬 설치 모드]${NC}"

  # Node.js 확인
  if ! command -v node &>/dev/null; then
    echo -e "${RED}❌ Node.js가 설치되어 있지 않습니다.${NC}"
    echo "   https://nodejs.org (v18 이상) 에서 설치 후 재실행하세요."
    exit 1
  fi
  NODE_VER=$(node -v | tr -d 'v' | cut -d. -f1)
  if [ "$NODE_VER" -lt 18 ]; then
    echo -e "${RED}❌ Node.js v18 이상이 필요합니다. 현재: $(node -v)${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Node.js $(node -v) 확인${NC}"

  # MySQL 확인
  if ! command -v mysql &>/dev/null; then
    echo -e "${YELLOW}⚠️  MySQL 클라이언트를 찾을 수 없습니다. MySQL이 실행 중인지 확인하세요.${NC}"
  fi

  # DB 설정 입력
  echo ""
  echo -e "${YELLOW}MySQL 접속 정보를 입력하세요 (Enter = 기본값):${NC}"
  read -p "  DB Host     [localhost]: " DB_HOST; DB_HOST=${DB_HOST:-localhost}
  read -p "  DB Port     [3306]: "      DB_PORT; DB_PORT=${DB_PORT:-3306}
  read -p "  DB Name     [mom_system]: " DB_NAME; DB_NAME=${DB_NAME:-mom_system}
  read -p "  DB User     [mom_user]: "  DB_USER; DB_USER=${DB_USER:-mom_user}
  read -s -p "  DB Password [mom1234]: "   DB_PASS; echo ""; DB_PASS=${DB_PASS:-mom1234}
  read -s -p "  MySQL Root PW (DB 자동생성용, Enter로 건너뜀): " ROOT_PW; echo ""

  # .env 생성
  JWT_SECRET="mom-system-jwt-secret-$(date +%s | sha256sum | head -c 16)"
  cat > backend/.env << EOF
NODE_ENV=development
PORT=3001
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASS
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=8h
MAX_LOGIN_FAIL=5
CORS_ORIGIN=http://localhost:5173
EOF
  echo -e "${GREEN}✅ backend/.env 생성됨${NC}"

  cat > frontend/.env << EOF
VITE_API_URL=http://localhost:3001
EOF
  echo -e "${GREEN}✅ frontend/.env 생성됨${NC}"

  # MySQL DB 자동 생성 시도
  if [ -n "$ROOT_PW" ]; then
    echo ""
    echo -e "${BLUE}🗄️  MySQL 데이터베이스 생성 중...${NC}"
    mysql -h "$DB_HOST" -P "$DB_PORT" -u root -p"$ROOT_PW" << SQL 2>/dev/null && \
      echo -e "${GREEN}✅ DB 생성 완료${NC}" || \
      echo -e "${YELLOW}⚠️  DB 자동 생성 실패 — INSTALL.md 참고하여 수동 생성하세요${NC}"
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'%';
FLUSH PRIVILEGES;
SQL
  else
    echo -e "${YELLOW}⚠️  DB 자동 생성 건너뜀 — INSTALL.md를 참고하여 수동으로 DB를 생성하세요${NC}"
  fi

  # 백엔드 패키지 설치
  echo ""
  echo -e "${BLUE}📦 백엔드 패키지 설치 중...${NC}"
  cd backend && npm install && cd "$SCRIPT_DIR"
  echo -e "${GREEN}✅ 백엔드 패키지 설치 완료${NC}"

  # 프론트엔드 패키지 설치
  echo ""
  echo -e "${BLUE}📦 프론트엔드 패키지 설치 중...${NC}"
  cd frontend && npm install && cd "$SCRIPT_DIR"
  echo -e "${GREEN}✅ 프론트엔드 패키지 설치 완료${NC}"

  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║    ✅  설치 완료!                            ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${BOLD}  서비스 시작 방법${NC}"
  echo -e "  ${YELLOW}bash start.sh${NC}"
  echo ""
  echo -e "${BOLD}  접속 정보${NC}"
  echo -e "  🌐 프론트엔드:  ${GREEN}http://localhost:5173${NC}"
  echo -e "  🔧 백엔드 API:  ${GREEN}http://localhost:3001${NC}"
  echo ""
  echo -e "${BOLD}  초기 로그인 계정${NC}"
  echo -e "  📧 이메일:   ${YELLOW}admin@wizfactory.com${NC}"
  echo -e "  🔑 비밀번호: ${YELLOW}admin1234!${NC}"
  echo ""
fi
