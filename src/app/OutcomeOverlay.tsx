import React from 'react';
import './OutcomeOverlay.css';

type OutcomeOverlayProps = {
  outcome: string | null;
  emoji: string;
  onClose: () => void; // Function to call when the overlay is clicked or touched
};

const OutcomeOverlay = ({ outcome, emoji, onClose }: OutcomeOverlayProps) => {
  const handleOverlayClick = () => {
    onClose(); // Call the onClose function when the overlay is clicked or touched
  };

  return (
    outcome ? (
      <div className="outcome-overlay" onClick={handleOverlayClick} onTouchStart={handleOverlayClick}>
        <div className="outcome-emoji shake">{emoji}</div>
      </div>
    ) : null
  );
};

export default OutcomeOverlay;