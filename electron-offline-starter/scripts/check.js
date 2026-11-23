'use strict';

// 정적 검사 (ESLint 대체, 의존성 없음).
//  1) 모든 .js 파일 문법 검사 (node --check)
//  2) src/ 에서 npm 패키지 require 금지 (Node 내장, 'electron', 상대 경로만 허용)
//  3) package.json 에 dependencies/devDependencies 가 비어 있는지 확인
// 사용법: node scripts/check.js

const fs = require('node:fs');
const path = require('node:path');
const { builtinModules } = require('node:module');
const { spawnSync } = require('node:child_process');
const { ROOT, readPackageJson } = require('./lib/electron-paths');

const SCAN_DIRS = ['src', 'scripts', 'test'];
const BUILTINS = new Set(builtinModules);

function listJsFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listJsFiles(full));
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

function isAllowedModule(spec) {
  if (spec.startsWith('.') || spec.startsWith('/')) return true;
  if (spec === 'electron') return true;
  // 'node:' 접두사는 항상 내장 모듈 ('node:test' 처럼 접두사로만 쓸 수 있는 모듈 포함).
  if (spec.startsWith('node:')) return true;
  return BUILTINS.has(spec) || BUILTINS.has(spec.split('/')[0]);
}

function findForbiddenRequires(file) {
  const src = fs.readFileSync(file, 'utf8');
  const re = /\brequire\(\s*['"]([^'"]+)['"]\s*\)|\bfrom\s+['"]([^'"]+)['"]/g;
  const bad = [];
  let m;
  while ((m = re.exec(src))) {
    const spec = m[1] || m[2];
    if (!isAllowedModule(spec)) bad.push(spec);
  }
  return bad;
}

function main() {
  const errors = [];

  const files = SCAN_DIRS.flatMap((d) => listJsFiles(path.join(ROOT, d)));
  for (const file of files) {
    const res = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (res.status !== 0) errors.push(`문법 오류: ${path.relative(ROOT, file)}\n${res.stderr}`);

    // scripts/run.js 는 선택적으로 node_modules/electron 을 찾으므로 'electron' 허용 규칙으로 통과한다.
    for (const spec of findForbiddenRequires(file)) {
      errors.push(`외부 패키지 사용 금지: ${path.relative(ROOT, file)} → '${spec}'`);
    }
  }

  const pkg = readPackageJson();
  for (const key of ['dependencies', 'devDependencies']) {
    if (pkg[key] && Object.keys(pkg[key]).length > 0) {
      errors.push(`package.json ${key} 는 비어 있어야 합니다 (폐쇄망 규칙): ${Object.keys(pkg[key]).join(', ')}`);
    }
  }

  if (errors.length) {
    console.error(errors.join('\n'));
    console.error(`\n[check] 실패 (${errors.length}건)`);
    process.exit(1);
  }
  console.log(`[check] OK (${files.length}개 파일)`);
}

if (require.main === module) main();

module.exports = { isAllowedModule, findForbiddenRequires };
