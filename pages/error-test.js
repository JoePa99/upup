import React from 'react';
import Layout from '../components/Layout';

const ErrorTest = () => {
  return (
    <Layout title="Error Test | UPUP">
      <div style={{ padding: '20px' }}>
        <h1>Error Test Page</h1>
        <p>If you can see this page, the basic app structure is working.</p>
        <p>The error is likely in one of the generator pages.</p>
        
        <div style={{ marginTop: '20px' }}>
          <h3>Test Links:</h3>
          <ul>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/content-generator">Content Generator</a></li>
            <li><a href="/growth-generator">Growth Generator</a></li>
            <li><a href="/market-generator">Market Generator</a></li>
            <li><a href="/customer-generator">Customer Generator</a></li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default ErrorTest;