# Node.js to Python FastAPI Migration Guide

This document helps you understand the relationship between the Node.js and Python implementations.

## Side-by-Side Comparison

### Server Entry Point

**Node.js** (`server/server.js`):
```javascript
const express = require('express');
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.listen(PORT);
```

**Python** (`server_python/main.py`):
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware)
uvicorn.run(app, port=PORT)
```

### Database Operations

**Node.js** (`server/database/db.js`):
```javascript
db.all(sql, params, (err, rows) => {
  if (err) { /* handle error */ }
  res.json(rows);
});
```

**Python** (`server_python/database/db.py`):
```python
rows = execute_query(sql, params)
return rows
```

### Route Definitions

**Node.js** (`server/routes/categories.js`):
```javascript
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM categories';
  db.all(sql, [], (err, rows) => {
    res.json(rows);
  });
});
```

**Python** (`server_python/routers/categories.py`):
```python
@router.get("/", response_model=List[Category])
async def get_categories():
    sql = "SELECT * FROM categories"
    return execute_query(sql)
```

### Data Validation

**Node.js**:
- Manual validation in route handlers
- Optional TypeScript for compile-time checks

**Python**:
```python
class CategoryCreate(BaseModel):
    name: str
    type: Literal["income", "expense"]
    color: str
```
- Automatic validation with Pydantic
- Runtime type checking
- Auto-generated documentation

## File Mapping

| Node.js File | Python File | Purpose |
|--------------|-------------|---------|
| `server/server.js` | `server_python/main.py` | Application entry point |
| `server/database/db.js` | `server_python/database/db.py` | Database operations |
| `server/routes/categories.js` | `server_python/routers/categories.py` | Categories endpoints |
| `server/routes/transactions.js` | `server_python/routers/transactions.py` | Transactions endpoints |
| `server/routes/budgets.js` | `server_python/routers/budgets.py` | Budgets endpoints |
| `server/routes/bills.js` | `server_python/routers/bills.py` | Bills endpoints |
| `server/routes/dashboard.js` | `server_python/routers/dashboard.py` | Dashboard endpoints |
| `server/routes/currency.js` | `server_python/routers/currency.py` | Currency endpoints |
| `server/services/aiCategorizationService.js` | `server_python/services/ai_categorization_service.py` | AI service |
| `server/services/currencyService.js` | `server_python/services/currency_service.py` | Currency service |
| `server/package.json` | `server_python/requirements.txt` | Dependencies |
| N/A | `server_python/models/schemas.py` | Data models |

## Feature Parity Checklist

- ✅ **Categories API**: All CRUD operations
- ✅ **Transactions API**: Including AI categorization
- ✅ **Budgets API**: With spending calculations
- ✅ **Bills API**: Including mark as paid
- ✅ **Dashboard API**: Summary and analytics
- ✅ **Currency API**: BNR rates and conversion
- ✅ **Database**: SQLite with same schema
- ✅ **Scheduled Tasks**: Daily exchange rate updates
- ✅ **Error Handling**: Consistent error responses
- ✅ **CORS**: Enabled for frontend
- ✅ **Environment Variables**: Same configuration

## Key Differences

### 1. Async/Await
**Node.js**: Callback-based or Promise-based
**Python**: Fully async/await with `async def`

### 2. Type System
**Node.js**: Optional TypeScript
**Python**: Built-in with type hints + Pydantic validation

### 3. Documentation
**Node.js**: Manual (e.g., Swagger setup required)
**Python**: Auto-generated from code

### 4. Dependency Management
**Node.js**: npm/yarn with package.json
**Python**: pip with requirements.txt

### 5. Error Handling
**Node.js**: Try-catch with middleware
**Python**: HTTPException with FastAPI handlers

## Performance Comparison

| Metric | Node.js (Express) | Python (FastAPI) |
|--------|-------------------|------------------|
| Requests/sec | ~15,000 | ~18,000 |
| Latency (avg) | ~3ms | ~2.5ms |
| Memory | Lower | Slightly Higher |
| Startup Time | Faster | Slower |

*Benchmarks are approximate and depend on workload*

## Migration Steps

### Switching from Node.js to Python:

1. **Stop Node.js server**
   ```bash
   # In server directory
   Ctrl+C
   ```

2. **Start Python server**
   ```powershell
   # In server_python directory
   .\run-server.ps1
   ```

3. **Update frontend (if needed)**
   - No changes required if using same port (5000)
   - Update `REACT_APP_API_URL` in client/.env if using different port

### Running Both Servers:

1. **Node.js on port 5000**
   ```bash
   cd server
   npm start
   ```

2. **Python on port 5001**
   ```bash
   cd server_python
   # Edit .env: PORT=5001
   python main.py
   ```

3. **Switch frontend between servers**
   ```env
   # client/.env
   REACT_APP_API_URL=http://localhost:5000  # Node.js
   # or
   REACT_APP_API_URL=http://localhost:5001  # Python
   ```

## When to Use Each

### Use Node.js if:
- Your team is primarily JavaScript developers
- You need Node.js-specific packages
- Lower memory footprint is critical
- Faster cold starts are important

### Use Python (FastAPI) if:
- Your team is primarily Python developers
- You want auto-generated documentation
- You prefer built-in type validation
- You need data science/ML integration
- Maximum performance is required

## Common Patterns

### Creating a New Endpoint

**Node.js**:
```javascript
// In server/routes/myroute.js
router.get('/endpoint', (req, res) => {
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
```

**Python**:
```python
# In server_python/routers/myroute.py
@router.get("/endpoint", response_model=List[Model])
async def get_endpoint():
    rows = execute_query(sql, params)
    return rows
```

### Error Handling

**Node.js**:
```javascript
if (!result) {
  return res.status(404).json({ error: 'Not found' });
}
```

**Python**:
```python
if not result:
    raise HTTPException(status_code=404, detail="Not found")
```

### Database Queries

**Node.js**:
```javascript
db.run(sql, params, function(err) {
  if (err) return res.status(500).json({ error: err.message });
  res.json({ id: this.lastID });
});
```

**Python**:
```python
record_id = execute_insert(sql, params)
return {"id": record_id}
```

## Testing Both Implementations

You can verify both servers return identical responses:

```bash
# Test Node.js
curl http://localhost:5000/api/categories

# Test Python
curl http://localhost:5001/api/categories

# Compare outputs
```

## Conclusion

Both implementations provide identical functionality. Choose based on:
- Team expertise
- Performance requirements
- Tooling preferences
- Ecosystem needs

The Python FastAPI version offers better out-of-the-box documentation and validation, while the Node.js version may integrate better with JavaScript-heavy stacks.
