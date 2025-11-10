// electron/main.js
// Tally Desktop - Main Electron process

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const Store = require('electron-store');
const fs = require('fs');

// Configuration store
const store = new Store({
  name: 'tally-config',
  defaults: {
    mode: null, // 'local' or 'remote'
    serverUrl: null,
    setupComplete: false
  }
});

let mainWindow = null;
let backendProcess = null;
let backendReady = false;

// Get paths
const isDev = !app.isPackaged;
const frontendPath = isDev
  ? path.join(__dirname, '../frontend/dist')
  : path.join(process.resourcesPath, 'frontend/dist');
const backendPath = isDev
  ? path.join(__dirname, '../backend')
  : path.join(process.resourcesPath, 'backend');

// Database path in user data directory
const databasePath = path.join(app.getPath('userData'), 'data');

console.log('=== Tally Desktop Starting ===');
console.log('Mode:', isDev ? 'Development' : 'Production');
console.log('Frontend path:', frontendPath);
console.log('Backend path:', backendPath);
console.log('Database path:', databasePath);

/**
 * Start the Express backend server
 */
function startBackend() {
  return new Promise((resolve, reject) => {
    console.log('Starting backend server...');

    // Ensure data directory exists
    if (!fs.existsSync(databasePath)) {
      fs.mkdirSync(databasePath, { recursive: true });
    }

    const serverPath = path.join(backendPath, 'server.js');

    // Start Node.js backend
    backendProcess = spawn('node', [serverPath], {
      env: {
        ...process.env,
        PORT: '3001',
        NODE_ENV: 'production',
        DB_PATH: path.join(databasePath, 'tally.db')
      },
      cwd: backendPath
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data.toString().trim()}`);

      // Check if server is ready
      if (data.toString().includes('listening on port') || data.toString().includes('Server running')) {
        if (!backendReady) {
          backendReady = true;
          console.log('Backend server is ready!');
          resolve();
        }
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data.toString().trim()}`);
    });

    backendProcess.on('error', (error) => {
      console.error('Failed to start backend:', error);
      reject(error);
    });

    backendProcess.on('exit', (code) => {
      console.log(`Backend process exited with code ${code}`);
      backendReady = false;
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!backendReady) {
        console.error('Backend failed to start within 10 seconds');
        reject(new Error('Backend startup timeout - server did not respond within 10 seconds'));
      }
    }, 10000);
  });
}

/**
 * Stop the backend server
 */
function stopBackend() {
  if (backendProcess) {
    console.log('Stopping backend server...');
    backendProcess.kill();
    backendProcess = null;
    backendReady = false;
  }
}

/**
 * Create the setup wizard window
 */
function createSetupWindow() {
  const setupWindow = new BrowserWindow({
    width: 600,
    height: 500,
    resizable: false,
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  setupWindow.loadFile(path.join(__dirname, 'setup-wizard.html'));

  // When wizard closes, create main window if setup was completed
  setupWindow.on('closed', () => {
    // Check if setup was completed
    if (store.get('setupComplete')) {
      console.log('Setup completed, creating main window...');
      createMainWindow();
    } else {
      // User cancelled setup without completing
      console.log('Setup cancelled, quitting app...');
      app.quit();
    }
  });

  if (isDev) {
    setupWindow.webContents.openDevTools();
  }

  return setupWindow;
}

/**
 * Create the main application window
 */
async function createMainWindow() {
  const config = store.store;
  console.log('Current config:', config);

  // If setup not complete, show setup wizard
  if (!config.setupComplete) {
    console.log('First launch - showing setup wizard');
    createSetupWindow();
    return;
  }

  // Start backend if in local mode
  if (config.mode === 'local') {
    console.log('Local mode - starting backend...');
    try {
      await startBackend();
      console.log('Backend started successfully');
    } catch (error) {
      console.error('Failed to start backend:', error);
      dialog.showErrorBox(
        'Backend Error',
        'Failed to start the local server. Please check the logs.'
      );
      app.quit();
      return;
    }
  }

  // Determine URL to load
  let appUrl;
  if (config.mode === 'local') {
    appUrl = 'http://localhost:3001';
  } else if (config.mode === 'remote') {
    appUrl = config.serverUrl;
  } else {
    console.error('Invalid mode:', config.mode);
    app.quit();
    return;
  }

  console.log('Loading app from:', appUrl);

  // Create main window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icons', 'icon.png')
  });

  // Load the app
  if (config.mode === 'local') {
    // Load local frontend files
    mainWindow.loadFile(path.join(frontendPath, 'index.html'));
  } else {
    // Load from remote server
    mainWindow.loadURL(appUrl);
  }

  // Inject configuration after page loads
  mainWindow.webContents.on('did-finish-load', () => {
    // Use JSON.stringify to prevent XSS vulnerabilities
    const configData = JSON.stringify({
      mode: config.mode,
      serverUrl: config.serverUrl || ''
    });
    mainWindow.webContents.executeJavaScript(`
      if (window.electronAPI) {
        const config = ${configData};
        window.electronAPI.mode = config.mode;
        window.electronAPI.serverUrl = config.serverUrl;
      }
      console.log('Electron config injected:', ${configData});
    `);
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * IPC Handlers for setup wizard
 */

// Save configuration
ipcMain.handle('save-config', async (event, config) => {
  console.log('Saving config:', config);

  store.set('mode', config.mode);
  store.set('setupComplete', true);

  if (config.mode === 'remote') {
    store.set('serverUrl', config.serverUrl);
  }

  return { success: true };
});

// Test remote connection
ipcMain.handle('test-connection', async (event, serverUrl) => {
  console.log('Testing connection to:', serverUrl);

  // Use AbortController for timeout (native fetch doesn't support timeout option)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${serverUrl}/api/health`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return { success: true, message: 'Connection successful!' };
    } else {
      return { success: false, message: 'Server responded but health check failed' };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Connection test failed:', error);

    if (error.name === 'AbortError') {
      return { success: false, message: 'Connection timeout (5 seconds)' };
    }

    return { success: false, message: error.message };
  }
});

// Get current configuration
ipcMain.handle('get-config', async () => {
  return store.store;
});

// Reset configuration (for settings)
ipcMain.handle('reset-config', async () => {
  store.clear();
  return { success: true };
});

/**
 * App lifecycle
 */

app.whenReady().then(() => {
  console.log('App is ready');
  createMainWindow();
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('before-quit', () => {
  stopBackend();
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
