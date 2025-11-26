# Local Testing Guide for Windows 11

This guide helps you test the Personal Finance App deployment on your local Windows 11 machine before deploying to Azure.

## Prerequisites

### 1. Install Docker Desktop for Windows

1. Download Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Run the installer
3. Restart your computer if prompted
4. Start Docker Desktop
5. Verify installation:
   ```powershell
   docker --version
   docker compose version
   ```

### 2. Enable WSL 2 (if not already enabled)

Docker Desktop requires WSL 2 on Windows 11:

```powershell
# Run as Administrator
wsl --install
wsl --set-default-version 2
```

## Quick Start - Automated Testing

### Option 1: Using PowerShell Script (Recommended)

Run the automated test script:

```powershell
.\test-docker-local.ps1
```

This script will:
- ✓ Check if Docker is running
- ✓ Build the Docker image
- ✓ Start the container
- ✓ Run health checks
- ✓ Display logs and useful commands

### Option 2: Manual Testing

Follow the steps below for manual testing and learning.

## Manual Testing Steps

### Step 1: Prepare Environment Variables

Create a `.env` file from the example:

```powershell
Copy-Item .env.example .env
notepad .env
```

Edit the `.env` file with your actual values:
```env
PORT=5000
NODE_ENV=production
OPENAI_API_KEY=sk-your-actual-openai-key-here
DATABASE_PATH=/app/data/finance.db
```

### Step 2: Build the Docker Image

```powershell
# Build the image (this may take 5-10 minutes)
docker build -t finance-app:test .

# Verify the image was created
docker images | Select-String finance-app
```

**Expected output:**
```
finance-app   test   <image-id>   <size>   <time>
```

### Step 3: Run the Container

```powershell
# Run with environment file
docker run -d `
  --name finance-app-test `
  -p 5000:5000 `
  --env-file .env `
  finance-app:test

# OR run with inline environment variables
docker run -d `
  --name finance-app-test `
  -p 5000:5000 `
  -e NODE_ENV=production `
  -e PORT=5000 `
  -e OPENAI_API_KEY=your-key-here `
  finance-app:test
```

### Step 4: Verify Container is Running

```powershell
# Check container status
docker ps

# View container logs
docker logs finance-app-test

# Follow logs in real-time
docker logs -f finance-app-test
```

### Step 5: Test the Application

#### Test Health Endpoint

```powershell
# Using Invoke-WebRequest
Invoke-WebRequest -Uri http://localhost:5000/api/health | Select-Object -ExpandProperty Content

# Or using curl (if installed)
curl http://localhost:5000/api/health
```

**Expected response:**
```json
{"status":"OK","message":"Finance API is running"}
```

#### Test in Browser

Open your browser and navigate to:
- Main app: http://localhost:5000
- Health check: http://localhost:5000/api/health
- API endpoints: http://localhost:5000/api/categories

#### Test API Endpoints

```powershell
# Test categories endpoint
Invoke-RestMethod -Uri http://localhost:5000/api/categories

# Test transactions endpoint
Invoke-RestMethod -Uri http://localhost:5000/api/transactions

# Test dashboard endpoint
Invoke-RestMethod -Uri http://localhost:5000/api/dashboard
```

### Step 6: Test with Persistent Data (Optional)

To persist the SQLite database across container restarts:

```powershell
# Create a volume
docker volume create finance-data

# Run container with volume
docker run -d `
  --name finance-app-test `
  -p 5000:5000 `
  --env-file .env `
  -v finance-data:/app/data `
  finance-app:test

# Verify volume is mounted
docker inspect finance-app-test | Select-String -Pattern "Mounts" -Context 0,10
```

## Testing Scenarios

### Scenario 1: Test Application Functionality

1. Open http://localhost:5000 in browser
2. Navigate through all pages (Dashboard, Transactions, Budgets, Bills)
3. Add a test transaction
4. Create a test budget
5. Add a test bill
6. Verify AI categorization works (requires valid OpenAI API key)

### Scenario 2: Test Container Restart

```powershell
# Stop the container
docker stop finance-app-test

# Start it again
docker start finance-app-test

# Verify data persists (if using volumes)
Invoke-RestMethod -Uri http://localhost:5000/api/transactions
```

### Scenario 3: Test Resource Usage

```powershell
# Monitor container resources
docker stats finance-app-test

# Check container processes
docker top finance-app-test
```

### Scenario 4: Test Container Shell Access

```powershell
# Access container shell
docker exec -it finance-app-test sh

# Inside container, check files
ls -la /app
ls -la /app/public
cat /app/package.json
exit
```

## Performance Testing

### Test Load with PowerShell

```powershell
# Simple load test - 100 requests
1..100 | ForEach-Object -Parallel {
    Invoke-WebRequest -Uri http://localhost:5000/api/health -UseBasicParsing
} -ThrottleLimit 10

# Monitor during load
docker stats finance-app-test --no-stream
```

### Test with Apache Bench (if available)

```powershell
# Install via Chocolatey
choco install apache-httpd

# Run load test
ab -n 1000 -c 10 http://localhost:5000/api/health
```

## Troubleshooting

### Container Won't Start

```powershell
# Check logs
docker logs finance-app-test

# Check if port is already in use
netstat -ano | findstr :5000

# Try a different port
docker run -d --name finance-app-test -p 5001:5000 --env-file .env finance-app:test
```

### Build Failures

```powershell
# Clean Docker cache and rebuild
docker builder prune -a
docker build --no-cache -t finance-app:test .

# Check Dockerfile syntax
Get-Content Dockerfile
```

### Application Errors

```powershell
# View detailed logs
docker logs --tail 100 finance-app-test

# Check environment variables
docker exec finance-app-test env

# Check if files were copied correctly
docker exec finance-app-test ls -la /app
docker exec finance-app-test ls -la /app/public
```

### Database Issues

```powershell
# Check database file exists
docker exec finance-app-test ls -la /app/data

# Inspect volume (if using volumes)
docker volume inspect finance-data
```

## Cleanup

### Remove Container

```powershell
# Stop and remove container
docker stop finance-app-test
docker rm finance-app-test

# Or force remove
docker rm -f finance-app-test
```

### Remove Image

```powershell
# Remove the test image
docker rmi finance-app:test

# Remove all unused images
docker image prune -a
```

### Remove Volume

```powershell
# Remove the data volume
docker volume rm finance-data

# Remove all unused volumes
docker volume prune
```

### Complete Cleanup

```powershell
# Stop and remove all containers
docker rm -f $(docker ps -aq)

# Remove all images
docker rmi -f $(docker images -q)

# Remove all volumes
docker volume prune -f

# Remove all unused resources
docker system prune -a --volumes
```

## Testing Docker Compose (Alternative)

Create `docker-compose.yml` for easier testing:

```yaml
version: '3.8'

services:
  finance-app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - finance-data:/app/data
    restart: unless-stopped

volumes:
  finance-data:
```

Run with Docker Compose:

```powershell
# Start services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v
```

## Next Steps

Once local testing is successful:

1. ✓ Commit your changes to Git
2. ✓ Push to your repository
3. ✓ Follow the DEPLOYMENT.md guide for Azure deployment
4. ✓ Set up the CI/CD pipeline in Azure DevOps

## Additional Resources

- Docker Desktop Documentation: https://docs.docker.com/desktop/windows/
- Docker CLI Reference: https://docs.docker.com/engine/reference/commandline/cli/
- WSL 2 Guide: https://docs.microsoft.com/windows/wsl/install
- PowerShell Docker Module: https://github.com/Docker/docker-powershell
