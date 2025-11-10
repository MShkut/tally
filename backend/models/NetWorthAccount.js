// NetWorthAccount model - Asset and Liability account management
const { query, queryOne, execute } = require('../database/db');

class NetWorthAccount {
  /**
   * Create a new net worth account
   */
  static create(userId, accountData) {
    const { name, type, category, tracking_method, linked_budget_category, linked_budget_context, notes } = accountData;
    const now = new Date().toISOString();

    const result = execute(
      `INSERT INTO networth_accounts
       (user_id, name, type, category, tracking_method, linked_budget_category, linked_budget_context, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, type, category, tracking_method, linked_budget_category || null, linked_budget_context || null, notes || null, now, now]
    );

    return {
      id: result.lastInsertRowid,
      ...accountData,
      user_id: userId,
      created_at: now,
      updated_at: now
    };
  }

  /**
   * Find all accounts for a user
   */
  static findByUser(userId) {
    return query(
      'SELECT * FROM networth_accounts WHERE user_id = ? ORDER BY type, name',
      [userId]
    );
  }

  /**
   * Find account by ID
   */
  static findById(userId, accountId) {
    return queryOne(
      'SELECT * FROM networth_accounts WHERE id = ? AND user_id = ?',
      [accountId, userId]
    );
  }

  /**
   * Find account by linked budget category
   */
  static findByLinkedCategory(userId, categoryName, context) {
    return queryOne(
      'SELECT * FROM networth_accounts WHERE user_id = ? AND linked_budget_category = ? AND linked_budget_context = ?',
      [userId, categoryName, context]
    );
  }

  /**
   * Update account
   */
  static update(userId, accountId, updates) {
    const { name, type, category, tracking_method, linked_budget_category, linked_budget_context, notes } = updates;
    const now = new Date().toISOString();

    execute(
      `UPDATE networth_accounts
       SET name = ?, type = ?, category = ?, tracking_method = ?,
           linked_budget_category = ?, linked_budget_context = ?, notes = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [name, type, category, tracking_method, linked_budget_category || null, linked_budget_context || null, notes || null, now, accountId, userId]
    );

    return this.findById(userId, accountId);
  }

  /**
   * Delete account (cascades to holdings and snapshots)
   */
  static delete(userId, accountId) {
    execute(
      'DELETE FROM networth_accounts WHERE id = ? AND user_id = ?',
      [accountId, userId]
    );
    return true;
  }

  /**
   * Get current balance for simple tracking account
   */
  static getCurrentBalance(userId, accountId) {
    const snapshot = queryOne(
      'SELECT balance FROM networth_snapshots WHERE account_id = ? ORDER BY date DESC LIMIT 1',
      [accountId]
    );
    return snapshot ? snapshot.balance : 0;
  }
}

module.exports = NetWorthAccount;
