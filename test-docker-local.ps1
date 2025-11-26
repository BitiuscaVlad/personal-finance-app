# Local Docker Testing Script for Windows 11
# This script builds and tests the Docker container locally

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Personal Finance App - Local Docker Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$IMAGE_NAME = "finance-app"
$IMAGE_TAG = "test"
$CONTAINER_NAME = "finance-app-test"
$HOST_PORT = 5000
$CONTAINER_PORT = 5000

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Stop and remove existing container if it exists
Write-Host "`nCleaning up existing containers..." -ForegroundColor Yellow
docker stop $CONTAINER_NAME 2>$null
docker rm $CONTAINER_NAME 2>$null
Write-Host "✓ Cleanup complete" -ForegroundColor Green

# Build the Docker image
Write-Host "`nBuilding Docker image..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray
docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Docker build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker image built successfully" -ForegroundColor Green

# Check if .env file exists for local testing
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
Write-Host "`nStarting Docker container..." -ForegroundColor Yellow
if ($ENV_FILE) {
    docker run -d `
        --name $CONTAINER_NAME `
        -p "${HOST_PORT}:${CONTAINER_PORT}" `
        $ENV_FILE `
        "${IMAGE_NAME}:${IMAGE_TAG}"
} else {
    docker run -d `
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
docker logs $CONTAINER_NAME
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
    docker logs --tail 50 $CONTAINER_NAME
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
docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
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
Write-Host "  View logs:      docker logs -f $CONTAINER_NAME" -ForegroundColor Gray
Write-Host "  Stop container: docker stop $CONTAINER_NAME" -ForegroundColor Gray
Write-Host "  Start container: docker start $CONTAINER_NAME" -ForegroundColor Gray
Write-Host "  Remove container: docker rm -f $CONTAINER_NAME" -ForegroundColor Gray
Write-Host "  Shell access:   docker exec -it $CONTAINER_NAME sh" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to view logs (container will keep running)" -ForegroundColor Yellow
Write-Host ""

# Follow logs
docker logs -f $CONTAINER_NAME
