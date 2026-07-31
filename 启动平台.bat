@echo off
setlocal
set "APP_DIR=%~dp0"
set "NODE_EXE=%APP_DIR%runtime\node.exe"
if not exist "%NODE_EXE%" goto :missing_runtime
start "" "http://localhost:4170"
"%NODE_EXE%" "%APP_DIR%server-v2.mjs"
pause
exit /b 0

:missing_runtime
echo Runtime files are missing. Please restore the runtime folder.
pause
exit /b 1
