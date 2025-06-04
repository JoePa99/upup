import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children, title = 'Up, Up, Down, Down - AI Business Platform' }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const [activePage, setActivePage] = useState('dashboard');

  useEffect(() => {
    try {
      const path = router?.pathname || '';
      if (path === '/dashboard') setActivePage('dashboard');
      else if (path === '/pins') setActivePage('pins');
      else if (path === '/super-admin') setActivePage('super-admin');
      else if (path.includes('generator')) setActivePage(path.replace('/', ''));
      else if (path.includes('templates')) setActivePage(path.replace('/', ''));
    } catch (error) {
      console.error('Layout useEffect error:', error);
    }
  }, [router?.pathname]);

  const handleLogout = () => {
    try {
      logout();
      router?.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigateToPage = async (pageId) => {
    try {
      console.log(`🚀 Attempting to navigate to: /${pageId}`);
      console.log('Current auth state:', { isAuthenticated, user: user?.email });
      
      if (!isAuthenticated) {
        console.log('❌ Not authenticated, redirecting to login');
        router?.push('/login');
        return;
      }
      
      setActivePage(pageId);
      
      const result = await router?.push(`/${pageId}`);
      console.log('Navigation result:', result);
      
      if (result === false) {
        console.log('Navigation was cancelled, trying direct navigation');
        window.location.href = `/${pageId}`;
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to direct navigation
      window.location.href = `/${pageId}`;
    }
  };

  if (!isAuthenticated) {
    return (
      <div>
        <Head>
          <title>{title}</title>
          <meta charSet="utf-8" />
          <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        </Head>
        {children}
      </div>
    );
  }

  return (
    <div className="app-container">
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      {/* Header */}
      <div className="header">
        <div className="logo">🚀 Up, Up, Down, Down</div>
        <div className="user-info">
          <span>{user?.tenantName || 'Staedtler Pencils'}</span>
          {user?.isSuperAdmin && <span style={{ color: '#ff6b6b', fontSize: '12px', marginLeft: '8px' }}>SUPER ADMIN</span>}
          <div className="avatar" onClick={handleLogout} style={{ cursor: 'pointer' }} title="Click to logout">
            {user?.tenantName ? user.tenantName.substring(0, 2).toUpperCase() : 'SP'}
          </div>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className="sidebar" id="sidebar">
        <div className="nav-section">
          <div className="nav-title">Main</div>
          <div 
            className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => navigateToPage('dashboard')}
            style={{ cursor: 'pointer' }}
          >
            📊 Dashboard
          </div>
          <div 
            className={`nav-item ${activePage === 'pins' ? 'active' : ''}`}
            onClick={() => navigateToPage('pins')}
            style={{ cursor: 'pointer' }}
          >
            📌 My Pins
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-title">Generators</div>
          <div 
            className={`nav-item ${activePage === 'content-generator' ? 'active' : ''}`}
            onClick={() => navigateToPage('content-generator')}
            style={{ cursor: 'pointer' }}
          >
            ✨ Content Generator
          </div>
          <div 
            className={`nav-item ${activePage === 'growth-generator' ? 'active' : ''}`}
            onClick={() => navigateToPage('growth-generator')}
            style={{ cursor: 'pointer' }}
          >
            📈 Growth Opportunities
          </div>
          <div 
            className={`nav-item ${activePage === 'market-generator' ? 'active' : ''}`}
            onClick={() => navigateToPage('market-generator')}
            style={{ cursor: 'pointer' }}
          >
            🎯 Market Insights
          </div>
          <div 
            className={`nav-item ${activePage === 'customer-generator' ? 'active' : ''}`}
            onClick={() => navigateToPage('customer-generator')}
            style={{ cursor: 'pointer' }}
          >
            💬 Customer Connection
          </div>
          <div 
            className={`nav-item ${activePage === 'free-write' ? 'active' : ''}`}
            onClick={() => navigateToPage('free-write')}
            style={{ cursor: 'pointer' }}
          >
            ✍️ Free Write
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-title">Templates</div>
          <div 
            className={`nav-item ${activePage === 'hr-templates' ? 'active' : ''}`}
            onClick={() => navigateToPage('hr-templates')}
            style={{ cursor: 'pointer' }}
          >
            👥 HR Templates
          </div>
          <div 
            className={`nav-item ${activePage === 'legal-templates' ? 'active' : ''}`}
            onClick={() => navigateToPage('legal-templates')}
            style={{ cursor: 'pointer' }}
          >
            ⚖️ Legal Templates
          </div>
          <div 
            className={`nav-item ${activePage === 'sales-templates' ? 'active' : ''}`}
            onClick={() => navigateToPage('sales-templates')}
            style={{ cursor: 'pointer' }}
          >
            💼 Sales Templates
          </div>
        </div>

        {/* Super Admin Section - Only show for super admins */}
        {user?.isSuperAdmin && (
          <div className="nav-section">
            <div className="nav-title">Platform Admin</div>
            <div 
              className={`nav-item ${activePage === 'super-admin' ? 'active' : ''}`}
              onClick={() => navigateToPage('super-admin')}
              style={{ cursor: 'pointer' }}
            >
              🛠️ Super Admin
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

export default Layout;