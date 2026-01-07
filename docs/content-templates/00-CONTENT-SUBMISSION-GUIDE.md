# Furrocity Content Submission Guide

## Overview

This guide explains how to create and submit content for Furrocity. All game content is defined in JSON files within datapacks. The engine automatically loads these files at runtime.

---

## Quick Reference

| Content Type | Template File | JSON Location |
|-------------|---------------|---------------|
| Regions | `01-REGION-TEMPLATE.md` | `datapacks/core/locations/regions.json` |
| Locations | `02-LOCATION-TEMPLATE.md` | `datapacks/core/locations/world_locations.json` |
| Enemies | `03-ENEMY-TEMPLATE.md` | `datapacks/core/enemies/*.json` |
| Items | `04-ITEM-TEMPLATE.md` | `datapacks/core/items/*.json` |
| Scenes | `05-SCENE-TEMPLATE.md` | `datapacks/core/scenes/*.json` |
| NPCs/Merchants | `06-NPC-MERCHANT-TEMPLATE.md` | `datapacks/core/merchants/*.json` |
| Effects | `07-EFFECT-TEMPLATE.md` | `datapacks/core/effects/*.json` |
| Story Outline | `08-STORY-PLANNING-TEMPLATE.md` | N/A (planning doc) |

---

## World Structure (5 Regions Goal)

For beta release, we need **5 global regions** with **5-20 local locations each**:

### Region 1: Crossroads (Starting Area) - DONE
- **Theme**: Safe frontier trading town
- **Locations**: ~10 (inn, square, blacksmith, temple, clinic, nursery, etc.)
- **Danger Level**: 1 (mostly safe)

### Region 2: Darkwood Forest - PARTIAL
- **Theme**: Corrupted ancient forest
- **Locations**: ~8 needed (forest path, wolf den, witch hut, corrupted grove, etc.)
- **Danger Level**: 2-4 (escalating danger)

### Region 3: Mountain Pass - NEEDED
- **Theme**: Treacherous mountain path with bandits
- **Locations**: ~6 needed (entrance, bandit camp, shrine, mine, summit)
- **Danger Level**: 3-4

### Region 4: Golden Plains - NEEDED
- **Theme**: Open grasslands with nomadic tribes
- **Locations**: ~5 needed (plains, nomad camp, burial mounds, oasis)
- **Danger Level**: 1-3

### Region 5: Demon Realm - PARTIAL
- **Theme**: Corrupted demon dimension (endgame)
- **Locations**: ~6 needed (portal, pools, succubus den, marketplace, slave pens, throne)
- **Danger Level**: 5

---

## Content IDs

All content needs unique IDs. Use this naming convention:

```
{category}_{descriptor}_{variant}

Examples:
- forest_goblin
- iron_sword
- starting_inn
- intro_full
- poison_weak
```

**Rules:**
- Lowercase only
- Underscores for spaces
- Keep it descriptive but concise
- No special characters

---

## File Organization

```
public/datapacks/core/
  locations/
    regions.json          # Global regions (5 total)
    world_locations.json  # All local locations
  enemies/
    forest_enemies.json   # Enemies by region
    demon_enemies.json
  items/
    weapons_armor.json    # Combat equipment
    consumables.json      # Potions, food
    materials.json        # Crafting drops
  scenes/
    intro_scenes.json     # Story scenes
    combat_scenes.json    # Combat outcomes
    nsfw_scenes.json      # Adult content
  merchants/
    merchants.json        # NPC merchants
    shop_inventories.json # What they sell
  effects/
    core_effects.json     # Buffs/debuffs
  encounter_tables/
    forest_encounters.json
  loot_tables/
    forest_loot.json
```

---

## Tags System

Tags control content behavior. Common tags:

### Location Tags
- `safe` - No random encounters
- `dangerous` - Higher encounter rates
- `corrupted` - Corruption effects apply
- `nsfw_zone` - Adult content enabled
- `inn`, `shop`, `temple`, `clinic`, `nursery` - Service types
- `inhabited` - Has NPCs

### Enemy Tags
- `humanoid`, `beast`, `demon`, `undead`, `plant`, `ooze`
- `nsfw` - Has adult actions
- `boss` - Boss encounter
- `pack` - Appears in groups

### Item Tags
- `weapon`, `armor`, `consumable`, `material`
- `cursed` - Has curse effects
- `nsfw` - Adult item
- `stackable` - Can stack in inventory

### Scene Tags
- `story`, `combat`, `nsfw`, `vanilla`
- `intro`, `quest`, `random_event`

---

## Condition System

Conditions control when content appears. Basic syntax:

```json
{
  "type": "and",
  "conditions": [
    { "type": "level", "operator": ">=", "value": 5 },
    { "type": "quest_complete", "quest": "forest_quest" }
  ]
}
```

### Condition Types
- `level` - Player level check
- `stat` - Any player stat
- `quest_complete` / `quest_active`
- `flag` - Boolean game flags
- `visited_location` - Has been to location
- `has_item` - Inventory check
- `npc_relationship` - NPC trust/love/fear
- `time_of_day` - dawn, day, dusk, night
- `corruption` / `arousal` - NSFW stats

### Operators
- `>=`, `<=`, `>`, `<`, `==`, `!=`

---

## Branching & Sub-Routes

When creating content that branches significantly:

1. **Mark the branch point** in your submission:
   ```
   [BRANCH POINT: MC Enslaved Route]
   - Trigger: Player captured by slavers
   - Conditions: Lost combat in slave_pens, corruption > 50
   - Continues in: slave_route_scenes.json (TBD)
   ```

2. **Create a stub scene** that acknowledges the branch:
   ```json
   {
     "id": "enslaved_route_start",
     "name": "[STUB] Enslaved Route Beginning",
     "description": "BRANCH: Player enters slavery route",
     "tags": ["story", "branch_stub", "slavery_route"],
     "nodes": [
       {
         "type": "dialogue",
         "text": "[This route is under development. The MC has been enslaved and will face various challenges to regain freedom or embrace their new role.]"
       },
       {
         "type": "end",
         "outcome": "branch_stub"
       }
     ]
   }
   ```

3. **Track in the Story Planning doc** (Template 08)

---

## Submission Format

When submitting content:

1. **Use the appropriate template**
2. **Fill in ALL required fields** (marked with `*`)
3. **Test your JSON** at https://jsonlint.com/
4. **Include a summary** at the top:

```
SUBMISSION: [Content Type]
AUTHOR: [Your Name]
DATE: [Date]
FILES AFFECTED: [List of JSON files]

SUMMARY:
- Added 3 new enemies for Mountain Pass
- Added 2 scenes for bandit encounter
- Added loot table for bandits

DEPENDENCIES:
- Requires: mountain_pass region (exists)
- Creates: bandit_captain enemy (new)
```

---

## Testing Checklist

Before submitting, verify:

- [ ] JSON is valid (no syntax errors)
- [ ] All IDs are unique
- [ ] All referenced IDs exist (items, scenes, locations)
- [ ] Tags are consistent with existing content
- [ ] Conditions use valid operators
- [ ] Numbers are within expected ranges
- [ ] Text has no typos (use spellcheck)
- [ ] NSFW content is properly tagged

---

## Quick Start

1. Pick a template from this folder
2. Copy the JSON structure
3. Fill in your content
4. Validate the JSON
5. Submit with a summary

See individual template files for detailed field explanations.
