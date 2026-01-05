/**
 * TextInterpolator - Unified text interpolation for dialogue, effects, and UI
 *
 * Supports template strings with:
 * - {player.name} - Nested object access
 * - {gold} - Direct property access
 * - {stat:strength} - Stat lookups
 * - {item:sword} - Item name lookups
 * - {npc:merchant.name} - NPC property access
 *
 * @module engine/utils/TextInterpolator
 */

import { getPath } from './StateInitializer.js';

/**
 * Interpolate template variables in text
 * @param {string} text - Text with {variable} placeholders
 * @param {Object} context - Context object with values
 * @param {Object} context.player - Player state
 * @param {Object} context.npc - Current NPC data
 * @param {Object} context.location - Current location data
 * @param {Object} context.gameState - Game state
 * @param {Object} context.item - Item being referenced
 * @param {Object} context.enemy - Enemy in combat
 * @param {Object} context.custom - Custom variables
 * @returns {string} Text with variables replaced
 */
export function interpolateText(text, context = {}) {
  if (!text || typeof text !== 'string') return text ?? '';

  const {
    player = {},
    npc = {},
    location = {},
    gameState = {},
    item = {},
    enemy = {},
    custom = {}
  } = context;

  return text.replace(/\{([^}]+)\}/g, (match, path) => {
    // Handle special prefixes
    if (path.startsWith('stat:')) {
      const statName = path.slice(5);
      return getPath(player, `stats.${statName}`, 0);
    }

    if (path.startsWith('npc:')) {
      const npcPath = path.slice(4);
      return getPath(npc, npcPath, '???');
    }

    if (path.startsWith('location:')) {
      const locPath = path.slice(9);
      return getPath(location, locPath, '???');
    }

    if (path.startsWith('enemy:')) {
      const enemyPath = path.slice(6);
      return getPath(enemy, enemyPath, '???');
    }

    if (path.startsWith('item:')) {
      const itemPath = path.slice(5);
      return getPath(item, itemPath, '???');
    }

    if (path.startsWith('game:')) {
      const gamePath = path.slice(5);
      return getPath(gameState, gamePath, '???');
    }

    if (path.startsWith('custom:')) {
      const customPath = path.slice(7);
      return getPath(custom, customPath, '???');
    }

    // Handle player prefix explicitly
    if (path.startsWith('player.')) {
      const playerPath = path.slice(7);
      return getPath(player, playerPath, '???');
    }

    // Try each context in order
    let value = getPath(custom, path);
    if (value !== undefined) return value;

    value = getPath(player, path);
    if (value !== undefined) return value;

    value = getPath(npc, path);
    if (value !== undefined) return value;

    value = getPath(location, path);
    if (value !== undefined) return value;

    value = getPath(gameState, path);
    if (value !== undefined) return value;

    value = getPath(enemy, path);
    if (value !== undefined) return value;

    value = getPath(item, path);
    if (value !== undefined) return value;

    // Return original if not found
    return match;
  });
}

/**
 * Interpolate with conditional blocks
 * Supports: {if condition}text{/if} and {if condition}text{else}other{/if}
 * @param {string} text - Text with conditionals
 * @param {Object} context - Context for interpolation
 * @param {Function} conditionEvaluator - Function to evaluate conditions
 * @returns {string} Processed text
 */
export function interpolateWithConditionals(text, context = {}, conditionEvaluator = null) {
  if (!text || typeof text !== 'string') return text ?? '';

  // First handle {if ...}...{/if} blocks
  let result = text.replace(
    /\{if\s+([^}]+)\}([\s\S]*?)(?:\{else\}([\s\S]*?))?\{\/if\}/g,
    (match, condition, ifContent, elseContent = '') => {
      let conditionMet = false;

      if (conditionEvaluator) {
        // Use provided evaluator
        try {
          conditionMet = conditionEvaluator({ type: condition }, context);
        } catch {
          conditionMet = false;
        }
      } else {
        // Simple evaluation: check if path is truthy
        const value = getPath(context.player, condition) ??
                      getPath(context.custom, condition) ??
                      getPath(context, condition);
        conditionMet = !!value;
      }

      return conditionMet ? ifContent : elseContent;
    }
  );

  // Then interpolate variables
  result = interpolateText(result, context);

  return result;
}

/**
 * Format a number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  if (typeof num !== 'number') return String(num);
  return num.toLocaleString();
}

/**
 * Format gold amount with icon
 * @param {number} amount - Gold amount
 * @returns {string} Formatted gold string
 */
export function formatGold(amount) {
  return `${formatNumber(amount)} gold`;
}

/**
 * Format a duration in turns/days
 * @param {number} value - Duration value
 * @param {string} type - Duration type (turns, days, actions)
 * @returns {string} Formatted duration
 */
export function formatDuration(value, type = 'turns') {
  if (value === 1) {
    return `1 ${type.slice(0, -1)}`; // Remove 's' for singular
  }
  return `${value} ${type}`;
}

/**
 * Format a stat modifier for display
 * @param {Object} modifier - Modifier object
 * @returns {string} Formatted modifier (e.g., "+5 Strength", "-10% Defense")
 */
export function formatModifier(modifier) {
  if (!modifier) return '';

  const { stat, value, operation = 'flat' } = modifier;
  const sign = value >= 0 ? '+' : '';

  switch (operation) {
    case 'flat':
      return `${sign}${value} ${capitalizeFirst(stat)}`;
    case 'percent':
      return `${sign}${value}% ${capitalizeFirst(stat)}`;
    case 'multiply':
      return `x${value} ${capitalizeFirst(stat)}`;
    default:
      return `${sign}${value} ${capitalizeFirst(stat)}`;
  }
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert snake_case or camelCase to Title Case
 * @param {string} str - String to convert
 * @returns {string} Title case string
 */
export function toTitleCase(str) {
  if (!str) return '';
  return str
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Pluralize a word based on count
 * @param {string} word - Word to pluralize
 * @param {number} count - Count for pluralization
 * @returns {string} Pluralized word with count
 */
export function pluralize(word, count) {
  if (count === 1) return `1 ${word}`;
  // Simple pluralization - add 's' or 'es'
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('ch') || word.endsWith('sh')) {
    return `${count} ${word}es`;
  }
  return `${count} ${word}s`;
}

/**
 * Create a template function from a string
 * @param {string} template - Template string with {placeholders}
 * @returns {Function} Function that takes context and returns interpolated string
 */
export function createTemplate(template) {
  return (context) => interpolateText(template, context);
}

export default {
  interpolateText,
  interpolateWithConditionals,
  formatNumber,
  formatGold,
  formatDuration,
  formatModifier,
  capitalizeFirst,
  toTitleCase,
  pluralize,
  createTemplate
};
