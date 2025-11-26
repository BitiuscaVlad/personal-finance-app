import React from 'react';
import { useCurrency } from '../context/CurrencyContext';
import './CurrencySelector.css';

const CurrencySelector = () => {
  const { displayCurrency, setCurrencyPreference } = useCurrency();

  const commonCurrencies = [
    { code: 'RON', name: 'Romanian Leu' },
    { code: 'EUR', name: 'Euro' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'CHF', name: 'Swiss Franc' }
  ];

  const handleChange = (e) => {
    setCurrencyPreference(e.target.value);
  };

  return (
    <div className="currency-selector">
      <label htmlFor="currency">Display Currency:</label>
      <select 
        id="currency" 
        value={displayCurrency} 
        onChange={handleChange}
        className="currency-select"
      >
        {commonCurrencies.map(currency => (
          <option key={currency.code} value={currency.code}>
            {currency.code} - {currency.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CurrencySelector;
