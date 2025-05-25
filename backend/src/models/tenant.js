const db = require('../config/database');

/**
 * Create a new tenant
 */
const createTenant = async (tenantData) => {
  try {
    // Insert tenant using Supabase
    const { data, error } = await db.supabaseInsert('tenants', {
      name: tenantData.name,
      subdomain: tenantData.subdomain,
      admin_email: tenantData.adminEmail,
      stripe_customer_id: tenantData.stripeCustomerId,
      subscription_plan: tenantData.subscriptionPlan || 'free',
      subscription_status: 'active',
      status: tenantData.status || 'active'
    }, { returning: true });
    
    if (error) {
      console.error('Error creating tenant:', error);
      throw error;
    }
    
    return data[0];
  } catch (error) {
    console.error('Error creating tenant:', error);
    throw error;
  }
};

/**
 * Get tenant by subdomain
 */
const getTenantBySubdomain = async (subdomain) => {
  try {
    // Query tenant using Supabase
    const { data, error } = await db.supabaseQuery('tenants', {
      select: '*',
      eq: { subdomain },
      limit: 1
    });
    
    if (error) {
      console.error('Error getting tenant by subdomain:', error);
      throw error;
    }
    
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error getting tenant by subdomain:', error);
    throw error;
  }
};

/**
 * Get tenant by ID
 */
const getTenantById = async (id) => {
  try {
    // Query tenant using Supabase
    const { data, error } = await db.supabaseQuery('tenants', {
      select: '*',
      eq: { id },
      limit: 1
    });
    
    if (error) {
      console.error('Error getting tenant by ID:', error);
      throw error;
    }
    
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error getting tenant by ID:', error);
    throw error;
  }
};

/**
 * Get all tenants
 */
const getAllTenants = async () => {
  try {
    // Query all tenants using Supabase
    const { data, error } = await db.supabaseQuery('tenants', {
      select: '*',
      order: { column: 'created_at', ascending: false }
    });
    
    if (error) {
      console.error('Error getting all tenants:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting all tenants:', error);
    throw error;
  }
};

/**
 * Update tenant
 */
const updateTenant = async (id, updateData) => {
  try {
    // Only allow updating certain fields
    const allowedFields = [
      'name', 
      'status', 
      'subscription_plan', 
      'subscription_status',
      'stripe_customer_id'
    ];
    
    // Filter out fields that aren't allowed to be updated
    const data = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        data[key] = updateData[key];
      }
    });
    
    if (Object.keys(data).length === 0) {
      return null;
    }
    
    // Add updated_at timestamp
    data.updated_at = new Date();
    
    // Update tenant using Supabase
    const { data: updatedTenant, error } = await db.supabaseUpdate(
      'tenants',
      data,
      { id },
      { returning: true }
    );
    
    if (error) {
      console.error('Error updating tenant:', error);
      throw error;
    }
    
    return updatedTenant.length > 0 ? updatedTenant[0] : null;
  } catch (error) {
    console.error('Error updating tenant:', error);
    throw error;
  }
};

module.exports = {
  createTenant,
  getTenantBySubdomain,
  getTenantById,
  getAllTenants,
  updateTenant
};