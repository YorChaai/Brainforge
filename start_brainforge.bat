@echo off
title BrainForge.AI Pro - Auto-Paste Server
cd /d "%~dp0"

:: Matikan server lama di port 8765 jika masih berjalan
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8765 ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>nul
)

where python >nul 2>nul
if %errorlevel%==0 (
  python "%~dp0server.py"
) else (
  echo Python tidak ditemukan, membuka index.html secara langsung...
  start "" "%~dp0index.html"
)
