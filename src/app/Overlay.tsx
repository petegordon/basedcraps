import React from 'react';
import './Overlay.css'; // You'll create this CSS file to style the overlay

interface OverlayProps {
    countdown: number | null;
  }
  
const Overlay: React.FC<OverlayProps> = ({ countdown }) => {
  if (countdown === null) return null;

  return (
    <div className="overlay">
      <div className="countdown">
        {countdown}
      </div>
    </div>
  );
};

export default Overlay;
