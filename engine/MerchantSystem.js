/**
 * @fileoverview MerchantSystem - Handles all merchant trading functionality
 *
 * This system manages the buying and selling of items between players and merchants.
 * It supports tag-based filtering, dynamic pricing with multiple modifiers, and
 * various stock management strategies.
 *
 * @module engine/MerchantSystem
 * @requires ./InventorySystem
 *
 * @example
 * // Initialize the merchant system
 * const merchantSystem = new MerchantSystem(dataRegistry, fameSystem, inventorySystem);
 * await merchantSystem.initialize();
 *
 * // Find merchants at player's location
 * const merchants = merchantSystem.getMerchantsAtLocation('town_square');
 *
 * // Buy an item
 * const result = await merchantSystem.buyFromMerchant(merchant, item, playerState, 1);
 *
 * @author Furrocity Team
 * @version 1.0.0
 */

import { RARITY } from './InventorySystem.js';

/**
 * Rarity multipliers for price calculation.
 * Higher rarity items cost more to buy and sell for more.
 * @constant {Object.<string, number>}
 */
const RARITY_PRICE_MULTIPLIER = {
  common: 1.0,
  uncommon: 1.5,
  rare: 2.5,
  epic: 4.0,
  legendary: 7.0,
  mythic: 15.0,
  divine: 30.0
};

/**
 * MerchantSystem class - Core trading functionality
 *
 * Features:
 * - Tag-based buy/sell filtering (merchants only accept certain item types)
 * - Dynamic price calculations with player modifiers (charisma, fame, reputation)
 * - Transaction processing with inventory integration
 * - Multiple stock management modes (static, tag-based, dynamic)
 * - Auto-sell junk items functionality
 *
 * @class
 */
export class MerchantSystem {
  /**
   * Create a new MerchantSystem instance
   *
   * @param {DataRegistry|null} dataRegistry - Registry for loading content (merchants, items)
   * @param {FameSystem|null} fameSystem - Fame system for price modifiers
   * @param {InventorySystem} inventorySystem - Inventory system for item operations
   *
   * @example
   * const merchantSystem = new MerchantSystem(
   *   dataRegistry,
   *   fameSystem,
   *   inventorySystem
   * );
   */
  constructor(dataRegistry, fameSystem, inventorySystem) {
    /** @type {DataRegistry|null} Content loading registry */
    this.dataRegistry = dataRegistry;

    /** @type {FameSystem|null} Fame system for price modifiers */
    this.fameSystem = fameSystem;

    /** @type {InventorySystem} Inventory management system */
    this.inventorySystem = inventorySystem;

    /**
     * Cache of merchant definitions by ID
     * @type {Map<string, Object>}
     */
    this.merchantCache = new Map();

    /**
     * Cache of generated merchant stock with timestamps
     * @type {Map<string, {stock: Array, timestamp: number}>}
     */
    this.stockCache = new Map();

    /**
     * NPCLocationSystem for dynamic NPC locations
     * @type {NPCLocationSystem|null}
     */
    this.npcLocationSystem = null;

    /**
     * Current game time for schedule-based location checks
     * @type {Object|null}
     */
    this.currentTime = null;
  }

  /**
   * Set the NPCLocationSystem for dynamic location tracking
   * @param {NPCLocationSystem} npcLocationSystem - The NPC location system instance
   */
  setNPCLocationSystem(npcLocationSystem) {
    this.npcLocationSystem = npcLocationSystem;
  }

  /**
   * Update the current game time (call this when time changes)
   * @param {Object} currentTime - Current time object { day, hour, minute }
   */
  setCurrentTime(currentTime) {
    this.currentTime = currentTime;
  }

  /**
   * Initialize the merchant system by loading merchant definitions from datapacks.
   * Should be called after construction and before using other methods.
   *
   * @async
   * @returns {Promise<void>}
   *
   * @example
   * await merchantSystem.initialize();
   * console.log(`Loaded ${merchantSystem.merchantCache.size} merchants`);
   */
  async initialize() {
    // Load all merchant definitions from the data registry
    const merchants = this.dataRegistry?.getContentByType?.('merchants') || [];

    // Cache each merchant by their ID for quick lookup
    for (const merchant of merchants) {
      this.merchantCache.set(merchant.id, merchant);
    }

    console.log(`[MerchantSystem] Loaded ${this.merchantCache.size} merchant definitions`);
  }

  // ============================================================================
  // MERCHANT ACCESS METHODS
  // ============================================================================

  /**
   * Get a merchant by their unique ID
   *
   * @param {string} merchantId - The merchant's unique identifier
   * @returns {Object|undefined} The merchant definition or undefined if not found
   *
   * @example
   * const blacksmith = merchantSystem.getMerchant('blacksmith_joe');
   * if (blacksmith) {
   *   console.log(`Found ${blacksmith.name}`);
   * }
   */
  getMerchant(merchantId) {
    return this.merchantCache.get(merchantId);
  }

  /**
   * Get all merchants present at a specific location.
   * Uses NPCLocationSystem for dynamic location tracking based on schedules,
   * or falls back to static locationId if NPCLocationSystem is not set.
   *
   * @param {string} locationId - The location ID to search
   * @param {Object} [currentTime] - Optional time override (uses this.currentTime if not provided)
   * @returns {Array<Object>} Array of merchant definitions at that location
   *
   * @example
   * const merchants = merchantSystem.getMerchantsAtLocation('town_square');
   * merchants.forEach(m => console.log(`${m.name} is here`));
   */
  getMerchantsAtLocation(locationId, currentTime = null) {
    const merchants = [];
    const time = currentTime || this.currentTime;

    // Iterate through all cached merchants
    for (const merchant of this.merchantCache.values()) {
      let merchantLocation;

      // Use NPCLocationSystem if available for dynamic location tracking
      if (this.npcLocationSystem && time) {
        merchantLocation = this.npcLocationSystem.getNPCLocation(merchant.id, time);
      } else {
        // Fall back to static location (supports both old and new field names)
        merchantLocation = merchant.defaultLocationId || merchant.locationId;
      }

      if (merchantLocation === locationId) {
        merchants.push(merchant);
      }
    }

    return merchants;
  }

  // ============================================================================
  // BUY/SELL VALIDATION
  // These methods determine whether items can be traded
  // ============================================================================

  /**
   * Check if a merchant will buy a specific item.
   * Uses tag-based filtering to determine if the merchant deals in this item type.
   *
   * @param {Object} merchant - The merchant definition
   * @param {Object} item - The item to check
   * @returns {{canBuy: boolean, reason: string|null}} Result with reason if rejected
   *
   * @example
   * const result = merchantSystem.canMerchantBuyItem(blacksmith, sword);
   * if (!result.canBuy) {
   *   console.log(`Rejected: ${result.reason}`);
   * }
   */
  canMerchantBuyItem(merchant, item) {
    const buyConfig = merchant.buyConfig;

    // Check if merchant buys anything at all
    if (!buyConfig || buyConfig.disabled) {
      return { canBuy: false, reason: 'Merchant does not buy items' };
    }

    // BLACKLIST CHECK: Rejected tags take priority over accepted tags
    // If an item has ANY rejected tag, merchant won't buy it
    if (buyConfig.rejectedTags?.length > 0) {
      const itemTags = item.tags || [];
      const hasRejectedTag = buyConfig.rejectedTags.some(tag => itemTags.includes(tag));
      if (hasRejectedTag) {
        // Use merchant's custom rejection dialogue if available
        return {
          canBuy: false,
          reason: merchant.dialogue?.cannotBuy || 'I don\'t deal in that sort of thing.'
        };
      }
    }

    // WHITELIST CHECK: If accepted tags are specified, item must have at least one
    // If no accepted tags specified, merchant accepts all non-rejected items
    if (buyConfig.acceptedTags?.length > 0) {
      const itemTags = item.tags || [];
      const hasAcceptedTag = buyConfig.acceptedTags.some(tag => itemTags.includes(tag));
      if (!hasAcceptedTag) {
        return {
          canBuy: false,
          reason: merchant.dialogue?.cannotBuy || 'I\'m not interested in that.'
        };
      }
    }

    // VALUE CHECK: Some merchants have a maximum value they can afford
    if (buyConfig.maxBuyValue && item.value > buyConfig.maxBuyValue) {
      return { canBuy: false, reason: 'That\'s too valuable for my purse.' };
    }

    return { canBuy: true, reason: null };
  }

  /**
   * Check if an item can be sold by the player.
   * Checks item flags (quest, bound, favorite) and optionally merchant acceptance.
   *
   * @param {Object} item - The item to check
   * @param {Object|null} [merchant=null] - Optional merchant for tag checking
   * @returns {{canSell: boolean, reason: string|null}} Result with reason if blocked
   *
   * @example
   * const result = merchantSystem.canPlayerSellItem(questItem, blacksmith);
   * // result.canSell === false, result.reason === 'Quest items cannot be sold'
   */
  canPlayerSellItem(item, merchant = null) {
    // Quest items are never sellable
    if (item.questItem) {
      return { canSell: false, reason: 'Quest items cannot be sold' };
    }

    // Soulbound/player-bound items cannot be traded
    if (item.playerBound) {
      return { canSell: false, reason: 'This item is bound to you' };
    }

    // Unique items with canSell=false are protected
    if (item.unique && item.canSell === false) {
      return { canSell: false, reason: 'This unique item cannot be sold' };
    }

    // Explicit canSell=false on any item
    if (item.canSell === false) {
      return { canSell: false, reason: 'This item cannot be sold' };
    }

    // FAVORITE PROTECTION: Items marked as favorite are protected from accidental sale
    if (item.userFlags?.favorite) {
      return { canSell: false, reason: 'Favorited items cannot be sold' };
    }

    // If a merchant is specified, also check if they accept this item type
    if (merchant) {
      const merchantCheck = this.canMerchantBuyItem(merchant, item);
      if (!merchantCheck.canBuy) {
        return { canSell: false, reason: merchantCheck.reason };
      }
    }

    return { canSell: true, reason: null };
  }

  // ============================================================================
  // PRICE CALCULATIONS
  // Complex pricing with multiple modifier sources
  // ============================================================================

  /**
   * Calculate the buy price (what player pays to buy from merchant).
   *
   * Price formula:
   * finalPrice = basePrice × rarityMult × levelMult × merchantMult × playerMod
   *
   * @param {Object} item - The item being bought
   * @param {Object} merchant - The merchant selling
   * @param {Object} playerState - Current player state
   * @returns {number} Final price in gold (minimum 1)
   *
   * @example
   * const price = merchantSystem.calculateBuyPrice(sword, blacksmith, playerState);
   * console.log(`This sword costs ${price} gold`);
   */
  calculateBuyPrice(item, merchant, playerState) {
    const basePrice = item.value || 0;
    if (basePrice === 0) return 0;

    let finalPrice = basePrice;

    // STEP 1: Apply rarity multiplier
    // Rare items cost significantly more
    const rarityMult = RARITY_PRICE_MULTIPLIER[item.rarity] || 1.0;
    finalPrice *= rarityMult;

    // STEP 2: Level scaling
    // Higher level items cost more (+10% per level above 1)
    if (item.level && item.level > 1) {
      finalPrice *= 1 + (item.level - 1) * 0.1;
    }

    // STEP 3: Merchant's sell multiplier
    // Some merchants charge more (1.2) or less (0.9) than base
    const merchantMult = merchant.sellConfig?.sellPriceMultiplier ?? 1.0;
    finalPrice *= merchantMult;

    // STEP 4: Player modifiers (charisma, fame, reputation, etc.)
    // Negative modifier = discount for player
    const playerMod = this.calculatePlayerBuyModifier(playerState, merchant);
    finalPrice *= (1 + playerMod);

    // Round to whole number, minimum 1 gold
    return Math.max(1, Math.round(finalPrice));
  }

  /**
   * Calculate the sell price (what player receives when selling to merchant).
   * Sell prices are typically 30-50% of buy prices.
   *
   * @param {Object} item - The item being sold
   * @param {Object} merchant - The merchant buying
   * @param {Object} playerState - Current player state
   * @returns {number} Final price in gold (minimum 1)
   *
   * @example
   * const price = merchantSystem.calculateSellPrice(sword, blacksmith, playerState);
   * console.log(`I'll buy that for ${price} gold`);
   */
  calculateSellPrice(item, merchant, playerState) {
    const basePrice = item.value || 0;
    if (basePrice === 0) return 0;

    let finalPrice = basePrice;

    // STEP 1: Rarity affects sell price less (square root)
    // This prevents rare items from having extreme sell values
    const rarityMult = RARITY_PRICE_MULTIPLIER[item.rarity] || 1.0;
    finalPrice *= Math.sqrt(rarityMult);

    // STEP 2: Level scaling (less than buy: +5% per level)
    if (item.level && item.level > 1) {
      finalPrice *= 1 + (item.level - 1) * 0.05;
    }

    // STEP 3: Merchant's buy multiplier (typically 0.3-0.5)
    // Merchants always buy for less than base value
    const merchantMult = merchant.buyConfig?.buyPriceMultiplier ?? 0.4;
    finalPrice *= merchantMult;

    // STEP 4: Curse penalty - cursed items sell for half
    if (item.isCursed) {
      finalPrice *= 0.5;
    }

    // STEP 5: Durability penalty for damaged clothing/armor
    if (item.clothingState?.currentIntegrity !== undefined) {
      const durabilityPercent = item.clothingState.currentIntegrity / item.clothingState.maxIntegrity;
      finalPrice *= Math.max(0.1, durabilityPercent); // Minimum 10% of value
    }

    // STEP 6: Player modifiers (charisma helps get better prices)
    const playerMod = this.calculatePlayerSellModifier(playerState, merchant);
    finalPrice *= (1 + playerMod);

    return Math.max(1, Math.round(finalPrice));
  }

  /**
   * Calculate player's buy price modifier.
   * Negative values = discounts (good for player).
   *
   * Modifier sources:
   * - Charisma: -1% per point above 5
   * - Fame: via FameSystem or ±0.5% per 100 fame
   * - Faction reputation: up to ±20%
   * - Blessed equipment: -3% to -15%
   *
   * @param {Object} playerState - Player state with stats/fame/equipment
   * @param {Object} merchant - Merchant for faction lookup
   * @returns {number} Modifier between -0.5 and 0.5
   *
   * @private
   */
  calculatePlayerBuyModifier(playerState, merchant) {
    let modifier = 0;

    // CHARISMA BONUS: Smooth talkers get discounts
    // -1% per point above 5 (base charisma)
    const charisma = playerState.stats?.charisma || 5;
    if (charisma > 5) {
      modifier -= (charisma - 5) * 0.01;
    }

    // FAME BONUS: Famous heroes get recognition
    if (this.fameSystem) {
      modifier += this.fameSystem.calculatePriceModifier(playerState);
    } else {
      // Fallback calculation if no fame system
      const fame = playerState.fame?.value || 0;
      modifier -= (fame / 100) * 0.005;
    }

    // FACTION REPUTATION: Members get discounts
    if (merchant.factionId && playerState.factionReputation) {
      const factionRep = playerState.factionReputation[merchant.factionId]?.reputation || 0;
      modifier -= (factionRep / 100) * 0.20; // Up to 20% discount at max rep
    }

    // BLESSED EQUIPMENT: Divine favor grants discounts
    const blessedBonus = this.calculateBlessedEquipmentBonus(playerState);
    modifier -= blessedBonus;

    // Cap modifier to prevent extreme prices
    return Math.max(-0.5, Math.min(0.5, modifier));
  }

  /**
   * Calculate player's sell price modifier.
   * Positive values = better sell prices (good for player).
   *
   * @param {Object} playerState - Player state
   * @param {Object} merchant - Merchant for faction lookup
   * @returns {number} Modifier between -0.5 and 0.5
   *
   * @private
   */
  calculatePlayerSellModifier(playerState, merchant) {
    let modifier = 0;

    // CHARISMA BONUS: Better negotiation = better prices
    const charisma = playerState.stats?.charisma || 5;
    if (charisma > 5) {
      modifier += (charisma - 5) * 0.01;
    }

    // FAME BONUS
    if (this.fameSystem) {
      modifier += this.fameSystem.calculateSellPriceModifier(playerState);
    } else {
      const fame = playerState.fame?.value || 0;
      modifier += (fame / 100) * 0.005;
    }

    // FACTION REPUTATION
    if (merchant.factionId && playerState.factionReputation) {
      const factionRep = playerState.factionReputation[merchant.factionId]?.reputation || 0;
      modifier += (factionRep / 100) * 0.20;
    }

    // SLUT INFAMY PENALTY: Merchants may take advantage
    // Applies when infamy > 20, -0.2% per point above 20
    const slutInfamy = playerState.infamy?.slut || 0;
    if (slutInfamy > 20) {
      modifier -= (slutInfamy - 20) * 0.002;
    }

    return Math.max(-0.5, Math.min(0.5, modifier));
  }

  /**
   * Calculate price bonus from blessed/holy equipment.
   * Divine favor grants discounts when buying.
   *
   * @param {Object} playerState - Player state with equipment
   * @returns {number} Bonus between 0 and 0.15 (0-15%)
   *
   * @private
   */
  calculateBlessedEquipmentBonus(playerState) {
    if (!playerState.equipment) return 0;

    let bonus = 0;

    // Check each equipped item for blessed/holy tags
    for (const item of Object.values(playerState.equipment)) {
      if (item?.tags?.includes('blessed')) {
        bonus += 0.03; // 3% per blessed item
      }
      if (item?.tags?.includes('holy')) {
        bonus += 0.02; // 2% per holy item
      }
    }

    // Cap at 15% total bonus
    return Math.min(0.15, bonus);
  }

  // ============================================================================
  // TRANSACTIONS
  // Actual buy/sell operations that modify game state
  // ============================================================================

  /**
   * Buy an item from a merchant.
   * Deducts gold from player and adds item to inventory.
   *
   * @async
   * @param {Object} merchant - Merchant selling the item
   * @param {Object} item - Item to purchase
   * @param {Object} playerState - Player state (will be modified)
   * @param {number} [quantity=1] - Number to buy (for stackable items)
   * @returns {Promise<Object>} Transaction result
   * @returns {boolean} result.success - Whether transaction succeeded
   * @returns {string} [result.error] - Error message if failed
   * @returns {Object} [result.item] - The purchased item
   * @returns {number} [result.price] - Total price paid
   * @returns {number} [result.newGold] - Player's new gold balance
   *
   * @example
   * const result = await merchantSystem.buyFromMerchant(
   *   blacksmith,
   *   ironSword,
   *   playerState,
   *   1
   * );
   * if (result.success) {
   *   console.log(`Bought ${result.item.name} for ${result.price}g`);
   * }
   */
  async buyFromMerchant(merchant, item, playerState, quantity = 1) {
    // Calculate total price for quantity
    const price = this.calculateBuyPrice(item, merchant, playerState) * quantity;

    // CHECK: Can player afford this?
    if ((playerState.gold || 0) < price) {
      return {
        success: false,
        error: 'Not enough gold',
        required: price,
        have: playerState.gold || 0
      };
    }

    // TRANSACTION: Deduct gold first
    playerState.gold = (playerState.gold || 0) - price;

    // TRANSACTION: Add item to inventory
    const addResult = await this.inventorySystem.addItem(
      playerState.inventory,
      item,
      quantity
    );

    // ROLLBACK: If adding failed, refund the gold
    if (!addResult.success) {
      playerState.gold += price;
      return {
        success: false,
        error: addResult.error
      };
    }

    // UPDATE STATISTICS: Track spending for achievements/analytics
    if (!playerState.statistics) playerState.statistics = {};
    playerState.statistics.goldSpent = (playerState.statistics.goldSpent || 0) + price;

    return {
      success: true,
      item: addResult.item,
      price,
      quantity,
      newGold: playerState.gold
    };
  }

  /**
   * Sell an item to a merchant.
   * Removes item from inventory and adds gold to player.
   *
   * @async
   * @param {Object} merchant - Merchant buying the item
   * @param {Object} item - Item to sell (must be in player inventory)
   * @param {Object} playerState - Player state (will be modified)
   * @param {number} [quantity=1] - Number to sell (for stackable items)
   * @returns {Promise<Object>} Transaction result
   *
   * @example
   * const result = await merchantSystem.sellToMerchant(
   *   blacksmith,
   *   oldSword,
   *   playerState,
   *   1
   * );
   * if (result.success) {
   *   console.log(`Sold for ${result.price}g, now have ${result.newGold}g`);
   * }
   */
  async sellToMerchant(merchant, item, playerState, quantity = 1) {
    // VALIDATION: Can this item be sold?
    const canSell = this.canPlayerSellItem(item, merchant);
    if (!canSell.canSell) {
      return {
        success: false,
        error: canSell.reason
      };
    }

    // Calculate sell price
    const price = this.calculateSellPrice(item, merchant, playerState) * quantity;

    // TRANSACTION: Remove from inventory first
    const removeResult = await this.inventorySystem.removeItem(
      playerState.inventory,
      item.uniqueId,
      quantity
    );

    if (!removeResult.success) {
      return {
        success: false,
        error: removeResult.error
      };
    }

    // TRANSACTION: Add gold
    playerState.gold = (playerState.gold || 0) + price;

    // UPDATE STATISTICS
    if (!playerState.statistics) playerState.statistics = {};
    playerState.statistics.goldEarned = (playerState.statistics.goldEarned || 0) + price;
    playerState.statistics.itemsSold = (playerState.statistics.itemsSold || 0) + quantity;

    return {
      success: true,
      item,
      price,
      quantity,
      newGold: playerState.gold
    };
  }

  /**
   * Auto-sell all items marked as junk to a merchant.
   * Skips items that can't be sold (quest items, favorites, etc.).
   *
   * @async
   * @param {Object} merchant - Merchant to sell to
   * @param {Object} playerState - Player state
   * @returns {Promise<Object>} Summary of results
   * @returns {number} result.soldCount - Total items sold
   * @returns {number} result.totalGold - Total gold earned
   * @returns {Array} result.items - Details of each sold item
   * @returns {Array} result.skipped - Items that couldn't be sold
   *
   * @example
   * const result = await merchantSystem.autoSellJunk(merchant, playerState);
   * console.log(`Sold ${result.soldCount} items for ${result.totalGold}g`);
   */
  async autoSellJunk(merchant, playerState) {
    // Find all items marked as junk
    const junkItems = (playerState.inventory || []).filter(item =>
      item.userFlags?.junk === true
    );

    // Nothing to sell
    if (junkItems.length === 0) {
      return {
        success: true,
        soldCount: 0,
        totalGold: 0,
        items: []
      };
    }

    const results = {
      success: true,
      soldCount: 0,
      totalGold: 0,
      items: [],
      skipped: []
    };

    // Process each junk item
    for (const item of junkItems) {
      // Verify item can actually be sold
      const canSell = this.canPlayerSellItem(item, merchant);

      if (!canSell.canSell) {
        results.skipped.push({ item, reason: canSell.reason });
        continue;
      }

      const quantity = item.count || 1;
      const sellResult = await this.sellToMerchant(merchant, item, playerState, quantity);

      if (sellResult.success) {
        results.soldCount += quantity;
        results.totalGold += sellResult.price;
        results.items.push({
          item,
          quantity,
          price: sellResult.price
        });
      } else {
        results.skipped.push({ item, reason: sellResult.error });
      }
    }

    return results;
  }

  // ============================================================================
  // STOCK MANAGEMENT
  // Methods for generating and caching merchant inventories
  // ============================================================================

  /**
   * Get a merchant's current stock of items for sale.
   * Supports multiple stock modes: static, tag-based, and dynamic.
   * Results are cached for 10 minutes.
   *
   * @async
   * @param {Object} merchant - Merchant definition
   * @param {Object} playerState - Player state for level scaling
   * @returns {Promise<Array<Object>>} Array of items available for purchase
   *
   * @example
   * const stock = await merchantSystem.getMerchantStock(blacksmith, playerState);
   * console.log(`${blacksmith.name} has ${stock.length} items for sale`);
   */
  async getMerchantStock(merchant, playerState) {
    const sellConfig = merchant.sellConfig;
    if (!sellConfig) return [];

    // CHECK CACHE: Avoid regenerating stock too frequently
    const cacheKey = `${merchant.id}_${playerState.level}`;
    if (this.stockCache.has(cacheKey)) {
      const cached = this.stockCache.get(cacheKey);
      // Cache valid for 10 minutes
      if (Date.now() - cached.timestamp < 600000) {
        return cached.stock;
      }
    }

    let stock = [];

    // Generate stock based on configured mode
    switch (sellConfig.mode) {
      case 'static':
        // Load predefined stock from data registry
        const stockDef = await this.dataRegistry?.getContent?.('shop_inventories', sellConfig.stockId);
        if (stockDef) {
          stock = await this.generateStockFromDefinition(stockDef, playerState);
        }
        break;

      case 'tag-based':
        // Generate stock by filtering all items by tags
        stock = await this.generateTagBasedStock(sellConfig, playerState);
        break;

      case 'dynamic':
        // Randomly select from pool each time
        stock = await this.generateDynamicStock(sellConfig, playerState);
        break;

      default:
        console.warn(`Unknown sell mode: ${sellConfig.mode}`);
    }

    // Cache the generated stock
    this.stockCache.set(cacheKey, {
      stock,
      timestamp: Date.now()
    });

    return stock;
  }

  /**
   * Generate stock from a static shop inventory definition.
   * Applies level requirements and flag conditions.
   *
   * @async
   * @param {Object} stockDef - Stock definition from datapack
   * @param {Object} playerState - Player state for filtering
   * @returns {Promise<Array<Object>>} Generated stock items
   *
   * @private
   */
  async generateStockFromDefinition(stockDef, playerState) {
    const stock = [];

    for (const entry of (stockDef.items || [])) {
      // Level requirement check
      if (entry.minLevel && playerState.level < entry.minLevel) continue;
      if (entry.maxLevel && playerState.level > entry.maxLevel) continue;

      // Flag requirement check (e.g., must have completed a quest)
      if (entry.requiresFlag && !playerState.worldFlags?.[entry.requiresFlag]) continue;

      // Fetch the item definition
      const itemDef = await this.dataRegistry?.getItem?.(entry.itemId);
      if (!itemDef) continue;

      // Create an instance of the item
      const stockItem = this.inventorySystem.createItemInstance(itemDef, entry.quantity || 1);
      stockItem.stockQuantity = entry.quantity ?? Infinity;
      stockItem.restockTime = entry.restockTime || null;

      stock.push(stockItem);
    }

    return stock;
  }

  /**
   * Generate stock by filtering all items by tags.
   * Creates a catalog of all matching items.
   *
   * @async
   * @param {Object} sellConfig - Merchant's sell configuration
   * @param {Object} playerState - Player state for level filtering
   * @returns {Promise<Array<Object>>} Matching items
   *
   * @private
   */
  async generateTagBasedStock(sellConfig, playerState) {
    const allItems = this.dataRegistry?.getContentByType?.('items') || [];
    const stock = [];

    for (const item of allItems) {
      // Must match at least one sale tag
      if (!sellConfig.saleTags?.some(tag => item.tags?.includes(tag))) continue;

      // Level range check (don't sell items too high for player)
      if (item.level && item.level > playerState.level + 5) continue;

      // Rarity limit check
      if (sellConfig.maxRarity) {
        const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'divine'];
        if (rarityOrder.indexOf(item.rarity) > rarityOrder.indexOf(sellConfig.maxRarity)) continue;
      }

      const stockItem = this.inventorySystem.createItemInstance(item, 1);
      stockItem.stockQuantity = Infinity; // Tag-based stock is unlimited
      stock.push(stockItem);
    }

    return stock;
  }

  /**
   * Generate dynamic/random stock.
   * Takes a random subset from tag-based pool.
   *
   * @async
   * @param {Object} sellConfig - Merchant's sell configuration
   * @param {Object} playerState - Player state
   * @returns {Promise<Array<Object>>} Random selection of items
   *
   * @private
   */
  async generateDynamicStock(sellConfig, playerState) {
    // Start with full tag-based pool
    const pool = await this.generateTagBasedStock(sellConfig, playerState);
    const stockSize = sellConfig.stockSize || 10;

    // Shuffle using Fisher-Yates style random sort
    const shuffled = pool.sort(() => Math.random() - 0.5);

    // Take only the configured number
    return shuffled.slice(0, stockSize);
  }

  /**
   * Force refresh of a merchant's stock cache.
   * Use when in-game time passes or player completes relevant quests.
   *
   * @param {string} merchantId - ID of merchant to refresh
   *
   * @example
   * // After in-game day passes
   * merchantSystem.refreshMerchantStock('blacksmith_joe');
   */
  refreshMerchantStock(merchantId) {
    // Clear all cache entries for this merchant (across all player levels)
    for (const key of this.stockCache.keys()) {
      if (key.startsWith(merchantId)) {
        this.stockCache.delete(key);
      }
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // Helper functions for UI and game logic
  // ============================================================================

  /**
   * Get all items player can sell to a merchant with their prices.
   * Useful for building the sell UI.
   *
   * @param {Object} merchant - Merchant to sell to
   * @param {Object} playerState - Player state
   * @returns {Array<Object>} Items with sell info
   *
   * @example
   * const sellable = merchantSystem.getSellableItems(blacksmith, playerState);
   * sellable.forEach(s => {
   *   if (s.canSell) {
   *     console.log(`${s.item.name}: ${s.price}g`);
   *   }
   * });
   */
  getSellableItems(merchant, playerState) {
    const inventory = playerState.inventory || [];
    const sellable = [];

    for (const item of inventory) {
      const canSell = this.canPlayerSellItem(item, merchant);

      sellable.push({
        item,
        canSell: canSell.canSell,
        reason: canSell.reason,
        price: canSell.canSell ? this.calculateSellPrice(item, merchant, playerState) : 0
      });
    }

    return sellable;
  }

  /**
   * Get merchant stock with buy prices and affordability.
   * Useful for building the buy UI.
   *
   * @async
   * @param {Object} merchant - Merchant to buy from
   * @param {Object} playerState - Player state
   * @returns {Promise<Array<Object>>} Items with price info
   */
  async getStockWithPrices(merchant, playerState) {
    const stock = await this.getMerchantStock(merchant, playerState);

    return stock.map(item => ({
      item,
      price: this.calculateBuyPrice(item, merchant, playerState),
      canAfford: (playerState.gold || 0) >= this.calculateBuyPrice(item, merchant, playerState)
    }));
  }

  /**
   * Evaluate whether a price is a good deal for the player.
   * Compares actual price to theoretical base value.
   *
   * @param {Object} item - Item being traded
   * @param {Object} merchant - Merchant involved
   * @param {Object} playerState - Player state
   * @param {boolean} isBuying - True if player is buying, false if selling
   * @returns {{quality: string, color: string, label: string}} Deal evaluation
   *
   * @example
   * const deal = merchantSystem.evaluateDeal(sword, blacksmith, playerState, true);
   * // { quality: 'good', color: '#84cc16', label: 'Good Price' }
   */
  evaluateDeal(item, merchant, playerState, isBuying) {
    const price = isBuying
      ? this.calculateBuyPrice(item, merchant, playerState)
      : this.calculateSellPrice(item, merchant, playerState);

    const baseValue = item.value || 0;

    // Calculate ratio (lower is better for buying, higher is better for selling)
    // For selling, compare to typical 40% merchant rate
    const ratio = isBuying ? price / baseValue : price / (baseValue * 0.4);

    // Evaluate based on ratio
    if (ratio <= 0.8) return { quality: 'excellent', color: '#22c55e', label: 'Great Deal!' };
    if (ratio <= 0.95) return { quality: 'good', color: '#84cc16', label: 'Good Price' };
    if (ratio <= 1.05) return { quality: 'fair', color: '#fbbf24', label: 'Fair' };
    if (ratio <= 1.2) return { quality: 'poor', color: '#f97316', label: 'Overpriced' };
    return { quality: 'terrible', color: '#ef4444', label: 'Ripoff!' };
  }
}

export default MerchantSystem;
