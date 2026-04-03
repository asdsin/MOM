@echo off
chcp 65001 > nul
title MOM 수준진단 시스템

echo.
echo MOM 수준진단 시스템 시작 중...
echo.

:: Docker 모드 확인
docker --version >nul 2>&1
if not errorlevel 1 (
    docker compose up -d >nul 2>&1
    if not errorlevel 1 (
        echo ✅ Docker 서비스 시작됨
        echo.
        echo   프론트엔드: http://localhost:5173
        echo   백엔드 API: http://localhost:3001
        echo.
        start "" "http://localhost:5173"
        pause
        exit /b 0
    )
)

:: 로컬 모드
if not exist "backend\node_modules" (
    echo ❌ 패키지가 설치되지 않았습니다. install.bat를 먼저 실행하세요.
    pause
    exit /b 1
)

echo 백엔드 시작 중...
start "MOM Backend" cmd /k "cd backend && npm run dev"

echo 프론트엔드 시작 중...
start "MOM Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 3 > nul
echo.
echo ✅ 서비스 시작됨
echo   프론트엔드: http://localhost:5173
echo   백엔드 API: http://localhost:3001
echo.
start "" "http://localhost:5173"
pause
