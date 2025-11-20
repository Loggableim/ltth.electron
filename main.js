/**
 * Electron Main Process
 * TikTok Stream Tool - Desktop Application
 * 
 * This file handles:
 * - Starting the external Node.js server via start-server.bat
 * - Waiting for server to be ready
 * - Opening the main window pointing to http://localhost:3000
 * - Cleanup on app exit
 */

const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

// Configuration
const SERVER_PORT = process.env.PORT || 3000;
const SERVER_HOST = 'localhost';
const SERVER_URL = `http://${SERVER_HOST}:${SERVER_PORT}/dashboard.html`;
const MAX_STARTUP_WAIT = 60000; // 60 seconds max wait for server startup
const HEALTH_CHECK_INTERVAL = 500; // Check every 500ms

// Global references
let mainWindow = null;
let serverProcess = null;
let isQuitting = false;

/**
 * Create the main application window
 */
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            // Enable web security
            webSecurity: true,
            // Allow loading local resources
            allowRunningInsecureContent: false
        },
        // Window configuration
        backgroundColor: '#1a1a1a',
        show: false, // Don't show until ready
        autoHideMenuBar: false,
        title: 'TikTok Stream Tool'
    });

    // Load the dashboard from the local server
    mainWindow.loadURL(SERVER_URL);

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        console.log('✓ Window shown');
    });

    // Handle window close
    mainWindow.on('close', (event) => {
        if (!isQuitting && serverProcess) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Open DevTools in development (optional)
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
}

/**
 * Check if the server is ready by attempting to connect
 */
function checkServerReady() {
    return new Promise((resolve) => {
        const options = {
            host: SERVER_HOST,
            port: SERVER_PORT,
            path: '/api/status',
            method: 'GET',
            timeout: 2000
        };

        const req = http.request(options, (res) => {
            resolve(res.statusCode === 200 || res.statusCode === 404);
        });

        req.on('error', () => {
            resolve(false);
        });

        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}

/**
 * Wait for the server to become ready
 */
async function waitForServer() {
    const startTime = Date.now();
    let attempts = 0;

    console.log('Waiting for server to start...');

    while (Date.now() - startTime < MAX_STARTUP_WAIT) {
        attempts++;
        
        const isReady = await checkServerReady();
        
        if (isReady) {
            console.log(`✓ Server is ready after ${attempts} attempts (${Date.now() - startTime}ms)`);
            return true;
        }

        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, HEALTH_CHECK_INTERVAL));
    }

    throw new Error(`Server failed to start within ${MAX_STARTUP_WAIT}ms`);
}

/**
 * Start the Node.js server using start-server.bat
 */
function startServer() {
    return new Promise((resolve, reject) => {
        const batchFile = path.join(__dirname, 'app', 'start-server.bat');
        const serverRoot = __dirname; // Server files are in root, not in app/
        
        console.log('Starting Node.js server...');
        console.log(`Batch file: ${batchFile}`);
        console.log(`Server root: ${serverRoot}`);

        // Spawn the batch file
        serverProcess = spawn('cmd.exe', ['/c', batchFile], {
            cwd: serverRoot, // Run from root directory where server.js is located
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: false, // Show console window for debugging
            detached: false
        });

        // Log server output
        serverProcess.stdout.on('data', (data) => {
            const output = data.toString().trim();
            if (output) {
                console.log(`[Server] ${output}`);
            }
        });

        serverProcess.stderr.on('data', (data) => {
            const output = data.toString().trim();
            if (output) {
                console.error(`[Server Error] ${output}`);
            }
        });

        serverProcess.on('error', (error) => {
            console.error(`Failed to start server: ${error.message}`);
            reject(error);
        });

        serverProcess.on('exit', (code, signal) => {
            console.log(`Server process exited with code ${code} and signal ${signal}`);
            if (!isQuitting) {
                // Server crashed unexpectedly
                console.error('Server crashed unexpectedly!');
                // Optionally restart the server or show an error dialog
            }
        });

        // Give the process a moment to start
        setTimeout(() => {
            if (serverProcess && !serverProcess.killed) {
                resolve();
            } else {
                reject(new Error('Server process failed to start'));
            }
        }, 1000);
    });
}

/**
 * Stop the server process gracefully
 */
function stopServer() {
    if (serverProcess && !serverProcess.killed) {
        console.log('Stopping server process...');
        
        // On Windows, we need to kill the entire process tree
        try {
            // Try graceful shutdown first
            serverProcess.kill('SIGTERM');
            
            // Force kill after timeout
            setTimeout(() => {
                if (serverProcess && !serverProcess.killed) {
                    console.log('Force killing server process...');
                    spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t']);
                }
            }, 5000);
        } catch (error) {
            console.error(`Error stopping server: ${error.message}`);
        }
    }
}

/**
 * Main application initialization
 */
async function initializeApp() {
    try {
        // Start the server
        await startServer();

        // Wait for server to be ready
        await waitForServer();

        // Create the window
        createWindow();

    } catch (error) {
        console.error(`Failed to initialize app: ${error.message}`);
        app.quit();
    }
}

// App event handlers
app.on('ready', initializeApp);

app.on('window-all-closed', () => {
    // On Windows/Linux, quit when all windows are closed
    // On macOS, apps usually stay active until Cmd+Q
    if (process.platform !== 'darwin') {
        isQuitting = true;
        stopServer();
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (mainWindow === null) {
        createWindow();
    } else {
        mainWindow.show();
    }
});

app.on('before-quit', () => {
    isQuitting = true;
    stopServer();
});

app.on('will-quit', (event) => {
    if (serverProcess && !serverProcess.killed) {
        event.preventDefault();
        stopServer();
        setTimeout(() => {
            app.quit();
        }, 2000);
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

console.log('Electron main process started');
console.log(`Node version: ${process.version}`);
console.log(`Electron version: ${process.versions.electron}`);
console.log(`Chrome version: ${process.versions.chrome}`);
