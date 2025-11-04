// CategoryMapping model - Smart merchant categorization
const { query, queryOne, execute } = require('../database/db');

class CategoryMapping {
  /**
   * Save category mapping
   */
  static save(userId, merchantPattern, category, context = null) {
    const existing = queryOne(
      'SELECT id FROM category_mappings WHERE user_id = ? AND merchant_pattern = ? AND context = ?',
      [userId, merchantPattern, context]
    );

    if (existing) {
      execute(
        'UPDATE category_mappings SET category = ? WHERE id = ?',
        [category, existing.id]
      );
      return { merchantPattern, category, context };
    }

    execute(
      'INSERT INTO category_mappings (user_id, merchant_pattern, category, context) VALUES (?, ?, ?, ?)',
      [userId, merchantPattern, category, context]
    );

    return { merchantPattern, category, context };
  }

  /**
   * Load all category mappings for user
   */
  static loadAll(userId) {
    const mappings = query('SELECT * FROM category_mappings WHERE user_id = ?', [userId]);

    // Convert to object format: { 'merchant': 'category', ... }
    const result = {};
    mappings.forEach(m => {
      result[m.merchant_pattern] = m.category;
    });

    return result;
  }

  /**
   * Find category for merchant
   */
  static findCategory(userId, merchantPattern) {
    const result = queryOne(
      'SELECT category FROM category_mappings WHERE user_id = ? AND merchant_pattern = ?',
      [userId, merchantPattern]
    );

    return result ? result.category : null;
  }

  /**
   * Delete category mapping
   */
  static delete(userId, merchantPattern) {
    const result = execute(
      'DELETE FROM category_mappings WHERE user_id = ? AND merchant_pattern = ?',
      [userId, merchantPattern]
    );
    return result.changes > 0;
  }

  /**
   * Delete all mappings for user
   */
  static deleteAll(userId) {
    const result = execute('DELETE FROM category_mappings WHERE user_id = ?', [userId]);
    return result.changes;
  }

  /**
   * Save custom categories for context
   */
  static saveCustomCategories(userId, context, categories) {
    const now = new Date().toISOString();
    execute(
      "INSERT OR REPLACE INTO custom_categories (user_id, context, categories, updated_at) VALUES (?, ?, ?, ?)",
      [userId, context, JSON.stringify(categories), now]
    );

    return categories;
  }

  /**
   * Load custom categories for context
   */
  static loadCustomCategories(userId, context) {
    const result = queryOne(
      'SELECT categories FROM custom_categories WHERE user_id = ? AND context = ?',
      [userId, context]
    );

    return result ? JSON.parse(result.categories) : [];
  }
}

module.exports = CategoryMapping;
