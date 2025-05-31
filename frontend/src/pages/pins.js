import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

const PinsPage = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [pinnedSentences, setPinnedSentences] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [resultContent, setResultContent] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Load pinned sentences from localStorage
    const saved = localStorage.getItem('pinnedSentences');
    if (saved) {
      try {
        setPinnedSentences(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading pinned sentences:', error);
      }
    }
  }, [isAuthenticated, router]);

  const exportPins = () => {
    if (pinnedSentences.length === 0) {
      alert('No pins to export! Pin some sentences first.');
      return;
    }

    let exportContent = 'MY PINNED INSIGHTS EXPORT\n\n';
    exportContent += `Total Pins: ${pinnedSentences.length}\n`;
    exportContent += `Export Date: ${new Date().toLocaleDateString()}\n\n`;

    pinnedSentences.forEach((pin, index) => {
      exportContent += `--- PIN ${index + 1} ---\n`;
      exportContent += `Source: ${pin.source}\n`;
      exportContent += `Content: ${pin.text}\n`;
      exportContent += `Date: ${new Date(pin.timestamp).toLocaleDateString()}\n\n`;
    });

    // Create downloadable content
    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'staedtler-pinned-insights.txt';
    a.click();
    window.URL.revokeObjectURL(url);

    alert(`Exported ${pinnedSentences.length} pinned insights to text file!`);
  };

  const createFromPinsOnPage = () => {
    if (pinnedSentences.length === 0) {
      alert('Please pin some sentences first by generating content in the generators or templates!');
      return;
    }

    const newContent = `STRATEGIC CONTENT CREATED FROM YOUR PINNED INSIGHTS

Based on your curated collection of strategic insights, here's a comprehensive content piece that weaves together your most valuable thoughts:

EXECUTIVE SUMMARY

Your pinned insights reveal a consistent theme around building authentic relationships and delivering consistent value. This strategic approach forms the foundation for sustainable business growth and competitive advantage.

KEY STRATEGIC THEMES

The patterns in your pinned content highlight several critical business strategies:

Customer Trust as Foundation: Your insights consistently emphasize that trust isn't built overnight but through consistent actions over time. This principle should guide all customer-facing initiatives.

Quality Over Quantity Approach: The recurring theme of precision and reliability suggests that your business strategy should focus on delivering exceptional quality rather than competing on volume or price.

Authentic Communication: Your pinned insights about spotting inauthentic messaging indicate that transparent, honest communication will be crucial for market differentiation.

Long-term Value Creation: The emphasis on building lasting relationships over short-term gains suggests a strategic focus on customer lifetime value rather than transactional thinking.

IMPLEMENTATION RECOMMENDATIONS

Based on these strategic insights, consider implementing:

1. Customer education programs that demonstrate your commitment to quality and precision
2. Transparent communication strategies that honestly address both strengths and limitations  
3. Consistency programs that ensure every customer interaction reinforces trust
4. Value delivery systems that slightly exceed customer expectations

CONCLUSION

Your curated insights point toward a strategy focused on authentic relationship building, consistent quality delivery, and transparent communication—a powerful combination for sustainable competitive advantage.

This content represents the strategic wisdom you've identified as most valuable from your AI-generated insights.`;

    setResultContent(newContent);
    setShowResult(true);
  };

  const exportResult = () => {
    if (!resultContent) {
      alert('No content to export. Create content first!');
      return;
    }

    const blob = new Blob([resultContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'staedtler-strategic-content.txt';
    a.click();
    window.URL.revokeObjectURL(url);
    alert('Strategic content exported successfully!');
  };

  const editResult = () => {
    alert('Opening content editor for refinement... (This would open a rich text editor to refine the generated content)');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout title="My Pins | Up, Up, Down, Down">
      <div className="page-header">
        <h1 className="page-title">📌 My Pinned Sentences</h1>
        <p className="page-subtitle">Your curated collection of strategic insights and content gold</p>
        <div className="header-actions">
          <button className="secondary-btn" onClick={exportPins}>
            Export All
          </button>
          <button className="action-button" onClick={createFromPinsOnPage}>
            Create Content
          </button>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-group">
          <div className="stat-number">{pinnedSentences.length}</div>
          <div className="stat-label">Sentences Pinned</div>
        </div>
        <div className="stat-group">
          <div className="stat-number">47</div>
          <div className="stat-label">Content Generated</div>
        </div>
        <div className="stat-group">
          <div className="stat-number">15</div>
          <div className="stat-label">Content Created</div>
        </div>
        <div className="stat-group">
          <div className="stat-number">This Week</div>
          <div className="stat-label">+34 New Pins</div>
        </div>
      </div>

      <div className="pins-grid">
        {pinnedSentences.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            color: '#64748b',
            fontStyle: 'italic'
          }}>
            No pinned sentences yet. Generate some content using the generators to start pinning your favorite insights!
          </div>
        ) : (
          pinnedSentences.map((pin, index) => (
            <div key={index} className="pin-card">
              <div className="pin-header">
                <div className="pin-meta">
                  <div className="pin-source">{pin.source}</div>
                  <div className="pin-date">
                    {new Date(pin.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="pin-content">{pin.text}</div>
            </div>
          ))
        )}
      </div>

      {showResult && (
        <div className="create-result show">
          <div className="result-header">
            <div className="result-title">📄 Created Content from Pinned Insights</div>
            <div className="result-actions">
              <button className="secondary-btn" onClick={editResult}>
                Edit
              </button>
              <button className="action-button" onClick={exportResult}>
                Export
              </button>
            </div>
          </div>
          <div className="result-content">{resultContent}</div>
        </div>
      )}

      <style jsx>{`
        .stats-bar {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-group {
          text-align: center;
        }

        .stat-number {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
        }

        .stat-label {
          color: #64748b;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pins-grid {
          display: grid;
          gap: 16px;
        }

        .pin-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border-left: 4px solid #10b981;
          transition: all 0.2s;
        }

        .pin-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .pin-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .pin-meta {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .pin-source {
          background: #f0f9ff;
          color: #0369a1;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .pin-date {
          color: #64748b;
          font-size: 12px;
        }

        .pin-content {
          color: #374151;
          line-height: 1.6;
          margin-bottom: 12px;
        }
      `}</style>
    </Layout>
  );
};

export default PinsPage;