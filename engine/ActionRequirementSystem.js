/**
 * @fileoverview ActionRequirementSystem - Validates action requirements with complex conditions
 *
 * Checks if actions (sleep, rest, etc.) are allowed based on:
 * - Location tags (safe, inn, dangerous, etc.)
 * - Lodging status (inn room rental, property rental)
 * - Items (camping supplies, key items)
 * - Flags and game state
 * - Complex AND/OR/NOT conditions
 *
 * @module engine/ActionRequirementSystem
 */

/**
 * Default action requirements configuration
 */
const DEFAULT_ACTION_REQUIREMENTS = {
  sleep: {
    type: 'or',
    conditions: [
      // Can sleep at safe locations without lodging
      { type: 'location_tag', tag: 'safe' },
      // Can sleep at inn if you have a room
      {
        type: 'and',
        conditions: [
          { type: 'location_tag', tag: 'inn' },
          { type: 'has_lodging', lodgingType: 'inn_room' }
        ]
      },
      // Can sleep at rented property
      { type: 'has_lodging', lodgingType: 'rented_property' },
      // Can sleep anywhere with camping supplies
      { type: 'has_item', itemId: 'camping_supplies' },
      // Can sleep if location explicitly allows it (multiple tag options)
      { type: 'location_tag', tag: 'can_sleep' },
      { type: 'location_tag', tag: 'shelter' },
      { type: 'location_tag', tag: 'camp_spot' },
      { type: 'location_tag', tag: 'rest_area' }
    ],
    failureMessage: 'You cannot sleep here.',
    failureMessages: {
      inn_no_room: 'You need to rent a room from the innkeeper first.',
      dangerous: 'It\'s too dangerous to sleep here without shelter.',
      default: 'You have nowhere safe to rest.'
    }
  },

  rest: {
    type: 'or',
    conditions: [
      { type: 'location_tag', tag: 'safe' },
      { type: 'location_tag', tag: 'inn' },
      { type: 'location_tag', tag: 'can_rest' },
      { type: 'has_item', itemId: 'camping_supplies' }
    ],
    failureMessage: 'You cannot rest here safely.'
  }
};

export class ActionRequirementSystem {
  /**
   * @param {Object} lodgingSystem - Reference to LodgingSystem for lodging checks
   * @param {Object} options - Configuration options
   */
  constructor(lodgingSystem, options = {}) {
    this.lodgingSystem = lodgingSystem;
    this.actionRequirements = { ...DEFAULT_ACTION_REQUIREMENTS, ...options.customRequirements };
    this.customConditionHandlers = new Map();
  }

  /**
   * Check if an action is allowed
   * @param {string} actionId - The action to check (e.g., 'sleep', 'rest')
   * @param {Object} player - Player state
   * @param {Object} gameState - Game state
   * @param {Object} location - Current location data
   * @returns {Object} { allowed: boolean, unmetRequirements: string[], message: string, reason?: string }
   */
  checkActionRequirements(actionId, player, gameState, location) {
    const requirements = this.actionRequirements[actionId];

    if (!requirements) {
      // No requirements defined = always allowed
      return { allowed: true, unmetRequirements: [], message: '' };
    }

    const context = {
      player,
      gameState,
      location,
      currentDay: player.currentTime?.day || 1
    };

    const result = this.evaluateCondition(requirements, context);

    if (result.satisfied) {
      return {
        allowed: true,
        unmetRequirements: [],
        message: '',
        satisfiedBy: result.satisfiedBy
      };
    }

    // Determine appropriate failure message
    const message = this.getFailureMessage(requirements, result, context);

    return {
      allowed: false,
      unmetRequirements: result.unmet,
      message,
      reason: result.reason
    };
  }

  /**
   * Evaluate a condition (recursive for nested conditions)
   * @param {Object} condition - Condition to evaluate
   * @param {Object} context - Evaluation context
   * @returns {Object} { satisfied: boolean, unmet: string[], reason?: string, satisfiedBy?: string }
   */
  evaluateCondition(condition, context) {
    if (!condition) {
      return { satisfied: true, unmet: [] };
    }

    // Handle array as AND
    if (Array.isArray(condition)) {
      return this.evaluateAnd({ conditions: condition }, context);
    }

    // Handle compound conditions
    if (condition.type === 'and' || condition.and) {
      return this.evaluateAnd(condition, context);
    }

    if (condition.type === 'or' || condition.or) {
      return this.evaluateOr(condition, context);
    }

    if (condition.type === 'not' || condition.not) {
      return this.evaluateNot(condition, context);
    }

    // Handle atomic conditions
    return this.evaluateAtomicCondition(condition, context);
  }

  /**
   * Evaluate AND condition - all must be true
   */
  evaluateAnd(condition, context) {
    const conditions = condition.conditions || condition.and || [];
    const unmet = [];
    let reason = null;

    for (const cond of conditions) {
      const result = this.evaluateCondition(cond, context);
      if (!result.satisfied) {
        unmet.push(...result.unmet);
        if (!reason) reason = result.reason;
      }
    }

    return {
      satisfied: unmet.length === 0,
      unmet,
      reason
    };
  }

  /**
   * Evaluate OR condition - at least one must be true
   */
  evaluateOr(condition, context) {
    const conditions = condition.conditions || condition.or || [];
    const allUnmet = [];
    let satisfiedBy = null;

    for (const cond of conditions) {
      const result = this.evaluateCondition(cond, context);
      if (result.satisfied) {
        return {
          satisfied: true,
          unmet: [],
          satisfiedBy: result.satisfiedBy || this.getConditionDescription(cond)
        };
      }
      allUnmet.push(...result.unmet);
    }

    // Determine best reason based on context
    const reason = this.determineBestReason(conditions, context);

    return {
      satisfied: false,
      unmet: allUnmet,
      reason
    };
  }

  /**
   * Evaluate NOT condition - must be false
   */
  evaluateNot(condition, context) {
    const innerCondition = condition.condition || condition.not;
    const result = this.evaluateCondition(innerCondition, context);

    return {
      satisfied: !result.satisfied,
      unmet: result.satisfied ? [this.getConditionDescription(innerCondition)] : []
    };
  }

  /**
   * Evaluate atomic (simple) condition
   */
  evaluateAtomicCondition(condition, context) {
    const { player, gameState, location, currentDay } = context;

    switch (condition.type) {
      case 'location_tag':
        const locationTags = location?.tags || [];
        const hasTag = locationTags.includes(condition.tag);
        return {
          satisfied: hasTag,
          unmet: hasTag ? [] : [`Location must have tag: ${condition.tag}`],
          reason: hasTag ? null : `location_no_${condition.tag}`,
          satisfiedBy: hasTag ? `location_tag:${condition.tag}` : null
        };

      case 'has_lodging':
        return this.checkLodgingCondition(condition, context);

      case 'has_item':
        const hasItem = player?.inventory?.some(i =>
          i.id === condition.itemId && (!condition.count || (i.count || 1) >= condition.count)
        );
        return {
          satisfied: hasItem,
          unmet: hasItem ? [] : [`Requires item: ${condition.itemId}`],
          satisfiedBy: hasItem ? `has_item:${condition.itemId}` : null
        };

      case 'has_gold':
        const hasGold = (player?.gold || 0) >= condition.amount;
        return {
          satisfied: hasGold,
          unmet: hasGold ? [] : [`Requires ${condition.amount} gold`]
        };

      case 'flag':
        const flagValue = gameState?.worldFlags?.[condition.flag];
        let flagSatisfied = false;

        if (condition.operator) {
          switch (condition.operator) {
            case 'equals':
              flagSatisfied = flagValue === condition.value;
              break;
            case 'notEquals':
              flagSatisfied = flagValue !== condition.value;
              break;
            case 'gt':
              flagSatisfied = flagValue > condition.value;
              break;
            case 'gte':
              flagSatisfied = flagValue >= condition.value;
              break;
            case 'lt':
              flagSatisfied = flagValue < condition.value;
              break;
            case 'lte':
              flagSatisfied = flagValue <= condition.value;
              break;
            default:
              flagSatisfied = !!flagValue;
          }
        } else {
          flagSatisfied = condition.value !== undefined
            ? flagValue === condition.value
            : !!flagValue;
        }

        return {
          satisfied: flagSatisfied,
          unmet: flagSatisfied ? [] : [`Flag check failed: ${condition.flag}`]
        };

      case 'stat':
        const statValue = player?.stats?.[condition.stat] || 0;
        let statSatisfied = false;

        switch (condition.operator || 'gte') {
          case 'equals':
            statSatisfied = statValue === condition.value;
            break;
          case 'gt':
            statSatisfied = statValue > condition.value;
            break;
          case 'gte':
            statSatisfied = statValue >= condition.value;
            break;
          case 'lt':
            statSatisfied = statValue < condition.value;
            break;
          case 'lte':
            statSatisfied = statValue <= condition.value;
            break;
          default:
            statSatisfied = statValue >= condition.value;
        }

        return {
          satisfied: statSatisfied,
          unmet: statSatisfied ? [] : [`${condition.stat} must be ${condition.operator || '>='} ${condition.value}`]
        };

      case 'level':
        const levelSatisfied = (player?.level || 1) >= condition.value;
        return {
          satisfied: levelSatisfied,
          unmet: levelSatisfied ? [] : [`Requires level ${condition.value}`]
        };

      case 'time_period':
        const currentPeriod = this.getCurrentTimePeriod(player?.currentTime);
        const periodSatisfied = condition.periods
          ? condition.periods.includes(currentPeriod)
          : currentPeriod === condition.period;
        return {
          satisfied: periodSatisfied,
          unmet: periodSatisfied ? [] : [`Must be during ${condition.period || condition.periods?.join(' or ')}`]
        };

      case 'custom':
        return this.evaluateCustomCondition(condition, context);

      case 'always':
        return { satisfied: true, unmet: [] };

      case 'never':
        return { satisfied: false, unmet: ['This action is never allowed'] };

      default:
        // Check custom handlers
        if (this.customConditionHandlers.has(condition.type)) {
          const handler = this.customConditionHandlers.get(condition.type);
          return handler(condition, context);
        }

        console.warn(`ActionRequirementSystem: Unknown condition type: ${condition.type}`);
        return { satisfied: true, unmet: [] };
    }
  }

  /**
   * Check lodging condition
   */
  checkLodgingCondition(condition, context) {
    const { player, location, currentDay } = context;

    if (!this.lodgingSystem) {
      console.warn('ActionRequirementSystem: LodgingSystem not available');
      return { satisfied: false, unmet: ['Lodging system unavailable'] };
    }

    const locationId = condition.locationId || location?.id;

    switch (condition.lodgingType) {
      case 'inn_room':
        const hasRoom = this.lodgingSystem.hasValidRoomAt(player, locationId, currentDay);
        return {
          satisfied: hasRoom,
          unmet: hasRoom ? [] : ['No valid inn room rental'],
          reason: hasRoom ? null : 'inn_no_room',
          satisfiedBy: hasRoom ? 'inn_room' : null
        };

      case 'rented_property':
        const hasProperty = this.lodgingSystem.hasAccessToAnyProperty(player, currentDay);
        // If locationId specified, check that specific property
        if (condition.propertyId) {
          const hasSpecificProperty = this.lodgingSystem.hasAccessToProperty(
            player, condition.propertyId, currentDay
          );
          return {
            satisfied: hasSpecificProperty,
            unmet: hasSpecificProperty ? [] : ['No access to property'],
            satisfiedBy: hasSpecificProperty ? 'rented_property' : null
          };
        }
        return {
          satisfied: hasProperty,
          unmet: hasProperty ? [] : ['No rented property access'],
          satisfiedBy: hasProperty ? 'rented_property' : null
        };

      case 'any':
        const sleepCheck = this.lodgingSystem.canSleepAt(player, locationId, currentDay);
        return {
          satisfied: sleepCheck.canSleep,
          unmet: sleepCheck.canSleep ? [] : [sleepCheck.reason],
          reason: sleepCheck.canSleep ? null : sleepCheck.reason,
          satisfiedBy: sleepCheck.canSleep ? sleepCheck.lodgingType : null
        };

      default:
        return { satisfied: false, unmet: [`Unknown lodging type: ${condition.lodgingType}`] };
    }
  }

  /**
   * Get current time period from time object
   */
  getCurrentTimePeriod(currentTime) {
    if (!currentTime) return 'morning';

    const hour = currentTime.hour || 8;

    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 19) return 'evening';
    if (hour >= 19 && hour < 21) return 'dusk';
    return 'night';
  }

  /**
   * Evaluate custom condition using registered handler
   */
  evaluateCustomCondition(condition, context) {
    if (condition.handler && typeof condition.handler === 'function') {
      try {
        const result = condition.handler(condition, context);
        return {
          satisfied: !!result,
          unmet: result ? [] : [condition.failureMessage || 'Custom condition not met']
        };
      } catch (error) {
        console.warn('ActionRequirementSystem: Custom condition error:', error);
        return { satisfied: false, unmet: ['Custom condition error'] };
      }
    }
    return { satisfied: false, unmet: ['Invalid custom condition'] };
  }

  /**
   * Get human-readable condition description
   */
  getConditionDescription(condition) {
    if (!condition) return 'Unknown requirement';

    switch (condition.type) {
      case 'location_tag':
        return `Location with "${condition.tag}" tag`;
      case 'has_lodging':
        return condition.lodgingType === 'inn_room'
          ? 'Valid inn room rental'
          : 'Rented property access';
      case 'has_item':
        return `Item: ${condition.itemId}`;
      case 'has_gold':
        return `${condition.amount} gold`;
      case 'flag':
        return `Flag: ${condition.flag}`;
      case 'stat':
        return `${condition.stat} ${condition.operator || '>='} ${condition.value}`;
      case 'and':
        return 'All conditions';
      case 'or':
        return 'Any condition';
      default:
        return `Condition: ${condition.type}`;
    }
  }

  /**
   * Determine the best failure reason based on context
   */
  determineBestReason(conditions, context) {
    const { location } = context;
    const locationTags = location?.tags || [];

    // If at an inn without a room, that's likely the reason
    if (locationTags.includes('inn')) {
      return 'inn_no_room';
    }

    // If in a dangerous location, mention that
    if (locationTags.includes('dangerous') || locationTags.includes('corrupted')) {
      return 'dangerous';
    }

    return 'default';
  }

  /**
   * Get appropriate failure message
   */
  getFailureMessage(requirements, result, context) {
    // Check for specific failure messages
    if (requirements.failureMessages && result.reason) {
      const specificMessage = requirements.failureMessages[result.reason];
      if (specificMessage) return specificMessage;
    }

    // Use general failure message
    if (requirements.failureMessage) {
      return requirements.failureMessage;
    }

    // Generate from unmet requirements
    if (result.unmet.length > 0) {
      return `Requirements not met: ${result.unmet.join(', ')}`;
    }

    return 'Action not allowed.';
  }

  /**
   * Register custom condition handler
   * @param {string} type - Condition type name
   * @param {Function} handler - Handler function (condition, context) => { satisfied, unmet }
   */
  registerConditionHandler(type, handler) {
    this.customConditionHandlers.set(type, handler);
  }

  /**
   * Unregister custom condition handler
   * @param {string} type - Condition type name
   */
  unregisterConditionHandler(type) {
    this.customConditionHandlers.delete(type);
  }

  /**
   * Add or update action requirements
   * @param {string} actionId - Action identifier
   * @param {Object} requirements - Requirement configuration
   */
  setActionRequirements(actionId, requirements) {
    this.actionRequirements[actionId] = requirements;
  }

  /**
   * Get requirements for an action
   * @param {string} actionId - Action identifier
   * @returns {Object|null} Requirements configuration
   */
  getActionRequirements(actionId) {
    return this.actionRequirements[actionId] || null;
  }

  /**
   * Get summary of what satisfies an action's requirements
   * @param {string} actionId - Action identifier
   * @returns {string[]} List of ways to satisfy requirements
   */
  getRequirementSummary(actionId) {
    const requirements = this.actionRequirements[actionId];
    if (!requirements) return ['No requirements'];

    const summary = [];

    const extractSummary = (condition) => {
      if (condition.type === 'or' || condition.or) {
        const conditions = condition.conditions || condition.or;
        conditions.forEach(c => extractSummary(c));
      } else if (condition.type === 'and' || condition.and) {
        const conditions = condition.conditions || condition.and;
        const parts = conditions.map(c => this.getConditionDescription(c));
        summary.push(parts.join(' AND '));
      } else {
        summary.push(this.getConditionDescription(condition));
      }
    };

    extractSummary(requirements);
    return summary;
  }
}

export default ActionRequirementSystem;
