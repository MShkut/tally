// Settings model - User preferences and configuration
const { queryOne, execute } = require('../database/db');

class Settings {
  /**
   * Save settings
   */
  static save(userId, settings) {
    const existing = queryOne('SELECT id FROM settings WHERE user_id = ?', [userId]);

    const { currency, theme, ...otherSettings } = settings;
    const now = new Date().toISOString();

    if (existing) {
      execute(
        "UPDATE settings SET currency = ?, theme = ?, data = ?, updated_at = ? WHERE user_id = ?",
        [currency || 'CAD', theme || 'dark', JSON.stringify(otherSettings), now, userId]
      );
    } else {
      execute(
        'INSERT INTO settings (user_id, currency, theme, data) VALUES (?, ?, ?, ?)',
        [userId, currency || 'CAD', theme || 'dark', JSON.stringify(otherSettings)]
      );
    }

    return settings;
  }

  /**
   * Load settings
   */
  static load(userId) {
    const result = queryOne('SELECT currency, theme, data FROM settings WHERE user_id = ?', [userId]);

    if (!result) {
      return { currency: 'CAD', theme: 'dark' };
    }

    const data = result.data ? JSON.parse(result.data) : {};

    return {
      currency: result.currency,
      theme: result.theme,
      ...data
    };
  }

  /**
   * Delete settings
   */
  static delete(userId) {
    execute('DELETE FROM settings WHERE user_id = ?', [userId]);
    return true;
  }
}

module.exports = Settings;
