const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const currencyRouter = require('../routes/currency');
const currencyService = require('../services/currencyService');
const db = require('../database/db');
require('./setup');

// Mock the currency service
jest.mock('../services/currencyService');

const app = express();
app.use(bodyParser.json());
app.use('/api/currency', currencyRouter);

describe('Currency API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/currency/rates', () => {
    test('should return exchange rates', async () => {
      const mockRates = {
        rates: {
          RON: 1,
          EUR: 5.0903,
          USD: 4.3975,
          GBP: 5.79
        },
        date: '2025-11-26',
        source: 'bnr'
      };

      currencyService.getLatestRates.mockResolvedValue(mockRates);

      const response = await request(app).get('/api/currency/rates');

      expect(response.status).toBe(200);
      expect(response.body.rates).toBeDefined();
      expect(response.body.date).toBe('2025-11-26');
      expect(response.body.baseCurrency).toBe('RON');
      expect(response.body.rates.EUR).toBe(5.0903);
      expect(currencyService.getLatestRates).toHaveBeenCalled();
    });

    test('should handle errors when fetching rates fails', async () => {
      currencyService.getLatestRates.mockRejectedValue(new Error('API unavailable'));

      const response = await request(app).get('/api/currency/rates');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('API unavailable');
    });
  });

  describe('POST /api/currency/convert', () => {
    test('should convert currency successfully', async () => {
      currencyService.convertCurrency.mockResolvedValue(509.03);

      const response = await request(app)
        .post('/api/currency/convert')
        .send({
          amount: 100,
          fromCurrency: 'EUR',
          toCurrency: 'RON'
        });

      expect(response.status).toBe(200);
      expect(response.body.originalAmount).toBe(100);
      expect(response.body.fromCurrency).toBe('EUR');
      expect(response.body.toCurrency).toBe('RON');
      expect(response.body.convertedAmount).toBe(509.03);
      expect(response.body.timestamp).toBeDefined();
    });

    test('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/currency/convert')
        .send({ amount: 100 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required fields');
    });

    test('should handle conversion errors', async () => {
      currencyService.convertCurrency.mockRejectedValue(
        new Error('Exchange rate not available')
      );

      const response = await request(app)
        .post('/api/currency/convert')
        .send({
          amount: 100,
          fromCurrency: 'XXX',
          toCurrency: 'RON'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Exchange rate not available');
    });
  });

  describe('GET /api/currency/preference', () => {
    test('should return user display currency preference', async () => {
      await new Promise((resolve) => {
        db.run(
          `INSERT OR REPLACE INTO user_preferences (key, value) VALUES ('display_currency', 'EUR')`,
          resolve
        );
      });

      const response = await request(app).get('/api/currency/preference');

      expect(response.status).toBe(200);
      expect(response.body.displayCurrency).toBe('EUR');
    });

    test('should return RON as default when no preference set', async () => {
      await clearDatabase();
      
      const response = await request(app).get('/api/currency/preference');

      expect(response.status).toBe(200);
      expect(response.body.displayCurrency).toBeDefined();
    });
  });

  describe('PUT /api/currency/preference', () => {
    test('should update user display currency preference', async () => {
      const response = await request(app)
        .put('/api/currency/preference')
        .send({ displayCurrency: 'USD' });

      expect(response.status).toBe(200);
      expect(response.body.displayCurrency).toBe('USD');
      expect(response.body.message).toContain('updated successfully');

      // Verify it was saved
      const getResponse = await request(app).get('/api/currency/preference');
      expect(getResponse.body.displayCurrency).toBe('USD');
    });

    test('should fail without displayCurrency field', async () => {
      const response = await request(app)
        .put('/api/currency/preference')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });
  });

  describe('POST /api/currency/update-rates', () => {
    test('should manually trigger rate update', async () => {
      const mockRates = {
        rates: { RON: 1, EUR: 5.0903, USD: 4.3975 },
        date: '2025-11-26'
      };

      currencyService.updateExchangeRates.mockResolvedValue(true);
      currencyService.getLatestRates.mockResolvedValue(mockRates);

      const response = await request(app).post('/api/currency/update-rates');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('updated successfully');
      expect(response.body.date).toBe('2025-11-26');
      expect(response.body.currencyCount).toBe(3);
    });

    test('should handle update failures', async () => {
      currencyService.updateExchangeRates.mockResolvedValue(false);

      const response = await request(app).post('/api/currency/update-rates');

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Failed to update');
    });
  });

  describe('GET /api/currency/currencies', () => {
    test('should return list of available currencies', async () => {
      const mockRates = {
        rates: {
          RON: 1,
          EUR: 5.0903,
          USD: 4.3975,
          GBP: 5.79
        }
      };

      currencyService.getLatestRates.mockResolvedValue(mockRates);

      const response = await request(app).get('/api/currency/currencies');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(4);
      
      const ronCurrency = response.body.find(c => c.code === 'RON');
      expect(ronCurrency).toBeDefined();
      expect(ronCurrency.name).toBe('Romanian Leu');
    });
  });
});
