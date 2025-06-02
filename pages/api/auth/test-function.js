import { supabaseAdmin } from '../../../utils/auth-helpers';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Get the auth user
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = authUsers.users.find(user => user.email === email);
    
    if (!authUser) {
      return res.status(404).json({ message: 'Auth user not found' });
    }

    // Test the function by directly querying what it should return
    const { data: directQuery, error: directError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        tenant_id,
        role,
        email,
        first_name,
        last_name,
        tenants!inner (
          id,
          name,
          subdomain,
          status,
          subscription_plan
        )
      `)
      .eq('auth_user_id', authUser.id)
      .single();

    // Test the function using the admin client (which bypasses RLS)
    const { data: functionResult, error: functionError } = await supabaseAdmin
      .rpc('get_user_tenant_info');

    // Test if we can manually create a session and try again
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email
    });

    res.status(200).json({
      authUser: {
        id: authUser.id,
        email: authUser.email
      },
      directQuery: directQuery || null,
      directError: directError?.message || null,
      functionResult: functionResult || null,
      functionError: functionError?.message || null,
      sessionData: sessionData ? { user: sessionData.user?.id } : null,
      sessionError: sessionError?.message || null
    });

  } catch (error) {
    console.error('Test function API error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Test failed'
    });
  }
}