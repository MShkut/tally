-- Tally Budget Database Schema
-- SQLite database for persistent data storage

-- Users table (single user authentication)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  household_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Settings table (user preferences and configuration)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  theme TEXT DEFAULT 'dark',
  data TEXT, -- JSON storage for flexible settings
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User data table (income, expenses, savings allocation)
CREATE TABLE IF NOT EXISTS user_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  data TEXT NOT NULL, -- JSON storage for household, income, expenses, savings
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Transactions table (imported CSV data)
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  merchant TEXT,
  category TEXT,
  amount REAL NOT NULL,
  type TEXT, -- 'income', 'expense', 'savings'
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date_category ON transactions(user_id, date DESC, category);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type_date ON transactions(user_id, type, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant);
CREATE INDEX IF NOT EXISTS idx_transactions_description ON transactions(description);

-- Covering index for the most common query (all filters + sort by date)
-- This allows SQLite to satisfy queries entirely from the index without reading table rows
CREATE INDEX IF NOT EXISTS idx_transactions_covering ON transactions(
  user_id, type, category, date DESC,
  id, merchant, amount, description
);

-- Gift data table (gift budget tracking)
CREATE TABLE IF NOT EXISTS gift_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  data TEXT NOT NULL, -- JSON storage for people and gifts
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Category mappings table (smart categorization)
CREATE TABLE IF NOT EXISTS category_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  merchant_pattern TEXT NOT NULL,
  category TEXT NOT NULL,
  context TEXT, -- 'expenses', 'income', 'savings', etc.
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_category_mappings_user ON category_mappings(user_id);

-- Custom categories table (user-defined categories)
CREATE TABLE IF NOT EXISTS custom_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  context TEXT NOT NULL, -- 'expenses', 'savings', 'income'
  categories TEXT NOT NULL, -- JSON array of category names
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, context)
);
