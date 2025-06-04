import React from 'react';
import { usePins } from '../hooks/usePins';

const FloatingPinButton = ({ onTogglePinboard, showPinboard = false }) => {
  try {
    const { pinCount = 0 } = usePins() || {};

    // Don't show the button if no pins exist and pinboard is closed
    if (pinCount === 0 && !showPinboard) {
      return null;
    }

    return (
      <button
        className="floating-pin-button"
        onClick={onTogglePinboard}
        title={showPinboard ? 'Close Pinboard' : `Open Pinboard (${pinCount} pins)`}
      >
        <span className="pin-icon">📌</span>
        {pinCount > 0 && (
          <span className="pin-counter">{pinCount}</span>
        )}
      </button>
    );
  } catch (error) {
    console.error('Error in FloatingPinButton:', error);
    return null;
  }
};

export default FloatingPinButton;