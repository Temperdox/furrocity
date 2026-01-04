/**
 * DataRegistry - Async content lookup system with lazy loading and caching
 *
 * Now supports the DataPack system for modular, tag-based content loading
 * with sprite sheets, loot tables, and encounter tables.
 *
 * Usage:
 *   const registry = new DataRegistry('/content/manifest.json');
 *   await registry.init();
 *   const sword = await registry.getItem('iron_sword');
 *   const goblins = await registry.queryItemsByTag('goblin');
 *
 * DataPack Mode:
 *   const registry = new DataRegistry({ useDataPacks: true });
 *   await registry.init();
 *   // All content now loaded from /datapacks/
 */

import DataPackManager from './DataPackManager.js';
import SpriteSheetManager from './SpriteSheetManager.js';
import ConditionEvaluator from './ConditionEvaluator.js';
import LootTableSystem from './LootTableSystem.js';
import EncounterTableSystem from './EncounterTableSystem.js';

// Simple LRU Cache implementation
class LRUCache {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key);
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Delete oldest (first) entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }
}

// IndexedDB wrapper for persistent caching
class ContentCache {
  constructor(dbName = 'GameContentCache', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async init() {
    if (this.db) return;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('chunks')) {
          db.createObjectStore('chunks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  async getChunk(chunkId) {
    if (!this.db) return null;
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('chunks', 'readonly');
      const store = tx.objectStore('chunks');
      const request = store.get(chunkId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.data || null);
    });
  }

  async setChunk(chunkId, data, version) {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('chunks', 'readwrite');
      const store = tx.objectStore('chunks');
      const request = store.put({ id: chunkId, data, version, timestamp: Date.now() });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getMetadata(key) {
    if (!this.db) return null;
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('metadata', 'readonly');
      const store = tx.objectStore('metadata');
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.value || null);
    });
  }

  async setMetadata(key, value) {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('metadata', 'readwrite');
      const store = tx.objectStore('metadata');
      const request = store.put({ key, value });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearAll() {
    if (!this.db) return;
    
    const tx = this.db.transaction(['chunks', 'metadata'], 'readwrite');
    tx.objectStore('chunks').clear();
    tx.objectStore('metadata').clear();
  }
}

// Main Data Registry
export class DataRegistry {
  constructor(manifestUrlOrOptions = '/content/manifest.json', options = {}) {
    // Handle new options-only constructor format
    if (typeof manifestUrlOrOptions === 'object') {
      options = manifestUrlOrOptions;
      this.manifestUrl = options.manifestUrl || '/content/manifest.json';
    } else {
      this.manifestUrl = manifestUrlOrOptions;
    }

    this.manifest = null;
    this.indexes = {};
    this.loadedChunks = new Map(); // chunkId -> chunk data
    this.itemCache = new LRUCache(options.cacheSize || 2000);
    this.persistentCache = options.useIndexedDB !== false ? new ContentCache() : null;
    this.pendingChunks = new Map(); // chunkId -> Promise (prevent duplicate fetches)
    this.baseUrl = options.baseUrl || '/content';
    this.initialized = false;

    // DataPack system
    this.useDataPacks = options.useDataPacks || false;
    this.dataPacksPath = options.dataPacksPath || '/datapacks';

    /**
     * DataPackManager instance (when using datapacks)
     * @type {DataPackManager|null}
     */
    this.dataPackManager = null;

    /**
     * SpriteSheetManager instance
     * @type {SpriteSheetManager|null}
     */
    this.spriteManager = null;

    /**
     * ConditionEvaluator instance
     * @type {ConditionEvaluator|null}
     */
    this.conditionEvaluator = null;

    /**
     * LootTableSystem instance
     * @type {LootTableSystem|null}
     */
    this.lootTableSystem = null;

    /**
     * EncounterTableSystem instance
     * @type {EncounterTableSystem|null}
     */
    this.encounterTableSystem = null;

    // Content type configurations
    this.contentTypes = {
      items: { idPrefix: 'item:', chunkPrefix: 'items_' },
      scenes: { idPrefix: 'scene:', chunkPrefix: 'scenes_' },
      enemies: { idPrefix: 'enemy:', chunkPrefix: 'enemies_' },
      locations: { idPrefix: 'location:', chunkPrefix: 'locations_' },
      npcs: { idPrefix: 'npc:', chunkPrefix: 'npcs_' },
      effects: { idPrefix: 'effect:', chunkPrefix: 'effects_' },
      achievements: { idPrefix: 'achievement:', chunkPrefix: 'achievements_' },
      dialogues: { idPrefix: 'dialogue:', chunkPrefix: 'dialogues_' },
      skills: { idPrefix: 'skill:', chunkPrefix: 'skills_' },
      quests: { idPrefix: 'quest:', chunkPrefix: 'quests_' },
      substances: { idPrefix: 'substance:', chunkPrefix: 'substances_' },
      merchants: { idPrefix: 'merchant:', chunkPrefix: 'merchants_' },
      titles: { idPrefix: 'title:', chunkPrefix: 'titles_' },
      shop_inventories: { idPrefix: 'shop:', chunkPrefix: 'shop_inventories_' }
    };
  }

  async init() {
    if (this.initialized) return;

    // Initialize IndexedDB cache
    if (this.persistentCache) {
      try {
        await this.persistentCache.init();
      } catch (e) {
        console.warn('IndexedDB not available, falling back to memory-only cache');
        this.persistentCache = null;
      }
    }

    // Use DataPack system if enabled
    if (this.useDataPacks) {
      await this.initDataPacks();
    } else {
      // Legacy initialization
      await this.loadManifest();
      await this.loadIndexes();
    }

    this.initialized = true;
  }

  /**
   * Initialize the DataPack system and all subsystems
   * @returns {Promise<void>}
   */
  async initDataPacks() {
    console.log('Initializing DataPack system...');

    // Create and initialize DataPackManager
    this.dataPackManager = new DataPackManager({
      baseDir: this.dataPacksPath
    });
    await this.dataPackManager.loadAllPacks();

    // Get merged manifest for compatibility
    this.manifest = this.dataPackManager.getMergedManifest();

    // Initialize SpriteSheetManager
    this.spriteManager = new SpriteSheetManager();
    await this.spriteManager.loadSpriteSheets(this.dataPackManager);

    // Initialize ConditionEvaluator
    this.conditionEvaluator = new ConditionEvaluator();
    await this.conditionEvaluator.initialize(this.dataPackManager);

    // Initialize LootTableSystem
    this.lootTableSystem = new LootTableSystem({
      packManager: this.dataPackManager
    });
    await this.lootTableSystem.initialize(this.dataPackManager, this.conditionEvaluator);

    // Initialize EncounterTableSystem
    this.encounterTableSystem = new EncounterTableSystem({
      packManager: this.dataPackManager
    });
    await this.encounterTableSystem.initialize(this.dataPackManager, this.conditionEvaluator);

    console.log('DataPack system initialized successfully');
  }

  async loadManifest() {
    // Check if cached manifest is still valid
    if (this.persistentCache) {
      const cachedVersion = await this.persistentCache.getMetadata('manifestVersion');
      const response = await fetch(this.manifestUrl, { method: 'HEAD' });
      const currentVersion = response.headers.get('etag') || response.headers.get('last-modified');
      
      if (cachedVersion === currentVersion) {
        const cachedManifest = await this.persistentCache.getMetadata('manifest');
        if (cachedManifest) {
          this.manifest = cachedManifest;
          return;
        }
      }
    }
    
    // Fetch fresh manifest
    const response = await fetch(this.manifestUrl);
    if (!response.ok) {
      throw new Error(`Failed to load manifest: ${response.status}`);
    }
    
    this.manifest = await response.json();
    
    // Cache manifest
    if (this.persistentCache) {
      const version = response.headers.get('etag') || response.headers.get('last-modified') || Date.now().toString();
      await this.persistentCache.setMetadata('manifest', this.manifest);
      await this.persistentCache.setMetadata('manifestVersion', version);
    }
  }

  async loadIndexes() {
    if (!this.manifest.indexes) return;
    
    for (const [indexName, indexPath] of Object.entries(this.manifest.indexes)) {
      try {
        const response = await fetch(`${this.baseUrl}/${indexPath}`);
        if (response.ok) {
          this.indexes[indexName] = await response.json();
        }
      } catch (e) {
        console.warn(`Failed to load index ${indexName}:`, e);
      }
    }
  }

  async loadChunk(chunkId) {
    // Already loaded in memory
    if (this.loadedChunks.has(chunkId)) {
      return this.loadedChunks.get(chunkId);
    }
    
    // Already being fetched
    if (this.pendingChunks.has(chunkId)) {
      return this.pendingChunks.get(chunkId);
    }
    
    // Start fetch
    const fetchPromise = this._fetchChunk(chunkId);
    this.pendingChunks.set(chunkId, fetchPromise);
    
    try {
      const data = await fetchPromise;
      this.loadedChunks.set(chunkId, data);
      return data;
    } finally {
      this.pendingChunks.delete(chunkId);
    }
  }

  async _fetchChunk(chunkId) {
    const chunkInfo = this.manifest.chunks[chunkId];
    if (!chunkInfo) {
      throw new Error(`Unknown chunk: ${chunkId}`);
    }
    
    // Check persistent cache first
    if (this.persistentCache) {
      const cached = await this.persistentCache.getChunk(chunkId);
      if (cached && cached.version === chunkInfo.version) {
        return cached.data;
      }
    }
    
    // Fetch from network
    const url = `${this.baseUrl}/${chunkInfo.path}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to load chunk ${chunkId}: ${response.status}`);
    }
    
    let data;
    if (chunkInfo.format === 'msgpack') {
      // Would need msgpack library
      const buffer = await response.arrayBuffer();
      data = this._decodeMsgpack(buffer);
    } else {
      data = await response.json();
    }
    
    // Cache in IndexedDB
    if (this.persistentCache) {
      await this.persistentCache.setChunk(chunkId, data, chunkInfo.version);
    }
    
    return data;
  }

  _decodeMsgpack(buffer) {
    // Placeholder - would use actual msgpack library
    // For now, assume JSON fallback
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(buffer));
  }

  // Find which chunk contains an ID
  _findChunkForId(contentType, id) {
    const mapping = this.manifest.idToChunk?.[contentType];
    if (mapping && mapping[id]) {
      return mapping[id];
    }
    
    // Fallback: check ranges if defined
    const ranges = this.manifest.chunkRanges?.[contentType];
    if (ranges) {
      for (const [chunkId, range] of Object.entries(ranges)) {
        if (range.ids?.includes(id) || (range.start <= id && id <= range.end)) {
          return chunkId;
        }
      }
    }
    
    // Ultimate fallback: load all chunks of type and search
    return null;
  }

  // ========================================
  // PUBLIC API - Async Content Lookups
  // ========================================

  async getItem(itemId) {
    // DataPack mode
    if (this.useDataPacks && this.dataPackManager) {
      return this.dataPackManager.getContentById('items', itemId);
    }

    // Legacy mode
    const cacheKey = `item:${itemId}`;

    // Check memory cache
    if (this.itemCache.has(cacheKey)) {
      return this.itemCache.get(cacheKey);
    }

    // Find and load chunk
    const chunkId = this._findChunkForId('items', itemId);
    if (chunkId) {
      const chunk = await this.loadChunk(chunkId);
      const item = chunk.items?.[itemId] || chunk[itemId];
      if (item) {
        this.itemCache.set(cacheKey, item);
        return item;
      }
    }

    // Fallback: search all item chunks
    const itemChunks = Object.keys(this.manifest.chunks || {}).filter(k => k.startsWith('items_'));
    for (const chId of itemChunks) {
      const chunk = await this.loadChunk(chId);
      const item = chunk.items?.[itemId] || chunk[itemId];
      if (item) {
        this.itemCache.set(cacheKey, item);
        return item;
      }
    }

    return null;
  }

  async getScene(sceneId) {
    if (this.useDataPacks && this.dataPackManager) {
      return this.dataPackManager.getContentById('scenes', sceneId);
    }

    const cacheKey = `scene:${sceneId}`;
    if (this.itemCache.has(cacheKey)) return this.itemCache.get(cacheKey);

    const chunkId = this._findChunkForId('scenes', sceneId);
    if (chunkId) {
      const chunk = await this.loadChunk(chunkId);
      const scene = chunk.scenes?.[sceneId] || chunk[sceneId];
      if (scene) {
        this.itemCache.set(cacheKey, scene);
        return scene;
      }
    }
    return null;
  }

  async getEnemy(enemyId) {
    if (this.useDataPacks && this.dataPackManager) {
      return this.dataPackManager.getContentById('enemies', enemyId);
    }

    const cacheKey = `enemy:${enemyId}`;
    if (this.itemCache.has(cacheKey)) return this.itemCache.get(cacheKey);

    const chunkId = this._findChunkForId('enemies', enemyId);
    if (chunkId) {
      const chunk = await this.loadChunk(chunkId);
      const enemy = chunk.enemies?.[enemyId] || chunk[enemyId];
      if (enemy) {
        this.itemCache.set(cacheKey, enemy);
        return enemy;
      }
    }
    return null;
  }

  async getLocation(locationId) {
    if (this.useDataPacks && this.dataPackManager) {
      return this.dataPackManager.getContentById('locations', locationId);
    }

    const cacheKey = `location:${locationId}`;
    if (this.itemCache.has(cacheKey)) return this.itemCache.get(cacheKey);

    const chunkId = this._findChunkForId('locations', locationId);
    if (chunkId) {
      const chunk = await this.loadChunk(chunkId);
      const location = chunk.locations?.[locationId] || chunk[locationId];
      if (location) {
        this.itemCache.set(cacheKey, location);
        return location;
      }
    }
    return null;
  }

  async getNpc(npcId) {
    if (this.useDataPacks && this.dataPackManager) {
      return this.dataPackManager.getContentById('npcs', npcId);
    }

    const cacheKey = `npc:${npcId}`;
    if (this.itemCache.has(cacheKey)) return this.itemCache.get(cacheKey);

    const chunkId = this._findChunkForId('npcs', npcId);
    if (chunkId) {
      const chunk = await this.loadChunk(chunkId);
      const npc = chunk.npcs?.[npcId] || chunk[npcId];
      if (npc) {
        this.itemCache.set(cacheKey, npc);
        return npc;
      }
    }
    return null;
  }

  async getEffect(effectId) {
    if (this.useDataPacks && this.dataPackManager) {
      return this.dataPackManager.getContentById('effects', effectId);
    }

    const cacheKey = `effect:${effectId}`;
    if (this.itemCache.has(cacheKey)) return this.itemCache.get(cacheKey);

    const chunkId = this._findChunkForId('effects', effectId);
    if (chunkId) {
      const chunk = await this.loadChunk(chunkId);
      const effect = chunk.effects?.[effectId] || chunk[effectId];
      if (effect) {
        this.itemCache.set(cacheKey, effect);
        return effect;
      }
    }
    return null;
  }

  /**
   * Get a substance by ID
   * @param {string} substanceId - Substance ID
   * @returns {Promise<Object|null>}
   */
  async getSubstance(substanceId) {
    if (this.useDataPacks && this.dataPackManager) {
      return this.dataPackManager.getContentById('substances', substanceId);
    }

    const cacheKey = `substance:${substanceId}`;
    if (this.itemCache.has(cacheKey)) return this.itemCache.get(cacheKey);

    const chunkId = this._findChunkForId('substances', substanceId);
    if (chunkId) {
      const chunk = await this.loadChunk(chunkId);
      const substance = chunk.substances?.[substanceId] || chunk[substanceId];
      if (substance) {
        this.itemCache.set(cacheKey, substance);
        return substance;
      }
    }
    return null;
  }

  async getSkill(skillId) {
    const cacheKey = `skill:${skillId}`;
    if (this.itemCache.has(cacheKey)) return this.itemCache.get(cacheKey);
    
    const chunkId = this._findChunkForId('skills', skillId);
    if (chunkId) {
      const chunk = await this.loadChunk(chunkId);
      const skill = chunk.skills?.[skillId] || chunk[skillId];
      if (skill) {
        this.itemCache.set(cacheKey, skill);
        return skill;
      }
    }
    return null;
  }

  async getAchievement(achievementId) {
    const cacheKey = `achievement:${achievementId}`;
    if (this.itemCache.has(cacheKey)) return this.itemCache.get(cacheKey);
    
    const chunkId = this._findChunkForId('achievements', achievementId);
    if (chunkId) {
      const chunk = await this.loadChunk(chunkId);
      const achievement = chunk.achievements?.[achievementId] || chunk[achievementId];
      if (achievement) {
        this.itemCache.set(cacheKey, achievement);
        return achievement;
      }
    }
    return null;
  }

  async getDialogue(dialogueId) {
    const cacheKey = `dialogue:${dialogueId}`;
    if (this.itemCache.has(cacheKey)) return this.itemCache.get(cacheKey);
    
    const chunkId = this._findChunkForId('dialogues', dialogueId);
    if (chunkId) {
      const chunk = await this.loadChunk(chunkId);
      const dialogue = chunk.dialogues?.[dialogueId] || chunk[dialogueId];
      if (dialogue) {
        this.itemCache.set(cacheKey, dialogue);
        return dialogue;
      }
    }
    return null;
  }

  async getQuest(questId) {
    const cacheKey = `quest:${questId}`;
    if (this.itemCache.has(cacheKey)) return this.itemCache.get(cacheKey);

    const chunkId = this._findChunkForId('quests', questId);
    if (chunkId) {
      const chunk = await this.loadChunk(chunkId);
      const quest = chunk.quests?.[questId] || chunk[questId];
      if (quest) {
        this.itemCache.set(cacheKey, quest);
        return quest;
      }
    }
    return null;
  }

  /**
   * Get a merchant by ID
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object|null>}
   */
  async getMerchant(merchantId) {
    if (this.useDataPacks && this.dataPackManager) {
      return this.dataPackManager.getContentById('merchants', merchantId);
    }

    const cacheKey = `merchant:${merchantId}`;
    if (this.itemCache.has(cacheKey)) return this.itemCache.get(cacheKey);

    const chunkId = this._findChunkForId('merchants', merchantId);
    if (chunkId) {
      const chunk = await this.loadChunk(chunkId);
      const merchant = chunk.merchants?.[merchantId] || chunk[merchantId];
      if (merchant) {
        this.itemCache.set(cacheKey, merchant);
        return merchant;
      }
    }
    return null;
  }

  /**
   * Get a title by ID
   * @param {string} titleId - Title ID
   * @returns {Promise<Object|null>}
   */
  async getTitle(titleId) {
    if (this.useDataPacks && this.dataPackManager) {
      return this.dataPackManager.getContentById('titles', titleId);
    }

    const cacheKey = `title:${titleId}`;
    if (this.itemCache.has(cacheKey)) return this.itemCache.get(cacheKey);

    const chunkId = this._findChunkForId('titles', titleId);
    if (chunkId) {
      const chunk = await this.loadChunk(chunkId);
      const title = chunk.titles?.[titleId] || chunk[titleId];
      if (title) {
        this.itemCache.set(cacheKey, title);
        return title;
      }
    }
    return null;
  }

  /**
   * Get a shop inventory by ID
   * @param {string} shopId - Shop inventory ID
   * @returns {Promise<Object|null>}
   */
  async getShopInventory(shopId) {
    if (this.useDataPacks && this.dataPackManager) {
      return this.dataPackManager.getContentById('shop_inventories', shopId);
    }

    const cacheKey = `shop:${shopId}`;
    if (this.itemCache.has(cacheKey)) return this.itemCache.get(cacheKey);

    const chunkId = this._findChunkForId('shop_inventories', shopId);
    if (chunkId) {
      const chunk = await this.loadChunk(chunkId);
      const shop = chunk.shop_inventories?.[shopId] || chunk[shopId];
      if (shop) {
        this.itemCache.set(cacheKey, shop);
        return shop;
      }
    }
    return null;
  }

  /**
   * Get generic content by type and ID
   * @param {string} contentType - Content type (e.g., 'merchants', 'titles')
   * @param {string} id - Content ID
   * @returns {Promise<Object|null>}
   */
  async getContent(contentType, id) {
    if (this.useDataPacks && this.dataPackManager) {
      return this.dataPackManager.getContentById(contentType, id);
    }

    const cacheKey = `${contentType}:${id}`;
    if (this.itemCache.has(cacheKey)) return this.itemCache.get(cacheKey);

    const chunkId = this._findChunkForId(contentType, id);
    if (chunkId) {
      const chunk = await this.loadChunk(chunkId);
      const content = chunk[contentType]?.[id] || chunk[id];
      if (content) {
        this.itemCache.set(cacheKey, content);
        return content;
      }
    }
    return null;
  }

  /**
   * Get all content of a type
   * @param {string} contentType - Content type
   * @returns {Array} Array of content items
   */
  getContentByType(contentType) {
    if (this.useDataPacks && this.dataPackManager) {
      return this.dataPackManager.getContentByType(contentType) || [];
    }
    return [];
  }

  // ========================================
  // QUERY API - Search by tags, categories
  // ========================================

  async queryItemsByTag(tag) {
    // Use index if available
    if (this.indexes.itemsByTag?.[tag]) {
      const ids = this.indexes.itemsByTag[tag];
      return Promise.all(ids.map(id => this.getItem(id)));
    }
    
    // Fallback: load all and filter
    return this._queryAllOfType('items', item => item.tags?.includes(tag));
  }

  async queryItemsByCategory(category) {
    if (this.indexes.itemsByCategory?.[category]) {
      const ids = this.indexes.itemsByCategory[category];
      return Promise.all(ids.map(id => this.getItem(id)));
    }
    return this._queryAllOfType('items', item => item.category === category);
  }

  async queryItemsByRarity(rarity) {
    if (this.indexes.itemsByRarity?.[rarity]) {
      const ids = this.indexes.itemsByRarity[rarity];
      return Promise.all(ids.map(id => this.getItem(id)));
    }
    return this._queryAllOfType('items', item => item.rarity === rarity);
  }

  async queryEnemiesByTag(tag) {
    if (this.indexes.enemiesByTag?.[tag]) {
      const ids = this.indexes.enemiesByTag[tag];
      return Promise.all(ids.map(id => this.getEnemy(id)));
    }
    return this._queryAllOfType('enemies', enemy => enemy.tags?.includes(tag));
  }

  async queryEnemiesByLocation(locationId) {
    if (this.indexes.enemiesByLocation?.[locationId]) {
      const ids = this.indexes.enemiesByLocation[locationId];
      return Promise.all(ids.map(id => this.getEnemy(id)));
    }
    return this._queryAllOfType('enemies', enemy => enemy.locations?.includes(locationId));
  }

  async queryScenesByTag(tag) {
    if (this.indexes.scenesByTag?.[tag]) {
      const ids = this.indexes.scenesByTag[tag];
      return Promise.all(ids.map(id => this.getScene(id)));
    }
    return this._queryAllOfType('scenes', scene => scene.tags?.includes(tag));
  }

  async queryEffectsByType(type) {
    if (this.indexes.effectsByType?.[type]) {
      const ids = this.indexes.effectsByType[type];
      return Promise.all(ids.map(id => this.getEffect(id)));
    }
    return this._queryAllOfType('effects', effect => effect.type === type);
  }

  async queryLocationsByTag(tag) {
    if (this.indexes.locationsByTag?.[tag]) {
      const ids = this.indexes.locationsByTag[tag];
      return Promise.all(ids.map(id => this.getLocation(id)));
    }
    return this._queryAllOfType('locations', loc => loc.tags?.includes(tag));
  }

  async queryAchievementsByCategory(category) {
    if (this.indexes.achievementsByCategory?.[category]) {
      const ids = this.indexes.achievementsByCategory[category];
      return Promise.all(ids.map(id => this.getAchievement(id)));
    }
    return this._queryAllOfType('achievements', ach => ach.category === category);
  }

  // Generic query helper
  async _queryAllOfType(contentType, filterFn) {
    const results = [];
    const chunkPrefix = this.contentTypes[contentType]?.chunkPrefix || `${contentType}_`;
    const chunkIds = Object.keys(this.manifest.chunks).filter(k => k.startsWith(chunkPrefix));
    
    for (const chunkId of chunkIds) {
      const chunk = await this.loadChunk(chunkId);
      const items = chunk[contentType] || chunk;
      
      for (const [id, item] of Object.entries(items)) {
        if (filterFn(item)) {
          results.push({ ...item, id });
        }
      }
    }
    
    return results;
  }

  // ========================================
  // BATCH LOADING - For preloading areas
  // ========================================

  async preloadLocation(locationId) {
    const location = await this.getLocation(locationId);
    if (!location) return;
    
    // Preload enemies for this location
    if (location.enemyTables) {
      for (const tableId of location.enemyTables) {
        // Load enemy table chunk
      }
    }
    
    // Preload connected locations
    if (location.connectedLocations) {
      await Promise.all(location.connectedLocations.map(id => this.getLocation(id)));
    }
    
    // Preload NPCs
    if (location.npcs) {
      await Promise.all(location.npcs.map(id => this.getNpc(id)));
    }
  }

  async preloadChapter(chapterId) {
    // Load all content for a chapter/region
    const chapterChunks = Object.keys(this.manifest.chunks).filter(k => 
      k.includes(`_chapter${chapterId}_`) || k.includes(`_ch${chapterId}_`)
    );
    
    await Promise.all(chapterChunks.map(chunkId => this.loadChunk(chunkId)));
  }

  // ========================================
  // UTILITIES
  // ========================================

  clearCache() {
    this.itemCache.clear();
    this.loadedChunks.clear();
    if (this.conditionEvaluator) {
      this.conditionEvaluator.clearCache();
    }
  }

  async clearPersistentCache() {
    if (this.persistentCache) {
      await this.persistentCache.clearAll();
    }
  }

  getStats() {
    const stats = {
      loadedChunks: this.loadedChunks.size,
      cachedItems: this.itemCache.cache.size,
      manifestVersion: this.manifest?.version,
      useDataPacks: this.useDataPacks
    };

    if (this.useDataPacks) {
      stats.dataPackStats = {
        loadedPacks: this.dataPackManager?.getLoadedPacks()?.length || 0,
        sprites: this.spriteManager?.getStats() || null,
        lootTables: this.lootTableSystem?.getStats() || null,
        encounterTables: this.encounterTableSystem?.getStats() || null,
        conditions: this.conditionEvaluator?.getStats() || null
      };
    }

    return stats;
  }

  // ========================================
  // DATAPACK API - Sprites, Loot, Encounters
  // ========================================

  /**
   * Get sprite icon data
   * @param {string} iconId - Icon identifier
   * @returns {Object|null} Icon data with sheet, position, dimensions
   */
  getIcon(iconId) {
    if (!this.spriteManager) return null;
    return this.spriteManager.getIcon(iconId);
  }

  /**
   * Render an icon to a canvas
   * @param {string} iconId - Icon identifier
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} [width] - Optional width
   * @param {number} [height] - Optional height
   * @returns {boolean} Whether icon was rendered
   */
  renderIcon(iconId, ctx, x, y, width, height) {
    if (!this.spriteManager) return false;
    return this.spriteManager.renderIcon(iconId, ctx, x, y, width, height);
  }

  /**
   * Resolve an icon reference (handles both emoji and sprite formats)
   * @param {string|Object} iconRef - Icon reference
   * @returns {Object} Resolved icon info
   */
  resolveIcon(iconRef) {
    if (!this.spriteManager) {
      return { type: 'emoji', value: iconRef };
    }
    return this.spriteManager.resolveIconReference(iconRef);
  }

  /**
   * Create an img element for an icon
   * @param {string} iconId - Icon identifier
   * @param {Object} [options] - Options (scale, className, alt)
   * @returns {HTMLImageElement|null}
   */
  createIconElement(iconId, options) {
    if (!this.spriteManager) return null;
    return this.spriteManager.createIconElement(iconId, options);
  }

  // ========================================
  // CONTENT ICON HELPERS - Get icons from content
  // ========================================

  /**
   * Get the icon for an item
   * @param {Object|string} itemOrId - Item data or item ID
   * @returns {Promise<Object>} Resolved icon info
   */
  async getItemIcon(itemOrId) {
    let item = itemOrId;
    if (typeof itemOrId === 'string') {
      item = await this.getItem(itemOrId);
    }
    if (!item) return { type: 'unknown', value: null };
    return this.resolveIcon(item.icon);
  }

  /**
   * Get the icon for an effect/debuff
   * @param {Object|string} effectOrId - Effect data or effect ID
   * @returns {Promise<Object>} Resolved icon info
   */
  async getEffectIcon(effectOrId) {
    let effect = effectOrId;
    if (typeof effectOrId === 'string') {
      effect = await this.getEffect(effectOrId);
    }
    if (!effect) return { type: 'unknown', value: null };
    return this.resolveIcon(effect.icon);
  }

  /**
   * Get the icon for an enemy
   * @param {Object|string} enemyOrId - Enemy data or enemy ID
   * @returns {Promise<Object>} Resolved icon info
   */
  async getEnemyIcon(enemyOrId) {
    let enemy = enemyOrId;
    if (typeof enemyOrId === 'string') {
      enemy = await this.getEnemy(enemyOrId);
    }
    if (!enemy) return { type: 'unknown', value: null };
    return this.resolveIcon(enemy.icon);
  }

  /**
   * Get the icon for a location
   * @param {Object|string} locationOrId - Location data or location ID
   * @returns {Promise<Object>} Resolved icon info
   */
  async getLocationIcon(locationOrId) {
    let location = locationOrId;
    if (typeof locationOrId === 'string') {
      location = await this.getLocation(locationOrId);
    }
    if (!location) return { type: 'unknown', value: null };

    // Locations may use type-based icons
    if (location.icon) {
      return this.resolveIcon(location.icon);
    }

    // Fallback to type-based UI icon
    const typeIconMap = {
      building: 'location_safe',
      dungeon: 'location_dungeon',
      outdoor: 'location_forest',
      town: 'location_town'
    };
    const fallbackIconId = typeIconMap[location.type] || 'location_safe';
    return this.resolveIcon({ type: 'sprite', sheetId: 'ui_icons', iconId: fallbackIconId });
  }

  /**
   * Get the icon for an action (enemy action, player action, etc.)
   * @param {Object} action - Action data with icon field
   * @returns {Object} Resolved icon info
   */
  getActionIcon(action) {
    if (!action) return { type: 'unknown', value: null };
    if (action.icon) {
      return this.resolveIcon(action.icon);
    }
    // Fallback based on action type
    return this.resolveIcon({ type: 'sprite', sheetId: 'ui_icons', iconId: 'action_skill' });
  }

  /**
   * Render an item's icon to a canvas
   * @param {Object|string} itemOrId - Item data or item ID
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} [size] - Icon size (square)
   * @returns {Promise<boolean>} Whether icon was rendered
   */
  async renderItemIcon(itemOrId, ctx, x, y, size = 32) {
    const iconInfo = await this.getItemIcon(itemOrId);
    if (iconInfo.type === 'sprite' && iconInfo.iconId) {
      return this.renderIcon(iconInfo.iconId, ctx, x, y, size, size);
    }
    return false;
  }

  /**
   * Render an effect's icon to a canvas
   * @param {Object|string} effectOrId - Effect data or effect ID
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} [size] - Icon size (square)
   * @returns {Promise<boolean>} Whether icon was rendered
   */
  async renderEffectIcon(effectOrId, ctx, x, y, size = 32) {
    const iconInfo = await this.getEffectIcon(effectOrId);
    if (iconInfo.type === 'sprite' && iconInfo.iconId) {
      return this.renderIcon(iconInfo.iconId, ctx, x, y, size, size);
    }
    return false;
  }

  /**
   * Render an enemy's icon to a canvas
   * @param {Object|string} enemyOrId - Enemy data or enemy ID
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} [size] - Icon size (square)
   * @returns {Promise<boolean>} Whether icon was rendered
   */
  async renderEnemyIcon(enemyOrId, ctx, x, y, size = 48) {
    const iconInfo = await this.getEnemyIcon(enemyOrId);
    if (iconInfo.type === 'sprite' && iconInfo.iconId) {
      return this.renderIcon(iconInfo.iconId, ctx, x, y, size, size);
    }
    return false;
  }

  /**
   * Create an HTML element for an item's icon
   * @param {Object|string} itemOrId - Item data or item ID
   * @param {Object} [options] - Options for createIconElement
   * @returns {Promise<HTMLElement|null>}
   */
  async createItemIconElement(itemOrId, options = {}) {
    const iconInfo = await this.getItemIcon(itemOrId);
    if (iconInfo.type === 'sprite' && iconInfo.iconId) {
      return this.createIconElement(iconInfo.iconId, options);
    }
    return null;
  }

  /**
   * Create an HTML element for an effect's icon
   * @param {Object|string} effectOrId - Effect data or effect ID
   * @param {Object} [options] - Options for createIconElement
   * @returns {Promise<HTMLElement|null>}
   */
  async createEffectIconElement(effectOrId, options = {}) {
    const iconInfo = await this.getEffectIcon(effectOrId);
    if (iconInfo.type === 'sprite' && iconInfo.iconId) {
      return this.createIconElement(iconInfo.iconId, options);
    }
    return null;
  }

  /**
   * Create an HTML element for an enemy's icon
   * @param {Object|string} enemyOrId - Enemy data or enemy ID
   * @param {Object} [options] - Options for createIconElement
   * @returns {Promise<HTMLElement|null>}
   */
  async createEnemyIconElement(enemyOrId, options = {}) {
    const iconInfo = await this.getEnemyIcon(enemyOrId);
    if (iconInfo.type === 'sprite' && iconInfo.iconId) {
      return this.createIconElement(iconInfo.iconId, { scale: 1.5, ...options });
    }
    return null;
  }

  /**
   * Get a UI icon by category
   * @param {string} category - Icon category (stat, action, rarity, etc.)
   * @param {string} name - Icon name within category
   * @returns {Object} Resolved icon info
   */
  getUIIcon(category, name) {
    const iconId = `${category}_${name}`;
    return this.resolveIcon({ type: 'sprite', sheetId: 'ui_icons', iconId });
  }

  /**
   * Get a stat icon
   * @param {string} statName - Stat name (strength, vitality, etc.)
   * @returns {Object} Resolved icon info
   */
  getStatIcon(statName) {
    return this.getUIIcon('stat', statName);
  }

  /**
   * Get an action icon
   * @param {string} actionName - Action name (attack, defend, flee, etc.)
   * @returns {Object} Resolved icon info
   */
  getActionTypeIcon(actionName) {
    return this.getUIIcon('action', actionName);
  }

  /**
   * Get a rarity icon/indicator
   * @param {string} rarity - Rarity level (common, uncommon, rare, etc.)
   * @returns {Object} Resolved icon info
   */
  getRarityIcon(rarity) {
    return this.getUIIcon('rarity', rarity);
  }

  /**
   * Batch resolve icons for multiple items
   * @param {Object[]} items - Array of items with icon fields
   * @returns {Map<string, Object>} Map of item ID to resolved icon info
   */
  resolveItemIcons(items) {
    const iconMap = new Map();
    for (const item of items) {
      if (item && item.id) {
        iconMap.set(item.id, this.resolveIcon(item.icon));
      }
    }
    return iconMap;
  }

  /**
   * Batch resolve icons for multiple effects
   * @param {Object[]} effects - Array of effects with icon fields
   * @returns {Map<string, Object>} Map of effect ID to resolved icon info
   */
  resolveEffectIcons(effects) {
    const iconMap = new Map();
    for (const effect of effects) {
      if (effect && effect.id) {
        iconMap.set(effect.id, this.resolveIcon(effect.icon));
      }
    }
    return iconMap;
  }

  /**
   * Generate loot from context tags
   * @param {string[]} contextTags - Tags from location, enemy, etc.
   * @param {Object} playerState - Player state for modifiers
   * @param {number} [rollCount] - Optional roll count override
   * @returns {Object[]} Generated loot items
   */
  generateLoot(contextTags, playerState, rollCount = null) {
    if (!this.lootTableSystem) return [];

    const tables = this.lootTableSystem.selectTables(contextTags, playerState);
    return this.lootTableSystem.generateLoot(tables, playerState, rollCount);
  }

  /**
   * Get loot tables matching tags
   * @param {string[]} tags - Tags to match
   * @returns {Object[]} Matching loot tables
   */
  getLootTablesByTags(tags) {
    if (!this.lootTableSystem) return [];
    return this.lootTableSystem.getTablesByTags(tags);
  }

  /**
   * Roll for an encounter at a location
   * @param {Object} location - Location data
   * @param {Object} playerState - Player state
   * @returns {Object} Encounter roll result
   */
  rollForEncounter(location, playerState) {
    if (!this.encounterTableSystem) {
      return { shouldEncounter: false, adjustedChance: 0 };
    }
    return this.encounterTableSystem.rollForEncounter(location, playerState);
  }

  /**
   * Get encounter tables matching location and player state
   * @param {string[]} locationTags - Location tags
   * @param {Object} playerState - Player state
   * @returns {Object} Selection result with tables and metadata
   */
  selectEncounterTables(locationTags, playerState) {
    if (!this.encounterTableSystem) {
      return { tables: [], metadata: [], allContextTags: locationTags };
    }
    return this.encounterTableSystem.selectEncounterTables(locationTags, playerState);
  }

  /**
   * Get active condition modifiers for player state
   * @param {Object} playerState - Player state
   * @returns {Object} Active modifiers
   */
  getActiveModifiers(playerState) {
    if (!this.conditionEvaluator) {
      return { encounterTags: [], encounterRateMultiplier: 1.0, lootModifiers: {} };
    }
    return this.conditionEvaluator.getActiveEncounterModifiers(playerState);
  }

  /**
   * Get loaded data packs info
   * @returns {Object[]} Array of pack info
   */
  getLoadedPacks() {
    if (!this.dataPackManager) return [];
    return this.dataPackManager.getLoadedPacks();
  }

  /**
   * Reload a specific data pack (for development)
   * @param {string} packId - Pack ID to reload
   * @returns {Promise<void>}
   */
  async reloadPack(packId) {
    if (!this.dataPackManager) {
      throw new Error('DataPack system not enabled');
    }

    await this.dataPackManager.reloadPack(packId);

    // Reinitialize subsystems
    if (this.spriteManager) {
      await this.spriteManager.reload(this.dataPackManager);
    }
    if (this.lootTableSystem) {
      await this.lootTableSystem.initialize(this.dataPackManager, this.conditionEvaluator);
    }
    if (this.encounterTableSystem) {
      await this.encounterTableSystem.initialize(this.dataPackManager, this.conditionEvaluator);
    }
  }
}

// Singleton instance for convenience
let registryInstance = null;

export function getRegistry() {
  return registryInstance;
}

export function initRegistry(manifestUrl, options) {
  registryInstance = new DataRegistry(manifestUrl, options);
  return registryInstance;
}

export default DataRegistry;
