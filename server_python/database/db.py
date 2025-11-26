"""
Database module for SQLite operations
"""
import sqlite3
from pathlib import Path
import os
from contextlib import contextmanager
import logfire


DB_PATH = os.getenv("DB_PATH", Path(__file__).parent / "finance.db")


@contextmanager
def get_db():
    """Get database connection context manager"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    try:
        yield conn
    finally:
        conn.close()


def dict_from_row(row):
    """Convert sqlite3.Row to dictionary"""
    if row is None:
        return None
    return dict(row)


def init_database():
    """Initialize database with all tables"""
    logfire.info("Initializing database")
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Categories table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
                color TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Transactions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount REAL NOT NULL,
                currency TEXT DEFAULT 'RON',
                category_id INTEGER,
                description TEXT,
                date DATE NOT NULL,
                is_recurring BOOLEAN DEFAULT 0,
                recurrence_interval TEXT CHECK(recurrence_interval IN ('daily', 'weekly', 'monthly', 'yearly')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )
        """)
        
        # Check if currency column exists in transactions
        cursor.execute("PRAGMA table_info(transactions)")
        columns = [col[1] for col in cursor.fetchall()]
        if 'currency' not in columns:
            cursor.execute("ALTER TABLE transactions ADD COLUMN currency TEXT DEFAULT 'RON'")
            logfire.info("Added currency column to transactions table")
        
        # Budgets table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS budgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                currency TEXT DEFAULT 'RON',
                month INTEGER NOT NULL,
                year INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id),
                UNIQUE(category_id, month, year)
            )
        """)
        
        # Bills table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS bills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                amount REAL NOT NULL,
                currency TEXT DEFAULT 'RON',
                due_date DATE NOT NULL,
                category_id INTEGER,
                is_recurring BOOLEAN DEFAULT 0,
                recurrence_interval TEXT CHECK(recurrence_interval IN ('monthly', 'yearly')),
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )
        """)
        
        # Exchange rates table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS exchange_rates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                currency_code TEXT NOT NULL,
                rate REAL NOT NULL,
                date DATE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(currency_code, date)
            )
        """)
        
        # User preferences table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_preferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT NOT NULL UNIQUE,
                value TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Insert default display currency preference
        cursor.execute("""
            INSERT OR IGNORE INTO user_preferences (key, value) 
            VALUES ('display_currency', 'RON')
        """)
        
        # Insert default categories if none exist (not in test mode)
        if os.getenv("ENV") != "test":
            cursor.execute("SELECT COUNT(*) as count FROM categories")
            count = cursor.fetchone()[0]
            
            if count == 0:
                default_categories = [
                    ('Salary', 'income', '#10b981'),
                    ('Freelance', 'income', '#059669'),
                    ('Groceries', 'expense', '#ef4444'),
                    ('Utilities', 'expense', '#f59e0b'),
                    ('Rent', 'expense', '#8b5cf6'),
                    ('Transportation', 'expense', '#3b82f6'),
                    ('Entertainment', 'expense', '#ec4899'),
                    ('Healthcare', 'expense', '#14b8a6'),
                    ('Dining Out', 'expense', '#f97316'),
                    ('Other', 'expense', '#6b7280')
                ]
                
                cursor.executemany(
                    "INSERT INTO categories (name, type, color) VALUES (?, ?, ?)",
                    default_categories
                )
                logfire.info("Default categories created", count=len(default_categories))
        
        conn.commit()
        logfire.info("Database initialized successfully")


def execute_query(query: str, params: tuple = (), fetch_one: bool = False):
    """Execute a query and return results"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        
        if fetch_one:
            row = cursor.fetchone()
            return dict_from_row(row)
        
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def execute_insert(query: str, params: tuple = ()):
    """Execute an insert query and return the last row id"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        conn.commit()
        return cursor.lastrowid


def execute_update(query: str, params: tuple = ()):
    """Execute an update/delete query and return the number of affected rows"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        conn.commit()
        return cursor.rowcount
