/**
 * @fileoverview TravelModal - Map-based travel interface
 *
 * Provides a modal with two map views:
 * - Local Map: Buildings/locations within the current region
 * - World Map: All regions in the world
 *
 * Features:
 * - Clickable location/region markers
 * - Locked locations shown grayed out with requirement tooltips
 * - Current location highlighted
 * - Travel confirmation
 *
 * @module components/travel/TravelModal
 */

import React, { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import './TravelModal.css';

/**
 * TravelModal - Main travel interface component
 */
const TravelModal = ({
  isOpen,
  onClose,
  currentLocation,
  currentRegion,
  playerState,
  gameState = {},
  locationSystem,
  onTravel,
  mapView = 'local',
  onMapViewChange
}) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Get locations/regions based on current view
  const mapData = useMemo(() => {
    if (!locationSystem) return { items: [], currentRegionData: null };

    if (mapView === 'local') {
      const regionData = locationSystem.getRegion(currentRegion);
      const locations = locationSystem.getRegionLocationsWithStatus(currentRegion, playerState, gameState);
      return { items: locations, currentRegionData: regionData };
    } else {
      const regions = locationSystem.getRegionsWithStatus(playerState, gameState);
      return { items: regions, currentRegionData: null };
    }
  }, [locationSystem, mapView, currentRegion, playerState, gameState]);

  // Handle location/region click
  const handleLocationClick = useCallback((item) => {
    if (item.unlockStatus?.unlocked) {
      setSelectedLocation(item);
    }
  }, []);

  // Handle travel confirmation
  const handleTravel = useCallback(() => {
    if (selectedLocation && selectedLocation.unlockStatus?.unlocked) {
      if (mapView === 'world') {
        // If selecting a region, switch to local view for that region
        onMapViewChange?.('local');
        // Could also set currentRegion if implementing region travel
      } else {
        onTravel(selectedLocation.id);
      }
      setSelectedLocation(null);
    }
  }, [selectedLocation, mapView, onTravel, onMapViewChange]);

  // Handle hover for tooltip positioning
  const handleMouseMove = useCallback((e, item) => {
    setHoveredLocation(item);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredLocation(null);
  }, []);

  if (!isOpen) return null;

  const currentLocationData = locationSystem?.getLocation(currentLocation);

  return createPortal(
    <div className="travel-modal-overlay" onClick={onClose}>
      <div className="travel-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="travel-modal-header">
          <h2 className="travel-modal-title">
            {mapView === 'local' ? `${mapData.currentRegionData?.name || 'Local Map'}` : 'World Map'}
          </h2>
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${mapView === 'local' ? 'active' : ''}`}
              onClick={() => onMapViewChange?.('local')}
            >
              Local Map
            </button>
            <button
              className={`view-toggle-btn ${mapView === 'world' ? 'active' : ''}`}
              onClick={() => onMapViewChange?.('world')}
            >
              World Map
            </button>
          </div>
          <button className="travel-modal-close" onClick={onClose}>X</button>
        </div>

        {/* Map Container */}
        <div className="map-container">
          {/* Map Background */}
          <div className="map-background">
            {mapView === 'local' && mapData.currentRegionData?.mapData?.localMapImage && (
              <img
                src={mapData.currentRegionData.mapData.localMapImage}
                alt="Local Map"
                className="map-image"
              />
            )}
            {mapView === 'world' && (
              <div className="map-placeholder">World Map</div>
            )}
          </div>

          {/* Location/Region Markers */}
          {mapData.items.map((item) => {
            const isCurrent = mapView === 'local'
              ? item.id === currentLocation
              : item.id === currentRegion;
            const isUnlocked = item.unlockStatus?.unlocked;
            const isSelected = selectedLocation?.id === item.id;

            const position = mapView === 'local'
              ? item.mapData?.localMapPosition
              : item.mapData?.worldMapPosition;

            if (!position) return null;

            return (
              <div
                key={item.id}
                className={`location-marker ${isCurrent ? 'current' : ''} ${isUnlocked ? '' : 'locked'} ${isSelected ? 'selected' : ''}`}
                style={{
                  left: `${position.x}px`,
                  top: `${position.y}px`
                }}
                onClick={() => handleLocationClick(item)}
                onMouseMove={(e) => handleMouseMove(e, item)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="location-marker-icon">
                  {locationSystem?.getLocationIcon(item) || '📍'}
                </div>
                {!isUnlocked && (
                  <div className="lock-overlay">🔒</div>
                )}
                <div className="location-marker-label">{item.name}</div>
              </div>
            );
          })}
        </div>

        {/* Selected Location Panel */}
        {selectedLocation && (
          <div className="selected-location-panel">
            <div className="selected-location-header">
              <h3 className="selected-location-name">{selectedLocation.name}</h3>
              {selectedLocation.dangerLevel && (
                <span className={`danger-level danger-level-${selectedLocation.dangerLevel}`}>
                  {'⚠️'.repeat(Math.min(selectedLocation.dangerLevel, 5))}
                </span>
              )}
            </div>
            <p className="selected-location-description">{selectedLocation.description}</p>
            {selectedLocation.tags && (
              <div className="selected-location-tags">
                {selectedLocation.tags.slice(0, 5).map(tag => (
                  <span key={tag} className="location-tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="travel-modal-footer">
          <div className="footer-info">
            <span className="current-location-label">
              Current: {currentLocationData?.name || currentLocation}
            </span>
          </div>
          <div className="footer-actions">
            <button
              className="travel-btn travel-btn--cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="travel-btn travel-btn--confirm"
              disabled={!selectedLocation || !selectedLocation.unlockStatus?.unlocked || selectedLocation.id === currentLocation}
              onClick={handleTravel}
            >
              {mapView === 'world' ? 'View Region' : 'Travel'}
            </button>
          </div>
        </div>

        {/* Hover Tooltip */}
        {hoveredLocation && !hoveredLocation.unlockStatus?.unlocked && (
          <RequirementTooltip
            location={hoveredLocation}
            position={tooltipPosition}
          />
        )}
      </div>
    </div>,
    document.body
  );
};

/**
 * RequirementTooltip - Shows unlock requirements on hover
 */
const RequirementTooltip = ({ location, position }) => {
  const requirements = location.unlockStatus?.unmetRequirements || [];

  return createPortal(
    <div
      className="requirement-tooltip"
      style={{
        position: 'fixed',
        left: `${position.x + 15}px`,
        top: `${position.y - 10}px`,
        zIndex: 10002
      }}
    >
      <div className="requirement-tooltip-header">
        <span className="lock-icon">🔒</span>
        <span className="tooltip-title">{location.name}</span>
      </div>
      <div className="requirement-tooltip-body">
        <p className="requirements-label">Requirements:</p>
        <ul className="requirements-list">
          {requirements.length > 0 ? (
            requirements.map((req, index) => (
              <li key={index} className="requirement-item unmet">
                <span className="requirement-icon">✗</span>
                <span className="requirement-text">{req}</span>
              </li>
            ))
          ) : (
            <li className="requirement-item">Location is locked</li>
          )}
        </ul>
      </div>
    </div>,
    document.body
  );
};

export default TravelModal;
