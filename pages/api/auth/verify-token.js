import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
    
    // Verify JWT token
    const decoded = jwt.verify(token, jwtSecret);
    
    // Get fresh user data from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        tenant_id,
        tenants (
          name,
          subdomain
        )
      `)
      .eq('id', decoded.userId)
      .single();
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token or user not found' });
    }
    
    // Check super admin status (both role and email-based)
    const SUPER_ADMIN_EMAILS = [
      'admin@upup.ai',
      'joe@upup.ai', 
      'super@upup.ai',
      process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL
    ].filter(Boolean);
    
    const isSuperAdmin = user.role === 'super_admin' || SUPER_ADMIN_EMAILS.includes(user.email);
    
    // Return user data
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        role: user.role,
        tenant_id: user.tenant_id,
        company_name: user.tenants?.name || 'Unknown Company',
        isSuperAdmin
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}