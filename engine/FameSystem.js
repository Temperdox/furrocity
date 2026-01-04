/**
 * @fileoverview FameSystem - Manages player fame, titles, and infamy
 *
 * This system tracks the player's reputation in the game world through three
 * interconnected mechanisms:
 *
 * **Fame (-1000 to 1000):**
 * Represents general reputation. Positive fame indicates heroic deeds,
 * negative fame indicates villainous acts.
 *
 * **Titles:**
 * Unlockable achievements that provide passive bonuses. Players can equip
 * one title at a time for its effects.
 *
 * **Infamy (0-100 per type):**
 * Specialized reputation tracks for specific behaviors:
 * - slut: Sexual reputation
 * - criminal: Crime/theft reputation
 * - corrupted: Dark magic/demon dealings
 *
 * @module engine/FameSystem
 *
 * @example
 * // Create and initialize
 * const fameSystem = new FameSystem(dataRegistry);
 * await fameSystem.initialize();
 *
 * // Modify fame
 * const result = fameSystem.modifyFame(playerState, 50, 'Saved the village');
 *
 * // Check unlocked titles
 * const titles = fameSystem.getUnlockedTitles(playerState);
 *
 * @author Furrocity Team
 * @version 1.0.0
 */

/**
 * FameSystem class - Manages reputation mechanics
 *
 * @class
 */
export class FameSystem {
  /**
   * Create a new FameSystem instance
   *
   * @param {DataRegistry|null} dataRegistry - Registry for loading title definitions
   */
  constructor(dataRegistry) {
    /** @type {DataRegistry|null} Content loading registry */
    this.dataRegistry = dataRegistry;

    /**
     * Cache of title definitions by ID
     * @type {Map<string, Object>}
     */
    this.titleDefinitions = new Map();
  }

  /**
   * Initialize the fame system by loading title definitions from datapacks.
   * Should be called after construction.
   *
   * @async
   * @returns {Promise<void>}
   *
   * @example
   * await fameSystem.initialize();
   * console.log(`Loaded ${fameSystem.titleDefinitions.size} titles`);
   */
  async initialize() {
    // Load all title definitions from the data registry
    const titles = this.dataRegistry?.getContentByType?.('titles') || [];

    for (const title of titles) {
      this.titleDefinitions.set(title.id, title);
    }

    console.log(`[FameSystem] Loaded ${this.titleDefinitions.size} title definitions`);
  }

  // ============================================================================
  // FAME MANAGEMENT
  // Core reputation tracking
  // ============================================================================

  /**
   * Modify the player's fame value.
   * Automatically tracks heroic/villainous deeds and checks for title unlocks.
   *
   * @param {Object} playerState - Player state object (will be modified)
   * @param {number} amount - Amount to add (positive for heroic, negative for villainous)
   * @param {string} reason - Description of what caused the fame change
   * @returns {Object} Result object with details
   * @returns {number} result.oldValue - Previous fame value
   * @returns {number} result.newValue - New fame value
   * @returns {number} result.change - Amount changed
   * @returns {string} result.reason - Reason for change
   * @returns {boolean} result.levelChanged - Whether fame tier changed
   * @returns {string} result.oldLevel - Previous fame tier
   * @returns {string} result.newLevel - New fame tier
   * @returns {Array} result.unlockedTitles - Any newly unlocked titles
   *
   * @example
   * const result = fameSystem.modifyFame(playerState, 100, 'Defeated the dragon');
   * if (result.levelChanged) {
   *   showNotification(`Fame level: ${result.newLevel}!`);
   * }
   * if (result.unlockedTitles.length > 0) {
   *   showNotification(`Unlocked: ${result.unlockedTitles[0].name}`);
   * }
   */
  modifyFame(playerState, amount, reason) {
    // Initialize fame structure if missing
    if (!playerState.fame) {
      playerState.fame = {
        value: 0,
        heroicDeeds: 0,
        villainousDeeds: 0,
        fameHistory: []
      };
    }

    const oldValue = playerState.fame.value;
    const oldLevel = this.getFameLevel(oldValue);

    // Update fame value with bounds checking (-1000 to 1000)
    playerState.fame.value = Math.max(-1000, Math.min(1000, oldValue + amount));

    // Track deed type for statistics
    if (amount > 0) {
      playerState.fame.heroicDeeds += amount;
    } else if (amount < 0) {
      playerState.fame.villainousDeeds += Math.abs(amount);
    }

    // Record in history for player reference
    playerState.fame.fameHistory.push({
      reason,
      amount,
      timestamp: Date.now(),
      newValue: playerState.fame.value
    });

    // Prevent history from growing unbounded
    if (playerState.fame.fameHistory.length > 100) {
      playerState.fame.fameHistory = playerState.fame.fameHistory.slice(-100);
    }

    const newLevel = this.getFameLevel(playerState.fame.value);

    // Check if any titles should now be unlocked
    const unlockedTitles = this.checkAllTitleUnlocks(playerState);

    return {
      oldValue,
      newValue: playerState.fame.value,
      change: amount,
      reason,
      levelChanged: oldLevel !== newLevel,
      oldLevel,
      newLevel,
      unlockedTitles
    };
  }

  /**
   * Get the fame tier/level based on fame value.
   * Tiers range from 'reviled' (-750 and below) to 'legendary' (750+).
   *
   * @param {number} fame - Fame value (-1000 to 1000)
   * @returns {string} Fame tier name
   *
   * @example
   * const tier = fameSystem.getFameLevel(500);  // 'respected'
   * const tier = fameSystem.getFameLevel(-600); // 'despised'
   */
  getFameLevel(fame) {
    // Negative tiers (villain path)
    if (fame <= -750) return 'reviled';     // Universally hated
    if (fame <= -500) return 'despised';    // Actively avoided
    if (fame <= -250) return 'disliked';    // Generally unwelcome
    if (fame <= -50) return 'shunned';      // Treated with suspicion

    // Neutral
    if (fame < 50) return 'unknown';        // No reputation

    // Positive tiers (hero path)
    if (fame < 250) return 'recognized';    // People have heard of you
    if (fame < 500) return 'respected';     // Well-regarded
    if (fame < 750) return 'renowned';      // Widely famous
    return 'legendary';                     // Living legend
  }

  /**
   * Get detailed information about a fame tier including display properties.
   *
   * @param {number} fame - Fame value
   * @returns {Object} Tier information
   * @returns {string} info.level - Tier name
   * @returns {string} info.displayName - Formatted display name
   * @returns {string} info.color - Hex color for UI display
   * @returns {number} info.priceModifier - Merchant price modifier (negative = discount)
   * @returns {string} info.description - Flavor text description
   *
   * @example
   * const info = fameSystem.getFameTierInfo(600);
   * // { level: 'renowned', displayName: 'Renowned', color: '#FFD700', ... }
   */
  getFameTierInfo(fame) {
    const level = this.getFameLevel(fame);

    const tiers = {
      'reviled': {
        displayName: 'Reviled',
        color: '#8B0000',         // Dark red
        priceModifier: 0.25,      // 25% markup (merchants hate you)
        description: 'Your name is spoken with hatred'
      },
      'despised': {
        displayName: 'Despised',
        color: '#B22222',         // Fire brick
        priceModifier: 0.15,
        description: 'Most people want nothing to do with you'
      },
      'disliked': {
        displayName: 'Disliked',
        color: '#CD5C5C',         // Indian red
        priceModifier: 0.10,
        description: 'Your reputation precedes you negatively'
      },
      'shunned': {
        displayName: 'Shunned',
        color: '#A0522D',         // Sienna
        priceModifier: 0.05,
        description: 'People tend to avoid you'
      },
      'unknown': {
        displayName: 'Unknown',
        color: '#808080',         // Gray
        priceModifier: 0,         // No modifier
        description: 'Nobody knows who you are'
      },
      'recognized': {
        displayName: 'Recognized',
        color: '#4169E1',         // Royal blue
        priceModifier: -0.02,     // 2% discount
        description: 'Some people have heard of your deeds'
      },
      'respected': {
        displayName: 'Respected',
        color: '#32CD32',         // Lime green
        priceModifier: -0.05,     // 5% discount
        description: 'Your reputation opens doors'
      },
      'renowned': {
        displayName: 'Renowned',
        color: '#FFD700',         // Gold
        priceModifier: -0.08,     // 8% discount
        description: 'Tales of your deeds spread far and wide'
      },
      'legendary': {
        displayName: 'Legendary',
        color: '#FF4500',         // Orange red
        priceModifier: -0.12,     // 12% discount
        description: 'You are a living legend'
      }
    };

    return { level, ...tiers[level] };
  }

  // ============================================================================
  // TITLE MANAGEMENT
  // Unlockable achievements with passive bonuses
  // ============================================================================

  /**
   * Check if a specific title's unlock conditions are met.
   *
   * @param {Object} playerState - Current player state
   * @param {Object} title - Title definition with unlockConditions
   * @returns {boolean} True if all conditions are satisfied
   *
   * @example
   * const heroTitle = fameSystem.getTitle('hero_of_crossroads');
   * if (fameSystem.checkTitleUnlock(playerState, heroTitle)) {
   *   console.log('Player can unlock this title!');
   * }
   */
  checkTitleUnlock(playerState, title) {
    if (!title.unlockConditions) return false;
    return this.evaluateConditions(playerState, title.unlockConditions);
  }

  /**
   * Check all titles and unlock any whose conditions are now met.
   * Called automatically when fame changes.
   *
   * @param {Object} playerState - Player state
   * @returns {Array<Object>} Array of newly unlocked title definitions
   *
   * @private
   */
  checkAllTitleUnlocks(playerState) {
    // Initialize titles structure if missing
    if (!playerState.titles) {
      playerState.titles = { active: null, unlocked: [], equipped: null };
    }

    const newlyUnlocked = [];

    // Check each registered title
    for (const [titleId, title] of this.titleDefinitions) {
      // Skip if already unlocked
      if (playerState.titles.unlocked.includes(titleId)) continue;

      // Check if conditions are now met
      if (this.checkTitleUnlock(playerState, title)) {
        this.unlockTitle(playerState, titleId);
        newlyUnlocked.push(title);
      }
    }

    return newlyUnlocked;
  }

  /**
   * Unlock a title for the player.
   * If no title is currently equipped, auto-equips the new one.
   *
   * @param {Object} playerState - Player state (will be modified)
   * @param {string} titleId - ID of the title to unlock
   * @returns {Object|undefined} The unlocked title definition
   *
   * @example
   * const title = fameSystem.unlockTitle(playerState, 'dragon_slayer');
   * showNotification(`Unlocked: ${title.name}!`);
   */
  unlockTitle(playerState, titleId) {
    // Initialize titles structure if missing
    if (!playerState.titles) {
      playerState.titles = { active: null, unlocked: [], equipped: null };
    }

    // Add to unlocked list if not already present
    if (!playerState.titles.unlocked.includes(titleId)) {
      playerState.titles.unlocked.push(titleId);

      // Auto-equip if this is the first title
      if (!playerState.titles.equipped) {
        playerState.titles.equipped = titleId;
        playerState.titles.active = titleId;
      }
    }

    return this.titleDefinitions.get(titleId);
  }

  /**
   * Equip a title to gain its passive effects.
   * Only unlocked titles can be equipped.
   *
   * @param {Object} playerState - Player state
   * @param {string} titleId - ID of the title to equip
   * @returns {Object} Result with success status
   *
   * @example
   * const result = fameSystem.equipTitle(playerState, 'hero_of_crossroads');
   * if (result.success) {
   *   console.log(`Equipped: ${result.title.name}`);
   * }
   */
  equipTitle(playerState, titleId) {
    // Verify title is unlocked
    if (!playerState.titles?.unlocked?.includes(titleId)) {
      return { success: false, error: 'Title not unlocked' };
    }

    // Set as equipped (provides bonuses) and active (displayed)
    playerState.titles.equipped = titleId;
    playerState.titles.active = titleId;

    return {
      success: true,
      title: this.titleDefinitions.get(titleId)
    };
  }

  /**
   * Set the displayed title (can differ from equipped title).
   * Allows players to show one title while benefiting from another.
   *
   * @param {Object} playerState - Player state
   * @param {string|null} titleId - Title to display, or null to hide
   * @returns {Object} Result with success status
   */
  setDisplayTitle(playerState, titleId) {
    // Allow null to hide title, otherwise must be unlocked
    if (titleId !== null && !playerState.titles?.unlocked?.includes(titleId)) {
      return { success: false, error: 'Title not unlocked' };
    }

    playerState.titles.active = titleId;
    return { success: true };
  }

  /**
   * Get the effects provided by the currently equipped title.
   *
   * @param {Object} playerState - Player state
   * @returns {Object|null} Title effects or null if no title equipped
   *
   * @example
   * const effects = fameSystem.getActiveTitleEffects(playerState);
   * if (effects?.buyPriceModifier) {
   *   console.log(`Title gives ${effects.buyPriceModifier * 100}% price discount`);
   * }
   */
  getActiveTitleEffects(playerState) {
    const titleId = playerState.titles?.equipped;
    if (!titleId) return null;

    const title = this.titleDefinitions.get(titleId);
    return title?.effects || null;
  }

  /**
   * Get all titles the player has unlocked with their full definitions.
   *
   * @param {Object} playerState - Player state
   * @returns {Array<Object>} Array of unlocked title definitions
   */
  getUnlockedTitles(playerState) {
    const unlocked = playerState.titles?.unlocked || [];
    return unlocked.map(id => this.titleDefinitions.get(id)).filter(Boolean);
  }

  /**
   * Get a title definition by ID.
   *
   * @param {string} titleId - The title's unique ID
   * @returns {Object|undefined} Title definition or undefined
   */
  getTitle(titleId) {
    return this.titleDefinitions.get(titleId);
  }

  // ============================================================================
  // INFAMY MANAGEMENT
  // Specialized reputation tracks
  // ============================================================================

  /**
   * Modify a specific infamy type.
   * Infamy values are clamped between 0 and 100.
   *
   * @param {Object} playerState - Player state (will be modified)
   * @param {string} type - One of: 'slut', 'criminal', 'corrupted'
   * @param {number} amount - Amount to add (can be negative to decrease)
   * @returns {Object|null} Result object or null if invalid type
   *
   * @example
   * // Increase slut infamy
   * fameSystem.modifyInfamy(playerState, 'slut', 10);
   *
   * // Decrease criminal infamy (rehabilitation)
   * fameSystem.modifyInfamy(playerState, 'criminal', -5);
   */
  modifyInfamy(playerState, type, amount) {
    // Initialize infamy structure if missing
    if (!playerState.infamy) {
      playerState.infamy = { slut: 0, criminal: 0, corrupted: 0 };
    }

    // Validate infamy type
    if (!['slut', 'criminal', 'corrupted'].includes(type)) {
      console.warn(`[FameSystem] Unknown infamy type: ${type}`);
      return null;
    }

    const oldValue = playerState.infamy[type];

    // Update with bounds (0-100)
    playerState.infamy[type] = Math.max(0, Math.min(100, oldValue + amount));

    return {
      type,
      oldValue,
      newValue: playerState.infamy[type],
      change: amount
    };
  }

  /**
   * Get the gameplay effects of current infamy levels.
   * These affect NPC behavior, encounter types, and access to locations.
   *
   * @param {Object} playerState - Player state
   * @returns {Object} Effects organized by infamy type
   *
   * @example
   * const effects = fameSystem.getInfamyEffects(playerState);
   * if (effects.criminal.guardsHostile) {
   *   spawnHostileGuards();
   * }
   */
  getInfamyEffects(playerState) {
    const infamy = playerState.infamy || { slut: 0, criminal: 0, corrupted: 0 };

    return {
      slut: {
        value: infamy.slut,
        // Merchants charge more to "sluts" (penalty starts at 20)
        priceModifier: infamy.slut > 20 ? (infamy.slut - 20) * 0.002 : 0,
        // Special lewd encounters become possible
        triggersEncounters: infamy.slut >= 30,
        // Some NPCs will proposition the player
        npcPropositions: infamy.slut >= 50,
        // Some establishments refuse service
        serviceRefusal: infamy.slut >= 80
      },
      criminal: {
        value: infamy.criminal,
        // Town guards become hostile
        guardsHostile: infamy.criminal >= 50,
        // Bounty hunters start appearing
        bountyHunters: infamy.criminal >= 70,
        // Criminal NPCs treat you as one of their own
        criminalFriendly: infamy.criminal >= 30
      },
      corrupted: {
        value: infamy.corrupted,
        // Demons and dark entities are friendlier
        demonAffinity: infamy.corrupted >= 40,
        // Temples and holy places may bar entry
        holyRefusal: infamy.corrupted >= 60,
        // Dark/demonic encounters more frequent
        darkEncounters: infamy.corrupted >= 30
      }
    };
  }

  // ============================================================================
  // PRICE MODIFIERS
  // Calculations used by MerchantSystem
  // ============================================================================

  /**
   * Calculate the total buy price modifier from fame, titles, and infamy.
   * Used by MerchantSystem when player is buying items.
   *
   * @param {Object} playerState - Player state
   * @returns {number} Price modifier (negative = discount, positive = markup)
   *
   * @example
   * const modifier = fameSystem.calculatePriceModifier(playerState);
   * // modifier = -0.15 means 15% discount
   * // modifier = 0.10 means 10% markup
   */
  calculatePriceModifier(playerState) {
    let modifier = 0;

    // FAME CONTRIBUTION
    // Famous players get discounts, infamous players pay more
    const fameInfo = this.getFameTierInfo(playerState.fame?.value || 0);
    modifier += fameInfo.priceModifier;

    // TITLE CONTRIBUTION
    // Some titles grant shopping discounts
    const titleEffects = this.getActiveTitleEffects(playerState);
    if (titleEffects) {
      modifier += titleEffects.buyPriceModifier || 0;
    }

    // SLUT INFAMY CONTRIBUTION
    // High slut infamy means merchants try to take advantage
    const slutInfamy = playerState.infamy?.slut || 0;
    if (slutInfamy > 20) {
      modifier += (slutInfamy - 20) * 0.002; // +0.2% per point over 20
    }

    return modifier;
  }

  /**
   * Calculate the total sell price modifier from fame, titles, and infamy.
   * Used by MerchantSystem when player is selling items.
   *
   * @param {Object} playerState - Player state
   * @returns {number} Price modifier (positive = better sell prices)
   */
  calculateSellPriceModifier(playerState) {
    let modifier = 0;

    // FAME CONTRIBUTION (inverted from buy prices)
    // Famous players get better sell prices too
    const fameInfo = this.getFameTierInfo(playerState.fame?.value || 0);
    modifier -= fameInfo.priceModifier; // Negate: positive fame = positive sell modifier

    // TITLE CONTRIBUTION
    const titleEffects = this.getActiveTitleEffects(playerState);
    if (titleEffects) {
      modifier += titleEffects.sellPriceModifier || 0;
    }

    return modifier;
  }

  // ============================================================================
  // CONDITION EVALUATION
  // Used for title unlock conditions
  // ============================================================================

  /**
   * Evaluate a condition tree for title unlocks.
   * Supports 'and', 'or', and various condition types.
   *
   * @param {Object} playerState - Player state to check against
   * @param {Object} conditions - Condition definition
   * @returns {boolean} Whether conditions are satisfied
   *
   * @private
   */
  evaluateConditions(playerState, conditions) {
    if (!conditions) return true;

    switch (conditions.type) {
      // LOGICAL OPERATORS
      case 'and':
        // All sub-conditions must be true
        return conditions.conditions.every(c => this.evaluateConditions(playerState, c));

      case 'or':
        // At least one sub-condition must be true
        return conditions.conditions.some(c => this.evaluateConditions(playerState, c));

      // VALUE CHECKS
      case 'fame':
        return this.evaluateComparison(
          playerState.fame?.value || 0,
          conditions.operator,
          conditions.value
        );

      case 'infamy':
        return this.evaluateComparison(
          playerState.infamy?.[conditions.infamyType] || 0,
          conditions.operator,
          conditions.value
        );

      case 'flag':
        // Check if a world flag is set
        return playerState.worldFlags?.[conditions.flag] === true;

      case 'level':
        return this.evaluateComparison(
          playerState.level || 1,
          conditions.operator,
          conditions.value
        );

      case 'stat':
        return this.evaluateComparison(
          playerState.stats?.[conditions.stat] || 0,
          conditions.operator,
          conditions.value
        );

      case 'questComplete':
        return playerState.completedQuests?.includes(conditions.questId);

      case 'factionRep':
        return this.evaluateComparison(
          playerState.factionReputation?.[conditions.factionId]?.reputation || 0,
          conditions.operator,
          conditions.value
        );

      default:
        console.warn(`[FameSystem] Unknown condition type: ${conditions.type}`);
        return false;
    }
  }

  /**
   * Evaluate a comparison operation.
   *
   * @param {number} value - Left side value
   * @param {string} operator - Comparison operator (>=, >, <=, <, ==, !=)
   * @param {number} target - Right side value
   * @returns {boolean} Result of comparison
   *
   * @private
   */
  evaluateComparison(value, operator, target) {
    switch (operator) {
      case '>=': return value >= target;
      case '>': return value > target;
      case '<=': return value <= target;
      case '<': return value < target;
      case '==': return value === target;
      case '!=': return value !== target;
      default: return false;
    }
  }
}

export default FameSystem;
