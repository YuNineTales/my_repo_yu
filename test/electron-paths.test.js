'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {
  electronVersion,
  zipName,
  binaryRelativePath,
  resourcesRelativePath,
  parseArgs,
} = require('../scripts/lib/electron-paths');

test('package.json 에 Electron 버전이 고정되어 있다', () => {
  assert.match(electronVersion(), /^\d+\.\d+\.\d+$/);
});

test('zip 파일 이름 규칙', () => {
  assert.equal(zipName('1.2.3', 'win32', 'x64'), 'electron-v1.2.3-win32-x64.zip');
});

test('플랫폼별 실행 파일/리소스 경로', () => {
  assert.equal(binaryRelativePath('win32'), 'electron.exe');
  assert.equal(binaryRelativePath('linux'), 'electron');
  assert.equal(binaryRelativePath('darwin'), path.join('Electron.app', 'Contents', 'MacOS', 'Electron'));
  assert.equal(resourcesRelativePath('linux'), 'resources');
  assert.equal(resourcesRelativePath('darwin'), path.join('Electron.app', 'Contents', 'Resources'));
});

test('인자 파싱', () => {
  assert.deepEqual(parseArgs(['--arch=arm64', '--skip-checksum', 'x']), { arch: 'arm64', 'skip-checksum': true });
  assert.deepEqual(parseArgs(['--zip=C:\\a=b\\x.zip']), { zip: 'C:\\a=b\\x.zip' });
});
