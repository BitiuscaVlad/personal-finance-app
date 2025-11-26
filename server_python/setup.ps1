# Quick Setup Script for FastAPI Server with Logfire
# This script helps you set up the server quickly

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Personal Finance API - Quick Setup with Logfire" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "Checking Python installation..." -ForegroundColor Yellow
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ from https://python.org" -ForegroundColor Red
    exit 1
}

$pythonVersion = python --version 2>&1
Write-Host "✅ $pythonVersion" -ForegroundColor Green
Write-Host ""

# Create virtual environment
Write-Host "Setting up virtual environment..." -ForegroundColor Yellow
if (-not (Test-Path "venv")) {
    python -m venv venv
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "✅ Virtual environment already exists" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"
Write-Host "✅ Virtual environment activated" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Setup .env file
Write-Host "Setting up environment variables..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file from template" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  Please edit .env file with your configuration:" -ForegroundColor Yellow
    Write-Host "   - OPENAI_API_KEY (optional, for AI categorization)" -ForegroundColor Cyan
    Write-Host "   - LOGFIRE_TOKEN (optional, for observability)" -ForegroundColor Cyan
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}
Write-Host ""

# Logfire setup
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Logfire Observability Setup (Optional)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Logfire provides comprehensive monitoring and logging." -ForegroundColor White
Write-Host "The server works perfectly fine without it!" -ForegroundColor White
Write-Host ""
Write-Host "To enable Logfire:" -ForegroundColor Yellow
Write-Host "1. Visit: https://logfire.pydantic.dev" -ForegroundColor Cyan
Write-Host "2. Sign up (free tier available)" -ForegroundColor Cyan
Write-Host "3. Create a project and copy your token" -ForegroundColor Cyan
Write-Host "4. Add to .env file: LOGFIRE_TOKEN=your_token_here" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or use the CLI:" -ForegroundColor Yellow
Write-Host "   logfire auth" -ForegroundColor Cyan
Write-Host ""
Write-Host "See LOGFIRE_GUIDE.md for complete documentation" -ForegroundColor White
Write-Host ""

# Ask if user wants to configure Logfire now
$setupLogfire = Read-Host "Do you want to authenticate with Logfire now? (y/n)"
if ($setupLogfire -eq "y" -or $setupLogfire -eq "Y") {
    Write-Host ""
    Write-Host "Running Logfire authentication..." -ForegroundColor Yellow
    logfire auth
    Write-Host ""
}

# Summary
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit .env file with your API keys (if needed)" -ForegroundColor White
Write-Host "2. Run the server:" -ForegroundColor White
Write-Host "   python main.py" -ForegroundColor Cyan
Write-Host "   or" -ForegroundColor White
Write-Host "   .\run-server.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "The server will be available at:" -ForegroundColor Yellow
Write-Host "  • API: http://localhost:5000" -ForegroundColor Cyan
Write-Host "  • Swagger Docs: http://localhost:5000/docs" -ForegroundColor Cyan
Write-Host "  • ReDoc: http://localhost:5000/redoc" -ForegroundColor Cyan
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  • README.md - Complete server documentation" -ForegroundColor Cyan
Write-Host "  • LOGFIRE_GUIDE.md - Logfire setup and features" -ForegroundColor Cyan
Write-Host "  • QUICKSTART.md - Quick start guide" -ForegroundColor Cyan
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green
Write-Host ""
