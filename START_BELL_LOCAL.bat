@echo off
cd /d "%~dp0"
echo.
echo Bell Performance 13.22.10 GitHub Actions Deployment
echo Serving this exact folder at http://localhost:8000/
echo Press Ctrl+C to stop the server.
echo.
py -m http.server 8000
pause
