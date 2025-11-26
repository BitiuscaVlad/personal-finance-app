const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'finance.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

function initDatabase() {
  db.serialize(() => {
    // Categories table
    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        color TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Transactions table
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        category_id INTEGER,
        description TEXT,
        date DATE NOT NULL,
        is_recurring BOOLEAN DEFAULT 0,
        recurrence_interval TEXT CHECK(recurrence_interval IN ('daily', 'weekly', 'monthly', 'yearly')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    // Budgets table
    db.run(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        UNIQUE(category_id, month, year)
      )
    `);

    // Bills table
    db.run(`
      CREATE TABLE IF NOT EXISTS bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        due_date DATE NOT NULL,
        category_id INTEGER,
        is_recurring BOOLEAN DEFAULT 0,
        recurrence_interval TEXT CHECK(recurrence_interval IN ('monthly', 'yearly')),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    // Insert default categories
    db.get('SELECT COUNT(*) as count FROM categories', (err, row) => {
      if (!err && row.count === 0) {
        const defaultCategories = [
          ['Salary', 'income', '#10b981'],
          ['Freelance', 'income', '#059669'],
          ['Groceries', 'expense', '#ef4444'],
          ['Utilities', 'expense', '#f59e0b'],
          ['Rent', 'expense', '#8b5cf6'],
          ['Transportation', 'expense', '#3b82f6'],
          ['Entertainment', 'expense', '#ec4899'],
          ['Healthcare', 'expense', '#14b8a6'],
          ['Dining Out', 'expense', '#f97316'],
          ['Other', 'expense', '#6b7280']
        ];

        const stmt = db.prepare('INSERT INTO categories (name, type, color) VALUES (?, ?, ?)');
        defaultCategories.forEach(cat => stmt.run(cat));
        stmt.finalize();
        console.log('Default categories created');
      }
    });
  });
}

module.exports = db;
