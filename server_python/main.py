"""
FastAPI Personal Finance Application
Main application entry point
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv
import os
import logfire

from database.db import init_database
from routers import categories, transactions, budgets, bills, dashboard, currency
from services.currency_service import update_exchange_rates

# Load environment variables
load_dotenv()

# Configure Logfire
logfire.configure(
    service_name="personal-finance-api",
    send_to_logfire="if-token-present",
)

# Create scheduler for background tasks
scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown events"""
    # Startup
    logfire.info("Starting up Finance API...")
    init_database()
    
    # Update exchange rates on startup
    try:
        await update_exchange_rates()
        logfire.info("Initial exchange rates updated")
    except Exception as e:
        logfire.error("Initial exchange rate update failed", error=str(e))
    
    # Schedule daily exchange rate updates at 2 AM
    scheduler.add_job(
        update_exchange_rates,
        'cron',
        hour=2,
        minute=0,
        id='update_exchange_rates'
    )
    scheduler.start()
    logfire.info("Scheduled daily exchange rate updates at 2:00 AM")
    
    yield
    
    # Shutdown
    scheduler.shutdown()
    logfire.info("Shutting down Finance API...")


# Create FastAPI app
app = FastAPI(
    title="Personal Finance API",
    description="API for managing personal finances with multi-currency support",
    version="1.0.0",
    lifespan=lifespan
)

# Instrument FastAPI with Logfire
try:
    logfire.instrument_fastapi(app)
    logfire.info("FastAPI instrumentation enabled")
except Exception as e:
    logfire.warn("FastAPI instrumentation not available, continuing without it", error=str(e))
    # Server will work fine without instrumentation, just without automatic request logging

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logfire.error("Unhandled exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": "Something went wrong!"}
    )


# Include routers
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(budgets.router, prefix="/api/budgets", tags=["Budgets"])
app.include_router(bills.router, prefix="/api/bills", tags=["Bills"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(currency.router, prefix="/api/currency", tags=["Currency"])


# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "OK",
        "message": "Finance API is running"
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Personal Finance API",
        "version": "1.0.0",
        "docs": "/docs"
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
