/**
 * @fileoverview ExpeditionSystem - Handles region-to-region travel mechanics
 *
 * Features:
 * - Travel stamina management (separate from combat stamina)
 * - Progress calculation based on stamina
 * - Day/night cycle integration
 * - Encounter chance calculation (affected by night, torch, camp)
 * - Scavenging mechanics
 * - Rest mechanics with camp/tent bonuses
 * - Hidden location discovery
 *
 * @module engine/ExpeditionSystem
 */

/**
 * Expedition state object structure
 * @typedef {Object} ExpeditionState
 * @property {string} fromRegion - Starting region ID
 * @property {string} toRegion - Destination region ID
 * @property {number} totalDistance - Total distance to travel
 * @property {number} distanceTraveled - Distance covered so far
 * @property {number} travelStamina - Current travel stamina (0-100)
 * @property {number} maxTravelStamina - Maximum travel stamina
 * @property {boolean} hasTorch - Whether torch is lit
 * @property {string|null} campType - Type of camp set up (null, 'basic', 'tent', 'pavilion')
 * @property {number} hoursElapsed - Hours spent on expedition
 * @property {Array} discoveries - Locations discovered during expedition
 * @property {Array} encounters - Encounters triggered
 */

export class ExpeditionSystem {
  /**
   * @param {Object} options - Configuration options
   * @param {Function} options.gameTimeProvider - Returns { currentDay, currentHour, isNight }
   * @param {Function} options.getRegion - Function to get region by ID
   * @param {Object} options.encounterTables - Encounter table data
   */
  constructor(options = {}) {
    this.gameTimeProvider = options.gameTimeProvider || (() => ({
      currentDay: 0,
      currentHour: 12,
      isNight: false
    }));
    this.getRegion = options.getRegion || (() => null);
    this.encounterTables = options.encounterTables || {};

    // Configuration constants
    this.config = {
      // Stamina settings
      maxTravelStamina: 100,
      staminaPerProgress: 15,           // Base stamina cost per progress action
      minStaminaToProgress: 10,         // Minimum stamina needed to progress
      staminaRecoveryPerRest: 30,       // Base stamina recovery per rest
      staminaRecoveryWithCamp: 50,      // Stamina recovery with camp
      staminaRecoveryWithTent: 70,      // Stamina recovery with tent

      // Progress settings
      baseProgressDistance: 10,         // Base distance covered per progress
      minProgressMultiplier: 0.3,       // Minimum progress when exhausted
      maxProgressMultiplier: 1.5,       // Maximum progress when fully rested

      // Time settings
      hoursPerProgress: 2,              // Hours that pass per progress action
      hoursPerRest: 4,                  // Hours that pass per rest action
      hoursPerScavenge: 1,              // Hours that pass per scavenge action

      // Encounter chances (base, modified by conditions)
      baseEncounterChance: 0.15,        // 15% base chance
      nightEncounterMultiplier: 2.0,    // Double at night without torch
      torchEncounterReduction: 0.5,     // 50% reduction with torch
      basicCampReduction: 0.3,          // 30% reduction with basic camp
      tentReduction: 0.5,               // 50% reduction with tent
      pavilionReduction: 0.7,           // 70% reduction with pavilion
      torchCampBonus: 1.2,              // 20% bonus when torch + camp combined

      // Scavenge settings
      scavengeChances: {
        nothing: 0.3,                   // 30% find nothing
        food: 0.25,                     // 25% find food
        water: 0.15,                    // 15% find water source
        loot: 0.15,                     // 15% find basic loot
        encounter: 0.1,                 // 10% trigger encounter
        hiddenLocation: 0.05            // 5% discover hidden location
      },

      // Food/water stamina recovery
      foodStaminaRecovery: 20,
      waterStaminaRecovery: 15,
      rationStaminaRecovery: 35         // Combined food + water
    };
  }

  /**
   * Initialize a new expedition
   * @param {string} fromRegionId - Starting region
   * @param {string} toRegionId - Destination region
   * @param {Object} playerState - Player state
   * @returns {ExpeditionState} New expedition state
   */
  startExpedition(fromRegionId, toRegionId, playerState) {
    const fromRegion = this.getRegion(fromRegionId);
    const toRegion = this.getRegion(toRegionId);

    if (!fromRegion || !toRegion) {
      console.error('Invalid regions for expedition:', fromRegionId, toRegionId);
      return null;
    }

    const distanceData = fromRegion.neighborDistances?.[toRegionId];
    if (!distanceData) {
      console.error('No distance data between regions:', fromRegionId, toRegionId);
      return null;
    }

    // Calculate starting stamina based on player stats
    const baseStamina = this.config.maxTravelStamina;
    const staminaBonus = (playerState.stats?.stamina || 0) * 5;
    const maxStamina = Math.min(baseStamina + staminaBonus, 150);

    return {
      fromRegion: fromRegionId,
      toRegion: toRegionId,
      fromRegionName: fromRegion.name,
      toRegionName: toRegion.name,
      totalDistance: distanceData.distance,
      distanceTraveled: 0,
      terrain: distanceData.terrain,
      dangerLevel: distanceData.dangerLevel,
      travelStamina: maxStamina,
      maxTravelStamina: maxStamina,
      hasTorch: false,
      campType: null,
      hoursElapsed: 0,
      discoveries: [],
      encounters: [],
      scavengeResults: [],
      isComplete: false
    };
  }

  /**
   * Calculate progress distance based on current stamina
   * @param {ExpeditionState} expedition - Current expedition state
   * @returns {number} Distance that will be covered
   */
  calculateProgressDistance(expedition) {
    const staminaRatio = expedition.travelStamina / expedition.maxTravelStamina;

    // Calculate multiplier based on stamina (linear interpolation)
    const multiplier = this.config.minProgressMultiplier +
      (staminaRatio * (this.config.maxProgressMultiplier - this.config.minProgressMultiplier));

    return Math.round(this.config.baseProgressDistance * multiplier);
  }

  /**
   * Process progress action
   * @param {ExpeditionState} expedition - Current expedition state
   * @param {Object} playerState - Player state
   * @returns {Object} Result of progress action
   */
  progress(expedition, playerState) {
    if (expedition.travelStamina < this.config.minStaminaToProgress) {
      return {
        success: false,
        reason: 'not_enough_stamina',
        message: 'You are too exhausted to continue. Rest or consume supplies.'
      };
    }

    const distanceCovered = this.calculateProgressDistance(expedition);
    const timeInfo = this.gameTimeProvider();

    // Check for encounter
    const encounterResult = this.checkForEncounter(expedition, playerState, timeInfo);

    // Update expedition state
    expedition.distanceTraveled += distanceCovered;
    expedition.travelStamina = Math.max(0, expedition.travelStamina - this.config.staminaPerProgress);
    expedition.hoursElapsed += this.config.hoursPerProgress;

    // Break camp when progressing
    if (expedition.campType) {
      expedition.campType = null;
    }

    // Check if arrived
    const distanceRemaining = expedition.totalDistance - expedition.distanceTraveled;
    if (distanceRemaining <= 0) {
      expedition.isComplete = true;
      expedition.distanceTraveled = expedition.totalDistance;
    }

    return {
      success: true,
      distanceCovered,
      distanceRemaining: Math.max(0, distanceRemaining),
      staminaUsed: this.config.staminaPerProgress,
      currentStamina: expedition.travelStamina,
      hoursElapsed: this.config.hoursPerProgress,
      encounter: encounterResult,
      isComplete: expedition.isComplete,
      progressPercent: Math.min(100, (expedition.distanceTraveled / expedition.totalDistance) * 100)
    };
  }

  /**
   * Process rest action
   * @param {ExpeditionState} expedition - Current expedition state
   * @param {Object} playerState - Player state
   * @returns {Object} Result of rest action
   */
  rest(expedition, playerState) {
    let staminaRecovery = this.config.staminaRecoveryPerRest;
    const timeInfo = this.gameTimeProvider();

    // Apply camp bonuses
    switch (expedition.campType) {
      case 'basic':
        staminaRecovery = this.config.staminaRecoveryWithCamp;
        break;
      case 'tent':
        staminaRecovery = this.config.staminaRecoveryWithTent;
        break;
      case 'pavilion':
        staminaRecovery = this.config.staminaRecoveryWithTent + 10;
        break;
    }

    // Check for encounter while resting
    const encounterResult = this.checkForEncounter(expedition, playerState, timeInfo, true);

    // If encounter during rest, reduce recovery
    if (encounterResult) {
      staminaRecovery = Math.floor(staminaRecovery * 0.5);
    }

    const previousStamina = expedition.travelStamina;
    expedition.travelStamina = Math.min(
      expedition.maxTravelStamina,
      expedition.travelStamina + staminaRecovery
    );
    expedition.hoursElapsed += this.config.hoursPerRest;

    return {
      success: true,
      staminaRecovered: expedition.travelStamina - previousStamina,
      currentStamina: expedition.travelStamina,
      hoursElapsed: this.config.hoursPerRest,
      hadCamp: !!expedition.campType,
      campType: expedition.campType,
      encounter: encounterResult
    };
  }

  /**
   * Process scavenge action
   * @param {ExpeditionState} expedition - Current expedition state
   * @param {Object} playerState - Player state
   * @returns {Object} Result of scavenge action
   */
  scavenge(expedition, playerState) {
    const roll = Math.random();
    const timeInfo = this.gameTimeProvider();
    let result = { type: 'nothing', items: [], message: '' };

    // Determine outcome
    let cumulative = 0;
    for (const [outcome, chance] of Object.entries(this.config.scavengeChances)) {
      cumulative += chance;
      if (roll <= cumulative) {
        result.type = outcome;
        break;
      }
    }

    // Process outcome
    switch (result.type) {
      case 'food':
        result.items = [{ id: 'foraged_berries', name: 'Foraged Berries', count: Math.floor(Math.random() * 3) + 1 }];
        result.message = 'You found some edible berries!';
        break;

      case 'water':
        result.items = [{ id: 'water_flask', name: 'Fresh Water', count: 1 }];
        result.message = 'You discovered a fresh water source!';
        break;

      case 'loot':
        result.items = this._generateScavengeLoot(expedition);
        result.message = 'You found something useful!';
        break;

      case 'encounter':
        result.encounter = this._generateEncounter(expedition, playerState);
        result.message = 'You stumbled upon something dangerous...';
        break;

      case 'hiddenLocation':
        result.discovery = this._generateHiddenLocation(expedition);
        result.message = 'You discovered a hidden location!';
        expedition.discoveries.push(result.discovery);
        break;

      default:
        result.message = 'You searched but found nothing of interest.';
    }

    expedition.hoursElapsed += this.config.hoursPerScavenge;
    expedition.scavengeResults.push(result);

    return {
      success: true,
      ...result,
      hoursElapsed: this.config.hoursPerScavenge
    };
  }

  /**
   * Set up camp
   * @param {ExpeditionState} expedition - Current expedition state
   * @param {string} campType - Type of camp ('basic', 'tent', 'pavilion')
   * @param {Object} itemUsed - Item used for camp (optional)
   * @returns {Object} Result of setting camp
   */
  setCamp(expedition, campType, itemUsed = null) {
    expedition.campType = campType;

    return {
      success: true,
      campType,
      itemUsed,
      encounterReduction: this._getCampEncounterReduction(campType),
      message: `You set up ${campType === 'basic' ? 'a basic camp' : `a ${campType}`}.`
    };
  }

  /**
   * Toggle torch
   * @param {ExpeditionState} expedition - Current expedition state
   * @param {boolean} lit - Whether to light or extinguish
   * @returns {Object} Result
   */
  toggleTorch(expedition, lit) {
    expedition.hasTorch = lit;

    return {
      success: true,
      hasTorch: lit,
      message: lit ? 'You light your torch.' : 'You extinguish your torch.'
    };
  }

  /**
   * Consume food/water for stamina recovery
   * @param {ExpeditionState} expedition - Current expedition state
   * @param {string} itemType - 'food', 'water', or 'ration'
   * @returns {Object} Result
   */
  consumeSupplies(expedition, itemType) {
    let staminaRecovery = 0;
    let message = '';

    switch (itemType) {
      case 'food':
        staminaRecovery = this.config.foodStaminaRecovery;
        message = 'You eat some food and feel rejuvenated.';
        break;
      case 'water':
        staminaRecovery = this.config.waterStaminaRecovery;
        message = 'You drink some water and feel refreshed.';
        break;
      case 'ration':
        staminaRecovery = this.config.rationStaminaRecovery;
        message = 'You consume your rations and feel much better.';
        break;
    }

    const previousStamina = expedition.travelStamina;
    expedition.travelStamina = Math.min(
      expedition.maxTravelStamina,
      expedition.travelStamina + staminaRecovery
    );

    return {
      success: true,
      staminaRecovered: expedition.travelStamina - previousStamina,
      currentStamina: expedition.travelStamina,
      message
    };
  }

  /**
   * Check for random encounter
   * @param {ExpeditionState} expedition - Current expedition state
   * @param {Object} playerState - Player state
   * @param {Object} timeInfo - Current time information
   * @param {boolean} isResting - Whether player is resting
   * @returns {Object|null} Encounter or null
   */
  checkForEncounter(expedition, playerState, timeInfo, isResting = false) {
    let encounterChance = this.config.baseEncounterChance;

    // Adjust for danger level
    encounterChance *= (1 + (expedition.dangerLevel - 1) * 0.2);

    // Night without torch doubles chance
    if (timeInfo.isNight && !expedition.hasTorch) {
      encounterChance *= this.config.nightEncounterMultiplier;
    }

    // Torch reduces chance
    if (expedition.hasTorch) {
      encounterChance *= this.config.torchEncounterReduction;
    }

    // Camp reduces chance
    if (expedition.campType) {
      const campReduction = this._getCampEncounterReduction(expedition.campType);
      encounterChance *= (1 - campReduction);

      // Torch + camp bonus
      if (expedition.hasTorch) {
        encounterChance *= (1 - (this.config.torchCampBonus - 1));
      }
    }

    // Resting increases chance slightly
    if (isResting && !expedition.campType) {
      encounterChance *= 1.3;
    }

    // Roll for encounter
    if (Math.random() < encounterChance) {
      return this._generateEncounter(expedition, playerState);
    }

    return null;
  }

  /**
   * Get camp encounter reduction
   * @param {string} campType - Type of camp
   * @returns {number} Reduction multiplier
   */
  _getCampEncounterReduction(campType) {
    switch (campType) {
      case 'basic': return this.config.basicCampReduction;
      case 'tent': return this.config.tentReduction;
      case 'pavilion': return this.config.pavilionReduction;
      default: return 0;
    }
  }

  /**
   * Generate an encounter based on expedition terrain/danger
   * @param {ExpeditionState} expedition - Current expedition state
   * @param {Object} playerState - Player state
   * @returns {Object} Generated encounter
   */
  _generateEncounter(expedition, playerState) {
    // Get terrain-appropriate encounter table
    const terrainTable = this.encounterTables[expedition.terrain] ||
                         this.encounterTables['default'] ||
                         null;

    if (!terrainTable) {
      // Default encounter if no table
      return {
        type: 'combat',
        enemies: ['wild_beast'],
        message: 'A wild creature attacks!',
        terrain: expedition.terrain,
        dangerLevel: expedition.dangerLevel
      };
    }

    // Select from table based on danger level
    const enemies = terrainTable.enemies || ['wild_beast'];
    const selectedEnemy = enemies[Math.floor(Math.random() * enemies.length)];

    return {
      type: 'combat',
      enemies: [selectedEnemy],
      message: `A ${selectedEnemy.replace(/_/g, ' ')} appears!`,
      terrain: expedition.terrain,
      dangerLevel: expedition.dangerLevel
    };
  }

  /**
   * Generate scavenge loot based on terrain
   * @param {ExpeditionState} expedition - Current expedition state
   * @returns {Array} Array of item objects
   */
  _generateScavengeLoot(expedition) {
    const lootTables = {
      forest_edge: ['healing_herb', 'branch', 'mushroom'],
      road: ['coins', 'cloth', 'rope'],
      mountain_trail: ['ore_chunk', 'gemstone_fragment', 'climbing_gear'],
      corrupted_path: ['dark_essence', 'corrupted_herb', 'demon_tooth'],
      default: ['coins', 'cloth', 'healing_herb']
    };

    const table = lootTables[expedition.terrain] || lootTables.default;
    const item = table[Math.floor(Math.random() * table.length)];

    return [{
      id: item,
      name: item.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      count: Math.floor(Math.random() * 3) + 1
    }];
  }

  /**
   * Generate a hidden location discovery
   * @param {ExpeditionState} expedition - Current expedition state
   * @returns {Object} Discovered location data
   */
  _generateHiddenLocation(expedition) {
    const hiddenLocations = {
      forest_edge: { id: 'hidden_grove', name: 'Hidden Grove', type: 'dungeon' },
      mountain_trail: { id: 'secret_cave', name: 'Secret Cave', type: 'dungeon' },
      corrupted_path: { id: 'demonic_shrine', name: 'Demonic Shrine', type: 'dungeon' },
      default: { id: 'abandoned_camp', name: 'Abandoned Camp', type: 'location' }
    };

    const location = hiddenLocations[expedition.terrain] || hiddenLocations.default;

    return {
      ...location,
      discoveredDuring: `expedition_${expedition.fromRegion}_to_${expedition.toRegion}`,
      terrain: expedition.terrain
    };
  }

  /**
   * Get expedition summary
   * @param {ExpeditionState} expedition - Expedition state
   * @returns {Object} Summary information
   */
  getExpeditionSummary(expedition) {
    const progressPercent = (expedition.distanceTraveled / expedition.totalDistance) * 100;

    return {
      fromRegion: expedition.fromRegionName,
      toRegion: expedition.toRegionName,
      progress: Math.min(100, Math.round(progressPercent)),
      distanceTraveled: expedition.distanceTraveled,
      distanceRemaining: Math.max(0, expedition.totalDistance - expedition.distanceTraveled),
      totalDistance: expedition.totalDistance,
      stamina: expedition.travelStamina,
      maxStamina: expedition.maxTravelStamina,
      staminaPercent: Math.round((expedition.travelStamina / expedition.maxTravelStamina) * 100),
      hoursElapsed: expedition.hoursElapsed,
      hasTorch: expedition.hasTorch,
      campType: expedition.campType,
      terrain: expedition.terrain,
      dangerLevel: expedition.dangerLevel,
      discoveries: expedition.discoveries,
      isComplete: expedition.isComplete
    };
  }
}

export default ExpeditionSystem;
