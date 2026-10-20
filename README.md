# Electron Offline Starter

**폐쇄망 Windows** 에서 Electron 앱을 개발하기 위한 기본 구성.
외부 npm 패키지 **0개**. Node 내장 모듈 + Electron 바이너리 + Windows 기본 도구(`tar.exe`)만 쓴다.

| 항목 | 값 |
| --- | --- |
| 대상 환경 | 폐쇄망 Windows 10/11 x64 |
| Electron | **44.9.0** (`package.json` → `config.electronVersion`, 내장 Node 24.x) |
| Node.js (폐쇄망 PC) | 24.16.0 설치됨 (없어도 동작: Electron 내장 Node 로 대체) |
| npm (폐쇄망 PC) | 11.13.0 설치됨. **이 프로젝트는 npm install 이 필요 없다** |
| 외부 의존성 | 없음 (`dependencies`, `devDependencies` 비어 있음) |

> **이 문서를 읽는 로컬 LLM(AI 코딩 도우미)에게**
> 먼저 [LLM 작업 규칙](#llm-작업-규칙-반드시-지킬-것)을 읽고 그대로 따를 것.
> 핵심: **인터넷이 없는 Windows 환경이다. npm install, CDN, 외부 패키지를 쓰지 않는다.**
> 명령 예시는 **Windows cmd / PowerShell** 기준으로 쓴다 (경로 구분자 `\`).

---

## 목차

1. [빠른 시작 (Windows)](#빠른-시작-windows)
2. [LLM 작업 규칙 (반드시 지킬 것)](#llm-작업-규칙-반드시-지킬-것)
3. [폴더 구조](#폴더-구조)
4. [명령어](#명령어)
5. [구조와 데이터 흐름](#구조와-데이터-흐름)
6. [작업 레시피](#작업-레시피)
7. [패키징 (배포본 만들기)](#패키징-배포본-만들기)
8. [폐쇄망 반입 파일](#폐쇄망-반입-파일)
9. [사내 npm 저장소에 대해](#사내-npm-저장소에-대해)
10. [문제 해결](#문제-해결)

---

## 빠른 시작 (Windows)

### 1) 인터넷 PC 에서 (한 번만): Electron 파일 2개 받기

브라우저로 아래 링크를 누르면 바로 받아진다. (파일 이름은 바꾸지 않는다)

- https://github.com/electron/electron/releases/download/v44.9.0/electron-v44.9.0-win32-x64.zip (약 120MB)
- https://github.com/electron/electron/releases/download/v44.9.0/SHASUMS256.txt

인터넷 PC 에 Node 가 있으면 저장소 폴더에서 `node scripts\prepare-offline.js` 한 줄로 받아도 된다 (체크섬 확인 + `offline\` 저장까지 자동).
자세한 내용(ARM64 PC, 체크섬 수동 확인, 반입 시 주의점)은 [폐쇄망 반입 파일](#폐쇄망-반입-파일) 참고.

### 2) 프로젝트 폴더 + 받은 파일을 폐쇄망 PC 로 옮기기

받은 두 파일은 프로젝트의 `offline\` 폴더에 넣는다:

```
offline\electron-v44.9.0-win32-x64.zip
offline\SHASUMS256.txt
```

### 3) 폐쇄망 PC 에서 (더블클릭 또는 cmd 에서 실행)

| 순서 | 파일 | 하는 일 |
| --- | --- | --- |
| 1 | `setup.bat` | zip 체크섬 검증 → `vendor\electron\` 에 압축 해제 (처음 한 번) |
| 2 | `start.bat` | 앱 실행 |
| - | `dev.bat` | DevTools 열고 실행 |
| - | `verify.bat` | 정적 검사 + 단위 테스트 + 실제 실행 확인 |
| - | `package.bat` | 배포본 `dist\...-win32-x64\` + `.zip` 생성 |

같은 걸 명령으로도 실행할 수 있다:

```bat
node scripts\install-offline.js
node scripts\run.js
npm start
```

`npm run <이름>` 은 네트워크를 쓰지 않고 위 스크립트를 부를 뿐이다.

---

## LLM 작업 규칙 (반드시 지킬 것)

이 섹션은 로컬 LLM 도구(Continue, Cline, Open WebUI 등)의 시스템 프롬프트나 규칙 파일에 그대로 붙여 넣어 써도 된다.

### 환경

- OS: **Windows** (cmd / PowerShell). 셸 명령은 Windows 문법으로 쓴다. `rm -rf`, `cp`, `export` 같은 bash 문법은 쓰지 않는다.
- 인터넷 없음. Node 24.16.0, npm 11.13.0 설치됨.
- 사내 npm 저장소가 있을 수 있지만 **어떤 패키지가 있는지 알 수 없다** → 패키지를 추가하지 않는다.

### 절대 금지

1. **`npm install`, `npm i`, `npx`, `yarn`, `pnpm` 을 제안하거나 실행하지 않는다.**
2. **`package.json` 의 `dependencies` / `devDependencies` 에 아무것도 추가하지 않는다.** (`node scripts\check.js` 가 검사해서 실패시킨다)
3. **외부 라이브러리를 쓰지 않는다.** (React, Vue, lodash, axios, electron-store, electron-builder, Jest, ESLint, TypeScript, Vite, Webpack 등)
4. **외부 URL 을 쓰지 않는다.** (CDN `<script src="https://...">`, Google Fonts, 외부 API). 모든 리소스는 로컬 파일.
5. **`nodeIntegration: true`, `contextIsolation: false`, `sandbox: false` 로 바꾸지 않는다.**
6. **렌더러에 `ipcRenderer` 를 통째로 노출하지 않는다.** `contextBridge` 로 기능별 함수만 노출한다.
7. **`preload.js` 에서 로컬 파일(`../main/...` 등)을 require 하지 않는다.** sandbox preload 는 `require('electron')` 만 된다.
8. **`.bat` / `.cmd` 파일에 한글을 쓰지 않는다.** cmd.exe 코드 페이지 문제로 깨진다. (JS 파일과 README 는 UTF-8 한글 OK)

### 써도 되는 것

| 용도 | 사용할 것 |
| --- | --- |
| 파일/경로/프로세스 | `node:fs`, `node:path`, `node:child_process`, `node:os`, `node:crypto` |
| 경로 만들기 | 항상 `path.join()` / `path.resolve()`. 문자열로 `'a/' + b` 하지 않는다 |
| HTTP (메인 프로세스) | 전역 `fetch`, `node:http`, `node:https` (Electron `net.fetch` 는 `blockNetwork` 에 막혀서 쓰지 않음) |
| 테스트 | `node:test`, `node:assert/strict` |
| 정적 검사 (lint) | `node scripts\check.js` (문법 + 외부 패키지 금지 검사) |
| UI | 순수 HTML/CSS/JS (DOM API). 프레임워크 없음 |
| 데이터 저장 | JSON 파일 (`app.getPath('userData')` = `%APPDATA%\electron-offline-starter`). `settings:*` 예제 참고 |
| 외부 프로그램 실행 | `child_process.spawn` / `execFile` (셸 문자열 조합 금지, 인자는 배열로) |
| 모듈 형식 | **CommonJS** (`require` / `module.exports`). ESM `import` 쓰지 않음 |

Node 24 / Electron 44 에서 쓸 수 있는 최신 JS 문법(`??`, `?.`, `structuredClone`, `fetch`, `AbortController`, top-level 이 아닌 `async/await` 등)은 자유롭게 써도 된다.

### 코딩 규칙

- 모든 JS 파일 맨 위에 `'use strict';`
- Node 내장 모듈은 `node:` 접두사로 (`require('node:fs')`)
- 주석은 한국어로, 필요한 곳에만
- DOM 에 텍스트를 넣을 때는 `textContent`. 사용자 입력을 `innerHTML` 에 넣지 않는다
- IPC 채널 이름은 `영역:동작` 형식 (소문자, 하이픈). 예: `file:read-text`, `settings:get`
- IPC 는 **`invoke` / `handle`** (요청-응답) 패턴만 쓴다

### 변경 후 반드시 실행할 검증

```bat
verify.bat
```

또는 하나씩:

```bat
node scripts\check.js          & rem 문법 + 외부 패키지 금지 + deps 비어 있는지
node --test                    & rem 단위 테스트 (test\*.test.js)
node scripts\run.js --smoke    & rem 실제 Electron 실행 → 페이지 로드 + IPC 왕복 확인 후 종료 (종료 코드 0 = 통과)
```

### 필요한 기능에 라이브러리가 필요해 보일 때

1. 먼저 **Node 내장 / Electron API / Web API** 로 해결할 수 있는지 확인한다 (대부분 된다).
2. 정말 필요하면 사용자에게 "이런 파일을 반입해야 한다"고 말한다. **LLM 이 설치·다운로드하지 않는다.**
   반입한 단일 파일 빌드(UMD/CJS)는 `src\vendor\<이름>\` 에 두고 상대 경로로 불러온다.
   `src\vendor\<이름>\README.md` 에 출처, 버전, 라이선스를 적는다.

---

## 폴더 구조

```
.
├── setup.bat                 # [Windows] Electron 런타임 설치 (처음 한 번)
├── start.bat                 # [Windows] 앱 실행
├── dev.bat                   # [Windows] DevTools 열고 실행
├── verify.bat                # [Windows] 검사 + 테스트 + 실행 확인
├── package.bat               # [Windows] 배포본 + zip 생성
├── package.json              # 앱 정보 + Electron 버전. deps 는 비워 둔다
├── .npmrc                    # offline=true (이 프로젝트에서 npm 이 레지스트리에 접속하지 않게)
├── .gitattributes            # .bat/.cmd 는 CRLF, 나머지는 LF
├── src\
│   ├── main\
│   │   ├── main.js           # 메인 프로세스 진입점: 창 생성, 보안 설정, 외부 네트워크 차단
│   │   └── ipc.js            # IPC 채널 정의(CHANNELS) + 핸들러  ← 새 기능은 여기에 추가
│   ├── preload\
│   │   └── preload.js        # contextBridge 로 window.api 노출  ← 새 기능은 여기에도 추가
│   └── renderer\
│       ├── index.html        # UI (CSP 적용, 외부 리소스 없음)
│       ├── renderer.js       # UI 로직. window.api.* 만 사용
│       └── styles.css        # 스타일 (맑은 고딕 등 시스템 폰트, 다크 모드 지원)
├── scripts\                  # 개발 도구 (전부 Node 내장 모듈만 사용)
│   ├── run.js                # Electron 찾아서 실행 (--dev, --smoke)
│   ├── install-offline.js    # [폐쇄망] offline\*.zip → vendor\electron
│   ├── prepare-offline.js    # [인터넷 PC] Electron zip 을 offline\ 에 다운로드
│   ├── package.js            # dist\ 에 배포본 생성 (--zip)
│   ├── check.js              # 정적 검사 (lint 대체)
│   ├── lib\electron-paths.js # 버전/경로 헬퍼
│   └── win\find-node.cmd     # .bat 용: Node 찾기 (없으면 Electron 내장 Node 사용)
├── test\                     # node:test 단위 테스트
├── offline\                  # 반입 파일(zip, SHASUMS256.txt). git 에 안 올라감
├── vendor\electron\          # 압축 해제된 Electron 런타임. git 에 안 올라감
└── dist\                     # 패키징 결과. git 에 안 올라감
```

---

## 명령어

| bat 파일 | 직접 실행 | npm 스크립트 | 설명 |
| --- | --- | --- | --- |
| `setup.bat` | `node scripts\install-offline.js` | `npm run setup` | Electron 런타임 설치 |
| `start.bat` | `node scripts\run.js` | `npm start` | 앱 실행 |
| `dev.bat` | `node scripts\run.js --dev` | `npm run dev` | DevTools 열고 실행 |
| `verify.bat` | (아래 3개) | `npm run verify` + `npm run smoke` | 전체 검증 |
| | `node scripts\check.js` | `npm run check` | 정적 검사 |
| | `node --test` | `npm test` | 단위 테스트 |
| | `node scripts\run.js --smoke` | `npm run smoke` | 로드 + IPC 확인 후 자동 종료 |
| `package.bat` | `node scripts\package.js --zip` | `npm run package` | 배포본 생성 |
| (인터넷 PC) | `node scripts\prepare-offline.js` | `npm run prepare-offline` | Electron zip 다운로드 |

`install-offline.js` 옵션: `--zip=<경로>`, `--arch=arm64`, `--skip-checksum`

bat 파일은 인자 없이 더블클릭하면 끝에 `pause` 로 창을 잡아 둔다. 인자를 주면(예: `setup.bat --skip-checksum`) pause 하지 않는다.

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

보안 설정 (`src\main\main.js`):

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- 렌더러의 `file:`, `data:`, `devtools:` **외 모든 요청 차단** (`blockNetwork`)
- 새 창(`window.open`), 페이지 이동 차단
- IPC 핸들러는 `file://` 페이지에서 온 요청만 받는다 (`assertTrustedSender`)
- `index.html` 에 CSP (`default-src 'self'`)

> 사내 서버(예: `http://10.0.0.5:8080`)와 통신해야 하면 **메인 프로세스에서** `fetch` 로 호출하고
> 결과를 IPC 로 렌더러에 넘긴다. 렌더러 CSP 나 `blockNetwork` 를 풀지 않는다.

---

## 작업 레시피

### 레시피 1: 새 IPC 기능 추가 (가장 자주 하는 작업)

예: "텍스트 파일 읽기" 기능. **파일 3개를 모두 고쳐야 한다.**

**① `src\main\ipc.js`**: 채널 + 핸들러 추가

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

**② `src\preload\preload.js`**: **같은** 채널 추가 + 함수 노출

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

**③ `src\renderer\renderer.js`**: 사용

```js
const text = await window.api.readTextFile('C:\\data\\memo.txt');
```

**④ 검증**: `verify.bat`
(①②의 채널이 다르면 `test\channels.test.js` 가 실패한다.)

### 레시피 2: 파일 열기 대화상자

메인(`ipc.js`)에서 `dialog` 사용:

```js
const { app, ipcMain, dialog, BrowserWindow } = require('electron');

handle(CHANNELS.DIALOG_OPEN_FILE, async () => {
  const win = BrowserWindow.getFocusedWindow();
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [{ name: '텍스트', extensions: ['txt', 'csv'] }],
  });
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
- 별도 창: `src\renderer\` 에 HTML 을 추가하고 `main.js` 에서 **같은 `webPreferences`** 로 `BrowserWindow` 를 하나 더 만든다.
- 새 HTML 에도 같은 CSP `<meta>` 를 넣는다.

### 레시피 5: 사내 서버(예: 사내 LLM API) 호출

메인 프로세스에서 **전역 `fetch`(Node)** 로 호출한다. 렌더러는 직접 요청하지 않는다.

- 전역 `fetch` → `blockNetwork` 영향 없음. 사내 서버 호출 OK (검증함)
- Electron `net.fetch` → 렌더러와 같은 세션을 타서 `blockNetwork` 에 **막힌다** (`net::ERR_BLOCKED_BY_CLIENT`). 쓰지 않는다.

```js
// ipc.js
handle(CHANNELS.LLM_CHAT, async (prompt) => {
  const res = await fetch('http://llm.internal:8000/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'local-model', messages: [{ role: 'user', content: prompt }] }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`LLM 요청 실패: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
});
```

사내 서버가 사설 인증서(HTTPS)를 쓰면 `fetch failed` (원인 `SELF_SIGNED_CERT_IN_CHAIN` 등)가 난다.
Node 의 `fetch` 는 Windows 인증서 저장소를 보지 않는다. **검증을 끄지 말고**(`NODE_TLS_REJECT_UNAUTHORIZED=0` 금지) 사내 루트 인증서(PEM)를 지정한다:

```bat
set NODE_EXTRA_CA_CERTS=C:\certs\company-root-ca.pem
start.bat
```

(Electron 44.9.0 메인 프로세스에서 동작 확인함. 배포본에서는 사용자 환경변수로 설정하거나 바로가기 실행 스크립트에서 설정한다.)

### 레시피 6: Windows 프로그램 실행

```js
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

handle(CHANNELS.SYSTEM_HOSTNAME, async () => {
  const { stdout } = await promisify(execFile)('hostname', [], { windowsHide: true });
  return stdout.trim();
});
```

명령을 문자열로 이어 붙여 `exec` 하지 않는다 (명령 주입 위험). 인자는 배열로 넘긴다.

### 레시피 7: 테스트 작성

`test\<이름>.test.js` 에 `node:test` 로 작성한다. **`electron` 을 require 하지 않는 로직**은 별도 모듈(예: `src\main\lib\*.js`)로 빼야 테스트하기 쉽다.

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

```bat
package.bat
```

결과:

```
dist\electron-offline-starter-win32-x64\
├── electron-offline-starter.exe     ← 실행 파일 (electron.exe 이름 변경)
├── resources\app\                   ← package.json + src\
└── ... (Electron 런타임 파일)
dist\electron-offline-starter-win32-x64.zip
```

- 받는 사람은 zip 을 풀고 `.exe` 를 실행하면 된다. 설치 과정 없음.
- 실행 파일 이름은 `package.json` 의 `name` 을 따른다.
- 최상위 폴더(예: `assets\`)를 새로 만들면 `scripts\package.js` 의 `APP_FILES` 에 추가한다.
- 지원 안 함 (외부 도구 필요): exe 아이콘/버전 정보 변경(rcedit), asar 묶기, 설치 프로그램(NSIS/MSI), 코드 서명, 자동 업데이트.

---

## 폐쇄망 반입 파일

인터넷 되는 PC 에서 받아서 폐쇄망 PC 의 `offline\` 폴더에 넣는다. git 에는 올라가지 않는다 (용량이 커서 `.gitignore` 처리).

### 받을 파일

| 파일 | 직접 다운로드 링크 | 크기 |
| --- | --- | --- |
| `electron-v44.9.0-win32-x64.zip` | https://github.com/electron/electron/releases/download/v44.9.0/electron-v44.9.0-win32-x64.zip | 약 120MB |
| `SHASUMS256.txt` | https://github.com/electron/electron/releases/download/v44.9.0/SHASUMS256.txt | 수 KB |

- 공식 릴리스 페이지: https://github.com/electron/electron/releases/tag/v44.9.0 (아래쪽 **Assets** 를 펼치면 같은 파일이 있다)
- **파일 이름을 바꾸지 않는다.** `setup.bat` 이 이 이름으로 찾는다.
- 폐쇄망 PC 에 Node 24.16.0 이 이미 있으므로 Node 설치 파일은 필요 없다.

### 폐쇄망 PC 에 넣는 위치

```
<프로젝트 폴더>\
└── offline\
    ├── electron-v44.9.0-win32-x64.zip
    └── SHASUMS256.txt
```

그다음 `setup.bat` 실행 → 체크섬 검증과 압축 해제를 자동으로 한다.

### PC 아키텍처 확인 (x64 / ARM64)

폐쇄망 PC 의 cmd 에서:

```bat
echo %PROCESSOR_ARCHITECTURE%
```

| 결과 | 받을 파일 |
| --- | --- |
| `AMD64` (대부분) | `electron-v44.9.0-win32-x64.zip` |
| `ARM64` | `electron-v44.9.0-win32-arm64.zip` (링크의 `x64` 를 `arm64` 로 바꿔서 받는다) |

### 반입 시 주의

- USB / 망연계 시스템으로 옮길 때, zip 안에 `electron.exe` 가 있어서 **실행 파일 반입 검사에 걸릴 수 있다.** 회사 반입 승인 절차를 따른다.
- 백신이 `electron.exe` 를 격리하면 보안 담당자에게 예외 등록을 요청한다 ([문제 해결](#문제-해결) 참고).

### 체크섬 수동 확인 (선택)

`setup.bat` 이 자동으로 확인하지만, 반입 직후 직접 확인하려면:

```bat
certutil -hashfile offline\electron-v44.9.0-win32-x64.zip SHA256
```

출력된 값이 `SHASUMS256.txt` 의 `electron-v44.9.0-win32-x64.zip` 줄 앞의 값과 같으면 정상이다 (대소문자 무시).

### 다른 방법

**인터넷 PC 에 Node 가 있을 때** (저장소 폴더에서):

```bat
node scripts\prepare-offline.js
```

두 파일을 받고 체크섬까지 확인해서 `offline\` 에 넣어 준다. 기본 대상은 `package.json` 의 `config.offlineTarget` (= `win32-x64`). ARM64 는 `--arch=arm64`.

**사내 미러(Nexus/Artifactory 의 raw/GitHub 프록시)에 Electron 이 있을 때**는 인터넷 PC 없이 받을 수도 있다. 미러가 있는지, 주소가 뭔지는 사내 담당자에게 확인한다:

```bat
set ELECTRON_MIRROR=https://nexus.example.local/repository/electron/
node scripts\prepare-offline.js
```

(미러 URL 형식: `<MIRROR>v44.9.0/electron-v44.9.0-win32-x64.zip`)

### Electron 버전 올리기

1. `package.json` 의 `config.electronVersion` 변경
2. 새 zip + `SHASUMS256.txt` 반입 → `offline\` 에 넣기
3. `setup.bat` → `verify.bat`

---

## 사내 npm 저장소에 대해

폐쇄망 PC 에 npm 11.13.0 이 있고, 사내 npm 저장소(Nexus 등)가 연결돼 있을 수 있다. 그래도 이 프로젝트는 **일부러 npm 패키지를 쓰지 않는다.**

- 사내 저장소에 어떤 패키지/버전이 있는지 보장되지 않는다.
- `electron` npm 패키지는 설치 중에 **GitHub 에서 바이너리를 다시 내려받으려 해서** 폐쇄망에서 실패한다.
- 의존성이 0개면 폴더 복사만으로 어느 PC 에서나 똑같이 동작한다.

프로젝트의 `.npmrc` 는 `offline=true` 라서 이 폴더 안에서는 npm 이 레지스트리에 접속하지 않는다. (`npm start`, `npm test` 같은 스크립트 실행은 문제없음)

**사내 저장소의 패키지를 꼭 써야 한다면** (사람이 판단할 일, LLM 이 결정하지 않는다):

1. 저장소에 있는지 확인: `npm view <패키지> version --offline=false`
2. 프로젝트 `.npmrc` 에서 `offline=true` 줄을 지우고 `registry=<사내 저장소 URL>` 추가
3. `scripts\check.js` 의 의존성 금지 검사를 그 패키지만 허용하도록 수정
4. 이 README 의 LLM 규칙에 "허용 패키지 목록"을 추가

---

## 문제 해결

| 증상 | 원인 / 해결 |
| --- | --- |
| `Electron 바이너리를 찾을 수 없습니다` | `vendor\electron` 없음. `offline\` 에 zip 넣고 `setup.bat` |
| `zip 파일이 없습니다` | 파일 이름의 버전/아키텍처가 `package.json` 과 정확히 맞는지 확인. 또는 `--zip=<경로>` |
| `체크섬 불일치` | 반입 중 파일 손상. 다시 복사. 출처를 신뢰하면 `setup.bat --skip-checksum` |
| `버전 불일치` | `offline\` 의 zip 버전과 `package.json` 의 `electronVersion` 이 다름. 둘을 맞춘다 |
| `tar: Cannot connect to C: resolve failed` | Git Bash 의 GNU tar 가 실행됨. `setup.bat` 은 `C:\Windows\System32\tar.exe` 를 직접 쓰므로 cmd 에서 `setup.bat` 실행 |
| exe 실행 시 "Windows 의 PC 보호" (SmartScreen) | 서명 안 된 exe 라서 나옴. "추가 정보 → 실행". 사내 배포 시 보안팀에 예외 등록 요청 |
| `electron.exe` 가 사라짐 / 실행 차단 | 백신이 격리했거나 AppLocker/WDAC 정책. 보안 담당자에게 `vendor\electron\` 또는 배포 폴더 예외 요청 |
| PowerShell 에서 `npm` 실행 시 "스크립트를 실행할 수 없으므로" | 실행 정책이 `npm.ps1` 을 막음. `npm.cmd start` 처럼 쓰거나 cmd 에서 실행. 또는 `.bat` 파일 사용 |
| bat 실행 시 한글이 깨짐 | bat 파일에 한글을 넣었음. bat 은 영문만 쓴다 (규칙 8) |
| 렌더러: `window.api is undefined` | preload 오류. 대부분 preload 에서 로컬 파일을 require 해서 생김. `dev.bat` 으로 콘솔 확인 |
| 렌더러: `Refused to load ... Content Security Policy` | 외부 리소스를 불러오려 함. 로컬 파일로 복사해서 쓴다 |
| `Untrusted IPC sender` | `file://` 가 아닌 페이지에서 IPC 호출. 로컬 HTML 만 로드한다 |
| npm: `ENOTCACHED` / `ETIMEDOUT` | 누군가 `npm install` 을 실행함. **이 프로젝트엔 필요 없다** |
| 창이 안 뜨고 Node 처럼만 동작 | 환경변수 `ELECTRON_RUN_AS_NODE` 가 남아 있음. `set ELECTRON_RUN_AS_NODE=` 로 지운다 (`run.js` 는 자동으로 지움) |
| 설정 파일 위치 | `%APPDATA%\electron-offline-starter\settings.json` |

### 참고: Linux / macOS 에서 쓸 때

같은 스크립트가 Linux/macOS 에서도 동작한다 (Linux x64 에서 실제 실행 검증함).
`prepare-offline.js --platform=linux --arch=x64` 로 받고 `node scripts/install-offline.js` → `node scripts/run.js`.
화면 없는 Linux 서버에서는 `xvfb-run -a node scripts/run.js --smoke`.
