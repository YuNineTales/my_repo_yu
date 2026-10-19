@echo off
rem Sets NODE_EXE for the calling .bat (caller must use setlocal).
rem 1) Installed Node.js (node.exe on PATH)
rem 2) Fallback: Electron's bundled Node (vendor\electron\electron.exe + ELECTRON_RUN_AS_NODE=1)
rem    -> Node.js does not need to be installed on the offline PC.
set "NODE_EXE="
where node >nul 2>nul
if not errorlevel 1 (
  set "NODE_EXE=node"
  goto :eof
)
if exist "%~dp0..\..\vendor\electron\electron.exe" (
  set "ELECTRON_RUN_AS_NODE=1"
  set "NODE_EXE=%~dp0..\..\vendor\electron\electron.exe"
  goto :eof
)
echo [error] Neither Node.js nor vendor\electron\electron.exe was found. Run setup.bat first.
exit /b 1
