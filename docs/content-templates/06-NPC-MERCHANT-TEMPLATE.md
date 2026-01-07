# NPC & Merchant Template

NPCs are characters the player can interact with. Merchants are NPCs with buying/selling capabilities.

**File Location:** `public/datapacks/core/merchants/merchants.json`

---

## Basic NPC Template

```json
{
  "id": "npc_id",                             // * REQUIRED: Unique ID
  "name": "NPC Name",                         // * REQUIRED: Display name
  "description": "Character description",     // * REQUIRED: Who they are
  "locationId": "location_id",                // * REQUIRED: Home location
  "factionId": "faction_id",                  // OPTIONAL: Faction membership

  "nsfwEnabled": false,                       // * REQUIRED: NSFW interactions?
  "canBeSeduced": false,                      // OPTIONAL: Seduction possible?
  "seductionDifficulty": 50,                  // OPTIONAL: 0-100 difficulty

  "rumorAwareness": 0.6,                      // * REQUIRED: 0-1, knows rumors

  "dialogue": {                               // * REQUIRED: Basic dialogue
    "greeting": "Hello, traveler!",
    "farewell": "Safe travels!"
  }
}
```

---

## Merchant Template

```json
{
  "id": "merchant_id",
  "name": "Merchant Name",
  "description": "A shopkeeper who sells goods.",
  "locationId": "shop_location",
  "factionId": "merchants_guild",

  "nsfwEnabled": false,
  "canBeSeduced": false,
  "rumorAwareness": 0.7,

  "buyConfig": {                              // * REQUIRED: What they buy
    "acceptedTags": ["material", "weapon"],   // Tags they accept
    "rejectedTags": ["cursed", "stolen"],     // Tags they refuse
    "buyPriceMultiplier": 0.4,                // % of value they pay
    "maxBuyValue": 1000                       // Max per-item value
  },

  "sellConfig": {                             // * REQUIRED: What they sell
    "mode": "static",                         // static or dynamic
    "stockId": "shop_stock",                  // Inventory reference
    "sellPriceMultiplier": 1.0                // Price modifier
  },

  "dialogue": {
    "greeting": "Welcome! Looking to buy or sell?",
    "cannotBuy": "Sorry, I can't take that.",
    "farewell": "Come back soon!"
  }
}
```

---

## Buy Configuration

### Accept/Reject Tags
```json
{
  "buyConfig": {
    "acceptedTags": [
      "material",          // Crafting materials
      "weapon",            // Weapons
      "armor",             // Armor pieces
      "consumable",        // Potions, food
      "misc"               // Miscellaneous
    ],
    "rejectedTags": [
      "cursed",            // Cursed items
      "stolen",            // Stolen goods
      "contraband",        // Illegal items
      "nsfw",              // Adult items
      "quest"              // Quest items
    ],
    "buyPriceMultiplier": 0.4,    // Pays 40% of item value
    "maxBuyValue": 1000           // Won't buy items worth more
  }
}
```

### Specialized Buyers
```json
// Blacksmith - only weapons/armor
{
  "buyConfig": {
    "acceptedTags": ["weapon", "armor", "metal", "ore"],
    "rejectedTags": ["cursed", "organic", "food"],
    "buyPriceMultiplier": 0.5,
    "maxBuyValue": 5000
  }
}

// Witch - rare/dark items
{
  "buyConfig": {
    "acceptedTags": ["ingredient", "monster_part", "cursed", "magical", "rare"],
    "rejectedTags": ["holy", "blessed"],
    "buyPriceMultiplier": 0.55,
    "maxBuyValue": 10000
  }
}

// Black Market - illegal goods
{
  "buyConfig": {
    "acceptedTags": ["stolen", "contraband", "poison", "weapon", "lockpick"],
    "rejectedTags": ["holy", "blessed"],
    "buyPriceMultiplier": 0.6,
    "maxBuyValue": 20000
  }
}
```

---

## Sell Configuration

### Static Stock (Pre-defined inventory)
```json
{
  "sellConfig": {
    "mode": "static",
    "stockId": "general_store_stock",        // References shop_inventories.json
    "sellPriceMultiplier": 1.0               // Base prices
  }
}
```

### Dynamic Stock (Random inventory)
```json
{
  "sellConfig": {
    "mode": "dynamic",
    "saleTags": ["rare", "exotic", "magical"],
    "maxRarity": "legendary",
    "stockSize": 8,                          // Number of items
    "sellPriceMultiplier": 1.5,              // Higher prices
    "refreshInterval": "daily"               // When stock changes
  }
}
```

---

## NPC Requirements

Restrict when NPC is accessible:

```json
{
  "requirements": {
    "or": [
      { "type": "flag", "flag": "knows_underworld" },
      { "type": "infamy", "infamyType": "criminal", "operator": ">=", "value": 20 }
    ]
  }
}
```

---

## NSFW NPC Template

```json
{
  "id": "nsfw_npc",
  "name": "Seductive Character",
  "description": "A character with NSFW interactions available.",
  "locationId": "adult_location",
  "factionId": null,

  "nsfwEnabled": true,
  "canBeSeduced": true,
  "seductionDifficulty": 40,                 // Moderate difficulty

  "rumorAwareness": 0.8,

  "nsfwConfig": {
    "services": ["companionship", "massage"],
    "prices": {
      "companionship": 50,
      "massage": 30
    },
    "scenes": {
      "companionship": "npc_companionship_scene",
      "massage": "npc_massage_scene"
    },
    "corruptionRequired": 0,
    "relationshipBonus": {
      "trust": 20,
      "love": 30
    }
  },

  "seductionConfig": {
    "statChecks": ["charm", "willpower"],
    "successScene": "seduce_success_scene",
    "failureScene": "seduce_failure_scene",
    "cooldown": 24,                          // Hours until retry
    "relationshipChange": {
      "success": { "love": 15, "trust": -5 },
      "failure": { "trust": -10 }
    }
  },

  "buyConfig": {
    "acceptedTags": ["gift", "jewelry", "clothing"],
    "rejectedTags": ["weapon"],
    "buyPriceMultiplier": 0.3,
    "maxBuyValue": 500
  },

  "sellConfig": {
    "mode": "static",
    "stockId": "adult_shop_stock",
    "sellPriceMultiplier": 1.2
  },

  "dialogue": {
    "greeting": "Well, hello there, handsome...",
    "cannotBuy": "That's not quite my taste.",
    "farewell": "Don't be a stranger..."
  }
}
```

---

## Relationship System

NPCs can have multiple relationship stats:

```json
{
  "relationshipStats": {
    "trust": {
      "default": 0,
      "min": -100,
      "max": 100
    },
    "love": {
      "default": 0,
      "min": 0,
      "max": 100
    },
    "fear": {
      "default": 0,
      "min": 0,
      "max": 100
    },
    "respect": {
      "default": 0,
      "min": -50,
      "max": 100
    }
  }
}
```

### Relationship Thresholds
```json
{
  "relationshipThresholds": {
    "trust": {
      "50": { "unlocks": "trusted_dialogue" },
      "80": { "unlocks": "secret_shop", "scene": "trust_reward" }
    },
    "love": {
      "30": { "unlocks": "dating" },
      "70": { "unlocks": "romance_route" }
    }
  }
}
```

---

## Dialogue Options

### Basic Dialogue
```json
{
  "dialogue": {
    "greeting": "Hello, traveler!",
    "greeting_repeat": "Back again, I see.",
    "cannotBuy": "I can't accept that.",
    "cannotAfford": "You don't have enough gold.",
    "farewell": "Safe travels!",
    "busy": "I'm busy right now.",
    "closed": "We're closed. Come back tomorrow."
  }
}
```

### Conditional Dialogue
```json
{
  "dialogue": {
    "greeting": {
      "default": "Hello, stranger.",
      "variants": [
        {
          "condition": { "type": "relationship", "stat": "trust", "operator": ">=", "value": 50 },
          "text": "Ah, my friend! Good to see you!"
        },
        {
          "condition": { "type": "flag", "flag": "saved_npc" },
          "text": "You saved my life! How can I ever repay you?"
        }
      ]
    }
  }
}
```

---

## Schedule System

NPCs can have schedules:

```json
{
  "schedule": {
    "default": "shop_location",
    "timeSlots": [
      { "start": "06:00", "end": "08:00", "location": "inn_breakfast" },
      { "start": "08:00", "end": "18:00", "location": "shop_location" },
      { "start": "18:00", "end": "22:00", "location": "tavern" },
      { "start": "22:00", "end": "06:00", "location": "home" }
    ],
    "unavailable": {
      "location": "home",
      "dialogue": "Sorry, the shop is closed. Come back in the morning."
    }
  }
}
```

---

## Complete Example: Town Blacksmith

```json
{
  "id": "blacksmith_gorn",
  "name": "Gorn the Blacksmith",
  "description": "A muscular man covered in soot, with arms like tree trunks.",
  "locationId": "blacksmith",
  "factionId": "crossroads_guild",

  "nsfwEnabled": false,
  "canBeSeduced": false,
  "rumorAwareness": 0.5,

  "buyConfig": {
    "acceptedTags": ["weapon", "armor", "metal", "ore"],
    "rejectedTags": ["cursed", "organic", "food"],
    "buyPriceMultiplier": 0.5,
    "maxBuyValue": 5000
  },

  "sellConfig": {
    "mode": "static",
    "stockId": "blacksmith_stock",
    "sellPriceMultiplier": 1.0
  },

  "services": {
    "repair": {
      "costMultiplier": 0.1,
      "maxLevel": "epic"
    },
    "upgrade": {
      "costMultiplier": 0.5,
      "requiresRelationship": { "trust": 30 }
    }
  },

  "relationshipStats": {
    "trust": { "default": 10, "min": -50, "max": 100 },
    "respect": { "default": 0, "min": 0, "max": 100 }
  },

  "relationshipThresholds": {
    "trust": {
      "50": {
        "unlocks": "special_stock",
        "dialogue": "You've proven yourself trustworthy. Let me show you the good stuff."
      }
    },
    "respect": {
      "30": {
        "unlocks": "discount",
        "priceModifier": 0.9
      }
    }
  },

  "dialogue": {
    "greeting": "Need something forged? Or perhaps you've got metal to sell?",
    "greeting_repeat": "Back for more, eh?",
    "cannotBuy": "That's not my trade. Try the general store.",
    "cannotAfford": "Come back when you've got the coin.",
    "farewell": "May your blade strike true!"
  }
}
```

---

## Shop Inventory Reference

Create inventories in `shop_inventories.json`:

```json
{
  "blacksmith_stock": [
    { "itemId": "iron_sword", "stock": 3, "restockDays": 7 },
    { "itemId": "steel_sword", "stock": 1, "restockDays": 14 },
    { "itemId": "leather_armor", "stock": 2, "restockDays": 7 },
    { "itemId": "chain_mail", "stock": 1, "restockDays": 14 },
    { "itemId": "health_potion", "stock": 5, "restockDays": 3 }
  ],

  "witch_stock": [
    { "itemId": "antidote", "stock": 5, "restockDays": 3 },
    { "itemId": "corruption_cure", "stock": 2, "restockDays": 7 },
    { "itemId": "aphrodisiac_herb", "stock": 3, "restockDays": 5, "requiresTags": ["nsfw"] }
  ]
}
```
