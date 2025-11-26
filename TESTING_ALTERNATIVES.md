# Local Testing Without Docker Desktop - Windows 11

Since Docker Desktop is not available, here are your alternatives for testing the deployment locally.

## Option 1: Podman Desktop (Recommended - Docker Alternative)

Podman is a Docker-compatible container engine that's free and open-source.

### Install Podman Desktop

```powershell
# Using winget
winget install -e --id RedHat.Podman-Desktop

# Or download from: https://podman-desktop.io/
```

### Using Podman (same commands as Docker)

```powershell
# Build the image
podman build -t finance-app:test .

# Run the container
podman run -d --name finance-app-test -p 5000:5000 --env-file .env finance-app:test

# View logs
podman logs -f finance-app-test

# Stop and remove
podman rm -f finance-app-test
```

**Advantages:**
- ✓ Docker-compatible CLI
- ✓ Free and open-source
- ✓ No licensing restrictions
- ✓ Works with existing Docker files

## Option 2: Rancher Desktop (Free Alternative)

Rancher Desktop provides container management without licensing restrictions.

### Install Rancher Desktop

```powershell
# Using winget
winget install -e --id suse.RancherDesktop

# Or download from: https://rancherdesktop.io/
```

### Configuration

1. Open Rancher Desktop
2. Choose container runtime: **dockerd (moby)** or **containerd**
3. Enable Kubernetes (optional)
4. Use `docker` or `nerdctl` commands

```powershell
# Using dockerd runtime
docker build -t finance-app:test .
docker run -d --name finance-app-test -p 5000:5000 --env-file .env finance-app:test

# Or using containerd runtime with nerdctl
nerdctl build -t finance-app:test .
nerdctl run -d --name finance-app-test -p 5000:5000 --env-file .env finance-app:test
```

## Option 3: Run Directly on Windows (No Containers)

Test the application without containerization:

### Setup

```powershell
# Navigate to project root
cd "d:\.repos\Workshop\Finance app 4"

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Build the React client
npm run build
```

### Run in Production Mode

```powershell
# Copy built client to server
Copy-Item -Path "client\build\*" -Destination "server\public" -Recurse -Force

# Set environment variables
$env:NODE_ENV = "production"
$env:PORT = "5000"
$env:OPENAI_API_KEY = "your-api-key-here"

# Run the server
cd server
node server.js
```

### Test the Application

Open browser to: http://localhost:5000

## Option 4: Use WSL 2 with Docker Engine (No Desktop)

Install Docker engine directly in WSL 2 without Docker Desktop.

### Install WSL 2

```powershell
# Run as Administrator
wsl --install
# Or install specific distro
wsl --install -d Ubuntu
```

### Inside WSL 2 (Ubuntu)

```bash
# Update packages
sudo apt-get update

# Install Docker engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Start Docker service
sudo service docker start

# Test Docker
docker --version

# Navigate to your project (Windows drives are mounted at /mnt/)
cd /mnt/d/.repos/Workshop/"Finance app 4"

# Build and run
docker build -t finance-app:test .
docker run -d --name finance-app-test -p 5000:5000 --env-file .env finance-app:test

# View logs
docker logs -f finance-app-test
```

### Access from Windows

Open browser to: http://localhost:5000

## Option 5: Azure Container Registry Build (Cloud-based)

Build and test in Azure without local containers.

### Prerequisites

```powershell
# Login to Azure
az login

# Set variables
$ACR_NAME = "yourfinanceappacr"
$RESOURCE_GROUP = "finance-app-rg"
```

### Build in Azure

```powershell
# Build image in Azure Container Registry
az acr build --registry $ACR_NAME --image finance-app:test .

# Run as Azure Container Instance for testing
az container create `
  --resource-group $RESOURCE_GROUP `
  --name finance-app-test `
  --image $ACR_NAME.azurecr.io/finance-app:test `
  --cpu 1 `
  --memory 1 `
  --registry-login-server $ACR_NAME.azurecr.io `
  --registry-username $(az acr credential show -n $ACR_NAME --query username -o tsv) `
  --registry-password $(az acr credential show -n $ACR_NAME --query passwords[0].value -o tsv) `
  --dns-name-label finance-app-test-$(Get-Random) `
  --ports 5000 `
  --environment-variables NODE_ENV=production PORT=5000 `
  --secure-environment-variables OPENAI_API_KEY=your-api-key

# Get URL
az container show `
  --resource-group $RESOURCE_GROUP `
  --name finance-app-test `
  --query ipAddress.fqdn `
  --output tsv

# Clean up when done
az container delete --resource-group $RESOURCE_GROUP --name finance-app-test --yes
```

## Comparison Table

| Option | Pros | Cons | Best For |
|--------|------|------|----------|
| **Podman Desktop** | Docker-compatible, Free, Easy | Newer, some compatibility issues | Drop-in Docker replacement |
| **Rancher Desktop** | Full-featured, Free, Kubernetes | Heavier than Podman | Complete dev environment |
| **Direct on Windows** | No containers needed, Fast | Doesn't test Docker image | Quick functionality testing |
| **WSL 2 + Docker** | Full Docker, Free, Linux env | Requires WSL setup | Linux development workflow |
| **Azure ACR Build** | Real cloud testing, No local setup | Costs money, Slower | Production-like testing |

## Recommended Approach

### For Quick Testing: Option 3 (Direct on Windows)
```powershell
.\test-local-windows.ps1
```

### For Container Testing: Option 1 (Podman)
```powershell
# Install Podman Desktop, then:
.\test-podman-local.ps1
```

### For Production-like Testing: Option 5 (Azure)
```powershell
# Build and test in Azure directly
.\test-azure-cloud.ps1
```

## Next Steps

Choose the option that works best for your environment and constraints. All options will validate that your application is production-ready before deploying to Azure.
