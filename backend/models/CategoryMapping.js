/**
 * CategoryMapping Model - Smart Transaction Categorization
 *
 * Manages two types of categorization data:
 * 1. Merchant-to-category mappings: Rules that automatically categorize
 *    transactions based on merchant names (e.g., "Starbucks" → "Coffee")
 * 2. Custom categories: User-defined category lists for different contexts
 *    (expenses, transactions, income, etc.)
 *
 * These mappings enable smart categorization of CSV imports and provide
 * a personalized categorization experience.
 */
const { query, queryOne, execute } = require('../database/db');

class CategoryMapping {
  /**
   * Save a merchant-to-category mapping
   *
   * Creates or updates a rule that automatically assigns a category to
   * transactions from a specific merchant. These mappings are "learned"
   * when users manually categorize transactions.
   *
   * @param {number} userId - User ID
   * @param {string} merchantPattern - Merchant name pattern (exact match)
   * @param {string} category - Category to assign
   * @param {string|null} [context=null] - Optional context for the mapping
   * @returns {Object} The saved mapping { merchantPattern, category, context }
   *
   * @example
   * CategoryMapping.save(1, "Starbucks", "Coffee & Dining");
   * // Future transactions from "Starbucks" will auto-categorize as "Coffee & Dining"
   */
  static save(userId, merchantPattern, category, context = null) {
    const existing = queryOne(
      'SELECT id FROM category_mappings WHERE user_id = ? AND merchant_pattern = ? AND context = ?',
      [userId, merchantPattern, context]
    );

    if (existing) {
      // Update existing mapping
      execute(
        'UPDATE category_mappings SET category = ? WHERE id = ?',
        [category, existing.id]
      );
      return { merchantPattern, category, context };
    }

    // Insert new mapping
    execute(
      'INSERT INTO category_mappings (user_id, merchant_pattern, category, context) VALUES (?, ?, ?, ?)',
      [userId, merchantPattern, category, context]
    );

    return { merchantPattern, category, context };
  }

  /**
   * Load all merchant-to-category mappings for a user
   *
   * Returns all learned categorization rules as an object where keys are
   * merchant names and values are categories.
   *
   * @param {number} userId - User ID
   * @returns {Object} Mappings object { merchantName: categoryName, ... }
   *
   * @example
   * const mappings = CategoryMapping.loadAll(1);
   * // Returns: { "Starbucks": "Coffee", "Shell": "Transportation", ... }
   */
  static loadAll(userId) {
    const mappings = query('SELECT * FROM category_mappings WHERE user_id = ?', [userId]);

    // Convert array to object format for easy lookups
    const result = {};
    mappings.forEach(m => {
      result[m.merchant_pattern] = m.category;
    });

    return result;
  }

  /**
   * Find the category for a specific merchant
   *
   * Looks up the automatic category assignment for a merchant.
   * Returns null if no mapping exists.
   *
   * @param {number} userId - User ID
   * @param {string} merchantPattern - Merchant name to look up
   * @returns {string|null} Category name, or null if no mapping exists
   *
   * @example
   * const category = CategoryMapping.findCategory(1, "Starbucks");
   * // Returns: "Coffee & Dining" (if mapping exists)
   */
  static findCategory(userId, merchantPattern) {
    const result = queryOne(
      'SELECT category FROM category_mappings WHERE user_id = ? AND merchant_pattern = ?',
      [userId, merchantPattern]
    );

    return result ? result.category : null;
  }

  /**
   * Delete a merchant-to-category mapping
   *
   * Removes an automatic categorization rule. Future transactions from
   * this merchant will need manual categorization.
   *
   * @param {number} userId - User ID
   * @param {string} merchantPattern - Merchant pattern to remove
   * @returns {boolean} True if deleted, false if not found
   */
  static delete(userId, merchantPattern) {
    const result = execute(
      'DELETE FROM category_mappings WHERE user_id = ? AND merchant_pattern = ?',
      [userId, merchantPattern]
    );
    return result.changes > 0;
  }

  /**
   * Delete all merchant-to-category mappings for a user
   *
   * Removes all automatic categorization rules.
   * Used during data reset operations.
   *
   * @param {number} userId - User ID
   * @returns {number} Number of mappings deleted
   */
  static deleteAll(userId) {
    const result = execute('DELETE FROM category_mappings WHERE user_id = ?', [userId]);
    return result.changes;
  }

  /**
   * Save custom categories for a specific context
   *
   * Stores a user-defined list of categories for a given context.
   * Contexts allow different category sets for different purposes:
   * - "expenses": Categories for monthly expense tracking
   * - "transactions": Categories for imported transactions
   * - "income": Categories for income sources
   *
   * @param {number} userId - User ID
   * @param {string} context - Context identifier (e.g., "expenses", "transactions")
   * @param {Array<string>} categories - Array of category names
   * @returns {Array<string>} The saved categories array (echoed back)
   *
   * @example
   * CategoryMapping.saveCustomCategories(1, "expenses", [
   *   "Rent", "Groceries", "Utilities", "Transportation"
   * ]);
   */
  static saveCustomCategories(userId, context, categories) {
    const now = new Date().toISOString();
    // Use INSERT OR REPLACE for upsert behavior
    execute(
      "INSERT OR REPLACE INTO custom_categories (user_id, context, categories, updated_at) VALUES (?, ?, ?, ?)",
      [userId, context, JSON.stringify(categories), now]
    );

    return categories;
  }

  /**
   * Load custom categories for a specific context
   *
   * Retrieves the user-defined category list for a given context.
   * Returns an empty array if no custom categories exist.
   *
   * @param {number} userId - User ID
   * @param {string} context - Context identifier (e.g., "expenses", "transactions")
   * @returns {Array<string>} Array of category names, or empty array if not found
   *
   * @example
   * const expenseCategories = CategoryMapping.loadCustomCategories(1, "expenses");
   * // Returns: ["Rent", "Groceries", "Utilities", ...]
   */
  static loadCustomCategories(userId, context) {
    const result = queryOne(
      'SELECT categories FROM custom_categories WHERE user_id = ? AND context = ?',
      [userId, context]
    );

    // Return parsed array or empty array if not found
    return result ? JSON.parse(result.categories) : [];
  }
}

module.exports = CategoryMapping;
