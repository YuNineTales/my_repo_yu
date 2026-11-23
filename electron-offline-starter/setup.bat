@echo off
rem Install the Electron runtime from offline\electron-v*-win32-<arch>.zip into vendor\electron.
rem Works without Node.js (uses Windows built-in tar.exe, then verifies with Electron's bundled Node).
setlocal
cd /d "%~dp0"
set "ERR=0"

where node >nul 2>nul
if errorlevel 1 goto :nonode
node scripts\install-offline.js %*
set "ERR=%errorlevel%"
goto :done

:nonode
echo [setup] Node.js not found. Using Windows built-in tar.exe.

set "ARCH=x64"
if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "ARCH=arm64"

set "ZIP="
for %%F in ("offline\electron-v*-win32-%ARCH%.zip") do set "ZIP=%%~fF"
if defined ZIP goto :extract
echo [setup] offline\electron-v*-win32-%ARCH%.zip not found. See README.md.
set "ERR=1"
goto :done

:extract
if exist "vendor\electron" rmdir /s /q "vendor\electron"
mkdir "vendor\electron"
echo [setup] Extracting %ZIP%
"%SystemRoot%\System32\tar.exe" -xf "%ZIP%" -C "vendor\electron"
if errorlevel 1 goto :extractfail

rem Verify checksum and version with Electron's bundled Node.
set "ELECTRON_RUN_AS_NODE=1"
"vendor\electron\electron.exe" scripts\install-offline.js --verify-only --arch=%ARCH% "--zip=%ZIP%"
set "VERIFY=%errorlevel%"
set "ELECTRON_RUN_AS_NODE="
if not "%VERIFY%"=="0" goto :verifyfail
echo [setup] Done. Run start.bat
goto :done

:extractfail
echo [setup] Extraction failed.
set "ERR=1"
goto :done

:verifyfail
echo [setup] Verification failed. Removing vendor\electron.
rmdir /s /q "vendor\electron"
set "ERR=1"

:done
if "%~1"=="" pause
exit /b %ERR%
