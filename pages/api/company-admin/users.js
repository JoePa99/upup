// Helper function to verify company admin auth
async function requireCompanyAdminAuth(req, res) {
  try {
    console.log('🔍 Company admin auth check started');
    console.log('🔍 Request method:', req.method);
    console.log('🔍 Auth header present:', !!req.headers.authorization);
    
    // Import the auth helper that works with our authentication system
    const { getUserFromRequest } = await import('../../../utils/auth-helpers.js');
    
    const user = await getUserFromRequest(req);
    console.log('🔍 User from auth helper:', user ? { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id } : 'null');
    
    if (!user) {
      console.log('❌ No user found, returning 401');
      res.status(401).json({ success: false, message: 'Authentication required' });
      return false;
    }
    
    // Check if user is company admin or admin
    const isCompanyAdmin = user.role === 'company_admin' || user.role === 'admin';
    console.log('🔍 User role check:', { role: user.role, isCompanyAdmin });
    
    if (!isCompanyAdmin) {
      console.log('❌ User not company admin, returning 403');
      res.status(403).json({ success: false, message: 'Company admin access required' });
      return false;
    }

    console.log('✅ Authentication successful');
    req.user = user;
    return true;
  } catch (error) {
    console.error('❌ Auth error:', error);
    res.status(401).json({ success: false, message: 'Authentication failed', error: error.message });
    return false;
  }
}

async function handler(req, res) {
  console.log('🔍 Company admin users API called');
  console.log('🔍 Method:', req.method);
  console.log('🔍 Environment check:', {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasJwtSecret: !!process.env.JWT_SECRET
  });
  
  // Only allow company admins and above
  const authResult = await requireCompanyAdminAuth(req, res);
  if (!authResult) return;

  const { user } = req;
  console.log('🔍 Authenticated user:', { id: user.id, tenant_id: user.tenant_id, role: user.role });
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('🔍 Supabase client created successfully');

    switch (req.method) {
      case 'GET':
        // Get all users for the company admin's tenant
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email, first_name, last_name, role, created_at, tenant_id')
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

        // Transform users to include a name field for the frontend
        const transformedUsers = (users || []).map(u => ({
          ...u,
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim()
        }));

        return res.status(200).json({
          success: true,
          data: transformedUsers
        });

      case 'POST':
        // Create a new user in the company admin's tenant
        const { email, first_name, last_name, name, role = 'user', password } = req.body;

        // Handle both formats: separate first_name/last_name OR single name field
        let finalFirstName = first_name;
        let finalLastName = last_name || '';

        if (!first_name && name) {
          // Split the name field if first_name is not provided
          const nameParts = name.trim().split(' ');
          finalFirstName = nameParts[0] || '';
          finalLastName = nameParts.slice(1).join(' ') || '';
        }

        if (!email || !finalFirstName || !password) {
          return res.status(400).json({
            success: false,
            message: 'Email, name (or first_name), and password are required'
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
            auth_user_id: authUser.user.id,
            email,
            first_name: finalFirstName,
            last_name: finalLastName,
            password_hash: 'auth_managed', // Placeholder since password is managed by Supabase Auth
            role,
            tenant_id: user.tenant_id
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

        // Transform the user response to include name field for frontend compatibility
        const transformedUser = {
          ...newUser,
          name: `${newUser.first_name || ''} ${newUser.last_name || ''}`.trim()
        };

        return res.status(201).json({
          success: true,
          data: transformedUser,
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