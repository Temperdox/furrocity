# Region Template

Regions are the top-level world map areas. Each region contains 5-20 local locations.

**File Location:** `public/datapacks/core/locations/regions.json`

---

## Template

```json
{
  "id": "region_id",                          // * REQUIRED: Unique ID (lowercase_underscore)
  "name": "Region Display Name",              // * REQUIRED: Shown on world map
  "description": "Description of the region", // * REQUIRED: Flavor text
  "type": "region",                           // * REQUIRED: Always "region"

  "locked": true,                             // * REQUIRED: Start locked?
  "initiallyUnlocked": false,                 // * REQUIRED: Unlocked at game start?

  "unlockRequirements": {                     // OPTIONAL: How to unlock (if locked)
    "type": "or",                             // "and" or "or"
    "conditions": [
      { "type": "level", "operator": ">=", "value": 5 },
      { "type": "quest_complete", "quest": "quest_id" }
    ]
  },

  "mapData": {                                // * REQUIRED: Map display info
    "worldMapImage": "/maps/regions/name.png",
    "localMapImage": "/maps/local/name_detail.png",
    "worldMapBounds": { "x": 100, "y": 150, "width": 200, "height": 180 },
    "worldMapPosition": { "x": 200, "y": 240 }
  },

  "titleDisplay": {                           // OPTIONAL: Title styling
    "fontTag": "friendly_town",               // Font style tag
    "subtitle": "A Subtitle Here"
  },

  "childLocations": [                         // * REQUIRED: Local locations in this region
    "location_id_1",
    "location_id_2"
  ],

  "neighborRegions": ["other_region"],        // * REQUIRED: Adjacent regions

  "neighborDistances": {                      // * REQUIRED: Travel info to neighbors
    "other_region": {
      "distance": 50,                         // Travel distance (affects stamina)
      "terrain": "road",                      // Terrain type
      "dangerLevel": 2                        // 1-5 danger rating
    }
  },

  "tags": ["safe", "town", "trading"],        // * REQUIRED: Region tags
  "travelTags": ["road", "safe_travel"],      // OPTIONAL: Tags affecting travel

  "ambiance": {                               // OPTIONAL: Audio settings
    "music": "peaceful_town",
    "sounds": ["crowd_chatter", "birds"]
  }
}
```

---

## Field Reference

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (lowercase_underscore) |
| `name` | string | Display name on world map |
| `description` | string | Flavor text description |
| `type` | string | Always `"region"` |
| `locked` | boolean | Whether region starts locked |
| `initiallyUnlocked` | boolean | Whether unlocked at game start |
| `mapData` | object | Map positioning and images |
| `childLocations` | array | IDs of local locations |
| `neighborRegions` | array | IDs of adjacent regions |
| `neighborDistances` | object | Travel data to each neighbor |
| `tags` | array | Region tags |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `unlockRequirements` | object | Conditions to unlock |
| `titleDisplay` | object | Font styling for title |
| `travelTags` | array | Tags affecting travel encounters |
| `ambiance` | object | Music and sound settings |

---

## Terrain Types

Use these for `neighborDistances.terrain`:

- `road` - Paved/maintained road
- `forest_edge` - Light forest
- `forest` - Dense forest
- `mountain_trail` - Mountain path
- `mountain_path` - High mountain
- `corrupted_path` - Corrupted terrain
- `desert_edge` - Desert border
- `plains` - Open grassland
- `swamp` - Marshland

---

## Danger Levels

| Level | Description | Encounter Rate |
|-------|-------------|----------------|
| 1 | Safe | Very low |
| 2 | Mild | Low |
| 3 | Moderate | Medium |
| 4 | Dangerous | High |
| 5 | Deadly | Very high |

---

## Common Tags

- `safe` - Low encounter rate
- `dangerous` - High encounter rate
- `town` - Settlement
- `forest`, `mountain`, `plains`, `desert`, `swamp` - Terrain
- `corrupted` - Has corruption effects
- `demon` - Demon realm
- `magic` - Magical area

---

## Font Tags

Available font styles for `titleDisplay.fontTag`:

- `friendly_town` - Warm, welcoming
- `hostile_forest` - Dark, foreboding
- `hostile_area` - Dangerous
- `dungeon` - Underground/lair
- `mystical` - Magical
- `holy` - Sacred
- `corrupted` - Demonic/corrupted
- `neutral` - Standard

---

## Example: Mountain Pass Region

```json
{
  "id": "mountain_pass",
  "name": "Mountain Pass",
  "description": "A treacherous mountain path connecting the lowlands to the highland territories. Bandits and worse prey on travelers.",
  "type": "region",
  "locked": true,
  "initiallyUnlocked": false,
  "unlockRequirements": {
    "type": "and",
    "conditions": [
      { "type": "level", "operator": ">=", "value": 5 },
      { "type": "quest_complete", "quest": "mountain_guide" }
    ]
  },
  "mapData": {
    "worldMapImage": "/maps/regions/mountain_pass.png",
    "localMapImage": "/maps/local/mountain_pass_detail.png",
    "worldMapBounds": { "x": 200, "y": 50, "width": 180, "height": 150 },
    "worldMapPosition": { "x": 290, "y": 125 }
  },
  "titleDisplay": {
    "fontTag": "hostile_area",
    "subtitle": "The Perilous Heights"
  },
  "childLocations": [
    "mountain_entrance",
    "bandit_camp",
    "mountain_shrine",
    "eagles_nest",
    "abandoned_mine",
    "summit_pass"
  ],
  "neighborRegions": ["crossroads", "darkwood", "highland_fortress"],
  "neighborDistances": {
    "crossroads": { "distance": 80, "terrain": "mountain_trail", "dangerLevel": 3 },
    "darkwood": { "distance": 70, "terrain": "forest_mountain", "dangerLevel": 4 },
    "highland_fortress": { "distance": 60, "terrain": "mountain_path", "dangerLevel": 4 }
  },
  "tags": ["dangerous", "mountain", "bandits"],
  "travelTags": ["mountain", "dangerous", "bandits"],
  "ambiance": {
    "music": "mountain_wind",
    "sounds": ["wind_gusts", "rocks_falling", "eagle_cries"]
  }
}
```
