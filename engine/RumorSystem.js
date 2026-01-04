/**
 * @fileoverview RumorSystem - Rumor Creation, Spreading, and Confrontation
 *
 * Handles rumors about the player that NPCs can mention.
 *
 * Features:
 * - Create rumors from events/scenes
 * - Spread rumors between locations over time
 * - NPC confrontation system with response options
 * - Response options gated by player stats
 * - Cooldown system to prevent spam
 *
 * @module engine/RumorSystem
 */

class RumorSystem {
  constructor(reputationSystem = null) {
    this.reputationSystem = reputationSystem;
    this.rumorTemplates = null;

    // Configuration
    this.config = {
      baseConfrontationChance: 0.3,     // 30% base chance NPC mentions rumor
      cooldownDuration: 300000,          // 5 minutes between rumor mentions per NPC
      severityDecayPerDay: 1,            // Rumors decay 1 severity per day
      minSeverityToMention: 10,          // Min severity for NPC to mention
      spreadChancePerTick: 0.2,          // 20% chance to spread each time tick
      maxRumorAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms before auto-removal
      skipAfterAcknowledgements: 3       // Skip if acknowledged 3+ times
    };

    // Fame thresholds for response options
    this.thresholds = {
      denyFame: 30,           // Need 30+ fame to successfully deny
      intimidateCriminal: 20, // Need 20+ criminal infamy to intimidate
      embraceLewdness: 25,    // Need 25+ slut infamy or lewdness to embrace
      seduceLewdness: 40      // Need 40+ to auto-seduce
    };
  }

  /**
   * Set rumor templates from loaded data
   * @param {Object} templates - Rumor templates data
   */
  setRumorTemplates(templates) {
    this.rumorTemplates = templates;
  }

  /**
   * Generate a unique rumor ID
   * @returns {string} Unique rumor ID
   */
  generateRumorId() {
    return `rumor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add a new rumor to the player
   * @param {Object} playerState - Player state object
   * @param {Object} rumorData - Rumor data
   * @returns {Object} Created rumor
   */
  addRumor(playerState, rumorData) {
    if (!playerState.rumors) {
      playerState.rumors = [];
    }

    const rumor = {
      id: rumorData.id || this.generateRumorId(),
      type: rumorData.type || 'mysterious',
      text: rumorData.text || 'Something happened...',
      severity: rumorData.severity || 30,
      originLocation: rumorData.originLocation || playerState.currentLocation,
      originEvent: rumorData.originEvent || null,
      spreadLocations: rumorData.spreadLocations || [rumorData.originLocation || playerState.currentLocation],
      dateCreated: Date.now(),
      canBeClearedWith: rumorData.canBeClearedWith || 'fame',
      clearDifficulty: rumorData.clearDifficulty || 30,
      lastMentioned: null,
      mentionCount: 0,
      acknowledged: false
    };

    // Don't add duplicate rumors from same event
    const existingRumor = playerState.rumors.find(r =>
      r.originEvent === rumor.originEvent && r.type === rumor.type
    );

    if (existingRumor) {
      // Just increase severity of existing rumor
      existingRumor.severity = Math.min(100, existingRumor.severity + rumor.severity * 0.5);
      return existingRumor;
    }

    playerState.rumors.push(rumor);

    // Also increase local infamy at origin location
    if (this.reputationSystem && rumor.originLocation) {
      const infamyAmount = Math.round(rumor.severity * 0.3);
      if (['slut', 'criminal', 'corrupted'].includes(rumor.type)) {
        this.reputationSystem.modifyLocalReputation(
          playerState,
          rumor.originLocation,
          rumor.type,
          infamyAmount,
          `Rumor: ${rumor.text}`
        );
      }
    }

    return rumor;
  }

  /**
   * Get rumors known at a specific location
   * @param {Object} playerState - Player state object
   * @param {string} locationId - Location ID
   * @returns {Array} Rumors known at this location
   */
  getRumorsAtLocation(playerState, locationId) {
    if (!playerState.rumors) return [];

    return playerState.rumors.filter(rumor =>
      rumor.spreadLocations?.includes(locationId) ||
      rumor.originLocation === locationId
    );
  }

  /**
   * Check if NPC should mention a rumor
   * @param {Object} playerState - Player state object
   * @param {Object} npc - NPC data
   * @param {string} locationId - Current location ID
   * @returns {Object|null} Rumor to mention, or null
   */
  shouldMentionRumor(playerState, npc, locationId) {
    if (!playerState.rumors || playerState.rumors.length === 0) {
      return null;
    }

    // Check cooldown for this NPC
    const cooldowns = playerState.rumorCooldowns || {};
    const lastMention = cooldowns[npc.id];
    if (lastMention && (Date.now() - lastMention) < this.config.cooldownDuration) {
      return null;
    }

    // Get rumors at this location
    const localRumors = this.getRumorsAtLocation(playerState, locationId);
    if (localRumors.length === 0) {
      return null;
    }

    // Filter out low severity and over-acknowledged rumors
    const mentionableRumors = localRumors.filter(rumor => {
      // Skip if too low severity
      if (rumor.severity < this.config.minSeverityToMention) return false;

      // Skip if acknowledged too many times and player has seen it
      if (rumor.acknowledged && rumor.mentionCount >= this.config.skipAfterAcknowledgements) {
        return false;
      }

      return true;
    });

    if (mentionableRumors.length === 0) {
      return null;
    }

    // Roll against NPC's rumor awareness
    const rumorAwareness = npc.rumorAwareness || 0.5;
    const rollChance = this.config.baseConfrontationChance * rumorAwareness;

    if (Math.random() > rollChance) {
      return null;
    }

    // Pick rumor weighted by severity
    const totalSeverity = mentionableRumors.reduce((sum, r) => sum + r.severity, 0);
    let roll = Math.random() * totalSeverity;

    for (const rumor of mentionableRumors) {
      roll -= rumor.severity;
      if (roll <= 0) {
        return rumor;
      }
    }

    return mentionableRumors[0];
  }

  /**
   * Get response options for a rumor confrontation
   * @param {Object} playerState - Player state object
   * @param {Object} rumor - The rumor being mentioned
   * @param {Object} npc - The NPC mentioning it
   * @returns {Array} Array of response options
   */
  getRumorResponseOptions(playerState, rumor, npc) {
    const options = [];

    const fame = playerState.fame?.value || 0;
    const slutInfamy = playerState.infamy?.slut || 0;
    const criminalInfamy = playerState.infamy?.criminal || 0;
    const lewdness = playerState.nsfwStats?.exhibitionism || 0;

    // Always available: Ignore
    options.push({
      id: 'ignore',
      label: 'Ignore it',
      description: 'Walk away without responding',
      enabled: true,
      consequence: 'No effect, but the rumor persists'
    });

    // Deny - requires fame
    const canDeny = fame >= this.thresholds.denyFame;
    options.push({
      id: 'deny',
      label: 'Deny the rumor',
      description: canDeny
        ? 'Use your good reputation to dismiss the rumor'
        : `Requires ${this.thresholds.denyFame} Fame (you have ${fame})`,
      enabled: canDeny,
      consequence: canDeny ? 'May clear the rumor if successful' : null
    });

    // Stutter - always available but has negative effect
    options.push({
      id: 'stutter',
      label: 'Stammer nervously',
      description: 'Your uncertain response makes things worse',
      enabled: true,
      consequence: 'Rumor severity increases'
    });

    // Intimidate - requires criminal infamy
    const canIntimidate = criminalInfamy >= this.thresholds.intimidateCriminal;
    options.push({
      id: 'intimidate',
      label: 'Threaten them',
      description: canIntimidate
        ? 'Use your fearsome reputation to silence them'
        : `Requires ${this.thresholds.intimidateCriminal} Criminal Infamy (you have ${criminalInfamy})`,
      enabled: canIntimidate,
      consequence: canIntimidate ? 'Clears rumor locally, increases criminal infamy' : null
    });

    // Embrace - requires lewdness or slut infamy (only for slut rumors)
    if (rumor.type === 'slut') {
      const lewdnessValue = Math.max(slutInfamy, lewdness);
      const canEmbrace = lewdnessValue >= this.thresholds.embraceLewdness;
      const canAutoSeduce = npc.nsfwEnabled && npc.canBeSeduced &&
        lewdnessValue >= this.thresholds.seduceLewdness;

      options.push({
        id: 'embrace',
        label: canAutoSeduce ? 'Embrace and seduce' : 'Embrace the rumor',
        description: canEmbrace
          ? canAutoSeduce
            ? 'Own your reputation and offer to prove it...'
            : 'Own your reputation proudly'
          : `Requires ${this.thresholds.embraceLewdness} Lewdness/Slut Infamy (you have ${lewdnessValue})`,
        enabled: canEmbrace,
        nsfwEnabled: npc.nsfwEnabled && npc.canBeSeduced,
        autoSeduce: canAutoSeduce,
        consequence: canEmbrace
          ? canAutoSeduce
            ? 'Triggers seduction scene'
            : 'Increases slut infamy, NPC may become interested'
          : null
      });
    }

    // Bribe - always available if player has gold (for criminal rumors)
    if (rumor.type === 'criminal') {
      const bribeCost = Math.round(rumor.severity * 5);
      const canAffordBribe = (playerState.gold || 0) >= bribeCost;

      options.push({
        id: 'bribe',
        label: `Bribe them (${bribeCost}g)`,
        description: canAffordBribe
          ? 'Pay them to forget what they heard'
          : `Requires ${bribeCost} gold (you have ${playerState.gold || 0})`,
        enabled: canAffordBribe,
        cost: bribeCost,
        consequence: canAffordBribe ? 'Clears rumor at this location' : null
      });
    }

    return options;
  }

  /**
   * Process a rumor response
   * @param {Object} playerState - Player state object
   * @param {Object} rumor - The rumor
   * @param {string} responseId - ID of chosen response
   * @param {Object} npc - The NPC
   * @returns {Object} Result of the response
   */
  processRumorResponse(playerState, rumor, responseId, npc) {
    const result = {
      responseId,
      success: false,
      message: '',
      effects: [],
      triggerScene: null
    };

    // Update rumor tracking
    rumor.lastMentioned = Date.now();
    rumor.mentionCount += 1;
    rumor.acknowledged = true;

    // Set cooldown for this NPC
    if (!playerState.rumorCooldowns) {
      playerState.rumorCooldowns = {};
    }
    playerState.rumorCooldowns[npc.id] = Date.now();

    switch (responseId) {
      case 'ignore':
        result.success = true;
        result.message = 'You walk away without responding.';
        break;

      case 'deny':
        // Roll against fame vs rumor difficulty
        const fame = playerState.fame?.value || 0;
        const denyRoll = Math.random() * 100;
        const denySuccess = (fame - rumor.clearDifficulty + 50) > denyRoll;

        if (denySuccess) {
          result.success = true;
          result.message = 'Your reputation speaks for itself. The rumor is dismissed.';

          // Reduce severity
          rumor.severity = Math.max(0, rumor.severity - 30);

          // Remove from this location's spread
          const locIndex = rumor.spreadLocations.indexOf(playerState.currentLocation);
          if (locIndex > -1) {
            rumor.spreadLocations.splice(locIndex, 1);
          }

          result.effects.push({ type: 'rumor_reduced', value: -30 });
        } else {
          result.success = false;
          result.message = 'They don\'t seem convinced by your denial.';
        }
        break;

      case 'stutter':
        result.success = false;
        result.message = 'Your nervous response only confirms their suspicions.';

        // Increase severity
        rumor.severity = Math.min(100, rumor.severity + 10);
        result.effects.push({ type: 'rumor_increased', value: 10 });
        break;

      case 'intimidate':
        result.success = true;
        result.message = 'They back away nervously, mumbling apologies.';

        // Remove from this location
        const intLocIndex = rumor.spreadLocations.indexOf(playerState.currentLocation);
        if (intLocIndex > -1) {
          rumor.spreadLocations.splice(intLocIndex, 1);
        }

        // Increase criminal infamy locally
        if (this.reputationSystem) {
          this.reputationSystem.modifyLocalReputation(
            playerState,
            playerState.currentLocation,
            'criminal',
            5,
            'Intimidated someone about rumors'
          );
        }

        result.effects.push({ type: 'criminal_infamy', value: 5 });
        break;

      case 'embrace':
        result.success = true;
        const options = this.getRumorResponseOptions(playerState, rumor, npc);
        const embraceOption = options.find(o => o.id === 'embrace');

        if (embraceOption?.autoSeduce) {
          result.message = 'You lean in with a knowing smile...';
          result.triggerScene = 'seduce_' + npc.id;
          result.effects.push({ type: 'trigger_seduction', npcId: npc.id });
        } else {
          result.message = 'You own your reputation with a confident smirk.';

          // Increase slut infamy
          if (this.reputationSystem) {
            this.reputationSystem.modifyLocalReputation(
              playerState,
              playerState.currentLocation,
              'slut',
              5,
              'Embraced lewd reputation'
            );
          }

          result.effects.push({ type: 'slut_infamy', value: 5 });
        }
        break;

      case 'bribe':
        const bribeCost = Math.round(rumor.severity * 5);

        if (playerState.gold >= bribeCost) {
          playerState.gold -= bribeCost;
          result.success = true;
          result.message = `You hand over ${bribeCost} gold. They suddenly remember nothing.`;

          // Remove from this location
          const bribeLocIndex = rumor.spreadLocations.indexOf(playerState.currentLocation);
          if (bribeLocIndex > -1) {
            rumor.spreadLocations.splice(bribeLocIndex, 1);
          }

          result.effects.push({ type: 'gold_spent', value: -bribeCost });
        } else {
          result.success = false;
          result.message = 'You don\'t have enough gold.';
        }
        break;

      default:
        result.message = 'Nothing happens.';
    }

    // Clean up rumors with no spread locations
    playerState.rumors = playerState.rumors.filter(r =>
      r.spreadLocations.length > 0 || r.severity > 0
    );

    return result;
  }

  /**
   * Spread rumors to neighboring locations over time
   * @param {Object} playerState - Player state object
   * @param {Array} allLocations - All game locations
   */
  spreadRumors(playerState, allLocations) {
    if (!playerState.rumors) return;

    for (const rumor of playerState.rumors) {
      // Only spread if severity is high enough
      if (rumor.severity < this.config.minSeverityToMention) continue;

      // Random chance to spread
      if (Math.random() > this.config.spreadChancePerTick) continue;

      // For each location where rumor is known
      for (const locationId of [...rumor.spreadLocations]) {
        const location = allLocations.find(l => l.id === locationId);
        if (!location) continue;

        // Get neighboring inhabited locations
        const neighbors = (location.neighbors || location.connectedLocations || []);

        for (const neighborId of neighbors) {
          // Skip if already spread there
          if (rumor.spreadLocations.includes(neighborId)) continue;

          // Check if neighbor is inhabited
          const neighbor = allLocations.find(l => l.id === neighborId);
          if (!neighbor) continue;

          const isInhabited = neighbor.inhabited ||
            neighbor.tags?.includes('inhabited') ||
            neighbor.tags?.includes('town') ||
            neighbor.tags?.includes('city') ||
            neighbor.tags?.includes('village') ||
            neighbor.tags?.includes('shop') ||
            neighbor.tags?.includes('inn');

          if (!isInhabited) continue;

          // Spread with probability based on severity
          const spreadChance = rumor.severity / 200; // 50% at max severity
          if (Math.random() < spreadChance) {
            rumor.spreadLocations.push(neighborId);
          }
        }
      }
    }
  }

  /**
   * Decay rumors over time
   * @param {Object} playerState - Player state object
   * @param {number} daysPassed - Number of days that have passed
   */
  decayRumors(playerState, daysPassed = 1) {
    if (!playerState.rumors) return;

    const now = Date.now();
    const decayAmount = this.config.severityDecayPerDay * daysPassed;

    // Decay severity and remove old rumors
    playerState.rumors = playerState.rumors.filter(rumor => {
      // Remove if too old
      if (now - rumor.dateCreated > this.config.maxRumorAge) {
        return false;
      }

      // Decay severity
      rumor.severity = Math.max(0, rumor.severity - decayAmount);

      // Remove if severity is 0 and no spread locations
      if (rumor.severity <= 0 && rumor.spreadLocations.length === 0) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get NPC dialogue for mentioning a rumor
   * @param {Object} rumor - The rumor
   * @param {Object} npc - The NPC
   * @returns {string} Dialogue text
   */
  getRumorDialogue(rumor, npc) {
    // Try to get from templates
    const templates = this.rumorTemplates?.npcDialogue?.[rumor.type];
    if (templates) {
      // Pick a random template
      const tones = Object.keys(templates);
      const tone = tones[Math.floor(Math.random() * tones.length)];
      return templates[tone];
    }

    // Default dialogue based on type
    const defaultDialogues = {
      slut: [
        "I've heard... interesting things about you.",
        "Word travels fast about your... activities.",
        "People are talking about you, you know."
      ],
      criminal: [
        "I've heard you're not exactly law-abiding.",
        "Some say you've done some shady things.",
        "Word is you've had trouble with the law."
      ],
      corrupted: [
        "There's something... different about you.",
        "I've heard whispers about dark dealings.",
        "Some say you've been touched by darkness."
      ],
      heroic: [
        "I've heard tales of your bravery!",
        "You're the one everyone's been talking about!",
        "A hero stands before me!"
      ],
      mysterious: [
        "I've heard strange things about you.",
        "People whisper your name in odd ways.",
        "There are rumors about you..."
      ]
    };

    const typeDialogues = defaultDialogues[rumor.type] || defaultDialogues.mysterious;
    return typeDialogues[Math.floor(Math.random() * typeDialogues.length)];
  }

  /**
   * Get all rumors summary for pause menu
   * @param {Object} playerState - Player state object
   * @returns {Object} Rumors summary
   */
  getRumorsSummary(playerState) {
    if (!playerState.rumors || playerState.rumors.length === 0) {
      return {
        totalRumors: 0,
        byType: {},
        mostSevere: null,
        mostSpread: null,
        rumors: []
      };
    }

    const byType = {};
    let mostSevere = null;
    let mostSpread = null;

    for (const rumor of playerState.rumors) {
      // Count by type
      byType[rumor.type] = (byType[rumor.type] || 0) + 1;

      // Track most severe
      if (!mostSevere || rumor.severity > mostSevere.severity) {
        mostSevere = rumor;
      }

      // Track most spread
      if (!mostSpread || rumor.spreadLocations.length > mostSpread.spreadLocations.length) {
        mostSpread = rumor;
      }
    }

    return {
      totalRumors: playerState.rumors.length,
      byType,
      mostSevere,
      mostSpread,
      rumors: [...playerState.rumors].sort((a, b) => b.severity - a.severity)
    };
  }
}

export default RumorSystem;
