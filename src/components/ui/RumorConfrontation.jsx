/**
 * @fileoverview RumorConfrontation - UI for NPC rumor confrontations
 *
 * Displays when an NPC mentions a rumor about the player.
 * Shows response options with enabled/disabled states based on stats.
 *
 * @module components/ui/RumorConfrontation
 */

import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './RumorConfrontation.css';

/**
 * RumorConfrontation - Main confrontation UI component
 */
const RumorConfrontation = ({
  npc,
  rumor,
  dialogue,
  options,
  onResponse,
  onSkip,
  canSkip = false
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOptionClick = useCallback((option) => {
    if (!option.enabled || isProcessing) return;
    setSelectedOption(option);
  }, [isProcessing]);

  const handleConfirm = useCallback(() => {
    if (!selectedOption || isProcessing) return;

    setIsProcessing(true);
    onResponse(selectedOption.id);
  }, [selectedOption, isProcessing, onResponse]);

  const handleSkip = useCallback(() => {
    if (canSkip) {
      onSkip();
    }
  }, [canSkip, onSkip]);

  // Get rumor type icon
  const getRumorTypeIcon = (type) => {
    switch (type) {
      case 'slut': return '💋';
      case 'criminal': return '🗡️';
      case 'corrupted': return '👁️';
      case 'heroic': return '⭐';
      case 'mysterious': return '❓';
      default: return '💬';
    }
  };

  // Get rumor type color class
  const getRumorTypeClass = (type) => {
    switch (type) {
      case 'slut': return 'rumor-type-slut';
      case 'criminal': return 'rumor-type-criminal';
      case 'corrupted': return 'rumor-type-corrupted';
      case 'heroic': return 'rumor-type-heroic';
      case 'mysterious': return 'rumor-type-mysterious';
      default: return '';
    }
  };

  return createPortal(
    <div className="rumor-confrontation-overlay">
      <div className="rumor-confrontation-modal">
        {/* Header */}
        <div className="rumor-confrontation-header">
          <div className="npc-info">
            {npc.portrait && (
              <div className="npc-portrait">
                <img src={npc.portrait} alt={npc.name} />
              </div>
            )}
            <div className="npc-details">
              <h2 className="npc-name">{npc.name}</h2>
              <span className="confrontation-label">Mentions a rumor...</span>
            </div>
          </div>
          {canSkip && (
            <button
              className="skip-btn"
              onClick={handleSkip}
              title="Skip this rumor (you've seen it before)"
            >
              Skip
            </button>
          )}
        </div>

        {/* Dialogue */}
        <div className="rumor-dialogue-section">
          <p className="npc-dialogue">{dialogue}</p>
        </div>

        {/* Rumor Info */}
        <div className={`rumor-info ${getRumorTypeClass(rumor.type)}`}>
          <div className="rumor-header">
            <span className="rumor-type-icon">{getRumorTypeIcon(rumor.type)}</span>
            <span className="rumor-type-label">{rumor.type.toUpperCase()} RUMOR</span>
            <span className="rumor-severity">
              Severity: {rumor.severity}/100
            </span>
          </div>
          <p className="rumor-text">"{rumor.text}"</p>
          <div className="rumor-spread">
            Known in {rumor.spreadLocations?.length || 1} location(s)
          </div>
        </div>

        {/* Response Options */}
        <div className="response-options">
          <h3 className="options-header">How do you respond?</h3>
          <div className="options-list">
            {options.map((option) => (
              <button
                key={option.id}
                className={`response-option ${option.enabled ? '' : 'disabled'} ${selectedOption?.id === option.id ? 'selected' : ''}`}
                onClick={() => handleOptionClick(option)}
                disabled={!option.enabled}
              >
                <div className="option-main">
                  <span className="option-label">{option.label}</span>
                  {option.nsfwEnabled && (
                    <span className="option-nsfw-badge">18+</span>
                  )}
                </div>
                <p className="option-description">{option.description}</p>
                {option.enabled && option.consequence && (
                  <p className="option-consequence">{option.consequence}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="rumor-confrontation-footer">
          <div className="selected-info">
            {selectedOption ? (
              <span>Selected: <strong>{selectedOption.label}</strong></span>
            ) : (
              <span className="select-hint">Select a response</span>
            )}
          </div>
          <button
            className="confirm-btn"
            onClick={handleConfirm}
            disabled={!selectedOption || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Respond'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/**
 * RumorConfrontationResult - Shows result of a rumor response
 */
export const RumorConfrontationResult = ({
  result,
  onClose
}) => {
  const getResultIcon = (success) => {
    return success ? '✓' : '✗';
  };

  const getResultClass = (success) => {
    return success ? 'result-success' : 'result-failure';
  };

  return createPortal(
    <div className="rumor-result-overlay">
      <div className="rumor-result-modal">
        <div className={`result-header ${getResultClass(result.success)}`}>
          <span className="result-icon">{getResultIcon(result.success)}</span>
          <span className="result-status">
            {result.success ? 'Success' : 'Failed'}
          </span>
        </div>

        <p className="result-message">{result.message}</p>

        {result.effects && result.effects.length > 0 && (
          <div className="result-effects">
            <h4>Effects:</h4>
            <ul>
              {result.effects.map((effect, index) => (
                <li key={index} className={`effect-item ${effect.value > 0 ? 'positive' : 'negative'}`}>
                  {formatEffect(effect)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button className="close-btn" onClick={onClose}>
          Continue
        </button>
      </div>
    </div>,
    document.body
  );
};

// Helper to format effect for display
const formatEffect = (effect) => {
  switch (effect.type) {
    case 'rumor_reduced':
      return `Rumor severity ${effect.value}`;
    case 'rumor_increased':
      return `Rumor severity +${effect.value}`;
    case 'criminal_infamy':
      return `Criminal Infamy +${effect.value}`;
    case 'slut_infamy':
      return `Slut Infamy +${effect.value}`;
    case 'gold_spent':
      return `Gold: ${effect.value}`;
    case 'trigger_seduction':
      return 'Triggered seduction...';
    default:
      return `${effect.type}: ${effect.value}`;
  }
};

export default RumorConfrontation;
