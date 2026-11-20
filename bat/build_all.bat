@echo off
cd /d "%~dp0.."
echo ==========================================
echo 1. SINKRONISASI BUNDLE HTML STANDALONE
echo ==========================================
call python build_standalone.py
echo.

echo ==========================================
echo 2. MEMBANGUN APLIKASI ANDROID (.apk)
echo ==========================================
cd /d "%~dp0..\mobile_app"
call flutter build apk --release
echo.

echo ==========================================
echo PROSES BUILD SELESAI!
echo ==========================================
echo File Android (.apk) tersimpan di:
echo mobile_app\build\app\outputs\flutter-apk\app-release.apk
echo.
echo File Web Standalone tersimpan di:
echo BrainForge_HP_Standalone.html
echo ==========================================
pause
