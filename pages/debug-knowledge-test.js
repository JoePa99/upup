import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const KnowledgeDebugTest = () => {
  const { isAuthenticated, user } = useAuth();
  const [query, setQuery] = useState('tires');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testKnowledge = async () => {
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const { apiRequest } = await import('../utils/api-config');
      
      console.log('Testing knowledge with query:', query);
      const response = await apiRequest('/debug-knowledge', {
        method: 'POST',
        body: JSON.stringify({ query })
      });

      console.log('Debug response:', response);
      setResults(response.debug);
    } catch (err) {
      console.error('Debug error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout title="Knowledge Debug">
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Please log in first</h1>
          <p>You need to be logged in to test knowledge base functionality.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Knowledge Debug Test">
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>🔍 Knowledge Base Debug Test</h1>
        
        <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
          <p><strong>Current User:</strong> {user?.email}</p>
          <p><strong>Company:</strong> {user?.tenantName}</p>
          <p><strong>User ID:</strong> {user?.id}</p>
          <p><strong>Tenant ID:</strong> {user?.tenantId}</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Test Query:
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '300px',
              padding: '8px',
              marginRight: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
            placeholder="Enter search query..."
          />
          <button
            onClick={testKnowledge}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: loading ? '#ccc' : '#007cba',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Testing...' : 'Test Knowledge'}
          </button>
        </div>

        {error && (
          <div style={{ 
            padding: '15px', 
            background: '#fee', 
            border: '1px solid #fcc', 
            borderRadius: '8px', 
            marginBottom: '20px',
            color: '#c33'
          }}>
            <h3>❌ Error:</h3>
            <p>{error}</p>
          </div>
        )}

        {results && (
          <div style={{ marginTop: '20px' }}>
            <h2>📊 Debug Results</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <h3>Company Info:</h3>
              <pre style={{ background: '#f8f8f8', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
                {JSON.stringify(results.tenantInfo, null, 2)}
              </pre>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3>Knowledge Summary:</h3>
              <ul>
                <li><strong>Knowledge Items Found:</strong> {results.relevantKnowledgeCount}</li>
                <li><strong>Knowledge Context Length:</strong> {results.knowledgeContextLength} characters</li>
                <li><strong>Has Knowledge:</strong> {results.hasKnowledge ? '✅ Yes' : '❌ No'}</li>
              </ul>
            </div>

            {results.relevantKnowledge && results.relevantKnowledge.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3>📚 Knowledge Items:</h3>
                {results.relevantKnowledge.map((item, index) => (
                  <div key={index} style={{ 
                    background: '#f0f8ff', 
                    padding: '10px', 
                    margin: '10px 0', 
                    borderRadius: '4px',
                    border: '1px solid #b0d4ff'
                  }}>
                    <h4>{item.title}</h4>
                    <p><strong>Excerpt:</strong> {item.excerpt}</p>
                  </div>
                ))}
              </div>
            )}

            {results.knowledgeContext && (
              <div style={{ marginBottom: '20px' }}>
                <h3>📝 Full Knowledge Context:</h3>
                <pre style={{ 
                  background: '#f8f8f8', 
                  padding: '15px', 
                  borderRadius: '4px', 
                  overflow: 'auto',
                  maxHeight: '400px',
                  fontSize: '12px',
                  lineHeight: '1.4'
                }}>
                  {results.knowledgeContext}
                </pre>
              </div>
            )}

            {!results.hasKnowledge && (
              <div style={{ 
                padding: '15px', 
                background: '#fff3cd', 
                border: '1px solid #ffeaa7', 
                borderRadius: '8px',
                color: '#856404'
              }}>
                <h3>⚠️ No Knowledge Found</h3>
                <p>This means either:</p>
                <ul>
                  <li>No documents have been uploaded to the knowledge base</li>
                  <li>The uploaded documents don't contain the search query "{query}"</li>
                  <li>There's an authentication issue preventing knowledge access</li>
                  <li>The knowledge base API is not working properly</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '40px', padding: '15px', background: '#e8f4fd', borderRadius: '8px' }}>
          <h3>💡 How to Use This Test</h3>
          <ol>
            <li>Make sure you're logged in as a user from a company with uploaded documents</li>
            <li>Enter a search term that should match your uploaded documents</li>
            <li>Click "Test Knowledge" to see what the system finds</li>
            <li>Check the results to see if your knowledge base content is being retrieved</li>
          </ol>
        </div>
      </div>
    </Layout>
  );
};

export default KnowledgeDebugTest;