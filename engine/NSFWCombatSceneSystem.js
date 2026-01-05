/**
 * NSFWCombatSceneSystem - Orchestrates NSFW combat actions and scene templates
 *
 * Features:
 * - Execute NSFW actions with dynamic text generation
 * - Template selection based on enemy type and action
 * - Equipment interaction processing (strip, toy activation, drugs, cursed items)
 * - Effect calculation (arousal, corruption, clothing damage)
 * - Sensitivity-based scaling
 *
 * @module engine/NSFWCombatSceneSystem
 */

/**
 * Default NSFW action chance when player is restrained
 */
export const DEFAULT_NSFW_ACTION_CHANCE = 0.6;

/**
 * System for orchestrating NSFW combat scenes
 */
export class NSFWCombatSceneSystem {
  /**
   * @param {Object} options - Configuration options
   * @param {Object} options.interpolator - NSFWTextInterpolator instance
   * @param {Object} options.sceneTemplates - Scene template data
   * @param {Object} options.equipmentInteractions - Equipment interaction data
   * @param {Object} options.registry - DataRegistry instance
   * @param {Object} options.callbacks - Callback functions
   */
  constructor(options = {}) {
    this.interpolator = options.interpolator;
    this.sceneTemplates = options.sceneTemplates || {};
    this.equipmentInteractions = options.equipmentInteractions || {};
    this.registry = options.registry;
    this.callbacks = options.callbacks || {};

    // Sensitivity multipliers for body parts
    this.sensitivityMultipliers = {
      default: 1.0,
      sensitive: 1.5,
      hypersensitive: 2.0
    };
  }

  /**
   * Initialize with data
   * @param {Object} sceneTemplates - Scene template definitions
   * @param {Object} equipmentInteractions - Equipment interaction definitions
   */
  initialize(sceneTemplates, equipmentInteractions) {
    this.sceneTemplates = sceneTemplates;
    this.equipmentInteractions = equipmentInteractions;
  }

  /**
   * Execute an NSFW action in combat
   * @param {string} actionId - The action to execute (e.g., 'grope', 'strip', 'fondle')
   * @param {Object} enemy - The enemy performing the action
   * @param {Object} player - The player receiving the action
   * @param {Object} combatState - Current combat state
   * @returns {Object|null} Result of the action, or null if action cannot be performed
   */
  executeNSFWAction(actionId, enemy, player, combatState) {
    // Get action data from enemy
    const actionData = enemy.nsfwActionData?.[actionId];
    if (!actionData) {
      console.warn(`NSFW action '${actionId}' not found for enemy ${enemy.id}`);
      return null;
    }

    // Check tag requirements
    if (actionData.requiresTags) {
      const enabledTags = combatState?.enabledTags || [];
      const hasRequired = actionData.requiresTags.some(tag => enabledTags.includes(tag));
      if (!hasRequired) {
        return null;
      }
    }

    // Select and process template
    const template = this.selectTemplate(actionId, enemy, player, combatState);
    const context = this.buildContext(player, enemy, combatState);
    const processedText = this.interpolator?.interpolate(template, context) || template;

    // Calculate effects
    const effects = this.calculateEffects(actionData, player, combatState);

    // Process equipment interactions
    const equipmentResult = this.processEquipmentInteraction(actionId, enemy, player, combatState);

    // Merge equipment results into effects
    if (equipmentResult.activatedToys.length > 0) {
      for (const toy of equipmentResult.activatedToys) {
        effects.arousalGain += toy.bonusArousal || 0;
      }
    }

    return {
      actionId,
      text: processedText,
      effects,
      equipmentResult,
      triggerScene: actionData.triggerScene,
      actionData
    };
  }

  /**
   * Build interpolation context
   * @param {Object} player - Player state
   * @param {Object} enemy - Enemy data
   * @param {Object} combatState - Combat state
   * @returns {Object} Context for interpolation
   */
  buildContext(player, enemy, combatState) {
    return {
      player,
      enemy,
      enemies: combatState?.enemies || [enemy],
      equipment: player?.equipment || {},
      combatState: {
        ...combatState,
        isRestrained: player?.isRestrained,
        isGrappled: player?.isGrappled
      }
    };
  }

  /**
   * Select the appropriate template for an action
   * @param {string} actionId - Action identifier
   * @param {Object} enemy - Enemy data
   * @param {Object} player - Player state
   * @param {Object} combatState - Combat state
   * @returns {string} Selected template text
   */
  selectTemplate(actionId, enemy, player, combatState) {
    const enemyType = enemy.type || 'humanoid';
    const equipment = player?.equipment || {};

    // Build list of template keys to try, in priority order
    const templateKeys = [];

    // 1. Check for equipment-specific templates
    if (equipment.plug && actionId.includes('probe')) {
      templateKeys.push(`${enemyType}_${actionId}_with_plug`);
      templateKeys.push(`${actionId}_with_plug`);
    }
    if ((equipment.nipple_left || equipment.nipple_right) && actionId.includes('grope')) {
      templateKeys.push(`${enemyType}_${actionId}_with_piercing`);
      templateKeys.push(`${actionId}_with_piercing`);
    }

    // 2. Enemy type + action
    templateKeys.push(`${enemyType}_${actionId}`);

    // 3. Just action
    templateKeys.push(actionId);

    // 4. Generic fallback
    templateKeys.push('generic_action');

    // Try each template key
    for (const key of templateKeys) {
      // Check numbered variants (e.g., humanoid_grope_0, humanoid_grope_1)
      for (let i = 0; i < 10; i++) {
        const numberedKey = `${key}_${i}`;
        if (this.sceneTemplates[numberedKey]) {
          const templates = this.sceneTemplates[numberedKey];
          return this.selectFromPool(templates);
        }
      }

      // Check non-numbered version
      if (this.sceneTemplates[key]) {
        const templates = this.sceneTemplates[key];
        return this.selectFromPool(templates);
      }
    }

    // Ultimate fallback
    return `{enemy_name} performs ${actionId} on {player_name}.`;
  }

  /**
   * Calculate effects from an NSFW action
   * @param {Object} actionData - Action data from enemy
   * @param {Object} player - Player state
   * @param {Object} combatState - Combat state
   * @returns {Object} Calculated effects
   */
  calculateEffects(actionData, player, combatState) {
    const effects = {
      arousalGain: 0,
      corruptionGain: 0,
      lustGain: 0,
      shameGain: 0,
      damage: 0,
      clothingDamage: null,
      appliedEffects: [],
      statChanges: {}
    };

    // Base arousal effect with sensitivity scaling
    if (actionData.arousalEffect || actionData.arousalDamage) {
      const baseArousal = actionData.arousalEffect || actionData.arousalDamage || 0;
      const bodyPart = actionData.targetBodyPart || actionData.targetAreas?.[0] || 'general';
      const sensitivityMultiplier = this.getSensitivityMultiplier(player, bodyPart);
      effects.arousalGain = Math.floor(baseArousal * sensitivityMultiplier);
    }

    // Corruption gain
    if (actionData.corruptionGain) {
      effects.corruptionGain = actionData.corruptionGain;
    }

    // Lust gain
    if (actionData.lustGain) {
      effects.lustGain = actionData.lustGain;
    }

    // Shame gain
    if (actionData.shameGain) {
      effects.shameGain = actionData.shameGain;
    }

    // Direct damage
    if (actionData.damage) {
      effects.damage = actionData.damage;
    }

    // Clothing damage
    if (actionData.damageClothing) {
      effects.clothingDamage = actionData.damageClothing;
    }

    // Applied status effects
    if (actionData.applyEffect) {
      effects.appliedEffects.push({
        effectId: actionData.applyEffect,
        stacks: actionData.stacks || 1,
        duration: actionData.effectDuration
      });
    }
    if (actionData.applyEffects) {
      for (const effect of actionData.applyEffects) {
        effects.appliedEffects.push({
          effectId: effect.id || effect,
          stacks: effect.stacks || 1,
          duration: effect.duration
        });
      }
    }

    // Stat changes
    if (actionData.statChanges) {
      effects.statChanges = { ...actionData.statChanges };
    }

    return effects;
  }

  /**
   * Get sensitivity multiplier for a body part
   * @param {Object} player - Player state
   * @param {string} bodyPart - Body part identifier
   * @returns {number} Sensitivity multiplier
   */
  getSensitivityMultiplier(player, bodyPart) {
    const sensitiveAreas = player?.nsfwStats?.sensitiveAreas || [];
    const hypersensitiveAreas = player?.nsfwStats?.hypersensitiveAreas || [];

    // Map action body parts to player sensitive area IDs
    const bodyPartMap = {
      chest: ['chest', 'breasts', 'nipples'],
      nipples: ['chest', 'nipples'],
      ass: ['rear', 'butt', 'ass'],
      rear: ['rear', 'butt', 'ass'],
      genitals: ['genitals', 'groin'],
      dick: ['genitals', 'dick', 'penis'],
      pussy: ['genitals', 'pussy', 'vagina'],
      balls: ['genitals', 'balls', 'testicles'],
      mouth: ['mouth', 'lips'],
      ears: ['ears'],
      neck: ['neck'],
      thighs: ['thighs', 'legs']
    };

    const mappedParts = bodyPartMap[bodyPart] || [bodyPart];

    // Check for hypersensitivity first (highest multiplier)
    if (mappedParts.some(part => hypersensitiveAreas.includes(part))) {
      return this.sensitivityMultipliers.hypersensitive;
    }

    // Check for sensitivity
    if (mappedParts.some(part => sensitiveAreas.includes(part))) {
      return this.sensitivityMultipliers.sensitive;
    }

    return this.sensitivityMultipliers.default;
  }

  /**
   * Process equipment interactions for an action
   * @param {string} actionId - Action identifier
   * @param {Object} enemy - Enemy data
   * @param {Object} player - Player state
   * @param {Object} combatState - Combat state
   * @returns {Object} Equipment interaction results
   */
  processEquipmentInteraction(actionId, enemy, player, combatState) {
    const result = {
      strippedItems: [],
      activatedToys: [],
      appliedDrugs: [],
      equippedCursedItems: [],
      messages: []
    };

    const interaction = this.equipmentInteractions?.actions?.[actionId];
    if (!interaction) return result;

    const equipment = player?.equipment || {};

    // Process strip chances
    if (interaction.stripChance) {
      for (const [slot, chance] of Object.entries(interaction.stripChance)) {
        if (Math.random() < chance) {
          const equipped = player?.clothingState?.[slot]?.equipped || equipment[slot];
          if (equipped) {
            result.strippedItems.push({ slot, item: equipped });
            result.messages.push(`Your ${equipped.name || slot} is torn away!`);
          }
        }
      }
    }

    // Process toy activation
    if (interaction.targetToys) {
      for (const slot of interaction.targetToys) {
        const toy = equipment[slot];
        if (toy && (toy.isToy || toy.isPiercing)) {
          const activation = interaction.toyActivation?.[toy.type] || { arousalBonus: 3 };
          result.activatedToys.push({
            slot,
            toy,
            effect: 'stimulated',
            bonusArousal: activation.arousalBonus || 3
          });
        }
      }
    }

    // Process pressing on plugs/toys
    if (interaction.pressOnToy && equipment.plug) {
      const toyType = equipment.plug.type || 'plug';
      const activation = interaction.toyActivation?.[toyType] || { arousalBonus: 5 };
      result.activatedToys.push({
        slot: 'plug',
        toy: equipment.plug,
        effect: 'pressed',
        bonusArousal: activation.arousalBonus || 5
      });
      result.messages.push(activation.description ||
        `The ${equipment.plug.name || 'plug'} shifts inside you!`);
    }

    // Process drug application
    if (interaction.drugChance && Math.random() < interaction.drugChance.chance) {
      const drugData = this.equipmentInteractions?.drugEffects?.[interaction.drugChance.substanceId];
      result.appliedDrugs.push({
        substanceId: interaction.drugChance.substanceId,
        amount: interaction.drugChance.amount || 1,
        effects: drugData || {}
      });
      if (drugData?.description) {
        result.messages.push(drugData.description);
      }
    }

    // Process cursed item equipping
    if (interaction.cursedItemChance && Math.random() < interaction.cursedItemChance.chance) {
      const itemPool = interaction.cursedItemChance.items || [];
      if (itemPool.length > 0) {
        const itemDef = itemPool[Math.floor(Math.random() * itemPool.length)];
        const itemData = this.equipmentInteractions?.cursedItems?.[itemDef.id || itemDef];
        if (itemData) {
          result.equippedCursedItems.push({
            ...itemData,
            id: itemDef.id || itemDef
          });
          if (itemData.description) {
            result.messages.push(itemData.description);
          }
        }
      }
    }

    // Process piercing bonus
    if (interaction.piercingBonus) {
      const piercingSlots = interaction.targetPiercings || [];
      for (const slot of piercingSlots) {
        if (equipment[slot]?.isPiercing) {
          // Apply piercing arousal multiplier to activated toys
          for (const toy of result.activatedToys) {
            toy.bonusArousal = Math.floor(
              (toy.bonusArousal || 0) * (interaction.piercingBonus.arousalMultiplier || 1.3)
            );
          }
        }
      }
    }

    return result;
  }

  /**
   * Select a random NSFW action for an enemy
   * @param {Object} enemy - Enemy data
   * @param {Object} player - Player state
   * @param {Object} combatState - Combat state
   * @returns {string|null} Selected action ID
   */
  selectNSFWAction(enemy, player, combatState) {
    const availableActions = enemy.nsfwActions || [];
    if (availableActions.length === 0) return null;

    // Filter by enabled tags
    const enabledTags = combatState?.enabledTags || [];
    const validActions = availableActions.filter(actionId => {
      const actionData = enemy.nsfwActionData?.[actionId];
      if (!actionData?.requiresTags) return true;
      return actionData.requiresTags.some(tag => enabledTags.includes(tag));
    });

    if (validActions.length === 0) return null;

    // Weight by player state (could be expanded)
    // For now, random selection
    return validActions[Math.floor(Math.random() * validActions.length)];
  }

  /**
   * Check if enemy should perform NSFW action this turn
   * @param {Object} enemy - Enemy data
   * @param {Object} player - Player state
   * @param {Object} combatState - Combat state
   * @returns {boolean} Whether to perform NSFW action
   */
  shouldPerformNSFWAction(enemy, player, combatState) {
    // Only when player is restrained
    if (!player?.isRestrained && !combatState?.isRestrained) {
      return false;
    }

    // Check if enemy has NSFW actions
    if (!enemy.nsfwActions || enemy.nsfwActions.length === 0) {
      return false;
    }

    // Base chance (default 60%)
    const baseChance = enemy.nsfwActionChance ?? DEFAULT_NSFW_ACTION_CHANCE;

    // Modify by enemy arousal (if tracked)
    const enemyArousal = enemy.arousalLevel || 0;
    const arousalBonus = enemyArousal / 200; // Max +50% at 100 arousal

    // Modify by player exposure
    let exposureBonus = 0;
    if (player?.clothingState?.chest?.exposed) exposureBonus += 0.1;
    if (player?.clothingState?.legs?.exposed) exposureBonus += 0.1;

    const finalChance = Math.min(0.95, baseChance + arousalBonus + exposureBonus);

    return Math.random() < finalChance;
  }

  /**
   * Get available NSFW actions for an enemy
   * @param {Object} enemy - Enemy data
   * @param {Object} combatState - Combat state
   * @returns {string[]} List of available action IDs
   */
  getAvailableActions(enemy, combatState) {
    const availableActions = enemy.nsfwActions || [];
    const enabledTags = combatState?.enabledTags || [];

    return availableActions.filter(actionId => {
      const actionData = enemy.nsfwActionData?.[actionId];
      if (!actionData?.requiresTags) return true;
      return actionData.requiresTags.some(tag => enabledTags.includes(tag));
    });
  }

  /**
   * Apply NSFW effects to player state
   * @param {Object} player - Player state
   * @param {Object} effects - Effects from executeNSFWAction
   * @returns {Object} Updated player state
   */
  applyEffects(player, effects) {
    const updated = { ...player };

    // Ensure nsfwStats exists
    if (!updated.nsfwStats) {
      updated.nsfwStats = {};
    }

    // Apply arousal
    if (effects.arousalGain) {
      updated.nsfwStats.arousal = Math.min(100,
        (updated.nsfwStats.arousal || 0) + effects.arousalGain
      );
    }

    // Apply corruption
    if (effects.corruptionGain) {
      updated.nsfwStats.corruption = Math.min(100,
        (updated.nsfwStats.corruption || 0) + effects.corruptionGain
      );
    }

    // Apply lust
    if (effects.lustGain) {
      updated.nsfwStats.lust = Math.min(100,
        (updated.nsfwStats.lust || 0) + effects.lustGain
      );
    }

    // Apply shame
    if (effects.shameGain) {
      updated.nsfwStats.shame = Math.min(100,
        (updated.nsfwStats.shame || 0) + effects.shameGain
      );
    }

    // Apply clothing damage
    if (effects.clothingDamage) {
      if (!updated.clothingState) updated.clothingState = {};
      const slot = effects.clothingDamage.slot;
      if (!updated.clothingState[slot]) {
        updated.clothingState[slot] = { integrity: 100 };
      }
      updated.clothingState[slot].integrity = Math.max(0,
        updated.clothingState[slot].integrity - effects.clothingDamage.amount
      );
      if (updated.clothingState[slot].integrity <= 0) {
        updated.clothingState[slot].exposed = true;
      }
    }

    // Apply stat changes
    if (effects.statChanges) {
      for (const [stat, change] of Object.entries(effects.statChanges)) {
        if (updated.nsfwStats[stat] !== undefined) {
          updated.nsfwStats[stat] = Math.max(0, Math.min(100,
            updated.nsfwStats[stat] + change
          ));
        }
      }
    }

    return updated;
  }

  /**
   * Select a random item from an array pool
   * @param {any[]} pool - Array of options
   * @returns {any} Random selection
   */
  selectFromPool(pool) {
    if (!pool || !Array.isArray(pool)) return pool;
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }
}

export default NSFWCombatSceneSystem;
