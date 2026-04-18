#!/bin/bash
# SchoolAI Backend - Quick Start (Local Development)

echo ""
echo "🚀 SchoolAI Backend Setup"
echo "=========================="
echo ""

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "✨ Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Start server
echo ""
echo "🎯 Starting SchoolAI Backend..."
echo "📍 API: http://localhost:8000"
echo "📖 Docs: http://localhost:8000/docs"
echo "🛑 Press Ctrl+C to stop"
echo ""
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
