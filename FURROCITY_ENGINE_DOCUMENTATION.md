# Furrocity Engine - Complete Documentation

> **Version:** 0.1.0  
> **Engine:** Furrocity Engine (based on NSFW RPG Engine v2)  
> **Authors:** Cotton Le Sergal & Shluggo

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Game Configuration](#2-game-configuration)
3. [Creating Scenes](#3-creating-scenes)
4. [Creating Locations](#4-creating-locations)
5. [Creating Enemies](#5-creating-enemies)
6. [Creating NPCs & Merchants](#6-creating-npcs--merchants)
7. [Creating Items](#7-creating-items)
8. [Loot Tables](#8-loot-tables)
9. [Effects & Status System](#9-effects--status-system)
10. [Substance System](#10-substance-system)
11. [Encounter System](#11-encounter-system)
12. [Paperdoll System](#12-paperdoll-system)
13. [Player State Schema](#13-player-state-schema)
14. [Condition Reference](#14-condition-reference)
15. [Effect Actions Reference](#15-effect-actions-reference)

---

## 1. Project Structure

```
nsfw-rpg-game/
├── src/
│   ├── main.jsx           # React entry point
│   ├── App.jsx            # Age gate + error boundary
│   ├── Game.jsx           # Main game component (6000+ lines)
│   └── GameConfig.js      # GAME CONFIGURATION FILE
│
├── engine/                # Core systems (don't modify unless advanced)
│   ├── index.js           # Exports
│   ├── DataRegistry.js    # Content loading
│   ├── SceneRunner.js     # Dialogue/narrative engine
│   ├── CombatSystem.js    # Combat mechanics
│   ├── EffectSystem.js    # Buffs/debuffs
│   ├── SubstanceSystem.js # Drugs/addiction
│   ├── EncounterSystem.js # Random encounters
│   ├── InventorySystem.js # Items/equipment
│   ├── PaperdollSystem.js # Character visuals
│   ├── PlayerStateSchema.js # Player data structure
│   └── SaveSystem.js      # Save/load
│
├── public/
│   ├── content/           # GAME CONTENT (JSON)
│   │   ├── manifest.json  # Content index
│   │   ├── scenes/        # Dialogue & narrative
│   │   ├── items/         # Weapons, armor, clothing
│   │   ├── enemies/       # Enemy definitions
│   │   ├── locations/     # World areas
│   │   ├── effects/       # Status effects
│   │   └── substances/    # Drugs & addiction
│   │
│   └── images/            # GAME IMAGES
│       ├── characters/
│       ├── locations/
│       ├── items/
│       └── paperdoll/
│
├── package.json
├── vite.config.js
└── index.html
```

### Content Manifest

All content must be registered in `public/content/manifest.json`:

```json
{
  "version": "2.0.0",
  "contentTypes": {
    "scenes": {
      "path": "scenes/",
      "files": ["intro_scenes.json", "tavern_scenes.json", "forest_scenes.json"]
    },
    "items": {
      "path": "items/",
      "files": ["weapons.json", "armor.json", "clothing.json", "consumables.json"]
    },
    "enemies": {
      "path": "enemies/",
      "files": ["forest_enemies.json", "dungeon_enemies.json"]
    },
    "locations": {
      "path": "locations/",
      "files": ["world.json"]
    },
    "effects": {
      "path": "effects/",
      "files": ["core_effects.json", "combat_effects.json"]
    },
    "substances": {
      "path": "substances/",
      "files": ["drugs.json", "potions.json"]
    }
  }
}
```

---

## 2. Game Configuration

Edit `src/GameConfig.js` to customize your game:

### Game Info
```javascript
game: {
  title: "FURROCITY",                           // Main title
  subtitle: "Unleash your inner beast...",      // Tagline
  version: "0.1.0",                             // Version number
  engineName: "Furrocity Engine",               // Engine name
  copyright: {
    year: 2025,
    holders: "Cotton Le Sergal & Shluggo",
    allRightsReserved: true
  }
}
```

### Debug Mode
```javascript
debug: {
  enabled: true,               // Shows DEBUG MODE badge, enables all below
  showFPS: true,               // FPS counter
  showStateInspector: true,    // Player state panel
  logSceneTransitions: true,   // Console: scene changes
  logCombatActions: true,      // Console: combat math
  logSubstanceEffects: true,   // Console: drug calculations
  logEncounterRolls: true,     // Console: encounter chances
  skipAgeVerification: true,   // Skip 18+ gate
  unlockAllContent: false,     // Show all scenes regardless of tags
  godMode: false,              // Can't die
  infiniteGold: false,         // Unlimited money
  maxStats: false,             // All stats maxed
  quickSave: true              // F5 save, F9 load
}
```

### Display
```javascript
display: {
  theme: "dark",               // "dark", "light", "oled"
  accentColor: "#ff2d95",      // Primary color (pink)
  secondaryColor: "#d63384",   // Secondary color
  fontSize: "medium",          // "small", "medium", "large"
  animations: true,            // UI animations
  reducedMotion: false,        // Accessibility
  showTooltips: true,
  compactUI: false
}
```

### Gameplay
```javascript
gameplay: {
  defaultDifficulty: "normal",  // "easy", "normal", "hard", "nightmare"
  autoSaveInterval: 300000,     // 5 minutes in ms (0 = disabled)
  autoSaveOnTravel: true,
  maxSaveSlots: 20,
  enablePermadeath: false,
  showDamageNumbers: true,
  combatSpeed: "normal",        // "slow", "normal", "fast", "instant"
  textSpeed: "instant"          // "slow", "normal", "fast", "instant"
}
```

### Content Tags
```javascript
content: {
  defaultEnabledTags: ["vanilla", "clothing_damage", "restraint_escape"],
  alwaysEnabledTags: ["vanilla"],
  hiddenTags: [],
  showContentWarnings: true,
  warningTags: ["non_con", "gore", "death", "abuse"]
}
```

---

## 3. Creating Scenes

Scenes are the core narrative building blocks. They live in `public/content/scenes/`.

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
      "text": "You push open the tavern door. Warmth and the smell of ale wash over you.",
      "next": "bartender_greet"
    },
    "bartender_greet": {
      "type": "dialogue",
      "speaker": "bartender",
      "speakerName": "Greta",
      "portrait": "/images/characters/greta.png",
      "text": "Well, well! A new face. What can I get ya, stranger?",
      "next": "choice_response"
    },
    "choice_response": {
      "type": "choice",
      "text": "How do you respond?",
      "choices": [
        { 
          "text": "I'll have your strongest ale.", 
          "next": "order_ale" 
        },
        { 
          "text": "Just information, thanks.", 
          "next": "ask_info" 
        },
        { 
          "text": "[Flirt] Has anyone told you you've got beautiful eyes?", 
          "next": "flirt_attempt",
          "conditions": [{ "type": "stat_above", "stat": "charisma", "value": 6 }]
        },
        { 
          "text": "Never mind. I'm leaving.", 
          "next": "leave" 
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

#### Dialogue Node
```json
{
  "type": "dialogue",
  "speaker": "npc_id",           // or "narrator", "player", "unknown"
  "speakerName": "Display Name", // Optional override
  "portrait": "/images/npc.png", // Optional portrait
  "text": "What the NPC says.",
  "next": "next_node_id"
}
```

#### Choice Node
```json
{
  "type": "choice",
  "text": "Optional prompt text",
  "choices": [
    {
      "text": "Choice text shown to player",
      "next": "destination_node",
      "conditions": [],           // Optional: only show if conditions met
      "effects": [],              // Optional: apply effects when chosen
      "disabledText": "Requires higher charisma"  // Shown if conditions fail
    }
  ]
}
```

#### Branch Node (Auto-branch based on conditions)
```json
{
  "type": "branch",
  "branches": [
    {
      "conditions": [{ "type": "stat_above", "stat": "perception", "value": 8 }],
      "next": "notice_hidden_door"
    },
    {
      "conditions": [{ "type": "has_item", "itemId": "thieves_guild_badge" }],
      "next": "recognized_as_thief"
    },
    {
      "default": true,
      "next": "normal_path"
    }
  ]
}
```

#### Effect Node
```json
{
  "type": "effect",
  "effects": [
    { "type": "modify_stat", "stat": "gold", "value": -50 },
    { "type": "give_item", "itemId": "ale_strong" },
    { "type": "set_flag", "flag": "bought_ale_from_greta" },
    { "type": "modify_relationship", "npcId": "greta", "stat": "affection", "value": 5 }
  ],
  "next": "continue_scene"
}
```

#### Combat Node
```json
{
  "type": "combat",
  "enemies": ["goblin_warrior", "goblin_archer"],
  "canFlee": true,
  "fleeChance": 60,
  "onWin": "victory_node",
  "onLose": "defeat_node",
  "onFlee": "fled_node"
}
```

#### NSFW Node
```json
{
  "type": "nsfw",
  "tags": ["bondage", "non_con"],        // Scene won't play if tags disabled
  "alternativeNode": "skip_nsfw_node",   // Played if tags disabled
  "text": "Explicit content description...",
  "effects": [
    { "type": "modify_arousal", "value": 30 },
    { "type": "modify_corruption", "value": 5 },
    { "type": "orifice_use", "orifice": "mouth", "count": 1 }
  ],
  "next": "aftermath_node"
}
```

#### End Node
```json
{
  "type": "end",
  "returnToLocation": true,      // Return to location screen
  "nextScene": "another_scene",  // Or chain to another scene
  "teleportTo": "location_id"    // Optional: move player
}
```

### Scene Triggers

Scenes can be triggered in multiple ways:

```json
{
  "id": "random_forest_encounter",
  "triggerType": "encounter",              // "manual", "encounter", "onEnter", "timed"
  "triggerConditions": [
    { "type": "location_is", "locationId": "dark_forest" },
    { "type": "time_between", "start": 20, "end": 6 },
    { "type": "stat_below", "stat": "perception", "value": 5 }
  ],
  "triggerChance": 25,                     // 25% when conditions met
  "cooldown": 3600000,                     // Can't trigger again for 1 hour
  "maxTriggers": 3                         // Only triggers 3 times ever
}
```

---

## 4. Creating Locations

Locations define the game world. They live in `public/content/locations/`.

### Basic Location

```json
{
  "id": "rusty_tankard_tavern",
  "name": "The Rusty Tankard",
  "description": "A cozy tavern filled with the smell of ale and roasting meat. A fire crackles in the hearth.",
  "image": "/images/locations/tavern.png",
  "type": "building",
  "region": "millbrook_village",
  "tags": ["safe", "tavern", "rest", "shop", "social"],
  
  "connectedLocations": [
    "millbrook_square",
    "tavern_upstairs",
    "tavern_cellar"
  ],
  
  "actions": ["rest", "shop", "talk", "leave"],
  
  "npcs": ["greta_bartender", "tom_bard", "mysterious_stranger"],
  
  "scenes": {
    "onEnter": "tavern_enter_scene",
    "onRest": "tavern_rest_scene",
    "onFirstVisit": "tavern_intro"
  },
  
  "timeRestrictions": {
    "open": 6,
    "close": 2
  },
  
  "encounterChance": 0,
  "passedOutEncounterModifier": 0
}
```

### Dangerous Location

```json
{
  "id": "dark_forest_depths",
  "name": "Deep Dark Forest",
  "description": "Ancient trees block out the sun. Strange sounds echo through the mist.",
  "image": "/images/locations/dark_forest.png",
  "type": "wilderness",
  "region": "darkwood",
  "tags": ["dangerous", "forest", "monster", "nsfw_encounters"],
  
  "connectedLocations": [
    "dark_forest_edge",
    "witch_cottage",
    "ancient_ruins"
  ],
  
  "encounterChance": 40,
  "passedOutEncounterModifier": 2.5,
  
  "encounterTables": {
    "combat": "forest_combat_table",
    "predatory": "forest_predatory_table",
    "lustful": "forest_lustful_table",
    "helpful": "forest_helpful_table"
  },
  
  "encounterTypeWeights": {
    "combat": 30,
    "predatory": 35,
    "lustful": 20,
    "helpful": 10,
    "ambient": 5
  },
  
  "timeModifiers": {
    "night": {
      "encounterChance": 1.8,
      "predatory": 2.0,
      "helpful": 0.3
    },
    "day": {
      "encounterChance": 0.6
    }
  },
  
  "statusModifiers": {
    "pheromone_emitting": {
      "encounterChance": 2.0,
      "lustful": 3.0,
      "predatory": 1.5
    },
    "bleeding": {
      "predatory": 2.5
    }
  },
  
  "ambientEffects": [
    {
      "effectId": "forest_spores",
      "chance": 10,
      "conditions": [{ "type": "not_effect", "effectId": "spore_immunity" }]
    }
  ]
}
```

### Safe Location

Safe locations have 0% encounter chance even when unconscious:

```json
{
  "id": "player_home",
  "name": "Your Home",
  "type": "building",
  "tags": ["safe", "home", "rest", "storage"],
  
  "isSafeZone": true,
  "encounterChance": 0,
  "passedOutEncounterModifier": 0,
  
  "features": {
    "bed": true,
    "storage": true,
    "wardrobe": true,
    "mirror": true
  },
  
  "actions": ["rest", "sleep", "storage", "change_clothes", "leave"]
}
```

### Location Types

| Type | Description | Base Encounter |
|------|-------------|----------------|
| `building` | Indoor structures | 0-10% |
| `town` | Urban areas | 5-15% |
| `wilderness` | Outdoor natural | 20-40% |
| `dungeon` | Underground/hostile | 40-60% |
| `dangerous` | High-risk areas | 50-80% |

---

## 5. Creating Enemies

Enemies define combat encounters. They live in `public/content/enemies/`.

### Basic Enemy

```json
{
  "id": "forest_wolf",
  "name": "Forest Wolf",
  "description": "A large gray wolf with hungry eyes.",
  "image": "/images/enemies/wolf.png",
  "type": "beast",
  "tags": ["beast", "wolf", "forest", "common"],
  
  "level": 3,
  "stats": {
    "maxHp": 45,
    "attack": 12,
    "defense": 5,
    "speed": 15,
    "accuracy": 75,
    "evasion": 20
  },
  
  "resistances": {
    "physical": 0,
    "fire": -20,
    "ice": 10,
    "poison": 20
  },
  
  "skills": [
    { "id": "bite", "weight": 50 },
    { "id": "claw_swipe", "weight": 30 },
    { "id": "howl", "weight": 20, "conditions": [{ "type": "hp_below_percent", "value": 50 }] }
  ],
  
  "experienceReward": 35,
  "goldDrop": { "min": 0, "max": 5 },
  "lootTable": "wolf_loot"
}
```

### Enemy AI

```json
{
  "id": "goblin_shaman",
  "name": "Goblin Shaman",
  
  "ai": {
    "type": "support",
    "priorities": [
      {
        "condition": "ally_hp_below_50",
        "action": "heal_ally",
        "weight": 90
      },
      {
        "condition": "no_buff_on_allies",
        "action": "buff_allies",
        "weight": 70
      },
      {
        "condition": "player_has_buff",
        "action": "dispel",
        "weight": 60
      },
      {
        "condition": "default",
        "action": "attack",
        "weight": 30
      }
    ],
    
    "fleeThreshold": 15,
    "fleeChance": 80,
    "callForHelp": true,
    "callRange": 2
  }
}
```

### NSFW Enemy Behavior

```json
{
  "id": "lust_demon",
  "name": "Lust Demon",
  "type": "demon",
  "tags": ["demon", "nsfw", "seduction", "non_con"],
  
  "nsfwBehavior": {
    "enabled": true,
    "requiredTags": ["monster", "demon"],
    
    "arousalAttacks": [
      {
        "id": "seductive_touch",
        "name": "Seductive Touch",
        "type": "arousal",
        "targetAreas": ["chest", "thighs", "groin"],
        "arousalDamage": 20,
        "accuracy": 85,
        "conditions": [
          { "type": "target_arousal_below", "value": 80 }
        ],
        "effects": [
          { "type": "apply_effect", "effectId": "aroused", "duration": 30000 }
        ]
      },
      {
        "id": "mind_fog",
        "name": "Mind Fog",
        "type": "debuff",
        "willpowerDamage": 5,
        "effects": [
          { "type": "apply_effect", "effectId": "suggestible", "duration": 60000 }
        ]
      }
    ],
    
    "grapplingEnabled": true,
    "grappleChance": 30,
    "grappleType": "seductive_hold",
    "grappleStrength": 15,
    
    "clothingTargeting": {
      "enabled": true,
      "preferredSlots": ["chest", "groin", "underwear"],
      "stripChance": 25,
      "damageOnHit": 15
    },
    
    "onPlayerRestrained": {
      "actions": ["strip_clothing", "arousal_attack", "trigger_scene"],
      "triggerScene": "lust_demon_capture"
    },
    
    "onPlayerHighArousal": {
      "threshold": 80,
      "actions": ["trigger_scene"],
      "triggerScene": "lust_demon_seduction_success"
    },
    
    "onPlayerDefeated": {
      "sceneId": "lust_demon_victory",
      "conditions": [{ "type": "player_alive" }]
    }
  }
}
```

### Enemy Skills

```json
{
  "skills": [
    {
      "id": "power_attack",
      "name": "Power Attack",
      "type": "physical",
      "damage": { "base": 15, "scaling": { "stat": "attack", "ratio": 1.2 } },
      "accuracy": 70,
      "cooldown": 2,
      "effects": []
    },
    {
      "id": "poison_bite",
      "name": "Poison Bite",
      "type": "physical",
      "damage": { "base": 8, "scaling": { "stat": "attack", "ratio": 0.8 } },
      "accuracy": 85,
      "effects": [
        { "type": "apply_effect", "effectId": "poisoned", "chance": 60, "stacks": 2 }
      ]
    },
    {
      "id": "war_cry",
      "name": "War Cry",
      "type": "buff",
      "target": "all_allies",
      "effects": [
        { "type": "apply_effect", "effectId": "attack_up", "duration": 30000 }
      ],
      "cooldown": 5
    }
  ]
}
```

---

## 6. Creating NPCs & Merchants

### Basic NPC

```json
{
  "id": "greta_bartender",
  "name": "Greta",
  "title": "Bartender",
  "description": "A stout woman with kind eyes and a no-nonsense attitude.",
  "image": "/images/characters/greta.png",
  "type": "npc",
  "role": "merchant",
  "tags": ["human", "female", "merchant", "friendly"],
  
  "location": "rusty_tankard_tavern",
  
  "schedule": {
    "default": "rusty_tankard_tavern",
    "times": [
      { "start": 6, "end": 14, "location": "rusty_tankard_tavern" },
      { "start": 14, "end": 16, "location": "millbrook_market" },
      { "start": 16, "end": 2, "location": "rusty_tankard_tavern" },
      { "start": 2, "end": 6, "location": "greta_home" }
    ]
  },
  
  "dialogue": {
    "greeting": "Welcome back! What'll it be?",
    "greeting_first": "Well, well! A new face. What can I get ya?",
    "greeting_hostile": "You've got some nerve showing your face here.",
    "farewell": "Take care now!",
    "busy": "Give me a moment, will ya?"
  },
  
  "relationshipStats": {
    "affection": 0,
    "trust": 10,
    "respect": 5,
    "fear": 0,
    "lust": 0
  },
  
  "relationshipThresholds": {
    "friendly": { "affection": 30 },
    "close": { "affection": 60, "trust": 40 },
    "romantic": { "affection": 80, "trust": 60, "lust": 40 },
    "hostile": { "affection": -30 }
  },
  
  "scenes": {
    "talk": "greta_talk_scene",
    "gift": "greta_gift_scene"
  },
  
  "specialDialogue": [
    {
      "conditions": [{ "type": "relationship_above", "npcId": "greta", "stat": "affection", "value": 50 }],
      "greeting": "There's my favorite customer! The usual?"
    },
    {
      "conditions": [{ "type": "is_intoxicated", "minLevel": 50 }],
      "greeting": "Looks like you've had enough already, friend."
    },
    {
      "conditions": [{ "type": "has_flag", "flag": "saved_greta_sister" }],
      "greeting": "I can never thank you enough for what you did. Drinks are on the house!"
    }
  ]
}
```

### Merchant Configuration

```json
{
  "id": "blacksmith_hank",
  "name": "Hank",
  "role": "merchant",
  
  "merchant": {
    "type": "blacksmith",
    "buyTypes": ["weapon", "armor"],
    "sellTypes": ["weapon", "armor", "material"],
    
    "inventory": {
      "static": [
        { "itemId": "iron_sword", "stock": 3 },
        { "itemId": "iron_shield", "stock": 2 },
        { "itemId": "chainmail", "stock": 1 }
      ],
      "dynamic": {
        "table": "blacksmith_stock",
        "refreshInterval": 86400000,
        "slots": 5
      }
    },
    
    "priceModifiers": {
      "buyMultiplier": 1.0,
      "sellMultiplier": 0.4,
      "relationshipBonus": {
        "stat": "affection",
        "perPoint": 0.005,
        "maxBonus": 0.2
      }
    },
    
    "specialDeals": [
      {
        "conditions": [{ "type": "has_flag", "flag": "guild_member" }],
        "buyMultiplier": 0.9,
        "sellMultiplier": 0.5
      }
    ],
    
    "services": [
      {
        "id": "repair",
        "name": "Repair Equipment",
        "cost": { "type": "percent_value", "value": 0.25 },
        "action": "repair_all"
      },
      {
        "id": "upgrade",
        "name": "Upgrade Weapon",
        "cost": { "base": 100, "perLevel": 50 },
        "requirements": [{ "type": "has_item", "itemId": "upgrade_ore" }],
        "action": "upgrade_weapon"
      }
    ]
  }
}
```

### Shady Merchant (Sells Substances)

```json
{
  "id": "shady_dealer",
  "name": "???",
  "title": "Mysterious Figure",
  "role": "merchant",
  
  "location": "back_alley",
  "schedule": {
    "times": [{ "start": 22, "end": 5 }]
  },
  
  "merchant": {
    "type": "dealer",
    "buyTypes": ["substance", "contraband"],
    "sellTypes": ["substance", "contraband", "poison"],
    
    "inventory": {
      "static": [
        { "itemId": "bliss_inhaler", "stock": 5 },
        { "itemId": "mind_fog_pill", "stock": 3 },
        { "itemId": "pheromone_spray", "stock": 2 },
        { "itemId": "antidote_broad", "stock": 3 }
      ]
    },
    
    "priceModifiers": {
      "buyMultiplier": 1.5,
      "sellMultiplier": 0.3
    },
    
    "requiresTrust": {
      "stat": "trust",
      "minimum": 20,
      "failureDialogue": "I don't know you. Get lost."
    }
  },
  
  "specialDialogue": [
    {
      "conditions": [{ "type": "is_addicted", "substanceId": "bliss_inhaler", "minLevel": 60 }],
      "greeting": "Ah, a loyal customer. I've got something special for you..."
    }
  ]
}
```

---

## 7. Creating Items

Items live in `public/content/items/`.

### Item Types

| Type | Description | Equippable |
|------|-------------|------------|
| `weapon` | Swords, bows, staves | Yes (hands) |
| `armor` | Chest, legs, head protection | Yes |
| `clothing` | Regular/underwear/accessories | Yes |
| `consumable` | Potions, food, drugs | No (use) |
| `material` | Crafting materials | No |
| `key` | Keys for locks | No |
| `quest` | Quest items | No |
| `lewd` | Adult items/toys | Yes |

### Basic Weapon

```json
{
  "id": "steel_longsword",
  "name": "Steel Longsword",
  "description": "A well-crafted blade of tempered steel.",
  "image": "/images/items/steel_sword.png",
  "type": "weapon",
  "weaponType": "sword",
  "slot": "main_hand",
  "twoHanded": false,
  "rarity": "uncommon",
  "value": 150,
  
  "stats": {
    "attack": 15,
    "accuracy": 5,
    "critChance": 8
  },
  
  "scaling": {
    "strength": 1.2,
    "agility": 0.3
  },
  
  "requirements": {
    "level": 5,
    "stats": { "strength": 8 }
  },
  
  "tags": ["sword", "blade", "steel", "melee"]
}
```

### Armor

```json
{
  "id": "leather_armor",
  "name": "Leather Armor",
  "description": "Sturdy leather armor offering decent protection.",
  "image": "/images/items/leather_armor.png",
  "type": "armor",
  "armorType": "light",
  "slot": "chest",
  "rarity": "common",
  "value": 80,
  
  "stats": {
    "defense": 8,
    "evasion": 2
  },
  
  "resistances": {
    "physical": 5,
    "fire": -10
  },
  
  "movementPenalty": 0,
  
  "durability": {
    "max": 100,
    "current": 100,
    "degradeRate": 1
  }
}
```

### Clothing with Paperdoll

```json
{
  "id": "silk_panties_red",
  "name": "Red Silk Panties",
  "description": "Delicate silk underwear with lace trim.",
  "image": "/images/items/silk_panties.png",
  "type": "clothing",
  "category": "underwear",
  "slot": "underwear_lower",
  "rarity": "uncommon",
  "value": 35,
  
  "stats": {
    "charisma": 2
  },
  
  "tags": ["underwear", "panties", "silk", "sexy", "feminine"],
  
  "paperdollType": "panties",
  "paperdollImages": {
    "fullBody": "/images/paperdoll/clothing/panties/silk_red_fullbody.png",
    "groin": "/images/paperdoll/clothing/panties/silk_red_groin.png",
    "ass": "/images/paperdoll/clothing/panties/silk_red_ass.png"
  },
  
  "clothingState": {
    "maxIntegrity": 40,
    "currentIntegrity": 40,
    "exposureThreshold": 15,
    "damageImages": {
      "damaged": {
        "fullBody": "/images/paperdoll/clothing/panties/silk_red_damaged.png",
        "groin": "/images/paperdoll/clothing/panties/silk_red_groin_damaged.png"
      },
      "destroyed": {
        "fullBody": "/images/paperdoll/clothing/panties/silk_red_destroyed.png"
      }
    }
  }
}
```

### Consumable

```json
{
  "id": "health_potion",
  "name": "Health Potion",
  "description": "A red potion that restores health.",
  "image": "/images/items/health_potion.png",
  "type": "consumable",
  "consumableType": "potion",
  "rarity": "common",
  "value": 25,
  "stackable": true,
  "maxStack": 20,
  
  "useEffects": [
    { "type": "restore_hp", "value": 50 },
    { "type": "remove_effect", "effectId": "bleeding" }
  ],
  
  "useConditions": [
    { "type": "hp_below_max" }
  ],
  
  "useMessage": "You drink the potion. Warmth spreads through your body."
}
```

### Cursed Item

```json
{
  "id": "ring_of_submission",
  "name": "Ring of Submission",
  "description": "A silver ring that seems to pulse with dark energy.",
  "type": "accessory",
  "slot": "ring",
  "rarity": "epic",
  "value": 500,
  
  "stats": {
    "charisma": 8,
    "willpower": -5
  },
  
  "cursed": true,
  "curseType": "binding",
  "curseLevel": 3,
  "cannotUnequip": true,
  "curseRemovalDifficulty": 80,
  
  "curseEffects": [
    { "type": "apply_effect", "effectId": "submissive_aura", "permanent": true },
    { "type": "modify_resistance", "resistance": "charm", "value": -30 },
    { "type": "periodic_arousal", "value": 5, "interval": 600000 }
  ],
  
  "curseProgression": {
    "enabled": true,
    "stages": [
      { "time": 3600000, "effects": [{ "type": "modify_stat", "stat": "submission", "value": 10 }] },
      { "time": 86400000, "effects": [{ "type": "apply_effect", "effectId": "curse_stage_2" }] }
    ]
  },
  
  "curseLore": "Said to be crafted by a dark sorceress to enslave her victims..."
}
```

### Lockable Item

```json
{
  "id": "steel_chastity_belt",
  "name": "Steel Chastity Belt",
  "description": "A heavy steel belt with a secure lock.",
  "type": "clothing",
  "category": "lewd",
  "slot": "underwear_lower",
  "rarity": "rare",
  
  "lockable": true,
  "locked": false,
  "requiresKey": "chastity_key_steel",
  "lockDifficulty": 75,
  "cannotRemoveSelf": true,
  
  "whenEquipped": {
    "blocksSlots": ["genitals"],
    "blocksOrifice": ["vagina", "penis"],
    "preventsOrgasm": true,
    "effects": [
      { "type": "arousal_decay_reduction", "value": -75 }
    ]
  },
  
  "paperdollType": "chastity_belt",
  "paperdollImages": {
    "fullBody": "/images/paperdoll/lewd/chastity_belt.png",
    "groin": "/images/paperdoll/lewd/chastity_belt_groin.png"
  }
}
```

### Resistance Equipment

```json
{
  "id": "military_gas_mask",
  "name": "Military Gas Mask",
  "description": "Heavy-duty mask that filters airborne substances.",
  "type": "armor",
  "slot": "head",
  "rarity": "rare",
  "value": 300,
  
  "stats": {
    "perception": -2
  },
  
  "resistanceEffect": {
    "deliveryMethods": ["inhalant", "ambient"],
    "categories": ["all"],
    "value": 95,
    "quality": "permanent"
  },
  
  "paperdollType": "mask",
  "paperdollImages": {
    "head": "/images/paperdoll/equipment/gas_mask_head.png",
    "fullBody": "/images/paperdoll/equipment/gas_mask_body.png"
  }
}
```

### Item Rarity

| Rarity | Color | Drop Weight | Stat Bonus |
|--------|-------|-------------|------------|
| `common` | Gray | 100 | 0% |
| `uncommon` | Green | 50 | +10% |
| `rare` | Blue | 20 | +25% |
| `epic` | Purple | 8 | +50% |
| `legendary` | Orange | 2 | +100% |
| `mythical` | Red | 0.5 | +150% |

---

## 8. Loot Tables

Loot tables define what enemies drop and what containers hold.

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
      { "itemId": "raw_meat", "weight": 40, "count": 1 },
      { "itemId": "wolf_claw", "weight": 30, "count": { "min": 1, "max": 2 } },
      { "itemId": "beast_essence", "weight": 10, "count": 1 }
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
  "id": "dungeon_chest_tier2",
  "type": "container",
  
  "goldDrop": {
    "min": 50,
    "max": 150
  },
  
  "tiers": [
    {
      "weight": 60,
      "rarity": "common",
      "pools": ["weapons_common", "armor_common", "consumables_common"],
      "count": { "min": 1, "max": 2 }
    },
    {
      "weight": 30,
      "rarity": "uncommon",
      "pools": ["weapons_uncommon", "armor_uncommon"],
      "count": 1
    },
    {
      "weight": 8,
      "rarity": "rare",
      "pools": ["weapons_rare", "armor_rare", "accessories_rare"],
      "count": 1
    },
    {
      "weight": 2,
      "rarity": "epic",
      "pools": ["weapons_epic", "armor_epic"],
      "count": 1
    }
  ],
  
  "bonusRolls": [
    {
      "conditions": [{ "type": "stat_above", "stat": "luck", "value": 8 }],
      "extraRolls": 1,
      "rarityBonus": 10
    }
  ]
}
```

### Item Pool

```json
{
  "id": "weapons_uncommon",
  "type": "item_pool",
  
  "items": [
    { "itemId": "steel_sword", "weight": 20 },
    { "itemId": "steel_axe", "weight": 15 },
    { "itemId": "steel_mace", "weight": 15 },
    { "itemId": "hunting_bow", "weight": 20 },
    { "itemId": "oak_staff", "weight": 15 },
    { "itemId": "steel_dagger", "weight": 15 }
  ],
  
  "modifiers": {
    "prefixChance": 20,
    "suffixChance": 15,
    "prefixPool": "weapon_prefixes",
    "suffixPool": "weapon_suffixes"
  }
}
```

### Modifier Pools (for procedural items)

```json
{
  "id": "weapon_prefixes",
  "type": "modifier_pool",
  
  "modifiers": [
    {
      "id": "sharp",
      "name": "Sharp",
      "weight": 30,
      "statBonus": { "attack": { "type": "percent", "value": 10 } }
    },
    {
      "id": "heavy",
      "name": "Heavy",
      "weight": 25,
      "statBonus": { 
        "attack": { "type": "percent", "value": 15 },
        "speed": { "type": "flat", "value": -2 }
      }
    },
    {
      "id": "venomous",
      "name": "Venomous",
      "weight": 15,
      "rarity": "rare",
      "onHitEffect": { "effectId": "poisoned", "chance": 20 }
    },
    {
      "id": "vampiric",
      "name": "Vampiric",
      "weight": 5,
      "rarity": "epic",
      "onHitEffect": { "type": "lifesteal", "percent": 10 }
    }
  ]
}
```

### Merchant Stock Table

```json
{
  "id": "blacksmith_stock",
  "type": "merchant_stock",
  
  "refreshInterval": 86400000,
  
  "categories": [
    {
      "type": "weapon",
      "slots": 3,
      "rarityWeights": {
        "common": 50,
        "uncommon": 35,
        "rare": 15
      },
      "levelRange": { "min": -2, "max": 3 }
    },
    {
      "type": "armor",
      "slots": 2,
      "rarityWeights": {
        "common": 60,
        "uncommon": 30,
        "rare": 10
      }
    }
  ],
  
  "specialStock": [
    {
      "conditions": [{ "type": "has_flag", "flag": "blacksmith_quest_complete" }],
      "items": [{ "itemId": "masterwork_blade", "stock": 1, "refreshes": false }]
    }
  ]
}
```

---

## 9. Effects & Status System

Effects are buffs, debuffs, and status conditions. They live in `public/content/effects/`.

### Buff Effect

```json
{
  "id": "strength_up",
  "name": "Strength Up",
  "description": "Physical power is increased.",
  "icon": "💪",
  "type": "buff",
  "category": "stat_boost",
  
  "duration": {
    "type": "time",
    "value": 300000
  },
  
  "modifiers": [
    { "stat": "strength", "operation": "percent", "value": 25 },
    { "stat": "attack", "operation": "percent", "value": 15 }
  ],
  
  "stacking": {
    "behavior": "refresh",
    "maxStacks": 1
  },
  
  "visible": true,
  "dispellable": true,
  "dispelType": ["magic", "rest"]
}
```

### Debuff with Damage Over Time

```json
{
  "id": "poisoned",
  "name": "Poisoned",
  "description": "Taking damage over time from poison.",
  "icon": "☠️",
  "type": "debuff",
  "category": "damage_over_time",
  
  "duration": {
    "type": "time",
    "value": 60000,
    "tickInterval": 5000
  },
  
  "modifiers": [
    { "stat": "maxHp", "operation": "percent", "value": -5 }
  ],
  
  "onTick": {
    "damage": {
      "type": "poison",
      "value": 5,
      "scaling": { "perStack": 3 }
    },
    "message": "The poison burns through your veins..."
  },
  
  "stacking": {
    "behavior": "stack",
    "maxStacks": 5,
    "stackEffect": "intensity"
  },
  
  "resistedBy": "poison",
  "resistanceReduction": 0.5,
  
  "cleansedBy": ["antidote", "purify", "rest"],
  "visible": true
}
```

### Encounter-Modifying Effect

```json
{
  "id": "pheromone_emitting",
  "name": "Emitting Pheromones",
  "description": "Your body releases attractive pheromones.",
  "icon": "💗",
  "type": "status",
  "category": "nsfw",
  
  "duration": {
    "type": "time",
    "value": 1800000
  },
  
  "encounterModifiers": {
    "baseChanceModifier": 25,
    "passedOutModifier": 50,
    "typeWeights": {
      "lustful": 2.0,
      "predatory": 1.5,
      "helpful": 0.3
    },
    "attractsTypes": ["humanoid", "beast", "demon"]
  },
  
  "visible": true,
  "cleansedBy": ["shower", "cleanse", "time"]
}
```

### Restraint Effect

```json
{
  "id": "rope_bound",
  "name": "Bound",
  "description": "You are tied up with rope.",
  "icon": "🪢",
  "type": "restraint",
  "category": "bondage",
  "requiredTags": ["bondage"],
  
  "duration": {
    "type": "until_removed"
  },
  
  "restrictions": {
    "canMove": false,
    "canAttack": false,
    "canUseItems": false,
    "canCastSpells": false,
    "canDodge": false
  },
  
  "escapeOptions": [
    {
      "type": "struggle",
      "stat": "strength",
      "difficulty": 12,
      "damageOnFail": 5,
      "progressPerSuccess": 25
    },
    {
      "type": "wiggle",
      "stat": "agility",
      "difficulty": 10,
      "progressPerSuccess": 15
    },
    {
      "type": "magic",
      "requires": [{ "type": "has_skill", "skillId": "escape_artist" }],
      "autoSuccess": true
    }
  ],
  
  "escapeProgress": 0,
  "escapeThreshold": 100,
  
  "modifiers": [
    { "stat": "evasion", "operation": "flat", "value": -50 }
  ],
  
  "onApply": {
    "message": "Ropes tighten around your wrists and ankles!"
  },
  
  "onRemove": {
    "message": "You break free from the ropes!"
  }
}
```

### Arousal Effect

```json
{
  "id": "highly_aroused",
  "name": "Highly Aroused",
  "description": "Your body burns with desire.",
  "icon": "🔥",
  "type": "status",
  "category": "arousal",
  
  "applyConditions": [
    { "type": "arousal_above", "value": 70 }
  ],
  
  "removeConditions": [
    { "type": "arousal_below", "value": 50 }
  ],
  
  "modifiers": [
    { "stat": "willpower", "operation": "percent", "value": -20 },
    { "stat": "concentration", "operation": "percent", "value": -15 }
  ],
  
  "resistanceModifiers": [
    { "resistance": "seduction", "value": -25 },
    { "resistance": "charm", "value": -15 }
  ],
  
  "encounterModifiers": {
    "typeWeights": {
      "lustful": 1.5
    }
  },
  
  "periodicEffects": {
    "interval": 30000,
    "effects": [
      { "type": "modify_arousal", "value": 5 }
    ]
  }
}
```

---

## 10. Substance System

Substances are drugs, potions, and other consumable compounds. They live in `public/content/substances/`.

### Delivery Methods

| Method | Description | Blocked By |
|--------|-------------|------------|
| `inhalant` | Breathed in (gas, smoke) | Gas masks, respirators |
| `consumable` | Swallowed (pills, liquids) | Antidotes, stomach implants |
| `injectable` | Injected (needles, darts) | Armor, dermal implants |
| `contact` | Skin absorption | Hazmat suits, gloves |
| `ambient` | Environmental exposure | Full hazmat, sealed areas |
| `implant` | Internal release | Very hard to resist |

### Substance Categories

| Category | Effects | Addictiveness |
|----------|---------|---------------|
| `stimulant` | Energy, focus, aggression | Medium |
| `depressant` | Relaxation, reduced inhibitions | Medium |
| `hallucinogen` | Altered perception, confusion | Low |
| `aphrodisiac` | Arousal, lowered willpower | High |
| `sedative` | Drowsiness, suggestibility | Medium |
| `narcotic` | Pain relief, euphoria | Very High |
| `corruption` | Permanent corruption | Variable |
| `pheromone` | Attraction effects | Low |
| `antidote` | Provides resistance | None |
| `mutagen` | Body modifications | Variable |

### Full Substance Definition

```json
{
  "id": "bliss_inhaler",
  "name": "Bliss Inhaler",
  "description": "A popular street drug that induces euphoria and arousal.",
  "image": "/images/items/bliss_inhaler.png",
  
  "deliveryMethod": "inhalant",
  "category": "aphrodisiac",
  "tags": ["street_drug", "euphoric", "illegal", "common"],
  
  "rarity": "uncommon",
  "streetValue": 50,
  "legalStatus": "illegal",
  
  "intoxicationValue": 25,
  
  "dosing": {
    "standardDose": 1,
    "maxDosesBeforeOD": 4,
    "maxDosesBeforeDeath": 8,
    "doseDecayTime": 28800000,
    "stackable": true,
    "maxStacks": 3,
    "stackIntensity": 0.6
  },
  
  "timing": {
    "onsetDuration": 30000,
    "peakDuration": 300000,
    "plateauDuration": 600000,
    "comedownDuration": 300000,
    "aftermathDuration": 600000,
    "totalDuration": 1800000
  },
  
  "effects": {
    "onset": {
      "statModifiers": {
        "willpower": { "type": "flat", "value": -2 }
      },
      "statusEffects": ["tingling", "warming"],
      "messages": ["A warm tingling spreads through your body..."]
    },
    "peak": {
      "statModifiers": {
        "charisma": { "type": "percent", "value": 25 },
        "willpower": { "type": "flat", "value": -5 },
        "perception": { "type": "flat", "value": -3 }
      },
      "nsfwModifiers": {
        "arousal": { "type": "flat", "value": 30 },
        "arousalDecay": { "type": "percent", "value": -50 }
      },
      "statusEffects": ["euphoric", "pheromone_emitting", "lowered_inhibitions"],
      "encounterModifiers": {
        "passedOutChance": 15,
        "lustfulWeight": 1.5
      },
      "messages": ["Waves of pleasure wash over you. Everything feels amazing..."]
    },
    "plateau": {
      "statModifiers": {
        "charisma": { "type": "percent", "value": 15 },
        "willpower": { "type": "flat", "value": -3 }
      },
      "nsfwModifiers": {
        "arousal": { "type": "flat", "value": 15 }
      },
      "statusEffects": ["euphoric", "pheromone_emitting"]
    },
    "comedown": {
      "statModifiers": {
        "charisma": { "type": "flat", "value": -5 },
        "endurance": { "type": "flat", "value": -10 },
        "willpower": { "type": "flat", "value": -2 }
      },
      "statusEffects": ["fatigued", "craving"],
      "messages": ["The high fades, leaving you feeling drained..."]
    },
    "aftermath": {
      "statModifiers": {
        "endurance": { "type": "flat", "value": -5 }
      },
      "statusEffects": ["mild_fatigue"],
      "messages": ["The last effects wear off."]
    }
  },
  
  "toleranceScaling": {
    "buildsCategory": true,
    "minEffectiveness": 0.2,
    "toleranceGainPerUse": 8,
    "categoryToleranceGain": 3,
    "toleranceDecayPerHour": 2,
    "toleranceDecayDelay": 43200000
  },
  
  "addiction": {
    "addictiveness": 65,
    "addictionGainPerUse": 5,
    "maxAddictionGainPerDay": 15,
    "addictionDecayPerDay": 2,
    "addictionDecayDelay": 86400000,
    
    "withdrawalThresholds": {
      "casual": 86400000,
      "habitual": 43200000,
      "dependent": 21600000,
      "addicted": 10800000,
      "enslaved": 3600000
    },
    
    "withdrawalEffects": {
      "mild": {
        "triggerAddictionLevel": 20,
        "statModifiers": {
          "willpower": { "type": "flat", "value": -2 },
          "endurance": { "type": "flat", "value": -5 }
        },
        "statusEffects": ["craving", "irritable"],
        "duration": 86400000
      },
      "moderate": {
        "triggerAddictionLevel": 40,
        "statModifiers": {
          "willpower": { "type": "flat", "value": -5 },
          "endurance": { "type": "flat", "value": -10 },
          "strength": { "type": "flat", "value": -3 }
        },
        "statusEffects": ["strong_craving", "shaking", "sweating"],
        "duration": 172800000
      },
      "severe": {
        "triggerAddictionLevel": 70,
        "statModifiers": {
          "willpower": { "type": "flat", "value": -10 },
          "endurance": { "type": "flat", "value": -20 },
          "strength": { "type": "flat", "value": -5 },
          "agility": { "type": "flat", "value": -5 }
        },
        "statusEffects": ["desperate_craving", "tremors", "nausea", "hallucinations"],
        "periodicDamage": { "value": 2, "interval": 3600000 },
        "duration": 259200000
      },
      "extreme": {
        "triggerAddictionLevel": 90,
        "statModifiers": {
          "willpower": { "type": "flat", "value": -15 },
          "endurance": { "type": "flat", "value": -30 },
          "strength": { "type": "flat", "value": -10 }
        },
        "statusEffects": ["dying_need", "convulsions", "delirium"],
        "periodicDamage": { "value": 5, "interval": 1800000 },
        "canBeLethal": true,
        "lethalThreshold": 20,
        "duration": 345600000
      }
    }
  },
  
  "overdose": {
    "effects": {
      "statusEffects": ["unconscious", "vulnerable", "overdosed"],
      "duration": 3600000
    },
    "encounterModifiers": {
      "passedOutChance": 100,
      "predatoryWeight": 2.0,
      "opportunisticWeight": 2.5
    },
    "damage": {
      "type": "poison",
      "value": 20
    },
    "permanentEffects": [
      { "type": "modify_stat", "stat": "maxHp", "value": -5, "chance": 25 }
    ]
  },
  
  "interactions": [
    {
      "with": ["depressant", "sedative"],
      "effect": "dangerous",
      "modifyODThreshold": -2,
      "additionalEffects": ["respiratory_depression"]
    },
    {
      "with": ["stimulant"],
      "effect": "counteract",
      "reduceDuration": 0.5
    }
  ]
}
```

### Addiction Stages

| Stage | Level | Description |
|-------|-------|-------------|
| `none` | 0 | No addiction |
| `curious` | 1-19 | Slight interest, no penalties |
| `casual` | 20-39 | Occasional cravings, mild withdrawal |
| `habitual` | 40-59 | Regular use expected, moderate withdrawal |
| `dependent` | 60-79 | Severe withdrawal symptoms |
| `addicted` | 80-99 | Extreme dependency, dangerous withdrawal |
| `enslaved` | 100 | Cannot function without substance |

### Antidote/Resistance Item

```json
{
  "id": "antidote_broad",
  "name": "Broad Spectrum Antidote",
  "description": "A powerful antidote that provides temporary resistance to many substances.",
  
  "deliveryMethod": "consumable",
  "category": "antidote",
  
  "resistanceGrant": {
    "deliveryMethods": ["all"],
    "categories": ["all"],
    "value": 75,
    "duration": 7200000,
    "decayRate": 10
  },
  
  "clearsSubstances": {
    "enabled": true,
    "percentage": 50,
    "excludeCategories": ["corruption"]
  },
  
  "addiction": {
    "addictiveness": 0
  }
}
```

---

## 11. Encounter System

The encounter system determines random events based on location, time, and player state.

### How Encounters Work

1. Player enters location or time passes
2. Calculate base encounter chance from location
3. Apply player status modifiers (pheromones, intoxication, etc.)
4. Apply time-of-day modifier
5. Apply perception modifier
6. Roll against final chance
7. Determine encounter type (combat, predatory, etc.)
8. Select specific encounter from pool
9. Run encounter scene

### Encounter Types

| Type | Description | When |
|------|-------------|------|
| `combat` | Hostile fight | Normal exploration |
| `predatory` | Hostile with NSFW intent | Player vulnerable |
| `opportunistic` | Takes advantage | Player unconscious/restrained |
| `lustful` | Seductive encounter | High arousal/pheromones |
| `helpful` | Assists player | Low chance always |
| `ambient` | Environmental event | Random |
| `trap` | Dangerous situation | Certain locations |
| `social` | NPC interaction | Towns/buildings |

### Passed-Out Encounter Chances

| Location Type | Base Chance |
|---------------|-------------|
| Safe zones | 0% (always) |
| Town | 15% |
| Wilderness | 35% |
| Dungeon | 50% |
| Hostile | 75% |
| Dangerous | 90% |

### Status Effect Modifiers

| Status | Base Modifier | Passed Out Modifier | Type Weights |
|--------|--------------|---------------------|--------------|
| `pheromone_emitting` | +25% | +50% | lustful ×2, predatory ×1.5 |
| `vulnerability_aura` | +20% | +75% | predatory ×2.5, helpful ×0.3 |
| `marked_prey` | +40% | +100% | predatory guaranteed |
| `intoxication_obvious` | +15% | +35% | opportunistic ×1.8 |
| `bleeding` | +10% | +30% | predatory ×2 |
| `hidden` | -50% | -30% | all reduced |
| `protected` | -25% | -50% | predatory ×0.3, helpful ×2 |

### Encounter Table Definition

```json
{
  "id": "forest_predatory_encounters",
  "type": "encounter_table",
  "encounterType": "predatory",
  "location": "dark_forest",
  
  "entries": [
    {
      "sceneId": "forest_wolf_pack_ambush",
      "weight": 30,
      "conditions": [],
      "tags": ["beast", "non_con"]
    },
    {
      "sceneId": "forest_bandit_capture",
      "weight": 25,
      "conditions": [{ "type": "time_between", "start": 18, "end": 6 }],
      "tags": ["human", "bondage"]
    },
    {
      "sceneId": "forest_tentacle_plant",
      "weight": 20,
      "conditions": [{ "type": "arousal_above", "value": 50 }],
      "tags": ["tentacles", "plant"]
    },
    {
      "sceneId": "forest_fae_trickster",
      "weight": 15,
      "conditions": [{ "type": "corruption_above", "value": 30 }],
      "tags": ["fae", "hypnosis"]
    },
    {
      "sceneId": "forest_werewolf_hunt",
      "weight": 10,
      "conditions": [
        { "type": "is_full_moon" },
        { "type": "time_between", "start": 22, "end": 4 }
      ],
      "tags": ["werewolf", "transformation"]
    }
  ],
  
  "fallback": "forest_generic_predatory"
}
```

---

## 12. Paperdoll System

The paperdoll system renders layered character images.

### Body Regions

| Region | Description | Layer Count |
|--------|-------------|-------------|
| `fullBody` | Complete character | 28 layers |
| `head` | Face, hair, accessories | 19 layers |
| `torso` | Chest, stomach | 17 layers |
| `groin` | Genital area | 17 layers |
| `ass` | Rear view | 10 layers |
| `legs` | Upper and lower legs | 13 layers |
| `arms` | Arms and hands | 12 layers |
| `feet` | Feet closeup | 11 layers |

### Layer Order (Z-Index)

Lower = behind, Higher = in front

#### Full Body Layers
```
0  - base              // Naked body
1  - skin_details      // Freckles, beauty marks
2  - scars             // Scars
3  - tattoos           // Tattoos
4  - body_hair         // Body hair
5  - tan_lines         // Tan lines
6  - bruises           // Bruises/marks
7  - genitalia         // Genitals (if separate layer)
8  - piercings_body    // Body piercings
9  - lewd_internal     // Internal toys
10 - underwear_bottom  // Panties, briefs
11 - underwear_top     // Bras
12 - stockings         // Stockings, socks
13 - pants             // Pants, shorts
14 - shirt             // Shirts, tops
15 - skirt             // Skirts
16 - dress             // Dresses
17 - shoes             // Footwear
18 - gloves            // Gloves
19 - leg_armor         // Leg armor
20 - chest_armor       // Chest armor
21 - arm_armor         // Arm armor
22 - belt              // Belts
23 - jacket            // Jackets, coats
24 - cape              // Capes
25 - helmet            // Headwear
26 - mask              // Masks
27 - accessories       // Jewelry, etc.
28 - effects_overlay   // Sweat, fluids
29 - restraints        // Ropes, chains
```

### Paperdoll Type Mapping

```javascript
// How item paperdollType maps to layers
const PAPERDOLL_TYPE_MAPPING = {
  // Underwear
  "panties":       { fullBody: "underwear_bottom", groin: "panties" },
  "briefs":        { fullBody: "underwear_bottom", groin: "briefs" },
  "thong":         { fullBody: "underwear_bottom", groin: "thong", ass: "thong" },
  "bra":           { fullBody: "underwear_top", torso: "bra" },
  
  // Clothing
  "shirt":         { fullBody: "shirt", torso: "shirt" },
  "pants":         { fullBody: "pants", legs: "pants", groin: "pants" },
  "dress":         { fullBody: "dress", torso: "dress", legs: "dress" },
  "skirt":         { fullBody: "skirt", legs: "skirt", groin: "skirt" },
  "stockings":     { fullBody: "stockings", legs: "stockings", feet: "stockings" },
  
  // Armor
  "chest_armor":   { fullBody: "chest_armor", torso: "armor" },
  "leg_armor":     { fullBody: "leg_armor", legs: "armor" },
  "helmet":        { fullBody: "helmet", head: "helmet" },
  
  // Accessories
  "collar":        { fullBody: "accessories", head: "collar" },
  "earrings":      { head: "earrings" },
  "necklace":      { fullBody: "accessories", torso: "necklace" },
  
  // Lewd
  "chastity_cage": { groin: "chastity" },
  "chastity_belt": { fullBody: "underwear_bottom", groin: "chastity", ass: "chastity" },
  "butt_plug":     { ass: "plug", groin: "plug_front" },
  "nipple_clamps": { torso: "nipple_accessories" },
  
  // Effects
  "cum_overlay":   { fullBody: "effects_overlay", torso: "fluids", groin: "fluids", ass: "fluids" },
  "sweat":         { fullBody: "effects_overlay" },
  "blush":         { head: "blush", torso: "blush" },
  
  // Restraints
  "rope_arms":     { fullBody: "restraints", arms: "rope" },
  "rope_legs":     { fullBody: "restraints", legs: "rope" },
  "handcuffs":     { arms: "cuffs" },
  "collar_leash":  { fullBody: "restraints", head: "collar_leash" }
};
```

### Item with Paperdoll Definition

```json
{
  "id": "leather_corset",
  "name": "Black Leather Corset",
  "type": "clothing",
  "slot": "chest",
  
  "paperdollType": "corset",
  "paperdollImages": {
    "fullBody": {
      "default": "/images/paperdoll/clothing/corset_black.png",
      "damaged": "/images/paperdoll/clothing/corset_black_damaged.png",
      "destroyed": "/images/paperdoll/clothing/corset_black_destroyed.png"
    },
    "torso": {
      "default": "/images/paperdoll/clothing/corset_black_torso.png",
      "damaged": "/images/paperdoll/clothing/corset_black_torso_damaged.png"
    }
  },
  
  "paperdollTint": null,
  "paperdollAlpha": 1.0
}
```

### Damage States

| Integrity | State | Image Used |
|-----------|-------|------------|
| 100-50% | default | Normal image |
| 49-1% | damaged | Torn/damaged image |
| 0% | destroyed | Destroyed/minimal image |

---

## 13. Player State Schema

The complete player state structure with all queryable fields:

```javascript
const playerState = {
  // === IDENTITY ===
  id: "player_001",
  name: "Hero",
  
  // === PROGRESSION ===
  level: 1,
  experience: 0,
  experienceToLevel: 100,
  skillPoints: 0,
  
  // === CORE STATS ===
  stats: {
    strength: 5,      // Physical power, melee damage, carry weight
    vitality: 5,      // Max HP, HP regen
    agility: 5,       // Speed, evasion, crit chance
    endurance: 5,     // Max stamina, stamina regen
    intelligence: 5,  // Magic power, mana pool
    willpower: 5,     // Mental resistance, focus
    perception: 5,    // Detection, accuracy, awareness
    charisma: 5,      // Social, prices, seduction
    luck: 5           // Loot, crits, random events
  },
  
  // === RESOURCES ===
  currentHp: 100,
  maxHp: 100,
  currentStamina: 100,
  maxStamina: 100,
  currentMana: 50,
  maxMana: 50,
  gold: 0,
  
  // === RESISTANCES ===
  resistances: {
    // Damage types
    physical: 0,
    fire: 0,
    ice: 0,
    lightning: 0,
    poison: 0,
    holy: 0,
    dark: 0,
    psychic: 0,
    
    // Status resistances
    stun: 0,
    sleep: 0,
    paralysis: 0,
    charm: 0,
    fear: 0,
    confusion: 0,
    blind: 0,
    silence: 0,
    
    // NSFW resistances
    arousal: 0,
    seduction: 0,
    corruption: 0,
    hypnosis: 0,
    mindControl: 0,
    transformation: 0,
    addiction: 0,
    pheromones: 0,
    aphrodisiacs: 0
  },
  
  // === SUBSTANCE STATE ===
  substanceState: {
    activeSubstances: [
      // { substanceId, dosesInSystem, currentIntensity, phase, timeApplied, wearOffTime }
    ],
    
    addictions: {
      // [substanceId]: { level, stage, lastUseTime, totalUses, withdrawalActive, withdrawalSeverity }
    },
    
    tolerances: {
      // [substanceId]: { level, lastUseTime, peakTolerance }
      // ["_category_" + category]: { level }
    },
    
    resistances: [
      // { id, source, sourceId, deliveryMethods[], categories[], value, quality, duration, decayRate }
    ],
    
    status: {
      isIntoxicated: false,
      intoxicationLevel: 0,
      isBlackedOut: false,
      blackoutEndTime: null,
      isInWithdrawal: false,
      isOverdosing: false
    },
    
    daily: {
      dosesPerSubstance: {},
      lastResetTime: null
    },
    
    encounterModifiers: {
      passedOutEncounterChance: 0,
      activeModifiers: []
    }
  },
  
  // === NSFW STATS ===
  nsfwStats: {
    // Core meters (0-100)
    corruption: 0,
    purity: 100,
    arousal: 0,
    lust: 0,
    shame: 50,
    exhibitionism: 0,
    submission: 50,
    dominance: 50,
    masculinity: 50,
    femininity: 50,
    innocence: 100,
    depravity: 0,
    
    // Sensitivity by body part
    sensitivity: {
      lips: 20,
      tongue: 15,
      ears: 15,
      neck: 25,
      nipples: 30,
      chest: 20,
      stomach: 15,
      back: 15,
      hands: 10,
      arms: 10,
      thighs: 25,
      legs: 15,
      feet: 20,
      butt: 25,
      genitals: 50,
      prostate: 40,
      anus: 35
    },
    
    // Orifice tracking
    orificeStats: {
      mouth: {
        penetrationCount: 0,
        stretchLevel: 0,
        sensitivity: 30,
        trainingLevel: 0,
        virginityIntact: true,
        lastUsed: null,
        currentFluids: 0,
        tags: []
      },
      vagina: {
        penetrationCount: 0,
        stretchLevel: 0,
        sensitivity: 50,
        trainingLevel: 0,
        virginityIntact: true,
        lastUsed: null,
        currentFluids: 0,
        tags: []
      },
      anus: {
        penetrationCount: 0,
        stretchLevel: 0,
        sensitivity: 35,
        trainingLevel: 0,
        virginityIntact: true,
        lastUsed: null,
        currentFluids: 0,
        tags: []
      }
    },
    
    // Sexual history
    sexualHistory: {
      totalEncounters: 0,
      totalOrgasms: 0,
      totalOrgasmsDenied: 0,
      totalPartnersHuman: 0,
      totalPartnersMonster: 0,
      totalPartnersMachine: 0,
      oralGiven: 0,
      oralReceived: 0,
      vaginalGiven: 0,
      vaginalReceived: 0,
      analGiven: 0,
      analReceived: 0,
      gangbangCount: 0,
      publicEncounters: 0,
      uniquePartners: []
    },
    
    // Behavioral addictions
    behavioralAddictions: {
      sexAddiction: { level: 0, lastIndulged: null, withdrawalActive: false },
      submissionAddiction: { level: 0, lastIndulged: null, withdrawalActive: false },
      painAddiction: { level: 0, lastIndulged: null, withdrawalActive: false },
      exhibitionismAddiction: { level: 0, lastIndulged: null, withdrawalActive: false },
      orgasmAddiction: { level: 0, lastIndulged: null, withdrawalActive: false }
    },
    
    // Mental state
    mentalState: {
      mindControlLevel: 0,
      hypnosisDepth: 0,
      suggestionVulnerability: 0,
      brainwashingProgress: 0,
      conditioning: [],
      triggers: [],
      mantras: []
    },
    
    // Body modifications
    modifications: {
      tattoos: [],
      piercings: [],
      brandings: [],
      scars: [],
      implants: [],
      mutations: []
    }
  },
  
  // === COMBAT STATE ===
  combatState: {
    inCombat: false,
    isRestrained: false,
    restraintType: null,
    restraintHp: 0,
    isGrappled: false,
    grappleType: null,
    grappledBy: null,
    position: "standing",
    clothingDamage: {}
  },
  
  // === LOCATION ===
  currentLocation: "starting_inn",
  previousLocation: null,
  visitedLocations: [],
  
  // === TIME ===
  gameTime: {
    day: 1,
    hour: 8,
    minute: 0
  },
  
  // === FLAGS ===
  flags: {},
  
  // === RELATIONSHIPS ===
  relationships: {
    // [npcId]: { affection, trust, respect, fear, lust, ... }
  },
  
  // === INVENTORY ===
  inventory: [],
  equipment: {},
  
  // === ACTIVE EFFECTS ===
  activeEffects: []
};
```

---

## 14. Condition Reference

Complete list of condition types for scenes, choices, and branches:

### Stat Conditions
```json
{ "type": "stat_above", "stat": "strength", "value": 10 }
{ "type": "stat_below", "stat": "willpower", "value": 5 }
{ "type": "stat_equals", "stat": "level", "value": 10 }
{ "type": "stat_between", "stat": "charisma", "min": 5, "max": 10 }
```

### Resource Conditions
```json
{ "type": "hp_above", "value": 50 }
{ "type": "hp_below", "value": 25 }
{ "type": "hp_percent_above", "value": 50 }
{ "type": "hp_percent_below", "value": 25 }
{ "type": "hp_full" }
{ "type": "stamina_above", "value": 30 }
{ "type": "mana_above", "value": 20 }
{ "type": "gold_above", "value": 100 }
{ "type": "gold_below", "value": 10 }
```

### NSFW Conditions
```json
{ "type": "corruption_above", "value": 50 }
{ "type": "corruption_below", "value": 20 }
{ "type": "purity_above", "value": 80 }
{ "type": "arousal_above", "value": 70 }
{ "type": "arousal_below", "value": 30 }
{ "type": "lust_above", "value": 60 }
{ "type": "submission_above", "value": 70 }
{ "type": "dominance_above", "value": 70 }
{ "type": "shame_below", "value": 30 }
{ "type": "exhibitionism_above", "value": 50 }
{ "type": "innocence_below", "value": 50 }
```

### Virginity/Orifice Conditions
```json
{ "type": "virginity_intact", "orifice": "vagina" }
{ "type": "virginity_lost", "orifice": "anus" }
{ "type": "orifice_used_above", "orifice": "mouth", "count": 10 }
{ "type": "orifice_stretch_above", "orifice": "anus", "value": 3 }
{ "type": "sensitivity_above", "bodyPart": "nipples", "value": 50 }
```

### Substance Conditions
```json
{ "type": "is_addicted", "substanceId": "bliss_inhaler", "minLevel": 40 }
{ "type": "is_addicted_category", "category": "aphrodisiac", "minLevel": 30 }
{ "type": "addiction_stage", "substanceId": "bliss_inhaler", "stage": "dependent" }
{ "type": "addiction_stage_above", "substanceId": "bliss_inhaler", "stage": "habitual" }
{ "type": "in_withdrawal", "substanceId": "bliss_inhaler" }
{ "type": "in_withdrawal_any" }
{ "type": "is_intoxicated", "minLevel": 30 }
{ "type": "is_blacked_out" }
{ "type": "is_sober" }
{ "type": "has_tolerance", "substanceId": "bliss_inhaler", "minLevel": 50 }
{ "type": "has_substance_resistance", "deliveryMethod": "inhalant", "minValue": 50 }
{ "type": "substance_active", "substanceId": "bliss_inhaler" }
{ "type": "substance_phase", "substanceId": "bliss_inhaler", "phase": "peak" }
{ "type": "doses_today", "substanceId": "bliss_inhaler", "count": 2 }
```

### Effect/Status Conditions
```json
{ "type": "has_effect", "effectId": "poisoned" }
{ "type": "not_effect", "effectId": "protected" }
{ "type": "effect_stacks_above", "effectId": "poisoned", "stacks": 3 }
{ "type": "has_any_effect", "effectIds": ["poisoned", "burned", "frozen"] }
{ "type": "has_effect_category", "category": "debuff" }
{ "type": "has_effect_tag", "tag": "curse" }
```

### Combat/Restraint Conditions
```json
{ "type": "is_restrained" }
{ "type": "not_restrained" }
{ "type": "restraint_type", "type": "rope_bind" }
{ "type": "is_grappled" }
{ "type": "grappled_by_type", "type": "tentacle" }
{ "type": "in_combat" }
{ "type": "position_is", "position": "prone" }
```

### Clothing Conditions
```json
{ "type": "clothing_equipped", "slot": "chest" }
{ "type": "clothing_not_equipped", "slot": "underwear_lower" }
{ "type": "clothing_integrity_above", "slot": "chest", "value": 50 }
{ "type": "clothing_integrity_below", "slot": "chest", "value": 25 }
{ "type": "clothing_destroyed", "slot": "underwear_lower" }
{ "type": "is_naked" }
{ "type": "is_nude_top" }
{ "type": "is_nude_bottom" }
{ "type": "exposure_above", "value": 50 }
```

### Item Conditions
```json
{ "type": "has_item", "itemId": "gold_key" }
{ "type": "has_item_count", "itemId": "health_potion", "count": 3 }
{ "type": "has_item_type", "itemType": "weapon" }
{ "type": "has_item_tag", "tag": "cursed" }
{ "type": "has_equipped", "slot": "main_hand" }
{ "type": "has_equipped_item", "slot": "head", "itemId": "gas_mask" }
{ "type": "has_equipped_tag", "tag": "heavy_armor" }
{ "type": "slot_empty", "slot": "off_hand" }
{ "type": "inventory_full" }
{ "type": "inventory_has_space", "slots": 5 }
```

### Flag/Progress Conditions
```json
{ "type": "has_flag", "flag": "met_dark_merchant" }
{ "type": "not_flag", "flag": "killed_innkeeper" }
{ "type": "flag_value", "flag": "reputation", "value": 50 }
{ "type": "flag_above", "flag": "quest_progress", "value": 3 }
{ "type": "quest_active", "questId": "find_artifact" }
{ "type": "quest_complete", "questId": "rescue_princess" }
{ "type": "quest_stage", "questId": "main_quest", "stage": 5 }
{ "type": "achievement_unlocked", "achievementId": "first_blood" }
```

### Location/Time Conditions
```json
{ "type": "location_is", "locationId": "dark_forest" }
{ "type": "location_type", "type": "wilderness" }
{ "type": "location_tag", "tag": "dangerous" }
{ "type": "location_visited", "locationId": "secret_cave" }
{ "type": "location_not_visited", "locationId": "final_dungeon" }
{ "type": "time_between", "start": 22, "end": 6 }
{ "type": "time_after", "hour": 18 }
{ "type": "time_before", "hour": 6 }
{ "type": "day_above", "day": 7 }
{ "type": "day_of_week", "day": 0 }
{ "type": "is_night" }
{ "type": "is_day" }
```

### Relationship Conditions
```json
{ "type": "relationship_above", "npcId": "martha", "stat": "affection", "value": 50 }
{ "type": "relationship_below", "npcId": "guard", "stat": "trust", "value": 0 }
{ "type": "relationship_between", "npcId": "rival", "stat": "respect", "min": 20, "max": 60 }
{ "type": "npc_met", "npcId": "dark_merchant" }
{ "type": "npc_not_met", "npcId": "secret_contact" }
{ "type": "faction_reputation_above", "factionId": "thieves_guild", "value": 25 }
```

### Random/Misc Conditions
```json
{ "type": "random", "chance": 50 }
{ "type": "first_time" }
{ "type": "not_first_time" }
{ "type": "scene_seen", "sceneId": "intro_scene" }
{ "type": "scene_not_seen", "sceneId": "secret_ending" }
{ "type": "always" }
{ "type": "never" }
```

### Combining Conditions

**AND logic** (all must be true):
```json
"conditions": [
  { "type": "corruption_above", "value": 50 },
  { "type": "is_addicted", "substanceId": "bliss", "minLevel": 40 },
  { "type": "has_flag", "flag": "dark_path" }
]
```

**OR logic** (use separate choices/branches):
```json
"choices": [
  { 
    "text": "Use charm", 
    "next": "success",
    "conditions": [{ "type": "stat_above", "stat": "charisma", "value": 8 }]
  },
  { 
    "text": "Use charm", 
    "next": "success",
    "conditions": [{ "type": "has_effect", "effectId": "pheromone_emitting" }]
  }
]
```

---

## 15. Effect Actions Reference

Actions that can be triggered in scenes, effects, or items:

### Stat Modifications
```json
{ "type": "modify_stat", "stat": "gold", "value": 50 }
{ "type": "modify_stat", "stat": "corruption", "value": 10, "permanent": true }
{ "type": "set_stat", "stat": "arousal", "value": 0 }
{ "type": "modify_stat_percent", "stat": "maxHp", "value": -10 }
```

### HP/Resources
```json
{ "type": "damage", "value": 20, "damageType": "physical" }
{ "type": "heal", "value": 50 }
{ "type": "restore_hp", "value": 30 }
{ "type": "restore_hp_percent", "value": 25 }
{ "type": "restore_stamina", "value": 20 }
{ "type": "restore_mana", "value": 15 }
{ "type": "drain_stamina", "value": 10 }
```

### Items
```json
{ "type": "give_item", "itemId": "gold_key", "count": 1 }
{ "type": "remove_item", "itemId": "old_key", "count": 1 }
{ "type": "equip_item", "itemId": "cursed_ring", "slot": "ring" }
{ "type": "unequip_slot", "slot": "head" }
{ "type": "damage_clothing", "slot": "chest", "damage": 25 }
{ "type": "destroy_clothing", "slot": "underwear_lower" }
{ "type": "repair_clothing", "slot": "all" }
```

### Effects/Status
```json
{ "type": "apply_effect", "effectId": "poisoned", "duration": 60000 }
{ "type": "apply_effect", "effectId": "strength_up", "stacks": 2 }
{ "type": "remove_effect", "effectId": "cursed" }
{ "type": "remove_effect_category", "category": "debuff" }
{ "type": "clear_all_effects" }
```

### Flags/Progress
```json
{ "type": "set_flag", "flag": "met_dark_merchant" }
{ "type": "remove_flag", "flag": "innocent" }
{ "type": "set_flag_value", "flag": "reputation", "value": 50 }
{ "type": "modify_flag", "flag": "quest_progress", "value": 1 }
{ "type": "start_quest", "questId": "dark_path" }
{ "type": "advance_quest", "questId": "main_quest" }
{ "type": "complete_quest", "questId": "side_quest" }
```

### NSFW Actions
```json
{ "type": "modify_arousal", "value": 20 }
{ "type": "modify_corruption", "value": 5 }
{ "type": "modify_submission", "value": 10 }
{ "type": "modify_shame", "value": -5 }
{ "type": "orgasm" }
{ "type": "deny_orgasm" }
{ "type": "orifice_use", "orifice": "mouth", "count": 1 }
{ "type": "orifice_stretch", "orifice": "anus", "value": 1 }
{ "type": "lose_virginity", "orifice": "vagina" }
{ "type": "add_partner", "partnerId": "goblin_chief", "partnerType": "monster" }
{ "type": "increase_sensitivity", "bodyPart": "nipples", "value": 5 }
```

### Substances
```json
{ "type": "administer_substance", "substanceId": "bliss_inhaler" }
{ "type": "administer_substance", "substanceId": "sedative", "doses": 2 }
{ "type": "cure_addiction", "substanceId": "bliss_inhaler", "amount": 20 }
{ "type": "reduce_tolerance", "substanceId": "all", "amount": 10 }
{ "type": "apply_resistance", "deliveryMethods": ["inhalant"], "value": 50, "duration": 3600000 }
```

### Relationships
```json
{ "type": "modify_relationship", "npcId": "martha", "stat": "affection", "value": 10 }
{ "type": "set_relationship", "npcId": "enemy", "stat": "trust", "value": 0 }
{ "type": "meet_npc", "npcId": "secret_contact" }
```

### Movement/Scenes
```json
{ "type": "teleport", "locationId": "prison_cell" }
{ "type": "start_scene", "sceneId": "captured_scene" }
{ "type": "start_combat", "enemies": ["goblin", "goblin_archer"] }
{ "type": "end_combat", "result": "victory" }
```

### Time
```json
{ "type": "advance_time", "hours": 2 }
{ "type": "advance_time", "minutes": 30 }
{ "type": "set_time", "hour": 22, "minute": 0 }
{ "type": "advance_day" }
```

### Display
```json
{ "type": "show_message", "message": "You feel strange..." }
{ "type": "show_toast", "title": "Discovery!", "message": "You found a secret.", "type": "success" }
{ "type": "play_sound", "soundId": "door_creak" }
{ "type": "screen_effect", "effect": "flash", "color": "white" }
```

### Restraints
```json
{ "type": "apply_restraint", "restraintType": "rope_bind", "strength": 50 }
{ "type": "remove_restraint" }
{ "type": "apply_grapple", "grappleType": "pin", "grappledBy": "enemy_id" }
{ "type": "break_grapple" }
```

### Mental
```json
{ "type": "modify_mind_control", "value": 10 }
{ "type": "add_conditioning", "trigger": "kneel", "response": "obey" }
{ "type": "add_trigger", "word": "sleep", "effect": "fall_asleep" }
{ "type": "hypnosis_deepen", "value": 15 }
```

---

## Quick Start Checklist

1. ✅ Set up `GameConfig.js` with your game info
2. ✅ Create locations in `public/content/locations/`
3. ✅ Create items in `public/content/items/`
4. ✅ Create enemies in `public/content/enemies/`
5. ✅ Create NPCs/merchants in `public/content/npcs/` (or with enemies)
6. ✅ Create scenes in `public/content/scenes/`
7. ✅ Create effects in `public/content/effects/`
8. ✅ Create substances in `public/content/substances/`
9. ✅ Update `manifest.json` with all your content files
10. ✅ Add images to `public/images/`
11. ✅ Test with `debug.enabled: true`

---

## Tips & Best Practices

### Naming Conventions
- Use `snake_case` for IDs: `dark_forest`, `steel_sword`
- Group related content in same JSON file
- Use descriptive file names: `forest_enemies.json`, `intro_scenes.json`

### Time Values
All times in milliseconds:
- 1 second = 1,000 ms
- 1 minute = 60,000 ms
- 1 hour = 3,600,000 ms
- 1 day = 86,400,000 ms

### Testing
- Enable `debug.enabled` to see DEBUG badge
- Enable `debug.logSceneTransitions` to track scene flow
- Use `debug.skipAgeVerification` during development
- Test with different player states (high corruption, addicted, etc.)

### Performance
- Keep JSON files under 1MB each
- Use lazy loading for large content libraries
- Preload content for connected locations
- Use IndexedDB caching for offline play

---

*© 2025 Cotton Le Sergal & Shluggo. Furrocity Engine.*
