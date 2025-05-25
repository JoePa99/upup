const db = require('../config/database');

/**
 * Middleware to extract tenant information from subdomain
 * and attach it to the request object
 */
const tenantContext = async (req, res, next) => {
  try {
    // Get host from request
    const host = req.headers.host;
    
    if (!host) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid request, missing host header' 
      });
    }
    
    // Extract subdomain from host
    // Expected format: {subdomain}.yourplatform.com
    const hostParts = host.split('.');
    
    // Check if we have a subdomain
    if (hostParts.length < 3) {
      // This is likely the admin domain (yourplatform.com)
      req.isAdminDomain = true;
      return next();
    }
    
    const subdomain = hostParts[0];
    
    // Look up tenant by subdomain using Supabase
    const { data: tenants, error } = await db.supabaseQuery('tenants', {
      eq: { subdomain },
      limit: 1
    });
    
    if (error) {
      console.error('Error querying tenant:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Error processing tenant information' 
      });
    }
    
    if (!tenants || tenants.length === 0) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Tenant not found' 
      });
    }
    
    const tenant = tenants[0];
    
    // Check if tenant is active
    if (tenant.status !== 'active') {
      return res.status(403).json({ 
        status: 'error', 
        message: `Tenant is ${tenant.status}` 
      });
    }
    
    // Attach tenant info to request
    req.tenant = tenant;
    
    // Set tenant context for RLS policies
    try {
      await db.pool.query(`SELECT set_tenant_context($1, $2)`, [tenant.id, false]);
    } catch (contextError) {
      console.error('Error setting tenant context:', contextError);
      // Continue anyway, as this might be a DB without the function
    }
    
    next();
  } catch (error) {
    console.error('Error in tenant context middleware:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error processing tenant information' 
    });
  }
};

module.exports = tenantContext;