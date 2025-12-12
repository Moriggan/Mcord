const { app, BrowserWindow, nativeTheme } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;
const isDev = process.env.NODE_ENV !== 'production';
const devUrl = 'http://localhost:5173';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  if (isDev) {
    win.loadURL(devUrl);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    win.loadFile(indexPath);
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  nativeTheme.themeSource = 'dark';
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
