@echo off
setlocal EnableDelayedExpansion

::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Setup logging
::::::::::::::::::::::::::::::::::::::::::::::::::::::::
set "LOGFILE=%TEMP%\z2dlp_uninstall.log"
:: Clear log file if exists
if exist "%LOGFILE%" del "%LOGFILE%"

call :log "==================================================="
call :log "Starting uninstallation process"
call :log "==================================================="
call :log "System Information:"
call :log "  Windows Version: %OS%"
call :log "  Processor Architecture: %PROCESSOR_ARCHITECTURE%"
call :log "  User Domain: %USERDOMAIN%"
call :log "  Username: %USERNAME%"
call :log "  Temp Directory: %TEMP%"
call :log "  Program Files: %ProgramFiles%"
call :log "  Local AppData: %LOCALAPPDATA%"

::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Check for admin privileges
::::::::::::::::::::::::::::::::::::::::::::::::::::::::
call :log "Checking for administrator privileges..."
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script requires administrator privileges.
    echo Please run as administrator.
    call :log "INFO: Restarting script with Administrator privileges..."
    powershell -Command "Start-Process '%~0' -Verb RunAs"
    exit /b
)else (
    call :log "SUCCESS: Running with administrator privileges"
)

::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Check current environment state
::::::::::::::::::::::::::::::::::::::::::::::::::::::::
call :log "Checking current installation state..."

:: Check registry entries
call :log "Checking registry entries..."
reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Google\Chrome\NativeMessagingHosts\z2dlp_host" >> "%LOGFILE%" 2>&1
call :log "HKLM Chrome registry exists: %errorLevel%"

reg query "HKEY_CURRENT_USER\SOFTWARE\Google\Chrome\NativeMessagingHosts\z2dlp_host" >> "%LOGFILE%" 2>&1
call :log "HKCU Chrome registry exists: %errorLevel%"

reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Mozilla\NativeMessagingHosts\z2dlp_host" >> "%LOGFILE%" 2>&1
call :log "HKLM Firefox registry exists: %errorLevel%"

reg query "HKEY_CURRENT_USER\SOFTWARE\Mozilla\NativeMessagingHosts\z2dlp_host" >> "%LOGFILE%" 2>&1
call :log "HKCU Firefox registry exists: %errorLevel%"

:: Check installation directories
if exist "%ProgramFiles%\Z2DLPHost" (
    call :log "Found installation in Program Files:"
    dir "%ProgramFiles%\Z2DLPHost" >> "%LOGFILE%" 2>&1
)

if exist "%LOCALAPPDATA%\Z2DLPHost" (
    call :log "Found installation in LocalAppData:"
    dir "%LOCALAPPDATA%\Z2DLPHost" >> "%LOGFILE%" 2>&1
)

::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Remove Registry entries
::::::::::::::::::::::::::::::::::::::::::::::::::::::::
call :log "Removing registry entries..."

:: Remove Chrome registry entries
call :log "Removing Chrome registry entries..."
reg delete "HKEY_LOCAL_MACHINE\SOFTWARE\Google\Chrome\NativeMessagingHosts\z2dlp_host" /f >> "%LOGFILE%" 2>&1
call :log "HKLM Chrome registry deletion result: %errorLevel%"

reg delete "HKEY_CURRENT_USER\SOFTWARE\Google\Chrome\NativeMessagingHosts\z2dlp_host" /f >> "%LOGFILE%" 2>&1
call :log "HKCU Chrome registry deletion result: %errorLevel%"

:: Remove Firefox registry entries
call :log "Removing Firefox registry entries..."
reg delete "HKEY_LOCAL_MACHINE\SOFTWARE\Mozilla\NativeMessagingHosts\z2dlp_host" /f >> "%LOGFILE%" 2>&1
call :log "HKLM Firefox registry deletion result: %errorLevel%"

reg delete "HKEY_CURRENT_USER\SOFTWARE\Mozilla\NativeMessagingHosts\z2dlp_host" /f >> "%LOGFILE%" 2>&1
call :log "HKCU Firefox registry deletion result: %errorLevel%"

::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Remove installation directories
::::::::::::::::::::::::::::::::::::::::::::::::::::::::

:: Check and deactivate virtual environment if active
if defined VIRTUAL_ENV (
    call :log "Virtual environment detected: %VIRTUAL_ENV%"
    call :log "Deactivating virtual environment..."
    call deactivate >> "%LOGFILE%" 2>&1
    timeout /t 2 /nobreak > nul
    call :log "Virtual environment deactivated"
)

:: Remove from Program Files (all users installation)
if exist "%ProgramFiles%\Z2DLPHost" (
    call :log "Removing from Program Files..."
    call :log "Contents before deletion:"
    dir "%ProgramFiles%\Z2DLPHost" >> "%LOGFILE%" 2>&1
    rmdir /s /q "%ProgramFiles%\Z2DLPHost" >> "%LOGFILE%" 2>&1
    if !errorLevel! equ 0 (
        call :log "SUCCESS: Removed Program Files installation"
    ) else (
        call :log "ERROR: Failed to remove Program Files installation. Error code: !errorLevel!"
    )
)

:: Remove from LocalAppData (current user installation)
if exist "%LOCALAPPDATA%\Z2DLPHost" (
    call :log "Removing from LocalAppData..."
    call :log "Contents before deletion:"
    dir "%LOCALAPPDATA%\Z2DLPHost" >> "%LOGFILE%" 2>&1
    rmdir /s /q "%LOCALAPPDATA%\Z2DLPHost" >> "%LOGFILE%" 2>&1
    if !errorLevel! equ 0 (
        call :log "SUCCESS: Removed LocalAppData installation"
    ) else (
        call :log "ERROR: Failed to remove LocalAppData installation. Error code: !errorLevel!"
    )
)

:: Verify removal
call :log "Verifying removal..."
if exist "%ProgramFiles%\Z2DLPHost" call :log "WARNING: Program Files directory still exists"
if exist "%LOCALAPPDATA%\Z2DLPHost" call :log "WARNING: LocalAppData directory still exists"

call :log "==================================================="
call :log "Uninstallation completed"
call :log "Log file location: %LOGFILE%"
call :log "==================================================="

echo.
echo Uninstallation completed. Log file: %LOGFILE%
echo Press any key to exit...
pause >nul
exit /b 0

:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Functions
:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

:log
echo %DATE% %TIME% - %~1
echo %DATE% %TIME% - %~1 >> "%LOGFILE%"
exit /b 0
