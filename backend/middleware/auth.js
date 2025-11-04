// Authentication middleware - JWT verification
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'tally-budget-secret-change-in-production';
const JWT_EXPIRES_IN = '30d'; // 30 days

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
  // Get token from cookie or Authorization header
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
  optionalAuth,
  JWT_SECRET
};
