"""
Currency Service for exchange rate management
Fetches rates from BNR (Banca Națională a României) API
"""
import httpx
import xml.etree.ElementTree as ET
from datetime import datetime, date
import logfire

from database.db import execute_query, execute_insert, get_db

# BNR API URL - provides daily exchange rates
BNR_API_URL = "https://www.bnr.ro/nbrfxrates.xml"


async def fetch_bnr_rates() -> dict:
    """
    Fetches exchange rates from BNR (Banca Națională a României) API
    Returns rates relative to RON (Romanian Leu)
    """
    with logfire.span("fetch_bnr_rates"):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    BNR_API_URL,
                    headers={"User-Agent": "Finance-App/1.0"}
                )
                response.raise_for_status()
            
            # Parse XML response
            root = ET.fromstring(response.text)
            
            # Find the Cube element
            cube = root.find(".//{http://www.bnr.ro/xsd}Cube")
            if cube is None:
                raise ValueError("Invalid response format from BNR API")
            
            # Get date
            rate_date = cube.get("date", datetime.now().strftime("%Y-%m-%d"))
            
            # Parse exchange rates
            exchange_rates = {}
            exchange_rates["RON"] = {"rate": 1.0, "date": rate_date}
            
            for rate_elem in cube.findall(".//{http://www.bnr.ro/xsd}Rate"):
                currency_code = rate_elem.get("currency")
                multiplier = int(rate_elem.get("multiplier", "1"))
                rate_value = float(rate_elem.text)
                
                if currency_code and rate_value:
                    # BNR gives rates as: 1 unit of foreign currency = X RON
                    # If multiplier is present, it means: multiplier units = X RON
                    # We need: 1 foreign currency = X/multiplier RON
                    exchange_rates[currency_code] = {
                        "rate": rate_value / multiplier,
                        "date": rate_date
                    }
            
            logfire.info("BNR rates fetched successfully", 
                        date=rate_date, 
                        currency_count=len(exchange_rates))
            return {"exchangeRates": exchange_rates, "date": rate_date}
            
        except Exception as error:
            logfire.error("Error fetching BNR rates", error=str(error))
            raise Exception("Failed to fetch exchange rates from BNR")
async def save_rates_to_database(rates: dict, rate_date: str):
    """Saves exchange rates to database"""
    with logfire.span("save_rates_to_database", rate_date=rate_date, count=len(rates)):
        with get_db() as conn:
            cursor = conn.cursor()
            
            for currency, rate_value in rates.items():
                cursor.execute(
                    """INSERT OR REPLACE INTO exchange_rates (currency_code, rate, date)
                       VALUES (?, ?, ?)""",
                    (currency, rate_value["rate"], rate_date)
                )
            
            conn.commit()
            logfire.info("Exchange rates saved to database", 
                        date=rate_date, 
                        currency_count=len(rates))


async def get_cached_rates(rate_date: str) -> dict:
    """Gets cached exchange rates from database for a specific date"""
    rows = execute_query(
        "SELECT currency_code, rate FROM exchange_rates WHERE date = ?",
        (rate_date,)
    )
    
    if not rows:
        return None
    
    rates = {}
    for row in rows:
        rates[row["currency_code"]] = row["rate"]
    
    return rates


async def get_latest_rates() -> dict:
    """Gets the latest available exchange rates"""
    with logfire.span("get_latest_rates"):
        today = date.today().strftime("%Y-%m-%d")
        
        # Try to get today's rates from cache
        cached = await get_cached_rates(today)
        if cached:
            logfire.info("Using cached exchange rates", date=today)
            return {"rates": cached, "date": today, "source": "cache"}
    
    # Fetch fresh rates from BNR
    try:
        bnr_data = await fetch_bnr_rates()
        exchange_rates = bnr_data["exchangeRates"]
        rate_date = bnr_data["date"]
        
        await save_rates_to_database(exchange_rates, rate_date)
        
        rates = {currency: data["rate"] for currency, data in exchange_rates.items()}
        return {"rates": rates, "date": rate_date, "source": "bnr"}
        
    except Exception as error:
        # If fetch fails, try to get the most recent cached rates
        rows = execute_query(
            """SELECT currency_code, rate, date 
               FROM exchange_rates 
               WHERE date = (SELECT MAX(date) FROM exchange_rates)"""
        )
        
        if not rows:
            raise Exception("No exchange rates available")
        
        rates = {}
        rate_date = rows[0]["date"]
        for row in rows:
            rates[row["currency_code"]] = row["rate"]
        
        return {"rates": rates, "date": rate_date, "source": "cache-fallback"}


async def convert_currency(
    amount: float,
    from_currency: str,
    to_currency: str,
    rates: dict = None
) -> float:
    """
    Converts amount from one currency to another
    
    Args:
        amount: The amount to convert
        from_currency: Source currency code
        to_currency: Target currency code
        rates: Exchange rates object (optional, will fetch if not provided)
    
    Returns:
        Converted amount rounded to 2 decimals
    """
    if from_currency == to_currency:
        return amount
    
    if rates is None:
        rates_data = await get_latest_rates()
        rates = rates_data["rates"]
    
    if from_currency not in rates or to_currency not in rates:
        raise ValueError(f"Exchange rate not available for {from_currency} or {to_currency}")
    
    # Convert to RON first, then to target currency
    amount_in_ron = amount * rates[from_currency]
    converted_amount = amount_in_ron / rates[to_currency]
    
    return round(converted_amount, 2)


async def update_exchange_rates() -> bool:
    """Updates exchange rates (can be called by cron job)"""
    with logfire.span("update_exchange_rates"):
        try:
            logfire.info("Updating exchange rates from BNR...")
            bnr_data = await fetch_bnr_rates()
            exchange_rates = bnr_data["exchangeRates"]
            rate_date = bnr_data["date"]
            
            await save_rates_to_database(exchange_rates, rate_date)
            logfire.info("Exchange rates updated successfully", date=rate_date)
            return True
            
        except Exception as error:
            logfire.error("Failed to update exchange rates", error=str(error))
            return False
