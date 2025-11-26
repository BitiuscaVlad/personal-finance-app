const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all budgets for a specific month/year
router.get('/', (req, res) => {
  const { month, year } = req.query;
  let sql = `
    SELECT b.*, c.name as category_name, c.color as category_color
    FROM budgets b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (month) {
    sql += ' AND b.month = ?';
    params.push(month);
  }
  if (year) {
    sql += ' AND b.year = ?';
    params.push(year);
  }

  sql += ' ORDER BY c.name';

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get budget by ID
router.get('/:id', (req, res) => {
  const sql = `
    SELECT b.*, c.name as category_name
    FROM budgets b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.id = ?
  `;
  
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }
    res.json(row);
  });
});

// Get budget with spending
router.get('/spending/:month/:year', (req, res) => {
  const { month, year } = req.params;
  
  const sql = `
    SELECT 
      b.id,
      b.category_id,
      b.amount as budgeted,
      c.name as category_name,
      c.color as category_color,
      COALESCE(SUM(t.amount), 0) as spent,
      b.month,
      b.year
    FROM budgets b
    LEFT JOIN categories c ON b.category_id = c.id
    LEFT JOIN transactions t ON t.category_id = b.category_id 
      AND strftime('%m', t.date) = printf('%02d', b.month)
      AND strftime('%Y', t.date) = CAST(b.year AS TEXT)
      AND c.type = 'expense'
    WHERE b.month = ? AND b.year = ?
    GROUP BY b.id, b.category_id, b.amount, c.name, c.color, b.month, b.year
    ORDER BY c.name
  `;

  db.all(sql, [month, year], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create budget
router.post('/', (req, res) => {
  const { category_id, amount, month, year } = req.body;
  const sql = 'INSERT INTO budgets (category_id, amount, month, year) VALUES (?, ?, ?, ?)';
  
  db.run(sql, [category_id, amount, month, year], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ error: 'Budget already exists for this category and month' });
      } else {
        res.status(500).json({ error: err.message });
      }
      return;
    }
    res.status(201).json({ id: this.lastID, category_id, amount, month, year });
  });
});

// Update budget
router.put('/:id', (req, res) => {
  const { category_id, amount, month, year } = req.body;
  const sql = 'UPDATE budgets SET category_id = ?, amount = ?, month = ?, year = ? WHERE id = ?';
  
  db.run(sql, [category_id, amount, month, year, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }
    res.json({ id: req.params.id, category_id, amount, month, year });
  });
});

// Delete budget
router.delete('/:id', (req, res) => {
  const sql = 'DELETE FROM budgets WHERE id = ?';
  
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }
    res.json({ message: 'Budget deleted successfully' });
  });
});

module.exports = router;
