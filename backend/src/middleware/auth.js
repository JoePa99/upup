const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * Middleware to authenticate tenant users
 */
const auth = async (req, res, next) => {
  try {
    // Check for Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized - No token provided'
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is for the correct tenant
    if (req.tenant && decoded.tenantId !== req.tenant.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden - Token is for a different tenant'
      });
    }
    
    // Attach user info to request
    req.user = decoded;
    
    // Set tenant context for RLS policies
    if (req.tenant) {
      try {
        await db.pool.query(`SELECT set_tenant_context($1, $2)`, [req.tenant.id, false]);
      } catch (contextError) {
        console.error('Error setting tenant context in auth middleware:', contextError);
        // Continue anyway, as this might be a DB without the function
      }
    }
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized - Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized - Token expired'
      });
    }
    
    console.error('Error in auth middleware:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware to check if user has admin role
 */
const requireAdmin = (req, res, next) => {
  // Auth middleware should be called first
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized - Authentication required'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Forbidden - Admin access required'
    });
  }
  
  next();
};

/**
 * Middleware to check if user has company admin role
 */
const requireCompanyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized - Authentication required'
    });
  }
  
  if (req.user.role !== 'company_admin' && req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Forbidden - Company admin access required'
    });
  }
  
  next();
};

/**
 * Middleware to check if user has any admin privileges (admin or company_admin)
 */
const requireAnyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized - Authentication required'
    });
  }
  
  const adminRoles = ['admin', 'company_admin'];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Forbidden - Admin privileges required'
    });
  }
  
  next();
};

/**
 * Check if user has permission for specific role
 */
const hasRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized - Authentication required'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Forbidden - Requires one of: ${allowedRoles.join(', ')}`
      });
    }
    
    next();
  };
};

module.exports = {
  auth,
  requireAdmin,
  requireCompanyAdmin,
  requireAnyAdmin,
  hasRole
};