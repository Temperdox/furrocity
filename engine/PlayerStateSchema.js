/**
 * Comprehensive Player State Schema
 * 
 * This defines ALL stats that scenes can query to determine events.
 * Every field can be used in scene conditions.
 */

export const comprehensivePlayerState = {
  // ============================================================================
  // IDENTITY & META
  // ============================================================================
  id: null,
  name: "",
  characterId: null,
  characterClass: null,
  createdAt: null,
  playtime: 0,
  
  // ============================================================================
  // CORE STATS
  // ============================================================================
  level: 1,
  experience: 0,
  experienceToNext: 100,
  
  // Primary attributes
  stats: {
    strength: 5,        // Physical power, melee damage, carrying capacity
    vitality: 5,        // Health, stamina, poison resistance
    agility: 5,         // Speed, evasion, accuracy
    endurance: 5,       // Stamina recovery, fatigue resistance
    intelligence: 5,    // Magic power, learning speed, puzzle solving
    willpower: 5,       // Mental resistance, corruption resistance, focus
    perception: 5,      // Detection, awareness, search
    charisma: 5,        // Social interactions, prices, persuasion
    luck: 5             // Random events, loot quality, critical chance
  },
  
  // Derived/resource stats
  currentHp: 100,
  maxHp: 100,
  currentStamina: 100,
  maxStamina: 100,
  currentMana: 50,
  maxMana: 50,
  
  // ============================================================================
  // RESISTANCES - Used by scenes to check vulnerability
  // ============================================================================
  resistances: {
    // Damage type resistances (0-100, can go negative for vulnerability)
    physical: 0,
    fire: 0,
    ice: 0,
    lightning: 0,
    poison: 0,
    holy: 0,
    dark: 0,
    psychic: 0,
    
    // Status resistances
    stun: 0,
    sleep: 0,
    paralysis: 0,
    charm: 0,
    fear: 0,
    confusion: 0,
    blind: 0,
    silence: 0,
    
    // NSFW-specific resistances
    arousal: 0,
    seduction: 0,
    corruption: 0,
    hypnosis: 0,
    mindControl: 0,
    transformation: 0,
    addiction: 0,
    pheromones: 0,
    aphrodisiacs: 0,
    
    // Substance resistances by delivery method
    substanceResistance: {
      inhalant: 0,
      consumable: 0,
      injectable: 0,
      contact: 0,
      ambient: 0
    },
    
    // Substance resistances by category
    substanceCategoryResistance: {
      stimulant: 0,
      depressant: 0,
      hallucinogen: 0,
      aphrodisiac: 0,
      sedative: 0,
      narcotic: 0,
      mutagen: 0
    }
  },
  
  // ============================================================================
  // SUBSTANCE STATE - Full tracking for drug/addiction system
  // ============================================================================
  substanceState: {
    // Currently active substances in system
    activeSubstances: [],
    
    // Addiction tracking per substance
    addictions: {
      // [substanceId]: {
      //   level: 0-100,
      //   stage: 'none'|'curious'|'casual'|'habitual'|'dependent'|'addicted'|'enslaved',
      //   lastUseTime: timestamp,
      //   totalUses: 0,
      //   withdrawalActive: false,
      //   withdrawalSeverity: 0,
      //   withdrawalStartTime: null
      // }
    },
    
    // Tolerance levels (reduces drug effectiveness)
    tolerances: {
      // [substanceId]: { level: 0-100, lastUseTime, peakTolerance }
      // ['_category_' + category]: { level: 0-100 }
    },
    
    // Active resistances (from items, pills, training)
    resistances: [
      // {
      //   id, source, sourceId, deliveryMethods[], categories[],
      //   value, quality, appliedTime, duration, decayRate
      // }
    ],
    
    // Status
    status: {
      isIntoxicated: false,
      intoxicationLevel: 0,
      isBlackedOut: false,
      blackoutEndTime: null,
      blackoutLocation: null,
      isInWithdrawal: false,
      withdrawalSubstances: [],
      isOverdosing: false,
      overdoseSubstance: null
    },
    
    // Daily tracking
    daily: {
      dosesPerSubstance: {},
      lastResetTime: null
    },
    
    // Encounter modifiers from substances
    encounterModifiers: {
      passedOutEncounterChance: 0,
      activeModifiers: []
    },
    
    // History
    history: {
      totalSubstancesUsed: 0,
      totalOverdoses: 0,
      totalBlackouts: 0,
      substancesTriedList: [],
      favoriteSubstance: null,
      longestAddiction: { substanceId: null, duration: 0 },
      cleanStreak: 0,
      longestCleanStreak: 0
    }
  },
  
  // ============================================================================
  // NSFW STATS - Full body and experience tracking
  // ============================================================================
  nsfwStats: {
    // Core meters (0-100)
    corruption: 0,
    purity: 100,
    arousal: 0,
    maxArousal: 100,
    lust: 0,
    shame: 50,
    exhibitionism: 0,
    submission: 50,
    dominance: 50,
    masculinity: 50,
    femininity: 50,
    innocence: 100,
    depravity: 0,
    
    // Sensitivity levels per body part (0-100, affects arousal gain)
    sensitivity: {
      lips: 20,
      tongue: 20,
      ears: 15,
      neck: 25,
      nipples: 30,
      chest: 20,
      stomach: 15,
      back: 15,
      hands: 10,
      arms: 10,
      thighs: 25,
      legs: 15,
      feet: 15,
      butt: 30,
      genitals: 50,
      prostate: 40,
      anus: 35
    },
    
    // Body measurements (can change from transformations)
    bodyMeasurements: {
      height: 170,        // cm
      weight: 70,         // kg
      bustSize: 0,        // 0-100 scale
      waistSize: 50,
      hipSize: 50,
      buttSize: 50,
      genitalSize: 50,    // Context-dependent
      testicleSize: 50,
      muscleMass: 50,
      bodyFat: 30,
      hairLength: 30,
      bodyHairLevel: 30
    },
    
    // Body modifications
    modifications: {
      tattoos: [],        // { id, location, description, visible }
      piercings: [],      // { id, location, type, visible }
      brandings: [],
      scars: [],
      implants: [],
      mutations: []
    },
    
    // Orifice/body part stats (for tracking use and changes)
    orificeStats: {
      mouth: {
        penetrationCount: 0,
        stretchLevel: 0,    // 0-100
        currentFluids: 0,   // ml
        sensitivity: 20,
        trainingLevel: 0,   // Skill at oral
        lastUsed: null,
        tags: []            // 'trained', 'gagged', etc.
      },
      vagina: {
        penetrationCount: 0,
        stretchLevel: 0,
        currentFluids: 0,
        sensitivity: 50,
        virginityIntact: true,
        fertility: 100,
        lastUsed: null,
        tags: []
      },
      anus: {
        penetrationCount: 0,
        stretchLevel: 0,
        currentFluids: 0,
        sensitivity: 35,
        virginityIntact: true,
        trainingLevel: 0,
        lastUsed: null,
        tags: []
      },
      urethra: {
        penetrationCount: 0,
        stretchLevel: 0,
        sensitivity: 60,
        lastUsed: null,
        tags: []
      },
      nipples: {
        stimulationCount: 0,
        sensitivity: 30,
        piercedLeft: false,
        piercedRight: false,
        lactating: false,
        tags: []
      },
      penis: {
        useCount: 0,
        sensitivity: 50,
        circumcised: false,
        piercings: [],
        chastityDevice: null,
        lastOrgasm: null,
        denialDays: 0,
        tags: []
      }
    },
    
    // Sexual history tracking
    sexualHistory: {
      // Counts
      totalEncounters: 0,
      totalOrgasms: 0,
      totalOrgasmsDenied: 0,
      totalPartnersHuman: 0,
      totalPartnersMonster: 0,
      totalPartnersMachine: 0,
      
      // By activity
      oralGiven: 0,
      oralReceived: 0,
      vaginalGiven: 0,
      vaginalReceived: 0,
      analGiven: 0,
      analReceived: 0,
      handJobsGiven: 0,
      handJobsReceived: 0,
      
      // Special
      gangbangCount: 0,
      publicEncounters: 0,
      nonConEncounters: 0,
      tentacleEncounters: 0,
      beastEncounters: 0,
      machineEncounters: 0,
      
      // Fluids received (ml total)
      fluidsSwallowed: 0,
      fluidsReceivedVaginal: 0,
      fluidsReceivedAnal: 0,
      fluidsOnBody: 0,
      
      // First times
      firstEncounter: null,
      firstOralGiven: null,
      firstOralReceived: null,
      firstVaginal: null,
      firstAnal: null,
      
      // Partner list
      uniquePartners: []
    },
    
    // Active effects on NSFW stats
    statusEffects: [],
    
    // Debuffs (negative lasting effects)
    debuffs: [],
    
    // Curses
    curses: [],
    
    // Addictions (non-substance, like sex addiction)
    behavioralAddictions: {
      // [addictionType]: { level: 0-100, lastIndulged, withdrawalActive }
      sexAddiction: { level: 0, lastIndulged: null },
      exhibitionismAddiction: { level: 0, lastIndulged: null },
      submissionAddiction: { level: 0, lastIndulged: null },
      painAddiction: { level: 0, lastIndulged: null },
      orgasmAddiction: { level: 0, lastIndulged: null }
    },
    
    // Kink discovery/unlocks
    discoveredKinks: [],
    
    // Preferences (affects scene outcomes)
    preferences: {
      preferredRole: 'versatile',  // 'dominant', 'submissive', 'versatile'
      preferredGender: 'any',
      hardLimits: [],
      softLimits: [],
      favorites: []
    },
    
    // Mental state
    mentalState: {
      mindControlLevel: 0,
      hypnosisDepth: 0,
      suggestionVulnerability: 0,
      brainwashingProgress: 0,
      conditioning: [],  // { trigger, response, strength }
      triggers: [],
      mantras: [],
      // Hypnosis source tracking for treatment
      hypnosisSource: null,  // 'magical' | 'technological' | 'natural' | null
      hypnosisDevice: null   // Item ID if from visor/device
    },

    // Pregnancy state
    pregnancy: {
      isPregnant: false,
      type: null,           // 'normal' | 'eggs' | 'parasitic' | 'demonic'
      fatherType: null,     // Species/type of the father
      fatherId: null,       // NPC ID if applicable
      conceptionDate: null,
      dueDate: null,
      trimester: 0,         // 0-3
      fetusCount: 1,
      eggCount: 0,          // For egg-laying pregnancy
      complications: [],
      visible: false,       // Shows in appearance
      history: []           // Past pregnancies
    },

    // Sexually transmitted diseases/infections
    stds: {
      // [stdId]: {
      //   contracted: timestamp,
      //   stage: 'incubating' | 'active' | 'chronic',
      //   severity: 0-100,
      //   symptoms: [],
      //   treatable: true
      // }
    }
  },
  
  // ============================================================================
  // COMBAT STATE
  // ============================================================================
  combatState: {
    inCombat: false,
    currentEnemies: [],
    turn: 0,
    
    // Restraint state
    isRestrained: false,
    restraintType: null,
    restraintHp: 0,
    restraintMaxHp: 0,
    restraintSource: null,
    
    // Grapple state
    isGrappled: false,
    grappleType: null,
    grappledBy: null,
    grappleStruggleCount: 0,
    
    // Combat effects
    activeBuffs: [],
    activeDebuffs: [],
    
    // Position
    position: 'standing',  // 'standing', 'prone', 'kneeling', 'bound', 'suspended'
    
    // Clothing state in combat
    clothingDamage: {
      head: 0,
      chest: 0,
      legs: 0,
      feet: 0,
      underwear: 0
    }
  },
  
  // ============================================================================
  // EQUIPMENT & INVENTORY
  // ============================================================================
  equipment: {
    head: null,
    face: null,         // Masks, glasses, gags
    neck: null,         // Collars, necklaces
    chest: null,
    back: null,         // Capes, wings
    arms: null,
    hands: null,
    waist: null,        // Belts
    legs: null,
    feet: null,
    underwear_top: null,
    underwear_bottom: null,
    
    // Weapon slots
    main_hand: null,
    off_hand: null,
    
    // Accessory slots
    accessory_1: null,
    accessory_2: null,
    ring_left: null,
    ring_right: null,
    
    // Special slots
    implant_head: null,
    implant_body: null,
    implant_limbs: null,
    
    // Lewd equipment slots
    nipple_left: null,
    nipple_right: null,
    genital: null,
    plug: null,
    chastity: null
  },
  
  // Clothing integrity
  clothingState: {
    // Per slot: { equipped, integrity: 0-100, exposed: bool, soiled: bool }
  },
  
  inventory: [],
  gold: 0,
  maxInventorySize: 50,
  carryWeight: 0,
  maxCarryWeight: 100,
  
  // ============================================================================
  // SKILLS & ABILITIES
  // ============================================================================
  skills: {
    combat: {
      melee: 0,
      ranged: 0,
      magic: 0,
      defense: 0,
      evasion: 0
    },
    stealth: {
      sneaking: 0,
      lockpicking: 0,
      pickpocket: 0,
      disguise: 0
    },
    social: {
      persuasion: 0,
      intimidation: 0,
      seduction: 0,
      deception: 0,
      insight: 0
    },
    survival: {
      tracking: 0,
      foraging: 0,
      cooking: 0,
      crafting: 0,
      medicine: 0
    },
    knowledge: {
      arcana: 0,
      history: 0,
      nature: 0,
      religion: 0,
      alchemy: 0
    },
    // Lewd skills
    intimate: {
      oral: 0,
      manual: 0,
      penetration: 0,
      endurance: 0,
      flexibility: 0,
      painTolerance: 0,
      recovery: 0
    }
  },
  
  // Unlocked abilities
  unlockedAbilities: [],
  equippedAbilities: [],
  abilityPoints: 0,
  
  // ============================================================================
  // LOCATION & WORLD STATE
  // ============================================================================
  currentLocation: null,
  previousLocation: null,
  visitedLocations: [],
  
  // Known locations
  discoveredLocations: [],
  
  // Fast travel
  unlockedFastTravel: [],

  // ============================================================================
  // LOCATION DISCOVERY & TRACKING
  // ============================================================================

  // Hidden tags that have been revealed
  revealedTags: {
    // [locationId]: ['corrupted', 'blessed', 'haunted', ...]
  },

  // Interaction counts per location (for discovery triggers)
  locationInteractions: {
    // [locationId]: {
    //   visits: 0,
    //   sleeps: 0,
    //   searches: 0,
    //   prayers: 0,
    //   nsfwEvents: 0,
    //   lastInteraction: null
    // }
  },

  // Locations player is banned/barred from
  locationBans: {
    // [locationId]: {
    //   banned: true,
    //   reason: 'public_indecency',
    //   bannedAt: timestamp,
    //   redemptionTasks: [
    //     { type: 'quest', questId: 'help_church', completed: false },
    //     { type: 'gold', amount: 500, paid: false },
    //     { type: 'time', hours: 168, startedAt: null }
    //   ],
    //   offenseCount: 3,
    //   offenseHistory: []
    // }
  },

  // Track NSFW offenses at locations (before ban)
  locationOffenses: {
    // [locationId]: {
    //   count: 0,
    //   lastOffense: null,
    //   offenseTypes: ['public_birth', 'public_sex', ...],
    //   witnessed: true/false for each
    // }
  },

  // Discovery progress for hidden location features
  discoveryProgress: {
    // [locationId]: {
    //   [hiddenFeatureId]: {
    //     interactionsRequired: 3,  // Rolled from range
    //     currentInteractions: 1,
    //     discovered: false,
    //     discoveredAt: null
    //   }
    // }
  },

  // World flags (story progress, choices made)
  worldFlags: {},
  
  // Time
  currentTime: {
    day: 1,
    hour: 8,
    minute: 0,
    dayOfWeek: 0,   // 0-6
    season: 0,      // 0-3
    year: 1
  },
  
  // ============================================================================
  // RELATIONSHIPS & REPUTATION
  // ============================================================================
  relationships: {
    // [npcId]: {
    //   affection: -100 to 100,
    //   trust: -100 to 100,
    //   fear: 0 to 100,
    //   lust: 0 to 100,
    //   dominance: -100 to 100 (negative = they dominate you),
    //   intimacyLevel: 0-5,
    //   flags: [],
    //   history: []
    // }
  },
  
  factionReputation: {
    // [factionId]: { reputation: -100 to 100, rank: 0-10, flags: [] }
  },

  // ============================================================================
  // FAME, TITLES & INFAMY
  // ============================================================================
  fame: {
    value: 0,              // -1000 to 1000 (negative = infamous, positive = famous)
    heroicDeeds: 0,        // Total positive fame gained
    villainousDeeds: 0,    // Total negative fame gained
    fameHistory: []        // { reason, amount, timestamp }
  },

  titles: {
    active: null,          // Currently displayed title ID
    unlocked: [],          // Array of unlocked title IDs
    equipped: null         // Title ID providing active buffs (can differ from display)
  },

  infamy: {
    slut: 0,               // 0-100: Sexual infamy (affects prices, triggers encounters)
    criminal: 0,           // 0-100: Crime infamy (guards, bounties)
    corrupted: 0           // 0-100: Corruption infamy (demons, cults)
  },

  // ============================================================================
  // LOCAL REPUTATION - Per-location tracking
  // ============================================================================
  localReputation: {
    // [locationId]: {
    //   fame: 0,                    // -100 to 100
    //   infamy: { slut: 0, criminal: 0, corrupted: 0 },
    //   visitCount: 0,
    //   lastVisit: null,            // Timestamp of last visit
    //   knownBy: []                 // NPC IDs who know the player
    // }
  },

  // ============================================================================
  // RUMORS - Player's rumor list
  // ============================================================================
  rumors: [
    // {
    //   id: "rumor_001",
    //   type: "slut"|"criminal"|"corrupted"|"heroic"|"mysterious",
    //   text: "Human-readable rumor text",
    //   severity: 0-100,            // How extreme/spread the rumor is
    //   originLocation: "location_id",
    //   originEvent: "scene_id",
    //   spreadLocations: [],        // Locations that have heard this rumor
    //   dateCreated: timestamp,
    //   canBeClearedWith: "fame"|"intimidation"|"bribe",
    //   clearDifficulty: 0-100,
    //   lastMentioned: null,        // Timestamp of last NPC confrontation
    //   mentionCount: 0,            // Times this rumor has been mentioned
    //   acknowledged: false         // Player has seen this rumor before
    // }
  ],

  // Rumor confrontation cooldown per NPC
  rumorCooldowns: {
    // [npcId]: timestamp
  },

  // ============================================================================
  // QUESTS & PROGRESS
  // ============================================================================
  activeQuests: [],
  completedQuests: [],
  failedQuests: [],
  questProgress: {},
  
  // Achievements
  unlockedAchievements: [],
  achievementProgress: {},
  
  // ============================================================================
  // STATISTICS FOR SCENE CONDITIONS
  // ============================================================================
  statistics: {
    // Combat
    enemiesDefeated: 0,
    combatsWon: 0,
    combatsLost: 0,
    combatsFled: 0,
    damageDealt: 0,
    damageTaken: 0,
    criticalHits: 0,
    timesKnockedOut: 0,
    
    // Exploration
    stepsWalked: 0,
    areasExplored: 0,
    secretsFound: 0,
    trapsTriggered: 0,
    
    // Items
    itemsFound: 0,
    itemsCrafted: 0,
    itemsSold: 0,
    goldEarned: 0,
    goldSpent: 0,
    
    // Social
    npcsMetCount: 0,
    questsCompleted: 0,
    questsFailed: 0,
    
    // NSFW specific
    timesStripped: 0,
    timesRestrained: 0,
    restraintsBroken: 0,
    cursesReceived: 0,
    cursesRemoved: 0,
    transformationsExperienced: 0,
    
    // Substance
    substancesUsed: 0,
    overdoses: 0,
    blackouts: 0,
    addictionsFormed: 0,
    addictionsOvercome: 0
  },
  
  // ============================================================================
  // PAPERDOLL STATE
  // ============================================================================
  paperdoll: {
    baseImages: {},
    layers: {},
    regionCounts: {}
  },
  
  // ============================================================================
  // SETTINGS & PREFERENCES
  // ============================================================================
  settings: {
    difficulty: 'normal',
    enabledTags: [],
    disabledTags: [],
    contentFilters: {}
  }
};

// ============================================================================
// SCENE CONDITION HELPERS
// ============================================================================

/**
 * Example scene conditions that can query any of the above stats
 */
export const exampleSceneConditions = {
  // Check if player is addicted to a specific substance
  isAddicted: (player, substanceId, minLevel = 40) => {
    const addiction = player.substanceState?.addictions?.[substanceId];
    return addiction && addiction.level >= minLevel;
  },
  
  // Check if player is in withdrawal
  isInWithdrawal: (player, substanceId = null) => {
    const state = player.substanceState;
    if (!state?.status?.isInWithdrawal) return false;
    if (!substanceId) return true;
    return state.addictions?.[substanceId]?.withdrawalActive;
  },
  
  // Check if player is intoxicated above threshold
  isIntoxicated: (player, minLevel = 30) => {
    return (player.substanceState?.status?.intoxicationLevel || 0) >= minLevel;
  },
  
  // Check if player is blacked out
  isBlackedOut: (player) => {
    return player.substanceState?.status?.isBlackedOut || false;
  },
  
  // Check if player has resistance to delivery method
  hasSubstanceResistance: (player, deliveryMethod, minValue = 50) => {
    const resistances = player.substanceState?.resistances || [];
    for (const r of resistances) {
      if (r.deliveryMethods.includes('all') || r.deliveryMethods.includes(deliveryMethod)) {
        if (r.value >= minValue) return true;
      }
    }
    return false;
  },
  
  // Check corruption level
  corruptionAbove: (player, threshold) => {
    return (player.nsfwStats?.corruption || 0) >= threshold;
  },
  
  // Check if player has specific kink discovered
  hasDiscoveredKink: (player, kinkId) => {
    return player.nsfwStats?.discoveredKinks?.includes(kinkId);
  },
  
  // Check orifice usage
  orificeUsedAbove: (player, orifice, count) => {
    return (player.nsfwStats?.orificeStats?.[orifice]?.penetrationCount || 0) >= count;
  },
  
  // Check if player is restrained
  isRestrained: (player) => {
    return player.combatState?.isRestrained || false;
  },
  
  // Check relationship status
  hasRelationshipAbove: (player, npcId, stat, value) => {
    const rel = player.relationships?.[npcId];
    return rel && (rel[stat] || 0) >= value;
  },
  
  // Check if player has status effect
  hasStatusEffect: (player, effectId) => {
    return player.nsfwStats?.statusEffects?.some(e => e.id === effectId);
  },
  
  // Check tolerance level
  hasToleranceAbove: (player, substanceId, level) => {
    return (player.substanceState?.tolerances?.[substanceId]?.level || 0) >= level;
  },
  
  // Complex condition: Player is vulnerable
  isVulnerable: (player) => {
    return player.substanceState?.status?.isBlackedOut ||
           player.combatState?.isRestrained ||
           player.combatState?.isGrappled ||
           (player.substanceState?.status?.intoxicationLevel || 0) >= 70 ||
           player.substanceState?.status?.isInWithdrawal;
  }
};

export default comprehensivePlayerState;
