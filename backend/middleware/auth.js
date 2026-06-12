// Authentication middleware - JWT verification
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const User = require('../models/User');

const JWT_EXPIRES_IN = '30d'; // 30 days

const SECRET_PATH = process.env.JWT_SECRET_PATH || '/data/.jwt_secret';

function getOrCreateSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  try {
    return fs.readFileSync(SECRET_PATH, 'utf8').trim();
  } catch {
    const secret = crypto.randomBytes(64).toString('hex');
    fs.writeFileSync(SECRET_PATH, secret, { mode: 0o600 });
    console.log('[AUTH] Generated new JWT secret');
    return secret;
  }
}

const JWT_SECRET = getOrCreateSecret();

/**
 * Generate JWT token for user
 */
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token and attach user to request
 */
function authenticateToken(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired', expired: true });
    }
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

/**
 * Optional authentication - attach user if token exists, but don't require it
 */
function optionalAuth(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = User.findById(decoded.userId);

    if (user) {
      req.user = user;
      req.userId = user.id;
    }
  } catch (error) {
    // Ignore invalid tokens for optional auth
  }

  next();
}

module.exports = {
  generateToken,
  authenticateToken,
  optionalAuth
};