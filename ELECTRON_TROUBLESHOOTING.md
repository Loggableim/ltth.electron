# Electron App - Potential Issues & Solutions

This document lists potential issues that may occur with the Electron desktop app and their solutions.

## Issue Detection Guide

### 1. Port Conflicts

**Symptom:** "Server failed to start" or "EADDRINUSE" error

**Detection:**
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000
```

**Solutions:**
- Kill the process using the port:
  ```bash
  # Find PID from netstat output, then:
  taskkill /PID <PID> /F
  ```
- Change the server port in `main.js`:
  ```javascript
  const SERVER_PORT = 3001; // Changed from 3000
  ```

### 2. Missing Dependencies

**Symptom:** Server crashes immediately or import errors in console

**Detection:**
- Check if `node_modules` exists
- Look for "Cannot find module" errors in logs

**Solutions:**
```bash
# Delete and reinstall dependencies
rmdir /s /q node_modules
del package-lock.json
npm install
```

### 3. CORS Issues

**Symptom:** Overlay not loading, API calls failing with CORS errors

**Detection:**
- Open browser DevTools (F12)
- Look for "CORS policy" errors in console

**Solution:**
The server already has CORS configured for localhost. If you're accessing from a different origin, update `server.js` CORS settings:

```javascript
const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8080',  // Add your origin
    'null'  // For file:// and OBS BrowserSource
];
```

### 4. Puppeteer/Chromium Missing

**Symptom:** "Chromium revision not found" errors

**Detection:**
```bash
# Check if puppeteer downloaded Chromium
dir node_modules\puppeteer\.local-chromium
```

**Solutions:**
```bash
# Force puppeteer to download Chromium
set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
npm install puppeteer --force

# Or use system Chrome
set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
set PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

### 5. Better-SQLite3 ABI Mismatch

**Symptom:** "The module was compiled against a different Node.js version"

**Detection:**
- Error mentions "NODE_MODULE_VERSION" mismatch
- Error occurs when server.js tries to load better-sqlite3

**THIS SHOULD NOT HAPPEN** with our architecture because:
- Server runs with system Node.js, not Electron's Node.js
- better-sqlite3 is only loaded by server.js

**If it does happen:**
```bash
# Rebuild better-sqlite3 for system Node.js
npm rebuild better-sqlite3

# Or reinstall
npm uninstall better-sqlite3
npm install better-sqlite3
```

**CRITICAL:** Never run `npm rebuild` inside Electron. This would break the module!

### 6. Missing Folders on First Run

**Symptom:** "ENOENT: no such file or directory" errors for user_configs, user_data, uploads, etc.

**Detection:**
- Check error message for missing path
- Verify folders exist in project root

**Solutions:**
The server should auto-create these folders. If not:

```bash
# Create required directories
mkdir user_configs
mkdir user_data
mkdir uploads
mkdir logs
mkdir data
```

Or let the server create them on first run (they're created in `server.js`).

### 7. Electron Window Shows Blank Page

**Symptom:** Electron opens but shows white/blank window

**Detection:**
1. Open DevTools (F12)
2. Check Console tab for errors
3. Check Network tab - is it trying to load from localhost:3000?

**Possible Causes:**
- Server not started yet (wait 10-15 seconds)
- Server failed to start (check server console window)
- Wrong URL in main.js (should be http://localhost:3000/dashboard.html)
- Port conflict (server couldn't bind to port 3000)

**Solutions:**
```bash
# Check if server is accessible
# Open in regular browser:
start http://localhost:3000/dashboard.html

# If that works, issue is in Electron code
# If that fails, issue is in server startup
```

### 8. Server Console Window Closes Immediately

**Symptom:** Black console window appears and disappears

**Detection:**
- Edit `app/start-server.bat`
- Add `pause` before `exit /b %ERRORLEVEL%`
- Re-run to see error message

**Common Causes:**
- Node.js not in PATH
- Missing package.json or server.js
- Syntax error in server.js

**Solutions:**
```bash
# Test batch file manually
cd app
start-server.bat

# Should stay open and show server output
```

### 9. Auto-Update Issues

**Symptom:** Can't check for updates or update fails

**Detection:**
- Check Dashboard → Settings → Check for Updates
- Look for network errors in console

**Solutions:**
- Ensure internet connection
- Check GitHub API is accessible
- Verify repository URL in `modules/update-checker.js`

### 10. Build Fails

**Symptom:** `npm run build` fails with errors

**Common Causes:**

**A) Icon file missing:**
```
Error: ENOENT: no such file or directory, open 'build/icon.ico'
```
**Solution:** Either create the icon or remove icon references from package.json

**B) Node version too new/old:**
```
Error: The engine "node" is incompatible
```
**Solution:** Use Node.js 18.x or 20.x
```bash
node --version
# Should show v18.x or v20.x
```

**C) Out of disk space:**
```
Error: ENOSPC: no space left on device
```
**Solution:** Free up disk space (builds can be 200-500 MB)

**D) Native module rebuild fails:**
```
Error: gyp ERR!
```
**Solution:** This shouldn't happen with our architecture. If it does:
```bash
# Check which module is failing
npm install --verbose

# Skip optional dependencies if needed
npm install --no-optional
```

---

## Prevention Checklist

Before running the Electron app:

- [ ] Node.js 18.x - 20.x installed
- [ ] `npm install` completed successfully
- [ ] Port 3000 is available
- [ ] `.env` file created (copy from `.env.example`)
- [ ] Eulerstream API key configured
- [ ] No other instance of the server running

Before building:

- [ ] Node.js 18.x or 20.x
- [ ] All dependencies installed
- [ ] At least 1 GB free disk space
- [ ] No pending changes that would break the app
- [ ] Tested with `npm start` first

---

## Debugging Steps

### Step 1: Verify Server Works Standalone

```bash
# Run server directly (without Electron)
node server.js

# Open in browser
start http://localhost:3000/dashboard.html

# Should load correctly
```

### Step 2: Check Batch File Works

```bash
# Test batch file manually
cd app
start-server.bat

# Should show server logs
# Press Ctrl+C to stop
```

### Step 3: Check Electron Main Process

```bash
# Run Electron with logging
set NODE_ENV=development
npm run dev

# Look for errors in the terminal
# Look for [Server] logs showing server output
```

### Step 4: Check Browser Console

1. Run `npm start`
2. Wait for window to open
3. Press F12 to open DevTools
4. Check Console tab for errors
5. Check Network tab - are resources loading?

### Step 5: Check Server Console

The server console window should be visible when Electron starts.

If you don't see it:
- Edit `main.js`
- Change `windowsHide: false` to `windowsHide: false` (it's already false)
- The console window should appear

---

## Emergency Fixes

### Nuclear Option 1: Clean Reinstall

```bash
# Delete everything that can be regenerated
rmdir /s /q node_modules
rmdir /s /q dist
del package-lock.json

# Reinstall
npm install

# Test
npm start
```

### Nuclear Option 2: Reset User Data

```bash
# CAUTION: This deletes all your settings and databases!
rmdir /s /q user_configs
rmdir /s /q user_data
rmdir /s /q logs

# Restart app - will create fresh configs
npm start
```

### Nuclear Option 3: Fresh Clone

```bash
# Clone to a new directory
cd ..
git clone https://github.com/Loggableim/ltth.electron.git ltth-fresh
cd ltth-fresh
npm install
npm start
```

---

## Getting Help

If none of these solutions work:

1. **Collect diagnostics:**
   ```bash
   # Get versions
   node --version > diagnostics.txt
   npm --version >> diagnostics.txt
   
   # Get logs
   type logs\server.log >> diagnostics.txt
   
   # Get error output
   npm start > output.txt 2>&1
   ```

2. **Open a GitHub Issue** with:
   - Your diagnostics.txt
   - Your output.txt
   - Steps to reproduce
   - What you've already tried

3. **Email support:**
   - [loggableim@gmail.com](mailto:loggableim@gmail.com)
   - Include diagnostics and detailed description

---

**Last Updated:** 2024-11-20
