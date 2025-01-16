@echo off
setlocal EnableDelayedExpansion
:: Get the actual script directory even when run as admin
set "SCRIPT_PATH=%~f0"
set "START_DIR=%~dp0"
call :log "Script path: %SCRIPT_PATH%"
call :log "Working directory: %START_DIR%"
if "%START_DIR%" == "%SystemRoot%\system32\" (
    for %%I in ("%SCRIPT_PATH%") do set "START_DIR=%%~dpI"
    call :log "Corrected working directory: %START_DIR%"
)

:: Check for dev environment
if exist "%START_DIR%.git" (
    call :log "Development environment detected"
    if "%DEV_MODE%" == "0" (
        call :log "Prompting for dev mode..."
        echo Development environment detected. Would you like to install in dev mode?
        set /p DEV_MODE=Enter 1 for yes, otherwise No:
        call :log "User selected DEV_MODE: %DEV_MODE%"
    )
)
::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Setup logging
::::::::::::::::::::::::::::::::::::::::::::::::::::::::
set "LOGFILE=%TEMP%\z2dlp_install.log"
:: Set log file location for dev mode
if exist "%START_DIR%.git" (
    set "LOGFILE=!START_DIR!z2dlp_install.log"
    call :log "Switched to development log file: %LOGFILE%"
)
call :log "Debug log will be written to %LOGFILE%"
:: Clear log file if exists
if exist "%LOGFILE%" del "%LOGFILE%"

call :log "==================================================="
call :log "Starting installation process"
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
:: Parse command line arguments
::::::::::::::::::::::::::::::::::::::::::::::::::::::::
set "INSTALL_FOR_ALL_USERS=0"
set "DEV_MODE=0"
if "%1" == "/all-users" set "INSTALL_FOR_ALL_USERS=1"
if "%1" == "/dev" set "DEV_MODE=1"
if "%2" == "/all-users" set "INSTALL_FOR_ALL_USERS=1"
if "%2" == "/dev" set "DEV_MODE=1"

call :log "Command line arguments:"
call :log "  INSTALL_FOR_ALL_USERS: %INSTALL_FOR_ALL_USERS%"
call :log "  DEV_MODE: %DEV_MODE%"

::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Check for admin privileges
::::::::::::::::::::::::::::::::::::::::::::::::::::::::
call :log "Checking for administrator privileges..."
net session >nul 2>&1
if %errorLevel% equ 0 (
    call :log "SUCCESS: Running with administrator privileges"
    if "%DEV_MODE%" == "0" (
        call :log "Prompting for installation type..."
        echo Would you like install for all user?
        set /p INSTALL_FOR_ALL_USERS=Enter 1 for yes, otherwise No:
        if not "%INSTALL_FOR_ALL_USERS%" == "0" if not "%INSTALL_FOR_ALL_USERS%" == "1" set "INSTALL_FOR_ALL_USERS=0"
        call :log "User selected INSTALL_FOR_ALL_USERS: %INSTALL_FOR_ALL_USERS%"
    )
) else (
    call :log "WARNING: Not running with administrator privileges"
)





::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Check installation requirements
::::::::::::::::::::::::::::::::::::::::::::::::::::::::
if "%INSTALL_FOR_ALL_USERS%" == "1" (
    call :log "Checking admin privileges for all-users installation..."
    net session >nul 2>&1
    if %errorLevel% neq 0 (
        call :log "ERROR: Administrator privileges required for all-users installation"
        echo This script requires administrator privileges.
        echo Please run as administrator.
        call :quit_with_timeout 10
        exit /b 1
    )
)

:: Python required
call :log "Checking Python installation..."
call :check_python
if errorLevel 1 exit /b 1

::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Setup installation paths
::::::::::::::::::::::::::::::::::::::::::::::::::::::::
set "BASE_DIR=%LOCALAPPDATA%\Z2DLPHost"
if "%INSTALL_FOR_ALL_USERS%" == "1" set "BASE_DIR=%ProgramFiles%\Z2DLPHost"
set "VENV_DIR=%BASE_DIR%\venv"
set "APP_DIR=%BASE_DIR%\app"

call :log "Installation paths:"
call :log "  BASE_DIR: %BASE_DIR%"
call :log "  VENV_DIR: %VENV_DIR%"
call :log "  APP_DIR: %APP_DIR%"

if "%DEV_MODE%" == "1" (
    set "APP_DIR=%START_DIR%native_host"
    set "VENV_DIR=%START_DIR%venv"
    call :log "Development mode paths:"
    call :log "  APP_DIR: %APP_DIR%"
    call :log "  VENV_DIR: %VENV_DIR%"
)

::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Clean existing installation
::::::::::::::::::::::::::::::::::::::::::::::::::::::::
if "%INSTALL_FOR_ALL_USERS%" == "1" (
    if exist "%LOCALAPPDATA%\Z2DLPHost" (
        call :log "Removing existing local installation..."
        rmdir /s /q "%LOCALAPPDATA%\Z2DLPHost" >> "%LOGFILE%" 2>&1
        if errorLevel 1 (
            call :log "ERROR: Could not remove existing local installation"
            call :quit_with_timeout 10
            exit /b 1
        )
        call :log "SUCCESS: Removed existing local installation"
    )
)

if "%DEV_MODE%" == "0" (
    if exist "%BASE_DIR%" (
        call :log "Removing existing installation..."
        if defined VIRTUAL_ENV (
            call :log "Deactivating existing virtual environment..."
            call deactivate >> "%LOGFILE%" 2>&1
            timeout /t 2 /nobreak > nul
        )
        rmdir /s /q "%BASE_DIR%" >> "%LOGFILE%" 2>&1
        if errorLevel 1 (
            call :log "ERROR: Could not remove existing installation"
            call :quit_with_timeout 10
            exit /b 1
        )
        call :log "SUCCESS: Removed existing installation"
    )
)

::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Create directory structure
::::::::::::::::::::::::::::::::::::::::::::::::::::::::
if "%DEV_MODE%" == "0" (
    call :log "Creating directory structure..."
    mkdir "%BASE_DIR%" 2>nul
    mkdir "%APP_DIR%" 2>nul
    mkdir "%APP_DIR%\logs" 2>nul
    call :log "Directory structure created"
)

::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Setup Python virtual environment
::::::::::::::::::::::::::::::::::::::::::::::::::::::::
if not exist "%VENV_DIR%" (
    call :log "Creating Python virtual environment..."
    python -m venv "%VENV_DIR%" >> "%LOGFILE%" 2>&1
    if errorLevel 1 (
        call :log "ERROR: Failed to create virtual environment"
        exit /b 1
    )
    call :log "SUCCESS: Virtual environment created"
)

call :log "Activating virtual environment..."
call "%VENV_DIR%\Scripts\activate.bat"
timeout /t 2 /nobreak > nul
call :log "Virtual environment activated: %VIRTUAL_ENV%"

::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Install dependencies
::::::::::::::::::::::::::::::::::::::::::::::::::::::::
call :log "Installing dependencies..."
python -m pip install --upgrade pip >> "%LOGFILE%" 2>&1

if "%DEV_MODE%" == "1" (
    if exist "%APP_DIR%\requirements.txt" (
        call :log "Installing dependencies from requirements.txt..."
        pip install -r "%APP_DIR%\requirements.txt" >> "%LOGFILE%" 2>&1
    ) else (
        call :log "WARNING: requirements.txt not found, installing default dependencies..."
        pip install yt-dlp >> "%LOGFILE%" 2>&1
    )
) else (
    call :log "Installing default dependencies..."
    pip install yt-dlp >> "%LOGFILE%" 2>&1
)

::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Copy application files
::::::::::::::::::::::::::::::::::::::::::::::::::::::::
if "%DEV_MODE%" == "0" (
    call :log "Copying application files..."
    copy "%START_DIR%\native_host\logger.py" "%APP_DIR%" >> "%LOGFILE%" 2>&1
    copy "%START_DIR%\native_host\z2dlp_host.py" "%APP_DIR%" >> "%LOGFILE%" 2>&1
    copy "%START_DIR%\native_host\parser.py" "%APP_DIR%" >> "%LOGFILE%" 2>&1
    call :log "Application files copied"

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
    call :log "Native messaging host manifest created"

    call :log "Creating native messaging host launcher..."
    (
        echo @echo off
        echo call "%VENV_DIR%\Scripts\activate.bat"
        echo timeout /t 2 /nobreak ^> nul
        echo python z2dlp_host.py %%*
    ) > "%APP_DIR%\z2dlp_host.bat"
    call :log "Native messaging host launcher created"
)

::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Register native messaging host
::::::::::::::::::::::::::::::::::::::::::::::::::::::::
if "%DEV_MODE%" == "1" (
    call :log "Registering native messaging host for development..."
    reg add "HKEY_CURRENT_USER\SOFTWARE\Mozilla\NativeMessagingHosts\z2dlp_host" /ve /d "%APP_DIR%\z2dlp_host.json" /f >> "%LOGFILE%" 2>&1
    reg add "HKEY_CURRENT_USER\SOFTWARE\Google\Chrome\NativeMessagingHosts\z2dlp_host" /ve /d "%APP_DIR%\z2dlp_host.json" /f >> "%LOGFILE%" 2>&1
    call :log "Development manifest created"
) else if "%INSTALL_FOR_ALL_USERS%" == "1" (
    call :log "Registering native messaging host for all users..."
    reg delete "HKEY_CURRENT_USER\SOFTWARE\Mozilla\NativeMessagingHosts\z2dlp_host" /f >> "%LOGFILE%" 2>&1
    reg delete "HKEY_CURRENT_USER\SOFTWARE\Google\Chrome\NativeMessagingHosts\z2dlp_host" /f >> "%LOGFILE%" 2>&1
    reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Mozilla\NativeMessagingHosts\z2dlp_host" /ve /d "%APP_DIR%\z2dlp_host.json" /f >> "%LOGFILE%" 2>&1
    reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Google\Chrome\NativeMessagingHosts\z2dlp_host" /ve /d "%APP_DIR%\z2dlp_host.json" /f >> "%LOGFILE%" 2>&1
) else (
    call :log "Registering native messaging host for current user..."
    reg add "HKEY_CURRENT_USER\SOFTWARE\Mozilla\NativeMessagingHosts\z2dlp_host" /ve /d "%APP_DIR%\z2dlp_host.json" /f >> "%LOGFILE%" 2>&1
    reg add "HKEY_CURRENT_USER\SOFTWARE\Google\Chrome\NativeMessagingHosts\z2dlp_host" /ve /d "%APP_DIR%\z2dlp_host.json" /f >> "%LOGFILE%" 2>&1
)

:: Check and display browser manifest information
call :check_browser_manifest

call :log "==================================================="
call :log "Installation completed successfully"
if "%DEV_MODE%" == "1" (
    call :log "Development mode installation completed"
    call :log "Using source files directly from: %APP_DIR%"
)
call :log "Log file location: %LOGFILE%"
call :log "==================================================="

echo.
echo Installation completed. Log file: %LOGFILE%
if "%DEV_MODE%" == "1" (
    echo Development mode installation completed.
    echo Using source files directly from: %APP_DIR%
)

call :quit_with_timeout 10
exit /b 0

:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Functions
:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

:quit_with_timeout
setlocal
set TIMEOUT_DURATION=%1
echo Quitting in %TIMEOUT_DURATION% seconds...
timeout /t %TIMEOUT_DURATION% /nobreak > nul
endlocal
exit /b 0

:check_python
python --version > "%TEMP%\pyver.txt" 2>&1
set /p PYVER=<"%TEMP%\pyver.txt"
del "%TEMP%\pyver.txt"

call :log "Detected Python version: %PYVER%"
echo %PYVER% | findstr /R "Python 3\.[9101][0-9]*\.[0-9]*" >nul
if errorLevel 1 (
    call :log "ERROR: Python version requirement not met"
    echo Error: Python 3.9 or higher is required
    exit /b 1
)
call :log "SUCCESS: Python version check passed: %PYVER%"
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
call :log "Browser configuration information displayed"
exit /b 0

:log
echo %DATE% %TIME% - %~1
echo %DATE% %TIME% - %~1 >> "%LOGFILE%"
exit /b 0
