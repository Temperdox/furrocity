// ============================================================================
// FURROCITY ENGINE CONFIGURATION
// ============================================================================
// Edit this file to customize your game settings.
// Changes take effect on next page refresh (or hot reload in dev mode).
// ============================================================================

const GameConfig = {
  // ==========================================================================
  // GAME INFO
  // ==========================================================================
  game: {
    title: "FURROCITY",
    subtitle: "Unleash your inner beast or have it be tamed...",
    version: "0.5.0",
    engineName: "Furrocity Engine",
    
    // Copyright info (displayed in footer)
    copyright: {
      year: 2025,
      holders: "Cotton Le Sergal & Shluggo",
      allRightsReserved: true
    }
  },

  // ==========================================================================
  // DEBUG & DEVELOPMENT
  // ==========================================================================
  debug: {
    enabled: false,              // Master debug toggle
    showFPS: false,              // Show frames per second counter
    showStateInspector: false,   // Show player state inspector panel
    logSceneTransitions: false,  // Log scene changes to console
    logCombatActions: false,     // Log combat calculations
    logSaveOperations: false,    // Log save/load operations
    logSubstanceEffects: false,  // Log drug/substance calculations
    logEncounterRolls: false,    // Log encounter chance calculations
    skipAgeVerification: false,  // Skip 18+ gate (DEV ONLY!)
    unlockAllContent: false,     // Unlock all scenes regardless of tags
    godMode: false,              // Invincibility in combat
    infiniteGold: false,         // Unlimited gold
    maxStats: false,             // All stats at maximum
    quickSave: true,             // Enable F5/F9 quicksave/load
  },

  // ==========================================================================
  // DISPLAY SETTINGS (Defaults - player can override in settings)
  // ==========================================================================
  display: {
    theme: "dark",               // "dark", "light", "oled"
    accentColor: "#ff2d95",      // Primary accent color (pink)
    secondaryColor: "#d63384",   // Secondary accent
    fontSize: "medium",          // "small", "medium", "large"
    animations: true,            // Enable UI animations
    reducedMotion: false,        // Reduce animations for accessibility
    showTooltips: true,          // Show hover tooltips
    compactUI: false,            // More compact interface
  },

  // ==========================================================================
  // GAMEPLAY SETTINGS (Defaults - player can override)
  // ==========================================================================
  gameplay: {
    defaultDifficulty: "normal", // "easy", "normal", "hard", "nightmare"
    autoSaveInterval: 300000,    // Auto-save every 5 minutes (ms), 0 to disable
    autoSaveOnTravel: true,      // Auto-save when changing locations
    maxSaveSlots: 20,            // Maximum manual save slots
    enablePermadeath: false,     // Enable permadeath mode option
    showDamageNumbers: true,     // Show floating damage numbers in combat
    combatSpeed: "normal",       // "slow", "normal", "fast", "instant"
    textSpeed: "instant",        // "slow", "normal", "fast", "instant"
    skipReadScenes: false,       // Allow skipping previously seen scenes
  },

  // ==========================================================================
  // CONTENT SETTINGS (Defaults - player can override in settings)
  // ==========================================================================
  content: {
    // Default enabled content tags
    defaultEnabledTags: [
      "vanilla",
      "clothing_damage",
      "restraint_escape"
    ],
    
    // Tags that are always available (can't be disabled)
    alwaysEnabledTags: [
      "vanilla"
    ],
    
    // Tags hidden from settings (internal use)
    hiddenTags: [],
    
    // Content warnings
    showContentWarnings: true,   // Show warnings before intense scenes
    warningTags: [               // Tags that trigger warnings
      "non_con",
      "gore",
      "death",
      "abuse"
    ]
  },

  // ==========================================================================
  // AUDIO SETTINGS (Defaults)
  // ==========================================================================
  audio: {
    masterVolume: 0.8,
    musicVolume: 0.6,
    sfxVolume: 0.8,
    ambientVolume: 0.5,
    voiceVolume: 1.0,
    muteWhenUnfocused: true
  },

  // ==========================================================================
  // SUBSTANCE SYSTEM
  // ==========================================================================
  substances: {
    enabled: true,                // Enable drug/substance system
    addictionEnabled: true,       // Enable addiction mechanics
    overdoseEnabled: true,        // Enable overdose mechanics
    withdrawalEnabled: true,      // Enable withdrawal effects
    toleranceDecayRate: 1.0,      // Multiplier for tolerance decay (1.0 = normal)
    addictionGainRate: 1.0,       // Multiplier for addiction gain (1.0 = normal)
  },

  // ==========================================================================
  // ENCOUNTER SYSTEM
  // ==========================================================================
  encounters: {
    enabled: true,                // Enable random encounters
    baseChanceMultiplier: 1.0,    // Global encounter chance multiplier
    passedOutEncounters: true,    // Enable encounters when unconscious
    safeZoneProtection: true,     // Safe zones prevent all encounters
    nightDangerMultiplier: 1.3,   // Night time danger increase
  },

  // ==========================================================================
  // PAPERDOLL / VISUAL SYSTEM
  // ==========================================================================
  paperdoll: {
    enabled: true,                // Enable paperdoll character display
    showNudity: true,             // Show nude base layer when clothing removed
    clothingDamage: true,         // Enable clothing damage visuals
    fluidEffects: true,           // Show fluid overlay effects
    blushEffects: true,           // Show arousal blush effects
  },

  // ==========================================================================
  // PERFORMANCE
  // ==========================================================================
  performance: {
    lazyLoadContent: true,        // Lazy load game content
    useIndexedDB: true,           // Cache content in IndexedDB
    cacheSize: 2000,              // Max cached content items
    preloadNearbyAreas: true,     // Preload connected location content
    reducedParticles: false,      // Reduce particle effects
  },

  // ==========================================================================
  // KEYBINDINGS (Defaults - player can customize)
  // ==========================================================================
  keybindings: {
    quickSave: "F5",
    quickLoad: "F9",
    toggleDebug: "F12",
    openInventory: "i",
    openMap: "m",
    openJournal: "j",
    openSettings: "Escape",
    confirm: "Enter",
    cancel: "Escape",
    skip: "Space"
  },

  // ==========================================================================
  // PATHS (Don't change unless you restructure the project)
  // ==========================================================================
  paths: {
    content: "/content",
    images: "/images",
    audio: "/audio",
    saves: "furrocity_saves"     // localStorage key prefix
  }
};

// ==========================================================================
// COMPUTED VALUES (Don't edit below this line)
// ==========================================================================

// Full version string
GameConfig.versionString = `Version ${GameConfig.game.version} • ${GameConfig.game.engineName}`;

// Full copyright string
GameConfig.copyrightString = `© ${GameConfig.game.copyright.year} ${GameConfig.game.copyright.holders}.${GameConfig.game.copyright.allRightsReserved ? ' All rights reserved.' : ''}`;

// Debug helper - logs only if debug enabled
GameConfig.debugLog = (category, ...args) => {
  if (!GameConfig.debug.enabled) return;
  
  const categoryMap = {
    scene: 'logSceneTransitions',
    combat: 'logCombatActions',
    save: 'logSaveOperations',
    substance: 'logSubstanceEffects',
    encounter: 'logEncounterRolls'
  };
  
  if (categoryMap[category] && !GameConfig.debug[categoryMap[category]]) return;
  
  console.log(`[${category.toUpperCase()}]`, ...args);
};

// Freeze config in production to prevent tampering
if (process.env.NODE_ENV === 'production' && !GameConfig.debug.enabled) {
  Object.freeze(GameConfig);
  Object.freeze(GameConfig.game);
  Object.freeze(GameConfig.debug);
  Object.freeze(GameConfig.display);
  Object.freeze(GameConfig.gameplay);
  Object.freeze(GameConfig.content);
  Object.freeze(GameConfig.audio);
  Object.freeze(GameConfig.substances);
  Object.freeze(GameConfig.encounters);
  Object.freeze(GameConfig.paperdoll);
  Object.freeze(GameConfig.performance);
  Object.freeze(GameConfig.keybindings);
  Object.freeze(GameConfig.paths);
}

export default GameConfig;
