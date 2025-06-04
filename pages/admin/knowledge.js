import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';

const CompanyKnowledgeAdmin = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    content: '',
    documentType: 'general',
    metadata: {}
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMode, setUploadMode] = useState('text'); // 'text' or 'file'

  const loadCompanyKnowledge = useCallback(async () => {
    setIsLoading(true);
    try {
      const { apiRequest, apiConfig } = await import('../../utils/api-config');
      
      const response = await apiRequest('/knowledge/company', {
        method: 'GET'
      });
      
      if (response.success) {
        // Check if response.data has a knowledge property or if it's a direct array
        const knowledgeData = response.data.knowledge || response.data || [];
        console.log('Knowledge data retrieved:', knowledgeData);
        setKnowledgeList(knowledgeData);
      } else {
        console.error('Failed to load company knowledge:', response.message);
      }
    } catch (error) {
      console.error('Error loading company knowledge:', error);
      // For now, use mock data
      setKnowledgeList([
        {
          id: 1,
          title: 'Brand Guidelines 2024',
          document_type: 'brand_guide',
          created_at: '2024-01-15T10:30:00Z',
          created_by_name: 'Sarah Johnson',
          size_kb: 2450
        },
        {
          id: 2,
          title: 'Company Policies & Procedures',
          document_type: 'policy',
          created_at: '2024-01-10T14:20:00Z',
          created_by_name: 'Mike Chen',
          size_kb: 1890
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !loading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Check if user has company admin permissions
    if (!loading && isAuthenticated && user && !['admin', 'company_admin'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }
    
    if (!loading && isAuthenticated && user && knowledgeList.length === 0) {
      loadCompanyKnowledge();
    }
  }, [isAuthenticated, loading, user?.id, user?.role, loadCompanyKnowledge, knowledgeList.length]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== UPLOAD SUBMIT DEBUG ===');
    console.log('Upload form:', uploadForm);
    console.log('Upload mode:', uploadMode);
    console.log('Selected file:', selectedFile);
    console.log('User authenticated:', isAuthenticated);
    console.log('User info:', user);
    
    // Check authentication before proceeding
    if (!isAuthenticated || !user) {
      alert('Please log in before uploading to the knowledge base.');
      return;
    }
    
    // Small delay to ensure auth is fully processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Validate based on upload mode
    if (!uploadForm.title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    if (uploadMode === 'text' && !uploadForm.content.trim()) {
      alert('Please enter content or switch to file upload');
      return;
    }
    
    if (uploadMode === 'file' && !selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting API request...');
      const { apiRequest, getAuthHeaders } = await import('../../utils/api-config');
      
      // Debug: Check what auth headers we have
      const authHeaders = await getAuthHeaders();
      console.log('Auth headers:', authHeaders);
      
      let response;
      
      if (uploadMode === 'file') {
        // File upload using FormData
        const formData = new FormData();
        formData.append('title', uploadForm.title);
        formData.append('documentType', uploadForm.documentType);
        formData.append('document', selectedFile);
        if (uploadForm.content.trim()) {
          formData.append('content', uploadForm.content); // Optional additional content
        }
        
        console.log('Making file upload request with FormData...');
        response = await apiRequest('/knowledge/company', {
          method: 'POST',
          body: formData,
          headers: {} // Remove Content-Type to let browser set it for FormData
        });
        console.log('File upload response:', response);
      } else {
        // Text upload using JSON
        console.log('Making text upload request with JSON...');
        response = await apiRequest('/knowledge/company', {
          method: 'POST',
          body: JSON.stringify(uploadForm)
        });
        console.log('Text upload response:', response);
      }
      
      if (response.success) {
        alert('Company knowledge uploaded successfully!');
        
        // Add the uploaded item directly to the list (since Vercel can't persist files)
        if (response.data) {
          console.log('Upload response data:', response.data);
          // Handle different response formats
          const newItem = response.data.id ? response.data : (response.data.knowledge && response.data.knowledge[0]);
          if (newItem) {
            setKnowledgeList(prev => [newItem, ...prev]);
          }
        }
        
        setShowUploadForm(false);
        setUploadForm({ title: '', content: '', documentType: 'general', metadata: {} });
        setSelectedFile(null);
        setUploadMode('text');
        
        // Note: Not reloading from server since Vercel doesn't persist files
        // The item has been added to the local list above
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading knowledge:', error);
      alert(`Upload failed: ${error.message || 'Please try again'}`);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    
    // Auto-fill title from filename if title is empty
    if (file && !uploadForm.title.trim()) {
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      setUploadForm(prev => ({
        ...prev,
        title: fileName
      }));
    }
  };

  const deleteKnowledge = async (id) => {
    if (!confirm('Are you sure you want to delete this knowledge item?')) return;
    
    // Check if this is a mock item or temporary item
    const item = knowledgeList.find(k => k.id === id);
    if (item && (item.is_mock || item.is_temporary)) {
      // For mock/temporary items, just remove from local state
      setKnowledgeList(prev => prev.filter(k => k.id !== id));
      alert(item.is_mock ? 'Sample knowledge item removed' : 'Knowledge item removed');
      return;
    }
    
    try {
      const { apiRequest } = await import('../../utils/api-config');
      
      const response = await apiRequest(`/knowledge/company/${id}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        alert('Knowledge deleted successfully');
        setKnowledgeList(prev => prev.filter(k => k.id !== id));
        loadCompanyKnowledge();
      } else {
        throw new Error(response.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting knowledge:', error);
      alert('Delete failed. Please try again.');
    }
  };

  if (typeof window === 'undefined' || !isAuthenticated) {
    return null;
  }

  return (
    <Layout title="Company Knowledge | Up, Up, Down, Down">
      <div className="page-header">
        <h1 className="page-title">📖 Company Knowledge Base</h1>
        <p className="page-subtitle">Manage your organization's foundational knowledge and documents</p>
        <div className="header-actions">
          <button 
            className="action-button" 
            onClick={() => setShowUploadForm(true)}
            disabled={isLoading}
          >
            + Add Knowledge
          </button>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-group">
          <div className="stat-number">{knowledgeList.length}</div>
          <div className="stat-label">Knowledge Items</div>
        </div>
        <div className="stat-group">
          <div className="stat-number">
            {knowledgeList.reduce((total, item) => total + (item.size_kb || 0), 0)}KB
          </div>
          <div className="stat-label">Total Size</div>
        </div>
        <div className="stat-group">
          <div className="stat-number">Company-wide</div>
          <div className="stat-label">Visibility</div>
        </div>
        <div className="stat-group">
          <div className="stat-number">Enhanced AI</div>
          <div className="stat-label">Context Active</div>
        </div>
      </div>

      {showUploadForm && (
        <div className="upload-form">
          <div className="form-header">
            <h3>📤 Upload New Company Knowledge</h3>
            <button className="close-btn" onClick={() => setShowUploadForm(false)}>×</button>
          </div>
          <form onSubmit={handleUploadSubmit}>
            <div className="upload-mode-toggle">
              <button
                type="button"
                className={uploadMode === 'text' ? 'active' : ''}
                onClick={() => setUploadMode('text')}
              >
                📝 Text Input
              </button>
              <button
                type="button"
                className={uploadMode === 'file' ? 'active' : ''}
                onClick={() => setUploadMode('file')}
              >
                📄 File Upload
              </button>
            </div>

            <div className="form-row">
              <div className="input-field">
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  value={uploadForm.title}
                  onChange={handleInputChange}
                  placeholder="Brand Guidelines 2024, Company Policies, etc."
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
                  <option value="general">General</option>
                  <option value="brand_guide">Brand Guidelines</option>
                  <option value="policy">Company Policy</option>
                  <option value="product_info">Product Information</option>
                  <option value="process">Process Documentation</option>
                  <option value="template">Template</option>
                </select>
              </div>
            </div>

            {uploadMode === 'file' && (
              <div className="input-field">
                <label>Upload Document</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md"
                  onChange={handleFileChange}
                  className="file-input"
                />
                {selectedFile && (
                  <div className="file-info">
                    <span>📎 {selectedFile.name}</span>
                    <span>({Math.round(selectedFile.size / 1024)}KB)</span>
                  </div>
                )}
                <div className="file-help">
                  Supported: PDF, DOC, DOCX, TXT, MD files (max 10MB)
                </div>
              </div>
            )}

            <div className="input-field">
              <label>
                {uploadMode === 'file' ? 'Additional Notes (Optional)' : 'Content'}
              </label>
              <textarea
                name="content"
                value={uploadForm.content}
                onChange={handleInputChange}
                placeholder={
                  uploadMode === 'file' 
                    ? "Add any additional context or notes about this document..."
                    : "Enter the knowledge content that will enhance AI responses for your team..."
                }
                rows={uploadMode === 'file' ? 4 : 8}
                required={uploadMode === 'text'}
              />
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setShowUploadForm(false)}>Cancel</button>
              <button type="submit" disabled={isLoading}>
                {isLoading ? 'Uploading...' : `Upload ${uploadMode === 'file' ? 'Document' : 'Knowledge'}`}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="knowledge-grid">
        {isLoading ? (
          <div className="loading">Loading knowledge base...</div>
        ) : knowledgeList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No Company Knowledge Yet</h3>
            <p>Upload your first company document to enhance AI responses for your team.</p>
            <button className="action-button" onClick={() => setShowUploadForm(true)}>
              + Add First Knowledge Item
            </button>
          </div>
        ) : (
          knowledgeList.map((item) => (
            <div key={item.id} className="knowledge-card">
              <div className="knowledge-header">
                <div className="knowledge-meta">
                  <div className="knowledge-type">{item.document_type?.replace('_', ' ')}</div>
                  <div className="knowledge-date">
                    {new Date(item.created_at).toLocaleDateString()}
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
                  <span>👤 {item.created_by_name || 'Unknown'}</span>
                  <span>🤖 AI Enhanced</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .stats-bar {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-group {
          text-align: center;
        }

        .stat-number {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
        }

        .stat-label {
          color: #64748b;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
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
          grid-template-columns: 2fr 1fr;
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
          background: #3b82f6;
          color: white;
        }

        .upload-mode-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 4px;
          background: #f9fafb;
        }

        .upload-mode-toggle button {
          flex: 1;
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: #6b7280;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .upload-mode-toggle button.active {
          background: white;
          color: #1f2937;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .file-input {
          width: 100%;
          padding: 8px 12px;
          border: 2px dashed #d1d5db;
          border-radius: 6px;
          background: #f9fafb;
          font-size: 14px;
          cursor: pointer;
        }

        .file-input:hover {
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .file-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
          padding: 8px 12px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 4px;
          font-size: 12px;
          color: #166534;
        }

        .file-help {
          font-size: 11px;
          color: #6b7280;
          margin-top: 4px;
          font-style: italic;
        }

        .knowledge-grid {
          display: grid;
          gap: 16px;
        }

        .knowledge-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
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
          gap: 12px;
          align-items: center;
        }

        .knowledge-type {
          background: #f0f9ff;
          color: #0369a1;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .knowledge-date {
          color: #64748b;
          font-size: 12px;
        }

        .knowledge-actions {
          display: flex;
          gap: 8px;
        }

        .delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          font-size: 14px;
        }

        .delete-btn:hover {
          background: #fef2f2;
        }

        .knowledge-content h3 {
          margin: 0 0 8px 0;
          color: #1e293b;
        }

        .knowledge-stats {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #64748b;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          color: #1e293b;
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
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
      `}</style>
    </Layout>
  );
};

export default CompanyKnowledgeAdmin;