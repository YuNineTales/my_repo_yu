'use strict';

// preload 스크립트 (sandbox: true).
// 주의: sandbox 모드의 preload 는 'electron' 등 일부 모듈만 require 할 수 있다.
// 로컬 파일(../main/ipc 등)을 require 하면 실행 시 오류가 난다. 그래서 채널 이름을 여기 다시 적는다.
// main/ipc.js 의 CHANNELS 와 반드시 같아야 한다 (test/channels.test.js 가 검사).

const { contextBridge, ipcRenderer } = require('electron');

const CHANNELS = {
  GET_APP_INFO: 'app:get-info',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
};

// 렌더러에 노출하는 API. ipcRenderer 자체는 절대 노출하지 않는다.
contextBridge.exposeInMainWorld('api', {
  getAppInfo: () => ipcRenderer.invoke(CHANNELS.GET_APP_INFO),
  getSetting: (key) => ipcRenderer.invoke(CHANNELS.SETTINGS_GET, key),
  setSetting: (key, value) => ipcRenderer.invoke(CHANNELS.SETTINGS_SET, key, value),
});
