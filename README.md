# Electron Offline Starter

**npm install 이 안 되는 폐쇄망(오프라인) 환경**용 Electron 기본 구성.
외부 npm 패키지 **0개**. Node 내장 모듈 + Electron 바이너리 + OS 기본 도구(unzip/tar)만 쓴다.

- Electron: **44.9.0** (`package.json` → `config.electronVersion` 에 고정)
- Node: 18 이상 (스크립트 실행용. 앱 실행 시에는 Electron 내장 Node 를 쓴다)
- 검증 완료: Linux x64 (오프라인 설치 → 실행 → IPC 왕복 → 패키징 → 패키징된 앱 실행)

> **이 문서를 읽는 로컬 LLM(AI 코딩 도우미)에게**
> 먼저 아래 [LLM 작업 규칙](#llm-작업-규칙-반드시-지킬-것) 섹션을 읽고 그대로 따를 것.
> 핵심: **이 환경은 인터넷이 없다. npm install, CDN, 외부 패키지를 절대 쓰지 않는다.**

---

## 목차

1. [빠른 시작](#빠른-시작)
2. [LLM 작업 규칙 (반드시 지킬 것)](#llm-작업-규칙-반드시-지킬-것)
3. [폴더 구조](#폴더-구조)
4. [명령어](#명령어)
5. [구조와 데이터 흐름](#구조와-데이터-흐름)
6. [작업 레시피](#작업-레시피)
7. [패키징 (배포본 만들기)](#패키징-배포본-만들기)
8. [폐쇄망 반입 파일](#폐쇄망-반입-파일)
9. [문제 해결](#문제-해결)

---

## 빠른 시작

### 1) 인터넷 PC 에서 (한 번만): Electron 바이너리 받기

```bash
node scripts/prepare-offline.js                               # 현재 OS/아키텍처
node scripts/prepare-offline.js --platform=win32 --arch=x64   # Windows 64bit 용
```

`offline/electron-v44.9.0-<플랫폼>-<아키텍처>.zip` 과 `offline/SHASUMS256.txt` 가 생긴다.
(직접 받아도 된다: https://github.com/electron/electron/releases/tag/v44.9.0)

### 2) 프로젝트 폴더 전체(`offline/` 포함)를 폐쇄망 PC 로 복사

### 3) 폐쇄망 PC 에서

```bash
node scripts/install-offline.js   # 체크섬 검증 → vendor/electron 에 압축 해제 (네트워크 사용 안 함)
node scripts/run.js               # 앱 실행
node scripts/run.js --dev         # DevTools 열고 실행
```

`npm run <스크립트>` 도 똑같이 동작한다 (`npm start`, `npm run dev` …). 네트워크 없이 위 스크립트를 부를 뿐이다.

### Electron 이 이미 다른 곳에 설치돼 있다면

```bash
ELECTRON_PATH=/opt/electron/electron node scripts/run.js                  # Linux/macOS
set ELECTRON_PATH=C:\tools\electron\electron.exe && node scripts\run.js   # Windows cmd
```

---

## LLM 작업 규칙 (반드시 지킬 것)

이 섹션은 로컬 LLM 도구(Continue, Cline, Open WebUI 등)의 시스템 프롬프트/규칙 파일에 그대로 붙여 넣어 써도 된다.

### 절대 금지

1. **`npm install`, `npm i`, `yarn add`, `pnpm add`, `npx` 를 제안하거나 실행하지 않는다.** 인터넷이 없어서 실패한다.
2. **`package.json` 의 `dependencies` / `devDependencies` 에 아무것도 추가하지 않는다.** 비어 있어야 한다 (`node scripts/check.js` 가 검사).
3. **외부 라이브러리를 쓰지 않는다.** (React, Vue, lodash, axios, electron-store, electron-builder, Jest, ESLint, TypeScript 컴파일러, Vite, Webpack 등)
4. **외부 URL 을 쓰지 않는다.** (CDN `<script src="https://...">`, Google Fonts, 외부 API). 모든 리소스는 로컬 파일.
5. **`nodeIntegration: true`, `contextIsolation: false`, `sandbox: false` 로 바꾸지 않는다.**
6. **렌더러에 `ipcRenderer` 를 통째로 노출하지 않는다.** `contextBridge` 로 기능별 함수만 노출한다.
7. **`preload.js` 에서 로컬 파일(`../main/...` 등)을 require 하지 않는다.** sandbox preload 는 `require('electron')` 만 된다.

### 써도 되는 것

| 용도 | 사용할 것 |
| --- | --- |
| 파일/경로/프로세스 | `node:fs`, `node:path`, `node:child_process`, `node:os`, `node:crypto` |
| HTTP (메인 프로세스) | `node:http`, `node:https`, 전역 `fetch`, Electron `net` |
| 테스트 | `node:test`, `node:assert/strict` |
| 정적 검사 (lint) | `node scripts/check.js` (문법 검사 + 외부 패키지 금지 검사) |
| UI | 순수 HTML/CSS/JS (DOM API). 프레임워크 없음 |
| 데이터 저장 | JSON 파일 (`app.getPath('userData')`), `settings:*` 예제 참고 |
| 모듈 형식 | **CommonJS** (`require` / `module.exports`). ESM `import` 쓰지 않음 |

### 코딩 규칙

- 모든 JS 파일 맨 위에 `'use strict';`
- Node 내장 모듈은 `node:` 접두사로 (`require('node:fs')`)
- 주석은 한국어로, 필요한 곳에만
- DOM 에 텍스트를 넣을 때는 `textContent`. 사용자 입력을 `innerHTML` 에 넣지 않는다
- IPC 채널 이름은 `영역:동작` 형식 (소문자, 하이픈). 예: `file:read-text`, `settings:get`
- IPC 는 **`invoke` / `handle`** (요청-응답) 패턴만 쓴다

### 변경 후 반드시 실행할 검증

```bash
node scripts/check.js          # 문법 + 외부 패키지 금지 + package.json deps 비어 있는지
node --test                    # 단위 테스트 (test/*.test.js)
node scripts/run.js --smoke    # 실제 Electron 실행 → 페이지 로드 + IPC 왕복 확인 후 종료 (종료 코드 0 = 통과)
```

화면이 없는 Linux 서버라면: `xvfb-run -a node scripts/run.js --smoke`

### 필요한 기능에 라이브러리가 필요해 보일 때

1. 먼저 **Node 내장 / Electron API / Web API** 로 해결할 수 있는지 확인한다 (대부분 된다).
2. 정말 필요하면, 파일은 사용자가 직접 반입해야 한다. **LLM 이 다운로드하지 않는다.**
   단일 파일 빌드(UMD/CJS)를 `src/vendor/<이름>/` 에 두고 상대 경로로 불러온다.
   `src/vendor/<이름>/README.md` 에 출처, 버전, 라이선스를 적는다.

---

## 폴더 구조

```
.
├── package.json              # 앱 정보 + Electron 버전(config.electronVersion). deps 는 비워 둔다
├── .npmrc                    # offline=true (레지스트리 접근 차단)
├── src/
│   ├── main/
│   │   ├── main.js           # 메인 프로세스 진입점: 창 생성, 보안 설정, 외부 네트워크 차단
│   │   └── ipc.js            # IPC 채널 정의(CHANNELS) + 핸들러  ← 새 기능은 여기에 추가
│   ├── preload/
│   │   └── preload.js        # contextBridge 로 window.api 노출  ← 새 기능은 여기에도 추가
│   └── renderer/
│       ├── index.html        # UI (CSP 적용, 외부 리소스 없음)
│       ├── renderer.js       # UI 로직. window.api.* 만 사용
│       └── styles.css        # 스타일 (시스템 폰트, 다크 모드 지원)
├── scripts/                  # 개발 도구 (전부 Node 내장 모듈만 사용)
│   ├── run.js                # Electron 찾아서 실행 (--dev, --smoke)
│   ├── install-offline.js    # [폐쇄망] offline/*.zip → vendor/electron
│   ├── prepare-offline.js    # [인터넷 PC] Electron zip 을 offline/ 에 다운로드
│   ├── package.js            # dist/ 에 배포용 폴더 생성
│   ├── check.js              # 정적 검사 (lint 대체)
│   └── lib/electron-paths.js # 버전/경로 헬퍼
├── test/                     # node:test 단위 테스트
├── offline/                  # 반입 파일(zip, SHASUMS256.txt). git 에 안 올라감
├── vendor/electron/          # 압축 해제된 Electron 런타임. git 에 안 올라감
└── dist/                     # 패키징 결과. git 에 안 올라감
```

---

## 명령어

| 명령 | npm 스크립트 | 설명 | 네트워크 |
| --- | --- | --- | --- |
| `node scripts/run.js` | `npm start` | 앱 실행 | 안 씀 |
| `node scripts/run.js --dev` | `npm run dev` | DevTools 열고 실행 | 안 씀 |
| `node scripts/run.js --smoke` | `npm run smoke` | 로드 + IPC 확인 후 자동 종료 | 안 씀 |
| `node scripts/check.js` | `npm run check` | 정적 검사 | 안 씀 |
| `node --test` | `npm test` | 단위 테스트 | 안 씀 |
| `node scripts/install-offline.js` | `npm run setup` | Electron 런타임 설치 | 안 씀 |
| `node scripts/package.js` | `npm run package` | 배포용 폴더 생성 | 안 씀 |
| `node scripts/prepare-offline.js` | `npm run prepare-offline` | Electron zip 다운로드 | **씀 (인터넷 PC 전용)** |

`install-offline.js` 옵션: `--zip=<경로>`, `--platform=win32`, `--arch=arm64`, `--skip-checksum`

---

## 구조와 데이터 흐름

```
┌──────────── Renderer (Chromium, sandbox) ─────────────┐
│ renderer.js  →  window.api.getSetting('note')         │
└───────────────────────┬───────────────────────────────┘
                        │ (contextBridge 로 노출)
┌──────────── Preload (sandbox) ────────────────────────┐
│ preload.js → ipcRenderer.invoke('settings:get', key)  │
└───────────────────────┬───────────────────────────────┘
                        │ IPC
┌──────────── Main (Node + Electron) ───────────────────┐
│ ipc.js → ipcMain.handle('settings:get', ...)          │
│        → 발신자 검증(file:// 만) → fs 읽기/쓰기        │
└───────────────────────────────────────────────────────┘
```

보안 설정 (`src/main/main.js`):

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- 렌더러의 `file:`, `data:`, `devtools:` **외 모든 요청 차단** (`blockNetwork`)
- 새 창(`window.open`), 페이지 이동 차단
- IPC 핸들러는 `file://` 페이지에서 온 요청만 받는다 (`assertTrustedSender`)
- `index.html` 에 CSP (`default-src 'self'`)

> 사내 서버(예: `http://10.0.0.5:8080`)와 통신해야 하면 **메인 프로세스에서** `fetch`/`net` 으로 호출하고
> 결과를 IPC 로 렌더러에 넘긴다. 렌더러 CSP 나 `blockNetwork` 를 풀지 않는다.

---

## 작업 레시피

### 레시피 1: 새 IPC 기능 추가 (가장 자주 하는 작업)

예: "텍스트 파일 읽기" 기능. **파일 3개를 모두 고쳐야 한다.**

**① `src/main/ipc.js`**: 채널 + 핸들러 추가

```js
const CHANNELS = {
  GET_APP_INFO: 'app:get-info',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  FILE_READ_TEXT: 'file:read-text',          // 추가
};

// registerIpcHandlers() 안에:
handle(CHANNELS.FILE_READ_TEXT, async (filePath) => {
  if (typeof filePath !== 'string') throw new TypeError('filePath must be a string');
  return fs.promises.readFile(filePath, 'utf8');
});
```

**② `src/preload/preload.js`**: **같은** 채널 추가 + 함수 노출

```js
const CHANNELS = {
  GET_APP_INFO: 'app:get-info',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  FILE_READ_TEXT: 'file:read-text',          // ipc.js 와 정확히 같아야 함
};

contextBridge.exposeInMainWorld('api', {
  // ...기존 함수...
  readTextFile: (filePath) => ipcRenderer.invoke(CHANNELS.FILE_READ_TEXT, filePath),
});
```

**③ `src/renderer/renderer.js`**: 사용

```js
const text = await window.api.readTextFile('/path/to/file.txt');
```

**④ 검증**: `node scripts/check.js && node --test && node scripts/run.js --smoke`
(①②의 채널이 다르면 `test/channels.test.js` 가 실패한다.)

### 레시피 2: 파일 열기 대화상자

메인(`ipc.js`)에서 `dialog` 사용:

```js
const { app, ipcMain, dialog, BrowserWindow } = require('electron');

handle(CHANNELS.DIALOG_OPEN_FILE, async () => {
  const win = BrowserWindow.getFocusedWindow();
  const { canceled, filePaths } = await dialog.showOpenDialog(win, { properties: ['openFile'] });
  return canceled ? null : filePaths[0];
});
```

참고: `handle(channel, fn)` 의 `fn` 에는 렌더러가 보낸 인자만 들어온다 (`event` 없음).

### 레시피 3: 메인 → 렌더러로 이벤트 보내기

```js
// main: win.webContents.send('progress:update', { percent: 50 });
// preload:
onProgress: (callback) => {
  const listener = (_event, data) => callback(data);
  ipcRenderer.on('progress:update', listener);
  return () => ipcRenderer.removeListener('progress:update', listener);  // 구독 해제 함수
},
// renderer: const off = window.api.onProgress((d) => console.log(d.percent));
```

### 레시피 4: 화면(페이지) 추가

- 간단한 경우: `index.html` 에 섹션을 추가하고 `hidden` 으로 전환 (단일 페이지).
- 별도 창: `src/renderer/` 에 HTML 을 추가하고 `main.js` 에서 **같은 `webPreferences`** 로 `BrowserWindow` 를 하나 더 만든다.
- 새 HTML 에도 같은 CSP `<meta>` 를 넣는다.

### 레시피 5: 사내 서버(예: 사내 LLM API) 호출

메인 프로세스에서 호출한다. 렌더러는 직접 요청하지 않는다.

```js
// ipc.js
handle(CHANNELS.LLM_CHAT, async (prompt) => {
  const res = await fetch('http://llm.internal:8000/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'local-model', messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`LLM 요청 실패: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
});
```

### 레시피 6: 테스트 작성

`test/<이름>.test.js` 파일에 `node:test` 로 작성한다. **`electron` 을 require 하지 않는 로직**은 별도 모듈(예: `src/main/lib/*.js`)로 빼야 테스트하기 쉽다.

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseSomething } = require('../src/main/lib/parse');

test('parseSomething 은 빈 입력을 처리한다', () => {
  assert.deepEqual(parseSomething(''), []);
});
```

---

## 패키징 (배포본 만들기)

```bash
node scripts/package.js
```

결과: `dist/<name>-<플랫폼>-<아키텍처>/`. **이 폴더를 통째로 zip 해서 배포한다.**

- 동작 방식: Electron 런타임 복사 → `resources/app/` 에 `package.json` + `src/` 넣기 (Electron 이 자동으로 이걸 실행).
- Windows/Linux: 실행 파일 이름이 `package.json` 의 `name` 으로 바뀐다 (`<name>.exe`).
- macOS: `Electron.app` 그대로 (이름 변경에는 Info.plist 수정이 필요).
- **현재 OS 용만 만든다.** Windows 배포본은 Windows 에서 Windows zip 을 설치한 뒤 실행한다.
- 최상위 폴더(예: `assets/`)를 새로 만들면 `scripts/package.js` 의 `APP_FILES` 에 추가한다.
- 지원 안 함 (외부 패키지가 필요): asar 묶기, 설치 프로그램(NSIS/MSI), 코드 서명, 자동 업데이트.
  필요하면 해당 도구를 따로 반입해야 한다.

---

## 폐쇄망 반입 파일

| 파일 | 받는 곳 | 위치 |
| --- | --- | --- |
| `electron-v44.9.0-<플랫폼>-<아키텍처>.zip` | `prepare-offline.js` 또는 GitHub Releases | `offline/` |
| `SHASUMS256.txt` | 같은 곳 (권장) | `offline/` |
| Node.js 18+ 설치 파일 | nodejs.org (Windows .msi / Linux tar.xz) | 폐쇄망 PC 에 설치 |

플랫폼-아키텍처 예: `win32-x64`, `win32-arm64`, `darwin-x64`, `darwin-arm64`, `linux-x64`, `linux-arm64`

사내 미러(Nexus/Artifactory)가 있다면:
`ELECTRON_MIRROR=https://nexus.internal/repository/electron/ node scripts/prepare-offline.js`

### Electron 버전 올리기

1. `package.json` 의 `config.electronVersion` 변경
2. 인터넷 PC 에서 `node scripts/prepare-offline.js` → 새 zip 반입
3. `node scripts/install-offline.js` → `node scripts/run.js --smoke`

---

## 문제 해결

| 증상 | 원인 / 해결 |
| --- | --- |
| `Electron 바이너리를 찾을 수 없습니다` | `vendor/electron` 없음. `offline/` 에 zip 넣고 `install-offline.js` 실행 |
| `zip 파일이 없습니다` | 파일 이름의 버전/플랫폼/아키텍처가 정확히 맞는지 확인. 또는 `--zip=<경로>` 지정 |
| `체크섬 불일치` | 반입 중 파일 손상. 다시 복사하거나, 출처를 신뢰하면 `--skip-checksum` |
| Linux: `The SUID sandbox helper binary ... not configured correctly` | `sudo chown root vendor/electron/chrome-sandbox && sudo chmod 4755 vendor/electron/chrome-sandbox`. 개발 중에만 `node scripts/run.js --no-sandbox` |
| Linux: `cannot open display` / 서버에서 안 뜸 | `xvfb-run -a node scripts/run.js` |
| Linux: `libnss3.so` 등 라이브러리 없음 | 사내 OS 저장소에서 시스템 라이브러리 설치 (`libnss3 libatk-bridge2.0-0 libgtk-3-0 libgbm1 libasound2` 등) |
| 렌더러: `window.api is undefined` | preload 오류. 대부분 preload 에서 로컬 파일을 require 해서 생김. `--dev` 로 콘솔 확인 |
| 렌더러: `Refused to load ... Content Security Policy` | 외부 리소스를 불러오려 함. 로컬 파일로 복사해서 쓴다 |
| `Untrusted IPC sender` | `file://` 가 아닌 페이지에서 IPC 호출. 로컬 HTML 만 로드한다 |
| npm: `ENOTCACHED` / `ETIMEDOUT` | 누군가 `npm install` 을 실행함. **이 프로젝트엔 필요 없다.** `node scripts/...` 명령을 쓴다 |
| 창이 안 뜨고 Node 처럼만 동작 | 환경변수 `ELECTRON_RUN_AS_NODE` 가 설정됨. `run.js` 는 자동으로 지우지만, 직접 실행할 땐 지운다 |
