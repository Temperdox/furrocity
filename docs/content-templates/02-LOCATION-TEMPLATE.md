# Location Template

Locations are individual places within a region (inns, dungeons, clearings, shops, etc.).

**File Location:** `public/datapacks/core/locations/world_locations.json`

---

## Basic Location Template

```json
{
  "id": "location_id",                        // * REQUIRED: Unique ID
  "name": "Location Name",                    // * REQUIRED: Display name
  "description": "Description text",          // * REQUIRED: Flavor text
  "type": "building",                         // * REQUIRED: building, outdoor, dungeon
  "locationType": "local",                    // * REQUIRED: Always "local"
  "parentRegion": "region_id",                // * REQUIRED: Parent region ID

  "tags": ["safe", "inn", "rest"],            // * REQUIRED: Location tags

  "locked": false,                            // * REQUIRED: Starts locked?
  "initiallyUnlocked": true,                  // * REQUIRED: Unlocked at start?

  "unlockRequirements": null,                 // OPTIONAL: How to unlock

  "neighbors": ["other_location"],            // * REQUIRED: Adjacent locations
  "connectedLocations": ["loc1", "loc2"],     // * REQUIRED: Travel destinations

  "mapData": {                                // * REQUIRED: Map display
    "localMapPosition": { "x": 200, "y": 180 },
    "icon": "inn",
    "iconSize": "large"                       // small, medium, large
  },

  "titleDisplay": {                           // OPTIONAL: Title styling
    "fontTag": "friendly_town",
    "subtitle": "A Cozy Haven"
  },

  "encounterChance": 0,                       // * REQUIRED: 0-1 (0 = no encounters)
  "encounterTable": null,                     // OPTIONAL: Encounter table ID

  "ambiance": {                               // OPTIONAL: Audio
    "music": "tavern_ambient",
    "sounds": ["fireplace", "chatter"]
  }
}
```

---

## Location Types

### Building (Safe Interior)
```json
{
  "type": "building",
  "inhabited": true,
  "buildings": 1,
  "markets": 0,
  "features": {
    "rest": true,
    "shop": "shop_id",
    "save": true
  },
  "npcs": ["npc_id_1", "npc_id_2"]
}
```

### Outdoor (Open Area)
```json
{
  "type": "outdoor",
  "dangerLevel": 2,
  "encounterChance": 0.3,
  "encounterTable": "forest_encounters",
  "enemyTables": ["forest_standard"],
  "features": {
    "forage": true
  },
  "discoverableWhileExploring": true,
  "discoveryChance": 0.2
}
```

### Dungeon (Multi-Room)
```json
{
  "type": "dungeon",
  "dangerLevel": 4,
  "encounterChance": 0.8,
  "encounterTable": "dungeon_encounters",
  "rooms": [
    { "id": "entrance", "name": "Cave Entrance", "encounters": 1 },
    { "id": "tunnels", "name": "Winding Tunnels", "encounters": 2 },
    { "id": "boss_room", "name": "Boss Chamber", "boss": "boss_enemy_id" }
  ]
}
```

---

## Service Locations

### Inn
```json
{
  "tags": ["safe", "inn", "rest", "shop", "inhabited"],
  "features": {
    "rest": true,
    "shop": "inn_shop",
    "save": true
  },
  "services": {
    "lodging": {
      "roomTypes": ["basic", "standard", "deluxe"],
      "basePrices": { "basic": 10, "standard": 25, "deluxe": 50 }
    }
  }
}
```

### Temple/Church
```json
{
  "tags": ["safe", "temple", "church", "healing", "inhabited"],
  "features": {
    "heal": true,
    "curseRemoval": true,
    "corruptionPurge": true,
    "save": true
  },
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

### Clinic/Hospital
```json
{
  "tags": ["safe", "clinic", "hospital", "healing", "inhabited"],
  "features": {
    "heal": true,
    "medical": true
  },
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

### Nursery/Birthing Center
```json
{
  "tags": ["safe", "nursery", "birthing_center", "inhabited"],
  "features": {
    "birthing": true,
    "nursery": true
  },
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

### Shop
```json
{
  "tags": ["safe", "shop", "inhabited"],
  "features": {
    "shop": "blacksmith_shop",
    "repair": true,
    "craft": true
  }
}
```

---

## Hidden Tags System

For locations with discoverable secrets:

```json
{
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
      "discoveryScene": "discover_corrupted_location",
      "discoveryMessage": "You discover something dark about this place..."
    },
    "blessed": {
      "alwaysHidden": false,
      "discoveryConditions": {
        "interactions": {
          "type": "sleep",
          "min": 1,
          "max": 3
        }
      },
      "discoveryScene": "discover_blessed",
      "discoveryMessage": "You feel a divine presence here..."
    }
  }
}
```

---

## NSFW Location Features

```json
{
  "tags": ["dangerous", "nsfw_zone"],

  "nsfwReactions": {
    "public_sex": {
      "scene": "public_sex_scene",
      "conditions": {
        "hasDiscoveredTag": "corrupted"
      },
      "infamyModifier": 0.3
    }
  },

  "witnessConfig": {
    "baseChance": 0.4,
    "npcWitnessChance": 0.8
  },

  "effects": {
    "onEnter": { "applyEffect": "corruption_aura" },
    "perTurn": { "corruption": 2 }
  }
}
```

---

## Random Events

```json
{
  "randomEvents": [
    {
      "id": "find_herbs",
      "chance": 0.15,
      "reward": { "item": "healing_herb", "count": 2 }
    },
    {
      "id": "lost_traveler",
      "chance": 0.1,
      "scene": "lost_traveler_event"
    }
  ],

  "travelEncounters": [
    { "type": "ambush", "chance": 0.2, "enemy": "bandit_group" },
    { "type": "merchant", "chance": 0.15, "npc": "traveling_merchant" }
  ]
}
```

---

## First Visit Triggers

```json
{
  "firstVisitScene": "location_first_visit",
  "firstVisitAchievement": "explorer_achievement",
  "onEnterScene": null
}
```

---

## Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `name` | string | Yes | Display name |
| `description` | string | Yes | Flavor text |
| `type` | string | Yes | building, outdoor, dungeon |
| `locationType` | string | Yes | Always "local" |
| `parentRegion` | string | Yes | Parent region ID |
| `tags` | array | Yes | Location tags |
| `locked` | boolean | Yes | Starts locked |
| `initiallyUnlocked` | boolean | Yes | Unlocked at start |
| `neighbors` | array | Yes | Adjacent location IDs |
| `connectedLocations` | array | Yes | Travelable destinations |
| `mapData` | object | Yes | Map positioning |
| `encounterChance` | number | Yes | 0-1 encounter probability |
| `inhabited` | boolean | No | Has permanent NPCs |
| `buildings` | number | No | Building count |
| `markets` | number | No | Market stall count |
| `dangerLevel` | number | No | 1-5 danger rating |
| `npcs` | array | No | NPC IDs present |
| `features` | object | No | Available services |
| `services` | object | No | Service configurations |

---

## Complete Example: Bandit Camp

```json
{
  "id": "bandit_camp",
  "name": "Bandit Hideout",
  "description": "A hidden camp in the hills where bandits plan their raids on travelers.",
  "type": "outdoor",
  "locationType": "local",
  "parentRegion": "mountain_pass",
  "tags": ["dangerous", "bandit", "camp", "hidden"],

  "locked": true,
  "initiallyUnlocked": false,
  "unlockRequirements": {
    "type": "or",
    "conditions": [
      { "type": "quest_active", "quest": "bandit_bounty" },
      { "type": "flag", "flag": "tracked_bandits" }
    ]
  },

  "neighbors": ["north_road", "mountain_trail"],
  "connectedLocations": ["north_road", "mountain_trail"],

  "mapData": {
    "localMapPosition": { "x": 280, "y": 120 },
    "icon": "camp_hostile",
    "iconSize": "medium"
  },

  "titleDisplay": {
    "fontTag": "hostile_area",
    "subtitle": "Den of Thieves"
  },

  "dangerLevel": 3,
  "encounterChance": 0.7,
  "encounterTable": "bandit_encounters",
  "enemyTables": ["bandits_standard", "bandits_elite"],

  "discoverableWhileExploring": true,
  "discoveryChance": 0.1,

  "npcs": ["shady_dealer"],

  "features": {
    "shop": "black_market"
  },

  "ambiance": {
    "music": "tense_ambient",
    "sounds": ["distant_voices", "weapon_sounds"]
  },

  "firstVisitScene": "bandit_camp_discovery",

  "randomEvents": [
    { "id": "bandit_patrol", "chance": 0.3, "scene": "patrol_encounter" },
    { "id": "prisoner_found", "chance": 0.1, "scene": "rescue_prisoner" }
  ]
}
```
