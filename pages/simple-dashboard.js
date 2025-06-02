import React from 'react';
import Head from 'next/head';

const SimpleDashboard = () => {
  return (
    <div>
      <Head>
        <title>UPUP Dashboard</title>
      </Head>
      
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>🎉 Login Successful!</h1>
        <p>You're logged in and the app is working.</p>
        
        <div style={{ marginTop: '30px' }}>
          <h2>Available Tools:</h2>
          <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
            <a href="/content-generator" style={{ padding: '15px', background: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px', textAlign: 'center' }}>
              📝 Content Generator
            </a>
            <a href="/growth-generator" style={{ padding: '15px', background: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '5px', textAlign: 'center' }}>
              📈 Growth Generator  
            </a>
            <a href="/market-generator" style={{ padding: '15px', background: '#17a2b8', color: 'white', textDecoration: 'none', borderRadius: '5px', textAlign: 'center' }}>
              📊 Market Generator
            </a>
            <a href="/customer-generator" style={{ padding: '15px', background: '#ffc107', color: 'black', textDecoration: 'none', borderRadius: '5px', textAlign: 'center' }}>
              👥 Customer Generator
            </a>
            <a href="/hr-templates" style={{ padding: '15px', background: '#6f42c1', color: 'white', textDecoration: 'none', borderRadius: '5px', textAlign: 'center' }}>
              📋 HR Templates
            </a>
            <a href="/legal-templates" style={{ padding: '15px', background: '#e83e8c', color: 'white', textDecoration: 'none', borderRadius: '5px', textAlign: 'center' }}>
              ⚖️ Legal Templates
            </a>
            <a href="/sales-templates" style={{ padding: '15px', background: '#fd7e14', color: 'white', textDecoration: 'none', borderRadius: '5px', textAlign: 'center' }}>
              💼 Sales Templates
            </a>
          </div>
        </div>
        
        <div style={{ marginTop: '30px', padding: '15px', background: '#f8f9fa', borderRadius: '5px' }}>
          <h3>🎯 Next Steps:</h3>
          <ol>
            <li>Click any tool above to test the AI generators</li>
            <li>All tools now use real OpenAI API (no more mock content)</li>
            <li>Each generator will create unique, AI-powered content</li>
          </ol>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={() => window.location.href = '/login'} 
            style={{ padding: '10px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleDashboard;