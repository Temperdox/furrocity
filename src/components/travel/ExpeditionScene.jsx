/**
 * @fileoverview ExpeditionScene - Region-to-region travel interface
 *
 * Provides an interactive travel scene with:
 * - Progress, Rest, Scavenge, Items buttons
 * - Character paperdoll display
 * - Travel stamina bar
 * - Progress bar with animated icon
 * - Day/night cycle display
 * - Camp/torch status indicators
 *
 * @module components/travel/ExpeditionScene
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import './ExpeditionScene.css';

/**
 * ExpeditionScene - Main travel scene component
 */
const ExpeditionScene = ({
  expedition,
  expeditionSystem,
  playerState,
  gameTime,
  FullBodyPaperdoll,
  onProgress,
  onRest,
  onScavenge,
  onOpenInventory,
  onSetCamp,
  onToggleTorch,
  onComplete,
  onEncounter,
  onCancel
}) => {
  const [isProgressing, setIsProgressing] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [fadePortrait, setFadePortrait] = useState(false);

  // Calculate expedition summary
  const summary = useMemo(() => {
    if (!expeditionSystem || !expedition) return null;
    return expeditionSystem.getExpeditionSummary(expedition);
  }, [expeditionSystem, expedition]);

  // Time of day helpers
  const timeOfDay = useMemo(() => {
    if (!gameTime) return { isNight: false, timeString: 'Day', icon: '☀️' };
    const hour = gameTime.currentHour || 12;
    if (hour >= 6 && hour < 12) return { isNight: false, timeString: 'Morning', icon: '🌅' };
    if (hour >= 12 && hour < 18) return { isNight: false, timeString: 'Afternoon', icon: '☀️' };
    if (hour >= 18 && hour < 21) return { isNight: false, timeString: 'Evening', icon: '🌆' };
    return { isNight: true, timeString: 'Night', icon: '🌙' };
  }, [gameTime]);

  // Show temporary message
  const showActionMessage = useCallback((message, duration = 2000) => {
    setMessageText(message);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), duration);
  }, []);

  // Handle progress action with animation
  const handleProgress = useCallback(async () => {
    if (!expedition || expedition.isComplete) return;

    // Check stamina
    if (expedition.travelStamina < 10) {
      showActionMessage('Too exhausted to continue! Rest or eat food.');
      return;
    }

    setIsProgressing(true);
    setFadePortrait(true);

    // Wait for fade effect
    await new Promise(resolve => setTimeout(resolve, 500));

    const result = onProgress?.();

    if (result) {
      setLastAction(result);

      if (result.encounter) {
        showActionMessage(result.encounter.message);
        setTimeout(() => {
          onEncounter?.(result.encounter);
        }, 1000);
      } else if (result.isComplete) {
        showActionMessage(`Arrived at ${expedition.toRegionName}!`);
        setTimeout(() => {
          onComplete?.();
        }, 1500);
      } else {
        showActionMessage(`Traveled ${result.distanceCovered} miles. ${result.distanceRemaining} remaining.`);
      }
    }

    setFadePortrait(false);
    setIsProgressing(false);
  }, [expedition, onProgress, onEncounter, onComplete, showActionMessage]);

  // Handle rest action
  const handleRest = useCallback(() => {
    const result = onRest?.();
    if (result) {
      setLastAction(result);
      if (result.encounter) {
        showActionMessage('Your rest was interrupted!');
        setTimeout(() => {
          onEncounter?.(result.encounter);
        }, 1000);
      } else {
        showActionMessage(`Rested for ${result.hoursElapsed} hours. Recovered ${result.staminaRecovered} stamina.`);
      }
    }
  }, [onRest, onEncounter, showActionMessage]);

  // Handle scavenge action
  const handleScavenge = useCallback(() => {
    const result = onScavenge?.();
    if (result) {
      setLastAction(result);
      showActionMessage(result.message || 'Searched the area...');

      if (result.encounter) {
        setTimeout(() => {
          onEncounter?.(result.encounter);
        }, 1500);
      }
    }
  }, [onScavenge, onEncounter, showActionMessage]);

  // Toggle torch
  const handleToggleTorch = useCallback(() => {
    const newState = !expedition?.hasTorch;
    onToggleTorch?.(newState);
    showActionMessage(newState ? 'Torch lit.' : 'Torch extinguished.');
  }, [expedition?.hasTorch, onToggleTorch, showActionMessage]);

  // Set up camp
  const handleSetCamp = useCallback((campType) => {
    onSetCamp?.(campType);
    showActionMessage(`Set up ${campType === 'basic' ? 'a basic camp' : `a ${campType}`}.`);
  }, [onSetCamp, showActionMessage]);

  if (!expedition || !summary) {
    return null;
  }

  // Stamina color based on percentage
  const staminaColor = summary.staminaPercent > 60 ? '#22c55e' :
                        summary.staminaPercent > 30 ? '#eab308' : '#ef4444';

  // Danger level display
  const dangerDisplay = '⚠️'.repeat(Math.min(summary.dangerLevel || 1, 5));

  return createPortal(
    <div className="expedition-scene-overlay">
      <div className="expedition-scene">
        {/* Background based on terrain */}
        <div className={`expedition-background terrain-${summary.terrain?.replace(/_/g, '-') || 'default'}`}>
          <div className={`expedition-time-overlay ${timeOfDay.isNight ? 'night' : 'day'}`} />
        </div>

        {/* Main Content */}
        <div className="expedition-content">
          {/* Left Panel - Info and Actions */}
          <div className="expedition-left-panel">
            {/* Header */}
            <div className="expedition-header">
              <h2 className="expedition-title">Expedition</h2>
              <div className="expedition-route">
                <span className="expedition-from">{summary.fromRegion}</span>
                <span className="expedition-arrow">→</span>
                <span className="expedition-to">{summary.toRegion}</span>
              </div>
            </div>

            {/* Status Section */}
            <div className="expedition-status">
              {/* Time Display */}
              <div className="expedition-time">
                <span className="time-icon">{timeOfDay.icon}</span>
                <span className="time-text">{timeOfDay.timeString}</span>
                {gameTime && (
                  <span className="time-detail">Day {gameTime.currentDay}, Hour {gameTime.currentHour}</span>
                )}
              </div>

              {/* Terrain and Danger */}
              <div className="expedition-terrain">
                <span className="terrain-label">Terrain:</span>
                <span className="terrain-name">{summary.terrain?.replace(/_/g, ' ') || 'Unknown'}</span>
              </div>
              <div className="expedition-danger">
                <span className="danger-label">Danger:</span>
                <span className="danger-level">{dangerDisplay}</span>
              </div>

              {/* Hours Elapsed */}
              <div className="expedition-hours">
                <span className="hours-label">Time elapsed:</span>
                <span className="hours-value">{summary.hoursElapsed} hours</span>
              </div>
            </div>

            {/* Equipment Status */}
            <div className="expedition-equipment">
              <div
                className={`equipment-item torch ${expedition.hasTorch ? 'active' : ''}`}
                onClick={handleToggleTorch}
                title={expedition.hasTorch ? 'Extinguish torch' : 'Light torch'}
              >
                <span className="equipment-icon">🔥</span>
                <span className="equipment-label">Torch</span>
                <span className="equipment-status">{expedition.hasTorch ? 'Lit' : 'Off'}</span>
              </div>
              <div
                className={`equipment-item camp ${expedition.campType ? 'active' : ''}`}
                title={expedition.campType || 'No camp set'}
              >
                <span className="equipment-icon">⛺</span>
                <span className="equipment-label">Camp</span>
                <span className="equipment-status">{expedition.campType || 'None'}</span>
              </div>
            </div>

            {/* Warning Messages */}
            {timeOfDay.isNight && !expedition.hasTorch && (
              <div className="expedition-warning">
                Traveling at night without a torch increases encounter chance!
              </div>
            )}

            {/* Stamina Bar */}
            <div className="expedition-stamina">
              <div className="stamina-header">
                <span className="stamina-label">Travel Stamina</span>
                <span className="stamina-value">{summary.stamina} / {summary.maxStamina}</span>
              </div>
              <div className="stamina-bar-container">
                <div
                  className="stamina-bar-fill"
                  style={{
                    width: `${summary.staminaPercent}%`,
                    backgroundColor: staminaColor
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="expedition-actions">
              <button
                className="expedition-btn expedition-btn--progress"
                onClick={handleProgress}
                disabled={isProgressing || expedition.travelStamina < 10 || expedition.isComplete}
              >
                <span className="btn-icon">🚶</span>
                <span className="btn-text">Progress</span>
              </button>
              <button
                className="expedition-btn expedition-btn--rest"
                onClick={handleRest}
                disabled={isProgressing}
              >
                <span className="btn-icon">💤</span>
                <span className="btn-text">Rest</span>
              </button>
              <button
                className="expedition-btn expedition-btn--scavenge"
                onClick={handleScavenge}
                disabled={isProgressing}
              >
                <span className="btn-icon">🔍</span>
                <span className="btn-text">Scavenge</span>
              </button>
              <button
                className="expedition-btn expedition-btn--items"
                onClick={onOpenInventory}
                disabled={isProgressing}
              >
                <span className="btn-icon">🎒</span>
                <span className="btn-text">Items</span>
              </button>
            </div>

            {/* Camp Options */}
            <div className="expedition-camp-options">
              <span className="camp-options-label">Set Camp:</span>
              <div className="camp-buttons">
                <button
                  className={`camp-btn ${expedition.campType === 'basic' ? 'active' : ''}`}
                  onClick={() => handleSetCamp('basic')}
                  disabled={isProgressing}
                >
                  Basic
                </button>
                <button
                  className={`camp-btn ${expedition.campType === 'tent' ? 'active' : ''}`}
                  onClick={() => handleSetCamp('tent')}
                  disabled={isProgressing}
                >
                  Tent
                </button>
                <button
                  className={`camp-btn ${expedition.campType === null ? 'active' : ''}`}
                  onClick={() => handleSetCamp(null)}
                  disabled={isProgressing || !expedition.campType}
                >
                  Pack Up
                </button>
              </div>
            </div>

            {/* Cancel Button */}
            <div className="expedition-footer">
              <button
                className="expedition-btn expedition-btn--cancel"
                onClick={onCancel}
                disabled={isProgressing}
              >
                Abandon Expedition
              </button>
            </div>
          </div>

          {/* Right Panel - Character Portrait */}
          <div className="expedition-right-panel">
            <div className={`expedition-portrait ${fadePortrait ? 'fading' : ''}`}>
              {FullBodyPaperdoll && (
                <FullBodyPaperdoll
                  paperdollState={playerState?.paperdoll}
                  width={280}
                  height={400}
                  showLayerCount={false}
                />
              )}
            </div>

            {/* Discoveries */}
            {summary.discoveries?.length > 0 && (
              <div className="expedition-discoveries">
                <span className="discoveries-label">Discovered:</span>
                <ul className="discoveries-list">
                  {summary.discoveries.map((discovery, idx) => (
                    <li key={idx} className="discovery-item">
                      {discovery.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar at Bottom */}
        <div className="expedition-progress-bar-container">
          <div className="expedition-progress-bar">
            <div
              className="expedition-progress-fill"
              style={{ width: `${summary.progress}%` }}
            />
            <div
              className="expedition-progress-icon"
              style={{ left: `calc(${summary.progress}% - 16px)` }}
            >
              🚶
            </div>
            <div className="expedition-progress-markers">
              <span className="progress-start">{summary.fromRegion}</span>
              <span className="progress-distance">{summary.distanceTraveled} / {summary.totalDistance} miles</span>
              <span className="progress-end">{summary.toRegion}</span>
            </div>
          </div>
        </div>

        {/* Action Message Popup */}
        {showMessage && (
          <div className="expedition-message">
            {messageText}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ExpeditionScene;
