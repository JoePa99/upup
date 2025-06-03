import React, { useState } from 'react';
import Layout from '../components/Layout';

const DebugLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [debugResult, setDebugResult] = useState(null);
  const [fixResult, setFixResult] = useState(null);
  const [cleanupResult, setCleanupResult] = useState(null);
  const [loginTestResult, setLoginTestResult] = useState(null);
  const [directLoginResult, setDirectLoginResult] = useState(null);
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

  const cleanupDuplicates = async () => {
    if (!email) {
      alert('Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/cleanup-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      setCleanupResult(data);
    } catch (error) {
      console.error('Cleanup error:', error);
      setCleanupResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const testLogin = async () => {
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      setLoginTestResult(data);
    } catch (error) {
      console.error('Login test error:', error);
      setLoginTestResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const directLogin = async () => {
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/debug-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      setDirectLoginResult(data);
    } catch (error) {
      console.error('Direct login error:', error);
      setDirectLoginResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Debug Login | UPUP">
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Debug Login Issue</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
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
          <div>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="your-password"
              style={{
                width: '300px',
                padding: '8px',
                marginLeft: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
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
              marginRight: '10px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Fixing...' : 'Fix User Link'}
          </button>
          
          <button
            onClick={cleanupDuplicates}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Cleaning...' : 'Cleanup Duplicates'}
          </button>

          <button
            onClick={testLogin}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              background: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginRight: '10px'
            }}
          >
            {isLoading ? 'Testing...' : 'Test Login Process'}
          </button>
          
          <button
            onClick={directLogin}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              background: '#fd7e14',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Testing...' : 'Direct Supabase Login'}
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
            borderRadius: '4px',
            marginBottom: '20px'
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

        {cleanupResult && (
          <div style={{
            background: cleanupResult.success ? '#d4edda' : '#f8d7da',
            padding: '15px',
            border: `1px solid ${cleanupResult.success ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <h3>Cleanup Results:</h3>
            <pre style={{ 
              background: 'white', 
              padding: '10px', 
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {JSON.stringify(cleanupResult, null, 2)}
            </pre>
          </div>
        )}

        {loginTestResult && (
          <div style={{
            background: loginTestResult.success ? '#d4edda' : '#f8d7da',
            padding: '15px',
            border: `1px solid ${loginTestResult.success ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <h3>Login Test Results:</h3>
            <pre style={{ 
              background: 'white', 
              padding: '10px', 
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {JSON.stringify(loginTestResult, null, 2)}
            </pre>
          </div>
        )}
        
        {directLoginResult && (
          <div style={{
            background: directLoginResult.success ? '#d4edda' : '#f8d7da',
            padding: '15px',
            border: `1px solid ${directLoginResult.success ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <h3>Direct Supabase Login Results:</h3>
            <pre style={{ 
              background: 'white', 
              padding: '10px', 
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {JSON.stringify(directLoginResult, null, 2)}
            </pre>
          </div>
        )}

        <div style={{ marginTop: '30px', padding: '15px', background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px' }}>
          <h4>Instructions:</h4>
          <ol>
            <li>Enter your email and password</li>
            <li>Click "Test Login Process" to see exactly where login fails</li>
            <li>Click "Debug Login" to check user records</li>
            <li>If you see duplicate users: Click "Cleanup Duplicates"</li>
            <li>If the debug shows missing auth_user_id link, click "Fix User Link"</li>
          </ol>
          
          <div style={{ marginTop: '15px', padding: '10px', background: '#e6f3ff', borderRadius: '4px' }}>
            <strong>Current Status:</strong> Your user records look good. Use "Test Login Process" to see exactly where the login is hanging.
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DebugLogin;