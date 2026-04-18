#!/bin/bash
# Complete startup script for Chakravyuh with Backend and Frontend

echo "================================"
echo "Chakravyuh Complete Startup"
echo "================================"

# Start Backend
echo ""
echo "🚀 Starting Backend Server..."
cd ./backend
npm run server &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Start Frontend
echo ""
echo "🎨 Starting Frontend Development Server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "================================"
echo "✅ Both servers started!"
echo "================================"
echo ""
echo "Frontend: http://localhost:3001"
echo "Backend API: http://127.0.0.1:8000"
echo "Swagger UI: http://127.0.0.1:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
