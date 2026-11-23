'use strict';

// [폐쇄망 PC에서 실행] offline/ 의 Electron zip 을 검증하고 vendor/electron 에 압축 해제한다.
// 네트워크를 전혀 사용하지 않는다.
// 사용법: node scripts/install-offline.js [--zip=경로] [--platform=win32] [--arch=x64] [--skip-checksum]
//        node scripts/install-offline.js --verify-only   (압축 해제 없이 체크섬/실행 파일만 확인. setup.bat 이 Node 없을 때 사용)

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const {
  OFFLINE_DIR,
  VENDOR_DIR,
  electronVersion,
  zipName,
  binaryRelativePath,
  parseArgs,
} = require('./lib/electron-paths');

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function verifyChecksum(zipPath) {
  const sumsPath = path.join(path.dirname(zipPath), 'SHASUMS256.txt');
  if (!fs.existsSync(sumsPath)) {
    console.warn('[install] SHASUMS256.txt 가 없어 체크섬 검증을 건너뜁니다.');
    return;
  }
  const name = path.basename(zipPath);
  const line = fs
    .readFileSync(sumsPath, 'utf8')
    .split(/\r?\n/)
    .find((l) => l.trim().endsWith(name));
  if (!line) {
    console.warn(`[install] SHASUMS256.txt 에 ${name} 항목이 없어 검증을 건너뜁니다.`);
    return;
  }
  const expected = line.trim().split(/\s+/)[0].toLowerCase();
  const actual = sha256(zipPath);
  if (expected !== actual) {
    throw new Error(`체크섬 불일치: ${name}\n  expected ${expected}\n  actual   ${actual}`);
  }
  console.log('[install] 체크섬 확인 완료');
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: 'inherit' });
  return !result.error && result.status === 0;
}

// OS 기본 도구로 압축 해제 (npm 패키지 사용 안 함).
function extract(zipPath, dest) {
  if (process.platform === 'win32') {
    // Windows 10 1803+ 에는 System32\tar.exe(bsdtar, zip 지원)가 기본 포함되어 있다.
    // PATH 의 tar 는 Git for Windows 의 GNU tar 일 수 있고, 그건 zip 을 못 풀고 'C:' 를 원격 호스트로 오해한다.
    const systemTar = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
    if (fs.existsSync(systemTar) && run(systemTar, ['-xf', zipPath, '-C', dest])) return;
    const q = (p) => `'${p.replace(/'/g, "''")}'`;
    const ps = `Expand-Archive -LiteralPath ${q(zipPath)} -DestinationPath ${q(dest)} -Force`;
    if (run('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps])) return;
  } else if (process.platform === 'darwin') {
    // ditto 는 .app 번들의 심볼릭 링크/권한을 보존한다.
    if (run('ditto', ['-x', '-k', zipPath, dest])) return;
  } else {
    if (run('unzip', ['-q', '-o', zipPath, '-d', dest])) return;
    if (run('bsdtar', ['-xf', zipPath, '-C', dest])) return;
  }
  throw new Error('압축 해제 실패: unzip / tar / ditto / PowerShell 중 사용 가능한 도구가 필요합니다.');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const version = electronVersion();
  const platform = args.platform || process.platform;
  const arch = args.arch || process.arch;
  const zipPath = path.resolve(args.zip || path.join(OFFLINE_DIR, zipName(version, platform, arch)));

  if (!fs.existsSync(zipPath)) {
    console.error(`[install] zip 파일이 없습니다: ${zipPath}`);
    console.error('          인터넷 PC에서 `node scripts/prepare-offline.js` 로 받은 뒤 offline/ 에 복사하세요.');
    process.exit(1);
  }

  if (!args['skip-checksum']) verifyChecksum(zipPath);

  const binary = path.join(VENDOR_DIR, binaryRelativePath(platform));

  if (args['verify-only']) {
    if (!fs.existsSync(binary)) throw new Error(`실행 파일이 없습니다: ${binary}`);
    // Electron zip 안의 version 파일로 package.json 버전과 같은지 확인한다.
    const versionFile = path.join(VENDOR_DIR, 'version');
    if (fs.existsSync(versionFile)) {
      const extracted = fs.readFileSync(versionFile, 'utf8').trim().replace(/^v/, '');
      if (extracted !== version) {
        throw new Error(`버전 불일치: 압축 해제된 Electron ${extracted}, package.json ${version}`);
      }
    }
    fs.writeFileSync(path.join(VENDOR_DIR, '.electron-version'), `${version}\n`);
    console.log(`[install] 확인 완료: Electron ${version} (${platform}-${arch})`);
    return;
  }

  fs.rmSync(VENDOR_DIR, { recursive: true, force: true });
  fs.mkdirSync(VENDOR_DIR, { recursive: true });
  console.log(`[install] 압축 해제: ${path.basename(zipPath)} → vendor/electron`);
  extract(zipPath, VENDOR_DIR);

  if (!fs.existsSync(binary)) throw new Error(`압축 해제 후 실행 파일이 없습니다: ${binary}`);
  if (platform !== 'win32') fs.chmodSync(binary, 0o755);

  fs.writeFileSync(path.join(VENDOR_DIR, '.electron-version'), `${version}\n`);
  console.log(`[install] 완료: Electron ${version} (${platform}-${arch})`);
  const next = process.platform === 'win32' ? 'start.bat' : 'node scripts/run.js';
  console.log(`[install] 이제 \`${next}\` 로 실행하세요.`);
}

try {
  main();
} catch (err) {
  console.error(`[install] ${err.message}`);
  process.exit(1);
}
