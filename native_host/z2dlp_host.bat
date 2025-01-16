@echo off
setlocal DisableDelayedExpansion
set "SCRIPT_PATH=%~f0"
set "START_DIR=%~dp0"
for %%I in ("%SCRIPT_PATH%") do set "PROJECT_DIR=%%~dpI..\"
:: Check if .git exists in the parent directory
if not exist "%PROJECT_DIR%.git" (
    echo This file is only for development purposes.
    echo It should not be used in production.
    pause
    exit /b 1
)

:: Check if the virtual environment exists
if not exist "%PROJECT_DIR%venv\Scripts\activate.bat" (
    echo Virtual environment not found. Make sure it's named "venv".
    pause
    exit /b 1
)

:: Activate the virtual environment
call "%PROJECT_DIR%venv\Scripts\activate.bat"
if not defined VIRTUAL_ENV (
    echo Virtual environment active error.
    pause
    exit /b 1
)
:: Run the Python script
python "z2dlp_host.py" %*
exit /b
