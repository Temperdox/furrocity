/**
 * @fileoverview LocationSystem - Manages locations, regions, and travel
 *
 * This system provides methods for:
 * - Getting locations and regions with their unlock status
 * - Finding accessible neighbors
 * - Managing travel between locations
 * - Processing exploration discoveries
 *
 * @module engine/LocationSystem
 */

export class LocationSystem {
  /**
   * Create a LocationSystem instance
   * @param {UnlockSystem} unlockSystem - UnlockSystem instance for requirement checking
   */
  constructor(unlockSystem) {
    this.unlockSystem = unlockSystem;
    this.locations = [];
    this.regions = [];
    this.locationCache = new Map();
    this.regionCache = new Map();
    this.fontTags = {};
  }

  /**
   * Initialize with location and region data
   * @param {Array} locations - Array of location objects
   * @param {Array} regions - Array of region objects
   * @param {Object} fontTagData - Font tag definitions
   */
  initialize(locations, regions, fontTagData = {}) {
    this.locations = locations || [];
    this.regions = regions || [];
    this.fontTags = fontTagData.fontTags || {};
    this.tagMappings = fontTagData.tagMappings || {};
    this.defaultFont = fontTagData.defaultFont || 'neutral';

    // Build caches
    this.locationCache.clear();
    this.regionCache.clear();

    this.locations.forEach(loc => {
      this.locationCache.set(loc.id, loc);
    });

    this.regions.forEach(reg => {
      this.regionCache.set(reg.id, reg);
    });
  }

  /**
   * Get a location by ID
   * @param {string} locationId - Location ID
   * @returns {Object|null}
   */
  getLocation(locationId) {
    return this.locationCache.get(locationId) || null;
  }

  /**
   * Get a region by ID
   * @param {string} regionId - Region ID
   * @returns {Object|null}
   */
  getRegion(regionId) {
    return this.regionCache.get(regionId) || null;
  }

  /**
   * Get all locations
   * @returns {Array}
   */
  getAllLocations() {
    return this.locations;
  }

  /**
   * Get all regions
   * @returns {Array}
   */
  getAllRegions() {
    return this.regions;
  }

  /**
   * Get all locations within a region
   * @param {string} regionId - Region ID
   * @returns {Array}
   */
  getRegionLocations(regionId) {
    return this.locations.filter(loc => loc.parentRegion === regionId);
  }

  /**
   * Get the region for a location
   * @param {string} locationId - Location ID
   * @returns {Object|null}
   */
  getLocationRegion(locationId) {
    const location = this.getLocation(locationId);
    if (!location) return null;
    return this.getRegion(location.parentRegion);
  }

  /**
   * Get all locations with their unlock status
   * @param {Object} playerState - Player state
   * @param {Object} gameState - Game state
   * @returns {Array} Locations with added unlockStatus field
   */
  getLocationsWithStatus(playerState, gameState = {}) {
    return this.locations.map(location => ({
      ...location,
      unlockStatus: this.unlockSystem.checkLocationUnlock(location, playerState, gameState)
    }));
  }

  /**
   * Get all regions with their unlock status
   * @param {Object} playerState - Player state
   * @param {Object} gameState - Game state
   * @returns {Array} Regions with added unlockStatus field
   */
  getRegionsWithStatus(playerState, gameState = {}) {
    return this.regions.map(region => ({
      ...region,
      unlockStatus: this.unlockSystem.checkLocationUnlock(region, playerState, gameState)
    }));
  }

  /**
   * Get locations in a region with their unlock status
   * @param {string} regionId - Region ID
   * @param {Object} playerState - Player state
   * @param {Object} gameState - Game state
   * @returns {Array}
   */
  getRegionLocationsWithStatus(regionId, playerState, gameState = {}) {
    const locations = this.getRegionLocations(regionId);
    return locations.map(location => ({
      ...location,
      unlockStatus: this.unlockSystem.checkLocationUnlock(location, playerState, gameState)
    }));
  }

  /**
   * Get accessible neighbors from a location
   * @param {string} locationId - Current location ID
   * @param {Object} playerState - Player state
   * @param {Object} gameState - Game state
   * @returns {Array} Array of accessible location objects with status
   */
  getAccessibleNeighbors(locationId, playerState, gameState = {}) {
    const location = this.getLocation(locationId);
    if (!location) return [];

    const connectedIds = location.connectedLocations || [];
    const neighbors = [];

    for (const connectedId of connectedIds) {
      const neighbor = this.getLocation(connectedId);
      if (!neighbor) continue;

      const unlockStatus = this.unlockSystem.checkLocationUnlock(neighbor, playerState, gameState);

      neighbors.push({
        ...neighbor,
        unlockStatus,
        accessible: unlockStatus.unlocked
      });
    }

    return neighbors;
  }

  /**
   * Get neighbor regions from current region
   * @param {string} regionId - Current region ID
   * @param {Object} playerState - Player state
   * @param {Object} gameState - Game state
   * @returns {Array}
   */
  getNeighborRegions(regionId, playerState, gameState = {}) {
    const region = this.getRegion(regionId);
    if (!region) return [];

    const neighborIds = region.neighborRegions || [];
    const neighbors = [];

    for (const neighborId of neighborIds) {
      const neighbor = this.getRegion(neighborId);
      if (!neighbor) continue;

      const unlockStatus = this.unlockSystem.checkLocationUnlock(neighbor, playerState, gameState);

      neighbors.push({
        ...neighbor,
        unlockStatus,
        accessible: unlockStatus.unlocked
      });
    }

    return neighbors;
  }

  /**
   * Check if player can travel to a location
   * @param {string} destinationId - Destination location ID
   * @param {Object} playerState - Player state
   * @param {Object} gameState - Game state
   * @returns {{ canTravel: boolean, reason?: string }}
   */
  canTravelTo(destinationId, playerState, gameState = {}) {
    const destination = this.getLocation(destinationId);
    if (!destination) {
      return { canTravel: false, reason: 'Location not found' };
    }

    const unlockStatus = this.unlockSystem.checkLocationUnlock(destination, playerState, gameState);
    if (!unlockStatus.unlocked) {
      return {
        canTravel: false,
        reason: 'Location is locked',
        requirements: unlockStatus.unmetRequirements
      };
    }

    return { canTravel: true };
  }

  /**
   * Get discoverable locations from current location
   * @param {string} currentLocationId - Current location ID
   * @param {Object} playerState - Player state
   * @returns {Array} Array of potentially discoverable locations
   */
  getDiscoverableLocations(currentLocationId, playerState) {
    const currentLocation = this.getLocation(currentLocationId);
    if (!currentLocation) return [];

    const discoverable = [];
    const neighbors = currentLocation.neighbors || [];

    for (const neighborId of neighbors) {
      const neighbor = this.getLocation(neighborId);
      if (!neighbor) continue;

      const canDiscover = this.unlockSystem.canDiscoverLocation(neighbor, playerState, currentLocation);
      if (canDiscover.canDiscover) {
        discoverable.push({
          ...neighbor,
          discoveryChance: neighbor.discoveryChance || 0.1
        });
      }
    }

    return discoverable;
  }

  /**
   * Process exploration and return discoveries
   * @param {string} currentLocationId - Current location ID
   * @param {Object} playerState - Player state
   * @returns {Array} Array of discovered locations
   */
  processExploration(currentLocationId, playerState) {
    const currentLocation = this.getLocation(currentLocationId);
    if (!currentLocation) return [];

    return this.unlockSystem.processExploration(currentLocation, playerState, this.locations);
  }

  /**
   * Get font style for a location based on its tags
   * @param {Object} location - Location object
   * @returns {Object} Font style object
   */
  getFontStyleForLocation(location) {
    // Check if location has explicit fontTag
    const fontTag = location.titleDisplay?.fontTag;
    if (fontTag && this.fontTags[fontTag]) {
      return this.fontTags[fontTag];
    }

    // Try to determine from tags
    const tags = location.tags || [];
    for (const tag of tags) {
      const mappedFont = this.tagMappings[tag];
      if (mappedFont && this.fontTags[mappedFont]) {
        return this.fontTags[mappedFont];
      }
    }

    // Return default font
    return this.fontTags[this.defaultFont] || {
      fontFamily: "'Crimson Text', Georgia, serif",
      color: '#e0e0e0',
      fontSize: '2.5rem'
    };
  }

  /**
   * Get title display data for a location
   * @param {Object|string} locationOrId - Location object or ID
   * @returns {Object} Title display configuration
   */
  getTitleDisplayData(locationOrId) {
    const location = typeof locationOrId === 'string'
      ? this.getLocation(locationOrId)
      : locationOrId;

    if (!location) {
      return {
        name: 'Unknown Location',
        subtitle: null,
        fontStyle: this.fontTags[this.defaultFont] || {}
      };
    }

    const fontStyle = this.getFontStyleForLocation(location);

    return {
      name: location.name,
      subtitle: location.titleDisplay?.subtitle || null,
      fontTag: location.titleDisplay?.fontTag || this.defaultFont,
      fontStyle
    };
  }

  /**
   * Get icon for a location type
   * @param {Object} location - Location object
   * @returns {string} Icon character/emoji
   */
  getLocationIcon(location) {
    const type = location.type;
    const tags = location.tags || [];

    // Check tags first
    if (tags.includes('inn') || tags.includes('tavern')) return '🏨';
    if (tags.includes('temple') || tags.includes('shrine') || tags.includes('church')) return '⛪';
    if (tags.includes('shop') || tags.includes('market')) return '🛒';
    if (tags.includes('forest')) return '🌲';
    if (tags.includes('cave') || tags.includes('mine')) return '🕳️';
    if (tags.includes('dungeon')) return '🏰';
    if (tags.includes('corrupted') || tags.includes('demon')) return '👿';
    if (tags.includes('safe')) return '🏠';
    if (tags.includes('dangerous')) return '⚠️';

    // Check type
    switch (type) {
      case 'building': return '🏠';
      case 'outdoor': return '🌳';
      case 'dungeon': return '🏰';
      case 'region': return '🗺️';
      default: return '📍';
    }
  }

  /**
   * Get the player's initial unlocked locations
   * @returns {Array} Array of initially unlocked location IDs
   */
  getInitiallyUnlockedLocations() {
    return this.locations
      .filter(loc => loc.initiallyUnlocked)
      .map(loc => loc.id);
  }

  /**
   * Get the player's initial unlocked regions
   * @returns {Array} Array of initially unlocked region IDs
   */
  getInitiallyUnlockedRegions() {
    return this.regions
      .filter(reg => reg.initiallyUnlocked)
      .map(reg => reg.id);
  }
}

export default LocationSystem;
