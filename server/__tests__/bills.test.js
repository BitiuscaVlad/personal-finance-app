const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const billsRouter = require('../routes/bills');
const db = require('../database/db');
require('./setup');

const app = express();
app.use(bodyParser.json());
app.use('/api/bills', billsRouter);

describe('Bills API', () => {
  let categoryId;

  beforeEach(async () => {
    await clearDatabase();
    categoryId = await createTestCategory('Utilities', 'expense', '#ff0000');
  });

  describe('GET /api/bills', () => {
    test('should return empty array when no bills exist', async () => {
      const response = await request(app).get('/api/bills');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should return all bills ordered by due date', async () => {
      await createBill('Electric Bill', 100, '2025-12-01', categoryId);
      await createBill('Water Bill', 50, '2025-11-28', categoryId);

      const response = await request(app).get('/api/bills');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Water Bill'); // Earlier due date first
    });

    test('should filter bills by status', async () => {
      await createBill('Paid Bill', 100, '2025-11-20', categoryId, 'paid');
      await createBill('Pending Bill', 50, '2025-12-01', categoryId, 'pending');

      const response = await request(app)
        .get('/api/bills')
        .query({ status: 'pending' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('pending');
    });
  });

  describe('GET /api/bills/:id', () => {
    test('should return a bill by ID', async () => {
      const billId = await createBill('Electric Bill', 100, '2025-12-01', categoryId);
      
      const response = await request(app).get(`/api/bills/${billId}`);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(billId);
      expect(response.body.name).toBe('Electric Bill');
    });

    test('should return 404 for non-existent bill', async () => {
      const response = await request(app).get('/api/bills/9999');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/bills', () => {
    test('should create a new bill', async () => {
      const newBill = {
        name: 'Internet Bill',
        amount: 45,
        due_date: '2025-12-05',
        category_id: categoryId,
        is_recurring: 1,
        recurrence_interval: 'monthly'
      };

      const response = await request(app)
        .post('/api/bills')
        .send(newBill);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Internet Bill');
      expect(response.body.is_recurring).toBe(1);
      expect(response.body.status).toBe('pending');
    });

    test('should default status to pending', async () => {
      const newBill = {
        name: 'Phone Bill',
        amount: 30,
        due_date: '2025-12-10',
        category_id: categoryId
      };

      const response = await request(app)
        .post('/api/bills')
        .send(newBill);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('pending');
    });
  });

  describe('PUT /api/bills/:id', () => {
    test('should update an existing bill', async () => {
      const billId = await createBill('Old Name', 100, '2025-12-01', categoryId);
      
      const updatedData = {
        name: 'New Name',
        amount: 150,
        due_date: '2025-12-05',
        category_id: categoryId,
        is_recurring: 1,
        recurrence_interval: 'monthly',
        status: 'pending'
      };

      const response = await request(app)
        .put(`/api/bills/${billId}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('New Name');
      expect(response.body.amount).toBe(150);
    });

    test('should return 404 for non-existent bill', async () => {
      const response = await request(app)
        .put('/api/bills/9999')
        .send({ name: 'Test', amount: 100, due_date: '2025-12-01', category_id: categoryId, status: 'pending' });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/bills/:id/pay', () => {
    test('should mark bill as paid', async () => {
      const billId = await createBill('Electric Bill', 100, '2025-12-01', categoryId, 'pending');
      
      const response = await request(app).patch(`/api/bills/${billId}/pay`);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Bill marked as paid');

      // Verify it's paid
      const getResponse = await request(app).get(`/api/bills/${billId}`);
      expect(getResponse.body.status).toBe('paid');
    });
  });

  describe('DELETE /api/bills/:id', () => {
    test('should delete a bill', async () => {
      const billId = await createBill('To Delete', 100, '2025-12-01', categoryId);
      
      const response = await request(app).delete(`/api/bills/${billId}`);
      expect(response.status).toBe(200);

      const getResponse = await request(app).get(`/api/bills/${billId}`);
      expect(getResponse.status).toBe(404);
    });
  });
});

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
