# Quick Start Guide - Electron Desktop App

## For End Users (Windows)

### Option 1: Download Pre-Built App (Recommended)

1. Download one of these from the Releases page:
   - **Installer**: `TikTok Stream Tool Setup 1.0.3.exe` (recommended)
   - **Portable**: `TikTok-Stream-Tool-Portable-1.0.3.exe` (no installation needed)

2. Run the installer or portable executable

3. The app will:
   - Start automatically
   - Open the dashboard in its own window
   - Show a server console in the background

4. Start using the app! See the main README.md for features.

### Option 2: Build From Source

**Prerequisites:**
- Windows 10/11
- Node.js 18.x - 20.x ([Download](https://nodejs.org))
- Git ([Download](https://git-scm.com))

**Steps:**

```bash
# 1. Clone the repository
git clone https://github.com/Loggableim/ltth.electron.git
cd ltth.electron

# 2. Install dependencies
npm install

# 3. Run the app
npm start
```

That's it! The Electron app will start the server and open the dashboard.

---

## For Developers

### Development Mode

```bash
# Run with detailed logging
npm run dev

# Run normal mode
npm start
```

### Building Distribution Files

```bash
# Build everything (installer + portable)
npm run build

# Build just the installer
npm run build:win

# Build just the portable version
npm run build:portable

# Test packaging (faster, doesn't compress)
npm run pack
```

### Output Location

Built files will be in `dist/`:
- `TikTok Stream Tool Setup 1.0.3.exe` - Windows installer
- `TikTok-Stream-Tool-Portable-1.0.3.exe` - Portable executable

### Configuration

**Change Server Port:**

Edit `main.js` line 20:
```javascript
const SERVER_PORT = process.env.PORT || 3001; // Change from 3000 to 3001
```

**Enable Auto-Restart on Crash:**

See ELECTRON_README.md section "Auto-Restart on Crash"

**Add Custom Icon:**

1. Create `build/icon.ico` (256x256 Windows icon)
2. Update `package.json`:
   ```json
   "win": {
     "icon": "build/icon.ico"
   }
   ```

### Common Issues

**"Server failed to start within 60000ms"**
- Check Node.js is installed: `node --version`
- Check dependencies: `npm install`
- Check if port 3000 is free: `netstat -ano | findstr :3000`

**Blank Window**
- Open DevTools: Press F12 in the window
- Check console for errors
- Verify server is running: Open `http://localhost:3000` in Chrome

**Build Errors**
- Clear cache: Delete `node_modules` and `dist` folders
- Reinstall: `npm install`
- Check Node version: Should be 18.x - 20.x

---

## Architecture Overview

```
Electron App (main.js)
    ↓
    Spawns → start-server.bat
                ↓
                Node.js Server (server.js)
                - Runs on port 3000
                - Uses system Node.js
                - All native modules work here
    ↓
    Loads → http://localhost:3000/dashboard.html
            in BrowserWindow
```

**Why this architecture?**
- Avoids Electron/Node.js ABI conflicts
- No need to rebuild native modules (better-sqlite3, bcrypt, etc.)
- Clean separation of concerns
- Easy to debug and update

---

## Next Steps

1. **Configure TikTok Connection**
   - Get API key from [Eulerstream](https://www.eulerstream.com)
   - Enter in Settings → API Key

2. **Set Up OBS**
   - Add Browser Source
   - URL: `http://localhost:3000/overlay.html`
   - Size: 1920x1080

3. **Configure Features**
   - TTS: Settings → TTS
   - Soundboard: Dashboard → Soundboard
   - Alerts: Dashboard → Alerts
   - Goals: Dashboard → Goals

For detailed documentation, see:
- `README.md` - Full feature documentation
- `ELECTRON_README.md` - Electron-specific details
- `DOCUMENTATION.md` - API and advanced features

---

## Support

- 📧 Email: [loggableim@gmail.com](mailto:loggableim@gmail.com)
- 🐛 Issues: [GitHub Issues](https://github.com/Loggableim/ltth.electron/issues)
- 📖 Docs: See README.md and ELECTRON_README.md
