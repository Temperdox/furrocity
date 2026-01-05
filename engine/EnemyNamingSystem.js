/**
 * EnemyNamingSystem - Handles enemy name generation and grammar
 *
 * Features:
 * - Named enemies with specific names
 * - Random name generation from species/variant pools
 * - Proper article handling ("The wolf" vs "Zander")
 * - Grammar-aware text (capitalization based on sentence position)
 * - Name caching per combat instance
 *
 * @module engine/EnemyNamingSystem
 */

/**
 * System for enemy name generation and grammar handling
 */
export class EnemyNamingSystem {
  /**
   * @param {Object} nameData - Loaded from enemy_names.json
   */
  constructor(nameData = {}) {
    this.nameData = nameData;
    this.generatedNames = new Map(); // Cache generated names by enemy instance ID
  }

  /**
   * Initialize with name data
   * @param {Object} nameData - Enemy name definitions
   */
  initialize(nameData) {
    this.nameData = nameData;
    this.clearCache();
  }

  /**
   * Get the display name for an enemy
   * @param {Object} enemy - Enemy data object
   * @param {Object} options - Formatting options
   * @param {string} options.position - 'start' (sentence start) or 'mid' (mid-sentence)
   * @param {string} options.article - 'definite' (the) or 'indefinite' (a/an)
   * @returns {string} The formatted enemy name
   */
  getName(enemy, options = {}) {
    const { position = 'start', article = 'definite' } = options;

    // 1. Check for specific name defined in enemy data
    if (enemy.specificName) {
      return this.formatNamedEnemy(enemy.specificName, position);
    }

    // 2. Check if we've already generated a name for this combat instance
    const instanceId = enemy.combatId || enemy.instanceId || enemy.id;
    if (this.generatedNames.has(instanceId)) {
      const cachedName = this.generatedNames.get(instanceId);
      if (cachedName.isNamed) {
        return this.formatNamedEnemy(cachedName.name, position);
      }
      return this.formatUnnamedEnemy(cachedName.displayName, position, article);
    }

    // 3. Check if enemy type/species uses names
    const speciesConfig = this.getSpeciesConfig(enemy);

    if (speciesConfig && !speciesConfig.useArticle) {
      // This species uses names - generate one
      const namePool = this.getNamePool(enemy, speciesConfig);
      if (namePool && namePool.length > 0) {
        const generatedName = this.generateRandomName(enemy, namePool, speciesConfig);
        this.generatedNames.set(instanceId, { isNamed: true, name: generatedName });
        return this.formatNamedEnemy(generatedName, position);
      }
    }

    // 4. Fall back to species/type name with article
    const displayName = speciesConfig?.displayName || enemy.name || enemy.type || 'creature';
    this.generatedNames.set(instanceId, { isNamed: false, displayName });
    return this.formatUnnamedEnemy(displayName, position, article);
  }

  /**
   * Get species configuration from name data
   * @param {Object} enemy - Enemy object
   * @returns {Object|null} Species configuration
   */
  getSpeciesConfig(enemy) {
    const species = enemy.species || enemy.id;
    const type = enemy.type || 'humanoid';

    // Try species-specific config first
    if (this.nameData.species?.[species]) {
      return this.nameData.species[species];
    }

    // Fall back to type-based config
    if (this.nameData.types?.[type]) {
      return this.nameData.types[type];
    }

    return null;
  }

  /**
   * Get the name pool for an enemy based on species and variant
   * @param {Object} enemy - Enemy object
   * @param {Object} speciesConfig - Species configuration
   * @returns {string[]|null} Array of possible names
   */
  getNamePool(enemy, speciesConfig) {
    const variant = enemy.variant || 'normal';

    // Check for variant-specific names first
    if (speciesConfig.variants?.[variant]?.names) {
      return speciesConfig.variants[variant].names;
    }

    // Fall back to general species names
    return speciesConfig.names || null;
  }

  /**
   * Generate a random name with optional title template
   * @param {Object} enemy - Enemy object
   * @param {string[]} namePool - Array of possible base names
   * @param {Object} speciesConfig - Species configuration
   * @returns {string} Generated full name
   */
  generateRandomName(enemy, namePool, speciesConfig) {
    const variant = enemy.variant || 'normal';

    // Pick random base name
    const baseName = namePool[Math.floor(Math.random() * namePool.length)];

    // Get title template
    const template = speciesConfig.variants?.[variant]?.titleTemplate ||
                     speciesConfig.titleTemplate ||
                     null;

    if (!template) {
      return baseName;
    }

    return this.applyNameTemplate(template, baseName, enemy, speciesConfig);
  }

  /**
   * Apply a name template to generate the full name
   * @param {string} template - Template string like "{name} the {title}"
   * @param {string} baseName - The base name
   * @param {Object} enemy - Enemy object
   * @param {Object} speciesConfig - Species configuration
   * @returns {string} Full name with template applied
   */
  applyNameTemplate(template, baseName, enemy, speciesConfig) {
    let result = template;

    // Replace {name} placeholder
    result = result.replace('{name}', baseName);

    // Replace {title} placeholder
    if (result.includes('{title}')) {
      const titles = speciesConfig.titles || [enemy.type || 'creature'];
      const title = titles[Math.floor(Math.random() * titles.length)];
      result = result.replace('{title}', title);
    }

    // Replace {region} placeholder
    if (result.includes('{region}')) {
      const regions = this.nameData.regions || ['Unknown Lands'];
      const region = regions[Math.floor(Math.random() * regions.length)];
      result = result.replace('{region}', region);
    }

    // Replace {rank} placeholder
    if (result.includes('{rank}')) {
      const variant = enemy.variant || 'normal';
      const ranks = {
        weak: 'Lesser',
        normal: '',
        strong: 'Greater',
        elite: 'Lord',
        champion: 'Overlord'
      };
      result = result.replace('{rank}', ranks[variant] || '');
    }

    // Clean up any double spaces
    return result.replace(/\s+/g, ' ').trim();
  }

  /**
   * Format a named enemy's name based on sentence position
   * @param {string} name - The enemy's name
   * @param {string} position - 'start' or 'mid'
   * @returns {string} Formatted name
   */
  formatNamedEnemy(name, position) {
    // Named enemies don't use articles, just proper capitalization
    if (position === 'start') {
      return this.capitalizeFirst(name);
    }
    // Mid-sentence: name stays as-is (proper nouns are capitalized)
    return name;
  }

  /**
   * Format an unnamed enemy's name with proper article and capitalization
   * @param {string} speciesName - The species/type name
   * @param {string} position - 'start' or 'mid'
   * @param {string} articleType - 'definite' or 'indefinite'
   * @returns {string} Formatted name with article
   */
  formatUnnamedEnemy(speciesName, position, articleType) {
    const article = this.getArticle(speciesName, articleType);
    const lowerName = speciesName.toLowerCase();

    if (position === 'start') {
      // "The wolf barks" - capitalize article at sentence start
      return `${this.capitalizeFirst(article)} ${lowerName}`;
    } else {
      // "...and the wolf barks" - lowercase article mid-sentence
      return `${article} ${lowerName}`;
    }
  }

  /**
   * Get the possessive form of an enemy's name
   * @param {Object} enemy - Enemy object
   * @param {Object} options - Formatting options
   * @returns {string} Possessive form (e.g., "Zander's" or "the wolf's")
   */
  getPossessive(enemy, options = {}) {
    const name = this.getName(enemy, options);

    // Check if it ends with 's'
    if (name.endsWith('s')) {
      return `${name}'`;
    }
    return `${name}'s`;
  }

  /**
   * Get the appropriate article for a noun
   * @param {string} noun - The noun
   * @param {string} type - 'definite' (the) or 'indefinite' (a/an)
   * @returns {string} The article
   */
  getArticle(noun, type = 'definite') {
    if (type === 'indefinite') {
      const firstChar = noun.charAt(0).toLowerCase();
      return 'aeiou'.includes(firstChar) ? 'an' : 'a';
    }
    return 'the';
  }

  /**
   * Capitalize the first letter of a string
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   */
  capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Check if an enemy is named (has a specific name, not just a species)
   * @param {Object} enemy - Enemy object
   * @returns {boolean} Whether the enemy is named
   */
  isNamed(enemy) {
    if (enemy.specificName) return true;

    const instanceId = enemy.combatId || enemy.instanceId || enemy.id;
    if (this.generatedNames.has(instanceId)) {
      return this.generatedNames.get(instanceId).isNamed;
    }

    // Check if species uses names
    const speciesConfig = this.getSpeciesConfig(enemy);
    if (!speciesConfig) return false;

    return !speciesConfig.useArticle && speciesConfig.names?.length > 0;
  }

  /**
   * Clear the generated names cache (call when combat ends)
   */
  clearCache() {
    this.generatedNames.clear();
  }

  /**
   * Set a specific name for an enemy instance
   * @param {Object} enemy - Enemy object
   * @param {string} name - Name to set
   */
  setName(enemy, name) {
    const instanceId = enemy.combatId || enemy.instanceId || enemy.id;
    this.generatedNames.set(instanceId, { isNamed: true, name });
  }

  /**
   * Get all generated names (for debugging)
   * @returns {Map} Map of instance IDs to generated names
   */
  getGeneratedNames() {
    return new Map(this.generatedNames);
  }
}

export default EnemyNamingSystem;
