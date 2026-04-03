@echo off
chcp 65001 > nul
title MOM 수준진단 시스템 — 설치

echo.
echo ╔══════════════════════════════════════════════╗
echo ║    MOM 수준진단 시스템 설치 (Windows)        ║
echo ║    React + Node.js + MySQL                   ║
echo ╚══════════════════════════════════════════════╝
echo.

echo 설치 방식을 선택하세요:
echo   1) Docker (권장 — MySQL 포함 자동 설치)
echo   2) 로컬 설치 (Node.js v18+ 및 MySQL 별도 필요)
echo.
set /p INSTALL_MODE="선택 (1 또는 2, 기본값 1): "
if "%INSTALL_MODE%"=="" set INSTALL_MODE=1

:: ═══════════════════════════════════════
:: 방식 1: Docker
:: ═══════════════════════════════════════
if "%INSTALL_MODE%"=="1" (
    echo.
    echo [Docker 설치 모드]

    docker --version >nul 2>&1
    if errorlevel 1 (
        echo.
        echo ❌ Docker가 설치되어 있지 않습니다.
        echo    https://www.docker.com/products/docker-desktop 에서 설치 후 재실행하세요.
        pause
        exit /b 1
    )
    echo ✅ Docker 확인 완료

    if not exist "backend\.env" copy "backend\.env.example" "backend\.env" > nul
    if not exist "frontend\.env" copy "frontend\.env.example" "frontend\.env" > nul
    echo ✅ 환경변수 파일 생성됨

    echo.
    echo 🐳 Docker Compose로 서비스를 시작합니다...
    echo    최초 실행 시 이미지 빌드로 3~5분 소요됩니다.
    echo.

    docker compose up -d --build
    if errorlevel 1 docker-compose up -d --build

    echo.
    echo ✅ 서비스 시작 완료!
    echo.
    echo ═══════════════════════════════════════════
    echo  접속 정보
    echo ═══════════════════════════════════════════
    echo   프론트엔드:  http://localhost:5173
    echo   백엔드 API:  http://localhost:3001/api/health
    echo   MySQL:       localhost:3306
    echo.
    echo  초기 로그인 계정
    echo   이메일:   admin@wizfactory.com
    echo   비밀번호: admin1234!
    echo ═══════════════════════════════════════════
    echo.
    echo 서비스 중지: docker compose down
    echo 로그 확인:   docker compose logs -f
    goto :END
)

:: ═══════════════════════════════════════
:: 방식 2: 로컬 설치
:: ═══════════════════════════════════════
if "%INSTALL_MODE%"=="2" (
    echo.
    echo [로컬 설치 모드]

    node --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Node.js가 설치되어 있지 않습니다.
        echo    https://nodejs.org (v18 이상) 에서 설치 후 재실행하세요.
        pause
        exit /b 1
    )
    echo ✅ Node.js 확인 완료

    :: .env 파일 생성
    if not exist "backend\.env" copy "backend\.env.example" "backend\.env" > nul
    if not exist "frontend\.env" copy "frontend\.env.example" "frontend\.env" > nul
    echo ✅ 환경변수 파일 생성됨
    echo.
    echo ⚠️  backend\.env 파일에서 DB 접속 정보를 수정하세요.
    echo.

    echo 📦 백엔드 패키지 설치 중...
    cd backend
    call npm install
    cd ..
    echo ✅ 백엔드 설치 완료

    echo 📦 프론트엔드 패키지 설치 중...
    cd frontend
    call npm install
    cd ..
    echo ✅ 프론트엔드 설치 완료

    echo.
    echo ✅ 설치 완료!
    echo.
    echo ═══════════════════════════════════════════
    echo  서비스 시작 방법
    echo ═══════════════════════════════════════════
    echo.
    echo   start.bat 실행 또는 수동으로:
    echo.
    echo   터미널 1 (백엔드):
    echo     cd backend ^&^& npm run dev
    echo.
    echo   터미널 2 (프론트엔드):
    echo     cd frontend ^&^& npm run dev
    echo.
    echo  접속 정보
    echo   프론트엔드:  http://localhost:5173
    echo   백엔드 API:  http://localhost:3001/api/health
    echo.
    echo  초기 로그인 계정
    echo   이메일:   admin@wizfactory.com
    echo   비밀번호: admin1234!
    echo ═══════════════════════════════════════════
)

:END
echo.
pause
