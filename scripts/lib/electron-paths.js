'use strict';

// Electron 버전/경로 계산을 한 곳에 모은 헬퍼. Node 내장 모듈만 사용한다.

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const OFFLINE_DIR = path.join(ROOT, 'offline');
const VENDOR_DIR = path.join(ROOT, 'vendor', 'electron');
const DIST_DIR = path.join(ROOT, 'dist');

function readPackageJson() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
}

// 버전은 package.json 의 config.electronVersion 하나로 관리한다.
function electronVersion() {
  const { config } = readPackageJson();
  const version = config && config.electronVersion;
  if (!version) throw new Error('package.json 에 config.electronVersion 이 없습니다.');
  return version;
}

function zipName(version, platform = process.platform, arch = process.arch) {
  return `electron-v${version}-${platform}-${arch}.zip`;
}

const DEFAULT_MIRROR = 'https://github.com/electron/electron/releases/download/';

// Electron 파일 다운로드 URL. electron npm 패키지(@electron/get)와 같은 환경변수 규칙을 따른다.
//   <ELECTRON_MIRROR><ELECTRON_CUSTOM_DIR>/<파일>   (CUSTOM_DIR 기본값: v{{ version }})
function electronDownloadUrl(file, version, env = process.env) {
  let mirror = env.ELECTRON_MIRROR || DEFAULT_MIRROR;
  if (!mirror.endsWith('/')) mirror += '/';
  const dir = (env.ELECTRON_CUSTOM_DIR || 'v{{ version }}').replace(/\{\{\s*version\s*\}\}/g, version);
  return `${mirror}${dir}/${file}`;
}

// 압축을 푼 Electron 배포본 폴더 안에서 실행 파일의 상대 경로.
function binaryRelativePath(platform = process.platform) {
  switch (platform) {
    case 'win32':
      return 'electron.exe';
    case 'darwin':
      return path.join('Electron.app', 'Contents', 'MacOS', 'Electron');
    default:
      return 'electron';
  }
}

// 패키징 시 앱 소스가 들어갈 resources 폴더의 상대 경로.
function resourcesRelativePath(platform = process.platform) {
  return platform === 'darwin' ? path.join('Electron.app', 'Contents', 'Resources') : 'resources';
}

function parseArgs(argv) {
  const args = {};
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue;
    const eq = raw.indexOf('=');
    if (eq === -1) args[raw.slice(2)] = true;
    else args[raw.slice(2, eq)] = raw.slice(eq + 1);
  }
  return args;
}

module.exports = {
  ROOT,
  OFFLINE_DIR,
  VENDOR_DIR,
  DIST_DIR,
  readPackageJson,
  electronVersion,
  zipName,
  electronDownloadUrl,
  binaryRelativePath,
  resourcesRelativePath,
  parseArgs,
};
