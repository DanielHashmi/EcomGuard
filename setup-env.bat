@echo off
echo ========================================
echo EcomGuard Environment Setup
echo ========================================
echo.

REM Check if .env already exists
if exist .env (
    echo .env file already exists!
    echo.
    choice /C YN /M "Do you want to overwrite it"
    if errorlevel 2 goto :end
    echo.
)

REM Prompt for Groq API key
echo Please enter your Groq API key:
echo (Get one from https://console.groq.com/)
echo.
set /p GROQ_KEY="Groq API Key: "

if "%GROQ_KEY%"=="" (
    echo Error: API key cannot be empty!
    pause
    exit /b 1
)

REM Create .env file
echo Creating .env file...
(
    echo # EcomGuard Environment Variables
    echo LLM_PROVIDER=groq
    echo MODEL_NAME=
    echo GROQ_API_KEY=%GROQ_KEY%
    echo GEMINI_API_KEY=
    echo PORT=8000
) > .env

echo.
echo ========================================
echo .env file created successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Install dependencies: uv sync
echo 2. Start backend: uv run uvicorn backend.main:app --reload
echo 3. Start mobile: cd mobile ^&^& pnpm start
echo.
echo See README.md for detailed instructions.
echo.

:end
pause
