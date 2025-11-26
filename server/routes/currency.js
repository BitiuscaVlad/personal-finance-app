const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { getLatestRates, convertCurrency, updateExchangeRates } = require('../services/currencyService');

// Get all available currencies and their rates
router.get('/rates', async (req, res) => {
  try {
    const { rates, date, source } = await getLatestRates();
    
    res.json({
      rates,
      date,
      source,
      baseCurrency: 'RON'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Convert amount between currencies
router.post('/convert', async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;

    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({ 
        error: 'Missing required fields: amount, fromCurrency, toCurrency' 
      });
    }

    const convertedAmount = await convertCurrency(
      parseFloat(amount),
      fromCurrency,
      toCurrency
    );

    res.json({
      originalAmount: parseFloat(amount),
      fromCurrency,
      toCurrency,
      convertedAmount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's display currency preference
router.get('/preference', (req, res) => {
  db.get(
    'SELECT value FROM user_preferences WHERE key = ?',
    ['display_currency'],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ displayCurrency: row ? row.value : 'RON' });
    }
  );
});

// Set user's display currency preference
router.put('/preference', (req, res) => {
  const { displayCurrency } = req.body;

  if (!displayCurrency) {
    return res.status(400).json({ error: 'displayCurrency is required' });
  }

  db.run(
    `INSERT OR REPLACE INTO user_preferences (key, value, updated_at) 
     VALUES ('display_currency', ?, CURRENT_TIMESTAMP)`,
    [displayCurrency],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ displayCurrency, message: 'Preference updated successfully' });
    }
  );
});

// Manually trigger exchange rate update (admin endpoint)
router.post('/update-rates', async (req, res) => {
  try {
    const success = await updateExchangeRates();
    if (success) {
      const { rates, date } = await getLatestRates();
      res.json({ 
        message: 'Exchange rates updated successfully',
        date,
        currencyCount: Object.keys(rates).length
      });
    } else {
      res.status(500).json({ error: 'Failed to update exchange rates' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available currencies list
router.get('/currencies', async (req, res) => {
  try {
    const { rates } = await getLatestRates();
    const currencies = Object.keys(rates).map(code => ({
      code,
      name: getCurrencyName(code)
    }));

    res.json(currencies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to get currency names
function getCurrencyName(code) {
  const currencyNames = {
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
  };

  return currencyNames[code] || code;
}

module.exports = router;
