# MOM 수준진단 시스템 v1.0

> WIZ-Flow 기반 제조현장 MOM 도입 범위·우선순위·공수를 자동 제안하는 영업용 판정 플랫폼

## 기술 스택

| 구분 | 기술 |
|---|---|
| 프론트엔드 | React 18 + Vite + Zustand + TanStack Query |
| 백엔드 | Node.js + Express |
| DB | MySQL 8.0 (로컬/운영) / SQLite 인메모리 (무료 데모) |
| 인증 | JWT + bcrypt |
| 컨테이너 | Docker + Docker Compose |

---

## 🌐 Render.com 무료 배포 (3단계)

> 신용카드 불필요 · 완전 무료 · SQLite 내장으로 외부 DB 없이 동작

### 1단계 — Render 계정 생성

[render.com](https://render.com) → **GitHub으로 가입**

### 2단계 — 새 Web Service 생성

1. 대시보드 → **+ New** → **Web Service**
2. **Connect a repository** → `asdsin/MOM` 선택 (없으면 Configure GitHub App으로 권한 부여)
3. 아래 설정 입력:

| 항목 | 값 |
|---|---|
| **Name** | `mom-system` (자유) |
| **Region** | Singapore (한국과 가장 가까움) |
| **Branch** | `main` |
| **Runtime** | **Docker** |
| **Dockerfile Path** | `./Dockerfile.prod` |
| **Instance Type** | **Free** |

4. **Environment Variables** 섹션에 아래 추가:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `DB_DIALECT` | `sqlite` |
| `DB_STORAGE` | `:memory:` |
| `JWT_SECRET` | `mom-secret-change-this-2024` (아무 문자열) |
| `JWT_EXPIRES_IN` | `8h` |

5. **Create Web Service** 클릭

### 3단계 — 배포 완료 후 URL 확인

- 빌드 로그가 끝나면 상단에 `https://mom-system-xxxx.onrender.com` 형태의 URL 자동 생성
- 해당 URL로 접속하여 로그인

### 초기 계정

```
이메일: admin@wizfactory.com
비밀번호: admin1234!
```

> **참고:** Render 무료 플랜은 15분 미사용 시 슬립 상태가 됩니다.
> 처음 접속 시 약 30~60초 로딩 시간이 있을 수 있습니다.
> 슬립에서 깨어나면 SQLite 인메모리 DB가 초기화되므로 시드 데이터(초기 계정·모듈)가 자동 복원됩니다.

---

## 빠른 시작 (로컬 Docker)

### 사전 요구사항
- Docker Desktop 설치
- Docker Compose v2 이상

```bash
git clone https://github.com/asdsin/MOM.git
cd MOM
cp backend/.env.example backend/.env
docker-compose up -d
```

| 서비스 | URL |
|---|---|
| 프론트엔드 | http://localhost:5173 |
| 백엔드 API | http://localhost:3001 |
| 헬스체크 | http://localhost:3001/api/health |

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
├─ render.yaml              # Render 무료 배포 설정
├─ backend/
│  ├─ src/
│  │  ├─ config/db.js       # MySQL / SQLite 자동 전환
│  │  ├─ models/index.js    # Sequelize 모델 (23개 테이블)
│  │  ├─ routes/
│  │  │  ├─ auth.routes.js
│  │  │  ├─ customer.routes.js
│  │  │  ├─ master.routes.js    # 기준정보 + 룰빌더 API
│  │  │  └─ diagnosis.routes.js # 진단 + Excel 보고서 API
│  │  └─ services/DiagnosisEngine.js
│  └─ db/seeders/master.seed.js
└─ frontend/src/
   ├─ api/
   ├─ store/
   └─ pages/
      ├─ Dashboard.jsx
      ├─ Customers/
      ├─ Diagnosis/      # DiagnosisFlow + DiagnosisResult (Excel 출력)
      └─ Master/         # MasterPage (룰빌더 + 템플릿 CRUD)
```

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
- **모듈 의존성 7개**
- **판정 룰 4개**: Stage 1~3 자동 판정
- **업종 템플릿 3개**: 전자조립 / 가공혼합 / 사출프레스
- **수집 자료 체크리스트 9개**

---

## 문의

위즈팩토리 · WIZ-Flow 개발팀
