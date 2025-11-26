const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const budgetsRouter = require('../routes/budgets');
const db = require('../database/db');
require('./setup');

const app = express();
app.use(bodyParser.json());
app.use('/api/budgets', budgetsRouter);

describe('Budgets API', () => {
  let categoryId;

  beforeEach(async () => {
    await clearDatabase();
    categoryId = await createTestCategory('Groceries', 'expense', '#ff0000');
  });

  describe('GET /api/budgets', () => {
    test('should return empty array when no budgets exist', async () => {
      const response = await request(app).get('/api/budgets');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should return all budgets', async () => {
      await createBudget(categoryId, 500, 11, 2025);
      await createBudget(categoryId, 600, 12, 2025);

      const response = await request(app).get('/api/budgets');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    test('should filter budgets by month and year', async () => {
      await createBudget(categoryId, 500, 11, 2025);
      const category2Id = await createTestCategory('Entertainment', 'expense', '#00ff00');
      await createBudget(category2Id, 300, 11, 2025);
      await createBudget(categoryId, 600, 12, 2025);

      const response = await request(app)
        .get('/api/budgets')
        .query({ month: 11, year: 2025 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.every(b => b.month === 11 && b.year === 2025)).toBe(true);
    });
  });

  describe('GET /api/budgets/:id', () => {
    test('should return a budget by ID', async () => {
      const budgetId = await createBudget(categoryId, 500, 11, 2025);
      
      const response = await request(app).get(`/api/budgets/${budgetId}`);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(budgetId);
      expect(response.body.amount).toBe(500);
    });

    test('should return 404 for non-existent budget', async () => {
      const response = await request(app).get('/api/budgets/9999');
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/budgets/spending/:month/:year', () => {
    test('should return budgets with spending data', async () => {
      await createBudget(categoryId, 500, 11, 2025);
      await createTransaction(categoryId, 100, '2025-11-15');
      await createTransaction(categoryId, 150, '2025-11-20');

      const response = await request(app).get('/api/budgets/spending/11/2025');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].budgeted).toBe(500);
      expect(response.body[0].spent).toBe(250);
    });

    test('should return zero spent when no transactions', async () => {
      await createBudget(categoryId, 500, 11, 2025);

      const response = await request(app).get('/api/budgets/spending/11/2025');
      
      expect(response.status).toBe(200);
      expect(response.body[0].spent).toBe(0);
    });
  });

  describe('POST /api/budgets', () => {
    test('should create a new budget', async () => {
      const newBudget = {
        category_id: categoryId,
        amount: 750,
        month: 11,
        year: 2025
      };

      const response = await request(app)
        .post('/api/budgets')
        .send(newBudget);

      expect(response.status).toBe(201);
      expect(response.body.amount).toBe(750);
      expect(response.body.month).toBe(11);
    });

    test('should fail when creating duplicate budget for same category and month', async () => {
      await createBudget(categoryId, 500, 11, 2025);

      const response = await request(app)
        .post('/api/budgets')
        .send({ category_id: categoryId, amount: 600, month: 11, year: 2025 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('PUT /api/budgets/:id', () => {
    test('should update an existing budget', async () => {
      const budgetId = await createBudget(categoryId, 500, 11, 2025);
      
      const response = await request(app)
        .put(`/api/budgets/${budgetId}`)
        .send({ category_id: categoryId, amount: 800, month: 11, year: 2025 });

      expect(response.status).toBe(200);
      expect(response.body.amount).toBe(800);
    });

    test('should return 404 for non-existent budget', async () => {
      const response = await request(app)
        .put('/api/budgets/9999')
        .send({ category_id: categoryId, amount: 500, month: 11, year: 2025 });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/budgets/:id', () => {
    test('should delete a budget', async () => {
      const budgetId = await createBudget(categoryId, 500, 11, 2025);
      
      const response = await request(app).delete(`/api/budgets/${budgetId}`);
      expect(response.status).toBe(200);
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
