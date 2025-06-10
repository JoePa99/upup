// Helper function to verify company admin auth
async function requireCompanyAdminAuth(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'No authorization token provided' });
      return false;
    }

    const token = authHeader.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const isCompanyAdmin = decoded.role === 'company_admin' || decoded.role === 'admin';
    if (!isCompanyAdmin) {
      res.status(403).json({ success: false, message: 'Company admin access required' });
      return false;
    }

    req.user = decoded;
    return true;
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return false;
  }
}

async function handler(req, res) {
  // Only allow company admins and above
  const authResult = await requireCompanyAdminAuth(req, res);
  if (!authResult) return;

  const { user } = req;
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    switch (req.method) {
      case 'GET':
        // Get company settings/information
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('id, name, domain, industry, size, values, settings, created_at')
          .eq('id', user.tenant_id)
          .single();

        if (tenantError) {
          console.error('Error fetching tenant settings:', tenantError);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch company settings',
            error: tenantError.message 
          });
        }

        // Get user count for this tenant
        const { data: userCount, error: userCountError } = await supabase
          .from('users')
          .select('id', { count: 'exact' })
          .eq('tenant_id', user.tenant_id);

        const companyData = {
          company_name: tenant?.name || 'Unknown Company',
          domain: tenant?.domain || '',
          industry: tenant?.industry || '',
          company_size: tenant?.size || '',
          values: tenant?.values || '',
          total_users: userCount?.length || 0,
          created_at: tenant?.created_at || null,
          settings: tenant?.settings || {},
          // Add current user info
          current_user: {
            name: user.name,
            email: user.email,
            role: user.role
          }
        };

        return res.status(200).json({
          success: true,
          data: companyData
        });

      case 'PUT':
        // Update company settings (limited fields that company admin can change)
        const { values, settings } = req.body;

        const updateData = {};
        if (values !== undefined) updateData.values = values;
        if (settings !== undefined) updateData.settings = settings;

        // Only allow updating certain fields
        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No valid fields provided for update'
          });
        }

        const { data: updatedTenant, error: updateError } = await supabase
          .from('tenants')
          .update(updateData)
          .eq('id', user.tenant_id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating tenant settings:', updateError);
          return res.status(500).json({
            success: false,
            message: 'Failed to update company settings',
            error: updateError.message
          });
        }

        return res.status(200).json({
          success: true,
          data: updatedTenant,
          message: 'Company settings updated successfully'
        });

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Company admin settings API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

export default handler;