const { app, BrowserWindow, Menu, dialog, shell, ipcMain, protocol } = require('electron');
const { autoUpdater } = require('electron-updater');
const Store = require('electron-store');
const path = require('path');
const express = require('express');
const fetch = require('node-fetch');

// Initialize electron store
const store = new Store();

// Keep a global reference of the window object
let mainWindow;
let splashWindow;
let serverProcess;
let localServer;

// App configuration
const isDev = process.argv.includes('--dev');
const serverPort = 3000;
const apiPort = 8001;

// Create splash screen
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  splashWindow.loadFile('renderer/splash.html');

  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

// Create the main application window
function createMainWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    icon: path.join(__dirname, 'assets/icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: !isDev
    }
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Load from local server
    mainWindow.loadURL(`http://localhost:${serverPort}`);
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.show();
    
    // Focus window
    if (isDev) {
      mainWindow.focus();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (localServer) {
      localServer.close();
    }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Auto-updater events
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
}

// Start local express server to serve the app
function startLocalServer() {
  if (isDev) return;

  const expressApp = express();
  
  // Serve static files from the bundled app
  expressApp.use(express.static(path.join(__dirname, '../app')));
  
  // API proxy to backend (if running separately)
  expressApp.use('/api', async (req, res) => {
    try {
      const response = await fetch(`http://localhost:${apiPort}${req.path}`, {
        method: req.method,
        headers: req.headers,
        body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
      });
      
      const data = await response.text();
      res.status(response.status).send(data);
    } catch (error) {
      res.status(503).json({ error: 'Backend service unavailable' });
    }
  });

  // Fallback to index.html for SPA routing
  expressApp.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../app/index.html'));
  });

  localServer = expressApp.listen(serverPort, () => {
    console.log(`Local server running on port ${serverPort}`);
  });
}

// App event handlers
app.whenReady().then(() => {
  // Set up protocol handler
  protocol.registerFileProtocol('quantum-media', (request, callback) => {
    const filePath = request.url.replace('quantum-media://', '');
    try {
      return callback(path.normalize(path.join(__dirname, filePath)));
    } catch (error) {
      console.error('Protocol error:', error);
    }
  });

  createSplashWindow();
  
  setTimeout(() => {
    startLocalServer();
    createMainWindow();
    createMenu();
  }, 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (localServer) {
    localServer.close();
  }
});

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'Quantum Media Hub',
      submenu: [
        {
          label: 'About Quantum Media Hub',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Quantum Media Hub',
              message: 'Quantum Media Hub v2.0.0',
              detail: 'Ultimate Sovereign Streaming Platform\n\nFeatures:\n• Full Sovereignty Mode\n• AI-Powered Recommendations\n• 4K-16K Video Support\n• XR/VR Integration\n• Advanced Device Integration\n• Social Features\n• Real-time Analytics'
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('open-preferences');
          }
        },
        { type: 'separator' },
        {
          label: 'Hide Quantum Media Hub',
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            mainWindow.webContents.reloadIgnoringCache();
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.setZoomLevel(0);
          }
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const zoomLevel = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(zoomLevel + 0.5);
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const zoomLevel = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(zoomLevel - 0.5);
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle Fullscreen',
          accelerator: 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        }
      ]
    },
    {
      label: 'Media',
      submenu: [
        {
          label: 'Upload Content',
          accelerator: 'CmdOrCtrl+U',
          click: () => {
            mainWindow.webContents.send('open-upload');
          }
        },
        {
          label: 'AI Recommendations',
          accelerator: 'CmdOrCtrl+A',
          click: () => {
            mainWindow.webContents.send('show-ai-recommendations');
          }
        },
        {
          label: 'Sovereignty Mode',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('toggle-sovereignty');
          }
        },
        { type: 'separator' },
        {
          label: 'Voice Commands',
          accelerator: 'CmdOrCtrl+V',
          click: () => {
            mainWindow.webContents.send('toggle-voice');
          }
        },
        {
          label: 'Device Integration',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            mainWindow.webContents.send('open-device-integration');
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://quantum-media-hub.com/docs');
          }
        },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/quantum-development/media-hub/issues');
          }
        },
        { type: 'separator' },
        {
          label: 'Check for Updates',
          click: () => {
            autoUpdater.checkForUpdatesAndNotify();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('store-get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('store-set', (event, key, value) => {
  return store.set(key, value);
});

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available.');
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available.');
});

autoUpdater.on('error', (err) => {
  console.log('Error in auto-updater. ' + err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  console.log(log_message);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded');
  autoUpdater.quitAndInstall();
});