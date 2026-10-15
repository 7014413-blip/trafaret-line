@echo off
chcp 65001 >nul
title Trafaret Line - запуск
set "SITE=%~dp0"
set "PATH=%SITE%.tools\node;%PATH%"
set MEDUSA_DISABLE_TELEMETRY=true
set NEXT_TELEMETRY_DISABLED=1

echo 1/3 База даних...
"D:\tl-dev\pgsql\bin\pg_isready.exe" -p 5433 -h localhost >nul 2>&1
if errorlevel 1 "D:\tl-dev\pgsql\bin\pg_ctl.exe" -D "D:\tl-dev\pgdata" -l "D:\tl-dev\server.log" start >nul

echo 2/3 Магазин (Medusa) - окреме вікно, перший запуск 2-3 хвилини...
start "Trafaret Line - магазин" /min /d "%SITE%backend" cmd /k npm run dev

echo 3/3 Сайт...
if not exist "%SITE%web\.next\BUILD_ID" (
  echo Перша збірка сайту, зачекайте 3-5 хвилин...
  pushd "%SITE%web" && call npx next build && popd
)
start "Trafaret Line - сайт" /min /d "%SITE%web" cmd /k npx next start -p 3100

echo Чекаємо, поки все запуститься...
timeout /t 25 /nobreak >nul
start "" "http://localhost:3100"
echo.
echo Сайт: http://localhost:3100
echo Адмінка магазину: http://localhost:9000/app  (відкриється через 2-3 хвилини)
echo Щоб зупинити - запустіть "Зупинити сайт.bat".
pause