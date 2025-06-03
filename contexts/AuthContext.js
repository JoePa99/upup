import React, { createContext, useState, useContext, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// We'll initialize supabase later after getting the URL from the server
let supabase = null;
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Try to initialize Supabase with available environment variables
const initializeSupabase = async () => {
  // If already initialized, don't do it again
  if (supabase) return supabase;
  
  // If we have the URL and key in environment variables, use them
  if (supabaseUrl && supabaseAnonKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseAnonKey);
      console.log('✅ Supabase client initialized from environment variables');
      return supabase;
    } catch (error) {
      console.error('❌ Error initializing Supabase from environment:', error);
    }
  }
  
  // Try to get the URL from the server
  try {
    const response = await fetch('/api/env-fix');
    const data = await response.json();
    
    if (data.success && data.supabaseUrl) {
      supabaseUrl = data.supabaseUrl;
      
      if (supabaseUrl && supabaseAnonKey) {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
        console.log('✅ Supabase client initialized from server-provided URL');
        return supabase;
      }
    }
  } catch (error) {
    console.error('❌ Error fetching Supabase URL from server:', error);
  }
  
  console.error('❌ Failed to initialize Supabase client');
  return null;
};

// Try to initialize right away
if (typeof window !== 'undefined') {
  initializeSupabase().then(client => {
    if (client) {
      console.log('Supabase initialized during context creation');
    }
  });
}

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        // Make sure we have a Supabase client
        const client = await initializeSupabase();
        if (!client) {
          console.error('Could not initialize Supabase client');
          setLoading(false);
          return;
        }
        
        const { data: { session }, error } = await client.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          await loadUserData(session.user);
        } else {
          setLoading(false);
        }
        
        // Listen for auth changes
        const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
          try {
            console.log('Auth state change:', event);
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
        
        // Clean up subscription
        return () => subscription?.unsubscribe?.();
      } catch (error) {
        console.error('Error getting session:', error);
        setError(error.message);
        setLoading(false);
        return () => {}; // Return empty cleanup function
      }
    };

    const unsubscribe = getInitialSession();
    
    // Return cleanup function
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
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

  const loadUserData = async (authUser, session = null) => {
    try {
      // Safety check
      if (!authUser || !authUser.id) {
        setError('Invalid user data');
        return;
      }

      let userData = null;
      
      // First try the standard API endpoint
      try {
        console.log('Attempting to load user data via get-user-data API...');
        const response = await fetch('/api/auth/get-user-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authUserId: authUser.id })
        });

        if (response.ok) {
          const directData = await response.json();
          if (!directData.error && directData.id) {
            userData = directData;
            console.log('Successfully loaded user data via standard API');
          }
        }
      } catch (standardApiError) {
        console.warn('Standard API user data fetch failed:', standardApiError);
      }
      
      // If standard API fails and we have a session, try the session-based API
      if (!userData && session) {
        try {
          console.log('Attempting to load user data via session API...');
          const sessionResponse = await fetch('/api/auth/get-user-with-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session })
          });
          
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            if (sessionData.success && sessionData.user) {
              console.log('Successfully loaded user data via session API');
              
              // Use the complete user object from the session API
              setUser(sessionData.user);
              setLoading(false);
              return; // Exit early as we've already set the user
            }
          }
        } catch (sessionApiError) {
          console.warn('Session API user data fetch failed:', sessionApiError);
        }
      }

      // Proceed with standard user data if available
      if (userData && userData.id) {
        // Check if user is super admin
        const isSuperAdmin = await checkSuperAdminStatus(authUser.email);
        
        setUser({
          id: userData.id,
          authUserId: authUser.id,
          email: authUser.email || '',
          firstName: authUser.user_metadata?.first_name || userData.first_name || '',
          lastName: authUser.user_metadata?.last_name || userData.last_name || '',
          tenantId: userData.tenant_id,
          tenantName: userData.tenants?.name || '',
          role: userData.role || 'user',
          isSuperAdmin,
          isCompanyAdmin: userData.role === 'admin',
          isUser: userData.role === 'user'
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
    // Add debugging for login attempts
    console.log('Login attempt for:', email);
    
    try {
      setLoading(true);
      setError(null);
      
      // Make sure we have a Supabase client
      const client = await initializeSupabase();
      if (!client) {
        throw new Error('Could not initialize authentication client');
      }
      
      console.log('Attempting login with initialized client...');
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Supabase auth error:', error);
        throw error;
      }

      console.log('Login successful, user:', data.user.email);
      // User data will be loaded by the auth state change listener
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Make sure we have a Supabase client
      const client = await initializeSupabase();
      if (!client) {
        throw new Error('Could not initialize authentication client');
      }
      
      // Register with Supabase Auth
      const { data: authData, error: authError } = await client.auth.signUp({
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
    try {
      // Make sure we have a Supabase client
      const client = await initializeSupabase();
      if (!client) {
        console.error('Could not initialize Supabase client for logout');
        return;
      }
      
      const { error } = await client.auth.signOut();
      if (error) throw error;
      
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setError(error.message);
    }
  };

  const superAdminLogin = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Make sure we have a Supabase client
      const client = await initializeSupabase();
      if (!client) {
        throw new Error('Could not initialize authentication client');
      }
      
      // Check if user is super admin
      const { data: superAdminData, error: superAdminError } = await client
        .from('super_admins')
        .select('*')
        .eq('email', email)
        .single();

      if (superAdminError || !superAdminData) {
        throw new Error('Invalid super admin credentials');
      }

      // Use regular auth login
      const { data, error } = await client.auth.signInWithPassword({
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