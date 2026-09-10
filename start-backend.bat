@echo off
echo ========================================
echo   EcomGuard Backend Startup
echo ========================================
echo.

cd /d "%~dp0"

echo Checking Python version...
python --version
if errorlevel 1 (
    echo ERROR: Python not found! Please install Python 3.11+
    pause
    exit /b 1
)

echo.
echo Starting FastAPI backend...
echo Backend will run on http://localhost:8000
echo API docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

REM Run from the project root so the `backend` package imports resolve.
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

pause
