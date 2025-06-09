import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Use POST with email and password to login'
    });
  }
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user in our custom users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        tenant_id,
        password_hash,
        tenants (
          name,
          subdomain
        )
      `)
      .eq('email', email.toLowerCase())
      .single();
    
    if (userError || !user) {
      return res.status(401).json({ 
        error: 'Invalid email or password'
      });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid email or password'
      });
    }
    
    // Create JWT token for session management
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id
      },
      jwtSecret,
      { expiresIn: '24h' }
    );
    
    // Return user data and token
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        role: user.role,
        tenant_id: user.tenant_id,
        company_name: user.tenants?.name || 'Unknown Company',
        isSuperAdmin: user.role === 'super_admin'
      }
    });
  } catch (error) {
    console.error('Custom login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}