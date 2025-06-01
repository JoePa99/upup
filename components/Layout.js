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
    const path = router.pathname;
    if (path === '/dashboard') setActivePage('dashboard');
    else if (path === '/pins') setActivePage('pins');
    else if (path.includes('generator')) setActivePage(path.replace('/', ''));
    else if (path.includes('templates')) setActivePage(path.replace('/', ''));
  }, [router.pathname]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navigateToPage = (pageId) => {
    setActivePage(pageId);
    router.push(`/${pageId}`);
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
          <div className="avatar">
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
          >
            📊 Dashboard
          </div>
          <div 
            className={`nav-item ${activePage === 'pins' ? 'active' : ''}`}
            onClick={() => navigateToPage('pins')}
          >
            📌 My Pins
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-title">Generators</div>
          <div 
            className={`nav-item ${activePage === 'content-generator' ? 'active' : ''}`}
            onClick={() => navigateToPage('content-generator')}
          >
            ✨ Content Generator
          </div>
          <div 
            className={`nav-item ${activePage === 'growth-generator' ? 'active' : ''}`}
            onClick={() => navigateToPage('growth-generator')}
          >
            📈 Growth Opportunities
          </div>
          <div 
            className={`nav-item ${activePage === 'market-generator' ? 'active' : ''}`}
            onClick={() => navigateToPage('market-generator')}
          >
            🎯 Market Insights
          </div>
          <div 
            className={`nav-item ${activePage === 'customer-generator' ? 'active' : ''}`}
            onClick={() => navigateToPage('customer-generator')}
          >
            💬 Customer Connection
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-title">Templates</div>
          <div 
            className={`nav-item ${activePage === 'hr-templates' ? 'active' : ''}`}
            onClick={() => navigateToPage('hr-templates')}
          >
            👥 HR Templates
          </div>
          <div 
            className={`nav-item ${activePage === 'legal-templates' ? 'active' : ''}`}
            onClick={() => navigateToPage('legal-templates')}
          >
            ⚖️ Legal Templates
          </div>
          <div 
            className={`nav-item ${activePage === 'sales-templates' ? 'active' : ''}`}
            onClick={() => navigateToPage('sales-templates')}
          >
            💼 Sales Templates
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

export default Layout;