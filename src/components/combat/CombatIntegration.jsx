/**
 * CombatIntegration - Bridge between Game.jsx and the new combat system
 *
 * This component:
 * - Wraps CombatScreen with game-specific logic
 * - Manages CombatController lifecycle
 * - Handles scene transitions for combat outcomes
 * - Integrates with existing player/gameState
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CombatScreen from './CombatScreen';
import { CombatController, COMBAT_OUTCOME } from './CombatController';

/**
 * Combat Integration Component
 *
 * Props:
 * @param {Object} player - Current player state from Game.jsx
 * @param {Function} setPlayer - Player state setter
 * @param {Object[]} enemies - Array of enemy data objects
 * @param {Object} gameState - Current game state
 * @param {Function} setGameState - Game state setter
 * @param {Object} registry - Data registry for lookups
 * @param {Function} onCombatEnd - Callback when combat ends
 * @param {Function} onSceneTrigger - Callback to trigger a scene
 * @param {Function} showToast - Toast notification function
 * @param {Object} CombatSystem - Legacy combat system for compatibility
 * @param {Object} GameData - Game data for legacy compatibility
 */
const CombatIntegration = ({
  player,
  setPlayer,
  enemies: initialEnemies,
  gameState,
  setGameState,
  registry,
  onCombatEnd,
  onSceneTrigger,
  showToast,
  CombatSystem,
  GameData
}) => {
  // Combat controller instance
  const [controller] = useState(() => new CombatController({
    registry,
    callbacks: {
      onLog: (message, type) => addToLog(message, type),
      onStateChange: () => updateState()
    }
  }));

  // Combat state
  const [combatState, setCombatState] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Log state (separate from controller for UI reactivity)
  const [combatLog, setCombatLog] = useState([]);

  // Get enabled tags from gameState
  const enabledTags = useMemo(() => {
    return gameState?.enabledTags || ['vanilla'];
  }, [gameState?.enabledTags]);

  /**
   * Add message to combat log
   */
  const addToLog = useCallback((message, type = 'info') => {
    setCombatLog(prev => [...prev, { type, message, timestamp: Date.now() }]);
  }, []);

  /**
   * Update local combat state from controller
   */
  const updateState = useCallback(() => {
    if (controller) {
      setCombatState(controller.getCombatState());
    }
  }, [controller]);

  /**
   * Initialize combat on mount
   */
  useEffect(() => {
    if (!isInitialized && initialEnemies && initialEnemies.length > 0) {
      const state = controller.initCombat(player, initialEnemies);
      setCombatState(state);
      setIsInitialized(true);
      addToLog('Combat begins!', 'system');
    }
  }, [controller, player, initialEnemies, isInitialized, addToLog]);

  /**
   * Handle player attack
   */
  const handleAttack = useCallback((targetIndex) => {
    if (!controller || !combatState?.isPlayerTurn) return;

    const result = controller.attack(targetIndex);

    if (result.hit) {
      const message = result.critical
        ? `Critical hit! You deal ${result.damage} damage to ${result.target.name}!`
        : `You attack ${result.target.name} for ${result.damage} damage.`;
      addToLog(message, result.critical ? 'critical' : 'player_action');

      if (result.killed) {
        addToLog(`${result.target.name} is defeated!`, 'victory');
        showToast?.combat?.(`${result.target.name} defeated!`);
      }
    } else {
      addToLog(`${result.target.name} evades your attack!`, 'enemy_action');
    }

    // Process enemy turns if combat is ongoing
    if (controller.outcome === COMBAT_OUTCOME.ONGOING) {
      processEnemyTurns();
    } else {
      handleCombatEnd(controller.outcome);
    }

    updateState();
  }, [controller, combatState, addToLog, showToast, updateState]);

  /**
   * Handle player defend
   */
  const handleDefend = useCallback(() => {
    if (!controller || !combatState?.isPlayerTurn) return;

    controller.defend();
    const defensePercent = Math.round((controller.playerBuffs.defenseMultiplier - 1) * 100);
    addToLog(`You take a defensive stance. (+${defensePercent}% damage reduction)`, 'player_action');

    processEnemyTurns();
    updateState();
  }, [controller, combatState, addToLog, updateState]);

  /**
   * Handle skill use
   */
  const handleUseSkill = useCallback((skill, targetIndex) => {
    if (!controller || !combatState?.isPlayerTurn) return;

    const result = controller.useSkill(skill, targetIndex);

    if (!result.success) {
      addToLog(result.reason || 'Cannot use skill.', 'error');
      showToast?.warning?.('Cannot use skill', result.reason);
      return;
    }

    addToLog(`You use ${skill.name}!`, 'skill');

    if (result.damage) {
      addToLog(`Dealt ${result.damage} ${skill.damageType || 'magical'} damage.`, 'damage');
    }
    if (result.heal) {
      addToLog(`Recovered ${result.heal} HP.`, 'heal');
    }

    // Update player stamina/mana
    setPlayer(prev => ({
      ...prev,
      currentStamina: Math.max(0, prev.currentStamina - (skill.staminaCost || 0)),
      currentMana: Math.max(0, (prev.currentMana || 0) - (skill.manaCost || 0))
    }));

    if (controller.outcome === COMBAT_OUTCOME.ONGOING) {
      processEnemyTurns();
    } else {
      handleCombatEnd(controller.outcome);
    }

    updateState();
  }, [controller, combatState, addToLog, setPlayer, showToast, updateState]);

  /**
   * Handle item use in combat
   */
  const handleUseItem = useCallback((item) => {
    if (!controller || !combatState?.isPlayerTurn) return;

    const result = controller.useItem(item);

    if (!result.success) {
      addToLog(result.reason || 'Cannot use item.', 'error');
      return;
    }

    addToLog(`You use ${item.name}.`, 'player_action');

    // Apply item effects to player
    if (result.healAmount) {
      setPlayer(prev => ({
        ...prev,
        currentHp: Math.min(prev.maxHp, prev.currentHp + result.healAmount)
      }));
      addToLog(`Recovered ${result.healAmount} HP.`, 'heal');
    }

    if (result.staminaAmount) {
      setPlayer(prev => ({
        ...prev,
        currentStamina: Math.min(prev.maxStamina, prev.currentStamina + result.staminaAmount)
      }));
    }

    // Remove item from inventory
    setPlayer(prev => ({
      ...prev,
      inventory: prev.inventory.filter((inv, idx) => {
        if (inv.id === item.id) {
          if (inv.count > 1) {
            return { ...inv, count: inv.count - 1 };
          }
          return false;
        }
        return true;
      })
    }));

    if (controller.outcome === COMBAT_OUTCOME.ONGOING) {
      processEnemyTurns();
    }

    updateState();
  }, [controller, combatState, addToLog, setPlayer, updateState]);

  /**
   * Handle dropping item
   */
  const handleDropItem = useCallback((item) => {
    addToLog(`You drop ${item.name}.`, 'info');

    setPlayer(prev => ({
      ...prev,
      inventory: prev.inventory.filter((inv) => {
        if (inv.id === item.id) {
          if (inv.count > 1) {
            return { ...inv, count: inv.count - 1 };
          }
          return false;
        }
        return true;
      })
    }));
  }, [addToLog, setPlayer]);

  /**
   * Handle flee attempt
   */
  const handleFlee = useCallback(() => {
    if (!controller) return;

    const result = controller.attemptFlee();

    if (result.success) {
      addToLog('You escape from combat!', 'success');
      showToast?.escape?.(true);

      // Update player stats
      setPlayer(prev => ({
        ...prev,
        stats_tracking: {
          ...prev.stats_tracking,
          combatsFled: (prev.stats_tracking?.combatsFled || 0) + 1
        }
      }));

      handleCombatEnd(COMBAT_OUTCOME.FLED);
    } else {
      addToLog(`Failed to escape! (${result.fleeChance}% chance)`, 'warning');
      showToast?.escape?.(false);

      // Enemy gets a free turn
      processEnemyTurns();
    }

    updateState();
  }, [controller, addToLog, showToast, setPlayer, updateState]);

  /**
   * Handle surrender
   */
  const handleSurrender = useCallback(() => {
    if (!controller) return;

    const result = controller.surrender(enabledTags);

    addToLog('You surrender...', 'defeat');

    // Check if any enemy is aroused for scene selection
    const arousedEnemy = combatState?.enemies?.find(e => e.aroused || e.arousalLevel > 50);

    if (result.scene) {
      // Trigger selected scene
      onSceneTrigger?.(result.scene, {
        enemy: result.enemy,
        isAroused: result.isAroused,
        outcomeType: 'surrender'
      });
    } else {
      // No scene, just end combat
      handleCombatEnd(COMBAT_OUTCOME.SURRENDERED, {
        enemy: result.enemy,
        isAroused: result.isAroused
      });
    }
  }, [controller, combatState, enabledTags, addToLog, onSceneTrigger]);

  /**
   * Process all enemy turns
   */
  const processEnemyTurns = useCallback(() => {
    if (!controller) return;

    const enemyResults = controller.processEnemyTurns();

    for (const result of enemyResults) {
      if (result.action === 'attack') {
        const message = result.critical
          ? `Critical! ${result.attacker.name} hits you for ${result.damage} damage!`
          : `${result.attacker.name} attacks for ${result.damage} damage.`;
        addToLog(message, result.critical ? 'critical' : 'enemy_action');

        // Apply damage to player
        setPlayer(prev => ({
          ...prev,
          currentHp: Math.max(0, prev.currentHp - result.actualDamage)
        }));

        // Check for player defeat
        if (result.playerDefeated) {
          addToLog('You have been defeated...', 'defeat');
          handleCombatEnd(COMBAT_OUTCOME.DEFEAT);
          return;
        }
      } else if (result.action === 'skill') {
        addToLog(`${result.attacker.name} uses ${result.skillName}!`, 'enemy_action');
      } else if (result.action === 'nsfw') {
        // Handle NSFW actions
        addToLog(`${result.attacker.name} ${result.description}`, 'nsfw');

        if (result.arousalGain) {
          // Increase enemy arousal (affects scene selection on surrender)
          controller.enemies = controller.enemies.map(e =>
            e.combatId === result.attacker.combatId
              ? { ...e, arousalLevel: (e.arousalLevel || 0) + result.arousalGain }
              : e
          );
        }
      }
    }

    // Reset player defend buff at end of round
    controller.playerBuffs.defending = false;
    controller.playerBuffs.defenseMultiplier = 1;

    updateState();
  }, [controller, addToLog, setPlayer, updateState]);

  /**
   * Handle victory
   */
  const handleVictory = useCallback(() => {
    const result = controller.generateVictoryResult();

    // Calculate XP and level up
    const expGained = result.experience;
    const newExp = player.experience + expGained;
    const levelsGained = Math.floor(newExp / player.experienceToNext);

    // Update player state
    setPlayer(prev => {
      const newLevel = prev.level + levelsGained;
      const newExpToNext = levelsGained > 0
        ? Math.floor(prev.experienceToNext * 1.5)
        : prev.experienceToNext;

      return {
        ...prev,
        inventory: [...prev.inventory, ...result.loot],
        experience: newExp % prev.experienceToNext,
        experienceToNext: newExpToNext,
        level: newLevel,
        skillPoints: prev.skillPoints + (levelsGained * 2),
        stats_tracking: {
          ...prev.stats_tracking,
          enemiesDefeated: (prev.stats_tracking?.enemiesDefeated || 0) + result.enemiesDefeated,
          combatsWon: (prev.stats_tracking?.combatsWon || 0) + 1,
          itemsFound: (prev.stats_tracking?.itemsFound || 0) + result.loot.length
        }
      };
    });

    // Show notifications
    showToast?.success?.('Victory!', `Defeated ${result.enemiesDefeated} enemies`);
    showToast?.experience?.(expGained, newExp % player.experienceToNext, player.experienceToNext);

    if (levelsGained > 0) {
      setTimeout(() => {
        showToast?.levelUp?.(player.level + levelsGained, levelsGained * 2);
      }, 500);
    }

    // Show loot
    result.loot.forEach((item, index) => {
      setTimeout(() => {
        showToast?.item?.(item.name, item.rarity, item.count);
      }, 200 + (index * 150));
    });

    // Trigger victory scene if available
    if (result.scene) {
      onSceneTrigger?.(result.scene, { outcomeType: 'victory' });
    }

    onCombatEnd?.('victory', result);
  }, [controller, player, setPlayer, showToast, onSceneTrigger, onCombatEnd]);

  /**
   * Handle defeat
   */
  const handleDefeat = useCallback(() => {
    const result = controller.generateDefeatResult();

    addToLog('You have been defeated...', 'defeat');

    // Check for aroused enemy
    const arousedEnemy = combatState?.enemies?.find(e => e.aroused || e.arousalLevel > 50);

    if (result.scene) {
      onSceneTrigger?.(result.scene, {
        enemy: result.enemy,
        isAroused: arousedEnemy != null,
        outcomeType: 'defeat'
      });
    }

    onCombatEnd?.('defeat', result);
  }, [controller, combatState, addToLog, onSceneTrigger, onCombatEnd]);

  /**
   * Handle combat end
   */
  const handleCombatEnd = useCallback((outcome, data = {}) => {
    switch (outcome) {
      case COMBAT_OUTCOME.VICTORY:
        handleVictory();
        break;
      case COMBAT_OUTCOME.DEFEAT:
        handleDefeat();
        break;
      case COMBAT_OUTCOME.FLED:
        onCombatEnd?.('fled', data);
        break;
      case COMBAT_OUTCOME.SURRENDERED:
        onCombatEnd?.('surrendered', data);
        break;
    }
  }, [handleVictory, handleDefeat, onCombatEnd]);

  // Check for combat end conditions after state updates
  useEffect(() => {
    if (!combatState || !isInitialized) return;

    // Victory check
    if (combatState.enemies?.every(e => e.currentHp <= 0)) {
      if (controller.outcome === COMBAT_OUTCOME.ONGOING) {
        controller.outcome = COMBAT_OUTCOME.VICTORY;
        handleCombatEnd(COMBAT_OUTCOME.VICTORY);
      }
    }

    // Defeat check
    if (player.currentHp <= 0) {
      if (controller.outcome === COMBAT_OUTCOME.ONGOING) {
        controller.outcome = COMBAT_OUTCOME.DEFEAT;
        handleCombatEnd(COMBAT_OUTCOME.DEFEAT);
      }
    }
  }, [combatState, isInitialized, player.currentHp, controller, handleCombatEnd]);

  // Get player skills from game data
  const playerSkills = useMemo(() => {
    if (!player.skills || !GameData?.skills) return [];
    return player.skills.map(skillId =>
      GameData.skills.find(s => s.id === skillId)
    ).filter(Boolean);
  }, [player.skills, GameData]);

  // Loading state
  if (!combatState || !isInitialized) {
    return (
      <div className="combat-loading">
        <div>Preparing for combat...</div>
      </div>
    );
  }

  return (
    <CombatScreen
      player={{
        ...player,
        currentHp: player.currentHp,
        maxHp: player.maxHp,
        currentStamina: player.currentStamina,
        maxStamina: player.maxStamina,
        currentMana: player.currentMana,
        maxMana: player.maxMana
      }}
      enemies={combatState.enemies}
      playerSkills={playerSkills}
      playerInventory={player.inventory}
      combatLog={combatLog}
      isPlayerTurn={combatState.isPlayerTurn}
      onAttack={handleAttack}
      onDefend={handleDefend}
      onUseSkill={handleUseSkill}
      onUseItem={handleUseItem}
      onDropItem={handleDropItem}
      onFlee={handleFlee}
      onSurrender={handleSurrender}
      onVictory={handleVictory}
      onDefeat={handleDefeat}
      enabledTags={enabledTags}
    />
  );
};

export default CombatIntegration;
