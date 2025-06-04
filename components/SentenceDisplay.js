import React, { useRef, useEffect, useState } from 'react';
import { usePins } from '../hooks/usePins';

const SentenceDisplay = ({ content, title, sourceType = 'content' }) => {
  const { addPin, removePin, isPinned, getPinBySentence } = usePins();
  const contentRef = useRef(null);
  const [pinTooltip, setPinTooltip] = useState({ show: false, x: 0, y: 0, selectedText: '' });

  const handleSentenceClick = (sentenceText) => {
    if (isPinned(sentenceText)) {
      // Unpin
      const pin = getPinBySentence(sentenceText);
      if (pin) {
        removePin(pin.id);
      }
    } else {
      // Pin
      addPin(sentenceText, title, sourceType);
    }
  };

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

  const renderSentences = () => {
    // Safety check for content
    if (!content || typeof content !== 'string') {
      return <div>No content available</div>;
    }
    
    // Split content into sentences
    const sentences = content.match(/[^\.!?]+[\.!?]+/g) || [];
    
    return sentences.map((sentence, index) => {
      const cleanSentence = sentence.trim();
      if (!cleanSentence) return null;

      const pinned = isPinned(cleanSentence);
      
      return (
        <span
          key={index}
          className={`sentence ${pinned ? 'pinned' : ''}`}
          onClick={() => handleSentenceClick(cleanSentence)}
          title={pinned ? 'Click to unpin' : 'Click to pin'}
        >
          {cleanSentence}
        </span>
      );
    }).filter(Boolean).map((element, index, array) => (
      <React.Fragment key={index}>
        {element}
        {index < array.length - 1 ? ' ' : ''}
      </React.Fragment>
    ));
  };

  return (
    <>
      <div 
        className="generated-content"
        ref={contentRef}
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
      >
        {renderSentences()}
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