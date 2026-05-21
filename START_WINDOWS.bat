@echo off
title EFIR - Restaurant Website
color 0A
echo.
echo  ==========================================
echo   EFIR - Food Delivery Website
echo  ==========================================
echo.
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo  ERROR: Node.js is NOT installed!
    echo  Go to: https://nodejs.org - click green LTS button
    echo  Install it, restart computer, then run this file again.
    start "" "https://nodejs.org/en/download"
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo  OK: Node.js %NODE_VER% found
echo.
cd /d "%~dp0"
if not exist "node_modules\next\package.json" (
    echo  Installing... wait 5-10 min, do NOT close!
    echo  If you see disk space error: free up space on C: drive
    echo.
    call npm install --prefer-offline --no-audit --no-fund
    if errorlevel 1 (
        color 0C
        echo.
        echo  INSTALL FAILED!
        echo  Common fix: free up disk space on C: drive (need 500MB+)
        echo  Try: Settings - Storage - Temporary files - Remove
        pause
        exit /b 1
    )
)
if not exist "data\efir.json" (
    echo  Creating database...
    call node scripts\seed.mjs
    if errorlevel 1 (
        color 0C
        echo  ERROR: Database creation failed!
        pause
        exit /b 1
    )
)
echo.
echo  ==========================================
echo   Website starting...
echo  ==========================================
echo.
echo   Site:   http://localhost:3000
echo   Admin:  http://localhost:3000/admin
echo   Login phone: +77001234567
echo   SMS code appears IN THIS WINDOW
echo.
echo   DO NOT CLOSE THIS WINDOW!
echo  ==========================================
echo.
start /b cmd /c "timeout /t 8 /nobreak >nul && start http://localhost:3000"
call npx next dev --port 3000
echo.
echo  Server stopped.
pause
