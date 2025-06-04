import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { usePins } from '../hooks/usePins';

const PinsPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { pinnedSentences, removePin, updatePin, clearPins } = usePins();
  const [showResult, setShowResult] = useState(false);
  const [resultContent, setResultContent] = useState('');
  const [resultTitle, setResultTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPins, setSelectedPins] = useState(new Set());
  const [editingPin, setEditingPin] = useState(null);
  const [editText, setEditText] = useState('');
  const [contentType, setContentType] = useState('Strategic Content');
  const [otherContentType, setOtherContentType] = useState('');

  useEffect(() => {
    // Only handle redirect on client side
    if (typeof window !== 'undefined' && !loading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, loading, router]);

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

  const createFromPinsOnPage = async () => {
    const pinsToUse = selectedPins.size > 0 ? 
      pinnedSentences.filter((_, index) => selectedPins.has(index)) : 
      pinnedSentences;

    if (pinsToUse.length === 0) {
      alert('Please pin some sentences first or select pins to create content from!');
      return;
    }
    
    const selectedContentType = contentType === 'other' ? otherContentType : contentType;
    if (contentType === 'other' && !otherContentType.trim()) {
      alert('Please specify the content type');
      return;
    }

    // Show loading state
    setIsLoading(true);
    setShowResult(false);

    try {
      // Import API helper and call the real content generation API
      const { apiRequest } = await import('../utils/api-config');
      
      const response = await apiRequest('/content/generate', {
        method: 'POST',
        body: JSON.stringify({
          contentTopic: 'Strategic insights compilation',
          contentType: selectedContentType,
          contentAudience: 'Professional stakeholders',
          pins: pinsToUse,
          additionalContext: `Generate comprehensive ${selectedContentType} using the provided pinned content as primary source material. Create strategic analysis that synthesizes the key themes and insights from the pinned content.`
        })
      });
      
      // Set the real generated content
      setResultContent(response.data.content);
      setResultTitle(response.data.title);
      setShowResult(true);
      
    } catch (error) {
      console.error('Error creating content from pins:', error);
      
      // Show fallback content on error
      const fallbackContent = `${selectedContentType.toUpperCase()} CREATED FROM ${selectedPins.size > 0 ? 'SELECTED' : 'ALL'} PINNED INSIGHTS

Based on your curated collection of ${pinsToUse.length} strategic insights, here's a comprehensive ${selectedContentType.toLowerCase()} that incorporates your most valuable thoughts:

EXECUTIVE SUMMARY

Your pinned insights highlight key strategic themes that can guide business decisions and strategic planning. This content synthesizes those insights into actionable recommendations.

KEY INSIGHTS FROM YOUR PINS

${pinsToUse.map((pin, index) => `${index + 1}. ${pin.content}`).join('\n\n')}

STRATEGIC RECOMMENDATIONS

Based on these curated insights, the following strategic approaches are recommended:

- Focus on building authentic relationships and delivering consistent value
- Prioritize quality and reliability over volume-based strategies  
- Maintain transparent communication and honest messaging
- Develop long-term customer relationships rather than transactional approaches

CONCLUSION

Your pinned content reveals a consistent strategic philosophy focused on authenticity, quality, and long-term value creation. These principles should guide future business decisions and strategic initiatives.

Note: This is fallback content due to API unavailability. Please try again for AI-generated analysis.`;

      setResultContent(fallbackContent);
      setResultTitle(`${selectedContentType}: Strategic Insights Analysis`);
      setShowResult(true);
      
      alert('Content generation failed. Showing fallback content with your pinned insights.');
    } finally {
      setIsLoading(false);
    }
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

  // Pin management functions
  const handleSelectPin = (index) => {
    const newSelected = new Set(selectedPins);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPins(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPins.size === pinnedSentences.length) {
      setSelectedPins(new Set());
    } else {
      setSelectedPins(new Set(pinnedSentences.map((_, index) => index)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedPins.size === 0) {
      alert('Please select pins to delete');
      return;
    }

    if (confirm(`Delete ${selectedPins.size} selected pins?`)) {
      // Sort indices in descending order to delete from end first
      const sortedIndices = Array.from(selectedPins).sort((a, b) => b - a);
      sortedIndices.forEach(index => {
        const pin = pinnedSentences[index];
        if (pin) {
          removePin(pin.id);
        }
      });
      setSelectedPins(new Set());
    }
  };

  const handleEditPin = (pin, index) => {
    setEditingPin(index);
    setEditText(pin.text);
  };

  const handleSaveEdit = () => {
    if (editingPin !== null && editText.trim()) {
      const pin = pinnedSentences[editingPin];
      if (pin) {
        updatePin(pin.id, editText.trim());
      }
    }
    setEditingPin(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingPin(null);
    setEditText('');
  };

  const handleDeletePin = (pin) => {
    if (confirm('Delete this pin?')) {
      removePin(pin.id);
    }
  };

  // Don't render anything on server if not authenticated
  if (typeof window === 'undefined' && !isAuthenticated) {
    return null;
  }

  // Don't render anything on client if not authenticated (until redirect happens)
  if (typeof window !== 'undefined' && !isAuthenticated) {
    return null;
  }

  return (
    <Layout title="My Pins | Up, Up, Down, Down">
      <div className="page-header">
        <h1 className="page-title">📌 My Pinned Sentences</h1>
        <p className="page-subtitle">Your curated collection of strategic insights and content gold</p>
        <div className="header-actions">
          <div className="content-type-section">
            <label style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block'}}>
              Content Type:
            </label>
            <select 
              value={contentType} 
              onChange={(e) => setContentType(e.target.value)}
              style={{
                padding: '6px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px',
                marginBottom: '8px',
                minWidth: '140px'
              }}
            >
              <option>Strategic Content</option>
              <option>Blog Post</option>
              <option>Email Campaign</option>
              <option>Social Media</option>
              <option>Marketing Copy</option>
              <option>Executive Summary</option>
              <option>Proposal</option>
              <option>Case Study</option>
              <option value="other">Other (specify)</option>
            </select>
            {contentType === 'other' && (
              <input
                type="text"
                value={otherContentType}
                onChange={(e) => setOtherContentType(e.target.value)}
                placeholder="Specify content type..."
                style={{
                  padding: '6px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px',
                  marginBottom: '8px',
                  minWidth: '140px'
                }}
              />
            )}
          </div>
          <button className="secondary-btn" onClick={exportPins}>
            Export All
          </button>
          {selectedPins.size > 0 && (
            <>
              <button className="secondary-btn" onClick={handleDeleteSelected}>
                Delete Selected ({selectedPins.size})
              </button>
              <button className="action-button" onClick={createFromPinsOnPage}>
                Create from Selected
              </button>
            </>
          )}
          {selectedPins.size === 0 && (
            <button className="action-button" onClick={createFromPinsOnPage}>
              Create Content
            </button>
          )}
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

      {pinnedSentences.length > 0 && (
        <div className="batch-controls">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={selectedPins.size === pinnedSentences.length}
              onChange={handleSelectAll}
            />
            Select All ({pinnedSentences.length})
          </label>
          {selectedPins.size > 0 && (
            <span className="selection-info">{selectedPins.size} selected</span>
          )}
        </div>
      )}

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
            <div key={pin.id || index} className={`pin-card ${selectedPins.has(index) ? 'selected' : ''}`}>
              <div className="pin-header">
                <div className="pin-meta">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedPins.has(index)}
                      onChange={() => handleSelectPin(index)}
                    />
                  </label>
                  <div className="pin-source">{pin.source}</div>
                  <div className="pin-date">
                    {new Date(pin.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <div className="pin-actions">
                  <button 
                    className="pin-action-btn edit-btn"
                    onClick={() => handleEditPin(pin, index)}
                    title="Edit pin"
                  >
                    ✏️
                  </button>
                  <button 
                    className="pin-action-btn delete-btn"
                    onClick={() => handleDeletePin(pin)}
                    title="Delete pin"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="pin-content">
                {editingPin === index ? (
                  <div className="pin-edit">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="edit-textarea"
                      rows={3}
                    />
                    <div className="edit-actions">
                      <button className="save-btn" onClick={handleSaveEdit}>
                        Save
                      </button>
                      <button className="cancel-btn" onClick={handleCancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  pin.text
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isLoading && (
        <div className="loading show">
          <div className="spinner"></div>
          <div>Generating content from your pinned insights...</div>
        </div>
      )}

      {showResult && (
        <div className="create-result show">
          <div className="result-header">
            <div className="result-title">{resultTitle || '📄 Created Content from Pinned Insights'}</div>
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

        .content-type-section {
          margin-right: 16px;
        }

        .header-actions {
          display: flex;
          align-items: flex-end;
          gap: 12px;
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

        .batch-controls {
          background: white;
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 500;
          color: #374151;
        }

        .checkbox-label input[type="checkbox"] {
          margin: 0;
          transform: scale(1.2);
        }

        .selection-info {
          color: #10b981;
          font-weight: 500;
          font-size: 14px;
        }

        .pin-card.selected {
          border-left-color: #3b82f6;
          background: #f8fafc;
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
          flex: 1;
        }

        .pin-actions {
          display: flex;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .pin-card:hover .pin-actions {
          opacity: 1;
        }

        .pin-action-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          font-size: 14px;
          transition: background 0.2s;
        }

        .pin-action-btn:hover {
          background: #f1f5f9;
        }

        .pin-edit {
          margin-top: 8px;
        }

        .edit-textarea {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 8px;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.6;
          resize: vertical;
          min-height: 60px;
        }

        .edit-textarea:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .edit-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          justify-content: flex-end;
        }

        .save-btn, .cancel-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .save-btn {
          background: #10b981;
          color: white;
        }

        .save-btn:hover {
          background: #059669;
        }

        .cancel-btn {
          background: #f3f4f6;
          color: #374151;
        }

        .cancel-btn:hover {
          background: #e5e7eb;
        }
      `}</style>
    </Layout>
  );
};

export default PinsPage;