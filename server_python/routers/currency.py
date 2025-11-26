"""
Currency API Router
"""
from fastapi import APIRouter, HTTPException
from typing import List

from models.schemas import (
    CurrencyRates, CurrencyConvertRequest, CurrencyConvertResponse,
    CurrencyPreference, Currency, MessageResponse
)
from database.db import execute_query, execute_update
from services.currency_service import get_latest_rates, convert_currency, update_exchange_rates

router = APIRouter()


@router.get("/rates", response_model=CurrencyRates)
async def get_rates():
    """Get all available currencies and their rates"""
    try:
        rates_data = await get_latest_rates()
        return {
            "rates": rates_data["rates"],
            "date": rates_data["date"],
            "source": rates_data["source"],
            "baseCurrency": "RON"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/convert", response_model=CurrencyConvertResponse)
async def convert(request: CurrencyConvertRequest):
    """Convert amount between currencies"""
    if not request.amount or not request.fromCurrency or not request.toCurrency:
        raise HTTPException(
            status_code=400,
            detail="Missing required fields: amount, fromCurrency, toCurrency"
        )
    
    try:
        converted_amount = await convert_currency(
            request.amount,
            request.fromCurrency,
            request.toCurrency
        )
        
        from datetime import datetime
        return {
            "originalAmount": request.amount,
            "fromCurrency": request.fromCurrency,
            "toCurrency": request.toCurrency,
            "convertedAmount": converted_amount,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/preference", response_model=CurrencyPreference)
async def get_preference():
    """Get user's display currency preference"""
    result = execute_query(
        "SELECT value FROM user_preferences WHERE key = ?",
        ("display_currency",),
        fetch_one=True
    )
    
    display_currency = result["value"] if result else "RON"
    return {"displayCurrency": display_currency}


@router.put("/preference", response_model=dict)
async def set_preference(preference: CurrencyPreference):
    """Set user's display currency preference"""
    if not preference.displayCurrency:
        raise HTTPException(status_code=400, detail="displayCurrency is required")
    
    sql = """
        INSERT OR REPLACE INTO user_preferences (key, value, updated_at) 
        VALUES ('display_currency', ?, CURRENT_TIMESTAMP)
    """
    execute_update(sql, (preference.displayCurrency,))
    
    return {
        "displayCurrency": preference.displayCurrency,
        "message": "Preference updated successfully"
    }


@router.post("/update-rates", response_model=dict)
async def trigger_update_rates():
    """Manually trigger exchange rate update (admin endpoint)"""
    try:
        success = await update_exchange_rates()
        if success:
            rates_data = await get_latest_rates()
            return {
                "message": "Exchange rates updated successfully",
                "date": rates_data["date"],
                "currencyCount": len(rates_data["rates"])
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to update exchange rates")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/currencies", response_model=List[Currency])
async def get_currencies():
    """Get available currencies list"""
    try:
        rates_data = await get_latest_rates()
        currencies = [
            {"code": code, "name": get_currency_name(code)}
            for code in rates_data["rates"].keys()
        ]
        return currencies
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_currency_name(code: str) -> str:
    """Helper function to get currency names"""
    currency_names = {
        'RON': 'Romanian Leu',
        'USD': 'US Dollar',
        'EUR': 'Euro',
        'GBP': 'British Pound',
        'CHF': 'Swiss Franc',
        'JPY': 'Japanese Yen',
        'CAD': 'Canadian Dollar',
        'AUD': 'Australian Dollar',
        'CNY': 'Chinese Yuan',
        'SEK': 'Swedish Krona',
        'NOK': 'Norwegian Krone',
        'DKK': 'Danish Krone',
        'PLN': 'Polish Zloty',
        'HUF': 'Hungarian Forint',
        'CZK': 'Czech Koruna',
        'BGN': 'Bulgarian Lev',
        'TRY': 'Turkish Lira',
        'RUB': 'Russian Ruble',
        'INR': 'Indian Rupee',
        'BRL': 'Brazilian Real',
        'ZAR': 'South African Rand',
        'MXN': 'Mexican Peso'
    }
    return currency_names.get(code, code)
