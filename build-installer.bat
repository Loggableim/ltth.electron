@echo off
REM ===============================================
REM Pup Cid´s Little Tiktok Helper - Windows Installer Builder
REM ===============================================
REM Automatisierter Build-Prozess für Electron App mit Windows Setup.exe
REM Keine manuellen Eingaben erforderlich - Doppelklick zum Starten
REM ===============================================

setlocal enabledelayedexpansion

REM UTF-8 Codepage setzen
chcp 65001 >nul 2>&1

echo.
echo ===============================================
echo   Pup Cid´s Little Tiktok Helper - Installer Build
echo ===============================================
echo.
echo Starte automatischen Build-Prozess...
echo.

REM ===============================================
REM SCHRITT 1: Node.js Überprüfung
REM ===============================================
echo [1/8] Pruefe Node.js Installation...

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo FEHLER: Node.js ist nicht installiert!
    echo Bitte installiere Node.js von: https://nodejs.org
    echo Empfohlen: Node.js LTS Version 18 oder 20
    echo.
    echo FEHLER: Node.js nicht gefunden > build-error.log
    pause
    exit /b 1
)

REM Node.js Version anzeigen
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo   OK - Node.js !NODE_VERSION! gefunden
echo.

REM ===============================================
REM SCHRITT 2: npm Überprüfung
REM ===============================================
echo [2/8] Pruefe npm Installation...

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo FEHLER: npm ist nicht installiert!
    echo npm sollte mit Node.js installiert worden sein.
    echo Bitte Node.js neu installieren von: https://nodejs.org
    echo.
    echo FEHLER: npm nicht gefunden > build-error.log
    pause
    exit /b 1
)

REM npm Version anzeigen
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo   OK - npm !NPM_VERSION! gefunden
echo.

REM ===============================================
REM SCHRITT 3: electron-builder Überprüfung/Installation
REM ===============================================
echo [3/8] Pruefe electron-builder Installation...

REM Prüfe ob electron-builder in node_modules existiert
if exist "node_modules\electron-builder" (
    echo   OK - electron-builder bereits installiert
    echo.
) else (
    echo   electron-builder nicht gefunden - wird installiert...
    echo.
    
    call npm install --save-dev electron-builder 2>build-error.log
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo FEHLER: electron-builder Installation fehlgeschlagen!
        echo Details siehe build-error.log
        echo.
        pause
        exit /b 1
    )
    
    echo   OK - electron-builder erfolgreich installiert
    echo.
)

REM ===============================================
REM SCHRITT 4: Dependencies installieren
REM ===============================================
echo [4/8] Installiere Projekt-Dependencies...
echo   Dies kann einige Minuten dauern...
echo.

call npm install 2>build-error.log

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo FEHLER: npm install fehlgeschlagen!
    echo Details siehe build-error.log
    echo.
    pause
    exit /b 1
)

echo   OK - Dependencies installiert
echo.

REM ===============================================
REM SCHRITT 5: Alte Builds bereinigen
REM ===============================================
echo [5/8] Bereinige alte Builds...

REM Lösche dist Ordner falls vorhanden
if exist "dist" (
    echo   Loesche dist Ordner...
    rmdir /s /q dist 2>nul
)

REM Lösche build Ordner falls vorhanden
if exist "build" (
    echo   Loesche build Ordner...
    rmdir /s /q build 2>nul
)

echo   OK - Alte Builds entfernt
echo.

REM ===============================================
REM SCHRITT 6: App-Bundle bauen (npm run build)
REM ===============================================
echo [6/8] Baue Electron App-Bundle...
echo   Fuehre npm run build aus...
echo.

call npm run build 2>build-error.log

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo FEHLER: npm run build fehlgeschlagen!
    echo Details siehe build-error.log
    echo.
    pause
    exit /b 1
)

echo   OK - App-Bundle erfolgreich gebaut
echo.

REM ===============================================
REM SCHRITT 7: electron-builder Config prüfen/erstellen
REM ===============================================
echo [7/8] Pruefe electron-builder Konfiguration...

REM Prüfe ob electron-builder.yml oder electron-builder.json existiert
if exist "electron-builder.yml" (
    echo   OK - electron-builder.yml gefunden
    echo.
) else if exist "electron-builder.json" (
    echo   OK - electron-builder.json gefunden
    echo.
) else (
    echo   Keine Config gefunden - erstelle electron-builder.yml...
    echo.
    
    REM Erstelle Standard electron-builder.yml Konfiguration
    (
        echo appId: com.pupcid.littletiktokhelper.app
        echo productName: Pup Cid´s Little Tiktok Helper
        echo directories:
        echo   output: dist
        echo win:
        echo   target: nsis
        echo   icon: public/favicon.ico
        echo nsis:
        echo   oneClick: false
        echo   allowToChangeInstallationDirectory: true
        echo   createDesktopShortcut: true
        echo   createStartMenuShortcut: true
        echo files:
        echo   - "**/*"
        echo   - "!**/*.md"
        echo   - "!.git"
        echo   - "!.github"
        echo   - "!node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}"
        echo   - "!node_modules/*/{test,__tests__,tests,powered-test,example,examples}"
        echo   - "!node_modules/*.d.ts"
        echo   - "!node_modules/.bin"
        echo   - "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}"
        echo   - "!.editorconfig"
        echo   - "!**/._*"
        echo   - "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}"
        echo   - "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}"
        echo   - "!**/{appveyor.yml,.travis.yml,circle.yml}"
        echo   - "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}"
    ) > electron-builder.yml
    
    echo   OK - electron-builder.yml erstellt
    echo.
)

REM ===============================================
REM SCHRITT 8: Windows Setup.exe erstellen
REM ===============================================
echo [8/8] Erstelle Windows Setup.exe mit electron-builder...
echo   Dies kann mehrere Minuten dauern...
echo.

REM Prüfe ob main Electron file existiert, falls nicht verwende server.js
if not exist "main.js" (
    if not exist "electron.js" (
        echo   Erstelle main.js Wrapper fuer Electron...
        (
            echo const { app, BrowserWindow } = require('electron'^);
            echo const path = require('path'^);
            echo const { spawn } = require('child_process'^);
            echo.
            echo let serverProcess;
            echo let mainWindow;
            echo.
            echo function createWindow(^) {
            echo   mainWindow = new BrowserWindow({
            echo     width: 1200,
            echo     height: 800,
            echo     webPreferences: {
            echo       nodeIntegration: false,
            echo       contextIsolation: true
            echo     }
            echo   }^);
            echo.
            echo   // Starte Node.js Server
            echo   serverProcess = spawn('node', [path.join(__dirname, 'server.js'^)], {
            echo     stdio: 'inherit'
            echo   }^);
            echo.
            echo   // Warte kurz bis Server startet
            echo   setTimeout((^) =^> {
            echo     mainWindow.loadURL('http://localhost:3000'^);
            echo   }, 3000^);
            echo.
            echo   mainWindow.on('closed', (^) =^> {
            echo     mainWindow = null;
            echo   }^);
            echo }
            echo.
            echo app.whenReady(^).then(createWindow^);
            echo.
            echo app.on('window-all-closed', (^) =^> {
            echo   if (serverProcess^) {
            echo     serverProcess.kill(^);
            echo   }
            echo   if (process.platform !== 'darwin'^) {
            echo     app.quit(^);
            echo   }
            echo }^);
            echo.
            echo app.on('activate', (^) =^> {
            echo   if (BrowserWindow.getAllWindows(^).length === 0^) {
            echo     createWindow(^);
            echo   }
            echo }^);
        ) > main.js
        echo   OK - main.js erstellt
        echo.
    )
)

REM Aktualisiere package.json um main Feld zu setzen falls nicht vorhanden
findstr /C:"\"main\"" package.json >nul
if %ERRORLEVEL% NEQ 0 (
    echo   Warnung: package.json hat kein main Feld
)

REM Führe electron-builder aus
call npx electron-builder --win --x64 2>build-error.log

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ===============================================
    echo   FEHLER: Installer-Build fehlgeschlagen!
    echo ===============================================
    echo.
    echo Details siehe build-error.log
    echo.
    type build-error.log
    echo.
    pause
    exit /b 1
)

echo.
echo ===============================================
echo   Installer erfolgreich erstellt!
echo ===============================================
echo.
echo Die Setup.exe befindet sich im dist Ordner:
echo.

REM Zeige erstellte Dateien im dist Ordner
if exist "dist" (
    dir /b dist\*.exe 2>nul
    echo.
    echo Vollstaendiger Pfad:
    echo %CD%\dist\
)

echo.
echo Build-Prozess erfolgreich abgeschlossen!
echo.

REM Öffne dist Ordner im Explorer
if exist "dist" (
    echo Oeffne dist Ordner...
    start explorer "%CD%\dist"
)

echo.
pause
exit /b 0
