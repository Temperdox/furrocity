/**
 * CombatSystem - Turn-based combat resolution engine
 * 
 * Handles:
 * - Initiative and turn order
 * - Attack/defense calculations
 * - Skill execution
 * - Restraint/grapple mechanics
 * - Flee attempts
 * - Combat effects and triggers
 */

import { TRIGGERS } from './EffectSystem.js';

// Combat action types
export const COMBAT_ACTIONS = {
  ATTACK: 'attack',
  SKILL: 'skill',
  ITEM: 'item',
  DEFEND: 'defend',
  FLEE: 'flee',
  STRUGGLE: 'struggle',
  WAIT: 'wait',
  SURRENDER: 'surrender'
};

// Combat phases
export const COMBAT_PHASE = {
  INIT: 'init',
  PLAYER_TURN: 'playerTurn',
  ENEMY_TURN: 'enemyTurn',
  RESOLUTION: 'resolution',
  VICTORY: 'victory',
  DEFEAT: 'defeat',
  FLED: 'fled',
  SURRENDERED: 'surrendered'
};

// Damage types
export const DAMAGE_TYPES = {
  PHYSICAL: 'physical',
  MAGIC: 'magic',
  FIRE: 'fire',
  ICE: 'ice',
  LIGHTNING: 'lightning',
  POISON: 'poison',
  DARK: 'dark',
  HOLY: 'holy',
  PSYCHIC: 'psychic',
  TRUE: 'true' // Ignores all resistances
};

/**
 * Calculate initiative for turn order
 */
function calculateInitiative(entity, effectSystem) {
  const baseSpeed = entity.stats?.speed || entity.stats?.evasion || 10;
  const modifiedSpeed = effectSystem 
    ? effectSystem.getFinalStat(entity, 'speed', baseSpeed)
    : baseSpeed;
  
  // Add randomness
  const roll = Math.floor(Math.random() * 20) + 1;
  return modifiedSpeed + roll;
}

/**
 * Calculate hit chance
 */
function calculateHitChance(attacker, defender, effectSystem, options = {}) {
  const baseAccuracy = attacker.stats?.accuracy || 85;
  const attackerAccuracy = effectSystem
    ? effectSystem.getFinalStat(attacker, 'accuracy', baseAccuracy)
    : baseAccuracy;
  
  const baseEvasion = defender.stats?.evasion || 5;
  const defenderEvasion = effectSystem
    ? effectSystem.getFinalStat(defender, 'evasion', baseEvasion)
    : baseEvasion;
  
  // Restrained targets are easier to hit
  const restraintPenalty = defender.restraintState ? 30 : 0;
  
  const hitChance = attackerAccuracy - (defenderEvasion - restraintPenalty);
  return Math.max(5, Math.min(95, hitChance)); // Clamp between 5% and 95%
}

/**
 * Calculate damage
 */
function calculateDamage(attacker, defender, effectSystem, options = {}) {
  const { damageType = DAMAGE_TYPES.PHYSICAL, skillMultiplier = 1, baseDamage } = options;
  
  // Get attack stat
  let attackStat;
  if (damageType === DAMAGE_TYPES.MAGIC || damageType === DAMAGE_TYPES.PSYCHIC) {
    attackStat = attacker.stats?.intelligence || attacker.stats?.magic || 10;
  } else {
    attackStat = attacker.stats?.strength || attacker.stats?.attack || 10;
  }
  
  const modifiedAttack = effectSystem
    ? effectSystem.getFinalStat(attacker, damageType === DAMAGE_TYPES.MAGIC ? 'magic' : 'attack', attackStat)
    : attackStat;
  
  // Get defense stat
  let defenseStat;
  if (damageType === DAMAGE_TYPES.MAGIC || damageType === DAMAGE_TYPES.PSYCHIC) {
    defenseStat = defender.stats?.willpower || defender.stats?.magicDefense || 5;
  } else {
    defenseStat = defender.stats?.vitality || defender.stats?.defense || 5;
  }
  
  const modifiedDefense = effectSystem
    ? effectSystem.getFinalStat(defender, damageType === DAMAGE_TYPES.MAGIC ? 'magicDefense' : 'defense', defenseStat)
    : defenseStat;
  
  // Check for resistance/weakness
  let resistanceMultiplier = 1;
  if (defender.resistances?.[damageType]) {
    resistanceMultiplier = 1 - (defender.resistances[damageType] / 100);
  }
  if (defender.weaknesses?.[damageType]) {
    resistanceMultiplier = 1 + (defender.weaknesses[damageType] / 100);
  }
  
  // True damage ignores defense and resistance
  if (damageType === DAMAGE_TYPES.TRUE) {
    resistanceMultiplier = 1;
  }
  
  // Calculate base damage
  const rawDamage = baseDamage || (modifiedAttack * 2);
  const defenseReduction = damageType === DAMAGE_TYPES.TRUE ? 0 : modifiedDefense * 0.5;
  
  let finalDamage = (rawDamage - defenseReduction) * skillMultiplier * resistanceMultiplier;
  
  // Add variance (±10%)
  const variance = 0.9 + Math.random() * 0.2;
  finalDamage *= variance;
  
  return Math.max(1, Math.floor(finalDamage)); // Minimum 1 damage
}

/**
 * Calculate critical hit
 */
function calculateCrit(attacker, effectSystem) {
  const baseCritChance = attacker.stats?.critChance || 5;
  const critChance = effectSystem
    ? effectSystem.getFinalStat(attacker, 'critChance', baseCritChance)
    : baseCritChance;
  
  const baseCritMultiplier = attacker.stats?.critMultiplier || 150;
  const critMultiplier = effectSystem
    ? effectSystem.getFinalStat(attacker, 'critMultiplier', baseCritMultiplier)
    : baseCritMultiplier;
  
  const isCrit = Math.random() * 100 < critChance;
  
  return {
    isCrit,
    multiplier: isCrit ? critMultiplier / 100 : 1
  };
}

/**
 * Main Combat System class
 */
export class CombatSystem {
  constructor(registry, effectSystem, options = {}) {
    this.registry = registry;
    this.effectSystem = effectSystem;
    this.callbacks = options.callbacks || {};
    
    // Combat state
    this.combatants = [];
    this.turnOrder = [];
    this.currentTurnIndex = 0;
    this.round = 0;
    this.phase = COMBAT_PHASE.INIT;
    this.log = [];
    
    // Combat flags
    this.playerFled = false;
    this.playerSurrendered = false;
    this.combatEnded = false;
  }

  /**
   * Initialize combat with player and enemies
   */
  async initCombat(player, enemyIds, options = {}) {
    this.combatants = [];
    this.turnOrder = [];
    this.currentTurnIndex = 0;
    this.round = 0;
    this.phase = COMBAT_PHASE.INIT;
    this.log = [];
    this.playerFled = false;
    this.playerSurrendered = false;
    this.combatEnded = false;
    
    // Add player
    const playerCombatant = {
      ...player,
      isPlayer: true,
      combatId: 'player',
      initiative: 0
    };
    this.combatants.push(playerCombatant);
    
    // Add enemies
    for (let i = 0; i < enemyIds.length; i++) {
      const enemyId = typeof enemyIds[i] === 'string' ? enemyIds[i] : enemyIds[i].id;
      const enemyData = await this.registry.getEnemy(enemyId);
      
      if (!enemyData) {
        console.warn(`Enemy not found: ${enemyId}`);
        continue;
      }
      
      const enemy = {
        ...enemyData,
        currentHp: enemyData.maxHp || enemyData.hp || 50,
        maxHp: enemyData.maxHp || enemyData.hp || 50,
        currentStamina: enemyData.maxStamina || 100,
        maxStamina: enemyData.maxStamina || 100,
        isPlayer: false,
        combatId: `enemy_${i}`,
        activeEffects: [],
        initiative: 0
      };
      
      // Apply level scaling if specified
      if (options.enemyLevel) {
        const levelDiff = options.enemyLevel - (enemy.level || 1);
        if (levelDiff > 0) {
          enemy.maxHp = Math.floor(enemy.maxHp * (1 + levelDiff * 0.1));
          enemy.currentHp = enemy.maxHp;
          if (enemy.stats) {
            for (const stat of Object.keys(enemy.stats)) {
              enemy.stats[stat] = Math.floor(enemy.stats[stat] * (1 + levelDiff * 0.05));
            }
          }
        }
      }
      
      this.combatants.push(enemy);
    }
    
    // Calculate initiative and set turn order
    this.calculateTurnOrder();
    
    // Trigger combat start effects
    await this.triggerCombatStart();
    
    // Advance to first turn
    this.round = 1;
    this.phase = this.turnOrder[0].isPlayer ? COMBAT_PHASE.PLAYER_TURN : COMBAT_PHASE.ENEMY_TURN;
    
    this.addLog({
      type: 'combatStart',
      message: `Combat begins! Round ${this.round}`,
      enemies: this.combatants.filter(c => !c.isPlayer).map(c => c.name)
    });
    
    return this.getCombatState();
  }

  /**
   * Calculate turn order based on initiative
   */
  calculateTurnOrder() {
    for (const combatant of this.combatants) {
      combatant.initiative = calculateInitiative(combatant, this.effectSystem);
    }
    
    this.turnOrder = [...this.combatants]
      .filter(c => c.currentHp > 0)
      .sort((a, b) => b.initiative - a.initiative);
  }

  /**
   * Get current combat state for UI
   */
  getCombatState() {
    const currentCombatant = this.turnOrder[this.currentTurnIndex];
    
    return {
      phase: this.phase,
      round: this.round,
      combatants: this.combatants.map(c => ({
        combatId: c.combatId,
        name: c.name,
        currentHp: c.currentHp,
        maxHp: c.maxHp,
        currentStamina: c.currentStamina,
        maxStamina: c.maxStamina,
        isPlayer: c.isPlayer,
        activeEffects: c.activeEffects || [],
        restraintState: c.restraintState,
        isDefeated: c.currentHp <= 0
      })),
      turnOrder: this.turnOrder.map(c => c.combatId),
      currentTurn: currentCombatant?.combatId,
      isPlayerTurn: currentCombatant?.isPlayer,
      log: this.log.slice(-10),
      playerCanFlee: this.canFlee(),
      combatEnded: this.combatEnded,
      result: this.combatEnded ? this.getCombatResult() : null
    };
  }

  /**
   * Execute a player action
   */
  async executePlayerAction(action, options = {}) {
    if (this.phase !== COMBAT_PHASE.PLAYER_TURN) {
      return { success: false, error: 'Not player turn' };
    }
    
    const player = this.combatants.find(c => c.isPlayer);
    const results = [];
    
    switch (action) {
      case COMBAT_ACTIONS.ATTACK:
        results.push(...await this.executeAttack(player, options.targetId));
        break;
        
      case COMBAT_ACTIONS.SKILL:
        results.push(...await this.executeSkill(player, options.skillId, options.targetId));
        break;
        
      case COMBAT_ACTIONS.ITEM:
        results.push(...await this.executeItem(player, options.itemId, options.targetId));
        break;
        
      case COMBAT_ACTIONS.DEFEND:
        results.push(...await this.executeDefend(player));
        break;
        
      case COMBAT_ACTIONS.FLEE:
        results.push(...await this.executeFlee(player));
        break;
        
      case COMBAT_ACTIONS.STRUGGLE:
        results.push(...await this.executeStruggle(player));
        break;
        
      case COMBAT_ACTIONS.SURRENDER:
        results.push(...await this.executeSurrender(player));
        break;
        
      default:
        return { success: false, error: 'Unknown action' };
    }
    
    // Check for combat end
    if (this.checkCombatEnd()) {
      return { success: true, results, state: this.getCombatState() };
    }
    
    // Advance turn
    await this.advanceTurn();
    
    return { success: true, results, state: this.getCombatState() };
  }

  /**
   * Execute a basic attack
   */
  async executeAttack(attacker, targetId) {
    const results = [];
    const target = this.combatants.find(c => c.combatId === targetId);
    
    if (!target || target.currentHp <= 0) {
      // Auto-select first alive enemy
      const aliveEnemies = this.combatants.filter(c => !c.isPlayer && c.currentHp > 0);
      if (aliveEnemies.length === 0) {
        return [{ type: 'error', message: 'No valid targets' }];
      }
      target = aliveEnemies[0];
    }
    
    // Calculate hit
    const hitChance = calculateHitChance(attacker, target, this.effectSystem);
    const hitRoll = Math.random() * 100;
    
    if (hitRoll > hitChance) {
      // Miss
      results.push({
        type: 'miss',
        attacker: attacker.combatId,
        target: target.combatId,
        message: `${attacker.name} missed ${target.name}!`
      });
      
      await this.effectSystem?.processTrigger(TRIGGERS.ON_MISS, attacker, { target });
      
      this.addLog({ type: 'miss', attacker: attacker.name, target: target.name });
      return results;
    }
    
    // Calculate crit
    const { isCrit, multiplier: critMultiplier } = calculateCrit(attacker, this.effectSystem);
    
    // Calculate damage
    const damage = calculateDamage(attacker, target, this.effectSystem, {
      damageType: attacker.damageType || DAMAGE_TYPES.PHYSICAL,
      skillMultiplier: critMultiplier
    });
    
    // Apply damage
    target.currentHp = Math.max(0, target.currentHp - damage);
    
    results.push({
      type: 'damage',
      attacker: attacker.combatId,
      target: target.combatId,
      damage,
      isCrit,
      remainingHp: target.currentHp,
      message: isCrit 
        ? `Critical hit! ${attacker.name} deals ${damage} damage to ${target.name}!`
        : `${attacker.name} deals ${damage} damage to ${target.name}.`
    });
    
    this.addLog({
      type: 'damage',
      attacker: attacker.name,
      target: target.name,
      damage,
      isCrit
    });
    
    // Trigger effects
    await this.effectSystem?.processTrigger(TRIGGERS.ON_HIT, attacker, { target, damage });
    await this.effectSystem?.processTrigger(TRIGGERS.ON_DAMAGED, target, { attacker, damage });
    
    if (isCrit) {
      await this.effectSystem?.processTrigger(TRIGGERS.ON_CRIT, attacker, { target, damage });
    }
    
    // Check for defeat
    if (target.currentHp <= 0) {
      results.push({
        type: 'defeat',
        target: target.combatId,
        message: `${target.name} is defeated!`
      });
      
      await this.effectSystem?.processTrigger(TRIGGERS.ON_KILL, attacker, { target });
      await this.effectSystem?.processTrigger(TRIGGERS.ON_DEATH, target, { attacker });
      
      this.addLog({ type: 'defeat', target: target.name });
    }
    
    return results;
  }

  /**
   * Execute a skill
   */
  async executeSkill(attacker, skillId, targetId) {
    const results = [];
    const skill = await this.registry.getSkill(skillId);
    
    if (!skill) {
      return [{ type: 'error', message: 'Skill not found' }];
    }
    
    // Check stamina cost
    const staminaCost = skill.cost?.stamina || 0;
    if (attacker.currentStamina < staminaCost) {
      return [{ type: 'error', message: 'Not enough stamina' }];
    }
    
    // Check cooldown
    if (attacker.skillCooldowns?.[skillId] > 0) {
      return [{ type: 'error', message: 'Skill on cooldown' }];
    }
    
    // Consume stamina
    attacker.currentStamina -= staminaCost;
    
    // Set cooldown
    if (skill.cooldown) {
      if (!attacker.skillCooldowns) attacker.skillCooldowns = {};
      attacker.skillCooldowns[skillId] = skill.cooldown;
    }
    
    results.push({
      type: 'skillUsed',
      user: attacker.combatId,
      skill: skill.name,
      staminaCost,
      message: `${attacker.name} uses ${skill.name}!`
    });
    
    this.addLog({ type: 'skill', user: attacker.name, skill: skill.name });
    
    // Process skill effects
    if (skill.effect) {
      const target = this.combatants.find(c => c.combatId === targetId) || 
                     this.combatants.find(c => !c.isPlayer && c.currentHp > 0);
      
      // Damage effect
      if (skill.effect.damage) {
        const damage = calculateDamage(attacker, target, this.effectSystem, {
          damageType: skill.effect.damageType || DAMAGE_TYPES.PHYSICAL,
          skillMultiplier: skill.effect.damage,
          baseDamage: skill.effect.baseDamage
        });
        
        target.currentHp = Math.max(0, target.currentHp - damage);
        
        results.push({
          type: 'damage',
          attacker: attacker.combatId,
          target: target.combatId,
          damage,
          skill: skill.name,
          message: `${skill.name} deals ${damage} damage to ${target.name}!`
        });
      }
      
      // Heal effect
      if (skill.effect.heal || skill.effect.hpRestore) {
        const healAmount = skill.effect.heal || skill.effect.hpRestore;
        const healTarget = skill.effect.target === 'self' ? attacker : target;
        const actualHeal = Math.min(healAmount, healTarget.maxHp - healTarget.currentHp);
        
        healTarget.currentHp += actualHeal;
        
        results.push({
          type: 'heal',
          target: healTarget.combatId,
          amount: actualHeal,
          message: `${healTarget.name} recovers ${actualHeal} HP!`
        });
      }
      
      // Stamina restore
      if (skill.effect.staminaRestore) {
        const restoreTarget = skill.effect.target === 'self' ? attacker : target;
        const actualRestore = Math.min(
          skill.effect.staminaRestore, 
          restoreTarget.maxStamina - restoreTarget.currentStamina
        );
        
        restoreTarget.currentStamina += actualRestore;
        
        results.push({
          type: 'staminaRestore',
          target: restoreTarget.combatId,
          amount: actualRestore,
          message: `${restoreTarget.name} recovers ${actualRestore} stamina!`
        });
      }
      
      // Apply effect
      if (skill.effect.applyEffect) {
        const effectTarget = skill.effect.target === 'self' ? attacker : target;
        await this.effectSystem?.applyEffect(skill.effect.applyEffect, effectTarget, attacker);
        
        results.push({
          type: 'effectApplied',
          target: effectTarget.combatId,
          effectId: skill.effect.applyEffect
        });
      }
      
      // Evasion boost
      if (skill.effect.evasionBoost) {
        // Temporary effect handled by effect system
      }
      
      // Defense boost
      if (skill.effect.defenseBoost) {
        // Temporary effect handled by effect system
      }
    }
    
    return results;
  }

  /**
   * Execute item use
   */
  async executeItem(user, itemId, targetId) {
    const results = [];
    const item = await this.registry.getItem(itemId);
    
    if (!item) {
      return [{ type: 'error', message: 'Item not found' }];
    }
    
    results.push({
      type: 'itemUsed',
      user: user.combatId,
      item: item.name,
      message: `${user.name} uses ${item.name}!`
    });
    
    // Process use effect
    if (item.useEffect) {
      const target = targetId 
        ? this.combatants.find(c => c.combatId === targetId)
        : user;
      
      if (item.useEffect.type === 'heal') {
        const healAmount = typeof item.useEffect.amount === 'object'
          ? item.useEffect.amount.value
          : item.useEffect.amount;
        const actualHeal = Math.min(healAmount, target.maxHp - target.currentHp);
        
        target.currentHp += actualHeal;
        
        results.push({
          type: 'heal',
          target: target.combatId,
          amount: actualHeal,
          message: `${target.name} recovers ${actualHeal} HP!`
        });
      }
      
      if (item.useEffect.type === 'restoreStamina') {
        const restoreAmount = typeof item.useEffect.amount === 'object'
          ? item.useEffect.amount.value
          : item.useEffect.amount;
        const actualRestore = Math.min(restoreAmount, target.maxStamina - target.currentStamina);
        
        target.currentStamina += actualRestore;
        
        results.push({
          type: 'staminaRestore',
          target: target.combatId,
          amount: actualRestore,
          message: `${target.name} recovers ${actualRestore} stamina!`
        });
      }
      
      if (item.useEffect.type === 'removeEffect' && item.useEffect.effectTags) {
        // Remove effects with matching tags
        target.activeEffects = target.activeEffects?.filter(e => 
          !item.useEffect.effectTags.some(tag => e.tags?.includes(tag))
        ) || [];
        
        results.push({
          type: 'effectRemoved',
          target: target.combatId,
          message: `Removed status effects from ${target.name}!`
        });
      }
    }
    
    // Callback to remove item from inventory
    if (this.callbacks.consumeItem) {
      await this.callbacks.consumeItem(itemId);
    }
    
    return results;
  }

  /**
   * Execute defend action
   */
  async executeDefend(defender) {
    // Apply temporary defense buff
    await this.effectSystem?.applyEffect('defend_stance', defender, defender, {
      duration: { type: 'turns', value: 1 }
    });
    
    this.addLog({ type: 'defend', user: defender.name });
    
    return [{
      type: 'defend',
      user: defender.combatId,
      message: `${defender.name} takes a defensive stance.`
    }];
  }

  /**
   * Execute flee attempt
   */
  async executeFlee(fleer) {
    const results = [];
    
    // Can't flee if restrained
    if (fleer.restraintState) {
      return [{
        type: 'fleeFailed',
        reason: 'restrained',
        message: `${fleer.name} cannot flee while restrained!`
      }];
    }
    
    // Calculate flee chance
    const baseFleeChance = 50;
    const speedBonus = (fleer.stats?.evasion || 0) * 2;
    
    // Penalty based on enemy count
    const aliveEnemies = this.combatants.filter(c => !c.isPlayer && c.currentHp > 0);
    const enemyPenalty = (aliveEnemies.length - 1) * 10;
    
    const fleeChance = Math.max(10, Math.min(90, baseFleeChance + speedBonus - enemyPenalty));
    const fleeRoll = Math.random() * 100;
    
    if (fleeRoll < fleeChance) {
      this.playerFled = true;
      this.combatEnded = true;
      this.phase = COMBAT_PHASE.FLED;
      
      results.push({
        type: 'fleeSuccess',
        message: `${fleer.name} successfully escapes!`
      });
      
      this.addLog({ type: 'flee', success: true, user: fleer.name });
    } else {
      results.push({
        type: 'fleeFailed',
        reason: 'caught',
        message: `${fleer.name} failed to escape!`
      });
      
      this.addLog({ type: 'flee', success: false, user: fleer.name });
    }
    
    return results;
  }

  /**
   * Execute struggle against restraint
   */
  async executeStruggle(struggler) {
    const results = [];
    
    if (!struggler.restraintState) {
      return [{ type: 'error', message: 'Not restrained' }];
    }
    
    // Calculate struggle damage to restraint
    const strengthMod = struggler.stats?.strength || 10;
    const struggleDamage = 5 + Math.floor(strengthMod / 2) + Math.floor(Math.random() * 5);
    
    struggler.restraintState.hp -= struggleDamage;
    
    results.push({
      type: 'struggle',
      user: struggler.combatId,
      damage: struggleDamage,
      remainingHp: struggler.restraintState.hp,
      message: `${struggler.name} struggles against the restraints! (${struggleDamage} damage)`
    });
    
    // Check if restraint is broken
    if (struggler.restraintState.hp <= 0) {
      struggler.restraintState = null;
      
      results.push({
        type: 'restraintBroken',
        user: struggler.combatId,
        message: `${struggler.name} breaks free!`
      });
      
      await this.effectSystem?.processTrigger(TRIGGERS.ON_ESCAPE, struggler, {});
      
      this.addLog({ type: 'escape', user: struggler.name });
    } else {
      this.addLog({ type: 'struggle', user: struggler.name, damage: struggleDamage });
    }
    
    return results;
  }

  /**
   * Execute surrender
   */
  async executeSurrender(surrenderer) {
    this.playerSurrendered = true;
    this.combatEnded = true;
    this.phase = COMBAT_PHASE.SURRENDERED;
    
    this.addLog({ type: 'surrender', user: surrenderer.name });
    
    return [{
      type: 'surrender',
      user: surrenderer.combatId,
      message: `${surrenderer.name} surrenders!`
    }];
  }

  /**
   * Execute enemy AI turn
   */
  async executeEnemyTurn() {
    if (this.phase !== COMBAT_PHASE.ENEMY_TURN) {
      return { success: false, error: 'Not enemy turn' };
    }
    
    const enemy = this.turnOrder[this.currentTurnIndex];
    const player = this.combatants.find(c => c.isPlayer);
    const results = [];
    
    // Simple AI: attack, use skill, or apply restraint
    const action = this.determineEnemyAction(enemy, player);
    
    switch (action.type) {
      case 'attack':
        results.push(...await this.executeAttack(enemy, 'player'));
        break;
        
      case 'skill':
        results.push(...await this.executeSkill(enemy, action.skillId, 'player'));
        break;
        
      case 'restrain':
        results.push(...await this.executeRestrain(enemy, player));
        break;
        
      case 'nsfw':
        // NSFW action when player is restrained
        results.push(...await this.executeNsfwAction(enemy, player, action.actionId));
        break;
    }
    
    // Check for combat end
    if (this.checkCombatEnd()) {
      return { success: true, results, state: this.getCombatState() };
    }
    
    // Advance turn
    await this.advanceTurn();
    
    return { success: true, results, state: this.getCombatState() };
  }

  /**
   * Determine enemy action (simple AI)
   */
  determineEnemyAction(enemy, player) {
    // If player is restrained, chance for NSFW action
    if (player.restraintState && enemy.nsfwActions?.length > 0) {
      if (Math.random() < 0.6) { // 60% chance
        const action = enemy.nsfwActions[Math.floor(Math.random() * enemy.nsfwActions.length)];
        return { type: 'nsfw', actionId: action };
      }
    }
    
    // Try to restrain if player isn't restrained and enemy has ability
    if (!player.restraintState && enemy.canRestrain && Math.random() < 0.3) {
      return { type: 'restrain' };
    }
    
    // Use skill if available and has stamina
    if (enemy.skills?.length > 0 && enemy.currentStamina > 10) {
      const availableSkills = enemy.skills.filter(s => 
        !enemy.skillCooldowns?.[s] || enemy.skillCooldowns[s] <= 0
      );
      
      if (availableSkills.length > 0 && Math.random() < 0.4) {
        return { 
          type: 'skill', 
          skillId: availableSkills[Math.floor(Math.random() * availableSkills.length)]
        };
      }
    }
    
    // Default to attack
    return { type: 'attack' };
  }

  /**
   * Execute restrain attack
   */
  async executeRestrain(enemy, target) {
    const results = [];
    
    // Hit check
    const hitChance = calculateHitChance(enemy, target, this.effectSystem) - 20; // Harder to restrain
    if (Math.random() * 100 > hitChance) {
      results.push({
        type: 'restrainFailed',
        attacker: enemy.combatId,
        target: target.combatId,
        message: `${enemy.name} tries to grab ${target.name} but misses!`
      });
      return results;
    }
    
    // Apply restraint
    target.restraintState = {
      type: enemy.restraintType || 'grab',
      hp: enemy.restraintHp || 50,
      source: enemy.combatId
    };
    
    results.push({
      type: 'restrained',
      attacker: enemy.combatId,
      target: target.combatId,
      restraintType: target.restraintState.type,
      message: `${enemy.name} restrains ${target.name}!`
    });
    
    await this.effectSystem?.processTrigger(TRIGGERS.ON_RESTRAIN, target, { source: enemy });
    
    this.addLog({ type: 'restrain', attacker: enemy.name, target: target.name });
    
    return results;
  }

  /**
   * Execute NSFW action (when player is restrained)
   */
  async executeNsfwAction(enemy, target, actionId) {
    const results = [];
    
    // Get action data
    const action = enemy.nsfwActionData?.[actionId] || {
      name: 'Unknown Action',
      corruptionGain: 5,
      arousaGain: 2
    };
    
    results.push({
      type: 'nsfwAction',
      attacker: enemy.combatId,
      target: target.combatId,
      actionName: action.name,
      message: action.description || `${enemy.name} does something to ${target.name}...`
    });
    
    // Apply effects
    if (action.corruptionGain && this.callbacks.modifyCorruption) {
      await this.callbacks.modifyCorruption(action.corruptionGain);
    }
    
    if (action.arousalEffect) {
      await this.effectSystem?.applyEffect('aroused', target, enemy, {
        stacks: action.arousalEffect
      });
    }
    
    if (action.applyEffect) {
      await this.effectSystem?.applyEffect(action.applyEffect, target, enemy);
    }
    
    // Check for scene trigger
    if (action.triggerScene && this.callbacks.triggerScene) {
      await this.callbacks.triggerScene(action.triggerScene);
    }
    
    this.addLog({ type: 'nsfwAction', attacker: enemy.name, action: action.name });
    
    return results;
  }

  /**
   * Advance to next turn
   */
  async advanceTurn() {
    // Tick effects for current combatant
    const current = this.turnOrder[this.currentTurnIndex];
    await this.effectSystem?.tickEffects(current, 'turn', { gameState: {} });
    
    // Reduce cooldowns
    if (current.skillCooldowns) {
      for (const skill of Object.keys(current.skillCooldowns)) {
        current.skillCooldowns[skill] = Math.max(0, current.skillCooldowns[skill] - 1);
      }
    }
    
    // Move to next turn
    this.currentTurnIndex++;
    
    // If end of round, start new round
    if (this.currentTurnIndex >= this.turnOrder.length) {
      this.currentTurnIndex = 0;
      this.round++;
      
      // Recalculate turn order (entities may have died or speed changed)
      this.turnOrder = this.combatants
        .filter(c => c.currentHp > 0)
        .sort((a, b) => b.initiative - a.initiative);
      
      this.addLog({
        type: 'newRound',
        round: this.round,
        message: `Round ${this.round}!`
      });
    }
    
    // Determine phase
    const nextCombatant = this.turnOrder[this.currentTurnIndex];
    if (nextCombatant) {
      this.phase = nextCombatant.isPlayer ? COMBAT_PHASE.PLAYER_TURN : COMBAT_PHASE.ENEMY_TURN;
    }
  }

  /**
   * Check if combat has ended
   */
  checkCombatEnd() {
    if (this.combatEnded) return true;
    
    const player = this.combatants.find(c => c.isPlayer);
    const aliveEnemies = this.combatants.filter(c => !c.isPlayer && c.currentHp > 0);
    
    if (player.currentHp <= 0) {
      this.combatEnded = true;
      this.phase = COMBAT_PHASE.DEFEAT;
      this.addLog({ type: 'defeat', message: 'You have been defeated!' });
      return true;
    }
    
    if (aliveEnemies.length === 0) {
      this.combatEnded = true;
      this.phase = COMBAT_PHASE.VICTORY;
      this.addLog({ type: 'victory', message: 'Victory!' });
      return true;
    }
    
    return false;
  }

  /**
   * Get combat result
   */
  getCombatResult() {
    return {
      phase: this.phase,
      victory: this.phase === COMBAT_PHASE.VICTORY,
      defeat: this.phase === COMBAT_PHASE.DEFEAT,
      fled: this.phase === COMBAT_PHASE.FLED,
      surrendered: this.phase === COMBAT_PHASE.SURRENDERED,
      rounds: this.round,
      defeatedEnemies: this.combatants
        .filter(c => !c.isPlayer && c.currentHp <= 0)
        .map(c => ({ id: c.id, name: c.name, loot: c.loot })),
      player: this.combatants.find(c => c.isPlayer)
    };
  }

  /**
   * Check if player can flee
   */
  canFlee() {
    const player = this.combatants.find(c => c.isPlayer);
    return player && !player.restraintState && !this.combatEnded;
  }

  /**
   * Trigger combat start effects
   */
  async triggerCombatStart() {
    for (const combatant of this.combatants) {
      await this.effectSystem?.processTrigger(TRIGGERS.ON_COMBAT_START, combatant, {});
    }
  }

  /**
   * Add entry to combat log
   */
  addLog(entry) {
    this.log.push({
      ...entry,
      timestamp: Date.now(),
      round: this.round
    });
  }
}

export default CombatSystem;
