import React, { createContext, useState, useContext, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
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
        }
      } catch (error) {
        console.error('Error getting session:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserData(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (authUser) => {
    try {
      // Get user data with tenant info from database
      const { data, error } = await supabase
        .rpc('get_user_tenant_info');

      if (error) throw error;

      if (data && data.length > 0) {
        const userData = data[0];
        setUser({
          id: userData.user_id,
          authUserId: authUser.id,
          email: authUser.email,
          firstName: authUser.user_metadata?.first_name || '',
          lastName: authUser.user_metadata?.last_name || '',
          tenantId: userData.tenant_id,
          tenantName: userData.tenant_name,
          role: userData.user_role
        });
      } else {
        // User exists in auth but not in users table
        console.error('User not found in users table');
        setError('Account setup incomplete. Please contact support.');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError(error.message);
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

      // Create tenant and user records
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: userData.tenantName || `${userData.firstName}'s Company`,
          subdomain: userData.subdomain || `${userData.firstName.toLowerCase()}-${Date.now()}`,
          admin_email: userData.email
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Create user record linked to auth user
      const { error: userError } = await supabase
        .from('users')
        .insert({
          auth_user_id: authData.user.id,
          tenant_id: tenantData.id,
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: 'admin' // First user in tenant is admin
        });

      if (userError) throw userError;

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