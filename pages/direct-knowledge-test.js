import React, { useState } from 'react';
import Head from 'next/head';

export default function DirectKnowledgeTest() {
  const [title, setTitle] = useState('Test Knowledge Item');
  const [content, setContent] = useState('This is a test knowledge item for debugging purposes.');
  const [tenantId, setTenantId] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/direct-knowledge-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content,
          tenant_id: parseInt(tenantId, 10) || 1 // Default to tenant 1 if not provided
        })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkAllKnowledge = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/super-admin/check-knowledge');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container">
      <Head>
        <title>Direct Knowledge Test</title>
      </Head>
      
      <h1>Direct Knowledge Test</h1>
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title:</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Content:</label>
            <textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              required 
              rows={4}
            />
          </div>
          
          <div className="form-group">
            <label>Tenant ID:</label>
            <input 
              type="number" 
              value={tenantId} 
              onChange={(e) => setTenantId(e.target.value)} 
              placeholder="Default: 1"
            />
          </div>
          
          <div className="button-group">
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Testing...' : 'Test Direct Insert'}
            </button>
            
            <button type="button" onClick={checkAllKnowledge} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Check All Knowledge'}
            </button>
          </div>
        </form>
      </div>
      
      {result && (
        <div className={`result ${result.success ? 'success' : 'error'}`}>
          <h3>Result:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      
      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        h1 {
          margin-bottom: 20px;
        }
        
        .card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        
        input, textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .button-group {
          display: flex;
          gap: 10px;
        }
        
        button {
          background: #0070f3;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        button:disabled {
          background: #ccc;
        }
        
        .result {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-top: 20px;
        }
        
        .success {
          border-left: 4px solid #0070f3;
        }
        
        .error {
          border-left: 4px solid #ff0000;
        }
        
        pre {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}