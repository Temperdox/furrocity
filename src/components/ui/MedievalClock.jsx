/**
 * @fileoverview MedievalClock - Animated medieval-style clock display
 *
 * Features:
 * - Ornate medieval clock face design
 * - Animated hour and minute hands
 * - Day counter display
 * - Time period indicator
 * - Day/night visual effects
 * - Expandable for more details
 *
 * @module components/ui/MedievalClock
 */

import React, { useState, useMemo } from 'react';
import './MedievalClock.css';

/**
 * Roman numeral conversion for clock face
 */
const ROMAN_NUMERALS = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

/**
 * MedievalClock - Ornate animated clock component
 */
const MedievalClock = ({
  time = { day: 1, hour: 8, minute: 0 },
  timeSummary = null,
  onSleep = null,
  canSleep = null, // Function that returns { canSleep: boolean, reason: string }
  showDetails = false,
  size = 'medium',
  position = 'top-right'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if player can sleep
  const sleepStatus = useMemo(() => {
    if (!canSleep || typeof canSleep !== 'function') {
      return { canSleep: true, reason: '' };
    }
    return canSleep();
  }, [canSleep]);

  // Calculate clock angles
  const clockData = useMemo(() => {
    const hour = time.hour || 8;
    const minute = time.minute || 0;

    // Hour hand: 360 degrees / 12 hours = 30 degrees per hour
    const hourAngle = ((hour % 12) * 30) + (minute * 0.5);

    // Minute hand: 360 degrees / 60 minutes = 6 degrees per minute
    const minuteAngle = minute * 6;

    // Determine time period
    let period = 'Morning';
    let periodIcon = '☀️';
    let isNight = false;

    if (hour >= 21 || hour < 5) {
      period = 'Night';
      periodIcon = '🌙';
      isNight = true;
    } else if (hour >= 5 && hour < 7) {
      period = 'Dawn';
      periodIcon = '🌅';
    } else if (hour >= 7 && hour < 12) {
      period = 'Morning';
      periodIcon = '☀️';
    } else if (hour >= 12 && hour < 17) {
      period = 'Afternoon';
      periodIcon = '🌤️';
    } else if (hour >= 17 && hour < 20) {
      period = 'Evening';
      periodIcon = '🌆';
    } else if (hour >= 20 && hour < 21) {
      period = 'Dusk';
      periodIcon = '🌇';
    }

    // Format time
    const displayHour = hour % 12 || 12;
    const displayMinute = minute.toString().padStart(2, '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';

    return {
      hourAngle,
      minuteAngle,
      period,
      periodIcon,
      isNight,
      formatted: `${displayHour}:${displayMinute} ${ampm}`,
      formatted24: `${hour.toString().padStart(2, '0')}:${displayMinute}`,
      day: time.day || 1
    };
  }, [time]);

  // Use summary if provided
  const displayData = timeSummary || clockData;

  const handleClick = () => {
    if (showDetails) {
      setIsExpanded(!isExpanded);
    }
  };

  const sizeClass = `medieval-clock--${size}`;
  const positionClass = `medieval-clock--${position}`;

  return (
    <div
      className={`medieval-clock ${sizeClass} ${positionClass} ${displayData.isNight ? 'medieval-clock--night' : 'medieval-clock--day'} ${isExpanded ? 'medieval-clock--expanded' : ''}`}
      onClick={handleClick}
    >
      {/* Clock Face */}
      <div className="clock-face">
        {/* Decorative outer ring */}
        <div className="clock-ring clock-ring--outer">
          <svg viewBox="0 0 200 200" className="clock-decoration">
            {/* Ornate border pattern */}
            <circle cx="100" cy="100" r="95" className="clock-border-outer" />
            <circle cx="100" cy="100" r="88" className="clock-border-inner" />

            {/* Decorative corner flourishes */}
            {[0, 90, 180, 270].map(angle => (
              <g key={angle} transform={`rotate(${angle} 100 100)`}>
                <path
                  d="M100 5 L103 15 L100 12 L97 15 Z"
                  className="clock-flourish"
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Roman numerals */}
        <div className="clock-numerals">
          {ROMAN_NUMERALS.map((numeral, index) => {
            const angle = (index * 30) - 90; // Start from 12 o'clock
            const radius = 38; // Percentage from center
            const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
            const y = 50 + radius * Math.sin((angle * Math.PI) / 180);

            return (
              <span
                key={numeral}
                className="clock-numeral"
                style={{
                  left: `${x}%`,
                  top: `${y}%`
                }}
              >
                {numeral}
              </span>
            );
          })}
        </div>

        {/* Hour markers */}
        <div className="clock-markers">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="clock-marker clock-marker--hour"
              style={{ transform: `rotate(${i * 30}deg)` }}
            />
          ))}
          {Array.from({ length: 60 }, (_, i) => (
            i % 5 !== 0 && (
              <div
                key={`min-${i}`}
                className="clock-marker clock-marker--minute"
                style={{ transform: `rotate(${i * 6}deg)` }}
              />
            )
          ))}
        </div>

        {/* Clock hands */}
        <div className="clock-hands">
          <div
            className="clock-hand clock-hand--hour"
            style={{ transform: `rotate(${clockData.hourAngle}deg)` }}
          >
            <div className="hand-body" />
            <div className="hand-tip" />
          </div>
          <div
            className="clock-hand clock-hand--minute"
            style={{ transform: `rotate(${clockData.minuteAngle}deg)` }}
          >
            <div className="hand-body" />
            <div className="hand-tip" />
          </div>
          <div className="clock-center-pin" />
        </div>

        {/* Day/Night indicator in center */}
        <div className="clock-period-icon">
          {displayData.periodIcon}
        </div>
      </div>

      {/* Day Counter */}
      <div className="clock-day-counter">
        <span className="day-label">Day</span>
        <span className="day-number">{displayData.day}</span>
      </div>

      {/* Time Display */}
      <div className="clock-time-display">
        <span className="time-text">{clockData.formatted}</span>
        <span className="period-text">{displayData.period}</span>
      </div>

      {/* Expanded Panel */}
      {isExpanded && showDetails && (
        <div className="clock-expanded-panel">
          <div className="expanded-header">
            <span className="expanded-icon">{displayData.periodIcon}</span>
            <span className="expanded-period">{displayData.period}</span>
          </div>

          <div className="expanded-details">
            <div className="detail-row">
              <span className="detail-label">Day</span>
              <span className="detail-value">{displayData.day}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Time</span>
              <span className="detail-value">{clockData.formatted24}</span>
            </div>
          </div>

          {onSleep && (
            <div className="expanded-actions">
              {!sleepStatus.canSleep && (
                <div className="sleep-blocked-reason">
                  {sleepStatus.reason || 'You cannot sleep here.'}
                </div>
              )}
              {!displayData.isNight && (
                <button
                  className={`sleep-btn sleep-btn--night ${!sleepStatus.canSleep ? 'sleep-btn--disabled' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (sleepStatus.canSleep) {
                      onSleep('night');
                    }
                  }}
                  disabled={!sleepStatus.canSleep}
                  title={!sleepStatus.canSleep ? sleepStatus.reason : 'Sleep until 9 PM'}
                >
                  Sleep until Night
                </button>
              )}
              <button
                className={`sleep-btn sleep-btn--morning ${!sleepStatus.canSleep ? 'sleep-btn--disabled' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (sleepStatus.canSleep) {
                    onSleep('morning');
                  }
                }}
                disabled={!sleepStatus.canSleep}
                title={!sleepStatus.canSleep ? sleepStatus.reason : 'Sleep until 7 AM'}
              >
                Sleep until Morning
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Compact clock display for minimal UI
 */
export const CompactClock = ({ time, className = '' }) => {
  const hour = time?.hour || 8;
  const minute = time?.minute || 0;
  const day = time?.day || 1;

  const isNight = hour >= 21 || hour < 5;
  const displayHour = hour % 12 || 12;
  const displayMinute = minute.toString().padStart(2, '0');
  const ampm = hour >= 12 ? 'PM' : 'AM';

  let icon = '☀️';
  if (hour >= 21 || hour < 5) icon = '🌙';
  else if (hour >= 5 && hour < 7) icon = '🌅';
  else if (hour >= 17 && hour < 20) icon = '🌆';
  else if (hour >= 20 && hour < 21) icon = '🌇';

  return (
    <div className={`compact-clock ${isNight ? 'compact-clock--night' : ''} ${className}`}>
      <span className="compact-clock-icon">{icon}</span>
      <span className="compact-clock-time">{displayHour}:{displayMinute} {ampm}</span>
      <span className="compact-clock-day">Day {day}</span>
    </div>
  );
};

export default MedievalClock;
