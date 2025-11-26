# Deployment Guide - Personal Finance App on Azure

This guide walks you through deploying the Personal Finance App to Azure using Azure Container Apps and Azure DevOps CI/CD pipeline.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Azure Resources Setup](#azure-resources-setup)
3. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
4. [Configuration](#configuration)
5. [Deployment](#deployment)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Prerequisites

- Azure subscription (create one at https://azure.microsoft.com/free/)
- Azure DevOps account (create one at https://dev.azure.com)
- Azure CLI installed locally (optional, for manual setup)
- Docker installed locally (for testing)
- Git repository hosted (Azure Repos, GitHub, etc.)

## Azure Resources Setup

### 1. Create Azure Container Registry (ACR)

```bash
# Set variables
RESOURCE_GROUP="finance-app-rg"
LOCATION="eastus"
ACR_NAME="yourfinanceappacr"  # Must be globally unique

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create container registry
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true
```

### 2. Create Azure Container Apps Environment

```bash
# Install Container Apps extension
az extension add --name containerapp --upgrade

# Create Container Apps environment
az containerapp env create \
  --name finance-app-env \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION
```

### 3. Create Azure Container App

```bash
# Create the container app (initial deployment)
az containerapp create \
  --name finance-app \
  --resource-group $RESOURCE_GROUP \
  --environment finance-app-env \
  --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest \
  --target-port 5000 \
  --ingress external \
  --cpu 0.5 \
  --memory 1.0Gi \
  --min-replicas 1 \
  --max-replicas 3
```

### 4. Add Secrets to Container App

```bash
# Add OpenAI API key as secret
az containerapp secret set \
  --name finance-app \
  --resource-group $RESOURCE_GROUP \
  --secrets openai-api-key=YOUR_OPENAI_API_KEY_HERE
```

### 5. Configure Persistent Storage (Optional)

For persistent SQLite database across container restarts:

```bash
# Create storage account
STORAGE_ACCOUNT="financeappstorage"
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS

# Create file share
az storage share create \
  --name finance-data \
  --account-name $STORAGE_ACCOUNT

# Mount storage to Container App
az containerapp env storage set \
  --name finance-app-env \
  --resource-group $RESOURCE_GROUP \
  --storage-name finance-data \
  --azure-file-account-name $STORAGE_ACCOUNT \
  --azure-file-account-key $(az storage account keys list -n $STORAGE_ACCOUNT --query [0].value -o tsv) \
  --azure-file-share-name finance-data \
  --access-mode ReadWrite

# Update container app to use the storage
az containerapp update \
  --name finance-app \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars DATABASE_PATH=/mnt/data/finance.db
```

## CI/CD Pipeline Setup

### 1. Create Service Connections in Azure DevOps

#### Azure Container Registry Service Connection

1. Go to your Azure DevOps project
2. Navigate to **Project Settings** > **Service connections**
3. Click **New service connection** > **Docker Registry**
4. Select **Azure Container Registry**
5. Choose your subscription and ACR
6. Name it: `your-acr-service-connection`
7. Save

#### Azure Resource Manager Service Connection

1. Click **New service connection** > **Azure Resource Manager**
2. Select **Service principal (automatic)**
3. Choose your subscription and resource group
4. Name it: `your-azure-subscription`
5. Save

### 2. Update Pipeline Variables

Edit `azure-pipelines.yml` and update these variables:

```yaml
variables:
  dockerRegistryServiceConnection: 'your-acr-service-connection'
  imageRepository: 'personal-finance-app'
  containerRegistry: 'yourfinanceappacr.azurecr.io'  # Your ACR name
  azureSubscription: 'your-azure-subscription'
  containerAppName: 'finance-app'
  resourceGroupName: 'finance-app-rg'
```

### 3. Create Pipeline in Azure DevOps

1. Go to **Pipelines** > **New Pipeline**
2. Select your repository source (Azure Repos Git, GitHub, etc.)
3. Select **Existing Azure Pipelines YAML file**
4. Choose `azure-pipelines.yml`
5. Click **Run**

## Configuration

### Environment Variables

The following environment variables are configured in the Container App:

| Variable | Description | Set In |
|----------|-------------|--------|
| `NODE_ENV` | Environment mode | Pipeline |
| `PORT` | Server port | Pipeline |
| `OPENAI_API_KEY` | OpenAI API key for AI categorization | Azure Secret |
| `DATABASE_PATH` | Path to SQLite database | Container App (if using persistent storage) |

### Update Secrets

To update the OpenAI API key or add new secrets:

```bash
az containerapp secret set \
  --name finance-app \
  --resource-group $RESOURCE_GROUP \
  --secrets openai-api-key=NEW_API_KEY_HERE
```

## Deployment

### Automatic Deployment

The pipeline automatically deploys when you push to the `main` branch:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

### Manual Deployment

Trigger a manual deployment in Azure DevOps:

1. Go to **Pipelines**
2. Select your pipeline
3. Click **Run pipeline**
4. Select the branch
5. Click **Run**

### Local Docker Testing

Before pushing to production, test the Docker image locally:

```bash
# Build the image
docker build -t finance-app:test .

# Run the container
docker run -p 5000:5000 \
  -e OPENAI_API_KEY=your_key_here \
  finance-app:test

# Test the application
# Open http://localhost:5000
# Or test the health endpoint: curl http://localhost:5000/api/health
```

## Monitoring and Maintenance

### View Application Logs

```bash
# Stream logs
az containerapp logs show \
  --name finance-app \
  --resource-group $RESOURCE_GROUP \
  --follow

# View recent logs
az containerapp logs show \
  --name finance-app \
  --resource-group $RESOURCE_GROUP \
  --tail 100
```

### Scale the Application

```bash
# Manual scaling
az containerapp update \
  --name finance-app \
  --resource-group $RESOURCE_GROUP \
  --min-replicas 2 \
  --max-replicas 5

# Auto-scaling based on HTTP requests
az containerapp update \
  --name finance-app \
  --resource-group $RESOURCE_GROUP \
  --scale-rule-name http-rule \
  --scale-rule-type http \
  --scale-rule-http-concurrency 50
```

### Update Environment Variables

```bash
az containerapp update \
  --name finance-app \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars NEW_VAR=value
```

### Rollback to Previous Version

```bash
# List revisions
az containerapp revision list \
  --name finance-app \
  --resource-group $RESOURCE_GROUP \
  -o table

# Activate a specific revision
az containerapp revision activate \
  --name finance-app \
  --resource-group $RESOURCE_GROUP \
  --revision <revision-name>
```

### Monitor Application Health

```bash
# Get application URL
az containerapp show \
  --name finance-app \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn \
  -o tsv

# Test health endpoint
curl https://$(az containerapp show \
  --name finance-app \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn \
  -o tsv)/api/health
```

### Cost Optimization

- **Scale to Zero**: Container Apps can scale to zero when not in use
  ```bash
  az containerapp update \
    --name finance-app \
    --resource-group $RESOURCE_GROUP \
    --min-replicas 0
  ```

- **Choose appropriate SKU**: Review and adjust CPU/memory based on actual usage
- **Monitor costs**: Use Azure Cost Management to track spending

## Troubleshooting

### Container Fails to Start

1. Check logs: `az containerapp logs show --name finance-app --resource-group $RESOURCE_GROUP --follow`
2. Verify environment variables are set correctly
3. Ensure secrets are properly configured

### Database Issues

1. Verify persistent storage is mounted correctly
2. Check file permissions in the container
3. Review DATABASE_PATH environment variable

### Build Failures

1. Check Azure DevOps pipeline logs
2. Verify service connections are valid
3. Ensure Dockerfile builds locally first

### Performance Issues

1. Review application metrics in Azure Portal
2. Check logs for errors or slow queries
3. Consider scaling up CPU/memory or adding replicas

## Security Best Practices

1. **Never commit secrets**: Use Azure Key Vault or Container App secrets
2. **Enable HTTPS**: Container Apps provide automatic HTTPS
3. **Restrict ingress**: Configure IP restrictions if needed
4. **Regular updates**: Keep dependencies updated
5. **Monitor logs**: Set up Azure Monitor alerts for errors

## Alternative: Deploy to Azure App Service

If you prefer Azure App Service over Container Apps:

```bash
# Create App Service Plan
az appservice plan create \
  --name finance-app-plan \
  --resource-group $RESOURCE_GROUP \
  --is-linux \
  --sku B1

# Create Web App
az webapp create \
  --name finance-app \
  --resource-group $RESOURCE_GROUP \
  --plan finance-app-plan \
  --deployment-container-image-name $ACR_NAME.azurecr.io/personal-finance-app:latest

# Configure registry credentials
az webapp config container set \
  --name finance-app \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name $ACR_NAME.azurecr.io/personal-finance-app:latest \
  --docker-registry-server-url https://$ACR_NAME.azurecr.io \
  --docker-registry-server-user $(az acr credential show -n $ACR_NAME --query username -o tsv) \
  --docker-registry-server-password $(az acr credential show -n $ACR_NAME --query passwords[0].value -o tsv)
```

Update `azure-pipelines.yml` to deploy to App Service instead by replacing the Deploy stage with Azure Web App deployment task.

## Support

For issues or questions:
- Check Azure Container Apps documentation: https://docs.microsoft.com/azure/container-apps/
- Review Azure DevOps pipeline documentation: https://docs.microsoft.com/azure/devops/pipelines/
- Open an issue in the project repository
