@echo off
echo Starting Local SSD Dispatch Tunnel...
cloudflared tunnel --url http://localhost:3000
pause
