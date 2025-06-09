import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  console.log('Get users endpoint accessed:', req.method);
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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

    console.log('Users query result:', { count: users?.length, error });

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

    console.log('Returning users:', formattedUsers.length);

    return res.status(200).json({
      success: true,
      data: formattedUsers
    });

  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}