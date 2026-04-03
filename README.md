# MOM 수준진단 시스템 v1.0

> WIZ-Flow 기반 제조현장 MOM 도입 범위·우선순위·공수를 자동 제안하는 영업용 판정 플랫폼

## 기술 스택

| 구분 | 기술 |
|---|---|
| 프론트엔드 | React 18 + Vite + Zustand + TanStack Query |
| 백엔드 | Node.js + Express |
| DB | MySQL 8.0 + Sequelize ORM |
| 인증 | JWT + bcrypt |
| 컨테이너 | Docker + Docker Compose |

---

## 🌐 Railway 클라우드 배포 (추천)

Railway는 MySQL + Node.js를 무료로 지원하는 클라우드 플랫폼입니다.
**단 5분** 안에 퍼블릭 URL을 생성할 수 있습니다.

### 1단계 — Railway 계정 생성
[railway.app](https://railway.app) → GitHub 계정으로 가입

### 2단계 — 새 프로젝트 생성

```
New Project → Deploy from GitHub repo → asdsin/MOM 선택
```

### 3단계 — MySQL 데이터베이스 추가

```
프로젝트 대시보드 → + New → Database → MySQL
```

MySQL 서비스가 추가되면 **Connect** 탭에서 아래 값을 복사합니다:
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`

### 4단계 — 서비스 환경변수 설정

MOM 서비스 클릭 → **Variables** 탭 → 아래 변수 입력:

| 변수명 | 값 |
|---|---|
| `DB_HOST` | MySQL의 MYSQL_HOST 값 |
| `DB_PORT` | MySQL의 MYSQL_PORT 값 |
| `DB_NAME` | MySQL의 MYSQL_DATABASE 값 |
| `DB_USER` | MySQL의 MYSQL_USER 값 |
| `DB_PASS` | MySQL의 MYSQL_PASSWORD 값 |
| `JWT_SECRET` | 임의의 긴 문자열 (예: `mom-secret-xyz-2024`) |
| `JWT_EXPIRES_IN` | `8h` |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |

### 5단계 — 배포 확인

Variables 저장 시 자동으로 재배포됩니다.
**Settings → Domains** 에서 퍼블릭 URL 확인 (예: `mom-system.up.railway.app`)

### 초기 계정

```
이메일: admin@wizfactory.com
비밀번호: admin1234!
```

---

## 🌐 Render 배포 (대안)

[render.com](https://render.com) → GitHub 로그인 → New → Blueprint
이 레포지토리를 선택하면 `render.yaml` 설정을 자동 감지합니다.
**MySQL은 외부 서비스 (PlanetScale, Aiven 등) 연결 후 환경변수를 직접 입력하세요.**

---

## 빠른 시작 (로컬 Docker)

### 사전 요구사항
- Docker Desktop 설치
- Docker Compose v2 이상

```bash
# 1. 레포지토리 클론
git clone https://github.com/asdsin/MOM.git
cd MOM

# 2. 환경변수 설정
cp backend/.env.example backend/.env

# 3. 실행
docker-compose up -d
```

| 서비스 | URL |
|---|---|
| 프론트엔드 | http://localhost:5173 |
| 백엔드 API | http://localhost:3001 |
| API 헬스체크 | http://localhost:3001/api/health |

---

## 로컬 개발 (Docker 없이)

### 백엔드

```bash
cd backend
npm install

# .env 작성 (DB 정보 입력)
cp .env.example .env

# MySQL에서 DB 생성
mysql -u root -p -e "
  CREATE DATABASE mom_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'mom_user'@'localhost' IDENTIFIED BY 'mom1234';
  GRANT ALL PRIVILEGES ON mom_system.* TO 'mom_user'@'localhost';
  FLUSH PRIVILEGES;
"

# 서버 실행 (테이블 자동 생성 + 시드)
npm run dev
```

### 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

---

## 프로젝트 구조

```
MOM/
├─ Dockerfile.prod          # 프로덕션 멀티스테이지 빌드
├─ docker-compose.yml       # 로컬 개발용
├─ railway.json             # Railway 배포 설정
├─ render.yaml              # Render 배포 설정
├─ backend/
│  ├─ src/
│  │  ├─ config/db.js       # MySQL 연결
│  │  ├─ models/index.js    # Sequelize 모델 (23개 테이블)
│  │  ├─ routes/
│  │  │  ├─ auth.routes.js
│  │  │  ├─ customer.routes.js
│  │  │  ├─ master.routes.js    # 기준정보 + 룰빌더 API
│  │  │  └─ diagnosis.routes.js # 진단 + Excel 보고서 API
│  │  ├─ services/
│  │  │  └─ DiagnosisEngine.js
│  │  └─ middleware/auth.middleware.js
│  └─ db/seeders/master.seed.js
└─ frontend/
   └─ src/
      ├─ api/
      ├─ store/
      └─ pages/
         ├─ Login.jsx
         ├─ Dashboard.jsx
         ├─ Customers/
         ├─ Diagnosis/      # DiagnosisFlow + DiagnosisResult (Excel 출력)
         └─ Master/         # MasterPage (룰빌더 + 템플릿 CRUD)
```

---

## API 엔드포인트 요약

### 인증
| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | /api/auth/register | 회원가입 |
| POST | /api/auth/login | 로그인 (JWT 발급) |
| GET  | /api/auth/me | 내 정보 조회 |

### 고객사
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET  | /api/customers | 목록 |
| POST | /api/customers | 등록 |
| GET  | /api/customers/:id | 상세 (공장구조 포함) |

### 기준정보 (Phase 3)
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET/POST/PUT/DELETE | /api/master/rules | 판정 룰 CRUD |
| GET/POST/PUT/DELETE | /api/master/templates | 업종 템플릿 CRUD |

### 진단
| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | /api/diagnosis/sessions | 세션 생성 |
| PUT  | /api/diagnosis/sessions/:id/modules | 모듈 선택 |
| POST | /api/diagnosis/sessions/:id/answers | 답변 저장 |
| POST | /api/diagnosis/sessions/:id/calculate | 공수 산정 |
| GET  | /api/diagnosis/sessions/:id/result | 결과 조회 |
| GET  | /api/diagnosis/sessions/:id/export-excel | **Excel 보고서 다운로드** |

---

## Phase별 개발 현황

| Phase | 내용 | 상태 |
|---|---|---|
| Phase 1 | DB + 인증 + 고객등록 + 진단저장 | ✅ 완료 |
| Phase 2 | 기준정보 관리 UI + DB 룰 기반 판정 엔진 | ✅ 완료 |
| Phase 3 | 룰빌더 UI + 템플릿 CRUD + Excel 보고서 출력 | ✅ 완료 |
| Phase 4 | 제안서 자동생성 + 히스토리 비교 + SSO | 🔜 예정 |

---

## 초기 데이터 (자동 시드)

서버 최초 실행 시 자동으로 아래 데이터가 생성됩니다.

- **모듈 8개**: 실적·공정 수집 / 설비·보전 / 품질 관리 / SOP 관리 / 이슈 관리 / 실적 집계 / ERP 연동 / 현장 인프라
- **모듈 의존성 7개**: 의존성 그래프 자동 적용
- **판정 룰 4개**: Stage 1~3 자동 판정
- **업종 템플릿 3개**: 전자조립 / 가공혼합 / 사출프레스
- **수집 자료 체크리스트 9개**: 진단 결과 연동 자동 생성

---

## 문의

위즈팩토리 · WIZ-Flow 개발팀
