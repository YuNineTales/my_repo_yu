# my_repo_yu

여러 개의 작은 프로젝트를 모아 두는 저장소. 필요한 프로젝트 **폴더 하나를 통째로** 회사(폐쇄망) PC 로 옮겨서 쓴다.

## 프로젝트 목록

| 폴더 | 설명 | 대상 환경 |
| --- | --- | --- |
| [`electron-offline-starter/`](electron-offline-starter/) | npm 없이 개발·실행·패키징하는 Electron 기본 구성 + 로컬 LLM 용 README | 폐쇄망 Windows (Node 24) |

## 규칙

1. **프로젝트 하나 = 최상위 폴더 하나.** 폴더 안에서 완결되게 만든다.
   - `README.md`, `.gitignore`, 설정 파일, 스크립트를 전부 그 폴더 안에 둔다.
   - 다른 프로젝트 폴더나 저장소 루트의 파일을 참조하지 않는다.
   - 폴더 이름은 영문 소문자 + 하이픈 (`my-tool`, `log-viewer` 등).
2. **커밋도 프로젝트 단위로.** 한 커밋에 여러 프로젝트를 섞지 않는다. 커밋 메시지 앞에 폴더 이름을 붙인다.
   ```
   electron-offline-starter: 사내 프록시 다운로드 지원
   log-viewer: 첫 구성
   ```
3. **사내 정보는 올리지 않는다.** 이 저장소는 **public** 이다. 사내 서버/프록시 주소, 계정, 사내 코드·데이터는 git 에 올라가는 파일에 쓰지 않는다 (각 프로젝트의 git 제외 설정 파일 사용).
4. 새 프로젝트를 만들면 위 **프로젝트 목록** 표에 한 줄 추가한다.

## 프로젝트 하나만 가져가기

**방법 1: 전체 ZIP 에서 폴더만 꺼내기 (가장 쉬움)**

GitHub 저장소 페이지 → **Code** → **Download ZIP** → 압축을 풀고 필요한 프로젝트 폴더만 복사.

**방법 2: git 으로 그 폴더만 받기 (sparse checkout)**

```bat
git clone --filter=blob:none --sparse https://github.com/YuNineTales/my_repo_yu.git
cd my_repo_yu
git sparse-checkout set electron-offline-starter
```

**방법 3: 그 폴더만 zip 으로 만들기 (git 이 있는 PC 에서)**

```bat
git archive --format=zip -o electron-offline-starter.zip HEAD:electron-offline-starter
```

`HEAD:<폴더>` 로 지정하면 zip 안에 상위 폴더 없이 프로젝트 내용만 들어간다.
