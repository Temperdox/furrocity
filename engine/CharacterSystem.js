/**
 * CharacterSystem - Manages playable characters and their paperdoll configurations
 *
 * Features:
 * - Load characters from datapacks
 * - Manage character paperdoll folder structures
 * - Handle base image progression (masc_0 to fem_10)
 * - Support for character-specific body part images (chest, genitalia, face)
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Base image progression stages
 * Characters can transform from masculine to feminine over time
 */
export const BASE_IMAGE_STAGES = {
  // Masculine base images (0-10)
  MASC_START: 0,
  MASC_END: 10,
  // Feminine base images (1-10)
  FEM_START: 1,
  FEM_END: 10,
};

/**
 * Cup sizes in order from smallest to largest
 */
export const CUP_SIZE_ORDER = [
  'flat', 'bee_sting',
  'a', 'aa', 'b', 'bb', 'c', 'cc', 'd', 'dd',
  'e', 'ee', 'f', 'ff', 'g', 'gg', 'h', 'hh',
  'i', 'ii', 'j', 'jj', 'k', 'kk', 'l', 'll',
  'm', 'mm', 'n', 'nn', 'o', 'oo', 'p', 'pp',
  'q', 'qq', 'r', 'rr', 's', 'ss', 't', 'tt',
  'u', 'uu', 'v', 'vv', 'w', 'ww', 'x', 'xx',
  'y', 'yy', 'z', 'zz'
];

/**
 * Default character structure
 */
export const DEFAULT_CHARACTER = {
  id: '',
  name: '',
  description: '',
  species: 'human',
  gender: 'female',
  bodyType: 'average',

  // Folder path relative to public/images/characters/
  paperdollFolder: '',

  baseStats: {
    strength: 5,
    vitality: 5,
    intelligence: 5,
    willpower: 5,
    speed: 5,
    charm: 5,
    luck: 5,
  },

  // Paperdoll configuration
  paperdoll: {
    // Starting base image index (0 = masc_0, 10 = masc_10, 11 = fem_1, etc.)
    startingBase: 0,

    // Chest configuration
    hasBreasts: true,
    startingCupSize: 'flat',  // Starting cup size
    maxCupSize: 'dd',         // Maximum cup size for this character

    // Genitalia configuration
    genitaliaType: 'vagina',  // none, penis, vagina, both

    // Face configuration
    faceStyle: 'default',
    faceVariants: 1,          // Number of face variants (face_default_0, face_default_1, etc.)
  },

  // Visual appearance (for UI display, not paperdoll)
  appearance: {
    skinColor: '#e8c4a0',
    hairColor: '#3d2314',
    eyeColor: '#4a90d9',
    furColor: '#8b6914',
  },

  // Starting equipment and items
  startingEquipment: [],
  startingItems: [],

  // Flavor text
  backstory: '',
  personality: '',

  // Portrait image for character select screen
  portrait: '',
};

// ============================================================================
// CHARACTER SYSTEM CLASS
// ============================================================================

/**
 * Main system for managing playable characters
 */
export class CharacterSystem {
  constructor(registry, options = {}) {
    this.registry = registry;
    this.imagesBasePath = options.imagesBasePath || '/images/characters';

    // Cache loaded characters
    this.characters = new Map();
  }

  /**
   * Initialize the system and load characters from registry
   */
  initialize() {
    const characters = this.registry.getAll('characters') || [];

    for (const character of characters) {
      this.characters.set(character.id, {
        ...DEFAULT_CHARACTER,
        ...character,
        paperdoll: { ...DEFAULT_CHARACTER.paperdoll, ...character.paperdoll },
        baseStats: { ...DEFAULT_CHARACTER.baseStats, ...character.baseStats },
        appearance: { ...DEFAULT_CHARACTER.appearance, ...character.appearance },
      });
    }

    console.log(`[CharacterSystem] Loaded ${this.characters.size} playable characters`);
    return this;
  }

  /**
   * Get all available playable characters
   */
  getAllCharacters() {
    return Array.from(this.characters.values());
  }

  /**
   * Get a specific character by ID
   */
  getCharacter(characterId) {
    return this.characters.get(characterId) || null;
  }

  /**
   * Get the folder path for a character's paperdoll images
   * @param {string} characterId - Character ID
   * @returns {string} Full path to character's image folder
   */
  getCharacterFolder(characterId) {
    const character = this.getCharacter(characterId);
    if (!character) return null;

    const folder = character.paperdollFolder || characterId;
    return `${this.imagesBasePath}/${folder}`;
  }

  /**
   * Get the base body image path for a character at a specific feminization level
   * @param {string} characterId - Character ID
   * @param {number} feminizationLevel - 0-20 scale (0=masc_0, 10=masc_10, 11=fem_1, 20=fem_10)
   * @returns {string} Path to the base body image
   */
  getBaseBodyImage(characterId, feminizationLevel = 0) {
    const folder = this.getCharacterFolder(characterId);
    if (!folder) return null;

    // Clamp to valid range
    const level = Math.max(0, Math.min(20, feminizationLevel));

    if (level <= 10) {
      // Masculine range: masc_0 to masc_10
      return `${folder}/base/masc_${level}.png`;
    } else {
      // Feminine range: fem_1 to fem_10
      const femLevel = level - 10;
      return `${folder}/base/fem_${femLevel}.png`;
    }
  }

  /**
   * Get chest/breast image path for a character
   * @param {string} characterId - Character ID
   * @param {string} cupSize - Cup size (flat, a, b, c, etc.)
   * @returns {string} Path to chest image
   */
  getChestImage(characterId, cupSize = 'flat') {
    const folder = this.getCharacterFolder(characterId);
    if (!folder) return null;

    const character = this.getCharacter(characterId);
    if (!character?.paperdoll?.hasBreasts) return null;

    // Validate cup size is within character's range
    const maxIndex = CUP_SIZE_ORDER.indexOf(character.paperdoll.maxCupSize);
    const requestedIndex = CUP_SIZE_ORDER.indexOf(cupSize);

    if (requestedIndex === -1 || (maxIndex !== -1 && requestedIndex > maxIndex)) {
      // Fall back to max available
      cupSize = character.paperdoll.maxCupSize || 'flat';
    }

    return `${folder}/chest/chest_${cupSize}.png`;
  }

  /**
   * Get genitalia image path for a character
   * @param {string} characterId - Character ID
   * @param {string} type - Genitalia type (penis, vagina)
   * @param {number} variant - Variant index (for size variations)
   * @returns {string} Path to genitalia image
   */
  getGenitaliaImage(characterId, type = null, variant = 0) {
    const folder = this.getCharacterFolder(characterId);
    if (!folder) return null;

    const character = this.getCharacter(characterId);
    if (!character) return null;

    // Use character's default genitalia type if not specified
    const genType = type || character.paperdoll.genitaliaType;

    if (genType === 'none') return null;

    if (genType === 'penis') {
      return `${folder}/genitalia/penis_${variant}.png`;
    } else if (genType === 'vagina') {
      return `${folder}/genitalia/vagina_${variant}.png`;
    } else if (genType === 'both') {
      // For futa, return both paths
      return {
        penis: `${folder}/genitalia/penis_${variant}.png`,
        vagina: `${folder}/genitalia/vagina_${variant}.png`,
      };
    }

    return null;
  }

  /**
   * Get face image path for a character
   * @param {string} characterId - Character ID
   * @param {string} style - Face style (default, cute, fierce, etc.)
   * @param {number} variant - Variant index
   * @returns {string} Path to face image
   */
  getFaceImage(characterId, style = null, variant = 0) {
    const folder = this.getCharacterFolder(characterId);
    if (!folder) return null;

    const character = this.getCharacter(characterId);
    if (!character) return null;

    // Use character's default face style if not specified
    const faceStyle = style || character.paperdoll.faceStyle || 'default';

    // Clamp variant to available range
    const maxVariant = (character.paperdoll.faceVariants || 1) - 1;
    const faceVariant = Math.max(0, Math.min(maxVariant, variant));

    return `${folder}/face/face_${faceStyle}_${faceVariant}.png`;
  }

  /**
   * Get all paperdoll image paths for a character's current state
   * @param {string} characterId - Character ID
   * @param {Object} state - Current state object with feminization, cupSize, etc.
   * @returns {Object} Object containing all image paths
   */
  getPaperdollImages(characterId, state = {}) {
    const {
      feminizationLevel = 0,
      cupSize = 'flat',
      genitaliaType = null,
      genitaliaVariant = 0,
      faceStyle = null,
      faceVariant = 0,
    } = state;

    return {
      base: this.getBaseBodyImage(characterId, feminizationLevel),
      chest: this.getChestImage(characterId, cupSize),
      genitalia: this.getGenitaliaImage(characterId, genitaliaType, genitaliaVariant),
      face: this.getFaceImage(characterId, faceStyle, faceVariant),
    };
  }

  /**
   * Initialize paperdoll state for a new character
   * @param {string} characterId - Character ID
   * @returns {Object} Initial paperdoll image configuration
   */
  initializePaperdoll(characterId) {
    const character = this.getCharacter(characterId);
    if (!character) return null;

    const { paperdoll } = character;

    return {
      characterId,
      folder: this.getCharacterFolder(characterId),
      feminizationLevel: paperdoll.startingBase || 0,
      cupSize: paperdoll.startingCupSize || 'flat',
      genitaliaType: paperdoll.genitaliaType || 'none',
      faceStyle: paperdoll.faceStyle || 'default',
      faceVariant: 0,

      // Get initial images
      images: this.getPaperdollImages(characterId, {
        feminizationLevel: paperdoll.startingBase || 0,
        cupSize: paperdoll.startingCupSize || 'flat',
        genitaliaType: paperdoll.genitaliaType,
        faceStyle: paperdoll.faceStyle || 'default',
        faceVariant: 0,
      }),
    };
  }

  /**
   * Get the expected folder structure for a character
   * Useful for documentation and validation
   * @param {string} characterId - Character ID
   * @returns {Object} Expected folder structure
   */
  getExpectedFolderStructure(characterId) {
    const character = this.getCharacter(characterId);
    if (!character) return null;

    const folder = character.paperdollFolder || characterId;
    const { paperdoll } = character;

    const structure = {
      root: `public/images/characters/${folder}/`,
      base: {
        path: `public/images/characters/${folder}/base/`,
        files: [],
      },
      chest: {
        path: `public/images/characters/${folder}/chest/`,
        files: [],
      },
      genitalia: {
        path: `public/images/characters/${folder}/genitalia/`,
        files: [],
      },
      face: {
        path: `public/images/characters/${folder}/face/`,
        files: [],
      },
    };

    // Base images (masc_0 to masc_10, fem_1 to fem_10)
    for (let i = 0; i <= 10; i++) {
      structure.base.files.push(`masc_${i}.png`);
    }
    for (let i = 1; i <= 10; i++) {
      structure.base.files.push(`fem_${i}.png`);
    }

    // Chest images based on max cup size
    if (paperdoll.hasBreasts) {
      const maxIndex = CUP_SIZE_ORDER.indexOf(paperdoll.maxCupSize);
      for (let i = 0; i <= maxIndex && i < CUP_SIZE_ORDER.length; i++) {
        structure.chest.files.push(`chest_${CUP_SIZE_ORDER[i]}.png`);
      }
    }

    // Genitalia images
    if (paperdoll.genitaliaType === 'penis' || paperdoll.genitaliaType === 'both') {
      structure.genitalia.files.push('penis_0.png');
    }
    if (paperdoll.genitaliaType === 'vagina' || paperdoll.genitaliaType === 'both') {
      structure.genitalia.files.push('vagina_0.png');
    }

    // Face images
    const faceVariants = paperdoll.faceVariants || 1;
    for (let i = 0; i < faceVariants; i++) {
      structure.face.files.push(`face_${paperdoll.faceStyle || 'default'}_${i}.png`);
    }

    return structure;
  }

  /**
   * Validate that a character has all required images
   * (This would typically be used in development/content creation)
   * @param {string} characterId - Character ID
   * @returns {Object} Validation result with missing files
   */
  validateCharacterImages(characterId) {
    const structure = this.getExpectedFolderStructure(characterId);
    if (!structure) {
      return { valid: false, error: 'Character not found' };
    }

    // In a real implementation, this would check if files exist
    // For now, just return the expected structure
    return {
      valid: true,
      expectedStructure: structure,
      note: 'Image validation requires server-side file checking',
    };
  }
}

export default CharacterSystem;
