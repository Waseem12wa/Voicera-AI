# Voicera AI Microservices Test Script
# This script tests all microservices endpoints

Write-Host "🧪 Testing Voicera AI Microservices..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Blue

# Function to test an endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = $null
    )
    
    Write-Host "🔍 Testing $Name..." -ForegroundColor Yellow
    
    try {
        if ($Method -eq "POST" -and $Body) {
            $jsonBody = $Body | ConvertTo-Json -Depth 3
            $response = Invoke-WebRequest -Uri $Url -Method POST -Body $jsonBody -ContentType "application/json" -TimeoutSec 10 -ErrorAction Stop
        } else {
            $response = Invoke-WebRequest -Uri $Url -Method $Method -TimeoutSec 10 -ErrorAction Stop
        }
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $Name - SUCCESS (Status: $($response.StatusCode))" -ForegroundColor Green
            try {
                $jsonResponse = $response.Content | ConvertFrom-Json
                Write-Host "   Response: $($jsonResponse | ConvertTo-Json -Compress)" -ForegroundColor Gray
            } catch {
                Write-Host "   Response: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..." -ForegroundColor Gray
            }
            return $true
        } else {
            Write-Host "⚠️  $Name - Status: $($response.StatusCode)" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "❌ $Name - FAILED: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Test basic health checks
Write-Host "`n🏥 Health Checks:" -ForegroundColor Cyan
$healthTests = @(
    @{Name="API Gateway Health"; Url="http://localhost:3000/health"},
    @{Name="Voice Service Health"; Url="http://localhost:3001/health"},
    @{Name="User Service Health"; Url="http://localhost:3002/health"},
    @{Name="Analytics Service Health"; Url="http://localhost:3003/health"}
)

$healthResults = @()
foreach ($test in $healthTests) {
    $result = Test-Endpoint -Name $test.Name -Url $test.Url
    $healthResults += $result
}

# Test API endpoints
Write-Host "`n🔌 API Endpoints:" -ForegroundColor Cyan
$apiTests = @(
    @{Name="API Gateway Docs"; Url="http://localhost:3000/api/docs"},
    @{Name="API Gateway Metrics"; Url="http://localhost:3000/metrics"},
    @{Name="Voice Service Metrics"; Url="http://localhost:3001/metrics"},
    @{Name="User Service Metrics"; Url="http://localhost:3002/metrics"},
    @{Name="Analytics Service Metrics"; Url="http://localhost:3003/metrics"}
)

$apiResults = @()
foreach ($test in $apiTests) {
    $result = Test-Endpoint -Name $test.Name -Url $test.Url
    $apiResults += $result
}

# Test voice command processing
Write-Host "`n🎤 Voice Command Tests:" -ForegroundColor Cyan
$voiceTests = @(
    @{Name="Voice Command Process"; Url="http://localhost:3000/api/voice/process"; Method="POST"; Body=@{
        command="Show me my courses"
        userId="test-user"
        context=@{
            sessionId="test-session"
        }
    }},
    @{Name="Voice Command Status"; Url="http://localhost:3000/api/voice/status/test-job-id"}
)

$voiceResults = @()
foreach ($test in $voiceTests) {
    $result = Test-Endpoint -Name $test.Name -Url $test.Url -Method $test.Method -Body $test.Body
    $voiceResults += $result
}

# Test user management
Write-Host "`n👥 User Management Tests:" -ForegroundColor Cyan
$userTests = @(
    @{Name="Get Users"; Url="http://localhost:3000/api/users"},
    @{Name="User Service Health"; Url="http://localhost:3002/health"}
)

$userResults = @()
foreach ($test in $userTests) {
    $result = Test-Endpoint -Name $test.Name -Url $test.Url
    $userResults += $result
}

# Test analytics
Write-Host "`n📊 Analytics Tests:" -ForegroundColor Cyan
$analyticsTests = @(
    @{Name="Real-time Analytics"; Url="http://localhost:3000/api/analytics/real-time"},
    @{Name="User Analytics"; Url="http://localhost:3000/api/analytics/users"}
)

$analyticsResults = @()
foreach ($test in $analyticsTests) {
    $result = Test-Endpoint -Name $test.Name -Url $test.Url
    $analyticsResults += $result
}

# Summary
Write-Host "`n📋 Test Summary:" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue

$totalTests = $healthResults.Count + $apiResults.Count + $voiceResults.Count + $userResults.Count + $analyticsResults.Count
$passedTests = ($healthResults | Where-Object { $_ -eq $true }).Count + 
               ($apiResults | Where-Object { $_ -eq $true }).Count + 
               ($voiceResults | Where-Object { $_ -eq $true }).Count + 
               ($userResults | Where-Object { $_ -eq $true }).Count + 
               ($analyticsResults | Where-Object { $_ -eq $true }).Count

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $($totalTests - $passedTests)" -ForegroundColor Red

if ($passedTests -eq $totalTests) {
    Write-Host "`n🎉 All tests passed! Microservices are working correctly." -ForegroundColor Green
} elseif ($passedTests -gt ($totalTests / 2)) {
    Write-Host "`n⚠️  Most tests passed. Some services may need attention." -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Many tests failed. Please check service logs and configuration." -ForegroundColor Red
}

Write-Host "`nPress any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
