// Helper function to verify company admin auth
async function requireCompanyAdminAuth(req, res) {
  try {
    // Import the auth helper that works with our authentication system
    const { getUserFromRequest } = await import('../../../utils/auth-helpers.js');
    
    const user = await getUserFromRequest(req);
    
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return false;
    }
    
    // Check if user is company admin or admin
    const isCompanyAdmin = user.role === 'company_admin' || user.role === 'admin';
    if (!isCompanyAdmin) {
      res.status(403).json({ success: false, message: 'Company admin access required' });
      return false;
    }

    req.user = user;
    return true;
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ success: false, message: 'Authentication failed' });
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
        // Get all users for the company admin's tenant
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email, name, role, status, created_at, tenant_id')
          .eq('tenant_id', user.tenant_id)
          .order('created_at', { ascending: false });

        if (usersError) {
          console.error('Error fetching company users:', usersError);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch users',
            error: usersError.message 
          });
        }

        return res.status(200).json({
          success: true,
          data: users || []
        });

      case 'POST':
        // Create a new user in the company admin's tenant
        const { email, name, role = 'user', password } = req.body;

        if (!email || !name || !password) {
          return res.status(400).json({
            success: false,
            message: 'Email, name, and password are required'
          });
        }

        // Validate role - company admins can only create users and company_admins
        if (!['user', 'company_admin'].includes(role)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid role. Company admins can only create users or company_admins'
          });
        }

        // Create user in Supabase Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true
        });

        if (authError) {
          console.error('Error creating auth user:', authError);
          return res.status(400).json({
            success: false,
            message: 'Failed to create user account',
            error: authError.message
          });
        }

        // Create user record in our users table
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            id: authUser.user.id,
            email,
            name,
            role,
            tenant_id: user.tenant_id,
            status: 'active'
          })
          .select()
          .single();

        if (userError) {
          console.error('Error creating user record:', userError);
          // Clean up auth user if user record creation failed
          await supabase.auth.admin.deleteUser(authUser.user.id);
          return res.status(500).json({
            success: false,
            message: 'Failed to create user record',
            error: userError.message
          });
        }

        return res.status(201).json({
          success: true,
          data: newUser,
          message: 'User created successfully'
        });

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Company admin users API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

export default handler;