@echo off
REM SchoolAI Backend - Quick Start (Local Development)

echo.
echo 🚀 SchoolAI Backend Setup
echo ==========================
echo.

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo ✨ Activating virtual environment...
call venv\Scripts\activate.bat

REM Install requirements
echo 📚 Installing dependencies...
pip install -r requirements.txt

REM Start server
echo.
echo 🎯 Starting SchoolAI Backend...
echo 📍 API: http://localhost:8000
echo 📖 Docs: http://localhost:8000/docs
echo 🛑 Press Ctrl+C to stop
echo.
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
