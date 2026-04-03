@echo off
chcp 65001 > nul
title MOM 수준진단 시스템 — 종료

echo.
echo MOM 수준진단 시스템 — 서비스 종료
echo.

docker compose down 2>nul || docker-compose down 2>nul

taskkill /f /im node.exe 2>nul

echo 완료!
echo.
pause
