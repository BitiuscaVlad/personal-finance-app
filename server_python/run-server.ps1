# PowerShell script to run the FastAPI server
# Usage: .\run-server.ps1

Write-Host "Starting FastAPI Personal Finance Server..." -ForegroundColor Green

# Check if Python is installed
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Python is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check Python version
$pythonVersion = python --version 2>&1
Write-Host "Using $pythonVersion" -ForegroundColor Cyan

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "Virtual environment not found. Creating one..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& ".\venv\Scripts\Activate.ps1"

# Install dependencies if needed
if (-not (Test-Path "venv\Lib\site-packages\fastapi")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "Warning: .env file not found. Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "Please edit .env file with your configuration" -ForegroundColor Yellow
}

# Run the server
Write-Host "`nStarting server on http://localhost:5000" -ForegroundColor Green
Write-Host "API Documentation: http://localhost:5000/docs" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server`n" -ForegroundColor Yellow

python main.py
