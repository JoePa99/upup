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

    // Get auth user by email
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      throw new Error('Failed to fetch auth users: ' + authError.message);
    }

    const authUser = authUsers.users.find(user => user.email === email);
    
    if (!authUser) {
      return res.status(404).json({ message: 'Auth user not found' });
    }

    // Check user in database
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .single();

    // Check user by email
    const { data: dbUserByEmail, error: emailError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    // Test the function
    const { data: functionResult, error: functionError } = await supabaseAdmin
      .rpc('get_user_tenant_info');

    res.status(200).json({
      authUser: {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at
      },
      dbUserByAuthId: dbUser || null,
      dbUserByEmail: dbUserByEmail || null,
      dbError: dbError?.message || null,
      emailError: emailError?.message || null,
      functionResult: functionResult || null,
      functionError: functionError?.message || null
    });

  } catch (error) {
    console.error('Debug API error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Debug failed'
    });
  }
}