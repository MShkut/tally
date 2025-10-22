const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const argon2 = require('argon2');

const app = express();
const PORT = 3001;

// Argon2id configuration (matching Vaultwarden/Start9 parameters)
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,  // 64 MB
  timeCost: 3,        // 3 iterations
  parallelism: 4      // 4 threads
};

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// File paths
const DATA_DIR = '/data';
const BUDGET_FILE = path.join(DATA_DIR, 'budget.json');
const PASSWORD_FILE = path.join(DATA_DIR, 'password.txt');

// Session store (in-memory, simple for household use)
const sessions = new Map();

// Utility functions
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function getPassword() {
  try {
    const password = await fs.readFile(PASSWORD_FILE, 'utf8');
    return password.trim();
  } catch {
    // Default password on first run - hash it
    const defaultPassword = 'changeme';
    const hashedPassword = await argon2.hash(defaultPassword, ARGON2_OPTIONS);
    await fs.writeFile(PASSWORD_FILE, hashedPassword);
    console.log('[AUTH] Default password created and hashed');
    return hashedPassword;
  }
}

async function setPassword(newPassword) {
  const hashedPassword = await argon2.hash(newPassword.trim(), ARGON2_OPTIONS);
  await fs.writeFile(PASSWORD_FILE, hashedPassword);
  console.log('[AUTH] Password updated and hashed with Argon2id');
}

async function verifyPassword(plainPassword, storedHash) {
  // Check if stored hash is actually a plain text password (migration case)
  if (!storedHash.startsWith('$argon2')) {
    console.warn('[AUTH] WARNING: Plain text password detected! Migrating to Argon2id hash...');
    // This is a plain text password - compare directly for this login
    if (plainPassword === storedHash) {
      // Migrate to hashed password
      await setPassword(plainPassword);
      console.log('[AUTH] Password successfully migrated to Argon2id hash');
      return true;
    }
    return false;
  }

  // Verify Argon2id hash
  try {
    return await argon2.verify(storedHash, plainPassword);
  } catch (err) {
    console.error('[AUTH] Error verifying password hash:', err);
    return false;
  }
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function validateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  const session = sessions.get(token);
  
  if (!session || Date.now() > session.expires) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  // Extend session
  session.expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  req.token = token;
  next();
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[HEALTH] Health check requested');
  }
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.trim() === '') {
      return res.status(400).json({ error: 'Password is required' });
    }

    const storedPassword = await getPassword();
    const isValid = await verifyPassword(password, storedPassword);

    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = generateToken();
    const expires = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days (increased from 24 hours)

    sessions.set(token, { expires });

    console.log('[AUTH] Successful login, token expires in 30 days');
    res.json({ token, expires });
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
app.post('/api/auth/change-password', validateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const storedPassword = await getPassword();
    const isValid = await verifyPassword(currentPassword, storedPassword);

    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    await setPassword(newPassword);

    // Invalidate all existing sessions
    sessions.clear();

    console.log('[AUTH] Password changed successfully, all sessions invalidated');
    res.json({ success: true });
  } catch (error) {
    console.error('[AUTH] Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
app.post('/api/auth/logout', validateToken, (req, res) => {
  sessions.delete(req.token);
  res.json({ success: true });
});

// Load budget data
app.get('/api/budget', validateToken, async (req, res) => {
  try {
    console.log('[DATA] Loading budget data from:', BUDGET_FILE);
    let budgetData = {};

    try {
      const data = await fs.readFile(BUDGET_FILE, 'utf8');
      budgetData = JSON.parse(data);
      console.log('[DATA] ✓ Budget data loaded successfully');
    } catch (error) {
      // File doesn't exist or is invalid, return empty data
      console.log('[DATA] No existing budget.json, returning empty data structure');
      budgetData = {
        userData: {},
        transactions: [],
        netWorthItems: [],
        giftData: { people: [], gifts: [] },
        version: '1.0.0',
        lastModified: new Date().toISOString()
      };
    }

    res.json(budgetData);
  } catch (error) {
    console.error('[DATA] Load budget error:', error);
    res.status(500).json({ error: 'Failed to load budget data' });
  }
});

// Save budget data
app.put('/api/budget', validateToken, async (req, res) => {
  try {
    console.log('[DATA] Saving budget data to:', BUDGET_FILE);
    const budgetData = req.body;

    // Add metadata
    budgetData.lastModified = new Date().toISOString();
    budgetData.version = budgetData.version || '1.0.0';

    await fs.writeFile(BUDGET_FILE, JSON.stringify(budgetData, null, 2));
    console.log('[DATA] ✓ Budget data saved successfully at', budgetData.lastModified);

    res.json({ success: true, lastModified: budgetData.lastModified });
  } catch (error) {
    console.error('[DATA] Save budget error:', error);
    res.status(500).json({ error: 'Failed to save budget data' });
  }
});

// Initialize and start server
async function start() {
  try {
    console.log('[STARTUP] Initializing Tally API server...');
    console.log(`[STARTUP] Node version: ${process.version}`);
    console.log(`[STARTUP] Data directory: ${DATA_DIR}`);

    await ensureDataDir();
    console.log('[STARTUP] Data directory verified');

    // Check if data directory is writable
    const testFile = path.join(DATA_DIR, '.write-test');
    try {
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      console.log('[STARTUP] Data directory is writable ✓');
    } catch (error) {
      console.error('[STARTUP] ERROR: Data directory is not writable!', error);
      throw error;
    }

    // Check for existing data files
    try {
      await fs.access(BUDGET_FILE);
      console.log('[STARTUP] Found existing budget.json');
    } catch {
      console.log('[STARTUP] No existing budget.json (will be created on first save)');
    }

    try {
      await fs.access(PASSWORD_FILE);
      console.log('[STARTUP] Found existing password file');
    } catch {
      console.log('[STARTUP] No existing password file (will create default)');
    }

    app.listen(PORT, () => {
      console.log(`[STARTUP] ✓ Tally API server ready on port ${PORT}`);
      console.log(`[STARTUP] Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('[STARTUP] Failed to start server:', error);
    process.exit(1);
  }
}

start();