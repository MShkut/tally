// User model - Authentication and user management
const { hash, verify } = require('@node-rs/argon2');
const { query, queryOne, execute } = require('../database/db');

class User {
  /**
   * Create a new user
   */
  static async create(householdName, password) {
    // Hash password with Argon2id (same as Vaultwarden/Start9)
    const passwordHash = await hash(password, {
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 1,
      algorithm: 2 // Argon2id
    });

    const result = execute(
      'INSERT INTO users (household_name, password_hash) VALUES (?, ?)',
      [householdName, passwordHash]
    );

    return {
      id: result.lastInsertRowid,
      householdName
    };
  }

  /**
   * Find user by ID
   */
  static findById(id) {
    const user = queryOne('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) return null;

    return {
      id: user.id,
      householdName: user.household_name,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  }

  /**
   * Get the first (and only) user - single user mode
   */
  static getUser() {
    const user = queryOne('SELECT * FROM users LIMIT 1');
    if (!user) return null;

    return {
      id: user.id,
      householdName: user.household_name,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  }

  /**
   * Verify password
   */
  static async verifyPassword(userId, password) {
    const user = queryOne('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (!user) return false;

    try {
      return await verify(user.password_hash, password);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Update password
   */
  static async updatePassword(userId, newPassword) {
    const passwordHash = await hash(newPassword, {
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
      algorithm: 2
    });

    const now = new Date().toISOString();
    execute(
      "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
      [passwordHash, now, userId]
    );

    return true;
  }

  /**
   * Check if any users exist (for initial setup)
   */
  static hasUsers() {
    const result = queryOne('SELECT COUNT(*) as count FROM users');
    return result.count > 0;
  }
}

module.exports = User;
