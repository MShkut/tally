// UserData model - Household, income, expenses, savings allocation
const { queryOne, execute } = require('../database/db');

class UserData {
  /**
   * Save user data (household, income, expenses, savings)
   */
  static save(userId, data) {
    const existing = queryOne('SELECT id FROM user_data WHERE user_id = ?', [userId]);

    if (existing) {
      const now = new Date().toISOString();
      execute(
        "UPDATE user_data SET data = ?, updated_at = ? WHERE user_id = ?",
        [JSON.stringify(data), now, userId]
      );
    } else {
      execute(
        'INSERT INTO user_data (user_id, data) VALUES (?, ?)',
        [userId, JSON.stringify(data)]
      );
    }

    return data;
  }

  /**
   * Load user data
   */
  static load(userId) {
    const result = queryOne('SELECT data, updated_at FROM user_data WHERE user_id = ?', [userId]);
    if (!result) return null;

    return JSON.parse(result.data);
  }

  /**
   * Delete user data
   */
  static delete(userId) {
    execute('DELETE FROM user_data WHERE user_id = ?', [userId]);
    return true;
  }
}

module.exports = UserData;
