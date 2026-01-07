# Scene Template

Scenes are dialogue sequences, story events, and interactive encounters. They use a node-based system.

**File Location:** `public/datapacks/core/scenes/*.json`

---

## Basic Scene Template

```json
{
  "id": "scene_id",                           // * REQUIRED: Unique ID
  "name": "Scene Name",                       // * REQUIRED: Display name
  "description": "Scene description",         // * REQUIRED: For editor/tracking
  "tags": ["story", "vanilla"],               // * REQUIRED: Scene tags
  "location": "location_id",                  // OPTIONAL: Required location

  "onEnter": [                                // OPTIONAL: Actions on scene start
    { "type": "playMusic", "trackId": "scene_music" }
  ],

  "nodes": [                                  // * REQUIRED: Scene content
    // Node definitions here
  ],

  "onExit": [                                 // OPTIONAL: Actions on scene end
    { "type": "setFlag", "flag": "scene_completed", "value": true }
  ]
}
```

---

## Node Types

### Dialogue Node
Basic text display with optional speaker.

```json
{
  "type": "dialogue",
  "speaker": "Character Name",               // OPTIONAL: Who's speaking
  "speakerImage": "/npcs/character.png",     // OPTIONAL: Portrait
  "text": "The dialogue text here.",         // * REQUIRED: What they say
  "emotion": "friendly"                      // OPTIONAL: Expression
}
```

#### Text Variants (Conditional)
```json
{
  "type": "dialogue",
  "speaker": "NPC",
  "text": "Default text here.",
  "variants": [
    {
      "condition": { "type": "stat", "stat": "intelligence", "operator": ">=", "value": 7 },
      "text": "I see you're quite clever. Let me explain in more detail..."
    },
    {
      "condition": { "type": "nsfwStat", "stat": "corruption", "operator": ">=", "value": 50 },
      "text": "I sense the darkness within you... You understand."
    }
  ]
}
```

### Choice Node
Player makes a decision.

```json
{
  "type": "choice",
  "prompt": "What do you do?",               // OPTIONAL: Question text
  "choices": [
    {
      "id": "choice_1",                      // * REQUIRED: Choice ID
      "text": "Option 1",                    // * REQUIRED: Button text
      "goto": 5                              // Go to node index 5
    },
    {
      "id": "choice_2",
      "text": "Option 2",
      "gotoLabel": "labeled_node"            // Go to labeled node
    },
    {
      "id": "choice_3",
      "text": "Option 3",
      "nextScene": "another_scene"           // Start different scene
    },
    {
      "id": "choice_4",
      "text": "[Requires Level 5]",
      "showIf": { "type": "level", "operator": ">=", "value": 5 },
      "goto": 10
    },
    {
      "id": "choice_5",
      "text": "[NSFW Option]",
      "requiresTags": ["nsfw"],              // Requires NSFW enabled
      "gotoLabel": "nsfw_path"
    }
  ]
}
```

#### Choice with Actions
```json
{
  "id": "give_gold",
  "text": "Give them 50 gold",
  "actions": [
    { "type": "removeGold", "amount": 50 },
    { "type": "modifyRelationship", "npcId": "beggar", "amount": 20 }
  ],
  "gotoLabel": "gave_gold"
}
```

### Action Node
Execute game actions.

```json
{
  "type": "action",
  "actions": [
    { "type": "giveItem", "itemId": "health_potion", "count": 2 },
    { "type": "giveGold", "amount": 100 },
    { "type": "setFlag", "flag": "quest_started", "value": true },
    { "type": "startQuest", "questId": "main_quest" },
    { "type": "showToast", "toastType": "item", "title": "Item Found", "message": "+2 Health Potion" }
  ]
}
```

### Branch Node
Conditional branching based on game state.

```json
{
  "type": "branch",
  "branches": [
    {
      "condition": { "type": "stat", "stat": "charm", "operator": ">=", "value": 10 },
      "gotoLabel": "charm_success"
    },
    {
      "condition": { "type": "flag", "flag": "knows_secret" },
      "gotoLabel": "secret_option"
    }
  ],
  "default": {
    "gotoLabel": "normal_path"
  }
}
```

### Stat Check Node
Dice roll or stat comparison.

```json
{
  "type": "statCheck",
  "stat": "willpower",                       // Stat to check
  "difficulty": 6,                           // Target number
  "onSuccess": {
    "gotoLabel": "check_success"
  },
  "onFailure": {
    "gotoLabel": "check_failure"
  }
}
```

### End Node
Terminates the scene.

```json
{
  "type": "end",
  "outcome": "scene_outcome_name"            // Outcome identifier
}
```

### Label Node
Mark a point for goto references.

```json
{
  "type": "dialogue",
  "label": "my_label",                       // Can be jumped to
  "text": "This node has a label."
}
```

---

## Input Nodes (New in v0.7)

### Text Input
```json
{
  "type": "textInput",
  "prompt": "What is your name?",
  "variableName": "playerNameInput",
  "validation": {
    "required": true,
    "minLength": 2,
    "maxLength": 20,
    "pattern": "^[a-zA-Z]+$"
  },
  "placeholder": "Enter your name...",
  "gotoLabel": "name_entered"
}
```

### Number Input
```json
{
  "type": "numberInput",
  "prompt": "How many nights do you want to stay?",
  "variableName": "nightCount",
  "validation": {
    "required": true,
    "min": 1,
    "max": "Math.floor(player.gold / 10)"    // Dynamic max
  },
  "costDisplay": {
    "formula": "value * 10",
    "label": "Cost: {result} gold"
  },
  "gotoLabel": "nights_selected"
}
```

### Dropdown Input
```json
{
  "type": "dropdown",
  "prompt": "Select a room type:",
  "variableName": "roomSelection",
  "options": [
    { "value": "basic", "label": "Basic Room (10g)", "showIf": null },
    { "value": "standard", "label": "Standard Room (25g)" },
    {
      "value": "deluxe",
      "label": "Deluxe Suite (50g)",
      "showIf": { "type": "stat", "stat": "gold", "operator": ">=", "value": 50 }
    }
  ],
  "gotoLabel": "room_selected"
}
```

---

## Scene Actions

### Item Actions
```json
{ "type": "giveItem", "itemId": "item_id", "count": 1 }
{ "type": "removeItem", "itemId": "item_id", "count": 1 }
{ "type": "giveGold", "amount": 100 }
{ "type": "removeGold", "amount": 50 }
```

### Stat Actions
```json
{ "type": "modifyStat", "stat": "hp", "amount": 20 }
{ "type": "heal", "amount": 50 }
{ "type": "damage", "amount": 10 }
{ "type": "modifyCorruption", "amount": 5 }
{ "type": "modifyArousal", "amount": 3 }
```

### Flag Actions
```json
{ "type": "setFlag", "flag": "flag_name", "value": true }
{ "type": "incrementFlag", "flag": "counter_flag", "amount": 1 }
```

### Quest Actions
```json
{ "type": "startQuest", "questId": "quest_id" }
{ "type": "completeQuest", "questId": "quest_id" }
{ "type": "failQuest", "questId": "quest_id" }
{ "type": "advanceQuest", "questId": "quest_id", "stage": 2 }
```

### Effect Actions
```json
{ "type": "applyEffect", "effectId": "effect_id", "duration": 5 }
{ "type": "removeEffect", "effectId": "effect_id" }
```

### Relationship Actions
```json
{ "type": "modifyRelationship", "npcId": "npc_id", "amount": 10 }
{ "type": "modifyRelationship", "npcId": "npc_id", "stat": "trust", "amount": 5 }
```

### UI Actions
```json
{ "type": "showToast", "toastType": "buff", "title": "Title", "message": "Message" }
{ "type": "playSound", "soundId": "sound_effect" }
{ "type": "playMusic", "trackId": "music_track" }
```

### Location Actions
```json
{ "type": "unlockLocation", "locationId": "location_id" }
{ "type": "teleport", "locationId": "location_id" }
```

### Achievement Actions
```json
{ "type": "unlockAchievement", "achievementId": "achievement_id" }
```

---

## Conditions

### Stat Conditions
```json
{ "type": "stat", "stat": "strength", "operator": ">=", "value": 10 }
{ "type": "stat", "stat": "gold", "operator": ">", "value": 100 }
```

### Level Condition
```json
{ "type": "level", "operator": ">=", "value": 5 }
```

### Flag Condition
```json
{ "type": "flag", "flag": "quest_complete" }
{ "type": "flag", "flag": "knows_secret", "value": true }
```

### Item Condition
```json
{ "type": "hasItem", "itemId": "key_item" }
{ "type": "hasItem", "itemId": "gold", "operator": ">=", "value": 50 }
```

### Quest Condition
```json
{ "type": "quest_complete", "quest": "quest_id" }
{ "type": "quest_active", "quest": "quest_id" }
```

### Location Condition
```json
{ "type": "visited_location", "location": "location_id" }
{ "type": "current_location", "location": "location_id" }
```

### NPC Relationship
```json
{ "type": "npc_relationship", "npc": "npc_id", "stat": "trust", "operator": ">=", "value": 50 }
```

### NSFW Conditions
```json
{ "type": "nsfwStat", "stat": "corruption", "operator": ">=", "value": 30 }
{ "type": "nsfwStat", "stat": "arousal", "operator": ">=", "value": 5 }
{ "type": "addiction", "addiction": "cum", "operator": ">=", "value": 20 }
```

### Combined Conditions
```json
{
  "type": "and",
  "conditions": [
    { "type": "level", "operator": ">=", "value": 5 },
    { "type": "flag", "flag": "has_key" }
  ]
}

{
  "type": "or",
  "conditions": [
    { "type": "stat", "stat": "charm", "operator": ">=", "value": 10 },
    { "type": "flag", "flag": "bribed_guard" }
  ]
}
```

---

## Complete Example: Inn Introduction

```json
{
  "id": "inn_intro",
  "name": "Welcome to the Inn",
  "description": "Introduction to the starting inn",
  "tags": ["story", "vanilla", "intro"],
  "location": "starting_inn",

  "onEnter": [
    { "type": "playMusic", "trackId": "tavern_ambient" }
  ],

  "nodes": [
    {
      "type": "dialogue",
      "text": "You push open the heavy wooden door. Warmth and the smell of ale wash over you."
    },
    {
      "type": "dialogue",
      "speaker": "Innkeeper Mary",
      "speakerImage": "/npcs/mary.png",
      "text": "Welcome, traveler! Come in, come in. You look like you could use a warm meal.",
      "emotion": "friendly"
    },
    {
      "type": "choice",
      "prompt": "How do you respond?",
      "choices": [
        {
          "id": "friendly",
          "text": "Thank you. What do you have?",
          "actions": [
            { "type": "modifyRelationship", "npcId": "innkeeper_mary", "amount": 5 }
          ],
          "gotoLabel": "friendly_response"
        },
        {
          "id": "ask_room",
          "text": "I need a room for the night.",
          "gotoLabel": "room_inquiry"
        },
        {
          "id": "suspicious",
          "text": "Who wants to know?",
          "showIf": { "type": "stat", "stat": "willpower", "operator": ">=", "value": 8 },
          "gotoLabel": "suspicious_response"
        }
      ]
    },
    {
      "type": "dialogue",
      "label": "friendly_response",
      "speaker": "Innkeeper Mary",
      "text": "Today we have stew with fresh bread, and plenty of ale. 5 gold for a meal, 10 for a room."
    },
    {
      "type": "choice",
      "choices": [
        {
          "id": "buy_meal",
          "text": "I'll take a meal. [5 gold]",
          "showIf": { "type": "stat", "stat": "gold", "operator": ">=", "value": 5 },
          "actions": [
            { "type": "removeGold", "amount": 5 },
            { "type": "heal", "amount": 20 }
          ],
          "gotoLabel": "meal_purchased"
        },
        {
          "id": "buy_room",
          "text": "A room sounds good. [10 gold]",
          "showIf": { "type": "stat", "stat": "gold", "operator": ">=", "value": 10 },
          "nextScene": "inn_room_rental"
        },
        {
          "id": "decline",
          "text": "Maybe later.",
          "gotoLabel": "end_conversation"
        }
      ]
    },
    {
      "type": "dialogue",
      "label": "meal_purchased",
      "text": "The stew is hearty and filling. You feel restored.",
      "effects": [
        { "type": "showToast", "toastType": "heal", "title": "Meal", "message": "Restored 20 HP" }
      ]
    },
    {
      "type": "dialogue",
      "label": "room_inquiry",
      "speaker": "Innkeeper Mary",
      "text": "Certainly! 10 gold per night. Includes breakfast."
    },
    {
      "type": "branch",
      "branches": [
        {
          "condition": { "type": "stat", "stat": "gold", "operator": ">=", "value": 10 },
          "goto": 4
        }
      ],
      "default": { "gotoLabel": "no_gold" }
    },
    {
      "type": "dialogue",
      "label": "no_gold",
      "speaker": "Innkeeper Mary",
      "text": "Oh dear... you don't seem to have enough coin. Perhaps you could work for a room?"
    },
    {
      "type": "dialogue",
      "label": "suspicious_response",
      "speaker": "Innkeeper Mary",
      "text": "My, my. A cautious one! I'm just Mary, trying to run an honest business. No tricks here.",
      "emotion": "amused"
    },
    {
      "type": "dialogue",
      "label": "end_conversation",
      "speaker": "Innkeeper Mary",
      "text": "Well, I'll be here if you need anything. Make yourself at home."
    },
    {
      "type": "end",
      "outcome": "inn_intro_complete"
    }
  ],

  "onExit": [
    { "type": "setFlag", "flag": "met_innkeeper", "value": true }
  ]
}
```

---

## NSFW Scene Example

```json
{
  "id": "corruption_scene",
  "name": "Dark Temptation",
  "description": "Corruption encounter",
  "tags": ["nsfw", "corruption", "demon"],
  "location": "corrupted_grove",

  "nodes": [
    {
      "type": "dialogue",
      "text": "A dark presence materializes before you, taking an alluring form."
    },
    {
      "type": "statCheck",
      "stat": "willpower",
      "difficulty": 8,
      "onSuccess": { "gotoLabel": "resist" },
      "onFailure": { "gotoLabel": "succumb" }
    },
    {
      "type": "dialogue",
      "label": "resist",
      "text": "You steel your mind against the temptation."
    },
    {
      "type": "action",
      "actions": [
        { "type": "modifyCorruption", "amount": 5 }
      ]
    },
    {
      "type": "end",
      "outcome": "resisted"
    },
    {
      "type": "dialogue",
      "label": "succumb",
      "text": "Your resistance crumbles as dark pleasure washes over you..."
    },
    {
      "type": "action",
      "actions": [
        { "type": "modifyCorruption", "amount": 20 },
        { "type": "modifyArousal", "amount": 5 },
        { "type": "applyEffect", "effectId": "corruption_aura" }
      ]
    },
    {
      "type": "end",
      "outcome": "succumbed"
    }
  ]
}
```
