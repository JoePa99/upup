import { useState, useEffect } from 'react';

export const usePins = () => {
  const [pinnedSentences, setPinnedSentences] = useState([]);

  // Load pins from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pinnedSentences');
    if (saved) {
      try {
        setPinnedSentences(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading pinned sentences:', error);
      }
    }
  }, []);

  // Save to localStorage whenever pins change
  const savePins = (newPins) => {
    setPinnedSentences(newPins);
    localStorage.setItem('pinnedSentences', JSON.stringify(newPins));
  };

  // Add a pin
  const addPin = (sentence, source, sourceType = 'content') => {
    const newPin = {
      id: `pin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: sentence,
      source: source,
      sourceType: sourceType,
      timestamp: new Date().toISOString()
    };

    const newPins = [...pinnedSentences, newPin];
    savePins(newPins);
    return newPin.id;
  };

  // Remove a pin
  const removePin = (pinId) => {
    const newPins = pinnedSentences.filter(pin => pin.id !== pinId);
    savePins(newPins);
  };

  // Remove pin by index
  const removePinByIndex = (index) => {
    const newPins = [...pinnedSentences];
    newPins.splice(index, 1);
    savePins(newPins);
  };

  // Clear all pins
  const clearPins = () => {
    savePins([]);
  };

  // Update pin text
  const updatePin = (pinId, newText) => {
    const newPins = pinnedSentences.map(pin => 
      pin.id === pinId ? { ...pin, text: newText } : pin
    );
    savePins(newPins);
  };

  // Check if a sentence is pinned
  const isPinned = (sentenceText) => {
    return pinnedSentences.some(pin => pin.text === sentenceText);
  };

  // Get pin by sentence text
  const getPinBySentence = (sentenceText) => {
    return pinnedSentences.find(pin => pin.text === sentenceText);
  };

  return {
    pinnedSentences,
    addPin,
    removePin,
    removePinByIndex,
    clearPins,
    updatePin,
    isPinned,
    getPinBySentence,
    pinCount: pinnedSentences.length
  };
};

export default usePins;