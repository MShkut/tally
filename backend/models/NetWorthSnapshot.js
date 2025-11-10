// NetWorthSnapshot model - Balance snapshots for simple tracking accounts
const { query, queryOne, execute } = require('../database/db');

class NetWorthSnapshot {
  /**
   * Create or update a snapshot for a specific date
   */
  static upsert(accountId, date, balance, source = 'manual', transactionId = null) {
    const now = new Date().toISOString();

    // Try to update first
    const existing = queryOne(
      'SELECT id FROM networth_snapshots WHERE account_id = ? AND date = ?',
      [accountId, date]
    );

    if (existing) {
      execute(
        'UPDATE networth_snapshots SET balance = ?, source = ?, transaction_id = ? WHERE id = ?',
        [balance, source, transactionId, existing.id]
      );
      return { id: existing.id, account_id: accountId, date, balance, source, transaction_id };
    } else {
      const result = execute(
        'INSERT INTO networth_snapshots (account_id, date, balance, source, transaction_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [accountId, date, balance, source, transactionId, now]
      );
      return { id: result.lastInsertRowid, account_id: accountId, date, balance, source, transaction_id, created_at: now };
    }
  }

  /**
   * Find all snapshots for an account
   */
  static findByAccount(accountId, startDate = null, endDate = null) {
    let sql = 'SELECT * FROM networth_snapshots WHERE account_id = ?';
    const params = [accountId];

    if (startDate) {
      sql += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND date <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY date DESC';
    return query(sql, params);
  }

  /**
   * Get most recent snapshot for an account
   */
  static getMostRecent(accountId, asOfDate = new Date().toISOString().split('T')[0]) {
    return queryOne(
      'SELECT * FROM networth_snapshots WHERE account_id = ? AND date <= ? ORDER BY date DESC LIMIT 1',
      [accountId, asOfDate]
    );
  }

  /**
   * Delete snapshot
   */
  static delete(accountId, date) {
    execute(
      'DELETE FROM networth_snapshots WHERE account_id = ? AND date = ?',
      [accountId, date]
    );
    return true;
  }

  /**
   * Delete snapshot by ID
   */
  static deleteById(snapshotId) {
    execute('DELETE FROM networth_snapshots WHERE id = ?', [snapshotId]);
    return true;
  }

  /**
   * Delete snapshots linked to a transaction
   */
  static deleteByTransaction(transactionId) {
    execute('DELETE FROM networth_snapshots WHERE transaction_id = ?', [transactionId]);
    return true;
  }
}

module.exports = NetWorthSnapshot;
