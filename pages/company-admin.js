import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

const CompanyAdminDashboard = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  
  // State for different sections
  const [companyUsers, setCompanyUsers] = useState([]);
  const [companyKnowledge, setCompanyKnowledge] = useState([]);
  const [companyAnalytics, setCompanyAnalytics] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  
  // Form states
  const [newUser, setNewUser] = useState({ email: '', name: '', role: 'user', password: '' });
  const [knowledgeUpload, setKnowledgeUpload] = useState({ files: null, category: 'general' });
  
  // Edit states
  const [editingUser, setEditingUser] = useState(null);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);

  // Check if user is company admin
  const isCompanyAdmin = user?.role === 'company_admin' || user?.role === 'admin';

  // Redirect if not authenticated or not company admin
  useEffect(() => {
    if (typeof window !== 'undefined' && !authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      if (!isCompanyAdmin) {
        router.push('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, isCompanyAdmin, authLoading, router]);

  // Load data when tab changes
  useEffect(() => {
    if (isAuthenticated && isCompanyAdmin) {
      loadTabData(activeTab);
    }
  }, [activeTab, isAuthenticated, isCompanyAdmin]);

  const loadTabData = async (tab) => {
    if (!isAuthenticated || !isCompanyAdmin) {
      console.log('Access denied - not authenticated or not company admin:', { isAuthenticated, isCompanyAdmin, userRole: user?.role });
      return;
    }
    
    setIsLoading(true);
    try {
      const { apiRequest } = await import('../utils/api-config');
      
      console.log(`Loading ${tab} data for company admin...`);
      
      switch (tab) {
        case 'overview':
          // Load overview data for company
          console.log('Loading company overview data...');
          const overviewUsers = await apiRequest('/company-admin/users');
          const overviewKnowledge = await apiRequest('/company-admin/knowledge');
          const overviewAnalytics = await apiRequest('/company-admin/analytics');
          setCompanyUsers(overviewUsers.data || []);
          setCompanyKnowledge(overviewKnowledge.data || []);
          setCompanyAnalytics(overviewAnalytics.data || null);
          break;
        case 'users':
          console.log('Loading company users data...');
          const usersData = await apiRequest('/company-admin/users');
          setCompanyUsers(usersData.data || []);
          break;
        case 'knowledge':
          console.log('Loading company knowledge data...');
          const knowledgeData = await apiRequest('/company-admin/knowledge');
          setCompanyKnowledge(knowledgeData.data || []);
          break;
        case 'analytics':
          console.log('Loading company analytics data...');
          const analyticsData = await apiRequest('/company-admin/analytics');
          setCompanyAnalytics(analyticsData.data || null);
          break;
        case 'settings':
          console.log('Loading company settings data...');
          const settingsData = await apiRequest('/company-admin/settings');
          setCompanySettings(settingsData.data || null);
          break;
      }
    } catch (error) {
      console.error(`Error loading ${tab} data:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.email || !newUser.name || !newUser.password) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const { apiRequest } = await import('../utils/api-config');
      await apiRequest('/company-admin/users', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      
      setNewUser({ email: '', name: '', role: 'user', password: '' });
      loadTabData('users');
      alert('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (userId) => {
    setIsLoading(true);
    try {
      const { apiRequest } = await import('../utils/api-config');
      await apiRequest(`/company-admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(editingUser)
      });
      
      setEditingUser(null);
      loadTabData('users');
      alert('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!showDeleteConfirm || showDeleteConfirm !== userId) {
      setShowDeleteConfirm(userId);
      return;
    }

    setIsLoading(true);
    try {
      const { apiRequest } = await import('../utils/api-config');
      await apiRequest(`/company-admin/users/${userId}`, {
        method: 'DELETE'
      });
      
      setShowDeleteConfirm(null);
      loadTabData('users');
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadKnowledge = async (e) => {
    e.preventDefault();
    if (!knowledgeUpload.files || knowledgeUpload.files.length === 0) {
      alert('Please select files to upload');
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);
    
    try {
      const { apiRequest } = await import('../utils/api-config');
      
      const formData = new FormData();
      for (let i = 0; i < knowledgeUpload.files.length; i++) {
        formData.append('files', knowledgeUpload.files[i]);
      }
      formData.append('category', knowledgeUpload.category);
      
      await apiRequest('/company-admin/knowledge', {
        method: 'POST',
        body: formData,
        isFormData: true
      });
      
      setKnowledgeUpload({ files: null, category: 'general' });
      setUploadProgress(null);
      loadTabData('knowledge');
      alert('Knowledge uploaded successfully!');
    } catch (error) {
      console.error('Error uploading knowledge:', error);
      alert('Failed to upload knowledge: ' + error.message);
      setUploadProgress(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKnowledge = async (knowledgeId) => {
    if (!showDeleteConfirm || showDeleteConfirm !== knowledgeId) {
      setShowDeleteConfirm(knowledgeId);
      return;
    }

    setIsLoading(true);
    try {
      const { apiRequest } = await import('../utils/api-config');
      await apiRequest(`/company-admin/knowledge/${knowledgeId}`, {
        method: 'DELETE'
      });
      
      setShowDeleteConfirm(null);
      loadTabData('knowledge');
      alert('Knowledge deleted successfully!');
    } catch (error) {
      console.error('Error deleting knowledge:', error);
      alert('Failed to delete knowledge: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render anything on server side or if not authenticated
  if (typeof window === 'undefined' || authLoading || !isAuthenticated || !isCompanyAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="company-admin-dashboard">
        <div className="header">
          <h1>Company Administration</h1>
          <p>Manage your company's users and knowledge base</p>
        </div>

        <div className="tab-navigation">
          {['overview', 'users', 'knowledge', 'analytics', 'settings'].map(tab => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              disabled={isLoading}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>Loading...</p>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="overview-section">
              <h2>Company Overview</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Users</h3>
                  <p className="stat-number">{companyUsers.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Knowledge Items</h3>
                  <p className="stat-number">{companyKnowledge.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Active Users</h3>
                  <p className="stat-number">{companyUsers.filter(u => u.status === 'active').length}</p>
                </div>
                <div className="stat-card">
                  <h3>Company Admins</h3>
                  <p className="stat-number">{companyUsers.filter(u => u.role === 'company_admin' || u.role === 'admin').length}</p>
                </div>
              </div>
              
              {companyAnalytics && (
                <div className="analytics-preview">
                  <h3>Recent Activity</h3>
                  <p>Content generated: {companyAnalytics.content_generated || 0}</p>
                  <p>Templates used: {companyAnalytics.templates_used || 0}</p>
                  <p>Last active: {companyAnalytics.last_activity_date || 'N/A'}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-section">
              <h2>User Management</h2>
              
              <div className="section-actions">
                <form onSubmit={handleCreateUser} className="create-user-form">
                  <h3>Add New User</h3>
                  <div className="form-row">
                    <input
                      type="email"
                      placeholder="Email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      required
                    />
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    >
                      <option value="user">User</option>
                      <option value="company_admin">Company Admin</option>
                    </select>
                    <input
                      type="password"
                      placeholder="Password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      required
                    />
                    <button type="submit" disabled={isLoading}>
                      Add User
                    </button>
                  </div>
                </form>
              </div>

              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyUsers.map(user => (
                      <tr key={user.id}>
                        <td>
                          {editingUser?.id === user.id ? (
                            <input
                              type="text"
                              value={editingUser.name}
                              onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                            />
                          ) : (
                            user.name || 'No name'
                          )}
                        </td>
                        <td>{user.email}</td>
                        <td>
                          {editingUser?.id === user.id ? (
                            <select
                              value={editingUser.role}
                              onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                            >
                              <option value="user">User</option>
                              <option value="company_admin">Company Admin</option>
                            </select>
                          ) : (
                            <span className={`role-badge ${user.role}`}>
                              {user.role.replace('_', ' ')}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${user.status || 'active'}`}>
                            {user.status || 'active'}
                          </span>
                        </td>
                        <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          {editingUser?.id === user.id ? (
                            <div className="edit-actions">
                              <button onClick={() => handleUpdateUser(user.id)} disabled={isLoading}>
                                Save
                              </button>
                              <button onClick={() => setEditingUser(null)}>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="user-actions">
                              <button onClick={() => setEditingUser(user)} className="edit-btn">
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(user.id)} 
                                className={`delete-btn ${showDeleteConfirm === user.id ? 'confirm' : ''}`}
                              >
                                {showDeleteConfirm === user.id ? 'Confirm?' : 'Delete'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="knowledge-section">
              <h2>Knowledge Base Management</h2>
              
              <div className="section-actions">
                <form onSubmit={handleUploadKnowledge} className="upload-form">
                  <h3>Upload Knowledge</h3>
                  <div className="form-row">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.txt,.doc,.docx,.md"
                      onChange={(e) => setKnowledgeUpload({...knowledgeUpload, files: e.target.files})}
                      required
                    />
                    <select
                      value={knowledgeUpload.category}
                      onChange={(e) => setKnowledgeUpload({...knowledgeUpload, category: e.target.value})}
                    >
                      <option value="general">General</option>
                      <option value="products">Products & Services</option>
                      <option value="processes">Processes & Procedures</option>
                      <option value="policies">Policies & Guidelines</option>
                      <option value="training">Training Materials</option>
                    </select>
                    <button type="submit" disabled={isLoading}>
                      Upload Files
                    </button>
                  </div>
                  {uploadProgress !== null && (
                    <div className="upload-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{width: `${uploadProgress}%`}}></div>
                      </div>
                      <p>{uploadProgress}% uploaded</p>
                    </div>
                  )}
                </form>
              </div>

              <div className="knowledge-table">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Size</th>
                      <th>Uploaded</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyKnowledge.map(item => (
                      <tr key={item.id}>
                        <td>{item.title || item.filename}</td>
                        <td>
                          <span className={`category-badge ${item.category}`}>
                            {item.category}
                          </span>
                        </td>
                        <td>{item.file_type || 'Document'}</td>
                        <td>{item.file_size ? (item.file_size / 1024).toFixed(1) + ' KB' : 'N/A'}</td>
                        <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          <button 
                            onClick={() => handleDeleteKnowledge(item.id)} 
                            className={`delete-btn ${showDeleteConfirm === item.id ? 'confirm' : ''}`}
                          >
                            {showDeleteConfirm === item.id ? 'Confirm?' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics-section">
              <h2>Company Analytics</h2>
              {companyAnalytics ? (
                <div className="analytics-content">
                  <div className="analytics-stats">
                    <div className="stat-group">
                      <h3>Content Generation</h3>
                      <p>Total content generated: {companyAnalytics.content_generated || 0}</p>
                      <p>Templates used: {companyAnalytics.templates_used || 0}</p>
                      <p>AI assists triggered: {companyAnalytics.ai_assists || 0}</p>
                    </div>
                    <div className="stat-group">
                      <h3>User Activity</h3>
                      <p>Total users: {companyAnalytics.total_users || 0}</p>
                      <p>Active users (30 days): {companyAnalytics.active_users || 0}</p>
                      <p>Last activity: {companyAnalytics.last_activity_date || 'N/A'}</p>
                    </div>
                    <div className="stat-group">
                      <h3>Knowledge Base</h3>
                      <p>Total documents: {companyAnalytics.knowledge_count || 0}</p>
                      <p>Storage used: {companyAnalytics.storage_used || '0 MB'}</p>
                      <p>Last upload: {companyAnalytics.last_upload_date || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p>Loading analytics data...</p>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-section">
              <h2>Company Settings</h2>
              <div className="settings-content">
                <h3>Company Information</h3>
                <p>Company: {user?.companyName || 'N/A'}</p>
                <p>Industry: {user?.industry || 'N/A'}</p>
                <p>Role: {user?.role}</p>
                
                <h3>Account Management</h3>
                <p>Manage your company's subscription and billing settings.</p>
                <p>Contact support for changes to company profile.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .company-admin-dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .header {
          margin-bottom: 30px;
        }

        .header h1 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .header p {
          margin: 0;
          color: #666;
        }

        .tab-navigation {
          display: flex;
          gap: 4px;
          margin-bottom: 24px;
          border-bottom: 2px solid #e0e0e0;
        }

        .tab {
          padding: 12px 24px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          color: #666;
          transition: all 0.2s ease;
        }

        .tab:hover {
          color: #333;
          background-color: #f5f5f5;
        }

        .tab.active {
          color: #007bff;
          border-bottom-color: #007bff;
          background-color: #f8f9ff;
        }

        .tab:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .tab-content {
          position: relative;
          min-height: 400px;
        }

        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 10px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .stat-card h3 {
          margin: 0 0 10px 0;
          color: #666;
          font-size: 14px;
          font-weight: 500;
        }

        .stat-number {
          margin: 0;
          font-size: 36px;
          font-weight: bold;
          color: #007bff;
        }

        .analytics-preview {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .analytics-preview h3 {
          margin: 0 0 15px 0;
          color: #333;
        }

        .analytics-preview p {
          margin: 5px 0;
          color: #666;
        }

        .section-actions {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .create-user-form h3,
        .upload-form h3 {
          margin: 0 0 15px 0;
          color: #333;
        }

        .form-row {
          display: flex;
          gap: 10px;
          align-items: end;
          flex-wrap: wrap;
        }

        .form-row input,
        .form-row select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          min-width: 150px;
        }

        .form-row button {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          white-space: nowrap;
        }

        .form-row button:hover {
          background: #0056b3;
        }

        .form-row button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .upload-progress {
          margin-top: 10px;
          width: 100%;
        }

        .progress-bar {
          width: 100%;
          height: 20px;
          background: #f0f0f0;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 5px;
        }

        .progress-fill {
          height: 100%;
          background: #007bff;
          transition: width 0.3s ease;
        }

        .users-table,
        .knowledge-table {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: #f8f9fa;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #e0e0e0;
        }

        td {
          padding: 12px;
          border-bottom: 1px solid #e0e0e0;
          vertical-align: top;
        }

        tr:hover {
          background: #f8f9fa;
        }

        .role-badge,
        .status-badge,
        .category-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .role-badge.user {
          background: #e3f2fd;
          color: #1976d2;
        }

        .role-badge.company_admin {
          background: #f3e5f5;
          color: #7b1fa2;
        }

        .status-badge.active {
          background: #e8f5e8;
          color: #2e7d32;
        }

        .status-badge.inactive {
          background: #ffebee;
          color: #c62828;
        }

        .category-badge {
          background: #fff3e0;
          color: #ef6c00;
        }

        .user-actions,
        .edit-actions {
          display: flex;
          gap: 8px;
        }

        .edit-btn,
        .delete-btn {
          padding: 4px 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .edit-btn {
          background: #e3f2fd;
          color: #1976d2;
        }

        .edit-btn:hover {
          background: #bbdefb;
        }

        .delete-btn {
          background: #ffebee;
          color: #c62828;
        }

        .delete-btn:hover {
          background: #ffcdd2;
        }

        .delete-btn.confirm {
          background: #c62828;
          color: white;
        }

        .edit-actions button {
          padding: 4px 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .edit-actions button:first-child {
          background: #4caf50;
          color: white;
        }

        .edit-actions button:last-child {
          background: #f44336;
          color: white;
        }

        .analytics-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .stat-group {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .stat-group h3 {
          margin: 0 0 15px 0;
          color: #333;
          border-bottom: 2px solid #007bff;
          padding-bottom: 5px;
        }

        .stat-group p {
          margin: 8px 0;
          color: #666;
        }

        .settings-content {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .settings-content h3 {
          margin: 0 0 15px 0;
          color: #333;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 5px;
        }

        .settings-content p {
          margin: 8px 0;
          color: #666;
        }

        @media (max-width: 768px) {
          .form-row {
            flex-direction: column;
          }

          .form-row input,
          .form-row select,
          .form-row button {
            width: 100%;
            min-width: auto;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .tab-navigation {
            flex-wrap: wrap;
          }

          .tab {
            flex: 1;
            min-width: 100px;
          }
        }
      `}</style>
    </Layout>
  );
};

export default CompanyAdminDashboard;