/**
 * @fileoverview LocationSystem - Manages locations, regions, and travel
 *
 * This system provides methods for:
 * - Getting locations and regions with their unlock status
 * - Finding accessible neighbors
 * - Managing travel between locations
 * - Processing exploration discoveries
 * - Hierarchical font tag resolution with gradient support
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
    this.tagMappings = {};
    this.tagPriority = {};
    this.combinationFontTags = {};
    this.defaultFont = 'neutral';
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
    this.tagPriority = fontTagData.tagPriority || {};
    this.combinationFontTags = fontTagData.combinationFontTags || {};
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
   * Get visible tags for a location (filters out hidden tags not yet discovered)
   * @param {Object} location - Location object
   * @param {Object} playerState - Player state (for checking discovered tags)
   * @returns {Array} Array of visible tag strings
   */
  getVisibleTags(location, playerState = {}) {
    const tags = location.tags || [];
    const hiddenTags = location.hiddenTags || {};
    const discoveredTags = playerState.discoveredLocationTags?.[location.id] || [];

    return tags.filter(tag => {
      // If tag has hidden configuration, check if it's discovered
      if (hiddenTags[tag]) {
        const hiddenConfig = hiddenTags[tag];
        // If always hidden, never show
        if (hiddenConfig.alwaysHidden) return false;
        // Otherwise, check if player has discovered it
        return discoveredTags.includes(tag);
      }
      // Tag is not in hiddenTags, so it's visible
      return true;
    });
  }

  /**
   * Get mapped font tags for a set of location tags
   * @param {Array} tags - Array of tag strings
   * @returns {Array} Array of {tag, fontTag, fontStyle} objects
   */
  getMappedFontTags(tags) {
    const mapped = [];
    for (const tag of tags) {
      const mappedFont = this.tagMappings[tag];
      if (mappedFont && this.fontTags[mappedFont]) {
        mapped.push({
          tag,
          fontTag: mappedFont,
          fontStyle: this.fontTags[mappedFont]
        });
      }
    }
    return mapped;
  }

  /**
   * Generate a CSS gradient from multiple colors
   * @param {Array} colors - Array of color strings
   * @returns {string} CSS linear-gradient string
   */
  generateGradient(colors) {
    if (colors.length === 0) return '#e0e0e0';
    if (colors.length === 1) return colors[0];

    // Calculate percentage stops for each color
    const stops = colors.map((color, index) => {
      const percent = (index / (colors.length - 1)) * 100;
      return `${color} ${percent.toFixed(0)}%`;
    });

    return `linear-gradient(90deg, ${stops.join(', ')})`;
  }

  /**
   * Generate combination key from tags (sorted for consistent lookup)
   * @param {Array} tags - Array of tags
   * @returns {string} Combination key like "corrupted+dangerous+forest"
   */
  getCombinationKey(tags) {
    return [...tags].sort().join('+');
  }

  /**
   * Get font style for a location based on hierarchical tag matching
   *
   * Priority order:
   * 1. Explicit fontTag in titleDisplay
   * 2. Combination fontTags (all visible tags, then pairs)
   * 3. Individual tags by priority (last tags in array have highest priority)
   * 4. Default font
   *
   * @param {Object} location - Location object
   * @param {Object} playerState - Player state (for hidden tag checking)
   * @returns {Object} Font style object with optional gradient
   */
  getFontStyleForLocation(location, playerState = {}) {
    // 1. Check if location has explicit fontTag override
    const explicitFontTag = location.titleDisplay?.fontTag;
    if (explicitFontTag && this.fontTags[explicitFontTag]) {
      return { ...this.fontTags[explicitFontTag], fontTag: explicitFontTag };
    }

    // Get visible tags (not hidden or already discovered)
    const visibleTags = this.getVisibleTags(location, playerState);
    if (visibleTags.length === 0) {
      const defaultStyle = this.fontTags[this.defaultFont] || {
        fontFamily: "'Crimson Text', Georgia, serif",
        color: '#e0e0e0',
        fontSize: '2.5rem'
      };
      return { ...defaultStyle, fontTag: this.defaultFont };
    }

    // Get all mapped font data for visible tags
    const mappedFonts = this.getMappedFontTags(visibleTags);
    if (mappedFonts.length === 0) {
      const defaultStyle = this.fontTags[this.defaultFont] || {
        fontFamily: "'Crimson Text', Georgia, serif",
        color: '#e0e0e0',
        fontSize: '2.5rem'
      };
      return { ...defaultStyle, fontTag: this.defaultFont };
    }

    // 2. Check for combination fontTags (all tags first, then decreasing)
    for (let size = mappedFonts.length; size >= 2; size--) {
      // Generate all combinations of this size
      const combinations = this._getCombinations(mappedFonts.map(m => m.tag), size);
      for (const combo of combinations) {
        const key = this.getCombinationKey(combo);
        if (this.combinationFontTags[key]) {
          return { ...this.combinationFontTags[key], fontTag: key, isCombo: true };
        }
      }
    }

    // 3. If multiple tags match, create gradient and use first tag's font
    if (mappedFonts.length > 1) {
      // Colors in order of tags (as defined in location)
      const colors = mappedFonts.map(m => m.fontStyle.color);
      const gradient = this.generateGradient(colors);

      // Use font from first tag (maintains tag order priority for font)
      const primaryFont = mappedFonts[0].fontStyle;
      const matchedTags = mappedFonts.map(m => m.fontTag);

      return {
        ...primaryFont,
        color: gradient,
        isGradient: true,
        gradientColors: colors,
        fontTag: matchedTags.join('+'),
        matchedTags
      };
    }

    // 4. Single tag match - find highest priority tag
    // Tags later in the array have higher priority (more specific)
    // But we iterate in order and take the last match
    let bestMatch = mappedFonts[0];
    for (const mapped of mappedFonts) {
      const priority = this.tagPriority[mapped.tag] ?? 0;
      const bestPriority = this.tagPriority[bestMatch.tag] ?? 0;
      if (priority >= bestPriority) {
        bestMatch = mapped;
      }
    }

    return { ...bestMatch.fontStyle, fontTag: bestMatch.fontTag };
  }

  /**
   * Get all combinations of a specific size from an array
   * @param {Array} arr - Source array
   * @param {number} size - Combination size
   * @returns {Array} Array of combination arrays
   */
  _getCombinations(arr, size) {
    if (size === 0) return [[]];
    if (arr.length === 0) return [];
    if (size > arr.length) return [];

    const [first, ...rest] = arr;
    const withFirst = this._getCombinations(rest, size - 1).map(combo => [first, ...combo]);
    const withoutFirst = this._getCombinations(rest, size);

    return [...withFirst, ...withoutFirst];
  }

  /**
   * Get title display data for a location with hierarchical tag resolution
   * @param {Object|string} locationOrId - Location object or ID
   * @param {Object} playerState - Player state (for hidden tag checking)
   * @returns {Object} Title display configuration
   */
  getTitleDisplayData(locationOrId, playerState = {}) {
    const location = typeof locationOrId === 'string'
      ? this.getLocation(locationOrId)
      : locationOrId;

    if (!location) {
      return {
        name: 'Unknown Location',
        subtitle: null,
        fontStyle: this.fontTags[this.defaultFont] || {},
        fontTag: this.defaultFont
      };
    }

    const fontStyle = this.getFontStyleForLocation(location, playerState);
    const visibleTags = this.getVisibleTags(location, playerState);

    return {
      name: location.name,
      subtitle: location.titleDisplay?.subtitle || null,
      fontTag: fontStyle.fontTag || this.defaultFont,
      fontStyle,
      visibleTags,
      isGradient: fontStyle.isGradient || false,
      gradientColors: fontStyle.gradientColors || null,
      matchedTags: fontStyle.matchedTags || null
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
