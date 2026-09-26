#!/bin/bash

# Start script for GramWeather MVP

echo "Starting GramWeather Backend..."
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

echo "Starting GramWeather Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "GramWeather is running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop both services."

# Trap Ctrl+C (SIGINT) and SIGTERM to kill both processes
trap "echo -e '\nStopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Wait indefinitely for processes
wait $BACKEND_PID $FRONTEND_PID
