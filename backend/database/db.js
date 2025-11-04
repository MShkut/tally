// Database connection and initialization
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Database file location - persists in Docker volume
const DB_PATH = process.env.DB_PATH || '/data/tally.db';
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db = null;

/**
 * Initialize database connection
 */
function getDatabase() {
  if (db) return db;

  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Create database connection
  db = new Database(DB_PATH, { verbose: process.env.NODE_ENV === 'development' ? console.log : null });

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Initialize schema if needed
  initializeSchema();

  console.log(`✅ Database connected: ${DB_PATH}`);
  return db;
}

/**
 * Initialize database schema
 */
function initializeSchema() {
  if (!db) throw new Error('Database not initialized');

  // Check if schema needs to be created
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

  if (tables.length === 0) {
    console.log('📦 Initializing database schema...');
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

    // Execute schema (split by semicolons and execute each statement)
    const statements = schema.split(';').filter(s => s.trim());
    statements.forEach(statement => {
      if (statement.trim()) {
        db.exec(statement);
      }
    });

    console.log('✅ Database schema initialized');
  }
}

/**
 * Close database connection
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('❌ Database connection closed');
  }
}

/**
 * Execute a query and return results
 */
function query(sql, params = []) {
  const db = getDatabase();
  return db.prepare(sql).all(params);
}

/**
 * Execute a query and return first result
 */
function queryOne(sql, params = []) {
  const db = getDatabase();
  return db.prepare(sql).get(params);
}

/**
 * Execute an insert/update/delete and return info
 */
function execute(sql, params = []) {
  const db = getDatabase();
  return db.prepare(sql).run(params);
}

/**
 * Begin a transaction
 */
function transaction(fn) {
  const db = getDatabase();
  return db.transaction(fn)();
}

module.exports = {
  getDatabase,
  closeDatabase,
  query,
  queryOne,
  execute,
  transaction
};
