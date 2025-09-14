@echo off
echo 🚀 Starting Voicera AI Microservices...
echo ================================================

echo 🔄 Killing existing Node.js processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo 📦 Installing dependencies...

echo Installing Voice Service dependencies...
cd microservices\voice-service
call npm install --silent
cd ..\..

echo Installing User Service dependencies...
cd microservices\user-service
call npm install --silent
cd ..\..

echo Installing Analytics Service dependencies...
cd microservices\analytics-service
call npm install --silent
cd ..\..

echo Installing API Gateway dependencies...
cd microservices\api-gateway
call npm install --silent
cd ..\..

echo.
echo 🚀 Starting services in separate windows...

echo Starting Voice Service on port 3001...
start "Voice Service" cmd /k "cd microservices\voice-service && set PORT=3001 && npm start"

echo Starting User Service on port 3002...
start "User Service" cmd /k "cd microservices\user-service && set PORT=3002 && npm start"

echo Starting Analytics Service on port 3003...
start "Analytics Service" cmd /k "cd microservices\analytics-service && set PORT=3003 && npm start"

echo Starting API Gateway on port 3000...
start "API Gateway" cmd /k "cd microservices\api-gateway && set PORT=3000 && npm start"

echo.
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

echo.
echo 🧪 Testing services...

echo Testing API Gateway...
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ API Gateway - Running
) else (
    echo ❌ API Gateway - Not responding
)

echo Testing Voice Service...
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Voice Service - Running
) else (
    echo ❌ Voice Service - Not responding
)

echo Testing User Service...
curl -s http://localhost:3002/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ User Service - Running
) else (
    echo ❌ User Service - Not responding
)

echo Testing Analytics Service...
curl -s http://localhost:3003/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Analytics Service - Running
) else (
    echo ❌ Analytics Service - Not responding
)

echo.
echo 🎉 Microservices Startup Complete!
echo ================================================
echo 📊 Service URLs:
echo   • API Gateway: http://localhost:3000
echo   • Voice Service: http://localhost:3001
echo   • User Service: http://localhost:3002
echo   • Analytics Service: http://localhost:3003
echo.
echo 📚 API Endpoints:
echo   • Health Check: http://localhost:3000/health
echo   • API Docs: http://localhost:3000/api/docs
echo   • Metrics: http://localhost:3000/metrics
echo.
echo 🛠️  Management:
echo   • View logs in the opened windows
echo   • Close windows to stop services
echo   • Run this script again to restart
echo.
pause
