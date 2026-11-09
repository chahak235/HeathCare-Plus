# PowerShell script to test Healthcare API endpoints
# Usage: .\scripts\test-api.ps1

$baseUrl = "http://localhost:3001/api"

Write-Host "🧪 Healthcare API Test Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test Health Check
Write-Host "1️⃣ Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ Health Check:" -ForegroundColor Green
    $health | ConvertTo-Json
} catch {
    Write-Host "❌ Health Check Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test Signup
Write-Host "2️⃣ Testing Signup..." -ForegroundColor Yellow
$signupData = @{
    name = "Test User"
    email = "test@example.com"
    phone = "+1234567890"
    password = "TestPass123"
} | ConvertTo-Json

try {
    $signup = Invoke-RestMethod -Uri "$baseUrl/auth/signup" -Method Post -Body $signupData -ContentType "application/json"
    Write-Host "✅ Signup Successful:" -ForegroundColor Green
    $signup | ConvertTo-Json
} catch {
    Write-Host "❌ Signup Failed:" -ForegroundColor Red
    $_.ErrorDetails.Message | Write-Host
}
Write-Host ""

# Test Login
Write-Host "3️⃣ Testing Login..." -ForegroundColor Yellow
$loginData = @{
    email = "test@example.com"
    password = "TestPass123"
} | ConvertTo-Json

try {
    $login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginData -ContentType "application/json"
    Write-Host "✅ Login Successful:" -ForegroundColor Green
    $login | ConvertTo-Json
    $token = $login.token
    Write-Host "`n🔑 Token: $token" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Login Failed:" -ForegroundColor Red
    $_.ErrorDetails.Message | Write-Host
}
Write-Host ""

Write-Host "✅ API Testing Complete!" -ForegroundColor Green

