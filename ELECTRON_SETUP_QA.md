# Electron Setup - Questions & Answers

This document answers the questions from the initial requirements to help you get started.

---

## Question 1: What Electron version did you install?

**Answer:** Electron version **28.0.0** (latest stable)

This is specified in `package.json`:
```json
"devDependencies": {
  "electron": "^28.0.0",
  "electron-builder": "^24.9.1"
}
```

**Why 28.0.0?**
- Latest stable version as of November 2024
- Uses Chromium 120 (modern browser features)
- Compatible with Node.js 20.x
- Good balance of features and stability

**To verify after installation:**
```bash
npm list electron
# Should show: electron@28.0.0

# Or check at runtime:
npm start
# Console will show: Electron version: 28.x.x
```

---

## Question 2: What port does your server use?

**Answer:** Port **3000** (default, configurable)

**Where it's configured:**
- `server.js` line 2442: `const PORT = process.env.PORT || 3000;`
- `main.js` line 20: `const SERVER_PORT = process.env.PORT || 3000;`

**How to change it:**

### Option 1: Environment Variable (Temporary)
```bash
# PowerShell
$env:PORT=3001
npm start

# Command Prompt
set PORT=3001
npm start
```

### Option 2: Edit main.js (Permanent)
```javascript
// Line 20 in main.js
const SERVER_PORT = 3001; // Changed from 3000
```

**Important:** Both `main.js` and the server need to use the same port!

**Check if port is available:**
```bash
# Windows
netstat -ano | findstr :3000

# If output is shown, port is in use
# If no output, port is free
```

---

## Question 3: Do you want auto-restart on crash?

**Answer:** Currently **NO** (intentional design decision)

**Why not by default?**
- Prevents infinite restart loops if there's a persistent error
- Allows you to see what went wrong
- More predictable behavior
- User can manually restart the app

**Current behavior when server crashes:**
```
Server process exited with code 1 and signal null
Server crashed unexpectedly!
```

The Electron window will remain open but show connection errors. User must close and restart the app.

---

## How to ENABLE auto-restart (if you want it)

If you want the server to automatically restart when it crashes, follow these steps:

### Step 1: Edit main.js

Find this code (around line 185):
```javascript
serverProcess.on('exit', (code, signal) => {
    console.log(`Server process exited with code ${code} and signal ${signal}`);
    if (!isQuitting) {
        // Server crashed unexpectedly
        console.error('Server crashed unexpectedly!');
        // Optionally restart the server or show an error dialog
    }
});
```

Replace it with:
```javascript
let restartAttempts = 0;
const MAX_RESTART_ATTEMPTS = 3;
const RESTART_DELAY = 3000; // 3 seconds

serverProcess.on('exit', (code, signal) => {
    console.log(`Server process exited with code ${code} and signal ${signal}`);
    
    if (!isQuitting && code !== 0) {
        // Server crashed
        restartAttempts++;
        
        if (restartAttempts <= MAX_RESTART_ATTEMPTS) {
            console.log(`Server crashed! Attempting restart ${restartAttempts}/${MAX_RESTART_ATTEMPTS} in ${RESTART_DELAY/1000}s...`);
            
            setTimeout(async () => {
                try {
                    await startServer();
                    await waitForServer();
                    console.log('✓ Server restarted successfully');
                    restartAttempts = 0; // Reset counter on success
                } catch (error) {
                    console.error(`Failed to restart server: ${error.message}`);
                }
            }, RESTART_DELAY);
        } else {
            console.error('Max restart attempts reached. Please restart the app manually.');
            // Optionally show a dialog to the user
        }
    }
});
```

### Step 2: Add restart variables to the top of main.js

Add these lines near the top (after other variable declarations):
```javascript
// Auto-restart configuration
let restartAttempts = 0;
const MAX_RESTART_ATTEMPTS = 3;
const RESTART_DELAY = 3000; // 3 seconds
```

### Step 3: Test it

1. Start the app: `npm start`
2. Simulate a crash by killing the server process
3. Watch the console - should see restart attempts
4. After 3 failed attempts, stops trying

**Recommended settings:**
- `MAX_RESTART_ATTEMPTS`: 3 (prevents infinite loops)
- `RESTART_DELAY`: 3000ms (gives time to see errors)

---

## Additional Configuration Options

### Enable Developer Tools

To see Chromium DevTools in the Electron window:

Edit `main.js`, find this code (around line 69):
```javascript
// Open DevTools in development (optional)
if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
}
```

Then run with:
```bash
set NODE_ENV=development
npm start
```

DevTools will open automatically.

### Change Window Size

Edit `main.js`, find `createWindow()` function:
```javascript
mainWindow = new BrowserWindow({
    width: 1400,        // Change width
    height: 900,        // Change height
    minWidth: 1024,     // Minimum width
    minHeight: 768,     // Minimum height
    // ...
});
```

### Change Server Startup Timeout

Edit `main.js`, find:
```javascript
const MAX_STARTUP_WAIT = 60000; // 60 seconds
```

Change to desired value in milliseconds:
```javascript
const MAX_STARTUP_WAIT = 120000; // 120 seconds for slow machines
```

### Hide Server Console Window

Edit `main.js`, find `startServer()` function:
```javascript
serverProcess = spawn('cmd.exe', ['/c', batchFile], {
    cwd: serverRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,  // Change to true to hide console
    detached: false
});
```

Change `windowsHide: false` to `windowsHide: true`.

**Note:** This will hide the console window but server output will still be logged to the Electron console (with `[Server]` prefix).

---

## Quick Reference

| Configuration | Location | Default | How to Change |
|--------------|----------|---------|---------------|
| Electron Version | package.json | 28.0.0 | `npm install electron@<version>` |
| Server Port | main.js line 20 | 3000 | Edit or set PORT env var |
| Auto-Restart | main.js line 185 | Disabled | Add restart logic (see above) |
| Window Size | main.js line 32-33 | 1400x900 | Edit BrowserWindow options |
| Startup Timeout | main.js line 18 | 60s | Edit MAX_STARTUP_WAIT |
| DevTools | main.js line 69 | Development only | Set NODE_ENV=development |
| Console Window | main.js line 155 | Visible | Set windowsHide: true |

---

## Next Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the app:**
   ```bash
   npm start
   ```

3. **Test features:**
   - TikTok connection
   - OBS overlay
   - TTS
   - Soundboard

4. **Build distribution:**
   ```bash
   npm run build
   ```

5. **Test installer:**
   ```bash
   cd dist
   "TikTok Stream Tool Setup 1.0.3.exe"
   ```

---

## Support

For more information:
- **ELECTRON_README.md**: Detailed architecture and development guide
- **QUICK_START_ELECTRON.md**: Quick start for users
- **ELECTRON_TROUBLESHOOTING.md**: Common issues and solutions
- **IMPLEMENTATION_SUMMARY.md**: Complete implementation details

**Questions?** Email: [loggableim@gmail.com](mailto:loggableim@gmail.com)

---

**Last Updated:** 2024-11-20
