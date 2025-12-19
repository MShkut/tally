/**
 * User Model - Authentication and User Management
 *
 * Handles user account operations for Tally's single-user mode.
 * Tally is designed for one household per instance, so only one user
 * account can exist at a time.
 *
 * Security:
 * - Passwords are hashed using Argon2id (same as Vaultwarden/Start9)
 * - Argon2 parameters: 64MB memory, 3 iterations, parallelism=1
 * - Password hashes are never returned in API responses
 */
const { hash, verify } = require('@node-rs/argon2');
const { query, queryOne, execute } = require('../database/db');

class User {
  /**
   * Create a new user account
   *
   * Creates a new household user with secure Argon2id password hashing.
   * This should only be called during initial registration as Tally
   * operates in single-user mode.
   *
   * @param {string} householdName - Display name for the household (e.g., "Smith Family")
   * @param {string} password - Plain text password (will be hashed before storage)
   * @returns {Promise<Object>} Created user object { id, householdName }
   * @throws {Error} If database insert fails
   *
   * @example
   * const user = await User.create("Johnson Family", "secure-password-123");
   * // Returns: { id: 1, householdName: "Johnson Family" }
   */
  static async create(householdName, password) {
    // Hash password with Argon2id (industry-standard, memory-hard algorithm)
    // Parameters match Vaultwarden/Start9 for consistency
    const passwordHash = await hash(password, {
      memoryCost: 65536, // 64 MB memory cost (prevents GPU cracking)
      timeCost: 3, // 3 iterations (balance between security and performance)
      parallelism: 1, // Single thread (suitable for server-side hashing)
      algorithm: 2 // Argon2id (hybrid mode, resistant to side-channel and GPU attacks)
    });

    const result = execute(
      'INSERT INTO users (household_name, password_hash) VALUES (?, ?)',
      [householdName, passwordHash]
    );

    // Return user object without password hash
    return {
      id: result.lastInsertRowid,
      householdName
    };
  }

  /**
   * Find user by ID
   *
   * @param {number} id - User ID
   * @returns {Object|null} User object without password hash, or null if not found
   * @returns {number} return.id - User ID
   * @returns {string} return.householdName - Household display name
   * @returns {string} return.createdAt - ISO timestamp of account creation
   * @returns {string} return.updatedAt - ISO timestamp of last update
   */
  static findById(id) {
    const user = queryOne('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) return null;

    // Map database columns to camelCase and exclude password hash
    return {
      id: user.id,
      householdName: user.household_name,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  }

  /**
   * Get the single registered user
   *
   * Tally operates in single-user mode, so this returns the only user
   * account in the system. Used during login when no user ID is known.
   *
   * @returns {Object|null} User object without password hash, or null if no users exist
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
   * Verify a password against stored hash
   *
   * Uses Argon2 constant-time comparison to prevent timing attacks.
   *
   * @param {number} userId - User ID to verify password for
   * @param {string} password - Plain text password to verify
   * @returns {Promise<boolean>} True if password matches, false otherwise
   */
  static async verifyPassword(userId, password) {
    const user = queryOne('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (!user) return false;

    try {
      // Argon2 verify() performs constant-time comparison
      return await verify(user.password_hash, password);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Update user password
   *
   * Re-hashes the password with current Argon2id parameters and updates
   * the database. Used for password change operations.
   *
   * @param {number} userId - User ID to update password for
   * @param {string} newPassword - New plain text password (will be hashed)
   * @returns {Promise<boolean>} Always returns true on success
   * @throws {Error} If database update fails
   */
  static async updatePassword(userId, newPassword) {
    // Hash new password with same secure parameters as create()
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
   * Check if any users exist in the system
   *
   * Used to determine whether to show registration or login screen.
   * In single-user mode, this indicates whether initial setup is complete.
   *
   * @returns {boolean} True if at least one user exists, false otherwise
   */
  static hasUsers() {
    const result = queryOne('SELECT COUNT(*) as count FROM users');
    return result.count > 0;
  }

  /**
   * Delete a user account
   *
   * Permanently removes a user from the system. This is used during
   * "reset all data" operation to completely remove the account.
   *
   * @param {number} userId - User ID to delete
   * @returns {boolean} Always returns true on success
   * @throws {Error} If database delete fails
   */
  static delete(userId) {
    execute('DELETE FROM users WHERE id = ?', [userId]);
    return true;
  }
}

module.exports = User;
