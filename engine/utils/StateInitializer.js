/**
 * StateInitializer - Utilities for ensuring player state fields exist
 *
 * Replaces repetitive initialization patterns across systems:
 * - ReputationSystem
 * - RumorSystem
 * - FameSystem
 * - SubstanceSystem
 * - LocationBarringSystem
 *
 * @module engine/utils/StateInitializer
 */

/**
 * Ensure a nested path exists in an object, creating empty objects/arrays as needed
 * @param {Object} obj - Object to modify
 * @param {string} path - Dot-notation path (e.g., 'nsfwStats.pregnancy')
 * @param {*} defaultValue - Default value if path doesn't exist (default: {})
 * @returns {*} The value at the path
 */
export function ensurePath(obj, path, defaultValue = {}) {
  if (!obj || !path) return defaultValue;

  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (current[key] === undefined || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }

  const lastKey = parts[parts.length - 1];
  if (current[lastKey] === undefined || current[lastKey] === null) {
    current[lastKey] = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
  }

  return current[lastKey];
}

/**
 * Get a value at a nested path, returning defaultValue if not found
 * @param {Object} obj - Object to read from
 * @param {string} path - Dot-notation path
 * @param {*} defaultValue - Default value if path doesn't exist
 * @returns {*} The value at the path or defaultValue
 */
export function getPath(obj, path, defaultValue = undefined) {
  if (!obj || !path) return defaultValue;

  const parts = path.split('.');
  let current = obj;

  for (const key of parts) {
    if (current === undefined || current === null) {
      return defaultValue;
    }
    current = current[key];
  }

  return current !== undefined ? current : defaultValue;
}

/**
 * Set a value at a nested path, creating intermediate objects as needed
 * @param {Object} obj - Object to modify
 * @param {string} path - Dot-notation path
 * @param {*} value - Value to set
 * @returns {Object} The modified object
 */
export function setPath(obj, path, value) {
  if (!obj || !path) return obj;

  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (current[key] === undefined || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }

  current[parts[parts.length - 1]] = value;
  return obj;
}

/**
 * Default player state structure for reputation system
 */
export const DEFAULT_REPUTATION_STATE = {
  localReputation: {},
  rumors: [],
  rumorCooldowns: {}
};

/**
 * Default player state structure for fame system
 */
export const DEFAULT_FAME_STATE = {
  fame: {
    value: 0,
    heroicDeeds: 0,
    villainousDeeds: 0,
    fameHistory: []
  },
  titles: {
    active: null,
    unlocked: [],
    equipped: null
  },
  infamy: {
    slut: 0,
    criminal: 0,
    corrupted: 0
  }
};

/**
 * Default player state structure for substance system
 */
export const DEFAULT_SUBSTANCE_STATE = {
  substanceState: {
    activeSubstances: [],
    addictions: {},
    resistances: {},
    substanceHistory: []
  }
};

/**
 * Default player state structure for location systems
 */
export const DEFAULT_LOCATION_STATE = {
  currentLocation: null,
  currentRegion: null,
  visitedLocations: [],
  visitedRegions: [],
  unlockedLocations: [],
  unlockedRegions: [],
  discoveredLocations: [],
  revealedTags: {},
  locationInteractions: {},
  locationBans: {},
  locationOffenses: {},
  discoveryProgress: {}
};

/**
 * Default player state structure for NSFW systems
 */
export const DEFAULT_NSFW_STATE = {
  nsfwStats: {
    arousal: 0,
    lewdness: 0,
    corruption: 0,
    purity: 100,
    fertility: 100,
    sensitivity: 50,
    curses: [],
    debuffs: [],
    stds: {},
    behavioralAddictions: {},
    mentalState: {
      hypnosisDepth: 0,
      hypnosisSource: null,
      hypnosisDevice: null,
      conditioning: []
    },
    pregnancy: {
      isPregnant: false,
      type: null,
      trimester: 0,
      fetusCount: 0,
      eggCount: 0,
      complications: []
    }
  }
};

/**
 * Ensure player has required fields for reputation system
 * @param {Object} playerState - Player state object
 * @returns {Object} Player state with reputation fields
 */
export function ensureReputationState(playerState) {
  if (!playerState) return playerState;

  ensurePath(playerState, 'localReputation', {});
  ensurePath(playerState, 'rumors', []);
  ensurePath(playerState, 'rumorCooldowns', {});

  return playerState;
}

/**
 * Ensure player has required fields for fame system
 * @param {Object} playerState - Player state object
 * @returns {Object} Player state with fame fields
 */
export function ensureFameState(playerState) {
  if (!playerState) return playerState;

  ensurePath(playerState, 'fame', { value: 0, heroicDeeds: 0, villainousDeeds: 0, fameHistory: [] });
  ensurePath(playerState, 'titles', { active: null, unlocked: [], equipped: null });
  ensurePath(playerState, 'infamy', { slut: 0, criminal: 0, corrupted: 0 });

  return playerState;
}

/**
 * Ensure player has required fields for substance system
 * @param {Object} playerState - Player state object
 * @returns {Object} Player state with substance fields
 */
export function ensureSubstanceState(playerState) {
  if (!playerState) return playerState;

  ensurePath(playerState, 'substanceState', {
    activeSubstances: [],
    addictions: {},
    resistances: {},
    substanceHistory: []
  });

  // Ensure nested arrays exist
  ensurePath(playerState, 'substanceState.activeSubstances', []);
  ensurePath(playerState, 'substanceState.addictions', {});
  ensurePath(playerState, 'substanceState.resistances', {});

  return playerState;
}

/**
 * Ensure player has required fields for location systems
 * @param {Object} playerState - Player state object
 * @returns {Object} Player state with location fields
 */
export function ensureLocationState(playerState) {
  if (!playerState) return playerState;

  ensurePath(playerState, 'visitedLocations', []);
  ensurePath(playerState, 'visitedRegions', []);
  ensurePath(playerState, 'unlockedLocations', []);
  ensurePath(playerState, 'unlockedRegions', []);
  ensurePath(playerState, 'discoveredLocations', []);
  ensurePath(playerState, 'revealedTags', {});
  ensurePath(playerState, 'locationInteractions', {});
  ensurePath(playerState, 'locationBans', {});
  ensurePath(playerState, 'locationOffenses', {});
  ensurePath(playerState, 'discoveryProgress', {});

  return playerState;
}

/**
 * Ensure player has required fields for NSFW systems
 * @param {Object} playerState - Player state object
 * @returns {Object} Player state with NSFW fields
 */
export function ensureNsfwState(playerState) {
  if (!playerState) return playerState;

  ensurePath(playerState, 'nsfwStats', {});
  ensurePath(playerState, 'nsfwStats.arousal', 0);
  ensurePath(playerState, 'nsfwStats.lewdness', 0);
  ensurePath(playerState, 'nsfwStats.corruption', 0);
  ensurePath(playerState, 'nsfwStats.curses', []);
  ensurePath(playerState, 'nsfwStats.debuffs', []);
  ensurePath(playerState, 'nsfwStats.stds', {});
  ensurePath(playerState, 'nsfwStats.mentalState', {
    hypnosisDepth: 0,
    hypnosisSource: null,
    conditioning: []
  });
  ensurePath(playerState, 'nsfwStats.pregnancy', {
    isPregnant: false,
    type: null,
    trimester: 0
  });

  return playerState;
}

/**
 * Ensure player has all required fields for all systems
 * @param {Object} playerState - Player state object
 * @returns {Object} Fully initialized player state
 */
export function ensureFullPlayerState(playerState) {
  if (!playerState) return playerState;

  ensureReputationState(playerState);
  ensureFameState(playerState);
  ensureSubstanceState(playerState);
  ensureLocationState(playerState);
  ensureNsfwState(playerState);

  // Core fields
  ensurePath(playerState, 'inventory', []);
  ensurePath(playerState, 'equipment', {});
  ensurePath(playerState, 'activeEffects', []);
  ensurePath(playerState, 'flags', {});
  ensurePath(playerState, 'relationships', {});
  ensurePath(playerState, 'completedQuests', []);
  ensurePath(playerState, 'activeQuests', []);

  return playerState;
}

/**
 * Ensure a specific location's interaction tracking exists
 * @param {Object} playerState - Player state object
 * @param {string} locationId - Location ID to initialize
 * @returns {Object} The location's interaction object
 */
export function ensureLocationInteractions(playerState, locationId) {
  ensurePath(playerState, 'locationInteractions', {});

  if (!playerState.locationInteractions[locationId]) {
    playerState.locationInteractions[locationId] = {
      visits: 0,
      sleeps: 0,
      searches: 0,
      investigations: 0,
      prayers: 0,
      nsfwEvents: 0,
      lastInteraction: null
    };
  }

  return playerState.locationInteractions[locationId];
}

/**
 * Ensure a specific location's reputation tracking exists
 * @param {Object} playerState - Player state object
 * @param {string} locationId - Location ID to initialize
 * @returns {Object} The location's reputation object
 */
export function ensureLocalReputation(playerState, locationId) {
  ensurePath(playerState, 'localReputation', {});

  if (!playerState.localReputation[locationId]) {
    playerState.localReputation[locationId] = {
      fame: 0,
      infamy: { slut: 0, criminal: 0, corrupted: 0 },
      visitCount: 0,
      lastVisit: null,
      knownBy: []
    };
  }

  return playerState.localReputation[locationId];
}

export default {
  ensurePath,
  getPath,
  setPath,
  ensureReputationState,
  ensureFameState,
  ensureSubstanceState,
  ensureLocationState,
  ensureNsfwState,
  ensureFullPlayerState,
  ensureLocationInteractions,
  ensureLocalReputation,
  DEFAULT_REPUTATION_STATE,
  DEFAULT_FAME_STATE,
  DEFAULT_SUBSTANCE_STATE,
  DEFAULT_LOCATION_STATE,
  DEFAULT_NSFW_STATE
};
