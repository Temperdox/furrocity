# Furrocity Engine - Complete Documentation

> **Version:** 0.3.0
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
7. [Travel System](#7-travel-system)
8. [Creating Enemies](#8-creating-enemies)
9. [Creating NPCs & Merchants](#9-creating-npcs--merchants)
10. [Merchant System](#10-merchant-system)
11. [Fame, Titles & Infamy](#11-fame-titles--infamy)
12. [Local/Global Reputation & Rumor System](#12-localglobal-reputation--rumor-system)
13. [Location Services (Church, Clinic, Nursery)](#13-location-services-church-clinic-nursery)
14. [Public Events, Discovery & Barring System](#14-public-events-discovery--barring-system)
15. [Creating Items](#15-creating-items)
16. [Inventory System](#16-inventory-system)
17. [Loot Tables](#17-loot-tables)
18. [Effects & Status System](#18-effects--status-system)
19. [Substance System](#19-substance-system)
20. [Encounter System](#20-encounter-system)
21. [Paperdoll System](#21-paperdoll-system)
22. [Player State Schema](#22-player-state-schema)
23. [Condition Reference](#23-condition-reference)
24. [Effect Actions Reference](#24-effect-actions-reference)
25. [Adding New Content](#25-adding-new-content)
26. [Performance & Optimization](#26-performance--optimization)

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
│       ├── inventory/
│       │   ├── UniversalInventory.jsx   # Reusable inventory grid
│       │   ├── UniversalInventory.css   # Inventory styles
│       │   ├── InventoryItem.jsx        # Single item display
│       │   ├── ItemContextMenu.jsx      # Right-click menu
│       │   ├── InventoryFilters.jsx     # Tag filters + search
│       │   └── MerchantView.jsx         # Trading UI
│       ├── travel/
│       │   ├── TravelModal.jsx          # Map-based travel UI
│       │   ├── TravelModal.css          # Travel modal styles
│       │   ├── MapView.jsx              # Local/World map renderer
│       │   ├── LocationMarker.jsx       # Clickable map markers
│       │   └── RegionOverlay.jsx        # World map regions
│       └── ui/
│           ├── LocationTitle.jsx        # Animated location titles
│           ├── LocationTitle.css        # Title animation styles
│           └── RequirementTooltip.jsx   # Unlock requirement display
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
│   ├── UnlockSystem.js       # Location/content unlocking
│   ├── LocationSystem.js     # Travel & region management
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
│   │       ├── sprites/
│   │       └── ui/
│   │           └── location_fonts.json  # Font tags for location titles
│   │
│   └── images/               # Game images
│       ├── characters/
│       ├── locations/
│       ├── items/
│       ├── paperdoll/
│       └── maps/
│           ├── regions/      # World map region images
│           └── local/        # Local area maps
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
      "autoLoad": true
    },
    "items": {
      "path": "items/",
      "autoLoad": true
    },
    "enemies": {
      "path": "enemies/",
      "autoLoad": true
    },
    "locations": {
      "path": "locations/",
      "autoLoad": true
    },
    "scenes": {
      "path": "scenes/",
      "autoLoad": true
    },
    "merchants": {
      "path": "merchants/",
      "autoLoad": true
    }
  }
}
```

### Auto-Discovery System

The datapack system supports automatic file discovery at build time. Instead of listing every JSON file manually, use `autoLoad: true`:

**Automatic (recommended):**
```json
{
  "items": {
    "path": "items/",
    "autoLoad": true
  }
}
```

**Manual (for precise control):**
```json
{
  "items": {
    "path": "items/",
    "files": ["weapons.json", "armor.json", "consumables.json"]
  }
}
```

#### How Auto-Discovery Works

1. During `npm run dev` or `npm run build`, a Vite plugin scans each content directory
2. All `.json` files found (including subdirectories) are automatically added
3. The generated `pack.json` in `dist/` contains explicit file lists
4. Add new JSON files to any directory - they're picked up automatically on next build

#### Supported Content Types

| Type | Description |
|------|-------------|
| `sprites` | Sprite sheet definitions |
| `conditions` | Condition definitions for encounters/loot |
| `loot_tables` | Loot drop tables |
| `encounter_tables` | Random encounter tables |
| `items` | Weapons, armor, consumables, etc. |
| `enemies` | Enemy definitions |
| `locations` | World locations and regions |
| `effects` | Buffs, debuffs, status effects |
| `substances` | Drugs, potions, addiction mechanics |
| `scenes` | Dialogue and narrative scenes |
| `merchants` | NPC merchants and shop inventories |
| `titles` | Player titles and achievements |
| `rumors` | Rumor templates for reputation system |
| `services` | Location service definitions (church, clinic, nursery) |

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
  "locationType": "local",
  "parentRegion": "millbrook",
  "tags": ["safe", "tavern", "rest", "shop"],

  "connectedLocations": ["millbrook_square", "tavern_upstairs"],
  "neighbors": ["millbrook_square", "tavern_upstairs"],
  "actions": ["rest", "shop", "talk", "move"],
  "npcs": ["greta_bartender", "tom_bard"],

  "scenes": {
    "onEnter": "tavern_enter_scene",
    "onFirstVisit": "tavern_intro"
  },

  "encounterChance": 0,

  "mapData": {
    "localMapPosition": { "x": 150, "y": 200 },
    "icon": "building_tavern",
    "iconSize": "medium"
  },

  "titleDisplay": {
    "fontTag": "friendly_town",
    "subtitle": "A Warm Welcome Awaits"
  }
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

### Locked Location

Locations can be locked until the player meets certain requirements. Locked locations can still be discovered and shown on the map (grayed out with a lock icon). When the player tries to enter a locked location, a custom scene can play explaining why they can't enter.

```json
{
  "id": "witch_hut",
  "name": "Witch's Hut",
  "type": "building",
  "locationType": "local",
  "parentRegion": "darkwood",
  "neighbors": ["darkwood_forest", "darkwood_depths"],

  "locked": true,
  "initiallyUnlocked": false,

  "unlockRequirements": {
    "type": "or",
    "conditions": [
      { "type": "quest_complete", "quest": "forest_secrets" },
      { "type": "npc_relationship", "npc": "forest_hermit", "stat": "trust", "operator": ">=", "value": 50 }
    ]
  },

  "requirementNotMetScene": "witch_hut_locked",

  "discoverableWhileExploring": true,
  "discoveryChance": 0.15,

  "mapData": {
    "worldMapPosition": { "x": 45, "y": 62 },
    "localMapPosition": { "x": 180, "y": 220 },
    "icon": "building_mystical",
    "iconSize": "medium"
  },

  "titleDisplay": {
    "fontTag": "mystical",
    "subtitle": "Home of Morrigan the Witch"
  }
}
```

### Requirement Not Met Scene

When a player tries to enter a locked location, you can define a custom scene to explain why:

```json
{
  "id": "witch_hut_locked",
  "name": "The Hut is Sealed",
  "type": "dialogue",
  "startNode": "start",

  "nodes": {
    "start": {
      "type": "dialogue",
      "speaker": "narrator",
      "text": "The door to the witch's hut is sealed with strange runes. You sense powerful magic protecting this place.",
      "next": "requirements"
    },
    "requirements": {
      "type": "dialogue",
      "speaker": "player_thought",
      "text": "I should complete the forest secrets quest or earn the trust of the forest hermit before attempting to enter.",
      "next": "end"
    },
    "end": {
      "type": "end",
      "returnToLocation": true
    }
  }
}
```

The scene receives context data including:
- `locationId` - The ID of the locked location
- `locationName` - The display name
- `unmetRequirements` - Array of unmet requirement descriptions
- `requirementsDescription` - Human-readable summary of all requirements

### Location Lock Fields

| Field | Type | Description |
|-------|------|-------------|
| `locked` | boolean | Whether location is currently locked |
| `initiallyUnlocked` | boolean | Whether unlocked at game start |
| `unlockRequirements` | object | Conditions to unlock |
| `requirementNotMetScene` | string | Scene ID to play when player tries to enter locked location |
| `discoverableWhileExploring` | boolean | Can be found while exploring (shows grayed on map) |
| `discoveryChance` | number | Chance to discover (0.0-1.0) |

### Discovery System

Locations can be discovered through exploration even if they're locked:

1. **Discovered locations** appear on the map grayed out with a lock icon
2. **Hovering** over locked locations shows the requirements tooltip
3. **Clicking** a locked location and pressing "Investigate" triggers the `requirementNotMetScene`
4. Once requirements are met, the location becomes accessible

Player state tracks discoveries:
```javascript
{
  discoveredLocations: ["witch_hut", "hidden_cave"],  // Found but not necessarily unlocked
  unlockedLocations: ["starting_inn", "town_square"], // Can be entered
  visitedLocations: ["starting_inn"]                   // Have actually been there
}
```

---

## 7. Travel System

The travel system provides map-based navigation with location locking, region management, and animated location titles.

### Map Views

The TravelModal provides two map views:

| View | Description |
|------|-------------|
| **Local Map** | Shows buildings/locations within current region |
| **World Map** | Shows all regions with clickable navigation |

### Region Definition

Regions group locations together and have their own maps.

**File: `locations/regions.json`**

```json
{
  "id": "crossroads",
  "name": "Crossroads Region",
  "type": "region",
  "locked": false,
  "initiallyUnlocked": true,

  "mapData": {
    "worldMapImage": "/images/maps/regions/crossroads.png",
    "localMapImage": "/images/maps/local/crossroads_detail.png",
    "worldMapBounds": { "x": 100, "y": 150, "width": 200, "height": 180 }
  },

  "titleDisplay": {
    "fontTag": "friendly_town",
    "subtitle": "A Peaceful Frontier"
  },

  "childLocations": ["starting_inn", "town_square", "blacksmith"],
  "neighborRegions": ["darkwood", "mountain_pass"]
}
```

### Location Font Tags

Custom fonts for location title animations.

**File: `ui/location_fonts.json`**

```json
{
  "fontTags": {
    "friendly_town": {
      "fontFamily": "'Cinzel', serif",
      "color": "#ffd700",
      "textShadow": "0 0 20px rgba(255, 215, 0, 0.5)"
    },
    "hostile_area": {
      "fontFamily": "'Creepster', cursive",
      "color": "#dc2626",
      "textShadow": "0 0 20px rgba(220, 38, 38, 0.5)"
    },
    "hostile_forest": {
      "fontFamily": "'MedievalSharp', cursive",
      "color": "#22c55e"
    },
    "dungeon": {
      "fontFamily": "'Pirata One', cursive",
      "color": "#a855f7"
    },
    "mystical": {
      "fontFamily": "'Uncial Antiqua', cursive",
      "color": "#06b6d4"
    },
    "corrupted": {
      "fontFamily": "'Nosifer', cursive",
      "color": "#7c3aed"
    }
  },
  "defaultFont": "friendly_town"
}
```

### Unlock Requirement Types

| Type | Description | Example |
|------|-------------|---------|
| `level` | Player level | `{ "type": "level", "value": 5 }` |
| `quest_complete` | Quest finished | `{ "type": "quest_complete", "quest": "main_quest_1" }` |
| `npc_relationship` | NPC stat check | `{ "type": "npc_relationship", "npc": "hermit", "stat": "trust", "value": 50 }` |
| `item_possession` | Has item | `{ "type": "item_possession", "item": "forest_key" }` |
| `stat` | Player stat | `{ "type": "stat", "stat": "corruption", "operator": ">=", "value": 30 }` |
| `addiction` | Addiction stage | `{ "type": "addiction", "substance": "bliss", "stage": "dependent" }` |
| `title` | Has title | `{ "type": "title", "titleId": "hero_of_crossroads" }` |
| `mark` | Has mark | `{ "type": "mark", "markId": "slave_brand" }` |
| `flag` | Game flag set | `{ "type": "flag", "flag": "opened_secret_door" }` |
| `visited_location` | Been somewhere | `{ "type": "visited_location", "location": "elder_tree" }` |
| `fame` | Fame level | `{ "type": "fame", "operator": ">=", "value": 500 }` |
| `infamy` | Infamy check | `{ "type": "infamy", "infamyType": "slut", "value": 50 }` |

### Combining Requirements

Use `and` or `or` to combine multiple conditions:

```json
{
  "unlockRequirements": {
    "type": "and",
    "conditions": [
      { "type": "level", "value": 10 },
      { "type": "quest_complete", "quest": "prove_worthy" }
    ]
  }
}
```

```json
{
  "unlockRequirements": {
    "type": "or",
    "conditions": [
      { "type": "item_possession", "item": "master_key" },
      { "type": "stat", "stat": "lockpicking", "operator": ">=", "value": 80 }
    ]
  }
}
```

### Location Title Animation

When entering a new location, an animated title displays with:
- Fade in (0.5s)
- Hold (2.5s)
- Fade out (1s)

The font style is determined by the location's `titleDisplay.fontTag`.

### UnlockSystem API

```javascript
class UnlockSystem {
  // Check if location is unlocked
  checkLocationUnlock(location, playerState)
  // Returns: { unlocked: boolean, requirements: [], metRequirements: [] }

  // Evaluate a single requirement
  evaluateRequirement(requirement, playerState)
  // Returns: boolean

  // Get human-readable requirement text
  getRequirementDescription(requirement)
  // Returns: string (e.g., "Reach level 10")

  // Check if location can be discovered while exploring
  canDiscoverLocation(location, playerState, currentLocation)
  // Returns: boolean

  // Process exploration to potentially discover locations
  processExploration(currentLocation, playerState, locationData)
  // Returns: { discovered: [locationIds] }
}
```

### LocationSystem API

```javascript
class LocationSystem {
  // Get all locations in a region
  getRegionLocations(regionId)

  // Get accessible neighbors from current location
  getAccessibleNeighbors(locationId, playerState)

  // Get all regions with their unlock status
  getRegionsWithStatus(playerState)

  // Handle travel to destination
  travelTo(destinationId, playerState)

  // Get locations discoverable from current position
  getDiscoverableLocations(currentLocation, playerState)
}
```

### Player State Extensions for Travel

```javascript
{
  currentLocation: "starting_inn",
  currentRegion: "crossroads",
  visitedLocations: ["starting_inn"],
  visitedRegions: ["crossroads"],
  unlockedLocations: ["starting_inn", "town_square"],
  unlockedRegions: ["crossroads"],
  discoveredLocations: []
}
```

---

## 8. Creating Enemies

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

## 9. Creating NPCs & Merchants

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

## 10. Merchant System

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

## 11. Fame, Titles & Infamy

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

## 12. Local/Global Reputation & Rumor System

The reputation system tracks fame and infamy both locally (per-location) and globally. Rumors about the player can spread between locations, and NPCs may confront the player about them.

### Core Concepts

**Local Reputation**: Each inhabited location tracks its own fame/infamy for the player. This affects how NPCs at that location treat them.

**Global Reputation**: Calculated as a weighted average of all local reputations. Weight factors include location size, markets, and buildings.

**Rumors**: Events can create rumors that spread between locations. NPCs may mention these rumors when the player interacts with them.

### Location Reputation Properties

Add these properties to locations for reputation tracking:

```json
{
  "id": "crossroads_town",
  "name": "Crossroads Town Square",
  "tags": ["town", "safe", "shop", "inhabited"],

  "inhabited": true,
  "largeLocation": true,
  "markets": 2,
  "buildings": 8
}
```

| Field | Type | Description |
|-------|------|-------------|
| `inhabited` | boolean | Has residents who spread rumors |
| `largeLocation` | boolean | Major hub (2x reputation weight) |
| `markets` | number | Market count (+5% weight each) |
| `buildings` | number | Building count (+1% weight each) |

### Player State Extensions

```javascript
// Per-location reputation
localReputation: {
  "crossroads_town": {
    fame: 0,                    // -100 to 100
    infamy: { slut: 0, criminal: 0, corrupted: 0 },
    visitCount: 0,
    lastVisit: null,
    knownBy: []                 // NPC IDs who know the player
  }
},

// Active rumors
rumors: [
  {
    id: "rumor_001",
    type: "slut",               // slut, criminal, corrupted, heroic, mysterious
    text: "sleeps with anyone for coin",
    severity: 50,               // 0-100
    originLocation: "starting_inn",
    originEvent: "caught_scene",
    spreadLocations: ["crossroads_town"],
    dateCreated: 1234567890,
    canBeClearedWith: "fame",
    clearDifficulty: 30,
    lastMentioned: null,
    mentionCount: 0,
    acknowledged: false
  }
],

// Per-NPC cooldown for rumor mentions
rumorCooldowns: {
  "innkeeper_mary": 1234567890
}
```

### NPC NSFW Properties

Add these to merchant/NPC definitions for rumor confrontation handling:

```json
{
  "id": "witch_morrigan",
  "name": "Morrigan the Witch",
  "nsfwEnabled": true,
  "canBeSeduced": true,
  "seductionDifficulty": 60,
  "rumorAwareness": 0.9
}
```

| Field | Type | Description |
|-------|------|-------------|
| `nsfwEnabled` | boolean | Can engage in NSFW content |
| `canBeSeduced` | boolean | Player can attempt seduction |
| `seductionDifficulty` | number | Difficulty to seduce (0-100) |
| `rumorAwareness` | number | Chance NPC mentions rumors (0-1) |

### Rumor Types

| Type | Description | Clear Method |
|------|-------------|--------------|
| `slut` | Sexual reputation | High fame denial |
| `criminal` | Crime reputation | Intimidation or bribe |
| `corrupted` | Dark dealings | High fame denial |
| `heroic` | Positive deeds | Cannot be cleared |
| `mysterious` | Unknown origins | High fame denial |

### Rumor Confrontation Responses

When an NPC mentions a rumor, the player has several response options:

| Response | Requirement | Effect |
|----------|-------------|--------|
| **Ignore** | Always | No effect |
| **Deny** | 30+ Fame | May clear rumor if successful |
| **Stutter** | Always | Rumor severity increases |
| **Intimidate** | 20+ Criminal Infamy | Clears locally, increases criminal infamy |
| **Embrace** | 25+ Lewdness/Slut Infamy | Increases slut infamy |
| **Embrace + Seduce** | 40+ Lewdness + NPC seducible | Triggers seduction scene |
| **Bribe** | Gold (5x severity) | Clears at location (criminal rumors) |

### Rumor Templates

**File: `datapacks/core/rumors/rumor_templates.json`**

```json
{
  "rumorTemplates": {
    "slut": [
      { "text": "sleeps with anyone for a few coins", "severity": 40 },
      { "text": "was caught in a compromising position", "severity": 50 }
    ],
    "criminal": [
      { "text": "was seen stealing from a merchant", "severity": 45 }
    ]
  },
  "npcDialogue": {
    "slut": {
      "hostile": "Oh, you're that easy slut wandering around, aren't you?",
      "curious": "I've heard... interesting things about you.",
      "neutral": "Word travels fast. People talk, you know."
    }
  }
}
```

### Scene Effect Actions

Add rumors and modify local reputation from scene effects:

```json
{
  "type": "effect",
  "effects": [
    {
      "type": "add_rumor",
      "rumorType": "slut",
      "rumorText": "was caught with the merchant",
      "severity": 40
    },
    {
      "type": "modify_local_reputation",
      "reputationType": "slut",
      "value": 15,
      "reason": "Caught in compromising position"
    }
  ]
}
```

### ReputationSystem API

```javascript
class ReputationSystem {
  // Initialize with location data
  initialize(locations)

  // Record player visit
  recordVisit(playerState, locationId)

  // Modify local reputation
  modifyLocalReputation(playerState, locationId, type, amount, reason)
  // type: 'fame', 'slut', 'criminal', 'corrupted'

  // Get local reputation for a location
  getLocalReputation(playerState, locationId)

  // Get effective reputation (local if visited, global otherwise)
  getEffectiveReputation(playerState, locationId)

  // Update global from weighted local average
  updateGlobalReputation(playerState)

  // Spread reputation to neighbors over time
  spreadReputation(playerState, sourceLocationId, locations)

  // Decay old reputation
  decayReputation(playerState, daysPassed)

  // Get reputation summary for pause menu
  getReputationSummary(playerState)
}
```

### RumorSystem API

```javascript
class RumorSystem {
  // Add a rumor from an event
  addRumor(playerState, rumorData)

  // Get rumors known at a location
  getRumorsAtLocation(playerState, locationId)

  // Check if NPC should mention a rumor
  shouldMentionRumor(playerState, npc, locationId)

  // Get response options based on player stats
  getRumorResponseOptions(playerState, rumor, npc)

  // Process player's response to a rumor
  processRumorResponse(playerState, rumor, responseId, npc)

  // Get NPC dialogue for mentioning a rumor
  getRumorDialogue(rumor, npc)

  // Spread rumors to neighboring locations
  spreadRumors(playerState, locations)

  // Decay rumors over time
  decayRumors(playerState, daysPassed)

  // Get rumors summary for pause menu
  getRumorsSummary(playerState)
}
```

### Reputation Weight Calculation

```
Base weight = 1.0
Large location = 2.0x multiplier
Each market = +5% weight
Each building = +1% weight

Example: Town Square (large, 2 markets, 8 buildings)
Weight = 1.0 × 2.0 + (2 × 0.05) + (8 × 0.01) = 2.18
```

### Rumor Spread Mechanics

1. Rumors start at their origin location
2. Each time tick, rumors may spread to neighboring inhabited locations
3. Spread chance based on severity (50% at max severity)
4. Large locations spread rumors faster (10% vs 5% per tick)
5. Rumors decay 1 severity per day
6. Rumors with 0 severity and no spread locations are removed

### Configuration

```javascript
// ReputationSystem config
config: {
  baseWeight: 1.0,
  largeLocationMultiplier: 2.0,
  marketWeightBonus: 0.05,
  buildingWeightBonus: 0.01,
  spreadRateLarge: 0.10,
  spreadRateSmall: 0.05,
  decayRate: 0.01
}

// RumorSystem config
config: {
  baseConfrontationChance: 0.3,
  cooldownDuration: 300000,      // 5 minutes
  severityDecayPerDay: 1,
  minSeverityToMention: 10,
  spreadChancePerTick: 0.2,
  maxRumorAge: 2592000000,       // 30 days
  skipAfterAcknowledgements: 3
}
```

---

## 13. Location Services (Church, Clinic, Nursery)

The Location Services system provides specialized healing and treatment options at specific location types. Each service type handles different conditions.

### Service Types and What They Treat

| Service Type | Location Tags | Conditions Treated |
|-------------|--------------|-------------------|
| **Church** | `church`, `temple` | Curses, magical hypnosis, magical debuffs, corruption |
| **Clinic** | `clinic`, `hospital` | STDs, addictions, technological hypnosis (visor), conditioning, abortions |
| **Nursery** | `nursery`, `birthing_center` | Egg laying, giving birth, pregnancy checkups |

### Location Configuration

Add service tags and configuration to locations:

```json
{
  "id": "temple",
  "name": "Temple of Light",
  "tags": ["safe", "temple", "church", "healing", "inhabited"],
  "services": {
    "church": {
      "curseRemovalCost": 100,
      "hypnosisRemovalCost": 150,
      "purificationCostPerPoint": 5,
      "charityWorkHours": 4,
      "creditPerHour": 25
    }
  }
}
```

```json
{
  "id": "crossroads_clinic",
  "name": "Healer's Rest Clinic",
  "tags": ["safe", "clinic", "hospital", "healing"],
  "services": {
    "clinic": {
      "stdTreatmentCost": 200,
      "addictionTreatmentCost": 500,
      "neuralDeprogrammingCost": 400,
      "terminationCost": 350,
      "checkupCost": 50,
      "healingCostPerHp": 2
    }
  }
}
```

```json
{
  "id": "crossroads_nursery",
  "name": "Mother's Blessing Nursery",
  "tags": ["safe", "nursery", "birthing_center"],
  "services": {
    "nursery": {
      "eggLayingCost": 100,
      "birthCost": 200,
      "checkupCost": 30,
      "postpartumCareCost": 150,
      "consultationCost": 25
    }
  }
}
```

### Church Services

| Service | Description | Alternative Payment |
|---------|-------------|---------------------|
| Remove Curse | Lift curses through holy rites | Charity work |
| Break Magical Hypnosis | Dispel magical enchantments | Charity work |
| Purify Corruption | Reduce corruption through ritual | Charity work |
| Remove Magical Debuffs | Dispel dark magic afflictions | Charity work |
| Make an Offering | Donate gold for blessings | - |
| Volunteer Service | Work to earn charity credit | Time |

### Clinic Services

| Service | Description |
|---------|-------------|
| Disease Treatment | Cure STDs and infections |
| Addiction Rehabilitation | Detox from substance addictions |
| Behavioral Therapy | Treat behavioral addictions |
| Neural Deprogramming | Remove technological hypnosis (visor, implants) |
| Cognitive Reconditioning | Remove conditioned responses |
| Pregnancy Termination | Abort (non-egg, trimester < 3) |
| Medical Checkup | Identify hidden health issues |
| Medical Healing | Restore HP |

### Nursery Services

| Service | Description |
|---------|-------------|
| Egg Laying Assistance | Safe delivery of eggs |
| Assisted Birth | Professional midwife assistance |
| Pregnancy Checkup | Monitor pregnancy health |
| Postpartum Recovery | Post-birth care and healing |
| Fertility Consultation | Fertility status information |

### Player State for Conditions

The following fields in PlayerStateSchema track conditions treated by services:

```javascript
nsfwStats: {
  curses: [],                    // Active curses (church)
  debuffs: [],                   // Includes magical debuffs (church)
  stds: {},                      // STD infections (clinic)
  behavioralAddictions: {},      // Behavioral patterns (clinic)
  mentalState: {
    hypnosisDepth: 0,
    hypnosisSource: 'magical' | 'technological' | null,
    hypnosisDevice: null,        // If from visor/device
    conditioning: []             // Conditioned responses (clinic)
  },
  pregnancy: {
    isPregnant: false,
    type: 'normal' | 'eggs' | 'parasitic' | 'demonic',
    trimester: 0,
    fetusCount: 1,
    eggCount: 0,
    complications: []
  }
},
substanceState: {
  addictions: {}                 // Substance addictions (clinic)
}
```

### Condition Routing Reference

| Condition Type | Service Location |
|---------------|------------------|
| `curse` | Church |
| `magical_hypnosis` | Church |
| `magical_debuff` | Church |
| `corruption` | Church |
| `std` | Clinic |
| `addiction` | Clinic |
| `behavioral_addiction` | Clinic |
| `tech_hypnosis` | Clinic |
| `visor_hypnosis` | Clinic |
| `conditioning` | Clinic |
| `abortion` | Clinic |
| `egg_laying` | Nursery |
| `birth` | Nursery |
| `pregnancy` | Nursery |

### Service Definitions Data File

Create `public/datapacks/core/services/location_services.json`:

```json
{
  "church": {
    "curseRemovalCost": 100,
    "hypnosisRemovalCost": 150,
    "purificationCostPerPoint": 5,
    "charityWorkHours": 4,
    "creditPerHour": 25,
    "maxPurificationPerVisit": 30
  },
  "clinic": {
    "stdTreatmentCost": 200,
    "addictionTreatmentCost": 500,
    "addictionTreatmentHours": 24,
    "behavioralTherapyCost": 300,
    "neuralDeprogrammingCost": 400,
    "terminationCost": 350,
    "checkupCost": 50,
    "healingCostPerHp": 2
  },
  "nursery": {
    "eggLayingCost": 100,
    "birthCost": 200,
    "checkupCost": 30,
    "postpartumCareCost": 150,
    "consultationCost": 25
  }
}
```

### Integration in Scenes

Add service triggers through scene effects:

```json
{
  "effects": [
    { "type": "add_curse", "curseId": "curse_of_lust", "severity": 50 },
    { "type": "add_std", "stdId": "common_infection", "severity": 30 },
    { "type": "set_hypnosis", "depth": 40, "source": "magical" },
    { "type": "set_hypnosis", "depth": 60, "source": "technological", "device": "mind_visor" },
    { "type": "set_pregnant", "type": "eggs", "eggCount": 3, "fatherType": "insect" }
  ]
}
```

---

## 14. Public Events, Discovery & Barring System

This system handles what happens when NSFW events occur in public, hidden location tags, and location access restrictions.

### Core Concepts

1. **Public Events**: NSFW actions (sex, birth, etc.) outside private areas can be witnessed
2. **Hidden Tags**: Location tags like `corrupted`, `blessed`, `cursed` are hidden until discovered
3. **Location Barring**: Locations can ban players who misbehave, with redemption tasks

### Public Event Processing

When NSFW events happen outside private locations:

```javascript
// Process a public NSFW event
const result = publicEventSystem.processPublicEvent(
  'public_birth',  // Event type
  location,        // Current location
  playerState,     // Player state
  { passedOut: false }  // Event details
);

// Result includes:
// - witnessed: boolean
// - witnesses: array of NPCs/passersby
// - rumors: generated rumors
// - infamyGains: local or global infamy
// - locationReactions: special reactions (barring, scenes)
```

### NSFW Event Types

| Event Type | Base Severity | Rumor Type | Infamy Type |
|------------|--------------|------------|-------------|
| `public_sex` | 30 | slut | slut |
| `public_birth` | 20 | mysterious | slut |
| `public_egg_laying` | 25 | mysterious | slut |
| `public_masturbation` | 15 | slut | slut |
| `public_nudity` | 10 | slut | slut |
| `public_transformation` | 25 | corrupted | corrupted |
| `public_corruption` | 35 | corrupted | corrupted |

### Witness Chance by Location

| Location Type | Base Chance |
|--------------|-------------|
| `city` | 80% |
| `town` | 70% |
| `tavern` | 70% |
| `inn` | 60% |
| `temple/church` | 60% |
| `village` | 50% |
| `road` | 30% |
| `path` | 20% |
| `forest` | 15% |
| `cave` | 10% |
| `dungeon` | 5% |

Modifiers: Night time -50%, peak hours +20%, large location +30%

### Hidden Tags System

Location tags can be hidden until discovered through various conditions:

```json
{
  "id": "remote_chapel",
  "tags": ["temple", "church"],
  "hiddenTags": {
    "corrupted": {
      "alwaysHidden": false,
      "discoveryConditions": {
        "interactions": {
          "type": "investigate",
          "min": 2,
          "max": 4
        }
      },
      "discoveryScene": "discover_corrupted_chapel",
      "discoveryMessage": "You discover a hidden basement..."
    }
  }
}
```

### Discovery Condition Types

| Condition | Description | Example |
|-----------|-------------|---------|
| `interactions` | Random count of specific action | Sleep 1-3 times |
| `quest` | Complete a specific quest | `"quest": "investigate_chapel"` |
| `stats` | Meet stat requirements | `"stats": { "skills.knowledge.arcana": 30 }` |
| `item` | Have a specific item | `"item": "ancient_key"` |
| `flag` | Have a world flag set | `"flag": "knows_secret"` |

### Always Visible Tags

These tags are never hidden:
- `town`, `village`, `city`, `forest`, `cave`, `dungeon`
- `inn`, `tavern`, `road`, `path`, `building`
- `outdoor`, `indoor`, `shop`, `market`
- `temple`, `church`, `clinic`, `nursery`

### Hidden Tag Types

These tags should be hidden until discovered:
- `corrupted`, `blessed`, `cursed`, `shady`
- `divine`, `haunted`, `safe`, `dangerous`
- `unique`, `secret`, `hidden`, `forbidden`
- `demonic`, `holy`, `tainted`, `purified`

### Location NSFW Reactions

Locations can define custom reactions to NSFW events:

```json
{
  "nsfwReactions": {
    "public_sex": {
      "scene": "chapel_offering",
      "conditions": {
        "hasDiscoveredTag": "corrupted"
      },
      "infamyModifier": 0.3
    },
    "experiment": {
      "scene": "shady_clinic_experiment",
      "conditions": {
        "playerStat": { "stat": "currentHp", "max": 20 },
        "random": 0.4
      }
    }
  }
}
```

### Witness Configuration

Custom witness chances per location:

```json
{
  "witnessConfig": {
    "baseChance": 0.4,
    "npcWitnessChance": 0.8
  }
}
```

### Location Barring

Players can be barred from locations for misbehavior. All time-based redemption tasks use in-game days rather than real-time.

```javascript
// Barring increases with each offense
// Churches: 5% base + 10% per offense
// More severe events have higher bar chance

// Redemption tasks are generated based on offenses:
{
  "redemptionTasks": [
    { "type": "gold", "amount": 100, "paid": false },
    { "type": "charity", "days": 2, "completed": 0 },
    { "type": "quest", "questId": "church_redemption" },
    { "type": "time", "days": 7, "startedOnDay": null }
  ]
}
```

### Redemption Task Types

| Type | Description | Completion |
|------|-------------|------------|
| `gold` | Pay a gold fine | Automatic when paid |
| `charity` | Perform community service | Days of volunteer work |
| `quest` | Complete a specific quest | Quest must be finished |
| `time` | Wait a number of in-game days | Automatic after days pass |

### Player State Fields

```javascript
// Revealed hidden tags
revealedTags: {
  "remote_chapel": ["corrupted"]
},

// Interaction tracking
locationInteractions: {
  "blessed_clearing": {
    visits: 3, sleeps: 2, searches: 0
  }
},

// Location bans
locationBans: {
  "temple": {
    banned: true,
    reason: "public_indecency",
    redemptionTasks: [...]
  }
},

// Discovery progress
discoveryProgress: {
  "blessed_clearing": {
    "blessed": {
      interactionsRequired: 2,
      currentInteractions: 1,
      discovered: false
    }
  }
}
```

### Reputation Impact

- **Inhabited locations**: Local infamy increases (slow burn)
- **Wilderness**: Global infamy increases (smaller impact)
- **Churches**: 1.5x infamy multiplier
- **Divine locations**: 1.8x multiplier
- **Corrupted/shady**: 0.5x multiplier (they approve)

### Example: Corrupted Church Flow

1. Player visits St. Aldric's Chapel (tags show: `temple`, `church`, `???`)
2. Player investigates 2-4 times (random requirement)
3. Discovery scene plays, reveals `corrupted` tag
4. Player does NSFW act in front of chapel
5. Corrupted church reacts with `corrupted_interest` scene instead of barring
6. Player gains less infamy (corrupted locations are more accepting)

### Example: Blessed Clearing Flow

1. Player visits Moonlit Clearing (tags show: `forest`, `outdoor`, `???`, `???`)
2. Player sleeps there 1-3 times (random requirement)
3. Discovery: "This clearing must be blessed!" - reveals `blessed` tag
4. Player visits 3-5 more times
5. Discovery: "It's safe here." - reveals `safe` tag
6. Both hidden tags now visible

---

## 15. Creating Items

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

## 16. Inventory System

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

## 17. Loot Tables

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

## 18. Effects & Status System

All effects use turn-based or action-based durations (no real-time).

### Duration Types

| Type | Description | Tick Event |
|------|-------------|------------|
| `turns` | X combat turns | End of each turn |
| `actions` | X player actions (explore, talk, etc.) | Each action |
| `days` | X rest cycles | On rest |
| `locationChanges` | X location transitions | On travel |
| `permanent` | Until manually removed | Never |
| `untilRest` | Removed when resting | On rest |
| `untilCombatEnd` | Removed after combat | Combat end |
| `untilCondition` | Removed when condition met | Checked each tick |
| `uses` | X uses then removed | On use |

### Buff Effect

```json
{
  "id": "strength_up",
  "name": "Strength Up",
  "icon": "💪",
  "type": "buff",

  "duration": { "type": "turns", "value": 5 },

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

  "duration": { "type": "turns", "value": 3 },

  "triggers": {
    "onTurnEnd": [
      {
        "action": { "type": "damage", "amount": 5, "damageType": "poison" }
      }
    ]
  },

  "stacking": { "behavior": "stack", "maxStacks": 5 }
}
```

### Long-Term Effect

```json
{
  "id": "blessed",
  "name": "Blessed",
  "icon": "✨",
  "type": "buff",

  "duration": { "type": "days", "value": 3 },

  "modifiers": [
    { "stat": "luck", "operation": "flat", "value": 5 }
  ]
}
```

### Restraint Effect

```json
{
  "id": "rope_bound",
  "name": "Bound",
  "type": "restraint",

  "duration": { "type": "untilCondition" },
  "removeCondition": { "type": "statGreaterThan", "stat": "escapeProgress", "value": 100 },

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

## 19. Substance System

All substance timing uses turn-based durations (actions, turns, days) rather than real-time milliseconds.

### Delivery Methods

| Method | Blocked By |
|--------|------------|
| `inhalant` | Gas masks |
| `consumable` | Antidotes |
| `injectable` | Armor |
| `contact` | Hazmat suits |
| `ambient` | Sealed areas |

### Duration Types

| Type | Description | Example |
|------|-------------|---------|
| `actions` | Player actions (explore, rest, talk) | Default for most substances |
| `turns` | Combat turns | Combat-focused substances |
| `days` | Rest cycles / in-game days | Long-acting substances |
| `hours` | Abstract in-game hours | Calculated as `day * 24 + hour` |

### Substance Definition

```json
{
  "id": "bliss_inhaler",
  "name": "Bliss Inhaler",
  "deliveryMethod": "inhalant",
  "category": "aphrodisiac",

  "timing": {
    "durationType": "actions",
    "onsetDuration": 1,
    "peakDuration": 3,
    "plateauDuration": 5,
    "comedownDuration": 3,
    "aftermathDuration": 4,
    "totalDuration": 16
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
    "addictionGainPerUse": 5,
    "withdrawalEffects": {
      "mild": {
        "statModifiers": { "willpower": -2 },
        "durationDays": 1
      },
      "severe": {
        "statModifiers": { "willpower": -10, "stamina": -20 },
        "durationDays": 3
      }
    }
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

## 20. Encounter System

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

## 21. Paperdoll System

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

## 22. Player State Schema

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

## 23. Condition Reference

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

## 24. Effect Actions Reference

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

## 25. Adding New Content

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

## 26. Performance & Optimization

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

### Time Values (Turn-Based)

This game uses turn-based timing, not real-time. All durations are expressed in game units:

| Unit | Description | When it ticks |
|------|-------------|---------------|
| `actions` | Player actions | Each explore, rest, talk, etc. |
| `turns` | Combat turns | Each combat round |
| `days` | In-game days | On rest/sleep |
| `locationChanges` | Location transitions | On travel |

**Example durations:**
- Short buff: 3-5 actions
- Combat poison: 3 turns
- Long-term blessing: 3 days
- Location barring: 7+ days

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
