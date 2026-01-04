/**
 * @fileoverview UnlockSystem - Evaluates location unlock requirements
 *
 * This system determines whether locations are accessible to the player
 * based on various conditions like quest completion, NPC relationships,
 * player stats, items, titles, marks, and more.
 *
 * @module engine/UnlockSystem
 */

/**
 * Supported requirement types:
 * - level: Player level check
 * - quest_complete: Quest completion flag
 * - npc_relationship: NPC relationship stat check
 * - item_possession / has_item: Has item in inventory
 * - stat: Player stat check (lewdness, corruption, etc.)
 * - addiction: Addiction stage check
 * - title / has_title: Has specific title
 * - mark / has_mark: Has specific mark (slave mark, etc.)
 * - flag: Generic game flag check
 * - visited_location: Has visited a location
 * - fame: Fame level check
 * - infamy: Infamy type/level check
 */

export class UnlockSystem {
  /**
   * Create an UnlockSystem instance
   * @param {Object} conditionEvaluator - Optional ConditionEvaluator instance for complex conditions
   */
  constructor(conditionEvaluator = null) {
    this.conditionEvaluator = conditionEvaluator;
  }

  /**
   * Check if a location is unlocked for the player
   * @param {Object} location - Location data object
   * @param {Object} playerState - Player state object
   * @param {Object} gameState - Optional game state for additional context
   * @returns {{ unlocked: boolean, requirements: Array, metRequirements: string[], unmetRequirements: string[] }}
   */
  checkLocationUnlock(location, playerState, gameState = {}) {
    // If location has no lock or is initially unlocked, it's accessible
    if (!location.locked || location.initiallyUnlocked) {
      return {
        unlocked: true,
        requirements: [],
        metRequirements: [],
        unmetRequirements: []
      };
    }

    // Check if player has already unlocked this location
    if (playerState.unlockedLocations?.includes(location.id)) {
      return {
        unlocked: true,
        requirements: [],
        metRequirements: ['Previously unlocked'],
        unmetRequirements: []
      };
    }

    // If no unlock requirements specified, location remains locked
    if (!location.unlockRequirements) {
      return {
        unlocked: false,
        requirements: [],
        metRequirements: [],
        unmetRequirements: ['Location is locked']
      };
    }

    // Evaluate the requirements
    const result = this.evaluateRequirementGroup(location.unlockRequirements, playerState, gameState);

    return {
      unlocked: result.met,
      requirements: this.flattenRequirements(location.unlockRequirements),
      metRequirements: result.metDescriptions,
      unmetRequirements: result.unmetDescriptions
    };
  }

  /**
   * Evaluate a group of requirements (handles AND/OR logic)
   * @param {Object} requirementGroup - Requirement group with type and conditions
   * @param {Object} playerState - Player state
   * @param {Object} gameState - Game state
   * @returns {{ met: boolean, metDescriptions: string[], unmetDescriptions: string[] }}
   */
  evaluateRequirementGroup(requirementGroup, playerState, gameState) {
    const type = requirementGroup.type || 'and';
    const conditions = requirementGroup.conditions || [requirementGroup];

    const results = conditions.map(condition => {
      // Handle nested groups
      if (condition.type === 'and' || condition.type === 'or' || condition.type === 'not') {
        return this.evaluateRequirementGroup(condition, playerState, gameState);
      }

      const evalResult = this.evaluateRequirement(condition, playerState, gameState);
      return {
        met: evalResult.met,
        metDescriptions: evalResult.met ? [evalResult.description] : [],
        unmetDescriptions: evalResult.met ? [] : [evalResult.description]
      };
    });

    let met = false;
    const metDescriptions = [];
    const unmetDescriptions = [];

    results.forEach(r => {
      metDescriptions.push(...r.metDescriptions);
      unmetDescriptions.push(...r.unmetDescriptions);
    });

    switch (type) {
      case 'and':
        met = results.every(r => r.met);
        break;
      case 'or':
        met = results.some(r => r.met);
        break;
      case 'not':
        met = !results.every(r => r.met);
        break;
      default:
        met = results.every(r => r.met);
    }

    return { met, metDescriptions, unmetDescriptions };
  }

  /**
   * Evaluate a single requirement
   * @param {Object} requirement - Single requirement object
   * @param {Object} playerState - Player state
   * @param {Object} gameState - Game state
   * @returns {{ met: boolean, description: string, progress?: string }}
   */
  evaluateRequirement(requirement, playerState, gameState = {}) {
    const type = requirement.type;

    switch (type) {
      case 'level':
        return this.checkLevel(requirement, playerState);

      case 'quest_complete':
        return this.checkQuestComplete(requirement, playerState, gameState);

      case 'npc_relationship':
        return this.checkNpcRelationship(requirement, playerState, gameState);

      case 'item_possession':
      case 'has_item':
        return this.checkItemPossession(requirement, playerState);

      case 'stat':
        return this.checkStat(requirement, playerState);

      case 'addiction':
        return this.checkAddiction(requirement, playerState);

      case 'title':
      case 'has_title':
        return this.checkTitle(requirement, playerState);

      case 'mark':
      case 'has_mark':
        return this.checkMark(requirement, playerState);

      case 'flag':
        return this.checkFlag(requirement, playerState, gameState);

      case 'visited_location':
        return this.checkVisitedLocation(requirement, playerState);

      case 'fame':
        return this.checkFame(requirement, playerState);

      case 'infamy':
        return this.checkInfamy(requirement, playerState);

      default:
        console.warn(`Unknown requirement type: ${type}`);
        return { met: false, description: `Unknown requirement: ${type}` };
    }
  }

  /**
   * Check player level requirement
   */
  checkLevel(requirement, playerState) {
    const playerLevel = playerState.level || 1;
    const requiredLevel = requirement.value;
    const operator = requirement.operator || '>=';

    const met = this.compareValues(playerLevel, operator, requiredLevel);

    return {
      met,
      description: `Reach level ${requiredLevel}`,
      progress: `${playerLevel}/${requiredLevel}`
    };
  }

  /**
   * Check quest completion requirement
   */
  checkQuestComplete(requirement, playerState, gameState) {
    const questId = requirement.quest;
    const completedQuests = playerState.completedQuests || gameState.completedQuests || [];
    const met = completedQuests.includes(questId);

    return {
      met,
      description: `Complete quest: ${this.formatId(questId)}`
    };
  }

  /**
   * Check NPC relationship requirement
   */
  checkNpcRelationship(requirement, playerState, gameState) {
    const npcId = requirement.npc;
    const stat = requirement.stat || 'trust';
    const requiredValue = requirement.value;
    const operator = requirement.operator || '>=';

    const relationships = gameState.npcRelationships || playerState.npcRelationships || {};
    const npcRel = relationships[npcId] || {};
    const currentValue = typeof npcRel === 'number' ? npcRel : (npcRel[stat] || 0);

    const met = this.compareValues(currentValue, operator, requiredValue);

    return {
      met,
      description: `${this.formatId(npcId)} ${stat} ${operator} ${requiredValue}`,
      progress: `${currentValue}/${requiredValue}`
    };
  }

  /**
   * Check item possession requirement
   */
  checkItemPossession(requirement, playerState) {
    const itemId = requirement.item;
    const quantity = requirement.quantity || 1;
    const inventory = playerState.inventory || [];

    const item = inventory.find(i => i.id === itemId || i.itemId === itemId);
    const currentCount = item ? (item.count || 1) : 0;
    const met = currentCount >= quantity;

    return {
      met,
      description: `Have ${quantity}x ${this.formatId(itemId)}`,
      progress: `${currentCount}/${quantity}`
    };
  }

  /**
   * Check player stat requirement
   */
  checkStat(requirement, playerState) {
    const statName = requirement.stat;
    const requiredValue = requirement.value;
    const operator = requirement.operator || '>=';

    // Check various stat locations
    let currentValue = 0;
    if (playerState.stats && playerState.stats[statName] !== undefined) {
      currentValue = playerState.stats[statName];
    } else if (playerState[statName] !== undefined) {
      currentValue = playerState[statName];
    } else if (playerState.derivedStats && playerState.derivedStats[statName] !== undefined) {
      currentValue = playerState.derivedStats[statName];
    }

    const met = this.compareValues(currentValue, operator, requiredValue);

    return {
      met,
      description: `${this.formatStatName(statName)} ${operator} ${requiredValue}`,
      progress: `${currentValue}/${requiredValue}`
    };
  }

  /**
   * Check addiction requirement
   */
  checkAddiction(requirement, playerState) {
    const addictionType = requirement.addiction;
    const requiredValue = requirement.value;
    const operator = requirement.operator || '>=';

    const addictions = playerState.addictions || {};

    // Handle 'any' addiction type
    if (addictionType === 'any') {
      const maxAddiction = Math.max(0, ...Object.values(addictions));
      const met = this.compareValues(maxAddiction, operator, requiredValue);
      return {
        met,
        description: `Any addiction ${operator} ${requiredValue}`,
        progress: `${maxAddiction}/${requiredValue}`
      };
    }

    const currentValue = addictions[addictionType] || 0;
    const met = this.compareValues(currentValue, operator, requiredValue);

    return {
      met,
      description: `${this.formatId(addictionType)} addiction ${operator} ${requiredValue}`,
      progress: `${currentValue}/${requiredValue}`
    };
  }

  /**
   * Check title requirement
   */
  checkTitle(requirement, playerState) {
    const titleId = requirement.title;
    const titles = playerState.titles || playerState.unlockedTitles || [];
    const met = titles.includes(titleId);

    return {
      met,
      description: `Have title: ${this.formatId(titleId)}`
    };
  }

  /**
   * Check mark requirement
   */
  checkMark(requirement, playerState) {
    const markId = requirement.mark;
    const marks = playerState.marks || [];
    const met = marks.includes(markId);

    return {
      met,
      description: `Have mark: ${this.formatId(markId)}`
    };
  }

  /**
   * Check flag requirement
   */
  checkFlag(requirement, playerState, gameState) {
    const flagId = requirement.flag;
    const flags = { ...(gameState.flags || {}), ...(playerState.flags || {}) };
    const met = !!flags[flagId];

    return {
      met,
      description: `${this.formatId(flagId)}`
    };
  }

  /**
   * Check visited location requirement
   */
  checkVisitedLocation(requirement, playerState) {
    const locationId = requirement.location;
    const visitedLocations = playerState.visitedLocations || [];
    const met = visitedLocations.includes(locationId);

    return {
      met,
      description: `Visit ${this.formatId(locationId)}`
    };
  }

  /**
   * Check fame requirement
   */
  checkFame(requirement, playerState) {
    const requiredValue = requirement.value;
    const operator = requirement.operator || '>=';
    const currentValue = playerState.fame || 0;

    const met = this.compareValues(currentValue, operator, requiredValue);

    return {
      met,
      description: `Fame ${operator} ${requiredValue}`,
      progress: `${currentValue}/${requiredValue}`
    };
  }

  /**
   * Check infamy requirement
   */
  checkInfamy(requirement, playerState) {
    const infamyType = requirement.infamyType;
    const requiredValue = requirement.value;
    const operator = requirement.operator || '>=';

    const infamy = playerState.infamy || {};
    const currentValue = infamy[infamyType] || 0;

    const met = this.compareValues(currentValue, operator, requiredValue);

    return {
      met,
      description: `${this.formatId(infamyType)} infamy ${operator} ${requiredValue}`,
      progress: `${currentValue}/${requiredValue}`
    };
  }

  /**
   * Compare two values with an operator
   * @param {number} a - First value
   * @param {string} operator - Comparison operator
   * @param {number} b - Second value
   * @returns {boolean}
   */
  compareValues(a, operator, b) {
    switch (operator) {
      case '>=': return a >= b;
      case '>': return a > b;
      case '<=': return a <= b;
      case '<': return a < b;
      case '==':
      case '===': return a === b;
      case '!=':
      case '!==': return a !== b;
      default: return a >= b;
    }
  }

  /**
   * Format an ID into a human-readable name
   * @param {string} id - ID to format
   * @returns {string}
   */
  formatId(id) {
    if (!id) return 'Unknown';
    return id
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Format a stat name
   * @param {string} stat - Stat name
   * @returns {string}
   */
  formatStatName(stat) {
    const statNames = {
      corruption: 'Corruption',
      lewdness: 'Lewdness',
      corruptionResistance: 'Corruption Resistance',
      strength: 'Strength',
      vitality: 'Vitality',
      evasion: 'Evasion',
      stamina: 'Stamina',
      willpower: 'Willpower',
      intelligence: 'Intelligence',
      charm: 'Charm'
    };
    return statNames[stat] || this.formatId(stat);
  }

  /**
   * Flatten requirements into a simple array for display
   * @param {Object} requirements - Requirement group
   * @returns {Array}
   */
  flattenRequirements(requirements) {
    const flat = [];

    const process = (req, depth = 0) => {
      if (req.conditions) {
        req.conditions.forEach(c => process(c, depth + 1));
      } else {
        flat.push({
          ...req,
          depth
        });
      }
    };

    process(requirements);
    return flat;
  }

  /**
   * Get human-readable description of all requirements
   * @param {Object} location - Location with unlockRequirements
   * @param {Object} playerState - Player state for progress info
   * @returns {string}
   */
  getRequirementsDescription(location, playerState) {
    if (!location.unlockRequirements) {
      return 'No requirements';
    }

    const describe = (req, joiner = ' AND ') => {
      if (req.type === 'and' || req.type === 'or') {
        const j = req.type === 'or' ? ' OR ' : ' AND ';
        return '(' + req.conditions.map(c => describe(c, j)).join(j) + ')';
      }

      const result = this.evaluateRequirement(req, playerState);
      return result.description;
    };

    return describe(location.unlockRequirements);
  }

  /**
   * Check if a location can be discovered while exploring
   * Discovered locations appear on the map (grayed out if locked)
   * @param {Object} location - Location to potentially discover
   * @param {Object} playerState - Player state
   * @param {Object} currentLocation - Current location the player is in
   * @returns {{ canDiscover: boolean, reason?: string }}
   */
  canDiscoverLocation(location, playerState, currentLocation) {
    // Check if already discovered/visited
    if (playerState.visitedLocations?.includes(location.id)) {
      return { canDiscover: false, reason: 'Already visited' };
    }

    if (playerState.discoveredLocations?.includes(location.id)) {
      return { canDiscover: false, reason: 'Already discovered' };
    }

    if (playerState.unlockedLocations?.includes(location.id)) {
      return { canDiscover: false, reason: 'Already unlocked' };
    }

    // Check if location is discoverable while exploring
    if (!location.discoverableWhileExploring) {
      return { canDiscover: false, reason: 'Not discoverable through exploration' };
    }

    // Check if current location is a neighbor
    const neighbors = currentLocation.neighbors || currentLocation.connectedLocations || [];
    if (!neighbors.includes(location.id)) {
      return { canDiscover: false, reason: 'Not a neighbor of current location' };
    }

    // Note: We allow discovering locked locations - they just appear grayed out on the map
    // The player can see them but can't enter until requirements are met
    return { canDiscover: true };
  }

  /**
   * Process exploration and potentially discover new locations
   * @param {Object} currentLocation - Current location data
   * @param {Object} playerState - Player state
   * @param {Array} allLocations - All location data
   * @returns {Array} Array of discovered location objects
   */
  processExploration(currentLocation, playerState, allLocations) {
    const discoveries = [];
    const neighbors = currentLocation.neighbors || [];

    for (const neighborId of neighbors) {
      const neighbor = allLocations.find(l => l.id === neighborId);
      if (!neighbor) continue;

      const canDiscover = this.canDiscoverLocation(neighbor, playerState, currentLocation);
      if (!canDiscover.canDiscover) continue;

      // Roll for discovery
      const discoveryChance = neighbor.discoveryChance || 0.1;
      if (Math.random() < discoveryChance) {
        discoveries.push(neighbor);
      }
    }

    return discoveries;
  }
}

export default UnlockSystem;
