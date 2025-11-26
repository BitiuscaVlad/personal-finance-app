import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Categories
export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Transactions
export const getTransactions = (params) => api.get('/transactions', { params });
export const getTransaction = (id) => api.get(`/transactions/${id}`);
export const createTransaction = (data) => api.post('/transactions', data);
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);
export const suggestCategory = (description) => api.post('/transactions/suggest-category', { description });

// Budgets
export const getBudgets = (params) => api.get('/budgets', { params });
export const getBudgetSpending = (month, year) => api.get(`/budgets/spending/${month}/${year}`);
export const createBudget = (data) => api.post('/budgets', data);
export const updateBudget = (id, data) => api.put(`/budgets/${id}`, data);
export const deleteBudget = (id) => api.delete(`/budgets/${id}`);

// Bills
export const getBills = (params) => api.get('/bills', { params });
export const getBill = (id) => api.get(`/bills/${id}`);
export const createBill = (data) => api.post('/bills', data);
export const updateBill = (id, data) => api.put(`/bills/${id}`, data);
export const payBill = (id) => api.patch(`/bills/${id}/pay`);
export const deleteBill = (id) => api.delete(`/bills/${id}`);

// Dashboard
export const getDashboardSummary = () => api.get('/dashboard/summary');
export const getSpendingByCategory = () => api.get('/dashboard/spending-by-category');
export const getRecentTransactions = (limit = 5) => api.get('/dashboard/recent-transactions', { params: { limit } });

// Currency
export const getExchangeRates = () => api.get('/currency/rates');
export const convertCurrency = (data) => api.post('/currency/convert', data);
export const getCurrencyPreference = () => api.get('/currency/preference');
export const setCurrencyPreference = (displayCurrency) => api.put('/currency/preference', { displayCurrency });
export const getCurrencies = () => api.get('/currency/currencies');
export const updateRates = () => api.post('/currency/update-rates');

export default api;
