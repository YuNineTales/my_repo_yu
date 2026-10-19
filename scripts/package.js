'use strict';

// 배포용 폴더 생성 (electron-builder 없이).
// vendor/electron 을 복사하고, 앱 소스를 resources/app 에 넣는다. Electron 은 resources/app 이 있으면 그걸 실행한다.
// 사용법: node scripts/package.js
// 결과: dist/<name>-<platform>-<arch>/  → 이 폴더를 통째로 zip 해서 배포하면 된다.

const fs = require('node:fs');
const path = require('node:path');
const {
  ROOT,
  VENDOR_DIR,
  DIST_DIR,
  readPackageJson,
  binaryRelativePath,
  resourcesRelativePath,
} = require('./lib/electron-paths');

// 배포본에 포함할 앱 파일/폴더. 새 최상위 폴더를 만들면 여기에 추가한다.
const APP_FILES = ['package.json', 'src'];

function main() {
  const pkg = readPackageJson();
  const platform = process.platform;
  const arch = process.arch;

  if (!fs.existsSync(path.join(VENDOR_DIR, binaryRelativePath(platform)))) {
    console.error('[package] vendor/electron 이 없습니다. 먼저 `node scripts/install-offline.js` 를 실행하세요.');
    process.exit(1);
  }

  const outDir = path.join(DIST_DIR, `${pkg.name}-${platform}-${arch}`);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`[package] Electron 런타임 복사 → ${path.relative(ROOT, outDir)}`);
  fs.cpSync(VENDOR_DIR, outDir, { recursive: true, verbatimSymlinks: true });
  fs.rmSync(path.join(outDir, '.electron-version'), { force: true });

  const resourcesDir = path.join(outDir, resourcesRelativePath(platform));
  // 기본 데모 앱 제거 (남아 있어도 resources/app 이 우선이지만 혼동 방지).
  fs.rmSync(path.join(resourcesDir, 'default_app.asar'), { force: true });

  const appDir = path.join(resourcesDir, 'app');
  fs.mkdirSync(appDir, { recursive: true });
  for (const entry of APP_FILES) {
    fs.cpSync(path.join(ROOT, entry), path.join(appDir, entry), { recursive: true });
  }

  // 실행 파일 이름 변경 (Windows/Linux). macOS 는 Info.plist 수정이 필요해 그대로 둔다.
  if (platform === 'win32' || platform === 'linux') {
    const ext = platform === 'win32' ? '.exe' : '';
    const from = path.join(outDir, `electron${ext}`);
    const to = path.join(outDir, `${pkg.name}${ext}`);
    fs.renameSync(from, to);
    console.log(`[package] 실행 파일: ${path.relative(ROOT, to)}`);
  } else {
    console.log(`[package] 실행 파일: ${path.relative(ROOT, path.join(outDir, 'Electron.app'))}`);
  }

  console.log('[package] 완료');
}

main();
