/**
 * ConditionEvaluator - Unified condition evaluation for all engine systems
 *
 * Replaces duplicate implementations in:
 * - EffectSystem.evaluateCondition()
 * - SceneRunner.evaluateSceneCondition()
 * - FameSystem.evaluateConditions()
 *
 * @module engine/utils/ConditionEvaluator
 */

/**
 * Condition types supported by the evaluator
 */
export const CONDITION_TYPES = {
  // Stat conditions
  STAT_ABOVE: 'stat_above',
  STAT_BELOW: 'stat_below',
  STAT_EQUALS: 'stat_equals',
  STAT_BETWEEN: 'stat_between',
  STAT_COMPARE: 'statCompare',

  // Resource conditions
  HP_ABOVE: 'hp_above',
  HP_BELOW: 'hp_below',
  HP_PERCENT: 'healthPercent',
  GOLD_ABOVE: 'gold_above',
  GOLD_BELOW: 'gold_below',

  // Item/Equipment
  HAS_ITEM: 'has_item',
  HAS_EQUIPPED: 'has_equipped',
  ITEM_COUNT: 'item_count',

  // Effects/Status
  HAS_EFFECT: 'has_effect',
  HAS_NOT_EFFECT: 'hasNotEffect',
  HAS_TAG: 'hasTag',
  HAS_NOT_TAG: 'hasNotTag',

  // Location
  LOCATION_IS: 'location_is',
  LOCATION_TAG: 'location_tag',
  IN_LOCATION: 'inLocation',

  // Time
  TIME_BETWEEN: 'time_between',
  IS_NIGHT: 'is_night',
  IS_DAY: 'is_day',

  // Flags
  HAS_FLAG: 'has_flag',
  NOT_FLAG: 'not_flag',
  FLAG: 'flag',

  // Fame/Reputation
  FAME_ABOVE: 'fame_above',
  FAME_BELOW: 'fame_below',
  FAME: 'fame',
  INFAMY_ABOVE: 'infamy_above',
  INFAMY: 'infamy',
  HAS_TITLE: 'has_title',

  // Combat/State
  IN_COMBAT: 'inCombat',
  IS_RESTRAINED: 'isRestrained',
  IS_GRAPPLED: 'isGrappled',

  // NSFW/Corruption
  CORRUPTION_LEVEL: 'corruptionLevel',
  LEWDNESS_ABOVE: 'lewdness_above',
  AROUSAL_ABOVE: 'arousal_above',

  // Quests/Progress
  QUEST_COMPLETE: 'quest_complete',
  QUEST_ACTIVE: 'quest_active',
  VISITED_LOCATION: 'visited_location',

  // NPC
  NPC_RELATIONSHIP: 'npc_relationship',

  // Addiction
  ADDICTION: 'addiction',
  ADDICTION_STAGE: 'addiction_stage',

  // Misc
  RANDOM: 'random',
  STACK_COUNT: 'stackCount',
  LEVEL: 'level',
  ALWAYS: 'always',
  NEVER: 'never'
};

/**
 * Comparison operators
 */
const OPERATORS = {
  GT: 'gt',
  GTE: 'gte',
  LT: 'lt',
  LTE: 'lte',
  EQ: 'eq',
  NEQ: 'neq'
};

/**
 * Get a nested value from an object using dot notation
 * @param {Object} obj - Object to get value from
 * @param {string} path - Dot-notation path (e.g., 'stats.strength')
 * @returns {*} Value at path or undefined
 */
function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Compare two values with an operator
 * @param {number} value - Value to test
 * @param {string} operator - Comparison operator
 * @param {number} target - Target value
 * @returns {boolean}
 */
function compareValues(value, operator, target) {
  switch (operator) {
    case OPERATORS.GT:
    case '>':
      return value > target;
    case OPERATORS.GTE:
    case '>=':
      return value >= target;
    case OPERATORS.LT:
    case '<':
      return value < target;
    case OPERATORS.LTE:
    case '<=':
      return value <= target;
    case OPERATORS.EQ:
    case '==':
    case '===':
      return value === target;
    case OPERATORS.NEQ:
    case '!=':
    case '!==':
      return value !== target;
    default:
      return value >= target; // Default to gte
  }
}

/**
 * Evaluate a single condition
 * @param {Object} condition - Condition to evaluate
 * @param {Object} context - Evaluation context
 * @param {Object} context.player - Player state
 * @param {Object} context.target - Target entity (defaults to player)
 * @param {Object} context.source - Source entity (for effects)
 * @param {Object} context.gameState - Current game state
 * @param {Object} context.location - Current location data
 * @param {Object} context.effectData - Effect instance data (for effect conditions)
 * @returns {boolean}
 */
export function evaluateCondition(condition, context = {}) {
  if (!condition) return true;

  const {
    player = context.target,
    target = player,
    source,
    gameState = {},
    location,
    effectData
  } = context;

  // Handle array of conditions (AND logic)
  if (Array.isArray(condition)) {
    return condition.every(c => evaluateCondition(c, context));
  }

  // Handle AND conditions
  if (condition.and) {
    return condition.and.every(c => evaluateCondition(c, context));
  }

  // Handle OR conditions
  if (condition.or) {
    return condition.or.some(c => evaluateCondition(c, context));
  }

  // Handle NOT condition
  if (condition.not) {
    return !evaluateCondition(condition.not, context);
  }

  // Handle type: "and"/"or" wrapper format
  if (condition.type === 'and' && condition.conditions) {
    return condition.conditions.every(c => evaluateCondition(c, context));
  }
  if (condition.type === 'or' && condition.conditions) {
    return condition.conditions.some(c => evaluateCondition(c, context));
  }

  const type = condition.type;

  switch (type) {
    // Stat conditions
    case CONDITION_TYPES.STAT_ABOVE:
    case 'statGreaterThan': {
      const value = getNestedValue(target, `stats.${condition.stat}`) ??
                    getNestedValue(target, condition.stat) ?? 0;
      return value > (condition.value ?? condition.threshold ?? 0);
    }

    case CONDITION_TYPES.STAT_BELOW:
    case 'statLessThan': {
      const value = getNestedValue(target, `stats.${condition.stat}`) ??
                    getNestedValue(target, condition.stat) ?? 0;
      return value < (condition.value ?? condition.threshold ?? 0);
    }

    case CONDITION_TYPES.STAT_EQUALS:
    case 'statEquals': {
      const value = getNestedValue(target, `stats.${condition.stat}`) ??
                    getNestedValue(target, condition.stat) ?? 0;
      return value === (condition.value ?? 0);
    }

    case CONDITION_TYPES.STAT_BETWEEN: {
      const value = getNestedValue(target, `stats.${condition.stat}`) ??
                    getNestedValue(target, condition.stat) ?? 0;
      return value >= condition.min && value <= condition.max;
    }

    case CONDITION_TYPES.STAT_COMPARE:
    case 'stat': {
      const value = getNestedValue(target, `stats.${condition.stat}`) ??
                    getNestedValue(target, condition.stat) ?? 0;
      return compareValues(value, condition.operator, condition.value);
    }

    // Resource conditions
    case CONDITION_TYPES.HP_ABOVE: {
      return (target?.currentHp ?? 0) > condition.value;
    }

    case CONDITION_TYPES.HP_BELOW: {
      return (target?.currentHp ?? 0) < condition.value;
    }

    case CONDITION_TYPES.HP_PERCENT:
    case 'healthPercent': {
      const currentHp = target?.currentHp ?? 0;
      const maxHp = target?.maxHp ?? 1;
      const percent = (currentHp / maxHp) * 100;
      return compareValues(percent, condition.operator, condition.value);
    }

    case CONDITION_TYPES.GOLD_ABOVE: {
      return (target?.gold ?? 0) > condition.value;
    }

    case CONDITION_TYPES.GOLD_BELOW: {
      return (target?.gold ?? 0) < condition.value;
    }

    // Item/Equipment conditions
    case CONDITION_TYPES.HAS_ITEM:
    case 'has_item': {
      const inventory = target?.inventory ?? [];
      return inventory.some(item =>
        item?.id === condition.itemId || item?.id === condition.item
      );
    }

    case CONDITION_TYPES.HAS_EQUIPPED:
    case 'has_equipped':
    case 'hasEquipped': {
      const equipment = target?.equipment ?? {};
      if (condition.slot) {
        return equipment[condition.slot]?.id === condition.itemId;
      }
      return Object.values(equipment).some(item =>
        item?.id === condition.itemId || item?.tags?.includes(condition.tag)
      );
    }

    case CONDITION_TYPES.ITEM_COUNT: {
      const inventory = target?.inventory ?? [];
      const count = inventory.filter(item =>
        item?.id === condition.itemId
      ).reduce((sum, item) => sum + (item?.count ?? 1), 0);
      return compareValues(count, condition.operator ?? '>=', condition.value);
    }

    // Effect/Status conditions
    case CONDITION_TYPES.HAS_EFFECT:
    case 'hasEffect': {
      const effects = target?.activeEffects ?? [];
      return effects.some(e => e.id === condition.effectId);
    }

    case CONDITION_TYPES.HAS_NOT_EFFECT:
    case 'hasNotEffect': {
      const effects = target?.activeEffects ?? [];
      return !effects.some(e => e.id === condition.effectId);
    }

    case CONDITION_TYPES.HAS_TAG:
    case 'hasTag': {
      const tags = target?.tags ?? [];
      return tags.includes(condition.tag);
    }

    case CONDITION_TYPES.HAS_NOT_TAG:
    case 'hasNotTag': {
      const tags = target?.tags ?? [];
      return !tags.includes(condition.tag);
    }

    // Location conditions
    case CONDITION_TYPES.LOCATION_IS:
    case 'location_is': {
      const currentLoc = target?.currentLocation ?? gameState?.currentLocation;
      return currentLoc === condition.locationId;
    }

    case CONDITION_TYPES.LOCATION_TAG:
    case 'location_tag':
    case CONDITION_TYPES.IN_LOCATION:
    case 'inLocation': {
      const currentLoc = target?.currentLocation ?? gameState?.currentLocation;
      if (condition.locationId) {
        return currentLoc === condition.locationId;
      }
      if (condition.tag) {
        const locTags = location?.tags ?? gameState?.currentLocation?.tags ?? [];
        return locTags.includes(condition.tag);
      }
      return false;
    }

    // Time conditions
    case CONDITION_TYPES.TIME_BETWEEN:
    case 'time_between': {
      const currentHour = gameState?.currentHour ?? new Date().getHours();
      const start = condition.start ?? 0;
      const end = condition.end ?? 24;
      if (start <= end) {
        return currentHour >= start && currentHour < end;
      }
      // Handle overnight ranges (e.g., 22 to 6)
      return currentHour >= start || currentHour < end;
    }

    case CONDITION_TYPES.IS_NIGHT:
    case 'is_night': {
      const hour = gameState?.currentHour ?? new Date().getHours();
      return hour >= 22 || hour < 6;
    }

    case CONDITION_TYPES.IS_DAY:
    case 'is_day': {
      const hour = gameState?.currentHour ?? new Date().getHours();
      return hour >= 6 && hour < 22;
    }

    // Flag conditions
    case CONDITION_TYPES.HAS_FLAG:
    case 'has_flag': {
      const flags = target?.flags ?? gameState?.worldFlags ?? {};
      return flags[condition.flag] === true ||
             (condition.value !== undefined && flags[condition.flag] === condition.value);
    }

    case CONDITION_TYPES.NOT_FLAG:
    case 'not_flag': {
      const flags = target?.flags ?? gameState?.worldFlags ?? {};
      return !flags[condition.flag];
    }

    case CONDITION_TYPES.FLAG:
    case 'flag': {
      const flags = target?.flags ?? gameState?.worldFlags ?? {};
      if (condition.value !== undefined) {
        return flags[condition.flag] === condition.value;
      }
      return !!flags[condition.flag];
    }

    // Fame/Reputation conditions
    case CONDITION_TYPES.FAME_ABOVE:
    case 'fame_above': {
      const fame = target?.fame?.value ?? 0;
      return fame > condition.value;
    }

    case CONDITION_TYPES.FAME_BELOW: {
      const fame = target?.fame?.value ?? 0;
      return fame < condition.value;
    }

    case CONDITION_TYPES.FAME:
    case 'fame': {
      const fame = target?.fame?.value ?? 0;
      return compareValues(fame, condition.operator ?? '>=', condition.value);
    }

    case CONDITION_TYPES.INFAMY_ABOVE:
    case 'infamy_above': {
      const infamyType = condition.infamyType ?? 'slut';
      const infamy = target?.infamy?.[infamyType] ?? 0;
      return infamy > condition.value;
    }

    case CONDITION_TYPES.INFAMY:
    case 'infamy': {
      const infamyType = condition.infamyType ?? condition.type ?? 'slut';
      const infamy = target?.infamy?.[infamyType] ?? 0;
      return compareValues(infamy, condition.operator ?? '>=', condition.value);
    }

    case CONDITION_TYPES.HAS_TITLE:
    case 'has_title': {
      const titles = target?.titles?.unlocked ?? [];
      return titles.includes(condition.titleId);
    }

    // Combat/State conditions
    case CONDITION_TYPES.IN_COMBAT:
    case 'inCombat': {
      return gameState?.inCombat === true;
    }

    case CONDITION_TYPES.IS_RESTRAINED:
    case 'isRestrained': {
      return !!target?.restraintState;
    }

    case CONDITION_TYPES.IS_GRAPPLED:
    case 'isGrappled': {
      return target?.restraintState?.type === 'grapple';
    }

    // NSFW/Corruption conditions
    case CONDITION_TYPES.CORRUPTION_LEVEL:
    case 'corruptionLevel':
    case 'corruption': {
      const corruption = target?.nsfwStats?.corruption ?? 0;
      return compareValues(corruption, condition.operator ?? '>=', condition.value);
    }

    case CONDITION_TYPES.LEWDNESS_ABOVE:
    case 'lewdness_above':
    case 'lewdness': {
      const lewdness = target?.nsfwStats?.lewdness ?? 0;
      return compareValues(lewdness, condition.operator ?? '>', condition.value);
    }

    case CONDITION_TYPES.AROUSAL_ABOVE:
    case 'arousal_above':
    case 'arousal': {
      const arousal = target?.nsfwStats?.arousal ?? 0;
      return compareValues(arousal, condition.operator ?? '>', condition.value);
    }

    // Quest/Progress conditions
    case CONDITION_TYPES.QUEST_COMPLETE:
    case 'quest_complete': {
      const completed = target?.completedQuests ?? [];
      return completed.includes(condition.quest ?? condition.questId);
    }

    case CONDITION_TYPES.QUEST_ACTIVE:
    case 'quest_active': {
      const active = target?.activeQuests ?? [];
      return active.includes(condition.quest ?? condition.questId);
    }

    case CONDITION_TYPES.VISITED_LOCATION:
    case 'visited_location': {
      const visited = target?.visitedLocations ?? [];
      return visited.includes(condition.location ?? condition.locationId);
    }

    // NPC conditions
    case CONDITION_TYPES.NPC_RELATIONSHIP:
    case 'npc_relationship': {
      const relationships = target?.relationships ?? {};
      const npcRel = relationships[condition.npc] ?? {};
      const statValue = npcRel[condition.stat] ?? 0;
      return compareValues(statValue, condition.operator ?? '>=', condition.value);
    }

    // Addiction conditions
    case CONDITION_TYPES.ADDICTION:
    case CONDITION_TYPES.ADDICTION_STAGE:
    case 'addiction': {
      const addictions = target?.substanceState?.addictions ?? {};
      const addiction = addictions[condition.substance];
      if (!addiction) return condition.stage === 'none';
      return addiction.stage === condition.stage ||
             (condition.minLevel && addiction.level >= condition.minLevel);
    }

    // Level condition
    case CONDITION_TYPES.LEVEL:
    case 'level': {
      const level = target?.level ?? 1;
      return compareValues(level, condition.operator ?? '>=', condition.value);
    }

    // Stack count (for effects)
    case CONDITION_TYPES.STACK_COUNT:
    case 'stackCount': {
      const stacks = effectData?.stacks ?? 1;
      return compareValues(stacks, condition.operator ?? '>=', condition.value);
    }

    // Random condition
    case CONDITION_TYPES.RANDOM:
    case 'random': {
      return Math.random() < (condition.chance ?? 0.5);
    }

    // Always/Never
    case CONDITION_TYPES.ALWAYS:
    case 'always':
      return true;

    case CONDITION_TYPES.NEVER:
    case 'never':
      return false;

    default:
      console.warn(`Unknown condition type: ${type}`);
      return true;
  }
}

/**
 * Evaluate multiple conditions with AND logic
 * @param {Object[]} conditions - Array of conditions
 * @param {Object} context - Evaluation context
 * @returns {boolean}
 */
export function evaluateConditions(conditions, context = {}) {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every(c => evaluateCondition(c, context));
}

/**
 * Evaluate multiple conditions with OR logic
 * @param {Object[]} conditions - Array of conditions
 * @param {Object} context - Evaluation context
 * @returns {boolean}
 */
export function evaluateAnyCondition(conditions, context = {}) {
  if (!conditions || conditions.length === 0) return true;
  return conditions.some(c => evaluateCondition(c, context));
}

/**
 * Get a human-readable description of a condition
 * @param {Object} condition - Condition to describe
 * @returns {string}
 */
export function getConditionDescription(condition) {
  if (!condition) return '';

  const type = condition.type;

  switch (type) {
    case 'stat_above':
    case 'statGreaterThan':
      return `${condition.stat} above ${condition.value}`;
    case 'stat_below':
    case 'statLessThan':
      return `${condition.stat} below ${condition.value}`;
    case 'level':
      return `Level ${condition.value}+`;
    case 'has_item':
      return `Have ${condition.itemId}`;
    case 'has_flag':
      return `Flag: ${condition.flag}`;
    case 'quest_complete':
      return `Complete: ${condition.quest ?? condition.questId}`;
    case 'fame_above':
    case 'fame':
      return `Fame ${condition.value}+`;
    case 'infamy_above':
    case 'infamy':
      return `${condition.infamyType ?? 'Infamy'} ${condition.value}+`;
    case 'has_title':
      return `Have title: ${condition.titleId}`;
    case 'npc_relationship':
      return `${condition.npc} ${condition.stat} ${condition.value}+`;
    case 'visited_location':
      return `Visited: ${condition.location ?? condition.locationId}`;
    default:
      return JSON.stringify(condition);
  }
}

export default {
  evaluateCondition,
  evaluateConditions,
  evaluateAnyCondition,
  getConditionDescription,
  CONDITION_TYPES,
  OPERATORS
};
