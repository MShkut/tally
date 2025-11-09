// NetWorthTransaction model - Buy/sell transactions for holdings
const { query, queryOne, execute } = require('../database/db');

class NetWorthTransaction {
  /**
   * Create a new transaction (buy or sell)
   */
  static create(holdingId, transactionData) {
    const { date, type, quantity, price_per_unit, notes } = transactionData;
    const now = new Date().toISOString();

    const result = execute(
      `INSERT INTO networth_transactions
       (holding_id, date, type, quantity, price_per_unit, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [holdingId, date, type, quantity, price_per_unit, notes || null, now]
    );

    return {
      id: result.lastInsertRowid,
      holding_id: holdingId,
      ...transactionData,
      created_at: now
    };
  }

  /**
   * Find all transactions for a holding
   */
  static findByHolding(holdingId) {
    return query(
      'SELECT * FROM networth_transactions WHERE holding_id = ? ORDER BY date DESC',
      [holdingId]
    );
  }

  /**
   * Find transaction by ID
   */
  static findById(transactionId) {
    return queryOne(
      'SELECT * FROM networth_transactions WHERE id = ?',
      [transactionId]
    );
  }

  /**
   * Update transaction
   */
  static update(transactionId, updates) {
    const { date, type, quantity, price_per_unit, notes } = updates;

    execute(
      `UPDATE networth_transactions
       SET date = ?, type = ?, quantity = ?, price_per_unit = ?, notes = ?
       WHERE id = ?`,
      [date, type, quantity, price_per_unit, notes || null, transactionId]
    );

    return this.findById(transactionId);
  }

  /**
   * Delete transaction
   */
  static delete(transactionId) {
    execute('DELETE FROM networth_transactions WHERE id = ?', [transactionId]);
    return true;
  }
}

module.exports = NetWorthTransaction;
