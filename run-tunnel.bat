@echo off
cd /d "%~dp0"
start "Document Dispatch Backend (Port 3000)" cmd /k "npm run server"
timeout /t 2 /nobreak >nul
start "Document Dispatch Frontend (Port 5173)" cmd /k "npm run dev"
start "Document Dispatch Ngrok Tunnel" cmd /k "ngrok http --domain=subsector-subway-mandate.ngrok-free.dev --authtoken=3IYYImn6Er4iNIIixhRkda920Gz_7FfoYgZEpbBaEUqxUHt9r 3000"