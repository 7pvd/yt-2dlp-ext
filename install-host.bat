@echo off
setlocal EnableDelayedExpansion

::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Main
::::::::::::::::::::::::::::::::::::::::::::::::::::::::

set "START_DIR=%~dp0"

:: logging
set "LOGFILE=%TEMP%\z2dlp_install.log"
if exist "%START_DIR%\\.git" (
    set "LOGFILE=%START_DIR%\\z2dlp_install.log"
    call echo %LOGFILE%
)
call :log "Starting installation..."

:: Is Admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script requires administrator privileges.
    echo Please run as administrator.
    pause
    exit /b 1
)

:: Python required
call :check_python
if errorLevel 1 exit /b 1

:: Path defines
set "BASE_DIR=%LOCALAPPDATA%\YTDLPHost"
set "VENV_DIR=%BASE_DIR%\venv"
set "APP_DIR=%BASE_DIR%\app"

:: Clean existing installation if present
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

:: Create directory structure
mkdir "%BASE_DIR%" 2>nul
mkdir "%APP_DIR%" 2>nul

:: Create and activate virtual environment
call :log "Setting up Python virtual environment..."
python -m venv "%VENV_DIR%"
call "%VENV_DIR%\Scripts\activate.bat"
timeout /t 2 /nobreak > nul

:: Install dependencies
call :log "Installing dependencies..."
python -m pip install --upgrade pip
pip install yt-dlp

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
    echo   "path": "%APP_DIR:\=\\%\\z2dlp_host.bat",
    echo   "type": "stdio",
    echo   "allowed_extensions": ["z2dlp_ext@zuko.pro"]
    echo }
) > "%APP_DIR%\z2dlp_host.json"

:: Create launcher batch file
(
    echo @echo off
    echo call "%VENV_DIR%\Scripts\activate.bat"
    timeout /t 2 /nobreak > nul
    echo python "%APP_DIR%\z2dlp_host.py" %%*
) > "%APP_DIR%\z2dlp_host.bat"

:: Register native messaging host
call :log "Registering native messaging host..."
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Mozilla\NativeMessagingHosts\z2dlp_host" /ve /d "%APP_DIR%\z2dlp_host.json" /f
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Google\Chrome\NativeMessagingHosts\z2dlp_host" /ve /d "%APP_DIR%\z2dlp_host.json" /f

:: Check and display browser manifest information
call :check_browser_manifest

call :log "Installation completed successfully."
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
