const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const userModel = require('../models/user');
const db = require('../config/database');

/**
 * Register a new user for a tenant
 */
const register = async (req, res) => {
  try {
    const { tenant } = req;
    const { email, password, firstName, lastName, role } = req.body;
    
    // Check if user already exists
    const existingUser = await userModel.getUserByEmail(tenant.id, email);
    
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }
    
    // Create new user
    const userData = {
      email,
      password,
      firstName,
      lastName,
      role: role || 'user' // Default role
    };
    
    const newUser = await userModel.createUser(tenant.id, userData);
    
    res.status(201).json({
      status: 'success',
      data: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to register user',
      error: error.message
    });
  }
};

/**
 * Login user for a tenant
 */
const login = async (req, res) => {
  try {
    const { tenant } = req;
    const { email, password } = req.body;
    
    // Find user
    const user = await userModel.getUserByEmail(tenant.id, email);
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
    
    // Verify password
    const isPasswordValid = await userModel.verifyPassword(user, password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: tenant.id,
        tenantName: tenant.name
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to login',
      error: error.message
    });
  }
};

/**
 * Login for super admin
 */
const superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Get super admin using Supabase
    const { data, error } = await db.supabaseQuery('super_admins', {
      select: '*',
      eq: { email }
    });
    
    if (error) {
      console.error('Error querying super admin:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
    
    const admin = data.length > 0 ? data[0] : null;
    
    if (!admin) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
    
    // Generate JWT token with super admin flag
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        isSuperAdmin: true
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        token,
        user: {
          id: admin.id,
          email: admin.email,
          firstName: admin.first_name,
          lastName: admin.last_name,
          isSuperAdmin: true
        }
      }
    });
  } catch (error) {
    console.error('Error in super admin login:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to login',
      error: error.message
    });
  }
};

/**
 * Create a super admin (for initial setup)
 */
const createSuperAdmin = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Check if super admin already exists
    const { data: existingAdmins, error: queryError } = await db.supabaseQuery('super_admins', {
      select: 'id',
      limit: 1
    });
    
    if (queryError) {
      console.error('Error checking existing super admins:', queryError);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
    
    // Only allow creation if no super admin exists yet
    if (existingAdmins && existingAdmins.length > 0) {
      return res.status(403).json({
        status: 'error',
        message: 'Super admin already exists'
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create super admin
    const { data, error } = await db.supabaseInsert('super_admins', {
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      status: 'active'
    }, { returning: true });
    
    if (error) {
      console.error('Error creating super admin:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to create super admin'
      });
    }
    
    const newAdmin = data[0];
    
    res.status(201).json({
      status: 'success',
      data: {
        id: newAdmin.id,
        email: newAdmin.email,
        firstName: newAdmin.first_name,
        lastName: newAdmin.last_name
      }
    });
  } catch (error) {
    console.error('Error creating super admin:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create super admin',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  superAdminLogin,
  createSuperAdmin
};