import React, { useState, useEffect, useRef } from 'react';

const AISuggestionsPopover = ({ 
  isOpen, 
  onClose, 
  onSelectSuggestion, 
  fieldName, 
  fieldType, 
  existingFormData, 
  generatorType,
  triggerRef 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchSuggestions();
    }
  }, [isOpen, fieldName, fieldType, existingFormData, generatorType]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target) &&
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Import the API helper to get auth headers
      const { apiRequest } = await import('../utils/api-config');
      
      const data = await apiRequest('/ai-assist', {
        method: 'POST',
        body: JSON.stringify({
          fieldName,
          fieldType,
          existingFormData,
          generatorType
        })
      });

      setSuggestions(data.data.suggestions || []);
    } catch (error) {
      console.error('Failed to fetch AI suggestions:', error);
      setError('Failed to load suggestions');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    onSelectSuggestion(suggestion);
    onClose();
  };

  const getPopoverPosition = () => {
    if (!triggerRef.current) return { top: 0, left: 0 };
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    return {
      top: triggerRect.bottom + scrollTop + 8,
      left: triggerRect.left + scrollLeft
    };
  };

  if (!isOpen) return null;

  const position = getPopoverPosition();

  return (
    <div 
      ref={popoverRef}
      className="ai-suggestions-popover"
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 1000
      }}
    >
      <div className="ai-suggestions-header">
        <h4>AI Suggestions for {fieldName}</h4>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="ai-suggestions-content">
        {isLoading && (
          <div className="suggestions-loading">
            <div className="suggestions-spinner"></div>
            <span>Generating suggestions...</span>
          </div>
        )}
        
        {error && (
          <div className="suggestions-error">
            <span>{error}</span>
            <button onClick={fetchSuggestions} className="retry-btn">Retry</button>
          </div>
        )}
        
        {!isLoading && !error && suggestions.length > 0 && (
          <div className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <span className="suggestion-text">{suggestion}</span>
                <span className="suggestion-action">Click to use</span>
              </button>
            ))}
          </div>
        )}
        
        {!isLoading && !error && suggestions.length === 0 && (
          <div className="suggestions-empty">
            <span>No suggestions available</span>
            <button onClick={fetchSuggestions} className="retry-btn">Try again</button>
          </div>
        )}
      </div>
      
      <div className="ai-suggestions-footer">
        <span className="ai-powered">✨ Powered by AI</span>
      </div>
    </div>
  );
};

export default AISuggestionsPopover;