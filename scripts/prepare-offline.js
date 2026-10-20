'use strict';

// Electron zip 과 SHASUMS256.txt 를 offline/ 에 내려받는다.
//  - 인터넷 PC 에서 받아 반입하거나,
//  - 사내 프록시/미러를 쓸 수 있으면 폐쇄망 PC 에서 직접 받는다 (download.bat).
// 사용법: node scripts/prepare-offline.js [--platform=win32,linux] [--arch=x64,arm64]
//   인자가 없으면 package.json 의 config.offlineTarget (기본 win32-x64) 을 받는다.
//
// 환경변수 (electron npm 패키지와 같은 이름이라 사내 안내를 그대로 쓸 수 있다):
//   HTTPS_PROXY / HTTP_PROXY / NO_PROXY  사내 HTTP 프록시 (Node 24+ 에서 자동 적용)
//   ELECTRON_MIRROR                      사내 미러 주소 (기본: GitHub Releases)
//   ELECTRON_CUSTOM_DIR                  미러의 버전 폴더 형식 (기본: v{{ version }})
//   NODE_USE_SYSTEM_CA=1                 Windows 인증서 저장소 신뢰 (사내 TLS 검사 프록시용, Node 24.6+)

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const {
  OFFLINE_DIR,
  readPackageJson,
  electronVersion,
  zipName,
  electronDownloadUrl,
  parseArgs,
} = require('./lib/electron-paths');

function proxyFromEnv() {
  const env = process.env;
  return env.HTTPS_PROXY || env.https_proxy || env.HTTP_PROXY || env.http_proxy || '';
}

// Node 의 fetch 는 기본으로 HTTPS_PROXY 를 무시한다. Node 24+ 는 NODE_USE_ENV_PROXY=1 로 켤 수 있는데
// 시작할 때만 읽으므로, 프록시가 설정돼 있으면 그 값을 켜서 자기 자신을 다시 실행한다.
function relaunchWithEnvProxyIfNeeded() {
  if (!proxyFromEnv() || process.env.NODE_USE_ENV_PROXY === '1') return;
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 24) {
    console.warn(`[prepare] HTTPS_PROXY 가 설정됐지만 Node ${process.versions.node} 는 fetch 프록시를 지원하지 않습니다 (Node 24+ 필요).`);
    return;
  }
  const result = spawnSync(process.execPath, [__filename, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, NODE_USE_ENV_PROXY: '1' },
  });
  process.exit(result.status ?? 1);
}

// 네트워크 오류를 사람이 알아볼 수 있는 안내로 바꾼다.
function explain(err, url) {
  const code = (err.cause && err.cause.code) || err.code || '';
  const lines = [`다운로드 실패: ${url}`, `  원인: ${code || err.message}`];
  if (/CERT|SELF_SIGNED|UNABLE_TO_GET_ISSUER/.test(code)) {
    lines.push('  → 사내 프록시가 TLS 를 검사하는 경우입니다. NODE_USE_SYSTEM_CA=1 (Windows 인증서 저장소 사용)');
    lines.push('    또는 NODE_EXTRA_CA_CERTS=<사내 루트 인증서.pem> 을 설정하세요.');
  } else if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ECONNRESET|EAI_AGAIN|UND_ERR_CONNECT/.test(code)) {
    if (process.env.ELECTRON_MIRROR) {
      lines.push('  → ELECTRON_MIRROR 주소가 맞는지, 이 PC 에서 접속되는지 확인하세요.');
    } else if (proxyFromEnv()) {
      lines.push(`  → 프록시(${proxyFromEnv()})가 이 주소를 허용하는지 확인하세요.`);
      lines.push('    GitHub 는 release-assets.githubusercontent.com 으로 리다이렉트하므로 그 주소도 허용돼야 합니다.');
    } else {
      lines.push('  → 외부 접속이 막혀 있습니다. local-env.bat 에 HTTPS_PROXY 또는 ELECTRON_MIRROR 를 설정하세요 (README 참고).');
    }
  }
  return new Error(lines.join('\n'));
}

async function download(url, dest) {
  if (typeof fetch !== 'function') throw new Error('Node 18 이상이 필요합니다 (내장 fetch 사용).');
  console.log(`[prepare] 다운로드: ${url}`);
  let res;
  try {
    res = await fetch(url, { redirect: 'follow' });
  } catch (err) {
    throw explain(err, url);
  }
  if (!res.ok) {
    let hint = '';
    if (res.status === 404 && process.env.ELECTRON_MIRROR) {
      hint = '\n  → 미러의 폴더 형식이 다를 수 있습니다. 폴더가 "44.9.0" 처럼 v 없이 되어 있으면 ELECTRON_CUSTOM_DIR={{ version }}';
    } else if (res.status === 407) {
      hint = '\n  → 프록시 인증이 필요합니다. HTTPS_PROXY=http://아이디:비밀번호@프록시주소:포트';
    }
    throw new Error(`다운로드 실패 (HTTP ${res.status}): ${url}${hint}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf;
}

function expectedHash(sums, name) {
  const line = sums.split(/\r?\n/).find((l) => l.trim().endsWith(name));
  return line ? line.trim().split(/\s+/)[0].toLowerCase() : null;
}

async function main() {
  relaunchWithEnvProxyIfNeeded();

  const args = parseArgs(process.argv.slice(2));
  const version = electronVersion();
  const [defaultPlatform, defaultArch] = (readPackageJson().config.offlineTarget || 'win32-x64').split('-');
  const platforms = String(args.platform || defaultPlatform).split(',');
  const arches = String(args.arch || defaultArch).split(',');

  if (proxyFromEnv()) console.log(`[prepare] 프록시 사용: ${proxyFromEnv()}`);
  if (process.env.ELECTRON_MIRROR) console.log(`[prepare] 미러 사용: ${process.env.ELECTRON_MIRROR}`);

  fs.mkdirSync(OFFLINE_DIR, { recursive: true });

  const sumsPath = path.join(OFFLINE_DIR, 'SHASUMS256.txt');
  const sums = (await download(electronDownloadUrl('SHASUMS256.txt', version), sumsPath)).toString('utf8');

  for (const platform of platforms) {
    for (const arch of arches) {
      const name = zipName(version, platform, arch);
      const buf = await download(electronDownloadUrl(name, version), path.join(OFFLINE_DIR, name));
      const expected = expectedHash(sums, name);
      const actual = crypto.createHash('sha256').update(buf).digest('hex');
      if (!expected) console.warn(`[prepare] 경고: SHASUMS256.txt 에 ${name} 항목이 없어 검증하지 못했습니다.`);
      if (expected && expected !== actual) throw new Error(`체크섬 불일치: ${name}`);
      console.log(`[prepare] OK ${name} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
    }
  }

  console.log('\n[prepare] 완료. 받은 파일:');
  for (const f of fs.readdirSync(OFFLINE_DIR)) {
    if (f !== 'README.md') console.log(`  - offline/${f}`);
  }
  console.log('폐쇄망 PC 에서 받았다면 이어서 setup.bat, 인터넷 PC 에서 받았다면 offline/ 폴더째 반입하세요.');
}

main().catch((err) => {
  console.error(`[prepare] ${err.message}`);
  process.exit(1);
});
