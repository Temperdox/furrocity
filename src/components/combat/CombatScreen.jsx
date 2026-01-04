/**
 * CombatScreen - Full-featured combat UI with split layout
 *
 * Features:
 * - Split horizontal layout (visual top, interaction bottom)
 * - Three image areas (enemy, event, player)
 * - Multi-state button navigation with back button
 * - Combat log with action descriptions
 * - Skill/item tooltips on hover
 * - Inventory integration for combat items
 * - Flee, surrender, and arousal mechanics
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import './CombatScreen.css';

// Button navigation states
const MENU_STATE = {
  MAIN: 'main',           // Fight, Surrender, Flee
  FIGHT: 'fight',         // Attack, Skills, Defend, Items
  ATTACK: 'attack',       // Enemy selection
  SKILLS: 'skills',       // Skill list
  ITEMS: 'items',         // Inventory
  CONFIRM_SURRENDER: 'confirm_surrender',
  CONFIRM_FLEE: 'confirm_flee'
};

// Combat result types
const COMBAT_RESULT = {
  ONGOING: 'ongoing',
  VICTORY: 'victory',
  DEFEAT: 'defeat',
  FLED: 'fled',
  SURRENDERED: 'surrendered'
};

/**
 * Progress bar component for HP/Stamina display
 */
const ProgressBar = ({ value, max, color, label, showValue = true }) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className="combat-progress-bar">
      {label && <span className="combat-progress-label">{label}</span>}
      <div className="combat-progress-track">
        <div
          className="combat-progress-fill"
          style={{ width: `${percentage}%`, background: color }}
        />
      </div>
      {showValue && (
        <span className="combat-progress-value">{Math.floor(value)}/{max}</span>
      )}
    </div>
  );
};

/**
 * Tooltip component for hover info
 */
const Tooltip = ({ children, content, position = 'top' }) => {
  const [show, setShow] = useState(false);

  return (
    <div
      className="combat-tooltip-wrapper"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && content && (
        <div className={`combat-tooltip combat-tooltip-${position}`}>
          {content}
        </div>
      )}
    </div>
  );
};

/**
 * Combat action button with optional tooltip
 */
const CombatButton = ({
  onClick,
  disabled,
  variant = 'default',
  tooltip,
  children,
  className = ''
}) => {
  const button = (
    <button
      className={`combat-button combat-button-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );

  if (tooltip) {
    return <Tooltip content={tooltip}>{button}</Tooltip>;
  }

  return button;
};

/**
 * Combat log entry with timestamp
 */
const CombatLogEntry = ({ entry }) => {
  const getEntryClass = () => {
    if (entry.type === 'damage') return 'combat-log-damage';
    if (entry.type === 'heal') return 'combat-log-heal';
    if (entry.type === 'effect') return 'combat-log-effect';
    if (entry.type === 'system') return 'combat-log-system';
    if (entry.type === 'critical') return 'combat-log-critical';
    if (entry.type === 'miss') return 'combat-log-miss';
    return 'combat-log-default';
  };

  return (
    <div className={`combat-log-entry ${getEntryClass()}`}>
      <span className="combat-log-text">{entry.message}</span>
    </div>
  );
};

/**
 * Context menu for inventory items in combat
 */
const CombatContextMenu = ({ x, y, item, onUse, onDrop, onClose }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const canUse = item.useEffect || item.type === 'consumable';

  return (
    <div
      ref={menuRef}
      className="combat-context-menu"
      style={{ left: x, top: y }}
    >
      <div className="combat-context-header">{item.name}</div>
      {canUse && (
        <div className="combat-context-item" onClick={() => onUse(item)}>
          Use Item
        </div>
      )}
      <div className="combat-context-item combat-context-danger" onClick={() => onDrop(item)}>
        Drop Item
      </div>
    </div>
  );
};

/**
 * Main Combat Screen Component
 */
const CombatScreen = ({
  player,
  enemies,
  playerSkills = [],
  playerInventory = [],
  onAttack,
  onDefend,
  onUseSkill,
  onUseItem,
  onDropItem,
  onFlee,
  onSurrender,
  onVictory,
  onDefeat,
  enabledTags = [],
  defaultImages = {
    player: '/images/combat/player_default.png',
    enemy: '/images/combat/enemy_default.png',
    event: '/images/combat/event_idle.png'
  }
}) => {
  // Menu navigation state
  const [menuState, setMenuState] = useState(MENU_STATE.MAIN);
  const [menuHistory, setMenuHistory] = useState([]);

  // Combat state
  const [combatLog, setCombatLog] = useState([
    { type: 'system', message: 'Combat begins!' }
  ]);
  const [selectedTarget, setSelectedTarget] = useState(0);
  const [currentEventImage, setCurrentEventImage] = useState(defaultImages.event);
  const [combatResult, setCombatResult] = useState(COMBAT_RESULT.ONGOING);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);

  // Log ref for auto-scroll
  const logRef = useRef(null);

  // Scroll log to bottom on new entries
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [combatLog]);

  // Add message to combat log
  const addLog = useCallback((message, type = 'default') => {
    setCombatLog(prev => [...prev, { message, type, timestamp: Date.now() }]);
  }, []);

  // Navigation functions
  const navigateTo = useCallback((state) => {
    setMenuHistory(prev => [...prev, menuState]);
    setMenuState(state);
  }, [menuState]);

  const navigateBack = useCallback(() => {
    if (menuHistory.length > 0) {
      const newHistory = [...menuHistory];
      const previousState = newHistory.pop();
      setMenuHistory(newHistory);
      setMenuState(previousState);
    }
  }, [menuHistory]);

  // Check for combat end conditions
  useEffect(() => {
    const aliveEnemies = enemies.filter(e => e.currentHp > 0);

    if (aliveEnemies.length === 0 && combatResult === COMBAT_RESULT.ONGOING) {
      setCombatResult(COMBAT_RESULT.VICTORY);
      addLog('Victory! All enemies defeated!', 'system');
    }

    if (player.currentHp <= 0 && combatResult === COMBAT_RESULT.ONGOING) {
      setCombatResult(COMBAT_RESULT.DEFEAT);
      addLog('Defeated...', 'system');
    }
  }, [enemies, player.currentHp, combatResult, addLog]);

  // Calculate flee chance based on player evasion and enemy aggression
  const calculateFleeChance = useCallback(() => {
    const playerEvasion = player.stats?.evasion || 10;
    const avgAggression = enemies.reduce((sum, e) =>
      sum + (e.ai?.aggression || 0.5), 0) / enemies.length;

    // Base 50% + evasion bonus - aggression penalty
    const fleeChance = Math.max(10, Math.min(90,
      50 + (playerEvasion * 2) - (avgAggression * 30)
    ));

    return fleeChance;
  }, [player.stats?.evasion, enemies]);

  // Check if any enemy is aroused (for surrender scene selection)
  const isEnemyAroused = useCallback(() => {
    return enemies.some(e => e.aroused || (e.arousalLevel && e.arousalLevel > 0));
  }, [enemies]);

  // Handle attack action
  const handleAttack = useCallback((targetIndex) => {
    const target = enemies[targetIndex];
    if (!target || target.currentHp <= 0) return;

    const damage = onAttack(targetIndex);
    addLog(`You attack ${target.name} for ${damage} damage!`, 'damage');

    setMenuState(MENU_STATE.MAIN);
    setMenuHistory([]);
    setIsPlayerTurn(false);

    // Event image update for attack
    setCurrentEventImage('/images/combat/event_attack.png');
    setTimeout(() => setCurrentEventImage(defaultImages.event), 1000);
  }, [enemies, onAttack, addLog, defaultImages.event]);

  // Handle defend action
  const handleDefend = useCallback(() => {
    const defenseBoost = onDefend();
    addLog(`You take a defensive stance. Defense increased by ${defenseBoost}%!`, 'effect');

    setMenuState(MENU_STATE.MAIN);
    setMenuHistory([]);
    setIsPlayerTurn(false);
  }, [onDefend, addLog]);

  // Handle skill use
  const handleUseSkill = useCallback((skill) => {
    const result = onUseSkill(skill, selectedTarget);

    if (result.damage) {
      addLog(`${skill.name} deals ${result.damage} damage to ${enemies[selectedTarget]?.name}!`,
        result.isCritical ? 'critical' : 'damage');
    }
    if (result.heal) {
      addLog(`${skill.name} restores ${result.heal} HP!`, 'heal');
    }
    if (result.effect) {
      addLog(`${skill.name}: ${result.effectMessage || 'Effect applied!'}`, 'effect');
    }

    setMenuState(MENU_STATE.MAIN);
    setMenuHistory([]);
    setIsPlayerTurn(false);
  }, [onUseSkill, selectedTarget, enemies, addLog]);

  // Handle item use
  const handleUseItem = useCallback((item) => {
    const result = onUseItem(item);

    if (result.heal) {
      addLog(`Used ${item.name}. Restored ${result.heal} HP!`, 'heal');
    } else if (result.effect) {
      addLog(`Used ${item.name}. ${result.message || 'Effect applied!'}`, 'effect');
    }

    setContextMenu(null);
    setMenuState(MENU_STATE.MAIN);
    setMenuHistory([]);
    setIsPlayerTurn(false);
  }, [onUseItem, addLog]);

  // Handle item drop
  const handleDropItem = useCallback((item) => {
    onDropItem(item);
    addLog(`Dropped ${item.name}.`, 'system');
    setContextMenu(null);
  }, [onDropItem, addLog]);

  // Handle flee attempt
  const handleFlee = useCallback(() => {
    const fleeChance = calculateFleeChance();
    const roll = Math.random() * 100;

    if (roll < fleeChance) {
      addLog('You successfully fled from battle!', 'system');
      setCombatResult(COMBAT_RESULT.FLED);
      onFlee(true);
    } else {
      addLog('Failed to escape! The enemies block your path!', 'system');
      onFlee(false);
      setMenuState(MENU_STATE.MAIN);
      setMenuHistory([]);
      setIsPlayerTurn(false);
    }
  }, [calculateFleeChance, onFlee, addLog]);

  // Handle surrender
  const handleSurrender = useCallback(() => {
    addLog('You surrender to your enemies...', 'system');
    setCombatResult(COMBAT_RESULT.SURRENDERED);

    // Determine scene type based on enemy arousal and enabled tags
    const aroused = isEnemyAroused();
    onSurrender({
      enemies,
      aroused,
      enabledTags,
      player
    });
  }, [enemies, isEnemyAroused, enabledTags, player, onSurrender, addLog]);

  // Handle inventory right-click
  const handleItemContextMenu = useCallback((e, item) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item
    });
  }, []);

  // Get alive enemies for targeting
  const aliveEnemies = enemies.filter(e => e.currentHp > 0);

  // Render enemy portraits
  const renderEnemyArea = () => (
    <div className="combat-visual-enemy">
      {enemies.map((enemy, index) => (
        <div
          key={enemy.id || index}
          className={`combat-enemy-portrait ${enemy.currentHp <= 0 ? 'defeated' : ''} ${selectedTarget === index ? 'selected' : ''}`}
          onClick={() => setSelectedTarget(index)}
        >
          <img
            src={enemy.image || defaultImages.enemy}
            alt={enemy.name}
            className="combat-portrait-image"
          />
          <div className="combat-enemy-info">
            <span className="combat-enemy-name">{enemy.name}</span>
            <ProgressBar
              value={enemy.currentHp}
              max={enemy.maxHp || enemy.hp}
              color="#ef4444"
              showValue={false}
            />
          </div>
          {enemy.currentHp <= 0 && (
            <div className="combat-defeated-overlay">DEFEATED</div>
          )}
        </div>
      ))}
    </div>
  );

  // Render event/action area (center)
  const renderEventArea = () => (
    <div className="combat-visual-event">
      <img
        src={currentEventImage}
        alt="Combat Event"
        className="combat-event-image"
      />
    </div>
  );

  // Render player area
  const renderPlayerArea = () => (
    <div className="combat-visual-player">
      <div className="combat-player-portrait">
        <img
          src={player.image || defaultImages.player}
          alt={player.name}
          className="combat-portrait-image"
        />
      </div>
      <div className="combat-player-stats">
        <span className="combat-player-name">{player.name}</span>
        <ProgressBar
          value={player.currentHp}
          max={player.maxHp}
          color="#22c55e"
          label="HP"
        />
        <ProgressBar
          value={player.currentStamina}
          max={player.maxStamina}
          color="#3b82f6"
          label="SP"
        />
        {player.currentMana !== undefined && (
          <ProgressBar
            value={player.currentMana}
            max={player.maxMana}
            color="#a855f7"
            label="MP"
          />
        )}
      </div>
    </div>
  );

  // Render combat log
  const renderCombatLog = () => (
    <div className="combat-log" ref={logRef}>
      {combatLog.map((entry, index) => (
        <CombatLogEntry key={index} entry={entry} />
      ))}
    </div>
  );

  // Render main menu buttons
  const renderMainMenu = () => (
    <div className="combat-buttons">
      <CombatButton
        variant="danger"
        onClick={() => navigateTo(MENU_STATE.FIGHT)}
        tooltip="Enter combat mode to attack, defend, or use abilities"
      >
        Fight
      </CombatButton>
      <CombatButton
        variant="warning"
        onClick={() => navigateTo(MENU_STATE.CONFIRM_SURRENDER)}
        tooltip="Surrender to your enemies. Consequences vary by enemy type."
      >
        Surrender
      </CombatButton>
      <CombatButton
        variant="secondary"
        onClick={() => navigateTo(MENU_STATE.CONFIRM_FLEE)}
        tooltip={`Attempt to escape. ${calculateFleeChance().toFixed(0)}% chance based on your Evasion vs enemy Aggression`}
      >
        Flee
      </CombatButton>
    </div>
  );

  // Render fight menu buttons
  const renderFightMenu = () => (
    <div className="combat-buttons">
      <CombatButton
        variant="danger"
        onClick={() => navigateTo(MENU_STATE.ATTACK)}
        tooltip="Basic attack. Damage based on your Attack stat."
      >
        Attack
      </CombatButton>
      <CombatButton
        variant="primary"
        onClick={() => navigateTo(MENU_STATE.SKILLS)}
        tooltip="Use special abilities. Consumes Stamina or Mana."
      >
        Skills
      </CombatButton>
      <CombatButton
        variant="info"
        onClick={handleDefend}
        tooltip={`Take a defensive stance. Reduces incoming damage by ${Math.floor((player.stats?.defense || 5) * 2)}% for one turn.`}
      >
        Defend
      </CombatButton>
      <CombatButton
        variant="secondary"
        onClick={() => navigateTo(MENU_STATE.ITEMS)}
        tooltip="Use items from your inventory."
      >
        Items
      </CombatButton>
    </div>
  );

  // Render attack target selection
  const renderAttackMenu = () => (
    <div className="combat-buttons combat-buttons-vertical">
      {aliveEnemies.map((enemy, index) => {
        const actualIndex = enemies.findIndex(e => e === enemy);
        return (
          <CombatButton
            key={enemy.id || index}
            variant="danger"
            onClick={() => handleAttack(actualIndex)}
            tooltip={`Attack ${enemy.name}. HP: ${enemy.currentHp}/${enemy.maxHp || enemy.hp}`}
          >
            Attack {enemy.name}
          </CombatButton>
        );
      })}
    </div>
  );

  // Render skills menu
  const renderSkillsMenu = () => (
    <div className="combat-buttons combat-buttons-vertical combat-skills-list">
      {playerSkills.length === 0 ? (
        <div className="combat-no-skills">No skills available</div>
      ) : (
        playerSkills.map((skill) => {
          const canUse = (player.currentStamina >= (skill.cost?.stamina || 0)) &&
                         (player.currentMana >= (skill.cost?.mana || 0));
          return (
            <CombatButton
              key={skill.id}
              variant="primary"
              onClick={() => handleUseSkill(skill)}
              disabled={!canUse}
              tooltip={
                <div className="skill-tooltip">
                  <div className="skill-tooltip-name">{skill.name}</div>
                  <div className="skill-tooltip-desc">{skill.description}</div>
                  {skill.cost?.stamina && (
                    <div className="skill-tooltip-cost">Stamina: {skill.cost.stamina}</div>
                  )}
                  {skill.cost?.mana && (
                    <div className="skill-tooltip-cost">Mana: {skill.cost.mana}</div>
                  )}
                  {skill.effect?.damage && (
                    <div className="skill-tooltip-effect">Damage: {skill.effect.damage * 100}%</div>
                  )}
                </div>
              }
            >
              {skill.name}
              {skill.cost?.stamina && <span className="skill-cost"> ({skill.cost.stamina} SP)</span>}
              {skill.cost?.mana && <span className="skill-cost"> ({skill.cost.mana} MP)</span>}
            </CombatButton>
          );
        })
      )}
    </div>
  );

  // Render items menu
  const renderItemsMenu = () => {
    const usableItems = playerInventory.filter(item =>
      item.useEffect || item.type === 'consumable'
    );

    return (
      <div className="combat-inventory">
        {usableItems.length === 0 ? (
          <div className="combat-no-items">No usable items</div>
        ) : (
          <div className="combat-items-grid">
            {usableItems.map((item, index) => (
              <div
                key={item.id || index}
                className="combat-item-slot"
                onClick={() => handleUseItem(item)}
                onContextMenu={(e) => handleItemContextMenu(e, item)}
              >
                <div className="combat-item-icon">
                  {item.icon?.emoji || '📦'}
                </div>
                <div className="combat-item-name">{item.name}</div>
                {item.quantity > 1 && (
                  <div className="combat-item-quantity">x{item.quantity}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render confirm surrender
  const renderConfirmSurrender = () => (
    <div className="combat-confirm">
      <div className="combat-confirm-text">
        Are you sure you want to surrender?
        {isEnemyAroused() ? (
          <span className="combat-warning"> The enemies seem... interested in you.</span>
        ) : (
          <span> The enemies will decide your fate.</span>
        )}
      </div>
      <div className="combat-buttons">
        <CombatButton variant="danger" onClick={handleSurrender}>
          Yes, Surrender
        </CombatButton>
        <CombatButton variant="secondary" onClick={navigateBack}>
          Cancel
        </CombatButton>
      </div>
    </div>
  );

  // Render confirm flee
  const renderConfirmFlee = () => (
    <div className="combat-confirm">
      <div className="combat-confirm-text">
        Attempt to flee?
        <span className="combat-flee-chance">
          {calculateFleeChance().toFixed(0)}% chance of success
        </span>
      </div>
      <div className="combat-buttons">
        <CombatButton variant="warning" onClick={handleFlee}>
          Attempt Flee
        </CombatButton>
        <CombatButton variant="secondary" onClick={navigateBack}>
          Cancel
        </CombatButton>
      </div>
    </div>
  );

  // Render current menu based on state
  const renderCurrentMenu = () => {
    switch (menuState) {
      case MENU_STATE.MAIN:
        return renderMainMenu();
      case MENU_STATE.FIGHT:
        return renderFightMenu();
      case MENU_STATE.ATTACK:
        return renderAttackMenu();
      case MENU_STATE.SKILLS:
        return renderSkillsMenu();
      case MENU_STATE.ITEMS:
        return renderItemsMenu();
      case MENU_STATE.CONFIRM_SURRENDER:
        return renderConfirmSurrender();
      case MENU_STATE.CONFIRM_FLEE:
        return renderConfirmFlee();
      default:
        return renderMainMenu();
    }
  };

  // Render victory screen
  const renderVictoryScreen = () => (
    <div className="combat-result combat-victory">
      <h2>Victory!</h2>
      <p>You have defeated all enemies!</p>
      <CombatButton variant="success" onClick={onVictory}>
        Collect Rewards
      </CombatButton>
    </div>
  );

  // Render defeat screen
  const renderDefeatScreen = () => (
    <div className="combat-result combat-defeat">
      <h2>Defeated...</h2>
      <p>You have fallen in battle.</p>
      <CombatButton variant="danger" onClick={onDefeat}>
        Continue
      </CombatButton>
    </div>
  );

  // Check if combat is over
  if (combatResult === COMBAT_RESULT.VICTORY) {
    return renderVictoryScreen();
  }

  if (combatResult === COMBAT_RESULT.DEFEAT) {
    return renderDefeatScreen();
  }

  return (
    <div className="combat-screen">
      {/* Visual Section (Top) */}
      <div className="combat-visual-section">
        {renderEnemyArea()}
        {renderEventArea()}
        {renderPlayerArea()}
      </div>

      {/* Interaction Section (Bottom) */}
      <div className="combat-interaction-section">
        {/* Back Button */}
        {menuHistory.length > 0 && (
          <button className="combat-back-button" onClick={navigateBack}>
            ← Back
          </button>
        )}

        {/* Combat Log */}
        {renderCombatLog()}

        {/* Action Buttons */}
        <div className="combat-actions">
          {isPlayerTurn ? (
            renderCurrentMenu()
          ) : (
            <div className="combat-waiting">Enemy turn...</div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <CombatContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          onUse={handleUseItem}
          onDrop={handleDropItem}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default CombatScreen;
