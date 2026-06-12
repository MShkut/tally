/**
 * Tally Budget Backend - API Server
 *
 * This is the main Express server for the Tally budget tracking application.
 * It provides REST API endpoints for:
 * - User authentication (registration, login, logout)
 * - User data management (household income, expenses, savings)
 * - Transaction management (CRUD operations, bulk import/export)
 * - Category management (custom categories, smart mappings)
 * - Settings management (preferences, currency, theme)
 * - Data import/export (backup and restore functionality)
 *
 * Database: SQLite with better-sqlite3 (synchronous operations)
 * Authentication: JWT tokens stored in httpOnly cookies
 * Security: Argon2 password hashing, CORS enabled for frontend
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');


// Initialize database connection and schema
// This must happen before any model operations
const { getDatabase } = require('./database/db');
getDatabase(); // Creates tables if they don't exist, returns singleton connection

// Import data models
const User = require('./models/User');
const UserData = require('./models/UserData');
const Settings = require('./models/Settings');
const Transaction = require('./models/Transaction');
const CategoryMapping = require('./models/CategoryMapping');

// Import middleware
const { generateToken, authenticateToken, optionalAuth } = require('./middleware/auth');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

// Middleware configuration
app.use(compression()); // Compress all HTTP responses for better performance
app.use(cors({ 
  credentials: true, 
  origin: process.env.CORS_ORIGIN || 'http://localhost:8087'
})); // Allow cross-origin requests from frontend
app.use(express.json({ limit: '50mb' })); // Parse JSON bodies (large limit for bulk transaction imports)
app.use(cookieParser()); // Parse cookies for JWT token extraction

// ==================== HEALTH CHECK ====================

/**
 * GET /api/health
 * Health check endpoint for Docker health checks and monitoring
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== AUTHENTICATION ROUTES ====================

/**
 * POST /api/auth/register
 * Register a new household user (first-time setup only)
 *
 * Tally operates in single-user mode - only one household can be registered.
 * This endpoint creates the initial user account with Argon2 hashed password.
 *
 * @route POST /api/auth/register
 * @access Public (but only works if no users exist)
 *
 * @body {string} householdName - Name of the household (e.g., "Smith Family")
 * @body {string} password - Password for authentication (will be hashed)
 *
 * @returns {Object} success: true, data: { user, token }
 * @returns {Object} user - Created user object (without password hash)
 * @returns {string} token - JWT authentication token (also set as httpOnly cookie)
 *
 * @throws {400} If household name or password missing
 * @throws {400} If a user already exists (single-user mode)
 * @throws {500} If database or hashing operation fails
 */

app.post('/api/auth/register', async (req, res) => {
  try {
    const { householdName, password } = req.body;

    // Validate required fields
    if (!householdName || !password) {
      return res.status(400).json({ success: false, error: 'Household name and password required' });
    }

    // Enforce single-user mode - only one household can be registered
    if (User.hasUsers()) {
      return res.status(400).json({ success: false, error: 'User already registered' });
    }

    // Create user with Argon2 hashed password
    const user = await User.create(householdName, password);

    // Generate JWT token for authentication
    const token = generateToken(user.id);

    // Set token as httpOnly cookie for security (prevents XSS attacks)
    res.cookie('token', token, {
      httpOnly: true, // Cannot be accessed by client-side JavaScript
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days expiration
    });

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Authenticate existing user with password
 *
 * Verifies password using Argon2 comparison and returns JWT token.
 * In single-user mode, only one household exists so no username is required.
 *
 * @route POST /api/auth/login
 * @access Public
 *
 * @body {string} password - User's password for authentication
 *
 * @returns {Object} success: true, data: { user, token }
 * @returns {Object} user - User object (without password hash)
 * @returns {string} token - JWT authentication token (also set as httpOnly cookie)
 *
 * @throws {400} If password is missing
 * @throws {404} If no user is registered
 * @throws {401} If password is incorrect
 * @throws {500} If verification fails
 */

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: (req, res) => {
    console.log('[RATE LIMIT] Login rate limit triggered for IP:', req.ip);
    res.status(429).json({ 
      success: false, 
      error: 'Too many login attempts, try again in 15 minutes' 
    });
  },
  onLimitReached: (req) => {
    console.log('[RATE LIMIT] Limit reached for IP:', req.ip);
  }
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  console.log('[LOGIN] Attempt from IP:', req.ip);
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, error: 'Password required' });
    }

    // Get the single registered user
    const user = User.getUser();

    if (!user) {
      return res.status(404).json({ success: false, error: 'No user found. Please register first.' });
    }

    // Verify password using Argon2
    const valid = await User.verifyPassword(user.id, password);

    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Set httpOnly cookie for secure session management
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/logout
 * Log out current user by clearing authentication cookie
 *
 * @route POST /api/auth/logout
 * @access Public
 *
 * @returns {Object} success: true
 */
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 *
 * @route POST /api/auth/change-password
 * @access Private (requires authentication)
 *
 * @param {string} currentPassword - User's current password
 * @param {string} newPassword - New password to set
 * @returns {Object} success: true on successful change
 * @returns {Object} error message if validation fails
 */
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from current password'
      });
    }

    // Verify current password
    const valid = await User.verifyPassword(userId, currentPassword);
    if (!valid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update to new password
    await User.updatePassword(userId, newPassword);

    console.log(`[AUTH] Password changed successfully for user ${userId}`);

    res.json({ success: true });
  } catch (error) {
    console.error('[AUTH] Change password error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to change password'
    });
  }
});

/**
 * GET /api/auth/me
 * Get currently authenticated user information
 *
 * @route GET /api/auth/me
 * @access Private (requires authentication)
 *
 * @returns {Object} success: true, data: user
 * @returns {Object} user - Current user object from JWT token
 */
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ success: true, data: req.user });
});

/**
 * GET /api/auth/status
 * Check if a user is registered in the system
 *
 * Used by the frontend to determine whether to show registration or login screen.
 * This is a public endpoint (no authentication required).
 *
 * @route GET /api/auth/status
 * @access Public
 *
 * @returns {Object} success: true, data: { registered: boolean }
 * @returns {boolean} registered - True if a user exists, false otherwise
 */
app.get('/api/auth/status', (req, res) => {
  const hasUsers = User.hasUsers();
  res.json({ success: true, data: { registered: hasUsers } });
});

// ==================== USER DATA ROUTES ====================
// UserData contains household configuration: income, monthly expenses, savings goals

/**
 * GET /api/user
 * Get household configuration data
 *
 * Retrieves all user data including:
 * - Household information
 * - Income sources and amounts
 * - Monthly expense allocations
 * - Savings goals and targets
 * - Onboarding completion status
 *
 * @route GET /api/user
 * @access Private (requires authentication)
 *
 * @returns {Object} success: true, data: userData
 * @returns {Object} userData - Complete household configuration object
 *
 * @throws {500} If database read fails
 */
app.get('/api/user', authenticateToken, (req, res) => {
  try {
    const data = UserData.load(req.userId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/user
 * Save household configuration data
 *
 * Updates user data including income, expenses, savings allocation, and onboarding status.
 * This endpoint is used during onboarding and when updating household settings.
 *
 * @route PUT /api/user
 * @access Private (requires authentication)
 *
 * @body {Object} userData - Complete or partial user data object
 * @body {boolean} [userData.onboardingComplete] - Whether onboarding is finished
 * @body {Array} [userData.income] - Income sources
 * @body {Object} [userData.expenses] - Monthly expense allocations
 * @body {Object} [userData.savings] - Savings goals and targets
 *
 * @returns {Object} success: true, data: savedUserData
 * @returns {Object} savedUserData - Updated user data object
 *
 * @throws {500} If database write fails
 */
app.put('/api/user', authenticateToken, (req, res) => {
  try {
    const data = UserData.save(req.userId, req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SETTINGS ROUTES ====================
// User preferences: currency, theme, display options, etc.

/**
 * GET /api/settings
 * Get user preferences and application settings
 *
 * Retrieves user-specific settings such as:
 * - Preferred currency
 * - Theme preference (light/dark)
 * - Display options
 * - Other application preferences
 *
 * @route GET /api/settings
 * @access Private (requires authentication)
 *
 * @returns {Object} success: true, data: settings
 * @returns {Object} settings - User settings object
 *
 * @throws {500} If database read fails
 */
app.get('/api/settings', authenticateToken, (req, res) => {
  try {
    const settings = Settings.load(req.userId);
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/settings
 * Update user preferences and application settings
 *
 * @route PUT /api/settings
 * @access Private (requires authentication)
 *
 * @body {Object} settings - Complete or partial settings object
 * @body {string} [settings.currency] - Preferred currency code (e.g., "USD", "EUR")
 * @body {string} [settings.theme] - Theme preference ("light" or "dark")
 *
 * @returns {Object} success: true, data: savedSettings
 * @returns {Object} savedSettings - Updated settings object
 *
 * @throws {500} If database write fails
 */
app.put('/api/settings', authenticateToken, (req, res) => {
  try {
    const settings = Settings.save(req.userId, req.body);
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== TRANSACTION ROUTES ====================
// Transaction management: CSV imports, filtering, categorization, CRUD operations

/**
 * GET /api/transactions
 * Get transactions with pagination, filtering, and sorting
 *
 * Supports advanced querying with multiple filters and sort options.
 * Primarily used for displaying transaction lists and generating reports.
 *
 * @route GET /api/transactions
 * @access Private (requires authentication)
 *
 * @query {number} [limit=1000] - Maximum number of transactions to return
 * @query {number} [offset=0] - Number of transactions to skip (for pagination)
 * @query {string} [search=''] - Search term for merchant/description
 * @query {string} [type=''] - Filter by transaction type (e.g., "income", "expense")
 * @query {string} [category=''] - Filter by category
 * @query {string} [dateFilter=''] - Filter by date range
 * @query {string} [sortBy='date'] - Field to sort by (date, amount, merchant, etc.)
 * @query {string} [sortOrder='desc'] - Sort direction (asc or desc)
 *
 * @returns {Object} success: true, data: transactions, total: count
 * @returns {Array} data - Array of transaction objects
 * @returns {number} total - Total count of transactions matching filters
 *
 * @throws {500} If database query fails
 */
app.get('/api/transactions', authenticateToken, (req, res) => {
  try {
    const {
      limit = 1000,
      offset = 0,
      search = '',
      type = '',
      category = '',
      dateFilter = '',
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build options object for database query
    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      search,
      type,
      category,
      dateFilter,
      sortBy,
      sortOrder
    };

    const transactions = Transaction.findByUser(req.userId, options);
    const total = Transaction.countByUser(req.userId, options);

    res.json({ success: true, data: transactions, total });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/transactions
 * Bulk import transactions from CSV
 *
 * Inserts multiple transactions in a single operation for efficiency.
 * Typically used when importing CSV files from bank statements.
 * Uses INSERT OR REPLACE to handle duplicate imports.
 *
 * @route POST /api/transactions
 * @access Private (requires authentication)
 *
 * @body {Array} transactions - Array of transaction objects
 * @body {string} transactions[].date - Transaction date (ISO format)
 * @body {string} transactions[].merchant - Merchant name
 * @body {string} transactions[].category - Category name
 * @body {number} transactions[].amount - Transaction amount
 * @body {string} transactions[].type - Transaction type (income/expense)
 * @body {string} [transactions[].description] - Optional description
 *
 * @returns {Object} success: true, data: { count: number }
 * @returns {number} count - Number of transactions imported
 *
 * @throws {400} If transactions is not an array
 * @throws {500} If database insert fails
 */
app.post('/api/transactions', authenticateToken, (req, res) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions)) {
      return res.status(400).json({ success: false, error: 'Transactions must be an array' });
    }

    const count = Transaction.bulkCreate(req.userId, transactions);
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/transactions/:id
 * Update an existing transaction
 *
 * Allows editing of transaction details such as category, merchant, date, etc.
 * Used for correcting imported data or manual adjustments.
 *
 * @route PUT /api/transactions/:id
 * @access Private (requires authentication)
 *
 * @param {string} id - Transaction ID
 *
 * @body {string} [date] - Updated transaction date
 * @body {string} [merchant] - Updated merchant name
 * @body {string} [category] - Updated category
 * @body {number} [amount] - Updated amount
 * @body {string} [type] - Updated type (income/expense)
 * @body {string} [description] - Updated description
 *
 * @returns {Object} success: true, data: updatedTransaction
 * @returns {Object} data - Updated transaction object
 *
 * @throws {404} If transaction not found or doesn't belong to user
 * @throws {500} If database update fails
 */
app.put('/api/transactions/:id', authenticateToken, (req, res) => {
  try {
    const { date, description, amount, main_category, sub_category } = req.body;

    const updated = Transaction.update(req.userId, req.params.id, {
      date,
      description,
      amount,
      main_category,
      sub_category
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/transactions/bulk-delete
 * Delete multiple transactions at once
 *
 * Efficiently removes multiple transactions in a single database operation.
 * Used for cleaning up unwanted transactions after CSV import.
 *
 * @route POST /api/transactions/bulk-delete
 * @access Private (requires authentication)
 *
 * @body {Array<string>} transactionIds - Array of transaction IDs to delete
 *
 * @returns {Object} success: true, data: { count: number }
 * @returns {number} count - Number of transactions deleted
 *
 * @throws {400} If transactionIds is not an array
 * @throws {500} If database delete fails
 */
app.post('/api/transactions/bulk-delete', authenticateToken, (req, res) => {
  try {
    const { transactionIds } = req.body;

    if (!Array.isArray(transactionIds)) {
      return res.status(400).json({ success: false, error: 'transactionIds must be an array' });
    }

    const deletedCount = Transaction.deleteMany(req.userId, transactionIds);

    // Clean up associated gifts if exist
    try {
      const GiftData = require('./models/GiftData');
      const giftData = GiftData.load(req.userId);
      if (giftData && giftData.gifts) {
        const updatedGifts = giftData.gifts.filter(g => !transactionIds.includes(g.expenseId));
        if (updatedGifts.length !== giftData.gifts.length) {
          // Gifts were removed, save updated data
          GiftData.save(req.userId, { ...giftData, gifts: updatedGifts });
        }
      }
    } catch (giftError) {
      // Log error but don't fail transaction deletion
      console.error('[GIFTS] Error cleaning up gifts on bulk delete:', giftError);
    }

    res.json({ success: true, data: { count: deletedCount } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/transactions/:id
 * Delete a single transaction
 *
 * @route DELETE /api/transactions/:id
 * @access Private (requires authentication)
 *
 * @param {string} id - Transaction ID to delete
 *
 * @returns {Object} success: true
 *
 * @throws {404} If transaction not found or doesn't belong to user
 * @throws {500} If database delete fails
 */
app.delete('/api/transactions/:id', authenticateToken, (req, res) => {
  try {
    const deleted = Transaction.delete(req.userId, req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    // Clean up associated gift if exists
    try {
      const GiftData = require('./models/GiftData');
      const giftData = GiftData.load(req.userId);
      if (giftData && giftData.gifts) {
        const updatedGifts = giftData.gifts.filter(g => g.expenseId !== req.params.id);
        if (updatedGifts.length !== giftData.gifts.length) {
          // Gift was removed, save updated data
          GiftData.save(req.userId, { ...giftData, gifts: updatedGifts });
        }
      }
    } catch (giftError) {
      // Log error but don't fail transaction deletion
      console.error('[GIFTS] Error cleaning up gift on transaction delete:', giftError);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CATEGORY MAPPING ROUTES ====================
// Smart categorization: merchant-to-category mappings and custom categories

/**
 * GET /api/categories/mappings
 * Get all merchant-to-category mappings
 *
 * Returns learned mappings that automatically categorize transactions
 * based on merchant names. These mappings are created when users manually
 * categorize transactions.
 *
 * @route GET /api/categories/mappings
 * @access Private (requires authentication)
 *
 * @returns {Object} success: true, data: mappings
 * @returns {Object} data - Object with merchant names as keys, categories as values
 * @example { "Starbucks": "Coffee & Dining", "Shell": "Transportation" }
 *
 * @throws {500} If database read fails
 */
app.get('/api/categories/mappings', authenticateToken, (req, res) => {
  try {
    const mappings = CategoryMapping.loadAll(req.userId);
    res.json({ success: true, data: mappings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/categories/mappings
 * Save merchant-to-category mappings
 *
 * Updates the smart categorization rules. When a merchant is mapped to
 * a category, future transactions from that merchant will automatically
 * be assigned that category.
 *
 * @route PUT /api/categories/mappings
 * @access Private (requires authentication)
 *
 * @body {Object} mappings - Object with merchant names as keys, categories as values
 * @example { "Walmart": "Groceries", "Target": "Shopping" }
 *
 * @returns {Object} success: true, data: mappings
 * @returns {Object} data - Saved mappings object
 *
 * @throws {500} If database write fails
 */
app.put('/api/categories/mappings', authenticateToken, (req, res) => {
  try {
    const mappings = req.body;

    // Save each merchant-to-category mapping
    Object.entries(mappings).forEach(([merchant, category]) => {
      CategoryMapping.save(req.userId, merchant, category);
    });

    res.json({ success: true, data: mappings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/categories/custom/:context
 * Get user-defined custom categories for a specific context
 *
 * Contexts allow different category sets for different purposes:
 * - "expenses": Categories for monthly expenses
 * - "transactions": Categories for imported transactions
 * - "income": Categories for income sources
 *
 * @route GET /api/categories/custom/:context
 * @access Private (requires authentication)
 *
 * @param {string} context - Category context (expenses, transactions, income, etc.)
 *
 * @returns {Object} success: true, data: categories
 * @returns {Array} data - Array of custom category names
 *
 * @throws {500} If database read fails
 */
app.get('/api/categories/custom/:context', authenticateToken, (req, res) => {
  try {
    const { context } = req.params;
    const categories = CategoryMapping.loadCustomCategories(req.userId, context);
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/categories/custom/:context
 * Save user-defined custom categories for a specific context
 *
 * @route PUT /api/categories/custom/:context
 * @access Private (requires authentication)
 *
 * @param {string} context - Category context (expenses, transactions, income, etc.)
 * @body {Array<string>} categories - Array of category names
 *
 * @returns {Object} success: true, data: categories
 * @returns {Array} data - Saved categories array
 *
 * @throws {500} If database write fails
 */
app.put('/api/categories/custom/:context', authenticateToken, (req, res) => {
  try {
    const { context } = req.params;
    const categories = req.body;

    CategoryMapping.saveCustomCategories(req.userId, context, categories);
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== GIFT DATA ROUTES ====================
// Gift budget tracking and management

/**
 * GET /api/gifts
 * Load gift data for the current user
 *
 * @route GET /api/gifts
 * @access Private (requires authentication)
 * @returns {Object} success: true, data: {people: Array, gifts: Array}
 */
app.get('/api/gifts', authenticateToken, (req, res) => {
  try {
    const GiftData = require('./models/GiftData');
    const data = GiftData.load(req.userId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[GIFTS] Load error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/gifts
 * Save gift data for the current user
 *
 * @route PUT /api/gifts
 * @access Private (requires authentication)
 * @body {Object} data - Gift data {people: Array, gifts: Array}
 * @returns {Object} success: true, data: saved gift data
 */
app.put('/api/gifts', authenticateToken, (req, res) => {
  try {
    const GiftData = require('./models/GiftData');
    const data = req.body;
    const savedData = GiftData.save(req.userId, data);
    res.json({ success: true, data: savedData });
  } catch (error) {
    console.error('[GIFTS] Save error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== DATA MANAGEMENT ROUTES ====================
// Backup, restore, and data management operations

/**
 * GET /api/data/export
 * Export all user data for backup purposes
 *
 * Creates a complete snapshot of all user data including:
 * - Household configuration (income, expenses, savings)
 * - All transactions
 * - User settings (currency, theme, etc.)
 *
 * The exported data can be used for:
 * - Backup before major changes
 * - Migration to another Tally instance
 * - Data portability
 *
 * @route GET /api/data/export
 * @access Private (requires authentication)
 *
 * @returns {Object} success: true, data: exportData
 * @returns {Object} exportData - Complete user data export
 * @returns {string} exportData.version - Export format version
 * @returns {string} exportData.exportedAt - ISO timestamp of export
 * @returns {Object} exportData.userData - Household configuration
 * @returns {Array} exportData.transactions - All transactions
 * @returns {Object} exportData.settings - User settings
 *
 * @throws {500} If data retrieval fails
 */
app.get('/api/data/export', authenticateToken, async (req, res) => {
  try {
    // Load all data for export
    const GiftData = require('./models/GiftData');
    const userData = UserData.load(req.userId);
    const settings = Settings.load(req.userId);
    const transactions = Transaction.findByUser(req.userId, { limit: 10000 });// Get all transactions (high limit)
    const giftData = GiftData.load(req.userId);

    // Build export object with version metadata
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      userData: userData || null,
      transactions: transactions || [],
      settings: settings || null,
      giftData: giftData || { people: [], gifts: [] }
    };

    res.json({ success: true, data: exportData });
  } catch (error) {
    console.error('[EXPORT] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/data/import
 * Import user data from a previous export (restore from backup)
 *
 * Restores data from a previous export. This operation:
 * - Replaces ALL existing user data
 * - Automatically marks onboarding as complete
 * - Handles partial imports (userData, settings, or transactions can be imported individually)
 *
 * CAUTION: This is a destructive operation. All existing data will be replaced.
 *
 * @route POST /api/data/import
 * @access Private (requires authentication)
 *
 * @body {Object} importData - Export data object from /api/data/export
 * @body {string} [importData.version] - Export format version
 * @body {Object} [importData.userData] - Household configuration to import
 * @body {Array} [importData.transactions] - Transactions to import
 * @body {Object} [importData.settings] - Settings to import
 *
 * @returns {Object} success: true, data: { message: string }
 *
 * @throws {400} If import data structure is invalid
 * @throws {500} If data import fails
 */
app.post('/api/data/import', authenticateToken, async (req, res) => {
  try {
    const importData = req.body;

    // Validate import data structure
    if (!importData.userData && !importData.transactions) {
      return res.status(400).json({
        success: false,
        error: 'Invalid import data structure'
      });
    }

    console.log('[IMPORT] Starting import...');

    // Import user data (household configuration)
    if (importData.userData) {
      try {
        // Ensure onboardingComplete is set to true for imported data
        // This prevents users from being stuck in onboarding after import
        const userDataToImport = {
          ...importData.userData,
          onboardingComplete: true
        };
        UserData.save(req.userId, userDataToImport);
        console.log('[IMPORT] ✓ User data imported (onboardingComplete: true)');
      } catch (error) {
        console.error('[IMPORT] Error importing user data:', error);
        throw new Error(`User data import failed: ${error.message}`);
      }
    }

    // Import settings (non-critical)
    if (importData.settings) {
      try {
        Settings.save(req.userId, importData.settings);
        console.log('[IMPORT] ✓ Settings imported');
      } catch (error) {
        console.error('[IMPORT] Error importing settings:', error);
        // Non-critical, continue with import
      }
    }

    // Import transactions (bulk operation)
    if (importData.transactions && importData.transactions.length > 0) {
      try {
        console.log(`[IMPORT] Importing ${importData.transactions.length} transactions...`);
        Transaction.bulkCreate(req.userId, importData.transactions);
        console.log('[IMPORT] ✓ Transactions imported');
      } catch (error) {
        console.error('[IMPORT] Error importing transactions:', error);
        throw new Error(`Transaction import failed: ${error.message}`);
      }
    }

    // Import gift data (non-critical)
    if (importData.giftData) {
      try {
        const GiftData = require('./models/GiftData');
        GiftData.save(req.userId, importData.giftData);
        console.log('[IMPORT] ✓ Gift data imported');
      } catch (error) {
        console.error('[IMPORT] Error importing gift data:', error);
        // Non-critical, continue with import
      }
    }

    console.log('[IMPORT] ✅ Data imported successfully');
    res.json({ success: true, data: { message: 'Data imported successfully' } });
  } catch (error) {
    console.error('[IMPORT] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/data/reset
 * Reset all user data AND delete account (DESTRUCTIVE OPERATION)
 *
 * Permanently deletes ALL user data AND user account:
 * - Household configuration
 * - All transactions
 * - All settings
 * - All category mappings
 * - User account itself
 *
 * This operation cannot be undone. Users should export data before reset.
 * After reset, user must re-register to use the application.
 *
 * @route POST /api/data/reset
 * @access Private (requires authentication)
 *
 * @returns {Object} success: true, data: { message: string, accountDeleted: true }
 *
 * @throws {500} If data deletion fails
 */
app.post('/api/data/reset', authenticateToken, async (req, res) => {
  try {
    const GiftData = require('./models/GiftData');
    // Delete all user data (irreversible)
    UserData.delete(req.userId);
    Settings.delete(req.userId);
    Transaction.deleteAll(req.userId);
    CategoryMapping.deleteAll(req.userId);
    GiftData.delete(req.userId);

    // Delete the user account itself
    User.delete(req.userId);

    console.log('[RESET] ✅ All data AND user account deleted for user', req.userId);

    // Clear authentication cookie
    res.clearCookie('token');

    res.json({
      success: true,
      data: {
        message: 'All data and account deleted successfully',
        accountDeleted: true
      }
    });
  } catch (error) {
    console.error('[RESET] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SERVER INITIALIZATION ====================

// Start Express server
app.listen(PORT, () => {
  console.log(`✅ API server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});
