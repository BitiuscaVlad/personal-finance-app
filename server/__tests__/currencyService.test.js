// Mock dependencies FIRST, before any other imports
jest.mock('axios');
jest.mock('../database/db', () => {
  const mockDb = {
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
    prepare: jest.fn(() => ({
      run: jest.fn(),
      finalize: jest.fn()
    }))
  };
  return mockDb;
});

// Now import modules
const axios = require('axios');
const {
  fetchBNRRates,
  getLatestRates,
  convertCurrency,
  updateExchangeRates,
  getCachedRates
} = require('../services/currencyService');
const db = require('../database/db');

describe('Currency Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchBNRRates', () => {
    test('should fetch and parse BNR rates successfully', async () => {
      const mockXML = `<?xml version="1.0" encoding="utf-8"?>
        <DataSet>
          <Body>
            <Cube date="2025-11-26">
              <Rate currency="EUR" multiplier="1">5.0903</Rate>
              <Rate currency="USD" multiplier="1">4.3975</Rate>
              <Rate currency="GBP" multiplier="1">5.7900</Rate>
            </Cube>
          </Body>
        </DataSet>`;

      axios.get.mockResolvedValue({ data: mockXML });

      const result = await fetchBNRRates();

      expect(result.exchangeRates).toBeDefined();
      expect(result.exchangeRates.RON.rate).toBe(1);
      expect(result.exchangeRates.EUR.rate).toBe(5.0903);
      expect(result.exchangeRates.USD.rate).toBe(4.3975);
      expect(result.exchangeRates.GBP.rate).toBe(5.79);
      expect(result.date).toBe('2025-11-26');
    });

    test('should handle multiplier in rates', async () => {
      const mockXML = `<?xml version="1.0" encoding="utf-8"?>
        <DataSet>
          <Body>
            <Cube date="2025-11-26">
              <Rate currency="JPY" multiplier="100">3.5</Rate>
            </Cube>
          </Body>
        </DataSet>`;

      axios.get.mockResolvedValue({ data: mockXML });

      const result = await fetchBNRRates();

      expect(result.exchangeRates.JPY.rate).toBe(0.035); // 3.5 / 100
    });

    test('should handle API timeout', async () => {
      axios.get.mockRejectedValue(new Error('timeout'));

      await expect(fetchBNRRates()).rejects.toThrow('Failed to fetch exchange rates from BNR');
    });

    test('should handle invalid XML format', async () => {
      axios.get.mockResolvedValue({ data: 'invalid xml' });

      await expect(fetchBNRRates()).rejects.toThrow();
    });
  });

  describe('getCachedRates', () => {
    test('should retrieve cached rates for a specific date', async () => {
      const mockRows = [
        { currency_code: 'EUR', rate: 5.0903 },
        { currency_code: 'USD', rate: 4.3975 }
      ];

      db.all.mockImplementation((query, params, callback) => {
        callback(null, mockRows);
      });

      const rates = await getCachedRates('2025-11-26');

      expect(rates).toEqual({
        EUR: 5.0903,
        USD: 4.3975
      });
    });

    test('should return null when no cached rates found', async () => {
      db.all.mockImplementation((query, params, callback) => {
        callback(null, []);
      });

      const rates = await getCachedRates('2025-11-26');

      expect(rates).toBeNull();
    });

    test('should handle database errors', async () => {
      db.all.mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null);
      });

      await expect(getCachedRates('2025-11-26')).rejects.toThrow('Database error');
    });
  });

  describe('convertCurrency', () => {
    test('should convert between currencies correctly', async () => {
      const rates = {
        RON: 1,
        EUR: 5.0903,
        USD: 4.3975
      };

      const result = await convertCurrency(100, 'EUR', 'USD', rates);

      // 100 EUR * 5.0903 = 509.03 RON
      // 509.03 RON / 4.3975 = 115.75 USD
      expect(result).toBeCloseTo(115.75, 2);
    });

    test('should return same amount for same currency', async () => {
      const rates = { EUR: 5.0903 };
      const result = await convertCurrency(100, 'EUR', 'EUR', rates);

      expect(result).toBe(100);
    });

    test('should throw error for unavailable currency', async () => {
      const rates = { EUR: 5.0903 };

      await expect(
        convertCurrency(100, 'XXX', 'EUR', rates)
      ).rejects.toThrow('Exchange rate not available');
    });

    test('should round to 2 decimal places', async () => {
      const rates = {
        RON: 1,
        EUR: 5.0903,
        USD: 4.3975
      };

      const result = await convertCurrency(100, 'EUR', 'USD', rates);

      // Check that result has at most 2 decimal places
      expect(result.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  describe('updateExchangeRates', () => {
    test('should update rates successfully', async () => {
      const mockXML = `<?xml version="1.0" encoding="utf-8"?>
        <DataSet>
          <Body>
            <Cube date="2025-11-26">
              <Rate currency="EUR" multiplier="1">5.0903</Rate>
            </Cube>
          </Body>
        </DataSet>`;

      axios.get.mockResolvedValue({ data: mockXML });
      
      db.prepare.mockReturnValue({
        run: jest.fn((params, callback) => callback && callback()),
        finalize: jest.fn()
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await updateExchangeRates();

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Updating exchange rates from BNR...');
      
      consoleSpy.mockRestore();
    });

    test('should return false on failure', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await updateExchangeRates();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getLatestRates - Integration', () => {
    test('should fetch from API when no cache available', async () => {
      const mockXML = `<?xml version="1.0" encoding="utf-8"?>
        <DataSet>
          <Body>
            <Cube date="2025-11-26">
              <Rate currency="EUR" multiplier="1">5.0903</Rate>
            </Cube>
          </Body>
        </DataSet>`;

      // No cached rates
      db.all.mockImplementationOnce((query, params, callback) => {
        callback(null, []);
      });

      // Fresh API call
      axios.get.mockResolvedValue({ data: mockXML });

      // Save rates
      db.prepare.mockReturnValue({
        run: jest.fn((params, callback) => callback && callback()),
        finalize: jest.fn()
      });

      const result = await getLatestRates();

      expect(result.rates).toBeDefined();
      expect(result.rates.EUR).toBe(5.0903);
      expect(result.source).toBe('bnr');
    });

    test('should use cached rates when available', async () => {
      const mockRows = [
        { currency_code: 'RON', rate: 1 },
        { currency_code: 'EUR', rate: 5.0903 }
      ];

      db.all.mockImplementation((query, params, callback) => {
        callback(null, mockRows);
      });

      const result = await getLatestRates();

      expect(result.rates).toEqual({
        RON: 1,
        EUR: 5.0903
      });
      expect(result.source).toBe('cache');
      expect(axios.get).not.toHaveBeenCalled();
    });
  });
});
