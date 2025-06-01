import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // DEMO MODE: Always authenticated with mock user
  const [user, setUser] = useState({
    id: 1,
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@staedtler.com',
    tenantName: 'Staedtler Pencils',
    tenantId: 1,
    role: 'admin'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // DEMO MODE: Skip auth check, always set demo user
    console.log('🎯 Demo Mode: Authentication bypassed - showing full AI platform');
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // DEMO MODE: Mock successful login
      const mockUser = {
        id: 1,
        firstName: 'Demo',
        lastName: 'User',
        email: email,
        tenantName: 'Staedtler Pencils',
        tenantId: 1,
        role: 'admin'
      };
      
      localStorage.setItem('token', 'demo-token');
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      setUser(mockUser);
      return mockUser;
    } catch (error) {
      setError('Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      // DEMO MODE: Mock successful registration
      const mockUser = {
        id: 1,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        tenantName: userData.tenantName || 'Demo Company',
        tenantId: 1,
        role: 'admin'
      };
      
      return mockUser;
    } catch (error) {
      setError('Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const superAdminLogin = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // DEMO MODE: Mock successful super admin login
      const mockSuperUser = {
        id: 1,
        firstName: 'Super',
        lastName: 'Admin',
        email: email,
        tenantName: 'UPUP Platform',
        tenantId: 0,
        role: 'super_admin',
        isSuperAdmin: true
      };
      
      localStorage.setItem('token', 'demo-super-token');
      localStorage.setItem('user', JSON.stringify(mockSuperUser));
      
      setUser(mockSuperUser);
      return mockSuperUser;
    } catch (error) {
      setError('Login failed');
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