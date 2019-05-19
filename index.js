const dotenv = require('dotenv');
const crypto = require('crypto');
const fs = require('fs');
const url = require('url');
const path = require('path').posix;
const { app, BrowserWindow, ipcMain, session, Menu, shell } = require('electron');
const utils = require('electron-util');

dotenv.load({ silent: true });

if (!process.env.ENCRYPTION_KEY) {
  const key = crypto.randomBytes(32).toString('hex');
  fs.appendFileSync(path.resolve(__dirname, './.env'), `ENCRYPTION_KEY=${key}`);
  dotenv.load({ silent: true });
}
const { PORT, redmineDomain } = require('./modules/config');
require('./modules/request'); // to initialize from storage

let mainWindow;
const isDev = !!(process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath));

const initializeMenu = () => {
  const isMac = process.platform === 'darwin';
  const menu = Menu.buildFromTemplate([
    // { role: 'appMenu' }
    ...(isMac ? [{
      label: 'Redtime',
      submenu: [
        {
          label: 'About Redtime',
          click: () => utils.showAboutWindow({
            // icon: path.join(__dirname, 'static/Icon.png'),
            copyright: 'Copyright © Daniyil Vasylenko',
            text: 'Some more info.'
          })
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startspeaking' },
              { role: 'stopspeaking' }
            ]
          }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        ...(isDev
          ? [
            { role: 'reload' },
            { role: 'forcereload' },
            { role: 'toggledevtools' },
            { type: 'separator' }
          ]
          : []
        ),
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Report An Issue',
          click: () => utils.openNewGitHubIssue({
            repoUrl: 'https://github.com/Spring3/redtime',
            body: `### Debug Info:\n \`\`\`\n${utils.debugInfo()}\n\`\`\``
          })
        },
        // {
        //   label: 'Learn More',
        //   click: async () => {
        //     await shell.openExternal('https://electronjs.org')
        //   }
        // }
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);
};

const initialize = () => {
  const windowConfig = {
    width: 1024,
    height: 768,
    minWidth: 744,
    // icon: `${__dirname}/assets/icon.ico`,
    show: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true
    }
  };

  let indexPath;
  if (isDev && process.argv.indexOf('--noDevServer') === -1) {
    indexPath = url.format({
      protocol: 'http:',
      host: `localhost:${PORT}`,
      pathname: 'index.html',
      slashes: true
    });
  } else {
    indexPath = url.format({
      protocol: 'file:',
      pathname: path.resolve(__dirname, 'dist', 'index.html'),
      slashes: true
    });
  }
  mainWindow = new BrowserWindow(windowConfig);
  mainWindow.loadURL(indexPath);
  utils.enforceMacOSAppLocation();
  initializeMenu();

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.once('closed', () => {
    mainWindow = null;
  });
};

if (redmineDomain) {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [`script-src 'self' ${redmineDomain}`]
      }
    });
  });
}

app.once('ready', initialize);
app.once('quit', () => ipcMain.removeAllListeners('action'));
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    initialize();
  }
});
