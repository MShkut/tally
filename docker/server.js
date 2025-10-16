const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3001;

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
    // Default password on first run
    const defaultPassword = 'changeme';
    await fs.writeFile(PASSWORD_FILE, defaultPassword);
    return defaultPassword;
  }
}

async function setPassword(newPassword) {
  await fs.writeFile(PASSWORD_FILE, newPassword.trim());
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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { password } = req.body;
    const correctPassword = await getPassword();
    
    if (password !== correctPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    const token = generateToken();
    const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    sessions.set(token, { expires });
    
    res.json({ token, expires });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
app.post('/api/auth/change-password', validateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const correctPassword = await getPassword();
    
    if (currentPassword !== correctPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters' });
    }
    
    await setPassword(newPassword);
    
    // Invalidate all existing sessions
    sessions.clear();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
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
    let budgetData = {};
    
    try {
      const data = await fs.readFile(BUDGET_FILE, 'utf8');
      budgetData = JSON.parse(data);
    } catch {
      // File doesn't exist or is invalid, return empty data
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
    console.error('Load budget error:', error);
    res.status(500).json({ error: 'Failed to load budget data' });
  }
});

// Save budget data
app.put('/api/budget', validateToken, async (req, res) => {
  try {
    const budgetData = req.body;
    
    // Add metadata
    budgetData.lastModified = new Date().toISOString();
    budgetData.version = budgetData.version || '1.0.0';
    
    await fs.writeFile(BUDGET_FILE, JSON.stringify(budgetData, null, 2));
    
    res.json({ success: true, lastModified: budgetData.lastModified });
  } catch (error) {
    console.error('Save budget error:', error);
    res.status(500).json({ error: 'Failed to save budget data' });
  }
});

// Initialize and start server
async function start() {
  try {
    await ensureDataDir();
    
    app.listen(PORT, () => {
      console.log(`Tally API server running on port ${PORT}`);
      console.log(`Data directory: ${DATA_DIR}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();