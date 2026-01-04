/**
 * SpriteSheetManager - Sprite sheet loading and icon rendering
 *
 * Manages loading sprite sheet images and rendering individual icons
 * from sprite sheets. Replaces emoji icons with proper image-based icons.
 *
 * @module engine/SpriteSheetManager
 */

/**
 * @typedef {Object} SpriteSheetDefinition
 * @property {string} id - Unique sheet identifier
 * @property {string} path - Path to sprite sheet image
 * @property {number} tileWidth - Width of each tile in pixels
 * @property {number} tileHeight - Height of each tile in pixels
 * @property {number} [columns] - Number of columns in sheet
 * @property {number} [rows] - Number of rows in sheet
 * @property {Object.<string, IconPosition>} icons - Icon ID to position mapping
 */

/**
 * @typedef {Object} IconPosition
 * @property {number} x - X position (column index or pixel offset)
 * @property {number} y - Y position (row index or pixel offset)
 * @property {number} [width] - Override width (defaults to tileWidth)
 * @property {number} [height] - Override height (defaults to tileHeight)
 * @property {boolean} [pixelCoords] - If true, x/y are pixel coordinates, not tile indices
 */

/**
 * @typedef {Object} IconData
 * @property {string} sheetId - Source sprite sheet ID
 * @property {HTMLImageElement} image - Loaded image element
 * @property {number} sx - Source X in pixels
 * @property {number} sy - Source Y in pixels
 * @property {number} width - Icon width in pixels
 * @property {number} height - Icon height in pixels
 */

/**
 * @typedef {Object} IconReference
 * @property {string} type - Always "sprite"
 * @property {string} iconId - Icon identifier
 * @property {string} [sheetId] - Optional sheet override
 * @property {string} [fallback] - Fallback icon ID if primary not found
 */

class SpriteSheetManager {
  constructor(options = {}) {
    /**
     * Loaded sprite sheet images
     * @type {Map<string, HTMLImageElement>}
     */
    this.sheetImages = new Map();

    /**
     * Sprite sheet definitions
     * @type {Map<string, SpriteSheetDefinition>}
     */
    this.sheetDefinitions = new Map();

    /**
     * Icon lookup cache (iconId -> IconData)
     * @type {Map<string, IconData>}
     */
    this.iconCache = new Map();

    /**
     * Whether sheets have been loaded
     * @type {boolean}
     */
    this.initialized = false;

    /**
     * Base path for sprite sheet images
     * @type {string}
     */
    this.basePath = options.basePath || '';

    /**
     * Default fallback icon ID
     * @type {string}
     */
    this.fallbackIconId = options.fallbackIconId || 'unknown';

    /**
     * Prerendered icon canvases for performance
     * @type {Map<string, HTMLCanvasElement>}
     */
    this.prerenderCache = new Map();

    /**
     * Maximum prerender cache size
     * @type {number}
     */
    this.maxPrerenderCache = options.maxPrerenderCache || 500;
  }

  /**
   * Load sprite sheets from DataPackManager
   * @param {DataPackManager} packManager - Initialized pack manager
   * @returns {Promise<void>}
   */
  async loadSpriteSheets(packManager) {
    const sheets = packManager.getSpriteSheets();

    console.log(`Loading ${sheets.length} sprite sheet(s)...`);

    for (const sheet of sheets) {
      await this.loadSheet(sheet, packManager);
    }

    this.buildIconCache();
    this.initialized = true;

    console.log(`Sprite sheets loaded. ${this.iconCache.size} icons available.`);
  }

  /**
   * Load a single sprite sheet
   * @param {SpriteSheetDefinition} sheet - Sheet definition
   * @param {DataPackManager} packManager - Pack manager for path resolution
   * @returns {Promise<void>}
   */
  async loadSheet(sheet, packManager) {
    if (!sheet.id || !sheet.path) {
      console.warn('Invalid sprite sheet definition:', sheet);
      return;
    }

    // Store definition
    this.sheetDefinitions.set(sheet.id, sheet);

    // Resolve path relative to pack
    let imagePath = sheet.path;
    if (sheet.sourcePackId) {
      const pack = packManager.packs.get(sheet.sourcePackId);
      if (pack) {
        imagePath = `${pack.path}/${sheet.path}`;
      }
    }

    // Load image
    try {
      const image = await this.loadImage(imagePath);
      this.sheetImages.set(sheet.id, image);

      // Auto-calculate columns/rows if not provided
      if (!sheet.columns && sheet.tileWidth) {
        sheet.columns = Math.floor(image.width / sheet.tileWidth);
      }
      if (!sheet.rows && sheet.tileHeight) {
        sheet.rows = Math.floor(image.height / sheet.tileHeight);
      }

    } catch (e) {
      console.error(`Failed to load sprite sheet '${sheet.id}' from '${imagePath}':`, e);
    }
  }

  /**
   * Load an image and return a promise
   * @param {string} src - Image source URL
   * @returns {Promise<HTMLImageElement>}
   */
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  /**
   * Build the icon lookup cache from all sheet definitions
   */
  buildIconCache() {
    this.iconCache.clear();

    for (const [sheetId, sheet] of this.sheetDefinitions) {
      const image = this.sheetImages.get(sheetId);
      if (!image) continue;

      const icons = sheet.icons || {};
      const tileWidth = sheet.tileWidth || 32;
      const tileHeight = sheet.tileHeight || 32;

      for (const [iconId, pos] of Object.entries(icons)) {
        let sx, sy, width, height;

        if (pos.pixelCoords) {
          // Position is in pixels
          sx = pos.x;
          sy = pos.y;
        } else {
          // Position is in tile indices
          sx = pos.x * tileWidth;
          sy = pos.y * tileHeight;
        }

        width = pos.width || tileWidth;
        height = pos.height || tileHeight;

        this.iconCache.set(iconId, {
          sheetId,
          image,
          sx,
          sy,
          width,
          height
        });
      }
    }
  }

  /**
   * Get icon data by ID
   * @param {string} iconId - Icon identifier
   * @returns {IconData|null}
   */
  getIcon(iconId) {
    return this.iconCache.get(iconId) || null;
  }

  /**
   * Check if an icon exists
   * @param {string} iconId - Icon identifier
   * @returns {boolean}
   */
  hasIcon(iconId) {
    return this.iconCache.has(iconId);
  }

  /**
   * Render an icon to a canvas context
   * @param {string} iconId - Icon identifier
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} dx - Destination X
   * @param {number} dy - Destination Y
   * @param {number} [dWidth] - Destination width (optional scaling)
   * @param {number} [dHeight] - Destination height (optional scaling)
   * @returns {boolean} True if icon was rendered
   */
  renderIcon(iconId, ctx, dx, dy, dWidth, dHeight) {
    const icon = this.getIcon(iconId);

    if (!icon) {
      // Try fallback
      const fallback = this.getIcon(this.fallbackIconId);
      if (fallback) {
        return this.renderIconData(fallback, ctx, dx, dy, dWidth, dHeight);
      }
      console.warn(`Icon not found: ${iconId}`);
      return false;
    }

    return this.renderIconData(icon, ctx, dx, dy, dWidth, dHeight);
  }

  /**
   * Render icon data to canvas
   * @param {IconData} icon - Icon data
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} dx - Destination X
   * @param {number} dy - Destination Y
   * @param {number} [dWidth] - Destination width
   * @param {number} [dHeight] - Destination height
   * @returns {boolean}
   */
  renderIconData(icon, ctx, dx, dy, dWidth, dHeight) {
    const w = dWidth ?? icon.width;
    const h = dHeight ?? icon.height;

    ctx.drawImage(
      icon.image,
      icon.sx, icon.sy,
      icon.width, icon.height,
      dx, dy,
      w, h
    );

    return true;
  }

  /**
   * Get CSS background-position for an icon (for CSS sprite usage)
   * @param {string} iconId - Icon identifier
   * @returns {Object|null} CSS properties or null if not found
   */
  getIconCSS(iconId) {
    const icon = this.getIcon(iconId);
    if (!icon) return null;

    const sheet = this.sheetDefinitions.get(icon.sheetId);
    if (!sheet) return null;

    return {
      backgroundImage: `url('${sheet.path}')`,
      backgroundPosition: `-${icon.sx}px -${icon.sy}px`,
      width: `${icon.width}px`,
      height: `${icon.height}px`,
      backgroundSize: 'auto'
    };
  }

  /**
   * Create a standalone canvas with the icon rendered
   * @param {string} iconId - Icon identifier
   * @param {number} [scale=1] - Scale factor
   * @returns {HTMLCanvasElement|null}
   */
  createIconCanvas(iconId, scale = 1) {
    const icon = this.getIcon(iconId);
    if (!icon) return null;

    const width = icon.width * scale;
    const height = icon.height * scale;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = scale >= 1;

    this.renderIconData(icon, ctx, 0, 0, width, height);

    return canvas;
  }

  /**
   * Get a prerendered icon canvas (cached for performance)
   * @param {string} iconId - Icon identifier
   * @param {number} [scale=1] - Scale factor
   * @returns {HTMLCanvasElement|null}
   */
  getPrerendererdIcon(iconId, scale = 1) {
    const cacheKey = `${iconId}@${scale}`;

    if (this.prerenderCache.has(cacheKey)) {
      return this.prerenderCache.get(cacheKey);
    }

    const canvas = this.createIconCanvas(iconId, scale);
    if (!canvas) return null;

    // Manage cache size
    if (this.prerenderCache.size >= this.maxPrerenderCache) {
      // Remove oldest entry
      const firstKey = this.prerenderCache.keys().next().value;
      this.prerenderCache.delete(firstKey);
    }

    this.prerenderCache.set(cacheKey, canvas);
    return canvas;
  }

  /**
   * Get icon as data URL (for use in img src)
   * @param {string} iconId - Icon identifier
   * @param {number} [scale=1] - Scale factor
   * @returns {string|null} Data URL or null if not found
   */
  getIconDataURL(iconId, scale = 1) {
    const canvas = this.createIconCanvas(iconId, scale);
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  }

  /**
   * Resolve an icon reference to actual icon data
   * Handles both old emoji format and new sprite format
   * @param {string|IconReference} iconRef - Icon reference (emoji string or sprite reference)
   * @returns {Object} Resolved icon info
   */
  resolveIconReference(iconRef) {
    // Handle string (emoji or iconId)
    if (typeof iconRef === 'string') {
      // Check if it's an emoji (contains non-ASCII characters)
      if (/[^\x00-\x7F]/.test(iconRef)) {
        return {
          type: 'emoji',
          value: iconRef
        };
      }
      // Treat as icon ID
      return {
        type: 'sprite',
        iconId: iconRef,
        data: this.getIcon(iconRef)
      };
    }

    // Handle sprite reference object
    if (iconRef && iconRef.type === 'sprite') {
      const iconData = this.getIcon(iconRef.iconId);

      if (!iconData && iconRef.fallback) {
        return {
          type: 'sprite',
          iconId: iconRef.fallback,
          data: this.getIcon(iconRef.fallback)
        };
      }

      return {
        type: 'sprite',
        iconId: iconRef.iconId,
        data: iconData
      };
    }

    // Unknown format
    return {
      type: 'unknown',
      value: iconRef
    };
  }

  /**
   * Create an img element for an icon
   * @param {string} iconId - Icon identifier
   * @param {Object} [options] - Options
   * @param {number} [options.scale=1] - Scale factor
   * @param {string} [options.className] - CSS class name
   * @param {string} [options.alt] - Alt text
   * @returns {HTMLImageElement|null}
   */
  createIconElement(iconId, options = {}) {
    const { scale = 1, className = '', alt = '' } = options;

    const dataUrl = this.getIconDataURL(iconId, scale);
    if (!dataUrl) return null;

    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = alt || iconId;
    if (className) img.className = className;

    const icon = this.getIcon(iconId);
    if (icon) {
      img.width = icon.width * scale;
      img.height = icon.height * scale;
    }

    return img;
  }

  /**
   * Get all available icon IDs
   * @returns {string[]}
   */
  getAllIconIds() {
    return Array.from(this.iconCache.keys());
  }

  /**
   * Get all icons from a specific sheet
   * @param {string} sheetId - Sheet identifier
   * @returns {string[]} Array of icon IDs
   */
  getIconsFromSheet(sheetId) {
    const icons = [];
    for (const [iconId, data] of this.iconCache) {
      if (data.sheetId === sheetId) {
        icons.push(iconId);
      }
    }
    return icons;
  }

  /**
   * Clear prerender cache
   */
  clearPrerenderCache() {
    this.prerenderCache.clear();
  }

  /**
   * Reload all sprite sheets (for hot-reloading)
   * @param {DataPackManager} packManager - Pack manager
   * @returns {Promise<void>}
   */
  async reload(packManager) {
    this.sheetImages.clear();
    this.sheetDefinitions.clear();
    this.iconCache.clear();
    this.prerenderCache.clear();
    this.initialized = false;

    await this.loadSpriteSheets(packManager);
  }

  /**
   * Get statistics about loaded sprites
   * @returns {Object}
   */
  getStats() {
    return {
      sheetsLoaded: this.sheetImages.size,
      totalIcons: this.iconCache.size,
      prerenderCacheSize: this.prerenderCache.size,
      initialized: this.initialized
    };
  }
}

// Export for both ES modules and CommonJS
export default SpriteSheetManager;
export { SpriteSheetManager };
