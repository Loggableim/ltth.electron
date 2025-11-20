const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const Store = require('electron-store');

// Initialize electron-store for persistent settings
const store = new Store();

// Keep a global reference to prevent garbage collection
let mainWindow = null;

// Server instance
let serverModule = null;

function createWindow() {
  // Restore window state from store
  const windowState = store.get('windowState', {
    width: 1280,
    height: 800
  });

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'build/icon.ico'),
    title: 'LTTH - Little TikTok Helper',
    backgroundColor: '#1a1a1a'
  });

  // Save window state on resize/move
  const saveWindowState = () => {
    const bounds = mainWindow.getBounds();
    store.set('windowState', bounds);
  };

  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);

  // Start the Express server
  startServer();

  // Load the dashboard after server is ready
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000/dashboard.html');
  }, 2000);

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startServer() {
  try {
    // Import and start the Express server
    serverModule = require('./server.js');
    console.log('Express server started successfully');
  } catch (error) {
    console.error('Failed to start Express server:', error);
  }
}

// Auto-updater configuration
function setupAutoUpdater() {
  // Log auto-updater events
  autoUpdater.logger = require('winston').createLogger({
    transports: [
      new (require('winston').transports.Console)()
    ]
  });
  autoUpdater.logger.transports[0].level = 'info';

  // Check for updates
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info);
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info);
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
    }
    // Auto-install and restart after 5 seconds
    setTimeout(() => {
      autoUpdater.quitAndInstall(false, true);
    }, 5000);
  });

  autoUpdater.on('error', (error) => {
    console.error('Auto-updater error:', error);
  });

  // Check for updates on startup (delay to allow window to load)
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 5000);
}

// IPC Handlers for renderer process communication
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-store-value', (event, key, defaultValue) => {
  return store.get(key, defaultValue);
});

ipcMain.handle('set-store-value', (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('delete-store-value', (event, key) => {
  store.delete(key);
  return true;
});

// App lifecycle events
app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, apps stay active until Cmd+Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Cleanup if needed
  console.log('Application shutting down');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});
