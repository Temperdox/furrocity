# Item Template

Items include weapons, armor, consumables, materials, accessories, and special items.

**File Location:** `public/datapacks/core/items/*.json`

---

## Base Item Template

```json
{
  "id": "item_id",                            // * REQUIRED: Unique ID
  "name": "Item Name",                        // * REQUIRED: Display name
  "baseName": "Base Type",                    // * REQUIRED: Generic type name
  "type": "weapon",                           // * REQUIRED: Item type
  "category": "melee",                        // * REQUIRED: Sub-category
  "rarity": "common",                         // * REQUIRED: Rarity tier
  "tags": ["sword", "melee", "metal"],        // * REQUIRED: Item tags
  "description": "Description text",          // * REQUIRED: Flavor text

  "icon": {                                   // * REQUIRED: Display icon
    "type": "sprite",
    "sheetId": "items_weapons",
    "iconId": "sword_icon"
  },

  "value": 50,                                // * REQUIRED: Base gold value
  "weight": 3                                 // * REQUIRED: Weight in inventory
}
```

---

## Item Types

### Weapon
```json
{
  "type": "weapon",
  "category": "melee",                        // melee, ranged, magic
  "slot": "main_hand",                        // main_hand, off_hand, two_hand
  "rarity": "uncommon",

  "baseStats": {
    "attack": 12,
    "speed": 10,
    "magic": 0
  },

  "requirements": {
    "strength": 5,
    "level": 3
  },

  "effects": [
    {
      "type": "onHit",
      "applyEffect": "poison_weak",
      "chance": 0.15
    }
  ]
}
```

### Armor
```json
{
  "type": "armor",
  "category": "medium",                       // light, medium, heavy
  "slot": "chest",                            // head, chest, legs, feet, hands
  "rarity": "common",

  "baseStats": {
    "defense": 8,
    "evasion": -1
  },

  "requirements": {
    "strength": 4
  },

  "clothingState": {
    "maxIntegrity": 150,
    "exposureThreshold": 20                   // % below which is "exposed"
  }
}
```

### Accessory
```json
{
  "type": "accessory",
  "category": "jewelry",
  "slot": "accessory1",                       // accessory1, accessory2, neck, back
  "rarity": "rare",

  "baseStats": {
    "charm": 5,
    "willpower": 3
  },

  "effects": [
    {
      "type": "passive",
      "description": "Increases charm by 5"
    }
  ]
}
```

### Consumable
```json
{
  "type": "consumable",
  "category": "potion",                       // potion, food, medicine, herb
  "rarity": "common",

  "stackable": true,
  "maxStack": 99,

  "useEffect": {
    "type": "heal",
    "amount": { "type": "flat", "value": 50 }
  }
}
```

### Material
```json
{
  "type": "material",
  "category": "crafting",                     // crafting, trophy, alchemy, rare
  "rarity": "uncommon",

  "stackable": true,
  "maxStack": 50
}
```

### Tool
```json
{
  "type": "tool",
  "category": "utility",
  "rarity": "common",

  "stackable": true,
  "maxStack": 10,

  "specialUse": {
    "inCombat": {
      "action": "restrain",
      "restraintType": "rope_bind",
      "hp": 30
    }
  }
}
```

---

## Rarity Tiers

| Rarity | Color | Drop Rate | Value Multiplier |
|--------|-------|-----------|------------------|
| `common` | White | High | 1x |
| `uncommon` | Green | Medium | 2x |
| `rare` | Blue | Low | 5x |
| `epic` | Purple | Very Low | 15x |
| `legendary` | Orange | Extremely Low | 50x |

---

## Use Effects

### Healing
```json
{
  "useEffect": {
    "type": "heal",
    "amount": { "type": "flat", "value": 50 }
  }
}
```

### Percentage Healing
```json
{
  "useEffect": {
    "type": "heal",
    "amount": { "type": "percent", "value": 30 }
  }
}
```

### Restore Stamina
```json
{
  "useEffect": {
    "type": "restoreStamina",
    "amount": { "type": "flat", "value": 30 }
  }
}
```

### Apply Effect
```json
{
  "useEffect": {
    "type": "applyEffect",
    "effectId": "strength_up",
    "duration": 5
  }
}
```

### Remove Effect
```json
{
  "useEffect": {
    "type": "removeEffect",
    "effectTags": ["poison"]
  }
}
```

### Multiple Effects
```json
{
  "useEffect": {
    "type": "multi",
    "effects": [
      { "type": "heal", "amount": { "type": "flat", "value": 30 } },
      { "type": "removeEffect", "effectTags": ["poison"] }
    ]
  }
}
```

---

## Equipment Slots

| Slot | Description |
|------|-------------|
| `head` | Helmets, hats |
| `chest` | Body armor, shirts |
| `legs` | Pants, leggings |
| `feet` | Boots, shoes |
| `hands` | Gloves, gauntlets |
| `main_hand` | Primary weapon |
| `off_hand` | Shield, secondary |
| `two_hand` | Two-handed weapon |
| `neck` | Necklaces, collars |
| `back` | Capes, wings |
| `accessory1` | Ring, amulet |
| `accessory2` | Second accessory |

---

## Cursed Items

```json
{
  "id": "cursed_item",
  "name": "Cursed Amulet",
  "type": "accessory",
  "slot": "accessory1",
  "rarity": "rare",
  "tags": ["jewelry", "cursed", "dark"],

  "baseStats": {
    "charm": 5,
    "willpower": -2
  },

  "curse": {
    "level": "moderate",                      // minor, moderate, major, severe
    "removable": true,
    "removalDifficulty": 50
  },

  "onEquip": {
    "applyEffect": "curse_lust"
  }
}
```

---

## NSFW Items

### Restraint Items
```json
{
  "id": "magic_collar",
  "name": "Collar of Submission",
  "type": "accessory",
  "slot": "neck",
  "rarity": "rare",
  "tags": ["collar", "nsfw", "restraint", "cursed"],

  "baseStats": {
    "willpower": -5
  },

  "curse": {
    "level": "major",
    "removable": true,
    "removalDifficulty": 80
  },

  "nsfwProperties": {
    "isRestraint": true,
    "cannotRemove": true,
    "ownerControl": true,
    "effects": ["collared", "submissive"]
  },

  "onEquip": {
    "applyEffect": "collared"
  }
}
```

### Transformation Items
```json
{
  "id": "tf_potion_fem",
  "name": "Feminizing Elixir",
  "type": "consumable",
  "category": "potion",
  "rarity": "rare",
  "tags": ["potion", "nsfw", "transformation"],

  "stackable": true,
  "maxStack": 10,

  "useEffect": {
    "type": "transform",
    "changes": {
      "bodyMods.bustSize": { "change": 1, "max": 6 },
      "bodyMods.hipSize": { "change": 0.5, "max": 5 },
      "bodyMods.masculinity": { "change": -10, "min": 0 }
    }
  },

  "requiresTags": ["transformation"]
}
```

### Toy Items
```json
{
  "id": "vibrating_plug",
  "name": "Enchanted Plug",
  "type": "accessory",
  "slot": "plug",
  "rarity": "uncommon",
  "tags": ["toy", "nsfw", "plug", "vibrating"],

  "nsfwProperties": {
    "isToy": true,
    "vibrating": true,
    "baseArousal": 1,
    "activationChance": 0.3,
    "activationArousal": 3
  },

  "onEquip": {
    "applyEffect": "plugged"
  }
}
```

---

## On-Hit Effects

```json
{
  "effects": [
    {
      "type": "onHit",
      "applyEffect": "poison_weak",
      "chance": 0.2,
      "stacks": 2
    },
    {
      "type": "onHit",
      "damage": { "type": "fire", "amount": 5 },
      "chance": 0.3
    },
    {
      "type": "onCrit",
      "applyEffect": "bleeding",
      "chance": 0.5
    }
  ]
}
```

---

## Complete Examples

### Weapon: Enchanted Blade
```json
{
  "id": "enchanted_blade",
  "name": "Enchanted Blade",
  "baseName": "Sword",
  "type": "weapon",
  "category": "melee",
  "slot": "main_hand",
  "rarity": "rare",
  "tags": ["sword", "melee", "magic", "enchanted"],
  "description": "A blade infused with arcane energy.",
  "icon": { "type": "sprite", "sheetId": "items_weapons", "iconId": "sword_enchanted" },
  "baseStats": {
    "attack": 18,
    "speed": 12,
    "magic": 5
  },
  "requirements": {
    "strength": 6,
    "intelligence": 4
  },
  "effects": [
    {
      "type": "onHit",
      "applyEffect": "magic_damage_small",
      "chance": 0.2
    }
  ],
  "value": 500,
  "weight": 2.5
}
```

### Consumable: Health Potion
```json
{
  "id": "health_potion",
  "name": "Health Potion",
  "baseName": "Potion",
  "type": "consumable",
  "category": "potion",
  "rarity": "common",
  "tags": ["potion", "healing", "consumable"],
  "description": "Restores a moderate amount of health.",
  "icon": { "type": "sprite", "sheetId": "items_consumables", "iconId": "potion_health" },
  "stackable": true,
  "maxStack": 99,
  "useEffect": {
    "type": "heal",
    "amount": { "type": "flat", "value": 50 }
  },
  "value": 25,
  "weight": 0.5
}
```

### Material: Monster Drop
```json
{
  "id": "succubus_essence",
  "name": "Succubus Essence",
  "baseName": "Essence",
  "type": "material",
  "category": "rare",
  "rarity": "rare",
  "tags": ["material", "essence", "demon", "succubus", "nsfw"],
  "description": "Pure demonic essence, pulsing with dark desire.",
  "icon": { "type": "sprite", "sheetId": "items_materials", "iconId": "succubus_essence" },
  "stackable": true,
  "maxStack": 20,
  "value": 200,
  "weight": 0.1
}
```
