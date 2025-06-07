import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getUsers(req, res);
  } else if (req.method === 'POST') {
    return createUser(req, res);
  } else if (req.method === 'PUT') {
    return updateUser(req, res);
  } else if (req.method === 'DELETE') {
    return deleteUser(req, res);
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getUsers(req, res) {
  try {
    // Get all users with company information
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        role,
        tenant_id,
        created_at,
        tenants (
          company_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch users',
        error: error.message 
      });
    }

    // Format the data for frontend consumption
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
      company_name: user.tenants?.company_name || 'Unknown Company',
      created_at: user.created_at
    }));

    return res.status(200).json({
      success: true,
      data: formattedUsers
    });

  } catch (error) {
    console.error('Super admin users error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}

async function createUser(req, res) {
  try {
    const { email, name, companyId, role = 'user' } = req.body;

    if (!email || !name || !companyId) {
      return res.status(400).json({
        message: 'Email, name, and company are required'
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists'
      });
    }

    // Verify company exists
    const { data: company, error: companyError } = await supabase
      .from('tenants')
      .select('id, company_name')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return res.status(400).json({
        message: 'Invalid company ID'
      });
    }

    // Create new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          name,
          tenant_id: companyId,
          role,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({
        message: 'Failed to create user',
        error: error.message
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        ...newUser,
        company_name: company.company_name
      }
    });

  } catch (error) {
    console.error('Super admin create user error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}

async function updateUser(req, res) {
  try {
    const { id, email, name, companyId, role } = req.body;

    if (!id) {
      return res.status(400).json({
        message: 'User ID is required'
      });
    }

    if (!email || !name || !companyId) {
      return res.status(400).json({
        message: 'Email, name, and company are required'
      });
    }

    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', id)
      .single();

    if (userError || !existingUser) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it already exists
    if (existingUser.email !== email) {
      const { data: emailCheck } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .single();

      if (emailCheck) {
        return res.status(400).json({
          message: 'Email already exists for another user'
        });
      }
    }

    // Verify company exists
    const { data: company, error: companyError } = await supabase
      .from('tenants')
      .select('id, company_name')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return res.status(400).json({
        message: 'Invalid company ID'
      });
    }

    // Update user
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        email,
        name,
        tenant_id: companyId,
        role: role || 'user',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id,
        email,
        name,
        role,
        tenant_id,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({
        message: 'Failed to update user',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...updatedUser,
        company_name: company.company_name
      }
    });

  } catch (error) {
    console.error('Super admin update user error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        message: 'User ID is required'
      });
    }

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', id)
      .single();

    if (checkError || !existingUser) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Delete user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({
        message: 'Failed to delete user',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: `User "${existingUser.name}" deleted successfully`
    });

  } catch (error) {
    console.error('Super admin delete user error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}