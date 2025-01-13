@echo off
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%~dp0..
set HOST_DIR=%PROJECT_DIR%\native_host
:: Define file paths
set "REG_FILE=%HOST_DIR%\native_messaging.reg"
set "TEMP_REG_FILE=%HOST_DIR%\native_messaging_temp.reg"


:: Replace hardcoded paths in the registry file
echo Starting update paths in registry file...
if not defined VIRTUAL_ENV (
    call "%~dp0..\venv\Scripts\activate.bat"
    timeout /t 2 /nobreak > nul
)
python windows.py

echo Run update ?
pause

echo Uninstalling registry...
call reg delete "HKEY_LOCAL_MACHINE\SOFTWARE\Mozilla\NativeMessagingHosts\z2dlp_host" /f
call reg delete "HKEY_LOCAL_MACHINE\SOFTWARE\Mozilla\NativeMessagingHosts\z2dlp_host" /f

:: Install the registry from the modified .reg file
echo Installing replaced path into registry...
call regedit /s %TEMP_REG_FILE%

:: Cleanup
del %TEMP_REG_FILE% /f
echo Done
