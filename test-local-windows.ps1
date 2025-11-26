# Local Testing Script for Windows (No Docker)
# This script tests the application directly on Windows without containers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Personal Finance App - Windows Local Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# Configuration
$PORT = 5000
$SERVER_DIR = "server"
$CLIENT_DIR = "client"
$BUILD_DIR = "server\public"
$ROOT_DIR = Get-Location

# Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Set environment variables
Write-Host "`nSetting environment variables..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
$env:PORT = $PORT
$env:DATABASE_PATH = "./data/finance.db"

# Check if .env exists and load it
if (Test-Path ".env") {
    Write-Host "✓ .env file found, loading variables..." -ForegroundColor Green
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$' -and $_ -notmatch '^#') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            if ($value -and $value -ne "your_openai_api_key_here") {
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
                Write-Host "  Loaded $key" -ForegroundColor Gray
            }
        }
    }
} else {
    Write-Host "⚠ No .env file found (optional)" -ForegroundColor Yellow
    Write-Host "  Creating .env from template..." -ForegroundColor Gray
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "  ✓ Created .env file" -ForegroundColor Green
        Write-Host "  Note: Edit .env to add your OPENAI_API_KEY for AI features" -ForegroundColor Gray
    }
}
Write-Host "✓ Environment configured" -ForegroundColor Green

# Install server dependencies
Write-Host "`nInstalling server dependencies..." -ForegroundColor Yellow
# Install server dependencies
Write-Host "`nInstalling server dependencies..." -ForegroundColor Yellow
Set-Location (Join-Path $ROOT_DIR $SERVER_DIR)
if (-not (Test-Path "node_modules")) {
    Write-Host "  Running npm install..." -ForegroundColor Gray
    npm install --production=false
} else {
    Write-Host "  Dependencies already installed" -ForegroundColor Gray
}
Set-Location $ROOT_DIR
Write-Host "✓ Server dependencies ready" -ForegroundColor Green

# Install client dependencies
Write-Host "`nInstalling client dependencies..." -ForegroundColor Yellow
Set-Location (Join-Path $ROOT_DIR $CLIENT_DIR)
if (-not (Test-Path "node_modules")) {
    Write-Host "  Running npm install..." -ForegroundColor Gray
    npm install
} else {
    Write-Host "  Dependencies already installed" -ForegroundColor Gray
}
Set-Location $ROOT_DIR
Write-Host "✓ Client dependencies ready" -ForegroundColor Green
Write-Host "`nBuilding React client..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
Push-Location $CLIENT_DIR
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to build client" -ForegroundColor Red
    Pop-Location
# Build client
Write-Host "`nBuilding React client..." -ForegroundColor Yellow
Write-Host "  This may take a few minutes..." -ForegroundColor Gray
Set-Location (Join-Path $ROOT_DIR $CLIENT_DIR)
npm run build
Set-Location $ROOT_DIR
Write-Host "✓ Client built successfully" -ForegroundColor Green

# Copy build to server
Write-Host "`nCopying build files to server..." -ForegroundColor Yellow
$buildSource = Join-Path $ROOT_DIR "$CLIENT_DIR\build"
$buildDest = Join-Path $ROOT_DIR $BUILD_DIR

if (Test-Path $buildDest) {
    Remove-Item -Path $buildDest -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -Path $buildDest -ItemType Directory -Force | Out-Null
Copy-Item -Path "$buildSource\*" -Destination $buildDest -Recurse -Force
Write-Host "✓ Build files copied to $BUILD_DIR" -ForegroundColor Greenble Id, ProcessName, Path
    $response = Read-Host "Kill the process and continue? (y/n)"
    if ($response -eq 'y') {
        Stop-Process -Id $portInUse.OwningProcess -Force
        Start-Sleep -Seconds 2
        Write-Host "✓ Process terminated" -ForegroundColor Green
    } else {
        exit 1
    }
} else {
    Write-Host "✓ Port $PORT is available" -ForegroundColor Green
}

# Start the server
Write-Host "`nStarting the server..." -ForegroundColor Yellow
Push-Location $SERVER_DIR

# Create a script block to run the server
$serverJob = Start-Job -ScriptBlock {
    param($serverPath, $envVars)
    
    # Set environment variables in the job
    foreach ($key in $envVars.Keys) {
# Start the server
Write-Host "`nStarting the server..." -ForegroundColor Yellow
$serverPath = Join-Path $ROOT_DIR $SERVER_DIR

# Create a script block to run the server
$serverJob = Start-Job -ScriptBlock {
    param($serverPath, $nodeEnv, $port, $apiKey, $dbPath)
    
    # Set environment variables in the job
    $env:NODE_ENV = $nodeEnv
    $env:PORT = $port
    if ($apiKey) { $env:OPENAI_API_KEY = $apiKey }
    if ($dbPath) { $env:DATABASE_PATH = $dbPath }
    
    Set-Location $serverPath
    node server.js
} -ArgumentList $serverPath, $env:NODE_ENV, $env:PORT, $env:OPENAI_API_KEY, $env:DATABASE_PATHng = $false

while ($retry -lt $maxRetries -and -not $serverRunning) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$PORT/api/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $serverRunning = $true
            Write-Host "✓ Server is running!" -ForegroundColor Green
            Write-Host "Response: $($response.Content)" -ForegroundColor Gray
        }
    } catch {
        $retry++
        if ($retry -lt $maxRetries) {
            Write-Host "  Retry $retry/$maxRetries..." -ForegroundColor Gray
            Start-Sleep -Seconds 2
        }
    }
}

if (-not $serverRunning) {
    Write-Host "✗ Server failed to start" -ForegroundColor Red
    Write-Host "`nJob output:" -ForegroundColor Yellow
    Receive-Job $serverJob
    Stop-Job $serverJob
    Remove-Job $serverJob
    exit 1
}

# Test application endpoints
Write-Host "`nTesting application endpoints..." -ForegroundColor Yellow

$endpoints = @(
    @{Name="Main App"; Url="http://localhost:$PORT/"},
    @{Name="Health Check"; Url="http://localhost:$PORT/api/health"},
    @{Name="Categories"; Url="http://localhost:$PORT/api/categories"},
    @{Name="Dashboard"; Url="http://localhost:$PORT/api/dashboard"}
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint.Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Host "  ✓ $($endpoint.Name): OK" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ $($endpoint.Name): $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Display information
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Application is running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Application URL: http://localhost:$PORT" -ForegroundColor Yellow
Write-Host "Health Check:    http://localhost:$PORT/api/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "Job ID: $($serverJob.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "Commands:" -ForegroundColor Cyan
Write-Host "  View logs:     Receive-Job $($serverJob.Id)" -ForegroundColor Gray
Write-Host "  Stop server:   Stop-Job $($serverJob.Id); Remove-Job $($serverJob.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process "http://localhost:$PORT"

Write-Host "`nPress Ctrl+C to stop the server and exit" -ForegroundColor Yellow
Write-Host ""

# Monitor the job and display output
try {
    while ($serverJob.State -eq 'Running') {
        $output = Receive-Job $serverJob
        if ($output) {
            Write-Host $output
        }
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "`n`nStopping server..." -ForegroundColor Yellow
    Stop-Job $serverJob -ErrorAction SilentlyContinue
    Remove-Job $serverJob -ErrorAction SilentlyContinue
    Write-Host "✓ Server stopped" -ForegroundColor Green
}
