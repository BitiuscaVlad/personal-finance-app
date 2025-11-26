const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all transactions
router.get('/', (req, res) => {
  const { startDate, endDate, categoryId } = req.query;
  let sql = `
    SELECT t.*, c.name as category_name, c.type as category_type, c.color as category_color
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (startDate) {
    sql += ' AND t.date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND t.date <= ?';
    params.push(endDate);
  }
  if (categoryId) {
    sql += ' AND t.category_id = ?';
    params.push(categoryId);
  }

  sql += ' ORDER BY t.date DESC, t.created_at DESC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get transaction by ID
router.get('/:id', (req, res) => {
  const sql = `
    SELECT t.*, c.name as category_name, c.type as category_type
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
  `;
  
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    res.json(row);
  });
});

// Create transaction
router.post('/', (req, res) => {
  const { amount, category_id, description, date, is_recurring, recurrence_interval } = req.body;
  const sql = `
    INSERT INTO transactions (amount, category_id, description, date, is_recurring, recurrence_interval)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [amount, category_id, description, date, is_recurring || 0, recurrence_interval], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ 
      id: this.lastID, 
      amount, 
      category_id, 
      description, 
      date,
      is_recurring,
      recurrence_interval
    });
  });
});

// Update transaction
router.put('/:id', (req, res) => {
  const { amount, category_id, description, date, is_recurring, recurrence_interval } = req.body;
  const sql = `
    UPDATE transactions 
    SET amount = ?, category_id = ?, description = ?, date = ?, is_recurring = ?, recurrence_interval = ?
    WHERE id = ?
  `;
  
  db.run(sql, [amount, category_id, description, date, is_recurring, recurrence_interval, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    res.json({ 
      id: req.params.id, 
      amount, 
      category_id, 
      description, 
      date,
      is_recurring,
      recurrence_interval
    });
  });
});

// Delete transaction
router.delete('/:id', (req, res) => {
  const sql = 'DELETE FROM transactions WHERE id = ?';
  
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    res.json({ message: 'Transaction deleted successfully' });
  });
});

module.exports = router;
