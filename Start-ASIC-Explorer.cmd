@echo off
cd /d "%~dp0"
powershell -NoProfile -Command "try { $taskResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:4175' -UseBasicParsing -TimeoutSec 2; if ($taskResponse.StatusCode -eq 200) { exit 0 } } catch {} exit 1" >nul 2>&1
if not errorlevel 1 (
  start "" "http://127.0.0.1:4175"
  exit /b 0
)
if not exist node_modules\next\package.json (
  echo Installing the lecture app dependencies...
  call npm ci
  if errorlevel 1 exit /b 1
)
if not exist .next\BUILD_ID (
  echo Preparing the lecture app...
  call npm run build
  if errorlevel 1 exit /b 1
)
echo Open http://127.0.0.1:4175 and keep this window running.
start "" "http://127.0.0.1:4175"
call npm start
