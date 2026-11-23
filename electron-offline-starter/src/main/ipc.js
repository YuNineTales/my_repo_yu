'use strict';

// IPC 핸들러 모음.
// 새 기능 추가 순서: (1) 여기 CHANNELS + 핸들러 → (2) preload.js 의 CHANNELS + api → (3) renderer 에서 window.api.* 호출.
// 채널 이름은 test/channels.test.js 가 main/preload 양쪽이 일치하는지 검사한다.

const fs = require('node:fs');
const path = require('node:path');
const { app, ipcMain } = require('electron');

const CHANNELS = {
  GET_APP_INFO: 'app:get-info',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
};

function settingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsPath(), 'utf8'));
  } catch {
    return {};
  }
}

function writeSettings(data) {
  fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(data, null, 2), 'utf8');
}

// 렌더러가 보낸 요청이 우리 앱의 로컬 파일에서 온 것인지 확인한다.
function assertTrustedSender(event) {
  const url = event.senderFrame && event.senderFrame.url;
  if (!url || !url.startsWith('file://')) {
    throw new Error(`Untrusted IPC sender: ${url}`);
  }
}

function handle(channel, fn) {
  ipcMain.handle(channel, async (event, ...args) => {
    assertTrustedSender(event);
    return fn(...args);
  });
}

function registerIpcHandlers() {
  handle(CHANNELS.GET_APP_INFO, () => ({
    name: app.getName(),
    version: app.getVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    platform: `${process.platform}-${process.arch}`,
  }));

  handle(CHANNELS.SETTINGS_GET, (key) => {
    if (typeof key !== 'string') throw new TypeError('key must be a string');
    return readSettings()[key] ?? null;
  });

  handle(CHANNELS.SETTINGS_SET, (key, value) => {
    if (typeof key !== 'string') throw new TypeError('key must be a string');
    const data = readSettings();
    data[key] = value;
    writeSettings(data);
    return true;
  });
}

module.exports = { CHANNELS, registerIpcHandlers };
