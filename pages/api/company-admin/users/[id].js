// Helper function to verify company admin auth
async function requireCompanyAdminAuth(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'No authorization token provided' });
      return false;
    }

    const token = authHeader.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const isCompanyAdmin = decoded.role === 'company_admin' || decoded.role === 'admin';
    if (!isCompanyAdmin) {
      res.status(403).json({ success: false, message: 'Company admin access required' });
      return false;
    }

    req.user = decoded;
    return true;
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return false;
  }
}

async function handler(req, res) {
  // Only allow company admins and above
  const authResult = await requireCompanyAdminAuth(req, res);
  if (!authResult) return;

  const { user } = req;
  const { id: userId } = req.query;
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    switch (req.method) {
      case 'PUT':
        // Update user (only users in the same tenant)
        const { name, role, status } = req.body;

        // Validate role - company admins can only manage users and company_admins
        if (role && !['user', 'company_admin'].includes(role)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid role. Company admins can only manage users or company_admins'
          });
        }

        // First verify the user exists and belongs to the same tenant
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('id, tenant_id')
          .eq('id', userId)
          .eq('tenant_id', user.tenant_id)
          .single();

        if (fetchError || !existingUser) {
          return res.status(404).json({
            success: false,
            message: 'User not found or access denied'
          });
        }

        // Update user record
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (role !== undefined) updateData.role = role;
        if (status !== undefined) updateData.status = status;

        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId)
          .eq('tenant_id', user.tenant_id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating user:', updateError);
          return res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: updateError.message
          });
        }

        return res.status(200).json({
          success: true,
          data: updatedUser,
          message: 'User updated successfully'
        });

      case 'DELETE':
        // Delete user (only users in the same tenant)
        
        // First verify the user exists and belongs to the same tenant
        const { data: userToDelete, error: fetchDeleteError } = await supabase
          .from('users')
          .select('id, tenant_id')
          .eq('id', userId)
          .eq('tenant_id', user.tenant_id)
          .single();

        if (fetchDeleteError || !userToDelete) {
          return res.status(404).json({
            success: false,
            message: 'User not found or access denied'
          });
        }

        // Prevent company admin from deleting themselves
        if (userId === user.id) {
          return res.status(400).json({
            success: false,
            message: 'You cannot delete your own account'
          });
        }

        // Delete user from our users table
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', userId)
          .eq('tenant_id', user.tenant_id);

        if (deleteError) {
          console.error('Error deleting user:', deleteError);
          return res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: deleteError.message
          });
        }

        // Also delete from Supabase Auth
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
        if (authDeleteError) {
          console.error('Error deleting auth user:', authDeleteError);
          // Don't fail the request if auth deletion fails - user record is already deleted
        }

        return res.status(200).json({
          success: true,
          message: 'User deleted successfully'
        });

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Company admin user management API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

export default handler;