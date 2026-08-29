@echo off
echo ===================================================
echo Starting Inter-Department Document Dispatch System
echo ===================================================

:: Navigate to project directory
cd /d "%~dp0"

:: 1. Start Backend Express API Server (Port 3000)
echo [1/3] Launching Backend Server on port 3000...
start "Dispatch Backend Server (Port 3000)" cmd /k "npm run server"

:: Wait 2 seconds for backend to initialize
timeout /t 2 /nobreak >nul

:: 2. Start Frontend Vite Dev Server (Port 5173)
echo [2/3] Launching Frontend UI on port 5173...
start "Dispatch Frontend UI (Port 5173)" cmd /k "npm run dev"

:: 3. Start Ngrok Tunnel (if needed for remote/Vercel connectivity)
echo [3/3] Launching Ngrok Tunnel...
start "Dispatch Ngrok Tunnel" cmd /k "ngrok http --domain=subsector-subway-mandate.ngrok-free.dev --authtoken=3IYYImn6Er4iNIIixhRkda920Gz_7FfoYgZEpbBaEUqxUHt9r 3000"

echo.
echo All services launched!
echo - Local Web App: http://localhost:5173
echo - Backend API:   http://localhost:3000
echo - Public URL:    https://subsector-subway-mandate.ngrok-free.dev
echo ===================================================
