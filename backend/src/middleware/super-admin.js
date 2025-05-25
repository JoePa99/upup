const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * Middleware to check if the user is a super admin
 */
const isSuperAdmin = async (req, res, next) => {
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
    
    // Check if user is a super admin
    if (!decoded.isSuperAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden - Super admin access required'
      });
    }
    
    // Attach user info to request
    req.user = decoded;
    
    // Set super admin context for RLS policies
    try {
      await db.pool.query(`SELECT set_tenant_context($1, $2)`, [null, true]);
    } catch (contextError) {
      console.error('Error setting super admin context:', contextError);
      // Continue anyway, as this might be a DB without the function
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
    
    console.error('Error in super admin middleware:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

module.exports = isSuperAdmin;