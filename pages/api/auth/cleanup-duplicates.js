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

    // Get all user records with this email
    const { data: allUsers, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw new Error('Failed to fetch user records: ' + fetchError.message);
    }

    if (!allUsers || allUsers.length <= 1) {
      return res.status(200).json({
        message: 'No duplicates found',
        userCount: allUsers?.length || 0
      });
    }

    // Find the user with auth_user_id (the correct one)
    const correctUser = allUsers.find(user => user.auth_user_id);
    const duplicateUsers = allUsers.filter(user => !user.auth_user_id || user.id !== correctUser?.id);

    if (!correctUser) {
      return res.status(400).json({
        message: 'No user found with auth_user_id link. Cannot determine which record to keep.',
        users: allUsers
      });
    }

    // Delete duplicate users
    const deletePromises = duplicateUsers.map(user => 
      supabaseAdmin
        .from('users')
        .delete()
        .eq('id', user.id)
    );

    const deleteResults = await Promise.all(deletePromises);
    
    // Check for errors
    const deleteErrors = deleteResults.filter(result => result.error);
    if (deleteErrors.length > 0) {
      throw new Error('Failed to delete some duplicates: ' + deleteErrors.map(e => e.error.message).join(', '));
    }

    res.status(200).json({
      success: true,
      message: `Cleaned up ${duplicateUsers.length} duplicate user records`,
      keptUser: correctUser,
      deletedUsers: duplicateUsers.map(u => ({ id: u.id, created_at: u.created_at, auth_user_id: u.auth_user_id }))
    });

  } catch (error) {
    console.error('Cleanup API error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Cleanup failed'
    });
  }
}