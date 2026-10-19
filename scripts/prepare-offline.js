'use strict';

// [인터넷 되는 PC에서 실행] 폐쇄망 반입용 Electron zip 과 SHASUMS256.txt 를 offline/ 에 내려받는다.
// 사용법: node scripts/prepare-offline.js [--platform=win32,linux] [--arch=x64,arm64]
//   인자가 없으면 package.json 의 config.offlineTarget (기본 win32-x64) 을 받는다.
// 사내 미러가 있으면: ELECTRON_MIRROR=https://mirror.example.local/electron/ node scripts/prepare-offline.js
//   (미러 URL 형식: <MIRROR>v<버전>/electron-v<버전>-<플랫폼>-<아키텍처>.zip)

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { OFFLINE_DIR, readPackageJson, electronVersion, zipName, parseArgs } = require('./lib/electron-paths');

const DEFAULT_MIRROR = 'https://github.com/electron/electron/releases/download/';

async function download(url, dest) {
  if (typeof fetch !== 'function') throw new Error('Node 18 이상이 필요합니다 (내장 fetch 사용).');
  console.log(`[prepare] 다운로드: ${url}`);
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`다운로드 실패 (${res.status}): ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf;
}

function expectedHash(sums, name) {
  const line = sums.split(/\r?\n/).find((l) => l.trim().endsWith(name));
  return line ? line.trim().split(/\s+/)[0].toLowerCase() : null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const version = electronVersion();
  const [defaultPlatform, defaultArch] = (readPackageJson().config.offlineTarget || 'win32-x64').split('-');
  const platforms = String(args.platform || defaultPlatform).split(',');
  const arches = String(args.arch || defaultArch).split(',');
  let mirror = process.env.ELECTRON_MIRROR || DEFAULT_MIRROR;
  if (!mirror.endsWith('/')) mirror += '/';

  fs.mkdirSync(OFFLINE_DIR, { recursive: true });

  const sumsPath = path.join(OFFLINE_DIR, 'SHASUMS256.txt');
  const sums = (await download(`${mirror}v${version}/SHASUMS256.txt`, sumsPath)).toString('utf8');

  for (const platform of platforms) {
    for (const arch of arches) {
      const name = zipName(version, platform, arch);
      const buf = await download(`${mirror}v${version}/${name}`, path.join(OFFLINE_DIR, name));
      const expected = expectedHash(sums, name);
      const actual = crypto.createHash('sha256').update(buf).digest('hex');
      if (expected && expected !== actual) throw new Error(`체크섬 불일치: ${name}`);
      console.log(`[prepare] OK ${name} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
    }
  }

  console.log('\n[prepare] 완료. 아래 파일을 폐쇄망 PC 의 같은 프로젝트 offline/ 폴더로 옮기세요:');
  for (const f of fs.readdirSync(OFFLINE_DIR)) {
    if (f !== 'README.md') console.log(`  - offline/${f}`);
  }
}

main().catch((err) => {
  console.error(`[prepare] ${err.message}`);
  process.exit(1);
});
