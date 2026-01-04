/**
 * NSFW RPG Engine v2 - Main Export
 * 
 * Import all systems:
 *   import { DataRegistry, EffectSystem, SceneRunner, CombatSystem, SaveSystem, InventorySystem, SubstanceSystem, EncounterSystem } from './engine';
 * 
 * Or import individually:
 *   import DataRegistry from './engine/DataRegistry';
 */

// Core Systems
export { DataRegistry, getRegistry, initRegistry } from './DataRegistry.js';
export { EffectSystem, TRIGGERS, STACK_BEHAVIOR, DURATION_TYPE, MOD_OPERATION } from './EffectSystem.js';
export { SceneRunner, NODE_TYPES } from './SceneRunner.js';
export { CombatSystem, COMBAT_ACTIONS, COMBAT_PHASE, DAMAGE_TYPES } from './CombatSystem.js';
export { SaveSystem } from './SaveSystem.js';
export { InventorySystem, EQUIPMENT_SLOTS, ITEM_CATEGORIES, RARITY, RARITY_COLORS } from './InventorySystem.js';
export { PaperdollSystem, PaperdollState, BODY_REGIONS, ITEM_LAYER_MAPPING } from './PaperdollSystem.js';
export { 
  SubstanceSystem, 
  DELIVERY_METHOD, 
  SUBSTANCE_CATEGORY, 
  ADDICTION_STAGE, 
  RESISTANCE_SOURCE,
  defaultSubstanceState 
} from './SubstanceSystem.js';
export { 
  EncounterSystem, 
  ENCOUNTER_TYPE, 
  PLAYER_STATE,
  statusEncounterModifiers,
  defaultEncounterConfig 
} from './EncounterSystem.js';
export { 
  comprehensivePlayerState, 
  exampleSceneConditions 
} from './PlayerStateSchema.js';

// Convenience function to initialize all systems
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
  
  // Initialize registry
  const registry = new DataRegistry(manifestUrl, {
    useIndexedDB: options.useIndexedDB !== false,
    cacheSize: options.cacheSize || 2000
  });
  await registry.init();
  
  // Game time provider
  const gameTimeProvider = options.gameTimeProvider || (() => Date.now());
  
  // Initialize systems
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
  
  return {
    registry,
    effectSystem,
    sceneRunner,
    combatSystem,
    saveSystem,
    inventorySystem,
    paperdollSystem,
    substanceSystem,
    encounterSystem
  };
}

// Default export
export default {
  initGameEngine
};
