const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const db = require('./database/db');
const categoriesRouter = require('./routes/categories');
const transactionsRouter = require('./routes/transactions');
const budgetsRouter = require('./routes/budgets');
const billsRouter = require('./routes/bills');
const dashboardRouter = require('./routes/dashboard');
const currencyRouter = require('./routes/currency');
const { updateExchangeRates } = require('./services/currencyService');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/categories', categoriesRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/bills', billsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/currency', currencyRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Finance API is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Update exchange rates on startup
  updateExchangeRates().catch(err => {
    console.error('Initial exchange rate update failed:', err.message);
  });
  
  // Schedule daily exchange rate updates at 2 AM
  cron.schedule('0 2 * * *', () => {
    console.log('Running scheduled exchange rate update...');
    updateExchangeRates().catch(err => {
      console.error('Scheduled exchange rate update failed:', err.message);
    });
  });
});

module.exports = app;
