/**
 * @fileoverview ReputationSystem - Local and Global Reputation Management
 *
 * Handles per-location reputation tracking and global reputation calculation.
 *
 * Features:
 * - Local fame/infamy per inhabited location
 * - Weighted global reputation from all locations
 * - Reputation spread between neighboring locations
 * - Weight factors: largeLocation (2x), markets (+5% each), buildings (+1% each)
 *
 * @module engine/ReputationSystem
 */

class ReputationSystem {
  constructor(fameSystem = null) {
    this.fameSystem = fameSystem;
    this.inhabitedLocations = [];
    this.locationWeights = {};
    this.totalWeight = 0;

    // Configuration
    this.config = {
      baseWeight: 1.0,
      largeLocationMultiplier: 2.0,
      marketWeightBonus: 0.05,      // +5% per market
      buildingWeightBonus: 0.01,    // +1% per building
      spreadRateLarge: 0.10,        // 10% reputation spreads per time tick
      spreadRateSmall: 0.05,        // 5% reputation spreads per time tick
      decayRate: 0.01,              // 1% decay per day for old reputation
      minSpreadThreshold: 5         // Minimum reputation to spread
    };
  }

  /**
   * Initialize the reputation system with location data
   * Scans for inhabited locations and calculates weights
   * @param {Array} locations - All game locations
   */
  initialize(locations) {
    if (!locations || !Array.isArray(locations)) {
      console.warn('[ReputationSystem] No locations provided');
      return;
    }

    // Filter inhabited locations
    this.inhabitedLocations = locations.filter(loc =>
      loc.inhabited === true ||
      loc.tags?.includes('inhabited') ||
      loc.tags?.includes('town') ||
      loc.tags?.includes('city') ||
      loc.tags?.includes('village') ||
      loc.tags?.includes('shop') ||
      loc.tags?.includes('inn')
    );

    this.calculateLocationWeights();

    console.log(`[ReputationSystem] Initialized with ${this.inhabitedLocations.length} inhabited locations`);
  }

  /**
   * Calculate reputation weight for each inhabited location
   * Weights determine how much each location contributes to global reputation
   */
  calculateLocationWeights() {
    this.locationWeights = {};
    this.totalWeight = 0;

    for (const location of this.inhabitedLocations) {
      let weight = this.config.baseWeight;

      // Large locations get 2x weight
      if (location.largeLocation === true || location.tags?.includes('city')) {
        weight *= this.config.largeLocationMultiplier;
      }

      // Markets add +5% each
      if (location.markets && typeof location.markets === 'number') {
        weight += location.markets * this.config.marketWeightBonus;
      }

      // Buildings add +1% each
      if (location.buildings && typeof location.buildings === 'number') {
        weight += location.buildings * this.config.buildingWeightBonus;
      }

      this.locationWeights[location.id] = weight;
      this.totalWeight += weight;
    }

    // Normalize weights to sum to 1
    if (this.totalWeight > 0) {
      for (const locId in this.locationWeights) {
        this.locationWeights[locId] /= this.totalWeight;
      }
    }
  }

  /**
   * Get the weight for a specific location
   * @param {string} locationId - Location ID
   * @returns {number} Location weight (0-1)
   */
  getLocationWeight(locationId) {
    return this.locationWeights[locationId] || 0;
  }

  /**
   * Initialize local reputation for a location if it doesn't exist
   * @param {Object} playerState - Player state object
   * @param {string} locationId - Location ID
   */
  ensureLocalReputation(playerState, locationId) {
    if (!playerState.localReputation) {
      playerState.localReputation = {};
    }

    if (!playerState.localReputation[locationId]) {
      playerState.localReputation[locationId] = {
        fame: 0,
        infamy: { slut: 0, criminal: 0, corrupted: 0 },
        visitCount: 0,
        lastVisit: null,
        knownBy: []
      };
    }
  }

  /**
   * Record a visit to a location
   * @param {Object} playerState - Player state object
   * @param {string} locationId - Location ID
   */
  recordVisit(playerState, locationId) {
    this.ensureLocalReputation(playerState, locationId);

    const localRep = playerState.localReputation[locationId];
    localRep.visitCount += 1;
    localRep.lastVisit = Date.now();
  }

  /**
   * Modify local reputation at a specific location
   * @param {Object} playerState - Player state object
   * @param {string} locationId - Location ID
   * @param {string} type - 'fame', 'slut', 'criminal', or 'corrupted'
   * @param {number} amount - Amount to change (can be negative)
   * @param {string} reason - Optional reason for the change
   * @returns {Object} Result with old and new values
   */
  modifyLocalReputation(playerState, locationId, type, amount, reason = '') {
    this.ensureLocalReputation(playerState, locationId);

    const localRep = playerState.localReputation[locationId];
    let oldValue, newValue;

    if (type === 'fame') {
      oldValue = localRep.fame;
      localRep.fame = Math.max(-100, Math.min(100, localRep.fame + amount));
      newValue = localRep.fame;
    } else if (['slut', 'criminal', 'corrupted'].includes(type)) {
      oldValue = localRep.infamy[type];
      localRep.infamy[type] = Math.max(0, Math.min(100, localRep.infamy[type] + amount));
      newValue = localRep.infamy[type];
    } else {
      console.warn(`[ReputationSystem] Unknown reputation type: ${type}`);
      return null;
    }

    // Update global reputation from local
    this.updateGlobalReputation(playerState);

    return {
      locationId,
      type,
      oldValue,
      newValue,
      change: amount,
      reason
    };
  }

  /**
   * Get local reputation for a location
   * @param {Object} playerState - Player state object
   * @param {string} locationId - Location ID
   * @returns {Object} Local reputation data
   */
  getLocalReputation(playerState, locationId) {
    this.ensureLocalReputation(playerState, locationId);
    return playerState.localReputation[locationId];
  }

  /**
   * Update global fame/infamy from weighted average of local reputations
   * @param {Object} playerState - Player state object
   */
  updateGlobalReputation(playerState) {
    if (!playerState.localReputation) return;

    let totalFame = 0;
    let totalSlut = 0;
    let totalCriminal = 0;
    let totalCorrupted = 0;
    let appliedWeight = 0;

    for (const locationId in playerState.localReputation) {
      const weight = this.locationWeights[locationId] || 0;
      if (weight === 0) continue;

      const localRep = playerState.localReputation[locationId];

      totalFame += localRep.fame * weight;
      totalSlut += (localRep.infamy?.slut || 0) * weight;
      totalCriminal += (localRep.infamy?.criminal || 0) * weight;
      totalCorrupted += (localRep.infamy?.corrupted || 0) * weight;

      appliedWeight += weight;
    }

    // Calculate weighted averages (only from visited locations)
    if (appliedWeight > 0) {
      // Update global fame
      if (playerState.fame) {
        playerState.fame.value = Math.round(totalFame / appliedWeight);
      }

      // Update global infamy
      if (playerState.infamy) {
        playerState.infamy.slut = Math.round(totalSlut / appliedWeight);
        playerState.infamy.criminal = Math.round(totalCriminal / appliedWeight);
        playerState.infamy.corrupted = Math.round(totalCorrupted / appliedWeight);
      }
    }
  }

  /**
   * Get effective reputation at a location
   * Returns local if visited, global otherwise
   * @param {Object} playerState - Player state object
   * @param {string} locationId - Location ID
   * @returns {Object} Effective reputation
   */
  getEffectiveReputation(playerState, locationId) {
    const localRep = playerState.localReputation?.[locationId];

    if (localRep && localRep.visitCount > 0) {
      return {
        source: 'local',
        fame: localRep.fame,
        infamy: { ...localRep.infamy }
      };
    }

    // Return global reputation for unvisited locations
    return {
      source: 'global',
      fame: playerState.fame?.value || 0,
      infamy: {
        slut: playerState.infamy?.slut || 0,
        criminal: playerState.infamy?.criminal || 0,
        corrupted: playerState.infamy?.corrupted || 0
      }
    };
  }

  /**
   * Spread reputation from a location to its neighbors over time
   * @param {Object} playerState - Player state object
   * @param {string} sourceLocationId - Source location ID
   * @param {Array} allLocations - All game locations
   */
  spreadReputation(playerState, sourceLocationId, allLocations) {
    const sourceLocation = allLocations.find(l => l.id === sourceLocationId);
    if (!sourceLocation) return;

    const sourceRep = playerState.localReputation?.[sourceLocationId];
    if (!sourceRep) return;

    // Get spread rate based on location size
    const spreadRate = sourceLocation.largeLocation
      ? this.config.spreadRateLarge
      : this.config.spreadRateSmall;

    // Get neighboring inhabited locations
    const neighbors = (sourceLocation.neighbors || sourceLocation.connectedLocations || [])
      .filter(neighborId => {
        const neighbor = allLocations.find(l => l.id === neighborId);
        return neighbor && this.inhabitedLocations.some(l => l.id === neighborId);
      });

    for (const neighborId of neighbors) {
      this.ensureLocalReputation(playerState, neighborId);
      const neighborRep = playerState.localReputation[neighborId];

      // Spread fame
      if (Math.abs(sourceRep.fame) >= this.config.minSpreadThreshold) {
        const fameSpread = sourceRep.fame * spreadRate;
        neighborRep.fame = Math.max(-100, Math.min(100, neighborRep.fame + fameSpread));
      }

      // Spread each infamy type
      for (const infamyType of ['slut', 'criminal', 'corrupted']) {
        const sourceInfamy = sourceRep.infamy?.[infamyType] || 0;
        if (sourceInfamy >= this.config.minSpreadThreshold) {
          const infamySpread = sourceInfamy * spreadRate;
          neighborRep.infamy[infamyType] = Math.max(0, Math.min(100,
            neighborRep.infamy[infamyType] + infamySpread
          ));
        }
      }
    }
  }

  /**
   * Decay old reputation over time
   * @param {Object} playerState - Player state object
   * @param {number} daysPassed - Number of days that have passed
   */
  decayReputation(playerState, daysPassed = 1) {
    if (!playerState.localReputation) return;

    const decayAmount = this.config.decayRate * daysPassed;

    for (const locationId in playerState.localReputation) {
      const localRep = playerState.localReputation[locationId];

      // Decay fame toward 0
      if (localRep.fame > 0) {
        localRep.fame = Math.max(0, localRep.fame - decayAmount);
      } else if (localRep.fame < 0) {
        localRep.fame = Math.min(0, localRep.fame + decayAmount);
      }

      // Decay infamy toward 0
      for (const infamyType of ['slut', 'criminal', 'corrupted']) {
        if (localRep.infamy && localRep.infamy[infamyType] > 0) {
          localRep.infamy[infamyType] = Math.max(0,
            localRep.infamy[infamyType] - decayAmount
          );
        }
      }
    }

    // Update global after decay
    this.updateGlobalReputation(playerState);
  }

  /**
   * Get all locations sorted by player's reputation there
   * @param {Object} playerState - Player state object
   * @param {string} reputationType - 'fame', 'slut', 'criminal', 'corrupted'
   * @returns {Array} Sorted array of { locationId, value }
   */
  getReputationRanking(playerState, reputationType = 'fame') {
    if (!playerState.localReputation) return [];

    const rankings = [];

    for (const locationId in playerState.localReputation) {
      const localRep = playerState.localReputation[locationId];
      let value;

      if (reputationType === 'fame') {
        value = localRep.fame;
      } else if (['slut', 'criminal', 'corrupted'].includes(reputationType)) {
        value = localRep.infamy?.[reputationType] || 0;
      } else {
        continue;
      }

      rankings.push({ locationId, value });
    }

    // Sort by value descending
    rankings.sort((a, b) => b.value - a.value);

    return rankings;
  }

  /**
   * Get reputation summary for display in pause menu
   * @param {Object} playerState - Player state object
   * @returns {Object} Reputation summary
   */
  getReputationSummary(playerState) {
    const localReps = [];

    if (playerState.localReputation) {
      for (const locationId in playerState.localReputation) {
        const localRep = playerState.localReputation[locationId];
        const location = this.inhabitedLocations.find(l => l.id === locationId);

        localReps.push({
          locationId,
          locationName: location?.name || locationId,
          fame: localRep.fame,
          infamy: { ...localRep.infamy },
          visitCount: localRep.visitCount,
          weight: this.locationWeights[locationId] || 0
        });
      }
    }

    // Sort by most visited
    localReps.sort((a, b) => b.visitCount - a.visitCount);

    return {
      global: {
        fame: playerState.fame?.value || 0,
        infamy: {
          slut: playerState.infamy?.slut || 0,
          criminal: playerState.infamy?.criminal || 0,
          corrupted: playerState.infamy?.corrupted || 0
        }
      },
      local: localReps,
      totalInhabitedLocations: this.inhabitedLocations.length,
      visitedLocations: localReps.filter(r => r.visitCount > 0).length
    };
  }

  /**
   * Add an NPC to the list of NPCs who know the player at a location
   * @param {Object} playerState - Player state object
   * @param {string} locationId - Location ID
   * @param {string} npcId - NPC ID
   */
  addKnownBy(playerState, locationId, npcId) {
    this.ensureLocalReputation(playerState, locationId);
    const localRep = playerState.localReputation[locationId];

    if (!localRep.knownBy.includes(npcId)) {
      localRep.knownBy.push(npcId);
    }
  }

  /**
   * Check if an NPC knows the player at a location
   * @param {Object} playerState - Player state object
   * @param {string} locationId - Location ID
   * @param {string} npcId - NPC ID
   * @returns {boolean} True if NPC knows the player
   */
  isKnownBy(playerState, locationId, npcId) {
    const localRep = playerState.localReputation?.[locationId];
    return localRep?.knownBy?.includes(npcId) || false;
  }
}

export default ReputationSystem;
