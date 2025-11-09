// Transaction model - Imported CSV transactions
const { query, queryOne, execute } = require('../database/db');

class Transaction {
  /**
   * Save multiple transactions (bulk import)
   */
  static bulkCreate(userId, transactions) {
    const db = require('../database/db').getDatabase();
    const stmt = db.prepare(
      'INSERT INTO transactions (user_id, date, merchant, category, amount, type, description) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    // Helper to ensure primitive value (not object/array)
    const toPrimitive = (value) => {
      if (value === null || value === undefined) return null;

      // Handle arrays
      if (Array.isArray(value)) {
        return value.length > 0 ? String(value[0]) : null;
      }

      // Handle objects
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

    // Helper to ensure amount is a number
    const toNumber = (value) => {
      if (value === null || value === undefined) return 0;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
        return isNaN(num) ? 0 : num;
      }
      if (typeof value === 'object' && value.amount) return toNumber(value.amount);
      return 0;
    };

    const insertMany = db.transaction((transactions) => {
      for (const tx of transactions) {
        try {
          stmt.run([
            userId,
            tx.date || new Date().toISOString().split('T')[0],
            toPrimitive(tx.merchant) || 'Unknown',
            toPrimitive(tx.category) || 'Uncategorized',
            toNumber(tx.amount),
            toPrimitive(tx.type) || 'Expense',
            toPrimitive(tx.description) || ''
          ]);
        } catch (error) {
          console.error('[Transaction] Error inserting transaction:', error, tx);
          // Log and continue with next transaction
        }
      }
    });

    insertMany(transactions);
    return transactions.length;
  }

  /**
   * Get all transactions for user with optional filters
   * @param {number} userId - User ID
   * @param {Object} options - Filter options
   * @param {number} options.limit - Maximum results to return
   * @param {number} options.offset - Number of results to skip
   * @param {string} options.search - Search term for description/merchant
   * @param {string} options.type - Filter by type (Income/Expense/Savings)
   * @param {string} options.category - Filter by category name
   * @param {string} options.dateFilter - Date filter (current-month)
   * @param {string} options.sortBy - Sort field (date/amount/description/category)
   * @param {string} options.sortOrder - Sort order (asc/desc)
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

    // Search filter (description or merchant)
    if (search) {
      conditions.push('(description LIKE ? OR merchant LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    // Type filter
    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }

    // Category filter
    if (category) {
      conditions.push('category = ?');
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
      'category': 'category'
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
      merchant: tx.merchant,
      category: tx.category,
      amount: tx.amount,
      type: tx.type,
      description: tx.description,
      createdAt: tx.created_at
    }));
  }

  /**
   * Get transaction count for user with filters
   * @param {number} userId - User ID
   * @param {Object} options - Same filter options as findByUser
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
      conditions.push('(description LIKE ? OR merchant LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }

    if (category) {
      conditions.push('category = ?');
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
   * Delete transaction
   */
  static delete(userId, transactionId) {
    const result = execute('DELETE FROM transactions WHERE id = ? AND user_id = ?', [transactionId, userId]);
    return result.changes > 0;
  }

  /**
   * Delete all transactions for user
   */
  static deleteAll(userId) {
    const result = execute('DELETE FROM transactions WHERE user_id = ?', [userId]);
    return result.changes;
  }

  /**
   * Delete multiple transactions by IDs
   */
  static deleteMany(userId, transactionIds) {
    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return 0;
    }

    const placeholders = transactionIds.map(() => '?').join(',');
    const result = execute(
      `DELETE FROM transactions WHERE user_id = ? AND id IN (${placeholders})`,
      [userId, ...transactionIds]
    );
    return result.changes;
  }

  /**
   * Update transaction
   */
  static update(userId, transactionId, updates) {
    const { date, merchant, category, amount, type, description } = updates;

    execute(
      'UPDATE transactions SET date = ?, merchant = ?, category = ?, amount = ?, type = ?, description = ? WHERE id = ? AND user_id = ?',
      [date, merchant, category, amount, type, description, transactionId, userId]
    );

    return Transaction.findById(userId, transactionId);
  }

  /**
   * Find transaction by ID
   */
  static findById(userId, transactionId) {
    const tx = queryOne('SELECT * FROM transactions WHERE id = ? AND user_id = ?', [transactionId, userId]);
    if (!tx) return null;

    return {
      id: tx.id.toString(),
      date: tx.date,
      merchant: tx.merchant,
      category: tx.category,
      amount: tx.amount,
      type: tx.type,
      description: tx.description,
      createdAt: tx.created_at
    };
  }
}

module.exports = Transaction;
