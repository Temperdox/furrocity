/**
 * @fileoverview NPCLocationSystem - Manages dynamic NPC locations based on time schedules
 *
 * Features:
 * - Time-based NPC schedules (e.g., at mines during day, pub at night)
 * - Temporary location overrides (clears on time period change)
 * - NPC hiding/showing for story events
 * - Interaction locks to prevent NPCs moving during player interaction
 *
 * @module engine/NPCLocationSystem
 */

import { TIME_PERIODS } from './TimeSystem.js';

/**
 * NPCLocationSystem manages where NPCs are located based on schedules and overrides
 */
export class NPCLocationSystem {
  /**
   * @param {Object} options - Configuration options
   * @param {Object} options.registry - DataRegistry for loading NPC data
   */
  constructor(options = {}) {
    this.registry = options.registry;

    // Map of npcId -> locationId for temporary overrides (clears on period change)
    this.temporaryOverrides = new Map();

    // Set of npcIds that are hidden from all locations
    this.hiddenNPCs = new Set();

    // Set of npcIds currently in interaction (won't be moved on period change)
    this.interactionLocks = new Set();

    // Cache of npc schedules for quick lookup
    this.scheduleCache = new Map();

    // Track current time period to detect changes
    this.lastTimePeriod = null;
  }

  /**
   * Get the current time period name from an hour
   * @param {number} hour - Current hour (0-23)
   * @returns {string} Period name
   */
  getTimePeriodName(hour) {
    if (hour >= 21 || hour < 5) return 'NIGHT';
    if (hour >= 5 && hour < 7) return 'DAWN';
    if (hour >= 7 && hour < 12) return 'MORNING';
    if (hour >= 12 && hour < 17) return 'AFTERNOON';
    if (hour >= 17 && hour < 20) return 'EVENING';
    if (hour >= 20 && hour < 21) return 'DUSK';
    return 'NIGHT';
  }

  /**
   * Check if we're currently in night hours
   * @param {number} hour - Current hour (0-23)
   * @returns {boolean}
   */
  isNightTime(hour) {
    return hour >= 21 || hour < 5;
  }

  /**
   * Check if we're currently in day hours
   * @param {number} hour - Current hour (0-23)
   * @returns {boolean}
   */
  isDayTime(hour) {
    return hour >= 7 && hour < 21;
  }

  /**
   * Calculate which location an NPC should be at based on their schedule
   * @param {Object} npc - NPC data object
   * @param {Object} currentTime - Current time { day, hour, minute }
   * @returns {string|null} Location ID or null if no valid location
   */
  calculateScheduledLocation(npc, currentTime) {
    const hour = currentTime?.hour ?? 8;

    // If NPC has no schedule, use default location
    if (!npc.schedule || !Array.isArray(npc.schedule) || npc.schedule.length === 0) {
      return npc.defaultLocationId || npc.locationId || null;
    }

    // Find the schedule entry that matches the current hour
    for (const slot of npc.schedule) {
      const { startHour, endHour, locationId } = slot;

      // Handle wrap-around schedules (e.g., 18:00 - 06:00)
      if (startHour > endHour) {
        // Wraps around midnight
        if (hour >= startHour || hour < endHour) {
          return locationId;
        }
      } else {
        // Normal schedule (e.g., 06:00 - 18:00)
        if (hour >= startHour && hour < endHour) {
          return locationId;
        }
      }
    }

    // If no schedule matches, fall back to default location
    return npc.defaultLocationId || npc.locationId || null;
  }

  /**
   * Get an NPC's current location, considering overrides and schedules
   * @param {string} npcId - NPC ID
   * @param {Object} currentTime - Current time { day, hour, minute }
   * @returns {string|null} Location ID or null if hidden/not found
   */
  getNPCLocation(npcId, currentTime) {
    // Hidden NPCs are not at any location
    if (this.hiddenNPCs.has(npcId)) {
      return null;
    }

    // Check for temporary override first
    if (this.temporaryOverrides.has(npcId)) {
      return this.temporaryOverrides.get(npcId);
    }

    // Get NPC data and calculate scheduled location
    const npc = this.getNPCData(npcId);
    if (!npc) {
      return null;
    }

    return this.calculateScheduledLocation(npc, currentTime);
  }

  /**
   * Get NPC data from registry or cache
   * @param {string} npcId - NPC ID
   * @returns {Object|null} NPC data or null
   */
  getNPCData(npcId) {
    if (!this.registry) {
      return null;
    }

    // Try to get from merchants first (most NPCs are merchants)
    const merchant = this.registry.getMerchant?.(npcId);
    if (merchant) {
      return merchant;
    }

    // Try generic NPC lookup
    const npc = this.registry.getNpc?.(npcId);
    if (npc) {
      return npc;
    }

    return null;
  }

  /**
   * Get all NPCs at a specific location at the given time
   * @param {string} locationId - Location ID
   * @param {Object} currentTime - Current time { day, hour, minute }
   * @param {Array} allNPCIds - Array of all NPC IDs to check
   * @returns {Array<Object>} Array of NPC objects at this location
   */
  getNPCsAtLocation(locationId, currentTime, allNPCIds = []) {
    const npcsAtLocation = [];

    for (const npcId of allNPCIds) {
      const npcLocation = this.getNPCLocation(npcId, currentTime);
      if (npcLocation === locationId) {
        const npc = this.getNPCData(npcId);
        if (npc) {
          npcsAtLocation.push(npc);
        }
      }
    }

    return npcsAtLocation;
  }

  /**
   * Teleport an NPC to a new location (temporary override)
   * This override will clear on the next time period change
   * @param {string} npcId - NPC ID
   * @param {string} locationId - Target location ID
   */
  teleportNPC(npcId, locationId) {
    this.temporaryOverrides.set(npcId, locationId);
  }

  /**
   * Clear a specific NPC's temporary override
   * @param {string} npcId - NPC ID
   */
  clearNPCOverride(npcId) {
    this.temporaryOverrides.delete(npcId);
  }

  /**
   * Hide an NPC from all locations
   * @param {string} npcId - NPC ID
   */
  hideNPC(npcId) {
    this.hiddenNPCs.add(npcId);
  }

  /**
   * Show a previously hidden NPC
   * @param {string} npcId - NPC ID
   */
  showNPC(npcId) {
    this.hiddenNPCs.delete(npcId);
  }

  /**
   * Check if an NPC is hidden
   * @param {string} npcId - NPC ID
   * @returns {boolean}
   */
  isNPCHidden(npcId) {
    return this.hiddenNPCs.has(npcId);
  }

  /**
   * Lock an NPC in place during player interaction
   * Locked NPCs won't have their overrides cleared on period change
   * @param {string} npcId - NPC ID
   */
  lockNPCForInteraction(npcId) {
    this.interactionLocks.add(npcId);
  }

  /**
   * Release an NPC from interaction lock
   * @param {string} npcId - NPC ID
   */
  unlockNPCFromInteraction(npcId) {
    this.interactionLocks.delete(npcId);
  }

  /**
   * Check if an NPC is locked for interaction
   * @param {string} npcId - NPC ID
   * @returns {boolean}
   */
  isNPCLocked(npcId) {
    return this.interactionLocks.has(npcId);
  }

  /**
   * Called when time changes - checks for period changes and clears overrides
   * @param {Object} oldTime - Previous time { day, hour, minute }
   * @param {Object} newTime - New time { day, hour, minute }
   * @returns {Object} Information about what changed
   */
  onTimeChange(oldTime, newTime) {
    const oldPeriod = this.getTimePeriodName(oldTime?.hour ?? 8);
    const newPeriod = this.getTimePeriodName(newTime?.hour ?? 8);

    const periodChanged = oldPeriod !== newPeriod;

    if (periodChanged) {
      // Clear temporary overrides for unlocked NPCs
      const clearedOverrides = [];
      for (const npcId of this.temporaryOverrides.keys()) {
        if (!this.interactionLocks.has(npcId)) {
          clearedOverrides.push(npcId);
          this.temporaryOverrides.delete(npcId);
        }
      }

      this.lastTimePeriod = newPeriod;

      return {
        periodChanged: true,
        oldPeriod,
        newPeriod,
        clearedOverrides
      };
    }

    return {
      periodChanged: false,
      oldPeriod,
      newPeriod,
      clearedOverrides: []
    };
  }

  /**
   * Get the state of the NPC location system for saving
   * @returns {Object} Serializable state
   */
  getState() {
    return {
      temporaryOverrides: Object.fromEntries(this.temporaryOverrides),
      hiddenNPCs: Array.from(this.hiddenNPCs),
      interactionLocks: Array.from(this.interactionLocks),
      lastTimePeriod: this.lastTimePeriod
    };
  }

  /**
   * Restore the state of the NPC location system from saved data
   * @param {Object} state - Previously saved state
   */
  loadState(state) {
    if (!state) return;

    this.temporaryOverrides = new Map(Object.entries(state.temporaryOverrides || {}));
    this.hiddenNPCs = new Set(state.hiddenNPCs || []);
    this.interactionLocks = new Set(state.interactionLocks || []);
    this.lastTimePeriod = state.lastTimePeriod || null;
  }

  /**
   * Clear all state (used for new game)
   */
  reset() {
    this.temporaryOverrides.clear();
    this.hiddenNPCs.clear();
    this.interactionLocks.clear();
    this.lastTimePeriod = null;
  }
}

export default NPCLocationSystem;
