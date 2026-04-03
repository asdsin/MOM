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

## 빠른 시작 (Docker)

### 사전 요구사항
- Docker Desktop 설치
- Docker Compose v2 이상

### 1. 레포지토리 클론 / 파일 준비

```bash
# mom-system/ 디렉토리 이동
cd mom-system
```

### 2. 환경변수 설정

```bash
cp backend/.env.example backend/.env
# backend/.env 파일에서 필요시 DB 정보 수정
```

### 3. Docker Compose 실행

```bash
docker-compose up -d
```

| 서비스 | URL |
|---|---|
| 프론트엔드 | http://localhost:5173 |
| 백엔드 API | http://localhost:3001 |
| API 헬스체크 | http://localhost:3001/api/health |

### 4. 초기 계정

```
이메일: admin@wizfactory.com
비밀번호: admin1234!
```

---

## 로컬 개발 (Docker 없이)

### 사전 요구사항
- Node.js 18+
- MySQL 8.0 (로컬 설치 또는 클라우드)

### 1. 백엔드 설정

```bash
cd backend
npm install

# .env 파일 수정 (DB 정보 입력)
cp .env backend/.env
# DB_HOST=localhost, DB_NAME=mom_system 등 수정

# MySQL에서 DB 생성
mysql -u root -p
CREATE DATABASE mom_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mom_user'@'localhost' IDENTIFIED BY 'mom1234';
GRANT ALL PRIVILEGES ON mom_system.* TO 'mom_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 서버 실행 (자동으로 테이블 생성 + 시드 실행)
npm run dev
```

### 2. 프론트엔드 설정

```bash
cd frontend
npm install
npm run dev
```

---

## 프로젝트 구조

```
mom-system/
├─ backend/
│  ├─ src/
│  │  ├─ config/db.js           # MySQL 연결
│  │  ├─ models/index.js        # Sequelize 모델 23개 테이블
│  │  ├─ routes/
│  │  │  ├─ auth.routes.js      # 로그인/회원가입
│  │  │  ├─ customer.routes.js  # 고객사 CRUD
│  │  │  ├─ master.routes.js    # 기준정보 관리
│  │  │  └─ diagnosis.routes.js # 진단 세션/결과
│  │  ├─ services/
│  │  │  └─ DiagnosisEngine.js  # 판정·공수 산정 엔진
│  │  └─ middleware/
│  │     └─ auth.middleware.js  # JWT + 역할 기반 권한
│  ├─ db/seeders/master.seed.js # 6대 모듈 초기 데이터
│  └─ server.js                 # 서버 진입점
├─ frontend/
│  └─ src/
│     ├─ api/                   # Axios 인스턴스 + API 함수
│     ├─ store/                 # Zustand 전역 상태
│     ├─ pages/
│     │  ├─ Login.jsx
│     │  ├─ Dashboard.jsx
│     │  ├─ Customers/          # 고객사 목록/등록/상세
│     │  └─ Diagnosis/          # 진단 플로우/결과
│     └─ components/Layout.jsx
└─ docker-compose.yml
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

### 진단
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET  | /api/diagnosis/modules/available | 모듈 목록 (의존성 포함) |
| POST | /api/diagnosis/sessions | 세션 생성 |
| PUT  | /api/diagnosis/sessions/:id/modules | 모듈 선택 + 의존성 검증 |
| POST | /api/diagnosis/sessions/:id/answers | 답변 저장 |
| POST | /api/diagnosis/sessions/:id/calculate | 공수 산정 + 판정 |
| GET  | /api/diagnosis/sessions/:id/result | 결과 조회 |

---

## Phase별 개발 현황

| Phase | 내용 | 상태 |
|---|---|---|
| Phase 1 | DB + 인증 + 고객등록 + 진단저장 | ✅ 완료 |
| Phase 2 | 기준정보 관리 UI + DB 룰 기반 판정 엔진 | 🔜 예정 |
| Phase 3 | 연관성 설정 화면 + 보고서 Excel/PDF 출력 | 🔜 예정 |
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
