/**
 * ServiceInteraction.jsx - UI for church, clinic, and nursery services
 */

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import './ServiceInteraction.css';

// Service type icons
const SERVICE_ICONS = {
  church: '⛪',
  clinic: '🏥',
  nursery: '🍼'
};

// Action icons
const ACTION_ICONS = {
  remove_curse: '✨',
  break_magical_hypnosis: '🧠',
  purify_corruption: '💫',
  remove_magical_debuffs: '🌟',
  tithe: '🪙',
  volunteer: '🤝',
  treat_stds: '💊',
  addiction_treatment: '💉',
  behavioral_therapy: '🛋️',
  remove_tech_hypnosis: '🔌',
  remove_conditioning: '🔓',
  terminate_pregnancy: '⚕️',
  medical_checkup: '🩺',
  medical_healing: '❤️‍🩹',
  lay_eggs: '🥚',
  give_birth: '👶',
  pregnancy_checkup: '📋',
  postpartum_care: '🛏️',
  fertility_consultation: '📊'
};

export default function ServiceInteraction({
  services,
  location,
  playerState,
  serviceDefinitions,
  onSelectService,
  onConfirmService,
  onClose
}) {
  const [selectedService, setSelectedService] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('gold');
  const [selectedOptions, setSelectedOptions] = useState({});

  // Group services by type
  const groupedServices = useMemo(() => {
    const groups = { church: [], clinic: [], nursery: [] };
    for (const service of services) {
      if (groups[service.type]) {
        groups[service.type].push(service);
      }
    }
    return groups;
  }, [services]);

  // Calculate cost for selected service
  const calculateCost = (service) => {
    if (!service) return null;

    if (paymentMethod === 'charity' && service.alternativeCost) {
      const charityCredit = playerState.charityCredit || 0;
      let needed = service.alternativeCost;
      if (service.alternativeCostType?.includes('per_point')) {
        needed *= Math.min(service.currentValue || 10, service.maxReduction || 30);
      }
      return {
        type: 'charity',
        cost: needed,
        unit: 'credits',
        canAfford: charityCredit >= needed,
        current: charityCredit
      };
    }

    let goldCost = service.cost || 0;

    if (service.costType === 'gold_per_point') {
      goldCost *= Math.min(service.currentValue || 10, service.maxReduction || 30);
    } else if (service.costType === 'gold_per_hp') {
      goldCost *= (playerState.maxHp - playerState.currentHp);
    } else if (service.costType === 'gold_per_condition') {
      goldCost *= (service.conditions?.length || 1);
    }

    return {
      type: 'gold',
      cost: goldCost,
      unit: 'gold',
      canAfford: playerState.gold >= goldCost,
      current: playerState.gold
    };
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setSelectedOptions({});
    if (onSelectService) onSelectService(service);
  };

  const handleConfirm = () => {
    if (!selectedService) return;
    const cost = calculateCost(selectedService);
    if (!cost?.canAfford) return;

    onConfirmService({
      service: selectedService,
      paymentMethod,
      cost: cost.cost,
      options: selectedOptions
    });
  };

  const renderServiceCard = (service) => {
    const isSelected = selectedService?.id === service.id;
    const cost = calculateCost(service);

    return (
      <div
        key={service.id}
        className={`service-card ${isSelected ? 'selected' : ''} ${!service.available ? 'unavailable' : ''}`}
        onClick={() => service.available && handleServiceSelect(service)}
      >
        <div className="service-icon">{ACTION_ICONS[service.action] || '📋'}</div>
        <div className="service-info">
          <h4 className="service-name">{service.name}</h4>
          <p className="service-description">{service.description}</p>
          {service.costType !== 'variable' && cost && (
            <div className={`service-cost ${!cost.canAfford ? 'unaffordable' : ''}`}>
              {cost.cost} {cost.unit}
            </div>
          )}
          {service.costType === 'variable' && (
            <div className="service-cost variable">Variable cost</div>
          )}
        </div>
      </div>
    );
  };

  const renderServiceGroup = (type, typeServices) => {
    if (typeServices.length === 0) return null;

    const config = serviceDefinitions?.[type] || {};
    const greeting = config.dialogue?.greeting || 'How can we help you?';

    return (
      <div key={type} className={`service-group service-group-${type}`}>
        <div className="service-group-header">
          <span className="service-group-icon">{SERVICE_ICONS[type]}</span>
          <h3 className="service-group-title">
            {type === 'church' ? 'Church Services' :
             type === 'clinic' ? 'Medical Services' :
             'Nursery Services'}
          </h3>
        </div>
        <p className="service-group-greeting">"{greeting}"</p>
        <div className="service-list">
          {typeServices.map(renderServiceCard)}
        </div>
      </div>
    );
  };

  const renderSelectedServiceDetails = () => {
    if (!selectedService) return null;

    const cost = calculateCost(selectedService);
    const canUseCharity = selectedService.alternativeCost && selectedService.type === 'church';

    return (
      <div className="service-details">
        <h3 className="details-title">
          {ACTION_ICONS[selectedService.action]} {selectedService.name}
        </h3>

        <p className="details-description">{selectedService.description}</p>

        {/* Show conditions/items being treated */}
        {selectedService.conditions && (
          <div className="details-conditions">
            <h4>Conditions to treat:</h4>
            <ul>
              {selectedService.conditions.map((c, i) => (
                <li key={i}>{c.name || c.id}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Tithe tiers */}
        {selectedService.tiers && (
          <div className="tithe-tiers">
            <h4>Offering amounts:</h4>
            {selectedService.tiers.map((tier, i) => (
              <label key={i} className="tithe-tier-option">
                <input
                  type="radio"
                  name="tithe-tier"
                  checked={selectedOptions.tier === tier}
                  onChange={() => setSelectedOptions({ ...selectedOptions, tier })}
                />
                <span className="tier-amount">{tier.amount} gold</span>
                <span className="tier-blessing">{tier.blessing.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        )}

        {/* Volunteer hours */}
        {selectedService.hoursAvailable && (
          <div className="volunteer-hours">
            <h4>Hours to work:</h4>
            <div className="hours-options">
              {selectedService.hoursAvailable.map(hours => (
                <button
                  key={hours}
                  className={`hours-btn ${selectedOptions.hours === hours ? 'selected' : ''}`}
                  onClick={() => setSelectedOptions({ ...selectedOptions, hours })}
                >
                  {hours}h
                  <span className="hours-credit">+{hours * selectedService.creditPerHour} credit</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Purification amount slider */}
        {selectedService.action === 'purifyCorruption' && (
          <div className="purification-slider">
            <h4>Amount to purify:</h4>
            <input
              type="range"
              min="1"
              max={Math.min(selectedService.currentValue, selectedService.maxReduction)}
              value={selectedOptions.amount || 10}
              onChange={(e) => setSelectedOptions({ ...selectedOptions, amount: parseInt(e.target.value) })}
            />
            <span className="slider-value">{selectedOptions.amount || 10} points</span>
          </div>
        )}

        {/* Payment method */}
        {canUseCharity && (
          <div className="payment-method">
            <h4>Payment method:</h4>
            <div className="payment-options">
              <label className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  value="gold"
                  checked={paymentMethod === 'gold'}
                  onChange={() => setPaymentMethod('gold')}
                />
                <span>Gold ({playerState.gold} available)</span>
              </label>
              <label className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  value="charity"
                  checked={paymentMethod === 'charity'}
                  onChange={() => setPaymentMethod('charity')}
                />
                <span>Charity Credit ({playerState.charityCredit || 0} available)</span>
              </label>
            </div>
          </div>
        )}

        {/* Cost display */}
        {cost && selectedService.costType !== 'variable' && selectedService.costType !== 'time' && (
          <div className={`details-cost ${!cost.canAfford ? 'unaffordable' : ''}`}>
            <span className="cost-label">Total cost:</span>
            <span className="cost-value">{cost.cost} {cost.unit}</span>
            {!cost.canAfford && (
              <span className="cost-warning">Insufficient {cost.unit}!</span>
            )}
          </div>
        )}

        {/* Confirm button */}
        <button
          className="confirm-service-btn"
          onClick={handleConfirm}
          disabled={!cost?.canAfford || (selectedService.tiers && !selectedOptions.tier) || (selectedService.hoursAvailable && !selectedOptions.hours)}
        >
          {selectedService.costType === 'time' ? 'Begin Work' : 'Confirm Service'}
        </button>
      </div>
    );
  };

  const content = (
    <div className="service-interaction-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="service-interaction-modal">
        <div className="service-interaction-header">
          <h2 className="location-name">{location?.name || 'Services'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="service-interaction-content">
          <div className="services-column">
            {renderServiceGroup('church', groupedServices.church)}
            {renderServiceGroup('clinic', groupedServices.clinic)}
            {renderServiceGroup('nursery', groupedServices.nursery)}

            {services.length === 0 && (
              <div className="no-services">
                <p>No services are currently needed or available.</p>
              </div>
            )}
          </div>

          {selectedService && (
            <div className="details-column">
              {renderSelectedServiceDetails()}
            </div>
          )}
        </div>

        <div className="service-interaction-footer">
          <div className="player-resources">
            <span className="resource gold">💰 {playerState.gold} gold</span>
            {(playerState.charityCredit || 0) > 0 && (
              <span className="resource charity">🤝 {playerState.charityCredit} charity credit</span>
            )}
          </div>
          <button className="leave-btn" onClick={onClose}>Leave</button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

// Result modal shown after service
export function ServiceResult({ result, service, onClose }) {
  if (!result) return null;

  const content = (
    <div className="service-result-overlay" onClick={onClose}>
      <div className="service-result-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`result-header ${result.success ? 'success' : 'failure'}`}>
          <span className="result-icon">{result.success ? '✅' : '❌'}</span>
          <span className="result-title">{result.success ? 'Service Complete' : 'Service Failed'}</span>
        </div>

        <p className="result-message">{result.message}</p>

        {result.effects && result.effects.length > 0 && (
          <div className="result-effects">
            <h4>Effects:</h4>
            <ul>
              {result.effects.map((effect, i) => (
                <li key={i} className={`effect-item ${effect.type}`}>
                  {formatEffect(effect)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button className="close-result-btn" onClick={onClose}>Continue</button>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

function formatEffect(effect) {
  switch (effect.type) {
    case 'curse_removed':
      return `Curse "${effect.curseId}" removed`;
    case 'all_curses_removed':
      return `${effect.count} curse(s) removed`;
    case 'magical_hypnosis_removed':
      return 'Magical enchantment dispelled';
    case 'tech_hypnosis_removed':
      return 'Neural conditioning removed';
    case 'corruption_reduced':
      return `Corruption reduced by ${effect.amount}%`;
    case 'std_cured':
      return `Infection "${effect.stdId}" cured`;
    case 'all_stds_cured':
      return `${effect.count} infection(s) cured`;
    case 'addiction_treated':
      return `Addiction "${effect.addictionId}" treated`;
    case 'addictions_treated':
      return `${effect.count} addiction(s) treated`;
    case 'pregnancy_terminated':
      return 'Pregnancy terminated safely';
    case 'eggs_laid':
      return `${effect.count} egg(s) laid successfully`;
    case 'gave_birth':
      return `Gave birth to ${effect.count} ${effect.childType} child${effect.count > 1 ? 'ren' : ''}`;
    case 'healed':
      return `Healed ${effect.amount} HP`;
    case 'time_passed':
      return `${effect.hours} hour(s) passed`;
    case 'blessing_received':
      return `Received ${effect.blessing.replace(/_/g, ' ')}`;
    case 'charity_credit_earned':
      return `Earned ${effect.amount} charity credit`;
    default:
      return effect.type.replace(/_/g, ' ');
  }
}
