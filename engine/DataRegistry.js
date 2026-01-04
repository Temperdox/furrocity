/**
 * DataRegistry - Async content lookup system with lazy loading and caching
 * 
 * Usage:
 *   const registry = new DataRegistry('/content/manifest.json');
 *   await registry.init();
 *   const sword = await registry.getItem('iron_sword');
 *   const goblins = await registry.queryItemsByTag('goblin');
 */

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
  constructor(manifestUrl = '/content/manifest.json', options = {}) {
    this.manifestUrl = manifestUrl;
    this.manifest = null;
    this.indexes = {};
    this.loadedChunks = new Map(); // chunkId -> chunk data
    this.itemCache = new LRUCache(options.cacheSize || 2000);
    this.persistentCache = options.useIndexedDB !== false ? new ContentCache() : null;
    this.pendingChunks = new Map(); // chunkId -> Promise (prevent duplicate fetches)
    this.baseUrl = options.baseUrl || '/content';
    this.initialized = false;
    
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
      quests: { idPrefix: 'quest:', chunkPrefix: 'quests_' }
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
    
    // Load manifest
    await this.loadManifest();
    
    // Load indexes
    await this.loadIndexes();
    
    this.initialized = true;
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
    const itemChunks = Object.keys(this.manifest.chunks).filter(k => k.startsWith('items_'));
    for (const chunkId of itemChunks) {
      const chunk = await this.loadChunk(chunkId);
      const item = chunk.items?.[itemId] || chunk[itemId];
      if (item) {
        this.itemCache.set(cacheKey, item);
        return item;
      }
    }
    
    return null;
  }

  async getScene(sceneId) {
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
  }

  async clearPersistentCache() {
    if (this.persistentCache) {
      await this.persistentCache.clearAll();
    }
  }

  getStats() {
    return {
      loadedChunks: this.loadedChunks.size,
      cachedItems: this.itemCache.cache.size,
      manifestVersion: this.manifest?.version
    };
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
