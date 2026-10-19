@echo off
rem Run the app with DevTools open.
setlocal
cd /d "%~dp0"
call scripts\win\find-node.cmd || (pause & exit /b 1)
"%NODE_EXE%" scripts\run.js --dev %*
