# MOM 수준진단 시스템 v1.0

> WIZ-Flow 기반 제조현장 MOM 도입 범위·우선순위·공수를 자동 제안하는 영업용 판정 플랫폼

## 기술 스택

| 구분 | 기술 |
|---|---|
| 프론트엔드 | React 18 + Vite + Zustand + TanStack Query |
| 백엔드 | Node.js + Express |
| DB | MySQL 8.0 (로컬/운영) / SQLite 인메모리 (무료 데모) |
| 인증 | JWT + bcrypt |
| 배포 | Vercel (무료) / Docker + Docker Compose (로컬) |

---

## 🌐 Vercel 무료 배포 (2단계)

> GitHub 연동 · 완전 무료 · 프로젝트 수 제한 없음 · 슬립 없음 · 신용카드 불필요

### 1단계 — Vercel 가입 및 레포 연결

1. [vercel.com](https://vercel.com) → **Sign Up** → **Continue with GitHub**
2. 대시보드 → **Add New Project**
3. `asdsin/MOM` 레포지토리 선택 → **Import**

### 2단계 — 환경변수 입력 후 배포

**Configure Project** 화면에서 **Environment Variables** 섹션에 아래 입력:

| Key | Value |
|---|---|
| `JWT_SECRET` | `mom-secret-change-this-2024` |
| `JWT_EXPIRES_IN` | `8h` |

> `DB_DIALECT`, `DB_STORAGE`, `NODE_ENV` 는 `api/index.js` 에서 자동 설정됩니다.

입력 후 **Deploy** 클릭 → 약 3~5분 빌드 후 URL 자동 생성

### 배포 후 접속

- URL 형식: `https://mom-xxxx.vercel.app`
- **초기 계정:** ID `admin` / PW `admin1234!`

> Vercel 서버리스 함수는 콜드 스타트 시 DB를 초기화합니다 (약 5~10초).
> 이후 요청은 빠르게 응답합니다.

---

## 빠른 시작 (로컬 Docker)

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

```bash
# 백엔드
cd backend && npm install
cp .env.example .env   # DB 정보 수정
npm run dev

# 프론트엔드 (새 터미널)
cd frontend && npm install && npm run dev
```

---

## 프로젝트 구조

```
MOM/
├─ api/index.js         # Vercel 서버리스 진입점
├─ vercel.json          # Vercel 배포 설정
├─ Dockerfile.prod      # Docker 프로덕션 빌드
├─ docker-compose.yml   # 로컬 개발
├─ render.yaml          # Render 배포 대안
├─ backend/
│  ├─ src/config/db.js  # MySQL / SQLite 자동 전환
│  ├─ src/models/       # Sequelize 모델 (23개 테이블)
│  ├─ src/routes/       # auth / customers / master / diagnosis
│  └─ db/seeders/       # 초기 데이터 자동 시드
└─ frontend/src/
   └─ pages/
      ├─ Dashboard.jsx
      ├─ Customers/
      ├─ Diagnosis/     # 진단 플로우 + Excel 보고서 출력
      └─ Master/        # 룰빌더 + 템플릿 CRUD
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

서버 최초 실행 시 자동 생성:

- 모듈 8개 / 모듈 의존성 7개 / 판정 룰 4개
- 업종 템플릿 3개 (전자조립 / 가공혼합 / 사출프레스)
- 수집 자료 체크리스트 9개

---

## 문의

위즈팩토리 · WIZ-Flow 개발팀
