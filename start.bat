@echo off
echo.
echo ================================================
echo  Starting CalyAI - Your Smart AI Calendar
echo ================================================
echo.

cd /d "%~dp0"

echo [*] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found! Please install Python 3.10 or later.
    pause
    exit /b 1
)

echo [OK] Python found
echo.

echo [*] Installing dependencies...
python -m pip install -q -r requirements.txt
echo [OK] Dependencies ready
echo.

echo [*] Starting Flask server...
echo.
echo ================================================
echo  CalyAI will open at: http://localhost:5000
echo  Press Ctrl+C to stop the server
echo ================================================
echo.

python server.py

pause
