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

  // Performance optimizations
  db.pragma('journal_mode = WAL');      // Write-Ahead Logging for better concurrency
  db.pragma('synchronous = NORMAL');    // Faster writes while maintaining safety
  db.pragma('cache_size = -64000');     // 64MB cache (negative = KB)
  db.pragma('temp_store = MEMORY');     // Use RAM for temporary tables
  db.pragma('mmap_size = 30000000000'); // 30GB memory-mapped I/O limit

  // Initialize schema if needed
  initializeSchema();

  console.log(`✅ Database connected: ${DB_PATH} (WAL mode enabled)`);
  return db;
}

/**
 * Initialize database schema
 */
function initializeSchema() {
  if (!db) throw new Error('Database not initialized');

  // Check if schema needs to be created
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const tableNames = tables.map(t => t.name);

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
  } else {
    // Check for specific missing tables and create them if needed
    const requiredTables = [
      'networth_accounts',
      'networth_holdings',
      'networth_transactions',
      'networth_price_updates',
      'networth_snapshots'
    ];

    const missingTables = requiredTables.filter(table => !tableNames.includes(table));

    if (missingTables.length > 0) {
      console.log(`📦 Creating missing tables: ${missingTables.join(', ')}`);
      const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

      // Execute full schema - CREATE TABLE IF NOT EXISTS will skip existing tables
      const statements = schema.split(';').filter(s => s.trim());
      statements.forEach(statement => {
        if (statement.trim()) {
          try {
            db.exec(statement);
          } catch (error) {
            // Ignore errors for already existing tables/indexes
            if (!error.message.includes('already exists')) {
              console.error('Schema execution error:', error.message);
            }
          }
        }
      });

      console.log('✅ Missing tables created');
    }
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
