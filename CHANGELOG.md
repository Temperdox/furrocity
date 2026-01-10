# Changelog

All notable changes to Furrocity Engine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.8.3] - 2026-01-08

### Added

#### Content Generator - Collapsible Sections
- **CollapsibleSection shared component** - Reusable collapsible UI component for form organization
  - Arrow indicators (▶/▼) for collapsed/expanded state
  - Optional badge prop for showing counts or status when collapsed
  - Consistent styling across all creator tabs
- **All 14 creator tabs now use CollapsibleSection** for consistent UI:
  - ItemCreator: Effects, NSFW, Tags, Sprites sections
  - LocationCreator: Properties, Encounters, Services, NSFW, Sprites sections
  - EnemyCreator: Base Stats, Combat, Loot, Dialogue, Sprites sections
  - NPCCreator: Appearance, Dialogue, Schedule, Sprites sections
  - SceneCreator: Variables, Choices sections
  - QuestCreator: Requirements, Objectives, Rewards sections
  - EffectCreator: Stat Modifications, Duration, Stacking sections
  - SkillCreator: Effects, Requirements sections
  - CharacterCreator: Stats, Biography, Equipment sections
  - DialogueCreator: Conditions, Responses, Actions sections
  - RegionCreator: Locations, Connections, Weather sections
  - LootTableCreator: Pool Entries section
  - EncounterTableCreator: Conditions, Encounters, Loot Tables sections
  - SubstanceCreator: Dosing, Timing, Effects, Tolerance, Addiction, Overdose, Resistance sections
  - MerchantCreator: NSFW Settings, Buy/Sell Config, Dialogue, Inventory sections
- **Badge indicators** show item counts when sections are collapsed (e.g., "3" for 3 effects)
- **Smart defaults** - Less frequently used sections start collapsed to reduce visual clutter

### Changed

- Basic Info sections remain always visible (not collapsible) across all creator tabs
- Improved form organization with logical section groupings

---

## [0.8.2] - 2026-01-07

### Added

#### LocationCreator - Discovery Requirements Logic Builder
- **Visual condition builder** for hidden location discovery requirements
  - Appears when "Hidden (requires discovery)" is checked
  - Block-based visual programming interface similar to Scratch/Blockly
- **Logic blocks**:
  - **AND Group** - All conditions must be true (green blocks)
  - **OR Group** - Any condition can be true (orange blocks)
  - **NOT** - Inverts the result of a condition (red blocks)
- **Condition categories** with color-coded blocks:
  - 📦 **Item** - hasItem, hasItemCount
  - ⚔️ **Equipment** - hasEquipped, hasSlotEquipped
  - 📊 **Player Stat** - statCheck (with operators: =, ≠, >, ≥, <, ≤), levelCheck
  - 📜 **Quest** - questCompleted, questActive, questObjective
  - 🎬 **Scene** - sceneCompleted, sceneChoice
  - 🚩 **Game Flag** - flagSet, flagValue
  - 📍 **Location** - visitedLocation, currentLocation
- **Nestable conditions** - Create complex logic trees with unlimited depth
- **Dynamic dropdowns** - Select from datapack items, quests, scenes, locations

#### LocationCreator - Navigation Direction Modal
- **Direction selection modal** - Click any direction (up, down, left, right, forward, back, enter, exit) to open a searchable modal
  - Search bar with fuzzy matching for location names and IDs
  - Results sorted by match quality (exact matches first, then prefix matches, then substring matches)
  - Alphabetical sorting when no search query
  - Visual feedback showing linked location name or "No link"
  - Clear/remove link option with × button in active links list
- **Fixed duplicate locations** in parent region/location dropdowns by deduplicating by ID
- **Locations now selectable from datapack** - Direction links can now reference datapack locations, not just user-created ones

#### Content Generator - Dynamic Tag Suggestions
- **All Creator tabs now display dynamic clickable tag suggestions** below tag input fields
  - Tags are dynamically collected from datapack content, user-created content, and fallback defaults
  - Clicking a tag instantly adds it to the current item
  - Tags are deduplicated and sorted alphabetically
- **collectTags utility** in DatapackLoader.js for unified tag collection across all creators
- **NPCCreator**: Added tag suggestions for merchant Accepted/Rejected Item Tags (color-coded: green for accepted, red for rejected)
- **ItemCreator, EnemyCreator, LocationCreator, SceneCreator, EffectCreator**: Updated with dynamic tags from respective content types
- **SkillCreator, QuestCreator**: Added tag suggestion buttons (previously had no suggestions)

#### Content Generator - Clickable Button Suggestions
- **All Creator tabs now use clickable button tags** for type/category/role fields
  - Suggestions displayed as `+ value` buttons below input fields
  - Users can type custom values OR click suggestions to select
  - Consistent UI pattern across all creators
- **NPCCreator**: `role` field with button suggestions
- **ItemCreator**: `type` and `rarity` fields with button suggestions
- **CharacterCreator**: `species`, `gender`, `bodyType`, `faceStyle` fields with button suggestions
- **EnemyCreator**: `type` and `variant` fields with button suggestions
- **LocationCreator**: `type` field with button suggestions
- **SkillCreator**: `type`, `category`, `targetType`, `damageType` fields with button suggestions
- **QuestCreator**: `type` field with button suggestions

#### Content Generator - New Creator Tabs
- **QuestCreator** - Full quest creation system with:
  - Quest types: main, side, daily, repeatable, hidden, event
  - Objectives: kill, collect, deliver, talk, visit, explore, interact, survive, escort, craft, equip, reach level/stat
  - Prerequisites (quests, levels, items, faction)
  - Rewards (XP, gold, items, reputation, unlockable content)
  - Quest dialogue and failure conditions
- **SkillCreator** - Skill/ability system with:
  - Skill types: active, passive, toggle, reaction
  - Effect types: damage, heal, buff, debuff, apply status, remove status, summon, teleport, etc.
  - Resource costs: stamina, HP, cooldowns
  - Requirements: level, stats, equipment
  - Effect targeting and duration
- **LootTableCreator** - Loot table system with:
  - Weighted random entries with visual probability bars
  - Guaranteed drops section
  - Gold/currency ranges
  - Roll count configuration
  - Item selection from datapacks
- **Loading screen** - Shows animated loading screen while fetching datapack resources
  - Spinning progress indicator
  - Animated progress bar
  - Resource count in status bar

#### NPC Travel System
- **NPCLocationSystem** - New engine module for dynamic NPC locations based on time schedules
  - NPCs can have schedules defining where they are at different times of day
  - Temporary teleport overrides (clears on time period change)
  - NPC hide/show for story events
  - Interaction locks prevent NPCs from moving during player interaction
- **NPC Schedule Editor** in NPCCreator
  - Add time slots with start hour, end hour, and location
  - Default location for when no schedule applies
  - Visual schedule management with add/remove buttons
- **New Scene Actions**:
  - `setTimeOfDay`: Jump to day (7:00) or night (21:00), day increments only when going backwards
  - `modifyTime`: Add or subtract minutes with input field
  - `teleportNPC`: Temporarily move NPC to a location (clears on time period change)
  - `hideNPC`: Remove NPC from all locations until shown
  - `showNPC`: Restore hidden NPC to their scheduled location
- **MerchantSystem Integration** - `getMerchantsAtLocation()` now uses NPCLocationSystem for dynamic location tracking
- **TimeSystem.setTimeOfDay()** - New method for time manipulation with smart day increment logic

#### Content Generator - Datapack Integration
- **DatapackLoader utility** - Loads content from game datapacks for use in selection dropdowns
  - Loads items, locations, enemies, effects, NPCs, scenes, characters, merchants
  - Content is cached after first load for performance
  - Automatically combines datapack content with user-created content
- **Smart action field editors in Scene Creator** - Action fields now show appropriate selectors based on action type
  - `giveItem`/`removeItem`: Item dropdown with all datapack and created items
  - `teleport`/`unlockLocation`: Location dropdown with all datapack and created locations
  - `applyEffect`/`removeEffect`: Effect dropdown with duration and stacks fields
  - `modifyStat`: Stat dropdown with all player stats
  - `modifyRelationship`: NPC dropdown
  - `showToast`: Toast type dropdown, title, and message fields
- **Datapack selectors in all Creator tabs**
  - LocationCreator: NPCs and enemies from datapacks now appear in selection dropdowns
  - EnemyCreator: Items from datapacks appear in loot drop dropdown
  - NPCCreator: Locations from datapacks appear in location selector

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

## File Changes Summary (0.8.2)

### New Files
- `src/components/generator/DatapackLoader.js` - Utility for loading and caching datapack content

### Modified Files
- `src/components/generator/ContentGenerator.jsx` - Added datapack loading and passing to tab components
- `src/components/generator/tabs/SceneCreator.jsx` - Smart action field editors with datapack selectors
- `src/components/generator/tabs/LocationCreator.jsx` - Datapack-aware NPC/enemy selectors, custom type input
- `src/components/generator/tabs/EnemyCreator.jsx` - Datapack-aware item drop selector, custom type/variant input
- `src/components/generator/tabs/NPCCreator.jsx` - Datapack-aware location selector, schedule editor, custom role input
- `src/components/generator/tabs/ItemCreator.jsx` - Added datapackContent prop, custom type/rarity input
- `src/components/generator/tabs/EffectCreator.jsx` - Added datapackContent prop
- `src/components/generator/tabs/CharacterCreator.jsx` - Added datapackContent prop, custom species/gender/bodyType/faceStyle input
- `src/components/generator/tabs/SkillCreator.jsx` - Custom type/category/targetType/damageType input
- `src/components/generator/tabs/QuestCreator.jsx` - Custom quest type input

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
