const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all bills
router.get('/', (req, res) => {
  const { status, upcoming } = req.query;
  let sql = `
    SELECT b.*, c.name as category_name, c.color as category_color
    FROM bills b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND b.status = ?';
    params.push(status);
  }

  if (upcoming) {
    // Get bills due in the next 7 days
    sql += ' AND date(b.due_date) BETWEEN date("now") AND date("now", "+7 days")';
  }

  sql += ' ORDER BY b.due_date ASC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get bill by ID
router.get('/:id', (req, res) => {
  const sql = `
    SELECT b.*, c.name as category_name
    FROM bills b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.id = ?
  `;
  
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }
    res.json(row);
  });
});

// Create bill
router.post('/', (req, res) => {
  const { name, amount, due_date, category_id, is_recurring, recurrence_interval, status, currency } = req.body;
  const sql = `
    INSERT INTO bills (name, amount, currency, due_date, category_id, is_recurring, recurrence_interval, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [name, amount, currency || 'RON', due_date, category_id, is_recurring || 0, recurrence_interval, status || 'pending'], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ 
      id: this.lastID, 
      name, 
      amount,
      currency: currency || 'RON',
      due_date, 
      category_id,
      is_recurring,
      recurrence_interval,
      status: status || 'pending'
    });
  });
});

// Update bill
router.put('/:id', (req, res) => {
  const { name, amount, due_date, category_id, is_recurring, recurrence_interval, status, currency } = req.body;
  const sql = `
    UPDATE bills 
    SET name = ?, amount = ?, currency = ?, due_date = ?, category_id = ?, is_recurring = ?, recurrence_interval = ?, status = ?
    WHERE id = ?
  `;
  
  db.run(sql, [name, amount, currency || 'RON', due_date, category_id, is_recurring, recurrence_interval, status, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }
    res.json({ 
      id: req.params.id, 
      name, 
      amount,
      currency: currency || 'RON',
      due_date, 
      category_id,
      is_recurring,
      recurrence_interval,
      status
    });
  });
});

// Mark bill as paid
router.patch('/:id/pay', (req, res) => {
  const sql = 'UPDATE bills SET status = "paid" WHERE id = ?';
  
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }
    res.json({ message: 'Bill marked as paid' });
  });
});

// Delete bill
router.delete('/:id', (req, res) => {
  const sql = 'DELETE FROM bills WHERE id = ?';
  
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }
    res.json({ message: 'Bill deleted successfully' });
  });
});

module.exports = router;
