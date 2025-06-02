import { supabaseAdmin } from '../../../utils/auth-helpers';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { authUserId, email, firstName, lastName, tenantName, subdomain } = req.body;

    if (!authUserId || !email || !firstName || !lastName || !tenantName) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({
        message: 'Database not configured'
      });
    }

    // Create tenant record using service key (bypasses RLS)
    const { data: tenantData, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: tenantName,
        subdomain: subdomain || `${firstName.toLowerCase()}-${Date.now()}`,
        admin_email: email
      })
      .select()
      .single();

    if (tenantError) {
      console.error('Tenant creation error:', tenantError);
      throw new Error('Failed to create tenant: ' + tenantError.message);
    }

    // Create user record using service key (bypasses RLS)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_user_id: authUserId,
        tenant_id: tenantData.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        role: 'admin' // First user in tenant is admin
      })
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      // Try to clean up tenant if user creation failed
      await supabaseAdmin.from('tenants').delete().eq('id', tenantData.id);
      throw new Error('Failed to create user: ' + userError.message);
    }

    res.status(200).json({
      success: true,
      data: {
        user: userData,
        tenant: tenantData
      },
      message: 'Registration completed successfully'
    });

  } catch (error) {
    console.error('Registration API error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
}