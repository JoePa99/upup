import { supabaseAdmin } from '../../../utils/auth-helpers';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required'
      });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({
        message: 'Database not configured'
      });
    }

    // Get auth user by email
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      throw new Error('Failed to fetch auth users: ' + authError.message);
    }

    const authUser = authUsers.users.find(user => user.email === email);
    
    if (!authUser) {
      return res.status(404).json({
        message: 'No account found with that email address'
      });
    }

    // Check if user exists in users table
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id, tenant_id')
      .eq('auth_user_id', authUser.id)
      .single();

    if (dbUser) {
      return res.status(200).json({
        success: true,
        message: 'User record exists. Try logging in again.',
        hasUserRecord: true
      });
    }

    // User exists in auth but not in database - this is an orphaned auth user
    // We need to delete the auth user and allow re-registration
    console.log('Found orphaned auth user:', authUser.id, 'email:', email);

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(authUser.id);
    
    if (deleteError) {
      console.error('Failed to delete orphaned auth user:', deleteError);
      return res.status(500).json({
        message: 'Failed to clean up incomplete registration. Please contact support.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Incomplete registration cleaned up. You can now register again.',
      hasUserRecord: false
    });

  } catch (error) {
    console.error('Recovery API error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Recovery failed'
    });
  }
}