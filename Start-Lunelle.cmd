@echo off
setlocal
cd /d "%~dp0"
if exist "dist\Lunelle-win32-x64\Lunelle.exe" (
  start "" "dist\Lunelle-win32-x64\Lunelle.exe"
  exit /b
)
echo Build the portable app first: npm ci, then npm run build -- --with-artwork
pause
