@echo off
rem Copy this file to local-env.bat and edit it. local-env.bat is git-ignored.
rem Use ONE of the two methods below (ask your IT team which one the company provides).
rem Keep this file ASCII only (no Korean) - cmd.exe may break on it.

rem --- Method A: HTTP proxy server (e.g. proxy.company.local:8080) ---
rem set "HTTPS_PROXY=http://proxy.company.local:8080"
rem set "HTTP_PROXY=http://proxy.company.local:8080"
rem set "NO_PROXY=localhost,127.0.0.1,.company.local"
rem   With login: http://user:password@proxy.company.local:8080
rem   (Special characters in the password must be URL-encoded, e.g. @ -> %%40)

rem --- Method B: Repository mirror (Nexus / Artifactory proxy of GitHub releases) ---
rem set "ELECTRON_MIRROR=https://nexus.company.local/repository/electron/"
rem   If the mirror folder is "44.9.0" instead of "v44.9.0":
rem set "ELECTRON_CUSTOM_DIR={{ version }}"

rem --- Company root certificate (only if NODE_USE_SYSTEM_CA is not enough) ---
rem set "NODE_EXTRA_CA_CERTS=C:\certs\company-root-ca.pem"
