/**
 * Query Analyzer - Tools for debugging and optimizing SQL queries
 */

const { getDatabase } = require('../database/db');

/**
 * Analyze a SQL query's execution plan
 * @param {string} sql - SQL query to analyze
 * @param {Array} params - Query parameters
 * @returns {Object} Query analysis results
 */
function analyzeQuery(sql, params = []) {
  const db = getDatabase();

  try {
    // Get query plan
    const explainPlan = db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(params);

    // Get detailed execution stats (if available)
    const explainDetail = db.prepare(`EXPLAIN ${sql}`).all(params);

    return {
      plan: explainPlan,
      details: explainDetail,
      usesIndex: explainPlan.some(row =>
        row.detail && row.detail.includes('INDEX')
      ),
      scanType: explainPlan[0]?.detail || 'unknown'
    };
  } catch (error) {
    console.error('[Query Analyzer] Error analyzing query:', error);
    return { error: error.message };
  }
}

/**
 * Log slow queries (for debugging in development)
 * @param {string} queryName - Name of the query
 * @param {Function} queryFn - Function that executes the query
 * @param {number} threshold - Threshold in ms to consider slow (default: 100ms)
 */
async function logSlowQuery(queryName, queryFn, threshold = 100) {
  const startTime = Date.now();

  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;

    if (duration > threshold) {
      console.warn(`[Slow Query] ${queryName} took ${duration}ms (threshold: ${threshold}ms)`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Query Error] ${queryName} failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Get index usage statistics
 * @returns {Array} List of indexes and their usage
 */
function getIndexStats() {
  const db = getDatabase();

  try {
    // Get all indexes
    const indexes = db.prepare(`
      SELECT name, tbl_name, sql
      FROM sqlite_master
      WHERE type = 'index'
      AND name NOT LIKE 'sqlite_%'
      ORDER BY tbl_name, name
    `).all();

    return indexes;
  } catch (error) {
    console.error('[Query Analyzer] Error getting index stats:', error);
    return [];
  }
}

module.exports = {
  analyzeQuery,
  logSlowQuery,
  getIndexStats
};
