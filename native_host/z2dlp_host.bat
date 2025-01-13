@echo off

set "START_DIR=%~dp0"

:: Check if .git exists in the parent directory
if not exist "%START_DIR%..\.git" (
    echo This file is only for development purposes.
    echo It should not be used in production.
    pause
    exit /b 1
)

:: Check if the virtual environment exists
if not exist "%~dp0..\venv\Scripts\activate.bat" (
    echo Virtual environment not found. Make sure it's named "venv".
    pause
    exit /b 1
)

:: Activate the virtual environment
call "%~dp0..\venv\Scripts\activate.bat"
timeout /t 2 /nobreak > nul

:: Run the Python script
python "z2dlp_host.py" %*
exit /b
