@echo off
TITLE PyroGuard AI - Multi-Service Orchestrator
COLOR 0A

echo ===============================================================
echo            PYROGUARD AI - STARTING PLATFORM SERVICES            
echo ===============================================================
echo.

:: Add portable node if installed in local appdata
set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%"

echo [1/3] Starting Python FastAPI ML Service on port 8000...
start "PyroGuard ML Service (Port 8000)" cmd /k "cd /d "%~dp0\.." && python -m uvicorn ml.main:app --host 127.0.0.1 --port 8000"

timeout /t 2 /nobreak >nul

echo [2/3] Starting Backend REST API Gateway on port 5000...
start "PyroGuard Backend API (Port 5000)" cmd /k "cd /d "%~dp0\..\backend" && node dist/server.js"

timeout /t 2 /nobreak >nul

echo [3/3] Starting Frontend React GIS Console on port 3000...
start "PyroGuard Frontend Console (Port 3000)" cmd /k "cd /d "%~dp0\..\frontend" && npm run dev -- --port 3000 --host"

timeout /t 2 /nobreak >nul

echo.
echo ===============================================================
echo      ALL SERVICES LAUNCHED SUCCESSFULLY!                       
echo ===============================================================
echo   - Frontend GIS Console : http://localhost:3000
echo   - Backend REST API     : http://localhost:5000
echo   - Swagger OpenAPI Docs : http://localhost:5000/api/docs
echo   - ML Inference Service : http://localhost:8000
echo ===============================================================
echo.
pause

