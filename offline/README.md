# offline/

폐쇄망 반입 파일을 두는 폴더 (git 에는 이 README 만 올라감).

필요한 파일 (Electron 버전은 `package.json` 의 `config.electronVersion`):

```
offline/
├── electron-v44.9.0-win32-x64.zip     # 대상 OS/아키텍처에 맞는 것
└── SHASUMS256.txt                     # 체크섬 검증용 (권장)
```

- 인터넷 PC: `node scripts/prepare-offline.js --platform=win32,linux --arch=x64`
- 수동 다운로드: https://github.com/electron/electron/releases/tag/v44.9.0
- 폐쇄망 PC: `node scripts/install-offline.js`
