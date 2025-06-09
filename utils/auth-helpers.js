import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let supabaseAdmin = null;
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Get user context from request (supports both custom JWT and Supabase tokens)
export async function getUserFromRequest(req) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    console.log('🔍 Auth header received:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No authorization token provided');
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔍 Token extracted, length:', token.length);
    console.log('🔍 Token preview:', token.substring(0, 50) + '...');
    
    if (!supabaseAdmin) {
      console.log('❌ Supabase admin client not configured');
      throw new Error('Supabase admin client not configured');
    }

    // Try custom JWT first
    try {
      console.log('🔍 Attempting to verify custom JWT...');
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
      const decoded = jwt.verify(token, jwtSecret);
      
      console.log('✅ Custom JWT verified, userId:', decoded.userId);
      
      // Get user data from database using the custom user ID
      const { data: userData, error: dbError } = await supabaseAdmin
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
        .eq('id', decoded.userId)
        .single();

      if (!dbError && userData) {
        console.log('✅ Custom JWT user found:', userData.email);
        return {
          id: userData.id,
          authUserId: userData.id, // Use same ID for compatibility
          tenantId: userData.tenant_id,
          tenantName: userData.tenants.name,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          role: userData.role
        };
      }
    } catch (jwtError) {
      console.log('🔍 Custom JWT verification failed, trying Supabase auth...');
    }

    // Fallback to Supabase Auth verification
    console.log('🔍 Attempting to verify token with Supabase...');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    console.log('🔍 Supabase auth result:', { 
      hasUser: !!user, 
      hasError: !!error,
      errorMessage: error?.message 
    });
    
    if (error || !user) {
      console.log('❌ Both token verification methods failed');
      throw new Error(`Token verification failed: ${error?.message || 'Invalid token'}`);
    }

    // Get user data with tenant info from database for Supabase auth
    const { data: userData, error: dbError } = await supabaseAdmin
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

    if (dbError || !userData) {
      throw new Error('User not found in database');
    }

    console.log('✅ Supabase auth user found:', userData.email);
    return {
      id: userData.id,
      authUserId: user.id,
      tenantId: userData.tenant_id,
      tenantName: userData.tenants.name,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      role: userData.role
    };

  } catch (error) {
    console.error('Error getting user from request:', error);
    
    // For development/testing, return null instead of throwing
    return null;
  }
}

// Set tenant context for RLS policies
export async function setTenantContext(tenantId, userId = null, isSuperAdmin = false) {
  if (!supabaseAdmin) return;

  try {
    await supabaseAdmin.rpc('set_tenant_context', {
      tenant_id: tenantId,
      user_id: userId,
      is_admin: isSuperAdmin
    });
  } catch (error) {
    console.error('Error setting tenant context:', error);
  }
}

// Check if user has required role
export function hasRole(user, requiredRole) {
  if (!user) return false;
  
  const roleHierarchy = {
    'user': 1,
    'admin': 2,
    'company_admin': 2,
    'super_admin': 3
  };

  const userRoleLevel = roleHierarchy[user.role] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

  return userRoleLevel >= requiredRoleLevel;
}

export { supabaseAdmin };