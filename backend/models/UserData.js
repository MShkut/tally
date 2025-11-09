/**
 * UserData Model - Household Configuration Storage
 *
 * Stores household-level configuration data including:
 * - Income sources and amounts
 * - Monthly expense allocations
 * - Savings goals and targets
 * - Onboarding completion status
 *
 * Data is stored as JSON in the database for flexibility, allowing
 * the schema to evolve without database migrations.
 */
const { queryOne, execute } = require('../database/db');

class UserData {
  /**
   * Save household configuration data
   *
   * Saves or updates the user's household configuration. The data is stored
   * as JSON, allowing flexible schema evolution. Uses INSERT or UPDATE
   * depending on whether data already exists.
   *
   * Typical data structure:
   * - household: { name, members, ... }
   * - income: [{ source, amount, frequency }, ...]
   * - expenses: { category: amount, ... }
   * - savings: { goal, target, ... }
   * - onboardingComplete: boolean
   *
   * @param {number} userId - User ID
   * @param {Object} data - Household configuration object (will be JSON stringified)
   * @returns {Object} The saved data object (echoed back)
   *
   * @example
   * UserData.save(1, {
   *   household: { name: "Smith Family" },
   *   income: [{ source: "Salary", amount: 5000, frequency: "monthly" }],
   *   expenses: { "Rent": 1500, "Groceries": 500 },
   *   onboardingComplete: true
   * });
   */
  static save(userId, data) {
    const existing = queryOne('SELECT id FROM user_data WHERE user_id = ?', [userId]);

    if (existing) {
      // Update existing record
      const now = new Date().toISOString();
      execute(
        "UPDATE user_data SET data = ?, updated_at = ? WHERE user_id = ?",
        [JSON.stringify(data), now, userId]
      );
    } else {
      // Insert new record
      execute(
        'INSERT INTO user_data (user_id, data) VALUES (?, ?)',
        [userId, JSON.stringify(data)]
      );
    }

    return data;
  }

  /**
   * Load household configuration data
   *
   * Retrieves the user's household configuration from the database.
   * Returns null if no configuration exists (user hasn't completed onboarding).
   *
   * @param {number} userId - User ID
   * @returns {Object|null} Parsed household configuration object, or null if not found
   */
  static load(userId) {
    const result = queryOne('SELECT data, updated_at FROM user_data WHERE user_id = ?', [userId]);
    if (!result) return null;

    // Parse JSON data back to object
    return JSON.parse(result.data);
  }

  /**
   * Delete household configuration data
   *
   * Removes all household configuration for a user.
   * Used during data reset operations.
   *
   * @param {number} userId - User ID
   * @returns {boolean} Always returns true
   */
  static delete(userId) {
    execute('DELETE FROM user_data WHERE user_id = ?', [userId]);
    return true;
  }
}

module.exports = UserData;
