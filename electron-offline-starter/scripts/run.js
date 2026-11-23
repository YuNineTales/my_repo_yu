'use strict';

// 앱 실행기. npm 의 electron 패키지 없이 Electron 바이너리를 찾아 실행한다.
// 찾는 순서: (1) 환경변수 ELECTRON_PATH → (2) vendor/electron → (3) node_modules/electron
// 사용법: node scripts/run.js [--dev] [--smoke] [Electron/Chromium 옵션...]

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { ROOT, VENDOR_DIR, binaryRelativePath } = require('./lib/electron-paths');

function findElectron() {
  if (process.env.ELECTRON_PATH) {
    if (fs.existsSync(process.env.ELECTRON_PATH)) return process.env.ELECTRON_PATH;
    throw new Error(`ELECTRON_PATH 가 가리키는 파일이 없습니다: ${process.env.ELECTRON_PATH}`);
  }

  const vendored = path.join(VENDOR_DIR, binaryRelativePath());
  if (fs.existsSync(vendored)) return vendored;

  try {
    // 사내 npm 미러 등으로 electron 패키지가 설치된 경우 그 바이너리 경로를 쓴다.
    const fromNodeModules = require('electron');
    if (typeof fromNodeModules === 'string' && fs.existsSync(fromNodeModules)) return fromNodeModules;
  } catch {
    // 설치 안 됨: 아래 안내 메시지로 넘어간다.
  }

  return null;
}

function main() {
  const electron = findElectron();
  if (!electron) {
    console.error('[run] Electron 바이너리를 찾을 수 없습니다.');
    console.error('      offline/ 에 electron-v<버전>-<플랫폼>-<아키텍처>.zip 을 넣고 `node scripts/install-offline.js` 를 실행하세요.');
    console.error('      또는 ELECTRON_PATH 환경변수로 실행 파일 경로를 지정하세요. (README.md 참고)');
    process.exit(1);
  }

  const args = [ROOT, ...process.argv.slice(2)];

  // Linux 에서 root 로 실행하면 Chromium 샌드박스가 거부하므로 --no-sandbox 를 붙인다 (개발용).
  if (process.platform === 'linux' && process.getuid && process.getuid() === 0 && !args.includes('--no-sandbox')) {
    console.warn('[run] root 로 실행 중이라 --no-sandbox 를 추가합니다. (개발 환경 전용)');
    args.push('--no-sandbox');
  }

  const env = { ...process.env };
  // 이 값이 남아 있으면 Electron 이 일반 Node 로 동작해 창이 뜨지 않는다.
  delete env.ELECTRON_RUN_AS_NODE;

  const child = spawn(electron, args, { stdio: 'inherit', env, windowsHide: false });
  child.on('close', (code, signal) => {
    if (signal) {
      console.error(`[run] Electron 이 시그널로 종료됨: ${signal}`);
      process.exit(1);
    }
    process.exit(code ?? 0);
  });

  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => {
      if (!child.killed) child.kill(sig);
    });
  }
}

main();
