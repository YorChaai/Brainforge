@echo off
title BrainForge.AI Pro (Windows Launcher)
cd /d "%~dp0.."

:: Matikan server lama di port 8765 jika masih berjalan
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8765 ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>nul
)

where python >nul 2>nul
if %errorlevel%==0 (
  echo Menjalankan BrainForge.AI Pro di http://localhost:8765 ...
  python "%~dp0..\server.py"
) else (
  echo Python tidak ditemukan, membuka BrainForge_HP_Standalone.html langsung...
  if exist "%~dp0..\BrainForge_HP_Standalone.html" (
    start "" "%~dp0..\BrainForge_HP_Standalone.html"
  ) else (
    start "" "%~dp0..\index.html"
  )
)
