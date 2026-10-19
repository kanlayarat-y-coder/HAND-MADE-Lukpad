@echo off
cd /d "%~dp0"
echo Copying gs\Code.gs to clipboard (UTF-8 safe) ...
powershell -NoProfile -Command "$p=(Resolve-Path 'gs\Code.gs').Path; $t=[IO.File]::ReadAllText($p,[Text.Encoding]::UTF8); Set-Clipboard -Value $t; Write-Host ('copied ' + $t.Length + ' characters')"
echo.
echo [1] Code.gs is now in your clipboard
echo [2] Open the Google Sheet - Extensions - Apps Script
echo [3] Click inside the code box - Ctrl+A - Ctrl+V - Save
echo [4] Deploy - Manage deployments - pencil - Version: New version - Deploy
echo.
echo (Backup: Notepad is opening with the same code in case the clipboard fails)
start notepad "gs\Code.gs"
echo.
pause
