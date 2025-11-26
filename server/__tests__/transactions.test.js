const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const transactionsRouter = require('../routes/transactions');
require('./setup');

const app = express();
app.use(bodyParser.json());
app.use('/api/transactions', transactionsRouter);

describe('Transactions API', () => {
  let categoryId;

  beforeEach(async () => {
    await clearDatabase();
    categoryId = await createTestCategory('Groceries', 'expense', '#ff0000');
  });

  describe('GET /api/transactions', () => {
    test('should return empty array when no transactions exist', async () => {
      const response = await request(app).get('/api/transactions');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should return all transactions', async () => {
      await createTransaction(categoryId, 100, '2025-11-26');
      await createTransaction(categoryId, 50, '2025-11-25');

      const response = await request(app).get('/api/transactions');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].amount).toBe(100); // Most recent first
    });

    test('should filter transactions by date range', async () => {
      await createTransaction(categoryId, 100, '2025-11-26');
      await createTransaction(categoryId, 50, '2025-11-20');
      await createTransaction(categoryId, 75, '2025-11-15');

      const response = await request(app)
        .get('/api/transactions')
        .query({ startDate: '2025-11-20', endDate: '2025-11-26' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    test('should filter transactions by category', async () => {
      const category2Id = await createTestCategory('Entertainment', 'expense', '#00ff00');
      
      await createTransaction(categoryId, 100, '2025-11-26');
      await createTransaction(category2Id, 50, '2025-11-26');

      const response = await request(app)
        .get('/api/transactions')
        .query({ categoryId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].category_id).toBe(categoryId);
    });
  });

  describe('GET /api/transactions/:id', () => {
    test('should return a transaction by ID', async () => {
      const transactionId = await createTransaction(categoryId, 100, '2025-11-26', 'Test transaction');
      
      const response = await request(app).get(`/api/transactions/${transactionId}`);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(transactionId);
      expect(response.body.amount).toBe(100);
      expect(response.body.description).toBe('Test transaction');
    });

    test('should return 404 for non-existent transaction', async () => {
      const response = await request(app).get('/api/transactions/9999');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/transactions', () => {
    test('should create a new transaction', async () => {
      const newTransaction = {
        amount: 150,
        category_id: categoryId,
        description: 'Weekly shopping',
        date: '2025-11-26',
        is_recurring: 0
      };

      const response = await request(app)
        .post('/api/transactions')
        .send(newTransaction);

      expect(response.status).toBe(201);
      expect(response.body.amount).toBe(150);
      expect(response.body.description).toBe('Weekly shopping');
      expect(response.body.id).toBeDefined();
    });

    test('should create recurring transaction', async () => {
      const newTransaction = {
        amount: 500,
        category_id: categoryId,
        description: 'Monthly rent',
        date: '2025-11-01',
        is_recurring: 1,
        recurrence_interval: 'monthly'
      };

      const response = await request(app)
        .post('/api/transactions')
        .send(newTransaction);

      expect(response.status).toBe(201);
      expect(response.body.is_recurring).toBe(1);
      expect(response.body.recurrence_interval).toBe('monthly');
    });
  });

  describe('PUT /api/transactions/:id', () => {
    test('should update an existing transaction', async () => {
      const transactionId = await createTransaction(categoryId, 100, '2025-11-26');
      
      const updatedData = {
        amount: 200,
        category_id: categoryId,
        description: 'Updated description',
        date: '2025-11-27',
        is_recurring: 0
      };

      const response = await request(app)
        .put(`/api/transactions/${transactionId}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.amount).toBe(200);
      expect(response.body.description).toBe('Updated description');
    });

    test('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .put('/api/transactions/9999')
        .send({ amount: 100, category_id: categoryId, date: '2025-11-26' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    test('should delete a transaction', async () => {
      const transactionId = await createTransaction(categoryId, 100, '2025-11-26');
      
      const response = await request(app).delete(`/api/transactions/${transactionId}`);
      expect(response.status).toBe(200);

      const getResponse = await request(app).get(`/api/transactions/${transactionId}`);
      expect(getResponse.status).toBe(404);
    });
  });
});

// Helper function to create test transaction
function createTransaction(categoryId, amount, date, description = 'Test transaction') {
  const db = require('../database/db');
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO transactions (amount, category_id, description, date, is_recurring) VALUES (?, ?, ?, ?, 0)',
      [amount, categoryId, description, date],
      function(err) {
        if (err) reject(err);
        resolve(this.lastID);
      }
    );
  });
}
