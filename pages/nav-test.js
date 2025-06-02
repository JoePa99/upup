import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

const NavigationTest = () => {
  const { user } = useAuth();
  const router = useRouter();

  const testRoutes = [
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/pins', name: 'Pins' },
    { path: '/content-generator', name: 'Content Generator' },
    { path: '/growth-generator', name: 'Growth Generator' },
    { path: '/market-generator', name: 'Market Generator' },
    { path: '/customer-generator', name: 'Customer Generator' },
    { path: '/hr-templates', name: 'HR Templates' },
    { path: '/legal-templates', name: 'Legal Templates' },
    { path: '/sales-templates', name: 'Sales Templates' },
    { path: '/super-admin', name: 'Super Admin' }
  ];

  const testNavigation = (path) => {
    console.log(`Testing navigation to: ${path}`);
    router.push(path).then(() => {
      console.log(`Successfully navigated to: ${path}`);
    }).catch((error) => {
      console.error(`Failed to navigate to ${path}:`, error);
    });
  };

  return (
    <Layout title="Navigation Test">
      <div style={{ padding: '20px' }}>
        <h1>Navigation Test Page</h1>
        
        <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0' }}>
          <h3>Current User Info:</h3>
          <p>Email: {user?.email}</p>
          <p>Role: {user?.role}</p>
          <p>Is Super Admin: {user?.isSuperAdmin ? 'YES' : 'NO'}</p>
          <p>Is Company Admin: {user?.isCompanyAdmin ? 'YES' : 'NO'}</p>
        </div>

        <h3>Test Navigation Links:</h3>
        <div style={{ display: 'grid', gap: '10px', maxWidth: '400px' }}>
          {testRoutes.map((route) => (
            <button
              key={route.path}
              onClick={() => testNavigation(route.path)}
              style={{
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                background: 'white'
              }}
            >
              Test: {route.name} ({route.path})
            </button>
          ))}
        </div>

        <h3>Direct Links (using window.location):</h3>
        <div style={{ display: 'grid', gap: '10px', maxWidth: '400px' }}>
          {testRoutes.map((route) => (
            <button
              key={`direct-${route.path}`}
              onClick={() => window.location.href = route.path}
              style={{
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                background: '#e6f3ff'
              }}
            >
              Direct: {route.name} ({route.path})
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default NavigationTest;