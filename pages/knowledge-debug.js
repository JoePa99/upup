import React, { useState, useRef } from 'react';
import Layout from '../components/Layout';

export default function KnowledgeDebugPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState('/api/knowledge/debug-test');
  const [method, setMethod] = useState('POST');
  const [title, setTitle] = useState('Test Title');
  const [content, setContent] = useState('Test content for debugging');
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const endpoints = [
    '/api/knowledge/debug-test',
    '/api/knowledge/minimal-upload',
    '/api/simple-knowledge-upload',
    '/api/knowledge/test',
    '/api/simple-knowledge',
    '/api/knowledge/company',
    '/api/knowledge/session',
    '/api/diagnostics',
    '/api/test/diagnostics',
    '/api/test/file-upload'
  ];

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const testEndpoint = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      if (file && method === 'POST') {
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('document', file);
        
        const response = await fetch(selectedEndpoint, {
          method: 'POST',
          body: formData
        });
        
        let data;
        try {
          data = await response.json();
        } catch (e) {
          data = { error: 'Could not parse JSON response', text: await response.text() };
        }
        
        setResult({
          status: response.status,
          data,
          isFileUpload: true
        });
      } else {
        // Regular JSON request
        const options = {
          method,
          headers: {
            'Content-Type': 'application/json'
          }
        };
        
        if (method !== 'GET') {
          options.body = JSON.stringify({
            title,
            content
          });
        }
        
        const response = await fetch(selectedEndpoint, options);
        let data;
        
        try {
          data = await response.json();
        } catch (e) {
          data = { error: 'Could not parse JSON response', text: await response.text() };
        }
        
        setResult({
          status: response.status,
          data
        });
      }
    } catch (error) {
      setResult({
        error: true,
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Knowledge API Debug">
      <div className="debug-container">
        <h1>Knowledge API Debug</h1>
        <p>Test different knowledge API endpoints directly to diagnose issues</p>
        
        <div className="control-panel">
          <div className="form-group">
            <label>Endpoint:</label>
            <select 
              value={selectedEndpoint} 
              onChange={(e) => setSelectedEndpoint(e.target.value)}
            >
              {endpoints.map(endpoint => (
                <option key={endpoint} value={endpoint}>{endpoint}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Method:</label>
            <select 
              value={method} 
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          
          {method !== 'GET' && (
            <>
              <div className="form-group">
                <label>Title:</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                />
              </div>
              
              <div className="form-group">
                <label>Content:</label>
                <textarea 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="form-group">
                <label>File Upload (for multipart/form-data):</label>
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="file-input" 
                />
                {file && (
                  <div className="file-info">
                    <span>Selected: {file.name} ({Math.round(file.size / 1024)} KB)</span>
                    <button type="button" onClick={clearFile} className="clear-button">Clear</button>
                  </div>
                )}
                {file && method === 'POST' && (
                  <div className="upload-note">
                    Using FormData for file upload - Content-Type headers will be set automatically
                  </div>
                )}
              </div>
            </>
          )}
          
          <button 
            onClick={testEndpoint}
            disabled={loading}
          >
            {loading ? 'Testing...' : 'Test Endpoint'}
          </button>
        </div>
        
        {result && (
          <div className="result-panel">
            <h3>Result:</h3>
            <div className="status">Status: {result.status}</div>
            {result.error ? (
              <div className="error">{result.message}</div>
            ) : (
              <pre>{JSON.stringify(result.data, null, 2)}</pre>
            )}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .debug-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        h1 {
          color: #333;
          margin-bottom: 10px;
        }
        
        .control-panel {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        select, input, textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }
        
        .file-input {
          background: white;
          padding: 10px;
        }
        
        .file-info {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #e6f7ff;
          padding: 8px;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .upload-note {
          margin-top: 8px;
          font-size: 14px;
          color: #0066cc;
          background: #e6f7ff;
          padding: 8px;
          border-radius: 4px;
          border-left: 3px solid #0066cc;
        }
        
        .clear-button {
          background: #ff4d4f;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        
        button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }
        
        button:disabled {
          background: #cccccc;
        }
        
        .result-panel {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #007bff;
        }
        
        .status {
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .error {
          color: red;
          font-weight: bold;
        }
        
        pre {
          background: #eee;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
        }
      `}</style>
    </Layout>
  );
}