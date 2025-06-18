const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  
  // Store operations
  storeGet: (key) => ipcRenderer.invoke('store-get', key),
  storeSet: (key, value) => ipcRenderer.invoke('store-set', key, value),
  
  // Window operations
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  
  // Media operations
  openUpload: () => ipcRenderer.send('open-upload'),
  showAIRecommendations: () => ipcRenderer.send('show-ai-recommendations'),
  toggleSovereignty: () => ipcRenderer.send('toggle-sovereignty'),
  toggleVoice: () => ipcRenderer.send('toggle-voice'),
  openDeviceIntegration: () => ipcRenderer.send('open-device-integration'),
  
  // Event listeners
  onMenuAction: (callback) => {
    ipcRenderer.on('open-preferences', callback);
    ipcRenderer.on('open-upload', callback);
    ipcRenderer.on('show-ai-recommendations', callback);
    ipcRenderer.on('toggle-sovereignty', callback);
    ipcRenderer.on('toggle-voice', callback);
    ipcRenderer.on('open-device-integration', callback);
  },
  
  // Platform detection
  platform: process.platform,
  
  // Version info
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});

// Enhanced window controls for custom title bar
contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  restore: () => ipcRenderer.send('window-restore'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized')
});

// Quantum Media Hub specific APIs
contextBridge.exposeInMainWorld('quantumAPI', {
  // Sovereignty features
  enableSovereigntyMode: (settings) => ipcRenderer.invoke('sovereignty-enable', settings),
  disableSovereigntyMode: () => ipcRenderer.invoke('sovereignty-disable'),
  getSovereigntySettings: () => ipcRenderer.invoke('sovereignty-get-settings'),
  
  // Content management
  uploadContent: (filePath) => ipcRenderer.invoke('content-upload', filePath),
  processVideo: (contentId, options) => ipcRenderer.invoke('video-process', contentId, options),
  
  // Analytics
  trackEvent: (event, data) => ipcRenderer.send('analytics-track', event, data),
  
  // Notifications
  showNotification: (title, body, options) => ipcRenderer.send('notification-show', title, body, options),
  
  // System integration
  openFileDialog: (options) => ipcRenderer.invoke('dialog-open-file', options),
  openSaveDialog: (options) => ipcRenderer.invoke('dialog-save-file', options),
  
  // Device features
  getConnectedDevices: () => ipcRenderer.invoke('devices-get-connected'),
  connectBluetooth: (deviceId) => ipcRenderer.invoke('bluetooth-connect', deviceId),
  
  // XR/VR features
  isXRSupported: () => ipcRenderer.invoke('xr-is-supported'),
  requestXRSession: (mode) => ipcRenderer.invoke('xr-request-session', mode)
});

// Security: Remove dangerous APIs
delete window.require;
delete window.exports;
delete window.module;

// Add app state management
window.quantumMediaHub = {
  version: '2.0.0',
  platform: process.platform,
  isElectron: true,
  features: {
    sovereignty: true,
    ai: true,
    xr: true,
    voice: true,
    analytics: true,
    social: true
  }
};

console.log('Quantum Media Hub Electron preload script loaded');