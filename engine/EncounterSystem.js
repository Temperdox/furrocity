/**
 * EncounterSystem - Dynamic encounter generation based on player state
 * 
 * Features:
 * - Location-based encounter chances
 * - Status effect modifiers (pheromones, intoxication, etc.)
 * - Passed-out/vulnerable encounter handling
 * - Encounter type weighting based on conditions
 * - Safe location enforcement
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const ENCOUNTER_TYPE = {
  COMBAT: 'combat',
  SOCIAL: 'social',
  LUSTFUL: 'lustful',
  PREDATORY: 'predatory',
  OPPORTUNISTIC: 'opportunistic',
  HELPFUL: 'helpful',
  AMBIENT: 'ambient',
  TRAP: 'trap',
  EVENT: 'event'
};

export const PLAYER_STATE = {
  NORMAL: 'normal',
  VULNERABLE: 'vulnerable',
  UNCONSCIOUS: 'unconscious',
  RESTRAINED: 'restrained',
  INTOXICATED: 'intoxicated',
  IN_COMBAT: 'in_combat'
};

// ============================================================================
// DEFAULT ENCOUNTER CONFIG
// ============================================================================

export const defaultEncounterConfig = {
  // Global modifiers
  globalEncounterRateMultiplier: 1.0,
  
  // Safe location IDs (0% encounter when passed out)
  safeLocations: [
    'starting_inn',
    'player_home',
    'temple_sanctuary',
    'guild_hall',
    'hospital'
  ],
  
  // Dangerous location IDs (increased encounters)
  dangerousLocations: [
    'slums_alley',
    'red_light_district',
    'monster_den',
    'bandit_hideout'
  ],
  
  // Base passed-out encounter chance by location type
  basePassedOutChance: {
    safe: 0,
    town: 15,
    wilderness: 35,
    dungeon: 50,
    hostile: 75,
    dangerous: 90
  },
  
  // Encounter type weights when passed out (default)
  defaultPassedOutWeights: {
    [ENCOUNTER_TYPE.PREDATORY]: 30,
    [ENCOUNTER_TYPE.OPPORTUNISTIC]: 40,
    [ENCOUNTER_TYPE.HELPFUL]: 15,
    [ENCOUNTER_TYPE.AMBIENT]: 15
  },
  
  // Encounter type weights when vulnerable but conscious
  defaultVulnerableWeights: {
    [ENCOUNTER_TYPE.COMBAT]: 20,
    [ENCOUNTER_TYPE.PREDATORY]: 25,
    [ENCOUNTER_TYPE.OPPORTUNISTIC]: 25,
    [ENCOUNTER_TYPE.SOCIAL]: 15,
    [ENCOUNTER_TYPE.HELPFUL]: 15
  }
};

// ============================================================================
// STATUS EFFECT ENCOUNTER MODIFIERS
// ============================================================================

export const statusEncounterModifiers = {
  // Pheromone effects
  pheromone_emitting: {
    baseChanceModifier: 25,
    passedOutModifier: 50,
    typeWeightModifiers: {
      [ENCOUNTER_TYPE.LUSTFUL]: 2.0,
      [ENCOUNTER_TYPE.PREDATORY]: 1.5,
      [ENCOUNTER_TYPE.SOCIAL]: 1.3
    },
    attractsCreatureTypes: ['humanoid', 'beast', 'demon'],
    description: "Your pheromones attract attention"
  },
  
  heightened_attraction: {
    baseChanceModifier: 15,
    passedOutModifier: 30,
    typeWeightModifiers: {
      [ENCOUNTER_TYPE.LUSTFUL]: 1.8,
      [ENCOUNTER_TYPE.SOCIAL]: 1.5
    }
  },
  
  // Vulnerability effects
  vulnerability_aura: {
    baseChanceModifier: 20,
    passedOutModifier: 75,
    typeWeightModifiers: {
      [ENCOUNTER_TYPE.PREDATORY]: 2.5,
      [ENCOUNTER_TYPE.OPPORTUNISTIC]: 2.0,
      [ENCOUNTER_TYPE.HELPFUL]: 0.3
    },
    description: "You appear weak and defenseless"
  },
  
  marked_prey: {
    baseChanceModifier: 40,
    passedOutModifier: 100,
    guaranteedEncounterType: ENCOUNTER_TYPE.PREDATORY,
    specificEncounterPool: ['hunter_encounter', 'stalker_encounter'],
    duration: 86400000,
    description: "Predators can sense the mark on you"
  },
  
  // Intoxication effects
  intoxication_obvious: {
    baseChanceModifier: 15,
    passedOutModifier: 35,
    typeWeightModifiers: {
      [ENCOUNTER_TYPE.OPPORTUNISTIC]: 1.8,
      [ENCOUNTER_TYPE.HELPFUL]: 1.2,
      [ENCOUNTER_TYPE.PREDATORY]: 1.3
    },
    description: "Your intoxication is obvious"
  },
  
  // Mental effects
  suggestible: {
    passedOutModifier: 20,
    typeWeightModifiers: {
      [ENCOUNTER_TYPE.OPPORTUNISTIC]: 1.5
    }
  },
  
  compliant: {
    passedOutModifier: 25,
    typeWeightModifiers: {
      [ENCOUNTER_TYPE.OPPORTUNISTIC]: 1.8,
      [ENCOUNTER_TYPE.LUSTFUL]: 1.3
    }
  },
  
  // Corruption effects
  corrupting: {
    baseChanceModifier: 10,
    typeWeightModifiers: {
      [ENCOUNTER_TYPE.PREDATORY]: 1.5
    },
    attractsCreatureTypes: ['demon', 'corrupted', 'dark_entity']
  },
  
  dark_power: {
    baseChanceModifier: -10,  // Less likely to be attacked
    typeWeightModifiers: {
      [ENCOUNTER_TYPE.COMBAT]: 0.7
    },
    repelsCreatureTypes: ['weak_creature', 'coward']
  },
  
  // Physical state effects
  exhausted: {
    baseChanceModifier: 10,
    passedOutModifier: 20,
    typeWeightModifiers: {
      [ENCOUNTER_TYPE.PREDATORY]: 1.3,
      [ENCOUNTER_TYPE.OPPORTUNISTIC]: 1.2
    }
  },
  
  unconscious: {
    forcePassedOutEncounter: true,
    passedOutModifier: 100
  },
  
  // Positive effects (reduce encounters)
  hidden: {
    baseChanceModifier: -50,
    passedOutModifier: -30
  },
  
  disguised: {
    baseChanceModifier: -20,
    typeWeightModifiers: {
      [ENCOUNTER_TYPE.PREDATORY]: 0.5
    }
  },
  
  protected: {
    baseChanceModifier: -25,
    passedOutModifier: -50,
    typeWeightModifiers: {
      [ENCOUNTER_TYPE.PREDATORY]: 0.3,
      [ENCOUNTER_TYPE.HELPFUL]: 2.0
    }
  }
};

// ============================================================================
// ENCOUNTER SYSTEM CLASS
// ============================================================================

export class EncounterSystem {
  constructor(registry, options = {}) {
    this.registry = registry;
    this.config = { ...defaultEncounterConfig, ...options.config };
    this.callbacks = options.callbacks || {};
    this.gameTimeProvider = options.gameTimeProvider || (() => Date.now());
    this.random = options.random || Math.random;
  }

  // =========================================================================
  // ENCOUNTER CHANCE CALCULATION
  // =========================================================================

  /**
   * Calculate encounter chance for current situation
   */
  calculateEncounterChance(player, location) {
    const playerState = this.determinePlayerState(player);
    
    // Safe locations = 0% when passed out
    if (playerState === PLAYER_STATE.UNCONSCIOUS) {
      return this.calculatePassedOutEncounterChance(player, location);
    }
    
    // Normal encounter calculation
    let baseChance = location.encounterChance || 0;
    
    // Apply location type modifier
    const locationType = this.getLocationType(location);
    if (this.config.dangerousLocations.includes(location.id)) {
      baseChance *= 1.5;
    }
    
    // Apply status effect modifiers
    const statusModifiers = this.getStatusModifiers(player);
    baseChance += statusModifiers.baseChanceModifier;
    
    // Apply global multiplier
    baseChance *= this.config.globalEncounterRateMultiplier;
    
    // Apply time of day modifier
    const timeModifier = this.getTimeOfDayModifier(player);
    baseChance *= timeModifier;
    
    // Apply player stats (perception reduces surprise encounters)
    const perception = player.stats?.perception || 5;
    const perceptionMod = 1 - (perception - 5) * 0.02;  // ±2% per point from 5
    baseChance *= perceptionMod;
    
    // Clamp to 0-100
    return Math.max(0, Math.min(100, baseChance));
  }

  /**
   * Calculate encounter chance when player is passed out
   */
  calculatePassedOutEncounterChance(player, location) {
    // Safe locations = always 0
    if (this.config.safeLocations.includes(location.id)) {
      return 0;
    }
    
    if (location.tags?.includes('safe')) {
      return 0;
    }
    
    // Get base chance from location type
    const locationType = this.getLocationType(location);
    let chance = this.config.basePassedOutChance[locationType] || 30;
    
    // Get substance state modifiers
    const substanceState = player.substanceState;
    if (substanceState?.encounterModifiers?.passedOutEncounterChance) {
      chance += substanceState.encounterModifiers.passedOutEncounterChance;
    }
    
    // Get status effect modifiers
    const statusEffects = this.getActiveStatusEffects(player);
    for (const effect of statusEffects) {
      const modifier = statusEncounterModifiers[effect.id];
      if (modifier?.passedOutModifier) {
        chance += modifier.passedOutModifier;
      }
    }
    
    // Apply location-specific modifiers
    if (location.passedOutEncounterModifier) {
      chance *= location.passedOutEncounterModifier;
    }
    
    // Clamp
    return Math.max(0, Math.min(100, chance));
  }

  /**
   * Get location type for base chance lookup
   */
  getLocationType(location) {
    if (location.tags?.includes('safe')) return 'safe';
    if (location.tags?.includes('town')) return 'town';
    if (location.tags?.includes('hostile')) return 'hostile';
    if (location.tags?.includes('dungeon')) return 'dungeon';
    if (location.tags?.includes('wilderness')) return 'wilderness';
    if (this.config.dangerousLocations.includes(location.id)) return 'dangerous';
    return 'wilderness';  // Default
  }

  // =========================================================================
  // ENCOUNTER TYPE DETERMINATION
  // =========================================================================

  /**
   * Determine what type of encounter occurs
   */
  determineEncounterType(player, location) {
    const playerState = this.determinePlayerState(player);
    
    // Get base weights
    let weights = { ...this.getBaseWeightsForState(playerState) };
    
    // Apply status effect modifiers
    const statusEffects = this.getActiveStatusEffects(player);
    for (const effect of statusEffects) {
      const modifier = statusEncounterModifiers[effect.id];
      if (modifier?.typeWeightModifiers) {
        for (const [type, multiplier] of Object.entries(modifier.typeWeightModifiers)) {
          weights[type] = (weights[type] || 0) * multiplier;
        }
      }
      
      // Check for guaranteed encounter type
      if (modifier?.guaranteedEncounterType) {
        return modifier.guaranteedEncounterType;
      }
    }
    
    // Apply location modifiers
    if (location.encounterTypeWeights) {
      for (const [type, weight] of Object.entries(location.encounterTypeWeights)) {
        weights[type] = weight;
      }
    }
    
    // Apply corruption level modifier
    const corruption = player.nsfwStats?.corruption || 0;
    if (corruption >= 50) {
      weights[ENCOUNTER_TYPE.LUSTFUL] = (weights[ENCOUNTER_TYPE.LUSTFUL] || 0) * 1.5;
      weights[ENCOUNTER_TYPE.PREDATORY] = (weights[ENCOUNTER_TYPE.PREDATORY] || 0) * 1.3;
    }
    
    // Weighted random selection
    return this.weightedRandomSelect(weights);
  }

  /**
   * Get base weights for player state
   */
  getBaseWeightsForState(state) {
    switch (state) {
      case PLAYER_STATE.UNCONSCIOUS:
        return { ...this.config.defaultPassedOutWeights };
      case PLAYER_STATE.VULNERABLE:
      case PLAYER_STATE.RESTRAINED:
        return { ...this.config.defaultVulnerableWeights };
      case PLAYER_STATE.INTOXICATED:
        return {
          [ENCOUNTER_TYPE.COMBAT]: 15,
          [ENCOUNTER_TYPE.SOCIAL]: 20,
          [ENCOUNTER_TYPE.OPPORTUNISTIC]: 25,
          [ENCOUNTER_TYPE.LUSTFUL]: 20,
          [ENCOUNTER_TYPE.HELPFUL]: 10,
          [ENCOUNTER_TYPE.AMBIENT]: 10
        };
      default:
        return {
          [ENCOUNTER_TYPE.COMBAT]: 30,
          [ENCOUNTER_TYPE.SOCIAL]: 25,
          [ENCOUNTER_TYPE.AMBIENT]: 20,
          [ENCOUNTER_TYPE.EVENT]: 15,
          [ENCOUNTER_TYPE.HELPFUL]: 10
        };
    }
  }

  // =========================================================================
  // ENCOUNTER SELECTION
  // =========================================================================

  /**
   * Select specific encounter from pool
   */
  async selectEncounter(player, location, encounterType) {
    // Get encounter pool for this type and location
    const pool = await this.getEncounterPool(location, encounterType);
    
    if (!pool || pool.length === 0) {
      return null;
    }
    
    // Filter by player conditions
    const validEncounters = pool.filter(enc => 
      this.meetsConditions(player, enc.conditions)
    );
    
    if (validEncounters.length === 0) {
      return null;
    }
    
    // Check for forced encounters from status effects
    const statusEffects = this.getActiveStatusEffects(player);
    for (const effect of statusEffects) {
      const modifier = statusEncounterModifiers[effect.id];
      if (modifier?.specificEncounterPool) {
        const specific = validEncounters.filter(e => 
          modifier.specificEncounterPool.includes(e.id)
        );
        if (specific.length > 0) {
          return this.weightedRandomSelect(
            specific.reduce((acc, e) => ({ ...acc, [e.id]: e.weight || 1 }), {})
          );
        }
      }
    }
    
    // Weight by various factors
    const weighted = {};
    for (const enc of validEncounters) {
      let weight = enc.weight || 1;
      
      // Adjust weight based on player state
      if (enc.preferredPlayerState) {
        const playerState = this.determinePlayerState(player);
        if (enc.preferredPlayerState.includes(playerState)) {
          weight *= 2;
        }
      }
      
      // Adjust based on creature type preferences from status effects
      if (enc.creatureType) {
        for (const effect of statusEffects) {
          const modifier = statusEncounterModifiers[effect.id];
          if (modifier?.attractsCreatureTypes?.includes(enc.creatureType)) {
            weight *= 1.5;
          }
          if (modifier?.repelsCreatureTypes?.includes(enc.creatureType)) {
            weight *= 0.3;
          }
        }
      }
      
      weighted[enc.id] = weight;
    }
    
    const selectedId = this.weightedRandomSelect(weighted);
    return validEncounters.find(e => e.id === selectedId);
  }

  /**
   * Get encounter pool for location and type
   */
  async getEncounterPool(location, encounterType) {
    // This would fetch from registry in real implementation
    // For now, check location's encounter tables
    const tableId = location.encounterTables?.[encounterType] || 
                   location.encounterTable;
    
    if (!tableId) return [];
    
    if (this.registry) {
      return await this.registry.getItem('encounterTables', tableId);
    }
    
    return [];
  }

  // =========================================================================
  // PLAYER STATE ANALYSIS
  // =========================================================================

  /**
   * Determine player's current state
   */
  determinePlayerState(player) {
    // Check in order of severity
    if (player.substanceState?.status?.isBlackedOut) {
      return PLAYER_STATE.UNCONSCIOUS;
    }
    
    if (player.combatState?.inCombat) {
      return PLAYER_STATE.IN_COMBAT;
    }
    
    if (player.combatState?.isRestrained || player.combatState?.isGrappled) {
      return PLAYER_STATE.RESTRAINED;
    }
    
    const intoxication = player.substanceState?.status?.intoxicationLevel || 0;
    if (intoxication >= 70) {
      return PLAYER_STATE.INTOXICATED;
    }
    
    // Check for vulnerability conditions
    if (this.isVulnerable(player)) {
      return PLAYER_STATE.VULNERABLE;
    }
    
    return PLAYER_STATE.NORMAL;
  }

  /**
   * Check if player is in a vulnerable state
   */
  isVulnerable(player) {
    // Low health
    if (player.currentHp < player.maxHp * 0.25) return true;
    
    // In withdrawal
    if (player.substanceState?.status?.isInWithdrawal) return true;
    
    // Low willpower from effects
    const baseWillpower = player.stats?.willpower || 5;
    // Would need to calculate current willpower with modifiers
    
    // Has vulnerability status
    const statusEffects = this.getActiveStatusEffects(player);
    const vulnerabilityEffects = ['vulnerable', 'exhausted', 'weakened', 'dazed'];
    for (const effect of statusEffects) {
      if (vulnerabilityEffects.includes(effect.id)) return true;
    }
    
    return false;
  }

  /**
   * Get all active status effects
   */
  getActiveStatusEffects(player) {
    const effects = [];
    
    // From NSFW stats
    if (player.nsfwStats?.statusEffects) {
      effects.push(...player.nsfwStats.statusEffects);
    }
    
    // From substance state
    if (player.substanceState?.activeSubstances) {
      for (const substance of player.substanceState.activeSubstances) {
        // Get effects from current phase
        // Would need substance definition lookup
      }
    }
    
    // From combat state
    if (player.combatState?.activeDebuffs) {
      effects.push(...player.combatState.activeDebuffs);
    }
    
    return effects;
  }

  /**
   * Get combined status modifiers
   */
  getStatusModifiers(player) {
    const result = {
      baseChanceModifier: 0,
      passedOutModifier: 0,
      typeWeightModifiers: {}
    };
    
    const effects = this.getActiveStatusEffects(player);
    
    for (const effect of effects) {
      const modifier = statusEncounterModifiers[effect.id];
      if (!modifier) continue;
      
      if (modifier.baseChanceModifier) {
        result.baseChanceModifier += modifier.baseChanceModifier;
      }
      
      if (modifier.passedOutModifier) {
        result.passedOutModifier += modifier.passedOutModifier;
      }
      
      if (modifier.typeWeightModifiers) {
        for (const [type, mult] of Object.entries(modifier.typeWeightModifiers)) {
          result.typeWeightModifiers[type] = 
            (result.typeWeightModifiers[type] || 1) * mult;
        }
      }
    }
    
    return result;
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Get time of day encounter modifier
   */
  getTimeOfDayModifier(player) {
    const hour = player.currentTime?.hour || 12;
    
    // Night time (22:00 - 06:00) increases encounter chance
    if (hour >= 22 || hour < 6) {
      return 1.3;
    }
    
    // Early morning/evening slightly increased
    if (hour >= 18 || hour < 8) {
      return 1.1;
    }
    
    return 1.0;
  }

  /**
   * Weighted random selection
   */
  weightedRandomSelect(weights) {
    const entries = Object.entries(weights);
    const total = entries.reduce((sum, [_, w]) => sum + w, 0);
    
    if (total === 0) return entries[0]?.[0];
    
    let random = this.random() * total;
    
    for (const [key, weight] of entries) {
      random -= weight;
      if (random <= 0) return key;
    }
    
    return entries[entries.length - 1][0];
  }

  /**
   * Check if player meets encounter conditions
   */
  meetsConditions(player, conditions) {
    if (!conditions) return true;
    
    for (const condition of conditions) {
      if (!this.evaluateCondition(player, condition)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Evaluate a single condition
   */
  evaluateCondition(player, condition) {
    switch (condition.type) {
      case 'stat_above':
        return (player.stats?.[condition.stat] || 0) >= condition.value;
      
      case 'stat_below':
        return (player.stats?.[condition.stat] || 0) < condition.value;
      
      case 'has_effect':
        return this.getActiveStatusEffects(player)
          .some(e => e.id === condition.effectId);
      
      case 'corruption_above':
        return (player.nsfwStats?.corruption || 0) >= condition.value;
      
      case 'is_addicted':
        return player.substanceState?.addictions?.[condition.substanceId]?.level >= 
               (condition.minLevel || 40);
      
      case 'has_flag':
        return player.worldFlags?.[condition.flag];
      
      case 'time_between':
        const hour = player.currentTime?.hour || 12;
        return hour >= condition.start && hour < condition.end;
      
      default:
        return true;
    }
  }

  // =========================================================================
  // MAIN ENCOUNTER CHECK
  // =========================================================================

  /**
   * Perform encounter check and return result
   */
  async checkForEncounter(player, location) {
    // Calculate chance
    const chance = this.calculateEncounterChance(player, location);
    
    // Roll for encounter
    const roll = this.random() * 100;
    
    if (roll >= chance) {
      return { 
        encounterOccurred: false, 
        chance, 
        roll 
      };
    }
    
    // Determine encounter type
    const encounterType = this.determineEncounterType(player, location);
    
    // Select specific encounter
    const encounter = await this.selectEncounter(player, location, encounterType);
    
    if (!encounter) {
      return {
        encounterOccurred: false,
        reason: 'no_valid_encounter',
        chance,
        roll,
        encounterType
      };
    }
    
    // Callback
    if (this.callbacks.onEncounter) {
      this.callbacks.onEncounter(player, encounter, {
        chance,
        roll,
        encounterType,
        playerState: this.determinePlayerState(player)
      });
    }
    
    return {
      encounterOccurred: true,
      encounter,
      encounterType,
      chance,
      roll,
      playerState: this.determinePlayerState(player)
    };
  }
}

export default EncounterSystem;
