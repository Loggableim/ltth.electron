@echo off
REM ====================================================================
REM TikTok Stream Tool - Server Startup Script
REM This script starts the Node.js server for the Electron app
REM ====================================================================

REM Set UTF-8 encoding
chcp 65001 >nul 2>&1

REM Set working directory to parent directory (where server.js is located)
cd /d "%~dp0\.."

echo ====================================================================
echo   TikTok Stream Tool - Server Starting...
echo ====================================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo Recommended: Node.js LTS Version 18 or 20
    echo.
    pause
    exit /b 1
)

REM Display Node.js version
echo [INFO] Node.js version:
node --version
echo.

REM Check if package.json exists
if not exist "package.json" (
    echo [ERROR] package.json not found!
    echo Expected location: %CD%\package.json
    echo.
    pause
    exit /b 1
)

REM Check if server.js exists
if not exist "server.js" (
    echo [ERROR] server.js not found!
    echo Expected location: %CD%\server.js
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [WARN] node_modules not found. Running npm install...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
    echo.
)

REM Start the server
echo [INFO] Starting server from: %CD%
echo.

REM Start server.js directly (not launch.js) to avoid auto-browser-opening
REM Set OPEN_BROWSER=false to prevent server from opening browser (Electron will handle UI)
set OPEN_BROWSER=false
node server.js

REM If server exits, show exit code
echo.
echo [INFO] Server stopped with exit code: %ERRORLEVEL%
echo.

REM Don't pause here - let Electron handle the exit
exit /b %ERRORLEVEL%
