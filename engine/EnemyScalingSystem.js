/**
 * @fileoverview EnemyScalingSystem - Dynamic enemy stat generation and scaling
 *
 * Allows enemy definitions to omit stats, level, rewards, and resistances.
 * The system calculates missing values based on:
 * - Location danger level and type
 * - Player level and stats
 * - Player equipment bonuses
 * - Active effects (luck, XP boost, etc.)
 *
 * @module engine/EnemyScalingSystem
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Base stat multipliers by enemy type
 */
export const ENEMY_TYPE_STATS = {
  beast: {
    hp: 1.0,
    attack: 1.1,
    defense: 0.8,
    speed: 1.2,
    baseGold: 2,
    baseXp: 1.0
  },
  humanoid: {
    hp: 1.0,
    attack: 1.0,
    defense: 1.0,
    speed: 1.0,
    baseGold: 10,
    baseXp: 1.1
  },
  undead: {
    hp: 1.2,
    attack: 0.9,
    defense: 1.1,
    speed: 0.7,
    baseGold: 5,
    baseXp: 1.2
  },
  demon: {
    hp: 1.3,
    attack: 1.2,
    defense: 1.0,
    speed: 1.0,
    baseGold: 15,
    baseXp: 1.4
  },
  elemental: {
    hp: 0.9,
    attack: 1.3,
    defense: 0.9,
    speed: 1.1,
    baseGold: 8,
    baseXp: 1.3
  },
  construct: {
    hp: 1.4,
    attack: 1.0,
    defense: 1.3,
    speed: 0.6,
    baseGold: 12,
    baseXp: 1.2
  },
  plant: {
    hp: 1.1,
    attack: 0.8,
    defense: 1.0,
    speed: 0.5,
    baseGold: 3,
    baseXp: 0.9
  },
  slime: {
    hp: 0.8,
    attack: 0.7,
    defense: 0.6,
    speed: 0.8,
    baseGold: 1,
    baseXp: 0.7
  },
  dragon: {
    hp: 1.8,
    attack: 1.5,
    defense: 1.4,
    speed: 1.0,
    baseGold: 50,
    baseXp: 2.0
  },
  boss: {
    hp: 2.5,
    attack: 1.4,
    defense: 1.3,
    speed: 0.9,
    baseGold: 100,
    baseXp: 3.0
  },
  default: {
    hp: 1.0,
    attack: 1.0,
    defense: 1.0,
    speed: 1.0,
    baseGold: 5,
    baseXp: 1.0
  }
};

/**
 * Default resistances by enemy type
 */
export const ENEMY_TYPE_RESISTANCES = {
  beast: { physical: 0, fire: -10, ice: 10, lightning: 0, poison: -10 },
  humanoid: { physical: 0, fire: 0, ice: 0, lightning: 0, poison: 0 },
  undead: { physical: 20, fire: -30, ice: 20, lightning: -20, poison: 100, holy: -50 },
  demon: { physical: 10, fire: 30, ice: -20, lightning: 0, poison: 20, holy: -30 },
  elemental: { physical: 20, fire: 0, ice: 0, lightning: 0, poison: 50 },
  construct: { physical: 30, fire: -20, ice: 10, lightning: -30, poison: 100 },
  plant: { physical: 0, fire: -40, ice: -20, lightning: 0, poison: 50 },
  slime: { physical: 30, fire: -20, ice: -20, lightning: -30, poison: 50 },
  dragon: { physical: 20, fire: 50, ice: 0, lightning: 10, poison: 20 },
  boss: { physical: 10, fire: 10, ice: 10, lightning: 10, poison: 10 },
  default: { physical: 0, fire: 0, ice: 0, lightning: 0, poison: 0 }
};

/**
 * Location danger level multipliers
 */
export const DANGER_LEVEL_SCALING = {
  1: { level: 0, stats: 0.8, gold: 0.5, xp: 0.8 },   // Safe areas
  2: { level: 1, stats: 0.9, gold: 0.75, xp: 0.9 },  // Low danger
  3: { level: 2, stats: 1.0, gold: 1.0, xp: 1.0 },   // Normal
  4: { level: 3, stats: 1.15, gold: 1.25, xp: 1.15 }, // Dangerous
  5: { level: 5, stats: 1.3, gold: 1.5, xp: 1.3 },   // Very dangerous
  6: { level: 7, stats: 1.5, gold: 2.0, xp: 1.5 }    // Extreme (dungeons, boss areas)
};

/**
 * Base stats per level
 */
const BASE_STATS_PER_LEVEL = {
  hp: 15,
  attack: 3,
  defense: 2,
  speed: 2
};

// =============================================================================
// ENEMY SCALING SYSTEM
// =============================================================================

export class EnemyScalingSystem {
  constructor(options = {}) {
    this.typeStats = { ...ENEMY_TYPE_STATS, ...options.customTypeStats };
    this.typeResistances = { ...ENEMY_TYPE_RESISTANCES, ...options.customTypeResistances };
    this.dangerScaling = { ...DANGER_LEVEL_SCALING, ...options.customDangerScaling };
    this.baseStatsPerLevel = { ...BASE_STATS_PER_LEVEL, ...options.customBaseStats };

    // Scaling options
    this.levelVariance = options.levelVariance ?? 2; // +/- variance from calculated level
    this.statVariance = options.statVariance ?? 0.1; // +/- 10% stat variance
    this.minLevel = options.minLevel ?? 1;
    this.maxLevel = options.maxLevel ?? 100;
  }

  /**
   * Resolve a full enemy definition, filling in any missing values
   * @param {Object} enemyDef - Base enemy definition (can be partial)
   * @param {Object} context - Context for scaling calculations
   * @param {Object} context.player - Player state
   * @param {Object} context.location - Current location
   * @param {Object} [context.difficulty] - Game difficulty settings
   * @returns {Object} Fully resolved enemy with all stats
   */
  resolveEnemy(enemyDef, context = {}) {
    const { player, location, difficulty } = context;

    // Start with a copy of the definition
    const enemy = { ...enemyDef };

    // Resolve level first (needed for stat calculations)
    if (enemy.level === undefined || enemy.level === null) {
      enemy.level = this.calculateLevel(enemyDef, context);
    }

    // Resolve stats
    if (!enemy.stats || this.hasUndefinedStats(enemy.stats)) {
      enemy.stats = this.calculateStats(enemy, context);
    }

    // Resolve resistances
    if (!enemy.resistances) {
      enemy.resistances = this.calculateResistances(enemy);
    }

    // Resolve rewards
    if (enemy.experienceReward === undefined || enemy.experienceReward === null) {
      enemy.experienceReward = this.calculateExperienceReward(enemy, context);
    }

    if (!enemy.goldDrop) {
      enemy.goldDrop = this.calculateGoldDrop(enemy, context);
    }

    // Resolve loot table if not specified
    if (!enemy.lootTable) {
      enemy.lootTable = this.getDefaultLootTable(enemy);
    }

    // Apply difficulty modifiers
    if (difficulty) {
      this.applyDifficultyModifiers(enemy, difficulty);
    }

    // Mark as resolved
    enemy._resolved = true;
    enemy._resolvedAt = Date.now();

    return enemy;
  }

  /**
   * Check if stats object has undefined values
   */
  hasUndefinedStats(stats) {
    if (!stats) return true;
    return stats.maxHp === undefined ||
           stats.attack === undefined ||
           stats.defense === undefined ||
           stats.speed === undefined;
  }

  /**
   * Calculate enemy level based on context
   */
  calculateLevel(enemyDef, context) {
    const { player, location } = context;

    // Base level from player
    let baseLevel = player?.level || 1;

    // Adjust based on location danger
    const dangerLevel = location?.dangerLevel || location?.encounterChance ?
      Math.ceil((location.encounterChance || 20) / 20) : 3;
    const dangerScaling = this.dangerScaling[dangerLevel] || this.dangerScaling[3];
    baseLevel += dangerScaling.level;

    // Add variance
    const variance = Math.floor(Math.random() * (this.levelVariance * 2 + 1)) - this.levelVariance;
    let finalLevel = baseLevel + variance;

    // Apply enemy-specific level modifier if present
    if (enemyDef.levelModifier) {
      finalLevel += enemyDef.levelModifier;
    }

    // Apply min/max level from enemy def or system defaults
    const minLevel = enemyDef.minLevel ?? this.minLevel;
    const maxLevel = enemyDef.maxLevel ?? this.maxLevel;

    return Math.max(minLevel, Math.min(maxLevel, finalLevel));
  }

  /**
   * Calculate enemy stats based on level and type
   */
  calculateStats(enemy, context) {
    const { player, location } = context;
    const level = enemy.level;
    const type = enemy.type || 'default';
    const typeStats = this.typeStats[type] || this.typeStats.default;

    // Get danger scaling
    const dangerLevel = location?.dangerLevel || 3;
    const dangerScaling = this.dangerScaling[dangerLevel] || this.dangerScaling[3];

    // Calculate base stats
    const baseHp = this.baseStatsPerLevel.hp * level * typeStats.hp * dangerScaling.stats;
    const baseAttack = this.baseStatsPerLevel.attack * level * typeStats.attack * dangerScaling.stats;
    const baseDefense = this.baseStatsPerLevel.defense * level * typeStats.defense * dangerScaling.stats;
    const baseSpeed = this.baseStatsPerLevel.speed * level * typeStats.speed;

    // Apply variance
    const applyVariance = (value) => {
      const variance = 1 + (Math.random() * this.statVariance * 2 - this.statVariance);
      return Math.round(value * variance);
    };

    // Merge with any existing partial stats
    const existingStats = enemy.stats || {};

    return {
      maxHp: existingStats.maxHp ?? applyVariance(baseHp),
      attack: existingStats.attack ?? applyVariance(baseAttack),
      defense: existingStats.defense ?? applyVariance(baseDefense),
      speed: existingStats.speed ?? applyVariance(baseSpeed),
      // Preserve any extra stats from definition
      ...Object.fromEntries(
        Object.entries(existingStats).filter(([key]) =>
          !['maxHp', 'attack', 'defense', 'speed'].includes(key)
        )
      )
    };
  }

  /**
   * Calculate resistances based on enemy type
   */
  calculateResistances(enemy) {
    const type = enemy.type || 'default';
    const baseResistances = { ...this.typeResistances[type] } || { ...this.typeResistances.default };

    // Modify based on tags
    if (enemy.tags) {
      if (enemy.tags.includes('fire')) {
        baseResistances.fire = (baseResistances.fire || 0) + 30;
        baseResistances.ice = (baseResistances.ice || 0) - 20;
      }
      if (enemy.tags.includes('ice') || enemy.tags.includes('frost')) {
        baseResistances.ice = (baseResistances.ice || 0) + 30;
        baseResistances.fire = (baseResistances.fire || 0) - 20;
      }
      if (enemy.tags.includes('lightning') || enemy.tags.includes('electric')) {
        baseResistances.lightning = (baseResistances.lightning || 0) + 30;
      }
      if (enemy.tags.includes('armored')) {
        baseResistances.physical = (baseResistances.physical || 0) + 20;
      }
      if (enemy.tags.includes('ethereal') || enemy.tags.includes('ghost')) {
        baseResistances.physical = (baseResistances.physical || 0) + 50;
        baseResistances.holy = (baseResistances.holy || 0) - 30;
      }
    }

    return baseResistances;
  }

  /**
   * Calculate experience reward
   */
  calculateExperienceReward(enemy, context) {
    const { player, location } = context;
    const level = enemy.level;
    const type = enemy.type || 'default';
    const typeStats = this.typeStats[type] || this.typeStats.default;

    // Base XP calculation
    let baseXp = level * 10 * typeStats.baseXp;

    // Danger scaling
    const dangerLevel = location?.dangerLevel || 3;
    const dangerScaling = this.dangerScaling[dangerLevel] || this.dangerScaling[3];
    baseXp *= dangerScaling.xp;

    // Apply player XP modifiers (from effects, equipment, etc.)
    if (player) {
      const xpBoost = this.getPlayerModifier(player, 'xpBoost');
      baseXp *= (1 + xpBoost / 100);
    }

    // Boss/elite multiplier
    if (enemy.tags?.includes('boss')) {
      baseXp *= 3;
    } else if (enemy.tags?.includes('elite') || enemy.tags?.includes('miniboss')) {
      baseXp *= 1.5;
    }

    return Math.round(baseXp);
  }

  /**
   * Calculate gold drop range
   */
  calculateGoldDrop(enemy, context) {
    const { player, location } = context;
    const level = enemy.level;
    const type = enemy.type || 'default';
    const typeStats = this.typeStats[type] || this.typeStats.default;

    // Base gold calculation
    let baseGold = typeStats.baseGold * level;

    // Danger scaling
    const dangerLevel = location?.dangerLevel || 3;
    const dangerScaling = this.dangerScaling[dangerLevel] || this.dangerScaling[3];
    baseGold *= dangerScaling.gold;

    // Apply player luck modifier
    let luckBonus = 1;
    if (player) {
      const luck = this.getPlayerModifier(player, 'luck');
      luckBonus = 1 + (luck / 100);

      const goldFind = this.getPlayerModifier(player, 'goldFind');
      baseGold *= (1 + goldFind / 100);
    }

    // Calculate min/max range
    const min = Math.max(0, Math.round(baseGold * 0.5));
    const max = Math.round(baseGold * 1.5 * luckBonus);

    return { min, max };
  }

  /**
   * Get default loot table based on enemy type and tags
   */
  getDefaultLootTable(enemy) {
    const type = enemy.type || 'default';
    const tags = enemy.tags || [];

    // Check for specific tag-based loot tables first
    for (const tag of tags) {
      const tagTable = `${tag}_loot`;
      // In a real implementation, check if this table exists
      if (tag === 'wolf' || tag === 'bear' || tag === 'boar') {
        return `${tag}_loot`;
      }
    }

    // Fall back to type-based loot table
    return `${type}_loot`;
  }

  /**
   * Apply difficulty modifiers to enemy
   */
  applyDifficultyModifiers(enemy, difficulty) {
    const difficultyMods = {
      easy: { hp: 0.7, attack: 0.8, defense: 0.8, xp: 0.8, gold: 1.2 },
      normal: { hp: 1.0, attack: 1.0, defense: 1.0, xp: 1.0, gold: 1.0 },
      hard: { hp: 1.3, attack: 1.2, defense: 1.2, xp: 1.2, gold: 0.9 },
      nightmare: { hp: 1.6, attack: 1.4, defense: 1.4, xp: 1.5, gold: 0.8 }
    };

    const mods = difficultyMods[difficulty] || difficultyMods.normal;

    enemy.stats.maxHp = Math.round(enemy.stats.maxHp * mods.hp);
    enemy.stats.attack = Math.round(enemy.stats.attack * mods.attack);
    enemy.stats.defense = Math.round(enemy.stats.defense * mods.defense);
    enemy.experienceReward = Math.round(enemy.experienceReward * mods.xp);
    enemy.goldDrop.min = Math.round(enemy.goldDrop.min * mods.gold);
    enemy.goldDrop.max = Math.round(enemy.goldDrop.max * mods.gold);
  }

  /**
   * Get player modifier value (from stats, effects, equipment)
   */
  getPlayerModifier(player, modifierType) {
    let total = 0;

    // Base stat contribution
    switch (modifierType) {
      case 'luck':
        total += (player.stats?.luck || 0) * 2;
        break;
      case 'xpBoost':
        total += (player.stats?.intelligence || 0) * 1;
        break;
      case 'goldFind':
        total += (player.stats?.luck || 0) * 1.5;
        break;
    }

    // Effect bonuses
    if (player.activeEffects) {
      for (const effect of player.activeEffects) {
        if (effect.modifiers?.[modifierType]) {
          total += effect.modifiers[modifierType];
        }
      }
    }

    // Equipment bonuses
    if (player.equipment) {
      for (const item of Object.values(player.equipment)) {
        if (item?.bonuses?.[modifierType]) {
          total += item.bonuses[modifierType];
        }
      }
    }

    return total;
  }

  /**
   * Resolve multiple enemies at once
   */
  resolveEnemies(enemyDefs, context) {
    return enemyDefs.map(def => this.resolveEnemy(def, context));
  }

  /**
   * Create a scaled variant of an enemy
   * Useful for creating elite/boss versions
   */
  createVariant(enemyDef, variant, context) {
    const variants = {
      weak: { levelMod: -2, statMod: 0.7, rewardMod: 0.6 },
      normal: { levelMod: 0, statMod: 1.0, rewardMod: 1.0 },
      strong: { levelMod: 2, statMod: 1.3, rewardMod: 1.3 },
      elite: { levelMod: 3, statMod: 1.5, rewardMod: 1.8, prefix: 'Elite' },
      champion: { levelMod: 5, statMod: 1.8, rewardMod: 2.5, prefix: 'Champion' },
      boss: { levelMod: 8, statMod: 2.5, rewardMod: 4.0, prefix: 'Boss' }
    };

    const variantConfig = variants[variant] || variants.normal;

    // Create modified definition
    const variantDef = {
      ...enemyDef,
      id: `${enemyDef.id}_${variant}`,
      name: variantConfig.prefix ? `${variantConfig.prefix} ${enemyDef.name}` : enemyDef.name,
      levelModifier: (enemyDef.levelModifier || 0) + variantConfig.levelMod,
      _variant: variant,
      _statMultiplier: variantConfig.statMod,
      _rewardMultiplier: variantConfig.rewardMod
    };

    // Add variant tag
    variantDef.tags = [...(enemyDef.tags || []), variant];

    // Resolve with variant multipliers
    const resolved = this.resolveEnemy(variantDef, context);

    // Apply stat multiplier
    resolved.stats.maxHp = Math.round(resolved.stats.maxHp * variantConfig.statMod);
    resolved.stats.attack = Math.round(resolved.stats.attack * variantConfig.statMod);
    resolved.stats.defense = Math.round(resolved.stats.defense * variantConfig.statMod);
    resolved.experienceReward = Math.round(resolved.experienceReward * variantConfig.rewardMod);
    resolved.goldDrop.min = Math.round(resolved.goldDrop.min * variantConfig.rewardMod);
    resolved.goldDrop.max = Math.round(resolved.goldDrop.max * variantConfig.rewardMod);

    return resolved;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Quick helper to resolve a single enemy
 */
export function resolveEnemy(enemyDef, context, options = {}) {
  const system = new EnemyScalingSystem(options);
  return system.resolveEnemy(enemyDef, context);
}

/**
 * Quick helper to resolve multiple enemies
 */
export function resolveEnemies(enemyDefs, context, options = {}) {
  const system = new EnemyScalingSystem(options);
  return system.resolveEnemies(enemyDefs, context);
}

export default EnemyScalingSystem;
