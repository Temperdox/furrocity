import React, { useState, useEffect, useContext, createContext, useCallback, useMemo, useRef } from 'react';
import GameConfig from './GameConfig.js';
import MerchantView from './components/inventory/MerchantView.jsx';
import UniversalInventory from './components/inventory/UniversalInventory.jsx';
import TravelModal from './components/travel/TravelModal.jsx';
import ExpeditionScene from './components/travel/ExpeditionScene.jsx';
import LocationTitle from './components/ui/LocationTitle.jsx';
import { ExpeditionSystem } from '../engine/ExpeditionSystem.js';
import { TimeSystem, DEFAULT_TIME_COSTS } from '../engine/TimeSystem.js';
import MedievalClock from './components/ui/MedievalClock.jsx';
import { MerchantSystem } from '../engine/MerchantSystem.js';
import { InventorySystem } from '../engine/InventorySystem.js';
import { FameSystem } from '../engine/FameSystem.js';
import { UnlockSystem } from '../engine/UnlockSystem.js';
import { LocationSystem } from '../engine/LocationSystem.js';
import ReputationSystem from '../engine/ReputationSystem.js';
import RumorSystem from '../engine/RumorSystem.js';
import LocationServices from '../engine/LocationServices.js';
import LocationDiscoverySystem from '../engine/LocationDiscoverySystem.js';
import PublicEventSystem from '../engine/PublicEventSystem.js';
import LocationBarringSystem from '../engine/LocationBarringSystem.js';
import { LodgingSystem } from '../engine/LodgingSystem.js';
import { InputValidationSystem } from '../engine/InputValidationSystem.js';
import { ActionRequirementSystem } from '../engine/ActionRequirementSystem.js';
import RumorConfrontation, { RumorConfrontationResult } from './components/ui/RumorConfrontation.jsx';
import ServiceInteraction, { ServiceResult } from './components/ui/ServiceInteraction.jsx';
import ChangelogModal from './components/ui/ChangelogModal.jsx';
import SceneDisplay from './components/ui/SceneDisplay.jsx';
import DebugMenu from './components/debug/DebugMenu.jsx';
import ContentGenerator from './components/generator/ContentGenerator.jsx';

// ============================================================================
// GAME DATA STRUCTURES (JSON-DRIVEN CONTENT)
// ============================================================================

const GameData = {
  characters: [
    {
      id: "warrior_male",
      name: "Marcus the Bold",
      image: "/characters/marcus.png",
      description: "A battle-hardened warrior seeking redemption.",
      baseStats: { strength: 3, vitality: 2, evasion: 1, stamina: 2, willpower: 1, intelligence: 0, charm: 1, corruptionResistance: 0 }
    },
    {
      id: "rogue_male", 
      name: "Shade",
      image: "/characters/shade.png",
      description: "A nimble thief with a mysterious past.",
      baseStats: { strength: 1, vitality: 1, evasion: 3, stamina: 2, willpower: 1, intelligence: 1, charm: 1, corruptionResistance: 0 }
    },
    {
      id: "mage_male",
      name: "Aldric",
      image: "/characters/aldric.png", 
      description: "A scholar of forbidden arts.",
      baseStats: { strength: 0, vitality: 1, evasion: 1, stamina: 1, willpower: 2, intelligence: 3, charm: 1, corruptionResistance: 1 }
    },
    {
      id: "paladin_male",
      name: "Sir Cedric",
      image: "/characters/cedric.png",
      description: "A fallen knight seeking to restore his honor.",
      baseStats: { strength: 2, vitality: 2, evasion: 0, stamina: 2, willpower: 2, intelligence: 1, charm: 1, corruptionResistance: 0 }
    }
  ],

  difficulties: [
    { id: "easy", name: "Story Mode", description: "Relaxed gameplay, focus on narrative.", statMultiplier: 1.2, encounterRateMultiplier: 0.5, canSaveAnywhere: true },
    { id: "normal", name: "Adventure", description: "Balanced challenge.", statMultiplier: 1.0, encounterRateMultiplier: 1.0, canSaveAnywhere: true },
    { id: "hard", name: "Nightmare", description: "Brutal difficulty. Save only in safe zones.", statMultiplier: 0.8, encounterRateMultiplier: 1.5, canSaveAnywhere: false },
    { id: "nightmare", name: "Corruption", description: "One life. Maximum corruption. No mercy.", statMultiplier: 0.6, encounterRateMultiplier: 2.0, canSaveAnywhere: false, permadeath: true }
  ],

  sensitiveBodyParts: [
    { id: "chest", name: "Chest", description: "Increased sensitivity to chest stimulation" },
    { id: "mouth", name: "Mouth", description: "Increased sensitivity to oral stimulation" },
    { id: "rear", name: "Rear", description: "Increased sensitivity to rear stimulation" },
    { id: "genitals", name: "Genitals", description: "Increased sensitivity to genital stimulation" },
    { id: "neck", name: "Neck", description: "Increased sensitivity to neck stimulation" },
    { id: "ears", name: "Ears", description: "Increased sensitivity to ear stimulation" }
  ],

  challengeModifiers: [
    { id: "easy_corrupt", name: "Easily Corrupted", description: "Corruption builds faster", statPoints: 2, effect: { corruptionRate: 1.5 } },
    { id: "weak_restraints", name: "Weak Against Restraints", description: "Harder to break free", statPoints: 2, effect: { restraintResist: 0.7 } },
    { id: "low_nsfw_resist", name: "Susceptible", description: "Harder to resist advances", statPoints: 2, effect: { nsfwResist: 0.7 } },
    { id: "curse_vulnerable", name: "Curse Magnet", description: "Harder to resist and break curses", statPoints: 3, effect: { curseResist: 0.6, curseBreak: 0.6 } },
    { id: "hypno_weak", name: "Weak-Willed", description: "Easily hypnotized", statPoints: 2, effect: { hypnoResist: 0.7 } },
    { id: "addiction_prone", name: "Addictive Personality", description: "Addictions form faster", statPoints: 2, effect: { addictionRate: 1.5 } },
    { id: "disease_prone", name: "Fragile Constitution", description: "More susceptible to diseases", statPoints: 2, effect: { diseaseResist: 0.5 } },
    { id: "slow_recovery", name: "Slow Recovery", description: "Stamina recovers slower", statPoints: 1, effect: { staminaRegen: 0.7 } },
    { id: "glass_cannon", name: "Glass Cannon", description: "Deal more damage, take more damage", statPoints: 2, effect: { damageDealt: 1.3, damageTaken: 1.3 } }
  ],

  fetishTags: [
    { id: "vanilla", name: "Vanilla", category: "general", defaultEnabled: true },
    { id: "bondage", name: "Bondage", category: "restraints", defaultEnabled: false },
    { id: "hypnosis", name: "Hypnosis", category: "mind", defaultEnabled: false },
    { id: "corruption", name: "Corruption", category: "transformation", defaultEnabled: false },
    { id: "monster", name: "Monster", category: "partners", defaultEnabled: false },
    { id: "tentacles", name: "Tentacles", category: "partners", defaultEnabled: false },
    { id: "machines", name: "Machines", category: "partners", defaultEnabled: false },
    { id: "group", name: "Group", category: "general", defaultEnabled: false },
    { id: "exhibition", name: "Exhibition", category: "general", defaultEnabled: false },
    { id: "voyeur", name: "Voyeurism", category: "general", defaultEnabled: false },
    { id: "size_diff", name: "Size Difference", category: "general", defaultEnabled: false },
    { id: "transformation", name: "Transformation", category: "transformation", defaultEnabled: false },
    { id: "clothing_damage", name: "Clothing Damage", category: "general", defaultEnabled: true },
    { id: "restraint_escape", name: "Restraint Escape", category: "restraints", defaultEnabled: true }
  ],

  locations: [
    {
      id: "starting_inn",
      name: "The Weary Traveler Inn",
      description: "A cozy inn at the crossroads. The smell of ale and roasted meat fills the air.",
      image: "/locations/inn.png",
      tags: ["safe", "inn", "town", "rest"],
      encounterChance: 0,
      actions: ["rest", "interact", "shop", "move"],
      connectedLocations: ["town_square", "forest_edge", "road_north"],
      navigation: { down: "inn_cellar", up: "inn_rooms" },
      npcs: ["innkeeper_mary", "bard_tom"],
      ambiance: "warm",
      parentRegion: "crossroads",
      locked: false,
      initiallyUnlocked: true,
      mapData: { localMapPosition: { x: 150, y: 180 } },
      titleDisplay: { fontTag: "friendly_town", subtitle: "A Cozy Rest Stop" }
    },
    {
      id: "inn_cellar",
      name: "Inn Cellar",
      description: "A dark, musty cellar beneath the inn. Barrels of ale and wine line the walls.",
      image: "/locations/cellar.png",
      tags: ["safe", "cellar", "storage"],
      encounterChance: 0,
      actions: ["search", "interact"],
      connectedLocations: [],
      navigation: { up: "starting_inn" },
      npcs: [],
      ambiance: "dark",
      parentRegion: "crossroads",
      parentLocation: "starting_inn",
      locationType: "sub",
      locked: false,
      initiallyUnlocked: true,
      mapData: { localMapPosition: { x: 150, y: 180 }, hidden: true },
      titleDisplay: { fontTag: "neutral", subtitle: "Beneath the Tavern" }
    },
    {
      id: "inn_rooms",
      name: "Inn Guest Rooms",
      description: "The upper floor of the inn, with several doors leading to cozy guest rooms.",
      image: "/locations/inn_rooms.png",
      tags: ["safe", "inn", "rest", "rooms"],
      encounterChance: 0,
      actions: ["rest", "interact"],
      connectedLocations: [],
      navigation: { down: "starting_inn" },
      npcs: ["guest_merchant"],
      ambiance: "peaceful",
      parentRegion: "crossroads",
      parentLocation: "starting_inn",
      locationType: "sub",
      locked: false,
      initiallyUnlocked: true,
      mapData: { localMapPosition: { x: 150, y: 180 }, hidden: true },
      titleDisplay: { fontTag: "friendly_town", subtitle: "A Place to Rest" }
    },
    {
      id: "town_square",
      name: "Crossroads Town Square",
      description: "The bustling center of a small frontier town.",
      image: "/locations/town_square.png",
      tags: ["safe", "town", "shop"],
      encounterChance: 0,
      actions: ["interact", "shop", "move", "search"],
      connectedLocations: ["starting_inn", "blacksmith", "temple", "market"],
      npcs: ["guard_captain", "merchant_ben"],
      ambiance: "busy",
      parentRegion: "crossroads",
      locked: false,
      initiallyUnlocked: true,
      mapData: { localMapPosition: { x: 250, y: 200 } },
      titleDisplay: { fontTag: "friendly_town" }
    },
    {
      id: "forest_edge",
      name: "Darkwood Forest Edge",
      description: "The trees grow thick here. Strange sounds echo from within.",
      image: "/locations/forest_edge.png",
      tags: ["wilderness", "forest", "dangerous"],
      encounterChance: 30,
      maxEnemyCount: 2,
      enemyTables: ["forest_beasts", "bandits"],
      lootTables: ["forest_loot", "bandit_loot"],
      actions: ["explore", "search", "move", "rest"],
      connectedLocations: ["starting_inn", "deep_forest", "forest_clearing"],
      ambiance: "eerie",
      parentRegion: "crossroads",
      locked: false,
      initiallyUnlocked: true,
      neighbors: ["deep_forest", "bandit_hideout"],
      mapData: { localMapPosition: { x: 380, y: 150 } },
      titleDisplay: { fontTag: "hostile_forest", subtitle: "Where the Wild Things Are" }
    },
    {
      id: "deep_forest",
      name: "Darkwood Depths",
      description: "Ancient trees block out the sun. The air is thick with mystery.",
      image: "/locations/deep_forest.png",
      tags: ["wilderness", "forest", "dangerous", "dark"],
      encounterChance: 50,
      maxEnemyCount: 3,
      enemyTables: ["forest_beasts", "forest_creatures"],
      lootTables: ["forest_loot", "rare_herbs"],
      actions: ["explore", "search", "move"],
      connectedLocations: ["forest_edge", "ancient_ruins", "witch_hut"],
      ambiance: "dark",
      parentRegion: "darkwood",
      locked: true,
      unlockRequirements: { type: "visited_location", location: "forest_edge" },
      discoverableWhileExploring: true,
      discoveryChance: 0.2,
      mapData: { localMapPosition: { x: 200, y: 200 } },
      titleDisplay: { fontTag: "hostile_forest", subtitle: "Into the Darkness" }
    },
    {
      id: "bandit_hideout",
      name: "Bandit Hideout",
      description: "A cave system converted into a criminal stronghold.",
      image: "/locations/bandit_cave.png",
      tags: ["dungeon", "dangerous", "hostile", "cave"],
      encounterChance: 75,
      maxEnemyCount: 4,
      enemyTables: ["bandits", "bandit_dogs"],
      lootTables: ["bandit_loot", "stolen_goods"],
      actions: ["explore", "search", "move", "stealth"],
      connectedLocations: ["forest_edge", "hidden_tunnel"],
      ambiance: "hostile",
      parentRegion: "crossroads",
      locked: true,
      unlockRequirements: { type: "level", value: 3, operator: ">=" },
      discoverableWhileExploring: true,
      discoveryChance: 0.15,
      dangerLevel: 3,
      mapData: { localMapPosition: { x: 420, y: 280 } },
      titleDisplay: { fontTag: "cave", subtitle: "Den of Thieves" }
    }
  ],

  enemyTables: {
    forest_beasts: [
      { id: "wolf", weight: 40 },
      { id: "bear", weight: 20 },
      { id: "boar", weight: 30 },
      { id: "giant_spider", weight: 10 }
    ],
    bandits: [
      { id: "bandit_grunt", weight: 50 },
      { id: "bandit_archer", weight: 30 },
      { id: "bandit_brute", weight: 15 },
      { id: "bandit_leader", weight: 5 }
    ],
    bandit_dogs: [
      { id: "guard_dog", weight: 70 },
      { id: "war_hound", weight: 30 }
    ],
    forest_creatures: [
      { id: "treant", weight: 20 },
      { id: "dryad", weight: 30 },
      { id: "forest_spirit", weight: 25 },
      { id: "corrupted_beast", weight: 25 }
    ]
  },

  enemies: {
    wolf: {
      id: "wolf",
      name: "Wolf",
      baseStats: { hp: 30, attack: 8, defense: 3, speed: 12, level: 1 },
      tags: ["beast", "pack", "natural"],
      lootTable: "wolf_loot",
      abilities: ["bite", "howl", "pounce"],
      grappleChance: 20,
      restraintType: "pin"
    },
    bandit_grunt: {
      id: "bandit_grunt",
      name: "Bandit",
      baseStats: { hp: 50, attack: 10, defense: 5, speed: 8, level: 2 },
      tags: ["humanoid", "bandit", "armed"],
      lootTable: "bandit_loot",
      abilities: ["slash", "kick", "grapple"],
      grappleChance: 35,
      restraintType: "hold"
    },
    bandit_brute: {
      id: "bandit_brute",
      name: "Bandit Brute",
      baseStats: { hp: 80, attack: 15, defense: 8, speed: 5, level: 4 },
      tags: ["humanoid", "bandit", "strong"],
      lootTable: "bandit_loot",
      abilities: ["heavy_strike", "grab", "crush"],
      grappleChance: 50,
      restraintType: "bear_hug"
    },
    guard_dog: {
      id: "guard_dog",
      name: "Guard Dog",
      baseStats: { hp: 25, attack: 7, defense: 2, speed: 14, level: 1 },
      tags: ["beast", "dog", "trained"],
      lootTable: "dog_loot",
      abilities: ["bite", "tackle"],
      grappleChance: 30,
      restraintType: "pin"
    }
  },

  lootTables: {
    wolf_loot: [
      { itemId: "wolf_pelt", dropChance: 80, minCount: 1, maxCount: 1 },
      { itemId: "wolf_fang", dropChance: 50, minCount: 1, maxCount: 2 },
      { itemId: "raw_meat", dropChance: 60, minCount: 1, maxCount: 2 }
    ],
    bandit_loot: [
      { itemId: "gold", dropChance: 90, minCount: 5, maxCount: 25 },
      { itemId: "rusty_sword", dropChance: 30, minCount: 1, maxCount: 1 },
      { itemId: "leather_scraps", dropChance: 40, minCount: 1, maxCount: 3 },
      { itemId: "healing_potion", dropChance: 20, minCount: 1, maxCount: 1 }
    ],
    forest_loot: [
      { itemId: "herb_common", dropChance: 60, minCount: 1, maxCount: 3 },
      { itemId: "mushroom", dropChance: 40, minCount: 1, maxCount: 2 },
      { itemId: "wood", dropChance: 70, minCount: 1, maxCount: 5 }
    ]
  },

  itemRarities: [
    { id: "common", name: "Common", color: "#9CA3AF", dropWeight: 50, statMultiplier: 1.0 },
    { id: "uncommon", name: "Uncommon", color: "#22C55E", dropWeight: 25, statMultiplier: 1.2 },
    { id: "rare", name: "Rare", color: "#3B82F6", dropWeight: 15, statMultiplier: 1.5 },
    { id: "epic", name: "Epic", color: "#A855F7", dropWeight: 7, statMultiplier: 1.8 },
    { id: "legendary", name: "Legendary", color: "#F59E0B", dropWeight: 2.5, statMultiplier: 2.2 },
    { id: "mythical", name: "Mythical", color: "#EC4899", dropWeight: 0.4, statMultiplier: 2.8 },
    { id: "divine", name: "Divine", color: "#FBBF24", dropWeight: 0.1, statMultiplier: 3.5, glowEffect: true }
  ],

  curseRarities: [
    { id: "minor", name: "Minor", color: "#6B7280", severity: 1 },
    { id: "dreadful", name: "Dreadful", color: "#7C3AED", severity: 2 },
    { id: "malicious", name: "Malicious", color: "#DC2626", severity: 3 },
    { id: "malignant", name: "Malignant", color: "#991B1B", severity: 4 },
    { id: "evil", name: "Evil", color: "#450A0A", severity: 5 },
    { id: "diabolical", name: "Diabolical", color: "#000000", severity: 6, glowEffect: true }
  ],

  itemNameParts: {
    prefixes: {
      common: ["Worn", "Old", "Simple", "Basic", "Plain"],
      uncommon: ["Sturdy", "Fine", "Polished", "Quality", "Reinforced"],
      rare: ["Masterwork", "Enchanted", "Gleaming", "Runic", "Blessed"],
      epic: ["Arcane", "Legendary", "Heroic", "Majestic", "Radiant"],
      legendary: ["Mythic", "Ancient", "Celestial", "Primordial", "Eternal"],
      mythical: ["Godforged", "Transcendent", "Omnipotent", "Infinite", "Cosmic"],
      divine: ["Divine", "Holy", "Sacred", "Hallowed", "Sanctified"]
    },
    curseAdjectives: ["Cursed", "Tainted", "Corrupted", "Defiled", "Wicked", "Twisted", "Profane"],
    suffixes: {
      strength: ["of Might", "of the Titan", "of Power", "of Brawn", "of the Giant"],
      evasion: ["of Shadows", "of the Wind", "of Swiftness", "of Agility", "of the Phantom"],
      vitality: ["of Endurance", "of the Oak", "of Fortitude", "of Resilience", "of Life"],
      intelligence: ["of Wisdom", "of the Sage", "of Knowledge", "of the Scholar", "of Insight"],
      willpower: ["of Resolve", "of the Paladin", "of Spirit", "of the Monk", "of Determination"],
      corruption: ["of Purity", "of Cleansing", "of the Light", "of Sanctity", "of Grace"]
    }
  },

  baseItems: {
    rusty_sword: {
      id: "rusty_sword",
      baseName: "Sword",
      type: "weapon",
      slot: "main_hand",
      baseStats: { attack: 5 },
      tags: ["sword", "melee", "blade"]
    },
    leather_armor: {
      id: "leather_armor",
      baseName: "Leather Armor",
      type: "armor",
      slot: "chest",
      baseStats: { defense: 3 },
      tags: ["light", "armor", "leather"],
      clothingLevel: 2,
      paperdollType: "chest_armor",
      paperdollImages: {
        fullBody: "/images/paperdoll/armor/leather_chest_fullbody.png",
        torso: "/images/paperdoll/armor/leather_chest_torso.png"
      }
    },
    cloth_pants: {
      id: "cloth_pants",
      baseName: "Cloth Pants",
      type: "armor",
      slot: "legs",
      baseStats: { defense: 1 },
      tags: ["cloth", "pants", "light"],
      clothingLevel: 1,
      paperdollType: "pants",
      paperdollImages: {
        fullBody: "/images/paperdoll/clothing/cloth_pants_fullbody.png",
        groin: "/images/paperdoll/clothing/cloth_pants_groin.png",
        legs: "/images/paperdoll/clothing/cloth_pants_legs.png"
      }
    },
    healing_potion: {
      id: "healing_potion",
      baseName: "Healing Potion",
      type: "consumable",
      effect: { heal: 30 },
      tags: ["potion", "healing"]
    },
    gold: {
      id: "gold",
      baseName: "Gold",
      type: "currency",
      stackable: true,
      tags: ["currency", "gold"]
    },
    // Underwear items with paperdoll
    cotton_briefs: {
      id: "cotton_briefs",
      baseName: "Cotton Briefs",
      name: "White Cotton Briefs",
      type: "clothing",
      category: "underwear",
      slot: "underwear_lower",
      rarity: "common",
      tags: ["underwear", "briefs", "cotton"],
      paperdollType: "briefs",
      paperdollImages: {
        fullBody: "/images/paperdoll/clothing/briefs/cotton_white_fullbody.png",
        groin: "/images/paperdoll/clothing/briefs/cotton_white_groin.png"
      },
      clothingState: { maxIntegrity: 50, exposureThreshold: 20 }
    },
    lace_thong: {
      id: "lace_thong",
      baseName: "Lace Thong",
      name: "Black Lace Thong",
      type: "clothing",
      category: "underwear",
      slot: "underwear_lower",
      rarity: "uncommon",
      tags: ["underwear", "thong", "lace", "sexy"],
      paperdollType: "thong",
      paperdollImages: {
        fullBody: "/images/paperdoll/clothing/thong/lace_black_fullbody.png",
        groin: "/images/paperdoll/clothing/thong/lace_black_groin.png",
        ass: "/images/paperdoll/clothing/thong/lace_black_ass.png"
      },
      stats: { charm: 2 },
      clothingState: { maxIntegrity: 30, exposureThreshold: 10 }
    },
    silk_stockings: {
      id: "silk_stockings",
      baseName: "Silk Stockings",
      name: "Black Silk Stockings",
      type: "clothing",
      category: "legwear",
      slot: "legwear",
      rarity: "uncommon",
      tags: ["legwear", "stockings", "silk", "sexy"],
      paperdollType: "stockings",
      paperdollImages: {
        fullBody: "/images/paperdoll/clothing/stockings/silk_black_fullbody.png",
        legs: "/images/paperdoll/clothing/stockings/silk_black_legs.png",
        feet: "/images/paperdoll/clothing/stockings/silk_black_feet.png"
      },
      stats: { charm: 3, evasion: 1 },
      clothingState: { maxIntegrity: 40, exposureThreshold: 15 }
    },
    // Lewd items with paperdoll
    steel_chastity_cage: {
      id: "steel_chastity_cage",
      baseName: "Chastity Cage",
      name: "Steel Chastity Cage",
      type: "clothing",
      category: "lewd",
      slot: "genitals",
      rarity: "rare",
      tags: ["lewd", "chastity", "steel", "restraint"],
      paperdollType: "chastity_cage",
      paperdollImages: {
        groin: "/images/paperdoll/lewd/chastity/steel_cage_groin.png"
      },
      lockable: true,
      requiresKey: "chastity_key_steel"
    },
    silver_cock_ring: {
      id: "silver_cock_ring",
      baseName: "Cock Ring",
      name: "Silver Cock Ring",
      type: "clothing",
      category: "lewd",
      slot: "genitals",
      rarity: "uncommon",
      tags: ["lewd", "cock_ring", "silver"],
      paperdollType: "cock_ring",
      paperdollImages: {
        groin: "/images/paperdoll/lewd/cockring/silver_groin.png"
      },
      stats: { stamina: 5 }
    },
    fox_tail_plug: {
      id: "fox_tail_plug",
      baseName: "Tail Plug",
      name: "Fox Tail Butt Plug",
      type: "clothing",
      category: "lewd",
      slot: "plug",
      rarity: "uncommon",
      tags: ["lewd", "plug", "tail", "fox"],
      paperdollType: "tail_plug",
      paperdollImages: {
        ass: "/images/paperdoll/lewd/plugs/fox_tail_ass.png",
        fullBody: "/images/paperdoll/lewd/plugs/fox_tail_fullbody.png"
      },
      stats: { charm: 3 }
    },
    // Piercings with paperdoll
    jacobs_ladder_steel: {
      id: "jacobs_ladder_steel",
      baseName: "Jacob's Ladder",
      name: "Steel Jacob's Ladder",
      type: "piercing",
      category: "piercing",
      slot: "genital_piercing",
      rarity: "rare",
      tags: ["piercing", "genital", "jacobs_ladder", "permanent"],
      paperdollType: "jacobs_ladder",
      paperdollImages: {
        groin: "/images/paperdoll/piercings/jacobs_ladder_steel.png",
        fullBody: "/images/paperdoll/piercings/jacobs_ladder_steel_fullbody.png"
      },
      permanent: true,
      stats: { charm: 2 }
    },
    prince_albert_gold: {
      id: "prince_albert_gold",
      baseName: "Prince Albert",
      name: "Gold Prince Albert",
      type: "piercing",
      category: "piercing",
      slot: "genital_piercing",
      rarity: "epic",
      tags: ["piercing", "genital", "prince_albert", "permanent"],
      paperdollType: "prince_albert",
      paperdollImages: {
        groin: "/images/paperdoll/piercings/prince_albert_gold.png"
      },
      permanent: true,
      stats: { charm: 4 }
    },
    // Restraints with paperdoll
    hemp_rope: {
      id: "hemp_rope",
      baseName: "Rope Bindings",
      name: "Hemp Rope Bindings",
      type: "restraint",
      category: "bondage",
      slot: "restraint",
      rarity: "common",
      tags: ["restraint", "rope", "hemp"],
      paperdollType: "rope_arms",
      paperdollImages: {
        arms: "/images/paperdoll/restraints/rope_hemp_arms.png",
        fullBody: "/images/paperdoll/restraints/rope_hemp_fullbody.png"
      },
      restraintStats: { hp: 40, breakDifficulty: 6 }
    },
    leather_armbinder: {
      id: "leather_armbinder",
      baseName: "Armbinder",
      name: "Leather Armbinder",
      type: "restraint",
      category: "bondage",
      slot: "restraint",
      rarity: "rare",
      tags: ["restraint", "armbinder", "leather", "strict"],
      paperdollType: "armbinder",
      paperdollImages: {
        arms: "/images/paperdoll/restraints/armbinder_leather_arms.png",
        fullBody: "/images/paperdoll/restraints/armbinder_leather_fullbody.png",
        torso: "/images/paperdoll/restraints/armbinder_leather_torso.png"
      },
      restraintStats: { hp: 80, breakDifficulty: 10 },
      lockable: true
    },
    leather_collar: {
      id: "leather_collar",
      baseName: "Collar",
      name: "Black Leather Collar",
      type: "clothing",
      category: "accessory",
      slot: "neck",
      rarity: "common",
      tags: ["accessory", "collar", "leather"],
      paperdollType: "collar",
      paperdollImages: {
        head: "/images/paperdoll/accessories/collar_leather_black.png",
        fullBody: "/images/paperdoll/accessories/collar_leather_black_fullbody.png"
      },
      lockable: true
    },
    // Tattoos with paperdoll
    dragon_back_tattoo: {
      id: "dragon_back_tattoo",
      baseName: "Tattoo",
      name: "Dragon Back Tattoo",
      type: "tattoo",
      category: "bodymod",
      slot: "tattoo_back",
      rarity: "rare",
      tags: ["tattoo", "dragon", "back", "permanent"],
      paperdollType: "back_tattoo",
      paperdollImages: {
        fullBody: "/images/paperdoll/tattoos/dragon_back_fullbody.png",
        torso: "/images/paperdoll/tattoos/dragon_back_torso.png"
      },
      permanent: true,
      stats: { charm: 2, willpower: 1 }
    }
  },

  restraints: {
    pin: { id: "pin", name: "Pinned", hp: 20, breakDifficulty: 1, description: "Held down by weight" },
    hold: { id: "hold", name: "Grabbed", hp: 30, breakDifficulty: 1.2, description: "Arms restrained" },
    bear_hug: { id: "bear_hug", name: "Bear Hug", hp: 50, breakDifficulty: 1.5, description: "Crushing grip" },
    rope_bind: { id: "rope_bind", name: "Rope Bound", hp: 40, breakDifficulty: 1.3, description: "Tied with rope" },
    chain_bind: { id: "chain_bind", name: "Chained", hp: 60, breakDifficulty: 1.8, description: "Locked in chains" },
    magic_bind: { id: "magic_bind", name: "Magical Bonds", hp: 45, breakDifficulty: 2.0, description: "Arcane restraints" }
  },

  scenes: {
    intro_full: {
      id: "intro_full",
      type: "cutscene",
      tags: ["intro", "story"],
      dialogue: [
        { speaker: "narrator", text: "The world has fallen into darkness..." },
        { speaker: "narrator", text: "You awaken in a small room at the Weary Traveler Inn, memories fragmented." },
        { speaker: "narrator", text: "Outside, you hear the sounds of a world in chaos." },
        { speaker: "narrator", text: "Your journey begins now..." }
      ]
    },
    intro_short: {
      id: "intro_short",
      type: "cutscene",
      tags: ["intro", "story"],
      dialogue: [
        { speaker: "narrator", text: "You awaken at the Weary Traveler Inn. Your journey begins." }
      ]
    }
  },

  // Achievement Definitions
  achievements: {
    // Exploration achievements
    first_steps: { 
      id: "first_steps", 
      name: "First Steps", 
      description: "Leave the starting inn for the first time",
      icon: "🚶",
      category: "exploration",
      rarity: "common",
      hidden: false
    },
    cartographer: { 
      id: "cartographer", 
      name: "Cartographer", 
      description: "Discover all locations",
      icon: "🗺️",
      category: "exploration",
      rarity: "legendary",
      hidden: false
    },
    deep_delver: { 
      id: "deep_delver", 
      name: "Deep Delver", 
      description: "Explore the Darkwood Depths",
      icon: "🌲",
      category: "exploration",
      rarity: "uncommon",
      hidden: false
    },
    
    // Combat achievements
    first_blood: { 
      id: "first_blood", 
      name: "First Blood", 
      description: "Win your first combat",
      icon: "⚔️",
      category: "combat",
      rarity: "common",
      hidden: false
    },
    slayer: { 
      id: "slayer", 
      name: "Slayer", 
      description: "Defeat 50 enemies",
      icon: "💀",
      category: "combat",
      rarity: "rare",
      hidden: false,
      progress: { current: 0, target: 50 }
    },
    untouchable: { 
      id: "untouchable", 
      name: "Untouchable", 
      description: "Win a combat without taking damage",
      icon: "🛡️",
      category: "combat",
      rarity: "epic",
      hidden: false
    },
    escape_artist: { 
      id: "escape_artist", 
      name: "Escape Artist", 
      description: "Successfully flee from 10 combats",
      icon: "🏃",
      category: "combat",
      rarity: "uncommon",
      hidden: false,
      progress: { current: 0, target: 10 }
    },
    
    // Loot achievements
    treasure_hunter: { 
      id: "treasure_hunter", 
      name: "Treasure Hunter", 
      description: "Find your first item",
      icon: "📦",
      category: "loot",
      rarity: "common",
      hidden: false
    },
    golden_touch: { 
      id: "golden_touch", 
      name: "Golden Touch", 
      description: "Accumulate 10,000 gold",
      icon: "🪙",
      category: "loot",
      rarity: "rare",
      hidden: false,
      progress: { current: 0, target: 10000 }
    },
    mythic_finder: { 
      id: "mythic_finder", 
      name: "Mythic Finder", 
      description: "Find a mythic rarity item",
      icon: "⭐",
      category: "loot",
      rarity: "mythic",
      hidden: false
    },
    divine_blessing: { 
      id: "divine_blessing", 
      name: "Divine Blessing", 
      description: "Find a divine rarity item",
      icon: "✦",
      category: "loot",
      rarity: "divine",
      hidden: true
    },
    
    // Progress achievements
    level_5: { 
      id: "level_5", 
      name: "Apprentice", 
      description: "Reach level 5",
      icon: "📈",
      category: "progress",
      rarity: "common",
      hidden: false
    },
    level_10: { 
      id: "level_10", 
      name: "Journeyman", 
      description: "Reach level 10",
      icon: "📊",
      category: "progress",
      rarity: "uncommon",
      hidden: false
    },
    level_25: { 
      id: "level_25", 
      name: "Expert", 
      description: "Reach level 25",
      icon: "🏅",
      category: "progress",
      rarity: "rare",
      hidden: false
    },
    level_50: { 
      id: "level_50", 
      name: "Master", 
      description: "Reach level 50",
      icon: "👑",
      category: "progress",
      rarity: "epic",
      hidden: false
    },
    
    // NSFW achievements
    first_encounter: { 
      id: "first_encounter", 
      name: "First Encounter", 
      description: "Experience your first NSFW scene",
      icon: "💋",
      category: "nsfw",
      rarity: "common",
      hidden: false
    },
    corruption_10: { 
      id: "corruption_10", 
      name: "Tainted", 
      description: "Reach 10% corruption",
      icon: "🌑",
      category: "nsfw",
      rarity: "common",
      hidden: false
    },
    corruption_50: { 
      id: "corruption_50", 
      name: "Fallen", 
      description: "Reach 50% corruption",
      icon: "😈",
      category: "nsfw",
      rarity: "uncommon",
      hidden: false
    },
    corruption_100: { 
      id: "corruption_100", 
      name: "Completely Corrupted", 
      description: "Reach 100% corruption",
      icon: "👿",
      category: "nsfw",
      rarity: "rare",
      hidden: true
    },
    curse_breaker: { 
      id: "curse_breaker", 
      name: "Curse Breaker", 
      description: "Remove a curse",
      icon: "✨",
      category: "nsfw",
      rarity: "uncommon",
      hidden: false
    },
    restraint_master: { 
      id: "restraint_master", 
      name: "Restraint Master", 
      description: "Break free from 25 restraints",
      icon: "⛓️",
      category: "nsfw",
      rarity: "rare",
      hidden: false,
      progress: { current: 0, target: 25 }
    },
    
    // Secret/Hidden achievements
    secret_ending: { 
      id: "secret_ending", 
      name: "???", 
      description: "Hidden achievement",
      icon: "❓",
      category: "secret",
      rarity: "legendary",
      hidden: true,
      revealedName: "True Ending",
      revealedDescription: "Discover the true ending"
    },
    speedrunner: { 
      id: "speedrunner", 
      name: "???", 
      description: "Hidden achievement",
      icon: "❓",
      category: "secret",
      rarity: "epic",
      hidden: true,
      revealedName: "Speedrunner",
      revealedDescription: "Complete the game in under 2 hours"
    }
  },

  // Achievement rarity colors
  achievementRarities: {
    common: { color: '#9ca3af', glow: null },
    uncommon: { color: '#22c55e', glow: null },
    rare: { color: '#3b82f6', glow: null },
    epic: { color: '#a855f7', glow: null },
    legendary: { color: '#f97316', glow: '0 0 10px rgba(249, 115, 22, 0.5)' },
    mythic: { color: '#ffd700', glow: '0 0 15px rgba(255, 215, 0, 0.5)' },
    divine: { color: '#ffd700', glow: '0 0 20px rgba(255, 215, 0, 0.7), 0 0 40px rgba(255, 215, 0, 0.4)' }
  },

  skills: {
    // Combat skills
    power_strike: { id: "power_strike", name: "Power Strike", type: "active", category: "combat", cost: { stamina: 15 }, effect: { damage: 1.5 }, cooldown: 2, description: "A powerful blow dealing 150% damage" },
    dodge_roll: { id: "dodge_roll", name: "Dodge Roll", type: "active", category: "combat", cost: { stamina: 10 }, effect: { evasionBoost: 50, duration: 1 }, cooldown: 3, description: "Quick dodge, +50% evasion for 1 turn" },
    guard: { id: "guard", name: "Guard", type: "active", category: "combat", cost: { stamina: 5 }, effect: { defenseBoost: 100, duration: 1 }, cooldown: 2, description: "Defensive stance, double defense for 1 turn" },
    
    // Resistance skills
    iron_will: { id: "iron_will", name: "Iron Will", type: "passive", category: "resistance", effect: { willpowerBoost: 20 }, description: "+20% willpower" },
    mental_fortress: { id: "mental_fortress", name: "Mental Fortress", type: "active", category: "resistance", cost: { stamina: 20 }, effect: { hypnoResist: 100, duration: 3 }, cooldown: 5, description: "Immunity to hypnosis for 3 turns" },
    
    // Recovery skills
    second_wind: { id: "second_wind", name: "Second Wind", type: "active", category: "recovery", cost: { stamina: 0 }, effect: { staminaRestore: 30, hpRestore: 10 }, cooldown: 10, description: "Recover 30% stamina and 10% HP" },
    meditation: { id: "meditation", name: "Meditation", type: "active", category: "recovery", cost: { stamina: 5 }, effect: { corruptionReduce: 5 }, cooldown: 5, description: "Reduce corruption by 5" }
  },

  skillTrees: {
    warrior: {
      name: "Warrior",
      skills: ["power_strike", "guard", "iron_will"],
      requirements: { strength: 5 }
    },
    rogue: {
      name: "Rogue", 
      skills: ["dodge_roll", "stealth_strike"],
      requirements: { evasion: 5 }
    },
    mystic: {
      name: "Mystic",
      skills: ["mental_fortress", "meditation"],
      requirements: { willpower: 5 }
    }
  },

  // ============================================================================
  // PAPERDOLL SYSTEM - Layer definitions for character visualization
  // ============================================================================
  
  paperdollLayers: {
    // Full body portrait layers (z-index order)
    fullBody: [
      { id: 'base', name: 'Base Body', zIndex: 0 },
      { id: 'skin_details', name: 'Skin Details', zIndex: 5 },
      { id: 'tattoos', name: 'Tattoos', zIndex: 10 },
      { id: 'scars', name: 'Scars', zIndex: 15 },
      { id: 'body_hair', name: 'Body Hair', zIndex: 20 },
      { id: 'genitalia', name: 'Genitalia', zIndex: 25 },
      { id: 'piercings_body', name: 'Body Piercings', zIndex: 30 },
      { id: 'genital_piercings', name: 'Genital Piercings', zIndex: 32 },
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
      { id: 'fluids', name: 'Fluids', zIndex: 210 },
      { id: 'restraints', name: 'Restraints', zIndex: 250 }
    ],
    // Head region
    head: [
      { id: 'base', name: 'Base', zIndex: 0 },
      { id: 'facial_features', name: 'Facial Features', zIndex: 10 },
      { id: 'tattoos', name: 'Face Tattoos', zIndex: 20 },
      { id: 'piercings', name: 'Face Piercings', zIndex: 25 },
      { id: 'eyes', name: 'Eyes', zIndex: 35 },
      { id: 'makeup', name: 'Makeup', zIndex: 45 },
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
      { id: 'effects', name: 'Effects', zIndex: 200 }
    ],
    // Torso/Chest region
    torso: [
      { id: 'base', name: 'Base', zIndex: 0 },
      { id: 'tattoos', name: 'Tattoos', zIndex: 10 },
      { id: 'body_hair', name: 'Body Hair', zIndex: 20 },
      { id: 'nipples', name: 'Nipples', zIndex: 25 },
      { id: 'piercings', name: 'Piercings', zIndex: 30 },
      { id: 'pasties', name: 'Pasties', zIndex: 35 },
      { id: 'bra', name: 'Bra/Bralette', zIndex: 40 },
      { id: 'undershirt', name: 'Undershirt', zIndex: 45 },
      { id: 'shirt', name: 'Shirt', zIndex: 50 },
      { id: 'corset', name: 'Corset', zIndex: 55 },
      { id: 'armor', name: 'Chest Armor', zIndex: 65 },
      { id: 'harness', name: 'Harness', zIndex: 70 },
      { id: 'jacket', name: 'Jacket', zIndex: 75 },
      { id: 'necklace', name: 'Necklace', zIndex: 85 },
      { id: 'effects', name: 'Effects', zIndex: 200 },
      { id: 'fluids', name: 'Fluids', zIndex: 210 },
      { id: 'restraints', name: 'Restraints', zIndex: 250 }
    ],
    // Groin/genital region
    groin: [
      { id: 'base', name: 'Base', zIndex: 0 },
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
      { id: 'armor', name: 'Groin Armor', zIndex: 80 },
      { id: 'effects', name: 'Effects', zIndex: 200 },
      { id: 'fluids', name: 'Fluids', zIndex: 210 }
    ],
    // Legs region
    legs: [
      { id: 'base', name: 'Base', zIndex: 0 },
      { id: 'tattoos', name: 'Tattoos', zIndex: 10 },
      { id: 'leg_hair', name: 'Leg Hair', zIndex: 15 },
      { id: 'stockings', name: 'Stockings/Thigh-highs', zIndex: 20 },
      { id: 'socks', name: 'Socks', zIndex: 25 },
      { id: 'leggings', name: 'Leggings', zIndex: 30 },
      { id: 'pants', name: 'Pants', zIndex: 35 },
      { id: 'shorts', name: 'Shorts', zIndex: 40 },
      { id: 'skirt', name: 'Skirt', zIndex: 45 },
      { id: 'leg_armor', name: 'Leg Armor', zIndex: 50 },
      { id: 'thigh_straps', name: 'Thigh Straps', zIndex: 60 },
      { id: 'effects', name: 'Effects', zIndex: 200 },
      { id: 'restraints', name: 'Leg Restraints', zIndex: 250 }
    ],
    // Ass region
    ass: [
      { id: 'base', name: 'Base', zIndex: 0 },
      { id: 'tattoos', name: 'Tattoos', zIndex: 10 },
      { id: 'plug', name: 'Plug', zIndex: 15 },
      { id: 'tail', name: 'Tail Plug', zIndex: 20 },
      { id: 'panties', name: 'Panties', zIndex: 25 },
      { id: 'thong', name: 'Thong', zIndex: 30 },
      { id: 'shorts', name: 'Shorts', zIndex: 35 },
      { id: 'pants', name: 'Pants', zIndex: 40 },
      { id: 'effects', name: 'Effects', zIndex: 200 },
      { id: 'fluids', name: 'Fluids', zIndex: 210 }
    ],
    // Arms region
    arms: [
      { id: 'base', name: 'Base', zIndex: 0 },
      { id: 'tattoos', name: 'Tattoos', zIndex: 10 },
      { id: 'arm_hair', name: 'Arm Hair', zIndex: 15 },
      { id: 'sleeves', name: 'Sleeves', zIndex: 20 },
      { id: 'arm_warmers', name: 'Arm Warmers', zIndex: 25 },
      { id: 'bracers', name: 'Bracers', zIndex: 30 },
      { id: 'arm_armor', name: 'Arm Armor', zIndex: 35 },
      { id: 'gloves', name: 'Gloves', zIndex: 40 },
      { id: 'bracelets', name: 'Bracelets', zIndex: 45 },
      { id: 'cuffs', name: 'Cuffs', zIndex: 55 },
      { id: 'effects', name: 'Effects', zIndex: 200 },
      { id: 'restraints', name: 'Arm Restraints', zIndex: 250 }
    ],
    // Feet region
    feet: [
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
      { id: 'restraints', name: 'Ankle Restraints', zIndex: 250 }
    ]
  },

  // Maps item paperdollType to which layer(s) it affects in each region
  paperdollItemMapping: {
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
    stockings: { fullBody: 'socks', legs: 'stockings', feet: 'stockings' },
    thigh_highs: { fullBody: 'socks', legs: 'stockings' },
    socks: { fullBody: 'socks', legs: 'socks', feet: 'socks' },
    leggings: { fullBody: 'pants', legs: 'leggings' },
    
    // Pants/Bottoms
    pants: { fullBody: 'pants', groin: 'pants', legs: 'pants', ass: 'pants' },
    shorts: { fullBody: 'pants', groin: 'shorts', legs: 'shorts', ass: 'shorts' },
    skirt: { fullBody: 'pants', groin: 'shorts', legs: 'skirt' },
    
    // Tops
    shirt: { fullBody: 'shirt', torso: 'shirt' },
    crop_top: { fullBody: 'shirt', torso: 'shirt' },
    tank_top: { fullBody: 'shirt', torso: 'shirt' },
    
    // Outerwear
    jacket: { fullBody: 'jacket', torso: 'jacket' },
    coat: { fullBody: 'jacket', torso: 'jacket' },
    vest: { fullBody: 'jacket', torso: 'vest' },
    cape: { fullBody: 'cape' },
    cloak: { fullBody: 'cape' },
    
    // Armor
    chest_armor: { fullBody: 'armor_chest', torso: 'armor' },
    leg_armor: { fullBody: 'armor_legs', legs: 'leg_armor' },
    arm_armor: { fullBody: 'armor_arms', arms: 'arm_armor' },
    helmet: { fullBody: 'helmet', head: 'helmet' },
    
    // Footwear
    shoes: { fullBody: 'shoes', feet: 'shoes' },
    boots: { fullBody: 'shoes', feet: 'boots' },
    heels: { fullBody: 'shoes', feet: 'shoes' },
    
    // Accessories
    gloves: { fullBody: 'gloves', arms: 'gloves' },
    belt: { fullBody: 'belt', groin: 'garter' },
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
    tail_plug: { ass: 'tail', fullBody: 'lewd_accessories' },
    nipple_clamps: { torso: 'piercings' },
    pasties: { torso: 'pasties' },
    harness: { torso: 'harness', fullBody: 'lewd_accessories' },
    
    // Piercings
    nipple_piercing: { torso: 'piercings' },
    prince_albert: { groin: 'genital_piercings', fullBody: 'genital_piercings' },
    jacobs_ladder: { groin: 'genital_piercings', fullBody: 'genital_piercings' },
    clit_piercing: { groin: 'genital_piercings' },
    tongue_piercing: { head: 'piercings' },
    lip_piercing: { head: 'piercings' },
    nose_piercing: { head: 'piercings' },
    
    // Restraints
    handcuffs: { arms: 'restraints', fullBody: 'restraints' },
    rope_arms: { arms: 'restraints', fullBody: 'restraints' },
    rope_legs: { legs: 'restraints', fullBody: 'restraints' },
    armbinder: { arms: 'restraints', fullBody: 'restraints' },
    spreader_bar: { legs: 'restraints', fullBody: 'restraints' },
    blindfold: { head: 'blindfold' },
    gag_ball: { head: 'gag' },
    gag_ring: { head: 'gag' },
    
    // Tattoos
    body_tattoo: { fullBody: 'tattoos', torso: 'tattoos' },
    arm_tattoo: { arms: 'tattoos' },
    leg_tattoo: { legs: 'tattoos' },
    face_tattoo: { head: 'tattoos' },
    back_tattoo: { fullBody: 'tattoos', torso: 'tattoos' },
    groin_tattoo: { groin: 'tattoos' }
  },

  // Body region display configuration (for stats screen)
  bodyRegionDisplay: [
    { id: 'head', name: 'Head', icon: '👤', statKey: null },
    { id: 'torso', name: 'Chest', icon: '👕', statKey: 'chest' },
    { id: 'groin', name: 'Groin', icon: '🩲', statKey: 'genitals' },
    { id: 'ass', name: 'Rear', icon: '🍑', statKey: 'rear' },
    { id: 'legs', name: 'Legs', icon: '🦵', statKey: null },
    { id: 'arms', name: 'Arms', icon: '💪', statKey: null }
  ]
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const generateId = () => Math.random().toString(36).substring(2, 15);

const rollDice = (sides) => Math.floor(Math.random() * sides) + 1;

const rollChance = (percentage) => Math.random() * 100 < percentage;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const pickWeighted = (items) => {
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || item.dropWeight || 1), 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight || item.dropWeight || 1;
    if (random <= 0) return item;
  }
  return items[items.length - 1];
};

const generateItemName = (baseItem, rarity, curse = null, bonusStat = null) => {
  const parts = GameData.itemNameParts;
  let name = "";
  
  // Add curse prefix if cursed
  if (curse) {
    const curseAdj = parts.curseAdjectives[Math.floor(Math.random() * parts.curseAdjectives.length)];
    name += curseAdj + " ";
  }
  
  // Add rarity prefix
  const prefixes = parts.prefixes[rarity] || parts.prefixes.common;
  name += prefixes[Math.floor(Math.random() * prefixes.length)] + " ";
  
  // Add base name
  name += baseItem.baseName;
  
  // Add stat suffix if applicable
  if (bonusStat && parts.suffixes[bonusStat]) {
    const suffixes = parts.suffixes[bonusStat];
    name += " " + suffixes[Math.floor(Math.random() * suffixes.length)];
  }
  
  return name;
};

const scaleStats = (baseStats, level, difficulty) => {
  const scaled = {};
  const difficultyMod = GameData.difficulties.find(d => d.id === difficulty)?.statMultiplier || 1;
  
  for (const [stat, value] of Object.entries(baseStats)) {
    scaled[stat] = Math.floor(value * (1 + (level - 1) * 0.15) * difficultyMod);
  }
  return scaled;
};

// ============================================================================
// PAPERDOLL SYSTEM FUNCTIONS
// ============================================================================

/**
 * Get the layer definition for a region
 */
const getPaperdollLayerDef = (regionId, layerId) => {
  const regionLayers = GameData.paperdollLayers[regionId];
  if (!regionLayers) return null;
  return regionLayers.find(l => l.id === layerId);
};

/**
 * Get all visible layers for a region, sorted by z-index
 */
const getVisiblePaperdollLayers = (paperdollState, regionId) => {
  const regionLayers = GameData.paperdollLayers[regionId];
  if (!regionLayers || !paperdollState?.layers?.[regionId]) return [];
  
  const stateLayers = paperdollState.layers[regionId];
  
  return regionLayers
    .filter(layerDef => {
      const layerState = stateLayers[layerDef.id];
      return layerState?.imagePath && layerState.visible !== false;
    })
    .map(layerDef => ({
      ...layerDef,
      ...stateLayers[layerDef.id]
    }))
    .sort((a, b) => a.zIndex - b.zIndex);
};

/**
 * Set a paperdoll layer
 */
const setPaperdollLayer = (paperdollState, regionId, layerId, imagePath, itemId = null) => {
  if (!paperdollState.layers[regionId]) {
    paperdollState.layers[regionId] = {};
  }
  
  paperdollState.layers[regionId][layerId] = {
    imagePath,
    itemId,
    visible: true,
    opacity: 1,
    state: 'default'
  };
  
  return paperdollState;
};

/**
 * Clear a paperdoll layer
 */
const clearPaperdollLayer = (paperdollState, regionId, layerId) => {
  if (paperdollState.layers[regionId]?.[layerId]) {
    paperdollState.layers[regionId][layerId] = {
      imagePath: null,
      itemId: null,
      visible: true,
      opacity: 1,
      state: 'default'
    };
  }
  return paperdollState;
};

/**
 * Equip an item to the paperdoll
 */
const equipItemToPaperdoll = (paperdollState, item) => {
  const paperdollType = item.paperdollType || item.type;
  const layerMapping = GameData.paperdollItemMapping[paperdollType];
  
  if (!layerMapping) return paperdollState;
  
  // Apply to each mapped region/layer
  for (const [regionId, layerId] of Object.entries(layerMapping)) {
    // Get the image path from item
    let imagePath = null;
    if (item.paperdollImages) {
      const regionImages = item.paperdollImages[regionId];
      if (regionImages) {
        imagePath = typeof regionImages === 'string' ? regionImages : regionImages.default;
      }
    }
    
    // Fallback to generated path
    if (!imagePath && item.id) {
      imagePath = `/images/paperdoll/items/${item.id}/${regionId}_${layerId}.png`;
    }
    
    if (imagePath) {
      setPaperdollLayer(paperdollState, regionId, layerId, imagePath, item.id);
    }
  }
  
  return paperdollState;
};

/**
 * Unequip an item from the paperdoll
 */
const unequipItemFromPaperdoll = (paperdollState, item) => {
  const paperdollType = item.paperdollType || item.type;
  const layerMapping = GameData.paperdollItemMapping[paperdollType];
  
  if (!layerMapping) return paperdollState;
  
  // Clear each mapped region/layer if owned by this item
  for (const [regionId, layerId] of Object.entries(layerMapping)) {
    const layer = paperdollState.layers[regionId]?.[layerId];
    if (layer?.itemId === item.id) {
      clearPaperdollLayer(paperdollState, regionId, layerId);
    }
  }
  
  return paperdollState;
};

/**
 * Apply clothing damage to paperdoll layers
 */
const applyPaperdollDamage = (paperdollState, item, damagePercent) => {
  const paperdollType = item.paperdollType || item.type;
  const layerMapping = GameData.paperdollItemMapping[paperdollType];
  
  if (!layerMapping) return paperdollState;
  
  // Determine state based on damage
  let state = 'default';
  if (damagePercent >= 100) {
    state = 'destroyed';
  } else if (damagePercent >= 50) {
    state = 'damaged';
  }
  
  // Update all layers for this item
  for (const [regionId, layerId] of Object.entries(layerMapping)) {
    const layer = paperdollState.layers[regionId]?.[layerId];
    if (layer?.itemId === item.id) {
      // Try to get damage-state specific image
      if (item.paperdollImages?.[regionId]?.[state]) {
        layer.imagePath = item.paperdollImages[regionId][state];
      }
      layer.state = state;
      
      // Hide if destroyed and item specifies
      if (state === 'destroyed') {
        layer.visible = false;
      }
    }
  }
  
  return paperdollState;
};

/**
 * Apply effect layer to paperdoll (fluids, marks, etc.)
 */
const applyPaperdollEffect = (paperdollState, effectId, regions, imagePath, options = {}) => {
  for (const regionId of regions) {
    const layerId = options.layerId || 'effects';
    setPaperdollLayer(paperdollState, regionId, layerId, imagePath, `effect_${effectId}`);
    
    if (options.opacity !== undefined && paperdollState.layers[regionId]?.[layerId]) {
      paperdollState.layers[regionId][layerId].opacity = options.opacity;
    }
  }
  return paperdollState;
};

/**
 * Apply restraint layer to paperdoll
 */
const applyPaperdollRestraint = (paperdollState, restraintType, imagePath) => {
  const restraintRegions = {
    rope_arms: ['arms', 'fullBody'],
    rope_legs: ['legs', 'fullBody'],
    rope_full: ['arms', 'legs', 'torso', 'fullBody'],
    handcuffs: ['arms', 'fullBody'],
    armbinder: ['arms', 'fullBody', 'torso'],
    spreader_bar: ['legs', 'fullBody'],
    hogtie: ['arms', 'legs', 'fullBody'],
    blindfold: ['head'],
    gag: ['head']
  };
  
  const regions = restraintRegions[restraintType] || ['fullBody'];
  
  for (const regionId of regions) {
    setPaperdollLayer(paperdollState, regionId, 'restraints', imagePath, `restraint_${restraintType}`);
  }
  
  return paperdollState;
};

/**
 * Clear restraint from paperdoll
 */
const clearPaperdollRestraint = (paperdollState, restraintType) => {
  const restraintRegions = {
    rope_arms: ['arms', 'fullBody'],
    rope_legs: ['legs', 'fullBody'],
    rope_full: ['arms', 'legs', 'torso', 'fullBody'],
    handcuffs: ['arms', 'fullBody'],
    armbinder: ['arms', 'fullBody', 'torso'],
    spreader_bar: ['legs', 'fullBody'],
    hogtie: ['arms', 'legs', 'fullBody'],
    blindfold: ['head'],
    gag: ['head']
  };
  
  const regions = restraintRegions[restraintType] || ['fullBody'];
  
  for (const regionId of regions) {
    const layer = paperdollState.layers[regionId]?.restraints;
    if (layer?.itemId === `restraint_${restraintType}`) {
      clearPaperdollLayer(paperdollState, regionId, 'restraints');
    }
  }
  
  return paperdollState;
};

/**
 * Helper to equip item and update both equipment and paperdoll state
 */
const equipItemWithPaperdoll = (player, slot, item) => {
  // If there's an existing item in the slot, unequip it from paperdoll first
  const existingItem = player.equipment[slot];
  let newPaperdoll = { ...player.paperdoll };
  
  if (existingItem) {
    newPaperdoll = unequipItemFromPaperdoll(newPaperdoll, existingItem);
  }
  
  // Equip new item to paperdoll
  if (item) {
    newPaperdoll = equipItemToPaperdoll(newPaperdoll, item);
  }
  
  return {
    ...player,
    equipment: {
      ...player.equipment,
      [slot]: item
    },
    paperdoll: newPaperdoll
  };
};

/**
 * Helper to unequip item and update both equipment and paperdoll state
 */
const unequipItemWithPaperdoll = (player, slot) => {
  const existingItem = player.equipment[slot];
  let newPaperdoll = { ...player.paperdoll };
  
  if (existingItem) {
    newPaperdoll = unequipItemFromPaperdoll(newPaperdoll, existingItem);
  }
  
  return {
    ...player,
    equipment: {
      ...player.equipment,
      [slot]: null
    },
    paperdoll: newPaperdoll
  };
};

/**
 * Sync all current equipment to paperdoll (useful for loading saves)
 */
const syncEquipmentToPaperdoll = (player) => {
  let newPaperdoll = { ...player.paperdoll };
  
  // Clear all item layers first
  for (const regionId of Object.keys(newPaperdoll.layers || {})) {
    for (const layerId of Object.keys(newPaperdoll.layers[regionId] || {})) {
      const layer = newPaperdoll.layers[regionId][layerId];
      if (layer?.itemId && !layer.itemId.startsWith('effect_') && !layer.itemId.startsWith('restraint_')) {
        clearPaperdollLayer(newPaperdoll, regionId, layerId);
      }
    }
  }
  
  // Apply all equipped items
  for (const [slot, item] of Object.entries(player.equipment || {})) {
    if (item) {
      newPaperdoll = equipItemToPaperdoll(newPaperdoll, item);
    }
  }
  
  return {
    ...player,
    paperdoll: newPaperdoll
  };
};

// ============================================================================
// GAME CONTEXT & STATE MANAGEMENT
// ============================================================================

const defaultPlayerState = {
  id: null,
  characterId: null,
  name: "",
  level: 1,
  experience: 0,
  experienceToNext: 100,
  
  // Core stats
  stats: {
    strength: 5,
    vitality: 5,
    evasion: 5,
    stamina: 5,
    willpower: 5,
    intelligence: 5,
    charm: 5,
    corruptionResistance: 5
  },
  
  // Derived stats
  currentHp: 100,
  maxHp: 100,
  currentStamina: 100,
  maxStamina: 100,
  currentMana: 50,
  maxMana: 50,
  
  // NSFW Stats
  nsfwStats: {
    corruption: 0,
    maxCorruption: 100,
    purity: 100,
    masculinity: 50,
    dominance: 50,
    
    sensitiveAreas: [],
    
    bodyMeasurements: {
      chestSize: 0,
      hipSize: 0,
      rearSize: 0,
      genitalSize: 5,
      testicleSize: 3
    },
    
    orificeStats: {
      mouth: { penetrationCount: 0, stretchLevel: 0, currentFluids: 0 },
      rear: { penetrationCount: 0, stretchLevel: 0, currentFluids: 0 },
      other: { penetrationCount: 0, stretchLevel: 0, currentFluids: 0 }
    },
    
    sexualHistory: {
      oralGiven: 0,
      oralReceived: 0,
      analGiven: 0,
      analReceived: 0,
      otherGiven: 0,
      otherReceived: 0,
      totalEncounters: 0
    },
    
    debuffs: [],
    addictions: [],
    diseases: [],
    curses: []
  },
  
  // Modifiers from character creation
  modifiers: [],
  modifierEffects: {},
  
  // Equipment
  equipment: {
    head: null,
    chest: null,
    legs: null,
    feet: null,
    hands: null,
    main_hand: null,
    off_hand: null,
    accessory1: null,
    accessory2: null
  },
  
  // Clothing state for NSFW mechanics
  clothingState: {
    head: { equipped: null, integrity: 100, exposed: false },
    chest: { equipped: null, integrity: 100, exposed: false },
    legs: { equipped: null, integrity: 100, exposed: false },
    feet: { equipped: null, integrity: 100, exposed: false },
    hands: { equipped: null, integrity: 100, exposed: false }
  },
  
  // Inventory
  inventory: [],
  gold: 100, // Starting gold for new players
  
  // Skills
  unlockedSkills: [],
  equippedSkills: [],
  skillPoints: 0,
  
  // Quest tracking
  activeQuests: [],
  completedQuests: [],
  
  // Achievement tracking
  unlockedAchievements: [],
  achievementProgress: {}, // For achievements with progress bars
  
  // Statistics for achievement tracking
  stats_tracking: {
    enemiesDefeated: 0,
    combatsWon: 0,
    combatsFled: 0,
    damageDealt: 0,
    damageTaken: 0,
    itemsFound: 0,
    goldEarned: 0,
    restraintsBroken: 0,
    cursesRemoved: 0,
    nsfwScenesViewed: 0
  },
  
  // Location
  currentLocation: "starting_inn",
  currentRegion: "crossroads",
  visitedLocations: ["starting_inn"],
  visitedRegions: ["crossroads"],
  unlockedLocations: ["starting_inn", "town_square", "forest_edge"],
  unlockedRegions: ["crossroads"],
  discoveredLocations: [],
  
  // Combat state
  inCombat: false,
  restraintState: null,
  combatEffects: [],
  
  // Paperdoll state - tracks which images are displayed per layer
  paperdoll: {
    baseImages: {
      fullBody: null, // Path to base character image
      head: null,
      torso: null,
      groin: null,
      legs: null,
      arms: null,
      ass: null,
      feet: null
    },
    // Layer states per region: { layerId: { imagePath, itemId, visible, opacity, state } }
    layers: {
      fullBody: {},
      head: {},
      torso: {},
      groin: {},
      legs: {},
      arms: {},
      ass: {},
      feet: {}
    },
    // Track interaction counts for each region (for display)
    regionCounts: {
      head: 0,
      torso: 0,
      groin: 0,
      ass: 0,
      legs: 0,
      arms: 0,
      mouth: 0,
      ears: 0
    }
  }
};

const defaultGameState = {
  // Meta
  saveSlot: null,
  playTime: 0,
  lastSaveTime: null,
  difficulty: "normal",
  
  // Preferences
  enabledTags: ["vanilla", "clothing_damage", "restraint_escape"],
  disabledTags: [],
  
  // World state
  worldFlags: {},
  npcRelationships: {},
  
  // Current scene
  currentScene: null,
  dialogueIndex: 0
};

const GameContext = createContext();

const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
};

// ============================================================================
// GAME SYSTEMS
// ============================================================================

// Save/Load System
const SaveSystem = {
  AUTOSAVE_KEY: "rpg_autosave",
  SAVE_PREFIX: "rpg_save_",
  MAX_SAVES: 20,

  save: (slot, playerState, gameState) => {
    const saveData = {
      player: playerState,
      game: gameState,
      timestamp: Date.now(),
      version: "1.0.0"
    };
    
    try {
      localStorage.setItem(
        slot === "auto" ? SaveSystem.AUTOSAVE_KEY : SaveSystem.SAVE_PREFIX + slot,
        JSON.stringify(saveData)
      );
      return true;
    } catch (e) {
      console.error("Save failed:", e);
      return false;
    }
  },

  load: (slot) => {
    try {
      const key = slot === "auto" ? SaveSystem.AUTOSAVE_KEY : SaveSystem.SAVE_PREFIX + slot;
      const data = localStorage.getItem(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (e) {
      console.error("Load failed:", e);
      return null;
    }
  },

  delete: (slot) => {
    const key = slot === "auto" ? SaveSystem.AUTOSAVE_KEY : SaveSystem.SAVE_PREFIX + slot;
    localStorage.removeItem(key);
  },

  listSaves: () => {
    const saves = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(SaveSystem.SAVE_PREFIX) || key === SaveSystem.AUTOSAVE_KEY) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          saves.push({
            slot: key === SaveSystem.AUTOSAVE_KEY ? "auto" : key.replace(SaveSystem.SAVE_PREFIX, ""),
            playerName: data.player.name,
            level: data.player.level,
            location: data.player.currentLocation,
            timestamp: data.timestamp,
            difficulty: data.game.difficulty,
            playTime: data.game.playTime
          });
        } catch (e) {
          console.error("Error reading save:", key);
        }
      }
    }
    return saves.sort((a, b) => b.timestamp - a.timestamp);
  },

  hasAutosave: () => {
    return localStorage.getItem(SaveSystem.AUTOSAVE_KEY) !== null;
  }
};

// Combat System
const CombatSystem = {
  calculateDamage: (attacker, defender, skill = null) => {
    const baseAttack = attacker.stats?.attack || attacker.stats?.strength * 2 || 10;
    const defense = defender.stats?.defense || defender.stats?.vitality || 5;
    const skillMod = skill?.effect?.damage || 1;
    
    const damage = Math.max(1, Math.floor((baseAttack * skillMod) - (defense * 0.5)));
    const variance = damage * 0.2;
    return Math.floor(damage + (Math.random() * variance * 2 - variance));
  },

  calculateHitChance: (attacker, defender) => {
    const attackerSpeed = attacker.stats?.speed || attacker.stats?.evasion || 5;
    const defenderEvasion = defender.stats?.evasion || 5;
    return clamp(70 + (attackerSpeed - defenderEvasion) * 2, 20, 95);
  },

  attemptGrapple: (enemy, player) => {
    const grappleChance = enemy.grappleChance || 20;
    const playerEvasion = player.stats.evasion;
    const modifiedChance = grappleChance - (playerEvasion * 0.5);
    return rollChance(modifiedChance);
  },

  calculateResistDamage: (player, restraint) => {
    const strength = player.stats.strength;
    const breakMod = player.modifierEffects?.restraintResist || 1;
    const baseDamage = 5 + (strength * 2);
    return Math.floor(baseDamage / (restraint.breakDifficulty * (2 - breakMod)));
  },

  attemptResist: (player, restraint) => {
    if (player.currentStamina < player.maxStamina * 0.1) {
      return { success: false, reason: "Too exhausted to resist!" };
    }
    
    const damage = CombatSystem.calculateResistDamage(player, restraint);
    return { success: true, damage, staminaCost: player.maxStamina * 0.1 };
  },

  generateEncounter: (location, playerLevel, difficulty, nightModifier = 0) => {
    // Calculate total encounter chance: base * difficulty multiplier + night bonus
    const diffMultiplier = GameData.difficulties.find(d => d.id === difficulty)?.encounterRateMultiplier || 1;
    const baseChance = location.encounterChance * diffMultiplier;
    const nightBonus = location.encounterChance * nightModifier; // nightModifier is 0.0 to 0.35
    const totalChance = Math.min(100, baseChance + nightBonus);

    if (!rollChance(totalChance)) {
      return null;
    }

    const enemies = [];
    const numEnemies = rollDice(location.maxEnemyCount || 1);
    
    for (let i = 0; i < numEnemies; i++) {
      const table = location.enemyTables[Math.floor(Math.random() * location.enemyTables.length)];
      const enemyList = GameData.enemyTables[table];
      if (!enemyList) continue;
      
      const enemyEntry = pickWeighted(enemyList);
      const enemyTemplate = GameData.enemies[enemyEntry.id];
      if (!enemyTemplate) continue;
      
      const scaledLevel = Math.max(1, playerLevel + rollDice(3) - 2);
      enemies.push({
        ...enemyTemplate,
        uniqueId: generateId(),
        level: scaledLevel,
        stats: scaleStats(enemyTemplate.baseStats, scaledLevel, difficulty),
        currentHp: scaleStats(enemyTemplate.baseStats, scaledLevel, difficulty).hp
      });
    }
    
    return enemies.length > 0 ? enemies : null;
  },

  generateLoot: (enemies, location, playerLevel, difficulty) => {
    const loot = [];
    const diffData = GameData.difficulties.find(d => d.id === difficulty);
    
    for (const enemy of enemies) {
      const lootTableId = enemy.lootTable;
      const lootTable = GameData.lootTables[lootTableId];
      if (!lootTable) continue;
      
      for (const lootEntry of lootTable) {
        if (rollChance(lootEntry.dropChance)) {
          const count = rollDice(lootEntry.maxCount - lootEntry.minCount + 1) + lootEntry.minCount - 1;
          const baseItem = GameData.baseItems[lootEntry.itemId];
          if (!baseItem) continue;
          
          // Determine rarity
          const rarity = pickWeighted(GameData.itemRarities);
          
          // Check for curse
          const curse = rollChance(10) ? pickWeighted(GameData.curseRarities) : null;
          
          // Generate bonus stat
          const statKeys = Object.keys(GameData.itemNameParts.suffixes);
          const bonusStat = rollChance(50) ? statKeys[Math.floor(Math.random() * statKeys.length)] : null;
          
          const item = {
            ...baseItem,
            uniqueId: generateId(),
            name: generateItemName(baseItem, rarity.id, curse, bonusStat),
            rarity: rarity.id,
            rarityColor: rarity.color,
            curse: curse,
            bonusStat: bonusStat,
            count: count,
            stats: baseItem.baseStats ? Object.fromEntries(
              Object.entries(baseItem.baseStats).map(([k, v]) => [k, Math.floor(v * rarity.statMultiplier)])
            ) : {}
          };
          
          loot.push(item);
        }
      }
    }
    
    return loot;
  }
};

// Tag Filtering System
const TagSystem = {
  isSceneAllowed: (sceneTags, enabledTags, disabledTags) => {
    // Check if any tag is in the blacklist
    for (const tag of sceneTags) {
      if (disabledTags.includes(tag)) return false;
    }
    // Check if at least one tag is in the whitelist
    for (const tag of sceneTags) {
      if (enabledTags.includes(tag)) return true;
    }
    return false;
  },

  findAlternativeScene: (scenes, enabledTags, disabledTags, requiredContext) => {
    return scenes.find(scene => 
      TagSystem.isSceneAllowed(scene.tags, enabledTags, disabledTags) &&
      scene.context === requiredContext
    );
  }
};

// ============================================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================================

const ToastContext = createContext();

const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

// Toast type configurations
const TOAST_TYPES = {
  // System notifications (gray base)
  system: {
    background: 'linear-gradient(135deg, rgba(55, 55, 65, 0.95) 0%, rgba(45, 45, 55, 0.95) 100%)',
    border: 'rgba(100, 100, 120, 0.6)',
    text: '#c4c4cc',
    icon: '⚙️'
  },
  save: {
    background: 'linear-gradient(135deg, rgba(55, 55, 65, 0.95) 0%, rgba(45, 45, 55, 0.95) 100%)',
    border: 'rgba(100, 100, 120, 0.6)',
    text: '#c4c4cc',
    icon: '💾'
  },
  load: {
    background: 'linear-gradient(135deg, rgba(55, 55, 65, 0.95) 0%, rgba(45, 45, 55, 0.95) 100%)',
    border: 'rgba(100, 100, 120, 0.6)',
    text: '#c4c4cc',
    icon: '📂'
  },
  
  // Progress notifications (blue/purple theme)
  experience: {
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
    border: 'rgba(99, 102, 241, 0.6)',
    text: '#a5b4fc',
    icon: '✨'
  },
  levelup: {
    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(217, 70, 239, 0.3) 100%)',
    border: 'rgba(192, 132, 252, 0.8)',
    text: '#e9d5ff',
    glow: '0 0 20px rgba(168, 85, 247, 0.5)',
    icon: '🌟'
  },
  skillUnlock: {
    background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
    border: 'rgba(34, 211, 238, 0.6)',
    text: '#a5f3fc',
    icon: '📖'
  },
  
  // Debuff/negative notifications (orange/red theme)
  debuff: {
    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(239, 68, 68, 0.2) 100%)',
    border: 'rgba(249, 115, 22, 0.6)',
    text: '#fed7aa',
    icon: '⚠️'
  },
  damage: {
    background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.25) 0%, rgba(185, 28, 28, 0.25) 100%)',
    border: 'rgba(248, 113, 113, 0.6)',
    text: '#fecaca',
    icon: '💥'
  },
  
  // Healing/positive effect notifications (green theme)
  heal: {
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.2) 100%)',
    border: 'rgba(34, 197, 94, 0.6)',
    text: '#bbf7d0',
    icon: '💚'
  },
  buff: {
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
    border: 'rgba(74, 222, 128, 0.6)',
    text: '#bbf7d0',
    icon: '⬆️'
  },
  
  // Currency notifications (gold/amber theme)
  gold: {
    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%)',
    border: 'rgba(251, 191, 36, 0.6)',
    text: '#fde68a',
    icon: '🪙'
  },
  
  // Quest notifications (teal theme)
  quest: {
    background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
    border: 'rgba(45, 212, 191, 0.6)',
    text: '#99f6e4',
    icon: '📜'
  },
  questComplete: {
    background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.3) 0%, rgba(34, 197, 94, 0.3) 100%)',
    border: 'rgba(45, 212, 191, 0.8)',
    text: '#99f6e4',
    glow: '0 0 15px rgba(20, 184, 166, 0.4)',
    icon: '🏆'
  },
  
  // Combat notifications
  combat: {
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)',
    border: 'rgba(239, 68, 68, 0.5)',
    text: '#fca5a5',
    icon: '⚔️'
  },
  escape: {
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(74, 222, 128, 0.2) 100%)',
    border: 'rgba(74, 222, 128, 0.6)',
    text: '#bbf7d0',
    icon: '🏃'
  },
  
  // Generic item (fallback)
  item: {
    background: 'linear-gradient(135deg, rgba(82, 82, 91, 0.9) 0%, rgba(63, 63, 70, 0.9) 100%)',
    border: 'rgba(161, 161, 170, 0.5)',
    text: '#d4d4d8',
    icon: '📦'
  }
};

// Item rarity color configurations
const RARITY_STYLES = {
  common: {
    background: 'linear-gradient(135deg, rgba(82, 82, 91, 0.9) 0%, rgba(63, 63, 70, 0.9) 100%)',
    border: 'rgba(161, 161, 170, 0.5)',
    text: '#d4d4d8',
    leftAccent: '#a1a1aa'
  },
  uncommon: {
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.15) 100%)',
    border: 'rgba(34, 197, 94, 0.5)',
    text: '#86efac',
    leftAccent: '#22c55e'
  },
  rare: {
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)',
    border: 'rgba(96, 165, 250, 0.5)',
    text: '#93c5fd',
    leftAccent: '#3b82f6'
  },
  epic: {
    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)',
    border: 'rgba(192, 132, 252, 0.5)',
    text: '#d8b4fe',
    leftAccent: '#a855f7'
  },
  legendary: {
    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.2) 100%)',
    border: 'rgba(251, 146, 60, 0.6)',
    text: '#fed7aa',
    leftAccent: '#f97316'
  },
  mythic: {
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 193, 7, 0.15) 100%)',
    border: 'rgba(255, 215, 0, 0.7)',
    text: '#ffd700',
    leftAccent: '#ffd700',
    isGolden: true
  },
  divine: {
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.25) 0%, rgba(255, 248, 220, 0.2) 100%)',
    border: 'rgba(255, 215, 0, 0.9)',
    text: '#fff8dc',
    leftAccent: '#ffd700',
    isGolden: true,
    glow: '0 0 25px rgba(255, 215, 0, 0.6), 0 0 50px rgba(255, 215, 0, 0.3)'
  }
};

// Curse severity styles
const CURSE_STYLES = {
  minor: {
    background: 'linear-gradient(135deg, rgba(127, 29, 29, 0.2) 0%, rgba(153, 27, 27, 0.2) 100%)',
    border: 'rgba(185, 28, 28, 0.5)',
    text: '#fca5a5',
    leftAccent: '#b91c1c'
  },
  moderate: {
    background: 'linear-gradient(135deg, rgba(153, 27, 27, 0.25) 0%, rgba(127, 29, 29, 0.25) 100%)',
    border: 'rgba(220, 38, 38, 0.6)',
    text: '#fecaca',
    leftAccent: '#dc2626'
  },
  major: {
    background: 'linear-gradient(135deg, rgba(127, 29, 29, 0.3) 0%, rgba(69, 10, 10, 0.3) 100%)',
    border: 'rgba(239, 68, 68, 0.7)',
    text: '#fecaca',
    leftAccent: '#ef4444',
    glow: '0 0 15px rgba(220, 38, 38, 0.4)'
  },
  severe: {
    background: 'linear-gradient(135deg, rgba(127, 29, 29, 0.35) 0%, rgba(69, 10, 10, 0.35) 100%)',
    border: 'rgba(248, 113, 113, 0.8)',
    text: '#fee2e2',
    leftAccent: '#f87171',
    glow: '0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(185, 28, 28, 0.3)'
  },
  catastrophic: {
    background: 'linear-gradient(135deg, rgba(139, 0, 0, 0.4) 0%, rgba(69, 10, 10, 0.4) 100%)',
    border: 'rgba(252, 165, 165, 0.9)',
    text: '#fff1f2',
    leftAccent: '#fca5a5',
    glow: '0 0 25px rgba(239, 68, 68, 0.6), 0 0 50px rgba(185, 28, 28, 0.4), inset 0 0 20px rgba(139, 0, 0, 0.3)'
  },
  ancient: {
    background: 'linear-gradient(135deg, rgba(139, 0, 0, 0.5) 0%, rgba(50, 0, 0, 0.5) 100%)',
    border: 'rgba(255, 200, 200, 1)',
    text: '#ffffff',
    leftAccent: '#ff6b6b',
    glow: '0 0 30px rgba(255, 0, 0, 0.7), 0 0 60px rgba(139, 0, 0, 0.5), 0 0 90px rgba(100, 0, 0, 0.3)',
    pulse: true
  }
};

// Status indicator colors
const STATUS_COLORS = {
  success: '#22c55e',
  failure: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  neutral: '#6b7280'
};

// Individual Toast Component
const Toast = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  useEffect(() => {
    if (!isHovered) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
      }, toast.duration || 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, onRemove, isHovered]);
  
  // Determine styles based on toast configuration
  let toastStyle = TOAST_TYPES[toast.type] || TOAST_TYPES.system;
  let leftAccentColor = STATUS_COLORS[toast.status] || null;
  let glowEffect = toastStyle.glow || null;
  let shouldPulse = false;
  
  // If it's an item, use rarity styling
  if (toast.rarity) {
    const rarityStyle = RARITY_STYLES[toast.rarity] || RARITY_STYLES.common;
    toastStyle = { ...toastStyle, ...rarityStyle };
    leftAccentColor = rarityStyle.leftAccent;
    if (rarityStyle.glow) glowEffect = rarityStyle.glow;
  }
  
  // If it's cursed, apply curse styling (overrides rarity for dramatic effect)
  if (toast.curseLevel) {
    const curseStyle = CURSE_STYLES[toast.curseLevel] || CURSE_STYLES.minor;
    // Blend curse with existing style
    toastStyle = {
      ...toastStyle,
      background: curseStyle.background,
      border: curseStyle.border,
      text: curseStyle.text
    };
    leftAccentColor = curseStyle.leftAccent;
    if (curseStyle.glow) glowEffect = curseStyle.glow;
    if (curseStyle.pulse) shouldPulse = true;
  }
  
  // Override left accent with explicit status if provided
  if (toast.status) {
    leftAccentColor = STATUS_COLORS[toast.status];
  }
  
  const containerStyle = {
    position: 'relative',
    background: toastStyle.background,
    border: `1px solid ${toastStyle.border}`,
    borderRadius: '8px',
    padding: '12px 16px',
    paddingLeft: leftAccentColor ? '20px' : '16px',
    marginBottom: '10px',
    minWidth: '280px',
    maxWidth: '380px',
    boxShadow: glowEffect || '0 4px 15px rgba(0, 0, 0, 0.4)',
    transform: isExiting ? 'translateX(120%)' : 'translateX(0)',
    opacity: isExiting ? 0 : 1,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    animation: shouldPulse ? 'toastPulse 2s ease-in-out infinite' : (isExiting ? 'none' : 'toastSlideIn 0.3s ease-out'),
    overflow: 'hidden',
    cursor: 'pointer',
    fontFamily: '"Crimson Text", Georgia, serif'
  };
  
  // Left accent bar style
  const accentBarStyle = leftAccentColor ? {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '4px',
    background: leftAccentColor,
    borderRadius: '8px 0 0 8px'
  } : null;
  
  // Golden shimmer for mythic/divine items
  const shimmerStyle = (toastStyle.isGolden) ? {
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.15) 50%, transparent 100%)',
    animation: 'toastShimmer 3s ease-in-out infinite',
    pointerEvents: 'none'
  } : null;
  
  return (
    <div
      style={containerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
      }}
    >
      {accentBarStyle && <div style={accentBarStyle} />}
      {shimmerStyle && <div style={shimmerStyle} />}
      
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', position: 'relative', zIndex: 1 }}>
        {/* Icon */}
        {toast.icon && (
          <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>
            {toast.icon}
          </span>
        )}
        
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title */}
          {toast.title && (
            <div style={{
              fontFamily: '"Cinzel", serif',
              fontWeight: 600,
              fontSize: '0.95rem',
              color: toastStyle.text,
              marginBottom: toast.message ? '4px' : 0,
              textShadow: toastStyle.isGolden ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none'
            }}>
              {toast.title}
            </div>
          )}
          
          {/* Message */}
          {toast.message && (
            <div style={{
              fontSize: '0.9rem',
              color: toastStyle.text,
              opacity: 0.9,
              lineHeight: 1.4
            }}>
              {toast.message}
            </div>
          )}
          
          {/* Item details (for loot) */}
          {toast.itemStats && (
            <div style={{
              marginTop: '6px',
              fontSize: '0.8rem',
              color: toastStyle.text,
              opacity: 0.75,
              fontStyle: 'italic'
            }}>
              {toast.itemStats}
            </div>
          )}
        </div>
        
        {/* Optional quantity badge */}
        {toast.quantity && toast.quantity > 1 && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '12px',
            padding: '2px 8px',
            fontSize: '0.8rem',
            color: toastStyle.text,
            fontWeight: 600
          }}>
            x{toast.quantity}
          </div>
        )}
      </div>
      
      {/* Progress bar for timed toasts */}
      {!isHovered && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '0 0 8px 8px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            background: leftAccentColor || toastStyle.text,
            opacity: 0.6,
            animation: `toastProgress ${toast.duration || 4000}ms linear forwards`
          }} />
        </div>
      )}
    </div>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        @keyframes toastShimmer {
          0% { left: -100%; }
          50% { left: 100%; }
          100% { left: 100%; }
        }
        
        @keyframes toastPulse {
          0%, 100% { 
            box-shadow: 0 0 30px rgba(255, 0, 0, 0.7), 0 0 60px rgba(139, 0, 0, 0.5);
          }
          50% { 
            box-shadow: 0 0 40px rgba(255, 0, 0, 0.9), 0 0 80px rgba(139, 0, 0, 0.7);
          }
        }
      `}</style>
      
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        alignItems: 'flex-end',
        pointerEvents: 'none',
        maxHeight: 'calc(100vh - 40px)',
        overflow: 'hidden'
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          {toasts.map(toast => (
            <Toast key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </div>
      </div>
    </>
  );
};

// Toast Provider Component
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  
  const addToast = useCallback((config) => {
    const id = ++toastIdRef.current;
    const toast = {
      id,
      icon: TOAST_TYPES[config.type]?.icon || '📢',
      duration: 4000,
      ...config
    };
    
    setToasts(prev => [...prev, toast]);
    return id;
  }, []);
  
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);
  
  // Convenience methods for common toast types
  const toast = useMemo(() => ({
    // Add raw toast
    add: addToast,
    remove: removeToast,
    clear: clearAll,
    
    // System notifications
    system: (title, message, status) => addToast({ 
      type: 'system', title, message, status, icon: '⚙️' 
    }),
    save: (message, success = true) => addToast({ 
      type: 'save', 
      title: success ? 'Game Saved' : 'Save Failed', 
      message, 
      status: success ? 'success' : 'failure',
      icon: '💾'
    }),
    load: (message, success = true) => addToast({ 
      type: 'load', 
      title: success ? 'Game Loaded' : 'Load Failed', 
      message, 
      status: success ? 'success' : 'failure',
      icon: '📂'
    }),
    autosave: () => addToast({ 
      type: 'save', 
      title: 'Autosaved', 
      status: 'success',
      duration: 2000,
      icon: '💾'
    }),
    
    // Progress notifications
    experience: (amount, current, required) => addToast({ 
      type: 'experience', 
      title: `+${amount} XP`, 
      message: `${current}/${required} to next level`,
      icon: '✨'
    }),
    levelUp: (level, statPoints) => addToast({ 
      type: 'levelup', 
      title: `Level Up!`, 
      message: `You are now level ${level}! +${statPoints} stat points`,
      duration: 6000,
      icon: '🌟'
    }),
    skillUnlock: (skillName) => addToast({ 
      type: 'skillUnlock', 
      title: 'Skill Unlocked', 
      message: skillName,
      icon: '📖'
    }),
    
    // Combat notifications
    damage: (amount, source) => addToast({ 
      type: 'damage', 
      title: `-${amount} HP`, 
      message: source ? `from ${source}` : undefined,
      duration: 3000,
      icon: '💥'
    }),
    heal: (amount, source) => addToast({ 
      type: 'heal', 
      title: `+${amount} HP`, 
      message: source ? `from ${source}` : undefined,
      duration: 3000,
      icon: '💚'
    }),
    combat: (message) => addToast({ 
      type: 'combat', 
      title: 'Combat', 
      message,
      icon: '⚔️'
    }),
    escape: (success = true) => addToast({ 
      type: success ? 'escape' : 'combat', 
      title: success ? 'Escaped!' : 'Escape Failed!', 
      status: success ? 'success' : 'failure',
      icon: success ? '🏃' : '⚔️'
    }),
    
    // Buff/Debuff notifications
    buff: (name, duration) => addToast({ 
      type: 'buff', 
      title: 'Buff Applied', 
      message: duration ? `${name} (${duration}s)` : name,
      icon: '⬆️'
    }),
    debuff: (name, duration) => addToast({ 
      type: 'debuff', 
      title: 'Debuff Applied', 
      message: duration ? `${name} (${duration}s)` : name,
      status: 'warning',
      icon: '⚠️'
    }),
    
    // Currency notifications
    gold: (amount, source) => addToast({ 
      type: 'gold', 
      title: amount >= 0 ? `+${amount} Gold` : `${amount} Gold`, 
      message: source,
      status: amount >= 0 ? 'success' : 'failure',
      icon: '🪙'
    }),
    
    // Quest notifications
    quest: (title, message) => addToast({ 
      type: 'quest', 
      title, 
      message,
      icon: '📜'
    }),
    questComplete: (questName, rewards) => addToast({ 
      type: 'questComplete', 
      title: 'Quest Complete!', 
      message: questName,
      itemStats: rewards,
      duration: 6000,
      icon: '🏆'
    }),
    
    // Item notifications (with rarity)
    item: (name, rarity = 'common', quantity = 1, curse = null, stats = null) => {
      // Map curse level names to CURSE_STYLES keys
      const curseMapping = {
        1: 'minor', 2: 'moderate', 3: 'major', 
        4: 'severe', 5: 'catastrophic', 6: 'ancient',
        minor: 'minor', moderate: 'moderate', major: 'major',
        severe: 'severe', catastrophic: 'catastrophic', ancient: 'ancient'
      };
      
      return addToast({
        type: 'item',
        title: curse ? `${name} (Cursed)` : name,
        message: rarity.charAt(0).toUpperCase() + rarity.slice(1),
        rarity,
        quantity,
        curseLevel: curse ? curseMapping[curse] || curse : null,
        itemStats: stats,
        icon: curse ? '💀' : (rarity === 'divine' ? '✦' : rarity === 'mythic' ? '⭐' : '📦'),
        duration: rarity === 'divine' ? 8000 : rarity === 'mythic' ? 6000 : 4000
      });
    },
    
    // Curse notification
    curse: (name, level = 'minor') => addToast({
      type: 'debuff',
      title: 'Cursed!',
      message: name,
      curseLevel: level,
      status: 'failure',
      icon: '💀',
      duration: 5000
    }),
    
    // Generic error/warning/info
    error: (title, message) => addToast({ 
      type: 'system', 
      title, 
      message, 
      status: 'failure',
      icon: '❌'
    }),
    warning: (title, message) => addToast({ 
      type: 'debuff', 
      title, 
      message, 
      status: 'warning',
      icon: '⚠️'
    }),
    info: (title, message) => addToast({ 
      type: 'system', 
      title, 
      message, 
      status: 'info',
      icon: 'ℹ️'
    }),
    success: (title, message) => addToast({ 
      type: 'system', 
      title, 
      message, 
      status: 'success',
      icon: '✅'
    })
  }), [addToast, removeToast, clearAll]);
  
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// ============================================================================
// UI COMPONENTS
// ============================================================================

const styles = {
  // Base styles
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
    color: '#e4e4e7',
    fontFamily: '"Crimson Text", Georgia, serif',
    overflow: 'hidden'
  },
  
  // Typography
  title: {
    fontFamily: '"Cinzel Decorative", "Playfair Display", serif',
    fontSize: '3.5rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 50%, #ffd700 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 0 40px rgba(255, 215, 0, 0.3)',
    letterSpacing: '0.15em',
    marginBottom: '2rem'
  },
  
  subtitle: {
    fontFamily: '"Cinzel", serif',
    fontSize: '1.5rem',
    color: '#a1a1aa',
    letterSpacing: '0.3em',
    textTransform: 'uppercase'
  },
  
  // Buttons
  button: {
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
    border: '1px solid rgba(139, 92, 246, 0.4)',
    borderRadius: '4px',
    padding: '1rem 2rem',
    color: '#e4e4e7',
    fontFamily: '"Cinzel", serif',
    fontSize: '1.1rem',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    position: 'relative',
    overflow: 'hidden'
  },
  
  buttonHover: {
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(59, 130, 246, 0.4) 100%)',
    borderColor: 'rgba(139, 92, 246, 0.8)',
    boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
    transform: 'translateY(-2px)'
  },
  
  buttonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    transform: 'none'
  },
  
  // Cards
  card: {
    background: 'rgba(30, 30, 50, 0.8)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    borderRadius: '8px',
    padding: '1.5rem',
    backdropFilter: 'blur(10px)'
  },
  
  // Panels
  panel: {
    background: 'linear-gradient(180deg, rgba(20, 20, 35, 0.95) 0%, rgba(30, 30, 50, 0.95) 100%)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
  },
  
  // Input
  input: {
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '4px',
    padding: '0.75rem 1rem',
    color: '#e4e4e7',
    fontFamily: '"Crimson Text", serif',
    fontSize: '1rem',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.3s ease'
  },
  
  // Progress bars
  progressBar: {
    height: '8px',
    background: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },
  
  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  },
  
  modal: {
    background: 'linear-gradient(180deg, rgba(25, 25, 45, 0.98) 0%, rgba(35, 35, 60, 0.98) 100%)',
    border: '1px solid rgba(139, 92, 246, 0.4)',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)'
  },

  // Tabs
  tabContainer: {
    display: 'flex',
    borderBottom: '1px solid rgba(139, 92, 246, 0.3)',
    marginBottom: '1.5rem'
  },
  
  tab: {
    padding: '1rem 1.5rem',
    background: 'transparent',
    border: 'none',
    color: '#a1a1aa',
    fontFamily: '"Cinzel", serif',
    fontSize: '0.95rem',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 0.3s ease'
  },
  
  tabActive: {
    color: '#ffd700',
    borderBottomColor: '#ffd700'
  }
};

// Button Component
const Button = ({ children, onClick, disabled, variant = 'primary', style = {}, ...props }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const variants = {
    primary: {},
    secondary: { background: 'rgba(100, 100, 120, 0.3)', borderColor: 'rgba(150, 150, 170, 0.4)' },
    danger: { background: 'rgba(220, 38, 38, 0.2)', borderColor: 'rgba(220, 38, 38, 0.4)' },
    success: { background: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.4)' },
    gold: { 
      background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 140, 0, 0.2) 100%)',
      borderColor: 'rgba(255, 215, 0, 0.4)',
      color: '#ffd700'
    }
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...styles.button,
        ...variants[variant],
        ...(isHovered && !disabled ? styles.buttonHover : {}),
        ...(disabled ? styles.buttonDisabled : {}),
        ...style
      }}
      {...props}
    >
      {children}
    </button>
  );
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {title && (
          <h2 style={{ ...styles.subtitle, marginBottom: '1.5rem', fontSize: '1.3rem' }}>
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
};

// Progress Bar Component
const ProgressBar = ({ value, max, color = '#8b5cf6', label, showValue = true }) => {
  const percentage = (value / max) * 100;
  
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>{label}</span>
          {showValue && <span style={{ fontSize: '0.9rem', color: '#e4e4e7' }}>{value}/{max}</span>}
        </div>
      )}
      <div style={styles.progressBar}>
        <div 
          style={{ 
            ...styles.progressFill, 
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${color} 0%, ${color}aa 100%)`
          }} 
        />
      </div>
    </div>
  );
};

// Stat Display Component
const StatDisplay = ({ label, value, color = '#8b5cf6' }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid rgba(139, 92, 246, 0.1)'
  }}>
    <span style={{ color: '#a1a1aa' }}>{label}</span>
    <span style={{ color, fontWeight: 600 }}>{value}</span>
  </div>
);

// ============================================================================
// PAPERDOLL COMPONENTS
// ============================================================================

// Single layer image with loading state
const PaperdollLayerImage = ({ src, zIndex, opacity = 1, alt = '' }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  if (error || !src) return null;
  
  return (
    <img
      src={src}
      alt={alt}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        pointerEvents: 'none',
        zIndex,
        opacity: loaded ? opacity : 0,
        transition: 'opacity 0.3s ease'
      }}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
    />
  );
};

// Renders a single body region with all its layers
const PaperdollRegion = ({ regionId, paperdollState, width = 120, height = 150, onClick, style = {} }) => {
  const layers = useMemo(() => {
    if (!paperdollState) return [];
    return getVisiblePaperdollLayers(paperdollState, regionId);
  }, [paperdollState, regionId]);
  
  // Also include base image if set
  const baseImage = paperdollState?.baseImages?.[regionId];
  
  return (
    <div 
      style={{ 
        position: 'relative',
        width,
        height,
        background: '#000',
        borderRadius: '4px',
        overflow: 'hidden',
        border: '2px solid #2d5a87',
        cursor: onClick ? 'pointer' : 'default',
        ...style 
      }}
      onClick={() => onClick?.(regionId)}
    >
      {/* Base image */}
      {baseImage && (
        <PaperdollLayerImage
          src={baseImage}
          zIndex={0}
          alt="Base"
        />
      )}
      
      {/* Layer images */}
      {layers.map((layer) => (
        <PaperdollLayerImage
          key={`${regionId}-${layer.id}`}
          src={layer.imagePath}
          zIndex={layer.zIndex}
          opacity={layer.opacity || 1}
          alt={layer.name}
        />
      ))}
      
      {/* Empty state */}
      {!baseImage && layers.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#4a6fa5',
          fontSize: '11px',
          textAlign: 'center'
        }}>
          No image
        </div>
      )}
    </div>
  );
};

// A card showing a body region with title and count
const PaperdollCard = ({ 
  regionId, 
  title,
  paperdollState, 
  count = 0,
  onClick,
  width = 150,
  imageHeight = 150
}) => {
  const regionDef = GameData.paperdollLayers[regionId];
  const displayTitle = title || (GameData.bodyRegionDisplay.find(r => r.id === regionId)?.name) || regionId;
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%)',
      borderRadius: '8px',
      border: '1px solid #2d5a87',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minWidth: width
    }}>
      <div style={{
        color: '#ff6b9d',
        fontSize: '14px',
        fontWeight: 'bold',
        marginBottom: '8px',
        textTransform: 'capitalize'
      }}>
        {displayTitle}
      </div>
      <PaperdollRegion
        regionId={regionId}
        paperdollState={paperdollState}
        width={width - 30}
        height={imageHeight}
        onClick={onClick}
      />
      <div style={{
        color: '#88c0d0',
        fontSize: '12px',
        marginTop: '8px'
      }}>
        Count: {count}
      </div>
    </div>
  );
};

// Full body portrait with all layers
const FullBodyPaperdoll = ({ 
  paperdollState, 
  width = 280, 
  height = 420,
  showLayerCount = false,
  onClick,
  style = {},
  characterName = '',
  characterMotto = ''
}) => {
  const layers = useMemo(() => {
    if (!paperdollState) return [];
    return getVisiblePaperdollLayers(paperdollState, 'fullBody');
  }, [paperdollState]);
  
  const baseImage = paperdollState?.baseImages?.fullBody;
  
  return (
    <div 
      style={{ 
        position: 'relative',
        width,
        height,
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%)',
        borderRadius: '8px',
        border: '2px solid #2d5a87',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        ...style 
      }}
      onClick={() => onClick?.('fullBody')}
    >
      {/* Character motto/description at top */}
      {characterMotto && (
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(45, 90, 135, 0.8)',
          color: '#88c0d0',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '11px',
          fontStyle: 'italic',
          zIndex: 300,
          maxWidth: '90%',
          textAlign: 'center'
        }}>
          {characterMotto}
        </div>
      )}
      
      {/* Base image */}
      {baseImage && (
        <PaperdollLayerImage
          src={baseImage}
          zIndex={0}
          alt="Base"
        />
      )}
      
      {/* Layer images */}
      {layers.map((layer) => (
        <PaperdollLayerImage
          key={`fullBody-${layer.id}`}
          src={layer.imagePath}
          zIndex={layer.zIndex}
          opacity={layer.opacity || 1}
          alt={layer.name}
        />
      ))}
      
      {/* Empty state placeholder */}
      {!baseImage && layers.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#4a6fa5',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>👤</div>
          <div>base_model</div>
        </div>
      )}
      
      {/* Layer count indicator */}
      {showLayerCount && layers.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          zIndex: 300
        }}>
          {layers.length} layers
        </div>
      )}
    </div>
  );
};

// Complete paperdoll panel with portrait and body region cards
const PaperdollPanel = ({ 
  paperdollState,
  player,
  regions = ['head', 'torso', 'groin', 'ass', 'legs', 'arms'],
  customRegions = null, // For custom regions like Mind, Ears, Mouth, Breasts, Penis
  onRegionClick,
  style = {}
}) => {
  // Calculate counts from player data
  const counts = useMemo(() => {
    if (!player?.nsfwStats) return {};
    
    const orificeStats = player.nsfwStats.orificeStats || {};
    const regionCounts = player.paperdoll?.regionCounts || {};
    
    return {
      head: regionCounts.head || 0,
      torso: regionCounts.torso || 0,
      groin: (orificeStats.other?.penetrationCount || 0),
      arms: regionCounts.arms || 0,
      legs: regionCounts.legs || 0,
      ass: orificeStats.rear?.penetrationCount || 0,
      // Custom regions
      mind: regionCounts.mind || 0,
      ears: regionCounts.ears || 0,
      mouth: orificeStats.mouth?.penetrationCount || 0,
      breasts: regionCounts.breasts || 0,
      penis: regionCounts.penis || 0
    };
  }, [player]);
  
  // Use custom regions if provided, otherwise use standard regions
  const displayRegions = customRegions || [
    { id: 'head', name: 'Mind', countKey: 'mind' },
    { id: 'head', name: 'Ears', countKey: 'ears' },
    { id: 'head', name: 'Mouth', countKey: 'mouth' },
    { id: 'torso', name: 'Breasts', countKey: 'breasts' },
    { id: 'ass', name: 'Ass', countKey: 'ass' },
    { id: 'groin', name: 'Penis', countKey: 'penis' }
  ];
  
  return (
    <div style={{
      display: 'flex',
      gap: '24px',
      ...style
    }}>
      {/* Full body portrait */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <FullBodyPaperdoll
          paperdollState={paperdollState}
          width={280}
          height={420}
          showLayerCount
          onClick={onRegionClick}
          characterMotto={player?.characterMotto || "Every challenge makes me stronger."}
        />
      </div>
      
      {/* Body region cards grid */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        flex: 1
      }}>
        {displayRegions.map((region, idx) => (
          <PaperdollCard
            key={`${region.id}-${region.name}-${idx}`}
            regionId={region.id}
            title={region.name}
            paperdollState={paperdollState}
            count={counts[region.countKey || region.id] || 0}
            onClick={() => onRegionClick?.(region.id)}
            width={150}
            imageHeight={130}
          />
        ))}
      </div>
    </div>
  );
};

// Compact paperdoll for sidebar/HUD display
const PaperdollCompact = ({ paperdollState, player, onClick }) => {
  return (
    <div 
      style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%)',
        borderRadius: '8px',
        border: '1px solid #2d5a87',
        padding: '8px',
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      <PaperdollRegion
        regionId="fullBody"
        paperdollState={paperdollState}
        width={100}
        height={150}
      />
      {player?.name && (
        <div style={{
          textAlign: 'center',
          marginTop: '8px',
          color: '#88c0d0',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          {player.name}
        </div>
      )}
    </div>
  );
};

// Character Card Component
const CharacterCard = ({ character, isSelected, onSelect }) => (
  <div 
    onClick={onSelect}
    style={{
      ...styles.card,
      cursor: 'pointer',
      border: isSelected ? '2px solid #ffd700' : '1px solid rgba(139, 92, 246, 0.2)',
      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
      transition: 'all 0.3s ease',
      textAlign: 'center'
    }}
  >
    <div style={{
      width: '150px',
      height: '200px',
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
      borderRadius: '8px',
      margin: '0 auto 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '3rem',
      color: '#8b5cf6'
    }}>
      ⚔
    </div>
    <h3 style={{ ...styles.subtitle, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
      {character.name}
    </h3>
    <p style={{ fontSize: '0.9rem', color: '#71717a' }}>
      {character.description}
    </p>
  </div>
);

// ============================================================================
// GAME SCREENS
// ============================================================================

// Main Menu Screen
const MainMenuScreen = ({ onStart, onContinue, onLoad, onSettings, onSupport, onChangelog, onDebug, onGenerator }) => {
  const hasAutosave = SaveSystem.hasAutosave();
  
  return (
    <div style={{ 
      ...styles.container, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem',
      background: 'linear-gradient(135deg, #1a0a15 0%, #2d1f3d 30%, #1a0a20 60%, #0d0510 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Debug mode indicator */}
      {GameConfig.debug.enabled && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'rgba(255, 50, 50, 0.9)',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          zIndex: 1000
        }}>
          🔧 DEBUG MODE
        </div>
      )}
      
      {/* Animated gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(ellipse at 30% 20%, ${GameConfig.display.accentColor}26 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, ${GameConfig.display.secondaryColor}20 0%, transparent 50%)`,
        pointerEvents: 'none',
        animation: GameConfig.display.animations ? 'pulse 8s ease-in-out infinite' : 'none'
      }} />
      
      {/* Suggestive silhouette decorations */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '200px',
        height: '300px',
        background: `linear-gradient(to top, ${GameConfig.display.accentColor}14 0%, transparent 100%)`,
        clipPath: 'ellipse(100% 100% at 0% 100%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: '200px',
        height: '300px',
        background: `linear-gradient(to top, ${GameConfig.display.secondaryColor}14 0%, transparent 100%)`,
        clipPath: 'ellipse(100% 100% at 100% 100%)',
        pointerEvents: 'none'
      }} />
      
      <div style={{ position: 'relative', textAlign: 'center', zIndex: 1 }}>
        <h1 style={{
          fontFamily: '"Cinzel Decorative", "Playfair Display", serif',
          fontSize: '4.5rem',
          fontWeight: 700,
          background: `linear-gradient(135deg, #ff6ec7 0%, ${GameConfig.display.accentColor} 25%, ${GameConfig.display.secondaryColor} 50%, ${GameConfig.display.accentColor} 75%, #ff6ec7 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: `0 0 60px ${GameConfig.display.accentColor}80, 0 0 120px ${GameConfig.display.accentColor}4D`,
          letterSpacing: '0.1em',
          marginBottom: '0.5rem',
          marginTop: '1rem',
          filter: `drop-shadow(0 0 20px ${GameConfig.display.accentColor}66)`
        }}>
          {GameConfig.game.title}
        </h1>
        
        <p style={{ 
          color: '#ff9ecb', 
          marginBottom: '0.5rem', 
          fontStyle: 'italic',
          fontSize: '1.2rem',
          textShadow: '0 0 10px rgba(255, 150, 200, 0.3)'
        }}>
          "{GameConfig.game.subtitle}"
        </p>
        <p style={{ 
          color: '#8b5a7a', 
          marginBottom: '3rem', 
          fontSize: '0.9rem',
          letterSpacing: '0.2em'
        }}>
          🔞 Adults Only • Explicit Content
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '320px' }}>
          <button 
            onClick={onStart}
            style={{
              background: `linear-gradient(135deg, ${GameConfig.display.accentColor} 0%, ${GameConfig.display.secondaryColor} 50%, ${GameConfig.display.accentColor} 100%)`,
              border: `2px solid ${GameConfig.display.accentColor}99`,
              borderRadius: '8px',
              padding: '1.2rem 2rem',
              color: 'white',
              fontFamily: '"Cinzel", serif',
              fontSize: '1.2rem',
              letterSpacing: '0.15em',
              cursor: 'pointer',
              textTransform: 'uppercase',
              boxShadow: `0 0 30px ${GameConfig.display.accentColor}66, inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
              transition: 'all 0.3s ease',
              fontWeight: 'bold'
            }}
            onMouseEnter={e => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = `0 0 50px ${GameConfig.display.accentColor}99, inset 0 1px 0 rgba(255, 255, 255, 0.3)`;
            }}
            onMouseLeave={e => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = `0 0 30px ${GameConfig.display.accentColor}66, inset 0 1px 0 rgba(255, 255, 255, 0.2)`;
            }}
          >
            New Game
          </button>
          
          <button 
            onClick={onContinue}
            disabled={!hasAutosave}
            style={{
              background: hasAutosave 
                ? `linear-gradient(135deg, ${GameConfig.display.accentColor}4D 0%, ${GameConfig.display.secondaryColor}4D 100%)`
                : 'rgba(50, 30, 50, 0.5)',
              border: `1px solid ${GameConfig.display.accentColor}4D`,
              borderRadius: '8px',
              padding: '1rem 2rem',
              color: hasAutosave ? '#ffb3d9' : '#5a4a5a',
              fontFamily: '"Cinzel", serif',
              fontSize: '1.1rem',
              letterSpacing: '0.1em',
              cursor: hasAutosave ? 'pointer' : 'not-allowed',
              textTransform: 'uppercase',
              transition: 'all 0.3s ease',
              opacity: hasAutosave ? 1 : 0.5
            }}
          >
            Continue
          </button>
          
          {[
            { label: 'Load Game', action: onLoad },
            { label: 'Settings', action: onSettings },
            { label: 'Changelog', action: onChangelog },
            { label: 'Support', action: onSupport },
            { label: '🛠️ Content Generator', action: onGenerator },
            { label: '🔧 Debug Menu', action: onDebug, debugOnly: true }
          ].filter(btn => !btn.debugOnly || GameConfig.debug.enabled).map((btn, i) => (
            <button 
              key={i}
              onClick={btn.action}
              style={{
                background: 'linear-gradient(135deg, rgba(100, 50, 100, 0.4) 0%, rgba(80, 40, 100, 0.4) 100%)',
                border: '1px solid rgba(200, 100, 180, 0.25)',
                borderRadius: '8px',
                padding: '1rem 2rem',
                color: '#c9a0b8',
                fontFamily: '"Cinzel", serif',
                fontSize: '1.1rem',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                textTransform: 'uppercase',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={e => {
                e.target.style.background = 'linear-gradient(135deg, rgba(150, 70, 130, 0.5) 0%, rgba(120, 60, 140, 0.5) 100%)';
                e.target.style.borderColor = `${GameConfig.display.accentColor}80`;
                e.target.style.color = '#ffb3d9';
              }}
              onMouseLeave={e => {
                e.target.style.background = 'linear-gradient(135deg, rgba(100, 50, 100, 0.4) 0%, rgba(80, 40, 100, 0.4) 100%)';
                e.target.style.borderColor = 'rgba(200, 100, 180, 0.25)';
                e.target.style.color = '#c9a0b8';
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
        
        <p style={{ marginTop: '3rem', fontSize: '0.8rem', color: '#6b4a5a' }}>
          {GameConfig.versionString}
        </p>
      </div>
      
      {/* Footer with copyright */}
      <div style={{
        position: 'absolute',
        bottom: '1rem',
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: 1
      }}>
        <p style={{ 
          fontSize: '0.75rem', 
          color: '#4a3a4a',
          letterSpacing: '0.05em'
        }}>
          {GameConfig.copyrightString}
        </p>
      </div>
      
      {/* CSS animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

// Character Selection Screen
const CharacterSelectScreen = ({ onSelect, onBack }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const characters = GameData.characters;
  
  const handlePrev = () => {
    setSelectedIndex(prev => (prev - 1 + characters.length) % characters.length);
  };
  
  const handleNext = () => {
    setSelectedIndex(prev => (prev + 1) % characters.length);
  };
  
  return (
    <div style={{ ...styles.container, padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ ...styles.subtitle, marginBottom: '2rem' }}>Choose Your Champion</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
          <Button onClick={handlePrev} style={{ padding: '1rem' }}>
            ◀
          </Button>
          
          <div style={{ width: '300px' }}>
            <CharacterCard 
              character={characters[selectedIndex]} 
              isSelected={true}
            />
          </div>
          
          <Button onClick={handleNext} style={{ padding: '1rem' }}>
            ▶
          </Button>
        </div>
        
        {/* Pagination dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          {characters.map((_, index) => (
            <div 
              key={index}
              onClick={() => setSelectedIndex(index)}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: index === selectedIndex ? '#ffd700' : 'rgba(139, 92, 246, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
        
        {/* Base Stats Preview */}
        <div style={{ ...styles.panel, marginTop: '2rem', textAlign: 'left' }}>
          <h3 style={{ ...styles.subtitle, fontSize: '1rem', marginBottom: '1rem' }}>Base Attributes</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {Object.entries(characters[selectedIndex].baseStats).map(([stat, value]) => (
              <StatDisplay 
                key={stat} 
                label={stat.charAt(0).toUpperCase() + stat.slice(1).replace(/([A-Z])/g, ' $1')} 
                value={`+${value}`} 
              />
            ))}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <Button onClick={onBack} variant="secondary">Back</Button>
          <Button onClick={() => onSelect(characters[selectedIndex])} variant="gold">
            Select Character
          </Button>
        </div>
      </div>
    </div>
  );
};

// Difficulty Selection Modal
const DifficultyModal = ({ isOpen, onClose, onSelect }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Difficulty">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {GameData.difficulties.map(diff => (
          <div
            key={diff.id}
            onClick={() => setSelectedDifficulty(diff.id)}
            style={{
              ...styles.card,
              cursor: 'pointer',
              border: selectedDifficulty === diff.id ? '2px solid #ffd700' : '1px solid rgba(139, 92, 246, 0.2)'
            }}
          >
            <h3 style={{ color: '#ffd700', marginBottom: '0.5rem' }}>{diff.name}</h3>
            <p style={{ fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '0.5rem' }}>{diff.description}</p>
            <div style={{ fontSize: '0.8rem', color: '#71717a' }}>
              <span>Stat Modifier: {(diff.statMultiplier * 100).toFixed(0)}%</span>
              {' • '}
              <span>Encounter Rate: {(diff.encounterRateMultiplier * 100).toFixed(0)}%</span>
              {!diff.canSaveAnywhere && <span style={{ color: '#ef4444' }}> • Save only in safe zones</span>}
              {diff.permadeath && <span style={{ color: '#dc2626' }}> • PERMADEATH</span>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <Button onClick={onClose} variant="secondary">Cancel</Button>
        <Button 
          onClick={() => selectedDifficulty && onSelect(selectedDifficulty)} 
          disabled={!selectedDifficulty}
          variant="gold"
        >
          Confirm
        </Button>
      </div>
    </Modal>
  );
};

// NSFW Stats Assignment Screen
const NSFWStatsScreen = ({ onComplete, onBack }) => {
  const [sensitiveAreas, setSensitiveAreas] = useState([]);
  const [modifiers, setModifiers] = useState([]);
  const maxSensitiveAreas = 2;
  
  const bonusPoints = modifiers.reduce((sum, modId) => {
    const mod = GameData.challengeModifiers.find(m => m.id === modId);
    return sum + (mod?.statPoints || 0);
  }, 0);
  
  const toggleSensitiveArea = (areaId) => {
    setSensitiveAreas(prev => {
      if (prev.includes(areaId)) {
        return prev.filter(id => id !== areaId);
      }
      if (prev.length >= maxSensitiveAreas) {
        return prev;
      }
      return [...prev, areaId];
    });
  };
  
  const toggleModifier = (modId) => {
    setModifiers(prev => 
      prev.includes(modId) 
        ? prev.filter(id => id !== modId)
        : [...prev, modId]
    );
  };
  
  return (
    <div style={{ ...styles.container, padding: '2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ ...styles.subtitle, textAlign: 'center', marginBottom: '2rem' }}>
          Character Customization
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Sensitive Areas */}
          <div style={styles.panel}>
            <h3 style={{ ...styles.subtitle, fontSize: '1rem', marginBottom: '1rem' }}>
              Sensitive Areas ({sensitiveAreas.length}/{maxSensitiveAreas})
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#71717a', marginBottom: '1rem' }}>
              Select up to {maxSensitiveAreas} areas with heightened sensitivity
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {GameData.sensitiveBodyParts.map(area => (
                <div
                  key={area.id}
                  onClick={() => toggleSensitiveArea(area.id)}
                  style={{
                    ...styles.card,
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: sensitiveAreas.includes(area.id) 
                      ? '1px solid #ec4899' 
                      : '1px solid rgba(139, 92, 246, 0.2)'
                  }}
                >
                  <div>
                    <span style={{ color: sensitiveAreas.includes(area.id) ? '#ec4899' : '#e4e4e7' }}>
                      {area.name}
                    </span>
                    <p style={{ fontSize: '0.8rem', color: '#71717a', margin: 0 }}>{area.description}</p>
                  </div>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    border: '2px solid',
                    borderColor: sensitiveAreas.includes(area.id) ? '#ec4899' : '#52525b',
                    background: sensitiveAreas.includes(area.id) ? '#ec4899' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '0.8rem'
                  }}>
                    {sensitiveAreas.includes(area.id) && '✓'}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Challenge Modifiers */}
          <div style={styles.panel}>
            <h3 style={{ ...styles.subtitle, fontSize: '1rem', marginBottom: '1rem' }}>
              Challenge Modifiers
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#71717a', marginBottom: '0.5rem' }}>
              Accept challenges for bonus stat points
            </p>
            <p style={{ fontSize: '1rem', color: '#ffd700', marginBottom: '1rem' }}>
              Bonus Points: +{bonusPoints}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
              {GameData.challengeModifiers.map(mod => (
                <div
                  key={mod.id}
                  onClick={() => toggleModifier(mod.id)}
                  style={{
                    ...styles.card,
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: modifiers.includes(mod.id) 
                      ? '1px solid #ef4444' 
                      : '1px solid rgba(139, 92, 246, 0.2)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: modifiers.includes(mod.id) ? '#ef4444' : '#e4e4e7' }}>
                        {mod.name}
                      </span>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        background: 'rgba(34, 197, 94, 0.2)',
                        color: '#22c55e',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '4px'
                      }}>
                        +{mod.statPoints} pts
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#71717a', margin: 0 }}>{mod.description}</p>
                  </div>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    border: '2px solid',
                    borderColor: modifiers.includes(mod.id) ? '#ef4444' : '#52525b',
                    background: modifiers.includes(mod.id) ? '#ef4444' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '0.8rem'
                  }}>
                    {modifiers.includes(mod.id) && '✓'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <Button onClick={onBack} variant="secondary">Back</Button>
          <Button onClick={() => onComplete({ sensitiveAreas, modifiers, bonusPoints })} variant="gold">
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

// Fetish Preferences Screen
const FetishPreferencesScreen = ({ onComplete, onBack }) => {
  const [enabledTags, setEnabledTags] = useState(
    GameData.fetishTags.filter(t => t.defaultEnabled).map(t => t.id)
  );
  
  const categories = [...new Set(GameData.fetishTags.map(t => t.category))];
  
  const toggleTag = (tagId) => {
    setEnabledTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };
  
  const selectAll = () => setEnabledTags(GameData.fetishTags.map(t => t.id));
  const selectNone = () => setEnabledTags([]);
  
  return (
    <div style={{ ...styles.container, padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ ...styles.subtitle, textAlign: 'center', marginBottom: '1rem' }}>
          Content Preferences
        </h2>
        <p style={{ textAlign: 'center', color: '#71717a', marginBottom: '2rem' }}>
          Enable content types you wish to see. Disabled content will be replaced with alternatives.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
          <Button onClick={selectAll} variant="secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            Enable All
          </Button>
          <Button onClick={selectNone} variant="secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            Disable All
          </Button>
        </div>
        
        {categories.map(category => (
          <div key={category} style={{ ...styles.panel, marginBottom: '1rem' }}>
            <h3 style={{ ...styles.subtitle, fontSize: '1rem', marginBottom: '1rem', textTransform: 'capitalize' }}>
              {category}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
              {GameData.fetishTags.filter(t => t.category === category).map(tag => (
                <div
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  style={{
                    ...styles.card,
                    padding: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    border: enabledTags.includes(tag.id) 
                      ? '1px solid #22c55e' 
                      : '1px solid rgba(139, 92, 246, 0.2)'
                  }}
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '3px',
                    border: '2px solid',
                    borderColor: enabledTags.includes(tag.id) ? '#22c55e' : '#52525b',
                    background: enabledTags.includes(tag.id) ? '#22c55e' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '0.7rem',
                    flexShrink: 0
                  }}>
                    {enabledTags.includes(tag.id) && '✓'}
                  </div>
                  <span style={{ fontSize: '0.9rem' }}>{tag.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <Button onClick={onBack} variant="secondary">Back</Button>
          <Button onClick={() => onComplete(enabledTags)} variant="gold">
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

// Stats Distribution Screen
const StatsDistributionScreen = ({ baseStats, bonusPoints, onComplete, onBack }) => {
  const basePointPool = 10;
  const totalPoints = basePointPool + bonusPoints;
  
  const statNames = {
    strength: { name: 'Strength', description: 'Physical power, melee damage' },
    vitality: { name: 'Vitality', description: 'Health points, physical resistance' },
    evasion: { name: 'Evasion', description: 'Dodge chance, initiative' },
    stamina: { name: 'Stamina', description: 'Action points, recovery rate' },
    willpower: { name: 'Willpower', description: 'Mental resistance, curse defense' },
    intelligence: { name: 'Intelligence', description: 'Magic power, skill points' },
    charm: { name: 'Charm', description: 'Persuasion, NPC interactions' },
    corruptionResistance: { name: 'Purity', description: 'Corruption resistance' }
  };
  
  const [allocatedPoints, setAllocatedPoints] = useState(
    Object.fromEntries(Object.keys(statNames).map(k => [k, 0]))
  );
  const [showSkipModal, setShowSkipModal] = useState(false);
  
  const usedPoints = Object.values(allocatedPoints).reduce((a, b) => a + b, 0);
  const remainingPoints = totalPoints - usedPoints;
  
  const adjustStat = (stat, delta) => {
    setAllocatedPoints(prev => {
      const newValue = prev[stat] + delta;
      if (newValue < 0 || (delta > 0 && remainingPoints <= 0)) return prev;
      return { ...prev, [stat]: newValue };
    });
  };
  
  const getFinalStats = (useAllocation = true) => {
    const final = {};
    if (useAllocation) {
      for (const stat of Object.keys(statNames)) {
        final[stat] = (baseStats[stat] || 0) + allocatedPoints[stat] + 5; // +5 base for all stats
      }
    } else {
      // Auto-distribute points evenly for skip
      const statsCount = Object.keys(statNames).length;
      const pointsPerStat = Math.floor(totalPoints / statsCount);
      const extraPoints = totalPoints % statsCount;
      const statKeys = Object.keys(statNames);
      
      for (let i = 0; i < statKeys.length; i++) {
        const stat = statKeys[i];
        final[stat] = (baseStats[stat] || 0) + 5 + pointsPerStat + (i < extraPoints ? 1 : 0);
      }
    }
    return final;
  };
  
  const handleSkipConfirm = () => {
    setShowSkipModal(false);
    onComplete(getFinalStats(false));
  };
  
  return (
    <div style={{ ...styles.container, padding: '2rem' }}>
      {/* Skip Confirmation Modal */}
      {showSkipModal && (
        <div style={styles.modalOverlay} onClick={() => setShowSkipModal(false)}>
          <div style={{ ...styles.modal, maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ ...styles.subtitle, fontSize: '1.3rem', marginBottom: '1rem', textAlign: 'center' }}>
              ⚠️ Skip Allocation?
            </h3>
            <p style={{ color: '#a1a1aa', marginBottom: '1rem', textAlign: 'center' }}>
              Are you sure you want to skip stat allocation?
            </p>
            <p style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              Your <strong style={{ color: '#ffd700' }}>{totalPoints}</strong> points will be distributed 
              <strong style={{ color: '#a855f7' }}> evenly</strong> across all stats. This cannot be undone during character creation.
            </p>
            
            {/* Preview of auto-distributed stats */}
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.3)', 
              borderRadius: '8px', 
              padding: '1rem', 
              marginBottom: '1.5rem' 
            }}>
              <div style={{ fontSize: '0.85rem', color: '#71717a', marginBottom: '0.5rem', textAlign: 'center' }}>
                Preview of auto-distributed stats:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 1rem', fontSize: '0.9rem' }}>
                {Object.entries(getFinalStats(false)).map(([stat, value]) => (
                  <div key={stat} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#a1a1aa' }}>{statNames[stat].name}:</span>
                    <span style={{ color: '#ffd700' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Button onClick={() => setShowSkipModal(false)} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleSkipConfirm} variant="danger">
                Yes, Skip Allocation
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <h2 style={{ ...styles.subtitle, textAlign: 'center', marginBottom: '1rem' }}>
          Distribute Attributes
        </h2>
        
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '2rem',
          padding: '1rem',
          background: 'rgba(139, 92, 246, 0.1)',
          borderRadius: '8px'
        }}>
          <span style={{ fontSize: '1.2rem' }}>
            Points Remaining: <span style={{ color: remainingPoints > 0 ? '#ffd700' : '#ef4444', fontWeight: 'bold' }}>
              {remainingPoints}
            </span>
          </span>
          <p style={{ fontSize: '0.9rem', color: '#71717a', margin: '0.5rem 0 0' }}>
            Base: {basePointPool} + Bonus: {bonusPoints}
          </p>
        </div>
        
        <div style={styles.panel}>
          {Object.entries(statNames).map(([key, { name, description }]) => (
            <div 
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: '1px solid rgba(139, 92, 246, 0.1)'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{name}</div>
                <div style={{ fontSize: '0.8rem', color: '#71717a' }}>{description}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#52525b', fontSize: '0.9rem' }}>
                  {baseStats[key] || 0} + 5
                </span>
                <Button 
                  onClick={() => adjustStat(key, -1)} 
                  disabled={allocatedPoints[key] <= 0}
                  style={{ padding: '0.25rem 0.75rem', fontSize: '1rem' }}
                >
                  −
                </Button>
                <span style={{ 
                  width: '40px', 
                  textAlign: 'center',
                  color: allocatedPoints[key] > 0 ? '#22c55e' : '#e4e4e7'
                }}>
                  +{allocatedPoints[key]}
                </span>
                <Button 
                  onClick={() => adjustStat(key, 1)} 
                  disabled={remainingPoints <= 0}
                  style={{ padding: '0.25rem 0.75rem', fontSize: '1rem' }}
                >
                  +
                </Button>
                <span style={{ 
                  width: '40px', 
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: '#ffd700'
                }}>
                  = {(baseStats[key] || 0) + 5 + allocatedPoints[key]}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <Button onClick={onBack} variant="secondary">Back</Button>
          <Button 
            onClick={() => setShowSkipModal(true)} 
            variant="secondary"
            style={{ opacity: 0.8 }}
          >
            Skip (Auto-Distribute)
          </Button>
          <Button 
            onClick={() => onComplete(getFinalStats())} 
            disabled={remainingPoints > 0}
            variant="gold"
          >
            {remainingPoints > 0 ? `Allocate ${remainingPoints} more points` : 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Intro Selection Screen
const IntroSelectionScreen = ({ onSelect }) => (
  <div style={{ 
    ...styles.container, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  }}>
    <div style={{ ...styles.panel, maxWidth: '500px', textAlign: 'center' }}>
      <h2 style={{ ...styles.subtitle, marginBottom: '1.5rem' }}>
        Your Journey Begins
      </h2>
      <p style={{ color: '#a1a1aa', marginBottom: '2rem' }}>
        How would you like to experience the introduction?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Button onClick={() => onSelect('full')} variant="gold">
          Watch Full Intro
        </Button>
        <Button onClick={() => onSelect('short')} variant="primary">
          Shortened Version
        </Button>
        <Button onClick={() => onSelect('skip')} variant="secondary">
          Skip Intro
        </Button>
      </div>
    </div>
  </div>
);

// Dialogue/Scene Screen
const DialogueScreen = ({ scene, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const dialogue = scene?.dialogue || [];
  const currentLine = dialogue[currentIndex];
  
  const handleAdvance = () => {
    if (currentIndex < dialogue.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };
  
  if (!currentLine) {
    onComplete();
    return null;
  }
  
  return (
    <div 
      style={{ 
        ...styles.container, 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '2rem',
        cursor: 'pointer'
      }}
      onClick={handleAdvance}
    >
      {/* Scene background area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '4rem'
        }}>
          {currentLine.speaker === 'narrator' ? '📜' : '👤'}
        </div>
      </div>
      
      {/* Dialogue box */}
      <div style={{
        ...styles.panel,
        maxWidth: '800px',
        margin: '0 auto',
        width: '100%'
      }}>
        {currentLine.speaker !== 'narrator' && (
          <div style={{ 
            color: '#ffd700', 
            fontFamily: '"Cinzel", serif',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            {currentLine.speaker}
          </div>
        )}
        <p style={{ 
          fontSize: '1.2rem', 
          lineHeight: 1.6,
          fontStyle: currentLine.speaker === 'narrator' ? 'italic' : 'normal'
        }}>
          {currentLine.text}
        </p>
        <div style={{ 
          textAlign: 'right', 
          marginTop: '1rem',
          color: '#52525b',
          fontSize: '0.9rem'
        }}>
          {currentIndex + 1}/{dialogue.length} • Click to continue
        </div>
      </div>
    </div>
  );
};

// Game Location Screen
const LocationScreen = ({ player, gameState, onAction, onPause, locationSystem, onNavigate, onInteractNpc }) => {
  const location = GameData.locations.find(l => l.id === player.currentLocation);

  if (!location) return <div>Error: Location not found</div>;

  const actionLabels = {
    rest: '🛏️ Rest',
    interact: '💬 Interact',
    shop: '🛒 Shop',
    move: '🚶 Travel',
    explore: '🔍 Explore',
    search: '🔎 Search',
    stealth: '👁️ Stealth'
  };

  // Get navigation options from location system or directly from location data
  const navigationOptions = locationSystem
    ? locationSystem.getNavigationOptions(player.currentLocation, player, gameState)
    : (location.navigation ? Object.entries(location.navigation).map(([direction, destId]) => {
        const directionLabels = {
          up: { icon: '⬆️', label: 'Up' },
          down: { icon: '⬇️', label: 'Down' },
          north: { icon: '⬆️', label: 'North' },
          south: { icon: '⬇️', label: 'South' },
          east: { icon: '➡️', label: 'East' },
          west: { icon: '⬅️', label: 'West' },
          in: { icon: '🚪', label: 'Enter' },
          out: { icon: '🚶', label: 'Exit' },
          back: { icon: '↩️', label: 'Back' }
        };
        const dirInfo = directionLabels[direction] || { icon: '📍', label: direction };
        const destLocation = GameData.locations.find(l => l.id === destId);
        return {
          direction,
          directionIcon: dirInfo.icon,
          directionLabel: dirInfo.label,
          locationId: destId,
          location: destLocation,
          accessible: true
        };
      }) : []);

  // Get NPCs at this location
  const locationNpcs = location.npcs || [];

  return (
    <div style={{ ...styles.container, padding: '1.5rem' }}>
      {/* Top HUD */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1rem'
      }}>
        {/* Player Stats */}
        <div style={{ ...styles.card, padding: '1rem', minWidth: '200px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{player.name}</div>
          <div style={{ fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '0.5rem' }}>
            Lv.{player.level} • {GameData.characters.find(c => c.id === player.characterId)?.name}
          </div>
          <ProgressBar value={player.currentHp} max={player.maxHp} color="#22c55e" label="HP" />
          <ProgressBar value={player.currentStamina} max={player.maxStamina} color="#3b82f6" label="Stamina" />
          <ProgressBar
            value={player.nsfwStats.corruption}
            max={player.nsfwStats.maxCorruption}
            color="#a855f7"
            label="Corruption"
          />
        </div>

        {/* Menu Button */}
        <Button onClick={onPause} style={{ padding: '0.75rem 1.5rem' }}>
          ☰ Menu
        </Button>
      </div>

      {/* Location Display */}
      <div style={{
        ...styles.panel,
        marginBottom: '1rem',
        display: 'flex',
        gap: '1.5rem'
      }}>
        {/* Location Image Placeholder */}
        <div style={{
          width: '300px',
          height: '200px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '4rem',
          flexShrink: 0
        }}>
          {location.tags.includes('safe') ? '🏠' :
           location.tags.includes('forest') ? '🌲' :
           location.tags.includes('dungeon') ? '🏰' : '📍'}
        </div>

        <div>
          <h2 style={{ ...styles.subtitle, fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            {location.name}
          </h2>
          <p style={{ color: '#a1a1aa', marginBottom: '1rem' }}>
            {location.description}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {location.tags.map(tag => (
              <span
                key={tag}
                style={{
                  padding: '0.25rem 0.75rem',
                  background: tag === 'safe' ? 'rgba(34, 197, 94, 0.2)' :
                             tag === 'dangerous' ? 'rgba(239, 68, 68, 0.2)' :
                             'rgba(139, 92, 246, 0.2)',
                  color: tag === 'safe' ? '#22c55e' :
                         tag === 'dangerous' ? '#ef4444' : '#a1a1aa',
                  borderRadius: '4px',
                  fontSize: '0.8rem'
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          {location.encounterChance > 0 && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#ef4444' }}>
              ⚠️ Danger Level: {location.encounterChance}% encounter chance
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ ...styles.panel, marginBottom: '1rem' }}>
        <h3 style={{ ...styles.subtitle, fontSize: '1rem', marginBottom: '1rem' }}>
          Actions
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {location.actions.map(action => (
            <Button
              key={action}
              onClick={() => onAction(action)}
              variant={action === 'move' ? 'gold' : 'primary'}
            >
              {actionLabels[action] || action}
            </Button>
          ))}
        </div>
      </div>

      {/* Navigation Row - Sub-location directions */}
      {navigationOptions.length > 0 && (
        <div style={{ ...styles.panel, marginBottom: '1rem' }}>
          <h3 style={{ ...styles.subtitle, fontSize: '1rem', marginBottom: '1rem' }}>
            Navigation
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {navigationOptions.map(nav => (
              <Button
                key={nav.direction}
                onClick={() => onNavigate ? onNavigate(nav.locationId) : onAction('navigate', nav.locationId)}
                variant="secondary"
                disabled={!nav.accessible}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '0.75rem 1.25rem',
                  minWidth: '100px',
                  opacity: nav.accessible ? 1 : 0.5
                }}
              >
                <span style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{nav.directionIcon}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{nav.directionLabel}</span>
                <span style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '0.25rem' }}>
                  {nav.location?.name || nav.locationId}
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* NPCs Row - Characters at this location */}
      {locationNpcs.length > 0 && (
        <div style={{ ...styles.panel }}>
          <h3 style={{ ...styles.subtitle, fontSize: '1rem', marginBottom: '1rem' }}>
            NPCs
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {locationNpcs.map(npcId => {
              // Try to get NPC display name from GameData.npcs or format the ID
              const npcData = GameData.npcs?.find(n => n.id === npcId);
              const npcName = npcData?.name || npcId.split('_').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ');
              const npcIcon = npcData?.icon || '👤';

              return (
                <Button
                  key={npcId}
                  onClick={() => onInteractNpc ? onInteractNpc(npcId) : onAction('interact_npc', npcId)}
                  variant="primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.25rem'
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>{npcIcon}</span>
                  <span>{npcName}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Combat Screen
const CombatScreen = ({ player, enemies, onAction, onFlee }) => {
  const [selectedTarget, setSelectedTarget] = useState(0);
  const [combatLog, setCombatLog] = useState(['Combat begins!']);
  
  const isRestrained = player.restraintState !== null;
  
  return (
    <div style={{ ...styles.container, padding: '1.5rem' }}>
      {/* Combat Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '1rem',
        padding: '0.5rem',
        background: 'rgba(239, 68, 68, 0.2)',
        borderRadius: '8px',
        border: '1px solid rgba(239, 68, 68, 0.4)'
      }}>
        <span style={{ color: '#ef4444', fontWeight: 'bold', letterSpacing: '0.1em' }}>
          ⚔️ COMBAT ⚔️
        </span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1rem' }}>
        {/* Player Panel */}
        <div style={styles.panel}>
          <h3 style={{ ...styles.subtitle, fontSize: '1rem', marginBottom: '1rem' }}>
            {player.name}
          </h3>
          <ProgressBar value={player.currentHp} max={player.maxHp} color="#22c55e" label="HP" />
          <ProgressBar value={player.currentStamina} max={player.maxStamina} color="#3b82f6" label="Stamina" />
          
          {isRestrained && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.2)',
              borderRadius: '4px',
              border: '1px solid rgba(239, 68, 68, 0.4)'
            }}>
              <div style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                ⛓️ {GameData.restraints[player.restraintState.type]?.name || 'Restrained'}
              </div>
              <ProgressBar 
                value={player.restraintState.hp} 
                max={player.restraintState.maxHp} 
                color="#ef4444" 
                label="Restraint HP"
              />
            </div>
          )}
        </div>
        
        {/* Combat Log / Arena */}
        <div style={{ ...styles.panel, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ ...styles.subtitle, fontSize: '1rem', marginBottom: '1rem' }}>
            Battle Arena
          </h3>
          
          {/* Enemies Display */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap'
          }}>
            {enemies.map((enemy, index) => (
              <div 
                key={enemy.uniqueId}
                onClick={() => setSelectedTarget(index)}
                style={{
                  ...styles.card,
                  padding: '1rem',
                  cursor: 'pointer',
                  border: selectedTarget === index ? '2px solid #ffd700' : '1px solid rgba(139, 92, 246, 0.2)',
                  opacity: enemy.currentHp <= 0 ? 0.5 : 1,
                  minWidth: '120px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                  {enemy.tags?.includes('beast') ? '🐺' : 
                   enemy.tags?.includes('humanoid') ? '🗡️' : '👹'}
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{enemy.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Lv.{enemy.level}</div>
                <ProgressBar 
                  value={enemy.currentHp} 
                  max={enemy.stats.hp} 
                  color="#ef4444" 
                  showValue={false}
                />
              </div>
            ))}
          </div>
          
          {/* Combat Log */}
          <div style={{
            flex: 1,
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            padding: '0.75rem',
            maxHeight: '150px',
            overflowY: 'auto',
            fontSize: '0.9rem'
          }}>
            {combatLog.map((log, i) => (
              <div key={i} style={{ color: '#a1a1aa', marginBottom: '0.25rem' }}>{log}</div>
            ))}
          </div>
        </div>
        
        {/* Actions Panel */}
        <div style={styles.panel}>
          <h3 style={{ ...styles.subtitle, fontSize: '1rem', marginBottom: '1rem' }}>
            Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {!isRestrained ? (
              <>
                <Button onClick={() => onAction('attack', selectedTarget)} variant="danger">
                  ⚔️ Attack
                </Button>
                <Button onClick={() => onAction('defend')} variant="primary">
                  🛡️ Defend
                </Button>
                <Button onClick={() => onAction('skill')} variant="primary">
                  ✨ Skills
                </Button>
                <Button onClick={() => onAction('item')} variant="secondary">
                  🎒 Items
                </Button>
                <Button onClick={onFlee} variant="secondary">
                  🏃 Flee
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => onAction('resist')} 
                  variant="danger"
                  disabled={player.currentStamina < player.maxStamina * 0.1}
                >
                  💪 Resist (-10% Stamina)
                </Button>
                <Button onClick={() => onAction('recover')} variant="success">
                  💚 Recover (+20% Stamina)
                </Button>
                <Button onClick={() => onAction('submit')} variant="secondary">
                  🏳️ Submit
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Pause Menu (Skyrim-style)
const PauseMenu = ({ player, gameState, onResume, onSave, onLoad, onSettings, onChangelog, onExit, inventorySystem, onUpdatePlayer }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('menu');
  const [statsSubTab, setStatsSubTab] = useState('overview');
  const [achievementFilter, setAchievementFilter] = useState('all');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Handle inventory context menu actions
  const handleInventoryAction = useCallback((action, item) => {
    switch (action) {
      case 'use':
        // Handle consumable use
        if (item.useEffect) {
          toast.info('Item Used', `Used ${item.name}`);
          // Remove item from inventory (or reduce count)
          onUpdatePlayer(prev => ({
            ...prev,
            inventory: prev.inventory.filter(i => i.uniqueId !== item.uniqueId)
          }));
        }
        break;
      case 'equip':
        toast.info('Equipped', `Equipped ${item.name}`);
        // TODO: Implement equipment system
        break;
      case 'drop':
        onUpdatePlayer(prev => ({
          ...prev,
          inventory: prev.inventory.filter(i => i.uniqueId !== item.uniqueId)
        }));
        toast.info('Dropped', `Dropped ${item.name}`);
        break;
      case 'toggleFavorite':
        if (inventorySystem) {
          inventorySystem.toggleFavorite(player.inventory, item.uniqueId);
          onUpdatePlayer(prev => ({ ...prev, inventory: [...prev.inventory] }));
        }
        break;
      case 'toggleJunk':
        if (inventorySystem) {
          inventorySystem.toggleJunk(player.inventory, item.uniqueId);
          onUpdatePlayer(prev => ({ ...prev, inventory: [...prev.inventory] }));
        }
        break;
      case 'examine':
        toast.info(item.name, item.description || 'No description available.');
        break;
    }
  }, [inventorySystem, player.inventory, onUpdatePlayer, toast]);
  
  const canSave = gameState.difficulty !== 'hard' && gameState.difficulty !== 'nightmare' || 
    GameData.locations.find(l => l.id === player.currentLocation)?.tags.includes('safe');
  
  const tabs = [
    { id: 'menu', label: 'Menu' },
    { id: 'stats', label: 'Character' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'skills', label: 'Skills' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'map', label: 'Map' },
    { id: 'quests', label: 'Quests' }
  ];
  
  // PDF Generation function
  const generateCharacterPDF = async () => {
    setIsGeneratingPDF(true);
    toast.info('Generating PDF', 'Creating your character sheet...');
    
    try {
      // Dynamically load jsPDF from CDN
      if (!window.jspdf) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      // Colors
      const gold = [255, 215, 0];
      const darkBg = [15, 15, 26];
      const lightText = [228, 228, 231];
      const purple = [139, 92, 246];
      
      // Helper functions
      const addTitle = (text, y, size = 18) => {
        doc.setFontSize(size);
        doc.setTextColor(...gold);
        doc.text(text, 105, y, { align: 'center' });
        return y + size * 0.5;
      };
      
      const addSection = (title, y) => {
        doc.setFontSize(14);
        doc.setTextColor(...purple);
        doc.text(title, 15, y);
        doc.setDrawColor(...purple);
        doc.line(15, y + 2, 195, y + 2);
        return y + 10;
      };
      
      const addStat = (label, value, x, y) => {
        doc.setFontSize(10);
        doc.setTextColor(...lightText);
        doc.text(`${label}:`, x, y);
        doc.setTextColor(...gold);
        doc.text(String(value), x + 50, y);
      };
      
      // ===== PAGE 1: Overview =====
      doc.setFillColor(...darkBg);
      doc.rect(0, 0, 210, 297, 'F');
      
      // Title
      let y = 25;
      doc.setFontSize(24);
      doc.setTextColor(...gold);
      doc.text('CHARACTER SHEET', 105, y, { align: 'center' });
      y += 10;
      doc.setFontSize(12);
      doc.setTextColor(...lightText);
      doc.text('Shadows & Desire RPG', 105, y, { align: 'center' });
      
      // Character Info
      y = addSection('Character Information', 50);
      addStat('Name', player.name, 15, y);
      addStat('Level', player.level, 105, y);
      y += 7;
      addStat('Experience', `${player.experience}/${player.experienceToNext}`, 15, y);
      addStat('Difficulty', gameState.difficulty?.toUpperCase() || 'NORMAL', 105, y);
      y += 7;
      const location = GameData.locations.find(l => l.id === player.currentLocation);
      addStat('Location', location?.name || 'Unknown', 15, y);
      addStat('Gold', player.gold, 105, y);
      
      // Combat Stats
      y = addSection('Combat Statistics', y + 15);
      addStat('HP', `${player.currentHp}/${player.maxHp}`, 15, y);
      addStat('Stamina', `${player.currentStamina}/${player.maxStamina}`, 105, y);
      y += 7;
      addStat('Mana', `${player.currentMana}/${player.maxMana}`, 15, y);
      
      // Attributes
      y = addSection('Attributes', y + 15);
      const statEntries = Object.entries(player.stats);
      for (let i = 0; i < statEntries.length; i += 2) {
        const [stat1, val1] = statEntries[i];
        addStat(stat1.charAt(0).toUpperCase() + stat1.slice(1).replace(/([A-Z])/g, ' $1'), val1, 15, y);
        if (statEntries[i + 1]) {
          const [stat2, val2] = statEntries[i + 1];
          addStat(stat2.charAt(0).toUpperCase() + stat2.slice(1).replace(/([A-Z])/g, ' $1'), val2, 105, y);
        }
        y += 7;
      }
      
      // Equipment
      y = addSection('Equipment', y + 10);
      const equipSlots = Object.entries(player.equipment);
      for (let i = 0; i < equipSlots.length; i += 2) {
        const [slot1, item1] = equipSlots[i];
        addStat(slot1.replace(/_/g, ' ').toUpperCase(), item1?.name || 'Empty', 15, y);
        if (equipSlots[i + 1]) {
          const [slot2, item2] = equipSlots[i + 1];
          addStat(slot2.replace(/_/g, ' ').toUpperCase(), item2?.name || 'Empty', 105, y);
        }
        y += 7;
      }
      
      // Skills
      y = addSection('Unlocked Skills', y + 10);
      if (player.unlockedSkills.length === 0) {
        doc.setTextColor(113, 113, 122);
        doc.text('No skills unlocked yet', 15, y);
      } else {
        doc.setTextColor(...lightText);
        const skillText = player.unlockedSkills.map(s => GameData.skills[s]?.name || s).join(', ');
        const lines = doc.splitTextToSize(skillText, 180);
        doc.text(lines, 15, y);
        y += lines.length * 5;
      }
      
      // ===== PAGE 2: NSFW Stats =====
      doc.addPage();
      doc.setFillColor(...darkBg);
      doc.rect(0, 0, 210, 297, 'F');
      
      y = addTitle('NSFW STATISTICS', 25);
      
      // Status Bars
      y = addSection('Status Meters', 40);
      addStat('Corruption', `${player.nsfwStats.corruption}%`, 15, y);
      addStat('Purity', `${player.nsfwStats.purity}%`, 105, y);
      y += 7;
      addStat('Masculinity', `${player.nsfwStats.masculinity}%`, 15, y);
      addStat('Dominance', `${player.nsfwStats.dominance}%`, 105, y);
      
      // Sensitive Areas
      y = addSection('Sensitive Areas', y + 15);
      if (player.nsfwStats.sensitiveAreas.length === 0) {
        doc.setTextColor(113, 113, 122);
        doc.text('None selected', 15, y);
      } else {
        doc.setTextColor(...lightText);
        doc.text(player.nsfwStats.sensitiveAreas.join(', '), 15, y);
      }
      
      // Body Measurements
      y = addSection('Body Measurements', y + 15);
      const bodyEntries = Object.entries(player.nsfwStats.bodyMeasurements);
      for (let i = 0; i < bodyEntries.length; i += 2) {
        const [m1, v1] = bodyEntries[i];
        addStat(m1.replace(/([A-Z])/g, ' $1'), v1, 15, y);
        if (bodyEntries[i + 1]) {
          const [m2, v2] = bodyEntries[i + 1];
          addStat(m2.replace(/([A-Z])/g, ' $1'), v2, 105, y);
        }
        y += 7;
      }
      
      // Orifice Stats
      y = addSection('Orifice Statistics', y + 10);
      Object.entries(player.nsfwStats.orificeStats).forEach(([orifice, stats]) => {
        doc.setTextColor(...purple);
        doc.text(orifice.charAt(0).toUpperCase() + orifice.slice(1), 15, y);
        y += 6;
        doc.setTextColor(...lightText);
        doc.setFontSize(9);
        const fluids = stats.currentFluids < 1000 ? `${stats.currentFluids}ml` : `${(stats.currentFluids/1000).toFixed(1)}L`;
        doc.text(`Penetrations: ${stats.penetrationCount} | Stretch: ${stats.stretchLevel} | Fluids: ${fluids}`, 20, y);
        doc.setFontSize(10);
        y += 8;
      });
      
      // Sexual History
      y = addSection('Sexual History', y + 5);
      const historyEntries = Object.entries(player.nsfwStats.sexualHistory);
      for (let i = 0; i < historyEntries.length; i += 2) {
        const [h1, v1] = historyEntries[i];
        addStat(h1.replace(/([A-Z])/g, ' $1'), v1, 15, y);
        if (historyEntries[i + 1]) {
          const [h2, v2] = historyEntries[i + 1];
          addStat(h2.replace(/([A-Z])/g, ' $1'), v2, 105, y);
        }
        y += 7;
      }
      
      // Debuffs, Curses, Addictions
      y = addSection('Active Effects', y + 10);
      doc.setFontSize(10);
      doc.setTextColor(239, 68, 68);
      doc.text('Debuffs:', 15, y);
      doc.setTextColor(...lightText);
      doc.text(player.nsfwStats.debuffs.length ? player.nsfwStats.debuffs.map(d => d.name).join(', ') : 'None', 45, y);
      y += 7;
      doc.setTextColor(168, 85, 247);
      doc.text('Curses:', 15, y);
      doc.setTextColor(...lightText);
      doc.text(player.nsfwStats.curses.length ? player.nsfwStats.curses.map(c => c.name).join(', ') : 'None', 45, y);
      y += 7;
      doc.setTextColor(245, 158, 11);
      doc.text('Addictions:', 15, y);
      doc.setTextColor(...lightText);
      doc.text(player.nsfwStats.addictions.length ? player.nsfwStats.addictions.map(a => `${a.name} (${a.level}%)`).join(', ') : 'None', 50, y);
      
      // ===== PAGE 3: Inventory =====
      doc.addPage();
      doc.setFillColor(...darkBg);
      doc.rect(0, 0, 210, 297, 'F');
      
      y = addTitle('INVENTORY', 25);
      y = 40;
      
      if (player.inventory.length === 0) {
        doc.setTextColor(113, 113, 122);
        doc.text('Inventory is empty', 15, y);
      } else {
        player.inventory.slice(0, 40).forEach((item, i) => {
          // Item name with rarity color
          const rarityColors = {
            common: [156, 163, 175], uncommon: [34, 197, 94], rare: [59, 130, 246],
            epic: [168, 85, 247], legendary: [249, 115, 22], mythic: [255, 215, 0], divine: [255, 248, 220]
          };
          doc.setTextColor(...(rarityColors[item.rarity] || lightText));
          doc.setFontSize(10);
          const itemText = `${item.name}${item.count > 1 ? ` x${item.count}` : ''} [${item.rarity?.toUpperCase() || 'COMMON'}]`;
          doc.text(itemText, 15, y);
          y += 6;
          if (y > 280) {
            doc.addPage();
            doc.setFillColor(...darkBg);
            doc.rect(0, 0, 210, 297, 'F');
            y = 20;
          }
        });
        if (player.inventory.length > 40) {
          doc.setTextColor(...lightText);
          doc.text(`... and ${player.inventory.length - 40} more items`, 15, y);
        }
      }
      
      // ===== PAGE 4: Achievements =====
      doc.addPage();
      doc.setFillColor(...darkBg);
      doc.rect(0, 0, 210, 297, 'F');
      
      y = addTitle('ACHIEVEMENTS', 25);
      y = 40;
      
      const unlockedCount = player.unlockedAchievements.length;
      const totalCount = Object.keys(GameData.achievements).filter(a => !GameData.achievements[a].hidden || player.unlockedAchievements.includes(a)).length;
      
      doc.setFontSize(12);
      doc.setTextColor(...lightText);
      doc.text(`Unlocked: ${unlockedCount}/${totalCount}`, 15, y);
      y += 12;
      
      player.unlockedAchievements.forEach(achId => {
        const ach = GameData.achievements[achId];
        if (!ach) return;
        const rarityColor = GameData.achievementRarities[ach.rarity]?.color || '#9ca3af';
        const rgb = rarityColor.startsWith('#') ? [
          parseInt(rarityColor.slice(1, 3), 16),
          parseInt(rarityColor.slice(3, 5), 16),
          parseInt(rarityColor.slice(5, 7), 16)
        ] : lightText;
        
        doc.setTextColor(...rgb);
        doc.setFontSize(11);
        doc.text(`${ach.icon} ${ach.hidden ? ach.revealedName || ach.name : ach.name}`, 15, y);
        y += 5;
        doc.setFontSize(9);
        doc.setTextColor(113, 113, 122);
        doc.text(ach.hidden ? ach.revealedDescription || ach.description : ach.description, 20, y);
        y += 8;
        
        if (y > 280) {
          doc.addPage();
          doc.setFillColor(...darkBg);
          doc.rect(0, 0, 210, 297, 'F');
          y = 20;
        }
      });
      
      // Footer on last page
      doc.setFontSize(8);
      doc.setTextColor(113, 113, 122);
      doc.text(`Generated on ${new Date().toLocaleString()} | Play time: ${Math.floor(gameState.playTime / 3600)}h ${Math.floor((gameState.playTime % 3600) / 60)}m`, 105, 290, { align: 'center' });
      
      // Save
      doc.save(`${player.name.replace(/[^a-zA-Z0-9]/g, '_')}_character_sheet.pdf`);
      
      toast.success('PDF Generated', 'Character sheet downloaded successfully!');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('PDF Failed', 'Could not generate character sheet');
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
  const renderContent = () => {
    switch (activeTab) {
      case 'menu':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '0 auto' }}>
            <Button onClick={onSave} disabled={!canSave} variant="primary">
              {canSave ? 'Save Game' : '🔒 Cannot Save Here'}
            </Button>
            <Button onClick={onLoad} variant="secondary">Load Game</Button>
            <Button onClick={onSettings} variant="secondary">Settings</Button>
            <Button onClick={onChangelog} variant="secondary">Changelog</Button>
            <Button onClick={onExit} variant="danger">Exit to Menu</Button>
          </div>
        );
        
      case 'stats':
        return (
          <div>
            {/* Sub-tabs - now includes Overview with Paperdoll */}
            <div style={{ ...styles.tabContainer, marginBottom: '1rem' }}>
              {['overview', 'general', 'nsfw', 'debuffs', 'reputation'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatsSubTab(tab)}
                  style={{
                    ...styles.tab,
                    ...(statsSubTab === tab ? styles.tabActive : {})
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Overview Tab - Paperdoll + Stats Summary */}
            {statsSubTab === 'overview' && (
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                {/* Left side - Stats Summary */}
                <div style={{ width: '300px', flexShrink: 0 }}>
                  <div style={styles.card}>
                    <h4 style={{ color: '#50c8ff', marginBottom: '1rem' }}>General Stats</h4>
                    <StatDisplay label="Level" value={player.level} />
                    <StatDisplay label="Health" value={`${player.currentHp} / ${player.maxHp}`} color="#22c55e" />
                    <StatDisplay label="Mana" value={`${player.currentMana} / ${player.maxMana}`} color="#3b82f6" />
                    {Object.entries(player.stats).map(([stat, value]) => (
                      <StatDisplay 
                        key={stat}
                        label={stat.charAt(0).toUpperCase() + stat.slice(1).replace(/([A-Z])/g, ' $1')}
                        value={value}
                      />
                    ))}
                  </div>
                  <div style={{ ...styles.card, marginTop: '1rem' }}>
                    <h4 style={{ color: '#ff6b9d', marginBottom: '1rem' }}>Currency</h4>
                    <StatDisplay label="Creds" value={player.gold} color="#ffd700" />
                    <StatDisplay label="Mods" value={player.skillPoints || 0} color="#a855f7" />
                  </div>
                </div>
                
                {/* Right side - Full body paperdoll + character motto */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <FullBodyPaperdoll
                    paperdollState={player.paperdoll}
                    width={300}
                    height={450}
                    showLayerCount
                    characterMotto="Every challenge makes me stronger."
                  />
                </div>
              </div>
            )}
            
            {/* NSFW Stats Tab - Now includes body region paperdoll cards */}
            {statsSubTab === 'nsfw' && (
              <div>
                {/* Body Region Cards Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '12px',
                  marginBottom: '1.5rem'
                }}>
                  {[
                    { id: 'head', name: 'Mind', countKey: 'mind' },
                    { id: 'head', name: 'Ears', countKey: 'ears' },
                    { id: 'head', name: 'Mouth', countKey: 'mouth' },
                    { id: 'torso', name: 'Breasts', countKey: 'breasts' },
                    { id: 'ass', name: 'Ass', countKey: 'ass' },
                    { id: 'groin', name: 'Penis', countKey: 'penis' }
                  ].map((region, idx) => {
                    const orificeStats = player.nsfwStats?.orificeStats || {};
                    const regionCounts = player.paperdoll?.regionCounts || {};
                    const counts = {
                      mind: regionCounts.mind || 0,
                      ears: regionCounts.ears || 0,
                      mouth: orificeStats.mouth?.penetrationCount || 0,
                      breasts: regionCounts.breasts || 0,
                      ass: orificeStats.rear?.penetrationCount || 0,
                      penis: regionCounts.penis || 0
                    };
                    
                    return (
                      <PaperdollCard
                        key={`${region.id}-${region.name}-${idx}`}
                        regionId={region.id}
                        title={region.name}
                        paperdollState={player.paperdoll}
                        count={counts[region.countKey] || 0}
                        width={180}
                        imageHeight={140}
                      />
                    );
                  })}
                </div>
                
                {/* Status Bars and other NSFW stats below */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={styles.card}>
                    <h4 style={{ color: '#ec4899', marginBottom: '1rem' }}>Status Bars</h4>
                    <ProgressBar 
                      value={player.nsfwStats.corruption} 
                      max={100} 
                      color="#a855f7" 
                      label="Corruption" 
                    />
                    <ProgressBar 
                      value={player.nsfwStats.purity} 
                      max={100} 
                      color="#fbbf24" 
                      label="Purity" 
                    />
                    <ProgressBar 
                      value={player.nsfwStats.masculinity} 
                      max={100} 
                      color="#3b82f6" 
                      label="Masculinity" 
                    />
                    <ProgressBar 
                      value={player.nsfwStats.dominance} 
                      max={100} 
                      color="#ef4444" 
                      label="Dominance" 
                    />
                  </div>
                  <div style={styles.card}>
                    <h4 style={{ color: '#ec4899', marginBottom: '1rem' }}>Body Stats</h4>
                    {Object.entries(player.nsfwStats.bodyMeasurements).map(([part, value]) => (
                      <StatDisplay 
                        key={part}
                        label={part.replace(/([A-Z])/g, ' $1').trim()}
                        value={value}
                      />
                    ))}
                  </div>
                  <div style={styles.card}>
                    <h4 style={{ color: '#ec4899', marginBottom: '1rem' }}>Orifice Stats</h4>
                    {Object.entries(player.nsfwStats.orificeStats).map(([orifice, stats]) => (
                      <div key={orifice} style={{ marginBottom: '0.75rem' }}>
                        <div style={{ fontWeight: 'bold', color: '#a1a1aa', textTransform: 'capitalize' }}>{orifice}</div>
                        <div style={{ fontSize: '0.85rem', color: '#71717a' }}>
                          Penetrations: {stats.penetrationCount} | Stretch: {stats.stretchLevel} | 
                          Fluids: {stats.currentFluids < 1000 ? `${stats.currentFluids}ml` : `${(stats.currentFluids/1000).toFixed(1)}L`}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={styles.card}>
                    <h4 style={{ color: '#ec4899', marginBottom: '1rem' }}>Sexual History</h4>
                    {Object.entries(player.nsfwStats.sexualHistory).map(([type, count]) => (
                      <StatDisplay 
                        key={type}
                        label={type.replace(/([A-Z])/g, ' $1').trim()}
                        value={count}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {statsSubTab === 'general' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={styles.card}>
                  <h4 style={{ color: '#ffd700', marginBottom: '1rem' }}>Combat Stats</h4>
                  <StatDisplay label="Level" value={player.level} />
                  <StatDisplay label="Experience" value={`${player.experience}/${player.experienceToNext}`} />
                  <StatDisplay label="HP" value={`${player.currentHp}/${player.maxHp}`} color="#22c55e" />
                  <StatDisplay label="Stamina" value={`${player.currentStamina}/${player.maxStamina}`} color="#3b82f6" />
                </div>
                <div style={styles.card}>
                  <h4 style={{ color: '#ffd700', marginBottom: '1rem' }}>Attributes</h4>
                  {Object.entries(player.stats).map(([stat, value]) => (
                    <StatDisplay 
                      key={stat}
                      label={stat.charAt(0).toUpperCase() + stat.slice(1).replace(/([A-Z])/g, ' $1')}
                      value={value}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {statsSubTab === 'debuffs' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={styles.card}>
                  <h4 style={{ color: '#ef4444', marginBottom: '1rem' }}>Active Debuffs</h4>
                  {player.nsfwStats.debuffs.length === 0 ? (
                    <p style={{ color: '#71717a', fontStyle: 'italic' }}>No debuffs</p>
                  ) : (
                    player.nsfwStats.debuffs.map((debuff, i) => (
                      <div key={i} style={{ 
                        padding: '0.5rem', 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        borderRadius: '4px',
                        marginBottom: '0.5rem'
                      }}>
                        {debuff.name}
                      </div>
                    ))
                  )}
                </div>
                <div style={styles.card}>
                  <h4 style={{ color: '#a855f7', marginBottom: '1rem' }}>Curses</h4>
                  {player.nsfwStats.curses.length === 0 ? (
                    <p style={{ color: '#71717a', fontStyle: 'italic' }}>No curses</p>
                  ) : (
                    player.nsfwStats.curses.map((curse, i) => (
                      <div key={i} style={{ 
                        padding: '0.5rem', 
                        background: 'rgba(168, 85, 247, 0.1)', 
                        borderRadius: '4px',
                        marginBottom: '0.5rem'
                      }}>
                        {curse.name}
                      </div>
                    ))
                  )}
                </div>
                <div style={styles.card}>
                  <h4 style={{ color: '#f59e0b', marginBottom: '1rem' }}>Addictions</h4>
                  {player.nsfwStats.addictions.length === 0 ? (
                    <p style={{ color: '#71717a', fontStyle: 'italic' }}>No addictions</p>
                  ) : (
                    player.nsfwStats.addictions.map((addiction, i) => (
                      <div key={i} style={{ 
                        padding: '0.5rem', 
                        background: 'rgba(245, 158, 11, 0.1)', 
                        borderRadius: '4px',
                        marginBottom: '0.5rem'
                      }}>
                        {addiction.name} - {addiction.level}%
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {statsSubTab === 'reputation' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={styles.card}>
                  <h4 style={{ color: '#10b981', marginBottom: '1rem' }}>Faction Reputation</h4>
                  <p style={{ color: '#71717a', fontStyle: 'italic' }}>No faction standings yet</p>
                </div>
                <div style={styles.card}>
                  <h4 style={{ color: '#f59e0b', marginBottom: '1rem' }}>NPC Relationships</h4>
                  {Object.keys(gameState.npcRelationships || {}).length === 0 ? (
                    <p style={{ color: '#71717a', fontStyle: 'italic' }}>No relationships established</p>
                  ) : (
                    Object.entries(gameState.npcRelationships).map(([npcId, rep]) => (
                      <StatDisplay 
                        key={npcId}
                        label={npcId.replace(/_/g, ' ')}
                        value={rep}
                        color={rep > 0 ? '#22c55e' : rep < 0 ? '#ef4444' : '#a1a1aa'}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
            
            {/* Print Character Sheet Button */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Button 
                onClick={generateCharacterPDF} 
                disabled={isGeneratingPDF}
                variant="secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {isGeneratingPDF ? '⏳ Generating...' : '🖨️ Print Character Sheet (PDF)'}
              </Button>
            </div>
          </div>
        );
        
      case 'inventory':
        return (
          <div style={{ height: '500px' }}>
            <UniversalInventory
              mode="player"
              items={player.inventory || []}
              title="Inventory"
              gold={player.gold}
              onContextAction={handleInventoryAction}
              onItemDoubleClick={(item) => {
                // Double-click to use consumables or equip items
                if (item.category === 'consumable' || item.useEffect) {
                  handleInventoryAction('use', item);
                } else if (item.slot) {
                  handleInventoryAction('equip', item);
                }
              }}
              showFilters={true}
              emptyMessage="Your inventory is empty"
            />
          </div>
        );
        
      case 'skills':
        return (
          <div>
            <h3 style={{ ...styles.subtitle, fontSize: '1rem', marginBottom: '1rem' }}>
              Skill Trees • Available Points: {player.skillPoints}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {Object.entries(GameData.skillTrees).map(([treeId, tree]) => (
                <div key={treeId} style={styles.card}>
                  <h4 style={{ color: '#ffd700', marginBottom: '1rem' }}>{tree.name}</h4>
                  {tree.skills.map(skillId => {
                    const skill = GameData.skills[skillId];
                    if (!skill) return null;
                    const isUnlocked = player.unlockedSkills.includes(skillId);
                    return (
                      <div 
                        key={skillId}
                        style={{
                          padding: '0.5rem',
                          background: isUnlocked ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                          borderRadius: '4px',
                          marginBottom: '0.5rem',
                          opacity: isUnlocked ? 1 : 0.6
                        }}
                      >
                        <div style={{ fontWeight: 'bold' }}>{skill.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#71717a' }}>{skill.description}</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'map':
        return (
          <div>
            <h3 style={{ ...styles.subtitle, fontSize: '1rem', marginBottom: '1rem' }}>World Map</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {GameData.locations.map(loc => {
                const isVisited = player.visitedLocations.includes(loc.id);
                const isCurrent = player.currentLocation === loc.id;
                return (
                  <div 
                    key={loc.id}
                    style={{
                      ...styles.card,
                      padding: '0.75rem',
                      opacity: isVisited ? 1 : 0.5,
                      border: isCurrent ? '2px solid #ffd700' : '1px solid rgba(139, 92, 246, 0.2)'
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>
                      {isCurrent && '📍 '}
                      {isVisited ? loc.name : '???'}
                    </div>
                    {isVisited && (
                      <div style={{ fontSize: '0.8rem', color: '#71717a', marginTop: '0.25rem' }}>
                        {loc.tags.includes('safe') ? '🛡️ Safe Zone' : 
                         loc.tags.includes('dangerous') ? '⚠️ Dangerous' : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
        
      case 'achievements':
        const achievementCategories = ['all', 'exploration', 'combat', 'loot', 'progress', 'nsfw', 'secret'];
        const allAchievements = Object.values(GameData.achievements);
        const filteredAchievements = achievementFilter === 'all' 
          ? allAchievements 
          : allAchievements.filter(a => a.category === achievementFilter);
        
        const unlockedCount = player.unlockedAchievements.length;
        const visibleTotal = allAchievements.filter(a => !a.hidden || player.unlockedAchievements.includes(a.id)).length;
        
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ ...styles.subtitle, fontSize: '1rem' }}>
                Achievements ({unlockedCount}/{visibleTotal})
              </h3>
            </div>
            
            {/* Category filters */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {achievementCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setAchievementFilter(cat)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    background: achievementFilter === cat ? 'rgba(139, 92, 246, 0.3)' : 'rgba(0, 0, 0, 0.2)',
                    border: achievementFilter === cat ? '1px solid rgba(139, 92, 246, 0.6)' : '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '4px',
                    color: achievementFilter === cat ? '#e4e4e7' : '#a1a1aa',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            {/* Achievement grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {filteredAchievements.map(ach => {
                const isUnlocked = player.unlockedAchievements.includes(ach.id);
                const isHidden = ach.hidden && !isUnlocked;
                const rarityStyle = GameData.achievementRarities[ach.rarity] || GameData.achievementRarities.common;
                const progress = player.achievementProgress[ach.id] || ach.progress;
                
                // Don't show hidden achievements unless unlocked
                if (isHidden && achievementFilter !== 'secret' && achievementFilter !== 'all') return null;
                
                return (
                  <div 
                    key={ach.id}
                    style={{
                      ...styles.card,
                      padding: '1rem',
                      opacity: isUnlocked ? 1 : 0.5,
                      borderLeft: `4px solid ${isUnlocked ? rarityStyle.color : '#4b5563'}`,
                      boxShadow: isUnlocked && rarityStyle.glow ? rarityStyle.glow : 'none',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Unlocked shimmer effect for rare+ */}
                    {isUnlocked && (ach.rarity === 'mythic' || ach.rarity === 'divine') && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.1) 50%, transparent 100%)',
                        animation: 'toastShimmer 4s ease-in-out infinite',
                        pointerEvents: 'none'
                      }} />
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
                      <span style={{ 
                        fontSize: '1.5rem',
                        filter: isUnlocked ? 'none' : 'grayscale(100%)'
                      }}>
                        {isHidden ? '❓' : ach.icon}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: 'bold', 
                          color: isUnlocked ? rarityStyle.color : '#6b7280',
                          marginBottom: '0.25rem'
                        }}>
                          {isHidden ? '???' : (isUnlocked && ach.revealedName ? ach.revealedName : ach.name)}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                          {isHidden ? 'Hidden achievement' : (isUnlocked && ach.revealedDescription ? ach.revealedDescription : ach.description)}
                        </div>
                        
                        {/* Progress bar for achievements with progress */}
                        {progress && !isUnlocked && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <div style={{ 
                              height: '4px', 
                              background: 'rgba(0, 0, 0, 0.3)', 
                              borderRadius: '2px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${Math.min(100, (progress.current / progress.target) * 100)}%`,
                                background: rarityStyle.color,
                                borderRadius: '2px',
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.25rem' }}>
                              {progress.current}/{progress.target}
                            </div>
                          </div>
                        )}
                        
                        {/* Rarity badge */}
                        <div style={{ 
                          fontSize: '0.7rem', 
                          color: rarityStyle.color,
                          textTransform: 'uppercase',
                          marginTop: '0.5rem',
                          opacity: 0.8
                        }}>
                          {ach.rarity}
                        </div>
                      </div>
                      
                      {/* Unlocked checkmark */}
                      {isUnlocked && (
                        <span style={{ color: '#22c55e', fontSize: '1.2rem' }}>✓</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
        
      case 'quests':
        return (
          <div>
            <h3 style={{ ...styles.subtitle, fontSize: '1rem', marginBottom: '1rem' }}>Active Quests</h3>
            {player.activeQuests.length === 0 ? (
              <p style={{ color: '#71717a', fontStyle: 'italic' }}>No active quests</p>
            ) : (
              player.activeQuests.map((quest, i) => (
                <div key={i} style={{ ...styles.card, marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 'bold' }}>{quest.name}</div>
                  <div style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>{quest.description}</div>
                </div>
              ))
            )}
            
            <h3 style={{ ...styles.subtitle, fontSize: '1rem', marginTop: '2rem', marginBottom: '1rem' }}>
              Completed ({player.completedQuests.length})
            </h3>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div style={{ ...styles.container, padding: '1.5rem', position: 'relative' }}>
      {/* Resume button - always visible in top right */}
      <button
        onClick={onResume}
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 140, 0, 0.2) 100%)',
          border: '1px solid rgba(255, 215, 0, 0.4)',
          borderRadius: '4px',
          padding: '1rem 2rem',
          color: '#ffd700',
          fontFamily: '"Cinzel", serif',
          fontSize: '1.1rem',
          letterSpacing: '0.1em',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          textTransform: 'uppercase',
          zIndex: 10
        }}
      >
        Resume Game
      </button>

      {/* Tabs */}
      <div style={{ ...styles.tabContainer, justifyContent: 'center' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {})
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ ...styles.panel, minHeight: '500px' }}>
        {renderContent()}
      </div>
    </div>
  );
};

// Save/Load Screen
const SaveLoadScreen = ({ mode, onSelect, onBack }) => {
  const [saves, setSaves] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  useEffect(() => {
    setSaves(SaveSystem.listSaves());
  }, []);
  
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };
  
  const formatPlayTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };
  
  return (
    <div style={{ ...styles.container, padding: '2rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <h2 style={{ ...styles.subtitle, textAlign: 'center', marginBottom: '2rem' }}>
          {mode === 'save' ? 'Save Game' : 'Load Game'}
        </h2>
        
        {mode === 'save' && (
          <div 
            onClick={() => setSelectedSlot('new')}
            style={{
              ...styles.card,
              cursor: 'pointer',
              marginBottom: '1rem',
              border: selectedSlot === 'new' ? '2px solid #ffd700' : '1px solid rgba(139, 92, 246, 0.2)',
              textAlign: 'center',
              padding: '1.5rem'
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>+ New Save</span>
          </div>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
          {saves.map(save => (
            <div
              key={save.slot}
              onClick={() => setSelectedSlot(save.slot)}
              style={{
                ...styles.card,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: selectedSlot === save.slot ? '2px solid #ffd700' : '1px solid rgba(139, 92, 246, 0.2)'
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  {save.slot === 'auto' ? '🔄 Autosave' : `💾 Save ${save.slot}`}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>
                  {save.playerName} • Lv.{save.level} • {GameData.locations.find(l => l.id === save.location)?.name || save.location}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', color: '#71717a' }}>
                  {formatDate(save.timestamp)}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#71717a' }}>
                  {formatPlayTime(save.playTime)}
                </div>
              </div>
            </div>
          ))}
          
          {saves.length === 0 && mode === 'load' && (
            <p style={{ textAlign: 'center', color: '#71717a', fontStyle: 'italic', padding: '2rem' }}>
              No saves found
            </p>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <Button onClick={onBack} variant="secondary">Back</Button>
          <Button 
            onClick={() => selectedSlot && onSelect(selectedSlot)}
            disabled={!selectedSlot}
            variant="gold"
          >
            {mode === 'save' ? 'Save' : 'Load'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Settings Screen
const SettingsScreen = ({ gameState, onUpdateSettings, onBack }) => {
  const [localSettings, setLocalSettings] = useState({
    masterVolume: 80,
    musicVolume: 70,
    sfxVolume: 100,
    textSpeed: 'normal',
    autoSave: true,
    confirmActions: true
  });
  
  return (
    <div style={{ ...styles.container, padding: '2rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ ...styles.subtitle, textAlign: 'center', marginBottom: '2rem' }}>
          Settings
        </h2>
        
        <div style={styles.panel}>
          <h3 style={{ ...styles.subtitle, fontSize: '1rem', marginBottom: '1rem' }}>Audio</h3>
          
          {['masterVolume', 'musicVolume', 'sfxVolume'].map(setting => (
            <div key={setting} style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>{setting.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span>{localSettings[setting]}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={localSettings[setting]}
                onChange={e => setLocalSettings(prev => ({ ...prev, [setting]: parseInt(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>
          ))}
          
          <h3 style={{ ...styles.subtitle, fontSize: '1rem', marginTop: '2rem', marginBottom: '1rem' }}>Gameplay</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <span>Text Speed</span>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              {['slow', 'normal', 'fast', 'instant'].map(speed => (
                <Button
                  key={speed}
                  onClick={() => setLocalSettings(prev => ({ ...prev, textSpeed: speed }))}
                  variant={localSettings.textSpeed === speed ? 'gold' : 'secondary'}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                >
                  {speed.charAt(0).toUpperCase() + speed.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          
          {['autoSave', 'confirmActions'].map(setting => (
            <div 
              key={setting}
              onClick={() => setLocalSettings(prev => ({ ...prev, [setting]: !prev[setting] }))}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
                cursor: 'pointer'
              }}
            >
              <span>{setting.replace(/([A-Z])/g, ' $1').trim()}</span>
              <div style={{
                width: '50px',
                height: '26px',
                borderRadius: '13px',
                background: localSettings[setting] ? '#22c55e' : '#52525b',
                position: 'relative',
                transition: 'background 0.3s ease'
              }}>
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute',
                  top: '2px',
                  left: localSettings[setting] ? '26px' : '2px',
                  transition: 'left 0.3s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <Button onClick={onBack} variant="secondary">Back</Button>
          <Button onClick={() => onUpdateSettings(localSettings)} variant="gold">
            Apply Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN GAME COMPONENT
// ============================================================================

const Game = () => {
  // Toast notifications
  const toast = useToast();
  
  // Game state
  const [screen, setScreen] = useState('menu');
  const [player, setPlayer] = useState({ ...defaultPlayerState });
  const [gameState, setGameState] = useState({ ...defaultGameState });
  
  // Character creation flow state
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [nsfwConfig, setNsfwConfig] = useState(null);
  const [enabledTags, setEnabledTags] = useState([]);
  
  // UI state
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [showTravelModal, setShowTravelModal] = useState(false);
  const [travelDestination, setTravelDestination] = useState(null);
  const [currentScene, setCurrentScene] = useState(null);
  const [sceneContext, setSceneContext] = useState(null); // Extra context for scenes (e.g., requirement info)

  // Travel system state
  const [mapView, setMapView] = useState('local');
  const [showLocationTitle, setShowLocationTitle] = useState(false);
  const [locationTitleData, setLocationTitleData] = useState(null);

  // Expedition state (region-to-region travel)
  const [currentExpedition, setCurrentExpedition] = useState(null);
  const [showExpedition, setShowExpedition] = useState(false);

  // Combat state
  const [combatEnemies, setCombatEnemies] = useState([]);

  // Merchant state
  const [showMerchantView, setShowMerchantView] = useState(false);
  const [activeMerchant, setActiveMerchant] = useState(null);
  const [merchantStock, setMerchantStock] = useState([]);

  // Rumor confrontation state
  const [showRumorConfrontation, setShowRumorConfrontation] = useState(false);
  const [rumorConfrontationData, setRumorConfrontationData] = useState(null);
  const [showRumorResult, setShowRumorResult] = useState(false);
  const [rumorResult, setRumorResult] = useState(null);

  // Service interaction state (church, clinic, nursery)
  const [showServiceInteraction, setShowServiceInteraction] = useState(false);
  const [serviceInteractionData, setServiceInteractionData] = useState(null);
  const [showServiceResult, setShowServiceResult] = useState(false);
  const [serviceResult, setServiceResult] = useState(null);

  // Changelog modal state
  const [showChangelog, setShowChangelog] = useState(false);

  // Debug and Content Generator modal state
  const [showDebugMenu, setShowDebugMenu] = useState(false);
  const [showContentGenerator, setShowContentGenerator] = useState(false);

  // Engine system refs
  const inventorySystemRef = useRef(null);
  const fameSystemRef = useRef(null);
  const merchantSystemRef = useRef(null);
  const unlockSystemRef = useRef(null);
  const locationSystemRef = useRef(null);
  const reputationSystemRef = useRef(null);
  const rumorSystemRef = useRef(null);
  const locationServicesRef = useRef(null);
  const discoverySystemRef = useRef(null);
  const publicEventSystemRef = useRef(null);
  const barringSystemRef = useRef(null);
  const expeditionSystemRef = useRef(null);
  const timeSystemRef = useRef(null);
  const lodgingSystemRef = useRef(null);
  const inputValidationSystemRef = useRef(null);
  const actionRequirementSystemRef = useRef(null);
  const systemsInitializedRef = useRef(false);

  // Initialize engine systems
  useEffect(() => {
    if (!systemsInitializedRef.current) {
      // Create system instances
      inventorySystemRef.current = new InventorySystem();
      fameSystemRef.current = new FameSystem();
      merchantSystemRef.current = new MerchantSystem(null, fameSystemRef.current, inventorySystemRef.current);
      unlockSystemRef.current = new UnlockSystem();
      locationSystemRef.current = new LocationSystem(unlockSystemRef.current);

      // Initialize location system with data
      // Note: In production, this would load from datapacks
      const locationFontData = {
        fontTags: {
          friendly_town: { fontFamily: "'Cinzel', serif", color: "#ffd700", textShadow: "0 2px 4px rgba(0,0,0,0.5), 0 0 20px rgba(255,215,0,0.3)", fontSize: "2.5rem", fontWeight: "600" },
          hostile_area: { fontFamily: "'Creepster', cursive", color: "#dc2626", textShadow: "0 0 10px rgba(220,38,38,0.7), 0 0 30px rgba(220,38,38,0.4)", fontSize: "2.5rem", fontWeight: "400" },
          hostile_forest: { fontFamily: "'MedievalSharp', cursive", color: "#22c55e", textShadow: "0 0 8px rgba(34,197,94,0.5), 0 0 25px rgba(34,197,94,0.3)", fontSize: "2.5rem", fontWeight: "400" },
          dungeon: { fontFamily: "'Pirata One', cursive", color: "#a855f7", textShadow: "0 0 12px rgba(168,85,247,0.6), 0 0 30px rgba(168,85,247,0.3)", fontSize: "2.5rem", fontWeight: "400" },
          mystical: { fontFamily: "'Uncial Antiqua', cursive", color: "#06b6d4", textShadow: "0 0 15px rgba(6,182,212,0.7), 0 0 35px rgba(6,182,212,0.4)", fontSize: "2.5rem", fontWeight: "400" },
          corrupted: { fontFamily: "'Nosifer', cursive", color: "#7c3aed", textShadow: "0 0 20px rgba(124,58,237,0.8), 0 0 40px rgba(124,58,237,0.4)", fontSize: "2.5rem", fontWeight: "400", animation: "corruptedPulse 2s ease-in-out infinite" },
          neutral: { fontFamily: "'Crimson Text', Georgia, serif", color: "#e0e0e0", textShadow: "0 2px 4px rgba(0,0,0,0.6)", fontSize: "2.5rem", fontWeight: "600" },
          cave: { fontFamily: "'Pirata One', cursive", color: "#78716c", textShadow: "0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(120,113,108,0.3)", fontSize: "2.5rem", fontWeight: "400" },
          holy: { fontFamily: "'Cinzel', serif", color: "#fef3c7", textShadow: "0 0 20px rgba(254,243,199,0.8), 0 0 40px rgba(254,243,199,0.5)", fontSize: "2.5rem", fontWeight: "700" },
          slave_district: { fontFamily: "'Creepster', cursive", color: "#f43f5e", textShadow: "0 0 10px rgba(244,63,94,0.6), 0 0 25px rgba(244,63,94,0.3)", fontSize: "2.5rem", fontWeight: "400" },
          drug_den: { fontFamily: "'Nosifer', cursive", color: "#ec4899", textShadow: "0 0 15px rgba(236,72,153,0.7), 0 0 30px rgba(236,72,153,0.4)", fontSize: "2.5rem", fontWeight: "400", animation: "drugPulse 3s ease-in-out infinite" }
        },
        defaultFont: "neutral",
        tagMappings: {
          safe: "friendly_town", town: "friendly_town", village: "friendly_town", inn: "friendly_town",
          dangerous: "hostile_area", hostile: "hostile_area",
          forest: "hostile_forest", woods: "hostile_forest",
          dungeon: "dungeon", cave: "cave", mine: "cave",
          magic: "mystical", arcane: "mystical",
          corrupted: "corrupted", demon: "corrupted",
          temple: "holy", shrine: "holy", church: "holy",
          slave: "slave_district", auction: "slave_district",
          drugs: "drug_den", addiction: "drug_den"
        }
      };

      // Initialize with GameData locations and regions
      const regionsData = [
        { id: "crossroads", name: "Crossroads Region", type: "region", locked: false, initiallyUnlocked: true, mapData: { worldMapPosition: { x: 250, y: 300 } }, neighborRegions: ["darkwood"] },
        { id: "darkwood", name: "Darkwood Forest", type: "region", locked: true, unlockRequirements: { type: "or", conditions: [{ type: "visited_location", location: "forest_edge" }] }, mapData: { worldMapPosition: { x: 400, y: 250 } }, neighborRegions: ["crossroads"] }
      ];

      locationSystemRef.current.initialize(GameData.locations, regionsData, locationFontData);

      // Initialize reputation and rumor systems
      reputationSystemRef.current = new ReputationSystem(fameSystemRef.current);
      reputationSystemRef.current.initialize(GameData.locations);
      rumorSystemRef.current = new RumorSystem(reputationSystemRef.current);

      // Initialize location services (church, clinic, nursery)
      locationServicesRef.current = new LocationServices();
      // Service definitions will be loaded from datapacks in production
      const serviceDefinitions = {
        church: {
          curseRemovalCost: 100,
          hypnosisRemovalCost: 150,
          purificationCostPerPoint: 5,
          debuffRemovalCost: 75,
          charityWorkHours: 4,
          creditPerHour: 25,
          maxPurificationPerVisit: 30
        },
        clinic: {
          stdTreatmentCost: 200,
          addictionTreatmentCost: 500,
          addictionTreatmentHours: 24,
          behavioralTherapyCost: 300,
          therapySessions: 3,
          neuralDeprogrammingCost: 400,
          conditioningRemovalCost: 250,
          terminationCost: 350,
          terminationRecoveryHours: 8,
          checkupCost: 50,
          healingCostPerHp: 2
        },
        nursery: {
          eggLayingCost: 100,
          birthCost: 200,
          checkupCost: 30,
          postpartumCareCost: 150,
          consultationCost: 25,
          recoveryBonus: 2.0
        }
      };
      locationServicesRef.current.initialize(serviceDefinitions);

      // Initialize location discovery, public event, and barring systems
      discoverySystemRef.current = new LocationDiscoverySystem();
      barringSystemRef.current = new LocationBarringSystem();
      publicEventSystemRef.current = new PublicEventSystem(
        reputationSystemRef.current,
        rumorSystemRef.current,
        discoverySystemRef.current
      );

      // Initialize time system for day/night cycle
      timeSystemRef.current = new TimeSystem();

      // Initialize expedition system for region-to-region travel
      expeditionSystemRef.current = new ExpeditionSystem({
        gameTimeProvider: () => ({
          currentDay: player?.currentTime?.day || 1,
          currentHour: player?.currentTime?.hour || 12,
          isNight: timeSystemRef.current?.isNight(player?.currentTime?.hour || 12) || false
        }),
        getRegion: (regionId) => locationSystemRef.current?.getRegion(regionId),
        encounterTables: {}  // Will be loaded from datapacks
      });

      // Initialize lodging system for inn rooms and rental properties
      lodgingSystemRef.current = new LodgingSystem(timeSystemRef.current);
      // Lodging data will be loaded from datapacks in production
      const lodgingData = {
        innRooms: {
          weary_traveler_standard: {
            id: 'weary_traveler_standard',
            locationId: 'starting_inn',
            name: 'Standard Room',
            pricePerNight: 10,
            quality: 'standard',
            maxDays: 7,
            bonuses: {}
          },
          weary_traveler_deluxe: {
            id: 'weary_traveler_deluxe',
            locationId: 'starting_inn',
            name: 'Deluxe Room',
            pricePerNight: 25,
            quality: 'deluxe',
            maxDays: 14,
            bonuses: { restQuality: 1.2 }
          }
        },
        rentedProperties: {}
      };
      lodgingSystemRef.current.initialize(lodgingData);

      // Initialize input validation system for scene inputs
      inputValidationSystemRef.current = new InputValidationSystem();

      // Initialize action requirement system for sleep/rest checks
      actionRequirementSystemRef.current = new ActionRequirementSystem(lodgingSystemRef.current);

      // Initialize merchant data from GameData merchants
      // Since we don't have full DataRegistry integration, we'll manually populate merchants
      const merchantData = [
        {
          id: 'innkeeper_mary',
          name: 'Mary the Innkeeper',
          locationId: 'starting_inn',
          gold: 500, // How much gold merchant has to buy items from player
          dialogue: {
            greeting: "Welcome to the Weary Traveler! What can I get for you?",
            cannotBuy: "I don't have much use for that, I'm afraid.",
            farewell: "Safe travels, dear!"
          },
          buyConfig: {
            acceptedTags: ['food', 'drink', 'consumable'],
            rejectedTags: ['weapon', 'armor', 'cursed'],
            buyPriceMultiplier: 0.3
          },
          sellConfig: {
            mode: 'static',
            sellPriceMultiplier: 1.1
          }
        },
        {
          id: 'merchant_joe',
          name: 'Merchant Joe',
          locationId: 'town_square',
          gold: 2000, // General merchant has more gold
          dialogue: {
            greeting: "Looking to buy or sell? You've come to the right place!",
            cannotBuy: "Sorry, I only deal in general goods.",
            farewell: "Come back anytime!"
          },
          buyConfig: {
            acceptedTags: ['misc', 'material', 'trinket', 'tool'],
            rejectedTags: ['cursed', 'illegal'],
            buyPriceMultiplier: 0.4
          },
          sellConfig: {
            mode: 'static',
            sellPriceMultiplier: 1.0
          }
        }
      ];

      // Populate merchant cache
      merchantData.forEach(m => {
        merchantSystemRef.current.merchantCache.set(m.id, m);
      });

      systemsInitializedRef.current = true;
      console.log('[Game] Engine systems initialized');
    }
  }, []);

  // Auto-save timer
  const playTimeRef = useRef(0);
  const lastAutosaveRef = useRef(0);
  
  useEffect(() => {
    let interval;
    if (screen === 'game' || screen === 'combat') {
      interval = setInterval(() => {
        playTimeRef.current += 1;
        setGameState(prev => ({ ...prev, playTime: playTimeRef.current }));
        
        // Autosave every 5 minutes (300 seconds)
        if (playTimeRef.current - lastAutosaveRef.current >= 300) {
          lastAutosaveRef.current = playTimeRef.current;
          if (player.id) {
            const success = SaveSystem.save('auto', player, gameState);
            if (success) {
              toast.autosave();
            }
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [screen, player, gameState, toast]);
  
  // Achievement unlock function
  const unlockAchievement = useCallback((achievementId) => {
    if (!player.unlockedAchievements.includes(achievementId)) {
      const achievement = GameData.achievements[achievementId];
      if (!achievement) return false;
      
      setPlayer(prev => ({
        ...prev,
        unlockedAchievements: [...prev.unlockedAchievements, achievementId]
      }));
      
      // Show toast notification
      const rarityStyle = GameData.achievementRarities[achievement.rarity];
      toast.add({
        type: 'quest',
        title: '🏆 Achievement Unlocked!',
        message: achievement.hidden && achievement.revealedName 
          ? achievement.revealedName 
          : achievement.name,
        icon: achievement.icon,
        duration: achievement.rarity === 'mythic' || achievement.rarity === 'divine' ? 8000 : 5000,
        rarity: achievement.rarity
      });
      
      return true;
    }
    return false;
  }, [player.unlockedAchievements, toast]);
  
  // Update achievement progress
  const updateAchievementProgress = useCallback((achievementId, amount = 1) => {
    const achievement = GameData.achievements[achievementId];
    if (!achievement || !achievement.progress) return;
    if (player.unlockedAchievements.includes(achievementId)) return;
    
    setPlayer(prev => {
      const currentProgress = prev.achievementProgress[achievementId] || { ...achievement.progress };
      const newCurrent = Math.min(currentProgress.current + amount, currentProgress.target);
      
      const newProgress = {
        ...prev.achievementProgress,
        [achievementId]: { ...currentProgress, current: newCurrent }
      };
      
      // Check if achievement completed
      if (newCurrent >= currentProgress.target) {
        // Will be unlocked in next render cycle
        setTimeout(() => unlockAchievement(achievementId), 100);
      }
      
      return { ...prev, achievementProgress: newProgress };
    });
  }, [player.unlockedAchievements, player.achievementProgress, unlockAchievement]);
  
  // Check for level-based achievements
  useEffect(() => {
    if (!player.id) return;
    
    if (player.level >= 5 && !player.unlockedAchievements.includes('level_5')) {
      unlockAchievement('level_5');
    }
    if (player.level >= 10 && !player.unlockedAchievements.includes('level_10')) {
      unlockAchievement('level_10');
    }
    if (player.level >= 25 && !player.unlockedAchievements.includes('level_25')) {
      unlockAchievement('level_25');
    }
    if (player.level >= 50 && !player.unlockedAchievements.includes('level_50')) {
      unlockAchievement('level_50');
    }
  }, [player.level, player.id, player.unlockedAchievements, unlockAchievement]);
  
  // Check for corruption achievements
  useEffect(() => {
    if (!player.id) return;
    
    if (player.nsfwStats.corruption >= 10 && !player.unlockedAchievements.includes('corruption_10')) {
      unlockAchievement('corruption_10');
    }
    if (player.nsfwStats.corruption >= 50 && !player.unlockedAchievements.includes('corruption_50')) {
      unlockAchievement('corruption_50');
    }
    if (player.nsfwStats.corruption >= 100 && !player.unlockedAchievements.includes('corruption_100')) {
      unlockAchievement('corruption_100');
    }
  }, [player.nsfwStats?.corruption, player.id, player.unlockedAchievements, unlockAchievement]);
  
  // Check for gold achievement
  useEffect(() => {
    if (!player.id) return;
    
    if (player.gold >= 10000 && !player.unlockedAchievements.includes('golden_touch')) {
      unlockAchievement('golden_touch');
    }
  }, [player.gold, player.id, player.unlockedAchievements, unlockAchievement]);
  
  // Character selection handler
  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
    setShowDifficultyModal(true);
  };
  
  // Difficulty selection handler
  const handleDifficultySelect = (difficultyId) => {
    setSelectedDifficulty(difficultyId);
    setShowDifficultyModal(false);
    setScreen('nsfwStats');
  };
  
  // NSFW config handler
  const handleNSFWConfig = (config) => {
    setNsfwConfig(config);
    setScreen('fetishPrefs');
  };
  
  // Fetish preferences handler
  const handleFetishPrefs = (tags) => {
    setEnabledTags(tags);
    setScreen('statDistribution');
  };
  
  // Final stats handler
  const handleStatsComplete = (finalStats) => {
    // Create full player state
    const newPlayer = {
      ...defaultPlayerState,
      id: generateId(),
      characterId: selectedCharacter.id,
      name: selectedCharacter.name,
      stats: finalStats,
      maxHp: 50 + finalStats.vitality * 10,
      currentHp: 50 + finalStats.vitality * 10,
      maxStamina: 50 + finalStats.stamina * 5,
      currentStamina: 50 + finalStats.stamina * 5,
      maxMana: 20 + finalStats.intelligence * 5,
      currentMana: 20 + finalStats.intelligence * 5,
      nsfwStats: {
        ...defaultPlayerState.nsfwStats,
        sensitiveAreas: nsfwConfig.sensitiveAreas
      },
      modifiers: nsfwConfig.modifiers,
      modifierEffects: nsfwConfig.modifiers.reduce((acc, modId) => {
        const mod = GameData.challengeModifiers.find(m => m.id === modId);
        return mod ? { ...acc, ...mod.effect } : acc;
      }, {})
    };
    
    setPlayer(newPlayer);
    setGameState(prev => ({
      ...prev,
      difficulty: selectedDifficulty,
      enabledTags: enabledTags,
      disabledTags: GameData.fetishTags.filter(t => !enabledTags.includes(t.id)).map(t => t.id)
    }));
    
    setScreen('introChoice');
  };
  
  // Intro choice handler
  const handleIntroChoice = (choice) => {
    if (choice === 'skip') {
      setScreen('game');
    } else {
      const sceneId = choice === 'full' ? 'intro_full' : 'intro_short';
      setCurrentScene(GameData.scenes[sceneId]);
      setScreen('dialogue');
    }
  };
  
  // Scene complete handler
  const handleSceneComplete = (outcome) => {
    // Advance time based on scene type or custom timeCost
    if (currentScene) {
      const sceneType = currentScene.type || 'event';
      advanceTime(`scene_${sceneType}`, currentScene);
    }

    setCurrentScene(null);
    setScreen('game');

    // Auto-save
    SaveSystem.save('auto', player, gameState);
  };

  // Scene action handler - processes actions from scene nodes
  const handleSceneAction = useCallback((action) => {
    if (!action || !action.type) return;

    switch (action.type) {
      case 'rentRoom':
        if (lodgingSystemRef.current) {
          const result = lodgingSystemRef.current.rentRoom(player, action.roomId, action.days || 1);
          if (result.success) {
            setPlayer(prev => ({
              ...prev,
              gold: prev.gold - result.cost,
              lodging: result.updatedLodging
            }));
            toast.success('Room Rented', `Rented for ${action.days || 1} night(s). Cost: ${result.cost}g`);
          } else {
            toast.error('Rental Failed', result.error);
          }
        }
        break;

      case 'extendStay':
        if (lodgingSystemRef.current) {
          const result = lodgingSystemRef.current.extendStay(player, action.roomId, action.days || 1);
          if (result.success) {
            setPlayer(prev => ({
              ...prev,
              gold: prev.gold - result.cost,
              lodging: result.updatedLodging
            }));
            toast.success('Stay Extended', `Extended by ${action.days || 1} night(s). Cost: ${result.cost}g`);
          } else {
            toast.error('Extension Failed', result.error);
          }
        }
        break;

      case 'rentProperty':
        if (lodgingSystemRef.current) {
          const result = lodgingSystemRef.current.rentProperty(player, action.propertyId);
          if (result.success) {
            setPlayer(prev => ({
              ...prev,
              gold: prev.gold - result.totalCost,
              lodging: result.updatedLodging
            }));
            toast.success('Property Rented', `First payment: ${result.totalCost}g`);
          } else {
            toast.error('Rental Failed', result.error);
          }
        }
        break;

      case 'makeRentPayment':
        if (lodgingSystemRef.current) {
          const result = lodgingSystemRef.current.makeRentPayment(player, action.propertyId);
          if (result.success) {
            setPlayer(prev => ({
              ...prev,
              gold: prev.gold - result.amount,
              lodging: result.updatedLodging
            }));
            toast.success('Rent Paid', `Paid ${result.amount}g`);
          } else {
            toast.error('Payment Failed', result.error);
          }
        }
        break;

      case 'cancelRental':
        if (lodgingSystemRef.current) {
          const result = lodgingSystemRef.current.cancelRental(player, action.propertyId);
          if (result.success) {
            setPlayer(prev => ({
              ...prev,
              lodging: result.updatedLodging
            }));
            toast.info('Rental Cancelled', 'You have cancelled your rental.');
          }
        }
        break;

      case 'giveGold':
        const amount = typeof action.amount === 'string'
          ? parseInt(action.amount.replace('-', ''), 10) * (action.amount.startsWith('-') ? -1 : 1)
          : action.amount;
        setPlayer(prev => ({ ...prev, gold: Math.max(0, prev.gold + amount) }));
        break;

      case 'modifyRelationship':
        // TODO: Implement relationship system
        break;

      case 'setFlag':
        setGameState(prev => ({
          ...prev,
          flags: { ...prev.flags, [action.flag]: action.value !== undefined ? action.value : true }
        }));
        break;

      case 'giveItem':
        // TODO: Integrate with inventory system
        break;

      default:
        console.warn('Unknown scene action type:', action.type);
    }
  }, [player, lodgingSystemRef]);

  // Location action handler
  const handleLocationAction = (action, param) => {
    switch (action) {
      case 'travel':
        setTravelDestination(param);
        setShowTravelModal(true);
        break;

      case 'move':
        // Open travel modal without a preset destination
        setTravelDestination(null);
        setShowTravelModal(true);
        break;

      case 'explore':
      case 'search':
        // Advance time for exploration/search
        advanceTime(action === 'explore' ? 'explore' : 'search');

        // Check for random encounter (with night modifier)
        const location = GameData.locations.find(l => l.id === player.currentLocation);
        const nightMod = getNightEncounterModifier();
        const encounter = CombatSystem.generateEncounter(location, player.level, gameState.difficulty, nightMod);

        if (encounter) {
          toast.combat(`${encounter.length} ${encounter.length === 1 ? 'enemy' : 'enemies'} appeared!`);
          setCombatEnemies(encounter);
          setScreen('combat');
        } else {
          // Random exploration reward
          const goldFound = rollDice(20) + 5;
          setPlayer(prev => ({ ...prev, gold: prev.gold + goldFound }));
          toast.gold(goldFound, `Found while ${action === 'explore' ? 'exploring' : 'searching'}`);
        }
        break;

      case 'rest':
        // Advance time for resting
        advanceTime('rest');

        setPlayer(prev => ({
          ...prev,
          currentHp: prev.maxHp,
          currentStamina: prev.maxStamina,
          currentMana: prev.maxMana
        }));
        const restSaveSuccess = SaveSystem.save('auto', player, gameState);
        toast.heal(player.maxHp - player.currentHp, 'Rest');
        toast.info('Rested', 'Fully recovered HP, Stamina, and Mana');
        if (restSaveSuccess) {
          toast.autosave();
        }
        break;
        
      case 'interact':
        // Advance time for NPC interaction
        advanceTime('npc_interaction');

        // Check for rumor confrontation with NPCs at location
        if (rumorSystemRef.current && player.rumors && player.rumors.length > 0) {
          // Get NPCs at current location
          const currentLoc = GameData.locations.find(l => l.id === player.currentLocation);
          const npcsAtLocation = currentLoc?.npcs || [];

          // Find first NPC that might mention a rumor
          for (const npcId of npcsAtLocation) {
            // Get NPC data (try merchant cache first, then generic NPC)
            const npc = merchantSystemRef.current?.merchantCache.get(npcId) || { id: npcId, name: npcId, rumorAwareness: 0.5 };

            // Check if this NPC should mention a rumor
            const rumor = rumorSystemRef.current.shouldMentionRumor(player, npc, player.currentLocation);
            if (rumor) {
              // Show rumor confrontation
              const dialogue = rumorSystemRef.current.getRumorDialogue(rumor, npc);
              const options = rumorSystemRef.current.getRumorResponseOptions(player, rumor, npc);
              const canSkip = rumor.acknowledged && rumor.mentionCount >= 2;

              setRumorConfrontationData({
                npc,
                rumor,
                dialogue,
                options,
                canSkip
              });
              setShowRumorConfrontation(true);
              return; // Stop here - rumor confrontation takes priority
            }
          }
        }

        toast.info('NPCs', 'NPC interaction coming soon...');
        break;
        
      case 'shop':
        // Find merchants at current location
        if (merchantSystemRef.current) {
          const merchants = merchantSystemRef.current.getMerchantsAtLocation(player.currentLocation);
          if (merchants.length > 0) {
            // For now, open the first merchant found
            const merchant = merchants[0];
            setActiveMerchant(merchant);

            // Generate some sample merchant stock
            const sampleStock = [
              {
                uniqueId: 'shop_health_potion_1',
                id: 'health_potion',
                name: 'Health Potion',
                description: 'Restores 50 HP when consumed.',
                basePrice: 25,
                rarity: 'common',
                rarityColor: '#9ca3af',
                tags: ['consumable', 'healing'],
                quantity: 5,
                category: 'consumable',
                canSell: true
              },
              {
                uniqueId: 'shop_bread_1',
                id: 'bread',
                name: 'Fresh Bread',
                description: 'A warm loaf of bread. Restores 10 HP.',
                basePrice: 5,
                rarity: 'common',
                rarityColor: '#9ca3af',
                tags: ['food', 'consumable'],
                quantity: 10,
                category: 'consumable',
                canSell: true
              },
              {
                uniqueId: 'shop_ale_1',
                id: 'ale',
                name: 'Hearty Ale',
                description: 'Strong ale that warms the spirit.',
                basePrice: 8,
                rarity: 'common',
                rarityColor: '#9ca3af',
                tags: ['drink', 'consumable'],
                quantity: 8,
                category: 'consumable',
                canSell: true
              }
            ];
            setMerchantStock(sampleStock);
            setShowMerchantView(true);
          } else {
            toast.info('No Shop', 'There are no merchants here.');
          }
        } else {
          toast.info('Shop', 'Shop system not available.');
        }
        break;
    }
  };
  
  // Merchant transaction handler
  const handleMerchantTransaction = useCallback((type, result) => {
    // Handle different transaction types
    if (type === 'buy' && result.success) {
      // Deduct gold and add item to inventory
      setPlayer(prev => ({
        ...prev,
        gold: (prev.gold || 0) - result.price,
        inventory: [...(prev.inventory || []), result.item]
      }));
      // Remove from merchant stock
      setMerchantStock(prev => prev.filter(item => item.uniqueId !== result.item.uniqueId));
    } else if (type === 'sell' && result.success) {
      // Add gold and remove item from inventory
      setPlayer(prev => ({
        ...prev,
        gold: (prev.gold || 0) + result.price,
        inventory: (prev.inventory || []).filter(item => item.uniqueId !== result.item.uniqueId)
      }));
    } else if (type === 'autoSellJunk' && result.soldCount > 0) {
      // Update player after auto-selling junk
      setPlayer(prev => ({
        ...prev,
        gold: (prev.gold || 0) + result.totalGold,
        inventory: (prev.inventory || []).filter(item => !result.soldItems?.includes(item.uniqueId))
      }));
    } else if (type === 'flagChange') {
      // Force re-render after toggling favorite/junk
      setPlayer(prev => ({ ...prev }));
    }
  }, []);

  // Close merchant view
  const handleCloseMerchant = useCallback(() => {
    setShowMerchantView(false);
    setActiveMerchant(null);
    setMerchantStock([]);
  }, []);

  // Handle travel from the new TravelModal
  const handleTravel = useCallback((destinationId) => {
    if (!locationSystemRef.current) return;

    const location = locationSystemRef.current.getLocation(destinationId);
    if (!location) return;

    // Check if location is unlocked
    const unlockStatus = unlockSystemRef.current.checkLocationUnlock(location, player, gameState);
    if (!unlockStatus.unlocked) {
      // Close the travel modal first
      setShowTravelModal(false);

      // Check if location has a custom "requirements not met" scene
      if (location.requirementNotMetScene) {
        // Find and run the custom scene
        const scene = GameData.scenes?.find(s => s.id === location.requirementNotMetScene);
        if (scene) {
          // Set context for the scene with requirement info
          setSceneContext({
            locationId: destinationId,
            locationName: location.name,
            unmetRequirements: unlockStatus.unmetRequirements,
            requirementsDescription: unlockSystemRef.current.getRequirementsDescription(location, player)
          });
          setCurrentScene(scene);
          setScreen('scene');
          return;
        }
      }

      // Default behavior: show a generic "requirements not met" message
      // Build a helpful message about what's needed
      const requirementText = unlockStatus.unmetRequirements[0] || 'Requirements not met';
      toast.warning('Cannot enter ' + location.name, requirementText);
      return;
    }

    // Check for encounter during travel (with night modifier)
    if (location.encounterChance > 0) {
      const travelNightMod = getNightEncounterModifier();
      const encounter = CombatSystem.generateEncounter(location, player.level, gameState.difficulty, travelNightMod);
      if (encounter) {
        toast.combat(`Ambushed by ${encounter.length} ${encounter.length === 1 ? 'enemy' : 'enemies'}!`);
        setCombatEnemies(encounter);
        setShowTravelModal(false);
        setScreen('combat');
        return;
      }
    }

    // Advance time for local travel
    advanceTime('local_travel');

    // Check if first visit
    const isFirstVisit = !player.visitedLocations.includes(destinationId);

    // Check for first_steps achievement (leaving starting inn)
    if (player.currentLocation === 'starting_inn' && destinationId !== 'starting_inn') {
      unlockAchievement('first_steps');
    }

    // Check for deep_delver achievement
    if (destinationId === 'deep_forest') {
      unlockAchievement('deep_delver');
    }

    // Get region for the new location
    const newRegion = location.parentRegion || player.currentRegion;

    // Move to location
    setPlayer(prev => ({
      ...prev,
      currentLocation: destinationId,
      currentRegion: newRegion,
      visitedLocations: prev.visitedLocations.includes(destinationId)
        ? prev.visitedLocations
        : [...prev.visitedLocations, destinationId],
      visitedRegions: prev.visitedRegions.includes(newRegion)
        ? prev.visitedRegions
        : [...prev.visitedRegions, newRegion],
      unlockedLocations: prev.unlockedLocations.includes(destinationId)
        ? prev.unlockedLocations
        : [...prev.unlockedLocations, destinationId]
    }));

    // Show location title when traveling
    if (location) {
      const titleData = locationSystemRef.current.getTitleDisplayData(location, player);
      setLocationTitleData(titleData);
      setShowLocationTitle(true);

      // Show discovery toast only on first visit
      if (isFirstVisit) {
        toast.quest(`Discovered: ${location.name}`, 'New area unlocked!');
      }
    }

    // Check for cartographer achievement (all locations visited)
    const newVisited = player.visitedLocations.includes(destinationId)
      ? player.visitedLocations
      : [...player.visitedLocations, destinationId];
    if (newVisited.length >= GameData.locations.length) {
      unlockAchievement('cartographer');
    }

    // Record visit for local reputation system
    if (reputationSystemRef.current) {
      reputationSystemRef.current.recordVisit(player, destinationId);
    }

    setShowTravelModal(false);
  }, [player, gameState, toast, unlockAchievement]);

  // Legacy travel confirmation (for backwards compatibility)
  const handleTravelConfirm = () => {
    if (travelDestination) {
      handleTravel(travelDestination);
      setTravelDestination(null);
    }
  };

  // Handle NPC interaction from location screen
  const handleInteractWithNpc = useCallback((npcId) => {
    // Try to find NPC data
    const npcData = GameData.npcs?.find(n => n.id === npcId);

    // Format NPC name for display
    const npcName = npcData?.name || npcId.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    // Check if NPC has a dialogue scene
    if (npcData?.dialogueScene) {
      const scene = GameData.scenes?.find(s => s.id === npcData.dialogueScene);
      if (scene) {
        setSceneContext({ npcId, npcData });
        setCurrentScene(scene);
        setScreen('scene');
        return;
      }
    }

    // Check if NPC has a shop
    if (npcData?.shopId || npcData?.merchantId) {
      const merchantId = npcData.merchantId || npcData.shopId;
      const merchants = merchantSystemRef.current?.getMerchantsAtLocation(player.currentLocation);
      const merchant = merchants?.find(m => m.id === merchantId) || merchants?.[0];

      if (merchant) {
        const stock = merchantSystemRef.current.getStock(merchant.id, player.currentTime?.day || 1);
        setActiveMerchant(merchant);
        setMerchantStock(stock);
        setShowMerchantView(true);
        return;
      }
    }

    // Check for rumor confrontation
    if (rumorSystemRef.current) {
      const rumor = rumorSystemRef.current.shouldMentionRumor(player, npcData || { id: npcId, name: npcName }, player.currentLocation);
      if (rumor) {
        setRumorConfrontationData({
          npc: npcData || { id: npcId, name: npcName },
          rumor,
          dialogue: rumorSystemRef.current.generateConfrontationDialogue(rumor, npcData || { id: npcId, name: npcName }),
          options: rumorSystemRef.current.getResponseOptions(rumor, player),
          canSkip: true
        });
        setShowRumorConfrontation(true);
        return;
      }
    }

    // Default: show a toast indicating NPC interaction
    toast.info(`Talking to ${npcName}`, 'NPC dialogue system coming soon...');
  }, [player, toast]);

  // ============================================================================
  // EXPEDITION HANDLERS (Region-to-Region Travel)
  // ============================================================================

  // Handle travel to a different region (triggers expedition)
  const handleTravelToRegion = useCallback((regionId, regionData) => {
    if (!expeditionSystemRef.current || !locationSystemRef.current) return;

    // Check if region is unlocked
    const unlockStatus = regionData?.unlockStatus;
    if (!unlockStatus?.unlocked) {
      toast.warning('Cannot travel to ' + (regionData?.name || regionId), 'Region is locked');
      return;
    }

    // Start expedition
    const expedition = expeditionSystemRef.current.startExpedition(
      player.currentRegion,
      regionId,
      player
    );

    if (!expedition) {
      toast.error('Cannot start expedition', 'No route available');
      return;
    }

    // Set expedition state and show expedition screen
    setCurrentExpedition(expedition);
    setShowExpedition(true);
    setShowTravelModal(false);
    toast.info(`Expedition to ${expedition.toRegionName}`, `Distance: ${expedition.totalDistance} miles`);
  }, [player, toast]);

  // Handle expedition progress action
  const handleExpeditionProgress = useCallback(() => {
    if (!currentExpedition || !expeditionSystemRef.current) return null;

    const result = expeditionSystemRef.current.progress(currentExpedition, player);

    // Update expedition state
    setCurrentExpedition({ ...currentExpedition });

    // Update game time
    setPlayer(prev => ({
      ...prev,
      currentTime: {
        ...prev.currentTime,
        hour: ((prev.currentTime?.hour || 0) + result.hoursElapsed) % 24,
        day: (prev.currentTime?.day || 1) + Math.floor(((prev.currentTime?.hour || 0) + result.hoursElapsed) / 24)
      }
    }));

    return result;
  }, [currentExpedition, player]);

  // Handle expedition rest action
  const handleExpeditionRest = useCallback(() => {
    if (!currentExpedition || !expeditionSystemRef.current) return null;

    const result = expeditionSystemRef.current.rest(currentExpedition, player);

    // Update expedition state
    setCurrentExpedition({ ...currentExpedition });

    // Update game time
    setPlayer(prev => ({
      ...prev,
      currentTime: {
        ...prev.currentTime,
        hour: ((prev.currentTime?.hour || 0) + result.hoursElapsed) % 24,
        day: (prev.currentTime?.day || 1) + Math.floor(((prev.currentTime?.hour || 0) + result.hoursElapsed) / 24)
      }
    }));

    return result;
  }, [currentExpedition, player]);

  // Handle expedition scavenge action
  const handleExpeditionScavenge = useCallback(() => {
    if (!currentExpedition || !expeditionSystemRef.current) return null;

    const result = expeditionSystemRef.current.scavenge(currentExpedition, player);

    // Update expedition state
    setCurrentExpedition({ ...currentExpedition });

    // Add found items to inventory
    if (result.items?.length > 0 && inventorySystemRef.current) {
      result.items.forEach(item => {
        // Add items to player inventory
        toast.success(`Found: ${item.name}`, `x${item.count}`);
      });
    }

    // Update game time
    setPlayer(prev => ({
      ...prev,
      currentTime: {
        ...prev.currentTime,
        hour: ((prev.currentTime?.hour || 0) + result.hoursElapsed) % 24,
        day: (prev.currentTime?.day || 1) + Math.floor(((prev.currentTime?.hour || 0) + result.hoursElapsed) / 24)
      }
    }));

    return result;
  }, [currentExpedition, player, toast]);

  // Handle setting up camp
  const handleSetCamp = useCallback((campType) => {
    if (!currentExpedition || !expeditionSystemRef.current) return;

    expeditionSystemRef.current.setCamp(currentExpedition, campType);
    setCurrentExpedition({ ...currentExpedition });
  }, [currentExpedition]);

  // Handle toggling torch
  const handleToggleTorch = useCallback((lit) => {
    if (!currentExpedition || !expeditionSystemRef.current) return;

    expeditionSystemRef.current.toggleTorch(currentExpedition, lit);
    setCurrentExpedition({ ...currentExpedition });
  }, [currentExpedition]);

  // Handle expedition completion
  const handleExpeditionComplete = useCallback(() => {
    if (!currentExpedition) return;

    // Move player to new region
    const destinationRegion = currentExpedition.toRegion;
    const regionData = locationSystemRef.current?.getRegion(destinationRegion);

    // Get first location in the region
    const firstLocation = regionData?.childLocations?.[0] || destinationRegion;

    setPlayer(prev => ({
      ...prev,
      currentRegion: destinationRegion,
      currentLocation: firstLocation,
      visitedRegions: prev.visitedRegions?.includes(destinationRegion)
        ? prev.visitedRegions
        : [...(prev.visitedRegions || []), destinationRegion],
      expedition: {
        ...prev.expedition,
        current: null,
        stats: {
          ...prev.expedition?.stats,
          totalDistance: (prev.expedition?.stats?.totalDistance || 0) + currentExpedition.totalDistance,
          totalExpeditions: (prev.expedition?.stats?.totalExpeditions || 0) + 1,
          completedExpeditions: (prev.expedition?.stats?.completedExpeditions || 0) + 1,
          totalHoursOnRoad: (prev.expedition?.stats?.totalHoursOnRoad || 0) + currentExpedition.hoursElapsed,
          locationsDiscovered: (prev.expedition?.stats?.locationsDiscovered || 0) + currentExpedition.discoveries.length
        },
        history: [
          ...(prev.expedition?.history || []),
          {
            fromRegion: currentExpedition.fromRegion,
            toRegion: currentExpedition.toRegion,
            totalDistance: currentExpedition.totalDistance,
            hoursElapsed: currentExpedition.hoursElapsed,
            encounters: currentExpedition.encounters?.length || 0,
            discoveries: currentExpedition.discoveries,
            completed: true
          }
        ]
      }
    }));

    // Show arrival title
    if (regionData) {
      const titleData = locationSystemRef.current.getTitleDisplayData(regionData, player);
      setLocationTitleData(titleData);
      setShowLocationTitle(true);
    }

    toast.success(`Arrived at ${currentExpedition.toRegionName}!`, 'Expedition complete');
    setCurrentExpedition(null);
    setShowExpedition(false);
  }, [currentExpedition, player, toast]);

  // Handle expedition encounter
  const handleExpeditionEncounter = useCallback((encounter) => {
    if (!encounter) return;

    // Generate combat enemies
    const enemies = CombatSystem.generateEnemiesFromIds(encounter.enemies, player.level, gameState.difficulty);
    if (enemies && enemies.length > 0) {
      setCombatEnemies(enemies);
      setShowExpedition(false);
      setScreen('combat');
    }
  }, [player, gameState]);

  // Handle abandoning expedition
  const handleExpeditionCancel = useCallback(() => {
    if (!currentExpedition) return;

    // Update stats for abandoned expedition
    setPlayer(prev => ({
      ...prev,
      expedition: {
        ...prev.expedition,
        current: null,
        stats: {
          ...prev.expedition?.stats,
          abandonedExpeditions: (prev.expedition?.stats?.abandonedExpeditions || 0) + 1
        }
      }
    }));

    toast.warning('Expedition abandoned', 'Returning to starting region');
    setCurrentExpedition(null);
    setShowExpedition(false);
  }, [currentExpedition, toast]);

  // ============================================================================
  // TIME SYSTEM HANDLERS
  // ============================================================================

  /**
   * Advance game time based on action type
   * @param {string} actionType - Type of action from DEFAULT_TIME_COSTS
   * @param {Object} sceneOverride - Optional scene with custom timeCost
   * @returns {Object} Time advancement result
   */
  const advanceTime = useCallback((actionType, sceneOverride = null) => {
    if (!timeSystemRef.current) return null;

    const result = timeSystemRef.current.processAction(
      player.currentTime || { day: 1, hour: 8, minute: 0 },
      actionType,
      sceneOverride
    );

    // Update player state with new time
    setPlayer(prev => {
      const newTimeStats = { ...prev.timeStats };

      // Update time tracking stats
      if (result.dayChanged) {
        newTimeStats.totalDaysPlayed = (newTimeStats.totalDaysPlayed || 0) + result.daysAdvanced;
      }

      // Track time by activity category
      const activityCategory = getActivityCategory(actionType);
      if (activityCategory && newTimeStats.timeSpentByActivity) {
        newTimeStats.timeSpentByActivity[activityCategory] =
          (newTimeStats.timeSpentByActivity[activityCategory] || 0) + result.timeCost;
      }

      // Track period changes
      if (result.periodChanged && newTimeStats.periodsExperienced) {
        const periodKey = result.period.name.toLowerCase();
        newTimeStats.periodsExperienced[periodKey] =
          (newTimeStats.periodsExperienced[periodKey] || 0) + 1;
      }

      return {
        ...prev,
        currentTime: result.newTime,
        timeStats: newTimeStats
      };
    });

    // Notify if period changed
    if (result.becameNight) {
      toast.info('Night Falls', 'Encounter chances increase in the darkness.');
    } else if (result.becameDay) {
      toast.info('Dawn Breaks', 'A new day begins.');
    }

    return result;
  }, [player.currentTime, toast]);

  /**
   * Get activity category for time tracking
   */
  const getActivityCategory = (actionType) => {
    if (actionType.includes('combat')) return 'combat';
    if (actionType.includes('dialogue') || actionType.includes('npc') || actionType.includes('merchant')) return 'dialogue';
    if (actionType.includes('travel') || actionType.includes('region')) return 'travel';
    if (actionType.includes('search') || actionType.includes('explore') || actionType.includes('scavenge')) return 'exploration';
    if (actionType.includes('rest') || actionType.includes('sleep')) return 'rest';
    if (actionType.includes('sex') || actionType.includes('nsfw')) return 'nsfw';
    return 'other';
  };

  /**
   * Handle player sleeping
   * @param {string} sleepType - 'night' or 'morning'
   */
  const handleSleep = useCallback((sleepType) => {
    if (!timeSystemRef.current) return { success: false, error: 'Time system not available' };

    // Check if sleep is allowed at current location
    if (actionRequirementSystemRef.current) {
      const currentLocation = locationSystemRef.current?.getLocation(player.currentLocation);
      const sleepCheck = actionRequirementSystemRef.current.checkActionRequirements(
        'sleep',
        player,
        gameState,
        currentLocation
      );

      if (!sleepCheck.allowed) {
        toast.error('Cannot Sleep', sleepCheck.message);
        return { success: false, error: sleepCheck.message, reason: sleepCheck.reason };
      }
    }

    const result = timeSystemRef.current.sleep(
      player.currentTime || { day: 1, hour: 8, minute: 0 },
      sleepType
    );

    setPlayer(prev => {
      const newTimeStats = { ...prev.timeStats };
      let newLodging = prev.lodging;

      // Update sleep stats
      newTimeStats.timesSlept = (newTimeStats.timesSlept || 0) + 1;
      newTimeStats.currentDayStreak = 0; // Reset day streak

      // Update days if changed
      if (result.dayChanged) {
        newTimeStats.totalDaysPlayed = (newTimeStats.totalDaysPlayed || 0) + result.daysAdvanced;

        // Process lodging on day change (check for expired rooms, missed payments)
        if (lodgingSystemRef.current && prev.lodging) {
          const lodgingResult = lodgingSystemRef.current.processNewDay(
            prev,
            result.newTime.day
          );

          if (lodgingResult.updatedLodging) {
            newLodging = lodgingResult.updatedLodging;
          }

          // Notify about expired rooms
          if (lodgingResult.expiredRooms?.length > 0) {
            setTimeout(() => {
              toast.warning(
                'Room Expired',
                `Your inn room rental has expired. You'll need to rent again to sleep here.`
              );
            }, 100);
          }

          // Notify about evictions
          if (lodgingResult.evictions?.length > 0) {
            setTimeout(() => {
              toast.error(
                'Evicted!',
                `You've been evicted from ${lodgingResult.evictions[0].name} for non-payment.`
              );
            }, 100);
          }
        }
      }

      // Restore stamina and health
      const newCurrentHp = result.restoreHealth ? prev.maxHp : prev.currentHp;
      const newCurrentStamina = result.restoreStamina ? prev.maxStamina : prev.currentStamina;

      return {
        ...prev,
        currentTime: result.newTime,
        timeStats: newTimeStats,
        lodging: newLodging,
        currentHp: newCurrentHp,
        currentStamina: newCurrentStamina
      };
    });

    toast.success(
      sleepType === 'morning' ? 'Good Morning!' : 'Nightfall',
      `You slept for ${result.hoursSlept} hours. HP and stamina restored.`
    );

    return { success: true, ...result };
  }, [player, gameState, toast]);

  /**
   * Check if player can sleep at current location
   * @returns {Object} { canSleep: boolean, reason: string }
   */
  const canSleep = useCallback(() => {
    if (!actionRequirementSystemRef.current) {
      return { canSleep: true, reason: '' };
    }

    const currentLocation = locationSystemRef.current?.getLocation(player.currentLocation);
    const result = actionRequirementSystemRef.current.checkActionRequirements(
      'sleep',
      player,
      gameState,
      currentLocation
    );

    return {
      canSleep: result.allowed,
      reason: result.message || '',
      satisfiedBy: result.satisfiedBy
    };
  }, [player, gameState]);

  /**
   * Rent an inn room (called from scene actions)
   * @param {string} roomId - Room ID to rent
   * @param {number} days - Number of days to rent
   * @returns {Object} Result of rental
   */
  const rentRoom = useCallback((roomId, days = 1) => {
    if (!lodgingSystemRef.current) {
      return { success: false, error: 'Lodging system not available' };
    }

    const currentDay = player.currentTime?.day || 1;
    const result = lodgingSystemRef.current.rentRoom(player, roomId, days, currentDay);

    if (result.success) {
      setPlayer(prev => ({
        ...prev,
        gold: prev.gold - result.cost,
        lodging: result.updatedLodging
      }));

      toast.success(
        'Room Rented',
        `Rented ${result.room.name} for ${days} night(s). Total: ${result.cost}g`
      );
    } else {
      toast.error('Cannot Rent Room', result.error);
    }

    return result;
  }, [player, toast]);

  /**
   * Extend an existing inn room stay
   * @param {string} roomId - Room ID to extend
   * @param {number} additionalDays - Days to add
   * @returns {Object} Result of extension
   */
  const extendStay = useCallback((roomId, additionalDays = 1) => {
    if (!lodgingSystemRef.current) {
      return { success: false, error: 'Lodging system not available' };
    }

    const currentDay = player.currentTime?.day || 1;
    const result = lodgingSystemRef.current.extendStay(player, roomId, additionalDays, currentDay);

    if (result.success) {
      setPlayer(prev => ({
        ...prev,
        gold: prev.gold - result.cost,
        lodging: result.updatedLodging
      }));

      toast.success(
        'Stay Extended',
        `Extended stay by ${additionalDays} night(s). Cost: ${result.cost}g`
      );
    } else {
      toast.error('Cannot Extend Stay', result.error);
    }

    return result;
  }, [player, toast]);

  /**
   * Get current time summary for display
   */
  const getTimeSummary = useCallback(() => {
    if (!timeSystemRef.current) {
      return {
        day: player.currentTime?.day || 1,
        hour: player.currentTime?.hour || 8,
        minute: player.currentTime?.minute || 0,
        period: 'Morning',
        periodIcon: '☀️',
        isNight: false,
        formatted: '8:00 AM'
      };
    }

    return timeSystemRef.current.getTimeSummary(player.currentTime || { day: 1, hour: 8, minute: 0 });
  }, [player.currentTime]);

  /**
   * Get night encounter modifier for current location
   */
  const getNightEncounterModifier = useCallback(() => {
    if (!timeSystemRef.current || !player.currentLocation) return 0;

    const location = GameData.locations.find(l => l.id === player.currentLocation);
    if (!location) return 0;

    return timeSystemRef.current.getNightEncounterModifier(
      location.tags || [],
      player.currentTime?.hour || 8
    );
  }, [player.currentLocation, player.currentTime]);

  /**
   * Get CSS properties for time-based theming
   */
  const getTimeThemeStyles = useCallback(() => {
    if (!timeSystemRef.current) return {};

    return timeSystemRef.current.getTimeCSSProperties(player.currentTime?.hour || 8);
  }, [player.currentTime]);

  // Rumor confrontation handlers
  const handleRumorResponse = useCallback((responseId) => {
    if (!rumorConfrontationData || !rumorSystemRef.current) return;

    const { npc, rumor } = rumorConfrontationData;
    const result = rumorSystemRef.current.processRumorResponse(player, rumor, responseId, npc);

    // Update player state with any changes
    setPlayer(prev => ({
      ...prev,
      rumors: [...(prev.rumors || [])],
      rumorCooldowns: { ...prev.rumorCooldowns, [npc.id]: Date.now() },
      gold: result.effects?.find(e => e.type === 'gold_spent')
        ? prev.gold + result.effects.find(e => e.type === 'gold_spent').value
        : prev.gold
    }));

    // Show result
    setRumorResult(result);
    setShowRumorConfrontation(false);
    setShowRumorResult(true);

    // Check if seduction was triggered
    if (result.triggerScene) {
      const seduceScene = GameData.scenes?.find(s => s.id === result.triggerScene);
      if (seduceScene) {
        setShowRumorResult(false);
        setCurrentScene(seduceScene);
        setScreen('scene');
      }
    }
  }, [player, rumorConfrontationData]);

  const handleRumorSkip = useCallback(() => {
    setShowRumorConfrontation(false);
    setRumorConfrontationData(null);
    // Continue with normal NPC interaction
    toast.info('NPCs', 'NPC interaction coming soon...');
  }, [toast]);

  const handleRumorResultClose = useCallback(() => {
    setShowRumorResult(false);
    setRumorResult(null);
    setRumorConfrontationData(null);
  }, []);

  // Location services handlers (church, clinic, nursery)
  const handleOpenServices = useCallback((location) => {
    if (!locationServicesRef.current) return;

    const services = locationServicesRef.current.getServicesAtLocation(location, player);
    if (services.length > 0) {
      setServiceInteractionData({
        location,
        services,
        serviceDefinitions: locationServicesRef.current.serviceDefinitions
      });
      setShowServiceInteraction(true);
    } else {
      toast.info('Services', 'No services are currently available here.');
    }
  }, [player, toast]);

  const handleSelectService = useCallback((service) => {
    // Optional: track selected service for UI purposes
  }, []);

  const handleConfirmService = useCallback(({ service, paymentMethod, cost, options }) => {
    if (!locationServicesRef.current) return;

    // Deduct payment
    if (paymentMethod === 'gold' && cost > 0) {
      if (player.gold < cost) {
        toast.error('Payment', 'Not enough gold!');
        return;
      }
      setPlayer(prev => ({ ...prev, gold: prev.gold - cost }));
    } else if (paymentMethod === 'charity' && cost > 0) {
      if ((player.charityCredit || 0) < cost) {
        toast.error('Payment', 'Not enough charity credit!');
        return;
      }
      setPlayer(prev => ({ ...prev, charityCredit: (prev.charityCredit || 0) - cost }));
    }

    // Process the service
    const result = locationServicesRef.current.processService(service.id, player, options);

    // Apply state changes
    if (result.stateChanges) {
      setPlayer(prev => {
        const newState = { ...prev };
        for (const [path, value] of Object.entries(result.stateChanges)) {
          const keys = path.split('.');
          let target = newState;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!target[keys[i]]) target[keys[i]] = {};
            target = target[keys[i]];
          }
          target[keys[keys.length - 1]] = value;
        }
        return newState;
      });
    }

    // Handle time passage effects
    const timePassed = result.effects?.find(e => e.type === 'time_passed');
    if (timePassed) {
      // Advance game time by hours
      setPlayer(prev => ({
        ...prev,
        currentTime: {
          ...prev.currentTime,
          hour: (prev.currentTime?.hour || 8) + timePassed.hours
        }
      }));
    }

    // Handle blessing effects
    const blessing = result.effects?.find(e => e.type === 'blessing_received');
    if (blessing) {
      // Add temporary buff
      setPlayer(prev => ({
        ...prev,
        activeBuffs: [
          ...(prev.activeBuffs || []),
          {
            id: blessing.blessing,
            appliedAt: Date.now(),
            duration: blessing.duration
          }
        ]
      }));
    }

    // Show result
    setServiceResult(result);
    setShowServiceInteraction(false);
    setShowServiceResult(true);
  }, [player, toast]);

  const handleCloseServices = useCallback(() => {
    setShowServiceInteraction(false);
    setServiceInteractionData(null);
  }, []);

  const handleServiceResultClose = useCallback(() => {
    setShowServiceResult(false);
    setServiceResult(null);
  }, []);

  // Combat action handler
  const handleCombatAction = (action, param) => {
    switch (action) {
      case 'attack':
        const target = combatEnemies[param];
        if (target && target.currentHp > 0) {
          const damage = CombatSystem.calculateDamage(player, target);
          const newHp = Math.max(0, target.currentHp - damage);
          setCombatEnemies(prev => prev.map((e, i) => 
            i === param ? { ...e, currentHp: newHp } : e
          ));
          
          // Check if enemy defeated
          if (newHp <= 0) {
            toast.combat(`${target.name} defeated!`);
          }
        }
        break;
        
      case 'resist':
        if (player.restraintState) {
          const result = CombatSystem.attemptResist(player, GameData.restraints[player.restraintState.type]);
          if (result.success) {
            const newRestraintHp = player.restraintState.hp - result.damage;
            const brokesFree = newRestraintHp <= 0;
            
            setPlayer(prev => ({
              ...prev,
              currentStamina: prev.currentStamina - result.staminaCost,
              restraintState: brokesFree ? null : { ...prev.restraintState, hp: newRestraintHp }
            }));
            
            if (brokesFree) {
              toast.escape(true);
            } else {
              toast.info('Struggling', `Restraint weakened! (${Math.max(0, newRestraintHp)} HP remaining)`);
            }
          } else {
            toast.warning('Too Exhausted', result.reason);
          }
        }
        break;
        
      case 'recover':
        const staminaGain = Math.floor(player.maxStamina * 0.2);
        const hpGain = Math.floor(player.maxHp * 0.05);
        setPlayer(prev => ({
          ...prev,
          currentStamina: Math.min(prev.maxStamina, prev.currentStamina + staminaGain),
          currentHp: Math.min(prev.maxHp, prev.currentHp + hpGain)
        }));
        toast.heal(hpGain, 'Recovery');
        break;
    }
    
    // Check if combat ended (all enemies defeated)
    const updatedEnemies = action === 'attack' 
      ? combatEnemies.map((e, i) => i === param ? { ...e, currentHp: Math.max(0, e.currentHp - CombatSystem.calculateDamage(player, e)) } : e)
      : combatEnemies;
    
    if (updatedEnemies.every(e => e.currentHp <= 0)) {
      // Victory! Advance time for combat + victory bonus
      advanceTime('combat');
      advanceTime('combat_victory');

      const location = GameData.locations.find(l => l.id === player.currentLocation);
      const loot = CombatSystem.generateLoot(combatEnemies, location, player.level, gameState.difficulty);
      const expGained = combatEnemies.reduce((sum, e) => sum + e.level * 10, 0);
      
      // Calculate level up
      const newExp = player.experience + expGained;
      const levelsGained = Math.floor(newExp / player.experienceToNext);
      
      // Track combat stats and achievements
      const enemiesDefeated = combatEnemies.length;
      const damageTakenThisCombat = player.maxHp - player.currentHp;
      
      setPlayer(prev => {
        const newLevel = prev.level + levelsGained;
        const newExpToNext = Math.floor(prev.experienceToNext * 1.5);
        return {
          ...prev,
          inventory: [...prev.inventory, ...loot],
          experience: newExp % prev.experienceToNext,
          experienceToNext: levelsGained > 0 ? newExpToNext : prev.experienceToNext,
          level: newLevel,
          skillPoints: prev.skillPoints + (levelsGained * 2),
          stats_tracking: {
            ...prev.stats_tracking,
            enemiesDefeated: prev.stats_tracking.enemiesDefeated + enemiesDefeated,
            combatsWon: prev.stats_tracking.combatsWon + 1,
            itemsFound: prev.stats_tracking.itemsFound + loot.length
          }
        };
      });
      
      // Achievement checks
      // First blood
      if (!player.unlockedAchievements.includes('first_blood')) {
        unlockAchievement('first_blood');
      }
      
      // Untouchable (no damage taken)
      if (damageTakenThisCombat === 0 && !player.unlockedAchievements.includes('untouchable')) {
        unlockAchievement('untouchable');
      }
      
      // Slayer progress
      updateAchievementProgress('slayer', enemiesDefeated);
      
      // Treasure hunter (first item)
      if (loot.length > 0 && !player.unlockedAchievements.includes('treasure_hunter')) {
        unlockAchievement('treasure_hunter');
      }
      
      // Mythic/Divine finder
      loot.forEach(item => {
        if (item.rarity === 'mythic' && !player.unlockedAchievements.includes('mythic_finder')) {
          setTimeout(() => unlockAchievement('mythic_finder'), 1000);
        }
        if (item.rarity === 'divine' && !player.unlockedAchievements.includes('divine_blessing')) {
          setTimeout(() => unlockAchievement('divine_blessing'), 1000);
        }
      });
      
      // Show victory toasts
      toast.success('Victory!', `Defeated ${combatEnemies.length} ${combatEnemies.length === 1 ? 'enemy' : 'enemies'}`);
      toast.experience(expGained, newExp % player.experienceToNext, player.experienceToNext);
      
      // Show level up toast if applicable
      if (levelsGained > 0) {
        setTimeout(() => {
          toast.levelUp(player.level + levelsGained, levelsGained * 2);
        }, 500);
      }
      
      // Show loot toasts with staggered timing
      loot.forEach((item, index) => {
        setTimeout(() => {
          const statsStr = item.stats && Object.keys(item.stats).length > 0 
            ? Object.entries(item.stats).map(([k, v]) => `${k}: +${v}`).join(', ')
            : null;
          toast.item(
            item.name, 
            item.rarity, 
            item.count, 
            item.curse?.level || null,
            statsStr
          );
        }, 200 + (index * 150));
      });
      
      setCombatEnemies([]);
      setScreen('game');
    }
  };
  
  // Flee from combat
  const handleFlee = () => {
    const fleeChance = 30 + player.stats.evasion * 2;
    if (rollChance(fleeChance)) {
      toast.escape(true);
      
      // Update flee stats and achievement progress
      setPlayer(prev => ({
        ...prev,
        stats_tracking: {
          ...prev.stats_tracking,
          combatsFled: prev.stats_tracking.combatsFled + 1
        }
      }));
      updateAchievementProgress('escape_artist', 1);
      
      setCombatEnemies([]);
      setScreen('game');
    } else {
      toast.escape(false);
    }
  };
  
  // Save game
  const handleSave = (slot) => {
    const saveSlot = slot === 'new' ? Date.now().toString() : slot;
    const success = SaveSystem.save(saveSlot, player, gameState);
    if (success) {
      toast.save(`Slot ${slot === 'new' ? 'created' : slot}`, true);
    } else {
      toast.save('Could not save game data', false);
    }
    setScreen('pause');
  };
  
  // Load game
  const handleLoad = (slot) => {
    const saveData = SaveSystem.load(slot);
    if (saveData) {
      setPlayer(saveData.player);
      setGameState(saveData.game);
      playTimeRef.current = saveData.game.playTime;
      toast.load(`${saveData.player.name} - Level ${saveData.player.level}`, true);
      setScreen('game');
    } else {
      toast.load('Could not load save data', false);
    }
  };
  
  // Continue from autosave
  const handleContinue = () => {
    const saveData = SaveSystem.load('auto');
    if (saveData) {
      setPlayer(saveData.player);
      setGameState(saveData.game);
      playTimeRef.current = saveData.game.playTime;
      toast.load('Continuing from autosave...', true);
      setScreen('game');
    } else {
      toast.error('No Autosave', 'No autosave data found');
    }
  };
  
  // Render current screen
  const renderScreen = () => {
    switch (screen) {
      case 'menu':
        return (
          <MainMenuScreen
            onStart={() => setScreen('characterSelect')}
            onContinue={handleContinue}
            onLoad={() => setScreen('loadGame')}
            onSettings={() => setScreen('settings')}
            onChangelog={() => setShowChangelog(true)}
            onSupport={() => window.open('https://example.com/support', '_blank')}
            onDebug={() => setShowDebugMenu(true)}
            onGenerator={() => setShowContentGenerator(true)}
          />
        );
        
      case 'characterSelect':
        return (
          <CharacterSelectScreen
            onSelect={handleCharacterSelect}
            onBack={() => setScreen('menu')}
          />
        );
        
      case 'nsfwStats':
        return (
          <NSFWStatsScreen
            onComplete={handleNSFWConfig}
            onBack={() => setScreen('characterSelect')}
          />
        );
        
      case 'fetishPrefs':
        return (
          <FetishPreferencesScreen
            onComplete={handleFetishPrefs}
            onBack={() => setScreen('nsfwStats')}
          />
        );
        
      case 'statDistribution':
        return (
          <StatsDistributionScreen
            baseStats={selectedCharacter?.baseStats || {}}
            bonusPoints={nsfwConfig?.bonusPoints || 0}
            onComplete={handleStatsComplete}
            onBack={() => setScreen('fetishPrefs')}
          />
        );
        
      case 'introChoice':
        return <IntroSelectionScreen onSelect={handleIntroChoice} />;
        
      case 'dialogue':
        return (
          <SceneDisplay
            scene={currentScene}
            player={player}
            gameState={gameState}
            onComplete={handleSceneComplete}
            onAction={handleSceneAction}
            validationSystem={inputValidationSystemRef.current}
          />
        );
        
      case 'game':
        return (
          <>
            <LocationScreen
              player={player}
              gameState={gameState}
              onAction={handleLocationAction}
              onPause={() => setScreen('pause')}
              locationSystem={locationSystemRef.current}
              onNavigate={handleTravel}
              onInteractNpc={handleInteractWithNpc}
            />
            <MedievalClock
              time={player.currentTime || { day: 1, hour: 8, minute: 0 }}
              timeSummary={getTimeSummary()}
              onSleep={handleSleep}
              canSleep={canSleep}
              showDetails={true}
              size="medium"
              position="top-right"
            />
            <TravelModal
              isOpen={showTravelModal}
              onClose={() => setShowTravelModal(false)}
              currentLocation={player.currentLocation}
              currentRegion={player.currentRegion}
              playerState={player}
              gameState={gameState}
              locationSystem={locationSystemRef.current}
              onTravel={handleTravel}
              onTravelToRegion={handleTravelToRegion}
              mapView={mapView}
              onMapViewChange={setMapView}
            />
            {showExpedition && currentExpedition && (
              <ExpeditionScene
                expedition={currentExpedition}
                expeditionSystem={expeditionSystemRef.current}
                playerState={player}
                gameTime={player.currentTime}
                FullBodyPaperdoll={FullBodyPaperdoll}
                onProgress={handleExpeditionProgress}
                onRest={handleExpeditionRest}
                onScavenge={handleExpeditionScavenge}
                onOpenInventory={() => setShowMerchantView(false) || setScreen('inventory')}
                onSetCamp={handleSetCamp}
                onToggleTorch={handleToggleTorch}
                onComplete={handleExpeditionComplete}
                onEncounter={handleExpeditionEncounter}
                onCancel={handleExpeditionCancel}
              />
            )}
            {showLocationTitle && locationTitleData && (
              <LocationTitle
                name={locationTitleData.name}
                subtitle={locationTitleData.subtitle}
                fontStyle={locationTitleData.fontStyle}
                fontTag={locationTitleData.fontTag}
                onComplete={() => setShowLocationTitle(false)}
              />
            )}
          </>
        );
        
      case 'combat':
        return (
          <CombatScreen
            player={player}
            enemies={combatEnemies}
            onAction={handleCombatAction}
            onFlee={handleFlee}
          />
        );
        
      case 'pause':
        return (
          <PauseMenu
            player={player}
            gameState={gameState}
            onResume={() => setScreen('game')}
            onSave={() => setScreen('saveGame')}
            onLoad={() => setScreen('loadGame')}
            onSettings={() => setScreen('settings')}
            onChangelog={() => setShowChangelog(true)}
            onExit={() => {
              const success = SaveSystem.save('auto', player, gameState);
              if (success) {
                toast.save('Progress autosaved', true);
              }
              setScreen('menu');
            }}
            inventorySystem={inventorySystemRef.current}
            onUpdatePlayer={setPlayer}
          />
        );
        
      case 'saveGame':
        return (
          <SaveLoadScreen
            mode="save"
            onSelect={handleSave}
            onBack={() => setScreen('pause')}
          />
        );
        
      case 'loadGame':
        return (
          <SaveLoadScreen
            mode="load"
            onSelect={handleLoad}
            onBack={() => setScreen(player.id ? 'pause' : 'menu')}
          />
        );
        
      case 'settings':
        return (
          <SettingsScreen
            gameState={gameState}
            onUpdateSettings={(settings) => {
              console.log('Settings updated:', settings);
              setScreen(player.id ? 'pause' : 'menu');
            }}
            onBack={() => setScreen(player.id ? 'pause' : 'menu')}
          />
        );
        
      default:
        return <MainMenuScreen onStart={() => setScreen('characterSelect')} />;
    }
  };
  
  // Get time-based theme styles
  const timeThemeStyles = getTimeThemeStyles();

  return (
    <GameContext.Provider value={{ player, setPlayer, gameState, setGameState, GameData }}>
      <div
        className="game-time-wrapper"
        style={{
          ...timeThemeStyles,
          minHeight: '100vh',
          background: timeThemeStyles['--time-gradient'] || 'linear-gradient(180deg, #1a1a2e 0%, #1f1f3a 50%, #2a2a4a 100%)',
          transition: 'background 1s ease-in-out'
        }}
      >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.4);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.6);
        }
      `}</style>

      {/* Difficulty Modal */}
      <DifficultyModal
        isOpen={showDifficultyModal}
        onClose={() => setShowDifficultyModal(false)}
        onSelect={handleDifficultySelect}
      />

      {/* Merchant View Overlay */}
      {showMerchantView && activeMerchant && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <MerchantView
            merchant={activeMerchant}
            merchantStock={merchantStock}
            playerState={player}
            merchantSystem={merchantSystemRef.current}
            inventorySystem={inventorySystemRef.current}
            onTransaction={handleMerchantTransaction}
            onClose={handleCloseMerchant}
          />
        </div>
      )}

      {/* Rumor Confrontation Modal */}
      {showRumorConfrontation && rumorConfrontationData && (
        <RumorConfrontation
          npc={rumorConfrontationData.npc}
          rumor={rumorConfrontationData.rumor}
          dialogue={rumorConfrontationData.dialogue}
          options={rumorConfrontationData.options}
          canSkip={rumorConfrontationData.canSkip}
          onResponse={handleRumorResponse}
          onSkip={handleRumorSkip}
        />
      )}

      {/* Rumor Result Modal */}
      {showRumorResult && rumorResult && (
        <RumorConfrontationResult
          result={rumorResult}
          onClose={handleRumorResultClose}
        />
      )}

      {/* Service Interaction Modal (Church, Clinic, Nursery) */}
      {showServiceInteraction && serviceInteractionData && (
        <ServiceInteraction
          services={serviceInteractionData.services}
          location={serviceInteractionData.location}
          playerState={player}
          serviceDefinitions={serviceInteractionData.serviceDefinitions}
          onSelectService={handleSelectService}
          onConfirmService={handleConfirmService}
          onClose={handleCloseServices}
        />
      )}

      {/* Service Result Modal */}
      {showServiceResult && serviceResult && (
        <ServiceResult
          result={serviceResult}
          onClose={handleServiceResultClose}
        />
      )}

      {/* Changelog Modal */}
      <ChangelogModal
        isOpen={showChangelog}
        onClose={() => setShowChangelog(false)}
      />

      {/* Debug Menu Modal */}
      {showDebugMenu && (
        <DebugMenu
          onClose={() => setShowDebugMenu(false)}
          SaveSystem={SaveSystem}
          GameData={GameData}
          onLoadAndEdit={(loadedPlayer) => {
            setPlayer(loadedPlayer);
            setShowDebugMenu(false);
          }}
        />
      )}

      {/* Content Generator Modal */}
      {showContentGenerator && (
        <ContentGenerator
          onClose={() => setShowContentGenerator(false)}
        />
      )}

      {renderScreen()}
      </div>
    </GameContext.Provider>
  );
};

// Wrapped Game component with Toast Provider
const GameWithToast = () => (
  <ToastProvider>
    <Game />
  </ToastProvider>
);

export default GameWithToast;
