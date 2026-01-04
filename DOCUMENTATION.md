# Furrocity Engine - Complete Documentation

> **Version:** 0.2.0
> **Engine:** Furrocity Engine
> **Authors:** Cotton Le Sergal & Shluggo

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Project Architecture](#2-project-architecture)
3. [Datapack System](#3-datapack-system)
4. [Game Configuration](#4-game-configuration)
5. [Creating Scenes](#5-creating-scenes)
6. [Creating Locations](#6-creating-locations)
7. [Creating Enemies](#7-creating-enemies)
8. [Creating NPCs & Merchants](#8-creating-npcs--merchants)
9. [Merchant System](#9-merchant-system)
10. [Fame, Titles & Infamy](#10-fame-titles--infamy)
11. [Creating Items](#11-creating-items)
12. [Inventory System](#12-inventory-system)
13. [Loot Tables](#13-loot-tables)
14. [Effects & Status System](#14-effects--status-system)
15. [Substance System](#15-substance-system)
16. [Encounter System](#16-encounter-system)
17. [Paperdoll System](#17-paperdoll-system)
18. [Player State Schema](#18-player-state-schema)
19. [Condition Reference](#19-condition-reference)
20. [Effect Actions Reference](#20-effect-actions-reference)
21. [Adding New Content](#21-adding-new-content)
22. [Performance & Optimization](#22-performance--optimization)

---

## 1. Quick Start

### Installation
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```
Creates a `dist/` folder for deployment.

### Development Workflow
1. Edit JSON files in `public/datapacks/core/`
2. Changes hot-reload automatically
3. Use `debug.enabled: true` in GameConfig.js for testing

---

## 2. Project Architecture

```
furrocity/
├── src/
│   ├── main.jsx              # React entry point
│   ├── App.jsx               # Age gate + error boundary
│   ├── Game.jsx              # Main game component
│   ├── GameConfig.js         # Game configuration
│   └── components/
│       └── inventory/
│           ├── UniversalInventory.jsx   # Reusable inventory grid
│           ├── UniversalInventory.css   # Inventory styles
│           ├── InventoryItem.jsx        # Single item display
│           ├── ItemContextMenu.jsx      # Right-click menu
│           ├── InventoryFilters.jsx     # Tag filters + search
│           └── MerchantView.jsx         # Trading UI
│
├── engine/                   # Core game systems
│   ├── index.js              # Engine exports
│   ├── DataRegistry.js       # Content loading & caching
│   ├── DataPackManager.js    # Datapack management
│   ├── SceneRunner.js        # Dialogue/narrative engine
│   ├── CombatSystem.js       # Combat mechanics
│   ├── EffectSystem.js       # Buffs/debuffs
│   ├── SubstanceSystem.js    # Drugs/addiction
│   ├── EncounterSystem.js    # Random encounters
│   ├── InventorySystem.js    # Items/equipment
│   ├── MerchantSystem.js     # Trading logic
│   ├── FameSystem.js         # Fame/titles/infamy
│   ├── PaperdollSystem.js    # Character visuals
│   ├── PlayerStateSchema.js  # Player data structure
│   ├── LootTableSystem.js    # Loot generation
│   ├── ConditionEvaluator.js # Condition checking
│   └── SaveSystem.js         # Save/load
│
├── public/
│   ├── datapacks/            # MODULAR GAME CONTENT
│   │   └── core/             # Base game datapack
│   │       ├── pack.json     # Datapack manifest
│   │       ├── scenes/
│   │       ├── items/
│   │       ├── enemies/
│   │       ├── locations/
│   │       ├── effects/
│   │       ├── substances/
│   │       ├── merchants/
│   │       ├── titles/
│   │       ├── loot_tables/
│   │       ├── encounter_tables/
│   │       ├── conditions/
│   │       └── sprites/
│   │
│   └── images/               # Game images
│       ├── characters/
│       ├── locations/
│       ├── items/
│       └── paperdoll/
│
├── package.json
├── vite.config.js
└── index.html
```

### Key Architectural Principles

1. **Separation of Concerns**: Engine code (logic) is separate from content (JSON data)
2. **Datapack Modularity**: All content in datapacks that can be swapped/extended
3. **Component Reusability**: UI components like UniversalInventory work across contexts
4. **Lazy Loading**: Content loaded on-demand for performance
5. **ID-based References**: Everything uses string IDs for cross-referencing

---

## 3. Datapack System

Datapacks are modular content packages. Each datapack has a `pack.json` manifest.

### pack.json Structure

```json
{
  "id": "core",
  "name": "Core Game Content",
  "version": "1.0.0",
  "author": "Furrocity Team",
  "description": "Base game content",
  "dependencies": [],
  "loadPriority": 0,

  "contentTypes": {
    "sprites": {
      "path": "sprites/",
      "files": ["spritesheets.json"]
    },
    "conditions": {
      "path": "conditions/",
      "files": ["encounter_conditions.json", "loot_conditions.json"]
    },
    "loot_tables": {
      "path": "loot_tables/",
      "files": ["forest_loot.json", "town_loot.json"]
    },
    "encounter_tables": {
      "path": "encounter_tables/",
      "files": ["forest_encounters.json"]
    },
    "items": {
      "path": "items/",
      "files": ["weapons_armor.json", "consumables.json"]
    },
    "enemies": {
      "path": "enemies/",
      "files": ["forest_enemies.json"]
    },
    "locations": {
      "path": "locations/",
      "files": ["world_locations.json"]
    },
    "effects": {
      "path": "effects/",
      "files": ["core_effects.json"]
    },
    "substances": {
      "path": "substances/",
      "files": ["core_substances.json"]
    },
    "scenes": {
      "path": "scenes/",
      "files": ["intro_scenes.json"]
    },
    "merchants": {
      "path": "merchants/",
      "files": ["merchants.json", "shop_inventories.json"]
    },
    "titles": {
      "path": "titles/",
      "files": ["titles.json"]
    }
  }
}
```

### Adding a New Datapack

1. Create folder: `public/datapacks/my_expansion/`
2. Create `pack.json` with manifest
3. Add content folders and JSON files
4. Set `dependencies: ["core"]` if extending base content
5. The engine auto-discovers and loads datapacks

### Content ID Prefixes

Each content type has an internal ID prefix for the registry:

| Content Type | Prefix | Example |
|--------------|--------|---------|
| items | `item:` | `item:steel_sword` |
| enemies | `enemy:` | `enemy:forest_wolf` |
| effects | `effect:` | `effect:poisoned` |
| merchants | `merchant:` | `merchant:blacksmith` |
| titles | `title:` | `title:hero_of_crossroads` |
| loot_tables | `loot:` | `loot:forest_chest` |

---

## 4. Game Configuration

Edit `src/GameConfig.js`:

### Game Info
```javascript
game: {
  title: "FURROCITY",
  subtitle: "Unleash your inner beast...",
  version: "0.2.0",
  engineName: "Furrocity Engine",
  copyright: {
    year: 2025,
    holders: "Cotton Le Sergal & Shluggo"
  }
}
```

### Debug Mode
```javascript
debug: {
  enabled: true,               // Master toggle
  showFPS: true,
  showStateInspector: true,
  logSceneTransitions: true,
  logCombatActions: true,
  skipAgeVerification: true,
  godMode: false,
  infiniteGold: false
}
```

### Display
```javascript
display: {
  theme: "dark",               // "dark", "light", "oled"
  accentColor: "#ff2d95",
  fontSize: "medium",
  animations: true
}
```

### Gameplay
```javascript
gameplay: {
  defaultDifficulty: "normal",
  autoSaveInterval: 300000,    // 5 minutes
  maxSaveSlots: 20,
  combatSpeed: "normal"
}
```

---

## 5. Creating Scenes

Scenes are the core narrative building blocks.

### Basic Scene Structure

```json
{
  "id": "tavern_intro",
  "name": "The Rusty Tankard",
  "type": "dialogue",
  "tags": ["vanilla", "intro", "safe"],
  "location": "rusty_tankard_tavern",
  "startNode": "start",

  "nodes": {
    "start": {
      "type": "dialogue",
      "speaker": "narrator",
      "text": "You push open the tavern door.",
      "next": "bartender_greet"
    },
    "bartender_greet": {
      "type": "dialogue",
      "speaker": "bartender",
      "speakerName": "Greta",
      "portrait": "/images/characters/greta.png",
      "text": "What can I get ya?",
      "next": "choice_response"
    },
    "choice_response": {
      "type": "choice",
      "choices": [
        { "text": "I'll have an ale.", "next": "order_ale" },
        { "text": "Just information.", "next": "ask_info" },
        {
          "text": "[Flirt] Nice eyes...",
          "next": "flirt",
          "conditions": [{ "type": "stat_above", "stat": "charisma", "value": 6 }]
        }
      ]
    },
    "leave": {
      "type": "end",
      "returnToLocation": true
    }
  }
}
```

### Node Types

| Type | Purpose |
|------|---------|
| `dialogue` | NPC/narrator text |
| `choice` | Player choices |
| `branch` | Auto-branch based on conditions |
| `effect` | Apply effects/give items |
| `combat` | Start combat |
| `nsfw` | Adult content (tag-gated) |
| `end` | End scene |

### Branch Node
```json
{
  "type": "branch",
  "branches": [
    {
      "conditions": [{ "type": "stat_above", "stat": "perception", "value": 8 }],
      "next": "notice_hidden"
    },
    {
      "default": true,
      "next": "normal_path"
    }
  ]
}
```

### Effect Node
```json
{
  "type": "effect",
  "effects": [
    { "type": "modify_stat", "stat": "gold", "value": -50 },
    { "type": "give_item", "itemId": "ale_strong" },
    { "type": "set_flag", "flag": "bought_ale" }
  ],
  "next": "continue"
}
```

---

## 6. Creating Locations

### Basic Location

```json
{
  "id": "rusty_tankard_tavern",
  "name": "The Rusty Tankard",
  "description": "A cozy tavern filled with warmth.",
  "image": "/images/locations/tavern.png",
  "type": "building",
  "region": "millbrook",
  "tags": ["safe", "tavern", "rest", "shop"],

  "connectedLocations": ["millbrook_square", "tavern_upstairs"],
  "actions": ["rest", "shop", "talk", "leave"],
  "npcs": ["greta_bartender", "tom_bard"],

  "scenes": {
    "onEnter": "tavern_enter_scene",
    "onFirstVisit": "tavern_intro"
  },

  "encounterChance": 0
}
```

### Dangerous Location

```json
{
  "id": "dark_forest_depths",
  "name": "Deep Dark Forest",
  "type": "wilderness",
  "tags": ["dangerous", "forest"],

  "encounterChance": 40,
  "passedOutEncounterModifier": 2.5,

  "encounterTables": {
    "combat": "forest_combat_table",
    "predatory": "forest_predatory_table"
  },

  "encounterTypeWeights": {
    "combat": 30,
    "predatory": 35,
    "lustful": 20,
    "helpful": 10
  },

  "timeModifiers": {
    "night": { "encounterChance": 1.8, "predatory": 2.0 }
  }
}
```

### Location Types

| Type | Base Encounter |
|------|----------------|
| `building` | 0-10% |
| `town` | 5-15% |
| `wilderness` | 20-40% |
| `dungeon` | 40-60% |
| `dangerous` | 50-80% |

---

## 7. Creating Enemies

### Basic Enemy

```json
{
  "id": "forest_wolf",
  "name": "Forest Wolf",
  "description": "A large gray wolf.",
  "image": "/images/enemies/wolf.png",
  "type": "beast",
  "tags": ["beast", "wolf", "forest"],

  "level": 3,
  "stats": {
    "maxHp": 45,
    "attack": 12,
    "defense": 5,
    "speed": 15
  },

  "resistances": {
    "fire": -20,
    "ice": 10
  },

  "skills": [
    { "id": "bite", "weight": 50 },
    { "id": "claw_swipe", "weight": 30 }
  ],

  "experienceReward": 35,
  "goldDrop": { "min": 0, "max": 5 },
  "lootTable": "wolf_loot"
}
```

### NSFW Enemy Behavior

```json
{
  "id": "lust_demon",
  "nsfwBehavior": {
    "enabled": true,
    "requiredTags": ["monster", "demon"],

    "arousalAttacks": [
      {
        "id": "seductive_touch",
        "arousalDamage": 20,
        "targetAreas": ["chest", "thighs"]
      }
    ],

    "grapplingEnabled": true,
    "grappleChance": 30,

    "clothingTargeting": {
      "enabled": true,
      "stripChance": 25
    },

    "onPlayerDefeated": {
      "sceneId": "lust_demon_victory"
    }
  }
}
```

---

## 8. Creating NPCs & Merchants

### Basic NPC

```json
{
  "id": "greta_bartender",
  "name": "Greta",
  "title": "Bartender",
  "image": "/images/characters/greta.png",
  "role": "merchant",
  "location": "rusty_tankard_tavern",

  "dialogue": {
    "greeting": "Welcome back!",
    "greeting_first": "A new face! What'll it be?",
    "farewell": "Take care!"
  },

  "relationshipStats": {
    "affection": 0,
    "trust": 10
  },

  "scenes": {
    "talk": "greta_talk_scene"
  }
}
```

---

## 9. Merchant System

The merchant system supports tag-based filtering and dynamic pricing.

### Merchant Definition

```json
{
  "id": "blacksmith_joe",
  "name": "Joe the Blacksmith",
  "locationId": "town_square",
  "factionId": "crossroads_guild",

  "buyConfig": {
    "acceptedTags": ["weapon", "armor", "metal"],
    "rejectedTags": ["cursed", "organic"],
    "buyPriceMultiplier": 0.4,
    "maxBuyValue": 5000
  },

  "sellConfig": {
    "mode": "static",
    "stockId": "blacksmith_stock",
    "sellPriceMultiplier": 1.0
  },

  "dialogue": {
    "greeting": "Welcome to my forge!",
    "cannotBuy": "I don't deal in that.",
    "farewell": "May your blade strike true!"
  }
}
```

### Shop Inventory Definition

```json
{
  "id": "blacksmith_stock",
  "items": [
    { "itemId": "iron_sword", "stock": 3, "restockDays": 3 },
    { "itemId": "steel_armor", "stock": 1, "restockDays": 7 }
  ]
}
```

### Price Calculation

**Buy Price (player buying):**
```
finalPrice = basePrice × rarityMult × merchantSellMult × playerModifier
```

**Sell Price (player selling):**
```
finalPrice = basePrice × rarityMult × merchantBuyMult × playerModifier
```

### Player Modifier Components

| Factor | Effect |
|--------|--------|
| Charisma | -1% per point above 5 |
| Fame | ±0.5% per 100 fame |
| Active Title | Up to ±15% |
| Blessed Equipment | -3% to -5% buy price |
| Faction Reputation | ±20% max |
| Infamy (slut) | +0.2% buy price per point over 20 |

### MerchantSystem API

```javascript
class MerchantSystem {
  // Validation
  canMerchantBuyItem(merchant, item)    // Returns { canBuy, reason }
  canPlayerSellItem(item, merchant)     // Returns { canSell, reason }

  // Pricing
  calculateBuyPrice(item, merchant, player)
  calculateSellPrice(item, merchant, player)

  // Transactions
  buyFromMerchant(merchant, item, player, quantity)
  sellToMerchant(merchant, item, player, quantity)
  autoSellJunk(merchant, player)

  // Stock
  getMerchantStock(merchant)
  getMerchantsAtLocation(locationId)
}
```

---

## 10. Fame, Titles & Infamy

### Player State Extensions

```javascript
fame: {
  value: 0,              // -1000 to 1000
  heroicDeeds: 0,
  villainousDeeds: 0,
  fameHistory: []
},
titles: {
  active: null,          // Currently displayed title
  unlocked: [],          // Unlocked title IDs
  equipped: null         // Title providing buffs
},
infamy: {
  slut: 0,               // 0-100 sexual infamy
  criminal: 0,           // 0-100 crime infamy
  corrupted: 0           // 0-100 corruption infamy
}
```

### Fame Levels

| Level | Range | Description |
|-------|-------|-------------|
| Villain | -1000 to -500 | Feared and hated |
| Notorious | -499 to -200 | Known troublemaker |
| Suspicious | -199 to -50 | Distrusted |
| Unknown | -49 to 49 | No reputation |
| Recognized | 50 to 199 | Known locally |
| Respected | 200 to 499 | Well-regarded |
| Famous | 500 to 799 | Widely known |
| Legendary | 800 to 1000 | Living legend |

### Title Definition

```json
{
  "id": "hero_of_crossroads",
  "name": "Hero of Crossroads",
  "description": "Recognized as the savior of Crossroads",

  "unlockConditions": {
    "type": "and",
    "conditions": [
      { "type": "fame", "operator": ">=", "value": 500 },
      { "type": "flag", "flag": "saved_crossroads" }
    ]
  },

  "effects": {
    "buyPriceModifier": -0.15,
    "sellPriceModifier": 0.10,
    "factionReputation": { "crossroads_guild": 50 }
  }
}
```

### FameSystem API

```javascript
class FameSystem {
  // Fame
  modifyFame(player, amount, reason)
  getFameLevel(fameValue)

  // Titles
  checkTitleUnlock(player, title)
  unlockTitle(player, titleId)
  equipTitle(player, titleId)
  getActiveTitleEffects(player)

  // Infamy
  modifyInfamy(player, type, amount)
  getInfamyEffects(player)

  // Price modifiers
  calculatePriceModifier(player, isBuying)
}
```

---

## 11. Creating Items

### Item Types

| Type | Equippable | Description |
|------|------------|-------------|
| `weapon` | Yes | Swords, bows, staves |
| `armor` | Yes | Protection gear |
| `clothing` | Yes | Regular/underwear/accessories |
| `consumable` | No | Potions, food |
| `material` | No | Crafting materials |
| `quest` | No | Quest items |

### Basic Weapon

```json
{
  "id": "steel_longsword",
  "name": "Steel Longsword",
  "description": "A well-crafted blade.",
  "image": "/images/items/steel_sword.png",
  "type": "weapon",
  "weaponType": "sword",
  "slot": "main_hand",
  "rarity": "uncommon",
  "basePrice": 150,
  "tags": ["weapon", "sword", "metal"],

  "stats": {
    "attack": 15,
    "critChance": 8
  },

  "requirements": {
    "level": 5,
    "stats": { "strength": 8 }
  }
}
```

### Consumable

```json
{
  "id": "health_potion",
  "name": "Health Potion",
  "type": "consumable",
  "rarity": "common",
  "basePrice": 25,
  "stackable": true,
  "maxStack": 20,
  "tags": ["consumable", "healing", "potion"],

  "useEffects": [
    { "type": "restore_hp", "value": 50 }
  ]
}
```

### Clothing with Paperdoll

```json
{
  "id": "silk_dress_red",
  "name": "Red Silk Dress",
  "type": "clothing",
  "slot": "chest",
  "rarity": "uncommon",
  "tags": ["clothing", "dress", "silk"],

  "stats": { "charisma": 3 },

  "paperdollType": "dress",
  "paperdollImages": {
    "fullBody": "/images/paperdoll/clothing/dress_red.png",
    "torso": "/images/paperdoll/clothing/dress_red_torso.png"
  },

  "clothingState": {
    "maxIntegrity": 60,
    "exposureThreshold": 20
  }
}
```

### Item Extensions for Trading

```json
{
  "canSell": true,
  "playerBound": false,
  "questItem": false,
  "unique": false
}
```

### Rarity System

| Rarity | Color | Drop Weight | Stat Bonus |
|--------|-------|-------------|------------|
| `common` | Gray | 100 | 0% |
| `uncommon` | Green | 50 | +10% |
| `rare` | Blue | 20 | +25% |
| `epic` | Purple | 8 | +50% |
| `legendary` | Orange | 2 | +100% |
| `mythic` | Red | 0.5 | +150% |

---

## 12. Inventory System

### Item User Flags

Players can mark items as favorite or junk:

```javascript
// Item instance structure
{
  ...itemData,
  uniqueId: "item_12345",
  userFlags: {
    favorite: false,    // Protected from selling
    junk: false         // Auto-sellable
  }
}
```

### InventorySystem API

```javascript
class InventorySystem {
  // Item creation
  createItemInstance(itemDefinition, options)

  // User flags
  toggleFavorite(inventory, itemUniqueId)
  toggleJunk(inventory, itemUniqueId)
  getJunkItems(inventory)
  getFavoriteItems(inventory)

  // Filtering
  getInventoryTags(inventory)
  getInventoryCategories(inventory)
  filterByTags(inventory, tags)
  searchItems(inventory, query)
}
```

### Greyed-Out Conditions

| Context | Condition | Greyed Out |
|---------|-----------|------------|
| Buying | Player gold < price | Yes |
| Selling | Item is favorite | Yes |
| Selling | Item is playerBound | Yes |
| Selling | Item is questItem | Yes |
| Selling | Merchant won't accept | Yes |

---

## 13. Loot Tables

### Basic Loot Table

```json
{
  "id": "wolf_loot",
  "type": "enemy_drop",

  "guaranteed": [
    { "itemId": "wolf_pelt", "count": 1 }
  ],

  "randomDrops": {
    "rolls": 2,
    "items": [
      { "itemId": "wolf_fang", "weight": 50, "count": { "min": 1, "max": 3 } },
      { "itemId": "raw_meat", "weight": 40 }
    ]
  },

  "rareDrop": {
    "chance": 5,
    "itemId": "alpha_wolf_fang"
  }
}
```

### Tiered Loot Table

```json
{
  "id": "dungeon_chest",
  "goldDrop": { "min": 50, "max": 150 },

  "tiers": [
    {
      "weight": 60,
      "rarity": "common",
      "pools": ["weapons_common", "armor_common"],
      "count": { "min": 1, "max": 2 }
    },
    {
      "weight": 30,
      "rarity": "uncommon",
      "pools": ["weapons_uncommon"],
      "count": 1
    },
    {
      "weight": 10,
      "rarity": "rare",
      "pools": ["weapons_rare"],
      "count": 1
    }
  ]
}
```

---

## 14. Effects & Status System

### Buff Effect

```json
{
  "id": "strength_up",
  "name": "Strength Up",
  "icon": "💪",
  "type": "buff",

  "duration": { "type": "time", "value": 300000 },

  "modifiers": [
    { "stat": "strength", "operation": "percent", "value": 25 }
  ],

  "stacking": { "behavior": "refresh", "maxStacks": 1 }
}
```

### Debuff with DoT

```json
{
  "id": "poisoned",
  "name": "Poisoned",
  "icon": "☠️",
  "type": "debuff",

  "duration": {
    "type": "time",
    "value": 60000,
    "tickInterval": 5000
  },

  "onTick": {
    "damage": { "type": "poison", "value": 5 }
  },

  "stacking": { "behavior": "stack", "maxStacks": 5 }
}
```

### Restraint Effect

```json
{
  "id": "rope_bound",
  "name": "Bound",
  "type": "restraint",

  "restrictions": {
    "canMove": false,
    "canAttack": false
  },

  "escapeOptions": [
    {
      "type": "struggle",
      "stat": "strength",
      "difficulty": 12,
      "progressPerSuccess": 25
    }
  ],

  "escapeThreshold": 100
}
```

---

## 15. Substance System

### Delivery Methods

| Method | Blocked By |
|--------|------------|
| `inhalant` | Gas masks |
| `consumable` | Antidotes |
| `injectable` | Armor |
| `contact` | Hazmat suits |
| `ambient` | Sealed areas |

### Substance Definition

```json
{
  "id": "bliss_inhaler",
  "name": "Bliss Inhaler",
  "deliveryMethod": "inhalant",
  "category": "aphrodisiac",

  "timing": {
    "onsetDuration": 30000,
    "peakDuration": 300000,
    "comedownDuration": 300000
  },

  "effects": {
    "peak": {
      "statModifiers": {
        "charisma": { "type": "percent", "value": 25 },
        "willpower": { "type": "flat", "value": -5 }
      },
      "nsfwModifiers": {
        "arousal": { "type": "flat", "value": 30 }
      }
    }
  },

  "addiction": {
    "addictiveness": 65,
    "addictionGainPerUse": 5
  }
}
```

### Addiction Stages

| Stage | Level | Description |
|-------|-------|-------------|
| `none` | 0 | No addiction |
| `curious` | 1-19 | Slight interest |
| `casual` | 20-39 | Occasional cravings |
| `habitual` | 40-59 | Regular use expected |
| `dependent` | 60-79 | Severe withdrawal |
| `addicted` | 80-99 | Extreme dependency |
| `enslaved` | 100 | Cannot function without |

---

## 16. Encounter System

### Encounter Types

| Type | Description |
|------|-------------|
| `combat` | Hostile fight |
| `predatory` | NSFW hostile |
| `opportunistic` | Takes advantage |
| `lustful` | Seductive |
| `helpful` | Assists player |
| `ambient` | Environmental |

### Encounter Table

```json
{
  "id": "forest_encounters",
  "encounterType": "combat",
  "location": "dark_forest",

  "entries": [
    {
      "sceneId": "wolf_attack",
      "weight": 30,
      "conditions": []
    },
    {
      "sceneId": "bandit_ambush",
      "weight": 25,
      "conditions": [{ "type": "time_between", "start": 18, "end": 6 }]
    }
  ]
}
```

### Status Effect Modifiers

| Status | Encounter Modifier |
|--------|-------------------|
| `pheromone_emitting` | +25% chance, lustful ×2 |
| `bleeding` | +10%, predatory ×2 |
| `hidden` | -50% chance |

---

## 17. Paperdoll System

### Body Regions

| Region | Layers |
|--------|--------|
| `fullBody` | 28 layers |
| `head` | 19 layers |
| `torso` | 17 layers |
| `groin` | 17 layers |

### Layer Order (z-index)

```
0  - base
1  - skin_details
2  - scars
3  - tattoos
10 - underwear_bottom
11 - underwear_top
13 - pants
14 - shirt
20 - chest_armor
25 - helmet
28 - effects_overlay
29 - restraints
```

### Item Paperdoll Definition

```json
{
  "paperdollType": "dress",
  "paperdollImages": {
    "fullBody": {
      "default": "/images/paperdoll/dress.png",
      "damaged": "/images/paperdoll/dress_damaged.png"
    }
  }
}
```

---

## 18. Player State Schema

```javascript
const playerState = {
  // Identity
  id: "player_001",
  name: "Hero",

  // Progression
  level: 1,
  experience: 0,

  // Stats
  stats: {
    strength: 5,
    vitality: 5,
    agility: 5,
    intelligence: 5,
    willpower: 5,
    charisma: 5
  },

  // Resources
  currentHp: 100,
  maxHp: 100,
  gold: 100,

  // Fame & Titles
  fame: { value: 0 },
  titles: { active: null, unlocked: [] },
  infamy: { slut: 0, criminal: 0, corrupted: 0 },

  // Inventory
  inventory: [],
  equipment: {},

  // Location
  currentLocation: "starting_inn",
  visitedLocations: [],

  // Flags
  flags: {},

  // Relationships
  relationships: {},

  // Active Effects
  activeEffects: []
};
```

---

## 19. Condition Reference

### Stat Conditions
```json
{ "type": "stat_above", "stat": "strength", "value": 10 }
{ "type": "stat_below", "stat": "willpower", "value": 5 }
```

### Resource Conditions
```json
{ "type": "hp_above", "value": 50 }
{ "type": "gold_above", "value": 100 }
```

### Item Conditions
```json
{ "type": "has_item", "itemId": "gold_key" }
{ "type": "has_equipped", "slot": "main_hand" }
```

### Flag Conditions
```json
{ "type": "has_flag", "flag": "met_merchant" }
{ "type": "not_flag", "flag": "killed_npc" }
```

### Location/Time Conditions
```json
{ "type": "location_is", "locationId": "dark_forest" }
{ "type": "time_between", "start": 22, "end": 6 }
{ "type": "is_night" }
```

### Fame/Title Conditions
```json
{ "type": "fame_above", "value": 500 }
{ "type": "has_title", "titleId": "hero_of_crossroads" }
{ "type": "infamy_above", "infamyType": "slut", "value": 50 }
```

### Combining (AND logic)
```json
"conditions": [
  { "type": "stat_above", "stat": "charisma", "value": 8 },
  { "type": "has_flag", "flag": "friendly" }
]
```

---

## 20. Effect Actions Reference

### Stat Modifications
```json
{ "type": "modify_stat", "stat": "gold", "value": 50 }
{ "type": "modify_fame", "value": 100, "reason": "Saved village" }
{ "type": "modify_infamy", "infamyType": "criminal", "value": 10 }
```

### Items
```json
{ "type": "give_item", "itemId": "gold_key" }
{ "type": "remove_item", "itemId": "old_key" }
```

### Effects
```json
{ "type": "apply_effect", "effectId": "poisoned", "duration": 60000 }
{ "type": "remove_effect", "effectId": "cursed" }
```

### Flags
```json
{ "type": "set_flag", "flag": "quest_started" }
{ "type": "remove_flag", "flag": "innocent" }
```

### Titles
```json
{ "type": "unlock_title", "titleId": "hero_of_crossroads" }
{ "type": "equip_title", "titleId": "hero_of_crossroads" }
```

### Movement
```json
{ "type": "teleport", "locationId": "prison_cell" }
{ "type": "start_scene", "sceneId": "captured" }
```

---

## 21. Adding New Content

### Step-by-Step: Adding a New Merchant

1. **Create merchant in `merchants/merchants.json`:**
```json
{
  "id": "alchemist_luna",
  "name": "Luna the Alchemist",
  "locationId": "alchemist_shop",
  "buyConfig": {
    "acceptedTags": ["potion", "ingredient", "herb"],
    "buyPriceMultiplier": 0.5
  },
  "sellConfig": {
    "mode": "static",
    "stockId": "alchemist_stock"
  }
}
```

2. **Create shop stock in `merchants/shop_inventories.json`:**
```json
{
  "id": "alchemist_stock",
  "items": [
    { "itemId": "health_potion", "stock": 10 },
    { "itemId": "mana_potion", "stock": 5 }
  ]
}
```

3. **Update `pack.json` if adding new files**

### Step-by-Step: Adding a New Title

1. **Add to `titles/titles.json`:**
```json
{
  "id": "dragon_slayer",
  "name": "Dragon Slayer",
  "description": "Defeated a mighty dragon",
  "unlockConditions": {
    "type": "flag",
    "flag": "killed_dragon"
  },
  "effects": {
    "buyPriceModifier": -0.10
  }
}
```

### Step-by-Step: Adding a New Item

1. **Add to appropriate items file:**
```json
{
  "id": "dragon_scale_armor",
  "name": "Dragon Scale Armor",
  "type": "armor",
  "slot": "chest",
  "rarity": "legendary",
  "basePrice": 5000,
  "tags": ["armor", "dragon", "legendary"],
  "stats": {
    "defense": 50,
    "fireResistance": 80
  }
}
```

2. **Add to loot table if droppable**
3. **Add to merchant stock if purchasable**

---

## 22. Performance & Optimization

### Best Practices

1. **Keep JSON files under 1MB each**
2. **Use lazy loading** - content loads on-demand
3. **Preload adjacent locations** - smooth transitions
4. **Use ID references** - not full object copies
5. **Batch similar content** - one file per category

### Naming Conventions

- Use `snake_case` for IDs: `dark_forest`, `steel_sword`
- Prefix categories: `forest_wolf`, `forest_bandit`
- Descriptive file names: `forest_enemies.json`

### Time Values (milliseconds)

- 1 second = 1,000 ms
- 1 minute = 60,000 ms
- 1 hour = 3,600,000 ms
- 1 day = 86,400,000 ms

### Testing

1. Enable `debug.enabled: true`
2. Use `debug.logSceneTransitions` for scene flow
3. Test with varied player states
4. Validate JSON with a linter

### Caching

The DataRegistry automatically caches:
- Loaded content chunks
- Resolved references
- Computed values

---

## Quick Reference

### Content Type → File Location

| Content | Path |
|---------|------|
| Items | `datapacks/core/items/` |
| Enemies | `datapacks/core/enemies/` |
| Merchants | `datapacks/core/merchants/` |
| Titles | `datapacks/core/titles/` |
| Effects | `datapacks/core/effects/` |
| Scenes | `datapacks/core/scenes/` |
| Locations | `datapacks/core/locations/` |
| Loot Tables | `datapacks/core/loot_tables/` |

### Common Tags

**Items:** `weapon`, `armor`, `clothing`, `consumable`, `potion`, `food`, `material`, `quest`, `cursed`, `blessed`

**Locations:** `safe`, `dangerous`, `town`, `wilderness`, `dungeon`, `shop`, `rest`

**Enemies:** `beast`, `humanoid`, `demon`, `undead`, `boss`

---

*© 2025 Cotton Le Sergal & Shluggo. Furrocity Engine.*
