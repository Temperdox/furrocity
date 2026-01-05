/**
 * NSFWTextInterpolator - Extended text interpolation for NSFW combat scenes
 *
 * Features:
 * - Body part descriptors: {chest_descriptor}, {dick_descriptor}, etc.
 * - Enemy names with grammar: {enemy_name}, {enemy_name_mid}, {enemy_possessive}
 * - Player names: {player_name}, {player_possessive}
 * - Equipment checks: {has_plug}, {plug_name}, {has_nipple_toys}
 * - State checks: {arousal_state}, {chest_exposure}
 * - Gender-aware pronouns: {pronoun_subject}, {pronoun_object}, {pronoun_possessive}
 * - Conditional blocks: {if condition}...{else}...{/if}
 *
 * @module engine/NSFWTextInterpolator
 */

/**
 * Text interpolator for NSFW combat scenes
 */
export class NSFWTextInterpolator {
  /**
   * @param {Object} options - Configuration options
   * @param {Object} options.bodyDescriptorSystem - BodyDescriptorSystem instance
   * @param {Object} options.enemyNamingSystem - EnemyNamingSystem instance
   */
  constructor(options = {}) {
    this.bodyDescriptorSystem = options.bodyDescriptorSystem;
    this.enemyNamingSystem = options.enemyNamingSystem;

    // Helper functions for text transformation
    this.helpers = {
      capitalizeFirst: (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '',
      lowercase: (str) => str ? str.toLowerCase() : '',
      uppercase: (str) => str ? str.toUpperCase() : '',
      pluralize: (str, count) => count === 1 ? str : `${str}s`,
      aOrAn: (str) => str && 'aeiou'.includes(str.charAt(0).toLowerCase()) ? 'an' : 'a'
    };
  }

  /**
   * Process a template string with NSFW placeholders
   * @param {string} template - Template with {placeholder} syntax
   * @param {Object} context - Interpolation context
   * @param {Object} context.player - Player state
   * @param {Object} context.enemy - Current enemy (for single-enemy templates)
   * @param {Object[]} context.enemies - All enemies in combat
   * @param {Object} context.equipment - Player equipment
   * @param {Object} context.combatState - Current combat state
   * @returns {string} Processed text
   */
  interpolate(template, context = {}) {
    if (!template) return '';

    // 1. Process conditional blocks first
    let result = this.processConditionals(template, context);

    // 2. Process all {placeholder} replacements
    result = result.replace(/\{([^}]+)\}/g, (match, placeholder) => {
      return this.resolvePlaceholder(placeholder, context);
    });

    // 3. Clean up any extra whitespace
    result = result.replace(/\s+/g, ' ').trim();

    return result;
  }

  /**
   * Resolve a single placeholder
   * @param {string} placeholder - The placeholder text (without braces)
   * @param {Object} context - Interpolation context
   * @returns {string} Resolved value
   */
  resolvePlaceholder(placeholder, context) {
    // Check for helper suffix: {placeholder|helper}
    const [path, ...helperNames] = placeholder.split('|');
    let value = this.getValue(path.trim(), context);

    // Apply helpers
    for (const helperName of helperNames) {
      const helperFn = this.helpers[helperName.trim()];
      if (helperFn) {
        value = helperFn(value);
      }
    }

    return value;
  }

  /**
   * Get the value for a placeholder path
   * @param {string} path - The placeholder path
   * @param {Object} context - Interpolation context
   * @returns {string} The resolved value
   */
  getValue(path, context) {
    const { player, enemy, enemies, equipment, combatState } = context;

    // ==================== ENEMY NAMES ====================
    if (path === 'enemy_name' || path === 'enemy.name') {
      return this.enemyNamingSystem?.getName(enemy, { position: 'start' }) ||
             enemy?.name || 'The enemy';
    }
    if (path === 'enemy_name_mid') {
      return this.enemyNamingSystem?.getName(enemy, { position: 'mid' }) ||
             enemy?.name?.toLowerCase() || 'the enemy';
    }
    if (path === 'enemy_possessive') {
      return this.enemyNamingSystem?.getPossessive(enemy, { position: 'start' }) ||
             `${enemy?.name}'s` || "the enemy's";
    }
    if (path === 'enemy_possessive_mid') {
      return this.enemyNamingSystem?.getPossessive(enemy, { position: 'mid' }) ||
             `${enemy?.name}'s` || "the enemy's";
    }
    if (path === 'enemy_type') {
      return enemy?.type || 'creature';
    }

    // ==================== PLAYER NAMES ====================
    if (path === 'player_name' || path === 'player.name') {
      return player?.name || 'You';
    }
    if (path === 'player_possessive') {
      const name = player?.name;
      if (!name || name === 'You') return 'your';
      return name.endsWith('s') ? `${name}'` : `${name}'s`;
    }

    // ==================== BODY DESCRIPTORS ====================
    if (path === 'chest_descriptor' || path === 'chest_desc') {
      return this.bodyDescriptorSystem?.getChestDescriptor(player, combatState) || 'chest';
    }
    if (path === 'dick_descriptor' || path === 'dick_desc') {
      return this.bodyDescriptorSystem?.getDickDescriptor(player, combatState) || 'member';
    }
    if (path === 'pussy_descriptor' || path === 'pussy_desc') {
      return this.bodyDescriptorSystem?.getPussyDescriptor(player, combatState) || 'sex';
    }
    if (path === 'ass_descriptor' || path === 'ass_desc') {
      return this.bodyDescriptorSystem?.getAssDescriptor(player, combatState) || 'rear';
    }
    if (path === 'balls_descriptor' || path === 'balls_desc') {
      return this.bodyDescriptorSystem?.getBallsDescriptor(player, combatState) || 'balls';
    }
    if (path === 'mouth_descriptor' || path === 'mouth_desc') {
      return this.bodyDescriptorSystem?.getDescriptor('mouth', player, combatState) || 'mouth';
    }
    if (path === 'thighs_descriptor' || path === 'thighs_desc') {
      return this.bodyDescriptorSystem?.getDescriptor('thighs', player, combatState) || 'thighs';
    }
    if (path === 'ears_descriptor' || path === 'ears_desc') {
      return this.bodyDescriptorSystem?.getDescriptor('ears', player, combatState) || 'ears';
    }
    if (path === 'nipples_descriptor' || path === 'nipples_desc') {
      return this.bodyDescriptorSystem?.getDescriptor('nipples', player, combatState) || 'nipples';
    }
    if (path === 'anus_descriptor' || path === 'anus_desc') {
      return this.bodyDescriptorSystem?.getDescriptor('anus', player, combatState) || 'rear entrance';
    }

    // Generic body part: {body_descriptor:chest}
    if (path.startsWith('body_descriptor:')) {
      const bodyPart = path.split(':')[1];
      return this.bodyDescriptorSystem?.getDescriptor(bodyPart, player, combatState) || bodyPart;
    }

    // ==================== EQUIPMENT ====================
    if (path.startsWith('equipped_')) {
      const slot = path.replace('equipped_', '');
      return equipment?.[slot]?.name || 'nothing';
    }
    if (path === 'has_plug') {
      return equipment?.plug ? 'true' : 'false';
    }
    if (path === 'plug_name') {
      return equipment?.plug?.name || 'plug';
    }
    if (path === 'has_nipple_toys') {
      return (equipment?.nipple_left || equipment?.nipple_right) ? 'true' : 'false';
    }
    if (path === 'nipple_toy_name') {
      const toy = equipment?.nipple_left || equipment?.nipple_right;
      return toy?.name || 'nipple clamps';
    }
    if (path === 'has_chastity') {
      return equipment?.chastity ? 'true' : 'false';
    }
    if (path === 'chastity_name') {
      return equipment?.chastity?.name || 'chastity device';
    }
    if (path === 'has_collar') {
      return equipment?.neck ? 'true' : 'false';
    }
    if (path === 'collar_name') {
      return equipment?.neck?.name || 'collar';
    }

    // ==================== AROUSAL STATE ====================
    if (path === 'arousal_state') {
      const arousal = player?.nsfwStats?.arousal || 0;
      if (arousal >= 80) return 'overwhelmed with pleasure';
      if (arousal >= 60) return 'deeply aroused';
      if (arousal >= 40) return 'noticeably aroused';
      if (arousal >= 20) return 'slightly flushed';
      return 'calm';
    }
    if (path === 'lust_state') {
      const lust = player?.nsfwStats?.lust || 0;
      if (lust >= 80) return 'consumed by lust';
      if (lust >= 60) return 'burning with desire';
      if (lust >= 40) return 'feeling needy';
      if (lust >= 20) return 'mildly aroused';
      return 'composed';
    }
    if (path === 'corruption_state') {
      const corruption = player?.nsfwStats?.corruption || 0;
      if (corruption >= 80) return 'thoroughly corrupted';
      if (corruption >= 50) return 'tainted by darkness';
      if (corruption >= 25) return 'touched by corruption';
      return 'pure';
    }

    // ==================== EXPOSURE STATE ====================
    if (path === 'chest_exposure') {
      return player?.clothingState?.chest?.exposed ? 'exposed' : 'covered';
    }
    if (path === 'groin_exposure') {
      return player?.clothingState?.legs?.exposed ? 'exposed' : 'covered';
    }
    if (path === 'is_naked') {
      const clothing = player?.clothingState || {};
      const exposed = ['chest', 'legs'].every(slot =>
        clothing[slot]?.exposed || !clothing[slot]?.equipped
      );
      return exposed ? 'true' : 'false';
    }

    // ==================== PRONOUNS ====================
    if (path === 'pronoun_subject') {
      return this.getPronoun(player, 'subject');
    }
    if (path === 'pronoun_object') {
      return this.getPronoun(player, 'object');
    }
    if (path === 'pronoun_possessive') {
      return this.getPronoun(player, 'possessive');
    }
    if (path === 'pronoun_reflexive') {
      return this.getPronoun(player, 'reflexive');
    }

    // ==================== BODY PART CHECKS ====================
    if (path === 'has_dick') {
      return this.bodyDescriptorSystem?.hasBodyPart('dick', player) ? 'true' : 'false';
    }
    if (path === 'has_pussy') {
      return this.bodyDescriptorSystem?.hasBodyPart('pussy', player) ? 'true' : 'false';
    }
    if (path === 'has_breasts') {
      return this.bodyDescriptorSystem?.hasBodyPart('breasts', player) ? 'true' : 'false';
    }
    if (path === 'has_balls') {
      return this.bodyDescriptorSystem?.hasBodyPart('balls', player) ? 'true' : 'false';
    }

    // ==================== STAT ACCESS ====================
    if (path.startsWith('stat:')) {
      const statPath = path.replace('stat:', '');
      return this.getNestedValue(player?.stats || player?.nsfwStats, statPath) ?? '';
    }
    if (path.startsWith('nsfw:')) {
      const statPath = path.replace('nsfw:', '');
      return this.getNestedValue(player?.nsfwStats, statPath) ?? '';
    }
    if (path.startsWith('enemy_stat:')) {
      const statPath = path.replace('enemy_stat:', '');
      return this.getNestedValue(enemy?.stats, statPath) ?? '';
    }

    // ==================== NESTED PATH ACCESS ====================
    if (path.startsWith('player.')) {
      return this.getNestedValue(player, path.replace('player.', '')) ?? '';
    }
    if (path.startsWith('enemy.')) {
      return this.getNestedValue(enemy, path.replace('enemy.', '')) ?? '';
    }
    if (path.startsWith('combat.')) {
      return this.getNestedValue(combatState, path.replace('combat.', '')) ?? '';
    }

    // Fallback: return placeholder as-is if not found
    return `{${path}}`;
  }

  /**
   * Get nested value from an object using dot notation
   * @param {Object} obj - Object to search
   * @param {string} path - Dot-separated path
   * @returns {any} The value or undefined
   */
  getNestedValue(obj, path) {
    if (!obj || !path) return undefined;

    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }

    return current;
  }

  /**
   * Get the appropriate pronoun based on player gender
   * @param {Object} player - Player state
   * @param {string} type - Pronoun type (subject, object, possessive, reflexive)
   * @returns {string} The pronoun
   */
  getPronoun(player, type) {
    const masculinity = player?.nsfwStats?.masculinity ?? 50;
    const gender = player?.gender ||
                   (masculinity > 60 ? 'male' : masculinity < 40 ? 'female' : 'neutral');

    const pronouns = {
      male: { subject: 'he', object: 'him', possessive: 'his', reflexive: 'himself' },
      female: { subject: 'she', object: 'her', possessive: 'her', reflexive: 'herself' },
      neutral: { subject: 'they', object: 'them', possessive: 'their', reflexive: 'themself' }
    };

    return pronouns[gender]?.[type] || pronouns.neutral[type];
  }

  /**
   * Process conditional blocks in the template
   * Supports: {if condition}...{/if} and {if condition}...{else}...{/if}
   * @param {string} template - Template with conditionals
   * @param {Object} context - Interpolation context
   * @returns {string} Processed template
   */
  processConditionals(template, context) {
    // Process {if condition}...{else}...{/if} blocks
    const conditionalRegex = /\{if\s+([^}]+)\}([\s\S]*?)\{\/if\}/g;

    return template.replace(conditionalRegex, (match, condition, content) => {
      // Check for else clause
      const elseSplit = content.split('{else}');
      const ifContent = elseSplit[0];
      const elseContent = elseSplit[1] || '';

      const result = this.evaluateCondition(condition.trim(), context);
      return result ? ifContent : elseContent;
    });
  }

  /**
   * Evaluate a condition expression
   * @param {string} condition - Condition string
   * @param {Object} context - Interpolation context
   * @returns {boolean} Whether condition is true
   */
  evaluateCondition(condition, context) {
    const { player, enemy, equipment, combatState } = context;

    // ==================== BOOLEAN CHECKS ====================
    if (condition === 'has_plug') {
      return !!equipment?.plug;
    }
    if (condition === 'has_nipple_toys') {
      return !!(equipment?.nipple_left || equipment?.nipple_right);
    }
    if (condition === 'has_chastity') {
      return !!equipment?.chastity;
    }
    if (condition === 'has_collar') {
      return !!equipment?.neck;
    }
    if (condition === 'chest_exposed') {
      return player?.clothingState?.chest?.exposed === true;
    }
    if (condition === 'groin_exposed') {
      return player?.clothingState?.legs?.exposed === true;
    }
    if (condition === 'is_naked') {
      const clothing = player?.clothingState || {};
      return ['chest', 'legs'].every(slot =>
        clothing[slot]?.exposed || !clothing[slot]?.equipped
      );
    }
    if (condition === 'is_male') {
      return (player?.nsfwStats?.masculinity ?? 50) > 60;
    }
    if (condition === 'is_female') {
      return (player?.nsfwStats?.masculinity ?? 50) < 40;
    }
    if (condition === 'has_dick') {
      return this.bodyDescriptorSystem?.hasBodyPart('dick', player) ?? false;
    }
    if (condition === 'has_pussy') {
      return this.bodyDescriptorSystem?.hasBodyPart('pussy', player) ?? false;
    }
    if (condition === 'has_breasts') {
      return this.bodyDescriptorSystem?.hasBodyPart('breasts', player) ?? false;
    }
    if (condition === 'has_balls') {
      return this.bodyDescriptorSystem?.hasBodyPart('balls', player) ?? false;
    }
    if (condition === 'is_restrained') {
      return player?.isRestrained || combatState?.isRestrained || false;
    }
    if (condition === 'is_grappled') {
      return player?.isGrappled || combatState?.isGrappled || false;
    }
    if (condition === 'enemy_named') {
      return this.enemyNamingSystem?.isNamed(enemy) ?? false;
    }

    // ==================== COMPARISON CHECKS ====================
    // Format: stat > value, arousal >= 50, etc.
    const comparisonMatch = condition.match(/(\w+(?:\.\w+)*)\s*(>|<|>=|<=|==|!=)\s*(\d+)/);
    if (comparisonMatch) {
      const [, path, operator, valueStr] = comparisonMatch;
      const value = parseInt(valueStr, 10);

      // Try to get the value from various sources
      let actual = this.getNestedValue(context, path);
      if (actual === undefined) {
        actual = this.getNestedValue(player?.nsfwStats, path);
      }
      if (actual === undefined) {
        actual = this.getNestedValue(player?.stats, path);
      }
      if (actual === undefined) {
        actual = this.getNestedValue(player, path);
      }
      actual = actual ?? 0;

      switch (operator) {
        case '>': return actual > value;
        case '<': return actual < value;
        case '>=': return actual >= value;
        case '<=': return actual <= value;
        case '==': return actual == value;
        case '!=': return actual != value;
      }
    }

    // ==================== NEGATION ====================
    if (condition.startsWith('!') || condition.startsWith('not ')) {
      const innerCondition = condition.replace(/^(!|not\s+)/, '');
      return !this.evaluateCondition(innerCondition, context);
    }

    // Default to false for unknown conditions
    return false;
  }

  /**
   * Register a custom helper function
   * @param {string} name - Helper name
   * @param {Function} fn - Helper function
   */
  registerHelper(name, fn) {
    this.helpers[name] = fn;
  }
}

export default NSFWTextInterpolator;
