const axios = require('axios');
const xml2js = require('xml2js');
const db = require('../database/db');

// BNR API URL - provides daily exchange rates
const BNR_API_URL = 'https://www.bnr.ro/nbrfxrates.xml';

/**
 * Fetches exchange rates from BNR (Banca Națională a României) API
 * Returns rates relative to RON (Romanian Leu)
 */
async function fetchBNRRates() {
  try {
    const response = await axios.get(BNR_API_URL, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Finance-App/1.0'
      }
    });

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);

    if (!result || !result.DataSet || !result.DataSet.Body || !result.DataSet.Body[0].Cube) {
      throw new Error('Invalid response format from BNR API');
    }

    const cube = result.DataSet.Body[0].Cube[0];
    const date = cube.$.date || new Date().toISOString().split('T')[0];
    const rates = cube.Rate || [];

    const exchangeRates = {};
    
    // RON to RON is always 1
    exchangeRates['RON'] = { rate: 1, date };

    // Parse each currency rate
    rates.forEach(rate => {
      const currencyCode = rate.$.currency;
      const multiplier = parseInt(rate.$.multiplier || '1', 10);
      const rateValue = parseFloat(rate._);
      
      if (currencyCode && !isNaN(rateValue)) {
        // BNR gives rates as: 1 unit of foreign currency = X RON
        // If multiplier is present, it means: multiplier units = X RON
        // We need: 1 foreign currency = X/multiplier RON
        exchangeRates[currencyCode] = {
          rate: rateValue / multiplier,
          date
        };
      }
    });

    return { exchangeRates, date };
  } catch (error) {
    console.error('Error fetching BNR rates:', error.message);
    throw new Error('Failed to fetch exchange rates from BNR');
  }
}

/**
 * Saves exchange rates to database
 */
function saveRatesToDatabase(rates, date) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO exchange_rates (currency_code, rate, date)
      VALUES (?, ?, ?)
    `);

    const currencies = Object.keys(rates);
    let completed = 0;
    let hasError = false;

    currencies.forEach(currency => {
      stmt.run([currency, rates[currency].rate, date], (err) => {
        if (err && !hasError) {
          hasError = true;
          reject(err);
        }
        completed++;
        if (completed === currencies.length) {
          stmt.finalize();
          if (!hasError) {
            console.log(`Saved ${currencies.length} exchange rates for ${date}`);
            resolve();
          }
        }
      });
    });
  });
}

/**
 * Gets cached exchange rates from database for a specific date
 */
function getCachedRates(date) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT currency_code, rate FROM exchange_rates WHERE date = ?',
      [date],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        const rates = {};
        rows.forEach(row => {
          rates[row.currency_code] = row.rate;
        });

        resolve(rows.length > 0 ? rates : null);
      }
    );
  });
}

/**
 * Gets the latest available exchange rates
 */
async function getLatestRates() {
  const today = new Date().toISOString().split('T')[0];
  
  // Try to get today's rates from cache
  let cached = await getCachedRates(today);
  if (cached) {
    return { rates: cached, date: today, source: 'cache' };
  }

  // Fetch fresh rates from BNR
  try {
    const { exchangeRates, date } = await fetchBNRRates();
    await saveRatesToDatabase(exchangeRates, date);
    
    const rates = {};
    Object.keys(exchangeRates).forEach(currency => {
      rates[currency] = exchangeRates[currency].rate;
    });
    
    return { rates, date, source: 'bnr' };
  } catch (error) {
    // If fetch fails, try to get the most recent cached rates
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT currency_code, rate, date 
         FROM exchange_rates 
         WHERE date = (SELECT MAX(date) FROM exchange_rates)`,
        [],
        (err, rows) => {
          if (err || rows.length === 0) {
            reject(new Error('No exchange rates available'));
            return;
          }

          const rates = {};
          let date = rows[0].date;
          rows.forEach(row => {
            rates[row.currency_code] = row.rate;
          });

          resolve({ rates, date, source: 'cache-fallback' });
        }
      );
    });
  }
}

/**
 * Converts amount from one currency to another
 * @param {number} amount - The amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @param {object} rates - Exchange rates object (optional, will fetch if not provided)
 */
async function convertCurrency(amount, fromCurrency, toCurrency, rates = null) {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  if (!rates) {
    const ratesData = await getLatestRates();
    rates = ratesData.rates;
  }

  if (!rates[fromCurrency] || !rates[toCurrency]) {
    throw new Error(`Exchange rate not available for ${fromCurrency} or ${toCurrency}`);
  }

  // Convert to RON first, then to target currency
  const amountInRON = amount * rates[fromCurrency];
  const convertedAmount = amountInRON / rates[toCurrency];

  return Math.round(convertedAmount * 100) / 100; // Round to 2 decimals
}

/**
 * Updates exchange rates (can be called by cron job)
 */
async function updateExchangeRates() {
  try {
    console.log('Updating exchange rates from BNR...');
    const { exchangeRates, date } = await fetchBNRRates();
    await saveRatesToDatabase(exchangeRates, date);
    console.log('Exchange rates updated successfully');
    return true;
  } catch (error) {
    console.error('Failed to update exchange rates:', error.message);
    return false;
  }
}

module.exports = {
  fetchBNRRates,
  getLatestRates,
  convertCurrency,
  updateExchangeRates,
  getCachedRates
};
