import React, { useState } from 'react';
import Layout from '../components/Layout';

const DebugLogin = () => {
  const [email, setEmail] = useState('');
  const [debugResult, setDebugResult] = useState(null);
  const [fixResult, setFixResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebug = async () => {
    if (!email) {
      alert('Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      setDebugResult(data);
    } catch (error) {
      console.error('Debug error:', error);
      setDebugResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const fixUser = async () => {
    if (!email) {
      alert('Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/fix-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      setFixResult(data);
    } catch (error) {
      console.error('Fix error:', error);
      setFixResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Debug Login | UPUP">
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Debug Login Issue</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your-email@example.com"
            style={{
              width: '300px',
              padding: '8px',
              marginLeft: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={runDebug}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Running...' : 'Debug Login'}
          </button>
          
          <button
            onClick={fixUser}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Fixing...' : 'Fix User Link'}
          </button>
        </div>

        {debugResult && (
          <div style={{
            background: '#f8f9fa',
            padding: '15px',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <h3>Debug Results:</h3>
            <pre style={{ 
              background: 'white', 
              padding: '10px', 
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {JSON.stringify(debugResult, null, 2)}
            </pre>
          </div>
        )}

        {fixResult && (
          <div style={{
            background: '#d4edda',
            padding: '15px',
            border: '1px solid #c3e6cb',
            borderRadius: '4px'
          }}>
            <h3>Fix Results:</h3>
            <pre style={{ 
              background: 'white', 
              padding: '10px', 
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {JSON.stringify(fixResult, null, 2)}
            </pre>
          </div>
        )}

        <div style={{ marginTop: '30px', padding: '15px', background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px' }}>
          <h4>Instructions:</h4>
          <ol>
            <li>Enter the email you're trying to log in with</li>
            <li>Click "Debug Login" to see what's wrong</li>
            <li>If the debug shows missing auth_user_id link, click "Fix User Link"</li>
            <li>Try logging in again</li>
          </ol>
        </div>
      </div>
    </Layout>
  );
};

export default DebugLogin;