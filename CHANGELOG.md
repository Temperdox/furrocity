# Changelog

All notable changes to Furrocity Engine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
