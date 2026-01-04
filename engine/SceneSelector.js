/**
 * SceneSelector - Selects and triggers scenes based on combat outcomes, events, etc.
 *
 * Features:
 * - Random selection from scene pools
 * - Weighted selection based on conditions
 * - Tag-based scene filtering
 * - Player state-based selection modifiers
 * - Arousal-based scene selection (NSFW vs normal)
 * - User-whitelisted tag filtering
 */

export const OUTCOME_TYPES = {
  VICTORY: 'victory',
  DEFEAT: 'defeat',
  SURRENDER: 'surrender',
  FLED: 'fled'
};

// Scene content categories
export const SCENE_CATEGORIES = {
  NORMAL: 'normal',
  NSFW: 'nsfw',
  AROUSED: 'aroused'
};

/**
 * Scene selection system
 */
export class SceneSelector {
  constructor(registry, options = {}) {
    this.registry = registry;
    this.callbacks = options.callbacks || {};

    // Default enabled tags (safe content only)
    this.enabledTags = options.enabledTags || ['vanilla'];
  }

  /**
   * Set enabled content tags for scene filtering
   * @param {string[]} tags - Array of enabled content tags
   */
  setEnabledTags(tags) {
    this.enabledTags = tags || ['vanilla'];
  }

  /**
   * Select a scene from an enemy's scene pool based on combat outcome
   * @param {Object} enemy - The enemy definition (with sceneConfig)
   * @param {string} outcome - Combat outcome type (victory, defeat, surrender, fled)
   * @param {Object} playerState - Current player state for condition evaluation
   * @returns {string|null} Selected scene ID or null
   */
  selectCombatScene(enemy, outcome, playerState = {}) {
    const sceneConfig = enemy.sceneConfig?.[outcome];

    if (!sceneConfig) {
      return null;
    }

    // Check if scene should trigger (based on chance)
    if (sceneConfig.chance !== undefined && sceneConfig.chance < 1.0) {
      if (Math.random() > sceneConfig.chance) {
        return null;
      }
    }

    // First, try weighted pools with conditions
    if (sceneConfig.weightedPools?.length > 0) {
      const selectedWeighted = this.selectFromWeightedPool(sceneConfig.weightedPools, playerState);
      if (selectedWeighted) {
        return selectedWeighted;
      }
    }

    // Fall back to random pool selection
    if (sceneConfig.pool?.length > 0) {
      return this.selectRandomFromPool(sceneConfig.pool);
    }

    // Single scene fallback
    if (sceneConfig.scene) {
      return sceneConfig.scene;
    }

    return null;
  }

  /**
   * Select randomly from a pool of scene IDs
   * @param {string[]} pool - Array of scene IDs
   * @returns {string} Randomly selected scene ID
   */
  selectRandomFromPool(pool) {
    if (!pool || pool.length === 0) return null;
    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
  }

  /**
   * Select from weighted pool based on conditions
   * @param {Object[]} weightedPool - Array of {scene, weight, conditions}
   * @param {Object} playerState - Player state for condition evaluation
   * @returns {string|null} Selected scene ID or null
   */
  selectFromWeightedPool(weightedPool, playerState) {
    // Filter to entries whose conditions pass
    const validEntries = weightedPool.filter(entry =>
      this.evaluateConditions(entry.conditions, playerState)
    );

    if (validEntries.length === 0) {
      return null;
    }

    // Calculate total weight
    const totalWeight = validEntries.reduce((sum, entry) => sum + (entry.weight || 1), 0);

    // Random weighted selection
    let roll = Math.random() * totalWeight;

    for (const entry of validEntries) {
      roll -= entry.weight || 1;
      if (roll <= 0) {
        return entry.scene;
      }
    }

    // Fallback to last entry
    return validEntries[validEntries.length - 1].scene;
  }

  /**
   * Evaluate conditions against player state
   * @param {Object} conditions - Condition object
   * @param {Object} playerState - Player state
   * @returns {boolean} Whether conditions pass
   */
  evaluateConditions(conditions, playerState) {
    if (!conditions) return true;

    for (const [key, requirement] of Object.entries(conditions)) {
      const value = this.getNestedValue(playerState, key);

      if (typeof requirement === 'object') {
        // Comparison operators
        if (requirement.lt !== undefined && !(value < requirement.lt)) return false;
        if (requirement.lte !== undefined && !(value <= requirement.lte)) return false;
        if (requirement.gt !== undefined && !(value > requirement.gt)) return false;
        if (requirement.gte !== undefined && !(value >= requirement.gte)) return false;
        if (requirement.eq !== undefined && value !== requirement.eq) return false;
        if (requirement.ne !== undefined && value === requirement.ne) return false;
        if (requirement.in !== undefined && !requirement.in.includes(value)) return false;
        if (requirement.notIn !== undefined && requirement.notIn.includes(value)) return false;
        if (requirement.has !== undefined) {
          // For arrays/sets - check if contains value
          if (!Array.isArray(value) || !value.includes(requirement.has)) return false;
        }
      } else {
        // Direct equality check
        if (value !== requirement) return false;
      }
    }

    return true;
  }

  /**
   * Get nested value from object using dot notation
   * @param {Object} obj - Object to search
   * @param {string} path - Dot-separated path (e.g., "stats.corruption")
   * @returns {*} Value at path or undefined
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Select scene based on tags matching
   * Useful for events, exploration, etc.
   * @param {string[]} contextTags - Tags from current context
   * @param {Object[]} sceneList - Array of scene definitions with tags
   * @param {Object} playerState - Player state for condition evaluation
   * @returns {string|null} Selected scene ID
   */
  selectByTags(contextTags, sceneList, playerState = {}) {
    // Score scenes by tag match count
    const scored = sceneList
      .filter(scene => this.evaluateConditions(scene.conditions, playerState))
      .map(scene => {
        const matchedTags = (scene.tags || []).filter(tag => contextTags.includes(tag));
        return {
          scene: scene.id,
          score: matchedTags.length,
          weight: scene.weight || 1
        };
      })
      .filter(s => s.score > 0);

    if (scored.length === 0) return null;

    // Get max score
    const maxScore = Math.max(...scored.map(s => s.score));

    // Filter to highest scoring scenes
    const topScenes = scored.filter(s => s.score === maxScore);

    // Weighted random from top scenes
    const totalWeight = topScenes.reduce((sum, s) => sum + s.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const entry of topScenes) {
      roll -= entry.weight;
      if (roll <= 0) {
        return entry.scene;
      }
    }

    return topScenes[topScenes.length - 1].scene;
  }

  /**
   * Select scene for multiple enemies (group encounters)
   * Prioritizes by enemy tier/importance
   * @param {Object[]} enemies - Array of enemy definitions
   * @param {string} outcome - Combat outcome
   * @param {Object} playerState - Player state
   * @returns {string|null} Selected scene ID
   */
  selectGroupCombatScene(enemies, outcome, playerState = {}) {
    // Sort by tier (highest first), then by level
    const sortedEnemies = [...enemies].sort((a, b) => {
      const tierDiff = (b.tier || 1) - (a.tier || 1);
      if (tierDiff !== 0) return tierDiff;
      return (b.level || 1) - (a.level || 1);
    });

    // Try to find a scene from each enemy in priority order
    for (const enemy of sortedEnemies) {
      const scene = this.selectCombatScene(enemy, outcome, playerState);
      if (scene) {
        return scene;
      }
    }

    return null;
  }

  /**
   * Create scene variants from a base scene pattern
   * Example: "bandit_loss_" with count 3 creates ["bandit_loss_1", "bandit_loss_2", "bandit_loss_3"]
   * @param {string} basePattern - Scene ID pattern (without number)
   * @param {number} count - Number of variants
   * @returns {string[]} Array of scene IDs
   */
  static createVariantPool(basePattern, count) {
    return Array.from({ length: count }, (_, i) => `${basePattern}${i + 1}`);
  }

  /**
   * Get a fallback scene based on enemy type
   * @param {Object} enemy - Enemy definition
   * @param {string} outcome - Combat outcome
   * @returns {string|null} Generic fallback scene ID
   */
  getFallbackScene(enemy, outcome) {
    const type = enemy.type || 'humanoid';
    const tags = enemy.tags || [];

    // Check for NSFW tags
    const isNsfw = tags.some(t => ['nsfw', 'seduction', 'tentacle'].includes(t));

    const fallbackMap = {
      defeat: {
        humanoid: isNsfw ? 'generic_humanoid_loss_nsfw' : 'generic_humanoid_loss',
        beast: isNsfw ? 'generic_beast_loss_nsfw' : 'generic_beast_loss',
        demon: 'generic_demon_loss',
        plant: 'generic_plant_loss',
        ooze: 'generic_slime_loss'
      },
      surrender: {
        humanoid: isNsfw ? 'generic_humanoid_surrender_nsfw' : 'generic_humanoid_surrender',
        beast: 'generic_beast_surrender',
        demon: 'generic_demon_surrender',
        default: 'generic_surrender'
      },
      victory: {
        default: null // Usually no scene on victory
      }
    };

    return fallbackMap[outcome]?.[type] || fallbackMap[outcome]?.default || null;
  }

  /**
   * Select scene based on enemy arousal state
   * If enemy is aroused, prefer NSFW scenes (if enabled), else normal scenes
   * @param {Object} enemy - Enemy definition with sceneConfig
   * @param {string} outcome - Combat outcome (defeat, surrender)
   * @param {Object} playerState - Player state
   * @param {boolean} isEnemyAroused - Whether the enemy is aroused
   * @returns {string|null} Selected scene ID
   */
  selectArousalBasedScene(enemy, outcome, playerState, isEnemyAroused) {
    const sceneConfig = enemy.sceneConfig?.[outcome];
    if (!sceneConfig) return null;

    // Check arousal-specific pools first
    if (isEnemyAroused && sceneConfig.arousedPools) {
      const validPools = this.filterByEnabledTags(sceneConfig.arousedPools);
      if (validPools.length > 0) {
        const selected = this.selectFromWeightedPool(validPools, playerState);
        if (selected) return selected;
      }
    }

    // Fall back to regular pool selection
    return this.selectCombatScene(enemy, outcome, playerState);
  }

  /**
   * Filter scene pools by user-enabled content tags
   * @param {Object[]} pools - Array of {scene, weight, tags, conditions}
   * @returns {Object[]} Filtered pools where tags match enabled tags
   */
  filterByEnabledTags(pools) {
    return pools.filter(pool => {
      if (!pool.tags || pool.tags.length === 0) return true;
      return pool.tags.some(tag => this.enabledTags.includes(tag));
    });
  }

  /**
   * Select surrender scene based on arousal and enabled tags
   * @param {Object} enemy - Enemy definition
   * @param {Object} playerState - Player state
   * @param {boolean} isAroused - Whether enemy is aroused
   * @param {string[]} enabledTags - User-enabled content tags
   * @returns {Object} Scene selection result with scene ID and category
   */
  selectSurrenderScene(enemy, playerState, isAroused, enabledTags = null) {
    const tags = enabledTags || this.enabledTags;
    const sceneConfig = enemy.sceneConfig?.surrender;

    if (!sceneConfig) {
      return {
        scene: this.getFallbackScene(enemy, 'surrender'),
        category: SCENE_CATEGORIES.NORMAL
      };
    }

    // If aroused, try aroused/nsfw pools first
    if (isAroused) {
      if (sceneConfig.arousedPools) {
        const validPools = sceneConfig.arousedPools.filter(pool => {
          if (!pool.tags) return true;
          return pool.tags.some(t => tags.includes(t));
        });

        if (validPools.length > 0) {
          const scene = this.selectFromWeightedPool(validPools, playerState);
          if (scene) return { scene, category: SCENE_CATEGORIES.AROUSED };
        }
      }

      if (sceneConfig.nsfwPools) {
        const validPools = sceneConfig.nsfwPools.filter(pool => {
          if (!pool.tags) return tags.includes('vanilla');
          return pool.tags.some(t => tags.includes(t));
        });

        if (validPools.length > 0) {
          const scene = this.selectFromWeightedPool(validPools, playerState);
          if (scene) return { scene, category: SCENE_CATEGORIES.NSFW };
        }
      }
    }

    // Fall back to normal pools
    const scene = this.selectCombatScene(enemy, 'surrender', playerState);
    return {
      scene: scene || this.getFallbackScene(enemy, 'surrender'),
      category: SCENE_CATEGORIES.NORMAL
    };
  }

  /**
   * Select defeat scene based on arousal and enabled tags
   * @param {Object} enemy - Enemy definition
   * @param {Object} playerState - Player state
   * @param {boolean} isAroused - Whether enemy is aroused
   * @param {string[]} enabledTags - User-enabled content tags
   * @returns {Object} Scene selection result with scene ID and category
   */
  selectDefeatScene(enemy, playerState, isAroused, enabledTags = null) {
    const tags = enabledTags || this.enabledTags;
    const sceneConfig = enemy.sceneConfig?.defeat;

    if (!sceneConfig) {
      return {
        scene: this.getFallbackScene(enemy, 'defeat'),
        category: SCENE_CATEGORIES.NORMAL
      };
    }

    if (isAroused && sceneConfig.arousedPools) {
      const validPools = sceneConfig.arousedPools.filter(pool => {
        if (!pool.tags) return true;
        return pool.tags.some(t => tags.includes(t));
      });

      if (validPools.length > 0) {
        const scene = this.selectFromWeightedPool(validPools, playerState);
        if (scene) return { scene, category: SCENE_CATEGORIES.AROUSED };
      }
    }

    const scene = this.selectCombatScene(enemy, 'defeat', playerState);
    return {
      scene: scene || this.getFallbackScene(enemy, 'defeat'),
      category: SCENE_CATEGORIES.NORMAL
    };
  }
}

export default SceneSelector;
