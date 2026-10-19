'use strict';

// main/ipc.js 와 preload/preload.js 의 CHANNELS 정의가 같은지 검사한다.
// (sandbox preload 는 로컬 파일을 require 할 수 없어 채널을 양쪽에 따로 적기 때문)

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function extractChannels(relPath) {
  const src = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const match = src.match(/const CHANNELS = (\{[\s\S]*?\});/);
  assert.ok(match, `${relPath} 에서 CHANNELS 정의를 찾지 못함`);
  return new Function(`return ${match[1]}`)();
}

test('main 과 preload 의 IPC 채널 정의가 일치한다', () => {
  const main = extractChannels('src/main/ipc.js');
  const preload = extractChannels('src/preload/preload.js');
  assert.deepEqual(preload, main);
});

test('IPC 채널 이름은 "영역:동작" 형식이다', () => {
  const main = extractChannels('src/main/ipc.js');
  for (const name of Object.values(main)) {
    assert.match(name, /^[a-z]+:[a-z-]+$/);
  }
});
