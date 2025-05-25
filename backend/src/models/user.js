const db = require('../config/database');
const bcrypt = require('bcrypt');

/**
 * Create a new user for a tenant
 */
const createUser = async (tenantId, userData) => {
  // Hash the password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(userData.password, saltRounds);
  
  try {
    // Insert user using Supabase
    const { data, error } = await db.supabaseInsert('users', {
      tenant_id: tenantId,
      email: userData.email,
      password_hash: passwordHash,
      first_name: userData.firstName,
      last_name: userData.lastName,
      role: userData.role || 'user'
    }, { returning: true });
    
    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }
    
    return data[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Get user by email for a tenant
 */
const getUserByEmail = async (tenantId, email) => {
  try {
    // Query user using Supabase
    const { data, error } = await db.supabaseQuery('users', {
      select: '*',
      eq: { 
        tenant_id: tenantId,
        email: email 
      }
    });
    
    if (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
    
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

/**
 * Get user by ID for a tenant
 */
const getUserById = async (tenantId, id) => {
  try {
    // Query user using Supabase
    const { data, error } = await db.supabaseQuery('users', {
      select: 'id, email, first_name, last_name, role, created_at, updated_at',
      eq: { 
        tenant_id: tenantId,
        id: id 
      }
    });
    
    if (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
    
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

/**
 * Update user for a tenant
 */
const updateUser = async (tenantId, id, updateData) => {
  try {
    // Convert camelCase to snake_case
    const data = {};
    
    if (updateData.firstName) {
      data.first_name = updateData.firstName;
    }
    
    if (updateData.lastName) {
      data.last_name = updateData.lastName;
    }
    
    if (updateData.role) {
      data.role = updateData.role;
    }
    
    // Handle password update separately to hash it
    if (updateData.password) {
      const saltRounds = 10;
      data.password_hash = await bcrypt.hash(updateData.password, saltRounds);
    }
    
    // Update user using Supabase
    const { data: updatedUser, error } = await db.supabaseUpdate('users', 
      data,
      { 
        tenant_id: tenantId,
        id: id 
      },
      { returning: true }
    );
    
    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }
    
    return updatedUser.length > 0 ? updatedUser[0] : null;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Verify password for a user
 */
const verifyPassword = async (user, password) => {
  return bcrypt.compare(password, user.password_hash);
};

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  verifyPassword
};