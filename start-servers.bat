@echo off
echo Starting Lifeverse dev servers...
cd /d "%~dp0"

start "Lifeverse Server :4000" cmd /k "npm run dev:server"
timeout /t 2 /nobreak >nul
start "Lifeverse Client :5173" cmd /k "npm run dev:client"

echo.
echo Server  -> http://localhost:4000
echo Client  -> http://localhost:5173
echo.
echo Both servers are starting in separate windows.
