/**
 * PublicEventSystem.js - Handles NSFW events in public and their consequences
 *
 * When NSFW events (sex, birth, etc.) happen outside safe/private areas:
 * - Calculate witness chance based on location properties
 * - Generate rumors if witnessed
 * - Apply infamy (local for inhabited, global for wilderness)
 * - Trigger location-specific reactions (barring, scenes, etc.)
 * - Handle special location tags (corrupted church, shady clinic)
 */

class PublicEventSystem {
  constructor(reputationSystem, rumorSystem, discoverySystem) {
    this.reputationSystem = reputationSystem;
    this.rumorSystem = rumorSystem;
    this.discoverySystem = discoverySystem;

    // Base witness chances by location type
    this.baseWitnessChances = {
      town: 0.7,
      village: 0.5,
      city: 0.8,
      inn: 0.6,
      tavern: 0.7,
      road: 0.3,
      path: 0.2,
      forest: 0.15,
      cave: 0.1,
      dungeon: 0.05,
      wilderness: 0.1,
      temple: 0.6,
      church: 0.6,
      clinic: 0.5,
      nursery: 0.4,
      outdoor: 0.25,
      indoor: 0.35
    };

    // NSFW event types and their base severity
    this.eventSeverities = {
      public_sex: { base: 30, rumorType: 'slut', infamyType: 'slut' },
      public_birth: { base: 20, rumorType: 'mysterious', infamyType: 'slut' },
      public_egg_laying: { base: 25, rumorType: 'mysterious', infamyType: 'slut' },
      public_masturbation: { base: 15, rumorType: 'slut', infamyType: 'slut' },
      public_nudity: { base: 10, rumorType: 'slut', infamyType: 'slut' },
      public_lactation: { base: 12, rumorType: 'mysterious', infamyType: 'slut' },
      public_transformation: { base: 25, rumorType: 'corrupted', infamyType: 'corrupted' },
      public_corruption: { base: 35, rumorType: 'corrupted', infamyType: 'corrupted' },
      public_demon_summon: { base: 50, rumorType: 'corrupted', infamyType: 'corrupted' }
    };

    // Infamy gains are intentionally small for slow burn
    this.infamyMultiplier = 0.5; // Half of base severity
  }

  /**
   * Process a public NSFW event
   */
  processPublicEvent(eventType, location, playerState, eventDetails = {}) {
    const result = {
      witnessed: false,
      witnesses: [],
      rumors: [],
      infamyGains: {},
      localReputationChanges: {},
      globalReputationChanges: {},
      locationReactions: [],
      triggeredScenes: [],
      barringProgress: null
    };

    // Get event config
    const eventConfig = this.eventSeverities[eventType];
    if (!eventConfig) {
      return { ...result, error: `Unknown event type: ${eventType}` };
    }

    // Check if location is private/safe from witnessing
    if (this._isPrivateLocation(location, playerState)) {
      return { ...result, private: true };
    }

    // Calculate witness chance
    const witnessChance = this._calculateWitnessChance(location, playerState, eventType);

    // Roll for witnesses
    const witnessRoll = Math.random();
    result.witnessed = witnessRoll < witnessChance;

    if (result.witnessed) {
      // Generate witness details
      result.witnesses = this._generateWitnesses(location, eventType);

      // Calculate infamy gain (small for slow burn)
      const baseInfamy = eventConfig.base * this.infamyMultiplier;
      const adjustedInfamy = this._adjustInfamyForLocation(baseInfamy, location);

      // Apply reputation changes
      if (this._isInhabitedLocation(location)) {
        // Local reputation impact
        const localChange = {
          type: eventConfig.infamyType,
          amount: adjustedInfamy,
          reason: eventType
        };
        result.localReputationChanges[location.id] = localChange;

        // Apply through reputation system if available
        if (this.reputationSystem) {
          this.reputationSystem.modifyLocalReputation(
            playerState,
            location.id,
            eventConfig.infamyType,
            adjustedInfamy,
            eventType
          );
        }
      } else {
        // Global reputation impact (slightly smaller for wilderness)
        const globalInfamy = adjustedInfamy * 0.7;
        result.globalReputationChanges = {
          type: eventConfig.infamyType,
          amount: globalInfamy,
          reason: eventType
        };

        // Apply to player state
        if (playerState.infamy) {
          playerState.infamy[eventConfig.infamyType] =
            (playerState.infamy[eventConfig.infamyType] || 0) + globalInfamy;
        }
      }

      // Generate rumor if witnessed
      if (this.rumorSystem) {
        const rumor = this.rumorSystem.addRumor(playerState, {
          type: eventConfig.rumorType,
          text: this._generateRumorText(eventType, location),
          severity: eventConfig.base,
          originLocation: location.id,
          originEvent: eventType
        });
        if (rumor) {
          result.rumors.push(rumor);
        }
      }

      // Check for location-specific reactions
      const reactions = this._checkLocationReactions(location, playerState, eventType, eventDetails);
      result.locationReactions = reactions.reactions;
      result.triggeredScenes = reactions.scenes;
      result.barringProgress = reactions.barringProgress;
    }

    // Record the offense (even if not witnessed, for tracking)
    this._recordOffense(location.id, eventType, result.witnessed, playerState);

    // Increment NSFW event count for discovery system
    if (this.discoverySystem) {
      this.discoverySystem.recordInteraction(location, playerState, 'nsfwEvent');
    }

    return result;
  }

  /**
   * Check if location is private/safe from witnessing
   */
  _isPrivateLocation(location, playerState) {
    const tags = location.tags || [];

    // Rented room, private chamber, etc.
    if (tags.includes('private') || tags.includes('rented')) {
      return true;
    }

    // Nursery is specifically for birthing, no shame there
    if (tags.includes('nursery') || tags.includes('birthing_center')) {
      return true;
    }

    // Check for location-specific privacy settings
    if (location.privacy?.guaranteed) {
      return true;
    }

    return false;
  }

  /**
   * Calculate witness chance based on location and time
   */
  _calculateWitnessChance(location, playerState, eventType) {
    let baseChance = 0;
    const tags = location.tags || [];

    // Get base chance from location tags
    for (const tag of tags) {
      if (this.baseWitnessChances[tag] !== undefined) {
        baseChance = Math.max(baseChance, this.baseWitnessChances[tag]);
      }
    }

    // Use location's custom witness chance if specified
    if (location.witnessConfig?.baseChance !== undefined) {
      baseChance = location.witnessConfig.baseChance;
    }

    // Modify by time of day
    const hour = playerState.currentTime?.hour || 12;
    if (hour >= 22 || hour < 6) {
      baseChance *= 0.5; // Night time, fewer witnesses
    } else if (hour >= 10 && hour < 18) {
      baseChance *= 1.2; // Peak hours
    }

    // Modify by location traffic
    if (location.largeLocation) {
      baseChance *= 1.3;
    }
    if (location.markets) {
      baseChance *= 1 + (location.markets * 0.1);
    }

    // Modify by event type (some are more noticeable)
    if (eventType === 'public_birth' || eventType === 'public_egg_laying') {
      baseChance *= 1.5; // Hard to hide screaming
    }
    if (eventType === 'public_nudity') {
      baseChance *= 0.8; // Easier to go unnoticed
    }

    // Cap at 95%
    return Math.min(0.95, baseChance);
  }

  /**
   * Generate witness details
   */
  _generateWitnesses(location, eventType) {
    const witnesses = [];
    const npcs = location.npcs || [];

    // Location NPCs might witness
    for (const npcId of npcs) {
      if (Math.random() < 0.5) {
        witnesses.push({ type: 'npc', id: npcId });
      }
    }

    // Random passersby based on location type
    const tags = location.tags || [];
    let passerbyCount = 0;

    if (tags.includes('town') || tags.includes('city')) {
      passerbyCount = Math.floor(Math.random() * 5) + 1;
    } else if (tags.includes('village') || tags.includes('inn')) {
      passerbyCount = Math.floor(Math.random() * 3);
    } else if (tags.includes('road') || tags.includes('path')) {
      passerbyCount = Math.random() < 0.3 ? 1 : 0;
    }

    for (let i = 0; i < passerbyCount; i++) {
      witnesses.push({ type: 'passerby', id: `passerby_${i}` });
    }

    return witnesses;
  }

  /**
   * Check if location is inhabited
   */
  _isInhabitedLocation(location) {
    const tags = location.tags || [];
    return location.inhabited || tags.includes('inhabited') ||
           tags.includes('town') || tags.includes('village') ||
           tags.includes('city') || tags.includes('inn');
  }

  /**
   * Adjust infamy based on location type
   */
  _adjustInfamyForLocation(baseInfamy, location) {
    const tags = location.tags || [];
    const trueTags = this.discoverySystem
      ? this.discoverySystem.getTrueTags(location)
      : tags;

    let multiplier = 1.0;

    // Religious locations are more scandalous
    if (tags.includes('temple') || tags.includes('church')) {
      multiplier *= 1.5;
    }

    // Holy/divine locations even more so
    if (trueTags.includes('divine') || trueTags.includes('holy')) {
      multiplier *= 1.8;
    }

    // Corrupted/shady locations care less
    if (trueTags.includes('corrupted') || trueTags.includes('shady')) {
      multiplier *= 0.5;
    }

    // Towns/cities spread rumors faster
    if (tags.includes('city')) {
      multiplier *= 1.3;
    }

    return Math.round(baseInfamy * multiplier * 10) / 10; // Round to 1 decimal
  }

  /**
   * Check for location-specific reactions to NSFW events
   */
  _checkLocationReactions(location, playerState, eventType, eventDetails) {
    const result = {
      reactions: [],
      scenes: [],
      barringProgress: null
    };

    const tags = location.tags || [];
    const trueTags = this.discoverySystem
      ? this.discoverySystem.getTrueTags(location)
      : tags;
    const nsfwReactions = location.nsfwReactions || {};

    // Check church/temple reactions
    if (tags.includes('church') || tags.includes('temple')) {
      const churchReaction = this._handleChurchReaction(
        location, playerState, eventType, trueTags
      );
      if (churchReaction) {
        result.reactions.push(churchReaction);
        if (churchReaction.scene) {
          result.scenes.push(churchReaction.scene);
        }
        if (churchReaction.barringProgress) {
          result.barringProgress = churchReaction.barringProgress;
        }
      }
    }

    // Check clinic reactions
    if (tags.includes('clinic') || tags.includes('hospital')) {
      const clinicReaction = this._handleClinicReaction(
        location, playerState, eventType, trueTags, eventDetails
      );
      if (clinicReaction) {
        result.reactions.push(clinicReaction);
        if (clinicReaction.scene) {
          result.scenes.push(clinicReaction.scene);
        }
      }
    }

    // Check custom location reactions
    if (nsfwReactions[eventType]) {
      const customReaction = nsfwReactions[eventType];
      if (this._checkReactionConditions(customReaction.conditions, playerState)) {
        result.reactions.push({
          type: 'custom',
          config: customReaction
        });
        if (customReaction.scene) {
          result.scenes.push(customReaction.scene);
        }
      }
    }

    return result;
  }

  /**
   * Handle church/temple specific reactions
   */
  _handleChurchReaction(location, playerState, eventType, trueTags) {
    const locationId = location.id;
    const offenses = playerState.locationOffenses?.[locationId];
    const offenseCount = (offenses?.count || 0) + 1; // +1 for current event

    // Check if church is corrupted (different reaction)
    if (trueTags.includes('corrupted')) {
      // Corrupted church might embrace the behavior
      if (Math.random() < 0.3 + (offenseCount * 0.1)) {
        return {
          type: 'corrupted_church_interest',
          message: 'The priests seem... interested in your behavior.',
          scene: location.nsfwReactions?.corrupted_interest?.scene || 'corrupted_church_interest',
          infamyReduction: 5 // They approve, less infamy here
        };
      }
      return null;
    }

    // Normal church - chance of barring increases with offenses
    // Base 5% chance, +10% per offense
    const barChance = 0.05 + (offenseCount * 0.1);

    // More severe events have higher bar chance
    let severityMultiplier = 1.0;
    if (eventType === 'public_sex' || eventType === 'public_birth') {
      severityMultiplier = 1.5;
    }
    if (eventType === 'public_demon_summon' || eventType === 'public_corruption') {
      severityMultiplier = 3.0;
    }

    const finalBarChance = Math.min(0.9, barChance * severityMultiplier);

    if (Math.random() < finalBarChance) {
      // Player is barred from this church
      return {
        type: 'church_barring',
        message: 'The priests are horrified by your behavior! You have been barred from this holy place.',
        barringProgress: {
          barred: true,
          locationId,
          offenseCount,
          redemptionTasks: this._generateChurchRedemptionTasks(offenseCount)
        }
      };
    } else if (offenseCount >= 2) {
      // Warning before barring
      return {
        type: 'church_warning',
        message: 'The priests look at you with deep disapproval. One more transgression and you may be barred.',
        barringProgress: {
          barred: false,
          warning: true,
          offenseCount
        }
      };
    }

    return null;
  }

  /**
   * Handle clinic specific reactions
   */
  _handleClinicReaction(location, playerState, eventType, trueTags, eventDetails) {
    // Check for shady clinic
    if (trueTags.includes('shady')) {
      // Shady clinic might take advantage of unconscious/vulnerable player
      if (eventDetails.passedOut || eventDetails.exhausted) {
        if (Math.random() < 0.4) {
          return {
            type: 'shady_clinic_experiment',
            message: 'You black out... When you wake, something feels different.',
            scene: location.nsfwReactions?.experiment?.scene || 'shady_clinic_experiment'
          };
        }
      }
    }

    // Normal clinic is more understanding but still disapproving
    if (eventType === 'public_birth' || eventType === 'public_egg_laying') {
      return {
        type: 'clinic_assistance',
        message: 'The medical staff rush to assist you, though they seem uncomfortable.',
        // Reduces infamy slightly - they understand it's medical
        infamyReduction: 10
      };
    }

    return null;
  }

  /**
   * Generate redemption tasks for church barring
   */
  _generateChurchRedemptionTasks(offenseCount) {
    const tasks = [];

    // More offenses = more tasks
    const taskCount = Math.min(5, Math.ceil(offenseCount / 2) + 1);

    // Always require some gold donation
    tasks.push({
      type: 'gold',
      amount: 100 * offenseCount,
      paid: false,
      description: `Donate ${100 * offenseCount} gold as penance`
    });

    // Charity work
    if (taskCount >= 2) {
      tasks.push({
        type: 'charity',
        hours: 4 * offenseCount,
        completed: 0,
        description: `Complete ${4 * offenseCount} hours of charity work`
      });
    }

    // Quest completion for severe cases
    if (taskCount >= 3) {
      tasks.push({
        type: 'quest',
        questId: 'church_redemption',
        completed: false,
        description: 'Complete a redemption quest for the church'
      });
    }

    // Wait time
    if (taskCount >= 4) {
      tasks.push({
        type: 'time',
        hours: 168 * offenseCount, // 1 week per offense
        startedAt: null,
        description: `Wait ${offenseCount} week(s) before returning`
      });
    }

    return tasks;
  }

  /**
   * Record an offense at a location
   */
  _recordOffense(locationId, eventType, witnessed, playerState) {
    if (!playerState.locationOffenses) {
      playerState.locationOffenses = {};
    }

    if (!playerState.locationOffenses[locationId]) {
      playerState.locationOffenses[locationId] = {
        count: 0,
        lastOffense: null,
        offenseHistory: []
      };
    }

    const offenses = playerState.locationOffenses[locationId];
    offenses.count++;
    offenses.lastOffense = Date.now();
    offenses.offenseHistory.push({
      type: eventType,
      witnessed,
      timestamp: Date.now()
    });
  }

  /**
   * Check if reaction conditions are met
   */
  _checkReactionConditions(conditions, playerState) {
    if (!conditions) return true;

    // Check all conditions
    for (const [key, value] of Object.entries(conditions)) {
      switch (key) {
        case 'minOffenses':
          const offenseCount = playerState.locationOffenses?.[conditions.locationId]?.count || 0;
          if (offenseCount < value) return false;
          break;

        case 'hasTag':
          // Would need location context
          break;

        case 'playerStat':
          const stat = this._getNestedStat(playerState, value.stat);
          if (value.min !== undefined && stat < value.min) return false;
          if (value.max !== undefined && stat > value.max) return false;
          break;

        case 'random':
          if (Math.random() >= value) return false;
          break;
      }
    }

    return true;
  }

  /**
   * Generate rumor text based on event
   */
  _generateRumorText(eventType, location) {
    const locationName = location.name || 'an unknown place';

    const rumorTemplates = {
      public_sex: [
        `was seen engaging in carnal acts at ${locationName}`,
        `couldn't control their urges at ${locationName}`,
        `put on quite a show for onlookers at ${locationName}`
      ],
      public_birth: [
        `gave birth in public at ${locationName}`,
        `was seen delivering a child at ${locationName} of all places`,
        `brought new life into the world right there at ${locationName}`
      ],
      public_egg_laying: [
        `was seen laying eggs at ${locationName}`,
        `produced eggs in full view at ${locationName}`,
        `left behind a clutch of eggs at ${locationName}`
      ],
      public_masturbation: [
        `was caught pleasuring themselves at ${locationName}`,
        `couldn't wait for privacy at ${locationName}`,
        `was seen touching themselves at ${locationName}`
      ],
      public_nudity: [
        `was seen without clothes at ${locationName}`,
        `walked around naked at ${locationName}`,
        `exposed themselves at ${locationName}`
      ],
      public_transformation: [
        `underwent a strange transformation at ${locationName}`,
        `changed into something else at ${locationName}`,
        `was seen shifting forms at ${locationName}`
      ],
      public_corruption: [
        `was touched by dark forces at ${locationName}`,
        `showed signs of corruption at ${locationName}`,
        `was seen communing with darkness at ${locationName}`
      ]
    };

    const templates = rumorTemplates[eventType] || [`did something scandalous at ${locationName}`];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  _getNestedStat(playerState, path) {
    const keys = path.split('.');
    let value = playerState;
    for (const key of keys) {
      if (value === undefined || value === null) return 0;
      value = value[key];
    }
    return value ?? 0;
  }
}

export default PublicEventSystem;
