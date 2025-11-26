const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const dashboardRouter = require('../routes/dashboard');
const db = require('../database/db');
require('./setup');

const app = express();
app.use(bodyParser.json());
app.use('/api/dashboard', dashboardRouter);

describe('Dashboard API', () => {
  let expenseCategoryId;
  let incomeCategoryId;

  beforeEach(async () => {
    await clearDatabase();
    expenseCategoryId = await createTestCategory('Groceries', 'expense', '#ff0000');
    incomeCategoryId = await createTestCategory('Salary', 'income', '#00ff00');
  });

  describe('GET /api/dashboard/summary', () => {
    test('should return summary with zero values when no data exists', async () => {
      const response = await request(app).get('/api/dashboard/summary');
      
      expect(response.status).toBe(200);
      expect(response.body.totalBudget).toBe(0);
      expect(response.body.totalSpent).toBe(0);
      expect(response.body.remaining).toBe(0);
      expect(response.body.upcomingBills).toBe(0);
      expect(response.body.overdueBills).toBe(0);
    });

    test('should calculate total budget for current month', async () => {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      await createBudget(expenseCategoryId, 500, currentMonth, currentYear);
      const category2Id = await createTestCategory('Entertainment', 'expense', '#0000ff');
      await createBudget(category2Id, 300, currentMonth, currentYear);

      const response = await request(app).get('/api/dashboard/summary');
      
      expect(response.status).toBe(200);
      expect(response.body.totalBudget).toBe(800);
    });

    test('should calculate total spent for current month', async () => {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const today = currentDate.toISOString().split('T')[0];

      await createTransaction(expenseCategoryId, 100, today);
      await createTransaction(expenseCategoryId, 50, today);

      const response = await request(app).get('/api/dashboard/summary');
      
      expect(response.status).toBe(200);
      expect(response.body.totalSpent).toBe(150);
    });

    test('should calculate remaining budget correctly', async () => {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const today = currentDate.toISOString().split('T')[0];

      await createBudget(expenseCategoryId, 500, currentMonth, currentYear);
      await createTransaction(expenseCategoryId, 150, today);

      const response = await request(app).get('/api/dashboard/summary');
      
      expect(response.status).toBe(200);
      expect(response.body.totalBudget).toBe(500);
      expect(response.body.totalSpent).toBe(150);
      expect(response.body.remaining).toBe(350);
    });

    test('should count upcoming bills (next 7 days)', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      await createBill('Electric', 100, tomorrowStr, expenseCategoryId, 'pending');
      
      const response = await request(app).get('/api/dashboard/summary');
      
      expect(response.status).toBe(200);
      expect(response.body.upcomingBills).toBe(1);
    });

    test('should not count paid bills as upcoming', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      await createBill('Electric', 100, tomorrowStr, expenseCategoryId, 'paid');
      
      const response = await request(app).get('/api/dashboard/summary');
      
      expect(response.status).toBe(200);
      expect(response.body.upcomingBills).toBe(0);
    });
  });

  describe('GET /api/dashboard/spending-by-category', () => {
    test('should return empty array when no expenses', async () => {
      const response = await request(app).get('/api/dashboard/spending-by-category');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should return spending grouped by category for current month', async () => {
      const currentDate = new Date();
      const today = currentDate.toISOString().split('T')[0];

      await createTransaction(expenseCategoryId, 100, today);
      await createTransaction(expenseCategoryId, 50, today);
      
      const category2Id = await createTestCategory('Entertainment', 'expense', '#0000ff');
      await createTransaction(category2Id, 75, today);

      const response = await request(app).get('/api/dashboard/spending-by-category');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].total).toBe(150); // Sorted by total DESC
      expect(response.body[0].name).toBe('Groceries');
    });

    test('should only include expense categories', async () => {
      const currentDate = new Date();
      const today = currentDate.toISOString().split('T')[0];

      await createTransaction(expenseCategoryId, 100, today);
      await createTransaction(incomeCategoryId, 1000, today);

      const response = await request(app).get('/api/dashboard/spending-by-category');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Groceries');
    });
  });

  describe('GET /api/dashboard/recent-transactions', () => {
    test('should return empty array when no transactions', async () => {
      const response = await request(app).get('/api/dashboard/recent-transactions');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should return recent transactions with limit', async () => {
      for (let i = 0; i < 10; i++) {
        await createTransaction(expenseCategoryId, 10 * i, '2025-11-26');
      }

      const response = await request(app)
        .get('/api/dashboard/recent-transactions')
        .query({ limit: 5 });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(5);
    });

    test('should order by date descending', async () => {
      await createTransaction(expenseCategoryId, 100, '2025-11-20');
      await createTransaction(expenseCategoryId, 200, '2025-11-26');
      await createTransaction(expenseCategoryId, 150, '2025-11-23');

      const response = await request(app).get('/api/dashboard/recent-transactions');
      
      expect(response.status).toBe(200);
      expect(response.body[0].amount).toBe(200); // Most recent
      expect(response.body[0].date).toBe('2025-11-26');
    });
  });
});

function createBudget(categoryId, amount, month, year) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO budgets (category_id, amount, month, year) VALUES (?, ?, ?, ?)',
      [categoryId, amount, month, year],
      function(err) {
        if (err) reject(err);
        resolve(this.lastID);
      }
    );
  });
}

function createTransaction(categoryId, amount, date) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO transactions (amount, category_id, date, is_recurring) VALUES (?, ?, ?, 0)',
      [amount, categoryId, date],
      function(err) {
        if (err) reject(err);
        resolve(this.lastID);
      }
    );
  });
}

function createBill(name, amount, dueDate, categoryId, status = 'pending') {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO bills (name, amount, due_date, category_id, status, is_recurring) VALUES (?, ?, ?, ?, ?, 0)',
      [name, amount, dueDate, categoryId, status],
      function(err) {
        if (err) reject(err);
        resolve(this.lastID);
      }
    );
  });
}
