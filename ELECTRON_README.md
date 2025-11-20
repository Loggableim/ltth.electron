# TikTok Stream Tool - Electron Desktop Application

This is the Windows Desktop Application version of Pup Cid's Little TikTok Helper, built with Electron.

## Architecture

This application follows a **hybrid architecture** to avoid native module compatibility issues:

```
┌─────────────────────────────────────┐
│     Electron Main Process           │
│  (main.js - Node ABI v120)          │
│                                     │
│  • Spawns external server           │
│  • Manages window lifecycle         │
│  • No better-sqlite3 dependencies   │
└─────────────────────────────────────┘
          │
          │ spawn via child_process
          ▼
┌─────────────────────────────────────┐
│   External Node.js Server           │
│  (server.js - System Node.js)       │
│                                     │
│  • better-sqlite3 ✓                 │
│  • Express server on port 3000      │
│  • All business logic               │
└─────────────────────────────────────┘
          │
          │ http://localhost:3000
          ▼
┌─────────────────────────────────────┐
│   Electron Renderer (BrowserWindow) │
│                                     │
│  • Loads dashboard from localhost   │
│  • No Node.js integration           │
│  • Standard web browser context     │
└─────────────────────────────────────┘
```

### Why This Architecture?

1. **Avoids ABI Conflicts**: Electron uses a different Node.js ABI (Application Binary Interface) than system Node.js. Native modules like `better-sqlite3` compiled for system Node.js will not work in Electron without recompilation.

2. **No Rebuild Headaches**: By running the server externally with system Node.js, we use the existing native modules without any rebuilding.

3. **Clean Separation**: The Electron app is purely a UI wrapper. All the complex logic stays in the battle-tested Node.js server.

4. **Easy Updates**: Server updates don't require Electron rebuild.

## Installation

### Prerequisites

- **Node.js 18.0.0 or higher** (but less than 24.0.0)
- **Windows 10 or 11**
- **npm** (comes with Node.js)

### Setup for Development

```bash
# Clone the repository
git clone https://github.com/Loggableim/ltth.electron.git
cd ltth.electron

# Install all dependencies (including Electron)
npm install

# Run the Electron app in development mode
npm start

# Or with detailed logging
npm run dev
```

### Building for Distribution

```bash
# Build Windows installer + portable version
npm run build

# Build only Windows installer (NSIS)
npm run build:win

# Build only portable executable
npm run build:portable

# Test packaging without distributing (faster)
npm run pack
```

The built files will be in the `dist/` directory:
- **Installer**: `dist/TikTok Stream Tool Setup 1.0.3.exe`
- **Portable**: `dist/TikTok-Stream-Tool-Portable-1.0.3.exe`

## How It Works

### Startup Sequence

1. **main.js** (Electron) starts
2. Spawns `app/start-server.bat` via `child_process.spawn()`
3. **start-server.bat** runs `node server.js` with `OPEN_BROWSER=false`
4. Server starts on port 3000
5. Electron waits for server to respond to health checks
6. Once server is ready, Electron opens BrowserWindow
7. BrowserWindow loads `http://localhost:3000/dashboard.html`

### Server Auto-Start

The batch file (`app/start-server.bat`):
- Sets working directory to project root
- Checks Node.js installation
- Verifies `server.js` exists
- Installs npm dependencies if needed
- Sets `OPEN_BROWSER=false` to prevent duplicate browser windows
- Starts the server with `node server.js`

### Shutdown Sequence

1. User closes Electron window
2. Electron sends `SIGTERM` to server process
3. After 5 seconds timeout, force-kills with `taskkill /f /t`
4. Electron app quits

## Configuration

### Port Configuration

Default port: **3000**

To change the port, set the `PORT` environment variable:

```bash
# In PowerShell
$env:PORT=3001
npm start

# In Command Prompt
set PORT=3001
npm start
```

Or edit `main.js` and change `SERVER_PORT`.

### Auto-Restart on Crash

Currently, the server does not auto-restart if it crashes. This is intentional to prevent infinite restart loops.

If you want auto-restart:

1. Edit `main.js`
2. In the `serverProcess.on('exit', ...)` handler
3. Add logic to call `startServer()` again

Example:
```javascript
serverProcess.on('exit', (code, signal) => {
    console.log(`Server process exited with code ${code}`);
    if (!isQuitting && code !== 0) {
        console.log('Server crashed! Restarting in 3 seconds...');
        setTimeout(() => {
            startServer().then(waitForServer).then(() => {
                console.log('Server restarted successfully');
            });
        }, 3000);
    }
});
```

## Development

### Project Structure

```
ltth.electron/
├── main.js                  # Electron main process (THIS IS THE ENTRY POINT)
├── package.json             # Electron + Server dependencies
├── app/
│   └── start-server.bat     # Server startup script
├── server.js                # Express server (runs externally)
├── modules/                 # Server modules
├── routes/                  # Server routes
├── plugins/                 # Server plugins
├── public/                  # Frontend assets
│   ├── dashboard.html       # Main UI
│   └── overlay.html         # OBS overlay
├── user_configs/            # User databases (not in git)
└── user_data/               # User data (not in git)
```

### Running Tests

The existing test files still work with the server:

```bash
# Start server normally (without Electron)
node server.js

# Or use the original launcher
node launch.js

# Then run tests in another terminal
node test-connection.js
node test-soundboard.js
```

### Debugging

**Enable DevTools:**

Edit `main.js` and set:
```javascript
if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
}
```

Then run:
```bash
set NODE_ENV=development
npm start
```

**Server Logs:**

The server output is piped to the Electron console with `[Server]` prefix.

**Console Window:**

The batch file runs with `windowsHide: false` so you can see the server console output in a separate window.

## Troubleshooting

### "Server failed to start within 60000ms"

**Possible causes:**
- Node.js not installed
- npm dependencies not installed
- Port 3000 already in use
- Antivirus blocking Node.js

**Solutions:**
```bash
# Check Node.js
node --version

# Install dependencies manually
npm install

# Check if port is in use
netstat -ano | findstr :3000

# Kill process using port 3000 (replace PID)
taskkill /PID <PID> /F
```

### Server crashes immediately

Check the server console window for errors. Common issues:
- Missing `.env` file (copy from `.env.example`)
- Database corruption (delete `*.db` files)
- Missing dependencies (run `npm install`)

### Electron window is blank

- Check server is running: `http://localhost:3000/dashboard.html` in normal browser
- Open DevTools (F12) in Electron and check console
- Check server output for errors

### Building fails

**Node version mismatch:**
```bash
# Electron-builder needs Node 18.x - 20.x
node --version
```

**Missing icon files:**
- Create `build/icon.ico` (256x256 Windows icon)
- Or remove icon references from `package.json`

**Native modules:**
- This shouldn't happen with our architecture, but if it does:
- Check that `better-sqlite3` is NOT in `dependencies` of the Electron package
- It should only be used by the external server

## Packaging Considerations

### What Gets Packaged

The `electron-builder` includes:
- `main.js` (Electron entry)
- `app/start-server.bat`
- All server files (`server.js`, `modules/`, `routes/`, `plugins/`, etc.)
- All `node_modules` (both Electron and server dependencies)
- User data directories structure (empty)

### What Stays Separate

- User configs (`user_configs/`)
- User data (`user_data/`)
- Logs (`logs/`)
- Database files (`*.db`)
- `.env` file

### Portable vs. Installer

**Portable** (`TikTok-Stream-Tool-Portable-1.0.3.exe`):
- Single executable
- No installation required
- Stores data next to executable
- Good for USB drives

**Installer** (`TikTok Stream Tool Setup 1.0.3.exe`):
- NSIS installer
- Installed to `Program Files`
- Start menu shortcuts
- Desktop shortcut
- Uninstaller
- Data stored in `%APPDATA%`

## Contributing

When contributing Electron-specific features:

1. Keep `main.js` minimal and focused on window management
2. All business logic should stay in `server.js` and modules
3. Don't import `better-sqlite3` or other native modules in `main.js`
4. Test both development (`npm start`) and built versions
5. Update this README with new features

## License

MIT License - see [LICENSE](LICENSE)

## Credits

- Original TikTok Stream Tool by Pup Cids
- Electron Desktop App transformation by GitHub Copilot

---

**Questions or Issues?**
- Email: [loggableim@gmail.com](mailto:loggableim@gmail.com)
- GitHub Issues: https://github.com/Loggableim/ltth.electron/issues
