// electron/preload.js
// Tally Desktop - Preload script (security bridge)

const { contextBridge, ipcRenderer } = require('electron');

// Expose safe API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Configuration
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  getConfig: () => ipcRenderer.invoke('get-config'),
  resetConfig: () => ipcRenderer.invoke('reset-config'),

  // Connection testing
  testConnection: (serverUrl) => ipcRenderer.invoke('test-connection', serverUrl),

  // Platform info
  platform: process.platform,

  // Is Electron
  isElectron: true,

  // Mode and server URL (will be set by main process via executeJavaScript)
  mode: null,
  serverUrl: null
});

console.log('Preload script loaded');
