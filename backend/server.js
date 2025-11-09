// backend/server.js
// Tally Budget Backend - API server with database storage

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');

// Initialize database
const { getDatabase } = require('./database/db');
getDatabase(); // Initialize connection and schema

// Import models
const User = require('./models/User');
const UserData = require('./models/UserData');
const Settings = require('./models/Settings');
const Transaction = require('./models/Transaction');
const GiftData = require('./models/GiftData');
const CategoryMapping = require('./models/CategoryMapping');

// Import middleware
const { generateToken, authenticateToken, optionalAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable compression for all responses
app.use(compression());

// Enable CORS for frontend
app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: '50mb' })); // Increased limit for bulk imports
app.use(cookieParser());

// Health check endpoints (both /health and /api/health for compatibility)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'tally-budget-api' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'tally-budget-api' });
});

// ==================== AUTHENTICATION ROUTES ====================

/**
 * POST /api/auth/register
 * Register new user (first-time setup)
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { householdName, password } = req.body;

    if (!householdName || !password) {
      return res.status(400).json({ success: false, error: 'Household name and password required' });
    }

    // Check if user already exists (single user mode)
    if (User.hasUsers()) {
      return res.status(400).json({ success: false, error: 'User already registered' });
    }

    // Create user
    const user = await User.create(householdName, password);

    // Generate token
    const token = generateToken(user.id);

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      success: true,
      data: { user, token }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Login existing user
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, error: 'Password required' });
    }

    // Get the user (single user mode)
    const user = User.getUser();

    if (!user) {
      return res.status(404).json({ success: false, error: 'No user found. Please register first.' });
    }

    // Verify password
    const valid = await User.verifyPassword(user.id, password);

    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }

    // Generate token
    const token = generateToken(user.id);

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      success: true,
      data: { user, token }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

/**
 * GET /api/auth/me
 * Get current user
 */
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ success: true, data: req.user });
});

/**
 * GET /api/auth/status
 * Check if user is registered (no auth required)
 */
app.get('/api/auth/status', (req, res) => {
  const hasUsers = User.hasUsers();
  res.json({ success: true, data: { registered: hasUsers } });
});

// ==================== USER DATA ROUTES ====================

/**
 * GET /api/user
 * Get user data (household, income, expenses, savings)
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
 * Save user data
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

/**
 * GET /api/settings
 * Get user settings
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
 * Save user settings
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

/**
 * GET /api/transactions
 * Get all transactions with optional filters
 * Query params: limit, offset, search, type, category, dateFilter, sortBy, sortOrder
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
 * Bulk import transactions
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
 * Update single transaction
 */
app.put('/api/transactions/:id', authenticateToken, (req, res) => {
  try {
    const { date, merchant, category, amount, type, description } = req.body;

    const updated = Transaction.update(req.userId, req.params.id, {
      date,
      merchant,
      category,
      amount,
      type,
      description
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
 * Bulk delete multiple transactions
 */
app.post('/api/transactions/bulk-delete', authenticateToken, (req, res) => {
  try {
    const { transactionIds } = req.body;

    if (!Array.isArray(transactionIds)) {
      return res.status(400).json({ success: false, error: 'transactionIds must be an array' });
    }

    const deletedCount = Transaction.deleteMany(req.userId, transactionIds);
    res.json({ success: true, data: { count: deletedCount } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/transactions/:id
 * Delete transaction
 */
app.delete('/api/transactions/:id', authenticateToken, (req, res) => {
  try {
    const deleted = Transaction.delete(req.userId, req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== GIFT DATA ROUTES ====================

/**
 * GET /api/gifts
 * Get gift data
 */
app.get('/api/gifts', authenticateToken, (req, res) => {
  try {
    const data = GiftData.load(req.userId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/gifts
 * Save gift data
 */
app.put('/api/gifts', authenticateToken, (req, res) => {
  try {
    const data = GiftData.save(req.userId, req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CATEGORY MAPPING ROUTES ====================

/**
 * GET /api/categories/mappings
 * Get all category mappings
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
 * Save category mappings
 */
app.put('/api/categories/mappings', authenticateToken, (req, res) => {
  try {
    const mappings = req.body;

    // Save each mapping
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
 * Get custom categories for context
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
 * Save custom categories for context
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

// ==================== DATA MANAGEMENT ROUTES ====================

/**
 * GET /api/data/export
 * Export all user data
 */
app.get('/api/data/export', authenticateToken, async (req, res) => {
  try {
    // Load all data for export
    const userData = UserData.load(req.userId);
    const settings = Settings.load(req.userId);
    const transactions = Transaction.findByUser(req.userId, 10000, 0); // Get all transactions (high limit)
    const giftData = GiftData.load(req.userId);

    // Build export object
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      userData: userData || null,
      transactions: transactions || [],
      giftData: giftData || null,
      settings: settings || null
    };

    res.json({ success: true, data: exportData });
  } catch (error) {
    console.error('[EXPORT] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/data/import
 * Import user data (replaces all existing data)
 */
app.post('/api/data/import', authenticateToken, async (req, res) => {
  try {
    const importData = req.body;

    // Validate import data structure
    if (!importData.userData && !importData.transactions && !importData.giftData) {
      return res.status(400).json({
        success: false,
        error: 'Invalid import data structure'
      });
    }

    console.log('[IMPORT] Starting import...');

    // Import user data
    if (importData.userData) {
      try {
        UserData.save(req.userId, importData.userData);
        console.log('[IMPORT] ✓ User data imported');
      } catch (error) {
        console.error('[IMPORT] Error importing user data:', error);
        throw new Error(`User data import failed: ${error.message}`);
      }
    }

    // Import settings
    if (importData.settings) {
      try {
        Settings.save(req.userId, importData.settings);
        console.log('[IMPORT] ✓ Settings imported');
      } catch (error) {
        console.error('[IMPORT] Error importing settings:', error);
        // Non-critical, continue
      }
    }

    // Import transactions (bulk)
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

    // Import gift data
    if (importData.giftData) {
      try {
        GiftData.save(req.userId, importData.giftData);
        console.log('[IMPORT] ✓ Gift data imported');
      } catch (error) {
        console.error('[IMPORT] Error importing gift data:', error);
        // Non-critical, continue
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
 * Reset all user data (destructive operation)
 */
app.post('/api/data/reset', authenticateToken, async (req, res) => {
  try {
    // Delete all user data
    UserData.delete(req.userId);
    Settings.delete(req.userId);
    Transaction.deleteAll(req.userId);
    GiftData.delete(req.userId);
    CategoryMapping.deleteAll(req.userId);

    console.log('[RESET] ✅ All data reset for user', req.userId);
    res.json({ success: true, data: { message: 'All data reset successfully' } });
  } catch (error) {
    console.error('[RESET] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ API server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});
