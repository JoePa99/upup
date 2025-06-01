import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const navigateToPage = (pageId) => {
    router.push(`/${pageId}`);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout title="Dashboard | Up, Up, Down, Down">
      <div className="page-header">
        <h1 className="page-title">Welcome back! 👋</h1>
        <p className="page-subtitle">Here's what's happening with your AI business partner</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">47</div>
          <div className="stat-label">Content Pieces Generated</div>
          <div className="stat-change">+12 this week</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">238</div>
          <div className="stat-label">Sentences Pinned</div>
          <div className="stat-change">+34 this week</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">15</div>
          <div className="stat-label">Templates Used</div>
          <div className="stat-change">+3 this week</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">8.2k</div>
          <div className="stat-label">API Tokens Used</div>
          <div className="stat-change">73% of monthly limit</div>
        </div>
      </div>

      <div className="tools-grid">
        <div className="tool-category">
          <div className="category-header">
            <div className="category-icon generators-icon">✨</div>
            <div className="category-title">Generators</div>
          </div>
          <div className="category-description">
            AI-powered content creation with sentence-level curation
          </div>
          <ul className="tool-list">
            <li className="tool-item">
              <span className="tool-name">Content Generator</span>
              <button className="tool-button" onClick={() => navigateToPage('content-generator')}>
                Use
              </button>
            </li>
            <li className="tool-item">
              <span className="tool-name">Growth Opportunities</span>
              <button className="tool-button" onClick={() => navigateToPage('growth-generator')}>
                Use
              </button>
            </li>
            <li className="tool-item">
              <span className="tool-name">Market Insights</span>
              <button className="tool-button" onClick={() => navigateToPage('market-generator')}>
                Use
              </button>
            </li>
            <li className="tool-item">
              <span className="tool-name">Customer Connection</span>
              <button className="tool-button" onClick={() => navigateToPage('customer-generator')}>
                Use
              </button>
            </li>
          </ul>
        </div>

        <div className="tool-category">
          <div className="category-header">
            <div className="category-icon templates-icon">📋</div>
            <div className="category-title">Templates</div>
          </div>
          <div className="category-description">
            Smart templates powered by your brand knowledge base
          </div>
          <ul className="tool-list">
            <li className="tool-item">
              <span className="tool-name">Job Descriptions</span>
              <button className="tool-button" onClick={() => navigateToPage('hr-templates')}>
                Create
              </button>
            </li>
            <li className="tool-item">
              <span className="tool-name">Service Agreements</span>
              <button className="tool-button" onClick={() => navigateToPage('legal-templates')}>
                Create
              </button>
            </li>
            <li className="tool-item">
              <span className="tool-name">Sales Proposals</span>
              <button className="tool-button" onClick={() => navigateToPage('sales-templates')}>
                Create
              </button>
            </li>
            <li className="tool-item">
              <span className="tool-name">Email Sequences</span>
              <button className="tool-button" onClick={() => navigateToPage('sales-templates')}>
                Create
              </button>
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;