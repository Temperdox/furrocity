/**
 * DataPackManager - Multi-pack data system with override resolution
 *
 * Manages loading and merging multiple data packs with Minecraft-style
 * load order and content override capability.
 *
 * @module engine/DataPackManager
 */

/**
 * @typedef {Object} PackManifest
 * @property {string} id - Unique pack identifier
 * @property {string} name - Display name
 * @property {string} version - Semantic version
 * @property {string} [author] - Pack author
 * @property {string} [description] - Pack description
 * @property {string[]} [dependencies] - Required pack IDs
 * @property {number} [loadPriority] - Load order (lower = earlier, default 0)
 * @property {Object.<string, ContentTypeConfig>} contentTypes - Content type configurations
 * @property {Object.<string, string[]>} [overrides] - Content IDs this pack overrides
 */

/**
 * @typedef {Object} ContentTypeConfig
 * @property {string} path - Relative path within pack
 * @property {string[]} files - File patterns to load (supports wildcards)
 */

/**
 * @typedef {Object} LoadedPack
 * @property {string} id - Pack ID
 * @property {string} path - Absolute path to pack directory
 * @property {PackManifest} manifest - Pack manifest
 * @property {Object.<string, Object[]>} content - Loaded content by type
 * @property {boolean} loaded - Whether content has been loaded
 */

/**
 * @typedef {Object} ContentEntry
 * @property {string} id - Content item ID
 * @property {string} sourcePackId - Pack that provided this content
 * @property {string[]} overrideChain - Pack IDs that have overridden this content
 * @property {Object} data - The actual content data
 */

// Content types supported by the system
const CONTENT_TYPES = [
  'sprites',
  'loot_tables',
  'encounter_tables',
  'conditions',
  'items',
  'enemies',
  'locations',
  'effects',
  'substances',
  'scenes'
];

class DataPackManager {
  constructor(options = {}) {
    /**
     * Base directory for datapacks
     * @type {string}
     */
    this.baseDir = options.baseDir || '/datapacks';

    /**
     * All discovered packs
     * @type {Map<string, LoadedPack>}
     */
    this.packs = new Map();

    /**
     * Merged content registry (final resolved content)
     * @type {Map<string, Map<string, ContentEntry>>}
     */
    this.contentRegistry = new Map();

    /**
     * Pack load order (sorted by priority)
     * @type {string[]}
     */
    this.loadOrder = [];

    /**
     * Sprite sheet definitions (merged from all packs)
     * @type {Object[]}
     */
    this.spriteSheets = [];

    /**
     * Whether the manager has been initialized
     * @type {boolean}
     */
    this.initialized = false;

    /**
     * Fetch function (can be overridden for testing)
     * @type {Function}
     */
    this.fetchFn = options.fetchFn || fetch.bind(window);

    // Initialize content registry with empty maps for each type
    for (const type of CONTENT_TYPES) {
      this.contentRegistry.set(type, new Map());
    }
  }

  /**
   * Discover all packs in the datapacks directory
   * @returns {Promise<string[]>} Array of pack IDs found
   */
  async discoverPacks() {
    try {
      // Try to load pack index (generated at build time or manually maintained)
      const indexResponse = await this.fetchFn(`${this.baseDir}/index.json`);
      if (indexResponse.ok) {
        const index = await indexResponse.json();
        const packIds = index.packs || [];

        for (const packId of packIds) {
          await this.loadPackManifest(packId);
        }

        return packIds;
      }
    } catch (e) {
      console.warn('No pack index found, attempting to load core pack only');
    }

    // Fallback: try to load just the core pack
    try {
      await this.loadPackManifest('core');
      return ['core'];
    } catch (e) {
      console.error('Failed to load core pack:', e);
      throw new Error('No data packs could be loaded. Ensure datapacks/core/pack.json exists.');
    }
  }

  /**
   * Load a pack's manifest file
   * @param {string} packId - Pack identifier
   * @returns {Promise<LoadedPack>}
   */
  async loadPackManifest(packId) {
    const packPath = `${this.baseDir}/${packId}`;
    const manifestUrl = `${packPath}/pack.json`;

    try {
      const response = await this.fetchFn(manifestUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const manifest = await response.json();

      // Validate manifest
      if (!manifest.id) {
        manifest.id = packId;
      }
      if (manifest.id !== packId) {
        console.warn(`Pack ID mismatch: folder '${packId}' contains pack '${manifest.id}'`);
      }

      // Set defaults
      manifest.loadPriority = manifest.loadPriority ?? 0;
      manifest.dependencies = manifest.dependencies || [];
      manifest.contentTypes = manifest.contentTypes || {};

      const loadedPack = {
        id: manifest.id,
        path: packPath,
        manifest,
        content: {},
        loaded: false
      };

      this.packs.set(manifest.id, loadedPack);
      return loadedPack;

    } catch (e) {
      throw new Error(`Failed to load pack manifest for '${packId}': ${e.message}`);
    }
  }

  /**
   * Resolve pack dependencies and determine load order
   * @returns {string[]} Sorted pack IDs
   * @throws {Error} If circular dependency or missing dependency detected
   */
  resolveDependencies() {
    const resolved = [];
    const unresolved = new Set(this.packs.keys());
    const resolving = new Set();

    const resolve = (packId) => {
      if (resolved.includes(packId)) return;
      if (resolving.has(packId)) {
        throw new Error(`Circular dependency detected involving pack: ${packId}`);
      }
      if (!this.packs.has(packId)) {
        throw new Error(`Missing dependency: ${packId}`);
      }

      resolving.add(packId);

      const pack = this.packs.get(packId);
      for (const depId of pack.manifest.dependencies) {
        resolve(depId);
      }

      resolving.delete(packId);
      unresolved.delete(packId);
      resolved.push(packId);
    };

    // Resolve all packs
    for (const packId of this.packs.keys()) {
      resolve(packId);
    }

    // Sort by load priority (within dependency constraints)
    resolved.sort((a, b) => {
      const packA = this.packs.get(a);
      const packB = this.packs.get(b);

      // If A depends on B, A must come after B
      if (packA.manifest.dependencies.includes(b)) return 1;
      if (packB.manifest.dependencies.includes(a)) return -1;

      // Otherwise sort by priority
      return packA.manifest.loadPriority - packB.manifest.loadPriority;
    });

    return resolved;
  }

  /**
   * Load all content from a pack
   * @param {string} packId - Pack ID to load
   * @returns {Promise<void>}
   */
  async loadPackContent(packId) {
    const pack = this.packs.get(packId);
    if (!pack) {
      throw new Error(`Pack not found: ${packId}`);
    }

    if (pack.loaded) return;

    const contentTypes = pack.manifest.contentTypes;

    for (const [type, config] of Object.entries(contentTypes)) {
      if (!CONTENT_TYPES.includes(type)) {
        console.warn(`Unknown content type '${type}' in pack '${packId}'`);
        continue;
      }

      pack.content[type] = [];

      const basePath = `${pack.path}/${config.path}`;
      const files = config.files || [];

      for (const filePattern of files) {
        // Handle wildcards
        if (filePattern.includes('*')) {
          // For wildcards, we need a file list (could be provided in manifest)
          if (config.fileList) {
            for (const file of config.fileList) {
              if (this.matchPattern(file, filePattern)) {
                await this.loadContentFile(pack, type, `${basePath}${file}`);
              }
            }
          } else {
            console.warn(`Wildcard pattern '${filePattern}' in pack '${packId}' requires fileList in manifest`);
          }
        } else {
          await this.loadContentFile(pack, type, `${basePath}${filePattern}`);
        }
      }
    }

    pack.loaded = true;
  }

  /**
   * Load a single content file
   * @param {LoadedPack} pack - Pack being loaded
   * @param {string} type - Content type
   * @param {string} url - URL to load
   * @returns {Promise<void>}
   */
  async loadContentFile(pack, type, url) {
    try {
      const response = await this.fetchFn(url);
      if (!response.ok) {
        console.warn(`Failed to load ${url}: HTTP ${response.status}`);
        return;
      }

      const data = await response.json();

      // Handle both array and object formats
      if (Array.isArray(data)) {
        pack.content[type].push(...data);
      } else if (data.entries && Array.isArray(data.entries)) {
        // Format: { entries: [...] }
        pack.content[type].push(...data.entries);
      } else if (data.sheets && type === 'sprites') {
        // Sprite sheet format: { sheets: [...] }
        pack.content[type].push(...data.sheets);
      } else if (typeof data === 'object' && data.id) {
        // Single item with ID
        pack.content[type].push(data);
      } else if (typeof data === 'object') {
        // Object format where keys are IDs
        for (const [id, item] of Object.entries(data)) {
          if (typeof item === 'object' && !item.id) {
            item.id = id;
          }
          pack.content[type].push(item);
        }
      }

    } catch (e) {
      console.warn(`Error loading content file ${url}:`, e);
    }
  }

  /**
   * Match a filename against a glob pattern
   * @param {string} filename - File name to test
   * @param {string} pattern - Glob pattern (supports * and **)
   * @returns {boolean}
   */
  matchPattern(filename, pattern) {
    const regex = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '{{GLOBSTAR}}')
      .replace(/\*/g, '[^/]*')
      .replace(/{{GLOBSTAR}}/g, '.*');
    return new RegExp(`^${regex}$`).test(filename);
  }

  /**
   * Merge all loaded pack content with override resolution
   * Later packs in load order override earlier packs
   */
  mergeContent() {
    // Clear existing merged content
    for (const type of CONTENT_TYPES) {
      this.contentRegistry.get(type).clear();
    }
    this.spriteSheets = [];

    // Process packs in load order
    for (const packId of this.loadOrder) {
      const pack = this.packs.get(packId);
      if (!pack || !pack.loaded) continue;

      for (const [type, items] of Object.entries(pack.content)) {
        const typeRegistry = this.contentRegistry.get(type);
        if (!typeRegistry) continue;

        for (const item of items) {
          if (!item.id && type !== 'sprites') {
            console.warn(`Content item without ID in pack '${packId}', type '${type}'`);
            continue;
          }

          // Handle sprite sheets specially (merge, don't override)
          if (type === 'sprites') {
            this.mergeSpriteSheet(item, packId);
            continue;
          }

          const existingEntry = typeRegistry.get(item.id);

          if (existingEntry) {
            // Override existing content
            existingEntry.data = { ...existingEntry.data, ...item };
            existingEntry.sourcePackId = packId;
            existingEntry.overrideChain.push(packId);
          } else {
            // New content
            typeRegistry.set(item.id, {
              id: item.id,
              sourcePackId: packId,
              overrideChain: [packId],
              data: item
            });
          }
        }
      }
    }
  }

  /**
   * Merge a sprite sheet definition
   * @param {Object} sheet - Sprite sheet definition
   * @param {string} packId - Source pack ID
   */
  mergeSpriteSheet(sheet, packId) {
    const existingIndex = this.spriteSheets.findIndex(s => s.id === sheet.id);

    if (existingIndex >= 0) {
      // Merge icons into existing sheet
      const existing = this.spriteSheets[existingIndex];
      existing.icons = { ...existing.icons, ...sheet.icons };
      existing.sourcePackId = packId;

      // Update path if provided
      if (sheet.path) {
        existing.path = sheet.path;
      }
    } else {
      // Add new sheet
      this.spriteSheets.push({
        ...sheet,
        sourcePackId: packId
      });
    }
  }

  /**
   * Load all packs and merge content
   * @returns {Promise<void>}
   */
  async loadAllPacks() {
    // Discover available packs
    await this.discoverPacks();

    // Resolve dependencies and determine load order
    this.loadOrder = this.resolveDependencies();

    console.log(`Loading ${this.loadOrder.length} data pack(s) in order:`, this.loadOrder);

    // Load each pack's content
    for (const packId of this.loadOrder) {
      await this.loadPackContent(packId);
    }

    // Merge content with override resolution
    this.mergeContent();

    this.initialized = true;

    console.log('Data packs loaded successfully');
    this.logContentSummary();
  }

  /**
   * Log a summary of loaded content
   */
  logContentSummary() {
    console.group('Content Summary');
    for (const [type, registry] of this.contentRegistry) {
      if (registry.size > 0) {
        console.log(`${type}: ${registry.size} items`);
      }
    }
    console.log(`sprite sheets: ${this.spriteSheets.length}`);
    console.groupEnd();
  }

  /**
   * Get content by type and ID
   * @param {string} type - Content type
   * @param {string} id - Content ID
   * @returns {Object|null} Content data or null if not found
   */
  getContentById(type, id) {
    const registry = this.contentRegistry.get(type);
    if (!registry) return null;

    const entry = registry.get(id);
    return entry ? entry.data : null;
  }

  /**
   * Get all content of a type
   * @param {string} type - Content type
   * @returns {Object[]} Array of content items
   */
  getAllContent(type) {
    const registry = this.contentRegistry.get(type);
    if (!registry) return [];

    return Array.from(registry.values()).map(entry => entry.data);
  }

  /**
   * Query content by tags
   * @param {string} type - Content type
   * @param {string[]} tags - Tags to match (AND logic)
   * @returns {Object[]} Matching content items
   */
  queryByTags(type, tags) {
    const all = this.getAllContent(type);

    return all.filter(item => {
      const itemTags = item.tags || [];
      return tags.every(tag => itemTags.includes(tag));
    });
  }

  /**
   * Query content by any tags (OR logic)
   * @param {string} type - Content type
   * @param {string[]} tags - Tags to match (OR logic)
   * @returns {Object[]} Matching content items
   */
  queryByAnyTags(type, tags) {
    const all = this.getAllContent(type);

    return all.filter(item => {
      const itemTags = item.tags || [];
      return tags.some(tag => itemTags.includes(tag));
    });
  }

  /**
   * Get all sprite sheet definitions
   * @returns {Object[]} Sprite sheet definitions
   */
  getSpriteSheets() {
    return this.spriteSheets;
  }

  /**
   * Get loaded pack information
   * @returns {Object[]} Array of pack info
   */
  getLoadedPacks() {
    return this.loadOrder.map(id => {
      const pack = this.packs.get(id);
      return {
        id: pack.id,
        name: pack.manifest.name || pack.id,
        version: pack.manifest.version,
        author: pack.manifest.author,
        description: pack.manifest.description,
        loadPriority: pack.manifest.loadPriority
      };
    });
  }

  /**
   * Get content entry with metadata (source pack, override chain)
   * @param {string} type - Content type
   * @param {string} id - Content ID
   * @returns {ContentEntry|null}
   */
  getContentEntry(type, id) {
    const registry = this.contentRegistry.get(type);
    if (!registry) return null;
    return registry.get(id) || null;
  }

  /**
   * Check if a specific pack is loaded
   * @param {string} packId - Pack ID
   * @returns {boolean}
   */
  isPackLoaded(packId) {
    const pack = this.packs.get(packId);
    return pack ? pack.loaded : false;
  }

  /**
   * Get a merged manifest suitable for DataRegistry compatibility
   * @returns {Object} Merged manifest object
   */
  getMergedManifest() {
    const manifest = {
      version: '2.0.0',
      dataPackVersion: true,
      loadedPacks: this.loadOrder,
      contentTypes: {}
    };

    for (const type of CONTENT_TYPES) {
      const registry = this.contentRegistry.get(type);
      if (registry && registry.size > 0) {
        manifest.contentTypes[type] = {
          count: registry.size,
          ids: Array.from(registry.keys())
        };
      }
    }

    return manifest;
  }

  /**
   * Reload a specific pack (for hot-reloading during development)
   * @param {string} packId - Pack ID to reload
   * @returns {Promise<void>}
   */
  async reloadPack(packId) {
    const pack = this.packs.get(packId);
    if (!pack) {
      throw new Error(`Pack not found: ${packId}`);
    }

    // Clear loaded state
    pack.loaded = false;
    pack.content = {};

    // Reload manifest
    await this.loadPackManifest(packId);

    // Reload content
    await this.loadPackContent(packId);

    // Re-merge all content
    this.mergeContent();

    console.log(`Pack '${packId}' reloaded successfully`);
  }
}

// Export for both ES modules and CommonJS
export default DataPackManager;
export { DataPackManager, CONTENT_TYPES };
