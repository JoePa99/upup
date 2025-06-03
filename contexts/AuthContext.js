import React, { createContext, useState, useContext, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Now we know the environment has SUPABASE_URL but not NEXT_PUBLIC_SUPABASE_URL
// So we prioritize using what's available
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// For debugging
console.log('Supabase environment check:', {
  NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_URL: !!process.env.SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  url_used: supabaseUrl ? supabaseUrl.substring(0, 15) + '...' : 'undefined'
});

let supabase = null;
try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client initialized successfully');
  } else {
    console.error('❌ Supabase environment variables missing:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
      key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 5)}...` : 'undefined'
    });
  }
} catch (error) {
  console.error('❌ Error initializing Supabase client:', error);
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
      
      // Try client-side login first if supabase is available
      if (supabase) {
        try {
          console.log('Attempting client-side login...');
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
  
          if (!error) {
            console.log('Client-side login successful, user:', data.user.email);
            // User data will be loaded by the auth state change listener
            return data.user;
          }
          
          // If client-side fails, we'll fall through to server-side login
          console.warn('Client-side login failed, trying server-side login:', error.message);
        } catch (clientError) {
          console.warn('Client-side login error, trying server-side login:', clientError);
        }
      } else {
        console.log('Supabase client not available, using server-side login');
      }
      
      // Server-side login as fallback
      console.log('Attempting server-side login via API...');
      const response = await fetch('/api/auth/server-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server login failed:', errorData);
        throw new Error(errorData.error || 'Login failed');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.session) {
        throw new Error('Invalid response from server login');
      }
      
      console.log('Server-side login successful');
      
      // Manually set the session in Supabase
      if (supabase) {
        try {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          });
          console.log('Session set in Supabase client');
        } catch (setSessionError) {
          console.error('Error setting session:', setSessionError);
        }
      } else {
        console.warn('No supabase client to set session, auth state may not update correctly');
        
        // Since we can't set the session in the Supabase client, manually load user data
        try {
          await loadUserData(data.user, data.session);
        } catch (loadError) {
          console.error('Error loading user data after server login:', loadError);
        }
      }
      
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