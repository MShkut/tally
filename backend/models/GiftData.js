// GiftData model - Gift budget tracking
const { queryOne, execute } = require('../database/db');

class GiftData {
  /**
   * Save gift data (people and gifts)
   */
  static save(userId, data) {
    const existing = queryOne('SELECT id FROM gift_data WHERE user_id = ?', [userId]);

    if (existing) {
      const now = new Date().toISOString();
      execute(
        "UPDATE gift_data SET data = ?, updated_at = ? WHERE user_id = ?",
        [JSON.stringify(data), now, userId]
      );
    } else {
      execute(
        'INSERT INTO gift_data (user_id, data) VALUES (?, ?)',
        [userId, JSON.stringify(data)]
      );
    }

    return data;
  }

  /**
   * Load gift data
   */
  static load(userId) {
    const result = queryOne('SELECT data FROM gift_data WHERE user_id = ?', [userId]);
    if (!result) return { people: [], gifts: [] };

    return JSON.parse(result.data);
  }

  /**
   * Delete gift data
   */
  static delete(userId) {
    execute('DELETE FROM gift_data WHERE user_id = ?', [userId]);
    return true;
  }
}

module.exports = GiftData;
