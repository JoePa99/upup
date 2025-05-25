const tenantModel = require('../models/tenant');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create a new tenant
 */
const createTenant = async (req, res) => {
  try {
    const { name, subdomain, adminEmail, subscriptionPlan } = req.body;
    
    // Validate required fields
    if (!name || !subdomain || !adminEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: name, subdomain, and adminEmail are required'
      });
    }
    
    // Create Stripe customer
    let customer;
    try {
      customer = await stripe.customers.create({
        email: adminEmail,
        name: name,
        metadata: {
          subdomain: subdomain
        }
      });
    } catch (stripeError) {
      console.error('Error creating Stripe customer:', stripeError);
      // Continue with a null stripe customer ID
      customer = { id: null };
    }
    
    // Create tenant with Stripe customer ID
    const tenantData = {
      name,
      subdomain,
      adminEmail,
      stripeCustomerId: customer.id,
      subscriptionPlan: subscriptionPlan || 'free',
      status: 'active'
    };
    
    const tenant = await tenantModel.createTenant(tenantData);
    
    res.status(201).json({
      status: 'success',
      data: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        adminEmail: tenant.admin_email,
        stripeCustomerId: tenant.stripe_customer_id,
        subscriptionPlan: tenant.subscription_plan
      }
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create tenant',
      error: error.message
    });
  }
};

/**
 * Get all tenants (super admin only)
 */
const getAllTenants = async (req, res) => {
  try {
    const tenants = await tenantModel.getAllTenants();
    
    res.status(200).json({
      status: 'success',
      data: tenants
    });
  } catch (error) {
    console.error('Error getting all tenants:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get tenants',
      error: error.message
    });
  }
};

/**
 * Get tenant by ID (super admin only)
 */
const getTenant = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tenant = await tenantModel.getTenantById(id);
    
    if (!tenant) {
      return res.status(404).json({
        status: 'error',
        message: 'Tenant not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: tenant
    });
  } catch (error) {
    console.error('Error getting tenant:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get tenant',
      error: error.message
    });
  }
};

/**
 * Update tenant (super admin only)
 */
const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedTenant = await tenantModel.updateTenant(id, updateData);
    
    if (!updatedTenant) {
      return res.status(404).json({
        status: 'error',
        message: 'Tenant not found or no valid fields to update'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: updatedTenant
    });
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update tenant',
      error: error.message
    });
  }
};

/**
 * Get tenant information (for tenant admin)
 */
const getTenantInfo = async (req, res) => {
  // Tenant info is attached to req by middleware
  const { tenant } = req;
  
  // Don't expose sensitive fields
  const { 
    id, 
    name, 
    subdomain, 
    subscription_plan, 
    subscription_status,
    created_at 
  } = tenant;
  
  res.status(200).json({
    status: 'success',
    data: {
      id,
      name,
      subdomain,
      subscription_plan,
      subscription_status,
      created_at
    }
  });
};

module.exports = {
  createTenant,
  getAllTenants,
  getTenant,
  updateTenant,
  getTenantInfo
};