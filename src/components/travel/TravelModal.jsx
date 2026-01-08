/**
 * @fileoverview TravelModal - Map-based travel interface with three-tier hierarchy
 *
 * Provides a modal with three map views:
 * - Kingdom Map: All kingdoms in the world (top level)
 * - Region Map: Regions within a selected kingdom
 * - Local Map: Buildings/locations within the current region
 *
 * Features:
 * - Three-tier navigation hierarchy
 * - Breadcrumb navigation (Kingdom > Region > Location)
 * - Clickable location/region/kingdom markers
 * - Locked areas shown grayed out with requirement tooltips
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
  currentKingdom,
  playerState,
  gameState = {},
  locationSystem,
  onTravel,
  onTravelToRegion,
  onTravelToKingdom,
  mapView = 'local',
  onMapViewChange
}) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  // Track which kingdom/region we're viewing (for drilling down)
  const [viewingKingdom, setViewingKingdom] = useState(null);

  // Get current hierarchy data
  const hierarchyData = useMemo(() => {
    if (!locationSystem) return { kingdom: null, region: null, location: null };

    const kingdom = locationSystem.getKingdom(currentKingdom || playerState?.currentKingdom);
    const region = locationSystem.getRegion(currentRegion);
    const location = locationSystem.getLocation(currentLocation);

    return { kingdom, region, location };
  }, [locationSystem, currentKingdom, currentRegion, currentLocation, playerState]);

  // Get locations/regions/kingdoms based on current view
  const mapData = useMemo(() => {
    if (!locationSystem) return { items: [], currentData: null };

    if (mapView === 'local') {
      const regionData = locationSystem.getRegion(currentRegion);
      const locations = locationSystem.getRegionLocationsWithStatus(currentRegion, playerState, gameState);
      return { items: locations, currentData: regionData };
    } else if (mapView === 'region' || mapView === 'world') {
      // Show regions within the viewing kingdom or current kingdom
      const kingdomId = viewingKingdom || currentKingdom || playerState?.currentKingdom;
      const kingdomData = locationSystem.getKingdom(kingdomId);
      const regions = locationSystem.getKingdomRegions(kingdomId)
        .map(region => ({
          ...region,
          unlockStatus: locationSystem.unlockSystem?.checkLocationUnlock(region, playerState, gameState) || { unlocked: !region.locked }
        }));
      return { items: regions, currentData: kingdomData };
    } else if (mapView === 'kingdom') {
      // Show all kingdoms
      const kingdoms = locationSystem.getKingdomsWithStatus(playerState, gameState);
      return { items: kingdoms, currentData: null };
    }
    return { items: [], currentData: null };
  }, [locationSystem, mapView, currentRegion, currentKingdom, viewingKingdom, playerState, gameState]);

  // Handle location/region/kingdom click
  const handleLocationClick = useCallback((item) => {
    if (item.visible !== false) {
      setSelectedLocation(item);
    }
  }, []);

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = useCallback((level) => {
    setSelectedLocation(null);
    if (level === 'kingdom') {
      onMapViewChange?.('kingdom');
      setViewingKingdom(null);
    } else if (level === 'region') {
      onMapViewChange?.('region');
    } else if (level === 'local') {
      onMapViewChange?.('local');
    }
  }, [onMapViewChange]);

  // Handle drilling down into a kingdom to see its regions
  const handleDrillIntoKingdom = useCallback((kingdomId) => {
    setViewingKingdom(kingdomId);
    onMapViewChange?.('region');
    setSelectedLocation(null);
  }, [onMapViewChange]);

  // Handle drilling down into a region to see its locations
  const handleDrillIntoRegion = useCallback((regionId) => {
    // If this is a different region, trigger travel
    if (regionId !== currentRegion) {
      const region = locationSystem?.getRegion(regionId);
      if (region?.unlockStatus?.unlocked || !region?.locked) {
        onTravelToRegion?.(regionId, region);
      }
    } else {
      onMapViewChange?.('local');
      setSelectedLocation(null);
    }
  }, [currentRegion, locationSystem, onMapViewChange, onTravelToRegion]);

  // Handle travel confirmation
  const handleTravel = useCallback(() => {
    if (selectedLocation) {
      if (mapView === 'kingdom') {
        // Drill into kingdom to view regions
        handleDrillIntoKingdom(selectedLocation.id);
      } else if (mapView === 'region' || mapView === 'world') {
        // Region travel - trigger expedition if different region
        if (selectedLocation.id !== currentRegion) {
          onTravelToRegion?.(selectedLocation.id, selectedLocation);
          onClose?.();
        } else {
          // Same region - just switch to local view
          onMapViewChange?.('local');
        }
        setSelectedLocation(null);
      } else {
        // Local travel
        onTravel(selectedLocation.id);
      }
    }
  }, [selectedLocation, mapView, currentRegion, onTravel, onTravelToRegion, onClose, onMapViewChange, handleDrillIntoKingdom]);

  // Handle hover for tooltip positioning
  const handleMouseMove = useCallback((e, item) => {
    setHoveredLocation(item);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredLocation(null);
  }, []);

  // Handle double-click to drill down
  const handleDoubleClick = useCallback((item) => {
    if (mapView === 'kingdom') {
      handleDrillIntoKingdom(item.id);
    } else if (mapView === 'region' || mapView === 'world') {
      handleDrillIntoRegion(item.id);
    }
  }, [mapView, handleDrillIntoKingdom, handleDrillIntoRegion]);

  if (!isOpen) return null;

  const currentLocationData = locationSystem?.getLocation(currentLocation);

  // Get title based on current view
  const getMapTitle = () => {
    if (mapView === 'kingdom') {
      return 'Kingdom Map';
    } else if (mapView === 'region' || mapView === 'world') {
      const kingdomName = mapData.currentData?.name || 'World Map';
      return `${kingdomName} - Regions`;
    } else {
      return mapData.currentData?.name || 'Local Map';
    }
  };

  return createPortal(
    <div className="travel-modal-overlay" onClick={onClose}>
      <div className="travel-modal" onClick={e => e.stopPropagation()}>
        {/* Header with Breadcrumb */}
        <div className="travel-modal-header">
          {/* Breadcrumb Navigation */}
          <div className="travel-breadcrumb">
            {hierarchyData.kingdom && (
              <>
                <span
                  className={`breadcrumb-item ${mapView === 'kingdom' ? 'active' : 'clickable'}`}
                  onClick={() => handleBreadcrumbClick('kingdom')}
                >
                  {hierarchyData.kingdom.name}
                </span>
                {(mapView === 'region' || mapView === 'world' || mapView === 'local') && (
                  <>
                    <span className="breadcrumb-separator">&gt;</span>
                    <span
                      className={`breadcrumb-item ${mapView === 'region' || mapView === 'world' ? 'active' : 'clickable'}`}
                      onClick={() => handleBreadcrumbClick('region')}
                    >
                      {hierarchyData.region?.name || 'Select Region'}
                    </span>
                  </>
                )}
                {mapView === 'local' && hierarchyData.location && (
                  <>
                    <span className="breadcrumb-separator">&gt;</span>
                    <span className="breadcrumb-item active">
                      {hierarchyData.location.name}
                    </span>
                  </>
                )}
              </>
            )}
          </div>

          <h2 className="travel-modal-title">{getMapTitle()}</h2>

          {/* View Toggle */}
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${mapView === 'kingdom' ? 'active' : ''}`}
              onClick={() => { onMapViewChange?.('kingdom'); setViewingKingdom(null); setSelectedLocation(null); }}
              title="View all kingdoms"
            >
              Kingdom
            </button>
            <button
              className={`view-toggle-btn ${mapView === 'region' || mapView === 'world' ? 'active' : ''}`}
              onClick={() => { onMapViewChange?.('region'); setSelectedLocation(null); }}
              title="View regions in current kingdom"
            >
              Region
            </button>
            <button
              className={`view-toggle-btn ${mapView === 'local' ? 'active' : ''}`}
              onClick={() => { onMapViewChange?.('local'); setSelectedLocation(null); }}
              title="View locations in current region"
            >
              Local
            </button>
          </div>
          <button className="travel-modal-close" onClick={onClose}>X</button>
        </div>

        {/* Map Container */}
        <div className="map-container">
          {/* Map Background */}
          <div className="map-background">
            {mapView === 'local' && mapData.currentData?.mapData?.localMapImage && (
              <img
                src={mapData.currentData.mapData.localMapImage}
                alt="Local Map"
                className="map-image"
              />
            )}
            {mapView === 'kingdom' && (
              <div className="map-placeholder">Kingdom Map</div>
            )}
            {(mapView === 'region' || mapView === 'world') && (
              <div className="map-placeholder">
                {mapData.currentData?.name || 'Region Map'}
              </div>
            )}
          </div>

          {/* Location/Region/Kingdom Markers */}
          {mapData.items.map((item) => {
            const isCurrent = mapView === 'local'
              ? item.id === currentLocation
              : mapView === 'region' || mapView === 'world'
                ? item.id === currentRegion
                : item.id === currentKingdom;
            const isUnlocked = item.unlockStatus?.unlocked ?? !item.locked;
            const isSelected = selectedLocation?.id === item.id;

            const position = mapView === 'local'
              ? item.mapData?.localMapPosition
              : mapView === 'kingdom'
                ? item.mapData?.position
                : item.mapData?.worldMapPosition;

            // If no position, use a grid layout
            const itemIndex = mapData.items.indexOf(item);
            const gridPosition = position || {
              x: 100 + (itemIndex % 4) * 150,
              y: 100 + Math.floor(itemIndex / 4) * 120
            };

            return (
              <div
                key={item.id}
                className={`location-marker ${isCurrent ? 'current' : ''} ${isUnlocked ? '' : 'locked'} ${isSelected ? 'selected' : ''} ${mapView === 'kingdom' ? 'kingdom-marker' : ''}`}
                style={{
                  left: `${gridPosition.x}px`,
                  top: `${gridPosition.y}px`
                }}
                onClick={() => handleLocationClick(item)}
                onDoubleClick={() => handleDoubleClick(item)}
                onMouseMove={(e) => handleMouseMove(e, item)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="location-marker-icon">
                  {mapView === 'kingdom' ? '👑' : locationSystem?.getLocationIcon(item) || '📍'}
                </div>
                {!isUnlocked && (
                  <div className="lock-overlay">🔒</div>
                )}
                <div className="location-marker-label">{item.name}</div>
                {mapView === 'kingdom' && item.childRegions && (
                  <div className="marker-subtitle">
                    {item.childRegions.length} regions
                  </div>
                )}
                {(mapView === 'region' || mapView === 'world') && item.childLocations && (
                  <div className="marker-subtitle">
                    {item.childLocations.length} locations
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Location Panel */}
        {selectedLocation && (
          <div className={`selected-location-panel ${selectedLocation.unlockStatus?.unlocked || !selectedLocation.locked ? '' : 'locked'}`}>
            <div className="selected-location-header">
              <h3 className="selected-location-name">
                {!(selectedLocation.unlockStatus?.unlocked ?? !selectedLocation.locked) && <span className="lock-icon">🔒 </span>}
                {selectedLocation.name}
              </h3>
              {selectedLocation.dangerLevel && (selectedLocation.unlockStatus?.unlocked ?? !selectedLocation.locked) && (
                <span className={`danger-level danger-level-${selectedLocation.dangerLevel}`}>
                  {'⚠️'.repeat(Math.min(selectedLocation.dangerLevel, 5))}
                </span>
              )}
            </div>
            <p className="selected-location-description">{selectedLocation.description}</p>

            {/* Kingdom-specific info */}
            {mapView === 'kingdom' && selectedLocation.governance && (
              <div className="selected-location-info">
                <p><strong>Ruler:</strong> {selectedLocation.governance.rulerTitle} {selectedLocation.governance.ruler}</p>
                {selectedLocation.childRegions && (
                  <p><strong>Regions:</strong> {selectedLocation.childRegions.length}</p>
                )}
              </div>
            )}

            {/* Region-specific info */}
            {(mapView === 'region' || mapView === 'world') && selectedLocation.childLocations && (
              <div className="selected-location-info">
                <p><strong>Locations:</strong> {selectedLocation.childLocations.length}</p>
              </div>
            )}

            {/* Show requirements for locked locations */}
            {!(selectedLocation.unlockStatus?.unlocked ?? !selectedLocation.locked) && (
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

            {(selectedLocation.unlockStatus?.unlocked ?? !selectedLocation.locked) && selectedLocation.tags && (
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
              className={`travel-btn ${(selectedLocation?.unlockStatus?.unlocked ?? !selectedLocation?.locked) ? 'travel-btn--confirm' : 'travel-btn--locked'}`}
              disabled={!selectedLocation || (mapView === 'local' && selectedLocation.id === currentLocation) || ((mapView === 'region' || mapView === 'world') && selectedLocation.id === currentRegion)}
              onClick={handleTravel}
            >
              {mapView === 'kingdom'
                ? 'View Regions'
                : (mapView === 'region' || mapView === 'world')
                  ? selectedLocation?.id === currentRegion
                    ? 'View Locations'
                    : (selectedLocation?.unlockStatus?.unlocked ?? !selectedLocation?.locked)
                      ? 'Travel'
                      : 'Investigate'
                  : (selectedLocation?.unlockStatus?.unlocked ?? !selectedLocation?.locked)
                    ? 'Travel'
                    : 'Investigate'}
            </button>
          </div>
        </div>

        {/* Hover Tooltip */}
        {hoveredLocation && !(hoveredLocation.unlockStatus?.unlocked ?? !hoveredLocation.locked) && (
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
