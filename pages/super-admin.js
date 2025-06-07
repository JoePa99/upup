import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

const SuperAdminDashboard = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  
  // State for different sections
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  
  // Form states
  const [newCompany, setNewCompany] = useState({ name: '', domain: '', industry: '' });
  const [newUser, setNewUser] = useState({ email: '', name: '', companyId: '', role: 'user' });
  const [knowledgeUpload, setKnowledgeUpload] = useState({ companyId: '', files: null });
  const [platformKnowledge, setPlatformKnowledge] = useState([]);
  const [knowledgeType, setKnowledgeType] = useState('company'); // 'company' or 'platform'

  // Redirect if not authenticated or not super admin
  useEffect(() => {
    if (typeof window !== 'undefined' && !authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      if (!user?.isSuperAdmin) {
        router.push('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Load data when tab changes
  useEffect(() => {
    if (isAuthenticated && user?.isSuperAdmin) {
      loadTabData(activeTab);
    }
  }, [activeTab, isAuthenticated, user]);

  const loadTabData = async (tab) => {
    if (!isAuthenticated || !user?.isSuperAdmin) {
      console.log('Access denied - not authenticated or not super admin:', { isAuthenticated, isSuperAdmin: user?.isSuperAdmin, userEmail: user?.email });
      return;
    }
    
    setIsLoading(true);
    try {
      const { apiRequest } = await import('../utils/api-config');
      
      console.log(`Loading ${tab} data...`);
      
      switch (tab) {
        case 'overview':
          // Load overview data (companies and users for summary)
          console.log('Loading overview data...');
          const overviewCompanies = await apiRequest('/super-admin/companies');
          const overviewUsers = await apiRequest('/super-admin/users');
          const overviewKnowledge = await apiRequest('/super-admin/knowledge-bases');
          setCompanies(overviewCompanies.data || []);
          setUsers(overviewUsers.data || []);
          setKnowledgeBases(overviewKnowledge.data || []);
          break;
        case 'companies':
          console.log('Loading companies data...');
          const companiesData = await apiRequest('/super-admin/companies');
          console.log('Companies response:', companiesData);
          setCompanies(companiesData.data || []);
          break;
        case 'users':
          console.log('Loading users data...');
          const usersData = await apiRequest('/super-admin/users');
          setUsers(usersData.data || []);
          break;
        case 'knowledge':
          console.log('Loading knowledge data...');
          const knowledgeData = await apiRequest('/super-admin/knowledge-bases');
          setKnowledgeBases(knowledgeData.data || []);
          // Also load platform knowledge
          const platformData = await apiRequest('/super-admin/platform-knowledge');
          setPlatformKnowledge(platformData.data || []);
          break;
        case 'analytics':
          console.log('Loading analytics data...');
          const analyticsData = await apiRequest('/super-admin/analytics');
          setAnalytics(analyticsData.data || null);
          break;
      }
    } catch (error) {
      console.error(`Error loading ${tab} data:`, error);
      // Show fallback data for development
      if (tab === 'overview' || tab === 'companies') {
        setCompanies([
          { id: 1, name: 'The Variable', domain: 'the-variable', industry: 'Design Agency', created_at: new Date().toISOString() },
          { id: 2, name: 'Parrish Tire', domain: 'parrish-tire', industry: 'Automotive', created_at: new Date().toISOString() }
        ]);
      }
      if (tab === 'overview' || tab === 'users') {
        setUsers([
          { id: 1, name: 'Joe Parrish', email: 'joe@thevariable.com', role: 'super_admin', company_name: 'The Variable', created_at: new Date().toISOString() }
        ]);
      }
      if (tab === 'overview' || tab === 'knowledge') {
        setKnowledgeBases([
          { id: 1, filename: 'company-overview.txt', company_name: 'Parrish Tire', file_size: 2048, uploaded_at: new Date().toISOString() }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createCompany = async (e) => {
    e.preventDefault();
    if (!newCompany.name || !newCompany.domain) {
      alert('Please fill in company name and domain');
      return;
    }

    console.log('Creating company:', newCompany);
    console.log('User super admin status:', user?.isSuperAdmin);

    try {
      const { apiRequest } = await import('../utils/api-config');
      const result = await apiRequest('/super-admin/companies', {
        method: 'POST',
        body: JSON.stringify(newCompany)
      });
      
      console.log('Company creation result:', result);
      
      setNewCompany({ name: '', domain: '', industry: '' });
      loadTabData('companies');
      alert('Company created successfully!');
    } catch (error) {
      console.error('Error creating company:', error);
      alert(`Failed to create company: ${error.message}`);
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    if (!newUser.email || !newUser.name || !newUser.companyId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const { apiRequest } = await import('../utils/api-config');
      await apiRequest('/super-admin/users', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      
      setNewUser({ email: '', name: '', companyId: '', role: 'user' });
      loadTabData('users');
      alert('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user. Please try again.');
    }
  };

  const uploadKnowledge = async (e) => {
    e.preventDefault();
    
    console.log('Upload knowledge triggered:', { knowledgeType, knowledgeUpload });
    
    // Validate based on knowledge type
    if (knowledgeType === 'company' && (!knowledgeUpload.companyId || !knowledgeUpload.files)) {
      alert('Please select a company and files to upload');
      return;
    }
    
    if (knowledgeType === 'platform' && !knowledgeUpload.files) {
      alert('Please select files to upload');
      return;
    }

    try {
      const { apiRequest } = await import('../utils/api-config');
      const formData = new FormData();
      
      if (knowledgeType === 'company') {
        formData.append('companyId', knowledgeUpload.companyId);
      }
      
      Array.from(knowledgeUpload.files).forEach((file, index) => {
        formData.append(`file${index}`, file);
      });

      const endpoint = knowledgeType === 'platform' 
        ? '/super-admin/platform-knowledge' 
        : '/super-admin/knowledge';

      console.log('Uploading to endpoint:', endpoint);

      const result = await apiRequest(endpoint, {
        method: 'POST',
        body: formData,
        isFormData: true
      });
      
      console.log('Upload result:', result);
      
      setKnowledgeUpload({ companyId: '', files: null });
      loadTabData('knowledge');
      alert(`${knowledgeType === 'platform' ? 'Platform' : 'Company'} knowledge uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading knowledge:', error);
      alert(`Failed to upload knowledge: ${error.message}`);
    }
  };

  const deleteKnowledge = async (knowledgeId, type = 'company') => {
    if (!confirm(`Are you sure you want to delete this ${type} knowledge entry?`)) return;

    try {
      const { apiRequest } = await import('../utils/api-config');
      const endpoint = type === 'platform' 
        ? `/super-admin/platform-knowledge/${knowledgeId}`
        : `/super-admin/knowledge/${knowledgeId}`;
        
      await apiRequest(endpoint, {
        method: 'DELETE'
      });
      
      loadTabData('knowledge');
      alert(`${type === 'platform' ? 'Platform' : 'Company'} knowledge deleted successfully!`);
    } catch (error) {
      console.error('Error deleting knowledge:', error);
      alert('Failed to delete knowledge. Please try again.');
    }
  };

  // Don't render if not authenticated or not super admin
  if (typeof window !== 'undefined' && (!isAuthenticated || !user?.isSuperAdmin)) {
    return null;
  }

  if (authLoading) {
    return (
      <Layout title="Super Admin | Up, Up, Down, Down">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div className="spinner"></div>
          <div>Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Super Admin Dashboard | Up, Up, Down, Down">
      <div className="page-header">
        <h1 className="page-title">🛠️ Super Admin Dashboard</h1>
        <p className="page-subtitle">Platform management and analytics</p>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #e5e7eb',
          padding: '0 24px'
        }}>
          {[
            { id: 'overview', label: '📊 Overview', icon: '📊' },
            { id: 'companies', label: '🏢 Companies', icon: '🏢' },
            { id: 'users', label: '👥 Users', icon: '👥' },
            { id: 'knowledge', label: '📚 Knowledge', icon: '📚' },
            { id: 'analytics', label: '📈 Analytics', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '16px 20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: activeTab === tab.id ? '#2563eb' : '#6b7280',
                borderBottom: activeTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '24px' }}>
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="spinner"></div>
              <div style={{ marginTop: '16px', color: '#6b7280' }}>Loading...</div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && !isLoading && (
            <div>
              <h3 style={{ marginBottom: '24px', color: '#1f2937' }}>Platform Overview</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '20px' 
              }}>
                <div style={{ 
                  background: '#f8fafc', 
                  padding: '20px', 
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                    {companies.length}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>Total Companies</div>
                </div>
                <div style={{ 
                  background: '#f8fafc', 
                  padding: '20px', 
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                    {users.length}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>Total Users</div>
                </div>
                <div style={{ 
                  background: '#f8fafc', 
                  padding: '20px', 
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                    {knowledgeBases.length}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>Knowledge Bases</div>
                </div>
              </div>
            </div>
          )}

          {/* Companies Tab */}
          {activeTab === 'companies' && !isLoading && (
            <div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '32px', 
                alignItems: 'start' 
              }}>
                <div>
                  <h3 style={{ marginBottom: '16px', color: '#1f2937' }}>Create New Company</h3>
                  <form onSubmit={createCompany} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={newCompany.name}
                      onChange={(e) => setNewCompany(prev => ({ ...prev, name: e.target.value }))}
                      style={{ 
                        padding: '12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Domain (e.g., acme-corp)"
                      value={newCompany.domain}
                      onChange={(e) => setNewCompany(prev => ({ ...prev, domain: e.target.value }))}
                      style={{ 
                        padding: '12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Industry (optional)"
                      value={newCompany.industry}
                      onChange={(e) => setNewCompany(prev => ({ ...prev, industry: e.target.value }))}
                      style={{ 
                        padding: '12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                    <button 
                      type="submit"
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Create Company
                    </button>
                  </form>
                </div>

                <div>
                  <h3 style={{ marginBottom: '16px', color: '#1f2937' }}>Existing Companies</h3>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {companies.map(company => (
                      <div 
                        key={company.id} 
                        style={{ 
                          padding: '12px', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          marginBottom: '8px',
                          background: '#f9fafb'
                        }}
                      >
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>{company.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          Domain: {company.domain} | Industry: {company.industry || 'Not specified'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          Created: {new Date(company.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && !isLoading && (
            <div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '32px', 
                alignItems: 'start' 
              }}>
                <div>
                  <h3 style={{ marginBottom: '16px', color: '#1f2937' }}>Create New User</h3>
                  <form onSubmit={createUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      style={{ 
                        padding: '12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={newUser.name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                      style={{ 
                        padding: '12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                      required
                    />
                    <select
                      value={newUser.companyId}
                      onChange={(e) => setNewUser(prev => ({ ...prev, companyId: e.target.value }))}
                      style={{ 
                        padding: '12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                      required
                    >
                      <option value="">Select Company</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                      ))}
                    </select>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                      style={{ 
                        padding: '12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Company Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                    <button 
                      type="submit"
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Create User
                    </button>
                  </form>
                </div>

                <div>
                  <h3 style={{ marginBottom: '16px', color: '#1f2937' }}>Existing Users</h3>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {users.map(user => (
                      <div 
                        key={user.id} 
                        style={{ 
                          padding: '12px', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          marginBottom: '8px',
                          background: '#f9fafb'
                        }}
                      >
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>{user.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          Email: {user.email} | Role: {user.role}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          Company: {user.company_name} | Joined: {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Knowledge Tab */}
          {activeTab === 'knowledge' && !isLoading && (
            <div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '32px', 
                alignItems: 'start' 
              }}>
                <div>
                  <h3 style={{ marginBottom: '16px', color: '#1f2937' }}>Upload Knowledge</h3>
                  
                  {/* Knowledge Type Selection */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '8px', display: 'block' }}>
                      Knowledge Type
                    </label>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="knowledgeType"
                          value="company"
                          checked={knowledgeType === 'company'}
                          onChange={(e) => setKnowledgeType(e.target.value)}
                        />
                        <span style={{ fontSize: '14px' }}>Company-Specific</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="knowledgeType"
                          value="platform"
                          checked={knowledgeType === 'platform'}
                          onChange={(e) => setKnowledgeType(e.target.value)}
                        />
                        <span style={{ fontSize: '14px' }}>Platform-Wide</span>
                      </label>
                    </div>
                  </div>

                  <form onSubmit={uploadKnowledge} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {knowledgeType === 'company' && (
                      <select
                        value={knowledgeUpload.companyId}
                        onChange={(e) => setKnowledgeUpload(prev => ({ ...prev, companyId: e.target.value }))}
                        style={{ 
                          padding: '12px', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                        required
                      >
                        <option value="">Select Company</option>
                        {companies.map(company => (
                          <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                      </select>
                    )}
                    
                    {knowledgeType === 'platform' && (
                      <div style={{ 
                        padding: '12px', 
                        background: '#eff6ff', 
                        border: '1px solid #3b82f6', 
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#1e40af'
                      }}>
                        📚 Platform-wide knowledge will be available to all companies
                      </div>
                    )}
                    
                    <input
                      type="file"
                      multiple
                      accept=".txt,.pdf,.doc,.docx,.md"
                      onChange={(e) => setKnowledgeUpload(prev => ({ ...prev, files: e.target.files }))}
                      style={{ 
                        padding: '12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                      required
                    />
                    <button 
                      type="submit"
                      style={{
                        background: knowledgeType === 'platform' ? '#7c3aed' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Upload {knowledgeType === 'platform' ? 'Platform' : 'Company'} Knowledge
                    </button>
                  </form>
                </div>

                <div>
                  <h3 style={{ marginBottom: '16px', color: '#1f2937' }}>Knowledge Bases</h3>
                  
                  {/* Platform Knowledge Section */}
                  {platformKnowledge.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ 
                        marginBottom: '12px', 
                        color: '#7c3aed', 
                        fontSize: '16px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        🌐 Platform-Wide Knowledge
                      </h4>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {platformKnowledge.map(kb => (
                          <div 
                            key={`platform-${kb.id}`} 
                            style={{ 
                              padding: '12px', 
                              border: '1px solid #c4b5fd', 
                              borderRadius: '8px',
                              marginBottom: '8px',
                              background: '#f3f4f6'
                            }}
                          >
                            <div style={{ fontWeight: '500', color: '#1f2937' }}>{kb.filename || kb.title}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              Available to all companies | Size: {kb.file_size || 'N/A'} bytes
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              Uploaded: {new Date(kb.uploaded_at || kb.created_at).toLocaleDateString()}
                            </div>
                            <button
                              onClick={() => deleteKnowledge(kb.id, 'platform')}
                              style={{
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                marginTop: '8px'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Company-Specific Knowledge Section */}
                  <div>
                    <h4 style={{ 
                      marginBottom: '12px', 
                      color: '#3b82f6', 
                      fontSize: '16px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      🏢 Company-Specific Knowledge
                    </h4>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {knowledgeBases.map(kb => (
                        <div 
                          key={`company-${kb.id}`} 
                          style={{ 
                            padding: '12px', 
                            border: '1px solid #bfdbfe', 
                            borderRadius: '8px',
                            marginBottom: '8px',
                            background: '#f9fafb'
                          }}
                        >
                          <div style={{ fontWeight: '500', color: '#1f2937' }}>{kb.filename}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            Company: {kb.company_name} | Size: {kb.file_size} bytes
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            Uploaded: {new Date(kb.uploaded_at).toLocaleDateString()}
                          </div>
                          <button
                            onClick={() => deleteKnowledge(kb.id, 'company')}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              marginTop: '8px'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && !isLoading && (
            <div>
              <h3 style={{ marginBottom: '24px', color: '#1f2937' }}>Token Usage Analytics</h3>
              {analytics ? (
                <div>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '20px',
                    marginBottom: '32px'
                  }}>
                    <div style={{ 
                      background: '#f8fafc', 
                      padding: '20px', 
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                        {analytics.totalTokens?.toLocaleString() || 0}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '14px' }}>Total Tokens Used</div>
                    </div>
                    <div style={{ 
                      background: '#f8fafc', 
                      padding: '20px', 
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                        {analytics.activeUsers || 0}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '14px' }}>Active Users (30d)</div>
                    </div>
                    <div style={{ 
                      background: '#f8fafc', 
                      padding: '20px', 
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                        {analytics.contentGenerated || 0}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '14px' }}>Content Generated</div>
                    </div>
                  </div>

                  {analytics.companyUsage && (
                    <div>
                      <h4 style={{ marginBottom: '16px', color: '#1f2937' }}>Usage by Company</h4>
                      <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                        {analytics.companyUsage.map(company => (
                          <div 
                            key={company.company_id}
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              padding: '8px 0',
                              borderBottom: '1px solid #e5e7eb'
                            }}
                          >
                            <span style={{ fontWeight: '500' }}>{company.company_name}</span>
                            <span>{company.tokens?.toLocaleString() || 0} tokens</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
                  No analytics data available
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SuperAdminDashboard;