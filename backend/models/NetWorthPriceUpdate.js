// NetWorthPriceUpdate model - Manual price updates for holdings
const { query, queryOne, execute } = require('../database/db');

class NetWorthPriceUpdate {
  /**
   * Create or update a price for a specific date
   */
  static upsert(holdingId, date, price_per_unit) {
    const now = new Date().toISOString();

    // Try to update first
    const existing = queryOne(
      'SELECT id FROM networth_price_updates WHERE holding_id = ? AND date = ?',
      [holdingId, date]
    );

    if (existing) {
      execute(
        'UPDATE networth_price_updates SET price_per_unit = ? WHERE id = ?',
        [price_per_unit, existing.id]
      );
      return { id: existing.id, holding_id: holdingId, date, price_per_unit };
    } else {
      const result = execute(
        'INSERT INTO networth_price_updates (holding_id, date, price_per_unit, created_at) VALUES (?, ?, ?, ?)',
        [holdingId, date, price_per_unit, now]
      );
      return { id: result.lastInsertRowid, holding_id: holdingId, date, price_per_unit, created_at: now };
    }
  }

  /**
   * Batch upsert multiple prices
   */
  static batchUpsert(updates) {
    const results = [];
    for (const { holdingId, date, price_per_unit } of updates) {
      results.push(this.upsert(holdingId, date, price_per_unit));
    }
    return results;
  }

  /**
   * Find all price updates for a holding
   */
  static findByHolding(holdingId) {
    return query(
      'SELECT * FROM networth_price_updates WHERE holding_id = ? ORDER BY date DESC',
      [holdingId]
    );
  }

  /**
   * Delete price update
   */
  static delete(holdingId, date) {
    execute(
      'DELETE FROM networth_price_updates WHERE holding_id = ? AND date = ?',
      [holdingId, date]
    );
    return true;
  }
}

module.exports = NetWorthPriceUpdate;
