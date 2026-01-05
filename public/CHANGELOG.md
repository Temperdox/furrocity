# Changelog

All notable changes to Furrocity will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.4.0] - 2026-01-05

### Added
- **Hierarchical Location Title Fonts**: Location titles now support multi-tag font resolution
  - Tags are matched in combination (all tags, then pairs) before falling back to individual tags
  - Gradient text for locations with multiple matched tags
  - Tag priority system determines which tag takes precedence for single matches
  - Hidden tags are filtered out until discovered by the player
- **Combination Font Tags**: Define custom font styles for specific tag combinations
  - Example: `corrupted+dangerous+forest` can have its own unique style
  - Sorted tag keys for consistent lookup
- **Auto-Generated Gradients**: When no combination is defined, colors blend automatically
  - Gradient follows tag order from location definition
  - First tag's font family is used with blended colors
- **Changelog Modal**: View version history from main menu and pause menu
  - Markdown rendering with react-markdown
  - Infinite scroll for older versions
  - Version dropdown for quick navigation

### Changed
- `LocationSystem.getFontStyleForLocation()` now accepts `playerState` parameter
- `LocationSystem.getTitleDisplayData()` returns additional gradient metadata
- `LocationTitle` component handles CSS gradient text with background-clip
- `location_fonts.json` structure expanded with `tagPriority` and `combinationFontTags`

---

## [0.3.0] - 2026-01-04

### Changed
- **Turn-Based Timing**: All game systems now use turn-based timing instead of real-time milliseconds
  - Effects use `actions`, `turns`, `days`, or `locationChanges` duration types
  - Substances use action-based durations for onset, peak, plateau, and comedown phases
  - Location barring uses day-based redemption timers
  - Withdrawal thresholds based on actions since last use

### Fixed
- SubstanceSystem now properly uses game time provider for all timing calculations
- LocationBarringSystem time-based tasks now use in-game days
- getSubstanceDefinition() now properly queries the registry instead of returning null

### Added
- `SUBSTANCE_DURATION_TYPE` constant for substance timing configuration
- Day-based tracking for addiction (`lastUseAction`) and tolerance (`lastUseAction`)
- Proper registry integration for substance lookups
- Shared utility modules: `ConditionEvaluator`, `StateInitializer`, `TextInterpolator`

---

## [0.2.5] - 2026-01-03

### Added
- **Datapack Auto-Discovery**: Content files are now automatically discovered at build time
  - Use `autoLoad: true` in pack.json instead of listing files manually
  - Vite plugin scans directories and generates file lists during build
  - Supports all content types: items, enemies, scenes, effects, etc.

### Changed
- Updated pack.json format to support `autoLoad: true` syntax
- Build process now includes auto-discovery plugin

---

## [0.2.4] - 2026-01-02

### Added
- **Location Services System**: Church, Clinic, and Nursery services
  - Churches: Curse removal, purification, magical hypnosis treatment
  - Clinics: STD treatment, addiction rehabilitation, neural deprogramming
  - Nurseries: Birth assistance, egg laying, pregnancy checkups
- Service-specific pricing and configuration per location

### Changed
- Location definitions can now include service configuration blocks

---

## [0.2.3] - 2026-01-01

### Added
- **Public Events System**: Witness mechanics for NSFW events in public
  - Location-based witness chances (cities 80%, wilderness 15%)
  - Time-of-day modifiers (night -50%, peak hours +20%)
  - Automatic rumor generation from witnessed events

### Added
- **Hidden Tags System**: Location tags that reveal through discovery
  - Tags like `corrupted`, `blessed`, `cursed` hidden until discovered
  - Discovery through investigation, quests, or stat checks
  - Discovery scenes triggered on tag reveal

### Added
- **Location Barring**: Players can be banned from locations
  - Offense tracking with escalating consequences
  - Redemption tasks: gold, charity, quests, time-based
  - Auto-unbanning when all tasks complete

---

## [0.2.2] - 2025-12-28

### Added
- **Reputation System**: Local and global fame/infamy tracking
  - Per-location reputation with weighted global calculation
  - Reputation spreads between neighboring inhabited locations
  - Location size affects reputation weight (markets, buildings)

### Added
- **Rumor System**: Dynamic rumor generation and confrontation
  - Rumors created from player actions
  - NPCs may mention rumors based on awareness stat
  - Response options: deny, ignore, embrace, intimidate, bribe
  - Rumor severity decay over time

---

## [0.2.1] - 2025-12-25

### Added
- **Fame & Titles System**
  - Fame value from -1000 (villain) to 1000 (legendary)
  - Unlockable titles with stat bonuses
  - Infamy tracking: slut, criminal, corrupted

### Added
- **Merchant Price Modifiers**
  - Charisma affects prices
  - Fame/infamy reputation effects
  - Active title bonuses

---

## [0.2.0] - 2025-12-20

### Added
- **Travel System**: Map-based navigation
  - Local and world map views
  - Region management with child locations
  - Animated location titles with custom fonts

### Added
- **Location Locking**: Conditional access to locations
  - Multiple requirement types: level, quest, items, stats
  - AND/OR condition combining
  - Discovery system for locked locations
  - Custom scenes when requirements not met

### Added
- **Loot Table System**: Configurable item drops
  - Guaranteed and random drops
  - Tiered loot with rarity weights
  - Conditional drops based on player state

---

## [0.1.5] - 2025-12-15

### Added
- **Merchant System**: Trading with NPCs
  - Tag-based item acceptance/rejection
  - Dynamic pricing with multipliers
  - Shop inventory with restocking

### Added
- **Inventory System Improvements**
  - Favorite and junk item flags
  - Category and tag filtering
  - Search functionality

---

## [0.1.0] - 2025-12-01

### Added
- Initial engine release
- **Core Systems**
  - DataRegistry for content management
  - SceneRunner for dialogue and narrative
  - CombatSystem for turn-based battles
  - EffectSystem for buffs/debuffs
  - InventorySystem for item management
  - SaveSystem for game persistence

### Added
- **Datapack System**
  - Modular content packages
  - JSON-based definitions
  - Hot-reloading in development

### Added
- **Paperdoll System**
  - Layer-based character visualization
  - Equipment and clothing display
  - Body region management

---

## [0.0.1] - 2025-11-15

### Added
- Project initialization
- Basic React application structure
- Vite build configuration
