# FastAPI Python Server - Quick Start Guide

This guide will help you quickly set up and run the Python FastAPI server.

## Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

## Quick Start (Windows)

1. **Navigate to the Python server directory:**
   ```powershell
   cd server_python
   ```

2. **Run the startup script:**
   ```powershell
   .\run-server.ps1
   ```
   
   This script will automatically:
   - Create a virtual environment
   - Install all dependencies
   - Create a .env file from template
   - Start the server

3. **Configure your OpenAI API key (optional for AI features):**
   - Edit the `.env` file
   - Add your OpenAI API key: `OPENAI_API_KEY=sk-...`

4. **Access the server:**
   - API: http://localhost:5000
   - Interactive API docs: http://localhost:5000/docs
   - Alternative docs: http://localhost:5000/redoc

## Quick Start (Linux/Mac)

1. **Navigate to the Python server directory:**
   ```bash
   cd server_python
   ```

2. **Make the script executable and run it:**
   ```bash
   chmod +x run-server.sh
   ./run-server.sh
   ```

## Manual Setup (All Platforms)

If you prefer to set up manually:

```bash
# 1. Navigate to server_python directory
cd server_python

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Create .env file
cp .env.example .env
# Edit .env with your configuration

# 6. Run the server
python main.py
```

## Testing the API

Once the server is running, you can test it:

### Using the Browser
Visit http://localhost:5000/docs for an interactive API interface.

### Using curl
```bash
# Health check
curl http://localhost:5000/api/health

# Get all categories
curl http://localhost:5000/api/categories

# Get dashboard summary
curl http://localhost:5000/api/dashboard/summary
```

### Using PowerShell
```powershell
# Health check
Invoke-RestMethod http://localhost:5000/api/health

# Get all categories
Invoke-RestMethod http://localhost:5000/api/categories
```

## Connecting the React Frontend

The React frontend (in the `client` folder) can connect to this Python server just like it connects to the Node.js server. Just make sure the server is running on port 5000.

## Key Features

- ✅ **Same API as Node.js server** - Drop-in replacement
- ✅ **Better performance** - FastAPI is one of the fastest Python frameworks
- ✅ **Auto-generated docs** - Swagger UI and ReDoc included
- ✅ **Type validation** - Pydantic models ensure data integrity
- ✅ **Async support** - Non-blocking I/O operations
- ✅ **All features included**:
  - Multi-currency support
  - AI categorization
  - Scheduled exchange rate updates
  - SQLite database with auto-initialization

## Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.

## Troubleshooting

### "Python is not recognized"
Make sure Python is installed and added to your PATH.

### Port 5000 already in use
Change the PORT in your `.env` file or stop the other application using port 5000.

### Database errors
Delete the `database/finance.db` file to reset the database.

### Missing dependencies
Run `pip install -r requirements.txt` again.

## Next Steps

- Check out the full [README.md](README.md) for detailed documentation
- Explore the API at http://localhost:5000/docs
- Configure your OpenAI API key for AI features
- Review the code in the various modules

## Comparison with Node.js Server

| Feature | Node.js | FastAPI (Python) |
|---------|---------|------------------|
| Performance | Fast | Very Fast |
| API Docs | Manual | Auto-generated |
| Type Safety | TypeScript (optional) | Built-in with Pydantic |
| Async Support | Yes | Yes |
| Learning Curve | Moderate | Easy (Python) |
| Community | Large | Growing |

Both servers provide identical functionality - choose based on your preference!
