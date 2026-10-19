@echo off
rem Build dist\<name>-win32-<arch>\ and dist\<name>-win32-<arch>.zip
setlocal
cd /d "%~dp0"
call scripts\win\find-node.cmd || (pause & exit /b 1)
"%NODE_EXE%" scripts\package.js --zip %*
set "ERR=%errorlevel%"
if "%~1"=="" pause
exit /b %ERR%
