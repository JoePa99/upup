import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { tenant as tenantApi } from '../api';

const Dashboard = () => {
  const [usageData, setUsageData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated && !isLoading) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        setIsLoading(true);
        const response = await tenantApi.getUsage('30days');
        setUsageData(response.data.data.usage);
      } catch (error) {
        console.error('Error fetching usage data:', error);
        setError('Failed to load usage data');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchUsageData();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null; // Will redirect in the first useEffect
  }

  return (
    <Layout title="Dashboard | UPUP">
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Welcome, {user?.firstName || 'User'}!</h1>
          <p className="subtitle">Here's an overview of your platform usage</p>
        </div>

        <div className="usage-section">
          <h2>Usage Statistics (Last 30 Days)</h2>
          
          {isLoading ? (
            <div className="loading">Loading usage data...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : (
            <div className="usage-grid">
              <div className="usage-card">
                <h3>AI API Calls</h3>
                <div className="usage-info">
                  <div className="usage-value">
                    {usageData?.ai_api_calls?.used || 0}
                    <span className="usage-limit">
                      /{usageData?.ai_api_calls?.limit || 0}
                    </span>
                  </div>
                  <div className="usage-bar">
                    <div 
                      className="usage-progress" 
                      style={{ 
                        width: `${Math.min(100, usageData?.ai_api_calls?.percentage || 0)}%`,
                        backgroundColor: usageData?.ai_api_calls?.percentage > 80 ? '#ef4444' : '#0070f3'
                      }} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="usage-card">
                <h3>Storage</h3>
                <div className="usage-info">
                  <div className="usage-value">
                    {((usageData?.storage?.used || 0) / (1024 * 1024 * 1024)).toFixed(2)} GB
                    <span className="usage-limit">
                      /{((usageData?.storage?.limit || 0) / (1024 * 1024 * 1024)).toFixed(2)} GB
                    </span>
                  </div>
                  <div className="usage-bar">
                    <div 
                      className="usage-progress" 
                      style={{ 
                        width: `${Math.min(100, usageData?.storage?.percentage || 0)}%`,
                        backgroundColor: usageData?.storage?.percentage > 80 ? '#ef4444' : '#0070f3'
                      }} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="usage-card">
                <h3>Emails Sent</h3>
                <div className="usage-info">
                  <div className="usage-value">
                    {usageData?.emails?.used || 0}
                    <span className="usage-limit">
                      /{usageData?.emails?.limit || 0}
                    </span>
                  </div>
                  <div className="usage-bar">
                    <div 
                      className="usage-progress" 
                      style={{ 
                        width: `${Math.min(100, usageData?.emails?.percentage || 0)}%`,
                        backgroundColor: usageData?.emails?.percentage > 80 ? '#ef4444' : '#0070f3'
                      }} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="usage-card">
                <h3>Audio Processing</h3>
                <div className="usage-info">
                  <div className="usage-value">
                    {Math.round((usageData?.audio_processing?.used || 0) / 60)} min
                    <span className="usage-limit">
                      /{Math.round((usageData?.audio_processing?.limit || 0) / 60)} min
                    </span>
                  </div>
                  <div className="usage-bar">
                    <div 
                      className="usage-progress" 
                      style={{ 
                        width: `${Math.min(100, usageData?.audio_processing?.percentage || 0)}%`,
                        backgroundColor: usageData?.audio_processing?.percentage > 80 ? '#ef4444' : '#0070f3'
                      }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modules-section">
          <h2>Your AI Business Modules</h2>
          
          <div className="modules-grid">
            <div className="module-card">
              <h3>Create</h3>
              <p>Generate on-brand content for all your channels</p>
              <button className="module-button" onClick={() => router.push('/create')}>
                Open Module
              </button>
            </div>
            
            <div className="module-card">
              <h3>Communicate</h3>
              <p>Handle customer interactions with perfect brand voice</p>
              <button className="module-button" onClick={() => router.push('/communicate')}>
                Open Module
              </button>
            </div>
            
            <div className="module-card">
              <h3>Understand</h3>
              <p>Transform data into clear insights and strategy</p>
              <button className="module-button" onClick={() => router.push('/understand')}>
                Open Module
              </button>
            </div>
            
            <div className="module-card">
              <h3>Grow</h3>
              <p>Discover and validate new business opportunities</p>
              <button className="module-button" onClick={() => router.push('/grow')}>
                Open Module
              </button>
            </div>
            
            <div className="module-card">
              <h3>Operate</h3>
              <p>Handle essential business operations efficiently</p>
              <button className="module-button" onClick={() => router.push('/operate')}>
                Open Module
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .dashboard {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .dashboard-header {
          margin-bottom: 2rem;
        }
        
        .dashboard-header h1 {
          font-size: 2rem;
          color: #111827;
          margin-bottom: 0.5rem;
        }
        
        .subtitle {
          color: #6b7280;
          font-size: 1.125rem;
        }
        
        .usage-section, .modules-section {
          margin-bottom: 3rem;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
        }
        
        .usage-section h2, .modules-section h2 {
          font-size: 1.5rem;
          color: #111827;
          margin-bottom: 1.5rem;
        }
        
        .loading, .error {
          padding: 1rem;
          text-align: center;
          color: #6b7280;
        }
        
        .error {
          color: #ef4444;
        }
        
        .usage-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        
        .usage-card {
          background-color: #f9fafb;
          border-radius: 8px;
          padding: 1.25rem;
        }
        
        .usage-card h3 {
          font-size: 1.125rem;
          color: #374151;
          margin-bottom: 1rem;
        }
        
        .usage-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .usage-value {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }
        
        .usage-limit {
          font-size: 1rem;
          font-weight: 400;
          color: #6b7280;
          margin-left: 0.25rem;
        }
        
        .usage-bar {
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .usage-progress {
          height: 100%;
          border-radius: 4px;
        }
        
        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        
        .module-card {
          background-color: #f9fafb;
          border-radius: 8px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
        }
        
        .module-card h3 {
          font-size: 1.25rem;
          color: #111827;
          margin-bottom: 0.5rem;
        }
        
        .module-card p {
          color: #6b7280;
          margin-bottom: 1.5rem;
          flex-grow: 1;
        }
        
        .module-button {
          padding: 0.75rem 1rem;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .module-button:hover {
          background-color: #0051a2;
        }
      `}</style>
    </Layout>
  );
};

export default Dashboard;