import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  console.log('Super admin users endpoint accessed:', req.method);
  
  try {
    if (req.method === 'GET') {
      return getUsers(req, res);
    } else if (req.method === 'POST') {
      return createUser(req, res);
    } else if (req.method === 'PUT') {
      return updateUser(req, res);
    } else if (req.method === 'DELETE') {
      return deleteUser(req, res);
    } else {
      console.log('Method not allowed:', req.method);
      return res.status(405).json({ message: 'Method not allowed', method: req.method });
    }
  } catch (error) {
    console.error('Super admin users handler error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
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
        first_name,
        last_name,
        role,
        tenant_id,
        created_at,
        tenants (
          name
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
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
      company_name: user.tenants?.name || 'Unknown Company',
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
    console.log('Creating user with data:', req.body);
    
    const { email, name, companyId, role = 'user' } = req.body;

    if (!email || !name || !companyId) {
      console.log('Missing required fields:', { email: !!email, name: !!name, companyId: !!companyId });
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
    const { id, email, name, companyId, role, password } = req.body;

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

    if (password && password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long'
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
      .select('id, name')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return res.status(400).json({
        message: 'Invalid company ID'
      });
    }

    // Split name into first and last name for database
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Prepare update data
    const updateData = {
      email,
      first_name: firstName,
      last_name: lastName,
      tenant_id: companyId,
      role: role || 'user',
      updated_at: new Date().toISOString()
    };

    // Add password hash if password is provided
    if (password) {
      console.log('Hashing new password...');
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updateData.password_hash = hashedPassword;
    }

    // Update user
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        email,
        first_name,
        last_name,
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
        name: `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim(),
        company_name: company.name
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
      .select('id, first_name, last_name, email')
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
      message: `User "${(existingUser.first_name + ' ' + existingUser.last_name).trim()}" deleted successfully`
    });

  } catch (error) {
    console.error('Super admin delete user error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}