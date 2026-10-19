@echo off
rem Run the app. Extra arguments are passed to Electron (e.g. start.bat --dev).
setlocal
cd /d "%~dp0"
call scripts\win\find-node.cmd || (pause & exit /b 1)
"%NODE_EXE%" scripts\run.js %*
