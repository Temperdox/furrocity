/**
 * Furrocity Engine v2 - Main Export
 *
 * Import all systems:
 *   import { DataRegistry, EffectSystem, SceneRunner, CombatSystem, SaveSystem } from './engine';
 *
 * Or import individually:
 *   import DataRegistry from './engine/DataRegistry';
 *
 * @module engine
 */

// =============================================================================
// CORE SYSTEMS
// =============================================================================

export { DataRegistry, getRegistry, initRegistry } from './DataRegistry.js';
export { DataPackManager, CONTENT_TYPES } from './DataPackManager.js';
export { EffectSystem, TRIGGERS, STACK_BEHAVIOR, DURATION_TYPE, MOD_OPERATION } from './EffectSystem.js';
export { SceneRunner, NODE_TYPES, INPUT_TYPES } from './SceneRunner.js';
export { CombatSystem, COMBAT_ACTIONS, COMBAT_PHASE, DAMAGE_TYPES } from './CombatSystem.js';
export { SaveSystem } from './SaveSystem.js';

// =============================================================================
// INVENTORY & ITEMS
// =============================================================================

export { InventorySystem, EQUIPMENT_SLOTS, ITEM_CATEGORIES, RARITY, RARITY_COLORS } from './InventorySystem.js';
export { PaperdollSystem, PaperdollState, BODY_REGIONS, ITEM_LAYER_MAPPING } from './PaperdollSystem.js';
export { MerchantSystem } from './MerchantSystem.js';
export { LootTableSystem } from './LootTableSystem.js';

// =============================================================================
// LOCATION SYSTEMS
// =============================================================================

export { LocationSystem } from './LocationSystem.js';
export { UnlockSystem } from './UnlockSystem.js';
export { LocationServices } from './LocationServices.js';
export { LocationDiscoverySystem } from './LocationDiscoverySystem.js';
export { LocationBarringSystem } from './LocationBarringSystem.js';

// =============================================================================
// TRAVEL & TIME SYSTEMS
// =============================================================================

export { ExpeditionSystem } from './ExpeditionSystem.js';
export { TimeSystem, DEFAULT_TIME_COSTS, TIME_PERIODS } from './TimeSystem.js';

// =============================================================================
// LODGING & ACTION REQUIREMENTS
// =============================================================================

export { LodgingSystem } from './LodgingSystem.js';
export { ActionRequirementSystem } from './ActionRequirementSystem.js';
export { InputValidationSystem } from './InputValidationSystem.js';

// =============================================================================
// REPUTATION & SOCIAL SYSTEMS
// =============================================================================

export { FameSystem } from './FameSystem.js';
export { ReputationSystem } from './ReputationSystem.js';
export { RumorSystem } from './RumorSystem.js';
export { PublicEventSystem } from './PublicEventSystem.js';

// =============================================================================
// ENCOUNTER & COMBAT SUPPORT
// =============================================================================

export {
  EncounterSystem,
  ENCOUNTER_TYPE,
  PLAYER_STATE,
  statusEncounterModifiers,
  defaultEncounterConfig
} from './EncounterSystem.js';
export { EncounterTableSystem } from './EncounterTableSystem.js';
export { CombatOutcomeHandler } from './CombatOutcomeHandler.js';
export { SceneSelector } from './SceneSelector.js';
export { ConditionEvaluator } from './ConditionEvaluator.js';

// =============================================================================
// SUBSTANCE & EFFECT SYSTEMS
// =============================================================================

export {
  SubstanceSystem,
  DELIVERY_METHOD,
  SUBSTANCE_CATEGORY,
  ADDICTION_STAGE,
  RESISTANCE_SOURCE,
  defaultSubstanceState
} from './SubstanceSystem.js';

// =============================================================================
// PLAYER STATE
// =============================================================================

export {
  comprehensivePlayerState,
  exampleSceneConditions
} from './PlayerStateSchema.js';

// =============================================================================
// UTILITIES
// =============================================================================

export {
  evaluateCondition,
  evaluateConditions,
  evaluateAnyCondition,
  getConditionDescription,
  CONDITION_TYPES
} from './utils/ConditionEvaluator.js';

export {
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
  ensureLocalReputation
} from './utils/StateInitializer.js';

export {
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
} from './utils/TextInterpolator.js';

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize all game engine systems
 * @param {string} manifestUrl - URL to the manifest file
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Object containing all initialized systems
 */
export async function initGameEngine(manifestUrl, options = {}) {
  const { DataRegistry } = await import('./DataRegistry.js');
  const { EffectSystem } = await import('./EffectSystem.js');
  const { SceneRunner } = await import('./SceneRunner.js');
  const { CombatSystem } = await import('./CombatSystem.js');
  const { SaveSystem } = await import('./SaveSystem.js');
  const { InventorySystem } = await import('./InventorySystem.js');
  const { PaperdollSystem } = await import('./PaperdollSystem.js');
  const { SubstanceSystem } = await import('./SubstanceSystem.js');
  const { EncounterSystem } = await import('./EncounterSystem.js');
  const { FameSystem } = await import('./FameSystem.js');
  const { ReputationSystem } = await import('./ReputationSystem.js');
  const { RumorSystem } = await import('./RumorSystem.js');
  const { LocationServices } = await import('./LocationServices.js');
  const { LocationDiscoverySystem } = await import('./LocationDiscoverySystem.js');
  const { LocationBarringSystem } = await import('./LocationBarringSystem.js');
  const { PublicEventSystem } = await import('./PublicEventSystem.js');
  const { MerchantSystem } = await import('./MerchantSystem.js');

  // Initialize registry
  const registry = new DataRegistry(manifestUrl, {
    useIndexedDB: options.useIndexedDB !== false,
    cacheSize: options.cacheSize || 2000
  });
  await registry.init();

  // Game time provider (for turn-based time tracking)
  const gameTimeProvider = options.gameTimeProvider || (() => ({
    currentTurn: 0,
    currentDay: 0,
    currentHour: 12,
    timestamp: Date.now()
  }));

  // Initialize core systems
  const effectSystem = new EffectSystem(registry);

  const sceneRunner = new SceneRunner(registry, {
    enabledTags: options.enabledTags || [],
    disabledTags: options.disabledTags || [],
    callbacks: options.sceneCallbacks || {}
  });

  const combatSystem = new CombatSystem(registry, effectSystem, {
    callbacks: options.combatCallbacks || {}
  });

  const saveSystem = new SaveSystem({
    useIndexedDB: options.useIndexedDB !== false,
    useCompression: options.useCompression !== false,
    callbacks: options.saveCallbacks || {}
  });
  await saveSystem.init();

  const inventorySystem = new InventorySystem(registry, effectSystem, {
    maxInventorySize: options.maxInventorySize || 100,
    callbacks: options.inventoryCallbacks || {}
  });

  const paperdollSystem = new PaperdollSystem(registry, {
    imageBasePath: options.paperdollImageBasePath || '/images/paperdoll',
    callbacks: options.paperdollCallbacks || {}
  });

  const substanceSystem = new SubstanceSystem(registry, effectSystem, {
    gameTimeProvider,
    safeLocations: options.safeLocations || [],
    callbacks: options.substanceCallbacks || {}
  });

  const encounterSystem = new EncounterSystem(registry, {
    gameTimeProvider,
    config: options.encounterConfig || {},
    callbacks: options.encounterCallbacks || {}
  });

  // Initialize reputation and fame systems
  const fameSystem = new FameSystem(registry);
  const reputationSystem = new ReputationSystem(fameSystem);
  const rumorSystem = new RumorSystem(reputationSystem);

  // Initialize location systems
  const locationServices = new LocationServices();
  const discoverySystem = new LocationDiscoverySystem();
  const barringSystem = new LocationBarringSystem();
  const publicEventSystem = new PublicEventSystem(
    reputationSystem,
    rumorSystem,
    discoverySystem
  );

  // Initialize merchant system
  const merchantSystem = new MerchantSystem(registry, inventorySystem, {
    callbacks: options.merchantCallbacks || {}
  });

  return {
    // Core
    registry,
    effectSystem,
    sceneRunner,
    combatSystem,
    saveSystem,

    // Inventory
    inventorySystem,
    paperdollSystem,
    merchantSystem,

    // Location
    locationServices,
    discoverySystem,
    barringSystem,
    publicEventSystem,

    // Reputation
    fameSystem,
    reputationSystem,
    rumorSystem,

    // Encounters & Substances
    substanceSystem,
    encounterSystem
  };
}

// Default export
export default {
  initGameEngine
};
