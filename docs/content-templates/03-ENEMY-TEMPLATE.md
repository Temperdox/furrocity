# Enemy Template

Enemies are creatures the player fights in combat. They can have NSFW actions if tagged appropriately.

**File Location:** `public/datapacks/core/enemies/*.json`

---

## Basic Enemy Template

```json
{
  "id": "enemy_id",                           // * REQUIRED: Unique ID
  "name": "Enemy Name",                       // * REQUIRED: Display name
  "description": "Description text",          // * REQUIRED: Flavor text
  "type": "humanoid",                         // * REQUIRED: Enemy type (see below)
  "tier": 1,                                  // * REQUIRED: 1-5 power tier
  "tags": ["humanoid", "forest"],             // * REQUIRED: Enemy tags
  "locations": ["location_id"],               // * REQUIRED: Where they appear

  "icon": {                                   // * REQUIRED: Display icon
    "type": "sprite",
    "sheetId": "enemies",
    "iconId": "enemy_icon"
  },

  "hp": 50,                                   // OPTIONAL: Can be auto-scaled
  "maxHp": 50,
  "maxStamina": 70,

  "stats": {                                  // OPTIONAL: Can be auto-scaled
    "strength": 8,
    "vitality": 6,
    "evasion": 7,
    "speed": 9
  },

  "damageType": "physical",                   // * REQUIRED: Primary damage type
  "resistances": { "fire": 20 },              // OPTIONAL: Damage resistances
  "weaknesses": { "ice": 30 },                // OPTIONAL: Damage weaknesses

  "loot": [                                   // * REQUIRED: Drop table
    { "itemId": "gold", "chance": 0.9, "min": 10, "max": 30 },
    { "itemId": "item_id", "chance": 0.3 }
  ],

  "experience": 40,                           // OPTIONAL: Can be auto-scaled

  "skills": ["skill_id"],                     // OPTIONAL: Combat abilities
  "canRestrain": false,                       // * REQUIRED: Can restrain player?
  "nsfwActions": []                           // OPTIONAL: NSFW action IDs
}
```

---

## Enemy Types

The engine can auto-scale stats based on type:

| Type | Strength | Vitality | Speed | Notes |
|------|----------|----------|-------|-------|
| `humanoid` | Medium | Medium | Medium | Balanced |
| `beast` | High | Medium | High | Fast, strong |
| `demon` | High | High | Medium | Powerful |
| `undead` | Medium | High | Low | Tanky |
| `ooze` | Low | Very High | Very Low | Very tanky |
| `plant` | Medium | High | Very Low | Stationary |
| `aberration` | High | Medium | Low | Unpredictable |
| `elemental` | Medium | Medium | High | Elemental focus |
| `construct` | Very High | Very High | Very Low | Slow tank |
| `spirit` | Low | Low | Very High | Evasive |

---

## Auto-Scaling System

You can omit `level`, `stats`, `hp`, `resistances`, and `experience` - the engine calculates them:

```json
{
  "id": "scaled_enemy",
  "name": "Scaled Enemy",
  "type": "beast",
  "tier": 2,
  "tags": ["beast", "forest"],
  "locations": ["darkwood_forest"],
  "icon": { "type": "sprite", "sheetId": "enemies", "iconId": "beast" },
  "damageType": "physical",
  "loot": [{ "itemId": "gold", "chance": 0.5, "min": 5, "max": 15 }],
  "canRestrain": false
}
```

The engine will:
- Calculate level from player level and location danger
- Generate stats from enemy type
- Calculate HP from vitality
- Apply resistances from type
- Calculate XP and gold rewards

---

## Variant Enemies

Create variants using scaling modifiers:

```json
{
  "eliteChance": 0.1,                         // 10% chance to spawn as elite
  "strongChance": 0.2,                        // 20% chance to spawn strong
  "championChance": 0.02                      // 2% chance for champion
}
```

Or define variants explicitly:
```json
{
  "variants": {
    "weak": { "hpMultiplier": 0.7, "damageMultiplier": 0.8 },
    "strong": { "hpMultiplier": 1.3, "damageMultiplier": 1.2 },
    "elite": { "hpMultiplier": 1.8, "damageMultiplier": 1.5, "extraLoot": true }
  }
}
```

---

## NSFW Enemy Template

```json
{
  "id": "nsfw_enemy",
  "name": "Lustful Enemy",
  "type": "demon",
  "tier": 2,
  "tags": ["demon", "nsfw", "seduction"],
  "locations": ["corrupted_grove"],

  "icon": { "type": "sprite", "sheetId": "enemies", "iconId": "succubus" },

  "hp": 80,
  "maxHp": 80,
  "maxStamina": 100,

  "stats": {
    "strength": 6,
    "vitality": 8,
    "evasion": 12,
    "speed": 10,
    "charm": 18,
    "willpower": 15
  },

  "damageType": "psychic",
  "resistances": { "psychic": 50, "dark": 30 },
  "weaknesses": { "holy": 50 },

  "loot": [
    { "itemId": "gold", "chance": 1.0, "min": 50, "max": 100 },
    { "itemId": "demon_essence", "chance": 0.2 }
  ],

  "experience": 80,

  "skills": ["charm_gaze", "drain_kiss"],

  "canRestrain": true,
  "restraintType": "charm",
  "restraintHp": 50,

  "nsfwActions": ["seduce", "grope", "corrupt", "dominate"],

  "nsfwActionData": {
    "seduce": {
      "name": "Seduce",
      "description": "The enemy whispers sweet temptations...",
      "icon": { "type": "sprite", "sheetId": "effects", "iconId": "charmed" },
      "corruptionGain": 5,
      "arousalEffect": 4,
      "applyEffect": "charmed"
    },
    "grope": {
      "name": "Grope",
      "description": "Hands explore your body...",
      "icon": { "type": "sprite", "sheetId": "ui_icons", "iconId": "encounter_lustful" },
      "corruptionGain": 3,
      "arousalEffect": 2
    },
    "corrupt": {
      "name": "Corrupt",
      "description": "Dark energy flows into you...",
      "icon": { "type": "sprite", "sheetId": "effects", "iconId": "corrupted" },
      "corruptionGain": 15,
      "applyEffect": "corruption_aura"
    },
    "dominate": {
      "name": "Dominate",
      "description": "You are forced into submission...",
      "icon": { "type": "sprite", "sheetId": "effects", "iconId": "dominated" },
      "corruptionGain": 10,
      "arousalEffect": 6,
      "requiresTags": ["domination"],
      "triggerScene": "domination_scene"
    }
  }
}
```

---

## NSFW Action Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Display name |
| `description` | string | Action text shown |
| `icon` | object | Icon reference |
| `corruptionGain` | number | Corruption added |
| `arousalEffect` | number | Arousal stacks added |
| `applyEffect` | string | Effect ID to apply |
| `damage` | number | HP damage dealt |
| `healSelf` | number | HP healed to enemy |
| `damageClothing` | object | Clothing damage |
| `requiresTags` | array | Required content tags |
| `triggerScene` | string | Scene ID to trigger |
| `stacks` | number | Effect stack count |

### Clothing Damage
```json
{
  "damageClothing": {
    "slot": "chest",    // or "all", "legs", "feet"
    "amount": 30        // Durability damage
  }
}
```

---

## Boss Enemy Template

```json
{
  "id": "boss_enemy",
  "name": "Boss Name",
  "type": "demon",
  "tier": 3,
  "tags": ["demon", "boss", "boss_eligible"],
  "locations": ["boss_location"],

  "icon": { "type": "sprite", "sheetId": "enemies", "iconId": "boss" },

  "hp": 300,
  "maxHp": 300,
  "maxStamina": 200,

  "stats": {
    "strength": 20,
    "vitality": 25,
    "evasion": 10,
    "speed": 8
  },

  "damageType": "dark",
  "resistances": { "physical": 20, "dark": 50 },
  "weaknesses": { "holy": 40 },

  "loot": [
    { "itemId": "gold", "chance": 1.0, "min": 200, "max": 500 },
    { "itemId": "boss_drop", "chance": 0.5, "rarity": "epic" },
    { "itemId": "rare_drop", "chance": 0.1, "rarity": "legendary" }
  ],

  "experience": 500,

  "skills": ["boss_skill_1", "boss_skill_2", "ultimate"],
  "canRestrain": true,
  "restraintType": "dark_chains",
  "restraintHp": 100,

  "nsfwActions": ["dominate", "corrupt"],

  "ai": {
    "aggression": 0.9,
    "fleeThreshold": 0
  },

  "bossConfig": {
    "isBoss": true,
    "musicTrack": "boss_theme",
    "phases": [
      {
        "healthThreshold": 0.7,
        "action": "enrage",
        "dialogue": "You dare challenge me?"
      },
      {
        "healthThreshold": 0.3,
        "action": "desperate_attack",
        "summon": "minion_enemy"
      }
    ]
  },

  "dialogue": {
    "encounter": "So, another fool seeks their doom...",
    "victory": "Your soul is mine now.",
    "defeat": "Impossible... how could this be?"
  }
}
```

---

## AI Behavior

```json
{
  "ai": {
    "aggression": 0.7,              // 0-1: How often to attack vs ability
    "fleeThreshold": 0.2,           // HP% to flee at (0 = never)
    "summonPackOnLowHealth": true,  // Call for backup
    "preferTarget": "lowest_hp",    // Targeting priority
    "useSkillsWhen": "tactical"     // random, tactical, always
  }
}
```

---

## Damage Types

- `physical` - Standard melee/ranged
- `fire`, `ice`, `lightning` - Elemental
- `poison` - DoT
- `psychic` - Mental
- `dark` - Shadow/corruption
- `holy` - Divine
- `magic` - Generic magical

---

## Complete Example: Tentacle Plant

```json
{
  "id": "tentacle_plant",
  "name": "Tentacle Plant",
  "description": "A carnivorous plant with writhing vine-like appendages.",
  "type": "plant",
  "tier": 2,
  "level": 6,
  "tags": ["plant", "tentacle", "restraint", "nsfw"],
  "locations": ["darkwood_depths", "corrupted_grove", "swamp"],
  "icon": { "type": "sprite", "sheetId": "enemies", "iconId": "tentacle_plant" },

  "hp": 70,
  "maxHp": 70,
  "maxStamina": 120,

  "stats": {
    "strength": 12,
    "vitality": 15,
    "evasion": 2,
    "speed": 3
  },

  "damageType": "physical",
  "resistances": { "poison": 50 },
  "weaknesses": { "fire": 75, "ice": 25 },

  "loot": [
    { "itemId": "vine_sample", "chance": 0.5 },
    { "itemId": "aphrodisiac_pollen", "chance": 0.3 },
    { "itemId": "plant_core", "chance": 0.2 }
  ],

  "experience": 55,

  "canRestrain": true,
  "restraintType": "vine_bind",
  "restraintHp": 35,

  "nsfwActions": ["tentacle_probe", "pollen_spray", "deep_penetration"],
  "nsfwActionData": {
    "tentacle_probe": {
      "name": "Probe",
      "description": "Slimy tendrils explore your body...",
      "icon": { "type": "sprite", "sheetId": "ui_icons", "iconId": "encounter_lustful" },
      "corruptionGain": 6,
      "arousalEffect": 4
    },
    "pollen_spray": {
      "name": "Pollen Spray",
      "description": "The plant releases a cloud of intoxicating pollen...",
      "icon": { "type": "sprite", "sheetId": "effects", "iconId": "aroused" },
      "corruptionGain": 3,
      "applyEffect": "aroused",
      "stacks": 3
    },
    "deep_penetration": {
      "name": "Deep Penetration",
      "description": "A thick tendril forces its way inside...",
      "icon": { "type": "sprite", "sheetId": "ui_icons", "iconId": "encounter_predatory" },
      "corruptionGain": 15,
      "arousalEffect": 8,
      "requiresTags": ["tentacle", "penetration"],
      "triggerScene": "plant_penetration"
    }
  }
}
```
