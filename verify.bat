@echo off
rem Static check + unit tests + smoke test (launch Electron, check page load and IPC, then exit).
setlocal
cd /d "%~dp0"
call scripts\win\find-node.cmd || (pause & exit /b 1)

echo === check ===
"%NODE_EXE%" scripts\check.js || goto :fail
echo === test ===
"%NODE_EXE%" --test || goto :fail
echo === smoke ===
"%NODE_EXE%" scripts\run.js --smoke || goto :fail

echo.
echo [verify] ALL PASSED
if "%~1"=="" pause
exit /b 0

:fail
echo.
echo [verify] FAILED
if "%~1"=="" pause
exit /b 1
