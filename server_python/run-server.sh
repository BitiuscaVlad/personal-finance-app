#!/bin/bash
# Bash script to run the FastAPI server (Linux/Mac)
# Usage: ./run-server.sh

echo "Starting FastAPI Personal Finance Server..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

# Check Python version
echo "Using $(python3 --version)"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating one..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies if needed
if [ ! -d "venv/lib/python*/site-packages/fastapi" ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "Please edit .env file with your configuration"
fi

# Run the server
echo ""
echo "Starting server on http://localhost:5000"
echo "API Documentation: http://localhost:5000/docs"
echo "Press Ctrl+C to stop the server"
echo ""

python3 main.py
