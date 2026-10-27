@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title VIGIL // OPERATIONS
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is missing. Install Node.js 18 or newer, then open this file again.
  pause
  exit /b 1
)
if not exist "bot.js" (
  echo bot.js is missing. Restore it from bot.js.backup.
  pause
  exit /b 1
)
node bot.js
if errorlevel 1 echo Vigil stopped with an error. Read the message above.
echo.
pause
