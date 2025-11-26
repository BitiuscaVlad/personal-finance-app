const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get dashboard summary
router.get('/summary', (req, res) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const queries = {
    // Total budget for current month
    totalBudget: new Promise((resolve, reject) => {
      db.get(
        'SELECT COALESCE(SUM(amount), 0) as total FROM budgets WHERE month = ? AND year = ?',
        [currentMonth, currentYear],
        (err, row) => err ? reject(err) : resolve(row.total)
      );
    }),

    // Total spent this month
    totalSpent: new Promise((resolve, reject) => {
      db.get(
        `SELECT COALESCE(SUM(t.amount), 0) as total 
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE c.type = 'expense' 
         AND strftime('%m', t.date) = printf('%02d', ?)
         AND strftime('%Y', t.date) = ?`,
        [currentMonth, currentYear.toString()],
        (err, row) => err ? reject(err) : resolve(row.total)
      );
    }),

    // Upcoming bills (next 7 days)
    upcomingBills: new Promise((resolve, reject) => {
      db.all(
        `SELECT COUNT(*) as count FROM bills 
         WHERE status = 'pending' 
         AND date(due_date) BETWEEN date('now') AND date('now', '+7 days')`,
        [],
        (err, rows) => err ? reject(err) : resolve(rows[0].count)
      );
    }),

    // Overdue bills
    overdueBills: new Promise((resolve, reject) => {
      db.all(
        `SELECT COUNT(*) as count FROM bills 
         WHERE status = 'pending' 
         AND date(due_date) < date('now')`,
        [],
        (err, rows) => err ? reject(err) : resolve(rows[0].count)
      );
    })
  };

  Promise.all([
    queries.totalBudget,
    queries.totalSpent,
    queries.upcomingBills,
    queries.overdueBills
  ])
  .then(([totalBudget, totalSpent, upcomingBills, overdueBills]) => {
    res.json({
      totalBudget,
      totalSpent,
      remaining: totalBudget - totalSpent,
      upcomingBills,
      overdueBills,
      month: currentMonth,
      year: currentYear
    });
  })
  .catch(err => {
    res.status(500).json({ error: err.message });
  });
});

// Get spending by category for current month
router.get('/spending-by-category', (req, res) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const sql = `
    SELECT 
      c.name,
      c.color,
      COALESCE(SUM(t.amount), 0) as total
    FROM categories c
    LEFT JOIN transactions t ON c.id = t.category_id
      AND strftime('%m', t.date) = printf('%02d', ?)
      AND strftime('%Y', t.date) = ?
    WHERE c.type = 'expense'
    GROUP BY c.id, c.name, c.color
    HAVING total > 0
    ORDER BY total DESC
  `;

  db.all(sql, [currentMonth, currentYear.toString()], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get recent transactions
router.get('/recent-transactions', (req, res) => {
  const limit = req.query.limit || 5;
  
  const sql = `
    SELECT t.*, c.name as category_name, c.type as category_type, c.color as category_color
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY t.date DESC, t.created_at DESC
    LIMIT ?
  `;

  db.all(sql, [limit], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

module.exports = router;
