/**
 * @fileoverview InputValidationSystem - Validates scene inputs with dynamic formula support
 *
 * Features:
 * - Basic validation (required, min/max, minLength/maxLength)
 * - Type validation (int, string, any)
 * - Pattern matching (regex)
 * - Dynamic formulas (e.g., "Math.floor(player.gold / 10)")
 * - Constraint expressions (e.g., "value <= player.gold")
 * - Custom error messages
 *
 * @module engine/InputValidationSystem
 */

/**
 * Default validation messages
 */
const DEFAULT_MESSAGES = {
  required: 'This field is required',
  minLength: 'Must be at least {min} characters',
  maxLength: 'Must be no more than {max} characters',
  min: 'Must be at least {min}',
  max: 'Must be no more than {max}',
  step: 'Must be a multiple of {step}',
  mustBeInteger: 'Must be a whole number',
  pattern: 'Invalid format',
  type_int: 'Must be a number',
  type_string: 'Must be text',
  constraint: 'Value does not meet requirements'
};

export class InputValidationSystem {
  constructor() {
    this.customValidators = new Map();
  }

  /**
   * Validate a value against validation rules
   * @param {any} value - The value to validate
   * @param {Object} rules - Validation rules
   * @param {Object} context - Context for formula evaluation (player, gameState, etc.)
   * @returns {Object} { valid: boolean, errors: string[], sanitizedValue: any }
   */
  validate(value, rules, context = {}) {
    const errors = [];
    let sanitizedValue = value;

    // Resolve dynamic rules first
    const resolvedRules = this.resolveRules(rules, context);

    // Required check
    if (resolvedRules.required) {
      if (value === undefined || value === null || value === '') {
        errors.push(resolvedRules.customMessage || DEFAULT_MESSAGES.required);
        return { valid: false, errors, sanitizedValue: null };
      }
    } else if (value === undefined || value === null || value === '') {
      // Not required and empty - valid
      return { valid: true, errors: [], sanitizedValue: null };
    }

    // Type coercion and validation
    if (resolvedRules.type) {
      const typeResult = this.validateType(value, resolvedRules.type);
      if (!typeResult.valid) {
        errors.push(resolvedRules.customMessage || typeResult.message);
        return { valid: false, errors, sanitizedValue: null };
      }
      sanitizedValue = typeResult.value;
    }

    // String length validation
    if (typeof sanitizedValue === 'string') {
      if (resolvedRules.minLength !== undefined && sanitizedValue.length < resolvedRules.minLength) {
        errors.push(
          resolvedRules.customMessage ||
          DEFAULT_MESSAGES.minLength.replace('{min}', resolvedRules.minLength)
        );
      }
      if (resolvedRules.maxLength !== undefined && sanitizedValue.length > resolvedRules.maxLength) {
        errors.push(
          resolvedRules.customMessage ||
          DEFAULT_MESSAGES.maxLength.replace('{max}', resolvedRules.maxLength)
        );
      }
    }

    // Numeric validation
    if (typeof sanitizedValue === 'number') {
      if (resolvedRules.min !== undefined && sanitizedValue < resolvedRules.min) {
        errors.push(
          resolvedRules.customMessage ||
          DEFAULT_MESSAGES.min.replace('{min}', resolvedRules.min)
        );
      }
      if (resolvedRules.max !== undefined && sanitizedValue > resolvedRules.max) {
        errors.push(
          resolvedRules.customMessage ||
          DEFAULT_MESSAGES.max.replace('{max}', resolvedRules.max)
        );
      }
      if (resolvedRules.mustBeInteger && !Number.isInteger(sanitizedValue)) {
        errors.push(resolvedRules.customMessage || DEFAULT_MESSAGES.mustBeInteger);
      }
      if (resolvedRules.step !== undefined) {
        const remainder = sanitizedValue % resolvedRules.step;
        if (Math.abs(remainder) > 0.0001) {
          errors.push(
            resolvedRules.customMessage ||
            DEFAULT_MESSAGES.step.replace('{step}', resolvedRules.step)
          );
        }
      }
    }

    // Pattern validation (regex)
    if (resolvedRules.pattern) {
      const regex = new RegExp(resolvedRules.pattern);
      if (!regex.test(String(sanitizedValue))) {
        errors.push(resolvedRules.customMessage || DEFAULT_MESSAGES.pattern);
      }
    }

    // Constraint expression validation
    if (resolvedRules.constraint) {
      const constraintResult = this.evaluateConstraint(sanitizedValue, resolvedRules.constraint, context);
      if (!constraintResult) {
        errors.push(resolvedRules.customMessage || DEFAULT_MESSAGES.constraint);
      }
    }

    // Custom validators
    if (resolvedRules.customValidator) {
      const customValidator = this.customValidators.get(resolvedRules.customValidator);
      if (customValidator) {
        const customResult = customValidator(sanitizedValue, context, resolvedRules);
        if (!customResult.valid) {
          errors.push(customResult.message || 'Custom validation failed');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitizedValue: errors.length === 0 ? sanitizedValue : null
    };
  }

  /**
   * Validate and coerce type
   * @param {any} value - Value to validate
   * @param {string} type - Target type (int, string, any)
   * @returns {Object} { valid: boolean, value: any, message?: string }
   */
  validateType(value, type) {
    switch (type) {
      case 'int':
      case 'integer':
      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          return { valid: false, value: null, message: DEFAULT_MESSAGES.type_int };
        }
        if (type === 'int' || type === 'integer') {
          return { valid: true, value: Math.floor(num) };
        }
        return { valid: true, value: num };

      case 'string':
      case 'text':
        return { valid: true, value: String(value) };

      case 'any':
      default:
        return { valid: true, value };
    }
  }

  /**
   * Resolve dynamic rules (evaluate formulas)
   * @param {Object} rules - Original rules with possible formulas
   * @param {Object} context - Context for formula evaluation
   * @returns {Object} Resolved rules with formulas evaluated
   */
  resolveRules(rules, context) {
    if (!rules) return {};

    const resolved = { ...rules };

    // Resolve dynamic min
    if (rules.dynamicMin !== undefined) {
      resolved.min = this.evaluateFormula(rules.dynamicMin, context);
    }

    // Resolve dynamic max
    if (rules.dynamicMax !== undefined) {
      resolved.max = this.evaluateFormula(rules.dynamicMax, context);
    }

    // Resolve dynamic minLength
    if (rules.dynamicMinLength !== undefined) {
      resolved.minLength = this.evaluateFormula(rules.dynamicMinLength, context);
    }

    // Resolve dynamic maxLength
    if (rules.dynamicMaxLength !== undefined) {
      resolved.maxLength = this.evaluateFormula(rules.dynamicMaxLength, context);
    }

    return resolved;
  }

  /**
   * Evaluate a formula expression
   * @param {string} formula - Formula to evaluate (e.g., "player.gold", "Math.min(7, player.level)")
   * @param {Object} context - Context object with player, gameState, etc.
   * @returns {any} Evaluated result
   */
  evaluateFormula(formula, context) {
    if (formula === undefined || formula === null) return undefined;

    // If it's already a number, return it
    if (typeof formula === 'number') return formula;

    // If it's not a string, return as-is
    if (typeof formula !== 'string') return formula;

    // Simple number string
    if (/^-?\d+(\.\d+)?$/.test(formula)) {
      return parseFloat(formula);
    }

    try {
      // Create a safe evaluation context
      const safeContext = {
        player: context.player || {},
        gameState: context.gameState || {},
        flags: context.flags || {},
        Math: Math,
        parseInt: parseInt,
        parseFloat: parseFloat,
        Number: Number,
        String: String,
        Boolean: Boolean
      };

      // Build the function with context variables
      const contextKeys = Object.keys(safeContext);
      const contextValues = Object.values(safeContext);

      // Create and execute the function
      const fn = new Function(...contextKeys, `return ${formula}`);
      return fn(...contextValues);
    } catch (error) {
      console.warn(`InputValidationSystem: Failed to evaluate formula "${formula}":`, error);
      return undefined;
    }
  }

  /**
   * Evaluate a constraint expression
   * @param {any} value - The value being validated
   * @param {string} constraint - Constraint expression (e.g., "value <= player.gold")
   * @param {Object} context - Context object
   * @returns {boolean} Whether the constraint is satisfied
   */
  evaluateConstraint(value, constraint, context) {
    if (!constraint) return true;

    try {
      const safeContext = {
        value,
        player: context.player || {},
        gameState: context.gameState || {},
        flags: context.flags || {},
        Math: Math,
        parseInt: parseInt,
        parseFloat: parseFloat,
        Number: Number,
        String: String,
        Boolean: Boolean
      };

      const contextKeys = Object.keys(safeContext);
      const contextValues = Object.values(safeContext);

      const fn = new Function(...contextKeys, `return ${constraint}`);
      return Boolean(fn(...contextValues));
    } catch (error) {
      console.warn(`InputValidationSystem: Failed to evaluate constraint "${constraint}":`, error);
      return false;
    }
  }

  /**
   * Calculate cost based on formula
   * @param {any} value - Input value
   * @param {string} costFormula - Cost formula (e.g., "value * 10")
   * @param {Object} context - Context object
   * @returns {number} Calculated cost
   */
  calculateCost(value, costFormula, context) {
    if (!costFormula) return 0;

    const extendedContext = {
      ...context,
      value
    };

    const result = this.evaluateFormula(costFormula, extendedContext);
    return typeof result === 'number' ? result : 0;
  }

  /**
   * Register a custom validator
   * @param {string} name - Validator name
   * @param {Function} validator - Validator function (value, context, rules) => { valid, message? }
   */
  registerValidator(name, validator) {
    this.customValidators.set(name, validator);
  }

  /**
   * Unregister a custom validator
   * @param {string} name - Validator name
   */
  unregisterValidator(name) {
    this.customValidators.delete(name);
  }

  /**
   * Get validation summary for display
   * @param {Object} rules - Validation rules
   * @param {Object} context - Context for formula evaluation
   * @returns {Object} Human-readable validation summary
   */
  getValidationSummary(rules, context) {
    const resolved = this.resolveRules(rules, context);
    const summary = {};

    if (resolved.required) summary.required = true;
    if (resolved.min !== undefined) summary.min = resolved.min;
    if (resolved.max !== undefined) summary.max = resolved.max;
    if (resolved.minLength !== undefined) summary.minLength = resolved.minLength;
    if (resolved.maxLength !== undefined) summary.maxLength = resolved.maxLength;
    if (resolved.mustBeInteger) summary.wholeNumbersOnly = true;
    if (resolved.step !== undefined) summary.step = resolved.step;
    if (resolved.type) summary.type = resolved.type;

    return summary;
  }

  /**
   * Check if a value would be valid (quick check without full validation)
   * @param {any} value - Value to check
   * @param {Object} rules - Validation rules
   * @param {Object} context - Context for formula evaluation
   * @returns {boolean} Whether the value is likely valid
   */
  isValid(value, rules, context) {
    return this.validate(value, rules, context).valid;
  }
}

export default InputValidationSystem;
