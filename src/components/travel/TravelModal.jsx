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
  onTravelToRegion,
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
  // Allow selecting both locked and unlocked locations
  // Locked locations will show requirements in the panel
  const handleLocationClick = useCallback((item) => {
    // Only allow clicking on discovered/visible locations
    if (item.visible !== false) {
      setSelectedLocation(item);
    }
  }, []);

  // Handle travel confirmation
  // Allow attempting travel to locked locations - the parent will handle showing the requirement scene
  const handleTravel = useCallback(() => {
    if (selectedLocation) {
      if (mapView === 'world') {
        // Region travel - trigger expedition
        if (selectedLocation.unlockStatus?.unlocked) {
          onTravelToRegion?.(selectedLocation.id, selectedLocation);
          onClose?.();
        } else {
          // Locked region - could show investigate scene
          onTravelToRegion?.(selectedLocation.id, selectedLocation);
          onClose?.();
        }
      } else {
        // Let the parent handle locked locations (will show requirement scene)
        onTravel(selectedLocation.id);
      }
      setSelectedLocation(null);
    }
  }, [selectedLocation, mapView, onTravel, onTravelToRegion, onClose]);

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
          <div className={`selected-location-panel ${selectedLocation.unlockStatus?.unlocked ? '' : 'locked'}`}>
            <div className="selected-location-header">
              <h3 className="selected-location-name">
                {!selectedLocation.unlockStatus?.unlocked && <span className="lock-icon">🔒 </span>}
                {selectedLocation.name}
              </h3>
              {selectedLocation.dangerLevel && selectedLocation.unlockStatus?.unlocked && (
                <span className={`danger-level danger-level-${selectedLocation.dangerLevel}`}>
                  {'⚠️'.repeat(Math.min(selectedLocation.dangerLevel, 5))}
                </span>
              )}
            </div>
            <p className="selected-location-description">{selectedLocation.description}</p>

            {/* Show requirements for locked locations */}
            {!selectedLocation.unlockStatus?.unlocked && (
              <div className="selected-location-requirements">
                <p className="requirements-header">Requirements to enter:</p>
                <ul className="requirements-list">
                  {(selectedLocation.unlockStatus?.unmetRequirements || ['Location is locked']).map((req, idx) => (
                    <li key={idx} className="requirement-item unmet">
                      <span className="requirement-icon">✗</span>
                      <span className="requirement-text">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedLocation.unlockStatus?.unlocked && selectedLocation.tags && (
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
              className={`travel-btn ${selectedLocation?.unlockStatus?.unlocked ? 'travel-btn--confirm' : 'travel-btn--locked'}`}
              disabled={!selectedLocation || (mapView === 'local' && selectedLocation.id === currentLocation) || (mapView === 'world' && selectedLocation.id === currentRegion)}
              onClick={handleTravel}
            >
              {mapView === 'world'
                ? (selectedLocation?.unlockStatus?.unlocked ? 'Travel' : 'Investigate')
                : selectedLocation?.unlockStatus?.unlocked
                  ? 'Travel'
                  : 'Investigate'}
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
