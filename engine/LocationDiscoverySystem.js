/**
 * LocationDiscoverySystem.js - Handles hidden location tags and discovery mechanics
 *
 * Tags can be:
 * - Visible: Always shown (town, forest, inn)
 * - Hidden: Shown as "???" until discovered (corrupted, blessed, cursed, shady, divine, haunted)
 * - Discovery conditions: quest, stats, items, or interaction count (range-based)
 */

class LocationDiscoverySystem {
  constructor() {
    // Tags that are always visible (no reason to hide them)
    this.alwaysVisibleTags = new Set([
      'town', 'village', 'city', 'forest', 'cave', 'dungeon', 'inn', 'tavern',
      'road', 'path', 'building', 'outdoor', 'indoor', 'shop', 'market',
      'temple', 'church', 'clinic', 'nursery', 'blacksmith', 'guild'
    ]);

    // Tags that should be hidden until discovered
    this.hiddenTagTypes = new Set([
      'corrupted', 'blessed', 'cursed', 'shady', 'divine', 'haunted',
      'safe', 'dangerous', 'unique', 'secret', 'hidden', 'forbidden',
      'demonic', 'holy', 'tainted', 'purified', 'abandoned', 'trapped'
    ]);

    // Interaction types that can trigger discovery
    this.interactionTypes = [
      'visit', 'sleep', 'search', 'pray', 'investigate', 'explore', 'rest'
    ];
  }

  /**
   * Get visible tags for a location (hiding undiscovered ones as "???")
   */
  getVisibleTags(location, playerState) {
    const allTags = location.tags || [];
    const hiddenTags = location.hiddenTags || {};
    const revealedTags = playerState.revealedTags?.[location.id] || [];

    const visibleTags = [];
    const mysteryCount = { count: 0 };

    for (const tag of allTags) {
      // Always visible tags
      if (this.alwaysVisibleTags.has(tag)) {
        visibleTags.push({ tag, visible: true, discovered: true });
        continue;
      }

      // Check if it's a hidden tag type
      if (this.hiddenTagTypes.has(tag)) {
        // Check if player has revealed it
        if (revealedTags.includes(tag)) {
          visibleTags.push({ tag, visible: true, discovered: true });
        } else {
          // Check if there's a specific hidden config for this tag
          const hiddenConfig = hiddenTags[tag];
          if (hiddenConfig?.alwaysHidden) {
            // Don't even show "???" - completely hidden
            continue;
          }
          mysteryCount.count++;
        }
      } else {
        // Not a special hidden tag, show it
        visibleTags.push({ tag, visible: true, discovered: true });
      }
    }

    // Add mystery placeholders
    for (let i = 0; i < mysteryCount.count; i++) {
      visibleTags.push({ tag: '???', visible: true, discovered: false, mystery: true });
    }

    return visibleTags;
  }

  /**
   * Check if a hidden tag should be revealed based on conditions
   */
  checkDiscoveryConditions(location, playerState, hiddenTag, triggerType = null) {
    const hiddenConfig = location.hiddenTags?.[hiddenTag];
    if (!hiddenConfig) return { canDiscover: false };

    const conditions = hiddenConfig.discoveryConditions || {};
    const results = [];

    // Check quest condition
    if (conditions.quest) {
      const questComplete = playerState.completedQuests?.includes(conditions.quest);
      results.push({ type: 'quest', met: questComplete, required: conditions.quest });
    }

    // Check stat conditions
    if (conditions.stats) {
      for (const [stat, required] of Object.entries(conditions.stats)) {
        const playerStat = this._getNestedStat(playerState, stat);
        const met = playerStat >= required;
        results.push({ type: 'stat', stat, met, current: playerStat, required });
      }
    }

    // Check item condition
    if (conditions.item) {
      const hasItem = playerState.inventory?.some(i => i.id === conditions.item);
      results.push({ type: 'item', met: hasItem, required: conditions.item });
    }

    // Check flag condition
    if (conditions.flag) {
      const hasFlag = playerState.worldFlags?.[conditions.flag];
      results.push({ type: 'flag', met: !!hasFlag, required: conditions.flag });
    }

    // Check interaction count (range-based discovery)
    if (conditions.interactions) {
      const interactionResult = this._checkInteractionDiscovery(
        location, playerState, hiddenTag, conditions.interactions, triggerType
      );
      results.push(interactionResult);
    }

    // Determine if all conditions are met
    const requireAll = conditions.requireAll !== false; // Default to requiring all
    const canDiscover = requireAll
      ? results.every(r => r.met)
      : results.some(r => r.met);

    return {
      canDiscover,
      conditions: results,
      requireAll
    };
  }

  /**
   * Check interaction-based discovery (range-based random requirement)
   */
  _checkInteractionDiscovery(location, playerState, hiddenTag, interactionConfig, triggerType) {
    const locationId = location.id;
    const progress = playerState.discoveryProgress?.[locationId]?.[hiddenTag];

    // Get the required interaction type
    const requiredType = interactionConfig.type || 'visit';

    // If trigger type doesn't match, can't progress
    if (triggerType && triggerType !== requiredType) {
      return {
        type: 'interaction',
        interactionType: requiredType,
        met: false,
        current: progress?.currentInteractions || 0,
        required: progress?.interactionsRequired || '?',
        reason: `Requires ${requiredType}, got ${triggerType}`
      };
    }

    // If no progress exists, this is first check - will be initialized on interaction
    if (!progress) {
      return {
        type: 'interaction',
        interactionType: requiredType,
        met: false,
        current: 0,
        required: `${interactionConfig.min}-${interactionConfig.max}`,
        needsInit: true
      };
    }

    return {
      type: 'interaction',
      interactionType: requiredType,
      met: progress.discovered || progress.currentInteractions >= progress.interactionsRequired,
      current: progress.currentInteractions,
      required: progress.interactionsRequired
    };
  }

  /**
   * Record an interaction and check for discovery
   */
  recordInteraction(location, playerState, interactionType) {
    const locationId = location.id;
    const hiddenTags = location.hiddenTags || {};
    const discoveries = [];

    // Initialize location interactions if needed
    if (!playerState.locationInteractions) {
      playerState.locationInteractions = {};
    }
    if (!playerState.locationInteractions[locationId]) {
      playerState.locationInteractions[locationId] = {
        visits: 0, sleeps: 0, searches: 0, prayers: 0,
        investigates: 0, explores: 0, rests: 0, nsfwEvents: 0,
        lastInteraction: null
      };
    }

    // Increment interaction count
    const interactions = playerState.locationInteractions[locationId];
    const countKey = `${interactionType}s`; // visit -> visits, sleep -> sleeps
    if (interactions[countKey] !== undefined) {
      interactions[countKey]++;
    }
    interactions.lastInteraction = Date.now();

    // Check each hidden tag for interaction-based discovery
    for (const [tag, config] of Object.entries(hiddenTags)) {
      if (!config.discoveryConditions?.interactions) continue;

      const interactionConfig = config.discoveryConditions.interactions;

      // Check if this interaction type matches
      if (interactionConfig.type !== interactionType) continue;

      // Initialize or update discovery progress
      if (!playerState.discoveryProgress) {
        playerState.discoveryProgress = {};
      }
      if (!playerState.discoveryProgress[locationId]) {
        playerState.discoveryProgress[locationId] = {};
      }

      let progress = playerState.discoveryProgress[locationId][tag];

      // Initialize progress with random requirement from range
      if (!progress) {
        const required = this._rollRange(interactionConfig.min, interactionConfig.max);
        progress = {
          interactionsRequired: required,
          currentInteractions: 0,
          discovered: false,
          discoveredAt: null
        };
        playerState.discoveryProgress[locationId][tag] = progress;
      }

      // Already discovered
      if (progress.discovered) continue;

      // Increment interaction count
      progress.currentInteractions++;

      // Check if discovered
      if (progress.currentInteractions >= progress.interactionsRequired) {
        // Check other conditions too
        const fullCheck = this.checkDiscoveryConditions(location, playerState, tag, interactionType);

        if (fullCheck.canDiscover) {
          progress.discovered = true;
          progress.discoveredAt = Date.now();

          // Add to revealed tags
          if (!playerState.revealedTags) {
            playerState.revealedTags = {};
          }
          if (!playerState.revealedTags[locationId]) {
            playerState.revealedTags[locationId] = [];
          }
          playerState.revealedTags[locationId].push(tag);

          discoveries.push({
            tag,
            location: locationId,
            interactionsUsed: progress.currentInteractions,
            scene: config.discoveryScene || null,
            message: config.discoveryMessage || `You discover that this place is ${tag}!`
          });
        }
      }
    }

    return {
      interactionRecorded: true,
      interactionType,
      discoveries
    };
  }

  /**
   * Force reveal a tag (from quest completion, etc.)
   */
  revealTag(locationId, tag, playerState, reason = 'quest') {
    if (!playerState.revealedTags) {
      playerState.revealedTags = {};
    }
    if (!playerState.revealedTags[locationId]) {
      playerState.revealedTags[locationId] = [];
    }

    if (!playerState.revealedTags[locationId].includes(tag)) {
      playerState.revealedTags[locationId].push(tag);

      // Update discovery progress if exists
      if (playerState.discoveryProgress?.[locationId]?.[tag]) {
        playerState.discoveryProgress[locationId][tag].discovered = true;
        playerState.discoveryProgress[locationId][tag].discoveredAt = Date.now();
      }

      return { revealed: true, tag, locationId, reason };
    }

    return { revealed: false, reason: 'already_revealed' };
  }

  /**
   * Check if player has discovered a specific tag at a location
   */
  hasDiscoveredTag(locationId, tag, playerState) {
    return playerState.revealedTags?.[locationId]?.includes(tag) || false;
  }

  /**
   * Get all discovered hidden tags for a location
   */
  getDiscoveredTags(locationId, playerState) {
    return playerState.revealedTags?.[locationId] || [];
  }

  /**
   * Check if location has a hidden tag (whether discovered or not)
   */
  locationHasHiddenTag(location, tag) {
    return !!location.hiddenTags?.[tag];
  }

  /**
   * Get true tags including hidden ones (for game logic, not display)
   */
  getTrueTags(location) {
    const tags = [...(location.tags || [])];
    const hiddenTags = Object.keys(location.hiddenTags || {});
    return [...new Set([...tags, ...hiddenTags])];
  }

  /**
   * Check if location is truly safe/dangerous/etc (for game logic)
   */
  hasActualTag(location, tag) {
    return this.getTrueTags(location).includes(tag);
  }

  // Helper methods

  _getNestedStat(playerState, path) {
    const keys = path.split('.');
    let value = playerState;
    for (const key of keys) {
      if (value === undefined || value === null) return 0;
      value = value[key];
    }
    return value ?? 0;
  }

  _rollRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

export default LocationDiscoverySystem;
