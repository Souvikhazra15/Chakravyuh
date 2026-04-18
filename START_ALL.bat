@echo off
REM Complete startup script for Chakravyuh with Backend and Frontend (Windows)

echo ================================
echo Chakravyuh Complete Startup
echo ================================
echo.

echo Checking ports...
netstat -ano | findstr :8000 >nul && (
    echo ⚠️  Port 8000 is already in use!
    echo Run: netstat -ano ^| findstr :8000
    echo Then: taskkill /PID ^<PID^> /F
    pause
    exit /b 1
)

echo.
echo 🚀 Starting Backend Server (Terminal 1)...
start cmd /k "cd /d d:\chakravyu\backend && npm run server"

REM Wait for backend to start
echo ⏳ Waiting for backend to start (5 seconds)...
timeout /t 5 /nobreak

echo.
echo 🎨 Starting Frontend Server (Terminal 2)...
start cmd /k "cd /d d:\chakravyu\frontend && npm run dev"

echo.
echo ================================
echo ✅ Both servers starting!
echo ================================
echo.
echo Frontend:   http://localhost:3001
echo Backend:    http://127.0.0.1:8000
echo Swagger:    http://127.0.0.1:8000/docs
echo.
echo ℹ️  Check the opened terminals for output
echo 🔐 Test Email: admin@school.com / Password: demo123
echo.
pause
