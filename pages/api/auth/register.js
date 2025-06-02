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

    // Generate unique subdomain
    let finalSubdomain = subdomain;
    if (!finalSubdomain) {
      // Generate from tenant name if not provided
      finalSubdomain = tenantName.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 30); // Limit length
    }

    // Ensure subdomain is unique by checking and adding suffix if needed
    let uniqueSubdomain = finalSubdomain;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const { data: existingTenant } = await supabaseAdmin
        .from('tenants')
        .select('id')
        .eq('subdomain', uniqueSubdomain)
        .single();

      if (!existingTenant) {
        // Subdomain is available
        break;
      }

      // Add random suffix to make it unique
      const randomSuffix = Math.floor(Math.random() * 1000);
      uniqueSubdomain = `${finalSubdomain}-${randomSuffix}`;
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate unique subdomain. Please try a different company name.');
    }

    // Create tenant record using service key (bypasses RLS)
    const { data: tenantData, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: tenantName,
        subdomain: uniqueSubdomain,
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
        password_hash: 'auth_managed', // Placeholder since password is managed by Supabase Auth
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
      message: uniqueSubdomain !== finalSubdomain 
        ? `Registration completed! Your subdomain is: ${uniqueSubdomain}` 
        : 'Registration completed successfully'
    });

  } catch (error) {
    console.error('Registration API error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
}