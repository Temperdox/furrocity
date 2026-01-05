/**
 * BodyDescriptorSystem - Generates contextual descriptors for body parts
 *
 * Descriptors vary based on:
 * - Size/development level (from body measurements)
 * - Arousal/lust level (current player state)
 * - Corruption level (corruption stat)
 * - Equipment (piercings, toys, etc.)
 *
 * @module engine/BodyDescriptorSystem
 */

/**
 * Size tier thresholds for body measurements
 */
export const SIZE_TIERS = {
  TINY: 'tiny',       // 0-2
  SMALL: 'small',     // 3-4
  AVERAGE: 'average', // 5-6
  LARGE: 'large',     // 7-8
  HUGE: 'huge',       // 9-10
  MASSIVE: 'massive'  // 11+
};

/**
 * Arousal modifier levels
 */
export const AROUSAL_LEVELS = {
  NONE: 'none',         // 0-19%
  SLIGHT: 'slight',     // 20-39%
  MODERATE: 'moderate', // 40-59%
  HIGH: 'high',         // 60-79%
  EXTREME: 'extreme'    // 80-100%
};

/**
 * Corruption modifier levels
 */
export const CORRUPTION_LEVELS = {
  PURE: 'pure',         // 0-24%
  TOUCHED: 'touched',   // 25-49%
  TAINTED: 'tainted',   // 50-79%
  CORRUPTED: 'corrupted' // 80-100%
};

/**
 * Mapping of body parts to their measurement sources in playerState.nsfwStats.bodyMeasurements
 */
const BODY_PART_MEASUREMENTS = {
  chest: 'bustSize',
  ass: 'buttSize',
  dick: 'genitalSize',
  balls: 'testicleSize',
  pussy: 'genitalSize', // Uses same but inverted logic
  thighs: 'hipSize',
  mouth: null,
  ears: null,
  brain: null
};

/**
 * Mapping of body parts to piercing equipment slots
 */
const PIERCING_SLOTS = {
  chest: ['nipple_left', 'nipple_right'],
  dick: ['genital'],
  pussy: ['genital'],
  tongue: ['tongue'],
  ears: ['ear_left', 'ear_right'],
  nipples: ['nipple_left', 'nipple_right']
};

/**
 * System for generating contextual body part descriptors
 */
export class BodyDescriptorSystem {
  /**
   * @param {Object} descriptorData - Loaded from body_descriptors.json
   */
  constructor(descriptorData = {}) {
    this.descriptors = descriptorData;
  }

  /**
   * Initialize with descriptor data
   * @param {Object} descriptorData - Body descriptor definitions
   */
  initialize(descriptorData) {
    this.descriptors = descriptorData;
  }

  /**
   * Get a descriptor for a body part based on player state
   * @param {string} bodyPart - The body part (chest, ass, dick, balls, pussy, mouth, thighs, ears, brain)
   * @param {Object} playerState - Player state with nsfwStats
   * @param {Object} options - Additional context options
   * @param {number} options.arousalOverride - Override arousal value
   * @param {number} options.lustOverride - Override lust value
   * @param {boolean} options.includeArousal - Whether to include arousal modifiers (default: true)
   * @param {boolean} options.includeCorruption - Whether to include corruption modifiers (default: true)
   * @returns {string} The generated descriptor
   */
  getDescriptor(bodyPart, playerState, options = {}) {
    const partConfig = this.descriptors[bodyPart];
    if (!partConfig) {
      return bodyPart; // Fallback to body part name
    }

    const {
      includeArousal = true,
      includeCorruption = true
    } = options;

    // Get size tier
    const sizeTier = this.getSizeTier(bodyPart, playerState);

    // Get base descriptor from size
    let baseDescriptor = this.selectFromPool(partConfig.sizes?.[sizeTier]) ||
                         this.selectFromPool(partConfig.default) ||
                         bodyPart;

    // Add arousal modifier if applicable
    if (includeArousal) {
      const arousalLevel = this.getArousalLevel(playerState, options);
      const arousalMod = this.selectFromPool(partConfig.arousal?.[arousalLevel]);
      if (arousalMod) {
        baseDescriptor = `${baseDescriptor}, ${arousalMod}`;
      }
    }

    // Add corruption modifier if applicable
    if (includeCorruption) {
      const corruptionLevel = this.getCorruptionLevel(playerState);
      const corruptionMod = this.selectFromPool(partConfig.corruption?.[corruptionLevel]);
      if (corruptionMod) {
        baseDescriptor = `${baseDescriptor}, ${corruptionMod}`;
      }
    }

    return baseDescriptor;
  }

  /**
   * Get descriptor with equipment awareness (piercings, toys)
   * @param {string} bodyPart - The body part
   * @param {Object} playerState - Player state
   * @param {Object} equipment - Player equipment object
   * @param {Object} options - Additional options
   * @returns {string} Descriptor with equipment prefix if applicable
   */
  getDescriptorWithEquipment(bodyPart, playerState, equipment, options = {}) {
    const baseDescriptor = this.getDescriptor(bodyPart, playerState, options);

    // Check for piercings
    const piercingSlots = PIERCING_SLOTS[bodyPart] || [];
    const piercings = piercingSlots
      .filter(slot => equipment?.[slot])
      .map(slot => equipment[slot]);

    if (piercings.length > 0) {
      // Get piercing description
      const piercingNames = piercings.map(p => p.name || 'pierced').join(' and ');
      if (piercings.length === 1) {
        return `${piercingNames}-adorned ${baseDescriptor}`;
      } else {
        return `pierced ${baseDescriptor}`;
      }
    }

    return baseDescriptor;
  }

  /**
   * Get the size tier for a body part
   * @param {string} bodyPart - The body part
   * @param {Object} playerState - Player state
   * @returns {string} Size tier (tiny, small, average, large, huge, massive)
   */
  getSizeTier(bodyPart, playerState) {
    const measurementKey = BODY_PART_MEASUREMENTS[bodyPart];
    if (!measurementKey) {
      return SIZE_TIERS.AVERAGE;
    }

    const measurements = playerState?.nsfwStats?.bodyMeasurements || {};
    const size = measurements[measurementKey] ?? 5;

    // Special handling for pussy - inverted from genital size if has dick
    if (bodyPart === 'pussy') {
      const masculinity = playerState?.nsfwStats?.masculinity ?? 50;
      if (masculinity > 60) {
        return SIZE_TIERS.AVERAGE; // Default if primarily male
      }
    }

    // Map size value to tier
    if (size <= 2) return SIZE_TIERS.TINY;
    if (size <= 4) return SIZE_TIERS.SMALL;
    if (size <= 6) return SIZE_TIERS.AVERAGE;
    if (size <= 8) return SIZE_TIERS.LARGE;
    if (size <= 10) return SIZE_TIERS.HUGE;
    return SIZE_TIERS.MASSIVE;
  }

  /**
   * Get the arousal level from player state
   * @param {Object} playerState - Player state
   * @param {Object} options - Options with possible overrides
   * @returns {string} Arousal level (none, slight, moderate, high, extreme)
   */
  getArousalLevel(playerState, options = {}) {
    const arousal = options.arousalOverride ?? playerState?.nsfwStats?.arousal ?? 0;
    const lust = options.lustOverride ?? playerState?.nsfwStats?.lust ?? 0;

    // Use the higher of arousal or lust
    const effectiveArousal = Math.max(arousal, lust);

    if (effectiveArousal >= 80) return AROUSAL_LEVELS.EXTREME;
    if (effectiveArousal >= 60) return AROUSAL_LEVELS.HIGH;
    if (effectiveArousal >= 40) return AROUSAL_LEVELS.MODERATE;
    if (effectiveArousal >= 20) return AROUSAL_LEVELS.SLIGHT;
    return AROUSAL_LEVELS.NONE;
  }

  /**
   * Get the corruption level from player state
   * @param {Object} playerState - Player state
   * @returns {string} Corruption level (pure, touched, tainted, corrupted)
   */
  getCorruptionLevel(playerState) {
    const corruption = playerState?.nsfwStats?.corruption ?? 0;

    if (corruption >= 80) return CORRUPTION_LEVELS.CORRUPTED;
    if (corruption >= 50) return CORRUPTION_LEVELS.TAINTED;
    if (corruption >= 25) return CORRUPTION_LEVELS.TOUCHED;
    return CORRUPTION_LEVELS.PURE;
  }

  /**
   * Convenience method for chest descriptor
   * @param {Object} playerState - Player state
   * @param {Object} options - Options
   * @returns {string} Chest descriptor
   */
  getChestDescriptor(playerState, options = {}) {
    return this.getDescriptor('chest', playerState, options);
  }

  /**
   * Convenience method for dick descriptor
   * @param {Object} playerState - Player state
   * @param {Object} options - Options
   * @returns {string} Dick descriptor
   */
  getDickDescriptor(playerState, options = {}) {
    return this.getDescriptor('dick', playerState, options);
  }

  /**
   * Convenience method for pussy descriptor
   * @param {Object} playerState - Player state
   * @param {Object} options - Options
   * @returns {string} Pussy descriptor
   */
  getPussyDescriptor(playerState, options = {}) {
    return this.getDescriptor('pussy', playerState, options);
  }

  /**
   * Convenience method for ass descriptor
   * @param {Object} playerState - Player state
   * @param {Object} options - Options
   * @returns {string} Ass descriptor
   */
  getAssDescriptor(playerState, options = {}) {
    return this.getDescriptor('ass', playerState, options);
  }

  /**
   * Convenience method for balls descriptor
   * @param {Object} playerState - Player state
   * @param {Object} options - Options
   * @returns {string} Balls descriptor
   */
  getBallsDescriptor(playerState, options = {}) {
    return this.getDescriptor('balls', playerState, options);
  }

  /**
   * Check if player has a specific body part
   * @param {string} bodyPart - Body part to check (dick, pussy, breasts)
   * @param {Object} playerState - Player state
   * @returns {boolean} Whether player has the body part
   */
  hasBodyPart(bodyPart, playerState) {
    const masculinity = playerState?.nsfwStats?.masculinity ?? 50;
    const measurements = playerState?.nsfwStats?.bodyMeasurements || {};

    switch (bodyPart) {
      case 'dick':
      case 'penis':
        return (measurements.genitalSize ?? 0) > 0 || masculinity > 50;

      case 'pussy':
      case 'vagina':
        return masculinity < 50 || playerState?.nsfwStats?.hasVagina === true;

      case 'breasts':
      case 'chest':
        return (measurements.bustSize ?? 0) > 2;

      case 'balls':
      case 'testicles':
        return (measurements.testicleSize ?? 0) > 0 || masculinity > 50;

      default:
        return true; // Most body parts everyone has
    }
  }

  /**
   * Get all available body parts for a player
   * @param {Object} playerState - Player state
   * @returns {string[]} List of body parts the player has
   */
  getAvailableBodyParts(playerState) {
    const allParts = ['chest', 'ass', 'mouth', 'thighs', 'ears'];

    if (this.hasBodyPart('dick', playerState)) {
      allParts.push('dick');
    }
    if (this.hasBodyPart('balls', playerState)) {
      allParts.push('balls');
    }
    if (this.hasBodyPart('pussy', playerState)) {
      allParts.push('pussy');
    }

    return allParts;
  }

  /**
   * Select a random item from an array pool
   * @param {string[]} pool - Array of options
   * @returns {string|null} Random selection or null if empty
   */
  selectFromPool(pool) {
    if (!pool || !Array.isArray(pool) || pool.length === 0) {
      return null;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }
}

export default BodyDescriptorSystem;
