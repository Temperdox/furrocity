/**
 * SaveSystem - State serialization and persistence
 * 
 * Handles:
 * - Game state serialization/deserialization
 * - Multiple save slots
 * - Autosave functionality
 * - Save versioning and migration
 * - Compression for large saves
 */

// Current save format version
const SAVE_VERSION = 2;

// Save slot configuration
const DEFAULT_SLOTS = 5;
const AUTOSAVE_SLOT = 'autosave';

/**
 * Compress string data (simple LZ-based compression)
 */
function compressData(data) {
  try {
    // Use built-in compression if available
    if (typeof CompressionStream !== 'undefined') {
      return compressWithStream(data);
    }
    // Fallback: just return as-is
    return data;
  } catch (e) {
    console.warn('Compression failed, using uncompressed data');
    return data;
  }
}

async function compressWithStream(data) {
  const blob = new Blob([data]);
  const stream = blob.stream().pipeThrough(new CompressionStream('gzip'));
  const compressedBlob = await new Response(stream).blob();
  return await blobToBase64(compressedBlob);
}

async function decompressWithStream(base64Data) {
  const blob = base64ToBlob(base64Data);
  const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
  const decompressedBlob = await new Response(stream).blob();
  return await decompressedBlob.text();
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes]);
}

/**
 * Main Save System class
 */
export class SaveSystem {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'nsfw_rpg_saves';
    this.maxSlots = options.maxSlots || DEFAULT_SLOTS;
    this.useCompression = options.useCompression !== false;
    this.autoMigrate = options.autoMigrate !== false;
    this.callbacks = options.callbacks || {};
    
    // IndexedDB for large saves
    this.useIndexedDB = options.useIndexedDB !== false;
    this.db = null;
    this.dbName = options.dbName || 'NSFWRPGSaves';
    this.dbVersion = 1;
  }

  /**
   * Initialize the save system
   */
  async init() {
    if (this.useIndexedDB) {
      try {
        await this.initIndexedDB();
      } catch (e) {
        console.warn('IndexedDB not available, falling back to localStorage');
        this.useIndexedDB = false;
      }
    }
  }

  /**
   * Initialize IndexedDB
   */
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('saves')) {
          const store = db.createObjectStore('saves', { keyPath: 'slot' });
          store.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  /**
   * Serialize game state for saving
   */
  serializeState(gameState) {
    // Extract saveable data
    const saveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      
      // Player data
      player: {
        id: gameState.player.id,
        name: gameState.player.name,
        characterId: gameState.player.characterId,
        level: gameState.player.level,
        experience: gameState.player.experience,
        experienceToNext: gameState.player.experienceToNext,
        gold: gameState.player.gold,
        
        // Stats
        stats: { ...gameState.player.stats },
        currentHp: gameState.player.currentHp,
        maxHp: gameState.player.maxHp,
        currentStamina: gameState.player.currentStamina,
        maxStamina: gameState.player.maxStamina,
        currentMana: gameState.player.currentMana,
        maxMana: gameState.player.maxMana,
        
        // Location
        currentLocation: gameState.player.currentLocation,
        visitedLocations: [...(gameState.player.visitedLocations || [])],
        
        // Inventory (only IDs and counts for efficiency)
        inventory: (gameState.player.inventory || []).map(item => ({
          id: item.id,
          count: item.count || 1,
          uniqueId: item.uniqueId,
          curse: item.curse,
          customData: item.customData
        })),
        
        // Equipment (only IDs)
        equipment: Object.fromEntries(
          Object.entries(gameState.player.equipment || {}).map(([slot, item]) => [
            slot,
            item ? { id: item.id, uniqueId: item.uniqueId, curse: item.curse } : null
          ])
        ),
        
        // Skills
        unlockedSkills: [...(gameState.player.unlockedSkills || [])],
        skillPoints: gameState.player.skillPoints || 0,
        
        // Active effects (serialize for restoration)
        activeEffects: (gameState.player.activeEffects || []).map(effect => ({
          id: effect.id,
          instanceId: effect.instanceId,
          stacks: effect.stacks,
          intensity: effect.intensity,
          remainingDuration: effect.remainingDuration,
          remainingUses: effect.remainingUses,
          durationType: effect.durationType,
          appliedAt: effect.appliedAt
        })),
        
        // NSFW stats
        nsfwStats: gameState.player.nsfwStats ? {
          corruption: gameState.player.nsfwStats.corruption,
          purity: gameState.player.nsfwStats.purity,
          gender: gameState.player.nsfwStats.gender,
          dominance: gameState.player.nsfwStats.dominance,
          sensitiveAreas: [...(gameState.player.nsfwStats.sensitiveAreas || [])],
          hypersensitiveAreas: [...(gameState.player.nsfwStats.hypersensitiveAreas || [])],
          // Note: bodyMeasurements are calculated from gender at runtime
          orificeStats: JSON.parse(JSON.stringify(gameState.player.nsfwStats.orificeStats || {})),
          sexualHistory: { ...gameState.player.nsfwStats.sexualHistory },
          debuffs: (gameState.player.nsfwStats.debuffs || []).map(d => ({
            id: d.id,
            name: d.name,
            duration: d.duration
          })),
          curses: (gameState.player.nsfwStats.curses || []).map(c => ({
            id: c.id,
            name: c.name,
            level: c.level
          })),
          addictions: (gameState.player.nsfwStats.addictions || []).map(a => ({
            id: a.id,
            name: a.name,
            level: a.level
          }))
        } : null,
        
        // Achievements
        unlockedAchievements: [...(gameState.player.unlockedAchievements || [])],
        achievementProgress: { ...gameState.player.achievementProgress },
        
        // Quests
        activeQuests: (gameState.player.activeQuests || []).map(q => ({
          id: q.id,
          progress: q.progress
        })),
        completedQuests: [...(gameState.player.completedQuests || [])]
      },
      
      // World state
      world: {
        flags: { ...gameState.worldFlags },
        npcRelationships: { ...gameState.npcRelationships },
        discoveredSecrets: [...(gameState.discoveredSecrets || [])],
        defeatedBosses: [...(gameState.defeatedBosses || [])]
      },
      
      // Game settings
      settings: {
        difficulty: gameState.difficulty,
        enabledTags: [...(gameState.enabledTags || [])],
        disabledTags: [...(gameState.disabledTags || [])]
      },
      
      // Meta
      playTime: gameState.playTime || 0,
      saveCount: (gameState.saveCount || 0) + 1
    };
    
    return saveData;
  }

  /**
   * Deserialize save data to game state
   */
  async deserializeState(saveData, registry) {
    // Check version and migrate if needed
    if (saveData.version !== SAVE_VERSION && this.autoMigrate) {
      saveData = await this.migrateData(saveData);
    }
    
    // Reconstruct full item data from IDs
    const reconstructedInventory = await Promise.all(
      (saveData.player.inventory || []).map(async (itemRef) => {
        const itemData = await registry.getItem(itemRef.id);
        if (!itemData) {
          console.warn(`Item not found: ${itemRef.id}`);
          return null;
        }
        return {
          ...itemData,
          ...itemRef, // Include saved properties like count, curse, etc.
        };
      })
    );
    
    // Reconstruct equipment
    const reconstructedEquipment = {};
    for (const [slot, itemRef] of Object.entries(saveData.player.equipment || {})) {
      if (itemRef) {
        const itemData = await registry.getItem(itemRef.id);
        reconstructedEquipment[slot] = itemData ? { ...itemData, ...itemRef } : null;
      } else {
        reconstructedEquipment[slot] = null;
      }
    }
    
    return {
      player: {
        ...saveData.player,
        inventory: reconstructedInventory.filter(Boolean),
        equipment: reconstructedEquipment
      },
      worldFlags: saveData.world?.flags || {},
      npcRelationships: saveData.world?.npcRelationships || {},
      discoveredSecrets: saveData.world?.discoveredSecrets || [],
      defeatedBosses: saveData.world?.defeatedBosses || [],
      difficulty: saveData.settings?.difficulty || 'normal',
      enabledTags: saveData.settings?.enabledTags || [],
      disabledTags: saveData.settings?.disabledTags || [],
      playTime: saveData.playTime || 0,
      saveCount: saveData.saveCount || 0,
      loadedFromSave: true
    };
  }

  /**
   * Migrate old save data to current version
   */
  async migrateData(saveData) {
    let current = { ...saveData };
    
    // Version 1 -> 2 migration
    if (current.version === 1) {
      // Add new fields introduced in v2
      current.player.achievementProgress = current.player.achievementProgress || {};
      current.world = current.world || { flags: {}, npcRelationships: {} };
      current.version = 2;
    }
    
    // Add more migrations as needed
    
    return current;
  }

  /**
   * Save game to a slot
   */
  async save(slot, gameState) {
    try {
      const saveData = this.serializeState(gameState);
      
      // Add slot-specific metadata
      saveData.slot = slot;
      saveData.slotName = slot === AUTOSAVE_SLOT ? 'Autosave' : `Save ${slot}`;
      
      // Serialize to JSON
      let jsonData = JSON.stringify(saveData);
      
      // Compress if large and compression available
      let finalData = jsonData;
      let isCompressed = false;
      
      if (this.useCompression && jsonData.length > 10000) {
        try {
          const compressed = await compressData(jsonData);
          if (compressed.length < jsonData.length * 0.9) {
            finalData = compressed;
            isCompressed = true;
          }
        } catch (e) {
          console.warn('Compression failed:', e);
        }
      }
      
      // Store
      if (this.useIndexedDB && this.db) {
        await this.saveToIndexedDB(slot, {
          slot,
          data: finalData,
          compressed: isCompressed,
          timestamp: saveData.timestamp,
          metadata: {
            playerName: saveData.player.name,
            level: saveData.player.level,
            location: saveData.player.currentLocation,
            playTime: saveData.playTime
          }
        });
      } else {
        this.saveToLocalStorage(slot, {
          data: finalData,
          compressed: isCompressed,
          timestamp: saveData.timestamp,
          metadata: {
            playerName: saveData.player.name,
            level: saveData.player.level,
            location: saveData.player.currentLocation,
            playTime: saveData.playTime
          }
        });
      }
      
      // Callback
      if (this.callbacks.onSave) {
        await this.callbacks.onSave(slot, saveData);
      }
      
      return {
        success: true,
        slot,
        timestamp: saveData.timestamp,
        size: finalData.length
      };
    } catch (error) {
      console.error('Save failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Load game from a slot
   */
  async load(slot, registry) {
    try {
      let saveEntry;
      
      if (this.useIndexedDB && this.db) {
        saveEntry = await this.loadFromIndexedDB(slot);
      } else {
        saveEntry = this.loadFromLocalStorage(slot);
      }
      
      if (!saveEntry) {
        return { success: false, error: 'Save not found' };
      }
      
      // Decompress if needed
      let jsonData = saveEntry.data;
      if (saveEntry.compressed) {
        try {
          jsonData = await decompressWithStream(saveEntry.data);
        } catch (e) {
          console.warn('Decompression failed:', e);
          return { success: false, error: 'Failed to decompress save' };
        }
      }
      
      // Parse
      const saveData = JSON.parse(jsonData);
      
      // Deserialize
      const gameState = await this.deserializeState(saveData, registry);
      
      // Callback
      if (this.callbacks.onLoad) {
        await this.callbacks.onLoad(slot, gameState);
      }
      
      return {
        success: true,
        slot,
        gameState,
        timestamp: saveEntry.timestamp
      };
    } catch (error) {
      console.error('Load failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Autosave
   */
  async autosave(gameState) {
    return this.save(AUTOSAVE_SLOT, gameState);
  }

  /**
   * Delete a save
   */
  async deleteSave(slot) {
    try {
      if (this.useIndexedDB && this.db) {
        await this.deleteFromIndexedDB(slot);
      } else {
        this.deleteFromLocalStorage(slot);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all save slot info (for save/load menu)
   */
  async getSaveSlots() {
    const slots = [];
    
    // Regular slots
    for (let i = 1; i <= this.maxSlots; i++) {
      const info = await this.getSaveInfo(i.toString());
      slots.push({
        slot: i.toString(),
        ...info
      });
    }
    
    // Autosave
    const autosaveInfo = await this.getSaveInfo(AUTOSAVE_SLOT);
    slots.unshift({
      slot: AUTOSAVE_SLOT,
      ...autosaveInfo,
      isAutosave: true
    });
    
    return slots;
  }

  /**
   * Get info about a specific save slot
   */
  async getSaveInfo(slot) {
    try {
      let entry;
      
      if (this.useIndexedDB && this.db) {
        entry = await this.loadFromIndexedDB(slot);
      } else {
        entry = this.loadFromLocalStorage(slot);
      }
      
      if (!entry) {
        return { empty: true };
      }
      
      return {
        empty: false,
        timestamp: entry.timestamp,
        metadata: entry.metadata || {}
      };
    } catch (e) {
      return { empty: true, error: e.message };
    }
  }

  // ========================================
  // STORAGE BACKENDS
  // ========================================

  saveToLocalStorage(slot, data) {
    const key = `${this.storageKey}_${slot}`;
    localStorage.setItem(key, JSON.stringify(data));
  }

  loadFromLocalStorage(slot) {
    const key = `${this.storageKey}_${slot}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }

  deleteFromLocalStorage(slot) {
    const key = `${this.storageKey}_${slot}`;
    localStorage.removeItem(key);
  }

  async saveToIndexedDB(slot, data) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('saves', 'readwrite');
      const store = tx.objectStore('saves');
      const request = store.put(data);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadFromIndexedDB(slot) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('saves', 'readonly');
      const store = tx.objectStore('saves');
      const request = store.get(slot);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFromIndexedDB(slot) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('saves', 'readwrite');
      const store = tx.objectStore('saves');
      const request = store.delete(slot);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ========================================
  // EXPORT/IMPORT
  // ========================================

  /**
   * Export save to downloadable file
   */
  async exportSave(slot) {
    const result = await this.load(slot, { getItem: async () => null });
    if (!result.success) return result;
    
    const exportData = {
      format: 'nsfw_rpg_save',
      version: SAVE_VERSION,
      exportedAt: Date.now(),
      saveData: result.gameState
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    return { success: true, url, filename: `save_slot${slot}_${Date.now()}.json` };
  }

  /**
   * Import save from file
   */
  async importSave(file, slot, registry) {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      if (importData.format !== 'nsfw_rpg_save') {
        return { success: false, error: 'Invalid save file format' };
      }
      
      // Reconstruct and save
      const gameState = await this.deserializeState(importData.saveData, registry);
      return this.save(slot, gameState);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default SaveSystem;
