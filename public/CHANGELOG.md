# Changelog

All notable changes to Furrocity will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.8.0-ALPHA] - 2026-01-06

### Added
- **NSFW Equipment Slots**: 15 new intimate body part equipment slots
  - Body parts: `nipple_left`, `nipple_right`, `nipples`, `mouth`, `ears`, `nose`
  - Genitals: `dick`, `balls`, `pussy`, `clitoris`, `urethra`, `ass`
  - Special: `plug`, `chastity`, `genital`
- **Multi-Slot Items**: Items can now be equipped in multiple possible slots
  - Use `equipSlots: ["slot1", "slot2"]` array instead of single `slot`
  - System auto-selects first empty slot when equipping
  - Returns `requiresSlotChoice: true` with `availableSlots` if all slots occupied
  - `equipItem()` accepts optional `targetSlot` parameter for explicit slot selection
- **Piercing Stacking**: Piercings can stack in the same NSFW slot
  - Items with `piercing` tag or `isPiercing: true` can coexist in same slot
  - Non-piercing items (toys) replace each other when equipped
  - Slot contents stored as array for piercings, single item for toys
- **Sprite Sheet Manager**: New Content Generator tab for sprite sheet management
  - Upload sprite sheets via click or drag-and-drop
  - Configure cell size, margins, and offsets
  - Visual grid overlay for cell selection
  - Link cells to items or locations via modal with tabs
- **Location Map Placement**: Enhanced LocationCreator with map placement
  - Local/global map tabs for placement
  - Icon upload or sprite sheet cell selection
  - Click-to-place functionality with percentage coordinates
  - Size selection (small/medium/large)
- **Character Paperdoll Config**: Enhanced CharacterCreator
  - Custom folder paths for character images
  - Cup size dropdown (Flat through ZZ Cup)
  - Base image configuration (masc_base_0 through fem_base_10)
  - Breast, genitalia, and face variant settings

### Changed
- **Equipment Slot Selector UI**: Redesigned with styled pill/chip interface
  - Categorized groups: Weapons, Armor, Clothing & Accessories, Special/Implants, NSFW
  - Visual selected state with green background and checkmarks
  - NSFW slots highlighted in purple/pink theme
  - "Clear All Slots" button when slots are selected
- **Item Schema**: `slot` property replaced with `equipSlots` array
  - Legacy `slot` property still supported for backwards compatibility
  - Engine's `getItemSlots()` method handles both formats

### Fixed
- Equipment stat calculation now properly handles array-based slots (piercing stacking)

---

## [0.7.0-ALPHA] - 2026-01-05

### Added
- **Action Requirements System**: Lock actions (like sleep) until requirements are met
  - Sleep now requires appropriate conditions: safe location, inn room, rented property, camping supplies, or location-specific tags
  - Location tags that enable sleeping: `can_sleep`, `shelter`, `camp_spot`, `rest_area`
  - Dangerous locations can still allow sleep via these tags (with increased encounter risk)
  - Complex condition logic with AND/OR/NOT operators
  - Custom requirement handlers for extensibility
  - Contextual failure messages based on location and lodging state
- **Lodging System**: Inn room rentals and rental property management
  - Inn rooms: Single or multi-day rentals with automatic expiration
  - Rental properties: Ongoing rentals with periodic payments
  - Room quality tiers affecting rest bonuses (basic, standard, deluxe, luxury)
  - Day-advance processing for room expiration and rent due dates
  - Eviction system for missed rental payments
  - Lodging history and statistics tracking
- **Scene Input System**: New input types for scene nodes and choices
  - `textInput` node type: Text fields with validation (min/max length, patterns)
  - `numberInput` node type: Number fields with range validation and cost display
  - `dropdown` node type: Selection from list with conditional options
  - `inputType` property for choices: Embed inputs directly in choice buttons
  - Dynamic formula validation (e.g., `Math.floor(player.gold / 10)`)
  - Cost preview with real-time calculation
- **Input Validation System**: Comprehensive validation with formula support
  - Basic validation: required, min/max, minLength/maxLength, pattern matching
  - Type coercion: int, string, number types
  - Dynamic formulas: Evaluate expressions using player/game state
  - Constraint expressions: Custom validation rules (e.g., `value <= player.gold`)
  - Custom validators: Register game-specific validation handlers
- **Scene Action Types for Lodging**:
  - `rentRoom`: Rent an inn room for specified days
  - `extendStay`: Extend existing room rental
  - `rentProperty`: Begin renting a property
  - `makeRentPayment`: Pay rent on a property
  - `cancelRental`: Cancel property rental
- **Enemy Scaling System**: Dynamic enemy stat generation
  - Enemies can omit level, stats, resistances, rewards - engine calculates them
  - Scaling based on player level, location danger, and enemy type
  - Player stats affect rewards: luck → gold drops, intelligence → XP
  - Equipment and effect bonuses (goldFind, xpBoost) apply to rewards
  - 10 enemy types with unique stat profiles (beast, humanoid, undead, demon, etc.)
  - Variant creation: weak, strong, elite, champion versions
  - Partial stat definitions supported (specify only what you want fixed)
  - JSON-based elite chance: `eliteChance`, `strongChance`, `championChance` in encounters
  - Bosses/minibosses should be defined as separate unique enemy files
- **NSFW Combat Scene System**: Madlib-style dynamic text generation for combat
  - **Body Descriptor System**: Contextual body part descriptors
    - Size tiers: tiny, small, average, large, huge, massive
    - Arousal modifiers: changes based on lust/arousal level (0-100%)
    - Corruption modifiers: pure, touched, tainted, corrupted
    - Equipment-aware: detects piercings, toys for modified descriptions
  - **Enemy Naming System**: Grammar-aware enemy name handling
    - Named enemies: use specific names without articles ("Zander gropes...")
    - Unnamed enemies: proper articles based on sentence position ("The wolf" vs "the wolf")
    - Random name generation from species/variant pools
    - Title templates: "{name} the Imp", "Count {name} of {region}"
  - **NSFW Text Interpolator**: Template placeholder system
    - Body descriptors: `{chest_descriptor}`, `{dick_descriptor}`, `{pussy_descriptor}`, etc.
    - Enemy names: `{enemy_name}`, `{enemy_name_mid}`, `{enemy_possessive}`
    - Player names: `{player_name}`, `{player_possessive}`
    - Pronouns: `{pronoun_subject}`, `{pronoun_object}`, `{pronoun_possessive}`
    - Equipment checks: `{has_plug}`, `{plug_name}`, `{has_nipple_toys}`
    - Conditionals: `{if has_dick}...{else}...{/if}`
  - **Equipment Interactions**: Combat equipment effects
    - Strip chance per clothing slot
    - Toy activation (vibrators, plugs)
    - Piercing bonus multipliers
    - Drug application chance
    - Cursed item equipping

### Changed
- `handleSleep` now checks action requirements before allowing sleep
- MedievalClock sleep buttons now show disabled state when sleep is not allowed
- SceneRunner extended with new node type processing and input submission methods
- Player state includes `lodging` object for tracking rentals
- Scene choices can now include `inputConfig` for embedded inputs

### Added Files
- `engine/InputValidationSystem.js` - Input validation with formula support
- `engine/LodgingSystem.js` - Inn room and rental property management
- `engine/ActionRequirementSystem.js` - Action requirement checking
- `engine/EnemyScalingSystem.js` - Dynamic enemy stat generation
- `engine/BodyDescriptorSystem.js` - Body part descriptor generation
- `engine/EnemyNamingSystem.js` - Enemy name generation and grammar
- `engine/NSFWTextInterpolator.js` - NSFW template interpolation
- `engine/NSFWCombatSceneSystem.js` - NSFW combat scene orchestration
- `src/components/ui/SceneInputs.jsx` - React components for scene inputs
- `src/components/ui/SceneInputs.css` - Styling for input components
- `src/components/ui/SceneDisplay.jsx` - Comprehensive scene rendering component
- `src/components/ui/SceneDisplay.css` - Scene display styling
- `public/datapacks/core/lodging/lodging_config.json` - Lodging definitions
- `public/datapacks/core/scenes/inn_rental_scenes.json` - Example inn scenes
- `public/datapacks/core/nsfw/body_descriptors.json` - Body part descriptors by size/arousal/corruption
- `public/datapacks/core/nsfw/enemy_names.json` - Enemy name pools by species/variant
- `public/datapacks/core/nsfw/equipment_interactions.json` - Equipment interaction definitions
- `public/datapacks/core/nsfw/scene_templates/*.json` - NSFW scene templates by enemy type

---

## [0.6.0-ALPHA] - 2026-01-05

### Added
- **Day/Night Cycle System**: Action-based time progression throughout the game
  - Time advances based on player actions (NPC: 30min, Travel: 1hr, Combat: 2hr, Sex: 4hr, etc.)
  - Six time periods: Dawn, Morning, Afternoon, Evening, Dusk, Night
  - Scene-level time overrides via `timeCost` or `timeMinutes` properties
  - Day counter tracking total in-game days
- **Medieval Clock UI**: Ornate animated clock display
  - Roman numeral clock face with animated hour and minute hands
  - Day counter and time period indicator
  - Expandable panel with sleep controls
  - Day/night visual effects and animations
  - Position and size variants (top-right, top-left, etc.)
- **Night Encounter Modifiers**: Dynamic encounter chance increases at night
  - Safe locations: +5% encounter chance at night
  - Dangerous locations: +20% encounter chance at night
  - Location tags determine modifier: safe, dangerous, forest, dungeon, corrupted, etc.
- **Sleep Mechanics**: Rest until specific times
  - Sleep to Night: Skip to 9 PM (if daytime)
  - Sleep to Morning: Advance to 7 AM next day (always advances a day)
  - Restores stamina and health on sleep
- **Time Statistics Tracking**: Comprehensive time-related stats
  - Total days played, hours played
  - Nights survived, times slept
  - Time spent by activity (combat, dialogue, travel, exploration, rest, nsfw)
  - Periods experienced counter for each time period
- **Dynamic Background Colors**: Site background shifts with time of day
  - CSS custom properties for time-based theming
  - Smooth 1-second transitions between time periods
  - Each period has unique gradient scheme (darker at night, warmer at dusk)

### Changed
- `CombatSystem.generateEncounter()` now accepts optional `nightModifier` parameter
- Exploration, search, travel, rest, interact, and combat actions now advance time
- Scene completion advances time based on scene type or custom `timeCost`
- Player state includes `currentTime` object and `timeStats` for tracking

---

## [0.5.0-ALPHA] - 2026-01-05

### Added
- **Expedition System**: Region-to-region travel with dedicated travel mechanics
  - Travel stamina separate from combat stamina (affected by player stats)
  - Progress bar with animated icon showing journey completion
  - Day/night cycle integration affects encounter chances
  - Torch mechanics: light reduces night encounter penalty
  - Camp system: basic camp, tent, or pavilion reduce encounter chance
  - Scavenging: find food, water, loot, hidden locations, or trigger encounters
  - Rest mechanics with camp bonuses for stamina recovery
  - Character paperdoll display with fade effect during progress
  - Terrain-specific backgrounds and danger level indicators
- **Region Distance Data**: Regions now define distances to neighbors
  - `neighborDistances` with distance, terrain type, and danger level
  - Terrain types: `road`, `forest_edge`, `mountain_trail`, `corrupted_path`, `desert_edge`
  - Danger levels 1-5 affect encounter frequency
- **Expedition Statistics**: Track travel history and achievements
  - Total distance traveled, expeditions completed/abandoned
  - Hours on road, locations discovered during travel
  - Expedition history with full journey details
- **Travel Perks**: Unlockable perks for experienced travelers
  - `efficient_traveler`: 10% less stamina use
  - `night_owl`: reduced night encounter penalty
  - `scavenger`: +10% scavenge success
  - `pathfinder`: +5% hidden location discovery

### Changed
- World map "View Region" button now shows "Travel" for unlocked regions
- TravelModal accepts `onTravelToRegion` callback for region travel
- Player state includes `expedition` object for travel tracking

---

## [0.4.0-ALPHA] - 2026-01-05

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

## [0.3.0-ALPHA] - 2026-01-04

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

## [0.2.5-ALPHA] - 2026-01-03

### Added
- **Datapack Auto-Discovery**: Content files are now automatically discovered at build time
  - Use `autoLoad: true` in pack.json instead of listing files manually
  - Vite plugin scans directories and generates file lists during build
  - Supports all content types: items, enemies, scenes, effects, etc.

### Changed
- Updated pack.json format to support `autoLoad: true` syntax
- Build process now includes auto-discovery plugin

---

## [0.2.4-ALPHA] - 2026-01-02

### Added
- **Location Services System**: Church, Clinic, and Nursery services
  - Churches: Curse removal, purification, magical hypnosis treatment
  - Clinics: STD treatment, addiction rehabilitation, neural deprogramming
  - Nurseries: Birth assistance, egg laying, pregnancy checkups
- Service-specific pricing and configuration per location

### Changed
- Location definitions can now include service configuration blocks

---

## [0.2.3-ALPHA] - 2026-01-01

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

## [0.2.2-ALPHA] - 2025-12-28

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

## [0.2.1-ALPHA] - 2025-12-25

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

## [0.2.0-ALPHA] - 2025-12-20

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

## [0.1.5-ALPHA] - 2025-12-15

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

## [0.1.0-ALPHA] - 2025-12-01

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

## [0.0.1-ALPHA] - 2025-11-15

### Added
- Project initialization
- Basic React application structure
- Vite build configuration
