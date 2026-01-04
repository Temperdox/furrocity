/**
 * PaperdollSystem - Layered character visualization system
 * 
 * Features:
 * - Multiple body regions with independent layer stacks
 * - Z-index ordering per region type
 * - Item-to-layer mapping via JSON configuration
 * - Automatic layer replacement on equip
 * - Support for state-based images (intact, damaged, destroyed)
 * - Animation support for layer transitions
 */

// ============================================================================
// LAYER DEFINITIONS - Z-order per body region
// ============================================================================

/**
 * Layer definitions for each body region
 * Higher z-index = rendered on top
 */
export const BODY_REGIONS = {
  // Full body portrait (main paperdoll)
  fullBody: {
    name: 'Full Body',
    layers: [
      { id: 'base', name: 'Base Body', zIndex: 0 },
      { id: 'skin_details', name: 'Skin Details', zIndex: 5 },
      { id: 'tattoos', name: 'Tattoos', zIndex: 10 },
      { id: 'scars', name: 'Scars', zIndex: 15 },
      { id: 'body_hair', name: 'Body Hair', zIndex: 20 },
      { id: 'genitalia', name: 'Genitalia', zIndex: 25 },
      { id: 'piercings_body', name: 'Body Piercings', zIndex: 30 },
      { id: 'lewd_accessories', name: 'Lewd Accessories', zIndex: 35 },
      { id: 'underwear_bottom', name: 'Lower Underwear', zIndex: 40 },
      { id: 'underwear_top', name: 'Upper Underwear', zIndex: 45 },
      { id: 'socks', name: 'Socks/Stockings', zIndex: 50 },
      { id: 'pants', name: 'Pants/Skirt', zIndex: 55 },
      { id: 'shirt', name: 'Shirt/Top', zIndex: 60 },
      { id: 'shoes', name: 'Footwear', zIndex: 65 },
      { id: 'gloves', name: 'Gloves', zIndex: 70 },
      { id: 'armor_legs', name: 'Leg Armor', zIndex: 75 },
      { id: 'armor_chest', name: 'Chest Armor', zIndex: 80 },
      { id: 'armor_arms', name: 'Arm Armor', zIndex: 85 },
      { id: 'belt', name: 'Belt', zIndex: 90 },
      { id: 'jacket', name: 'Jacket/Coat', zIndex: 95 },
      { id: 'cape', name: 'Cape/Cloak', zIndex: 100 },
      { id: 'helmet', name: 'Helmet', zIndex: 105 },
      { id: 'mask', name: 'Mask', zIndex: 110 },
      { id: 'accessories', name: 'Accessories', zIndex: 115 },
      { id: 'effects', name: 'Visual Effects', zIndex: 200 },
      { id: 'restraints', name: 'Restraints', zIndex: 250 },
    ]
  },

  // Head/Face region
  head: {
    name: 'Head',
    layers: [
      { id: 'base', name: 'Base', zIndex: 0 },
      { id: 'skin_tone', name: 'Skin Tone', zIndex: 5 },
      { id: 'facial_features', name: 'Facial Features', zIndex: 10 },
      { id: 'makeup_base', name: 'Base Makeup', zIndex: 15 },
      { id: 'tattoos', name: 'Face Tattoos', zIndex: 20 },
      { id: 'piercings', name: 'Face Piercings', zIndex: 25 },
      { id: 'eyebrows', name: 'Eyebrows', zIndex: 30 },
      { id: 'eyes', name: 'Eyes', zIndex: 35 },
      { id: 'eye_effects', name: 'Eye Effects', zIndex: 40 },
      { id: 'makeup_eyes', name: 'Eye Makeup', zIndex: 45 },
      { id: 'makeup_lips', name: 'Lip Color', zIndex: 50 },
      { id: 'facial_hair', name: 'Facial Hair', zIndex: 55 },
      { id: 'hair_back', name: 'Hair (Back)', zIndex: 60 },
      { id: 'ears', name: 'Ears', zIndex: 65 },
      { id: 'earrings', name: 'Earrings', zIndex: 70 },
      { id: 'hair_front', name: 'Hair (Front)', zIndex: 75 },
      { id: 'glasses', name: 'Glasses', zIndex: 80 },
      { id: 'headwear', name: 'Headwear', zIndex: 85 },
      { id: 'helmet', name: 'Helmet', zIndex: 90 },
      { id: 'mask', name: 'Mask', zIndex: 95 },
      { id: 'gag', name: 'Gag', zIndex: 100 },
      { id: 'blindfold', name: 'Blindfold', zIndex: 105 },
      { id: 'collar', name: 'Collar', zIndex: 110 },
      { id: 'effects', name: 'Effects', zIndex: 200 },
    ]
  },

  // Torso region
  torso: {
    name: 'Torso',
    layers: [
      { id: 'base', name: 'Base', zIndex: 0 },
      { id: 'skin_details', name: 'Skin Details', zIndex: 5 },
      { id: 'tattoos', name: 'Tattoos', zIndex: 10 },
      { id: 'scars', name: 'Scars', zIndex: 15 },
      { id: 'body_hair', name: 'Body Hair', zIndex: 20 },
      { id: 'nipples', name: 'Nipples', zIndex: 25 },
      { id: 'piercings', name: 'Piercings', zIndex: 30 },
      { id: 'pasties', name: 'Pasties', zIndex: 35 },
      { id: 'bra', name: 'Bra/Bralette', zIndex: 40 },
      { id: 'undershirt', name: 'Undershirt', zIndex: 45 },
      { id: 'shirt', name: 'Shirt', zIndex: 50 },
      { id: 'corset', name: 'Corset', zIndex: 55 },
      { id: 'vest', name: 'Vest', zIndex: 60 },
      { id: 'armor', name: 'Chest Armor', zIndex: 65 },
      { id: 'harness', name: 'Harness', zIndex: 70 },
      { id: 'jacket', name: 'Jacket', zIndex: 75 },
      { id: 'cape', name: 'Cape', zIndex: 80 },
      { id: 'necklace', name: 'Necklace', zIndex: 85 },
      { id: 'effects', name: 'Effects', zIndex: 200 },
      { id: 'restraints', name: 'Restraints', zIndex: 250 },
    ]
  },

  // Groin/genital region
  groin: {
    name: 'Groin',
    layers: [
      { id: 'base', name: 'Base', zIndex: 0 },
      { id: 'skin_details', name: 'Skin Details', zIndex: 5 },
      { id: 'tattoos', name: 'Tattoos', zIndex: 10 },
      { id: 'pubic_hair', name: 'Pubic Hair', zIndex: 15 },
      { id: 'genitalia', name: 'Genitalia', zIndex: 20 },
      { id: 'genital_piercings', name: 'Genital Piercings', zIndex: 25 },
      { id: 'cock_ring', name: 'Cock Ring', zIndex: 30 },
      { id: 'chastity', name: 'Chastity Device', zIndex: 35 },
      { id: 'plug', name: 'Plug', zIndex: 40 },
      { id: 'panties', name: 'Panties/Briefs', zIndex: 45 },
      { id: 'thong', name: 'Thong', zIndex: 50 },
      { id: 'jockstrap', name: 'Jockstrap', zIndex: 55 },
      { id: 'garter', name: 'Garter', zIndex: 60 },
      { id: 'shorts', name: 'Shorts', zIndex: 65 },
      { id: 'pants', name: 'Pants', zIndex: 70 },
      { id: 'skirt', name: 'Skirt', zIndex: 75 },
      { id: 'armor', name: 'Groin Armor', zIndex: 80 },
      { id: 'belt', name: 'Belt', zIndex: 85 },
      { id: 'effects', name: 'Effects', zIndex: 200 },
      { id: 'fluids', name: 'Fluids', zIndex: 210 },
    ]
  },

  // Legs region
  legs: {
    name: 'Legs',
    layers: [
      { id: 'base', name: 'Base', zIndex: 0 },
      { id: 'skin_details', name: 'Skin Details', zIndex: 5 },
      { id: 'tattoos', name: 'Tattoos', zIndex: 10 },
      { id: 'leg_hair', name: 'Leg Hair', zIndex: 15 },
      { id: 'stockings', name: 'Stockings/Thigh-highs', zIndex: 20 },
      { id: 'socks', name: 'Socks', zIndex: 25 },
      { id: 'leggings', name: 'Leggings', zIndex: 30 },
      { id: 'pants', name: 'Pants', zIndex: 35 },
      { id: 'shorts', name: 'Shorts', zIndex: 40 },
      { id: 'skirt', name: 'Skirt', zIndex: 45 },
      { id: 'leg_armor', name: 'Leg Armor', zIndex: 50 },
      { id: 'knee_pads', name: 'Knee Pads', zIndex: 55 },
      { id: 'thigh_straps', name: 'Thigh Straps', zIndex: 60 },
      { id: 'effects', name: 'Effects', zIndex: 200 },
      { id: 'restraints', name: 'Leg Restraints', zIndex: 250 },
    ]
  },

  // Arms region
  arms: {
    name: 'Arms',
    layers: [
      { id: 'base', name: 'Base', zIndex: 0 },
      { id: 'skin_details', name: 'Skin Details', zIndex: 5 },
      { id: 'tattoos', name: 'Tattoos', zIndex: 10 },
      { id: 'arm_hair', name: 'Arm Hair', zIndex: 15 },
      { id: 'sleeves', name: 'Sleeves', zIndex: 20 },
      { id: 'arm_warmers', name: 'Arm Warmers', zIndex: 25 },
      { id: 'bracers', name: 'Bracers', zIndex: 30 },
      { id: 'arm_armor', name: 'Arm Armor', zIndex: 35 },
      { id: 'gloves', name: 'Gloves', zIndex: 40 },
      { id: 'bracelets', name: 'Bracelets', zIndex: 45 },
      { id: 'watch', name: 'Watch', zIndex: 50 },
      { id: 'cuffs', name: 'Cuffs', zIndex: 55 },
      { id: 'effects', name: 'Effects', zIndex: 200 },
      { id: 'restraints', name: 'Arm Restraints', zIndex: 250 },
    ]
  },

  // Feet region  
  feet: {
    name: 'Feet',
    layers: [
      { id: 'base', name: 'Base', zIndex: 0 },
      { id: 'nail_polish', name: 'Nail Polish', zIndex: 5 },
      { id: 'toe_rings', name: 'Toe Rings', zIndex: 10 },
      { id: 'anklet', name: 'Anklet', zIndex: 15 },
      { id: 'socks', name: 'Socks', zIndex: 20 },
      { id: 'stockings', name: 'Stocking Feet', zIndex: 25 },
      { id: 'shoes', name: 'Shoes', zIndex: 30 },
      { id: 'boots', name: 'Boots', zIndex: 35 },
      { id: 'armor', name: 'Foot Armor', zIndex: 40 },
      { id: 'effects', name: 'Effects', zIndex: 200 },
      { id: 'restraints', name: 'Ankle Restraints', zIndex: 250 },
    ]
  },

  // Ass region
  ass: {
    name: 'Rear',
    layers: [
      { id: 'base', name: 'Base', zIndex: 0 },
      { id: 'skin_details', name: 'Skin Details', zIndex: 5 },
      { id: 'tattoos', name: 'Tattoos', zIndex: 10 },
      { id: 'plug', name: 'Plug', zIndex: 15 },
      { id: 'tail', name: 'Tail Plug', zIndex: 20 },
      { id: 'panties', name: 'Panties', zIndex: 25 },
      { id: 'thong', name: 'Thong', zIndex: 30 },
      { id: 'shorts', name: 'Shorts', zIndex: 35 },
      { id: 'pants', name: 'Pants', zIndex: 40 },
      { id: 'skirt', name: 'Skirt', zIndex: 45 },
      { id: 'effects', name: 'Effects', zIndex: 200 },
      { id: 'fluids', name: 'Fluids', zIndex: 210 },
    ]
  }
};

// ============================================================================
// ITEM LAYER MAPPING
// ============================================================================

/**
 * Maps item types to their layer assignments
 * Used when items are equipped to determine which layer(s) they affect
 */
export const ITEM_LAYER_MAPPING = {
  // Underwear
  briefs: { fullBody: 'underwear_bottom', groin: 'panties' },
  boxers: { fullBody: 'underwear_bottom', groin: 'panties' },
  panties: { fullBody: 'underwear_bottom', groin: 'panties' },
  thong: { fullBody: 'underwear_bottom', groin: 'thong', ass: 'thong' },
  jockstrap: { fullBody: 'underwear_bottom', groin: 'jockstrap' },
  bra: { fullBody: 'underwear_top', torso: 'bra' },
  bralette: { fullBody: 'underwear_top', torso: 'bra' },
  corset: { fullBody: 'underwear_top', torso: 'corset' },
  
  // Legwear
  stockings: { fullBody: 'socks', legs: 'stockings' },
  thigh_highs: { fullBody: 'socks', legs: 'stockings' },
  socks: { fullBody: 'socks', legs: 'socks', feet: 'socks' },
  leggings: { fullBody: 'pants', legs: 'leggings' },
  
  // Pants/Bottoms
  pants: { fullBody: 'pants', groin: 'pants', legs: 'pants' },
  shorts: { fullBody: 'pants', groin: 'shorts', legs: 'shorts' },
  skirt: { fullBody: 'pants', groin: 'skirt', legs: 'skirt' },
  
  // Tops
  shirt: { fullBody: 'shirt', torso: 'shirt' },
  crop_top: { fullBody: 'shirt', torso: 'shirt' },
  tank_top: { fullBody: 'shirt', torso: 'shirt' },
  
  // Outerwear
  jacket: { fullBody: 'jacket', torso: 'jacket' },
  coat: { fullBody: 'jacket', torso: 'jacket' },
  vest: { fullBody: 'jacket', torso: 'vest' },
  cape: { fullBody: 'cape', torso: 'cape' },
  cloak: { fullBody: 'cape', torso: 'cape' },
  
  // Armor
  chest_armor: { fullBody: 'armor_chest', torso: 'armor' },
  leg_armor: { fullBody: 'armor_legs', legs: 'leg_armor' },
  arm_armor: { fullBody: 'armor_arms', arms: 'arm_armor' },
  helmet: { fullBody: 'helmet', head: 'helmet' },
  
  // Footwear
  shoes: { fullBody: 'shoes', feet: 'shoes' },
  boots: { fullBody: 'shoes', feet: 'boots' },
  heels: { fullBody: 'shoes', feet: 'shoes' },
  sandals: { fullBody: 'shoes', feet: 'shoes' },
  
  // Accessories
  gloves: { fullBody: 'gloves', arms: 'gloves' },
  belt: { fullBody: 'belt', groin: 'belt' },
  necklace: { torso: 'necklace' },
  collar: { head: 'collar' },
  earrings: { head: 'earrings' },
  glasses: { head: 'glasses' },
  mask: { fullBody: 'mask', head: 'mask' },
  
  // Lewd items
  cock_ring: { groin: 'cock_ring' },
  chastity_cage: { groin: 'chastity' },
  chastity_belt: { groin: 'chastity', ass: 'panties' },
  butt_plug: { groin: 'plug', ass: 'plug' },
  tail_plug: { ass: 'tail' },
  nipple_clamps: { torso: 'piercings' },
  pasties: { torso: 'pasties' },
  harness: { torso: 'harness', fullBody: 'lewd_accessories' },
  
  // Piercings
  nipple_piercing: { torso: 'piercings' },
  navel_piercing: { torso: 'piercings' },
  tongue_piercing: { head: 'piercings' },
  lip_piercing: { head: 'piercings' },
  nose_piercing: { head: 'piercings' },
  eyebrow_piercing: { head: 'piercings' },
  prince_albert: { groin: 'genital_piercings' },
  jacobs_ladder: { groin: 'genital_piercings' },
  clit_piercing: { groin: 'genital_piercings' },
  
  // Restraints
  handcuffs: { arms: 'restraints', fullBody: 'restraints' },
  rope_arms: { arms: 'restraints', fullBody: 'restraints' },
  rope_legs: { legs: 'restraints', fullBody: 'restraints' },
  armbinder: { arms: 'restraints', fullBody: 'restraints' },
  spreader_bar: { legs: 'restraints', fullBody: 'restraints' },
  blindfold: { head: 'blindfold' },
  gag_ball: { head: 'gag' },
  gag_ring: { head: 'gag' },
  
  // Body modifications
  tattoo: { fullBody: 'tattoos' },
  body_tattoo: { torso: 'tattoos', fullBody: 'tattoos' },
  arm_tattoo: { arms: 'tattoos' },
  leg_tattoo: { legs: 'tattoos' },
  face_tattoo: { head: 'tattoos' },
};

// ============================================================================
// PAPERDOLL STATE CLASS
// ============================================================================

/**
 * Manages the state of all layers for a character
 */
export class PaperdollState {
  constructor(characterData = {}) {
    this.characterId = characterData.id || 'default';
    this.baseImages = characterData.baseImages || {};
    
    // Layer state per region
    // { region: { layerId: { imagePath, visible, opacity, tint, state } } }
    this.layers = {};
    
    // Initialize all regions
    for (const [regionId, regionDef] of Object.entries(BODY_REGIONS)) {
      this.layers[regionId] = {};
      for (const layer of regionDef.layers) {
        this.layers[regionId][layer.id] = {
          imagePath: null,
          visible: true,
          opacity: 1,
          tint: null,
          state: 'default', // default, damaged, destroyed
          itemId: null // Which item is providing this layer
        };
      }
    }
    
    // Set base images
    for (const [regionId, basePath] of Object.entries(this.baseImages)) {
      if (this.layers[regionId]?.base) {
        this.layers[regionId].base.imagePath = basePath;
      }
    }
  }

  /**
   * Set a layer's image
   */
  setLayer(regionId, layerId, imagePath, itemId = null) {
    if (!this.layers[regionId]?.[layerId]) {
      console.warn(`Invalid layer: ${regionId}.${layerId}`);
      return false;
    }
    
    this.layers[regionId][layerId] = {
      ...this.layers[regionId][layerId],
      imagePath,
      itemId,
      visible: true
    };
    
    return true;
  }

  /**
   * Clear a layer
   */
  clearLayer(regionId, layerId) {
    if (!this.layers[regionId]?.[layerId]) return false;
    
    this.layers[regionId][layerId] = {
      ...this.layers[regionId][layerId],
      imagePath: null,
      itemId: null
    };
    
    return true;
  }

  /**
   * Set layer visibility
   */
  setLayerVisibility(regionId, layerId, visible) {
    if (!this.layers[regionId]?.[layerId]) return false;
    this.layers[regionId][layerId].visible = visible;
    return true;
  }

  /**
   * Set layer opacity
   */
  setLayerOpacity(regionId, layerId, opacity) {
    if (!this.layers[regionId]?.[layerId]) return false;
    this.layers[regionId][layerId].opacity = Math.max(0, Math.min(1, opacity));
    return true;
  }

  /**
   * Set layer state (for damage states)
   */
  setLayerState(regionId, layerId, state) {
    if (!this.layers[regionId]?.[layerId]) return false;
    this.layers[regionId][layerId].state = state;
    return true;
  }

  /**
   * Get all visible layers for a region, sorted by z-index
   */
  getVisibleLayers(regionId) {
    const regionDef = BODY_REGIONS[regionId];
    if (!regionDef) return [];
    
    const regionLayers = this.layers[regionId];
    
    return regionDef.layers
      .filter(layer => {
        const layerState = regionLayers[layer.id];
        return layerState?.imagePath && layerState.visible;
      })
      .map(layer => ({
        ...layer,
        ...regionLayers[layer.id]
      }))
      .sort((a, b) => a.zIndex - b.zIndex);
  }

  /**
   * Get layer info
   */
  getLayer(regionId, layerId) {
    return this.layers[regionId]?.[layerId] || null;
  }

  /**
   * Serialize state for saving
   */
  serialize() {
    return {
      characterId: this.characterId,
      baseImages: this.baseImages,
      layers: this.layers
    };
  }

  /**
   * Deserialize from save data
   */
  static deserialize(data) {
    const state = new PaperdollState({ 
      id: data.characterId, 
      baseImages: data.baseImages 
    });
    state.layers = data.layers;
    return state;
  }
}

// ============================================================================
// PAPERDOLL SYSTEM CLASS
// ============================================================================

/**
 * Main system for managing paperdoll rendering and equipment
 */
export class PaperdollSystem {
  constructor(registry, options = {}) {
    this.registry = registry;
    this.imageBasePath = options.imageBasePath || '/images/paperdoll';
    this.defaultExtension = options.defaultExtension || '.png';
    this.callbacks = options.callbacks || {};
    
    // Cache for loaded item paperdoll data
    this.itemImageCache = new Map();
  }

  /**
   * Create a new paperdoll state for a character
   */
  createPaperdoll(characterData) {
    return new PaperdollState(characterData);
  }

  /**
   * Get image path for an item's paperdoll layer
   */
  getItemImagePath(item, region, layer, state = 'default') {
    // Check if item has specific paperdoll images defined
    if (item.paperdollImages) {
      const regionImages = item.paperdollImages[region];
      if (regionImages) {
        // Check for state-specific image
        if (state !== 'default' && regionImages[state]) {
          return regionImages[state];
        }
        // Default image
        if (regionImages.default || typeof regionImages === 'string') {
          return regionImages.default || regionImages;
        }
      }
    }
    
    // Generate path from convention
    // e.g., /images/paperdoll/items/briefs/fullBody_underwear_bottom.png
    const itemType = item.paperdollType || item.type;
    return `${this.imageBasePath}/items/${item.id}/${region}_${layer}${this.defaultExtension}`;
  }

  /**
   * Equip an item to the paperdoll
   */
  async equipItem(paperdollState, item, options = {}) {
    const itemType = item.paperdollType || item.type;
    const layerMapping = ITEM_LAYER_MAPPING[itemType];
    
    if (!layerMapping) {
      console.warn(`No layer mapping for item type: ${itemType}`);
      return { success: false, reason: 'No layer mapping' };
    }
    
    const changedLayers = [];
    
    // Apply to each mapped region/layer
    for (const [regionId, layerId] of Object.entries(layerMapping)) {
      const imagePath = this.getItemImagePath(item, regionId, layerId);
      
      // Check if layer is already occupied
      const existingLayer = paperdollState.getLayer(regionId, layerId);
      if (existingLayer?.itemId && existingLayer.itemId !== item.id) {
        // Unequip existing item first
        if (this.callbacks.onLayerReplace) {
          await this.callbacks.onLayerReplace(regionId, layerId, existingLayer.itemId, item.id);
        }
      }
      
      paperdollState.setLayer(regionId, layerId, imagePath, item.id);
      changedLayers.push({ regionId, layerId, imagePath });
    }
    
    if (this.callbacks.onEquip) {
      await this.callbacks.onEquip(item, changedLayers);
    }
    
    return { success: true, changedLayers };
  }

  /**
   * Unequip an item from the paperdoll
   */
  async unequipItem(paperdollState, item) {
    const itemType = item.paperdollType || item.type;
    const layerMapping = ITEM_LAYER_MAPPING[itemType];
    
    if (!layerMapping) {
      return { success: false, reason: 'No layer mapping' };
    }
    
    const clearedLayers = [];
    
    // Clear each mapped region/layer
    for (const [regionId, layerId] of Object.entries(layerMapping)) {
      const layer = paperdollState.getLayer(regionId, layerId);
      
      // Only clear if this item owns the layer
      if (layer?.itemId === item.id) {
        paperdollState.clearLayer(regionId, layerId);
        clearedLayers.push({ regionId, layerId });
      }
    }
    
    if (this.callbacks.onUnequip) {
      await this.callbacks.onUnequip(item, clearedLayers);
    }
    
    return { success: true, clearedLayers };
  }

  /**
   * Apply clothing damage to paperdoll
   */
  applyClothingDamage(paperdollState, item, damagePercent) {
    const itemType = item.paperdollType || item.type;
    const layerMapping = ITEM_LAYER_MAPPING[itemType];
    
    if (!layerMapping) return;
    
    // Determine state based on damage
    let state = 'default';
    if (damagePercent >= 100) {
      state = 'destroyed';
    } else if (damagePercent >= 50) {
      state = 'damaged';
    }
    
    // Update all layers for this item
    for (const [regionId, layerId] of Object.entries(layerMapping)) {
      const layer = paperdollState.getLayer(regionId, layerId);
      if (layer?.itemId === item.id) {
        // Update image path to damaged version if available
        const newPath = this.getItemImagePath(item, regionId, layerId, state);
        paperdollState.setLayer(regionId, layerId, newPath, item.id);
        paperdollState.setLayerState(regionId, layerId, state);
        
        // If destroyed, optionally hide the layer
        if (state === 'destroyed' && item.hidesOnDestroy) {
          paperdollState.setLayerVisibility(regionId, layerId, false);
        }
      }
    }
  }

  /**
   * Apply an effect layer (like fluids, marks, etc.)
   */
  applyEffectLayer(paperdollState, effectId, regions, imagePath, options = {}) {
    for (const regionId of regions) {
      const layerId = options.layerId || 'effects';
      paperdollState.setLayer(regionId, layerId, imagePath, `effect_${effectId}`);
      
      if (options.opacity !== undefined) {
        paperdollState.setLayerOpacity(regionId, layerId, options.opacity);
      }
    }
  }

  /**
   * Clear effect layers
   */
  clearEffectLayer(paperdollState, effectId, regions) {
    for (const regionId of regions) {
      const layerId = 'effects';
      const layer = paperdollState.getLayer(regionId, layerId);
      if (layer?.itemId === `effect_${effectId}`) {
        paperdollState.clearLayer(regionId, layerId);
      }
    }
  }

  /**
   * Apply restraint layer
   */
  applyRestraint(paperdollState, restraintType, imagePath) {
    const restraintMapping = {
      rope_arms: ['arms', 'fullBody'],
      rope_legs: ['legs', 'fullBody'],
      rope_full: ['arms', 'legs', 'torso', 'fullBody'],
      handcuffs: ['arms', 'fullBody'],
      armbinder: ['arms', 'fullBody'],
      spreader_bar: ['legs', 'fullBody'],
      hogtie: ['arms', 'legs', 'fullBody'],
      stocks: ['arms', 'head', 'fullBody'],
    };
    
    const regions = restraintMapping[restraintType] || ['fullBody'];
    
    for (const regionId of regions) {
      paperdollState.setLayer(regionId, 'restraints', imagePath, `restraint_${restraintType}`);
    }
  }

  /**
   * Clear restraint layer
   */
  clearRestraint(paperdollState, restraintType) {
    const restraintMapping = {
      rope_arms: ['arms', 'fullBody'],
      rope_legs: ['legs', 'fullBody'],
      rope_full: ['arms', 'legs', 'torso', 'fullBody'],
      handcuffs: ['arms', 'fullBody'],
      armbinder: ['arms', 'fullBody'],
      spreader_bar: ['legs', 'fullBody'],
      hogtie: ['arms', 'legs', 'fullBody'],
      stocks: ['arms', 'head', 'fullBody'],
    };
    
    const regions = restraintMapping[restraintType] || ['fullBody'];
    
    for (const regionId of regions) {
      const layer = paperdollState.getLayer(regionId, 'restraints');
      if (layer?.itemId === `restraint_${restraintType}`) {
        paperdollState.clearLayer(regionId, 'restraints');
      }
    }
  }

  /**
   * Get render data for a region
   */
  getRenderData(paperdollState, regionId) {
    const layers = paperdollState.getVisibleLayers(regionId);
    
    return {
      regionId,
      regionName: BODY_REGIONS[regionId]?.name || regionId,
      layers: layers.map(layer => ({
        id: layer.id,
        name: layer.name,
        zIndex: layer.zIndex,
        imagePath: layer.imagePath,
        opacity: layer.opacity,
        tint: layer.tint,
        state: layer.state
      }))
    };
  }

  /**
   * Get all render data
   */
  getAllRenderData(paperdollState) {
    const data = {};
    for (const regionId of Object.keys(BODY_REGIONS)) {
      data[regionId] = this.getRenderData(paperdollState, regionId);
    }
    return data;
  }
}

export default PaperdollSystem;
