// Set test environment variable
process.env.DB_PATH = ':memory:';
process.env.NODE_ENV = 'test';

// Increase timeout for database operations
jest.setTimeout(10000);

// Wait for database to be ready
beforeAll(async () => {
  const db = require('../database/db');
  
  // Skip database initialization if db is mocked
  if (db.get && db.get._isMockFunction) {
    return Promise.resolve();
  }
  
  // Wait a bit for database initialization
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return new Promise((resolve) => {
    db.get('SELECT name FROM sqlite_master WHERE type="table" AND name="categories"', (err, row) => {
      if (!row) {
        console.error('Categories table not found!');
      }
      resolve();
    });
  });
});

// Helper function to get database instance
function getDb() {
  return require('../database/db');
}

// Helper function to clear all tables
global.clearDatabase = () => {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('DELETE FROM transactions');
      db.run('DELETE FROM budgets');
      db.run('DELETE FROM bills');
      db.run('DELETE FROM categories', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};

// Helper function to create test category
global.createTestCategory = (name = 'Test Category', type = 'expense', color = '#ff0000') => {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO categories (name, type, color) VALUES (?, ?, ?)',
      [name, type, color],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};
