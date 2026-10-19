'use strict';

// 폐쇄망 규칙 검사: 외부 패키지/외부 URL 사용 금지.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { isAllowedModule, findForbiddenRequires } = require('../scripts/check');

const ROOT = path.resolve(__dirname, '..');

test('허용 모듈 판별', () => {
  assert.equal(isAllowedModule('node:fs'), true);
  assert.equal(isAllowedModule('path'), true);
  assert.equal(isAllowedModule('fs/promises'), true);
  assert.equal(isAllowedModule('electron'), true);
  assert.equal(isAllowedModule('./ipc'), true);
  assert.equal(isAllowedModule('lodash'), false);
  assert.equal(isAllowedModule('@scope/pkg'), false);
});

test('src/ 의 모든 JS 는 외부 패키지를 쓰지 않는다', () => {
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(dir, e.name);
      return e.isDirectory() ? walk(full) : e.name.endsWith('.js') ? [full] : [];
    });
  for (const file of walk(path.join(ROOT, 'src'))) {
    assert.deepEqual(findForbiddenRequires(file), [], path.relative(ROOT, file));
  }
});

test('renderer HTML 은 외부 URL 리소스를 참조하지 않는다', () => {
  const html = fs.readFileSync(path.join(ROOT, 'src/renderer/index.html'), 'utf8');
  assert.doesNotMatch(html, /(src|href)\s*=\s*["']https?:\/\//i);
});
