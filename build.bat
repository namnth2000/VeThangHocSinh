@echo off
REM ============================================
REM Build script for Student Ticket App
REM ============================================

echo [1/6] - Cleaning old builds...
rmdir /s /q build dist __pycache__ >nul 2>&1
del /q VeThangHocSinh_v1.0.0.spec >nul 2>&1
del /q VeThangHocSinh_v1.0.0.zip >nul 2>&1

echo [2/6] - Installing dependencies...
pip install --upgrade pip
pip install -r requirements.txt
REM Ensure flask and dependencies are present
pip install flask jinja2 werkzeug pywebview qrcode pillow

echo [3/6] - Building exe with PyInstaller...
pyinstaller ^
    --noconsole ^
    --onefile ^
    --name VeThangHocSinh_v1.0.0 ^
    --add-data "templates;templates" ^
    --add-data "static;static" ^
    --add-data "qrcodes;qrcodes" ^
    --add-data "data;data" ^
    --hidden-import flask ^
    --hidden-import jinja2 ^
    --hidden-import werkzeug ^
    --icon=app.ico ^
    run.py

echo [4/6] - Copying extra folders...
REM ensure qrcodes and data folders exist (in dist)
if not exist dist\VeThangHocSinh_v1.0.0\ mkdir dist\VeThangHocSinh_v1.0.0\
xcopy templates dist\templates /E /I /Y
xcopy static dist\static /E /I /Y
if not exist dist\qrcodes mkdir dist\qrcodes
if not exist dist\data mkdir dist\data

echo [5/6] - Zipping result...
powershell -command "Compress-Archive -Path dist\VeThangHocSinh_v1.0.0.exe -DestinationPath VeThangHocSinh_v1.0.0.zip -Force"

echo [6/6] - Build finished!
echo.
echo Exe file: dist\VeThangHocSinh_v1.0.0.exe
echo Zip file: VeThangHocSinh_v1.0.0.zip
echo.

pause
