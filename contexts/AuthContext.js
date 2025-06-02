import React, { createContext, useState, useContext, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase client initialized successfully');
} else {
  console.error('❌ Supabase environment variables missing:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
    key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined'
  });
}

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase) {
      console.error('Supabase not configured - missing environment variables');
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          await loadUserData(session.user);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserData(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setError(error.message || 'Authentication error');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSuperAdminStatus = async (email) => {
    try {
      const SUPER_ADMIN_EMAILS = [
        'admin@upup.ai',
        'joe@upup.ai', 
        'super@upup.ai',
        process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL
      ].filter(Boolean);

      return SUPER_ADMIN_EMAILS.includes(email);
    } catch (error) {
      console.error('Error checking super admin status:', error);
      return false;
    }
  };

  const loadUserData = async (authUser) => {
    try {
      // Safety check
      if (!authUser || !authUser.id) {
        setError('Invalid user data');
        return;
      }

      // Use API endpoint to bypass RLS issues
      const response = await fetch('/api/auth/get-user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authUserId: authUser.id })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data: ' + response.status);
      }

      const directData = await response.json();
      const directError = directData.error ? { message: directData.error } : null;

      if (directError) {
        setError('Account setup incomplete. Please contact support.');
        return;
      }

      if (directData && directData.id) {
        // Check if user is super admin
        const isSuperAdmin = await checkSuperAdminStatus(authUser.email);
        
        setUser({
          id: directData.id,
          authUserId: authUser.id,
          email: authUser.email || '',
          firstName: authUser.user_metadata?.first_name || directData.first_name || '',
          lastName: authUser.user_metadata?.last_name || directData.last_name || '',
          tenantId: directData.tenant_id,
          tenantName: directData.tenants?.name || '',
          role: directData.role || 'user',
          isSuperAdmin,
          isCompanyAdmin: directData.role === 'admin',
          isUser: directData.role === 'user'
        });
        setLoading(false);
      } else {
        setError('Account setup incomplete. Please contact support.');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      setError(error.message || 'Failed to load user data');
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    if (!supabase) {
      throw new Error('Authentication not configured');
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // User data will be loaded by the auth state change listener
      return data.user;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    if (!supabase) {
      throw new Error('Authentication not configured');
    }

    try {
      setLoading(true);
      setError(null);
      
      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName
          }
        }
      });

      if (authError) throw authError;

      // Wait a brief moment for the auth user to be fully created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Call our registration API endpoint to create tenant and user records
      // This uses the service key on the backend to bypass RLS
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authUserId: authData.user.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          tenantName: userData.tenantName,
          subdomain: userData.subdomain
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      return authData.user;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!supabase) return;
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setError(error.message);
    }
  };

  const superAdminLogin = async (email, password) => {
    if (!supabase) {
      throw new Error('Authentication not configured');
    }

    try {
      setLoading(true);
      setError(null);
      
      // Check if user is super admin
      const { data: superAdminData, error: superAdminError } = await supabase
        .from('super_admins')
        .select('*')
        .eq('email', email)
        .single();

      if (superAdminError || !superAdminData) {
        throw new Error('Invalid super admin credentials');
      }

      // Use regular auth login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Set super admin user data
      setUser({
        id: superAdminData.id,
        authUserId: data.user.id,
        email: email,
        firstName: superAdminData.first_name,
        lastName: superAdminData.last_name,
        tenantId: null,
        tenantName: 'UPUP Platform',
        role: 'super_admin',
        isSuperAdmin: true
      });

      return data.user;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
        error,
        login,
        register,
        logout,
        superAdminLogin,
        isSuperAdmin: user?.isSuperAdmin || false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;