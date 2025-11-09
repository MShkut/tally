/**
 * Settings Model - User Preferences and Application Configuration
 *
 * Manages user-specific application settings including:
 * - Currency preference (USD, EUR, GBP, etc.)
 * - Theme preference (light/dark mode)
 * - Other application preferences (stored as JSON)
 *
 * Currency and theme are stored in dedicated columns for fast querying,
 * while other settings are stored as flexible JSON.
 */
const { queryOne, execute } = require('../database/db');

class Settings {
  /**
   * Save user settings
   *
   * Saves or updates user preferences. Currency and theme are stored in
   * dedicated columns, while additional settings are stored as JSON.
   * Defaults to USD currency and dark theme if not specified.
   *
   * @param {number} userId - User ID
   * @param {Object} settings - Settings object
   * @param {string} [settings.currency='USD'] - Currency code (USD, EUR, GBP, etc.)
   * @param {string} [settings.theme='dark'] - Theme preference ("light" or "dark")
   * @param {*} [settings.*] - Any other settings (stored as JSON)
   * @returns {Object} The saved settings object (echoed back)
   *
   * @example
   * Settings.save(1, {
   *   currency: 'EUR',
   *   theme: 'light',
   *   notifications: true,
   *   dateFormat: 'DD/MM/YYYY'
   * });
   */
  static save(userId, settings) {
    const existing = queryOne('SELECT id FROM settings WHERE user_id = ?', [userId]);

    // Extract known fields, store rest as JSON
    const { currency, theme, ...otherSettings } = settings;
    const now = new Date().toISOString();

    if (existing) {
      // Update existing settings
      execute(
        "UPDATE settings SET currency = ?, theme = ?, data = ?, updated_at = ? WHERE user_id = ?",
        [currency || 'USD', theme || 'dark', JSON.stringify(otherSettings), now, userId]
      );
    } else {
      // Insert new settings with defaults
      execute(
        'INSERT INTO settings (user_id, currency, theme, data) VALUES (?, ?, ?, ?)',
        [userId, currency || 'USD', theme || 'dark', JSON.stringify(otherSettings)]
      );
    }

    return settings;
  }

  /**
   * Load user settings
   *
   * Retrieves user preferences from the database. Returns default settings
   * (USD currency, dark theme) if no settings exist.
   *
   * @param {number} userId - User ID
   * @returns {Object} Settings object with currency, theme, and any additional settings
   * @returns {string} return.currency - Currency code (default: 'USD')
   * @returns {string} return.theme - Theme preference (default: 'dark')
   *
   * @example
   * const settings = Settings.load(1);
   * // Returns: { currency: 'USD', theme: 'dark', ... }
   */
  static load(userId) {
    const result = queryOne('SELECT currency, theme, data FROM settings WHERE user_id = ?', [userId]);

    // Return defaults if no settings exist
    if (!result) {
      return { currency: 'USD', theme: 'dark' };
    }

    // Parse additional settings from JSON
    const data = result.data ? JSON.parse(result.data) : {};

    // Merge column values with JSON data
    return {
      currency: result.currency,
      theme: result.theme,
      ...data
    };
  }

  /**
   * Delete user settings
   *
   * Removes all settings for a user, reverting to application defaults.
   * Used during data reset operations.
   *
   * @param {number} userId - User ID
   * @returns {boolean} Always returns true
   */
  static delete(userId) {
    execute('DELETE FROM settings WHERE user_id = ?', [userId]);
    return true;
  }
}

module.exports = Settings;
