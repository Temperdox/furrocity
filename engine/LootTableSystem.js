/**
 * LootTableSystem - Tag-based loot table selection and generation
 *
 * Selects and rolls loot from data-defined tables using tag matching
 * with AND priority logic, and applies luck/level scaling.
 *
 * @module engine/LootTableSystem
 */

/**
 * @typedef {Object} LootTable
 * @property {string} id - Table identifier
 * @property {string} [name] - Display name
 * @property {string[]} tags - Tags for table selection
 * @property {LootTableConditions} [conditions] - Additional conditions
 * @property {LootEntry[]} entries - Loot entries
 * @property {LootModifierConfig} [modifiers] - Modifier configurations
 * @property {Object} [roll_count] - Roll count configuration
 */

/**
 * @typedef {Object} LootTableConditions
 * @property {string[]} [location_tags] - Required location tags
 * @property {number} [player_level_min] - Minimum player level
 * @property {number} [player_level_max] - Maximum player level
 * @property {string[]} [time_of_day] - Allowed times of day
 * @property {Object[]} [player_conditions] - Player condition requirements
 */

/**
 * @typedef {Object} LootEntry
 * @property {string} type - Entry type (item, table_reference, gold, nothing)
 * @property {string} [itemId] - Item ID for item entries
 * @property {string} [tableId] - Table ID for table references
 * @property {number} weight - Selection weight
 * @property {Object} [count] - Count configuration (min, max)
 * @property {boolean} [rarity_scaling] - Whether luck affects this entry
 * @property {Object[]} [conditions] - Entry-specific conditions
 * @property {number} [level_offset] - Level offset for this item
 */

/**
 * @typedef {Object} LootModifierConfig
 * @property {Object} [luck_scaling] - Luck scaling configuration
 * @property {Object} [level_scaling] - Level scaling configuration
 */

/**
 * @typedef {Object} GeneratedLoot
 * @property {string} itemId - Item ID
 * @property {number} count - Quantity
 * @property {number} [itemLevel] - Generated item level
 * @property {string} [rarity] - Rolled rarity (if applicable)
 * @property {Object} [bonusStats] - Any bonus stats rolled
 * @property {string} sourceTable - Table this item came from
 */

// Rarity definitions with base weights
const RARITY_WEIGHTS = {
  common: 50,
  uncommon: 25,
  rare: 15,
  epic: 7,
  legendary: 2.5,
  mythic: 0.4,
  divine: 0.1
};

// Rarity stat multipliers
const RARITY_STAT_MULTIPLIERS = {
  common: 1.0,
  uncommon: 1.2,
  rare: 1.5,
  epic: 1.8,
  legendary: 2.2,
  mythic: 2.8,
  divine: 3.5
};

class LootTableSystem {
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
     * All loaded loot tables
     * @type {LootTable[]}
     */
    this.tables = [];

    /**
     * Tables indexed by ID
     * @type {Map<string, LootTable>}
     */
    this.tableIndex = new Map();

    /**
     * Random number generator (can be seeded for testing)
     * @type {Function}
     */
    this.random = options.random || Math.random;

    /**
     * Whether the system has been initialized
     * @type {boolean}
     */
    this.initialized = false;

    /**
     * Default luck stat value
     * @type {number}
     */
    this.baseLuckValue = options.baseLuckValue || 5;

    /**
     * Luck bonus per point above base
     * @type {number}
     */
    this.luckBonusPerPoint = options.luckBonusPerPoint || 0.02;

    /**
     * Maximum tables to select for a single roll
     * @type {number}
     */
    this.maxSelectedTables = options.maxSelectedTables || 3;
  }

  /**
   * Initialize the loot table system
   * @param {DataPackManager} packManager - Initialized pack manager
   * @param {ConditionEvaluator} conditionEvaluator - Condition evaluator
   * @returns {Promise<void>}
   */
  async initialize(packManager, conditionEvaluator) {
    this.packManager = packManager;
    this.conditionEvaluator = conditionEvaluator;

    // Load all loot tables
    this.tables = packManager.getAllContent('loot_tables');

    // Build index
    this.tableIndex.clear();
    for (const table of this.tables) {
      if (table.id) {
        this.tableIndex.set(table.id, table);
      }
    }

    this.initialized = true;
    console.log(`LootTableSystem initialized with ${this.tables.length} tables`);
  }

  /**
   * Select loot tables using tag matching with AND priority
   * @param {string[]} contextTags - Tags from context (location, enemy, etc.)
   * @param {Object} playerState - Current player state
   * @returns {LootTable[]} Selected tables sorted by priority
   */
  selectTables(contextTags, playerState) {
    // Get condition-injected tags
    let allTags = [...contextTags];

    if (this.conditionEvaluator) {
      const lootModifiers = this.conditionEvaluator.getActiveLootModifiers(playerState);
      allTags.push(...(lootModifiers.lootTags || []));
    }

    // Deduplicate
    allTags = [...new Set(allTags)];

    // Score each table
    const scored = [];

    for (const table of this.tables) {
      // Check table conditions
      if (!this.checkTableConditions(table, playerState)) {
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

      // Priority: exact matches get 10x boost
      const priority = exactMatch ? matchCount * 10 : matchCount;

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

    // Return top N tables
    return scored
      .slice(0, this.maxSelectedTables)
      .map(s => s.table);
  }

  /**
   * Check if a table's conditions are met
   * @param {LootTable} table - Table to check
   * @param {Object} playerState - Player state
   * @returns {boolean}
   */
  checkTableConditions(table, playerState) {
    const conditions = table.conditions;
    if (!conditions) return true;

    // Check location tags
    if (conditions.location_tags) {
      const locationTags = playerState.currentLocationData?.tags || [];
      const hasAllTags = conditions.location_tags.every(tag =>
        locationTags.includes(tag)
      );
      if (!hasAllTags) return false;
    }

    // Check player level
    const playerLevel = playerState.level || 1;
    if (conditions.player_level_min && playerLevel < conditions.player_level_min) {
      return false;
    }
    if (conditions.player_level_max && playerLevel > conditions.player_level_max) {
      return false;
    }

    // Check time of day
    if (conditions.time_of_day) {
      const hour = playerState.currentTime?.hour ?? 12;
      const times = conditions.time_of_day;
      // Simple check - could be more sophisticated
      const isNight = hour < 6 || hour >= 20;
      const isDay = hour >= 6 && hour < 20;

      if (times.includes('night') && !isNight) return false;
      if (times.includes('day') && !isDay) return false;
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
   * Generate loot from selected tables
   * @param {LootTable[]} tables - Tables to roll from
   * @param {Object} playerState - Player state
   * @param {number} [rollCount] - Override roll count
   * @returns {GeneratedLoot[]} Generated loot items
   */
  generateLoot(tables, playerState, rollCount = null) {
    if (!tables || tables.length === 0) {
      return [];
    }

    const loot = [];
    const playerLevel = playerState.level || 1;
    const luckStat = this.getPlayerLuck(playerState);

    // Get loot modifiers from conditions
    let lootModifiers = {};
    if (this.conditionEvaluator) {
      lootModifiers = this.conditionEvaluator.getActiveLootModifiers(playerState);
    }

    for (const table of tables) {
      // Determine number of rolls
      let rolls = rollCount;
      if (rolls === null) {
        const rollConfig = table.roll_count || { min: 1, max: 1 };
        rolls = this.randomInt(rollConfig.min, rollConfig.max);
      }

      // Apply quantity multiplier from conditions
      if (lootModifiers.quantityMultiplier) {
        rolls = Math.round(rolls * lootModifiers.quantityMultiplier);
      }

      for (let i = 0; i < rolls; i++) {
        const result = this.rollTable(table, playerState, luckStat, lootModifiers);
        if (result) {
          result.sourceTable = table.id;
          loot.push(result);
        }
      }
    }

    // Consolidate duplicate items
    return this.consolidateLoot(loot);
  }

  /**
   * Roll a single item from a table
   * @param {LootTable} table - Table to roll
   * @param {Object} playerState - Player state
   * @param {number} luckStat - Player's luck stat
   * @param {Object} lootModifiers - Active loot modifiers
   * @returns {GeneratedLoot|null}
   */
  rollTable(table, playerState, luckStat, lootModifiers) {
    const entries = table.entries || [];
    if (entries.length === 0) return null;

    // Filter entries by conditions
    const validEntries = entries.filter(entry =>
      this.checkEntryConditions(entry, playerState)
    );

    if (validEntries.length === 0) return null;

    // Apply luck scaling to weights
    const adjustedEntries = this.applyLuckScaling(
      validEntries,
      luckStat,
      table.modifiers?.luck_scaling,
      lootModifiers
    );

    // Select entry by weight
    const entry = this.weightedSelect(adjustedEntries);
    if (!entry) return null;

    // Process based on entry type
    return this.processEntry(entry, table, playerState, lootModifiers);
  }

  /**
   * Check if an entry's conditions are met
   * @param {LootEntry} entry - Entry to check
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
   * Apply luck scaling to entry weights
   * @param {LootEntry[]} entries - Entries to adjust
   * @param {number} luckStat - Player's luck stat
   * @param {Object} luckConfig - Luck scaling config
   * @param {Object} lootModifiers - Active loot modifiers
   * @returns {LootEntry[]} Adjusted entries
   */
  applyLuckScaling(entries, luckStat, luckConfig, lootModifiers) {
    const enabled = luckConfig?.enabled ?? true;
    if (!enabled) return entries;

    const perPoint = luckConfig?.per_point ?? this.luckBonusPerPoint;
    const luckBonus = (luckStat - this.baseLuckValue) * perPoint;

    // Get rarity weights from modifiers
    const rarityWeights = lootModifiers.rarityWeights || {};

    return entries.map(entry => {
      let weight = entry.weight;

      // Only scale if entry has rarity_scaling enabled
      if (entry.rarity_scaling) {
        // Get item data to check rarity
        const item = this.packManager?.getContentById('items', entry.itemId);
        const rarity = item?.rarity || 'common';

        // Apply luck bonus based on rarity
        const rarityMultipliers = {
          common: 1.0,
          uncommon: 1.0 + luckBonus,
          rare: 1.0 + luckBonus * 2,
          epic: 1.0 + luckBonus * 3,
          legendary: 1.0 + luckBonus * 5,
          mythic: 1.0 + luckBonus * 7,
          divine: 1.0 + luckBonus * 10
        };

        weight *= rarityMultipliers[rarity] || 1.0;

        // Apply condition-based rarity weight modifiers
        if (rarityWeights[rarity]) {
          weight *= rarityWeights[rarity];
        }
      }

      return { ...entry, weight: Math.max(0, weight) };
    });
  }

  /**
   * Select an entry using weighted random selection
   * @param {LootEntry[]} entries - Entries with weights
   * @returns {LootEntry|null}
   */
  weightedSelect(entries) {
    const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
    if (totalWeight <= 0) return null;

    let roll = this.random() * totalWeight;

    for (const entry of entries) {
      roll -= entry.weight;
      if (roll <= 0) {
        return entry;
      }
    }

    return entries[entries.length - 1];
  }

  /**
   * Process a selected entry into generated loot
   * @param {LootEntry} entry - Selected entry
   * @param {LootTable} table - Source table
   * @param {Object} playerState - Player state
   * @param {Object} lootModifiers - Active loot modifiers
   * @returns {GeneratedLoot|null}
   */
  processEntry(entry, table, playerState, lootModifiers) {
    const type = entry.type;

    switch (type) {
      case 'item':
        return this.processItemEntry(entry, table, playerState, lootModifiers);

      case 'gold':
        return this.processGoldEntry(entry, lootModifiers);

      case 'table_reference':
        return this.processTableReference(entry, playerState, lootModifiers);

      case 'nothing':
        return null;

      default:
        console.warn(`Unknown loot entry type: ${type}`);
        return null;
    }
  }

  /**
   * Process an item entry
   * @param {LootEntry} entry - Item entry
   * @param {LootTable} table - Source table
   * @param {Object} playerState - Player state
   * @param {Object} lootModifiers - Active loot modifiers
   * @returns {GeneratedLoot}
   */
  processItemEntry(entry, table, playerState, lootModifiers) {
    const count = entry.count
      ? this.randomInt(entry.count.min, entry.count.max)
      : 1;

    const result = {
      itemId: entry.itemId,
      count,
      sourceTable: table.id
    };

    // Apply level scaling
    const levelConfig = table.modifiers?.level_scaling;
    if (levelConfig?.enabled) {
      const playerLevel = playerState.level || 1;
      const variance = levelConfig.item_level_variance || 0;
      const offset = entry.level_offset || levelConfig.item_level_offset || 0;

      result.itemLevel = playerLevel + offset +
        this.randomInt(-variance, variance);
      result.itemLevel = Math.max(1, result.itemLevel);
    }

    return result;
  }

  /**
   * Process a gold entry
   * @param {LootEntry} entry - Gold entry
   * @param {Object} lootModifiers - Active loot modifiers
   * @returns {GeneratedLoot}
   */
  processGoldEntry(entry, lootModifiers) {
    let count = entry.count
      ? this.randomInt(entry.count.min, entry.count.max)
      : 1;

    // Apply gold multiplier from conditions
    if (lootModifiers.goldMultiplier) {
      count = Math.round(count * lootModifiers.goldMultiplier);
    }

    return {
      itemId: 'gold',
      count,
      sourceTable: 'gold'
    };
  }

  /**
   * Process a table reference (nested table)
   * @param {LootEntry} entry - Table reference entry
   * @param {Object} playerState - Player state
   * @param {Object} lootModifiers - Active loot modifiers
   * @returns {GeneratedLoot|null}
   */
  processTableReference(entry, playerState, lootModifiers) {
    const referencedTable = this.tableIndex.get(entry.tableId);
    if (!referencedTable) {
      console.warn(`Referenced loot table not found: ${entry.tableId}`);
      return null;
    }

    const rollCount = entry.rollCount || 1;
    const luckStat = this.getPlayerLuck(playerState);

    // Roll the referenced table
    const result = this.rollTable(
      referencedTable,
      playerState,
      luckStat,
      lootModifiers
    );

    return result;
  }

  /**
   * Get player's luck stat
   * @param {Object} playerState - Player state
   * @returns {number}
   */
  getPlayerLuck(playerState) {
    return playerState.stats?.luck ?? this.baseLuckValue;
  }

  /**
   * Consolidate duplicate loot items
   * @param {GeneratedLoot[]} loot - Loot to consolidate
   * @returns {GeneratedLoot[]}
   */
  consolidateLoot(loot) {
    const consolidated = new Map();

    for (const item of loot) {
      // Key is itemId + itemLevel for stacking
      const key = `${item.itemId}:${item.itemLevel || 0}`;

      if (consolidated.has(key)) {
        consolidated.get(key).count += item.count;
      } else {
        consolidated.set(key, { ...item });
      }
    }

    return Array.from(consolidated.values());
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
   * Get a table by ID
   * @param {string} tableId - Table ID
   * @returns {LootTable|null}
   */
  getTable(tableId) {
    return this.tableIndex.get(tableId) || null;
  }

  /**
   * Get all tables with specific tags
   * @param {string[]} tags - Tags to match
   * @returns {LootTable[]}
   */
  getTablesByTags(tags) {
    return this.tables.filter(table => {
      const tableTags = table.tags || [];
      return tags.some(tag => tableTags.includes(tag));
    });
  }

  /**
   * Roll rarity for an item based on weights
   * @param {number} luckStat - Player's luck stat
   * @param {Object} [customWeights] - Override rarity weights
   * @returns {string} Rolled rarity
   */
  rollRarity(luckStat, customWeights = null) {
    const luckBonus = (luckStat - this.baseLuckValue) * this.luckBonusPerPoint;

    const weights = { ...RARITY_WEIGHTS, ...customWeights };

    // Apply luck bonus to rare+ items
    const adjustedWeights = {};
    for (const [rarity, weight] of Object.entries(weights)) {
      let adjusted = weight;
      if (rarity !== 'common') {
        const multiplier = rarity === 'uncommon' ? 1 :
          rarity === 'rare' ? 2 :
            rarity === 'epic' ? 3 :
              rarity === 'legendary' ? 5 :
                rarity === 'mythic' ? 7 : 10;
        adjusted *= (1 + luckBonus * multiplier);
      }
      adjustedWeights[rarity] = adjusted;
    }

    // Select rarity
    const total = Object.values(adjustedWeights).reduce((a, b) => a + b, 0);
    let roll = this.random() * total;

    for (const [rarity, weight] of Object.entries(adjustedWeights)) {
      roll -= weight;
      if (roll <= 0) return rarity;
    }

    return 'common';
  }

  /**
   * Get stat multiplier for a rarity
   * @param {string} rarity - Rarity name
   * @returns {number}
   */
  getRarityMultiplier(rarity) {
    return RARITY_STAT_MULTIPLIERS[rarity] || 1.0;
  }

  /**
   * Get statistics about loaded tables
   * @returns {Object}
   */
  getStats() {
    return {
      totalTables: this.tables.length,
      initialized: this.initialized
    };
  }
}

// Export
export default LootTableSystem;
export { LootTableSystem, RARITY_WEIGHTS, RARITY_STAT_MULTIPLIERS };
