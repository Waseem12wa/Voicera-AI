@echo off
echo ========================================
echo    Voicera AI Admin Console Startup
echo ========================================
echo.

echo [1/3] Starting MongoDB...
echo Please ensure MongoDB is running on localhost:27017
echo If not installed, download from: https://www.mongodb.com/try/download/community
echo.

echo [2/3] Starting Backend Server...
cd server
start "Voicera Backend" cmd /k "npm start"
timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend...
cd ..\frontend
start "Voicera Frontend" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo    Admin Console Started Successfully!
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:4000
echo.
echo Admin Console Pages:
echo - Analytics: http://localhost:5173/admin/analytics
echo - Logs:      http://localhost:5173/admin/logs
echo - Content:   http://localhost:5173/admin/content
echo - Alerts:    http://localhost:5173/admin/alerts
echo.
echo Press any key to exit...
pause >nul
