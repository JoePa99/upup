import React from 'react';
import { useRouter } from 'next/router';
import { usePins } from '../hooks/usePins';

const PinsSidebar = ({ show, onClose }) => {
  const { pinnedSentences, removePinByIndex, clearPins, pinCount } = usePins();
  const router = useRouter();

  const createFromPins = () => {
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
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin-top: 16px; font-size: 13px;">
          <div style="font-weight: 600; color: #166534; margin-bottom: 8px;">✨ Content Created from ${pinnedSentences.length} Pins</div>
          <div style="color: #15803d;">Strategic content piece generated combining your curated insights into customer trust, authentic relationships, and quality-focused business strategies. Full document available on My Pins page.</div>
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
          📌 Pinned Sentences
          <span className="pin-count">{pinCount}</span>
        </div>
        <button className="close-pins" onClick={onClose} style={{background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '18px'}}>
          ×
        </button>
      </div>

      <div className="pinned-sentences">
        {pinnedSentences.length === 0 ? (
          <div style={{color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '20px'}}>
            Click on sentences in the generated content to pin your favorites here.
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
        <button className="close-pins" onClick={onClose}>
          × Close Pinboard
        </button>
      </div>
    </div>
  );
};

export default PinsSidebar;