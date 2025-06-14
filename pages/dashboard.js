import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { usePins } from '../contexts/PinsContext';
import { useUsageTracking } from '../hooks/useUsageTracking';

const Dashboard = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const { pinCount } = usePins();
  const { getFormattedStats } = useUsageTracking();
  const router = useRouter();

  const [stats, setStats] = useState({
    contentGenerated: '0',
    contentGeneratedWeekly: '+0 this week',
    templatesUsed: '0', 
    templatesUsedWeekly: '+0 this week',
    apiTokensUsed: '0',
    apiTokensPercentage: '0% of monthly limit'
  });

  useEffect(() => {
    // Update stats when component mounts
    setStats(getFormattedStats());
  }, [getFormattedStats]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const navigateToPage = (pageId) => {
    router.push(`/${pageId}`);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout title="Dashboard | Up, Up, Down, Down">
      <div className="page-header">
        <h1 className="page-title">Welcome back! 👋</h1>
        <p className="page-subtitle">Here's what's happening with your AI business partner</p>
        
        {/* Debug User Info */}
        <div style={{ 
          background: '#f0f0f0', 
          padding: '10px', 
          borderRadius: '4px', 
          marginTop: '10px', 
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <strong>Debug - Current User Info:</strong><br/>
          Email: {user?.email || 'Not available'}<br/>
          Role: {user?.role || 'Not available'}<br/>
          Is Super Admin: {user?.isSuperAdmin ? 'YES' : 'NO'}<br/>
          Is Company Admin: {user?.isCompanyAdmin ? 'YES' : 'NO'}<br/>
          Tenant: {user?.tenantName || 'Not available'}<br/>
          Tenant ID: {user?.tenantId || 'Not available'}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.contentGenerated}</div>
          <div className="stat-label">Content Pieces Generated</div>
          <div className="stat-change">{stats.contentGeneratedWeekly}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{pinCount}</div>
          <div className="stat-label">Sentences Pinned</div>
          <div className="stat-change">Active pins</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.templatesUsed}</div>
          <div className="stat-label">Templates Used</div>
          <div className="stat-change">{stats.templatesUsedWeekly}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.apiTokensUsed}</div>
          <div className="stat-label">AI Tokens Used</div>
          <div className="stat-change">{stats.apiTokensPercentage}</div>
        </div>
      </div>

      <div className="tools-grid">
        <div className="tool-category">
          <div className="category-header">
            <div className="category-icon generators-icon">✨</div>
            <div className="category-title">Generators</div>
          </div>
          <div className="category-description">
            AI-powered content creation with sentence-level curation
          </div>
          <ul className="tool-list">
            <li className="tool-item">
              <span className="tool-name">Content Generator</span>
              <button className="tool-button" onClick={() => navigateToPage('content-generator')}>
                Use
              </button>
            </li>
            <li className="tool-item">
              <span className="tool-name">Growth Opportunities</span>
              <button className="tool-button" onClick={() => navigateToPage('growth-generator')}>
                Use
              </button>
            </li>
            <li className="tool-item">
              <span className="tool-name">Market Insights</span>
              <button className="tool-button" onClick={() => navigateToPage('market-generator')}>
                Use
              </button>
            </li>
            <li className="tool-item">
              <span className="tool-name">Customer Connection</span>
              <button className="tool-button" onClick={() => navigateToPage('customer-generator')}>
                Use
              </button>
            </li>
          </ul>
        </div>

        <div className="tool-category">
          <div className="category-header">
            <div className="category-icon templates-icon">📋</div>
            <div className="category-title">Templates</div>
          </div>
          <div className="category-description">
            Smart templates powered by your brand knowledge base
          </div>
          <ul className="tool-list">
            <li className="tool-item">
              <span className="tool-name">Job Descriptions</span>
              <button className="tool-button" onClick={() => navigateToPage('hr-templates')}>
                Create
              </button>
            </li>
            <li className="tool-item">
              <span className="tool-name">Service Agreements</span>
              <button className="tool-button" onClick={() => navigateToPage('legal-templates')}>
                Create
              </button>
            </li>
            <li className="tool-item">
              <span className="tool-name">🚀 Streaming Content (NEW)</span>
              <button className="tool-button" onClick={() => navigateToPage('streaming-content')}>
                Try
              </button>
            </li>
            <li className="tool-item">
              <span className="tool-name">Sales Proposals</span>
              <button className="tool-button" onClick={() => navigateToPage('sales-templates')}>
                Create
              </button>
            </li>
            <li className="tool-item">
              <span className="tool-name">Email Sequences</span>
              <button className="tool-button" onClick={() => navigateToPage('sales-templates')}>
                Create
              </button>
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;