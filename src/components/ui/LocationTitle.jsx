/**
 * @fileoverview LocationTitle - Animated location name display
 *
 * Shows the location name at the top of the screen with:
 * - Fade in (0.5s) → Hold (2.5s) → Fade out (1s)
 * - Tag-based custom fonts
 * - Optional subtitle
 *
 * @module components/ui/LocationTitle
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './LocationTitle.css';

/**
 * LocationTitle - Displays animated location title on area change
 */
const LocationTitle = ({
  name,
  subtitle = null,
  fontStyle = {},
  fontTag = 'neutral',
  onComplete
}) => {
  const [phase, setPhase] = useState('fade-in'); // fade-in, hold, fade-out, complete

  // Use ref for onComplete to avoid re-triggering effect when callback changes
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Animation timing
  const FADE_IN_DURATION = 500;
  const HOLD_DURATION = 2500;
  const FADE_OUT_DURATION = 1000;

  useEffect(() => {
    // Start fade-in
    setPhase('fade-in');

    // After fade-in completes, start hold
    const holdTimer = setTimeout(() => {
      setPhase('hold');
    }, FADE_IN_DURATION);

    // After hold completes, start fade-out
    const fadeOutTimer = setTimeout(() => {
      setPhase('fade-out');
    }, FADE_IN_DURATION + HOLD_DURATION);

    // After fade-out completes, call onComplete
    const completeTimer = setTimeout(() => {
      setPhase('complete');
      onCompleteRef.current?.();
    }, FADE_IN_DURATION + HOLD_DURATION + FADE_OUT_DURATION);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [name]); // Only re-run when name changes, not when onComplete reference changes

  // Build style object from fontStyle
  const titleStyle = {
    fontFamily: fontStyle.fontFamily || "'Crimson Text', Georgia, serif",
    color: fontStyle.color || '#e0e0e0',
    textShadow: fontStyle.textShadow || '0 2px 4px rgba(0,0,0,0.6)',
    fontSize: fontStyle.fontSize || '2.5rem',
    fontWeight: fontStyle.fontWeight || '600',
    ...(fontStyle.animation && { animation: fontStyle.animation })
  };

  if (phase === 'complete') {
    return null;
  }

  return createPortal(
    <div className={`location-title-overlay ${phase}`}>
      <div className="location-title-container">
        <h1
          className={`location-title-text font-tag-${fontTag}`}
          style={titleStyle}
        >
          {name}
        </h1>
        {subtitle && (
          <p className="location-title-subtitle">{subtitle}</p>
        )}
      </div>
    </div>,
    document.body
  );
};

export default LocationTitle;
