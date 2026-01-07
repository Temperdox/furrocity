/**
 * @fileoverview InventorySystem - Complete item and equipment management
 *
 * This system handles all aspects of item management including:
 * - Adding/removing items with automatic stacking
 * - Equipment slots with stat bonuses and requirements
 * - Consumable items with various effects
 * - Clothing durability and exposure mechanics
 * - User flags (favorite/junk) for item organization
 *
 * @module engine/InventorySystem
 *
 * @example
 * // Create and use the inventory system
 * const inventorySystem = new InventorySystem(registry, effectSystem);
 *
 * // Add an item
 * const result = await inventorySystem.addItem(inventory, 'health_potion', 5);
 *
 * // Equip an item
 * await inventorySystem.equipItem(player, inventory, item.uniqueId);
 *
 * // Mark item as junk for auto-sell
 * inventorySystem.toggleJunk(inventory, item.uniqueId);
 *
 * @author Furrocity Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS - Equipment slots, item categories, and rarity tiers
// ============================================================================

/**
 * Available equipment slots for the player character.
 * @constant {Object.<string, string>}
 */
export const EQUIPMENT_SLOTS = {
  // Standard equipment slots
  HEAD: 'head',
  FACE: 'face',
  NECK: 'neck',
  CHEST: 'chest',
  ARMS: 'arms',
  HANDS: 'hands',
  WAIST: 'waist',
  LEGS: 'legs',
  FEET: 'feet',
  MAIN_HAND: 'main_hand',
  OFF_HAND: 'off_hand',
  ACCESSORY_1: 'accessory1',
  ACCESSORY_2: 'accessory2',
  UNDERWEAR: 'underwear',
  SPECIAL: 'special',

  // NSFW equipment slots - Body parts
  NIPPLE_LEFT: 'nipple_left',
  NIPPLE_RIGHT: 'nipple_right',
  NIPPLES: 'nipples',           // For items that cover both
  MOUTH: 'mouth',
  EARS: 'ears',
  NOSE: 'nose',

  // NSFW equipment slots - Genitals/intimate
  DICK: 'dick',
  BALLS: 'balls',
  PUSSY: 'pussy',
  CLITORIS: 'clitoris',
  URETHRA: 'urethra',
  ASS: 'ass',

  // NSFW equipment slots - Special
  CHASTITY: 'chastity',
  GENITAL: 'genital'            // Generic genital slot for universal items
};

/**
 * Slots that can hold multiple piercings simultaneously.
 * Other items (toys) in these slots will replace each other.
 * @constant {Array<string>}
 */
export const PIERCING_STACKABLE_SLOTS = [
  'nipple_left', 'nipple_right', 'nipples',
  'mouth', 'ears', 'nose',
  'dick', 'balls', 'pussy', 'clitoris', 'urethra',
  'ass', 'genital'
];

/**
 * Item category types for filtering and sorting.
 * @constant {Object.<string, string>}
 */
export const ITEM_CATEGORIES = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  ACCESSORY: 'accessory',
  CONSUMABLE: 'consumable',
  MATERIAL: 'material',
  KEY: 'key',
  CLOTHING: 'clothing',
  TOOL: 'tool',
  MISC: 'misc'
};

/**
 * Item rarity tiers from most common to most rare.
 * Affects item value, drop rates, and stat bonuses.
 * @constant {Object.<string, string>}
 */
export const RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
  MYTHIC: 'mythic',
  DIVINE: 'divine'
};

/**
 * UI colors for each rarity tier (hex format).
 * Used for item name display and borders.
 * @constant {Object.<string, string>}
 */
export const RARITY_COLORS = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f97316',
  mythic: '#ffd700',
  divine: '#fef3c7'
};

/**
 * Generate a unique ID for item instances.
 * Combines timestamp and random string for guaranteed uniqueness.
 *
 * @returns {string} Unique item ID (e.g., "item_1704393600000_abc123def")
 * @private
 */
function generateUniqueId() {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * InventorySystem - Core item and equipment management
 *
 * Features:
 * - Automatic stacking of stackable items
 * - Equipment with stat bonuses and curse mechanics
 * - Consumable items with HP/mana/stamina restoration
 * - Clothing durability and exposure system
 * - User flags (favorite/junk) for organization
 * - Sorting and filtering capabilities
 *
 * @class
 */
export class InventorySystem {
  /**
   * Create a new InventorySystem instance.
   *
   * @param {DataRegistry|null} registry - Registry for loading item definitions
   * @param {EffectSystem|null} effectSystem - Effect system for item effects
   * @param {Object} [options={}] - Configuration options
   * @param {Object} [options.callbacks] - Event callbacks
   * @param {Function} [options.callbacks.onItemAdded] - Called when item added
   * @param {Function} [options.callbacks.onItemRemoved] - Called when item removed
   * @param {Function} [options.callbacks.onItemEquipped] - Called when item equipped
   * @param {Function} [options.callbacks.onItemUnequipped] - Called when item unequipped
   * @param {Function} [options.callbacks.onItemUsed] - Called when item used
   * @param {number} [options.maxInventorySize=100] - Maximum inventory slots
   *
   * @example
   * const inventorySystem = new InventorySystem(registry, effectSystem, {
   *   maxInventorySize: 50,
   *   callbacks: {
   *     onItemAdded: (item) => console.log(`Got ${item.name}!`)
   *   }
   * });
   */
  constructor(registry, effectSystem, options = {}) {
    /** @type {DataRegistry|null} Item definition registry */
    this.registry = registry;

    /** @type {EffectSystem|null} Effect system for applying item effects */
    this.effectSystem = effectSystem;

    /** @type {Object} Event callback functions */
    this.callbacks = options.callbacks || {};

    /** @type {number} Maximum number of inventory slots */
    this.maxInventorySize = options.maxInventorySize || 100;
  }

  // ============================================================================
  // CORE INVENTORY OPERATIONS
  // ============================================================================

  /**
   * Add an item to the player's inventory.
   * Automatically stacks stackable items up to their max stack size.
   *
   * @async
   * @param {Array} inventory - Player's inventory array (will be modified)
   * @param {string|Object} itemIdOrData - Item ID string or full item data object
   * @param {number} [count=1] - Number of items to add
   * @param {Object} [options={}] - Additional options
   * @param {Object} [options.curse] - Curse to apply to the item
   * @param {boolean} [options.skipRandom] - Skip random stat generation
   * @returns {Promise<Object>} Result object
   * @returns {boolean} result.success - Whether item was added
   * @returns {string} [result.error] - Error message if failed
   * @returns {number} [result.added] - Number of items added
   * @returns {Object} [result.item] - The added item instance
   * @returns {boolean} [result.stacked] - Whether items were stacked
   *
   * @example
   * // Add by item ID
   * const result = await inventorySystem.addItem(player.inventory, 'health_potion', 5);
   *
   * // Add by item data
   * const result = await inventorySystem.addItem(player.inventory, itemData, 1);
   */
  async addItem(inventory, itemIdOrData, count = 1, options = {}) {
    // Get item data
    let itemData;
    if (typeof itemIdOrData === 'string') {
      itemData = await this.registry.getItem(itemIdOrData);
      if (!itemData) {
        console.warn(`Item not found: ${itemIdOrData}`);
        return { success: false, error: 'Item not found' };
      }
    } else {
      itemData = itemIdOrData;
    }
    
    // Check inventory space
    if (inventory.length >= this.maxInventorySize && !itemData.stackable) {
      return { success: false, error: 'Inventory full' };
    }
    
    // Handle stackable items
    if (itemData.stackable) {
      const existing = inventory.find(i => 
        i.id === itemData.id && !i.curse // Don't stack cursed with non-cursed
      );
      
      if (existing) {
        const maxStack = itemData.maxStack || 99;
        const canAdd = Math.min(count, maxStack - (existing.count || 1));
        
        if (canAdd > 0) {
          existing.count = (existing.count || 1) + canAdd;
          
          // If we couldn't add all, create new stack
          if (canAdd < count) {
            const remaining = count - canAdd;
            const newItem = this.createItemInstance(itemData, remaining, options);
            inventory.push(newItem);
          }
          
          return { 
            success: true, 
            added: count, 
            item: existing,
            stacked: true 
          };
        }
      }
    }
    
    // Create new item instance
    const newItem = this.createItemInstance(itemData, count, options);
    inventory.push(newItem);
    
    // Callback
    if (this.callbacks.onItemAdded) {
      await this.callbacks.onItemAdded(newItem);
    }
    
    return { 
      success: true, 
      added: count, 
      item: newItem,
      stacked: false 
    };
  }

  /**
   * Create an item instance from item data
   */
  createItemInstance(itemData, count = 1, options = {}) {
    const instance = {
      ...itemData,
      uniqueId: generateUniqueId(),
      count: itemData.stackable ? count : 1,
      acquiredAt: Date.now(),
      userFlags: {
        favorite: false,
        junk: false
      }
    };
    
    // Apply curse if specified
    if (options.curse) {
      instance.curse = options.curse;
      instance.isCursed = true;
    }
    
    // Apply random stats if item supports it
    if (itemData.randomStats && !options.skipRandom) {
      instance.randomStats = this.generateRandomStats(itemData.randomStats);
    }
    
    // Calculate final stats
    instance.finalStats = this.calculateItemStats(instance);
    
    // Set rarity color
    instance.rarityColor = RARITY_COLORS[instance.rarity] || RARITY_COLORS.common;
    
    return instance;
  }

  /**
   * Generate random bonus stats for an item
   */
  generateRandomStats(randomConfig) {
    const stats = {};
    
    for (const [stat, range] of Object.entries(randomConfig)) {
      if (typeof range === 'object') {
        stats[stat] = range.min + Math.floor(Math.random() * (range.max - range.min + 1));
      } else {
        stats[stat] = range;
      }
    }
    
    return stats;
  }

  /**
   * Calculate total item stats (base + random + curse effects)
   */
  calculateItemStats(item) {
    const stats = { ...(item.baseStats || {}) };
    
    // Add random stats
    if (item.randomStats) {
      for (const [stat, value] of Object.entries(item.randomStats)) {
        stats[stat] = (stats[stat] || 0) + value;
      }
    }
    
    // Apply curse modifiers
    if (item.curse?.statModifiers) {
      for (const [stat, value] of Object.entries(item.curse.statModifiers)) {
        stats[stat] = (stats[stat] || 0) + value;
      }
    }
    
    return stats;
  }

  /**
   * Remove item from inventory
   */
  async removeItem(inventory, itemIdOrUniqueId, count = 1) {
    // Find by uniqueId first, then by id
    let index = inventory.findIndex(i => i.uniqueId === itemIdOrUniqueId);
    if (index === -1) {
      index = inventory.findIndex(i => i.id === itemIdOrUniqueId);
    }
    
    if (index === -1) {
      return { success: false, error: 'Item not found in inventory' };
    }
    
    const item = inventory[index];
    
    if (item.stackable && item.count > count) {
      // Reduce stack
      item.count -= count;
      return { success: true, removed: count, remaining: item.count };
    } else {
      // Remove entire item
      inventory.splice(index, 1);
      
      // Callback
      if (this.callbacks.onItemRemoved) {
        await this.callbacks.onItemRemoved(item);
      }
      
      return { success: true, removed: item.count || 1, remaining: 0 };
    }
  }

  /**
   * Use a consumable item
   */
  async useItem(player, inventory, itemIdOrUniqueId, target = null) {
    // Find item
    let index = inventory.findIndex(i => i.uniqueId === itemIdOrUniqueId);
    if (index === -1) {
      index = inventory.findIndex(i => i.id === itemIdOrUniqueId);
    }
    
    if (index === -1) {
      return { success: false, error: 'Item not found' };
    }
    
    const item = inventory[index];
    
    // Check if usable
    if (item.category !== ITEM_CATEGORIES.CONSUMABLE && !item.useEffect) {
      return { success: false, error: 'Item cannot be used' };
    }
    
    // Check requirements
    if (item.useRequirements) {
      const meetsRequirements = this.checkRequirements(player, item.useRequirements);
      if (!meetsRequirements.success) {
        return { success: false, error: meetsRequirements.reason };
      }
    }
    
    const results = [];
    const useTarget = target || player;
    
    // Process use effect
    if (item.useEffect) {
      const effect = item.useEffect;
      
      switch (effect.type) {
        case 'heal':
          const healAmount = this.calculateEffectValue(effect.amount, player);
          const actualHeal = Math.min(healAmount, useTarget.maxHp - useTarget.currentHp);
          useTarget.currentHp += actualHeal;
          results.push({ type: 'heal', amount: actualHeal });
          break;
          
        case 'restoreStamina':
          const staminaAmount = this.calculateEffectValue(effect.amount, player);
          const actualStamina = Math.min(staminaAmount, useTarget.maxStamina - useTarget.currentStamina);
          useTarget.currentStamina += actualStamina;
          results.push({ type: 'restoreStamina', amount: actualStamina });
          break;
          
        case 'restoreMana':
          const manaAmount = this.calculateEffectValue(effect.amount, player);
          const actualMana = Math.min(manaAmount, useTarget.maxMana - useTarget.currentMana);
          useTarget.currentMana += actualMana;
          results.push({ type: 'restoreMana', amount: actualMana });
          break;
          
        case 'applyEffect':
          if (this.effectSystem) {
            await this.effectSystem.applyEffect(effect.effectId, useTarget, player);
          }
          results.push({ type: 'effectApplied', effectId: effect.effectId });
          break;
          
        case 'removeEffect':
          if (this.effectSystem && effect.effectTags) {
            useTarget.activeEffects = useTarget.activeEffects?.filter(e => {
              const def = this.effectSystem.effectCache.get(e.id);
              return !effect.effectTags.some(tag => def?.tags?.includes(tag));
            }) || [];
          }
          results.push({ type: 'effectRemoved', tags: effect.effectTags });
          break;
          
        case 'reduceCorruption':
          if (useTarget.nsfwStats) {
            const amount = this.calculateEffectValue(effect.amount, player);
            useTarget.nsfwStats.corruption = Math.max(0, useTarget.nsfwStats.corruption - amount);
            results.push({ type: 'corruptionReduced', amount });
          }
          break;
          
        case 'teleport':
          results.push({ type: 'teleport', locationId: effect.locationId });
          break;
          
        case 'custom':
          if (this.callbacks.customUseEffect) {
            const customResult = await this.callbacks.customUseEffect(effect, useTarget, player);
            results.push({ type: 'custom', result: customResult });
          }
          break;
      }
    }
    
    // Consume item
    await this.removeItem(inventory, item.uniqueId, 1);
    
    // Callback
    if (this.callbacks.onItemUsed) {
      await this.callbacks.onItemUsed(item, results);
    }
    
    return { success: true, item, results };
  }

  /**
   * Calculate effect value (handles flat, percent, etc.)
   */
  calculateEffectValue(valueSpec, player) {
    if (typeof valueSpec === 'number') {
      return valueSpec;
    }
    
    if (typeof valueSpec === 'object') {
      switch (valueSpec.type) {
        case 'flat':
          return valueSpec.value;
        case 'percentOfMax':
          const maxVal = valueSpec.stat === 'hp' ? player.maxHp :
                        valueSpec.stat === 'stamina' ? player.maxStamina :
                        valueSpec.stat === 'mana' ? player.maxMana : 100;
          return Math.floor(maxVal * (valueSpec.percent / 100));
        case 'scaledByStat':
          const statVal = player.stats?.[valueSpec.stat] || 0;
          return valueSpec.base + (statVal * valueSpec.scaling);
        default:
          return valueSpec.value || 0;
      }
    }
    
    return 0;
  }

  /**
   * Check if an item is a piercing (can stack in slot with other piercings)
   */
  isPiercing(item) {
    return item.tags?.includes('piercing') || item.itemType === 'piercing' || item.isPiercing;
  }

  /**
   * Check if slot supports piercing stacking
   */
  slotSupportsPiercingStacking(slot) {
    return PIERCING_STACKABLE_SLOTS.includes(slot);
  }

  /**
   * Get valid equipment slots for an item
   * @param {Object} item - The item to check
   * @returns {Array<string>} Array of valid slot names
   */
  getItemSlots(item) {
    // Support both new equipSlots array and legacy slot property
    if (item.equipSlots && item.equipSlots.length > 0) {
      return item.equipSlots;
    }
    if (item.slot) {
      return [item.slot];
    }
    return [];
  }

  /**
   * Equip an item
   * @param {Object} player - Player state object
   * @param {Array} inventory - Player inventory array
   * @param {string} itemIdOrUniqueId - Item ID or unique ID to equip
   * @param {string} [targetSlot] - Optional specific slot to equip to (for multi-slot items)
   */
  async equipItem(player, inventory, itemIdOrUniqueId, targetSlot = null) {
    // Find item
    let index = inventory.findIndex(i => i.uniqueId === itemIdOrUniqueId);
    if (index === -1) {
      index = inventory.findIndex(i => i.id === itemIdOrUniqueId);
    }

    if (index === -1) {
      return { success: false, error: 'Item not found' };
    }

    const item = inventory[index];

    // Get valid slots for this item
    const validSlots = this.getItemSlots(item);

    // Check if equippable
    if (validSlots.length === 0) {
      return { success: false, error: 'Item cannot be equipped' };
    }

    // Determine which slot to use
    let slot;
    if (targetSlot) {
      // Validate target slot is valid for this item
      if (!validSlots.includes(targetSlot)) {
        return {
          success: false,
          error: `Item cannot be equipped in ${targetSlot}. Valid slots: ${validSlots.join(', ')}`
        };
      }
      slot = targetSlot;
    } else if (validSlots.length === 1) {
      // Single slot item, use it
      slot = validSlots[0];
    } else {
      // Multiple slots available - try to find an empty one, or return options
      const emptySlot = validSlots.find(s => {
        const current = player.equipment?.[s];
        return !current || (Array.isArray(current) && current.length === 0);
      });

      if (emptySlot) {
        slot = emptySlot;
      } else {
        // All slots occupied, return available options for UI to prompt
        return {
          success: false,
          error: 'Choose equipment slot',
          requiresSlotChoice: true,
          availableSlots: validSlots
        };
      }
    }

    // Check requirements
    if (item.requirements) {
      const meetsRequirements = this.checkRequirements(player, item.requirements);
      if (!meetsRequirements.success) {
        return { success: false, error: meetsRequirements.reason };
      }
    }

    // Initialize equipment if needed
    if (!player.equipment) {
      player.equipment = {};
    }

    const isPiercingItem = this.isPiercing(item);
    const slotSupportsPiercings = this.slotSupportsPiercingStacking(slot);

    // Handle piercing stacking in NSFW slots
    if (slotSupportsPiercings && isPiercingItem) {
      // Piercings can stack - initialize array if needed
      if (!player.equipment[slot]) {
        player.equipment[slot] = [];
      } else if (!Array.isArray(player.equipment[slot])) {
        // Convert single item to array
        player.equipment[slot] = [player.equipment[slot]];
      }

      // Remove from inventory
      inventory.splice(index, 1);

      // Add piercing to the slot array
      player.equipment[slot].push(item);

      // Apply equip effects
      await this.applyEquipEffects(player, item);

      // Apply stat bonuses
      this.recalculateEquipmentStats(player);

      // Callback
      if (this.callbacks.onItemEquipped) {
        await this.callbacks.onItemEquipped(item, slot);
      }

      return { success: true, item, slot, stacked: true, totalInSlot: player.equipment[slot].length };
    }

    // For toys/non-piercings in NSFW slots, or standard equipment
    // Unequip current item(s) in slot
    let unequippedItems = [];
    const currentEquipment = player.equipment[slot];

    if (currentEquipment) {
      // Check for cursed item blocking
      if (Array.isArray(currentEquipment)) {
        // Check all items for curse
        const cursedItem = currentEquipment.find(i => i?.isCursed && !i.curse?.removable);
        if (cursedItem) {
          return { success: false, error: 'Cursed item cannot be removed' };
        }
        // Unequip all items in the array
        for (const equippedItem of currentEquipment) {
          if (equippedItem) {
            await this.removeEquipEffects(player, equippedItem);
            inventory.push(equippedItem);
            unequippedItems.push(equippedItem);
          }
        }
      } else {
        if (currentEquipment.isCursed && !currentEquipment.curse?.removable) {
          return { success: false, error: 'Cursed item cannot be removed' };
        }
        await this.removeEquipEffects(player, currentEquipment);
        inventory.push(currentEquipment);
        unequippedItems.push(currentEquipment);
      }
    }

    // Remove from inventory
    inventory.splice(index, 1);

    // Add to equipment
    player.equipment[slot] = item;

    // Apply equip effects
    await this.applyEquipEffects(player, item);

    // Apply stat bonuses
    this.recalculateEquipmentStats(player);

    // Callback
    if (this.callbacks.onItemEquipped) {
      await this.callbacks.onItemEquipped(item, slot);
    }

    return {
      success: true,
      item,
      slot,
      unequipped: unequippedItems.length === 1 ? unequippedItems[0] : unequippedItems.length > 0 ? unequippedItems : null
    };
  }

  /**
   * Unequip an item
   */
  async unequipItem(player, inventory, slot) {
    const item = player.equipment?.[slot];
    
    if (!item) {
      return { success: false, error: 'Slot is empty' };
    }
    
    // Check for cursed
    if (item.isCursed && !item.curse?.removable) {
      return { success: false, error: 'Cursed item cannot be removed' };
    }
    
    // Check inventory space
    if (inventory.length >= this.maxInventorySize) {
      return { success: false, error: 'Inventory full' };
    }
    
    // Remove from equipment
    player.equipment[slot] = null;
    
    // Add to inventory
    inventory.push(item);
    
    // Remove equip effects
    await this.removeEquipEffects(player, item);
    
    // Recalculate stats
    this.recalculateEquipmentStats(player);
    
    // Callback
    if (this.callbacks.onItemUnequipped) {
      await this.callbacks.onItemUnequipped(item, slot);
    }
    
    return { success: true, item, slot };
  }

  /**
   * Apply equipment effects when equipped
   */
  async applyEquipEffects(player, item) {
    // Apply passive effects
    if (item.onEquip?.applyEffect && this.effectSystem) {
      await this.effectSystem.applyEffect(item.onEquip.applyEffect, player, null, {
        source: item.uniqueId
      });
    }
    
    // Apply curse effect
    if (item.curse?.effectId && this.effectSystem) {
      await this.effectSystem.applyEffect(item.curse.effectId, player, null, {
        source: item.uniqueId
      });
    }
  }

  /**
   * Remove equipment effects when unequipped
   */
  async removeEquipEffects(player, item) {
    // Remove item-granted effects
    if (player.activeEffects) {
      player.activeEffects = player.activeEffects.filter(e => 
        e.source !== item.uniqueId
      );
    }
    
    // Remove specific effect
    if (item.onEquip?.applyEffect && this.effectSystem) {
      await this.effectSystem.removeEffect(item.onEquip.applyEffect, player);
    }
    
    // Note: Curse effects may persist even after unequip
    if (item.curse?.effectId && !item.curse.persistAfterRemoval) {
      await this.effectSystem?.removeEffect(item.curse.effectId, player);
    }
  }

  /**
   * Recalculate total equipment stat bonuses
   */
  recalculateEquipmentStats(player) {
    const equipmentBonus = {};

    for (const [slot, slotContent] of Object.entries(player.equipment || {})) {
      if (!slotContent) continue;

      // Handle array-based slots (piercings)
      const items = Array.isArray(slotContent) ? slotContent : [slotContent];

      for (const item of items) {
        if (!item) continue;

        const stats = item.finalStats || item.baseStats || {};

        for (const [stat, value] of Object.entries(stats)) {
          equipmentBonus[stat] = (equipmentBonus[stat] || 0) + value;
        }
      }
    }

    player.equipmentBonus = equipmentBonus;

    // Recalculate derived stats
    this.recalculateDerivedStats(player);
  }

  /**
   * Recalculate derived stats (max HP, etc.) based on equipment
   */
  recalculateDerivedStats(player) {
    const bonus = player.equipmentBonus || {};
    
    // HP from vitality/defense
    const baseHp = 50 + (player.stats?.vitality || 0) * 10;
    player.maxHp = baseHp + (bonus.hp || 0) + (bonus.defense || 0) * 2;
    
    // Stamina from... stamina stat
    const baseStamina = 50 + (player.stats?.stamina || 0) * 5;
    player.maxStamina = baseStamina + (bonus.stamina || 0);
    
    // Mana from intelligence
    const baseMana = 20 + (player.stats?.intelligence || 0) * 10;
    player.maxMana = baseMana + (bonus.mana || 0) + (bonus.magic || 0) * 2;
    
    // Clamp current values
    player.currentHp = Math.min(player.currentHp, player.maxHp);
    player.currentStamina = Math.min(player.currentStamina, player.maxStamina);
    player.currentMana = Math.min(player.currentMana, player.maxMana);
  }

  /**
   * Check if player meets requirements
   */
  checkRequirements(player, requirements) {
    for (const [stat, required] of Object.entries(requirements)) {
      const playerValue = player.stats?.[stat] || player.level || 0;
      
      if (playerValue < required) {
        return { 
          success: false, 
          reason: `Requires ${stat} ${required} (you have ${playerValue})` 
        };
      }
    }
    
    return { success: true };
  }

  /**
   * Damage clothing (reduce durability)
   */
  damageClothing(player, slot, amount) {
    const item = player.equipment?.[slot];
    
    if (!item?.clothingState) return null;
    
    item.clothingState.currentIntegrity = Math.max(
      0, 
      (item.clothingState.currentIntegrity ?? item.clothingState.maxIntegrity) - amount
    );
    
    // Check for exposure
    const exposed = item.clothingState.currentIntegrity <= item.clothingState.exposureThreshold;
    
    // Check for destruction
    const destroyed = item.clothingState.currentIntegrity <= 0;
    
    return {
      item,
      slot,
      newIntegrity: item.clothingState.currentIntegrity,
      exposed,
      destroyed
    };
  }

  /**
   * Get total inventory value (for selling)
   */
  getInventoryValue(inventory) {
    return inventory.reduce((total, item) => {
      const baseValue = item.value || 0;
      const count = item.count || 1;
      
      // Rarity multiplier
      const rarityMultiplier = {
        common: 1,
        uncommon: 1.5,
        rare: 2,
        epic: 3,
        legendary: 5,
        mythic: 10,
        divine: 25
      }[item.rarity] || 1;
      
      // Curse penalty
      const curseMultiplier = item.isCursed ? 0.5 : 1;
      
      return total + (baseValue * count * rarityMultiplier * curseMultiplier);
    }, 0);
  }

  /**
   * Sort inventory
   */
  sortInventory(inventory, sortBy = 'rarity') {
    const rarityOrder = ['divine', 'mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
    const categoryOrder = ['weapon', 'armor', 'accessory', 'consumable', 'material', 'key', 'misc'];
    
    return [...inventory].sort((a, b) => {
      switch (sortBy) {
        case 'rarity':
          return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
        case 'category':
          return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'value':
          return (b.value || 0) - (a.value || 0);
        case 'newest':
          return (b.acquiredAt || 0) - (a.acquiredAt || 0);
        default:
          return 0;
      }
    });
  }

  /**
   * Filter inventory
   */
  filterInventory(inventory, filter) {
    return inventory.filter(item => {
      if (filter.category && item.category !== filter.category) return false;
      if (filter.rarity && item.rarity !== filter.rarity) return false;
      if (filter.type && item.type !== filter.type) return false;
      if (filter.tag && !item.tags?.includes(filter.tag)) return false;
      if (filter.favorite !== undefined && item.userFlags?.favorite !== filter.favorite) return false;
      if (filter.junk !== undefined && item.userFlags?.junk !== filter.junk) return false;
      if (filter.search) {
        const search = filter.search.toLowerCase();
        if (!item.name?.toLowerCase().includes(search) &&
            !item.description?.toLowerCase().includes(search)) {
          return false;
        }
      }
      return true;
    });
  }

  // ============================================================================
  // USER FLAGS (Favorite/Junk)
  // ============================================================================

  /**
   * Toggle favorite flag on an item
   * @param {Array} inventory - Player inventory
   * @param {string} itemUniqueId - Item's unique ID
   * @returns {Object} Result with new state
   */
  toggleFavorite(inventory, itemUniqueId) {
    const item = inventory.find(i => i.uniqueId === itemUniqueId);
    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    // Initialize userFlags if missing
    if (!item.userFlags) {
      item.userFlags = { favorite: false, junk: false };
    }

    // Toggle favorite
    item.userFlags.favorite = !item.userFlags.favorite;

    // If marking as favorite, remove junk flag (mutually exclusive)
    if (item.userFlags.favorite) {
      item.userFlags.junk = false;
    }

    return {
      success: true,
      item,
      favorite: item.userFlags.favorite
    };
  }

  /**
   * Toggle junk flag on an item
   * @param {Array} inventory - Player inventory
   * @param {string} itemUniqueId - Item's unique ID
   * @returns {Object} Result with new state
   */
  toggleJunk(inventory, itemUniqueId) {
    const item = inventory.find(i => i.uniqueId === itemUniqueId);
    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    // Initialize userFlags if missing
    if (!item.userFlags) {
      item.userFlags = { favorite: false, junk: false };
    }

    // Toggle junk
    item.userFlags.junk = !item.userFlags.junk;

    // If marking as junk, remove favorite flag (mutually exclusive)
    if (item.userFlags.junk) {
      item.userFlags.favorite = false;
    }

    return {
      success: true,
      item,
      junk: item.userFlags.junk
    };
  }

  /**
   * Set favorite flag on an item
   */
  setFavorite(inventory, itemUniqueId, value) {
    const item = inventory.find(i => i.uniqueId === itemUniqueId);
    if (!item) return { success: false, error: 'Item not found' };

    if (!item.userFlags) {
      item.userFlags = { favorite: false, junk: false };
    }

    item.userFlags.favorite = value;
    if (value) item.userFlags.junk = false;

    return { success: true, item, favorite: value };
  }

  /**
   * Set junk flag on an item
   */
  setJunk(inventory, itemUniqueId, value) {
    const item = inventory.find(i => i.uniqueId === itemUniqueId);
    if (!item) return { success: false, error: 'Item not found' };

    if (!item.userFlags) {
      item.userFlags = { favorite: false, junk: false };
    }

    item.userFlags.junk = value;
    if (value) item.userFlags.favorite = false;

    return { success: true, item, junk: value };
  }

  /**
   * Get all items marked as junk
   */
  getJunkItems(inventory) {
    return inventory.filter(item => item.userFlags?.junk === true);
  }

  /**
   * Get all items marked as favorite
   */
  getFavoriteItems(inventory) {
    return inventory.filter(item => item.userFlags?.favorite === true);
  }

  /**
   * Get unique tags from inventory (for filter UI)
   */
  getInventoryTags(inventory) {
    const tagSet = new Set();
    for (const item of inventory) {
      if (item.tags) {
        for (const tag of item.tags) {
          tagSet.add(tag);
        }
      }
      // Also add category as a pseudo-tag
      if (item.category) {
        tagSet.add(item.category);
      }
    }
    return Array.from(tagSet).sort();
  }

  /**
   * Get unique categories from inventory
   */
  getInventoryCategories(inventory) {
    const categories = new Set();
    for (const item of inventory) {
      if (item.category) {
        categories.add(item.category);
      }
    }
    return Array.from(categories).sort();
  }
}

export default InventorySystem;
