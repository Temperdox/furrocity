/**
 * EncounterTableSystem - Tag-based encounter table selection
 *
 * Selects encounters from data-defined tables using tag matching
 * with AND priority logic, incorporating dynamic player condition tags.
 *
 * @module engine/EncounterTableSystem
 */

/**
 * @typedef {Object} EncounterTable
 * @property {string} id - Table identifier
 * @property {string} [name] - Display name
 * @property {string[]} tags - Tags for table selection
 * @property {EncounterTableConditions} [conditions] - Additional conditions
 * @property {EncounterEntry[]} encounters - Encounter entries
 * @property {number} [rate_multiplier] - Encounter rate multiplier
 * @property {string[]} [loot_tables] - Associated loot table IDs
 */

/**
 * @typedef {Object} EncounterTableConditions
 * @property {string[]} [location_tags] - Required location tags
 * @property {string[]} [time_of_day] - Allowed times of day
 * @property {number} [danger_level_min] - Minimum danger level
 * @property {number} [danger_level_max] - Maximum danger level
 * @property {Object[]} [player_conditions] - Player condition requirements
 */

/**
 * @typedef {Object} EncounterEntry
 * @property {string} type - Entry type (enemy, event, ambient, trap, social)
 * @property {string} [enemyId] - Enemy ID for enemy encounters
 * @property {string} [eventId] - Event ID for event encounters
 * @property {string} [description] - Description for ambient encounters
 * @property {number} weight - Selection weight
 * @property {Object} [count] - Enemy count configuration (min, max)
 * @property {boolean} [pack_behavior] - Whether enemies act as a pack
 * @property {Object[]} [conditions] - Entry-specific conditions
 * @property {string[]} [loot_table_overrides] - Override loot tables for this encounter
 */

/**
 * @typedef {Object} SelectedEncounter
 * @property {string} type - Encounter type
 * @property {string} [enemyId] - Enemy ID
 * @property {number} [count] - Number of enemies
 * @property {string} [eventId] - Event ID
 * @property {string} [description] - Ambient description
 * @property {string} sourceTable - Source table ID
 * @property {string[]} lootTables - Associated loot tables
 * @property {boolean} [packBehavior] - Pack behavior flag
 */

/**
 * @typedef {Object} EncounterRollResult
 * @property {boolean} shouldEncounter - Whether an encounter occurs
 * @property {number} adjustedChance - The adjusted encounter chance
 * @property {SelectedEncounter} [encounter] - Selected encounter if one occurs
 * @property {string[]} appliedModifiers - IDs of applied modifiers
 */

// Encounter types
const ENCOUNTER_TYPES = {
  ENEMY: 'enemy',
  EVENT: 'event',
  AMBIENT: 'ambient',
  TRAP: 'trap',
  SOCIAL: 'social',
  LUSTFUL: 'lustful',
  PREDATORY: 'predatory',
  HELPFUL: 'helpful'
};

class EncounterTableSystem {
  constructor(options = {}) {
    /**
     * DataPackManager reference
     * @type {DataPackManager}
     */
    this.packManager = options.packManager || null;

    /**
     * ConditionEvaluator reference
     * @type {ConditionEvaluator}
     */
    this.conditionEvaluator = options.conditionEvaluator || null;

    /**
     * All loaded encounter tables
     * @type {EncounterTable[]}
     */
    this.tables = [];

    /**
     * Tables indexed by ID
     * @type {Map<string, EncounterTable>}
     */
    this.tableIndex = new Map();

    /**
     * Random number generator
     * @type {Function}
     */
    this.random = options.random || Math.random;

    /**
     * Whether the system has been initialized
     * @type {boolean}
     */
    this.initialized = false;

    /**
     * Maximum tables to select for encounter pool
     * @type {number}
     */
    this.maxSelectedTables = options.maxSelectedTables || 5;

    /**
     * Base encounter rate multiplier
     * @type {number}
     */
    this.baseRateMultiplier = options.baseRateMultiplier || 1.0;
  }

  /**
   * Initialize the encounter table system
   * @param {DataPackManager} packManager - Initialized pack manager
   * @param {ConditionEvaluator} conditionEvaluator - Condition evaluator
   * @returns {Promise<void>}
   */
  async initialize(packManager, conditionEvaluator) {
    this.packManager = packManager;
    this.conditionEvaluator = conditionEvaluator;

    // Load all encounter tables
    this.tables = packManager.getAllContent('encounter_tables');

    // Build index
    this.tableIndex.clear();
    for (const table of this.tables) {
      if (table.id) {
        this.tableIndex.set(table.id, table);
      }
    }

    this.initialized = true;
    console.log(`EncounterTableSystem initialized with ${this.tables.length} tables`);
  }

  /**
   * Get active condition tags from player state
   * @param {Object} playerState - Current player state
   * @returns {string[]} Tags to inject into encounter selection
   */
  getActiveConditionTags(playerState) {
    if (!this.conditionEvaluator) {
      return [];
    }

    const modifiers = this.conditionEvaluator.getActiveEncounterModifiers(playerState);
    return modifiers.encounterTags || [];
  }

  /**
   * Select encounter tables using tag matching with AND priority
   * @param {string[]} locationTags - Tags from current location
   * @param {Object} playerState - Current player state
   * @returns {Object} Selection result with tables and metadata
   */
  selectEncounterTables(locationTags, playerState) {
    // Get condition-injected tags
    const conditionTags = this.getActiveConditionTags(playerState);
    const allTags = [...new Set([...locationTags, ...conditionTags])];

    // Get priority boosts from conditions
    let priorityBoosts = {};
    if (this.conditionEvaluator) {
      const modifiers = this.conditionEvaluator.getActiveEncounterModifiers(playerState);
      priorityBoosts = modifiers.tablePriorityBoosts || {};
    }

    // Score each table
    const scored = [];

    for (const table of this.tables) {
      // Check table conditions
      if (!this.checkTableConditions(table, playerState, locationTags)) {
        continue;
      }

      const tableTags = table.tags || [];
      if (tableTags.length === 0) continue;

      // Count matching tags
      const matchedTags = tableTags.filter(tag => allTags.includes(tag));
      const matchCount = matchedTags.length;

      if (matchCount === 0) continue;

      // Exact match = all table tags are in context
      const exactMatch = matchCount === tableTags.length;

      // Base priority
      let priority = exactMatch ? matchCount * 10 : matchCount;

      // Apply priority boosts from conditions
      for (const tag of tableTags) {
        if (priorityBoosts[tag]) {
          priority += priorityBoosts[tag];
        }
      }

      scored.push({
        table,
        matchCount,
        exactMatch,
        priority,
        matchedTags
      });
    }

    // Sort by priority descending
    scored.sort((a, b) => b.priority - a.priority);

    // Return top N tables with metadata
    const selectedTables = scored.slice(0, this.maxSelectedTables);

    return {
      tables: selectedTables.map(s => s.table),
      metadata: selectedTables.map(s => ({
        tableId: s.table.id,
        priority: s.priority,
        matchedTags: s.matchedTags,
        exactMatch: s.exactMatch
      })),
      allContextTags: allTags,
      conditionTags
    };
  }

  /**
   * Check if a table's conditions are met
   * @param {EncounterTable} table - Table to check
   * @param {Object} playerState - Player state
   * @param {string[]} locationTags - Location tags
   * @returns {boolean}
   */
  checkTableConditions(table, playerState, locationTags) {
    const conditions = table.conditions;
    if (!conditions) return true;

    // Check location tags
    if (conditions.location_tags) {
      const hasAllTags = conditions.location_tags.every(tag =>
        locationTags.includes(tag)
      );
      if (!hasAllTags) return false;
    }

    // Check danger level
    const dangerLevel = playerState.currentLocationData?.dangerLevel ?? 1;
    if (conditions.danger_level_min && dangerLevel < conditions.danger_level_min) {
      return false;
    }
    if (conditions.danger_level_max && dangerLevel > conditions.danger_level_max) {
      return false;
    }

    // Check time of day
    if (conditions.time_of_day) {
      const hour = playerState.currentTime?.hour ?? 12;
      if (!this.isTimeOfDay(hour, conditions.time_of_day)) {
        return false;
      }
    }

    // Check player conditions
    if (conditions.player_conditions && this.conditionEvaluator) {
      for (const condition of conditions.player_conditions) {
        if (!this.conditionEvaluator.evaluateTrigger(condition, playerState)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if hour matches time of day
   * @param {number} hour - Current hour (0-23)
   * @param {string[]} times - Allowed times
   * @returns {boolean}
   */
  isTimeOfDay(hour, times) {
    const timeRanges = {
      dawn: [5, 7],
      morning: [7, 12],
      day: [7, 18],
      afternoon: [12, 17],
      dusk: [17, 20],
      evening: [18, 22],
      night: [20, 5],
      midnight: [0, 4]
    };

    for (const time of times) {
      const range = timeRanges[time];
      if (!range) continue;

      const [start, end] = range;
      if (start > end) {
        // Overnight range
        if (hour >= start || hour < end) return true;
      } else {
        if (hour >= start && hour < end) return true;
      }
    }

    return false;
  }

  /**
   * Select a specific encounter from tables
   * @param {EncounterTable[]} tables - Selected tables
   * @param {Object} playerState - Player state
   * @returns {SelectedEncounter|null}
   */
  selectEncounter(tables, playerState) {
    if (!tables || tables.length === 0) {
      return null;
    }

    // Build combined encounter pool from all tables
    const pool = [];

    for (const table of tables) {
      const entries = table.encounters || [];

      for (const entry of entries) {
        // Check entry conditions
        if (!this.checkEntryConditions(entry, playerState)) {
          continue;
        }

        pool.push({
          entry,
          table,
          weight: entry.weight || 1
        });
      }
    }

    if (pool.length === 0) {
      return null;
    }

    // Select entry by weight
    const selected = this.weightedSelect(pool);
    if (!selected) return null;

    return this.processEntry(selected.entry, selected.table);
  }

  /**
   * Check if an entry's conditions are met
   * @param {EncounterEntry} entry - Entry to check
   * @param {Object} playerState - Player state
   * @returns {boolean}
   */
  checkEntryConditions(entry, playerState) {
    if (!entry.conditions || entry.conditions.length === 0) {
      return true;
    }

    for (const condition of entry.conditions) {
      if (this.conditionEvaluator) {
        if (!this.conditionEvaluator.evaluateTrigger(condition, playerState)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Select an item using weighted random selection
   * @param {Object[]} items - Items with weight property
   * @returns {Object|null}
   */
  weightedSelect(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0) return null;

    let roll = this.random() * totalWeight;

    for (const item of items) {
      roll -= item.weight;
      if (roll <= 0) {
        return item;
      }
    }

    return items[items.length - 1];
  }

  /**
   * Process a selected entry into an encounter object
   * @param {EncounterEntry} entry - Selected entry
   * @param {EncounterTable} table - Source table
   * @returns {SelectedEncounter}
   */
  processEntry(entry, table) {
    const encounter = {
      type: entry.type,
      sourceTable: table.id,
      lootTables: entry.loot_table_overrides || table.loot_tables || []
    };

    switch (entry.type) {
      case ENCOUNTER_TYPES.ENEMY:
      case ENCOUNTER_TYPES.PREDATORY:
      case ENCOUNTER_TYPES.LUSTFUL:
        encounter.enemyId = entry.enemyId;
        encounter.count = entry.count
          ? this.randomInt(entry.count.min, entry.count.max)
          : 1;
        encounter.packBehavior = entry.pack_behavior || false;
        break;

      case ENCOUNTER_TYPES.EVENT:
        encounter.eventId = entry.eventId;
        break;

      case ENCOUNTER_TYPES.AMBIENT:
        encounter.description = entry.description;
        break;

      case ENCOUNTER_TYPES.TRAP:
        encounter.trapId = entry.trapId;
        encounter.damage = entry.damage;
        encounter.effect = entry.effect;
        break;

      case ENCOUNTER_TYPES.SOCIAL:
      case ENCOUNTER_TYPES.HELPFUL:
        encounter.npcId = entry.npcId;
        encounter.dialogueId = entry.dialogueId;
        break;
    }

    return encounter;
  }

  /**
   * Calculate adjusted encounter rate based on player conditions
   * @param {number} baseRate - Base encounter rate (0-100)
   * @param {Object} playerState - Player state
   * @returns {Object} Adjusted rate and modifier info
   */
  calculateEncounterRate(baseRate, playerState) {
    let rate = baseRate * this.baseRateMultiplier;
    const appliedModifiers = [];

    if (this.conditionEvaluator) {
      const modifiers = this.conditionEvaluator.getActiveEncounterModifiers(playerState);

      // Apply rate multiplier
      if (modifiers.encounterRateMultiplier) {
        rate *= modifiers.encounterRateMultiplier;
      }

      // Apply base chance modifier
      if (modifiers.baseChanceModifier) {
        rate += modifiers.baseChanceModifier;
      }

      appliedModifiers.push(...modifiers.activeModifierIds);
    }

    // Clamp to valid range
    rate = Math.max(0, Math.min(100, rate));

    return {
      adjustedRate: rate,
      appliedModifiers
    };
  }

  /**
   * Roll for encounter and select one if successful
   * @param {Object} location - Current location
   * @param {Object} playerState - Player state
   * @returns {EncounterRollResult}
   */
  rollForEncounter(location, playerState) {
    const locationTags = location.tags || [];
    const baseRate = location.encounterChance || 0;

    // Calculate adjusted rate
    const { adjustedRate, appliedModifiers } = this.calculateEncounterRate(
      baseRate,
      playerState
    );

    // Roll for encounter
    const roll = this.random() * 100;
    const shouldEncounter = roll < adjustedRate;

    const result = {
      shouldEncounter,
      adjustedChance: adjustedRate,
      appliedModifiers,
      roll
    };

    if (shouldEncounter) {
      // Select tables
      const selection = this.selectEncounterTables(locationTags, playerState);

      // Select encounter
      result.encounter = this.selectEncounter(selection.tables, playerState);
      result.selectedTables = selection.metadata;
      result.contextTags = selection.allContextTags;
    }

    return result;
  }

  /**
   * Get a table by ID
   * @param {string} tableId - Table ID
   * @returns {EncounterTable|null}
   */
  getTable(tableId) {
    return this.tableIndex.get(tableId) || null;
  }

  /**
   * Get all tables with specific tags
   * @param {string[]} tags - Tags to match
   * @returns {EncounterTable[]}
   */
  getTablesByTags(tags) {
    return this.tables.filter(table => {
      const tableTags = table.tags || [];
      return tags.some(tag => tableTags.includes(tag));
    });
  }

  /**
   * Generate random integer in range [min, max]
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number}
   */
  randomInt(min, max) {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  /**
   * Get applicable loot tables for an encounter
   * @param {SelectedEncounter} encounter - Selected encounter
   * @returns {string[]} Loot table IDs
   */
  getEncounterLootTables(encounter) {
    return encounter.lootTables || [];
  }

  /**
   * Get statistics about loaded tables
   * @returns {Object}
   */
  getStats() {
    const tagCounts = {};
    for (const table of this.tables) {
      for (const tag of table.tags || []) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    return {
      totalTables: this.tables.length,
      initialized: this.initialized,
      tagCounts
    };
  }
}

// Export
export default EncounterTableSystem;
export { EncounterTableSystem, ENCOUNTER_TYPES };
