import React from 'react';
import { usePins } from '../hooks/usePins';

const SentenceDisplay = ({ content, title, sourceType = 'content' }) => {
  const { addPin, removePin, isPinned, getPinBySentence } = usePins();

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

  const renderSentences = () => {
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
    <div className="generated-content">
      {renderSentences()}
    </div>
  );
};

export default SentenceDisplay;