import React from 'react';
import { usePins } from '../hooks/usePins';

const FloatingPinButton = ({ onTogglePinboard, showPinboard = false }) => {
  const { pins } = usePins();
  const pinCount = pins.length;

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
};

export default FloatingPinButton;