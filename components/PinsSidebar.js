import React from 'react';
import { useRouter } from 'next/router';
import { usePins } from '../hooks/usePins';

const PinsSidebar = ({ show, onClose }) => {
  const { pinnedSentences, removePinByIndex, clearPins, pinCount } = usePins();
  const router = useRouter();
  const [contentType, setContentType] = React.useState('Strategic Content');
  const [otherContentType, setOtherContentType] = React.useState('');

  const createFromPins = async () => {
    if (pinnedSentences.length === 0) {
      alert('Please pin some sentences first');
      return;
    }
    
    const selectedContentType = contentType === 'other' ? otherContentType : contentType;
    if (contentType === 'other' && !otherContentType.trim()) {
      alert('Please specify the content type');
      return;
    }
    
    // Clear any existing result
    const existingResult = document.querySelector('.sidebar-result');
    if (existingResult) {
      existingResult.remove();
    }
    
    const sidebarElement = document.querySelector('.pins-sidebar .pin-actions');
    if (!sidebarElement) return;
    
    // Show loading state
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'sidebar-result';
    loadingDiv.innerHTML = `
      <div style="background: #f0f9ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 12px; margin-top: 16px; font-size: 13px;">
        <div style="font-weight: 600; color: #3730a3; margin-bottom: 8px;">⏳ Generating ${selectedContentType}...</div>
        <div style="color: #4338ca;">Creating content from ${pinnedSentences.length} pinned insights...</div>
      </div>
    `;
    sidebarElement.appendChild(loadingDiv);
    
    try {
      // Import API helper and call the real content generation API
      const { apiRequest } = await import('../utils/api-config');
      
      const response = await apiRequest('/content/generate', {
        method: 'POST',
        body: JSON.stringify({
          contentTopic: 'Strategic insights compilation',
          contentType: selectedContentType,
          contentAudience: 'Professional stakeholders',
          pins: pinnedSentences,
          additionalContext: `Generate comprehensive ${selectedContentType} using the provided pinned content as primary source material.`
        })
      });
      
      // Remove loading state
      if (loadingDiv.parentNode) {
        loadingDiv.remove();
      }
      
      // Show success with real content preview
      const resultDiv = document.createElement('div');
      resultDiv.className = 'sidebar-result';
      const contentPreview = response.data.content.substring(0, 150) + '...';
      resultDiv.innerHTML = `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin-top: 16px; font-size: 13px;">
          <div style="font-weight: 600; color: #166534; margin-bottom: 8px;">✨ ${selectedContentType} Created from ${pinnedSentences.length} Pins</div>
          <div style="color: #15803d; margin-bottom: 8px;">${contentPreview}</div>
          <div style="color: #059669; font-size: 12px; font-style: italic;">Full content displayed below</div>
        </div>
      `;
      
      sidebarElement.appendChild(resultDiv);
      
      // Also display the full content in a new container on the page
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        const contentContainer = document.createElement('div');
        contentContainer.className = 'content-container show';
        contentContainer.style.marginTop = '20px';
        contentContainer.innerHTML = `
          <div class="content-title">${response.data.title}</div>
          <div class="generated-content">${response.data.content}</div>
        `;
        mainContent.appendChild(contentContainer);
        
        // Scroll to the new content
        contentContainer.scrollIntoView({ behavior: 'smooth' });
      }
      
      // Auto-remove sidebar notification after 8 seconds
      setTimeout(() => {
        if (resultDiv.parentNode) {
          resultDiv.remove();
        }
      }, 8000);
      
    } catch (error) {
      console.error('Error creating content from pins:', error);
      
      // Remove loading state
      if (loadingDiv.parentNode) {
        loadingDiv.remove();
      }
      
      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'sidebar-result';
      errorDiv.innerHTML = `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-top: 16px; font-size: 13px;">
          <div style="font-weight: 600; color: #dc2626; margin-bottom: 8px;">❌ Content Generation Failed</div>
          <div style="color: #b91c1c;">Please try again or check your connection.</div>
        </div>
      `;
      
      sidebarElement.appendChild(errorDiv);
      
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.remove();
        }
      }, 5000);
    }
  };

  const expandPins = () => {
    if (pinnedSentences.length === 0) {
      alert('Please pin some sentences first');
      return;
    }
    
    // Show success message
    const existingResult = document.querySelector('.sidebar-result');
    if (existingResult) {
      existingResult.remove();
    }
    
    const sidebarElement = document.querySelector('.pins-sidebar .pin-actions');
    if (sidebarElement) {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'sidebar-result';
      resultDiv.innerHTML = `
        <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 12px; margin-top: 16px; font-size: 13px;">
          <div style="font-weight: 600; color: #92400e; margin-bottom: 8px;">💡 Ideas Expanded from ${pinnedSentences.length} Pins</div>
          <div style="color: #a16207;">Strategic framework developed from your insights covering trust-building, competitive positioning, value delivery, and customer relationship evolution. Full analysis available on My Pins page.</div>
        </div>
      `;
      
      sidebarElement.appendChild(resultDiv);
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (resultDiv.parentNode) {
          resultDiv.remove();
        }
      }, 10000);
    }
  };

  if (!show) return null;

  return (
    <div className="pins-sidebar show">
      <div className="pins-header">
        <div className="pins-title">
          📌 Pinned Content
          <span className="pin-count">{pinCount}</span>
        </div>
      </div>

      <div className="pinned-sentences">
        {pinnedSentences.length === 0 ? (
          <div style={{color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '20px'}}>
            Highlight any text in the generated content and click the 📌 icon to pin it here.
          </div>
        ) : (
          pinnedSentences.slice(-10).reverse().map((sentence, index) => {
            const actualIndex = pinnedSentences.length - 1 - index;
            return (
              <div key={actualIndex} className="pinned-sentence" id={`pin-${actualIndex}`}>
                <div style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>
                  {sentence.source}
                </div>
                <div className="pin-content-editable">
                  {sentence.text}
                </div>
                <button 
                  className="remove-pin" 
                  onClick={() => removePinByIndex(actualIndex)}
                  title="Remove pin"
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="pin-actions">
        <div className="content-type-selector">
          <label style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block'}}>
            Content Type:
          </label>
          <select 
            value={contentType} 
            onChange={(e) => setContentType(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px',
              marginBottom: '8px'
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
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px',
                marginBottom: '8px'
              }}
            />
          )}
        </div>
        <button 
          className="generate-btn" 
          onClick={createFromPins}
          disabled={pinnedSentences.length === 0}
          style={{opacity: pinnedSentences.length === 0 ? 0.5 : 1}}
        >
          Create New Content
        </button>
        <button className="secondary-btn" onClick={expandPins}>
          Expand Pinned Ideas
        </button>
        <button className="secondary-btn" onClick={clearPins}>
          Clear All Pins
        </button>
      </div>
    </div>
  );
};

export default PinsSidebar;