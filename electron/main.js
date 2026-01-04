const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, Notification, shell } = require('electron');
const path = require('path');

let mainWindow;
let tray;
let isQuitting = false;

// Enable hot reload for development
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  // Create the browser window with modern styling
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#1F2123',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    frame: process.platform === 'darwin' ? false : true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    show: false, // Don't show until ready
  });

  // Elegant show after ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Animate window entrance on macOS
    if (process.platform === 'darwin') {
      mainWindow.setOpacity(0);
      let opacity = 0;
      const fadeIn = setInterval(() => {
        opacity += 0.1;
        mainWindow.setOpacity(Math.min(opacity, 1));
        if (opacity >= 1) clearInterval(fadeIn);
      }, 30);
    }
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:8081'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();

      // Show notification that app is still running
      if (Notification.isSupported()) {
        new Notification({
          title: 'SmartDealsIQ',
          body: 'App is running in the background. Click the tray icon to open.',
          icon: path.join(__dirname, '../assets/icon.png'),
        }).show();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '../assets/tray-icon.png');
  const icon = nativeImage.createFromPath(iconPath);

  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open SmartDealsIQ',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'New Flash Deal!',
      enabled: false,
      icon: nativeImage.createFromPath(path.join(__dirname, '../assets/deal-icon.png')).resize({ width: 16, height: 16 })
    },
    { type: 'separator' },
    {
      label: 'Notifications',
      submenu: [
        { label: 'Enable All', type: 'radio', checked: true },
        { label: 'Flash Deals Only', type: 'radio' },
        { label: 'Mute All', type: 'radio' },
      ]
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('SmartDealsIQ - Hot Deals Nearby!');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for renderer communication
ipcMain.handle('show-notification', async (event, { title, body, urgency }) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      icon: path.join(__dirname, '../assets/icon.png'),
      urgency: urgency || 'normal',
      sound: urgency === 'critical' ? 'default' : undefined,
    });

    notification.on('click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });

    notification.show();
    return true;
  }
  return false;
});

ipcMain.handle('get-platform', () => {
  return {
    platform: process.platform,
    isDesktop: true,
    version: app.getVersion(),
  };
});

ipcMain.handle('flash-frame', () => {
  if (mainWindow && !mainWindow.isFocused()) {
    mainWindow.flashFrame(true);
    setTimeout(() => mainWindow.flashFrame(false), 3000);
  }
});

ipcMain.handle('set-badge', (event, count) => {
  if (process.platform === 'darwin') {
    app.dock.setBadge(count > 0 ? count.toString() : '');
  } else if (process.platform === 'win32') {
    mainWindow?.setOverlayIcon(
      count > 0
        ? nativeImage.createFromPath(path.join(__dirname, '../assets/badge.png'))
        : null,
      count > 0 ? `${count} new deals` : ''
    );
  }
});

// Auto-updater (for production)
if (!isDev) {
  const { autoUpdater } = require('electron-updater');

  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => {
    new Notification({
      title: 'Update Available',
      body: 'A new version of SmartDealsIQ is downloading...',
    }).show();
  });

  autoUpdater.on('update-downloaded', () => {
    new Notification({
      title: 'Update Ready',
      body: 'Restart SmartDealsIQ to apply the update.',
    }).show();
  });
}
