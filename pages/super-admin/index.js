import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';

const SuperAdminDashboard = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Analytics data
  const [analytics, setAnalytics] = useState({
    totalTenants: 0,
    totalUsers: 0,
    totalKnowledgeDocs: 0,
    monthlyRevenue: 0,
    platformUsage: []
  });

  // Companies data
  const [companies, setCompanies] = useState([]);
  const [platformKnowledge, setPlatformKnowledge] = useState([]);

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/login');
      return;
    }

    // Check if user is super admin
    if (isAuthenticated && !loading) {
      checkSuperAdminAccess();
    }
  }, [isAuthenticated, loading, router]);

  const checkSuperAdminAccess = async () => {
    try {
      const response = await fetch('/api/super-admin/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setIsSuperAdmin(true);
        await loadDashboardData();
      } else {
        // Redirect non-super-admins
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error verifying super admin access:', error);
      router.push('/dashboard');
    } finally {
      setIsDataLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Load analytics
      const analyticsResponse = await fetch('/api/super-admin/analytics', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        if (analyticsData.success) {
          setAnalytics(analyticsData.data);
        }
      }

      // Load companies
      const companiesResponse = await fetch('/api/super-admin/companies', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        if (companiesData.success) {
          setCompanies(companiesData.data);
        }
      }

      // Load platform knowledge
      const knowledgeResponse = await fetch('/api/super-admin/knowledge', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (knowledgeResponse.ok) {
        const knowledgeData = await knowledgeResponse.json();
        if (knowledgeData.success) {
          setPlatformKnowledge(knowledgeData.data.knowledge || []);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      
      // For development, use mock data
      setAnalytics({
        totalTenants: 5,
        totalUsers: 124,
        totalKnowledgeDocs: 45,
        monthlyRevenue: 749.00,
        platformUsage: []
      });
      
      setCompanies([
        {
          id: 1,
          name: 'Acme Corp',
          subdomain: 'acme',
          admin_email: 'admin@acmecorp.com',
          subscription_plan: 'professional',
          status: 'active',
          user_count: 12,
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          name: 'Globex Industries',
          subdomain: 'globex',
          admin_email: 'admin@globex.com',
          subscription_plan: 'business',
          status: 'active',
          user_count: 36,
          created_at: '2024-01-10T14:20:00Z'
        },
        {
          id: 3,
          name: 'Initech',
          subdomain: 'initech',
          admin_email: 'admin@initech.com',
          subscription_plan: 'free',
          status: 'active',
          user_count: 8,
          created_at: '2024-02-05T09:15:00Z'
        }
      ]);
      
      setPlatformKnowledge([
        {
          id: 1,
          title: 'Industry Best Practices 2024',
          document_type: 'industry_standards',
          category: 'general',
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          title: 'GDPR Compliance Guidelines',
          document_type: 'compliance',
          category: 'legal',
          created_at: '2024-01-10T14:20:00Z'
        }
      ]);
    } finally {
      setIsDataLoading(false);
    }
  };

  if (loading || (isAuthenticated && !isSuperAdmin && isDataLoading)) {
    return (
      <Layout title="Loading...">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Verifying access...</p>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return null; // Will redirect
  }

  return (
    <Layout title="Super Admin Dashboard">
      <div className="super-admin-dashboard">
        <div className="page-header">
          <h1 className="page-title">🛡️ Super Admin Dashboard</h1>
          <p className="page-subtitle">Platform management and oversight</p>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveTab('companies')}
          >
            🏢 Companies
          </button>
          <button 
            className={`tab-btn ${activeTab === 'knowledge' ? 'active' : ''}`}
            onClick={() => setActiveTab('knowledge')}
          >
            📚 Platform Knowledge
          </button>
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{analytics.totalTenants}</div>
                <div className="stat-label">Active Companies</div>
                <div className="stat-change">Platform tenants</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{analytics.totalUsers}</div>
                <div className="stat-label">Total Users</div>
                <div className="stat-change">Across all companies</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{analytics.totalKnowledgeDocs}</div>
                <div className="stat-label">Knowledge Documents</div>
                <div className="stat-change">Platform knowledge base</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">${analytics.monthlyRevenue}</div>
                <div className="stat-label">Monthly Revenue</div>
                <div className="stat-change">Subscription income</div>
              </div>
            </div>

            <div className="recent-activity">
              <h3>Recent Platform Activity</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <span className="activity-icon">🏢</span>
                  <span className="activity-text">New company "Acme Corp" registered</span>
                  <span className="activity-time">2 hours ago</span>
                </div>
                <div className="activity-item">
                  <span className="activity-icon">📊</span>
                  <span className="activity-text">Platform knowledge updated</span>
                  <span className="activity-time">1 day ago</span>
                </div>
                <div className="activity-item">
                  <span className="activity-icon">👥</span>
                  <span className="activity-text">50 new users registered today</span>
                  <span className="activity-time">Today</span>
                </div>
              </div>
            </div>
            
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <Link href="/super-admin/companies/new">
                  <button className="action-btn">Add Company</button>
                </Link>
                <Link href="/super-admin/platform-knowledge">
                  <button className="action-btn">Manage Knowledge</button>
                </Link>
                <Link href="/super-admin/settings">
                  <button className="action-btn">Platform Settings</button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === 'companies' && (
          <div className="tab-content">
            <div className="section-header">
              <h3>Company Management</h3>
              <Link href="/super-admin/companies/new">
                <button className="primary-btn">+ Add Company</button>
              </Link>
            </div>
            
            <div className="companies-table">
              <table>
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Subdomain</th>
                    <th>Plan</th>
                    <th>Users</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map(company => (
                    <tr key={company.id}>
                      <td className="company-name">
                        <div>
                          <strong>{company.name}</strong>
                          <br />
                          <small>{company.admin_email}</small>
                        </div>
                      </td>
                      <td>
                        <code>{company.subdomain}.upup.ai</code>
                      </td>
                      <td>
                        <span className={`plan-badge ${company.subscription_plan}`}>
                          {company.subscription_plan}
                        </span>
                      </td>
                      <td>{company.user_count}</td>
                      <td>
                        <span className={`status-badge ${company.status}`}>
                          {company.status}
                        </span>
                      </td>
                      <td>{new Date(company.created_at).toLocaleDateString()}</td>
                      <td className="actions">
                        <Link href={`/super-admin/companies/${company.id}`}>
                          <button className="action-btn">View</button>
                        </Link>
                        <Link href={`/super-admin/companies/${company.id}/edit`}>
                          <button className="action-btn">Edit</button>
                        </Link>
                        <button className="action-btn danger">Suspend</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Platform Knowledge Tab */}
        {activeTab === 'knowledge' && (
          <div className="tab-content">
            <div className="section-header">
              <h3>Platform Knowledge Base</h3>
              <Link href="/super-admin/platform-knowledge">
                <button className="primary-btn">Manage Knowledge</button>
              </Link>
            </div>

            <div className="knowledge-categories">
              <div className="category-card">
                <h4>📋 Industry Standards</h4>
                <p>Best practices and compliance guidelines</p>
                <div className="category-stats">
                  {platformKnowledge.filter(k => k.document_type === 'industry_standards').length} documents
                </div>
              </div>
              <div className="category-card">
                <h4>⚖️ Legal Templates</h4>
                <p>Standard legal document templates</p>
                <div className="category-stats">
                  {platformKnowledge.filter(k => k.document_type === 'templates' && k.category === 'legal').length} documents
                </div>
              </div>
              <div className="category-card">
                <h4>👥 HR Guidelines</h4>
                <p>Human resources best practices</p>
                <div className="category-stats">
                  {platformKnowledge.filter(k => k.category === 'hr').length} documents
                </div>
              </div>
              <div className="category-card">
                <h4>💼 Sales Frameworks</h4>
                <p>Sales process and methodology guides</p>
                <div className="category-stats">
                  {platformKnowledge.filter(k => k.category === 'sales').length} documents
                </div>
              </div>
            </div>

            <div className="knowledge-list">
              <h4>Recent Knowledge Documents</h4>
              {platformKnowledge.slice(0, 5).map(doc => (
                <div key={doc.id} className="knowledge-item">
                  <div className="knowledge-info">
                    <h5>{doc.title}</h5>
                    <p>{doc.category} • {doc.document_type?.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="knowledge-actions">
                    <Link href={`/super-admin/platform-knowledge?id=${doc.id}`}>
                      <button className="action-btn">View</button>
                    </Link>
                  </div>
                </div>
              ))}
              <div className="view-all">
                <Link href="/super-admin/platform-knowledge">
                  <button className="link-btn">View All Knowledge →</button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="tab-content">
            <div className="settings-section">
              <h3>Platform Settings</h3>
              
              <div className="setting-group">
                <h4>Registration Settings</h4>
                <label className="setting-item">
                  <input type="checkbox" defaultChecked />
                  Allow new company registration
                </label>
                <label className="setting-item">
                  <input type="checkbox" />
                  Require email verification
                </label>
              </div>

              <div className="setting-group">
                <h4>AI Configuration</h4>
                <div className="setting-item">
                  <label>OpenAI API Key</label>
                  <input type="password" value="sk-..." readOnly />
                </div>
                <div className="setting-item">
                  <label>Default Token Limit</label>
                  <input type="number" defaultValue={1000} />
                </div>
              </div>

              <div className="setting-group">
                <h4>Billing Settings</h4>
                <div className="setting-item">
                  <label>Stripe Public Key</label>
                  <input type="text" value="pk_..." readOnly />
                </div>
              </div>

              <button className="primary-btn">Save Settings</button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .super-admin-dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .tab-navigation {
          display: flex;
          gap: 4px;
          margin-bottom: 24px;
          background: white;
          padding: 4px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .tab-btn {
          flex: 1;
          padding: 12px 24px;
          border: none;
          background: transparent;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          color: #64748b;
        }

        .tab-btn.active {
          background: #10b981;
          color: white;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }

        .tab-btn:hover:not(.active) {
          background: #f1f5f9;
          color: #374151;
        }

        .tab-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .stat-label {
          color: #64748b;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .stat-change {
          color: #10b981;
          font-size: 0.875rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .section-header h3 {
          margin: 0;
          color: #1e293b;
        }

        .primary-btn {
          background: #10b981;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .primary-btn:hover {
          background: #059669;
        }

        .companies-table {
          overflow-x: auto;
        }

        .companies-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .companies-table th,
        .companies-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }

        .companies-table th {
          background: #f8fafc;
          font-weight: 600;
          color: #475569;
        }

        .plan-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .plan-badge.free {
          background: #fee2e2;
          color: #dc2626;
        }

        .plan-badge.professional {
          background: #dbeafe;
          color: #2563eb;
        }

        .plan-badge.business {
          background: #dcfce7;
          color: #16a34a;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-badge.active {
          background: #dcfce7;
          color: #16a34a;
        }

        .status-badge.suspended {
          background: #fee2e2;
          color: #dc2626;
        }

        .action-btn {
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
          margin-right: 8px;
        }

        .action-btn:hover {
          background: #f9fafb;
        }

        .action-btn.danger {
          border-color: #dc2626;
          color: #dc2626;
        }

        .knowledge-categories {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .category-card {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #10b981;
        }

        .category-card h4 {
          margin: 0 0 8px 0;
          color: #1e293b;
        }

        .category-card p {
          margin: 0 0 12px 0;
          color: #64748b;
          font-size: 0.875rem;
        }

        .category-stats {
          color: #10b981;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .knowledge-list {
          margin-top: 32px;
        }

        .knowledge-list h4 {
          margin: 0 0 16px 0;
          color: #1e293b;
          font-size: 18px;
        }

        .knowledge-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 12px;
        }

        .knowledge-info h5 {
          margin: 0 0 4px 0;
          color: #1e293b;
        }

        .knowledge-info p {
          margin: 0;
          color: #64748b;
          font-size: 0.875rem;
          text-transform: capitalize;
        }

        .view-all {
          text-align: center;
          margin-top: 16px;
        }

        .link-btn {
          background: none;
          border: none;
          color: #3b82f6;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s;
        }

        .link-btn:hover {
          color: #2563eb;
          text-decoration: underline;
        }

        .settings-section {
          max-width: 600px;
        }

        .setting-group {
          margin-bottom: 32px;
        }

        .setting-group h4 {
          margin: 0 0 16px 0;
          color: #1e293b;
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
        }

        .setting-item {
          display: block;
          margin-bottom: 16px;
        }

        .setting-item label {
          display: block;
          margin-bottom: 4px;
          color: #374151;
          font-weight: 500;
        }

        .setting-item input[type="text"],
        .setting-item input[type="password"],
        .setting-item input[type="number"] {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .setting-item input[type="checkbox"] {
          margin-right: 8px;
        }

        .recent-activity {
          margin-top: 32px;
        }

        .recent-activity h3 {
          margin: 0 0 16px 0;
          color: #1e293b;
        }

        .activity-list {
          space-y: 12px;
        }

        .activity-item {
          display: flex;
          align-items: center;
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .activity-icon {
          margin-right: 12px;
          font-size: 1.25rem;
        }

        .activity-text {
          flex: 1;
          color: #374151;
        }

        .activity-time {
          color: #64748b;
          font-size: 0.875rem;
        }

        .quick-actions {
          margin-top: 32px;
        }

        .quick-actions h3 {
          margin: 0 0 16px 0;
          color: #1e293b;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .action-buttons .action-btn {
          padding: 12px 20px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
        }

        .action-buttons .action-btn:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Layout>
  );
};

export default SuperAdminDashboard;