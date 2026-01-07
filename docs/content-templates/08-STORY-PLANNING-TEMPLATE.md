# Story Planning Template

Use this template to plan story arcs, quests, and branching narratives before implementation.

---

## Main Story Outline

### Act 1: Introduction (Levels 1-5)

**Setting:** Crossroads Region (Safe starting area)

**Main Goal:** Establish the world, teach mechanics, introduce the corruption threat.

#### Key Beats:
1. **Wake Up** - Player awakens in inn with amnesia
2. **Meet NPCs** - Innkeeper, bard, merchants introduce the world
3. **First Quest** - Simple task (deliver message, find lost item)
4. **First Combat** - Tutorial fight against weak enemy
5. **Discovery** - Learn about the corruption spreading from the forest
6. **Call to Adventure** - Choose to investigate or ignore

#### Scenes Required:
- [ ] `intro_full` - Wake up sequence
- [ ] `inn_breakfast` - Morning interactions
- [ ] `first_quest_start` - Quest introduction
- [ ] `first_combat_tutorial` - Combat explanation
- [ ] `corruption_discovery` - Learn about threat

---

### Act 2: Exploration (Levels 5-10)

**Setting:** Darkwood Forest, Mountain Pass

**Main Goal:** Explore danger, face corruption, make meaningful choices.

#### Key Beats:
1. **Enter Darkwood** - First dangerous area
2. **Meet the Witch** - Optional ally/antagonist
3. **Corruption Exposure** - First direct corruption encounter
4. **Branching Point** - Player choices affect story direction
5. **Mid-game Boss** - Major challenge

#### Scenes Required:
- [ ] `darkwood_first_visit` - Entering the forest
- [ ] `witch_introduction` - Meeting Morrigan
- [ ] `corruption_encounter` - First corruption event
- [ ] `branch_choice` - Major decision point
- [ ] `wolf_den_boss` - Alpha Wolf boss fight

---

### Act 3: Escalation (Levels 10-15)

**Setting:** Demon Realm portal opens

**Main Goal:** Stakes increase, permanent consequences possible.

#### Key Beats:
1. **Portal Opens** - Demon realm becomes accessible
2. **Allies Gathered** - Based on previous choices
3. **Major Corruption Choice** - Embrace or resist
4. **Route Split** - Story diverges based on choices

#### Scenes Required:
- [ ] `portal_opens` - Dramatic reveal
- [ ] `ally_gathering` - Call companions
- [ ] `corruption_choice` - Embrace/resist decision
- [ ] `route_split_[pure/corrupted/enslaved]` - Branch stubs

---

## Branch Tracking

### Main Route: Pure Path
**Trigger:** Corruption < 30, resisted major temptations
**Focus:** Traditional hero, purging corruption
**Ending:** Save the world from demon invasion

### Main Route: Corrupted Path
**Trigger:** Corruption 30-70, embraced some temptations
**Focus:** Anti-hero, using corruption as a tool
**Ending:** Become a dark champion

### Main Route: Enslaved Path
**Trigger:** Captured by enemies, corruption > 70
**Focus:** Escape or embrace servitude
**Ending:** Multiple sub-endings

---

## Quest Template

### Quest: [Quest Name]

**ID:** `quest_id_here`

**Type:** Main / Side / Companion / Random

**Giver:** NPC who gives the quest

**Location:** Where quest takes place

**Level Range:** 5-8

**Prerequisites:**
- Level 5+
- Completed: `previous_quest_id`
- Flag: `knows_about_thing`

#### Objectives:
1. [ ] Go to [Location]
2. [ ] Talk to [NPC]
3. [ ] Defeat [Enemy] or Retrieve [Item]
4. [ ] Return to [NPC]

#### Rewards:
- 100 gold
- 50 XP
- Item: `reward_item_id`
- Unlock: `new_location_id`
- Relationship: +20 with [NPC]

#### Scenes:
- `quest_start` - Quest introduction
- `quest_midpoint` - Progress scene
- `quest_complete` - Resolution
- `quest_fail` - Failure state (if applicable)

#### Branching:
- **Choice A:** Help the NPC → Good ending
- **Choice B:** Betray them → Evil ending
- **Choice C (NSFW):** Seduce them → Special ending

#### Notes:
```
Any implementation notes, dependencies, or special considerations.
```

---

## NPC Storyline Template

### NPC: [Character Name]

**ID:** `npc_id`

**Role:** Merchant / Quest Giver / Companion / Antagonist

**Location:** Home location

**Personality:** Brief description

#### Relationship Milestones:

| Trust Level | Unlocks |
|-------------|---------|
| 0 | Basic dialogue |
| 25 | Personal quest available |
| 50 | Special shop items |
| 75 | Romance option |
| 100 | Companion route |

#### Personal Quest:
- **Title:** Quest name
- **Trigger:** Trust >= 25
- **Summary:** Brief description
- **Reward:** Relationship boost, unique item

#### Romance Route (if applicable):
- **Trigger:** Trust >= 75, specific flag
- **Content:** [Vanilla / NSFW / Both]
- **Scenes:** List of scene IDs

#### NSFW Content (if applicable):
- **Seducible:** Yes/No
- **Difficulty:** Easy/Medium/Hard
- **Corruption Impact:** How it affects player
- **Scenes:** List of NSFW scene IDs

---

## Region Planning Template

### Region: [Region Name]

**ID:** `region_id`

**Theme:** One-sentence description

**Danger Level:** 1-5

**Unlock Requirements:**
- Level X
- Quest: `quest_id`

#### Locations (5-20):

| ID | Name | Type | Danger | Services |
|----|------|------|--------|----------|
| `loc_1` | Town Square | outdoor | 1 | shop, quest |
| `loc_2` | Dark Cave | dungeon | 4 | loot, boss |

#### Key NPCs:

| ID | Name | Role | NSFW? |
|----|------|------|-------|
| `npc_1` | Merchant | shop | no |
| `npc_2` | Witch | quest | yes |

#### Enemies:

| ID | Name | Type | NSFW? |
|----|------|------|-------|
| `enemy_1` | Goblin | humanoid | no |
| `enemy_2` | Slime | ooze | yes |

#### Story Beats:
1. First visit - Introduction scene
2. Discovery - Learn about local threat
3. Climax - Boss/major event
4. Resolution - Area cleared or ongoing

---

## NSFW Content Planning

### Content Rating Guide:

| Rating | Description | Tags Required |
|--------|-------------|---------------|
| Vanilla | No adult content | `vanilla` |
| Suggestive | Implied, fade-to-black | `suggestive` |
| Explicit | Detailed descriptions | `nsfw` |
| Extreme | Heavy content | `nsfw`, `extreme` |

### NSFW Scene Checklist:

- [ ] Tags properly set (`nsfw`, content-specific tags)
- [ ] `requiresTags` on choices that lead to NSFW
- [ ] Corruption/arousal effects balanced
- [ ] Can be skipped or avoided
- [ ] Has vanilla alternative where appropriate

### Content Warnings:

List any content that requires specific warnings:
- Tentacles: `tentacle` tag
- Mind control: `hypnosis` tag
- Transformation: `transformation` tag
- Non-con: `dubcon` or `noncon` tag (handle carefully)

---

## Implementation Checklist

### Before Implementation:
- [ ] Story outline approved
- [ ] All dependencies identified
- [ ] Required assets listed
- [ ] Branch points documented

### During Implementation:
- [ ] JSON files created and validated
- [ ] All IDs unique and consistent
- [ ] Conditions properly set
- [ ] NSFW content properly tagged

### After Implementation:
- [ ] Playtested all paths
- [ ] Verified all branches work
- [ ] Checked for softlocks
- [ ] Balance reviewed

---

## Example: Side Quest

### Quest: The Missing Livestock

**ID:** `missing_livestock`

**Type:** Side

**Giver:** Farmer in Crossroads

**Location:** Farm → Forest Edge → Wolf Den

**Level Range:** 3-5

**Prerequisites:**
- Level 3+
- Visited: `starting_inn`

#### Objectives:
1. [x] Talk to farmer about missing animals
2. [ ] Investigate the forest edge
3. [ ] Track the wolves to their den
4. [ ] Choose: Kill the wolves OR Find alternative
5. [ ] Report back to farmer

#### Rewards:
- 75 gold
- 30 XP
- Unlock: `wolf_den` location
- Item: `wolf_pelt` x2 (if killed)

#### Scenes:
- `missing_livestock_start` - Farmer asks for help
- `livestock_investigate` - Find wolf tracks
- `wolf_den_discovered` - Locate the den
- `livestock_choice` - Kill or spare
- `livestock_complete_kill` - Killed wolves ending
- `livestock_complete_spare` - Spared wolves ending

#### Branching:
- **Kill wolves:** Standard reward, farmer grateful
- **Spare wolves:** Less gold, unlock wolf companion later
- **[NSFW] Offer self to wolves:** Corruption path, unique scenes

#### Notes:
```
This quest introduces the wolf den location and sets up the alpha wolf
boss fight later. The spare option plants seeds for a beast companion
route in Act 2.
```

---

## Branch Point Documentation

### [BRANCH POINT: Enslaved Route]

**Location:** Slave Pens (Demon Realm)

**Trigger Conditions:**
- Lost combat in slave_pens
- Corruption >= 50
- No escape items

**What Happens:**
Player is captured and begins the enslaved route. This is a major
story branch with its own progression system.

**Sub-Routes:**
1. Escape Path - Work to regain freedom
2. Acceptance Path - Embrace new role
3. Infiltration Path - Pretend compliance, sabotage from within

**Implementation Status:** STUB (scenes TBD)

**Files Needed:**
- `scenes/enslaved_route/*.json`
- `enemies/slave_pens_enemies.json`
- `npcs/slave_masters.json`

**Assigned To:** [Team Member]

**Target Completion:** [Date or Milestone]
