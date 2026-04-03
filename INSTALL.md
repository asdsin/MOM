# MOM 수준진단 시스템 — 설치 가이드

## 빠른 시작

### Windows
```
install.bat 더블클릭
```

### Mac / Linux
```bash
bash install.sh
```

---

## 방식 1: Docker (권장)

### 필요 사항
- Docker Desktop: https://www.docker.com/products/docker-desktop

### 실행
```bash
# Mac/Linux
bash install.sh   # 1 선택

# Windows
install.bat       # 1 선택
```

### 서비스 관리
```bash
시작:  docker compose up -d
중지:  docker compose down
로그:  docker compose logs -f
재시작: docker compose restart
```

---

## 방식 2: 로컬 설치

### 필요 사항
- Node.js v18+: https://nodejs.org
- MySQL 8.0+: https://dev.mysql.com/downloads/

### MySQL 수동 설정
```sql
CREATE DATABASE mom_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mom_user'@'%' IDENTIFIED BY 'mom1234';
GRANT ALL PRIVILEGES ON mom_system.* TO 'mom_user'@'%';
FLUSH PRIVILEGES;
```

### 설치 및 실행
```bash
# Mac/Linux
bash install.sh   # 2 선택
bash start.sh     # 서비스 시작

# Windows
install.bat       # 2 선택
start.bat         # 서비스 시작
```

---

## 접속 정보

| 항목 | 값 |
|---|---|
| 프론트엔드 | http://localhost:5173 |
| 백엔드 API | http://localhost:3001/api/health |
| MySQL | localhost:3306 |
| 초기 이메일 | admin@wizfactory.com |
| 초기 비밀번호 | admin1234! |

---

## 문제 해결

### 포트 충돌
```bash
# 사용 중인 포트 확인
# Mac/Linux
lsof -i :3306
lsof -i :3001
lsof -i :5173

# Windows
netstat -ano | findstr :3306
```

### Docker 컨테이너 초기화
```bash
docker compose down -v   # 볼륨(DB 데이터)까지 삭제
docker compose up -d --build
```

### 로그 확인
```bash
# Docker
docker compose logs backend
docker compose logs frontend
docker compose logs mysql

# 로컬
# 각 터미널 창에서 직접 확인
```

---

## 환경 변수 설명 (backend/.env)

| 변수 | 설명 | 기본값 |
|---|---|---|
| DB_HOST | MySQL 호스트 | localhost |
| DB_PORT | MySQL 포트 | 3306 |
| DB_NAME | 데이터베이스명 | mom_system |
| DB_USER | DB 사용자 | mom_user |
| DB_PASS | DB 비밀번호 | mom1234 |
| JWT_SECRET | JWT 서명 키 **(운영 시 반드시 변경)** | 기본값 |
| JWT_EXPIRES_IN | 토큰 만료 시간 | 8h |
| MAX_LOGIN_FAIL | 로그인 실패 허용 횟수 | 5 |
