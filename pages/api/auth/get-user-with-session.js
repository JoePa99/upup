// API endpoint to get user data with session token
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { session } = req.body;
    
    if (!session || !session.access_token) {
      return res.status(400).json({ error: 'Valid session token is required' });
    }
    
    // Initialize Supabase admin client
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase configuration missing' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Get user from session token
    const { data: { user }, error: userError } = await supabase.auth.getUser(session.access_token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid session token' });
    }
    
    // Get user data with tenant info from database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select(`
        id,
        tenant_id,
        email,
        first_name,
        last_name,
        role,
        tenants!inner (
          id,
          name,
          subdomain
        )
      `)
      .eq('auth_user_id', user.id)
      .single();
    
    if (dbError) {
      return res.status(500).json({ 
        error: 'Database error', 
        details: dbError.message 
      });
    }
    
    if (!userData) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    // Check if user is super admin
    const SUPER_ADMIN_EMAILS = [
      'admin@upup.ai',
      'joe@upup.ai', 
      'super@upup.ai',
      process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL
    ].filter(Boolean);
    
    const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user.email);
    
    // Return user data
    res.status(200).json({
      success: true,
      user: {
        id: userData.id,
        authUserId: user.id,
        tenantId: userData.tenant_id,
        tenantName: userData.tenants.name,
        email: userData.email || user.email,
        firstName: userData.first_name || user.user_metadata?.first_name || '',
        lastName: userData.last_name || user.user_metadata?.last_name || '',
        role: userData.role || 'user',
        isSuperAdmin,
        isCompanyAdmin: userData.role === 'admin',
        isUser: userData.role === 'user'
      }
    });
  } catch (error) {
    console.error('Error getting user with session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}