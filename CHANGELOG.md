# Changelog

All notable changes to Furrocity Engine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.8.2] - 2026-01-06

### Added

#### Content Generator - Scene Creator
- **Multi-tag NSFW Action Categories** - Scenes can now have multiple action types (e.g., "penetrate + infest", "hypnotize + breed")
  - Press Enter to add action type as a tag chip
  - Quick buttons for common action types
  - Backwards compatible with old single `nsfwActionType` format
- **Text Tag Toolbar in Scene Nodes** - Moved interpolation tag insertion to dialogue nodes where text is written
  - Click category (Player, Enemy, Body Parts, etc.) then click tag to insert
  - Each dialogue node has its own collapsible tag toolbar

#### Gender System
- **New bidirectional gender scale** (-100 to +100)
  - `0` = Neutral starting point (paperdoll: masc_0)
  - `+1` to `+100` = Increasingly masculine (masc_1 → masc_10)
  - `-1` to `-100` = Increasingly feminine (fem_1 → fem_10)
- **`genderToFeminizationLevel(gender)`** - Converts gender value to paperdoll 0-20 scale
- **Bidirectional UI bar** - Pink fills left for feminine, blue fills right for masculine

#### Location Creator
- **Navigation system** - Link locations with directional navigation (up, down, left, right, forward, back)
- **Location scopes** - Region, Local, and Sub-location types
- **Enemy spawn tables** - Weighted enemy selection with variant modifiers (weak, normal, strong, elite)
- **NPC/Enemy selection** - Dropdown selectors from created content instead of text input

#### Bug Fixes & Stability
- Added `hypersensitiveAreas` array to player state (was referenced but never initialized)
- Added optional chaining (`?.`) to array length checks preventing null crashes
- Fixed SaveSystem serialization for removed `bodyMeasurements`

### Changed

#### Body Measurement System
- **Body sizes now calculated from gender** - No longer stored separately
  - `calculateBodyMeasurements(gender)` derives chest, hips, rear, genitals, testicles from gender value
  - Removed `bodyMeasurements` from player state and save data
  - Removed "Body Stats" display from stats screen (sizes are implicit from gender)

#### Renamed Properties
- `nsfwStats.masculinity` → `nsfwStats.gender` (scale changed from 0-100 to -100 to +100)
- `nsfwActionType` → `nsfwActionTypes` (string → array) in scenes

#### Text Interpolation
- Updated pronoun selection to use new gender scale:
  - `gender > 20` = male pronouns (he/him/his)
  - `gender < -20` = female pronouns (she/her/hers)
  - `-20` to `+20` = neutral pronouns (they/them/their)
- Updated `{if is_male}` / `{if is_female}` conditions

### Removed

- **Regions tab** from Content Generator (locations tab handles all location types)
- **Body Measurements display** from stats screen and PDF export
- Individual body size sliders (now derived from gender)

---

## [0.8.1] - 2026-01-06

### Added

#### Character System
- New `CharacterSystem` engine module for managing playable characters
- Characters are now loaded from datapacks (`characters/` content type)
- Support for per-character paperdoll folders with body type ranges:
  - Base body images: `masc_0` to `masc_10`, `fem_1` to `fem_10`
  - Chest variations by cup size
  - Genitalia variations (vagina, penis variants)
  - Face styles and variants
- Example characters added: Ceraph, Marcus, Shade, Luna

#### Content Generator - Import System
- **Import button** in Content Generator header
- **Drag & drop support** - drag JSON or ZIP files onto the window
- **File support:**
  - Single or multiple `.json` files
  - `.zip` archives containing multiple content files
  - Auto-detection of content type (items, characters, locations, enemies, scenes)
- **Backwards compatibility:**
  - Schema validation with current field definitions
  - Automatic field migration for old formats:
    - `slot` / `equipSlot` → `equipSlots` array
    - `paperdollImage` → `paperdoll.folder` / `paperdoll.filename`
    - `equippable` / `is_equippable` → `isEquippable`
    - `base_stats` / `stat_bonuses` / `stats` → `baseStats`
  - Default values applied for missing fields
- **ImportWarningsModal UI:**
  - Summary cards (imported count, warnings, errors, unmapped fields)
  - Tabs for reviewing different issue types
  - Field mapping dropdown for unmapped fields
  - Copy value and Ignore buttons
  - Apply Import / Cancel actions

#### Item Creator Improvements
- **"Equippable Item" checkbox** - controls visibility of equipment-related fields
- **Paperdoll configuration** now uses separate folder/filename fields:
  - `folder` - subfolder in `public/images/equipment/`
  - `filename` - image name without extension
- Equipment slots and paperdoll settings only show when item is equippable

### Changed

#### Equipment Slots
- Removed redundant `plug` equipment slot (use `ass` or `pussy` slots instead)
- `ass` slot now handles anal toys/plugs
- `pussy` slot now handles vaginal toys/plugs

#### Paperdoll System
- Updated `PaperdollSystem.getItemImagePath()` to support new folder/filename format
- Maintains backwards compatibility with legacy `imagePath` field

### Removed

- `plug` equipment slot from InventorySystem and PlayerStateSchema
- Redundant plug slot option from Content Generator ItemCreator

---

## [0.8.0] - Initial Release

### Added
- Core engine systems (DataRegistry, SceneRunner, CombatSystem, EffectSystem)
- Datapack system for modular content
- Inventory and equipment system with NSFW slots
- Paperdoll character visualization
- Fame, reputation, and rumor systems
- Location and travel systems
- Expedition system for region-to-region travel
- Time system with day/night cycle
- Substance and addiction system
- Encounter system with danger levels
- Merchant and trading system
- Loot table system
- Content Generator tool for creating game content
- NSFW combat scene system with madlib templates

---

## File Changes Summary (0.8.1)

### New Files
- `engine/CharacterSystem.js` - Character management system
- `src/components/generator/ImportSystem.js` - Import logic and schema migration
- `src/components/generator/ImportWarningsModal.jsx` - Import results UI
- `public/datapacks/core/characters/playable_characters.json` - Example characters

### Modified Files
- `engine/index.js` - Added CharacterSystem export
- `engine/InventorySystem.js` - Removed plug slot
- `engine/PlayerStateSchema.js` - Removed plug slot
- `engine/PaperdollSystem.js` - Updated for folder/filename format
- `public/datapacks/core/pack.json` - Added characters content type
- `src/components/generator/ContentGenerator.jsx` - Added import UI
- `src/components/generator/tabs/ItemCreator.jsx` - Added equippable checkbox, paperdoll fields
