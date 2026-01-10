/**
 * SubstanceSystem - Comprehensive drug, addiction, tolerance, and resistance management
 *
 * Features:
 * - Multiple substance delivery methods (inhalant, consumable, injectable, contact, implant)
 * - Addiction tracking with withdrawal effects
 * - Tolerance buildup affecting required dosage
 * - Resistance system (pills, equipment, innate)
 * - Overdose/blackout mechanics
 * - Encounter modifiers based on status
 * - Time-based decay for all effects
 */

import { nanoid } from 'nanoid';

// ============================================================================
// CONSTANTS & ENUMS
// ============================================================================

export const DELIVERY_METHOD = {
  INHALANT: 'inhalant',       // Gas, smoke, aerosol - blocked by masks
  CONSUMABLE: 'consumable',   // Pills, liquids, food - blocked by antidotes
  INJECTABLE: 'injectable',   // Needles, darts - blocked by armor/skin mods
  CONTACT: 'contact',         // Skin absorption - blocked by suits/gloves
  IMPLANT: 'implant',         // Surgical/permanent - very hard to resist
  AMBIENT: 'ambient'          // Environmental exposure - cumulative
};

export const SUBSTANCE_CATEGORY = {
  STIMULANT: 'stimulant',
  DEPRESSANT: 'depressant',
  HALLUCINOGEN: 'hallucinogen',
  APHRODISIAC: 'aphrodisiac',
  SEDATIVE: 'sedative',
  NARCOTIC: 'narcotic',
  ENHANCEMENT: 'enhancement',
  CORRUPTION: 'corruption',
  PHEROMONE: 'pheromone',
  MUTAGEN: 'mutagen',
  ANTIDOTE: 'antidote'
};

export const ADDICTION_STAGE = {
  NONE: 'none',
  CURIOUS: 'curious',       // 1-19% - Slight interest, no penalties
  CASUAL: 'casual',         // 20-39% - Occasional cravings
  HABITUAL: 'habitual',     // 40-59% - Regular use expected
  DEPENDENT: 'dependent',   // 60-79% - Withdrawal symptoms
  ADDICTED: 'addicted',     // 80-99% - Severe dependency
  ENSLAVED: 'enslaved'      // 100% - Cannot function without
};

export const RESISTANCE_SOURCE = {
  INNATE: 'innate',         // Natural resistance
  CONSUMABLE: 'consumable', // Pills, antidotes
  EQUIPMENT: 'equipment',   // Masks, suits, implants
  EFFECT: 'effect',         // Buffs, spells
  TRAINING: 'training'      // Learned resistance
};

// Duration types for turn-based timing
export const SUBSTANCE_DURATION_TYPE = {
  ACTIONS: 'actions',       // Player actions (explore, rest, talk, etc.)
  TURNS: 'turns',           // Combat turns
  DAYS: 'days',             // Rest cycles / days
  HOURS: 'hours'            // In-game hours (abstract, not real-time)
};

// ============================================================================
// DEFAULT PLAYER SUBSTANCE STATE
// ============================================================================

export const defaultSubstanceState = {
  // Active substance effects currently in the body
  activeSubstances: [
    // Example structure:
    // {
    //   substanceId: 'stimulant_x',
    //   dosesInSystem: 2,
    //   totalDoseToday: 3,
    //   currentIntensity: 0.8,  // 0-1, affected by tolerance
    //   durationType: 'actions',  // Duration type for this substance
    //   timeApplied: 0,  // Action/turn count when applied
    //   peakTime: 1,     // Action/turn count when peak starts
    //   wearOffTime: 16, // Action/turn count when effect ends
    //   phase: 'peak', // 'onset', 'peak', 'plateau', 'comedown', 'aftermath'
    //   stackId: 'unique_id'
    // }
  ],
  
  // Addiction levels per substance/category
  addictions: {
    // Example:
    // 'stimulant_x': {
    //   level: 45,  // 0-100
    //   stage: 'habitual',
    //   lastUseAction: 0,  // Action count when last used
    //   totalUses: 23,
    //   withdrawalActive: false,
    //   withdrawalSeverity: 0,
    //   gainToday: 0
    // }
  },

  // Tolerance levels (reduces effectiveness, requires higher doses)
  tolerances: {
    // Per specific substance
    // 'stimulant_x': {
    //   level: 30,  // 0-100, higher = more tolerant
    //   lastUseAction: 0,  // Action count when last used
    //   peakTolerance: 45,  // Highest it's ever been
    //   gainToday: 0
    // }

    // Per category (builds slower but affects all in category)
    // '_category_stimulant': { level: 15, lastUseAction: 0 }
  },
  
  // Active resistances (reduce or block substance effects)
  resistances: [
    // {
    //   id: 'resist_1',
    //   source: 'consumable',  // Where resistance comes from
    //   sourceId: 'antidote_pill',  // Specific item/effect
    //   deliveryMethods: ['inhalant', 'consumable'],  // What it blocks, or 'all'
    //   categories: ['all'],  // Substance categories blocked
    //   value: 75,  // 0-100 resistance percentage
    //   quality: 'high',  // Affects decay rate
    //   appliedTime: 0,  // Action count when applied
    //   durationActions: 12,  // Duration in actions, or null for permanent
    //   decayPerAction: 5,  // Points per action
    //   equipmentSlot: null  // If from equipment
    // }
  ],
  
  // Substance history and statistics
  history: {
    totalSubstancesUsed: 0,
    totalOverdoses: 0,
    totalBlackouts: 0,
    longestSoberStreak: 0,
    currentSoberStreak: 0,
    substancesTriedList: [],
    favoriteSubstance: null,
    mostAddictedEver: { substanceId: null, level: 0 }
  },
  
  // Current status flags
  status: {
    isIntoxicated: false,
    intoxicationLevel: 0,  // 0-100
    isBlackedOut: false,
    blackoutEndTime: null,
    isInWithdrawal: false,
    withdrawalSeverity: 0,
    isOverdosing: false,
    overdoseSubstance: null
  },
  
  // Daily tracking (resets each in-game day)
  daily: {
    dosesPerSubstance: {},  // { substanceId: count }
    lastResetDay: -1        // Day number of last reset
  },
  
  // Encounter modifiers from substance effects
  encounterModifiers: {
    passedOutEncounterChance: 0,  // Base modifier when unconscious
    activeModifiers: []  // From current effects
  }
};

// ============================================================================
// SUBSTANCE DEFINITION SCHEMA
// ============================================================================

/**
 * Example substance definition (would be in content JSON)
 */
export const exampleSubstanceDefinition = {
  id: 'bliss_inhaler',
  name: 'Bliss Inhaler',
  description: 'A popular street drug that induces euphoria and lowers inhibitions.',
  
  // Delivery and categorization
  deliveryMethod: 'inhalant',
  category: 'aphrodisiac',
  tags: ['street_drug', 'common', 'euphoric', 'lowered_inhibitions'],
  
  // Rarity and value
  rarity: 'uncommon',
  streetValue: 50,
  legalStatus: 'illegal',
  
  // Dosing mechanics
  dosing: {
    standardDose: 1,
    maxDosesBeforeOD: 4,        // Pass out after this many in a day
    maxDosesBeforeDeath: 8,     // Lethal dose (if enabled)
    doseDecayTime: 28800000,    // 8 hours in ms for dose to clear
    stackable: true,            // Can take multiple doses
    maxStacks: 3                // Max doses active at once
  },
  
  // Timing (in actions/turns for turn-based gameplay)
  timing: {
    durationType: 'actions',    // 'actions', 'turns', 'days', or 'hours'
    onsetDuration: 1,           // 1 action to kick in
    peakDuration: 3,            // 3 actions at peak
    plateauDuration: 5,         // 5 actions plateau
    comedownDuration: 3,        // 3 actions comedown
    aftermathDuration: 4,       // 4 actions aftermath/hangover
    totalDuration: 16           // 16 actions total
  },
  
  // Effects during different phases
  effects: {
    onset: {
      statModifiers: {
        willpower: { type: 'flat', value: -2 }
      },
      statusEffects: ['tingling', 'anticipation'],
      messages: ['You feel a warmth spreading through you...']
    },
    peak: {
      statModifiers: {
        charm: { type: 'percent', value: 25 },
        willpower: { type: 'flat', value: -5 },
        corruptionResistance: { type: 'flat', value: -10 },
        arousal: { type: 'flat', value: 30 }
      },
      statusEffects: ['euphoric', 'lowered_inhibitions', 'pheromone_emitting'],
      encounterModifiers: {
        passedOutChance: 15,
        attractionModifier: 1.5
      },
      messages: ['Waves of pleasure wash over you. Everything feels amazing.']
    },
    plateau: {
      statModifiers: {
        charm: { type: 'percent', value: 15 },
        willpower: { type: 'flat', value: -3 },
        arousal: { type: 'flat', value: 20 }
      },
      statusEffects: ['euphoric', 'compliant']
    },
    comedown: {
      statModifiers: {
        charm: { type: 'flat', value: -5 },
        stamina: { type: 'flat', value: -10 },
        willpower: { type: 'flat', value: -2 }
      },
      statusEffects: ['fatigued', 'craving'],
      messages: ['The high is fading. You feel drained.']
    },
    aftermath: {
      statModifiers: {
        stamina: { type: 'flat', value: -15 },
        strength: { type: 'flat', value: -3 },
        intelligence: { type: 'flat', value: -2 }
      },
      statusEffects: ['exhausted', 'foggy'],
      messages: ['Your body aches. You could really use another hit...']
    }
  },
  
  // How effects scale with tolerance
  toleranceScaling: {
    // At 0% tolerance, effects are at 100%
    // At 100% tolerance, effects are at this percentage
    minEffectiveness: 0.2,
    // How much tolerance increases per use
    toleranceGainPerUse: 8,
    // Max tolerance gain per day
    maxToleranceGainPerDay: 20,
    // Tolerance decay per hour when not using
    toleranceDecayPerHour: 2,
    // Also builds category tolerance
    buildsCategoryTolerance: true,
    categoryToleranceGain: 3
  },
  
  // Addiction mechanics
  addiction: {
    addictiveness: 65,  // 0-100, how addictive it is
    addictionGainPerUse: 5,
    maxAddictionGainPerDay: 15,
    addictionDecayPerDay: 2,  // Only decays if not used
    withdrawalEffects: {
      mild: {  // 20-39% addiction
        statModifiers: { willpower: -2, stamina: -5 },
        statusEffects: ['craving', 'irritable'],
        durationDays: 1  // 1 day
      },
      moderate: {  // 40-59%
        statModifiers: { willpower: -5, stamina: -10, strength: -3 },
        statusEffects: ['craving', 'shaking', 'anxious'],
        durationDays: 2  // 2 days
      },
      severe: {  // 60-79%
        statModifiers: { willpower: -10, stamina: -20, strength: -5, intelligence: -3 },
        statusEffects: ['desperate_craving', 'tremors', 'nausea', 'hallucinating'],
        durationDays: 3  // 3 days
      },
      extreme: {  // 80-100%
        statModifiers: { willpower: -15, stamina: -30, strength: -8, intelligence: -5, evasion: -5 },
        statusEffects: ['agonizing_withdrawal', 'seizures', 'delirium'],
        durationDays: 5,  // 5 days
        canBeLethal: true,
        damagePerRest: 5  // Damage per rest/day cycle
      }
    }
  },
  
  // Overdose effects
  overdose: {
    effects: {
      statModifiers: {
        all: { type: 'percent', value: -50 }
      },
      statusEffects: ['overdosing', 'unconscious', 'vulnerable'],
      durationActions: 8  // 8 actions blackout
    },
    encounterModifiers: {
      passedOutChance: 100,  // Guaranteed encounter roll
      encounterTypeWeights: {
        hostile: 30,
        opportunistic: 50,
        helpful: 20
      }
    },
    recoveryEffects: {
      statModifiers: { all: { type: 'flat', value: -5 } },
      durationActions: 12  // 12 actions of debuffs after waking
    }
  },
  
  // Resistance interaction
  resistance: {
    baseResistDifficulty: 40,  // DC to resist effects
    partialResistThreshold: 20,  // Resistance above this reduces effects
    fullResistThreshold: 80,    // Resistance above this blocks completely
    canBeResisted: true,
    resistanceStat: 'willpower'
  },
  
  // Cross-tolerance with other substances
  crossTolerance: [
    { substanceId: 'euphoria_pills', factor: 0.5 },
    { category: 'aphrodisiac', factor: 0.3 }
  ],
  
  // Interactions with other active substances
  interactions: [
    {
      withSubstance: 'depressant_x',
      effect: 'dangerous_combination',
      odThresholdModifier: -2,  // Easier to OD
      newEffects: ['respiratory_depression']
    },
    {
      withCategory: 'stimulant',
      effect: 'counteract',
      effectivenessModifier: 0.5  // Both less effective
    }
  ]
};

// ============================================================================
// RESISTANCE ITEM EXAMPLES
// ============================================================================

export const exampleResistanceItems = {
  // Consumable resistance
  broad_spectrum_antidote: {
    id: 'broad_spectrum_antidote',
    name: 'Broad Spectrum Antidote',
    type: 'consumable',
    category: 'antidote',
    description: 'A powerful pill that provides temporary resistance to all substance types.',
    resistanceEffect: {
      deliveryMethods: ['all'],
      categories: ['all'],
      value: 75,
      quality: 'high',
      durationActions: 12,  // 12 actions
      decayPerAction: 5  // Points per action
    }
  },

  inhalant_filter_pill: {
    id: 'inhalant_filter_pill',
    name: 'Lung Filter Pill',
    type: 'consumable',
    category: 'antidote',
    description: 'Temporarily coats your lungs to filter airborne substances.',
    resistanceEffect: {
      deliveryMethods: ['inhalant', 'ambient'],
      categories: ['all'],
      value: 90,
      quality: 'medium',
      durationActions: 6,  // 6 actions
      decayPerAction: 10
    }
  },
  
  // Equipment resistance
  gas_mask: {
    id: 'gas_mask',
    name: 'Military Gas Mask',
    type: 'equipment',
    slot: 'head',
    description: 'Filters all airborne substances when worn.',
    resistanceEffect: {
      deliveryMethods: ['inhalant', 'ambient'],
      categories: ['all'],
      value: 95,
      quality: 'permanent',  // Doesn't decay while equipped
      duration: null,
      decayRate: 0,
      requiresEquipped: true
    },
    paperdollType: 'mask'
  },
  
  hazmat_suit: {
    id: 'hazmat_suit',
    name: 'Hazmat Suit',
    type: 'equipment',
    slot: 'body_full',
    description: 'Full body protection against contact and airborne substances.',
    resistanceEffect: {
      deliveryMethods: ['inhalant', 'contact', 'ambient'],
      categories: ['all'],
      value: 100,
      quality: 'permanent',
      duration: null,
      requiresEquipped: true
    }
  },
  
  reinforced_skin_implant: {
    id: 'reinforced_skin_implant',
    name: 'Dermal Barrier Implant',
    type: 'implant',
    slot: 'implant_skin',
    description: 'Subdermal implant that resists contact substances and injections.',
    resistanceEffect: {
      deliveryMethods: ['contact', 'injectable'],
      categories: ['all'],
      value: 60,
      quality: 'permanent',
      duration: null,
      permanent: true
    }
  },
  
  aphrodisiac_resistance_training: {
    id: 'aphrodisiac_resistance_training',
    name: 'Aphrodisiac Resistance Training',
    type: 'training',
    description: 'Mental conditioning that provides permanent partial resistance to aphrodisiacs.',
    resistanceEffect: {
      deliveryMethods: ['all'],
      categories: ['aphrodisiac', 'pheromone'],
      value: 30,
      quality: 'permanent',
      duration: null,
      permanent: true,
      source: 'training'
    }
  }
};

// ============================================================================
// STATUS EFFECTS THAT MODIFY ENCOUNTERS
// ============================================================================

export const encounterModifyingEffects = {
  pheromone_emitting: {
    id: 'pheromone_emitting',
    name: 'Emitting Pheromones',
    description: 'Your body is releasing attractive pheromones.',
    encounterModifiers: {
      baseModifier: 25,  // +25% encounter chance
      passedOutModifier: 50,  // +50% when unconscious
      encounterTypeWeights: {
        lustful: 2.0,  // Double chance of lustful encounters
        hostile: 1.0,
        neutral: 0.5
      },
      attractsTypes: ['humanoid', 'beast', 'monster'],
      repelsTypes: []
    },
    durationActions: 8,  // 8 actions
    visible: true,
    removable: true,
    removeMethod: ['shower', 'cleanse_spell', 'time']
  },
  
  vulnerability_aura: {
    id: 'vulnerability_aura',
    name: 'Vulnerability Aura',
    description: 'You appear weak and defenseless.',
    encounterModifiers: {
      baseModifier: 15,
      passedOutModifier: 75,
      encounterTypeWeights: {
        predatory: 2.5,
        opportunistic: 2.0,
        helpful: 0.3
      }
    }
  },
  
  intoxication_obvious: {
    id: 'intoxication_obvious',
    name: 'Visibly Intoxicated',
    description: 'Your intoxication is obvious to everyone.',
    encounterModifiers: {
      baseModifier: 20,
      passedOutModifier: 40,
      encounterTypeWeights: {
        opportunistic: 1.8,
        helpful: 1.2,  // Some might help
        hostile: 1.3
      }
    }
  },
  
  marked_prey: {
    id: 'marked_prey',
    name: 'Marked as Prey',
    description: 'Something has marked you. Predators can sense it.',
    encounterModifiers: {
      baseModifier: 40,
      passedOutModifier: 100,
      encounterTypeWeights: {
        predatory: 3.0,
        monster: 2.0
      },
      guaranteedEncounterTypes: ['hunter']
    },
    durationDays: 1  // 1 day
  }
};

// ============================================================================
// SUBSTANCE SYSTEM CLASS
// ============================================================================

export class SubstanceSystem {
  constructor(registry, effectSystem, options = {}) {
    this.registry = registry;
    this.effectSystem = effectSystem;
    this.callbacks = options.callbacks || {};
    this.safeLocations = options.safeLocations || [];

    // Game time provider returns game state time, not real time
    // Expected format: { currentAction: 0, currentTurn: 0, currentDay: 0, currentHour: 12 }
    this.gameTimeProvider = options.gameTimeProvider || (() => ({
      currentAction: 0,
      currentTurn: 0,
      currentDay: 0,
      currentHour: 12
    }));

    // Default duration type for substances without explicit timing
    this.defaultDurationType = options.defaultDurationType || SUBSTANCE_DURATION_TYPE.ACTIONS;
  }

  /**
   * Get the current game time value based on duration type
   * @param {string} durationType - The type of duration to get
   * @returns {number} Current time value for that duration type
   */
  getGameTime(durationType = this.defaultDurationType) {
    const time = this.gameTimeProvider();

    // Handle legacy millisecond providers
    if (typeof time === 'number') {
      console.warn('SubstanceSystem: Using legacy millisecond time provider. Consider updating to turn-based.');
      return time;
    }

    switch (durationType) {
      case SUBSTANCE_DURATION_TYPE.ACTIONS:
        return time.currentAction ?? 0;
      case SUBSTANCE_DURATION_TYPE.TURNS:
        return time.currentTurn ?? 0;
      case SUBSTANCE_DURATION_TYPE.DAYS:
        return time.currentDay ?? 0;
      case SUBSTANCE_DURATION_TYPE.HOURS:
        return (time.currentDay ?? 0) * 24 + (time.currentHour ?? 12);
      default:
        return time.currentAction ?? 0;
    }
  }

  /**
   * Get the duration type for a substance
   * @param {Object} substance - Substance definition
   * @returns {string} Duration type
   */
  getSubstanceDurationType(substance) {
    return substance?.timing?.durationType ?? this.defaultDurationType;
  }

  // =========================================================================
  // SUBSTANCE ADMINISTRATION
  // =========================================================================

  /**
   * Administer a substance to a character
   */
  async administerSubstance(character, substanceId, options = {}) {
    const substance = await this.registry?.getItem(substanceId) ||
                      this.getSubstanceDefinition(substanceId);

    if (!substance) {
      return { success: false, reason: 'Substance not found' };
    }

    const durationType = this.getSubstanceDurationType(substance);
    const currentTime = this.getGameTime(durationType);
    const state = character.substanceState || { ...defaultSubstanceState };
    
    // Check daily dose reset
    this.checkDailyReset(state, currentTime);
    
    // Calculate effective resistance
    const resistance = this.calculateResistance(
      state, 
      substance.deliveryMethod, 
      substance.category
    );
    
    // Check if fully resisted
    if (resistance >= (substance.resistance?.fullResistThreshold || 80)) {
      if (this.callbacks.onResisted) {
        this.callbacks.onResisted(character, substance, 'full');
      }
      return { 
        success: false, 
        reason: 'Fully resisted',
        resistance 
      };
    }
    
    // Calculate dose accounting for current doses in system
    const dosesToday = state.daily.dosesPerSubstance[substanceId] || 0;
    const newDoseCount = dosesToday + 1;
    
    // Check for overdose
    const maxDoses = substance.dosing?.maxDosesBeforeOD || 5;
    if (newDoseCount > maxDoses) {
      return this.handleOverdose(character, state, substance, currentTime);
    }
    
    // Calculate effectiveness based on tolerance and resistance
    const tolerance = this.getTolerance(state, substanceId, substance.category);
    const toleranceScaling = substance.toleranceScaling || {};
    const minEffectiveness = toleranceScaling.minEffectiveness || 0.2;
    const toleranceFactor = 1 - (tolerance / 100) * (1 - minEffectiveness);
    
    // Partial resistance reduces effectiveness
    const resistanceFactor = resistance >= (substance.resistance?.partialResistThreshold || 20)
      ? 1 - (resistance / 100) * 0.5  // Up to 50% reduction from partial resist
      : 1;
    
    const effectiveness = toleranceFactor * resistanceFactor;
    
    // Check for dangerous interactions
    const interactions = this.checkInteractions(state, substance);
    if (interactions.dangerous) {
      // Modify OD threshold
      const modifiedMaxDoses = maxDoses + (interactions.odThresholdModifier || 0);
      if (newDoseCount > modifiedMaxDoses) {
        return this.handleOverdose(character, state, substance, currentTime, interactions);
      }
    }
    
    // Apply the substance
    const timing = substance.timing || {};
    const totalDuration = timing.totalDuration ?? 16;  // Default 16 actions

    const activeEffect = {
      substanceId: substance.id,
      substanceName: substance.name,
      dosesInSystem: 1,
      totalDoseToday: newDoseCount,
      currentIntensity: effectiveness,
      effectiveness,
      durationType,
      timeApplied: currentTime,
      peakTime: currentTime + (timing.onsetDuration ?? 1),
      wearOffTime: currentTime + totalDuration,
      phase: 'onset',
      stackId: `${substance.id}_${currentTime}`,
      deliveryMethod: substance.deliveryMethod,
      category: substance.category
    };
    
    // Check stacking
    const existingEffects = state.activeSubstances.filter(s => s.substanceId === substanceId);
    const maxStacks = substance.dosing?.maxStacks || 3;
    
    if (existingEffects.length >= maxStacks) {
      // Refresh existing instead of adding new
      const oldest = existingEffects.reduce((a, b) =>
        a.timeApplied < b.timeApplied ? a : b
      );
      oldest.dosesInSystem++;
      oldest.currentIntensity = Math.min(1, oldest.currentIntensity + effectiveness * 0.5);
      oldest.wearOffTime = currentTime + totalDuration;
    } else {
      state.activeSubstances.push(activeEffect);
    }
    
    // Update daily tracking
    state.daily.dosesPerSubstance[substanceId] = newDoseCount;
    
    // Update tolerance
    this.updateTolerance(state, substance, currentTime);
    
    // Update addiction
    this.updateAddiction(state, substance, currentTime);
    
    // Apply immediate effects
    const effectsApplied = this.applyPhaseEffects(character, substance, 'onset', effectiveness);
    
    // Update status
    state.status.isIntoxicated = true;
    state.status.intoxicationLevel = Math.min(100, 
      state.status.intoxicationLevel + (substance.intoxicationValue || 20) * effectiveness
    );
    
    // Update history
    state.history.totalSubstancesUsed++;
    if (!state.history.substancesTriedList.includes(substanceId)) {
      state.history.substancesTriedList.push(substanceId);
    }
    state.history.currentSoberStreak = 0;
    
    // Update encounter modifiers
    this.updateEncounterModifiers(state, substance, 'onset');
    
    // Callbacks
    if (this.callbacks.onSubstanceApplied) {
      this.callbacks.onSubstanceApplied(character, substance, activeEffect, effectsApplied);
    }
    
    return {
      success: true,
      effect: activeEffect,
      effectiveness,
      tolerance,
      resistance,
      interactions,
      effectsApplied,
      message: substance.effects?.onset?.messages?.[0] || `${substance.name} takes effect.`
    };
  }

  /**
   * Handle overdose
   */
  handleOverdose(character, state, substance, currentTime, interactions = null) {
    state.status.isOverdosing = true;
    state.status.overdoseSubstance = substance.id;
    state.status.isBlackedOut = true;

    // Use action-based duration (durationActions) or default to 8 actions
    const odDuration = substance.overdose?.effects?.durationActions ?? 8;
    state.status.blackoutEndTime = currentTime + odDuration;
    
    // Apply OD effects
    if (substance.overdose?.effects?.statusEffects) {
      for (const effect of substance.overdose.effects.statusEffects) {
        this.effectSystem?.applyEffect?.(character, effect);
      }
    }
    
    // Set encounter modifiers for passed out state
    const odEncounter = substance.overdose?.encounterModifiers || {};
    state.encounterModifiers.passedOutEncounterChance = odEncounter.passedOutChance || 50;
    
    // Update history
    state.history.totalOverdoses++;
    state.history.totalBlackouts++;
    
    if (this.callbacks.onOverdose) {
      this.callbacks.onOverdose(character, substance, interactions);
    }
    
    return {
      success: false,
      reason: 'overdose',
      blackoutDuration: odDuration,
      encounterChance: state.encounterModifiers.passedOutEncounterChance,
      message: `You've taken too much ${substance.name}! Everything goes dark...`
    };
  }

  // =========================================================================
  // RESISTANCE MANAGEMENT
  // =========================================================================

  /**
   * Calculate total resistance against a delivery method and category
   */
  calculateResistance(state, deliveryMethod, category) {
    let totalResistance = 0;
    const resistances = state.resistances || [];
    
    for (const resist of resistances) {
      // Check if this resistance applies
      const methodMatches = resist.deliveryMethods.includes('all') || 
                           resist.deliveryMethods.includes(deliveryMethod);
      const categoryMatches = resist.categories.includes('all') || 
                             resist.categories.includes(category);
      
      if (methodMatches && categoryMatches) {
        // Apply decay if applicable
        const currentValue = this.getDecayedResistanceValue(resist);
        totalResistance += currentValue;
      }
    }
    
    // Cap at 100
    return Math.min(100, totalResistance);
  }

  /**
   * Get resistance value after decay (turn-based)
   */
  getDecayedResistanceValue(resistance) {
    if (resistance.quality === 'permanent' || !resistance.decayPerAction) {
      return resistance.value;
    }

    const currentTime = this.getGameTime(SUBSTANCE_DURATION_TYPE.ACTIONS);
    const elapsedActions = currentTime - (resistance.appliedTime ?? 0);
    const decayed = resistance.value - (resistance.decayPerAction * elapsedActions);

    return Math.max(0, decayed);
  }

  /**
   * Apply a resistance effect (from item, spell, etc.)
   */
  applyResistance(state, resistanceEffect, source, sourceId) {
    const currentTime = this.getGameTime(SUBSTANCE_DURATION_TYPE.ACTIONS);

    const newResistance = {
      id: `resist_${nanoid()}`,
      source,
      sourceId,
      deliveryMethods: resistanceEffect.deliveryMethods || ['all'],
      categories: resistanceEffect.categories || ['all'],
      value: resistanceEffect.value || 50,
      quality: resistanceEffect.quality || 'medium',
      appliedTime: currentTime,
      durationActions: resistanceEffect.durationActions,
      decayPerAction: resistanceEffect.decayPerAction || 5,
      equipmentSlot: resistanceEffect.equipmentSlot || null,
      permanent: resistanceEffect.permanent || false
    };
    
    // Remove any existing resistance from same source
    state.resistances = state.resistances.filter(r => 
      !(r.source === source && r.sourceId === sourceId)
    );
    
    state.resistances.push(newResistance);
    
    return newResistance;
  }

  /**
   * Remove a resistance
   */
  removeResistance(state, resistanceId) {
    const index = state.resistances.findIndex(r => r.id === resistanceId);
    if (index !== -1) {
      const removed = state.resistances.splice(index, 1)[0];
      return removed;
    }
    return null;
  }

  /**
   * Remove resistance by source (e.g., when unequipping item)
   */
  removeResistanceBySource(state, source, sourceId) {
    const removed = state.resistances.filter(r => 
      r.source === source && r.sourceId === sourceId
    );
    state.resistances = state.resistances.filter(r => 
      !(r.source === source && r.sourceId === sourceId)
    );
    return removed;
  }

  // =========================================================================
  // TOLERANCE MANAGEMENT
  // =========================================================================

  /**
   * Get tolerance level for a substance
   */
  getTolerance(state, substanceId, category) {
    const specificTolerance = state.tolerances[substanceId]?.level || 0;
    const categoryTolerance = state.tolerances[`_category_${category}`]?.level || 0;
    
    // Combine, but specific tolerance matters more
    return Math.min(100, specificTolerance + categoryTolerance * 0.5);
  }

  /**
   * Update tolerance after substance use (turn-based)
   */
  updateTolerance(state, substance, currentTime) {
    const toleranceConfig = substance.toleranceScaling || {};
    const substanceId = substance.id;
    const currentAction = this.getGameTime(SUBSTANCE_DURATION_TYPE.ACTIONS);

    // Initialize if needed
    if (!state.tolerances[substanceId]) {
      state.tolerances[substanceId] = {
        level: 0,
        lastUseAction: currentAction,
        peakTolerance: 0,
        gainToday: 0
      };
    }

    const tol = state.tolerances[substanceId];
    const gainPerUse = toleranceConfig.toleranceGainPerUse || 5;
    const maxGainPerDay = toleranceConfig.maxToleranceGainPerDay || 20;

    // Check daily limit
    const remainingGain = maxGainPerDay - (tol.gainToday || 0);
    const actualGain = Math.min(gainPerUse, remainingGain);

    tol.level = Math.min(100, tol.level + actualGain);
    tol.lastUseAction = currentAction;
    tol.gainToday = (tol.gainToday || 0) + actualGain;
    tol.peakTolerance = Math.max(tol.peakTolerance, tol.level);

    // Category tolerance
    if (toleranceConfig.buildsCategoryTolerance && substance.category) {
      const catKey = `_category_${substance.category}`;
      if (!state.tolerances[catKey]) {
        state.tolerances[catKey] = { level: 0, lastUseAction: currentAction };
      }
      state.tolerances[catKey].level = Math.min(100,
        state.tolerances[catKey].level + (toleranceConfig.categoryToleranceGain || 2)
      );
      state.tolerances[catKey].lastUseAction = currentAction;
    }
  }

  /**
   * Decay tolerance over time (called per day/rest)
   * @param {Object} state - Substance state
   * @param {number} days - Number of days elapsed (typically 1)
   */
  decayTolerances(state, days = 1) {
    for (const [key, tol] of Object.entries(state.tolerances)) {
      if (tol.level > 0) {
        // Decay rate per day (could be customized per substance)
        const decayRate = 2;  // Default 2 points per day
        tol.level = Math.max(0, tol.level - decayRate * days);
      }
    }
  }

  // =========================================================================
  // ADDICTION MANAGEMENT
  // =========================================================================

  /**
   * Get addiction stage from level
   */
  getAddictionStage(level) {
    if (level >= 100) return ADDICTION_STAGE.ENSLAVED;
    if (level >= 80) return ADDICTION_STAGE.ADDICTED;
    if (level >= 60) return ADDICTION_STAGE.DEPENDENT;
    if (level >= 40) return ADDICTION_STAGE.HABITUAL;
    if (level >= 20) return ADDICTION_STAGE.CASUAL;
    if (level >= 1) return ADDICTION_STAGE.CURIOUS;
    return ADDICTION_STAGE.NONE;
  }

  /**
   * Update addiction after substance use (turn-based)
   */
  updateAddiction(state, substance, currentTime) {
    const addictionConfig = substance.addiction || {};
    const substanceId = substance.id;

    if (!addictionConfig.addictiveness) return;

    const currentAction = this.getGameTime(SUBSTANCE_DURATION_TYPE.ACTIONS);

    // Initialize if needed
    if (!state.addictions[substanceId]) {
      state.addictions[substanceId] = {
        level: 0,
        stage: ADDICTION_STAGE.NONE,
        lastUseAction: currentAction,
        totalUses: 0,
        withdrawalActive: false,
        withdrawalSeverity: 0,
        gainToday: 0
      };
    }

    const addiction = state.addictions[substanceId];

    // Calculate addiction gain
    const baseGain = addictionConfig.addictionGainPerUse || 3;
    const addictiveness = addictionConfig.addictiveness / 100;
    const maxGainPerDay = addictionConfig.maxAddictionGainPerDay || 10;

    const remainingGain = maxGainPerDay - (addiction.gainToday || 0);
    const actualGain = Math.min(baseGain * addictiveness, remainingGain);

    addiction.level = Math.min(100, addiction.level + actualGain);
    addiction.stage = this.getAddictionStage(addiction.level);
    addiction.lastUseAction = currentAction;
    addiction.totalUses++;
    addiction.gainToday = (addiction.gainToday || 0) + actualGain;
    
    // Using clears withdrawal
    if (addiction.withdrawalActive) {
      addiction.withdrawalActive = false;
      addiction.withdrawalSeverity = 0;
      state.status.isInWithdrawal = false;
    }
    
    // Track in history
    if (addiction.level > state.history.mostAddictedEver.level) {
      state.history.mostAddictedEver = {
        substanceId,
        level: addiction.level
      };
    }
  }

  /**
   * Process withdrawal for all addictions (turn-based)
   */
  processWithdrawals(character, state, tickType) {
    const currentActions = this.getGameTime(SUBSTANCE_DURATION_TYPE.ACTIONS);
    const withdrawalEffects = [];

    for (const [substanceId, addiction] of Object.entries(state.addictions)) {
      if (addiction.level < 20) continue;  // No withdrawal below casual

      // Check actions since last use
      const actionsSinceUse = currentActions - (addiction.lastUseAction ?? 0);
      const withdrawalThreshold = this.getWithdrawalThreshold(addiction.stage);

      if (actionsSinceUse > withdrawalThreshold && !addiction.withdrawalActive) {
        // Enter withdrawal
        addiction.withdrawalActive = true;
        
        // Get substance config for withdrawal effects
        const substance = this.getSubstanceDefinition(substanceId);
        const withdrawalConfig = substance?.addiction?.withdrawalEffects;
        
        if (withdrawalConfig) {
          const severity = this.getWithdrawalSeverity(addiction.stage);
          const effects = withdrawalConfig[severity];
          
          if (effects) {
            addiction.withdrawalSeverity = severity;
            withdrawalEffects.push({
              substanceId,
              severity,
              effects
            });
            
            // Apply withdrawal status effects
            if (effects.statusEffects) {
              for (const effect of effects.statusEffects) {
                this.effectSystem?.applyEffect?.(character, effect);
              }
            }
          }
        }
        
        state.status.isInWithdrawal = true;
      }
    }
    
    return withdrawalEffects;
  }

  /**
   * Get withdrawal threshold based on addiction stage (in actions)
   */
  getWithdrawalThreshold(stage) {
    // Thresholds in actions (roughly: 1 action = exploration/activity)
    const thresholds = {
      [ADDICTION_STAGE.CASUAL]: 24,      // ~24 actions (full day of activity)
      [ADDICTION_STAGE.HABITUAL]: 12,    // ~12 actions (half day)
      [ADDICTION_STAGE.DEPENDENT]: 6,    // ~6 actions
      [ADDICTION_STAGE.ADDICTED]: 3,     // ~3 actions
      [ADDICTION_STAGE.ENSLAVED]: 1      // Just 1 action
    };
    return thresholds[stage] || 24;
  }

  /**
   * Get withdrawal severity string
   */
  getWithdrawalSeverity(stage) {
    const severities = {
      [ADDICTION_STAGE.CASUAL]: 'mild',
      [ADDICTION_STAGE.HABITUAL]: 'moderate',
      [ADDICTION_STAGE.DEPENDENT]: 'severe',
      [ADDICTION_STAGE.ADDICTED]: 'extreme',
      [ADDICTION_STAGE.ENSLAVED]: 'extreme'
    };
    return severities[stage] || 'mild';
  }

  /**
   * Decay addictions over time (when not using)
   */
  decayAddictions(state, elapsedDays) {
    for (const [substanceId, addiction] of Object.entries(state.addictions)) {
      // Get substance-specific decay rate
      const substance = this.getSubstanceDefinition(substanceId);
      const decayPerDay = substance?.addiction?.addictionDecayPerDay || 1;
      
      // Only decay if not in withdrawal (withdrawal pauses decay)
      if (!addiction.withdrawalActive && addiction.level > 0) {
        addiction.level = Math.max(0, addiction.level - decayPerDay * elapsedDays);
        addiction.stage = this.getAddictionStage(addiction.level);
      }
    }
  }

  // =========================================================================
  // TIME PROCESSING
  // =========================================================================

  /**
   * Process all time-based effects (turn-based version)
   * @param {Object} character - Character state
   * @param {string} tickType - Type of tick: 'action', 'turn', 'day', 'hour', 'rest'
   * @param {Object} context - Additional context
   */
  tick(character, tickType = 'action', context = {}) {
    const state = character.substanceState;
    if (!state) return { changes: [] };

    const changes = [];

    // Check daily reset on day tick
    if (tickType === 'day' || tickType === 'rest') {
      const currentDay = this.getGameTime(SUBSTANCE_DURATION_TYPE.DAYS);
      this.checkDailyReset(state, currentDay);
    }

    // Process active substances
    for (let i = state.activeSubstances.length - 1; i >= 0; i--) {
      const active = state.activeSubstances[i];
      const substance = this.getSubstanceDefinition(active.substanceId);

      if (!substance) continue;

      const durationType = this.getSubstanceDurationType(substance);
      const currentTime = this.getGameTime(durationType);

      // Check if worn off
      if (currentTime >= active.wearOffTime) {
        // Remove and apply aftermath
        state.activeSubstances.splice(i, 1);
        changes.push({
          type: 'substance_worn_off',
          substanceId: active.substanceId,
          substance
        });
        continue;
      }

      // Update phase
      const newPhase = this.calculatePhase(active, substance, currentTime);
      if (newPhase !== active.phase) {
        const oldPhase = active.phase;
        active.phase = newPhase;

        // Apply new phase effects
        this.applyPhaseEffects(character, substance, newPhase, active.effectiveness);

        // Remove old phase effects
        this.removePhaseEffects(character, substance, oldPhase);

        changes.push({
          type: 'phase_change',
          substanceId: active.substanceId,
          oldPhase,
          newPhase,
          message: substance.effects?.[newPhase]?.messages?.[0]
        });
      }
    }

    // Update intoxication level
    this.updateIntoxicationLevel(state);

    // Process blackout recovery (check on any tick)
    const currentActions = this.getGameTime(SUBSTANCE_DURATION_TYPE.ACTIONS);
    if (state.status.isBlackedOut && currentActions >= state.status.blackoutEndTime) {
      state.status.isBlackedOut = false;
      state.status.isOverdosing = false;
      state.status.overdoseSubstance = null;
      changes.push({ type: 'blackout_ended' });
    }

    // Decay tolerances (per day or on rest)
    if (tickType === 'day' || tickType === 'rest') {
      this.decayTolerances(state, 1); // 1 day's worth of decay
    }

    // Process withdrawals
    const withdrawals = this.processWithdrawals(character, state, tickType);
    if (withdrawals.length > 0) {
      changes.push({ type: 'withdrawal_started', withdrawals });
    }

    // Decay expired resistances
    this.cleanupExpiredResistances(state, currentActions);

    // Update encounter modifiers
    this.recalculateEncounterModifiers(state);

    return { changes };
  }

  /**
   * Calculate current phase based on timing (turn-based)
   * @param {Object} activeEffect - Active substance effect
   * @param {Object} substance - Substance definition
   * @param {number} currentTime - Current game time value
   * @returns {string} Current phase name
   */
  calculatePhase(activeEffect, substance, currentTime) {
    const timing = substance.timing || {};
    const elapsed = currentTime - activeEffect.timeApplied;

    // Default durations (in actions/turns, not milliseconds)
    const onsetEnd = timing.onsetDuration ?? 1;
    const peakEnd = onsetEnd + (timing.peakDuration ?? 3);
    const plateauEnd = peakEnd + (timing.plateauDuration ?? 5);
    const comedownEnd = plateauEnd + (timing.comedownDuration ?? 3);
    
    if (elapsed < onsetEnd) return 'onset';
    if (elapsed < peakEnd) return 'peak';
    if (elapsed < plateauEnd) return 'plateau';
    if (elapsed < comedownEnd) return 'comedown';
    return 'aftermath';
  }

  /**
   * Check and reset daily tracking (turn-based)
   */
  checkDailyReset(state, currentDay) {
    const lastResetDay = state.daily.lastResetDay ?? -1;

    if (currentDay > lastResetDay) {
      state.daily.dosesPerSubstance = {};
      state.daily.lastResetDay = currentDay;

      // Reset daily gain limits for tolerances and addictions
      for (const tol of Object.values(state.tolerances)) {
        tol.gainToday = 0;
      }
      for (const add of Object.values(state.addictions)) {
        add.gainToday = 0;
      }
    }
  }

  // =========================================================================
  // ENCOUNTER MODIFIERS
  // =========================================================================

  /**
   * Update encounter modifiers based on current substance effects (turn-based)
   */
  updateEncounterModifiers(state, substance, phase) {
    const phaseEffects = substance.effects?.[phase];
    if (!phaseEffects?.encounterModifiers) return;

    const mods = phaseEffects.encounterModifiers;
    const durationType = this.getSubstanceDurationType(substance);
    const currentTime = this.getGameTime(durationType);
    const totalDuration = substance.timing?.totalDuration ?? 16;

    state.encounterModifiers.activeModifiers.push({
      source: `${substance.id}_${phase}`,
      passedOutChance: mods.passedOutChance || 0,
      baseModifier: mods.attractionModifier || 1,
      durationType,
      expires: currentTime + totalDuration
    });
  }

  /**
   * Recalculate total encounter modifiers (turn-based)
   */
  recalculateEncounterModifiers(state) {
    // Remove expired modifiers (check each by its own duration type)
    state.encounterModifiers.activeModifiers =
      state.encounterModifiers.activeModifiers.filter(m => {
        const durationType = m.durationType || SUBSTANCE_DURATION_TYPE.ACTIONS;
        const currentTime = this.getGameTime(durationType);
        return m.expires > currentTime;
      });

    // Sum up passed out chance
    let totalPassedOutChance = 0;
    for (const mod of state.encounterModifiers.activeModifiers) {
      totalPassedOutChance += mod.passedOutChance || 0;
    }

    state.encounterModifiers.passedOutEncounterChance = Math.min(100, totalPassedOutChance);
  }

  /**
   * Get encounter chance for a location when character is passed out
   */
  getPassedOutEncounterChance(character, locationId) {
    const state = character.substanceState;
    if (!state?.status?.isBlackedOut) return 0;
    
    // Safe locations = 0% chance
    if (this.safeLocations.includes(locationId)) return 0;
    
    // Base chance from substance effects
    let chance = state.encounterModifiers.passedOutEncounterChance;
    
    // Add modifiers from status effects
    const statusEffects = character.statusEffects || [];
    for (const effect of statusEffects) {
      const effectDef = encounterModifyingEffects[effect.id];
      if (effectDef?.encounterModifiers?.passedOutModifier) {
        chance += effectDef.encounterModifiers.passedOutModifier;
      }
    }
    
    return Math.min(100, chance);
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  /**
   * Apply effects for a substance phase
   */
  applyPhaseEffects(character, substance, phase, effectiveness) {
    const phaseEffects = substance.effects?.[phase];
    if (!phaseEffects) return [];
    
    const applied = [];
    
    // Apply stat modifiers (scaled by effectiveness)
    if (phaseEffects.statModifiers && this.effectSystem) {
      for (const [stat, mod] of Object.entries(phaseEffects.statModifiers)) {
        const scaledValue = mod.type === 'percent' 
          ? mod.value * effectiveness
          : Math.round(mod.value * effectiveness);
        
        applied.push({
          type: 'stat_modifier',
          stat,
          value: scaledValue,
          modType: mod.type
        });
      }
    }
    
    // Apply status effects
    if (phaseEffects.statusEffects && this.effectSystem) {
      for (const effectId of phaseEffects.statusEffects) {
        this.effectSystem.applyEffect?.(character, effectId);
        applied.push({ type: 'status_effect', effectId });
      }
    }
    
    return applied;
  }

  /**
   * Remove effects from a substance phase
   */
  removePhaseEffects(character, substance, phase) {
    const phaseEffects = substance.effects?.[phase];
    if (!phaseEffects) return;
    
    // Remove status effects specific to this phase
    if (phaseEffects.statusEffects && this.effectSystem) {
      for (const effectId of phaseEffects.statusEffects) {
        this.effectSystem.removeEffect?.(character, effectId);
      }
    }
  }

  /**
   * Update intoxication level based on active substances
   */
  updateIntoxicationLevel(state) {
    let total = 0;
    
    for (const active of state.activeSubstances) {
      const substance = this.getSubstanceDefinition(active.substanceId);
      const intoxValue = substance?.intoxicationValue || 20;
      total += intoxValue * active.currentIntensity;
    }
    
    state.status.intoxicationLevel = Math.min(100, total);
    state.status.isIntoxicated = total > 0;
  }

  /**
   * Check for dangerous interactions
   */
  checkInteractions(state, newSubstance) {
    const result = {
      dangerous: false,
      interactions: [],
      odThresholdModifier: 0,
      effectivenessModifier: 1
    };
    
    if (!newSubstance.interactions) return result;
    
    for (const active of state.activeSubstances) {
      for (const interaction of newSubstance.interactions) {
        const matches = interaction.withSubstance === active.substanceId ||
                       interaction.withCategory === active.category;
        
        if (matches) {
          result.interactions.push({
            with: active.substanceId,
            effect: interaction.effect
          });
          
          if (interaction.effect === 'dangerous_combination') {
            result.dangerous = true;
            result.odThresholdModifier += interaction.odThresholdModifier || -1;
          }
          
          if (interaction.effectivenessModifier) {
            result.effectivenessModifier *= interaction.effectivenessModifier;
          }
        }
      }
    }
    
    return result;
  }

  /**
   * Clean up expired resistances (turn-based)
   */
  cleanupExpiredResistances(state, currentActions) {
    state.resistances = state.resistances.filter(r => {
      if (r.permanent || r.quality === 'permanent') return true;
      if (!r.durationActions) return true;
      return currentActions < (r.appliedTime ?? 0) + r.durationActions;
    });
  }

  /**
   * Get substance definition from registry
   * @param {string} substanceId - Substance ID to look up
   * @returns {Object|null} Substance definition or null if not found
   */
  getSubstanceDefinition(substanceId) {
    if (!substanceId) return null;

    // Try to get from registry (substances can be items or dedicated substance entries)
    if (this.registry) {
      // Try as item first (most substances are items)
      const item = this.registry.getItemSync?.(substanceId) ||
                   this.registry.items?.get?.(substanceId);
      if (item) return item;

      // Try as dedicated substance
      const substance = this.registry.getSubstanceSync?.(substanceId) ||
                       this.registry.substances?.get?.(substanceId);
      if (substance) return substance;
    }

    return null;
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  /**
   * Get full state for saving
   */
  getSerializableState(state) {
    return JSON.parse(JSON.stringify(state));
  }

  /**
   * Restore state from save
   */
  restoreState(savedState) {
    return {
      ...defaultSubstanceState,
      ...savedState
    };
  }
}

export default SubstanceSystem;
