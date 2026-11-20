@echo off
cd /d "%~dp0.."
echo ==========================================
echo BRAINFORGE.AI PRO - PILIH PLATFORM
echo ==========================================
echo 1. Windows (Browser + Auto-Paste Server)
echo 2. Windows Standalone (HTML Offline)
echo 3. Android (Flutter Run ke HP/Emulator)
echo 4. Web Flutter (Chrome)
echo ==========================================
set "platform="
set /p platform="Masukkan pilihan Anda (1/2/3/4): "

if "%platform%"=="1" goto RUN_WIN
if "%platform%"=="2" goto RUN_HTML
if "%platform%"=="3" goto RUN_ANDROID
if "%platform%"=="4" goto RUN_WEB
echo.
echo Pilihan tidak valid!
goto END

:RUN_WIN
echo.
echo Menjalankan BrainForge.AI Pro di Windows...
call "%~dp0forge.ai.bat"
goto END

:RUN_HTML
echo.
echo Membuka BrainForge_HP_Standalone.html...
start "" "%~dp0..\BrainForge_HP_Standalone.html"
goto END

:RUN_ANDROID
echo.
echo Menjalankan Flutter Android di mobile_app...
cd /d "%~dp0..\mobile_app"
call flutter run
goto END

:RUN_WEB
echo.
echo Menjalankan Flutter Web di mobile_app...
cd /d "%~dp0..\mobile_app"
call flutter run -d chrome
goto END

:END
echo.
pause
