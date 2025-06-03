import React, { useState, useRef } from 'react';
import Head from 'next/head';

export default function DebugPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState('/api/hello');
  const [method, setMethod] = useState('GET');
  const [title, setTitle] = useState('Test Title');
  const [content, setContent] = useState('Test content for debugging');
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const endpoints = [
    '/api/hello',
    '/api/working-test',
    '/api/test-upload',
    '/api/debugging-12345',
    '/api/knowledge/test',
    '/api/knowledge/company'
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
    <div className="container">
      <Head>
        <title>API Debug Tool</title>
        <meta name="description" content="Debug tool for API endpoints" />
      </Head>

      <main>
        <h1 className="title">API Debug Tool</h1>
        
        <div className="card">
          <div className="form-group">
            <label>Endpoint:</label>
            <select 
              value={selectedEndpoint} 
              onChange={(e) => setSelectedEndpoint(e.target.value)}
            >
              {endpoints.map(endpoint => (
                <option key={endpoint} value={endpoint}>{endpoint}</option>
              ))}
              <option value="custom">Custom...</option>
            </select>
            
            {selectedEndpoint === 'custom' && (
              <input
                type="text"
                placeholder="Enter custom endpoint"
                onChange={(e) => setSelectedEndpoint(e.target.value)}
                className="mt-2"
              />
            )}
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
                <label>File Upload:</label>
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="file-input" 
                />
                {file && (
                  <div className="file-info">
                    <span>Selected: {file.name} ({Math.round(file.size / 1024)} KB)</span>
                    <button type="button" onClick={clearFile} className="clear-button">✕</button>
                  </div>
                )}
              </div>
            </>
          )}
          
          <button 
            onClick={testEndpoint}
            disabled={loading}
            className="button"
          >
            {loading ? 'Testing...' : 'Test Endpoint'}
          </button>
        </div>
        
        {result && (
          <div className={`card result ${result.error ? 'error' : ''}`}>
            <h3>Result:</h3>
            <div className="status">Status: {result.status}</div>
            {result.error ? (
              <div className="error-message">{result.message}</div>
            ) : (
              <pre>{JSON.stringify(result.data, null, 2)}</pre>
            )}
          </div>
        )}
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 100%;
          max-width: 800px;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
          margin-bottom: 2rem;
        }

        .card {
          margin: 1rem;
          padding: 1.5rem;
          text-align: left;
          color: inherit;
          text-decoration: none;
          border: 1px solid #eaeaea;
          border-radius: 10px;
          transition: color 0.15s ease, border-color 0.15s ease;
          width: 100%;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: bold;
        }

        select, input, textarea {
          width: 100%;
          padding: 0.5rem;
          font-size: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        .file-input {
          padding: 0.5rem 0;
        }

        .file-info {
          margin-top: 0.5rem;
          display: flex;
          justify-content: space-between;
          background: #f0f0f0;
          padding: 0.5rem;
          border-radius: 4px;
        }

        .clear-button {
          background: #ff4d4f;
          color: white;
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .button {
          background-color: #0070f3;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          border-radius: 4px;
          cursor: pointer;
        }

        .button:disabled {
          background-color: #cccccc;
        }

        .result {
          margin-top: 2rem;
        }

        .result.error {
          border-color: #ff4d4f;
        }

        .status {
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .error-message {
          color: #ff4d4f;
          font-weight: bold;
        }

        pre {
          background: #f5f5f5;
          padding: 1rem;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}