@echo off
chcp 65001 >nul
cd /d "%~dp0"
rem Node.js of the site folder (..\.tools\node), nothing is installed in Windows.
if exist "%~dp0..\.tools\node\node.exe" set "PATH=%~dp0..\.tools\node;%PATH%"
if not exist ".env" (
  echo No .env file. Copy .env.example to .env and fill TELEGRAM_BOT_TOKEN.
  pause
  exit /b 1
)
if not exist "node_modules" (
  call npm install --no-audit --no-fund || goto :err
)
call npm run build || goto :err
node build\src\index.js
pause
exit /b 0
:err
echo Build failed, see messages above.
pause
exit /b 1
