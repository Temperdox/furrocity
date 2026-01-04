/**
 * CombatOutcomeHandler - Processes combat results and triggers appropriate scenes
 *
 * Handles:
 * - Scene selection based on combat outcome
 * - Loot generation for victories
 * - State changes (corruption, stats, flags)
 * - Transition to scene system
 */

import { SceneSelector, OUTCOME_TYPES } from './SceneSelector.js';

export class CombatOutcomeHandler {
  constructor(registry, options = {}) {
    this.registry = registry;
    this.sceneSelector = new SceneSelector(registry, options);
    this.lootTableSystem = options.lootTableSystem;
    this.callbacks = options.callbacks || {};
  }

  /**
   * Process the end of combat and determine next steps
   * @param {Object} combatResult - Result from CombatSystem.getCombatResult()
   * @param {Object} playerState - Current player state
   * @param {Object} context - Additional context (location, time, etc.)
   * @returns {Object} Outcome result with scene, loot, state changes
   */
  async processOutcome(combatResult, playerState, context = {}) {
    const outcome = this.mapPhaseToOutcome(combatResult.phase);
    const enemies = combatResult.defeatedEnemies || [];

    // Get all enemies that participated (for scene selection)
    const allEnemies = context.enemies || enemies;

    const result = {
      outcome,
      scene: null,
      loot: [],
      stateChanges: {},
      experience: 0,
      flags: []
    };

    switch (outcome) {
      case OUTCOME_TYPES.VICTORY:
        await this.handleVictory(result, combatResult, playerState, allEnemies, context);
        break;

      case OUTCOME_TYPES.DEFEAT:
        await this.handleDefeat(result, combatResult, playerState, allEnemies, context);
        break;

      case OUTCOME_TYPES.SURRENDER:
        await this.handleSurrender(result, combatResult, playerState, allEnemies, context);
        break;

      case OUTCOME_TYPES.FLED:
        await this.handleFled(result, combatResult, playerState, allEnemies, context);
        break;
    }

    return result;
  }

  /**
   * Map combat phase to outcome type
   */
  mapPhaseToOutcome(phase) {
    const mapping = {
      victory: OUTCOME_TYPES.VICTORY,
      defeat: OUTCOME_TYPES.DEFEAT,
      surrendered: OUTCOME_TYPES.SURRENDER,
      fled: OUTCOME_TYPES.FLED
    };
    return mapping[phase] || OUTCOME_TYPES.DEFEAT;
  }

  /**
   * Handle victory outcome
   */
  async handleVictory(result, combatResult, playerState, enemies, context) {
    // Generate loot from defeated enemies
    for (const enemy of combatResult.defeatedEnemies || []) {
      const enemyLoot = await this.generateEnemyLoot(enemy, playerState);
      result.loot.push(...enemyLoot);
      result.experience += enemy.experience || 0;
    }

    // Merge duplicate items
    result.loot = this.mergeLoot(result.loot);

    // Select victory scene (optional - many victories might not have scenes)
    result.scene = await this.selectScene(enemies, OUTCOME_TYPES.VICTORY, playerState, context);

    // Victory state changes
    result.stateChanges = {
      combat: 'victory',
      enemiesDefeated: combatResult.defeatedEnemies?.map(e => e.id) || []
    };
  }

  /**
   * Handle defeat outcome
   */
  async handleDefeat(result, combatResult, playerState, enemies, context) {
    // Select defeat scene
    result.scene = await this.selectScene(enemies, OUTCOME_TYPES.DEFEAT, playerState, context);

    // Defeat state changes
    result.stateChanges = {
      combat: 'defeat',
      // Possible gold loss, item loss, etc.
      goldLost: Math.floor((playerState.gold || 0) * 0.1), // 10% gold loss
      corruptionGain: this.calculateDefeatCorruption(enemies)
    };

    // Apply corruption gain if configured
    if (result.stateChanges.corruptionGain > 0 && this.callbacks.modifyCorruption) {
      await this.callbacks.modifyCorruption(result.stateChanges.corruptionGain);
    }
  }

  /**
   * Handle surrender outcome
   */
  async handleSurrender(result, combatResult, playerState, enemies, context) {
    // Select surrender scene - surrender always triggers a scene
    result.scene = await this.selectScene(enemies, OUTCOME_TYPES.SURRENDER, playerState, context);

    // Surrender typically has higher consequences
    result.stateChanges = {
      combat: 'surrender',
      goldLost: Math.floor((playerState.gold || 0) * 0.25), // 25% gold loss on surrender
      corruptionGain: this.calculateSurrenderCorruption(enemies)
    };

    // Set flags for surrender consequences
    const dominantEnemy = this.getDominantEnemy(enemies);
    if (dominantEnemy) {
      result.flags.push(`surrendered_to_${dominantEnemy.type || 'unknown'}`);

      if (dominantEnemy.tags?.includes('nsfw')) {
        result.flags.push('surrendered_nsfw');
      }
    }

    // Apply corruption
    if (result.stateChanges.corruptionGain > 0 && this.callbacks.modifyCorruption) {
      await this.callbacks.modifyCorruption(result.stateChanges.corruptionGain);
    }
  }

  /**
   * Handle fled outcome
   */
  async handleFled(result, combatResult, playerState, enemies, context) {
    // Fleeing typically doesn't trigger scenes, but might in some cases
    result.scene = await this.selectScene(enemies, OUTCOME_TYPES.FLED, playerState, context);

    result.stateChanges = {
      combat: 'fled'
    };

    // Small chance of consequences when fleeing
    if (Math.random() < 0.2) {
      result.flags.push('narrow_escape');
    }
  }

  /**
   * Select a scene based on enemies and outcome
   */
  async selectScene(enemies, outcome, playerState, context) {
    if (!enemies || enemies.length === 0) return null;

    // For group encounters, use group selection
    if (enemies.length > 1) {
      const scene = this.sceneSelector.selectGroupCombatScene(enemies, outcome, playerState);
      if (scene) return scene;
    } else {
      const scene = this.sceneSelector.selectCombatScene(enemies[0], outcome, playerState);
      if (scene) return scene;
    }

    // Try fallback scene based on enemy type
    const dominantEnemy = this.getDominantEnemy(enemies);
    if (dominantEnemy) {
      return this.sceneSelector.getFallbackScene(dominantEnemy, outcome);
    }

    return null;
  }

  /**
   * Generate loot from a defeated enemy
   */
  async generateEnemyLoot(enemy, playerState) {
    const loot = [];

    // If using loot table system with tags
    if (this.lootTableSystem && enemy.lootTags) {
      const tableLoot = await this.lootTableSystem.generateLoot(
        enemy.lootTags,
        playerState,
        { source: enemy }
      );
      loot.push(...tableLoot);
    }

    // Legacy loot array on enemy
    if (enemy.loot) {
      for (const lootEntry of enemy.loot) {
        // Roll for chance
        if (lootEntry.chance && Math.random() > lootEntry.chance) {
          continue;
        }

        // Calculate quantity
        let count = 1;
        if (lootEntry.min !== undefined && lootEntry.max !== undefined) {
          count = Math.floor(Math.random() * (lootEntry.max - lootEntry.min + 1)) + lootEntry.min;
        } else if (lootEntry.count) {
          if (typeof lootEntry.count === 'object') {
            count = Math.floor(Math.random() * (lootEntry.count.max - lootEntry.count.min + 1)) + lootEntry.count.min;
          } else {
            count = lootEntry.count;
          }
        }

        if (count > 0) {
          loot.push({
            itemId: lootEntry.itemId,
            count,
            rarity: lootEntry.rarity
          });
        }
      }
    }

    return loot;
  }

  /**
   * Merge duplicate items in loot array
   */
  mergeLoot(loot) {
    const merged = new Map();

    for (const item of loot) {
      const key = `${item.itemId}_${item.rarity || 'common'}`;
      if (merged.has(key)) {
        merged.get(key).count += item.count;
      } else {
        merged.set(key, { ...item });
      }
    }

    return Array.from(merged.values());
  }

  /**
   * Calculate corruption gain from defeat
   */
  calculateDefeatCorruption(enemies) {
    let total = 0;

    for (const enemy of enemies) {
      // Base corruption from tier
      const tierCorruption = (enemy.tier || 1) * 2;

      // Extra for NSFW enemies
      const nsfwBonus = enemy.tags?.includes('nsfw') ? 5 : 0;

      // Extra for specific types
      const typeBonus = {
        demon: 5,
        succubus: 8,
        corruption: 10
      }[enemy.type] || 0;

      total += tierCorruption + nsfwBonus + typeBonus;
    }

    return total;
  }

  /**
   * Calculate corruption gain from surrender
   */
  calculateSurrenderCorruption(enemies) {
    // Surrender has higher base corruption
    return Math.floor(this.calculateDefeatCorruption(enemies) * 1.5);
  }

  /**
   * Get the dominant enemy (for scene selection priority)
   */
  getDominantEnemy(enemies) {
    if (!enemies || enemies.length === 0) return null;

    return enemies.reduce((dominant, current) => {
      const currentScore = (current.tier || 1) * 100 + (current.level || 1);
      const dominantScore = (dominant.tier || 1) * 100 + (dominant.level || 1);
      return currentScore > dominantScore ? current : dominant;
    }, enemies[0]);
  }
}

export default CombatOutcomeHandler;
