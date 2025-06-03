import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';

const PlatformKnowledgeAdmin = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    content: '',
    documentType: 'industry_standards',
    category: 'general',
    tags: ''
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && !loading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (!loading && isAuthenticated) {
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
        loadPlatformKnowledge();
      } else {
        // Redirect non-super-admins
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error verifying super admin access:', error);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlatformKnowledge = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/super-admin/knowledge', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.knowledge) {
          setKnowledgeList(data.data.knowledge);
        } else {
          throw new Error(data.message || 'Failed to load platform knowledge');
        }
      } else {
        throw new Error('Network response was not ok');
      }
    } catch (error) {
      console.error('Error loading platform knowledge:', error);
      // For development, use mock data
      setKnowledgeList([
        {
          id: 1,
          title: 'Industry Best Practices 2024',
          document_type: 'industry_standards',
          category: 'general',
          tags: ['standards', 'compliance', 'best-practices'],
          created_at: '2024-01-15T10:30:00Z',
          created_by_super_admin: 'admin@upup.ai',
          size_kb: 1240
        },
        {
          id: 2,
          title: 'GDPR Compliance Guidelines',
          document_type: 'compliance',
          category: 'legal',
          tags: ['gdpr', 'compliance', 'legal', 'privacy'],
          created_at: '2024-01-10T14:20:00Z',
          created_by_super_admin: 'admin@upup.ai',
          size_kb: 980
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUploadForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagsChange = (e) => {
    const tagsValue = e.target.value;
    setUploadForm(prev => ({
      ...prev,
      tags: tagsValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.title.trim() || !uploadForm.content.trim()) {
      alert('Please provide both title and content');
      return;
    }
    
    setIsLoading(true);
    try {
      // Convert tags string to array
      const processedTags = uploadForm.tags
        ? uploadForm.tags.split(',').map(tag => tag.trim())
        : [];
      
      const formData = {
        ...uploadForm,
        tags: processedTags
      };
      
      const response = await fetch('/api/super-admin/knowledge', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Platform knowledge created successfully!');
          setKnowledgeList(prev => [data.data, ...prev]);
          setShowUploadForm(false);
          setUploadForm({
            title: '',
            content: '',
            documentType: 'industry_standards',
            category: 'general',
            tags: ''
          });
          loadPlatformKnowledge();
        } else {
          throw new Error(data.message || 'Failed to create knowledge');
        }
      } else {
        throw new Error('Network response was not ok');
      }
    } catch (error) {
      console.error('Error creating platform knowledge:', error);
      alert(`Failed to create platform knowledge: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteKnowledge = async (id) => {
    if (!confirm('Are you sure you want to delete this platform knowledge? This action cannot be undone.')) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/super-admin/knowledge/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Platform knowledge deleted successfully');
          setKnowledgeList(prev => prev.filter(item => item.id !== id));
        } else {
          throw new Error(data.message || 'Failed to delete knowledge');
        }
      } else {
        throw new Error('Network response was not ok');
      }
    } catch (error) {
      console.error('Error deleting platform knowledge:', error);
      alert(`Failed to delete: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || (isAuthenticated && !isSuperAdmin && isLoading)) {
    return (
      <Layout title="Loading...">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading platform knowledge...</p>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return null; // Will redirect
  }

  return (
    <Layout title="Platform Knowledge | Super Admin">
      <div className="platform-knowledge-page">
        <div className="page-header">
          <h1 className="page-title">📚 Platform Knowledge Management</h1>
          <p className="page-subtitle">Manage global knowledge available to all tenants</p>
          <div className="header-actions">
            <button 
              className="action-button" 
              onClick={() => setShowUploadForm(true)}
              disabled={isLoading}
            >
              + Add Platform Knowledge
            </button>
          </div>
        </div>

        <div className="knowledge-categories">
          <div className="category-card">
            <h4>📋 Industry Standards</h4>
            <p>Best practices and compliance guidelines</p>
            <div className="category-stats">
              {knowledgeList.filter(k => k.document_type === 'industry_standards').length} documents
            </div>
          </div>
          <div className="category-card">
            <h4>⚖️ Legal Compliance</h4>
            <p>Regulatory compliance documents</p>
            <div className="category-stats">
              {knowledgeList.filter(k => k.document_type === 'compliance').length} documents
            </div>
          </div>
          <div className="category-card">
            <h4>🏆 Best Practices</h4>
            <p>Industry best practices and standards</p>
            <div className="category-stats">
              {knowledgeList.filter(k => k.document_type === 'best_practices').length} documents
            </div>
          </div>
          <div className="category-card">
            <h4>📑 Templates</h4>
            <p>Global template documents</p>
            <div className="category-stats">
              {knowledgeList.filter(k => k.document_type === 'templates').length} documents
            </div>
          </div>
        </div>

        {showUploadForm && (
          <div className="upload-form">
            <div className="form-header">
              <h3>📤 Add New Platform Knowledge</h3>
              <button className="close-btn" onClick={() => setShowUploadForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="input-field">
                  <label>Title</label>
                  <input
                    type="text"
                    name="title"
                    value={uploadForm.title}
                    onChange={handleInputChange}
                    placeholder="Industry Best Practices, Compliance Guidelines, etc."
                    required
                  />
                </div>
                <div className="input-field">
                  <label>Document Type</label>
                  <select
                    name="documentType"
                    value={uploadForm.documentType}
                    onChange={handleInputChange}
                  >
                    <option value="industry_standards">Industry Standards</option>
                    <option value="compliance">Compliance</option>
                    <option value="best_practices">Best Practices</option>
                    <option value="templates">Templates</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="input-field">
                  <label>Category</label>
                  <select
                    name="category"
                    value={uploadForm.category}
                    onChange={handleInputChange}
                  >
                    <option value="general">General</option>
                    <option value="hr">HR</option>
                    <option value="legal">Legal</option>
                    <option value="sales">Sales</option>
                    <option value="marketing">Marketing</option>
                    <option value="finance">Finance</option>
                  </select>
                </div>
                <div className="input-field">
                  <label>Tags (comma separated)</label>
                  <input
                    type="text"
                    name="tags"
                    value={uploadForm.tags}
                    onChange={handleTagsChange}
                    placeholder="compliance, standards, best-practices"
                  />
                </div>
              </div>

              <div className="input-field">
                <label>Content</label>
                <textarea
                  name="content"
                  value={uploadForm.content}
                  onChange={handleInputChange}
                  placeholder="Enter the knowledge content that will be available platform-wide..."
                  rows={8}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowUploadForm(false)}>Cancel</button>
                <button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Knowledge'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="knowledge-list">
          <h3>Platform Knowledge Documents</h3>
          {isLoading ? (
            <div className="loading">Loading platform knowledge...</div>
          ) : knowledgeList.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No Platform Knowledge Yet</h3>
              <p>Add your first platform-wide document to enhance AI responses for all tenants.</p>
              <button className="action-button" onClick={() => setShowUploadForm(true)}>
                + Add First Knowledge Document
              </button>
            </div>
          ) : (
            <div className="knowledge-grid">
              {knowledgeList.map((item) => (
                <div key={item.id} className="knowledge-card">
                  <div className="knowledge-header">
                    <div className="knowledge-meta">
                      <div className={`knowledge-type ${item.document_type}`}>
                        {item.document_type?.replace(/_/g, ' ')}
                      </div>
                      <div className="knowledge-category">
                        {item.category}
                      </div>
                    </div>
                    <div className="knowledge-actions">
                      <button 
                        className="delete-btn"
                        onClick={() => deleteKnowledge(item.id)}
                        title="Delete knowledge"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="knowledge-content">
                    <h3>{item.title}</h3>
                    <div className="knowledge-stats">
                      <span>📊 {item.size_kb || 0}KB</span>
                      <span>👤 {item.created_by_super_admin || 'Admin'}</span>
                      <span>📅 {new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="knowledge-tags">
                        {item.tags.map((tag, i) => (
                          <span key={i} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .platform-knowledge-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .page-header {
          margin-bottom: 24px;
        }
        
        .page-title {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 8px 0;
        }
        
        .page-subtitle {
          color: #64748b;
          font-size: 16px;
          margin: 0 0 16px 0;
        }
        
        .header-actions {
          margin-top: 16px;
        }
        
        .action-button {
          background: #10b981;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .action-button:hover {
          background: #059669;
        }
        
        .knowledge-categories {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
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
        
        .upload-form {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .form-header h3 {
          margin: 0;
          color: #1e293b;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #64748b;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .input-field {
          margin-bottom: 16px;
        }
        
        .input-field label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
          color: #374151;
        }
        
        .input-field input,
        .input-field select,
        .input-field textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }
        
        .input-field textarea {
          resize: vertical;
          min-height: 120px;
        }
        
        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        
        .form-actions button {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
        }
        
        .form-actions button[type="button"] {
          background: #f3f4f6;
          color: #374151;
        }
        
        .form-actions button[type="submit"] {
          background: #10b981;
          color: white;
        }
        
        .knowledge-list {
          margin-top: 32px;
        }
        
        .knowledge-list h3 {
          margin: 0 0 16px 0;
          color: #1e293b;
          font-size: 20px;
        }
        
        .knowledge-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 16px;
        }
        
        .knowledge-card {
          background: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border-left: 4px solid #3b82f6;
        }
        
        .knowledge-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        
        .knowledge-meta {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .knowledge-type {
          text-transform: capitalize;
          font-size: 12px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
        }
        
        .knowledge-type.industry_standards {
          background: #dbeafe;
          color: #2563eb;
        }
        
        .knowledge-type.compliance {
          background: #fef9c3;
          color: #ca8a04;
        }
        
        .knowledge-type.best_practices {
          background: #dcfce7;
          color: #16a34a;
        }
        
        .knowledge-type.templates {
          background: #f3e8ff;
          color: #9333ea;
        }
        
        .knowledge-category {
          font-size: 12px;
          color: #64748b;
          text-transform: capitalize;
        }
        
        .knowledge-actions {
          display: flex;
          gap: 8px;
        }
        
        .delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #ef4444;
          font-size: 16px;
          padding: 4px;
          border-radius: 4px;
        }
        
        .delete-btn:hover {
          background: #fee2e2;
        }
        
        .knowledge-content h3 {
          margin: 0 0 8px 0;
          color: #1e293b;
          font-size: 16px;
        }
        
        .knowledge-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 12px;
          color: #64748b;
          margin-bottom: 8px;
        }
        
        .knowledge-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }
        
        .tag {
          background: #f1f5f9;
          color: #64748b;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 12px;
        }
        
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .empty-state h3 {
          margin-bottom: 8px;
        }
        
        .empty-state p {
          color: #64748b;
          margin-bottom: 24px;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
          color: #64748b;
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

export default PlatformKnowledgeAdmin;