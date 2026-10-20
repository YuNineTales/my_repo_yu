@echo off
rem Download Electron through the company proxy/mirror on THIS PC, then install it (setup).
rem Proxy/mirror settings: copy local-env.example.bat to local-env.bat and edit it.
rem (local-env.bat is git-ignored, so internal addresses are never committed.)
setlocal
cd /d "%~dp0"
set "ERR=0"

if exist "local-env.bat" call "local-env.bat"

rem Node 24+: make fetch use HTTPS_PROXY / HTTP_PROXY / NO_PROXY.
if not defined NODE_USE_ENV_PROXY set "NODE_USE_ENV_PROXY=1"
rem Node 24.6+: trust the Windows certificate store (company TLS inspection proxy).
if not defined NODE_USE_SYSTEM_CA set "NODE_USE_SYSTEM_CA=1"

where node >nul 2>nul
if errorlevel 1 goto :nonode

node scripts\prepare-offline.js %*
if errorlevel 1 goto :fail
node scripts\install-offline.js
if errorlevel 1 goto :fail

echo.
echo [download] Done. Run start.bat or verify.bat
goto :done

:nonode
echo [download] Node.js is required for downloading. Use the offline method instead (README.md).
set "ERR=1"
goto :done

:fail
echo.
echo [download] FAILED. Check the message above and local-env.bat (README.md: company proxy section).
set "ERR=1"

:done
if "%~1"=="" pause
exit /b %ERR%
