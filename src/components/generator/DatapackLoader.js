/**
 * DatapackLoader - Utility for loading content from datapacks for use in the Content Generator
 * Provides access to items, locations, enemies, effects, NPCs, scenes, etc. from game datapacks
 */

const DATAPACK_BASE_PATH = '/datapacks';

/**
 * Load JSON file from datapacks
 */
async function loadJson(path) {
  try {
    const response = await fetch(`${DATAPACK_BASE_PATH}/${path}`);
    if (!response.ok) {
      console.warn(`Failed to load ${path}: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn(`Error loading ${path}:`, error);
    return null;
  }
}

/**
 * Load all JSON files from a datapack directory
 */
async function loadDirectory(packId, contentPath, filePatterns = []) {
  const results = [];

  // Try to load common file patterns
  const patterns = filePatterns.length > 0 ? filePatterns : [
    `${packId}/${contentPath}/*.json`,
  ];

  // Since we can't list directories in the browser, we'll try known file names
  const knownFiles = {
    items: ['weapons_armor.json', 'clothing_paperdoll.json', 'consumables.json', 'materials.json'],
    enemies: ['forest_enemies.json', 'dungeon_enemies.json', 'demon_enemies.json', 'town_enemies.json'],
    locations: ['world_locations.json', 'regions.json', 'dungeons.json'],
    effects: ['core_effects.json', 'buffs.json', 'debuffs.json', 'curses.json'],
    scenes: ['intro_scenes.json', 'combat_scenes.json', 'quest_scenes.json', 'inn_rental_scenes.json', 'enemy_scene_mapping.json'],
    merchants: ['merchants.json', 'shop_inventories.json'],
    characters: ['playable_characters.json'],
    substances: ['core_substances.json'],
    nsfw: ['body_descriptors.json', 'enemy_names.json', 'equipment_interactions.json'],
    loot_tables: ['forest_loot.json', 'global_loot.json', 'town_loot.json', 'dungeon_loot.json'],
    encounter_tables: ['forest_encounters.json', 'town_encounters.json', 'dungeon_encounters.json'],
  };

  const filesToTry = knownFiles[contentPath] || [];

  for (const filename of filesToTry) {
    const data = await loadJson(`${packId}/${contentPath}/${filename}`);
    if (data) {
      // Handle both array and object formats
      if (Array.isArray(data)) {
        results.push(...data);
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
 * Main datapack loader class
 */
class DatapackLoader {
  constructor() {
    this.cache = {};
    this.loaded = false;
  }

  /**
   * Load all content from datapacks
   */
  async loadAll() {
    if (this.loaded) {
      return this.cache;
    }

    console.log('Loading datapack content...');

    // Load pack index to find available packs
    const packIndex = await loadJson('index.json');
    const packIds = packIndex?.packs || ['core'];

    // Initialize categories
    this.cache = {
      items: [],
      locations: [],
      enemies: [],
      effects: [],
      npcs: [],
      scenes: [],
      characters: [],
      merchants: [],
      substances: [],
      lootTables: [],
      encounterTables: [],
    };

    // Load content from each pack
    for (const packId of packIds) {
      // Load items
      const items = await loadDirectory(packId, 'items');
      this.cache.items.push(...items);

      // Load locations
      const locations = await loadDirectory(packId, 'locations');
      this.cache.locations.push(...locations);

      // Load enemies
      const enemies = await loadDirectory(packId, 'enemies');
      this.cache.enemies.push(...enemies);

      // Load effects
      const effects = await loadDirectory(packId, 'effects');
      this.cache.effects.push(...effects);

      // Load scenes
      const scenes = await loadDirectory(packId, 'scenes');
      this.cache.scenes.push(...scenes);

      // Load characters
      const characters = await loadDirectory(packId, 'characters');
      this.cache.characters.push(...characters);

      // Load merchants
      const merchants = await loadDirectory(packId, 'merchants');
      this.cache.merchants.push(...merchants);

      // Load substances
      const substances = await loadDirectory(packId, 'substances');
      this.cache.substances.push(...substances);

      // Load loot tables
      const lootTables = await loadDirectory(packId, 'loot_tables');
      this.cache.lootTables.push(...lootTables);

      // Load encounter tables
      const encounterTables = await loadDirectory(packId, 'encounter_tables');
      this.cache.encounterTables.push(...encounterTables);
    }

    this.loaded = true;
    console.log('Datapack content loaded:', {
      items: this.cache.items.length,
      locations: this.cache.locations.length,
      enemies: this.cache.enemies.length,
      effects: this.cache.effects.length,
      scenes: this.cache.scenes.length,
      characters: this.cache.characters.length,
      merchants: this.cache.merchants.length,
    });

    return this.cache;
  }

  /**
   * Get items by type
   */
  getItemsByType(type) {
    return this.cache.items.filter(item => item.type === type);
  }

  /**
   * Get items by category
   */
  getItemsByCategory(category) {
    return this.cache.items.filter(item => item.category === category);
  }

  /**
   * Get items by tag
   */
  getItemsByTag(tag) {
    return this.cache.items.filter(item => item.tags?.includes(tag));
  }

  /**
   * Get locations by region
   */
  getLocationsByRegion(region) {
    return this.cache.locations.filter(loc => loc.parentRegion === region);
  }

  /**
   * Get locations by type
   */
  getLocationsByType(type) {
    return this.cache.locations.filter(loc => loc.locationType === type || loc.type === type);
  }

  /**
   * Get enemies by tier
   */
  getEnemiesByTier(tier) {
    return this.cache.enemies.filter(enemy => enemy.tier === tier);
  }

  /**
   * Get enemies by type
   */
  getEnemiesByType(type) {
    return this.cache.enemies.filter(enemy => enemy.type === type);
  }

  /**
   * Get all unique regions
   */
  getRegions() {
    const regions = new Set();
    this.cache.locations.forEach(loc => {
      if (loc.parentRegion) {
        regions.add(loc.parentRegion);
      }
    });
    return Array.from(regions);
  }

  /**
   * Get all unique item types
   */
  getItemTypes() {
    const types = new Set();
    this.cache.items.forEach(item => {
      if (item.type) {
        types.add(item.type);
      }
    });
    return Array.from(types);
  }

  /**
   * Get all unique enemy types
   */
  getEnemyTypes() {
    const types = new Set();
    this.cache.enemies.forEach(enemy => {
      if (enemy.type) {
        types.add(enemy.type);
      }
    });
    return Array.from(types);
  }

  /**
   * Get all unique effect IDs
   */
  getEffectIds() {
    return this.cache.effects.map(effect => effect.id).filter(Boolean);
  }

  /**
   * Search items by name
   */
  searchItems(query) {
    const lower = query.toLowerCase();
    return this.cache.items.filter(item =>
      item.name?.toLowerCase().includes(lower) ||
      item.id?.toLowerCase().includes(lower)
    );
  }

  /**
   * Search locations by name
   */
  searchLocations(query) {
    const lower = query.toLowerCase();
    return this.cache.locations.filter(loc =>
      loc.name?.toLowerCase().includes(lower) ||
      loc.id?.toLowerCase().includes(lower)
    );
  }

  /**
   * Get a specific item by ID
   */
  getItemById(id) {
    return this.cache.items.find(item => item.id === id);
  }

  /**
   * Get a specific location by ID
   */
  getLocationById(id) {
    return this.cache.locations.find(loc => loc.id === id);
  }

  /**
   * Get a specific enemy by ID
   */
  getEnemyById(id) {
    return this.cache.enemies.find(enemy => enemy.id === id);
  }

  /**
   * Get a specific effect by ID
   */
  getEffectById(id) {
    return this.cache.effects.find(effect => effect.id === id);
  }

  /**
   * Clear cache and force reload
   */
  clearCache() {
    this.cache = {};
    this.loaded = false;
  }

  /**
   * Get all unique tags from a specific content type
   */
  getTagsFromContentType(contentType) {
    const content = this.cache[contentType] || [];
    const tags = new Set();
    content.forEach(item => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }

  /**
   * Get all unique tags from all content types
   */
  getAllTags() {
    const tags = new Set();

    // Collect from all content types
    ['items', 'locations', 'enemies', 'effects', 'scenes', 'characters', 'npcs', 'merchants'].forEach(type => {
      const content = this.cache[type] || [];
      content.forEach(item => {
        if (Array.isArray(item.tags)) {
          item.tags.forEach(tag => tags.add(tag));
        }
      });
    });

    return Array.from(tags).sort();
  }

  /**
   * Get tags for items specifically
   */
  getItemTags() {
    return this.getTagsFromContentType('items');
  }

  /**
   * Get tags for enemies specifically
   */
  getEnemyTags() {
    return this.getTagsFromContentType('enemies');
  }

  /**
   * Get tags for locations specifically
   */
  getLocationTags() {
    return this.getTagsFromContentType('locations');
  }

  /**
   * Get tags for scenes specifically
   */
  getSceneTags() {
    return this.getTagsFromContentType('scenes');
  }

  /**
   * Get tags for effects specifically
   */
  getEffectTags() {
    return this.getTagsFromContentType('effects');
  }

  /**
   * Get tags for NPCs/merchants specifically
   */
  getNpcTags() {
    const tags = new Set();
    ['npcs', 'merchants'].forEach(type => {
      const content = this.cache[type] || [];
      content.forEach(item => {
        if (Array.isArray(item.tags)) {
          item.tags.forEach(tag => tags.add(tag));
        }
      });
    });
    return Array.from(tags).sort();
  }
}

// Export singleton instance
export const datapackLoader = new DatapackLoader();

// Export class for testing
export { DatapackLoader };

/**
 * Utility function to collect all unique tags from multiple sources
 * @param {Object} options
 * @param {Object} options.datapackContent - Content loaded from datapacks
 * @param {Array} options.userContent - User-created content items
 * @param {Array} options.commonTags - Common/fallback tags to always include
 * @param {string} options.contentType - Type of content (items, enemies, locations, etc.)
 * @returns {Array} Sorted array of unique tags
 */
export function collectTags({ datapackContent = {}, userContent = [], commonTags = [], contentType = null }) {
  const tags = new Set();

  // Add common/fallback tags
  commonTags.forEach(tag => tags.add(tag));

  // Collect from datapack content
  if (contentType && datapackContent[contentType]) {
    datapackContent[contentType].forEach(item => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach(tag => tags.add(tag));
      }
    });
  } else {
    // Collect from all datapack content types
    Object.values(datapackContent).forEach(items => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (Array.isArray(item.tags)) {
            item.tags.forEach(tag => tags.add(tag));
          }
        });
      }
    });
  }

  // Collect from user-created content
  if (Array.isArray(userContent)) {
    userContent.forEach(item => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach(tag => tags.add(tag));
      }
    });
  }

  return Array.from(tags).sort();
}
