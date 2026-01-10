/**
 * EffectSystem - Declarative rule-based effect/debuff engine
 *
 * Effects are data-driven with:
 * - Duration rules (turns, time, permanent, until_condition)
 * - Stacking rules (replace, stack, refresh, max_stacks)
 * - Stat modifiers (flat, percent, multiply)
 * - Triggers (onApply, onRemove, onTurnStart, onTurnEnd, onHit, onDamaged, etc.)
 * - Conditions (if target has tag, if stat > X, if equipped, etc.)
 */

import { nanoid } from 'nanoid';

// Effect trigger types
export const TRIGGERS = {
  ON_APPLY: 'onApply',
  ON_REMOVE: 'onRemove',
  ON_TURN_START: 'onTurnStart',
  ON_TURN_END: 'onTurnEnd',
  ON_COMBAT_START: 'onCombatStart',
  ON_COMBAT_END: 'onCombatEnd',
  ON_HIT: 'onHit',
  ON_MISS: 'onMiss',
  ON_CRIT: 'onCrit',
  ON_DAMAGED: 'onDamaged',
  ON_HEAL: 'onHeal',
  ON_KILL: 'onKill',
  ON_DEATH: 'onDeath',
  ON_GRAPPLE: 'onGrapple',
  ON_RESTRAIN: 'onRestrain',
  ON_ESCAPE: 'onEscape',
  ON_CORRUPTION_GAIN: 'onCorruptionGain',
  ON_PURITY_LOSS: 'onPurityLoss',
  ON_EQUIP: 'onEquip',
  ON_UNEQUIP: 'onUnequip',
  ON_USE_ITEM: 'onUseItem',
  ON_ENTER_LOCATION: 'onEnterLocation',
  ON_REST: 'onRest',
  ON_SCENE_START: 'onSceneStart',
  ON_SCENE_END: 'onSceneEnd',
  ON_DIALOGUE_CHOICE: 'onDialogueChoice'
};

// Stacking behavior types
export const STACK_BEHAVIOR = {
  REPLACE: 'replace',      // New effect replaces old
  STACK: 'stack',          // Effects stack (up to maxStacks)
  REFRESH: 'refresh',      // Reset duration, don't stack
  EXTEND: 'extend',        // Add duration
  IGNORE: 'ignore',        // Don't apply if already present
  INTENSIFY: 'intensify'   // Increase intensity/potency
};

// Duration types (all turn-based/action-based, no real-time)
export const DURATION_TYPE = {
  TURNS: 'turns',                    // X combat turns
  ACTIONS: 'actions',                // X player actions (explore, rest, talk, etc.)
  DAYS: 'days',                      // X rest cycles / days
  LOCATION_CHANGES: 'locationChanges', // X location transitions
  PERMANENT: 'permanent',            // Until manually removed
  UNTIL_REST: 'untilRest',           // Removed on rest
  UNTIL_COMBAT_END: 'untilCombatEnd', // Removed when combat ends
  UNTIL_CONDITION: 'untilCondition', // Removed when condition met
  USES: 'uses'                       // X uses then removed
};

// Modifier operation types
export const MOD_OPERATION = {
  FLAT: 'flat',           // +X to stat
  PERCENT: 'percent',     // +X% to stat
  MULTIPLY: 'multiply',   // *X to stat
  SET: 'set',             // Set to exact value
  MIN: 'min',             // Minimum value
  MAX: 'max'              // Maximum value
};

/**
 * Evaluate a condition against game state
 */
function evaluateCondition(condition, context) {
  const { target, source, gameState, effectData } = context;
  
  if (!condition) return true;
  
  // Handle array of conditions (AND)
  if (Array.isArray(condition)) {
    return condition.every(c => evaluateCondition(c, context));
  }
  
  // Handle OR conditions
  if (condition.or) {
    return condition.or.some(c => evaluateCondition(c, context));
  }
  
  // Handle NOT condition
  if (condition.not) {
    return !evaluateCondition(condition.not, context);
  }
  
  switch (condition.type) {
    case 'hasTag':
      return target.tags?.includes(condition.tag);
      
    case 'hasEffect':
      return target.activeEffects?.some(e => e.id === condition.effectId);
      
    case 'hasNotEffect':
      return !target.activeEffects?.some(e => e.id === condition.effectId);
      
    case 'statGreaterThan':
      return (target.stats?.[condition.stat] || 0) > condition.value;
      
    case 'statLessThan':
      return (target.stats?.[condition.stat] || 0) < condition.value;
      
    case 'statEquals':
      return (target.stats?.[condition.stat] || 0) === condition.value;
      
    case 'healthPercent':
      const healthPct = (target.currentHp / target.maxHp) * 100;
      return condition.operator === 'lt' ? healthPct < condition.value :
             condition.operator === 'gt' ? healthPct > condition.value :
             condition.operator === 'lte' ? healthPct <= condition.value :
             condition.operator === 'gte' ? healthPct >= condition.value :
             healthPct === condition.value;
      
    case 'corruptionLevel':
      const corruption = target.nsfwStats?.corruption || 0;
      return condition.operator === 'lt' ? corruption < condition.value :
             condition.operator === 'gt' ? corruption > condition.value :
             corruption >= condition.value;
      
    case 'hasEquipped':
      return Object.values(target.equipment || {}).some(e => 
        e?.id === condition.itemId || e?.tags?.includes(condition.tag)
      );
      
    case 'inLocation':
      return target.currentLocation === condition.locationId ||
             gameState?.currentLocation?.tags?.includes(condition.tag);
      
    case 'isRestrained':
      return !!target.restraintState;
      
    case 'isGrappled':
      return target.restraintState?.type === 'grapple';
      
    case 'inCombat':
      return gameState?.inCombat === true;
      
    case 'random':
      return Math.random() < (condition.chance || 0.5);
      
    case 'stackCount':
      const stacks = effectData?.stacks || 1;
      return condition.operator === 'lt' ? stacks < condition.value :
             condition.operator === 'gt' ? stacks > condition.value :
             condition.operator === 'gte' ? stacks >= condition.value :
             stacks === condition.value;
      
    case 'flag':
      return gameState?.worldFlags?.[condition.flag] === condition.value;
      
    case 'always':
      return true;
      
    case 'never':
      return false;
      
    default:
      console.warn(`Unknown condition type: ${condition.type}`);
      return true;
  }
}

/**
 * Execute an action from an effect
 */
function executeAction(action, context) {
  const { target, source, gameState, dispatch, registry } = context;
  const results = [];
  
  switch (action.type) {
    case 'damage':
      const damage = calculateValue(action.amount, context);
      results.push({
        type: 'damage',
        target: target.id,
        amount: damage,
        damageType: action.damageType || 'physical'
      });
      break;
      
    case 'heal':
      const heal = calculateValue(action.amount, context);
      results.push({
        type: 'heal',
        target: target.id,
        amount: heal
      });
      break;
      
    case 'restoreStamina':
      const stamina = calculateValue(action.amount, context);
      results.push({
        type: 'restoreStamina',
        target: target.id,
        amount: stamina
      });
      break;
      
    case 'drainStamina':
      const drain = calculateValue(action.amount, context);
      results.push({
        type: 'drainStamina',
        target: target.id,
        amount: drain
      });
      break;
      
    case 'applyEffect':
      results.push({
        type: 'applyEffect',
        target: action.target === 'source' ? source?.id : target.id,
        effectId: action.effectId,
        stacks: action.stacks || 1,
        duration: action.duration
      });
      break;
      
    case 'removeEffect':
      results.push({
        type: 'removeEffect',
        target: action.target === 'source' ? source?.id : target.id,
        effectId: action.effectId
      });
      break;
      
    case 'modifyCorruption':
      const corruptionChange = calculateValue(action.amount, context);
      results.push({
        type: 'modifyCorruption',
        target: target.id,
        amount: corruptionChange
      });
      break;
      
    case 'modifyPurity':
      const purityChange = calculateValue(action.amount, context);
      results.push({
        type: 'modifyPurity',
        target: target.id,
        amount: purityChange
      });
      break;
      
    case 'addRestraint':
      results.push({
        type: 'addRestraint',
        target: target.id,
        restraintType: action.restraintType,
        hp: action.hp || 50
      });
      break;
      
    case 'breakRestraint':
      results.push({
        type: 'breakRestraint',
        target: target.id,
        damage: calculateValue(action.damage, context)
      });
      break;
      
    case 'teleport':
      results.push({
        type: 'teleport',
        target: target.id,
        locationId: action.locationId
      });
      break;
      
    case 'giveItem':
      results.push({
        type: 'giveItem',
        target: target.id,
        itemId: action.itemId,
        count: action.count || 1
      });
      break;
      
    case 'removeItem':
      results.push({
        type: 'removeItem',
        target: target.id,
        itemId: action.itemId,
        count: action.count || 1
      });
      break;
      
    case 'giveGold':
      results.push({
        type: 'giveGold',
        target: target.id,
        amount: calculateValue(action.amount, context)
      });
      break;
      
    case 'setFlag':
      results.push({
        type: 'setFlag',
        flag: action.flag,
        value: action.value
      });
      break;
      
    case 'triggerScene':
      results.push({
        type: 'triggerScene',
        sceneId: action.sceneId
      });
      break;
      
    case 'unlockAchievement':
      results.push({
        type: 'unlockAchievement',
        achievementId: action.achievementId
      });
      break;
      
    case 'showToast':
      results.push({
        type: 'showToast',
        toastType: action.toastType || 'info',
        title: action.title,
        message: action.message
      });
      break;
      
    case 'playSound':
      results.push({
        type: 'playSound',
        soundId: action.soundId
      });
      break;
      
    case 'custom':
      // Custom action handler
      results.push({
        type: 'custom',
        handler: action.handler,
        data: action.data
      });
      break;
  }
  
  return results;
}

/**
 * Calculate a value that might be static or dynamic
 */
function calculateValue(valueSpec, context) {
  if (typeof valueSpec === 'number') {
    return valueSpec;
  }
  
  if (typeof valueSpec === 'object') {
    const { target, source, effectData } = context;
    
    switch (valueSpec.type) {
      case 'flat':
        return valueSpec.value;
        
      case 'percentOfMax':
        const maxStat = valueSpec.stat === 'hp' ? target.maxHp :
                        valueSpec.stat === 'stamina' ? target.maxStamina :
                        valueSpec.stat === 'mana' ? target.maxMana :
                        target.stats?.[valueSpec.stat] || 100;
        return Math.floor(maxStat * (valueSpec.percent / 100));
        
      case 'percentOfCurrent':
        const currentStat = valueSpec.stat === 'hp' ? target.currentHp :
                           valueSpec.stat === 'stamina' ? target.currentStamina :
                           valueSpec.stat === 'mana' ? target.currentMana :
                           target.stats?.[valueSpec.stat] || 100;
        return Math.floor(currentStat * (valueSpec.percent / 100));
        
      case 'scaledByStat':
        const scalingStat = target.stats?.[valueSpec.stat] || 0;
        return valueSpec.base + (scalingStat * valueSpec.scaling);
        
      case 'random':
        return valueSpec.min + Math.floor(Math.random() * (valueSpec.max - valueSpec.min + 1));
        
      case 'perStack':
        const stacks = effectData?.stacks || 1;
        return valueSpec.perStack * stacks;
        
      case 'formula':
        // Simple formula evaluation (be careful with this)
        try {
          const fn = new Function('target', 'source', 'stacks', 'gameState', 
            `return ${valueSpec.formula}`);
          return fn(target, source, effectData?.stacks || 1, context.gameState);
        } catch (e) {
          console.error('Formula evaluation failed:', e);
          return 0;
        }
        
      default:
        return valueSpec.value || 0;
    }
  }
  
  return 0;
}

/**
 * Main Effect System class
 */
export class EffectSystem {
  constructor(registry) {
    this.registry = registry; // DataRegistry instance for loading effect definitions
    this.effectCache = new Map(); // Cache loaded effect definitions
  }

  /**
   * Get effect definition (from registry or cache)
   */
  async getEffectDefinition(effectId) {
    if (this.effectCache.has(effectId)) {
      return this.effectCache.get(effectId);
    }
    
    const effect = await this.registry.getEffect(effectId);
    if (effect) {
      this.effectCache.set(effectId, effect);
    }
    return effect;
  }

  /**
   * Apply an effect to a target
   */
  async applyEffect(effectId, target, source = null, options = {}) {
    const definition = await this.getEffectDefinition(effectId);
    if (!definition) {
      console.warn(`Effect not found: ${effectId}`);
      return { success: false, reason: 'Effect not found' };
    }
    
    const context = {
      target,
      source,
      gameState: options.gameState,
      effectData: null,
      registry: this.registry
    };
    
    // Check apply conditions
    if (definition.applyConditions && !evaluateCondition(definition.applyConditions, context)) {
      return { success: false, reason: 'Conditions not met' };
    }
    
    // Check immunity
    if (this.isImmune(target, effectId, definition)) {
      return { success: false, reason: 'Target is immune' };
    }
    
    // Handle stacking
    const existingEffect = target.activeEffects?.find(e => e.id === effectId);
    const stackBehavior = definition.stackBehavior || STACK_BEHAVIOR.REPLACE;
    
    let newEffect;
    let results = [];
    
    if (existingEffect) {
      switch (stackBehavior) {
        case STACK_BEHAVIOR.IGNORE:
          return { success: false, reason: 'Effect already active' };
          
        case STACK_BEHAVIOR.REPLACE:
          // Remove old, apply new
          results.push(...this.removeEffectImmediate(target, effectId, context));
          newEffect = this.createEffectInstance(effectId, definition, options);
          break;
          
        case STACK_BEHAVIOR.REFRESH:
          existingEffect.remainingDuration = definition.duration?.value || existingEffect.remainingDuration;
          existingEffect.remainingUses = definition.duration?.value || existingEffect.remainingUses;
          return { success: true, action: 'refreshed', effect: existingEffect, results: [] };
          
        case STACK_BEHAVIOR.EXTEND:
          existingEffect.remainingDuration += definition.duration?.value || 0;
          return { success: true, action: 'extended', effect: existingEffect, results: [] };
          
        case STACK_BEHAVIOR.STACK:
          const maxStacks = definition.maxStacks || 99;
          if (existingEffect.stacks >= maxStacks) {
            return { success: false, reason: 'Max stacks reached' };
          }
          existingEffect.stacks++;
          existingEffect.remainingDuration = definition.duration?.value || existingEffect.remainingDuration;
          context.effectData = existingEffect;
          
          // Execute onStack triggers
          if (definition.triggers?.onStack) {
            for (const trigger of definition.triggers.onStack) {
              if (evaluateCondition(trigger.condition, context)) {
                results.push(...executeAction(trigger.action, context));
              }
            }
          }
          
          return { success: true, action: 'stacked', effect: existingEffect, results };
          
        case STACK_BEHAVIOR.INTENSIFY:
          existingEffect.intensity = (existingEffect.intensity || 1) + (options.intensity || 0.1);
          existingEffect.remainingDuration = definition.duration?.value || existingEffect.remainingDuration;
          return { success: true, action: 'intensified', effect: existingEffect, results: [] };
      }
    } else {
      newEffect = this.createEffectInstance(effectId, definition, options);
    }
    
    // Add effect to target
    if (!target.activeEffects) target.activeEffects = [];
    target.activeEffects.push(newEffect);
    
    context.effectData = newEffect;
    
    // Execute onApply triggers
    if (definition.triggers?.onApply) {
      for (const trigger of definition.triggers.onApply) {
        if (evaluateCondition(trigger.condition, context)) {
          results.push(...executeAction(trigger.action, context));
        }
      }
    }
    
    return { success: true, action: 'applied', effect: newEffect, results };
  }

  /**
   * Create a new effect instance
   */
  createEffectInstance(effectId, definition, options = {}) {
    const durationType = definition.duration?.type || DURATION_TYPE.PERMANENT;

    // Determine if this duration type uses a counter
    const counterBasedTypes = [
      DURATION_TYPE.TURNS,
      DURATION_TYPE.ACTIONS,
      DURATION_TYPE.DAYS,
      DURATION_TYPE.LOCATION_CHANGES
    ];

    return {
      id: effectId,
      instanceId: `${effectId}_${nanoid()}`,
      appliedAt: Date.now(),
      stacks: options.stacks || 1,
      intensity: options.intensity || 1,
      source: options.source?.id || null,

      // Duration tracking
      durationType,
      remainingDuration: counterBasedTypes.includes(durationType)
                         ? definition.duration.value : null,
      remainingUses: durationType === DURATION_TYPE.USES
                     ? definition.duration.value : null,

      // Cached modifier values for quick stat calculation
      modifiers: definition.modifiers || [],

      // Custom data
      customData: options.customData || {}
    };
  }

  /**
   * Remove an effect from a target
   */
  async removeEffect(effectId, target, context = {}) {
    const definition = await this.getEffectDefinition(effectId);
    const results = this.removeEffectImmediate(target, effectId, { ...context, definition });
    return { success: true, results };
  }

  /**
   * Immediate effect removal (used internally)
   */
  removeEffectImmediate(target, effectId, context) {
    const results = [];
    const effectIndex = target.activeEffects?.findIndex(e => e.id === effectId);
    
    if (effectIndex === -1 || effectIndex === undefined) {
      return results;
    }
    
    const effect = target.activeEffects[effectIndex];
    const definition = context.definition || this.effectCache.get(effectId);
    
    // Execute onRemove triggers
    if (definition?.triggers?.onRemove) {
      const ctx = { ...context, effectData: effect };
      for (const trigger of definition.triggers.onRemove) {
        if (evaluateCondition(trigger.condition, ctx)) {
          results.push(...executeAction(trigger.action, ctx));
        }
      }
    }
    
    // Remove from array
    target.activeEffects.splice(effectIndex, 1);
    
    return results;
  }

  /**
   * Check if target is immune to an effect
   */
  isImmune(target, effectId, definition) {
    // Check immunity list
    if (target.immunities?.includes(effectId)) return true;
    
    // Check tag-based immunity
    if (definition.tags) {
      for (const tag of definition.tags) {
        if (target.immuneTags?.includes(tag)) return true;
      }
    }
    
    // Check type-based immunity
    if (definition.effectType && target.immuneTypes?.includes(definition.effectType)) {
      return true;
    }
    
    return false;
  }

  /**
   * Process triggers for a specific event
   */
  async processTrigger(triggerType, target, context = {}) {
    const results = [];
    
    if (!target.activeEffects) return results;
    
    for (const effect of [...target.activeEffects]) {
      const definition = await this.getEffectDefinition(effect.id);
      if (!definition?.triggers?.[triggerType]) continue;
      
      const ctx = {
        target,
        source: context.source,
        gameState: context.gameState,
        effectData: effect,
        registry: this.registry,
        triggerData: context.triggerData
      };
      
      for (const trigger of definition.triggers[triggerType]) {
        if (evaluateCondition(trigger.condition, ctx)) {
          results.push(...executeAction(trigger.action, ctx));
        }
      }
    }
    
    return results;
  }

  /**
   * Update effect durations based on game events
   * @param {Object} target - The entity with effects
   * @param {string} tickType - Type of tick: 'turn', 'action', 'day', 'locationChange', 'rest', 'combatEnd'
   * @param {Object} context - Additional context
   */
  async tickEffects(target, tickType = 'turn', context = {}) {
    const results = [];
    const toRemove = [];

    if (!target.activeEffects) return results;

    for (const effect of target.activeEffects) {
      const definition = await this.getEffectDefinition(effect.id);
      let shouldDecrement = false;
      let triggerType = null;

      // Determine if this tick type affects this effect's duration
      switch (effect.durationType) {
        case DURATION_TYPE.TURNS:
          if (tickType === 'turn') {
            shouldDecrement = true;
            triggerType = TRIGGERS.ON_TURN_END;
          }
          break;

        case DURATION_TYPE.ACTIONS:
          if (tickType === 'action') {
            shouldDecrement = true;
          }
          break;

        case DURATION_TYPE.DAYS:
          if (tickType === 'day' || tickType === 'rest') {
            shouldDecrement = true;
            triggerType = TRIGGERS.ON_REST;
          }
          break;

        case DURATION_TYPE.LOCATION_CHANGES:
          if (tickType === 'locationChange') {
            shouldDecrement = true;
            triggerType = TRIGGERS.ON_ENTER_LOCATION;
          }
          break;

        case DURATION_TYPE.UNTIL_REST:
          if (tickType === 'rest') {
            toRemove.push(effect.id);
          }
          break;

        case DURATION_TYPE.UNTIL_COMBAT_END:
          if (tickType === 'combatEnd') {
            toRemove.push(effect.id);
          }
          break;

        case DURATION_TYPE.UNTIL_CONDITION:
          // Check condition
          if (definition?.removeCondition) {
            const ctx = { target, gameState: context.gameState, effectData: effect };
            if (evaluateCondition(definition.removeCondition, ctx)) {
              toRemove.push(effect.id);
            }
          }
          break;
      }

      // Decrement duration if applicable
      if (shouldDecrement && effect.remainingDuration !== null) {
        effect.remainingDuration--;
        if (effect.remainingDuration <= 0) {
          toRemove.push(effect.id);
        }
      }

      // Process tick triggers based on tick type
      if (!triggerType) {
        // Map tick types to trigger types
        const tickToTrigger = {
          'turn': TRIGGERS.ON_TURN_END,
          'combatStart': TRIGGERS.ON_COMBAT_START,
          'combatEnd': TRIGGERS.ON_COMBAT_END,
          'rest': TRIGGERS.ON_REST,
          'locationChange': TRIGGERS.ON_ENTER_LOCATION
        };
        triggerType = tickToTrigger[tickType];
      }

      if (triggerType && definition?.triggers?.[triggerType]) {
        const ctx = {
          target,
          gameState: context.gameState,
          effectData: effect,
          registry: this.registry
        };

        for (const trigger of definition.triggers[triggerType]) {
          if (evaluateCondition(trigger.condition, ctx)) {
            results.push(...executeAction(trigger.action, ctx));
          }
        }
      }
    }

    // Remove expired effects
    for (const effectId of toRemove) {
      results.push(...this.removeEffectImmediate(target, effectId, { ...context }));
    }

    return results;
  }

  /**
   * Calculate total stat modifiers from all active effects
   */
  calculateStatModifiers(target, statName) {
    let flatBonus = 0;
    let percentBonus = 0;
    let multiplier = 1;
    let minValue = null;
    let maxValue = null;
    let setValue = null;
    
    if (!target.activeEffects) {
      return { flatBonus, percentBonus, multiplier, minValue, maxValue, setValue };
    }
    
    for (const effect of target.activeEffects) {
      const stacks = effect.stacks || 1;
      const intensity = effect.intensity || 1;
      
      for (const mod of effect.modifiers || []) {
        if (mod.stat !== statName) continue;
        
        // Check condition
        if (mod.condition && !evaluateCondition(mod.condition, { target, effectData: effect })) {
          continue;
        }
        
        const value = (mod.value || 0) * stacks * intensity;
        
        switch (mod.operation || MOD_OPERATION.FLAT) {
          case MOD_OPERATION.FLAT:
            flatBonus += value;
            break;
          case MOD_OPERATION.PERCENT:
            percentBonus += value;
            break;
          case MOD_OPERATION.MULTIPLY:
            multiplier *= value;
            break;
          case MOD_OPERATION.MIN:
            minValue = minValue === null ? value : Math.max(minValue, value);
            break;
          case MOD_OPERATION.MAX:
            maxValue = maxValue === null ? value : Math.min(maxValue, value);
            break;
          case MOD_OPERATION.SET:
            setValue = value;
            break;
        }
      }
    }
    
    return { flatBonus, percentBonus, multiplier, minValue, maxValue, setValue };
  }

  /**
   * Apply stat modifiers to get final value
   */
  applyStatModifiers(baseValue, modifiers) {
    const { flatBonus, percentBonus, multiplier, minValue, maxValue, setValue } = modifiers;
    
    // If set value exists, use it (but still apply min/max)
    if (setValue !== null) {
      let final = setValue;
      if (minValue !== null) final = Math.max(final, minValue);
      if (maxValue !== null) final = Math.min(final, maxValue);
      return final;
    }
    
    // Normal calculation: (base + flat) * (1 + percent/100) * multiplier
    let final = baseValue;
    final += flatBonus;
    final *= (1 + percentBonus / 100);
    final *= multiplier;
    
    // Apply min/max
    if (minValue !== null) final = Math.max(final, minValue);
    if (maxValue !== null) final = Math.min(final, maxValue);
    
    return Math.floor(final);
  }

  /**
   * Get the final value of a stat after all effect modifiers
   */
  getFinalStat(target, statName, baseValue) {
    const modifiers = this.calculateStatModifiers(target, statName);
    return this.applyStatModifiers(baseValue, modifiers);
  }

  /**
   * Clear effect cache
   */
  clearCache() {
    this.effectCache.clear();
  }
}

export default EffectSystem;
