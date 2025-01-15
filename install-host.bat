@echo off
setlocal EnableDelayedExpansion

::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Main
::::::::::::::::::::::::::::::::::::::::::::::::::::::::

set "INSTALL_FOR_ALL_USERS=0"
set "DEV_MODE=0"
if "%1" == "/all-users" set "INSTALL_FOR_ALL_USERS=1"
if "%1" == "/dev" set "DEV_MODE=1"
if "%2" == "/all-users" set "INSTALL_FOR_ALL_USERS=1"
if "%2" == "/dev" set "DEV_MODE=1"

net session >nul 2>&1
if %errorLevel% equ 0 (
    if "%DEV_MODE%" == "0" (
        echo Would you like install for all user?
        set /p INSTALL_FOR_ALL_USERS=Enter 1 for yes, otherwise No:
        if not "%INSTALL_FOR_ALL_USERS%" == "0" if not "%INSTALL_FOR_ALL_USERS%" == "1" set "INSTALL_FOR_ALL_USERS=0"
    )
)

:: Get the actual script directory even when run as admin
set "SCRIPT_PATH=%~f0"
set "START_DIR=%~dp0"
echo Working directory: %START_DIR%
if "%START_DIR%" == "%SystemRoot%\system32\" (
    for %%I in ("%SCRIPT_PATH%") do set "START_DIR=%%~dpI"
)

:: Check for dev environment
if exist "%START_DIR%.git" (
    if "%DEV_MODE%" == "0" (
        echo Development environment detected. Would you like to install in dev mode?
        set /p DEV_MODE=Enter 1 for yes, otherwise No:
    )
)

:: logging
set "LOGFILE=%TEMP%\z2dlp_install.log"
if exist "%START_DIR%.git" (
    set "LOGFILE=!START_DIR!z2dlp_install.log"
)
call echo Debug log will be written to %LOGFILE%
call :log "Starting installation..."

if "%INSTALL_FOR_ALL_USERS%" == "1" (
:: Is Admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script requires administrator privileges.
    echo Please run as administrator.
    pause
    exit /b 1
)
)

:: Python required
call :check_python
if errorLevel 1 exit /b 1

:: Path defines
set "BASE_DIR=%LOCALAPPDATA%\Z2DLPHost"
if "%INSTALL_FOR_ALL_USERS%" == "1" set "BASE_DIR=%ProgramFiles%\Z2DLPHost"
set "VENV_DIR=%BASE_DIR%\venv"
set "APP_DIR=%BASE_DIR%\app"

if "%DEV_MODE%" == "1" (
    set "APP_DIR=%START_DIR%native_host"
    set "VENV_DIR=%START_DIR%venv"
    call :log "Development mode: Using source directory as APP_DIR"
)

:: Check for existing installation when installing for all users
if "%INSTALL_FOR_ALL_USERS%" == "1" (
    if exist "%LOCALAPPDATA%\Z2DLPHost" (
        call :log "Removing existing installation from local app data..."
        rmdir /s /q "%LOCALAPPDATA%\Z2DLPHost"
        if errorLevel 1 (
            call :log "Error: Could not remove existing installation from local app data"
            exit /b 1
        )
    )
)

:: Clean existing installation if present and not in dev mode
if "%DEV_MODE%" == "0" (
    if exist "%BASE_DIR%" (
        call :log "Removing existing installation..."
        if defined VIRTUAL_ENV (
            call deactivate
            timeout /t 2 /nobreak > nul
        )
        :: Cleanup old installation
        rmdir /s /q "%BASE_DIR%"
        if errorLevel 1 (
            call :log "Error: Could not remove existing installation"
            exit /b 1
        )
    )
)

:: Create directory structure if not in dev mode
if "%DEV_MODE%" == "0" (
    mkdir "%BASE_DIR%" 2>nul
    mkdir "%APP_DIR%" 2>nul
)

:: Create and activate virtual environment if not exists
if not exist "%VENV_DIR%" (
    call :log "Setting up Python virtual environment..."
    python -m venv "%VENV_DIR%"
)

call "%VENV_DIR%\Scripts\activate.bat"
timeout /t 2 /nobreak > nul

:: Install dependencies
call :log "Installing dependencies..."
python -m pip install --upgrade pip
if "%DEV_MODE%" == "1" (
    if exist "%APP_DIR%\requirements.txt" (
        call :log "Installing dependencies from requirements.txt..."
        pip install -r "%APP_DIR%\requirements.txt"
    ) else (
        call :log "Warning: requirements.txt not found, installing default dependencies..."
        pip install yt-dlp
    )
) else (
    pip install yt-dlp
)

if "%DEV_MODE%" == "0" (
    :: Copy files
    call :log "Copying application files..."
    copy "%START_DIR%\native_host\logger.py" "%APP_DIR%"
    copy "%START_DIR%\native_host\z2dlp_host.py" "%APP_DIR%"
    copy "%START_DIR%\native_host\parser.py" "%APP_DIR%"

    :: Create native messaging host manifest
    call :log "Creating native messaging host manifest..."
    (
        echo {
        echo   "name": "z2dlp_host",
        echo   "description": "z2dlp Native Messaging Host",
        echo   "path": "z2dlp_host.bat",
        echo   "type": "stdio",
        echo   "allowed_extensions": ["z2dlp_ext@zuko.pro"],
        echo   "allowed_origins": [
        echo     "chrome-extension://pedcomindcpbnadoenfgnjandcieiani/",
        echo     "chrome-extension://edcocgnlkdijkkiebalenphmfakmmoif/"
        echo   ]
        echo }
    ) > "%APP_DIR%\z2dlp_host.json"

    call :log "Creating native messaging host launcher..."
    :: Create launcher batch file
    (
        echo @echo off
        echo call "%VENV_DIR%\Scripts\activate.bat"
        timeout /t 2 /nobreak > nul
        echo python z2dlp_host.py %%*
    ) > "%APP_DIR%\z2dlp_host.bat"
)

:: Register native messaging host
if "%DEV_MODE%" == "1" (
    call :log "Registering native messaging host for development..."
    :: Always register for current user in dev mode to avoid permission issues
    reg add "HKEY_CURRENT_USER\SOFTWARE\Mozilla\NativeMessagingHosts\z2dlp_host" /ve /d "%APP_DIR%\z2dlp_host.json" /f
    reg add "HKEY_CURRENT_USER\SOFTWARE\Google\Chrome\NativeMessagingHosts\z2dlp_host" /ve /d "%APP_DIR%\z2dlp_host.json" /f
    
    :: Create or update manifest for dev mode
    call :log "Creating development manifest..."
    (
        echo {
        echo   "name": "z2dlp_host",
        echo   "description": "z2dlp Native Messaging Host (Development)",
        echo   "path": "z2dlp_host.bat",
        echo   "type": "stdio",
        echo   "allowed_extensions": ["z2dlp_ext@zuko.pro"],
        echo   "allowed_origins": [
        echo     "chrome-extension://pedcomindcpbnadoenfgnjandcieiani/",
        echo     "chrome-extension://edcocgnlkdijkkiebalenphmfakmmoif/"
        echo   ]
        echo }
    ) > "%APP_DIR%\z2dlp_host.json"
) else if "%INSTALL_FOR_ALL_USERS%" == "1" (
    call :log "Registering native messaging host for all users..."
    reg delete "HKEY_CURRENT_USER\SOFTWARE\Mozilla\NativeMessagingHosts\z2dlp_host" /f
    reg delete "HKEY_CURRENT_USER\SOFTWARE\Google\Chrome\NativeMessagingHosts\z2dlp_host" /f
    reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Mozilla\NativeMessagingHosts\z2dlp_host" /ve /d "%APP_DIR%\z2dlp_host.json" /f
    reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Google\Chrome\NativeMessagingHosts\z2dlp_host" /ve /d "%APP_DIR%\z2dlp_host.json" /f
) else (
    call :log "Registering native messaging host for current user only..."
    reg add "HKEY_CURRENT_USER\SOFTWARE\Mozilla\NativeMessagingHosts\z2dlp_host" /ve /d "%APP_DIR%\z2dlp_host.json" /f
    reg add "HKEY_CURRENT_USER\SOFTWARE\Google\Chrome\NativeMessagingHosts\z2dlp_host" /ve /d "%APP_DIR%\z2dlp_host.json" /f
)


:: Check and display browser manifest information
call :check_browser_manifest

call :log "Installation completed successfully."
if "%DEV_MODE%" == "1" (
    echo Development mode installation completed.
    echo Using source files directly from: %APP_DIR%
)
echo Quitting in 10 seconds...
timeout /t 10 /nobreak > nul
exit /b 0


:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Functions
:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

:check_python
python --version > "%TEMP%\pyver.txt" 2>&1
set /p PYVER=<"%TEMP%\pyver.txt"
del "%TEMP%\pyver.txt"

echo Detected Python version: %PYVER%
echo %PYVER% | findstr /R "Python 3\.[9101][0-9]*\.[0-9]*" >nul
if errorLevel 1 (
    echo Error: Python 3.9 or higher is required
    call :log "Error: Python version requirement not met"
    exit /b 1
)
call :log "Python version check passed: %PYVER%"
exit /b 0

:check_browser_manifest
call :log "Checking browser configurations..."
echo.
echo Browser Extension Installation Notes:
echo ------------------------------------
echo 1. Firefox: Extension manifest is managed through manifest.json
echo    - Verify manifest.json contains correct "applications.gecko.id"
echo    - Ensure "nativeMessaging" permission is included
echo.
echo 2. Chrome: Extension manifest is managed through manifest.json
echo    - Verify manifest.json contains "nativeMessaging" permission
echo    - Chrome uses same registry key format for all Chromium-based browsers
echo.
echo Please ensure your browser extension is properly installed and activated.
exit /b 0

:log
echo %DATE% %TIME% - %~1 >> "%LOGFILE%"
echo %~1
exit /b 0
