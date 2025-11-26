# Podman Testing Script for Windows
# This script uses Podman instead of Docker Desktop

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Personal Finance App - Podman Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$IMAGE_NAME = "finance-app"
$IMAGE_TAG = "test"
$CONTAINER_NAME = "finance-app-test"
$HOST_PORT = 5000
$CONTAINER_PORT = 5000

# Check if Podman is installed
Write-Host "Checking Podman installation..." -ForegroundColor Yellow
try {
    $podmanVersion = podman --version
    Write-Host "✓ $podmanVersion is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Podman is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install Podman Desktop:" -ForegroundColor Yellow
    Write-Host "  Option 1: winget install -e --id RedHat.Podman-Desktop" -ForegroundColor Gray
    Write-Host "  Option 2: Download from https://podman-desktop.io/" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Check if Podman machine is running
Write-Host "`nChecking Podman machine status..." -ForegroundColor Yellow
try {
    $machineStatus = podman machine list 2>&1
    if ($machineStatus -match "Currently running") {
        Write-Host "✓ Podman machine is running" -ForegroundColor Green
    } else {
        Write-Host "⚠ Podman machine may not be running" -ForegroundColor Yellow
        Write-Host "Starting Podman machine..." -ForegroundColor Yellow
        podman machine start
        Start-Sleep -Seconds 5
    }
} catch {
    Write-Host "⚠ Could not check Podman machine status" -ForegroundColor Yellow
}

# Stop and remove existing container if it exists
Write-Host "`nCleaning up existing containers..." -ForegroundColor Yellow
podman stop $CONTAINER_NAME 2>$null
podman rm $CONTAINER_NAME 2>$null
Write-Host "✓ Cleanup complete" -ForegroundColor Green

# Build the image
Write-Host "`nBuilding Podman image..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray
podman build -t "${IMAGE_NAME}:${IMAGE_TAG}" .

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Podman build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Podman image built successfully" -ForegroundColor Green

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "`nFound .env file - will use environment variables" -ForegroundColor Yellow
    $ENV_FILE = "--env-file .env"
} else {
    Write-Host "`nNo .env file found - using default configuration" -ForegroundColor Yellow
    Write-Host "Creating .env from .env.example..." -ForegroundColor Gray
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✓ Created .env file. Please edit it with your API keys." -ForegroundColor Green
    }
    $ENV_FILE = ""
}

# Run the container
Write-Host "`nStarting Podman container..." -ForegroundColor Yellow
if ($ENV_FILE) {
    podman run -d `
        --name $CONTAINER_NAME `
        -p "${HOST_PORT}:${CONTAINER_PORT}" `
        $ENV_FILE `
        "${IMAGE_NAME}:${IMAGE_TAG}"
} else {
    podman run -d `
        --name $CONTAINER_NAME `
        -p "${HOST_PORT}:${CONTAINER_PORT}" `
        -e NODE_ENV=production `
        -e PORT=$CONTAINER_PORT `
        "${IMAGE_NAME}:${IMAGE_TAG}"
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to start container" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Container started successfully" -ForegroundColor Green

# Wait for the application to start
Write-Host "`nWaiting for application to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check container logs
Write-Host "`nContainer logs:" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
podman logs $CONTAINER_NAME
Write-Host "----------------------------------------" -ForegroundColor Gray

# Test the health endpoint
Write-Host "`nTesting health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:${HOST_PORT}/api/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Health check passed" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Health check failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "`nShowing recent logs:" -ForegroundColor Yellow
    podman logs --tail 50 $CONTAINER_NAME
}

# Test the main application
Write-Host "`nTesting main application..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:${HOST_PORT}/" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Application is responding" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Application test failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

# Display container information
Write-Host "`nContainer Information:" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Gray
podman ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host "----------------------------------------" -ForegroundColor Gray

# Display useful commands
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Container is running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Application URL: http://localhost:${HOST_PORT}" -ForegroundColor Yellow
Write-Host "Health Check:    http://localhost:${HOST_PORT}/api/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  View logs:      podman logs -f $CONTAINER_NAME" -ForegroundColor Gray
Write-Host "  Stop container: podman stop $CONTAINER_NAME" -ForegroundColor Gray
Write-Host "  Start container: podman start $CONTAINER_NAME" -ForegroundColor Gray
Write-Host "  Remove container: podman rm -f $CONTAINER_NAME" -ForegroundColor Gray
Write-Host "  Shell access:   podman exec -it $CONTAINER_NAME sh" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to view logs (container will keep running)" -ForegroundColor Yellow
Write-Host ""

# Follow logs
podman logs -f $CONTAINER_NAME
