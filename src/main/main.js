'use strict';

// 메인 프로세스 진입점.
// 외부 npm 패키지를 쓰지 않는다. Node 내장 모듈과 electron 모듈만 사용한다.

const path = require('node:path');
const { app, BrowserWindow, session } = require('electron');
const { registerIpcHandlers } = require('./ipc');

const isDev = process.argv.includes('--dev');
const isSmoke = process.argv.includes('--smoke');

// 폐쇄망: 외부로 나가는 요청을 전부 차단한다 (file:, devtools:, data: 만 허용).
const ALLOWED_PROTOCOLS = new Set(['file:', 'devtools:', 'data:', 'chrome-extension:']);

function blockNetwork() {
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    let protocol;
    try {
      protocol = new URL(details.url).protocol;
    } catch {
      return callback({ cancel: true });
    }
    callback({ cancel: !ALLOWED_PROTOCOLS.has(protocol) });
  });
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 720,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  win.once('ready-to-show', () => {
    if (!isSmoke) win.show();
    if (isDev) win.webContents.openDevTools({ mode: 'detach' });
  });

  // 새 창 열기와 외부 페이지 이동을 막는다.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event) => event.preventDefault());

  if (isSmoke) {
    // 스모크 테스트: 렌더러 로드 + preload/IPC 왕복이 되면 종료 코드 0으로 끝낸다.
    win.webContents.once('did-finish-load', async () => {
      try {
        const info = await win.webContents.executeJavaScript('window.api.getAppInfo()');
        console.log(`[smoke] renderer loaded OK, IPC OK (electron ${info.electron})`);
        app.exit(0);
      } catch (err) {
        console.error(`[smoke] IPC failed: ${err.message}`);
        app.exit(1);
      }
    });
    win.webContents.once('did-fail-load', (_e, code, desc) => {
      console.error(`[smoke] load failed: ${code} ${desc}`);
      app.exit(1);
    });
  }

  return win;
}

app.whenReady().then(() => {
  blockNetwork();
  registerIpcHandlers();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
