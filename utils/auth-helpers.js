import { createClient } from '@supabase/supabase-js';

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

// Get user context from request (JWT token)
export async function getUserFromRequest(req) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No authorization token provided');
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    // Verify the JWT token and get user
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      throw new Error('Invalid token');
    }

    // Get user data with tenant info from database
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
    // In production, you might want to throw the error
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