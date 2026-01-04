/**
 * CombatController - Combat logic and state management
 *
 * Handles:
 * - Damage calculations (attack, defense, skills)
 * - Turn order and enemy AI
 * - Loot generation and XP rewards
 * - Flee/surrender mechanics
 * - Arousal tracking for scene selection
 * - Combat effects and status
 */

// Combat outcome types
export const COMBAT_OUTCOME = {
  ONGOING: 'ongoing',
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
  TRUE: 'true'
};

/**
 * Combat Controller Class
 */
export class CombatController {
  constructor(options = {}) {
    this.registry = options.registry;
    this.sceneSelector = options.sceneSelector;
    this.lootTableSystem = options.lootTableSystem;
    this.callbacks = options.callbacks || {};

    // Combat state
    this.player = null;
    this.enemies = [];
    this.turn = 0;
    this.round = 1;
    this.isPlayerTurn = true;
    this.outcome = COMBAT_OUTCOME.ONGOING;
    this.combatLog = [];

    // Player combat buffs (temporary)
    this.playerBuffs = {
      defending: false,
      defenseMultiplier: 1,
      evasionBonus: 0
    };
  }

  /**
   * Initialize combat with player and enemies
   */
  initCombat(player, enemyData) {
    this.player = {
      ...player,
      originalStats: { ...player.stats }
    };

    this.enemies = enemyData.map((enemy, index) => ({
      ...enemy,
      combatId: `enemy_${index}`,
      currentHp: enemy.maxHp || enemy.hp || 50,
      maxHp: enemy.maxHp || enemy.hp || 50,
      currentStamina: enemy.maxStamina || 100,
      maxStamina: enemy.maxStamina || 100,
      arousalLevel: 0,
      aroused: false,
      activeEffects: []
    }));

    this.turn = 0;
    this.round = 1;
    this.isPlayerTurn = this.calculateFirstTurn();
    this.outcome = COMBAT_OUTCOME.ONGOING;
    this.combatLog = [];
    this.playerBuffs = {
      defending: false,
      defenseMultiplier: 1,
      evasionBonus: 0
    };

    this.log('Combat begins!', 'system');

    return this.getCombatState();
  }

  /**
   * Calculate who goes first based on speed stats
   */
  calculateFirstTurn() {
    const playerSpeed = this.player.stats?.speed || this.player.stats?.evasion || 10;
    const avgEnemySpeed = this.enemies.reduce((sum, e) =>
      sum + (e.stats?.speed || e.stats?.evasion || 10), 0) / this.enemies.length;

    // Add some randomness
    const playerRoll = playerSpeed + Math.random() * 10;
    const enemyRoll = avgEnemySpeed + Math.random() * 10;

    return playerRoll >= enemyRoll;
  }

  /**
   * Get current combat state for UI
   */
  getCombatState() {
    return {
      player: this.player,
      enemies: this.enemies,
      turn: this.turn,
      round: this.round,
      isPlayerTurn: this.isPlayerTurn,
      outcome: this.outcome,
      combatLog: this.combatLog,
      playerBuffs: this.playerBuffs
    };
  }

  /**
   * Add entry to combat log
   */
  log(message, type = 'default') {
    this.combatLog.push({
      message,
      type,
      timestamp: Date.now(),
      round: this.round
    });

    if (this.callbacks.onLogEntry) {
      this.callbacks.onLogEntry({ message, type });
    }
  }

  /**
   * Calculate player attack damage
   */
  calculatePlayerDamage(target, options = {}) {
    const { skillMultiplier = 1, damageType = DAMAGE_TYPES.PHYSICAL, baseDamage } = options;

    // Get attack stat
    let attackStat;
    if (damageType === DAMAGE_TYPES.MAGIC || damageType === DAMAGE_TYPES.PSYCHIC) {
      attackStat = this.player.stats?.intelligence || this.player.stats?.magic || 10;
    } else {
      attackStat = this.player.stats?.strength || this.player.stats?.attack || 10;
    }

    // Get weapon damage bonus
    const weaponDamage = this.player.equipment?.weapon?.damage || 0;

    // Calculate base damage
    const rawDamage = baseDamage || ((attackStat * 2) + weaponDamage);

    // Apply skill multiplier
    let damage = rawDamage * skillMultiplier;

    // Apply critical hit
    const critChance = this.player.stats?.critChance || 5;
    const isCritical = Math.random() * 100 < critChance;
    if (isCritical) {
      const critMultiplier = (this.player.stats?.critMultiplier || 150) / 100;
      damage *= critMultiplier;
    }

    // Check for resistance/weakness on target
    if (target.resistances?.[damageType]) {
      damage *= (1 - target.resistances[damageType] / 100);
    }
    if (target.weaknesses?.[damageType]) {
      damage *= (1 + target.weaknesses[damageType] / 100);
    }

    // Add variance (±10%)
    damage *= 0.9 + Math.random() * 0.2;

    return {
      damage: Math.max(1, Math.floor(damage)),
      isCritical
    };
  }

  /**
   * Calculate enemy attack damage
   */
  calculateEnemyDamage(enemy, target) {
    const attackStat = enemy.stats?.strength || enemy.stats?.attack || 10;
    const baseDamage = attackStat * 2;

    // Apply player defense
    let defense = target.stats?.vitality || target.stats?.defense || 5;

    // Apply defense buff if defending
    if (this.playerBuffs.defending) {
      defense *= this.playerBuffs.defenseMultiplier;
    }

    // Reduce damage by defense
    let damage = baseDamage - (defense * 0.5);

    // Check for hit (player evasion)
    let evasion = target.stats?.evasion || 5;
    evasion += this.playerBuffs.evasionBonus;

    const hitChance = 85 - (evasion * 2);
    if (Math.random() * 100 > hitChance) {
      return { damage: 0, missed: true };
    }

    // Add variance
    damage *= 0.9 + Math.random() * 0.2;

    return {
      damage: Math.max(1, Math.floor(damage)),
      missed: false
    };
  }

  /**
   * Player attacks a target
   */
  attack(targetIndex) {
    if (!this.isPlayerTurn || this.outcome !== COMBAT_OUTCOME.ONGOING) {
      return null;
    }

    const target = this.enemies[targetIndex];
    if (!target || target.currentHp <= 0) {
      return null;
    }

    const { damage, isCritical } = this.calculatePlayerDamage(target);

    // Apply damage
    target.currentHp = Math.max(0, target.currentHp - damage);

    // Log
    if (isCritical) {
      this.log(`Critical hit! You deal ${damage} damage to ${target.name}!`, 'critical');
    } else {
      this.log(`You attack ${target.name} for ${damage} damage.`, 'damage');
    }

    // Check if enemy defeated
    if (target.currentHp <= 0) {
      this.log(`${target.name} is defeated!`, 'system');
    }

    // Clear defend buff after action
    this.playerBuffs.defending = false;
    this.playerBuffs.defenseMultiplier = 1;

    // Check for combat end
    this.checkCombatEnd();

    if (this.outcome === COMBAT_OUTCOME.ONGOING) {
      this.endPlayerTurn();
    }

    return { damage, isCritical };
  }

  /**
   * Player defends
   */
  defend() {
    if (!this.isPlayerTurn || this.outcome !== COMBAT_OUTCOME.ONGOING) {
      return null;
    }

    const defenseBonus = Math.floor((this.player.stats?.defense || 5) * 2);

    this.playerBuffs.defending = true;
    this.playerBuffs.defenseMultiplier = 2; // Double defense

    this.log(`You take a defensive stance. Defense +${defenseBonus}% until next turn.`, 'effect');

    this.endPlayerTurn();

    return defenseBonus;
  }

  /**
   * Player uses a skill
   */
  useSkill(skill, targetIndex) {
    if (!this.isPlayerTurn || this.outcome !== COMBAT_OUTCOME.ONGOING) {
      return null;
    }

    // Check costs
    const staminaCost = skill.cost?.stamina || 0;
    const manaCost = skill.cost?.mana || 0;

    if (this.player.currentStamina < staminaCost) {
      this.log('Not enough stamina!', 'system');
      return null;
    }
    if (this.player.currentMana !== undefined && this.player.currentMana < manaCost) {
      this.log('Not enough mana!', 'system');
      return null;
    }

    // Consume resources
    this.player.currentStamina -= staminaCost;
    if (this.player.currentMana !== undefined) {
      this.player.currentMana -= manaCost;
    }

    const result = {
      skillName: skill.name
    };

    // Handle skill effects
    if (skill.effect?.damage) {
      const target = this.enemies[targetIndex];
      if (target && target.currentHp > 0) {
        const { damage, isCritical } = this.calculatePlayerDamage(target, {
          skillMultiplier: skill.effect.damage,
          damageType: skill.effect.damageType || DAMAGE_TYPES.PHYSICAL
        });

        target.currentHp = Math.max(0, target.currentHp - damage);
        result.damage = damage;
        result.isCritical = isCritical;

        this.log(`${skill.name} deals ${damage} damage to ${target.name}!`,
          isCritical ? 'critical' : 'damage');

        if (target.currentHp <= 0) {
          this.log(`${target.name} is defeated!`, 'system');
        }
      }
    }

    if (skill.effect?.heal || skill.effect?.hpRestore) {
      const healAmount = skill.effect.heal || skill.effect.hpRestore;
      const actualHeal = Math.min(healAmount, this.player.maxHp - this.player.currentHp);
      this.player.currentHp += actualHeal;
      result.heal = actualHeal;

      this.log(`${skill.name} restores ${actualHeal} HP!`, 'heal');
    }

    if (skill.effect?.evasionBoost) {
      this.playerBuffs.evasionBonus += skill.effect.evasionBoost;
      result.effect = `Evasion +${skill.effect.evasionBoost}%`;
      this.log(`${skill.name} increases evasion by ${skill.effect.evasionBoost}%!`, 'effect');
    }

    if (skill.effect?.defenseBoost) {
      this.playerBuffs.defenseMultiplier += skill.effect.defenseBoost / 100;
      result.effect = `Defense +${skill.effect.defenseBoost}%`;
      this.log(`${skill.name} increases defense by ${skill.effect.defenseBoost}%!`, 'effect');
    }

    // Clear defend buff
    this.playerBuffs.defending = false;

    // Check for combat end
    this.checkCombatEnd();

    if (this.outcome === COMBAT_OUTCOME.ONGOING) {
      this.endPlayerTurn();
    }

    return result;
  }

  /**
   * Player uses an item
   */
  useItem(item) {
    if (!this.isPlayerTurn || this.outcome !== COMBAT_OUTCOME.ONGOING) {
      return null;
    }

    const result = { itemName: item.name };

    if (item.useEffect?.type === 'heal') {
      const healAmount = typeof item.useEffect.amount === 'object'
        ? item.useEffect.amount.value
        : item.useEffect.amount;
      const actualHeal = Math.min(healAmount, this.player.maxHp - this.player.currentHp);
      this.player.currentHp += actualHeal;
      result.heal = actualHeal;

      this.log(`Used ${item.name}. Restored ${actualHeal} HP!`, 'heal');
    }

    if (item.useEffect?.type === 'restoreStamina') {
      const amount = typeof item.useEffect.amount === 'object'
        ? item.useEffect.amount.value
        : item.useEffect.amount;
      const actualRestore = Math.min(amount, this.player.maxStamina - this.player.currentStamina);
      this.player.currentStamina += actualRestore;
      result.stamina = actualRestore;

      this.log(`Used ${item.name}. Restored ${actualRestore} stamina!`, 'effect');
    }

    if (item.useEffect?.type === 'restoreMana' && this.player.currentMana !== undefined) {
      const amount = typeof item.useEffect.amount === 'object'
        ? item.useEffect.amount.value
        : item.useEffect.amount;
      const actualRestore = Math.min(amount, this.player.maxMana - this.player.currentMana);
      this.player.currentMana += actualRestore;
      result.mana = actualRestore;

      this.log(`Used ${item.name}. Restored ${actualRestore} mana!`, 'effect');
    }

    // Callback to consume item from inventory
    if (this.callbacks.onConsumeItem) {
      this.callbacks.onConsumeItem(item);
    }

    this.endPlayerTurn();

    return result;
  }

  /**
   * Attempt to flee
   */
  attemptFlee() {
    if (!this.isPlayerTurn || this.outcome !== COMBAT_OUTCOME.ONGOING) {
      return { success: false };
    }

    const playerEvasion = this.player.stats?.evasion || 10;
    const avgAggression = this.enemies.reduce((sum, e) =>
      sum + (e.ai?.aggression || 0.5), 0) / this.enemies.length;

    // Base 50% + evasion bonus - aggression penalty
    const fleeChance = Math.max(10, Math.min(90,
      50 + (playerEvasion * 2) - (avgAggression * 30)
    ));

    const roll = Math.random() * 100;

    if (roll < fleeChance) {
      this.outcome = COMBAT_OUTCOME.FLED;
      this.log('You successfully escape!', 'system');

      if (this.callbacks.onFlee) {
        this.callbacks.onFlee({ success: true });
      }

      return { success: true, fleeChance };
    } else {
      this.log('Failed to escape! The enemies block your path!', 'system');
      this.endPlayerTurn();

      return { success: false, fleeChance };
    }
  }

  /**
   * Surrender to enemies
   */
  surrender(enabledTags = []) {
    this.outcome = COMBAT_OUTCOME.SURRENDERED;
    this.log('You surrender...', 'system');

    // Determine if enemies are aroused for scene selection
    const arousedEnemies = this.enemies.filter(e =>
      e.aroused || (e.arousalLevel && e.arousalLevel > 50)
    );

    // Select appropriate scene
    const surrenderData = {
      enemies: this.enemies,
      player: this.player,
      arousedEnemies,
      isAroused: arousedEnemies.length > 0,
      enabledTags
    };

    // Use scene selector if available
    if (this.sceneSelector) {
      const dominantEnemy = this.getDominantEnemy();
      const scene = this.sceneSelector.selectCombatScene(
        dominantEnemy,
        'surrender',
        {
          stats: this.player.stats,
          nsfwStats: this.player.nsfwStats
        }
      );
      surrenderData.selectedScene = scene;
    }

    if (this.callbacks.onSurrender) {
      this.callbacks.onSurrender(surrenderData);
    }

    return surrenderData;
  }

  /**
   * Get the most powerful/important enemy (for scene selection)
   */
  getDominantEnemy() {
    return this.enemies.reduce((dominant, current) => {
      const currentScore = (current.tier || 1) * 100 + (current.level || 1);
      const dominantScore = (dominant.tier || 1) * 100 + (dominant.level || 1);
      return currentScore > dominantScore ? current : dominant;
    }, this.enemies[0]);
  }

  /**
   * End player turn and process enemy turns
   */
  endPlayerTurn() {
    this.isPlayerTurn = false;
    this.turn++;

    // Process enemy turns
    this.processEnemyTurns();
  }

  /**
   * Process all enemy turns
   */
  processEnemyTurns() {
    for (const enemy of this.enemies) {
      if (enemy.currentHp <= 0) continue;
      if (this.outcome !== COMBAT_OUTCOME.ONGOING) break;

      this.processEnemyTurn(enemy);
    }

    // Check for combat end after all enemy turns
    this.checkCombatEnd();

    if (this.outcome === COMBAT_OUTCOME.ONGOING) {
      this.startNewRound();
    }
  }

  /**
   * Process single enemy turn
   */
  processEnemyTurn(enemy) {
    const action = this.determineEnemyAction(enemy);

    switch (action.type) {
      case 'attack':
        this.enemyAttack(enemy);
        break;
      case 'skill':
        this.enemyUseSkill(enemy, action.skill);
        break;
      case 'grapple':
        this.enemyGrapple(enemy);
        break;
    }

    // Increase enemy arousal if player has certain states
    if (this.player.nsfwStats?.exposure > 50 || this.player.restraintState) {
      enemy.arousalLevel = (enemy.arousalLevel || 0) + 5;
      if (enemy.arousalLevel >= 50) {
        enemy.aroused = true;
      }
    }
  }

  /**
   * Determine what action an enemy will take
   */
  determineEnemyAction(enemy) {
    // Check for grapple attempt
    if (!this.player.restraintState && enemy.canRestrain && Math.random() < (enemy.grappleChance || 20) / 100) {
      return { type: 'grapple' };
    }

    // Check for skill use
    if (enemy.skills?.length > 0 && Math.random() < 0.3) {
      const skill = enemy.skills[Math.floor(Math.random() * enemy.skills.length)];
      return { type: 'skill', skill };
    }

    // Default to attack
    return { type: 'attack' };
  }

  /**
   * Enemy basic attack
   */
  enemyAttack(enemy) {
    const { damage, missed } = this.calculateEnemyDamage(enemy, this.player);

    if (missed) {
      this.log(`${enemy.name}'s attack missed!`, 'miss');
      return;
    }

    this.player.currentHp = Math.max(0, this.player.currentHp - damage);
    this.log(`${enemy.name} attacks you for ${damage} damage!`, 'damage');
  }

  /**
   * Enemy uses a skill
   */
  enemyUseSkill(enemy, skillId) {
    // For now, just do a stronger attack
    const { damage, missed } = this.calculateEnemyDamage(enemy, this.player);

    if (missed) {
      this.log(`${enemy.name}'s ${skillId} missed!`, 'miss');
      return;
    }

    const enhancedDamage = Math.floor(damage * 1.5);
    this.player.currentHp = Math.max(0, this.player.currentHp - enhancedDamage);
    this.log(`${enemy.name} uses ${skillId}! ${enhancedDamage} damage!`, 'damage');
  }

  /**
   * Enemy attempts to grapple player
   */
  enemyGrapple(enemy) {
    const grappleChance = 60 - (this.player.stats?.evasion || 5) * 2;

    if (Math.random() * 100 < grappleChance) {
      this.player.restraintState = {
        type: enemy.restraintType || 'grab',
        hp: enemy.restraintHp || 50,
        maxHp: enemy.restraintHp || 50,
        source: enemy.combatId
      };
      this.log(`${enemy.name} grapples you!`, 'effect');

      // Increase enemy arousal on successful grapple
      enemy.arousalLevel = (enemy.arousalLevel || 0) + 10;
    } else {
      this.log(`${enemy.name} tries to grab you but you evade!`, 'miss');
    }
  }

  /**
   * Start a new round
   */
  startNewRound() {
    this.round++;
    this.isPlayerTurn = true;

    // Clear temporary buffs
    this.playerBuffs.evasionBonus = Math.max(0, this.playerBuffs.evasionBonus - 25);

    // Regenerate some stamina
    this.player.currentStamina = Math.min(
      this.player.maxStamina,
      this.player.currentStamina + 5
    );

    this.log(`Round ${this.round} begins.`, 'system');
  }

  /**
   * Check if combat has ended
   */
  checkCombatEnd() {
    // Check player defeat
    if (this.player.currentHp <= 0) {
      this.outcome = COMBAT_OUTCOME.DEFEAT;
      this.log('You have been defeated...', 'system');

      if (this.callbacks.onDefeat) {
        this.callbacks.onDefeat(this.generateDefeatResult());
      }
      return true;
    }

    // Check victory
    const aliveEnemies = this.enemies.filter(e => e.currentHp > 0);
    if (aliveEnemies.length === 0) {
      this.outcome = COMBAT_OUTCOME.VICTORY;
      this.log('Victory!', 'system');

      if (this.callbacks.onVictory) {
        this.callbacks.onVictory(this.generateVictoryResult());
      }
      return true;
    }

    return false;
  }

  /**
   * Generate victory result with XP and loot
   */
  generateVictoryResult() {
    // Calculate total XP
    const totalExp = this.enemies.reduce((sum, enemy) =>
      sum + (enemy.experience || enemy.level * 10), 0
    );

    // Generate loot from enemies
    const loot = [];

    for (const enemy of this.enemies) {
      if (enemy.loot) {
        for (const lootEntry of enemy.loot) {
          if (lootEntry.chance && Math.random() > lootEntry.chance) {
            continue;
          }

          let count = 1;
          if (lootEntry.min !== undefined && lootEntry.max !== undefined) {
            count = Math.floor(Math.random() * (lootEntry.max - lootEntry.min + 1)) + lootEntry.min;
          } else if (lootEntry.count) {
            count = typeof lootEntry.count === 'object'
              ? Math.floor(Math.random() * (lootEntry.count.max - lootEntry.count.min + 1)) + lootEntry.count.min
              : lootEntry.count;
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
    }

    // Merge duplicate items
    const mergedLoot = this.mergeLoot(loot);

    return {
      outcome: COMBAT_OUTCOME.VICTORY,
      experience: totalExp,
      loot: mergedLoot,
      enemiesDefeated: this.enemies.length,
      roundsCompleted: this.round,
      player: this.player
    };
  }

  /**
   * Generate defeat result
   */
  generateDefeatResult() {
    // Check for aroused enemies to determine scene type
    const arousedEnemies = this.enemies.filter(e => e.aroused);
    const dominantEnemy = this.getDominantEnemy();

    // Select defeat scene
    let selectedScene = null;
    if (this.sceneSelector) {
      selectedScene = this.sceneSelector.selectCombatScene(
        dominantEnemy,
        'defeat',
        {
          stats: this.player.stats,
          nsfwStats: this.player.nsfwStats
        }
      );
    }

    return {
      outcome: COMBAT_OUTCOME.DEFEAT,
      dominantEnemy,
      arousedEnemies,
      hasArousedEnemy: arousedEnemies.length > 0,
      selectedScene,
      player: this.player,
      roundsCompleted: this.round
    };
  }

  /**
   * Merge duplicate loot items
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
}

export default CombatController;
