/**
 * GameDataLoader - Loads game content from datapacks for use in the game engine
 *
 * This module provides a way to load game content (enemies, locations, items, loot tables, etc.)
 * from datapack JSON files instead of having hardcoded data in Game.jsx.
 *
 * Usage in Game.jsx:
 *   import { gameDataLoader } from './engine/GameDataLoader';
 *
 *   // In your component initialization:
 *   const [datapackContent, setDatapackContent] = useState(null);
 *   useEffect(() => {
 *     gameDataLoader.loadAll().then(content => {
 *       setDatapackContent(content);
 *     });
 *   }, []);
 *
 *   // Use datapackContent.enemies, datapackContent.locations, etc.
 */

const DATAPACK_BASE_PATH = '/datapacks';

/**
 * Load a JSON file from the datapacks directory
 */
async function loadJson(path) {
  try {
    const response = await fetch(`${DATAPACK_BASE_PATH}/${path}`);
    if (!response.ok) {
      console.warn(`[GameDataLoader] Failed to load ${path}: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn(`[GameDataLoader] Error loading ${path}:`, error.message);
    return null;
  }
}

/**
 * Load all JSON files from a directory based on known file patterns
 */
async function loadDirectory(packId, contentPath) {
  const results = [];

  // Known file patterns for each content type
  const knownFiles = {
    items: ['weapons_armor.json', 'clothing_paperdoll.json', 'consumables.json', 'materials.json'],
    enemies: ['forest_enemies.json', 'dungeon_enemies.json', 'demon_enemies.json', 'town_enemies.json'],
    locations: ['world_locations.json', 'regions.json', 'dungeons.json'],
    effects: ['core_effects.json', 'buffs.json', 'debuffs.json', 'curses.json'],
    scenes: ['intro_scenes.json', 'combat_scenes.json', 'quest_scenes.json', 'inn_rental_scenes.json', 'enemy_scene_mapping.json'],
    merchants: ['merchants.json', 'shop_inventories.json'],
    characters: ['playable_characters.json'],
    substances: ['core_substances.json'],
    loot_tables: ['forest_loot.json', 'global_loot.json', 'town_loot.json', 'dungeon_loot.json'],
    encounter_tables: ['game_enemy_tables.json', 'forest_encounters.json', 'town_encounters.json', 'dungeon_encounters.json'],
  };

  const filesToTry = knownFiles[contentPath] || [];

  for (const filename of filesToTry) {
    const data = await loadJson(`${packId}/${contentPath}/${filename}`);
    if (data) {
      // Handle both array and object formats
      if (Array.isArray(data)) {
        results.push(...data);
      } else if (data.entries && Array.isArray(data.entries)) {
        // Handle wrapped format like loot tables
        results.push(...data.entries);
      } else if (data.characters && Array.isArray(data.characters)) {
        // Handle characters wrapper format
        results.push(...data.characters);
      } else if (data.items && Array.isArray(data.items)) {
        // Handle items wrapper format
        results.push(...data.items);
      } else if (data.enemies && Array.isArray(data.enemies)) {
        // Handle enemies wrapper format
        results.push(...data.enemies);
      } else if (data.locations && Array.isArray(data.locations)) {
        // Handle locations wrapper format
        results.push(...data.locations);
      } else if (data.scenes && Array.isArray(data.scenes)) {
        // Handle scenes wrapper format
        results.push(...data.scenes);
      } else if (typeof data === 'object') {
        // If it's an object with named entries, convert to array
        const entries = Object.entries(data);
        if (entries.length > 0 && typeof entries[0][1] === 'object') {
          results.push(...entries.map(([key, value]) => ({ ...value, id: value.id || key })));
        }
      }
    }
  }

  return results;
}

/**
 * Convert datapack enemy format to game engine format
 */
function convertEnemy(datapackEnemy) {
  // Generate a loot table ID for this enemy if it has inline loot
  const lootTableId = datapackEnemy.lootTable || (datapackEnemy.loot ? `${datapackEnemy.id}_loot` : null);

  return {
    id: datapackEnemy.id,
    name: datapackEnemy.name,
    description: datapackEnemy.description,
    baseStats: {
      hp: datapackEnemy.hp || datapackEnemy.maxHp || 50,
      attack: datapackEnemy.stats?.strength || 10,
      defense: datapackEnemy.stats?.vitality || 5,
      speed: datapackEnemy.stats?.speed || 8,
      level: datapackEnemy.level || datapackEnemy.tier || 1
    },
    tags: datapackEnemy.tags || [],
    lootTable: lootTableId,
    // Store inline loot to be converted to loot table later
    _inlineLoot: datapackEnemy.loot || null,
    abilities: datapackEnemy.skills || [],
    grappleChance: datapackEnemy.canRestrain ? (datapackEnemy.restraintHp ? 35 : 25) : 0,
    restraintType: datapackEnemy.restraintType || 'hold',
    restraintHp: datapackEnemy.restraintHp,
    nsfwActions: datapackEnemy.nsfwActions || [],
    nsfwActionData: datapackEnemy.nsfwActionData || {},
    ai: datapackEnemy.ai || {},
    experience: datapackEnemy.experience || 10,
    // Preserve additional fields
    type: datapackEnemy.type,
    tier: datapackEnemy.tier,
    locations: datapackEnemy.locations,
    icon: datapackEnemy.icon,
    damageType: datapackEnemy.damageType,
    resistances: datapackEnemy.resistances,
    weaknesses: datapackEnemy.weaknesses,
    dialogue: datapackEnemy.dialogue,
    bossConfig: datapackEnemy.bossConfig
  };
}

/**
 * Convert inline enemy loot to loot table format
 */
function convertInlineLootToTable(enemyId, inlineLoot) {
  if (!inlineLoot || !Array.isArray(inlineLoot)) return null;

  return inlineLoot.map(entry => ({
    itemId: entry.itemId,
    dropChance: (entry.chance || 0.5) * 100, // Convert 0-1 to percentage
    minCount: entry.min || 1,
    maxCount: entry.max || entry.count || 1
  }));
}

/**
 * Convert datapack loot table format to game engine format
 */
function convertLootTable(datapackTable) {
  // The datapack format is more complex - simplify for game engine
  const entries = (datapackTable.entries || []).map(entry => {
    if (entry.type === 'item') {
      return {
        itemId: entry.itemId,
        dropChance: (entry.weight || 50) * 2, // Convert weight to percentage
        minCount: entry.count?.min || 1,
        maxCount: entry.count?.max || 1
      };
    }
    return null;
  }).filter(Boolean);

  return {
    id: datapackTable.id,
    name: datapackTable.name,
    entries
  };
}

/**
 * Convert datapack item format to game engine format
 */
function convertItem(datapackItem) {
  return {
    id: datapackItem.id,
    baseName: datapackItem.name || datapackItem.baseName,
    type: datapackItem.type || 'misc',
    slot: datapackItem.slot || datapackItem.equipSlot,
    baseStats: datapackItem.baseStats || datapackItem.stats || {},
    tags: datapackItem.tags || [],
    stackable: datapackItem.stackable || false,
    value: datapackItem.value || datapackItem.basePrice || 1,
    // Preserve paperdoll data
    paperdollType: datapackItem.paperdollType,
    paperdollImages: datapackItem.paperdollImages,
    clothingLevel: datapackItem.clothingLevel,
    clothingState: datapackItem.clothingState
  };
}

/**
 * Main game data loader class
 */
class GameDataLoader {
  constructor() {
    this.cache = null;
    this.loaded = false;
    this.loading = false;
  }

  /**
   * Load all game data from datapacks
   */
  async loadAll() {
    if (this.loaded) {
      return this.cache;
    }

    if (this.loading) {
      // Wait for existing load to complete
      while (this.loading) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return this.cache;
    }

    this.loading = true;
    console.log('[GameDataLoader] Loading game data from datapacks...');

    try {
      // Load pack index to find available packs
      const packIndex = await loadJson('index.json');
      const packIds = packIndex?.packs || ['core'];

      // Initialize cache
      this.cache = {
        enemies: {},
        lootTables: {},
        baseItems: {},
        locations: [],
        encounterTables: {},
        characters: [],
        scenes: {},
        effects: []
      };

      // Load content from each pack
      for (const packId of packIds) {
        // Load enemies first (they may define inline loot tables)
        const enemies = await loadDirectory(packId, 'enemies');
        for (const enemy of enemies) {
          const converted = convertEnemy(enemy);
          this.cache.enemies[converted.id] = converted;

          // Create loot table from inline loot if present
          if (converted._inlineLoot) {
            const lootTableId = `${converted.id}_loot`;
            this.cache.lootTables[lootTableId] = convertInlineLootToTable(converted.id, converted._inlineLoot);
          }
        }

        // Load loot tables from files
        const lootTables = await loadDirectory(packId, 'loot_tables');
        for (const table of lootTables) {
          const converted = convertLootTable(table);
          // Don't overwrite inline loot tables from enemies
          if (!this.cache.lootTables[converted.id]) {
            this.cache.lootTables[converted.id] = converted.entries;
          }
        }

        // Load items
        const items = await loadDirectory(packId, 'items');
        for (const item of items) {
          const converted = convertItem(item);
          this.cache.baseItems[converted.id] = converted;
        }

        // Load locations
        const locations = await loadDirectory(packId, 'locations');
        this.cache.locations.push(...locations);

        // Load encounter tables - convert to the simpler format Game.jsx expects
        const encounters = await loadDirectory(packId, 'encounter_tables');
        for (const encounter of encounters) {
          if (encounter.id) {
            // Handle both 'entries' and 'encounters' fields
            const sourceEntries = encounter.entries || encounter.encounters || [];
            this.cache.encounterTables[encounter.id] = sourceEntries
              .filter(e => e.type === 'enemy' || e.enemyId || e.id)
              .map(e => ({
                id: e.enemyId || e.id,
                weight: e.weight || e.chance || 50
              }));
          }
        }

        // Load characters
        const characters = await loadDirectory(packId, 'characters');
        this.cache.characters.push(...characters);

        // Load scenes
        const scenes = await loadDirectory(packId, 'scenes');
        for (const scene of scenes) {
          if (scene.id) {
            this.cache.scenes[scene.id] = scene;
          }
        }

        // Load effects
        const effects = await loadDirectory(packId, 'effects');
        this.cache.effects.push(...effects);
      }

      this.loaded = true;
      console.log('[GameDataLoader] Game data loaded:', {
        enemies: Object.keys(this.cache.enemies).length,
        lootTables: Object.keys(this.cache.lootTables).length,
        baseItems: Object.keys(this.cache.baseItems).length,
        locations: this.cache.locations.length,
        encounterTables: Object.keys(this.cache.encounterTables).length,
        characters: this.cache.characters.length,
        scenes: Object.keys(this.cache.scenes).length
      });

      return this.cache;
    } catch (error) {
      console.error('[GameDataLoader] Failed to load game data:', error);
      this.cache = {
        enemies: {},
        lootTables: {},
        baseItems: {},
        locations: [],
        encounterTables: {},
        characters: [],
        scenes: {},
        effects: []
      };
      return this.cache;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get an enemy by ID
   */
  getEnemy(id) {
    return this.cache?.enemies?.[id] || null;
  }

  /**
   * Get a loot table by ID
   */
  getLootTable(id) {
    return this.cache?.lootTables?.[id] || null;
  }

  /**
   * Get an item by ID
   */
  getItem(id) {
    return this.cache?.baseItems?.[id] || null;
  }

  /**
   * Get all locations
   */
  getLocations() {
    return this.cache?.locations || [];
  }

  /**
   * Get an encounter table by ID
   */
  getEncounterTable(id) {
    return this.cache?.encounterTables?.[id] || null;
  }

  /**
   * Check if data is loaded
   */
  isLoaded() {
    return this.loaded;
  }

  /**
   * Merge loaded datapack content with existing GameData object
   * This allows gradual transition from hardcoded to datapack-driven content
   *
   * @param {Object} existingGameData - The current hardcoded GameData object
   * @returns {Object} - Merged GameData with datapack content taking precedence
   */
  mergeWithGameData(existingGameData) {
    if (!this.loaded || !this.cache) {
      console.warn('[GameDataLoader] Cannot merge - data not loaded yet');
      return existingGameData;
    }

    // Start with the existing GameData as base
    const merged = { ...existingGameData };

    // Merge enemies - datapack takes precedence
    merged.enemies = {
      ...(existingGameData.enemies || {}),
      ...this.cache.enemies
    };

    // Merge loot tables - datapack takes precedence
    merged.lootTables = {
      ...(existingGameData.lootTables || {}),
      ...this.cache.lootTables
    };

    // Merge base items - datapack takes precedence
    merged.baseItems = {
      ...(existingGameData.baseItems || {}),
      ...this.cache.baseItems
    };

    // Merge locations - combine arrays, datapack items with same ID take precedence
    const locationMap = new Map();
    (existingGameData.locations || []).forEach(loc => locationMap.set(loc.id, loc));
    this.cache.locations.forEach(loc => locationMap.set(loc.id, loc));
    merged.locations = Array.from(locationMap.values());

    // Merge encounter tables - datapack takes precedence
    merged.enemyTables = {
      ...(existingGameData.enemyTables || {}),
      ...this.cache.encounterTables
    };

    // Merge characters - combine arrays, datapack items with same ID take precedence
    const characterMap = new Map();
    (existingGameData.characters || []).forEach(char => characterMap.set(char.id, char));
    this.cache.characters.forEach(char => characterMap.set(char.id, char));
    merged.characters = Array.from(characterMap.values());

    // Merge scenes - datapack takes precedence
    merged.scenes = {
      ...(existingGameData.scenes || {}),
      ...this.cache.scenes
    };

    console.log('[GameDataLoader] Merged GameData:', {
      enemies: Object.keys(merged.enemies).length,
      lootTables: Object.keys(merged.lootTables).length,
      baseItems: Object.keys(merged.baseItems).length,
      locations: merged.locations.length,
      enemyTables: Object.keys(merged.enemyTables).length,
      characters: merged.characters.length,
      scenes: Object.keys(merged.scenes).length
    });

    return merged;
  }

  /**
   * Get all loaded content (for direct access)
   */
  getLoadedContent() {
    return this.cache;
  }
}

// Export singleton instance
export const gameDataLoader = new GameDataLoader();
export { GameDataLoader };
