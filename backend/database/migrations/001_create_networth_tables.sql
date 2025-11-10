-- Migration: Create Net Worth Tracking Tables
-- Date: 2025-01-10
-- Description: Creates tables for tracking net worth accounts, holdings, transactions, price updates, and snapshots

-- ============================================
-- Net Worth Accounts (Asset/Liability accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS networth_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('asset', 'liability')),
    category TEXT NOT NULL,
    tracking_method TEXT NOT NULL CHECK(tracking_method IN ('simple', 'quantity_based')),
    linked_budget_category TEXT,
    linked_budget_context TEXT CHECK(linked_budget_context IN ('savings', 'expenses')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- Holdings (Individual investments/assets with quantity tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS networth_holdings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    symbol TEXT,
    asset_category TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (account_id) REFERENCES networth_accounts(id) ON DELETE CASCADE
);

-- ============================================
-- Holding Transactions (Buys and Sells)
-- ============================================
CREATE TABLE IF NOT EXISTS networth_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    holding_id INTEGER NOT NULL,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('buy', 'sell')),
    quantity REAL NOT NULL,
    price_per_unit INTEGER NOT NULL, -- in cents (smallest currency unit)
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (holding_id) REFERENCES networth_holdings(id) ON DELETE CASCADE
);

-- ============================================
-- Manual Price Updates (When not buying/selling)
-- ============================================
CREATE TABLE IF NOT EXISTS networth_price_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    holding_id INTEGER NOT NULL,
    date DATE NOT NULL,
    price_per_unit INTEGER NOT NULL, -- in cents (smallest currency unit)
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (holding_id) REFERENCES networth_holdings(id) ON DELETE CASCADE,
    UNIQUE(holding_id, date)
);

-- ============================================
-- Account Balance Snapshots (For simple tracking accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS networth_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    date DATE NOT NULL,
    balance INTEGER NOT NULL, -- in cents (smallest currency unit)
    source TEXT DEFAULT 'manual' CHECK(source IN ('manual', 'transaction', 'import')),
    transaction_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (account_id) REFERENCES networth_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    UNIQUE(account_id, date)
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_networth_accounts_user
ON networth_accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_networth_accounts_linked
ON networth_accounts(user_id, linked_budget_category, linked_budget_context);

CREATE INDEX IF NOT EXISTS idx_networth_holdings_account
ON networth_holdings(account_id);

CREATE INDEX IF NOT EXISTS idx_networth_transactions_holding_date
ON networth_transactions(holding_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_networth_price_updates_holding_date
ON networth_price_updates(holding_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_networth_snapshots_account_date
ON networth_snapshots(account_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_networth_snapshots_transaction
ON networth_snapshots(transaction_id);
