// NetWorthHolding model - Individual investment holdings
const { query, queryOne, execute } = require('../database/db');

class NetWorthHolding {
  /**
   * Create a new holding
   */
  static create(accountId, holdingData) {
    const { name, symbol, asset_category, notes } = holdingData;
    const now = new Date().toISOString();

    const result = execute(
      `INSERT INTO networth_holdings
       (account_id, name, symbol, asset_category, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [accountId, name, symbol || null, asset_category || null, notes || null, now, now]
    );

    return {
      id: result.lastInsertRowid,
      account_id: accountId,
      ...holdingData,
      created_at: now,
      updated_at: now
    };
  }

  /**
   * Find all holdings for an account
   */
  static findByAccount(accountId) {
    return query(
      'SELECT * FROM networth_holdings WHERE account_id = ? ORDER BY name',
      [accountId]
    );
  }

  /**
   * Find holding by ID
   */
  static findById(holdingId) {
    return queryOne(
      'SELECT * FROM networth_holdings WHERE id = ?',
      [holdingId]
    );
  }

  /**
   * Update holding
   */
  static update(holdingId, updates) {
    const { name, symbol, asset_category, notes } = updates;
    const now = new Date().toISOString();

    execute(
      `UPDATE networth_holdings
       SET name = ?, symbol = ?, asset_category = ?, notes = ?, updated_at = ?
       WHERE id = ?`,
      [name, symbol || null, asset_category || null, notes || null, now, holdingId]
    );

    return this.findById(holdingId);
  }

  /**
   * Delete holding (cascades to transactions and price updates)
   */
  static delete(holdingId) {
    execute('DELETE FROM networth_holdings WHERE id = ?', [holdingId]);
    return true;
  }

  /**
   * Get current quantity for holding
   */
  static getCurrentQuantity(holdingId, asOfDate = new Date().toISOString().split('T')[0]) {
    const transactions = query(
      'SELECT type, quantity FROM networth_transactions WHERE holding_id = ? AND date <= ? ORDER BY date ASC',
      [holdingId, asOfDate]
    );

    let total = 0;
    for (const tx of transactions) {
      if (tx.type === 'buy') {
        total += tx.quantity;
      } else {
        total -= tx.quantity;
      }
    }
    return total;
  }

  /**
   * Get most recent price for holding
   */
  static getMostRecentPrice(holdingId, asOfDate = new Date().toISOString().split('T')[0]) {
    // Check transactions first
    const transaction = queryOne(
      'SELECT price_per_unit FROM networth_transactions WHERE holding_id = ? AND date <= ? ORDER BY date DESC LIMIT 1',
      [holdingId, asOfDate]
    );

    // Check manual price updates
    const priceUpdate = queryOne(
      'SELECT price_per_unit FROM networth_price_updates WHERE holding_id = ? AND date <= ? ORDER BY date DESC LIMIT 1',
      [holdingId, asOfDate]
    );

    // Use whichever is more recent
    if (!transaction && !priceUpdate) return 0;
    if (!transaction) return priceUpdate.price_per_unit;
    if (!priceUpdate) return transaction.price_per_unit;

    // Compare dates - need to fetch full records with dates
    const txFull = queryOne(
      'SELECT price_per_unit, date FROM networth_transactions WHERE holding_id = ? AND date <= ? ORDER BY date DESC LIMIT 1',
      [holdingId, asOfDate]
    );
    const priceFull = queryOne(
      'SELECT price_per_unit, date FROM networth_price_updates WHERE holding_id = ? AND date <= ? ORDER BY date DESC LIMIT 1',
      [holdingId, asOfDate]
    );

    return txFull.date > priceFull.date ? txFull.price_per_unit : priceFull.price_per_unit;
  }

  /**
   * Get current value of holding
   */
  static getCurrentValue(holdingId, asOfDate = new Date().toISOString().split('T')[0]) {
    const quantity = this.getCurrentQuantity(holdingId, asOfDate);
    const price = this.getMostRecentPrice(holdingId, asOfDate);
    return quantity * price;
  }
}

module.exports = NetWorthHolding;
