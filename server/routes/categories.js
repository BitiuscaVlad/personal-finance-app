const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all categories
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM categories ORDER BY type, name';
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get category by ID
router.get('/:id', (req, res) => {
  const sql = 'SELECT * FROM categories WHERE id = ?';
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json(row);
  });
});

// Create category
router.post('/', (req, res) => {
  const { name, type, color } = req.body;
  const sql = 'INSERT INTO categories (name, type, color) VALUES (?, ?, ?)';
  
  db.run(sql, [name, type, color], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ id: this.lastID, name, type, color });
  });
});

// Update category
router.put('/:id', (req, res) => {
  const { name, type, color } = req.body;
  const sql = 'UPDATE categories SET name = ?, type = ?, color = ? WHERE id = ?';
  
  db.run(sql, [name, type, color, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json({ id: req.params.id, name, type, color });
  });
});

// Delete category
router.delete('/:id', (req, res) => {
  const sql = 'DELETE FROM categories WHERE id = ?';
  
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json({ message: 'Category deleted successfully' });
  });
});

module.exports = router;
