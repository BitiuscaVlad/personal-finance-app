# Simple Local Test Script for Windows
# Tests the application without Docker

Write-Host "`n=== Personal Finance App - Local Test ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Node.js
Write-Host "[1/7] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "      ✓ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "      ✗ Node.js not found. Install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Step 2: Install server dependencies
Write-Host "`n[2/7] Installing server dependencies..." -ForegroundColor Yellow
cd server
npm install --loglevel=error
cd ..
Write-Host "      ✓ Done" -ForegroundColor Green

# Step 3: Install client dependencies
Write-Host "`n[3/7] Installing client dependencies..." -ForegroundColor Yellow
cd client
npm install --loglevel=error
cd ..
Write-Host "      ✓ Done" -ForegroundColor Green

# Step 4: Build React app
Write-Host "`n[4/7] Building React app (this takes 1-2 minutes)..." -ForegroundColor Yellow
cd client
$env:CI = "false"  # Ignore warnings as errors
npm run build --loglevel=error
cd ..
Write-Host "      ✓ Done" -ForegroundColor Green

# Step 5: Copy build files
Write-Host "`n[5/7] Copying build files to server..." -ForegroundColor Yellow
if (Test-Path "server\public") {
    Remove-Item -Path "server\public" -Recurse -Force
}
Copy-Item -Path "client\build" -Destination "server\public" -Recurse
Write-Host "      ✓ Done" -ForegroundColor Green

# Step 6: Create .env if needed
Write-Host "`n[6/7] Setting up environment..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
    Write-Host "      ✓ Created .env file (edit it to add your API key)" -ForegroundColor Green
} else {
    Write-Host "      ✓ .env file exists" -ForegroundColor Green
}

# Step 7: Start server
Write-Host "`n[7/7] Starting server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Server starting on http://localhost:5000" -ForegroundColor Green
Write-Host " Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$env:NODE_ENV = "production"
$env:PORT = "5000"

# Load .env variables
if (Test-Path ".env") {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$' -and $_ -notmatch '^#') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            if ($value -and $value -ne "your_openai_api_key_here") {
                Set-Item -Path "env:$key" -Value $value
            }
        }
    }
}

# Start the server
cd server
node server.js
