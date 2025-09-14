# Voicera AI Microservices Startup Script
# This script starts all microservices with proper port configuration

Write-Host "🚀 Starting Voicera AI Microservices..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Blue

# Kill any existing Node.js processes
Write-Host "🔄 Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment for processes to stop
Start-Sleep -Seconds 2

# Check if MongoDB is running
Write-Host "📊 Checking MongoDB..." -ForegroundColor Yellow
try {
    $mongoTest = Invoke-WebRequest -Uri "http://localhost:27017" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ MongoDB is running" -ForegroundColor Green
} catch {
    Write-Host "❌ MongoDB is not running. Please start MongoDB first." -ForegroundColor Red
    Write-Host "   Download from: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
    exit 1
}

# Check if Redis is running (optional for basic testing)
Write-Host "📊 Checking Redis..." -ForegroundColor Yellow
try {
    $redisTest = Invoke-WebRequest -Uri "http://localhost:6379" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Redis is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Redis is not running. Some features may not work." -ForegroundColor Yellow
    Write-Host "   Download from: https://redis.io/download" -ForegroundColor Yellow
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    $envContent = @"
# Microservices Environment Configuration
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/voicera
REDIS_HOST=localhost
REDIS_PORT=6379

# Services
VOICE_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
ANALYTICS_SERVICE_URL=http://localhost:3003

# API Keys (Replace with your actual keys)
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET=your_jwt_secret_here

# Client
CLIENT_ORIGIN=http://localhost:5173
"@
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ .env file created" -ForegroundColor Green
}

# Function to start a service
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$ServicePath,
        [int]$Port
    )
    
    Write-Host "🚀 Starting $ServiceName on port $Port..." -ForegroundColor Cyan
    
    # Change to service directory
    Push-Location $ServicePath
    
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing dependencies for $ServiceName..." -ForegroundColor Yellow
        npm install --silent
    }
    
    # Start the service in a new window
    $env:PORT = $Port
    Start-Process -FilePath "cmd" -ArgumentList "/c", "title=$ServiceName && npm start && pause" -WindowStyle Normal
    
    # Return to original directory
    Pop-Location
    
    # Wait a moment for service to start
    Start-Sleep -Seconds 3
}

# Start all services
Write-Host "`n🔧 Starting Microservices..." -ForegroundColor Blue

# Start Voice Service (Port 3001)
Start-Service -ServiceName "Voice Service" -ServicePath "microservices/voice-service" -Port 3001

# Start User Service (Port 3002)  
Start-Service -ServiceName "User Service" -ServicePath "microservices/user-service" -Port 3002

# Start Analytics Service (Port 3003)
Start-Service -ServiceName "Analytics Service" -ServicePath "microservices/analytics-service" -Port 3003

# Start API Gateway (Port 3000)
Start-Service -ServiceName "API Gateway" -ServicePath "microservices/api-gateway" -Port 3000

# Wait for services to start
Write-Host "`n⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test services
Write-Host "`n🔍 Testing Services..." -ForegroundColor Blue

$services = @(
    @{Name="API Gateway"; Url="http://localhost:3000/health"},
    @{Name="Voice Service"; Url="http://localhost:3001/health"},
    @{Name="User Service"; Url="http://localhost:3002/health"},
    @{Name="Analytics Service"; Url="http://localhost:3003/health"}
)

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri $service.Url -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($service.Name) - Running" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $($service.Name) - Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ $($service.Name) - Not responding" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Microservices Startup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Blue
Write-Host "📊 Service URLs:" -ForegroundColor Cyan
Write-Host "  • API Gateway: http://localhost:3000" -ForegroundColor White
Write-Host "  • Voice Service: http://localhost:3001" -ForegroundColor White
Write-Host "  • User Service: http://localhost:3002" -ForegroundColor White
Write-Host "  • Analytics Service: http://localhost:3003" -ForegroundColor White

Write-Host "`n📚 API Endpoints:" -ForegroundColor Cyan
Write-Host "  • Health Check: http://localhost:3000/health" -ForegroundColor White
Write-Host "  • API Docs: http://localhost:3000/api/docs" -ForegroundColor White
Write-Host "  • Metrics: http://localhost:3000/metrics" -ForegroundColor White

Write-Host "`n🛠️  Management:" -ForegroundColor Cyan
Write-Host "  • View logs in the opened windows" -ForegroundColor White
Write-Host "  • Close windows to stop services" -ForegroundColor White
Write-Host "  • Run this script again to restart" -ForegroundColor White

Write-Host "`nPress any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
