@echo off
setlocal
cd /d "%~dp0"
if exist "dist\Xingyue-win32-x64\Xingyue.exe" (
  start "" "dist\Xingyue-win32-x64\Xingyue.exe"
  exit /b
)
echo Build the portable app first: npm ci, then npm run build -- --with-artwork
pause
