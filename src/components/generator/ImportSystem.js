/**
 * ImportSystem - Handles importing content files with backwards compatibility
 *
 * Features:
 * - Import JSON files (single or multiple)
 * - Import ZIP archives containing multiple content files
 * - Schema validation and migration
 * - Track unresolved/unmapped fields
 * - Support for items, characters, locations, enemies, scenes, etc.
 */

import JSZip from 'jszip';

// ============================================================================
// SCHEMA DEFINITIONS - Current expected fields for each content type
// ============================================================================

export const CURRENT_SCHEMAS = {
  item: {
    required: ['id', 'name'],
    optional: [
      'description', 'type', 'rarity', 'value', 'stackable', 'maxStack',
      'isEquippable', 'equipSlots', 'tags', 'icon', 'paperdoll', 'baseStats',
      'effects', 'requirements'
    ],
    nested: {
      icon: ['type', 'sheetId', 'iconId'],
      paperdoll: ['enabled', 'folder', 'filename', 'layer', 'zIndexOffset'],
      baseStats: ['attack', 'defense', 'strength', 'vitality', 'intelligence', 'willpower', 'speed', 'evasion'],
      requirements: ['level', 'strength', 'intelligence']
    },
    defaults: {
      type: 'misc',
      rarity: 'common',
      value: 10,
      stackable: false,
      maxStack: 1,
      isEquippable: false,
      equipSlots: [],
      tags: [],
      icon: { type: 'sprite', sheetId: 'items', iconId: 'default' },
      paperdoll: { enabled: false, folder: '', filename: '', layer: '', zIndexOffset: 0 },
      baseStats: { attack: 0, defense: 0, strength: 0, vitality: 0, intelligence: 0, willpower: 0, speed: 0, evasion: 0 },
      effects: [],
      requirements: { level: 1, strength: 0, intelligence: 0 }
    }
  },

  character: {
    required: ['id', 'name'],
    optional: [
      'description', 'species', 'gender', 'bodyType', 'paperdollFolder',
      'baseStats', 'paperdoll', 'appearance', 'startingEquipment', 'startingItems',
      'backstory', 'personality', 'portrait'
    ],
    nested: {
      baseStats: ['strength', 'vitality', 'intelligence', 'willpower', 'speed', 'charm', 'luck'],
      paperdoll: ['startingBase', 'hasBreasts', 'startingCupSize', 'maxCupSize', 'genitaliaType', 'faceStyle', 'faceVariants'],
      appearance: ['skinColor', 'hairColor', 'eyeColor', 'furColor']
    },
    defaults: {
      species: 'human',
      gender: 'female',
      bodyType: 'average',
      paperdollFolder: '',
      baseStats: { strength: 5, vitality: 5, intelligence: 5, willpower: 5, speed: 5, charm: 5, luck: 5 },
      paperdoll: { startingBase: 0, hasBreasts: true, startingCupSize: 'flat', maxCupSize: 'dd', genitaliaType: 'vagina', faceStyle: 'default', faceVariants: 1 },
      appearance: { skinColor: '#e8c4a0', hairColor: '#3d2314', eyeColor: '#4a90d9', furColor: null },
      startingEquipment: [],
      startingItems: [],
      backstory: '',
      personality: '',
      portrait: ''
    }
  },

  location: {
    required: ['id', 'name'],
    optional: [
      'description', 'type', 'tags', 'parentRegion', 'dangerLevel',
      'encounters', 'npcs', 'shops', 'services', 'connections',
      'discoverable', 'hidden', 'requirements', 'mapPosition', 'icon'
    ],
    defaults: {
      type: 'generic',
      tags: [],
      dangerLevel: 1,
      encounters: [],
      npcs: [],
      shops: [],
      services: [],
      connections: [],
      discoverable: true,
      hidden: false
    }
  },

  enemy: {
    required: ['id', 'name'],
    optional: [
      'description', 'type', 'level', 'stats', 'resistances', 'rewards',
      'abilities', 'tags', 'sprite', 'nsfwActions', 'drops'
    ],
    defaults: {
      type: 'beast',
      level: 1,
      stats: {},
      resistances: {},
      rewards: {},
      abilities: [],
      tags: [],
      nsfwActions: []
    }
  },

  scene: {
    required: ['id'],
    optional: [
      'name', 'description', 'nodes', 'startNode', 'tags', 'conditions',
      'variables', 'flags'
    ],
    defaults: {
      nodes: {},
      startNode: 'start',
      tags: [],
      conditions: [],
      variables: {},
      flags: {}
    }
  }
};

// ============================================================================
// FIELD MIGRATIONS - How to map old field names to new ones
// ============================================================================

export const FIELD_MIGRATIONS = {
  item: {
    // Old field name -> New field name or transformation function
    'slot': (value) => ({ field: 'equipSlots', value: value ? [value] : [] }),
    'equipSlot': (value) => ({ field: 'equipSlots', value: value ? [value] : [] }),
    'equipment_slot': (value) => ({ field: 'equipSlots', value: value ? [value] : [] }),
    'paperdollImage': (value) => {
      if (!value) return null;
      const parts = value.split('/');
      return {
        field: 'paperdoll',
        value: {
          enabled: true,
          folder: parts.length > 1 ? parts.slice(0, -1).join('/') : '',
          filename: parts[parts.length - 1].replace(/\.[^/.]+$/, ''),
          layer: '',
          zIndexOffset: 0
        }
      };
    },
    'paperdoll.imagePath': (value) => {
      if (!value) return null;
      const parts = value.split('/');
      return {
        field: 'paperdoll.folder',
        value: parts.length > 1 ? parts.slice(0, -1).join('/') : '',
        additional: {
          'paperdoll.filename': parts[parts.length - 1].replace(/\.[^/.]+$/, '')
        }
      };
    },
    'equippable': (value) => ({ field: 'isEquippable', value: Boolean(value) }),
    'is_equippable': (value) => ({ field: 'isEquippable', value: Boolean(value) }),
    'base_stats': (value) => ({ field: 'baseStats', value }),
    'stat_bonuses': (value) => ({ field: 'baseStats', value }),
    'stats': (value) => ({ field: 'baseStats', value }),
  },

  character: {
    'image': (value) => ({ field: 'portrait', value }),
    'portrait_image': (value) => ({ field: 'portrait', value }),
    'folder': (value) => ({ field: 'paperdollFolder', value }),
    'imageFolder': (value) => ({ field: 'paperdollFolder', value }),
    'base_stats': (value) => ({ field: 'baseStats', value }),
    'starting_base': (value) => ({ field: 'paperdoll.startingBase', value }),
  },

  location: {
    'danger': (value) => ({ field: 'dangerLevel', value }),
    'danger_level': (value) => ({ field: 'dangerLevel', value }),
    'parent': (value) => ({ field: 'parentRegion', value }),
    'region': (value) => ({ field: 'parentRegion', value }),
  },

  enemy: {
    'enemy_type': (value) => ({ field: 'type', value }),
    'monster_type': (value) => ({ field: 'type', value }),
  }
};

// ============================================================================
// IMPORT RESULT CLASS
// ============================================================================

export class ImportResult {
  constructor() {
    this.items = [];
    this.characters = [];
    this.locations = [];
    this.enemies = [];
    this.scenes = [];
    this.warnings = [];
    this.errors = [];
    this.unmappedFields = [];
  }

  addWarning(contentType, itemId, message, data = null) {
    this.warnings.push({
      id: `${contentType}_${itemId}_${Date.now()}`,
      contentType,
      itemId,
      message,
      data,
      resolved: false
    });
  }

  addError(contentType, itemId, message, data = null) {
    this.errors.push({
      id: `${contentType}_${itemId}_${Date.now()}`,
      contentType,
      itemId,
      message,
      data
    });
  }

  addUnmappedField(contentType, itemId, fieldName, value) {
    this.unmappedFields.push({
      id: `${contentType}_${itemId}_${fieldName}_${Date.now()}`,
      contentType,
      itemId,
      fieldName,
      value,
      resolved: false,
      resolution: null // 'mapped', 'ignored', 'copied'
    });
  }

  get hasIssues() {
    return this.warnings.length > 0 || this.errors.length > 0 || this.unmappedFields.length > 0;
  }

  get unresolvedCount() {
    return this.unmappedFields.filter(f => !f.resolved).length +
           this.warnings.filter(w => !w.resolved).length;
  }
}

// ============================================================================
// IMPORT SYSTEM CLASS
// ============================================================================

export class ImportSystem {
  constructor() {
    this.result = new ImportResult();
  }

  /**
   * Detect content type from data structure
   */
  detectContentType(data) {
    // Check for array wrapper
    if (data.items) return { type: 'item', data: data.items };
    if (data.characters) return { type: 'character', data: data.characters };
    if (data.locations) return { type: 'location', data: data.locations };
    if (data.enemies) return { type: 'enemy', data: data.enemies };
    if (data.scenes) return { type: 'scene', data: data.scenes };

    // Check single object by fields
    if (data.id) {
      if (data.equipSlots || data.slot || data.equipSlot || data.paperdoll?.layer) {
        return { type: 'item', data: [data] };
      }
      if (data.paperdollFolder || data.paperdoll?.startingBase !== undefined) {
        return { type: 'character', data: [data] };
      }
      if (data.dangerLevel !== undefined || data.connections) {
        return { type: 'location', data: [data] };
      }
      if (data.abilities || data.nsfwActions) {
        return { type: 'enemy', data: [data] };
      }
      if (data.nodes || data.startNode) {
        return { type: 'scene', data: [data] };
      }
    }

    return null;
  }

  /**
   * Migrate a single field using migration rules
   */
  migrateField(contentType, fieldName, value, targetObj) {
    const migrations = FIELD_MIGRATIONS[contentType];
    if (!migrations || !migrations[fieldName]) {
      return false;
    }

    const migration = migrations[fieldName];
    const result = typeof migration === 'function' ? migration(value) : migration;

    if (!result) return false;

    // Handle nested field paths (e.g., 'paperdoll.folder')
    if (result.field.includes('.')) {
      const parts = result.field.split('.');
      let current = targetObj;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = result.value;
    } else {
      targetObj[result.field] = result.value;
    }

    // Handle additional fields from migration
    if (result.additional) {
      for (const [addField, addValue] of Object.entries(result.additional)) {
        if (addField.includes('.')) {
          const parts = addField.split('.');
          let current = targetObj;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) current[parts[i]] = {};
            current = current[parts[i]];
          }
          current[parts[parts.length - 1]] = addValue;
        } else {
          targetObj[addField] = addValue;
        }
      }
    }

    return true;
  }

  /**
   * Validate and migrate a single content item
   */
  validateAndMigrate(contentType, data) {
    const schema = CURRENT_SCHEMAS[contentType];
    if (!schema) {
      this.result.addError(contentType, data.id || 'unknown', `Unknown content type: ${contentType}`);
      return null;
    }

    // Check required fields
    for (const field of schema.required) {
      if (!data[field]) {
        this.result.addError(contentType, data.id || 'unknown', `Missing required field: ${field}`);
        return null;
      }
    }

    // Build migrated object with defaults
    const migrated = JSON.parse(JSON.stringify(schema.defaults));
    const knownFields = new Set([...schema.required, ...schema.optional]);
    const processedFields = new Set();

    // Copy known fields
    for (const field of [...schema.required, ...schema.optional]) {
      if (data[field] !== undefined) {
        // Handle nested objects
        if (schema.nested && schema.nested[field] && typeof data[field] === 'object') {
          migrated[field] = { ...migrated[field], ...data[field] };
        } else {
          migrated[field] = data[field];
        }
        processedFields.add(field);
      }
    }

    // Process unknown fields - try migration first
    for (const [fieldName, value] of Object.entries(data)) {
      if (processedFields.has(fieldName)) continue;
      if (knownFields.has(fieldName)) continue;

      // Try to migrate the field
      const migrated_success = this.migrateField(contentType, fieldName, value, migrated);

      if (migrated_success) {
        this.result.addWarning(
          contentType,
          data.id,
          `Field "${fieldName}" was automatically migrated`,
          { originalField: fieldName, originalValue: value }
        );
      } else {
        // Field couldn't be migrated - track as unmapped
        this.result.addUnmappedField(contentType, data.id, fieldName, value);
      }
    }

    // Handle special migrations based on content patterns

    // Item: Convert single slot to array
    if (contentType === 'item') {
      if (migrated.equipSlots && migrated.equipSlots.length > 0) {
        migrated.isEquippable = true;
      }
      // Ensure equipSlots is always an array
      if (migrated.equipSlots && !Array.isArray(migrated.equipSlots)) {
        migrated.equipSlots = [migrated.equipSlots];
      }
    }

    return migrated;
  }

  /**
   * Parse a JSON file
   */
  async parseJsonFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (err) {
          reject(new Error(`Invalid JSON in ${file.name}: ${err.message}`));
        }
      };
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsText(file);
    });
  }

  /**
   * Parse a ZIP file
   */
  async parseZipFile(file) {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    const jsonFiles = [];

    for (const [path, zipEntry] of Object.entries(contents.files)) {
      if (zipEntry.dir) continue;
      if (!path.endsWith('.json')) continue;

      try {
        const content = await zipEntry.async('string');
        const data = JSON.parse(content);
        jsonFiles.push({ path, data });
      } catch (err) {
        this.result.addError('file', path, `Failed to parse: ${err.message}`);
      }
    }

    return jsonFiles;
  }

  /**
   * Process imported data
   */
  processData(data, sourcePath = 'unknown') {
    const detected = this.detectContentType(data);

    if (!detected) {
      this.result.addError('unknown', sourcePath, 'Could not detect content type');
      return;
    }

    const { type, data: items } = detected;

    for (const item of items) {
      const migrated = this.validateAndMigrate(type, item);
      if (migrated) {
        switch (type) {
          case 'item':
            this.result.items.push(migrated);
            break;
          case 'character':
            this.result.characters.push(migrated);
            break;
          case 'location':
            this.result.locations.push(migrated);
            break;
          case 'enemy':
            this.result.enemies.push(migrated);
            break;
          case 'scene':
            this.result.scenes.push(migrated);
            break;
        }
      }
    }
  }

  /**
   * Import from files (main entry point)
   */
  async importFiles(files) {
    this.result = new ImportResult();

    for (const file of files) {
      try {
        if (file.name.endsWith('.zip')) {
          const jsonFiles = await this.parseZipFile(file);
          for (const { path, data } of jsonFiles) {
            this.processData(data, path);
          }
        } else if (file.name.endsWith('.json')) {
          const data = await this.parseJsonFile(file);
          this.processData(data, file.name);
        } else {
          this.result.addError('file', file.name, 'Unsupported file type. Please use .json or .zip files.');
        }
      } catch (err) {
        this.result.addError('file', file.name, err.message);
      }
    }

    return this.result;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get available fields for mapping an unmapped field
 */
export function getAvailableFieldsForMapping(contentType, currentData) {
  const schema = CURRENT_SCHEMAS[contentType];
  if (!schema) return [];

  const allFields = [...schema.required, ...schema.optional];
  const availableFields = [];

  for (const field of allFields) {
    // Check if field is empty or default
    const currentValue = currentData[field];
    const defaultValue = schema.defaults[field];

    const isEmpty = currentValue === undefined ||
                    currentValue === null ||
                    currentValue === '' ||
                    (Array.isArray(currentValue) && currentValue.length === 0) ||
                    JSON.stringify(currentValue) === JSON.stringify(defaultValue);

    availableFields.push({
      field,
      isEmpty,
      currentValue,
      defaultValue
    });
  }

  return availableFields;
}

/**
 * Apply a field mapping resolution
 */
export function applyFieldMapping(contentType, targetData, fieldName, value) {
  const schema = CURRENT_SCHEMAS[contentType];
  if (!schema) return false;

  // Handle nested field paths
  if (fieldName.includes('.')) {
    const parts = fieldName.split('.');
    let current = targetData;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  } else {
    targetData[fieldName] = value;
  }

  return true;
}

export default ImportSystem;
