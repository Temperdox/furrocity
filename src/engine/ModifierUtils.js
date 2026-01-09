/**
 * ModifierUtils - Utility functions for applying numeric modifiers with random range support
 */

/**
 * Resolve a modifier value - handles both fixed and random range values
 * @param {object} modifier - The modifier object { operation, value, random?, min?, max? }
 * @returns {number} The resolved value (random if applicable)
 */
export function resolveModifierValue(modifier) {
  if (!modifier) return 0;

  if (modifier.random && modifier.min !== undefined && modifier.max !== undefined) {
    const min = Math.min(modifier.min, modifier.max);
    const max = Math.max(modifier.min, modifier.max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  return modifier.value ?? 0;
}

/**
 * Apply a modifier to a base value
 * @param {number} baseValue - The original value to modify
 * @param {object} modifier - The modifier { operation: 'add'|'subtract'|'multiply'|'divide', value?, random?, min?, max? }
 * @returns {number} The modified value
 */
export function applyModifier(baseValue, modifier) {
  if (!modifier || !modifier.operation) return baseValue;

  const modValue = resolveModifierValue(modifier);

  switch (modifier.operation) {
    case 'add':
      return baseValue + modValue;
    case 'subtract':
      return baseValue - modValue;
    case 'multiply':
      return baseValue * modValue;
    case 'divide':
      return modValue !== 0 ? baseValue / modValue : baseValue;
    // Legacy support for old format
    case 'flat':
      return baseValue + modValue;
    case 'percent':
      return baseValue * (1 + modValue / 100);
    case 'set':
      return modValue;
    default:
      return baseValue;
  }
}

/**
 * Apply multiple modifiers to a base value
 * @param {number} baseValue - The original value
 * @param {array} modifiers - Array of modifier objects
 * @returns {number} The final modified value
 */
export function applyModifiers(baseValue, modifiers) {
  if (!modifiers || !Array.isArray(modifiers)) return baseValue;

  return modifiers.reduce((value, mod) => applyModifier(value, mod), baseValue);
}

/**
 * Apply stat modifiers to a player/entity stats object
 * @param {object} stats - The stats object { strength: 10, vitality: 15, ... }
 * @param {array} modifiers - Array of { stat, operation, value/random/min/max }
 * @returns {object} New stats object with modifiers applied
 */
export function applyStatModifiers(stats, modifiers) {
  if (!modifiers || !Array.isArray(modifiers)) return { ...stats };

  const newStats = { ...stats };

  for (const mod of modifiers) {
    if (mod.stat && newStats[mod.stat] !== undefined) {
      newStats[mod.stat] = applyModifier(newStats[mod.stat], mod);
    }
  }

  return newStats;
}

/**
 * Get a display string for a modifier (for UI preview)
 * @param {object} modifier - The modifier object
 * @returns {string} Human-readable description
 */
export function getModifierDisplayString(modifier) {
  if (!modifier) return '';

  const { operation, value, random, min, max } = modifier;

  const valueStr = random ? `${min}-${max}` : String(value ?? 0);
  const randomStr = random ? ' (random)' : '';

  switch (operation) {
    case 'add':
      return `+${valueStr}${randomStr}`;
    case 'subtract':
      return `-${valueStr}${randomStr}`;
    case 'multiply':
      return `×${valueStr}${randomStr}`;
    case 'divide':
      return `÷${valueStr}${randomStr}`;
    case 'flat':
      return `+${valueStr}${randomStr}`;
    case 'percent':
      return `${value >= 0 ? '+' : ''}${valueStr}%${randomStr}`;
    case 'set':
      return `=${valueStr}${randomStr}`;
    default:
      return valueStr;
  }
}

/**
 * Convert old modifier format to new format
 * @param {object} oldMod - { stat, operation: 'flat'|'percent'|'set', value }
 * @returns {object} New format { stat, operation: 'add'|'multiply'|etc, value }
 */
export function convertLegacyModifier(oldMod) {
  if (!oldMod) return null;

  const { stat, operation, value } = oldMod;

  switch (operation) {
    case 'flat':
      return { stat, operation: value >= 0 ? 'add' : 'subtract', value: Math.abs(value) };
    case 'percent':
      return { stat, operation: 'multiply', value: 1 + value / 100 };
    case 'set':
      return { stat, operation: 'set', value };
    default:
      return { ...oldMod };
  }
}

export default {
  resolveModifierValue,
  applyModifier,
  applyModifiers,
  applyStatModifiers,
  getModifierDisplayString,
  convertLegacyModifier,
};
