@echo off
chcp 65001 >nul
echo Зупиняю сайт і магазин...
taskkill /fi "WINDOWTITLE eq Trafaret Line - сайт*" /t /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq Trafaret Line - магазин*" /t /f >nul 2>&1
"D:\tl-dev\pgsql\bin\pg_ctl.exe" -D "D:\tl-dev\pgdata" stop >nul 2>&1
echo Готово.
timeout /t 3 >nul