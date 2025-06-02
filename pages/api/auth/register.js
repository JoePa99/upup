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

    // Verify the auth user exists before proceeding
    let authUserExists = false;
    let authUserData = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (!authUserExists && attempts < maxAttempts) {
      try {
        const { data: authUser, error } = await supabaseAdmin.auth.admin.getUserById(authUserId);
        console.log(`Auth user check attempt ${attempts + 1}:`, { 
          hasUser: !!authUser, 
          error: error?.message,
          userId: authUserId 
        });
        
        if (authUser && !error) {
          authUserExists = true;
          authUserData = authUser;
          break;
        }
      } catch (error) {
        console.log(`Auth user check attempt ${attempts + 1} failed:`, error.message);
      }
      
      // Wait 1 second before trying again
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (!authUserExists) {
      throw new Error(`Auth user not found after ${maxAttempts} attempts. User ID: ${authUserId}`);
    }

    console.log('Auth user verified:', { 
      id: authUserData.id, 
      email: authUserData.email,
      created_at: authUserData.created_at 
    });

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
    console.log('Creating user with auth_user_id:', authUserId, 'tenant_id:', tenantData.id);
    
    // Try creating user record with retries for foreign key issues
    let userData = null;
    let userError = null;
    let userAttempts = 0;
    const maxUserAttempts = 3;

    while (!userData && userAttempts < maxUserAttempts) {
      const { data, error } = await supabaseAdmin
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

      if (!error) {
        userData = data;
        break;
      } else {
        userError = error;
        console.log(`User creation attempt ${userAttempts + 1} failed:`, error);
        
        // Wait 2 seconds before retrying
        if (userAttempts < maxUserAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      userAttempts++;
    }

    if (userError) {
      console.error('User creation error details:', {
        error: userError,
        authUserId,
        tenantId: tenantData.id,
        email
      });
      
      // Try to clean up tenant if user creation failed
      await supabaseAdmin.from('tenants').delete().eq('id', tenantData.id);
      
      if (userError.message.includes('foreign key constraint')) {
        throw new Error('Auth user reference failed. The user account may not be fully created yet. Please try again in a moment.');
      } else {
        throw new Error('Failed to create user: ' + userError.message);
      }
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