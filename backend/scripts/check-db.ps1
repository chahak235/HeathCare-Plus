# PowerShell script to check PostgreSQL database status
# This script works on Windows without needing PostgreSQL client tools installed

Write-Host "🔍 Checking PostgreSQL database status..." -ForegroundColor Cyan

# Check if Docker is running
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if the PostgreSQL container is running
$containerStatus = docker ps --filter "name=healthcare-postgres" --format "{{.Status}}"
if ($containerStatus) {
    Write-Host "✅ PostgreSQL container is running: $containerStatus" -ForegroundColor Green
    
    # Check PostgreSQL readiness using Docker exec
    Write-Host "`n🔍 Checking PostgreSQL readiness..." -ForegroundColor Cyan
    $pgReady = docker exec healthcare-postgres pg_isready -U healthcare_user -d healthcare_plus 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL is ready to accept connections" -ForegroundColor Green
        Write-Host $pgReady -ForegroundColor Green
    } else {
        Write-Host "❌ PostgreSQL is not ready yet" -ForegroundColor Yellow
        Write-Host $pgReady -ForegroundColor Yellow
    }
    
    # Try to connect and show database info
    Write-Host "`n📊 Database Information:" -ForegroundColor Cyan
    docker exec healthcare-postgres psql -U healthcare_user -d healthcare_plus -c "\dt" 2>&1 | Out-String
    
} else {
    Write-Host "❌ PostgreSQL container is not running" -ForegroundColor Red
    Write-Host "`n💡 To start the database, run:" -ForegroundColor Yellow
    Write-Host "   docker-compose up -d postgres" -ForegroundColor White
}

Write-Host "`n📝 Connection Details:" -ForegroundColor Cyan
Write-Host "   Host: localhost" -ForegroundColor White
Write-Host "   Port: 5432" -ForegroundColor White
Write-Host "   User: healthcare_user" -ForegroundColor White
Write-Host "   Database: healthcare_plus" -ForegroundColor White
Write-Host "   Password: healthcare_pass_123" -ForegroundColor White

