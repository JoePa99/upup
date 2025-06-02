import { supabaseAdmin } from '../../../utils/auth-helpers';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { authUserId } = req.body;

    if (!authUserId) {
      return res.status(400).json({ error: 'Auth user ID is required' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Use admin client to bypass RLS and get user data
    const { data: userData, error: userError } = await supabaseAdmin
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
          subdomain
        )
      `)
      .eq('auth_user_id', authUserId)
      .single();

    if (userError) {
      console.error('User data fetch error:', userError);
      return res.status(404).json({ error: userError.message });
    }

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return the user data in the expected format
    res.status(200).json(userData);

  } catch (error) {
    console.error('Get user data API error:', error);
    res.status(500).json({ error: error.message || 'Failed to get user data' });
  }
}