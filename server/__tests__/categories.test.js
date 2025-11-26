const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const categoriesRouter = require('../routes/categories');
require('./setup');

const app = express();
app.use(bodyParser.json());
app.use('/api/categories', categoriesRouter);

describe('Categories API', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('GET /api/categories', () => {
    test('should return empty array when no categories exist', async () => {
      const response = await request(app).get('/api/categories');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should return all categories ordered by type and name', async () => {
      await createTestCategory('Groceries', 'expense', '#ff0000');
      await createTestCategory('Salary', 'income', '#00ff00');
      await createTestCategory('Utilities', 'expense', '#0000ff');

      const response = await request(app).get('/api/categories');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0].type).toBe('expense');
      expect(response.body[2].type).toBe('income');
    });
  });

  describe('GET /api/categories/:id', () => {
    test('should return a category by ID', async () => {
      const categoryId = await createTestCategory('Groceries', 'expense', '#ff0000');
      
      const response = await request(app).get(`/api/categories/${categoryId}`);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(categoryId);
      expect(response.body.name).toBe('Groceries');
      expect(response.body.type).toBe('expense');
    });

    test('should return 404 for non-existent category', async () => {
      const response = await request(app).get('/api/categories/9999');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Category not found');
    });
  });

  describe('POST /api/categories', () => {
    test('should create a new category', async () => {
      const newCategory = {
        name: 'Entertainment',
        type: 'expense',
        color: '#ff00ff'
      };

      const response = await request(app)
        .post('/api/categories')
        .send(newCategory);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(newCategory.name);
      expect(response.body.type).toBe(newCategory.type);
      expect(response.body.color).toBe(newCategory.color);
      expect(response.body.id).toBeDefined();
    });

    test('should fail without required fields', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ name: 'Test' });

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/categories/:id', () => {
    test('should update an existing category', async () => {
      const categoryId = await createTestCategory('Old Name', 'expense', '#ff0000');
      
      const updatedData = {
        name: 'New Name',
        type: 'income',
        color: '#00ff00'
      };

      const response = await request(app)
        .put(`/api/categories/${categoryId}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('New Name');
      expect(response.body.type).toBe('income');
    });

    test('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .put('/api/categories/9999')
        .send({ name: 'Test', type: 'expense', color: '#000000' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    test('should delete a category', async () => {
      const categoryId = await createTestCategory('To Delete', 'expense', '#ff0000');
      
      const response = await request(app).delete(`/api/categories/${categoryId}`);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Category deleted successfully');

      // Verify it's deleted
      const getResponse = await request(app).get(`/api/categories/${categoryId}`);
      expect(getResponse.status).toBe(404);
    });

    test('should return 404 when deleting non-existent category', async () => {
      const response = await request(app).delete('/api/categories/9999');
      expect(response.status).toBe(404);
    });
  });
});
