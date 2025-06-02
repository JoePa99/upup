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

    // Update user record with auth_user_id
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ auth_user_id: authUser.id })
      .eq('email', email)
      .select()
      .single();

    if (updateError) {
      throw new Error('Failed to update user: ' + updateError.message);
    }

    res.status(200).json({
      success: true,
      message: 'User record updated successfully',
      user: updatedUser,
      authUserId: authUser.id
    });

  } catch (error) {
    console.error('Fix user API error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Fix failed'
    });
  }
}