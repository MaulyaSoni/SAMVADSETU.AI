@echo off
REM Start the ASL Model API Server

echo.
echo ============================================
echo ASL Model API Server Startup
echo ============================================
echo.

REM Activate the conda environment
echo [INFO] Activating asl310 environment...
call conda activate asl310

REM Check if required packages are installed
echo [INFO] Checking dependencies...
pip show flask flask-cors tensorflow > nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing required packages...
    pip install flask flask-cors tensorflow pillow opencv-python
)

REM Start the API server
echo.
echo [INFO] Starting ASL Model API Server on http://localhost:5000
echo [INFO] Models will be loaded automatically...
echo.
python "%~dp0model_api_server.py"

if errorlevel 1 (
    echo.
    echo [ERROR] Server failed to start!
    echo.
    pause
    exit /b 1
)
