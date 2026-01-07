# Effect Template

Effects are buffs, debuffs, status conditions, and other temporary modifiers applied to the player.

**File Location:** `public/datapacks/core/effects/core_effects.json`

---

## Basic Effect Template

```json
{
  "id": "effect_id",                          // * REQUIRED: Unique ID
  "name": "Effect Name",                      // * REQUIRED: Display name
  "description": "What this effect does",     // * REQUIRED: Tooltip text
  "type": "buff",                             // * REQUIRED: Effect type
  "tags": ["buff", "strength"],               // * REQUIRED: Effect tags

  "icon": {                                   // * REQUIRED: Display icon
    "type": "sprite",
    "sheetId": "effects",
    "iconId": "effect_icon"
  },

  "stackBehavior": "refresh",                 // * REQUIRED: How stacks work
  "maxStacks": 1,                             // OPTIONAL: Max stack count

  "duration": {                               // * REQUIRED: How long it lasts
    "type": "turns",
    "value": 5
  },

  "modifiers": [],                            // OPTIONAL: Stat modifications
  "triggers": {}                              // OPTIONAL: Triggered actions
}
```

---

## Effect Types

| Type | Description | Example |
|------|-------------|---------|
| `buff` | Positive effect | Strength Up |
| `debuff` | Negative effect | Poison, Bleeding |
| `status` | Neutral state | Aroused, Exposed |
| `curse` | Permanent negative | Curse of Lust |
| `addiction` | Substance dependency | Cum Addiction |
| `restraint` | Movement restriction | Rope Bound |
| `environment` | Area effect | Corruption Aura |
| `instant` | Immediate effect | Magic Damage |

---

## Stack Behaviors

| Behavior | Description |
|----------|-------------|
| `refresh` | Reset duration on reapply |
| `stack` | Add stacks, each with own effect |
| `intensify` | Increase severity level |
| `replace` | Replace existing effect |

```json
// Stacking DOT (damage per stack)
{
  "stackBehavior": "stack",
  "maxStacks": 5,
  "triggers": {
    "onTurnStart": [{
      "action": {
        "type": "damage",
        "amount": { "type": "perStack", "perStack": 3 }
      }
    }]
  }
}

// Refreshing buff
{
  "stackBehavior": "refresh",
  "duration": { "type": "turns", "value": 5 }
}

// Intensifying curse
{
  "stackBehavior": "intensify",
  "duration": { "type": "permanent" }
}
```

---

## Duration Types

```json
// Turn-based
{ "type": "turns", "value": 5 }

// Permanent until removed
{ "type": "permanent" }

// Until condition met
{
  "type": "untilCondition",
  "condition": { "type": "isRestrained", "not": true }
}

// Until combat ends
{ "type": "untilCombatEnd" }

// Instant (triggers once, then removes)
{ "type": "instant" }
```

---

## Modifiers

Stat modifications while effect is active:

```json
{
  "modifiers": [
    {
      "stat": "strength",
      "operation": "percent",
      "value": 25                             // +25% strength
    },
    {
      "stat": "evasion",
      "operation": "flat",
      "value": -10                            // -10 evasion
    },
    {
      "stat": "willpower",
      "operation": "percent",
      "value": -20,
      "condition": { "type": "stackCount", "operator": ">=", "value": 3 }
    }
  ]
}
```

### Operations

| Operation | Description | Example |
|-----------|-------------|---------|
| `flat` | Add/subtract value | `+10` or `-5` |
| `percent` | Percentage modifier | `+25%` or `-30%` |
| `set` | Set to specific value | `canAct = false` |

### Common Stats

**Combat:** `strength`, `vitality`, `evasion`, `speed`, `attack`, `defense`

**Mental:** `willpower`, `intelligence`, `charm`

**Special:** `corruptionResistance`, `stealth`, `luck`

**NSFW:** `arousal`, `corruption`, `canClimax`

**Boolean:** `canAct`, `isRestrained`

---

## Triggers

Actions that happen at specific moments:

```json
{
  "triggers": {
    "onApply": [],           // When effect first applied
    "onRemove": [],          // When effect removed
    "onStack": [],           // When stack added
    "onTurnStart": [],       // Start of turn
    "onTurnEnd": [],         // End of turn
    "onHit": [],             // When player hit
    "onDealDamage": [],      // When player deals damage
    "onHeal": []             // When player healed
  }
}
```

### Trigger Actions

```json
// Damage over time
{
  "onTurnStart": [{
    "condition": { "type": "always" },
    "action": {
      "type": "damage",
      "amount": { "type": "perStack", "perStack": 5 },
      "damageType": "poison"
    }
  }]
}

// Heal over time
{
  "onTurnStart": [{
    "condition": { "type": "always" },
    "action": {
      "type": "heal",
      "amount": { "type": "perStack", "perStack": 5 }
    }
  }]
}

// Apply another effect
{
  "onStack": [{
    "condition": { "type": "stackCount", "operator": ">=", "value": 10 },
    "action": {
      "type": "triggerScene",
      "sceneId": "climax_scene"
    }
  }]
}

// Show notification
{
  "onApply": [{
    "condition": { "type": "always" },
    "action": {
      "type": "showToast",
      "toastType": "debuff",
      "title": "Poisoned!",
      "message": "Venom courses through your veins..."
    }
  }]
}

// Modify corruption
{
  "onTurnEnd": [{
    "condition": { "type": "stackCount", "operator": ">=", "value": 5 },
    "action": {
      "type": "modifyCorruption",
      "amount": 1
    }
  }]
}

// Remove on heal
{
  "onHeal": [{
    "condition": { "type": "always" },
    "action": {
      "type": "removeEffect",
      "effectId": "bleeding"
    }
  }]
}

// Random trigger
{
  "onTurnStart": [{
    "condition": { "type": "random", "chance": 0.1 },
    "action": {
      "type": "modifyCorruption",
      "amount": 1
    }
  }]
}
```

---

## Apply Conditions

Conditions that must be met to apply the effect:

```json
{
  "applyConditions": {
    "not": { "type": "hasTag", "tag": "immune_poison" }
  }
}
```

---

## Effect Templates

### DOT Debuff (Poison)
```json
{
  "id": "poison",
  "name": "Poison",
  "description": "Taking damage over time from poison.",
  "type": "debuff",
  "tags": ["poison", "dot", "nature"],
  "icon": { "type": "sprite", "sheetId": "effects", "iconId": "poison" },
  "stackBehavior": "stack",
  "maxStacks": 5,
  "duration": { "type": "turns", "value": 5 },
  "modifiers": [],
  "triggers": {
    "onTurnStart": [{
      "condition": { "type": "always" },
      "action": {
        "type": "damage",
        "amount": { "type": "perStack", "perStack": 3 },
        "damageType": "poison"
      }
    }],
    "onApply": [{
      "condition": { "type": "always" },
      "action": {
        "type": "showToast",
        "toastType": "debuff",
        "title": "Poisoned!",
        "message": "You feel the venom coursing through your veins..."
      }
    }]
  }
}
```

### Stat Buff (Strength Up)
```json
{
  "id": "strength_up",
  "name": "Strength Up",
  "description": "Increased physical power.",
  "type": "buff",
  "tags": ["buff", "strength", "physical"],
  "icon": { "type": "sprite", "sheetId": "effects", "iconId": "strength_up" },
  "stackBehavior": "refresh",
  "duration": { "type": "turns", "value": 5 },
  "modifiers": [
    { "stat": "strength", "operation": "percent", "value": 25 },
    { "stat": "attack", "operation": "percent", "value": 15 }
  ],
  "triggers": {
    "onApply": [{
      "condition": { "type": "always" },
      "action": {
        "type": "showToast",
        "toastType": "buff",
        "title": "Strength Up!",
        "message": "+25% Strength"
      }
    }]
  }
}
```

### Restraint Effect
```json
{
  "id": "restrained_rope",
  "name": "Rope Bound",
  "description": "Bound by ropes, movement restricted.",
  "type": "restraint",
  "tags": ["restraint", "rope", "bondage"],
  "icon": { "type": "sprite", "sheetId": "effects", "iconId": "bound" },
  "stackBehavior": "replace",
  "duration": {
    "type": "untilCondition",
    "condition": { "type": "isRestrained", "not": true }
  },
  "modifiers": [
    { "stat": "evasion", "operation": "percent", "value": -50 },
    { "stat": "attack", "operation": "percent", "value": -30 }
  ],
  "applyConditions": {
    "not": { "type": "hasTag", "tag": "immune_restraint" }
  },
  "triggers": {
    "onApply": [{
      "condition": { "type": "always" },
      "action": {
        "type": "addRestraint",
        "restraintType": "rope_bind",
        "hp": 30
      }
    }]
  }
}
```

### Curse (Permanent)
```json
{
  "id": "curse_lust",
  "name": "Curse of Lust",
  "description": "An insidious curse that increases vulnerability.",
  "type": "curse",
  "tags": ["curse", "lust", "nsfw"],
  "icon": { "type": "sprite", "sheetId": "effects", "iconId": "cursed" },
  "stackBehavior": "intensify",
  "duration": { "type": "permanent" },
  "modifiers": [
    { "stat": "willpower", "operation": "percent", "value": -20 },
    { "stat": "corruptionResistance", "operation": "percent", "value": -30 }
  ],
  "triggers": {
    "onTurnEnd": [{
      "condition": { "type": "random", "chance": 0.1 },
      "action": { "type": "modifyCorruption", "amount": 1 }
    }],
    "onApply": [{
      "condition": { "type": "always" },
      "action": {
        "type": "showToast",
        "toastType": "curse",
        "title": "Cursed!",
        "message": "A dark desire takes hold..."
      }
    }]
  }
}
```

### NSFW Status (Aroused)
```json
{
  "id": "aroused",
  "name": "Aroused",
  "description": "Distracted by physical sensations.",
  "type": "status",
  "tags": ["arousal", "nsfw", "distraction"],
  "icon": { "type": "sprite", "sheetId": "effects", "iconId": "aroused" },
  "stackBehavior": "stack",
  "maxStacks": 10,
  "duration": { "type": "turns", "value": 10 },
  "modifiers": [
    {
      "stat": "willpower",
      "operation": "flat",
      "value": -1,
      "condition": { "type": "stackCount", "operator": ">=", "value": 1 }
    },
    {
      "stat": "intelligence",
      "operation": "flat",
      "value": -1,
      "condition": { "type": "stackCount", "operator": ">=", "value": 5 }
    }
  ],
  "triggers": {
    "onStack": [{
      "condition": { "type": "stackCount", "operator": ">=", "value": 10 },
      "action": {
        "type": "triggerScene",
        "sceneId": "climax_scene"
      }
    }],
    "onTurnEnd": [{
      "condition": { "type": "stackCount", "operator": ">=", "value": 5 },
      "action": { "type": "modifyCorruption", "amount": 1 }
    }]
  }
}
```

### Environment Effect
```json
{
  "id": "corruption_aura",
  "name": "Corruption Aura",
  "description": "Surrounded by corrupting influence.",
  "type": "environment",
  "tags": ["corruption", "aura", "environment"],
  "icon": { "type": "sprite", "sheetId": "effects", "iconId": "corrupted" },
  "stackBehavior": "replace",
  "duration": { "type": "untilCombatEnd" },
  "modifiers": [
    { "stat": "corruptionResistance", "operation": "percent", "value": -25 }
  ],
  "triggers": {
    "onTurnStart": [{
      "condition": { "type": "always" },
      "action": { "type": "modifyCorruption", "amount": 2 }
    }]
  }
}
```

### Instant Effect
```json
{
  "id": "magic_damage_small",
  "name": "Magic Damage",
  "description": "Arcane energy burns the target.",
  "type": "instant",
  "tags": ["magic", "damage", "instant"],
  "icon": { "type": "sprite", "sheetId": "effects", "iconId": "magic_up" },
  "duration": { "type": "instant" },
  "triggers": {
    "onApply": [{
      "condition": { "type": "always" },
      "action": {
        "type": "damage",
        "amount": { "type": "random", "min": 5, "max": 10 },
        "damageType": "magic"
      }
    }]
  }
}
```
