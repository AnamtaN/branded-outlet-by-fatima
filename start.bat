@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installing backend packages...
  npm install
)
echo Starting Branded Outlet by Fatima...
node server.js
pause
