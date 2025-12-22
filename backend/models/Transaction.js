/**
 * Transaction Model - CSV Transaction Import and Management
 *
 * Handles all database operations for financial transactions imported from
 * bank CSV files. Transactions are the core data type in Tally, representing
 * actual spending/income events categorized and tracked for budget analysis.
 *
 * Features:
 * - Bulk import from CSV files (efficient batched inserts)
 * - Advanced filtering (search, type, category, date range)
 * - Sorting and pagination
 * - Data normalization for various CSV formats
 */
const { query, queryOne, execute } = require('../database/db');

class Transaction {
  /**
   * Bulk import multiple transactions
   *
   * Efficiently imports large batches of transactions from CSV files using
   * SQLite's transaction feature for atomicity and performance. Handles
   * malformed data gracefully with type coercion.
   *
   * Transaction format:
   * - date: ISO date string (YYYY-MM-DD)
   * - description: Transaction description
   * - amount: Numeric amount (positive or negative)
   * - main_category: "income", "expense", or "savings"
   * - sub_category: Subcategory name from user_data
   *
   * @param {number} userId - User ID who owns these transactions
   * @param {Array<Object>} transactions - Array of transaction objects
   * @returns {number} Number of transactions inserted
   *
   * @example
   * Transaction.bulkCreate(1, [
   *   { date: "2024-01-15", description: "Starbucks", sub_category: "Coffee",
   *     amount: 5.50, main_category: "expense" }
   * ]);
   */
  static bulkCreate(userId, transactions) {
    const db = require('../database/db').getDatabase();
    const stmt = db.prepare(
      'INSERT INTO transactions (user_id, date, description, amount, main_category, sub_category) VALUES (?, ?, ?, ?, ?, ?)'
    );

    /**
     * Convert any value to primitive string
     *
     * Handles various CSV parsing edge cases where values might come as:
     * - Arrays: ["Food"] -> "Food"
     * - Objects: {name: "Food"} -> "Food"
     * - Primitives: "Food" -> "Food"
     *
     * @param {*} value - Value to convert
     * @returns {string|null} Primitive string or null
     */
    const toPrimitive = (value) => {
      if (value === null || value === undefined) return null;

      // Handle arrays (e.g., from multi-select CSV fields)
      if (Array.isArray(value)) {
        return value.length > 0 ? String(value[0]) : null;
      }

      // Handle objects (e.g., from JSON-formatted CSV fields)
      if (typeof value === 'object') {
        // Try common object patterns
        if (value.name) return String(value.name); // {name: "Food"} -> "Food"
        if (value.value) return String(value.value); // {value: "Something"} -> "Something"
        if (value.label) return String(value.label); // {label: "Category"} -> "Category"
        // Fallback to JSON string if object has properties
        const keys = Object.keys(value);
        if (keys.length > 0) {
          return JSON.stringify(value);
        }
        return null;
      }

      // Ensure string/number/boolean becomes string
      return String(value);
    };

    /**
     * Convert any value to numeric amount
     *
     * Handles various currency formats:
     * - "$1,234.56" -> 1234.56
     * - "1.234,56" -> 1234.56
     * - {amount: 100} -> 100
     *
     * @param {*} value - Value to convert to number
     * @returns {number} Parsed number or 0 if invalid
     */
    const toNumber = (value) => {
      if (value === null || value === undefined) return 0;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        // Remove currency symbols, commas, spaces
        const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
        return isNaN(num) ? 0 : num;
      }
      if (typeof value === 'object' && value.amount) return toNumber(value.amount);
      return 0;
    };

    // Wrap all inserts in a single transaction for atomicity and performance
    const insertMany = db.transaction((transactions) => {
      for (const tx of transactions) {
        try {
          stmt.run([
            userId,
            tx.date || new Date().toISOString().split('T')[0],
            toPrimitive(tx.description) || 'Unknown',
            toNumber(tx.amount),
            toPrimitive(tx.main_category) || 'expense',
            toPrimitive(tx.sub_category) || 'Uncategorized'
          ]);
        } catch (error) {
          console.error('[Transaction] Error inserting transaction:', error, tx);
          // Log and continue with next transaction (best-effort import)
        }
      }
    });

    insertMany(transactions);
    return transactions.length;
  }

  /**
   * Get transactions with advanced filtering and sorting
   *
   * Retrieves paginated transaction list with support for:
   * - Text search across transaction descriptions
   * - Filtering by main_category, sub_category, and date range
   * - Sorting by any field in ascending or descending order
   * - Pagination with limit/offset
   *
   * This method builds dynamic SQL queries based on provided filters,
   * using parameterized queries to prevent SQL injection.
   *
   * @param {number} userId - User ID to retrieve transactions for
   * @param {Object} [options={}] - Filter and pagination options
   * @param {number} [options.limit=1000] - Maximum results to return
   * @param {number} [options.offset=0] - Number of results to skip (for pagination)
   * @param {string} [options.search=''] - Search term for description (case-insensitive partial match)
   * @param {string} [options.type=''] - Filter by main_category ("income", "expense", "savings")
   * @param {string} [options.category=''] - Filter by sub_category name (exact match)
   * @param {string} [options.dateFilter=''] - Date filter preset ("current-month")
   * @param {string} [options.sortBy='date'] - Sort field (date, amount, description, sub_category)
   * @param {string} [options.sortOrder='desc'] - Sort order ("asc" or "desc")
   * @returns {Array<Object>} Array of transaction objects
   *
   * @example
   * // Get recent transactions for current month
   * const transactions = Transaction.findByUser(1, {
   *   dateFilter: 'current-month',
   *   sortBy: 'date',
   *   sortOrder: 'desc',
   *   limit: 50
   * });
   */
  static findByUser(userId, options = {}) {
    const {
      limit = 1000,
      offset = 0,
      search = '',
      type = '',
      category = '',
      dateFilter = '',
      sortBy = 'date',
      sortOrder = 'desc'
    } = options;

    // Build WHERE clause dynamically
    const conditions = ['user_id = ?'];
    const params = [userId];

    // Search filter (description only)
    if (search) {
      conditions.push('description LIKE ?');
      const searchPattern = `%${search}%`;
      params.push(searchPattern);
    }

    // Main category filter (type parameter for backwards compatibility)
    // Compare case-insensitively since frontend sends 'Expense' but DB stores 'expense'
    if (type) {
      conditions.push('LOWER(main_category) = LOWER(?)');
      params.push(type);
    }

    // Sub category filter (category parameter for backwards compatibility)
    if (category) {
      conditions.push('sub_category = ?');
      params.push(category);
    }

    // Date filter
    if (dateFilter === 'current-month') {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const startOfMonth = `${year}-${month}-01`;
      const nextMonth = month === '12' ? '01' : String(parseInt(month) + 1).padStart(2, '0');
      const nextYear = month === '12' ? year + 1 : year;
      const endOfMonth = `${nextYear}-${nextMonth}-01`;

      conditions.push('date >= ? AND date < ?');
      params.push(startOfMonth, endOfMonth);
    }

    // Build ORDER BY clause
    const validSortFields = {
      'date': 'date',
      'amount': 'amount',
      'description': 'description',
      'category': 'sub_category', // Map old 'category' sort to new 'sub_category'
      'sub_category': 'sub_category'
    };
    const sortField = validSortFields[sortBy] || 'date';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Build final query
    const whereClause = conditions.join(' AND ');
    const sql = `
      SELECT * FROM transactions
      WHERE ${whereClause}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const transactions = query(sql, params);

    return transactions.map(tx => ({
      id: tx.id.toString(),
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      main_category: tx.main_category,
      sub_category: tx.sub_category,
      createdAt: tx.created_at
    }));
  }

  /**
   * Get transaction count matching filters
   *
   * Returns the total count of transactions matching the same filters used
   * by findByUser(). Essential for implementing pagination UI (showing "Page X of Y").
   *
   * Uses the same filter logic as findByUser() to ensure consistency.
   *
   * @param {number} userId - User ID to count transactions for
   * @param {Object} [options={}] - Same filter options as findByUser()
   * @param {string} [options.search=''] - Search term filter
   * @param {string} [options.type=''] - Main category filter
   * @param {string} [options.category=''] - Sub category filter
   * @param {string} [options.dateFilter=''] - Date filter
   * @returns {number} Total count of transactions matching filters
   */
  static countByUser(userId, options = {}) {
    const {
      search = '',
      type = '',
      category = '',
      dateFilter = ''
    } = options;

    // Build WHERE clause (same as findByUser)
    const conditions = ['user_id = ?'];
    const params = [userId];

    if (search) {
      conditions.push('description LIKE ?');
      const searchPattern = `%${search}%`;
      params.push(searchPattern);
    }

    if (type) {
      conditions.push('main_category = ?');
      params.push(type);
    }

    if (category) {
      conditions.push('sub_category = ?');
      params.push(category);
    }

    if (dateFilter === 'current-month') {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const startOfMonth = `${year}-${month}-01`;
      const nextMonth = month === '12' ? '01' : String(parseInt(month) + 1).padStart(2, '0');
      const nextYear = month === '12' ? year + 1 : year;
      const endOfMonth = `${nextYear}-${nextMonth}-01`;

      conditions.push('date >= ? AND date < ?');
      params.push(startOfMonth, endOfMonth);
    }

    const whereClause = conditions.join(' AND ');
    const sql = `SELECT COUNT(*) as count FROM transactions WHERE ${whereClause}`;

    const result = queryOne(sql, params);
    return result.count;
  }

  /**
   * Delete a single transaction
   *
   * Removes one transaction by ID. Ensures user ownership to prevent
   * unauthorized deletion.
   *
   * @param {number} userId - User ID (ownership check)
   * @param {number|string} transactionId - Transaction ID to delete
   * @returns {boolean} True if deleted, false if not found or not owned by user
   */
  static delete(userId, transactionId) {
    const result = execute('DELETE FROM transactions WHERE id = ? AND user_id = ?', [transactionId, userId]);
    return result.changes > 0;
  }

  /**
   * Delete all transactions for a user
   *
   * Nuclear option - removes ALL transaction data for a user.
   * Used during data reset operations.
   *
   * @param {number} userId - User ID whose transactions to delete
   * @returns {number} Number of transactions deleted
   */
  static deleteAll(userId) {
    const result = execute('DELETE FROM transactions WHERE user_id = ?', [userId]);
    return result.changes;
  }

  /**
   * Delete multiple transactions by IDs (bulk delete)
   *
   * Efficiently removes multiple transactions in a single query.
   * Used for cleaning up unwanted transactions after CSV import.
   *
   * @param {number} userId - User ID (ownership check)
   * @param {Array<number|string>} transactionIds - Array of transaction IDs to delete
   * @returns {number} Number of transactions actually deleted
   */
  static deleteMany(userId, transactionIds) {
    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return 0;
    }

    // Build IN clause with placeholders for safe parameterized query
    const placeholders = transactionIds.map(() => '?').join(',');
    const result = execute(
      `DELETE FROM transactions WHERE user_id = ? AND id IN (${placeholders})`,
      [userId, ...transactionIds]
    );
    return result.changes;
  }

  /**
   * Update an existing transaction
   *
   * Modifies transaction details such as category, description, amount, etc.
   * Used for manual corrections to imported data.
   *
   * @param {number} userId - User ID (ownership check)
   * @param {number|string} transactionId - Transaction ID to update
   * @param {Object} updates - Fields to update
   * @param {string} [updates.date] - Transaction date (ISO format)
   * @param {string} [updates.description] - Transaction description
   * @param {number} [updates.amount] - Transaction amount
   * @param {string} [updates.main_category] - Main category ("income", "expense", "savings")
   * @param {string} [updates.sub_category] - Sub category name
   * @returns {Object|null} Updated transaction object, or null if not found
   */
  static update(userId, transactionId, updates) {
    const { date, description, amount, main_category, sub_category } = updates;

    execute(
      'UPDATE transactions SET date = ?, description = ?, amount = ?, main_category = ?, sub_category = ? WHERE id = ? AND user_id = ?',
      [date, description, amount, main_category, sub_category, transactionId, userId]
    );

    // Return updated transaction to confirm changes
    return Transaction.findById(userId, transactionId);
  }

  /**
   * Find a single transaction by ID
   *
   * @param {number} userId - User ID (ownership check)
   * @param {number|string} transactionId - Transaction ID to retrieve
   * @returns {Object|null} Transaction object, or null if not found or not owned by user
   */
  static findById(userId, transactionId) {
    const tx = queryOne('SELECT * FROM transactions WHERE id = ? AND user_id = ?', [transactionId, userId]);
    if (!tx) return null;

    // Map database columns to API format
    return {
      id: tx.id.toString(),
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      main_category: tx.main_category,
      sub_category: tx.sub_category,
      createdAt: tx.created_at
    };
  }
}

module.exports = Transaction;
