import React, { useRef, useEffect, useState } from 'react';
import { usePins } from '../hooks/usePins';

const SentenceDisplay = ({ content, title, sourceType = 'content' }) => {
  const { addPin } = usePins();
  const contentRef = useRef(null);
  const [pinTooltip, setPinTooltip] = useState({ show: false, x: 0, y: 0, selectedText: '' });

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Position the PIN icon above the selection
      setPinTooltip({
        show: true,
        x: rect.left + (rect.width / 2),
        y: rect.top - 40, // 40px above the selection
        selectedText: selectedText
      });
    } else {
      setPinTooltip({ show: false, x: 0, y: 0, selectedText: '' });
    }
  };

  const handlePinSelection = () => {
    if (pinTooltip.selectedText) {
      addPin(pinTooltip.selectedText, title, sourceType);
      setPinTooltip({ show: false, x: 0, y: 0, selectedText: '' });
      
      // Clear the selection
      window.getSelection().removeAllRanges();
    }
  };

  const handleDocumentClick = (e) => {
    // Hide PIN tooltip if clicking outside the content area or PIN button
    if (!contentRef.current?.contains(e.target) && !e.target.closest('.pin-tooltip')) {
      setPinTooltip({ show: false, x: 0, y: 0, selectedText: '' });
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  const renderContent = () => {
    // Safety check for content
    if (!content || typeof content !== 'string') {
      return <div>No content available</div>;
    }
    
    // Return content as-is for text selection, but highlight pinned portions
    return renderContentWithPinnedHighlights(content);
  };

  const renderContentWithPinnedHighlights = (text) => {
    const { pinnedSentences } = usePins();
    
    // If no pins, just return plain text
    if (!pinnedSentences || pinnedSentences.length === 0) {
      return text;
    }
    
    // Create a copy of the text to work with
    let result = text;
    let elements = [];
    let lastIndex = 0;
    
    // Sort pinned sentences by length (longest first) to avoid partial replacements
    const sortedPins = [...pinnedSentences].sort((a, b) => b.text.length - a.text.length);
    
    // Find all pinned text occurrences
    sortedPins.forEach(pin => {
      const pinText = pin.text.trim();
      const index = result.indexOf(pinText);
      
      if (index !== -1) {
        // Add text before the pinned portion
        if (index > lastIndex) {
          elements.push(result.substring(lastIndex, index));
        }
        
        // Add the pinned portion with highlighting
        elements.push(
          <span key={pin.id} className="pinned-highlight" title="This text is pinned">
            {pinText}
          </span>
        );
        
        lastIndex = index + pinText.length;
      }
    });
    
    // Add remaining text
    if (lastIndex < result.length) {
      elements.push(result.substring(lastIndex));
    }
    
    return elements.length > 0 ? elements : text;
  };

  return (
    <>
      <div 
        className="generated-content"
        ref={contentRef}
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
      >
        {renderContent()}
      </div>
      
      {/* Floating PIN tooltip */}
      {pinTooltip.show && (
        <div 
          className="pin-tooltip"
          style={{
            position: 'fixed',
            left: `${pinTooltip.x}px`,
            top: `${pinTooltip.y}px`,
            transform: 'translateX(-50%)',
            zIndex: 1000
          }}
        >
          <button
            className="pin-selection-btn"
            onClick={handlePinSelection}
            title="Pin selected text"
          >
            📌
          </button>
        </div>
      )}
    </>
  );
};

export default SentenceDisplay;