/**
 * ConditionEvaluator - Player state condition evaluation system
 *
 * Evaluates player state against data-defined conditions to dynamically
 * inject tags and modifiers for encounters and loot generation.
 *
 * @module engine/ConditionEvaluator
 */

/**
 * @typedef {Object} ConditionTrigger
 * @property {string} type - Trigger type (has_debuff, exposure_level, has_fluid, etc.)
 * @property {string} [operator] - Comparison operator (>, <, >=, <=, ==, !=)
 * @property {*} [value] - Value to compare against
 * @property {string} [debuff] - Debuff ID for has_debuff trigger
 * @property {string} [buff] - Buff ID for has_buff trigger
 * @property {string} [fluid] - Fluid type for has_fluid trigger
 * @property {string} [location] - Body location for has_fluid trigger
 * @property {number} [amount_min] - Minimum amount for has_fluid trigger
 * @property {string} [stat] - Stat name for player_stat trigger
 * @property {string} [flag] - Flag name for player_flag trigger
 * @property {string} [substance] - Substance ID for has_substance trigger
 * @property {string} [phase] - Substance phase for has_substance trigger
 * @property {string} [slot] - Equipment slot for equipment trigger
 * @property {string[]} [tags] - Tags to check for equipment trigger
 */

/**
 * @typedef {Object} EncounterModifier
 * @property {string} id - Modifier identifier
 * @property {string} [name] - Display name
 * @property {string} [description] - Description
 * @property {ConditionTrigger[]} triggers - Conditions that activate this modifier
 * @property {string[]} [adds_encounter_tags] - Tags to add to encounter selection
 * @property {number} [encounter_rate_multiplier] - Multiplier for encounter rate
 * @property {number} [base_chance_modifier] - Flat modifier to base encounter chance
 * @property {Object} [table_priority_boost] - Priority boost for specific table tags
 * @property {Object} [loot_modifiers] - Modifiers to apply to loot generation
 */

/**
 * @typedef {Object} LootModifier
 * @property {string} id - Modifier identifier
 * @property {ConditionTrigger[]} triggers - Conditions that activate this modifier
 * @property {Object} [rarity_weights] - Rarity weight multipliers
 * @property {number} [gold_multiplier] - Gold drop multiplier
 * @property {string[]} [adds_loot_tags] - Tags to add to loot table selection
 * @property {number} [quantity_multiplier] - Item quantity multiplier
 */

/**
 * @typedef {Object} EvaluationResult
 * @property {string[]} encounterTags - Tags to add to encounter selection
 * @property {number} encounterRateMultiplier - Combined rate multiplier
 * @property {number} baseChanceModifier - Flat modifier to base chance
 * @property {Object} tablePriorityBoosts - Priority boosts by tag
 * @property {Object} lootModifiers - Loot generation modifiers
 * @property {string[]} activeModifierIds - IDs of active modifiers
 */

// Comparison operators
const OPERATORS = {
  '>': (a, b) => a > b,
  '<': (a, b) => a < b,
  '>=': (a, b) => a >= b,
  '<=': (a, b) => a <= b,
  '==': (a, b) => a == b,
  '===': (a, b) => a === b,
  '!=': (a, b) => a != b,
  '!==': (a, b) => a !== b
};

// Time of day definitions (hour ranges)
const TIME_OF_DAY = {
  dawn: [5, 7],
  morning: [7, 12],
  day: [7, 18],
  afternoon: [12, 17],
  dusk: [17, 20],
  evening: [18, 22],
  night: [20, 5],
  midnight: [0, 4]
};

class ConditionEvaluator {
  constructor(options = {}) {
    /**
     * DataPackManager reference
     * @type {DataPackManager}
     */
    this.packManager = options.packManager || null;

    /**
     * Loaded encounter modifiers
     * @type {EncounterModifier[]}
     */
    this.encounterModifiers = [];

    /**
     * Loaded loot modifiers
     * @type {LootModifier[]}
     */
    this.lootModifiers = [];

    /**
     * Evaluation cache (cleared on player state change)
     * @type {Map<string, *>}
     */
    this.cache = new Map();

    /**
     * Cache validity timestamp
     * @type {number}
     */
    this.cacheTimestamp = 0;

    /**
     * Cache TTL in milliseconds
     * @type {number}
     */
    this.cacheTTL = options.cacheTTL || 1000;

    /**
     * Whether the evaluator has been initialized
     * @type {boolean}
     */
    this.initialized = false;
  }

  /**
   * Initialize the evaluator with condition configs from data packs
   * @param {DataPackManager} packManager - Initialized pack manager
   * @returns {Promise<void>}
   */
  async initialize(packManager) {
    this.packManager = packManager;

    // Load all condition configs
    const conditionConfigs = packManager.getAllContent('conditions');

    for (const config of conditionConfigs) {
      if (config.encounter_modifiers) {
        this.encounterModifiers.push(...config.encounter_modifiers);
      }
      if (config.loot_modifiers) {
        this.lootModifiers.push(...config.loot_modifiers);
      }
    }

    this.initialized = true;
    console.log(`ConditionEvaluator initialized with ${this.encounterModifiers.length} encounter modifiers and ${this.lootModifiers.length} loot modifiers`);
  }

  /**
   * Clear evaluation cache
   */
  clearCache() {
    this.cache.clear();
    this.cacheTimestamp = Date.now();
  }

  /**
   * Check if cache is valid
   * @returns {boolean}
   */
  isCacheValid() {
    return Date.now() - this.cacheTimestamp < this.cacheTTL;
  }

  /**
   * Evaluate a single trigger condition against player state
   * @param {ConditionTrigger} trigger - Trigger to evaluate
   * @param {Object} playerState - Current player state
   * @returns {boolean} Whether the trigger condition is met
   */
  evaluateTrigger(trigger, playerState) {
    const type = trigger.type;

    switch (type) {
      case 'has_debuff':
        return this.hasEffect(playerState, trigger.debuff, 'debuff');

      case 'has_buff':
        return this.hasEffect(playerState, trigger.buff, 'buff');

      case 'has_effect':
        return this.hasEffect(playerState, trigger.effect);

      case 'exposure_level':
        return this.compareValue(
          this.calculateExposure(playerState),
          trigger.operator || '>=',
          trigger.value
        );

      case 'has_fluid':
        return this.hasFluid(
          playerState,
          trigger.fluid,
          trigger.location,
          trigger.amount_min || 0
        );

      case 'corruption_level':
        return this.compareValue(
          playerState.nsfwStats?.corruption || 0,
          trigger.operator || '>=',
          trigger.value
        );

      case 'arousal_level':
        return this.compareValue(
          playerState.nsfwStats?.arousal || 0,
          trigger.operator || '>=',
          trigger.value
        );

      case 'intoxication_level':
        return this.compareValue(
          playerState.substanceState?.status?.intoxicationLevel || 0,
          trigger.operator || '>=',
          trigger.value
        );

      case 'player_stat':
        return this.compareValue(
          this.getPlayerStat(playerState, trigger.stat),
          trigger.operator || '>=',
          trigger.value
        );

      case 'player_level':
        return this.compareValue(
          playerState.level || 1,
          trigger.operator || '>=',
          trigger.value
        );

      case 'player_flag':
        return this.checkFlag(playerState, trigger.flag, trigger.value);

      case 'has_substance':
        return this.hasActiveSubstance(
          playerState,
          trigger.substance,
          trigger.phase
        );

      case 'is_intoxicated':
        return playerState.substanceState?.status?.isIntoxicated || false;

      case 'is_in_withdrawal':
        return playerState.substanceState?.status?.isInWithdrawal || false;

      case 'is_restrained':
        return playerState.combatState?.isRestrained || false;

      case 'is_grappled':
        return playerState.combatState?.isGrappled || false;

      case 'is_in_combat':
        return playerState.combatState?.inCombat || false;

      case 'hp_percent':
        return this.compareValue(
          this.calculateHpPercent(playerState),
          trigger.operator || '<=',
          trigger.value
        );

      case 'time_of_day':
        return this.isTimeOfDay(playerState, trigger.time);

      case 'location_tag':
        return this.hasLocationTag(playerState, trigger.tag);

      case 'equipment_has_tags':
        return this.equipmentHasTags(
          playerState,
          trigger.slot,
          trigger.tags
        );

      case 'clothing_integrity':
        return this.compareValue(
          this.getClothingIntegrity(playerState, trigger.slot),
          trigger.operator || '<=',
          trigger.value
        );

      case 'addiction_stage':
        return this.checkAddictionStage(
          playerState,
          trigger.substance,
          trigger.stage,
          trigger.operator
        );

      case 'relationship_stat':
        return this.compareValue(
          this.getRelationshipStat(playerState, trigger.npc, trigger.stat),
          trigger.operator || '>=',
          trigger.value
        );

      case 'always':
        return true;

      case 'never':
        return false;

      default:
        console.warn(`Unknown trigger type: ${type}`);
        return false;
    }
  }

  /**
   * Compare two values using an operator
   * @param {number} a - Left operand
   * @param {string} operator - Comparison operator
   * @param {number} b - Right operand
   * @returns {boolean}
   */
  compareValue(a, operator, b) {
    const compareFn = OPERATORS[operator];
    if (!compareFn) {
      console.warn(`Unknown operator: ${operator}`);
      return false;
    }
    return compareFn(a, b);
  }

  /**
   * Check if player has an active effect
   * @param {Object} playerState - Player state
   * @param {string} effectId - Effect ID to check
   * @param {string} [effectType] - Optional type filter (buff/debuff)
   * @returns {boolean}
   */
  hasEffect(playerState, effectId, effectType = null) {
    const effects = playerState.activeEffects || [];

    return effects.some(effect => {
      if (effect.id !== effectId) return false;
      if (effectType && effect.type !== effectType) return false;
      return true;
    });
  }

  /**
   * Calculate player's exposure level based on clothing
   * @param {Object} playerState - Player state
   * @returns {number} Exposure level 0-100
   */
  calculateExposure(playerState) {
    const equipment = playerState.equipment || {};
    const clothingSlots = [
      'chest', 'legs', 'underwear_top', 'underwear_bottom'
    ];

    let coveredSlots = 0;
    let totalSlots = clothingSlots.length;

    for (const slot of clothingSlots) {
      const item = equipment[slot];
      if (item) {
        // Check clothing integrity
        const integrity = item.currentIntegrity ?? item.maxIntegrity ?? 100;
        const maxIntegrity = item.maxIntegrity || 100;
        const integrityPercent = (integrity / maxIntegrity) * 100;

        // Clothing provides coverage based on integrity
        if (integrityPercent > 50) {
          coveredSlots += 1;
        } else if (integrityPercent > 20) {
          coveredSlots += 0.5;
        }
        // Below 20% = no coverage
      }
    }

    // Exposure is inverse of coverage
    const coveragePercent = (coveredSlots / totalSlots) * 100;
    return 100 - coveragePercent;
  }

  /**
   * Check if player has fluid on/in a body location
   * @param {Object} playerState - Player state
   * @param {string} fluidType - Type of fluid (semen, saliva, etc.)
   * @param {string} location - Body location (body, face, mouth, etc.)
   * @param {number} minAmount - Minimum amount required
   * @returns {boolean}
   */
  hasFluid(playerState, fluidType, location, minAmount = 0) {
    const fluids = playerState.nsfwStats?.bodyFluids || {};
    const locationFluids = fluids[location] || {};
    const amount = locationFluids[fluidType] || 0;
    return amount >= minAmount;
  }

  /**
   * Get a player stat value
   * @param {Object} playerState - Player state
   * @param {string} statName - Stat name
   * @returns {number}
   */
  getPlayerStat(playerState, statName) {
    // Check core stats first
    if (playerState.stats && playerState.stats[statName] !== undefined) {
      return playerState.stats[statName];
    }

    // Check derived stats
    if (playerState[statName] !== undefined) {
      return playerState[statName];
    }

    // Check NSFW stats
    if (playerState.nsfwStats && playerState.nsfwStats[statName] !== undefined) {
      return playerState.nsfwStats[statName];
    }

    return 0;
  }

  /**
   * Check a player flag
   * @param {Object} playerState - Player state
   * @param {string} flagName - Flag name
   * @param {*} expectedValue - Expected value (default true)
   * @returns {boolean}
   */
  checkFlag(playerState, flagName, expectedValue = true) {
    const flags = playerState.worldFlags || {};
    const actualValue = flags[flagName];

    if (expectedValue === true) {
      return !!actualValue;
    } else if (expectedValue === false) {
      return !actualValue;
    } else {
      return actualValue === expectedValue;
    }
  }

  /**
   * Check if player has an active substance
   * @param {Object} playerState - Player state
   * @param {string} substanceId - Substance ID
   * @param {string} [phase] - Optional phase filter (onset, peak, plateau, comedown)
   * @returns {boolean}
   */
  hasActiveSubstance(playerState, substanceId, phase = null) {
    const activeSubstances = playerState.substanceState?.activeSubstances || [];

    return activeSubstances.some(sub => {
      if (sub.substanceId !== substanceId) return false;
      if (phase && sub.currentPhase !== phase) return false;
      return true;
    });
  }

  /**
   * Calculate HP percentage
   * @param {Object} playerState - Player state
   * @returns {number} HP percentage 0-100
   */
  calculateHpPercent(playerState) {
    const currentHp = playerState.currentHp || 0;
    const maxHp = playerState.maxHp || 1;
    return (currentHp / maxHp) * 100;
  }

  /**
   * Check if current time matches time of day
   * @param {Object} playerState - Player state
   * @param {string|string[]} timeOfDay - Time(s) of day to check
   * @returns {boolean}
   */
  isTimeOfDay(playerState, timeOfDay) {
    const hour = playerState.currentTime?.hour ?? 12;
    const times = Array.isArray(timeOfDay) ? timeOfDay : [timeOfDay];

    return times.some(time => {
      const range = TIME_OF_DAY[time];
      if (!range) return false;

      const [start, end] = range;

      // Handle overnight ranges (e.g., night: 20-5)
      if (start > end) {
        return hour >= start || hour < end;
      } else {
        return hour >= start && hour < end;
      }
    });
  }

  /**
   * Check if current location has a tag
   * @param {Object} playerState - Player state
   * @param {string} tag - Tag to check
   * @returns {boolean}
   */
  hasLocationTag(playerState, tag) {
    const location = playerState.currentLocationData || {};
    const tags = location.tags || [];
    return tags.includes(tag);
  }

  /**
   * Check if equipped item has specific tags
   * @param {Object} playerState - Player state
   * @param {string} slot - Equipment slot
   * @param {string[]} tags - Tags to check (all must match)
   * @returns {boolean}
   */
  equipmentHasTags(playerState, slot, tags) {
    const equipment = playerState.equipment || {};
    const item = equipment[slot];

    if (!item) return false;

    const itemTags = item.tags || [];
    return tags.every(tag => itemTags.includes(tag));
  }

  /**
   * Get clothing integrity for a slot
   * @param {Object} playerState - Player state
   * @param {string} slot - Clothing slot
   * @returns {number} Integrity percentage 0-100
   */
  getClothingIntegrity(playerState, slot) {
    const equipment = playerState.equipment || {};
    const item = equipment[slot];

    if (!item) return 100; // No clothing = full "integrity" (not damaged)

    const current = item.currentIntegrity ?? item.maxIntegrity ?? 100;
    const max = item.maxIntegrity || 100;

    return (current / max) * 100;
  }

  /**
   * Check addiction stage for a substance
   * @param {Object} playerState - Player state
   * @param {string} substanceId - Substance ID
   * @param {string} stage - Addiction stage to check
   * @param {string} [operator='>='] - Comparison operator
   * @returns {boolean}
   */
  checkAddictionStage(playerState, substanceId, stage, operator = '>=') {
    const addictions = playerState.substanceState?.addictions || {};
    const addiction = addictions[substanceId];

    if (!addiction) return false;

    const stages = ['none', 'curious', 'casual', 'habitual', 'dependent', 'addicted', 'enslaved'];
    const currentIndex = stages.indexOf(addiction.stage || 'none');
    const targetIndex = stages.indexOf(stage);

    return this.compareValue(currentIndex, operator, targetIndex);
  }

  /**
   * Get relationship stat with an NPC
   * @param {Object} playerState - Player state
   * @param {string} npcId - NPC ID
   * @param {string} statName - Relationship stat (affection, trust, fear, etc.)
   * @returns {number}
   */
  getRelationshipStat(playerState, npcId, statName) {
    const relationships = playerState.relationships || {};
    const npcRelation = relationships[npcId] || {};
    return npcRelation[statName] || 0;
  }

  /**
   * Evaluate all encounter modifiers and return active ones
   * @param {Object} playerState - Current player state
   * @returns {EvaluationResult}
   */
  getActiveEncounterModifiers(playerState) {
    // Check cache
    const cacheKey = 'encounter_modifiers';
    if (this.isCacheValid() && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const result = {
      encounterTags: [],
      encounterRateMultiplier: 1.0,
      baseChanceModifier: 0,
      tablePriorityBoosts: {},
      lootModifiers: {},
      activeModifierIds: []
    };

    for (const modifier of this.encounterModifiers) {
      // Check if all triggers are met
      const triggers = modifier.triggers || [];
      const allTriggersActive = triggers.length === 0 ||
        triggers.every(trigger => this.evaluateTrigger(trigger, playerState));

      if (allTriggersActive) {
        result.activeModifierIds.push(modifier.id);

        // Add encounter tags
        if (modifier.adds_encounter_tags) {
          result.encounterTags.push(...modifier.adds_encounter_tags);
        }

        // Apply rate multiplier
        if (modifier.encounter_rate_multiplier) {
          result.encounterRateMultiplier *= modifier.encounter_rate_multiplier;
        }

        // Apply base chance modifier
        if (modifier.base_chance_modifier) {
          result.baseChanceModifier += modifier.base_chance_modifier;
        }

        // Add table priority boosts
        if (modifier.table_priority_boost) {
          const boost = modifier.table_priority_boost;
          const tags = boost.tags || [];
          for (const tag of tags) {
            result.tablePriorityBoosts[tag] =
              (result.tablePriorityBoosts[tag] || 0) + (boost.boost || 0);
          }
        }

        // Merge loot modifiers
        if (modifier.loot_modifiers) {
          this.mergeLootModifiers(result.lootModifiers, modifier.loot_modifiers);
        }
      }
    }

    // Deduplicate tags
    result.encounterTags = [...new Set(result.encounterTags)];

    // Cache result
    this.cache.set(cacheKey, result);
    this.cacheTimestamp = Date.now();

    return result;
  }

  /**
   * Evaluate all loot modifiers and return active ones
   * @param {Object} playerState - Current player state
   * @returns {Object} Loot modifiers
   */
  getActiveLootModifiers(playerState) {
    // Check cache
    const cacheKey = 'loot_modifiers';
    if (this.isCacheValid() && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const result = {
      rarityWeights: {},
      goldMultiplier: 1.0,
      lootTags: [],
      quantityMultiplier: 1.0,
      activeModifierIds: []
    };

    for (const modifier of this.lootModifiers) {
      const triggers = modifier.triggers || [];
      const allTriggersActive = triggers.length === 0 ||
        triggers.every(trigger => this.evaluateTrigger(trigger, playerState));

      if (allTriggersActive) {
        result.activeModifierIds.push(modifier.id);

        // Merge rarity weights
        if (modifier.rarity_weights) {
          for (const [rarity, weight] of Object.entries(modifier.rarity_weights)) {
            result.rarityWeights[rarity] =
              (result.rarityWeights[rarity] || 1.0) * weight;
          }
        }

        // Apply gold multiplier
        if (modifier.gold_multiplier) {
          result.goldMultiplier *= modifier.gold_multiplier;
        }

        // Add loot tags
        if (modifier.adds_loot_tags) {
          result.lootTags.push(...modifier.adds_loot_tags);
        }

        // Apply quantity multiplier
        if (modifier.quantity_multiplier) {
          result.quantityMultiplier *= modifier.quantity_multiplier;
        }
      }
    }

    // Deduplicate tags
    result.lootTags = [...new Set(result.lootTags)];

    // Cache result
    this.cache.set(cacheKey, result);

    return result;
  }

  /**
   * Merge loot modifier objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   */
  mergeLootModifiers(target, source) {
    if (source.rarity_weights) {
      target.rarity_weights = target.rarity_weights || {};
      for (const [rarity, weight] of Object.entries(source.rarity_weights)) {
        target.rarity_weights[rarity] =
          (target.rarity_weights[rarity] || 1.0) * weight;
      }
    }

    if (source.gold_multiplier) {
      target.gold_multiplier = (target.gold_multiplier || 1.0) * source.gold_multiplier;
    }

    if (source.adds_tags) {
      target.adds_tags = target.adds_tags || [];
      target.adds_tags.push(...source.adds_tags);
    }

    if (source.theft_chance) {
      target.theft_chance = Math.max(target.theft_chance || 0, source.theft_chance);
    }
  }

  /**
   * Get all tags that should be injected based on player state
   * @param {Object} playerState - Player state
   * @param {string} context - Context ('encounter' or 'loot')
   * @returns {string[]} Tags to inject
   */
  getInjectedTags(playerState, context = 'encounter') {
    if (context === 'encounter') {
      return this.getActiveEncounterModifiers(playerState).encounterTags;
    } else if (context === 'loot') {
      return this.getActiveLootModifiers(playerState).lootTags;
    }
    return [];
  }

  /**
   * Get statistics about loaded modifiers
   * @returns {Object}
   */
  getStats() {
    return {
      encounterModifiers: this.encounterModifiers.length,
      lootModifiers: this.lootModifiers.length,
      initialized: this.initialized
    };
  }
}

// Export for both ES modules and CommonJS
export default ConditionEvaluator;
export { ConditionEvaluator, TIME_OF_DAY, OPERATORS };
