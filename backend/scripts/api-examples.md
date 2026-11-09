# API Testing Examples

## PowerShell Commands

### Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method Get
```

### Signup
```powershell
$body = @{
    name = "John Doe"
    email = "john@example.com"
    phone = "+1234567890"
    password = "SecurePass123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/signup" -Method Post -Body $body -ContentType "application/json"
```

### Login
```powershell
$body = @{
    email = "john@example.com"
    password = "SecurePass123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body $body -ContentType "application/json"
```

### Get Current User (with token)
```powershell
$token = "your_jwt_token_here"
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/me" -Method Get -Headers $headers
```

## Using curl (if installed)

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Signup
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","phone":"+1234567890","password":"SecurePass123"}'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123"}'
```

## Using the Test Script

Run the automated test script:
```powershell
.\scripts\test-api.ps1
```

