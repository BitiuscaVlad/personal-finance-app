# FastAPI Personal Finance Server - Python Implementation

## Overview
This is a FastAPI implementation of the Personal Finance Application server, providing a high-performance Python alternative to the Node.js version.

## Features
- ✅ All REST API endpoints from the original Node.js server
- ✅ Multi-currency support with BNR exchange rates
- ✅ AI-powered transaction categorization using OpenAI
- ✅ SQLite database with automatic initialization
- ✅ Scheduled exchange rate updates
- ✅ Auto-generated API documentation (Swagger/OpenAPI)
- ✅ CORS enabled for frontend integration
- ✅ Async/await for optimal performance
- ✅ **Logfire integration for observability and monitoring**

## Project Structure
```
server_python/
├── main.py                          # FastAPI application entry point
├── requirements.txt                 # Python dependencies
├── .env.example                     # Environment variables template
├── database/
│   ├── __init__.py
│   ├── db.py                        # Database connection and queries
│   └── finance.db                   # SQLite database (auto-created)
├── models/
│   ├── __init__.py
│   └── schemas.py                   # Pydantic models for validation
├── routers/
│   ├── __init__.py
│   ├── categories.py                # Categories endpoints
│   ├── transactions.py              # Transactions endpoints
│   ├── budgets.py                   # Budgets endpoints
│   ├── bills.py                     # Bills endpoints
│   ├── dashboard.py                 # Dashboard endpoints
│   └── currency.py                  # Currency endpoints
└── services/
    ├── __init__.py
    ├── ai_categorization_service.py # OpenAI integration
    └── currency_service.py          # Exchange rate management
```

## Setup

### 1. Install Python 3.8+
Make sure you have Python 3.8 or higher installed:
```bash
python --version
```

### 2. Create Virtual Environment (Recommended)
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux/Mac
python -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
DB_PATH=./database/finance.db
OPENAI_API_KEY=your_openai_api_key_here
ENV=development

# Optional: Logfire token for observability
LOGFIRE_TOKEN=your_logfire_token_here
```

> **Note**: See [LOGFIRE_GUIDE.md](LOGFIRE_GUIDE.md) for complete Logfire setup and features.

### 5. Run the Server
```bash
# Development mode with auto-reload
python main.py

# Or using uvicorn directly
uvicorn main:app --reload --port 5000
```

## API Endpoints

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/{id}` - Get category by ID
- `POST /api/categories` - Create category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

### Transactions
- `GET /api/transactions` - Get all transactions (with filters)
- `GET /api/transactions/{id}` - Get transaction by ID
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/{id}` - Update transaction
- `DELETE /api/transactions/{id}` - Delete transaction
- `POST /api/transactions/suggest-category` - AI category suggestion

### Budgets
- `GET /api/budgets` - Get all budgets
- `GET /api/budgets/{id}` - Get budget by ID
- `GET /api/budgets/spending/{month}/{year}` - Get budgets with spending
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/{id}` - Update budget
- `DELETE /api/budgets/{id}` - Delete budget

### Bills
- `GET /api/bills` - Get all bills
- `GET /api/bills/{id}` - Get bill by ID
- `POST /api/bills` - Create bill
- `PUT /api/bills/{id}` - Update bill
- `PATCH /api/bills/{id}/pay` - Mark bill as paid
- `DELETE /api/bills/{id}` - Delete bill

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard summary
- `GET /api/dashboard/spending-by-category` - Get spending by category
- `GET /api/dashboard/recent-transactions` - Get recent transactions

### Currency
- `GET /api/currency/rates` - Get exchange rates
- `POST /api/currency/convert` - Convert between currencies
- `GET /api/currency/preference` - Get display currency preference
- `PUT /api/currency/preference` - Set display currency preference
- `POST /api/currency/update-rates` - Manually update rates
- `GET /api/currency/currencies` - Get available currencies

### Health
- `GET /api/health` - Health check endpoint

## API Documentation

Once the server is running, you can access:
- **Swagger UI**: http://localhost:5000/docs
- **ReDoc**: http://localhost:5000/redoc
- **OpenAPI JSON**: http://localhost:5000/openapi.json

## Features Details

### Logfire Observability
The server is fully instrumented with [Pydantic Logfire](https://logfire.pydantic.dev) for comprehensive monitoring:
- Automatic HTTP request/response tracking
- Database query monitoring
- External API call tracking (OpenAI, BNR)
- Performance metrics and tracing
- Error tracking with full context
- Works with or without Logfire token

See [LOGFIRE_GUIDE.md](LOGFIRE_GUIDE.md) for complete documentation.

### Automatic Database Initialization
The database is automatically created with all required tables on first run. Default categories are also inserted.

### Scheduled Exchange Rate Updates
Exchange rates from BNR (Banca Națională a României) are automatically updated daily at 2:00 AM.

### AI Transaction Categorization
Uses OpenAI GPT-3.5 to suggest categories based on transaction descriptions. Requires `OPENAI_API_KEY` in environment variables.

### Multi-Currency Support
- All monetary amounts can be stored in different currencies
- Automatic conversion between currencies using BNR exchange rates
- User can set preferred display currency

## Development

### Running Tests
```bash
pytest
```

### Code Formatting
```bash
black .
```

### Type Checking
```bash
mypy .
```

## Production Deployment

### Using Gunicorn
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:5000
```

### Using Docker
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
```

## Differences from Node.js Version
- Uses FastAPI instead of Express.js
- Async/await throughout for better performance
- Automatic API documentation generation
- Pydantic models for request/response validation
- Type hints for better IDE support and code quality

## Performance
FastAPI is one of the fastest Python web frameworks:
- Comparable to Node.js and Go
- Automatic validation with Pydantic
- Async support for I/O operations
- Built on Starlette and uses uvicorn

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Database Locked
Make sure only one instance of the server is running.

### OpenAI API Errors
Check that your `OPENAI_API_KEY` is valid and has sufficient credits.

## License
Same as the main project.
