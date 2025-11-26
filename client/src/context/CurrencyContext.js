import React, { createContext, useContext, useState, useEffect } from 'react';
import { getExchangeRates, getCurrencyPreference, setCurrencyPreference as setApiCurrencyPreference } from '../services/api';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [displayCurrency, setDisplayCurrency] = useState('RON');
  const [exchangeRates, setExchangeRates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrencyData();
  }, []);

  const loadCurrencyData = async () => {
    try {
      const [ratesResponse, prefResponse] = await Promise.all([
        getExchangeRates(),
        getCurrencyPreference()
      ]);

      setExchangeRates(ratesResponse.data.rates || {});
      setDisplayCurrency(prefResponse.data.displayCurrency || 'RON');
    } catch (error) {
      console.error('Failed to load currency data:', error);
      // Set defaults
      setExchangeRates({ RON: 1 });
      setDisplayCurrency('RON');
    } finally {
      setLoading(false);
    }
  };

  const setCurrencyPreference = async (currency) => {
    try {
      await setApiCurrencyPreference(currency);
      setDisplayCurrency(currency);
    } catch (error) {
      console.error('Failed to set currency preference:', error);
    }
  };

  const convertAmount = (amount, fromCurrency, toCurrency = displayCurrency) => {
    if (!amount || !fromCurrency || fromCurrency === toCurrency) {
      return amount;
    }

    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];

    if (!fromRate || !toRate) {
      return amount; // Return original if rates not available
    }

    // Convert to RON first, then to target currency
    const amountInRON = amount * fromRate;
    const convertedAmount = amountInRON / toRate;

    return Math.round(convertedAmount * 100) / 100;
  };

  const formatCurrency = (amount, currency = displayCurrency) => {
    const symbols = {
      RON: 'lei',
      EUR: '€',
      USD: '$',
      GBP: '£',
      JPY: '¥',
      CHF: 'CHF'
    };

    const symbol = symbols[currency] || currency;
    const formattedAmount = new Intl.NumberFormat('ro-RO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);

    return `${formattedAmount} ${symbol}`;
  };

  const value = {
    displayCurrency,
    exchangeRates,
    loading,
    setCurrencyPreference,
    convertAmount,
    formatCurrency,
    refreshRates: loadCurrencyData
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
