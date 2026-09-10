@echo off
echo ========================================
echo   EcomGuard Mobile App Startup
echo ========================================
echo.

cd /d "%~dp0"

echo Checking Node.js version...
node --version
if errorlevel 1 (
    echo ERROR: Node.js not found! Please install Node.js 18+
    pause
    exit /b 1
)

echo.
echo Starting Expo development server...
echo.
echo Choose your platform:
echo   - Press 'w' for Web
echo   - Press 'a' for Android
echo   - Press 'i' for iOS
echo   - Scan QR code with Expo Go app
echo.
echo Press Ctrl+C to stop the server
echo.

cd mobile
pnpm start

pause
