# Logfire Integration Guide

This FastAPI server is fully integrated with [Pydantic Logfire](https://logfire.pydantic.dev) for comprehensive observability, logging, and monitoring.

## Quick Start

### Option 1: Automatic Setup (Recommended)
```powershell
cd server_python
.\setup.ps1
```

This script will:
- ✅ Install dependencies (including Logfire)
- ✅ Create .env file
- ✅ Optionally authenticate with Logfire

### Option 2: Manual Setup
```powershell
# Install dependencies
pip install -r requirements.txt

# Authenticate with Logfire (optional)
logfire auth

# Or add token to .env
# LOGFIRE_TOKEN=your_token_here
```

### Option 3: Run Without Logfire
No setup needed! The server works perfectly without Logfire:
```powershell
python main.py
```

All logs will appear in the console instead.

## What is Logfire?

Logfire is an observability platform built by the creators of Pydantic. It provides:

- 🔍 **Request/Response Tracing** - Automatic tracking of all HTTP requests
- 📊 **Performance Monitoring** - Track response times and bottlenecks
- 🐛 **Error Tracking** - Detailed error logs with context
- 📈 **Database Query Monitoring** - Track all database operations
- 🤖 **OpenAI Integration** - Monitor AI API calls and costs
- 🔗 **Distributed Tracing** - Follow requests across services
- 📉 **Custom Metrics** - Track business-specific metrics

## Features Integrated

### 1. Automatic FastAPI Instrumentation
All HTTP endpoints are automatically instrumented:
```python
logfire.instrument_fastapi(app)
```

This provides:
- Request/response logging
- Performance metrics
- Error tracking
- Query parameter tracking
- Status code monitoring

### 2. Database Operations Tracking
All database queries are logged with spans:
```python
with logfire.span("database_query", query=sql):
    execute_query(sql, params)
```

### 3. External API Monitoring
- **BNR Currency API** - Track exchange rate fetches
- **OpenAI API** - Monitor AI categorization requests and costs

### 4. Application Events
- Server startup/shutdown
- Exchange rate updates
- Database initialization
- Error conditions

## Setup

### 1. Get Logfire Token

1. Visit [https://logfire.pydantic.dev](https://logfire.pydantic.dev)
2. Sign up or log in (free tier available)
3. Create a new project
4. Copy your write token

### 2. Configure Environment

Add to your `.env` file:
```env
LOGFIRE_TOKEN=your_token_here
```

Or set environment variable:
```bash
# Windows PowerShell
$env:LOGFIRE_TOKEN="your_token_here"

# Linux/Mac
export LOGFIRE_TOKEN="your_token_here"
```

### 3. Run the Server

```bash
python main.py
```

Logfire will automatically detect the token and start sending data.

## Running Without Logfire

The server works perfectly fine without Logfire configuration. If no token is present:

```python
logfire.configure(send_to_logfire="if-token-present")
```

This means:
- ✅ Server runs normally
- ✅ All functionality works
- ✅ Logs appear in console
- ❌ Data is not sent to Logfire cloud

## What Gets Logged

### HTTP Requests
```
[INFO] GET /api/categories - 200 OK (15ms)
[INFO] POST /api/transactions - 201 Created (42ms)
[ERROR] GET /api/transactions/999 - 404 Not Found
```

### Database Operations
```
[INFO] Initializing database
[INFO] Added currency column to transactions table
[INFO] Default categories created (count=10)
[INFO] Database initialized successfully
```

### Currency Service
```
[INFO] Updating exchange rates from BNR...
[INFO] BNR rates fetched successfully (date=2025-11-26, currency_count=23)
[INFO] Exchange rates saved to database (date=2025-11-26, currency_count=23)
[INFO] Exchange rates updated successfully
```

### AI Categorization
```
[INFO] AI category suggestion requested (description="Coffee at Starbucks")
[INFO] AI category suggestion successful (category="Dining Out", confidence="high")
```

### Errors
```
[ERROR] OpenAI API error (error="API key invalid")
[ERROR] Failed to update exchange rates (error="Connection timeout")
[ERROR] Unhandled exception (error="...", path="/api/...")
```

## Logfire Dashboard Features

Once data is flowing to Logfire, you'll see:

### 1. Live Tail
Real-time log streaming with filtering

### 2. Traces
Visual representation of request flows:
```
HTTP Request → Database Query → AI API Call → Response
    15ms          5ms            200ms         220ms total
```

### 3. Performance Analytics
- Response time percentiles (p50, p95, p99)
- Slowest endpoints
- Error rates by endpoint
- Request volume over time

### 4. Error Tracking
- Stack traces
- Request context
- User impact
- Error frequency

### 5. Custom Dashboards
Create dashboards for:
- Transaction volume
- Budget utilization
- Currency conversion requests
- AI categorization usage

## Custom Logging

Add your own logging throughout the code:

### Info Logging
```python
logfire.info("User created budget", 
            category="Groceries", 
            amount=500, 
            currency="RON")
```

### Warning Logging
```python
logfire.warn("Budget exceeded", 
            category="Entertainment",
            spent=600,
            budgeted=500)
```

### Error Logging
```python
logfire.error("Payment processing failed",
             amount=100,
             error=str(e))
```

### Custom Spans
```python
with logfire.span("complex_calculation", user_id=123):
    # Your code here
    result = perform_calculation()
    logfire.info("Calculation completed", result=result)
```

## Integration Points in Code

### main.py
- FastAPI instrumentation
- Startup/shutdown events
- Global exception handling

### database/db.py
- Database initialization
- Schema migrations
- Default data seeding

### services/ai_categorization_service.py
- OpenAI API calls with spans
- Category matching logic
- Fallback handling

### services/currency_service.py
- BNR API calls with spans
- Rate caching
- Currency conversions
- Scheduled updates

## Performance Impact

Logfire is designed for production use:
- **Minimal overhead** - <1ms per request
- **Async logging** - No blocking operations
- **Batched uploads** - Efficient network usage
- **Smart sampling** - Can reduce high-volume logging

## Privacy & Security

- Logfire uses TLS encryption
- Sensitive data can be filtered
- PII can be automatically redacted
- Retention policies configurable

## Advanced Configuration

### Custom Service Name
```python
logfire.configure(
    service_name="finance-api-production",
    send_to_logfire="if-token-present"
)
```

### Environment-Based Config
```python
import os

logfire.configure(
    service_name=f"finance-api-{os.getenv('ENV', 'dev')}",
    send_to_logfire="if-token-present",
    console=os.getenv('ENV') == 'development'
)
```

### Scrubbing Sensitive Data
```python
logfire.configure(
    scrubbing_patterns=[
        r'password=\w+',
        r'api_key=[\w-]+',
    ]
)
```

## Troubleshooting

### No Data Appearing in Logfire

1. Check token is set:
```bash
echo $env:LOGFIRE_TOKEN  # Windows
echo $LOGFIRE_TOKEN      # Linux/Mac
```

2. Check logs for errors:
```bash
python main.py
# Look for "Logfire initialized" or error messages
```

3. Verify network connectivity to Logfire servers

### Too Much Logging

Reduce verbosity:
```python
logfire.configure(
    send_to_logfire="if-token-present",
    console=False  # Disable console output
)
```

### Performance Issues

Enable sampling for high-traffic endpoints:
```python
# Sample 10% of requests
logfire.configure(
    sampling_ratio=0.1
)
```

## Cost Considerations

Logfire pricing is based on:
- Number of spans/logs
- Data retention period
- Number of users

**Free Tier** includes:
- Unlimited requests during trial
- 14-day retention
- Community support

For production, estimate based on:
- ~10-20 spans per API request
- Calculate monthly request volume
- Check [pricing page](https://logfire.pydantic.dev/pricing)

## Best Practices

1. **Use Spans for Business Logic**
   ```python
   with logfire.span("process_transaction"):
       # Important business logic
   ```

2. **Add Context to Errors**
   ```python
   logfire.error("Failed to process", 
                transaction_id=123, 
                user_id=456)
   ```

3. **Track Important Metrics**
   ```python
   logfire.info("budget_created", 
               amount=amount,
               category=category,
               month=month)
   ```

4. **Use Structured Logging**
   ```python
   # Good
   logfire.info("User action", action="create", entity="budget")
   
   # Avoid
   logfire.info(f"User created a budget")
   ```

## Alternatives to Logfire

If you prefer other observability tools:

- **OpenTelemetry** - Use `logfire` as OTEL exporter
- **Datadog** - Logfire can export to Datadog
- **New Relic** - Alternative APM platform
- **Sentry** - Error tracking focused

Logfire integrates well with the OTEL ecosystem.

## Resources

- [Logfire Documentation](https://logfire.pydantic.dev/docs)
- [FastAPI Integration Guide](https://logfire.pydantic.dev/docs/integrations/fastapi)
- [Pydantic Blog](https://pydantic.dev/blog)

## Summary

Logfire integration provides:
- ✅ Zero-config automatic instrumentation
- ✅ Comprehensive request/response tracking
- ✅ Database query monitoring
- ✅ External API tracking (OpenAI, BNR)
- ✅ Real-time error tracking
- ✅ Performance analytics
- ✅ Works with or without token

The integration is production-ready and adds minimal overhead while providing enterprise-grade observability.
