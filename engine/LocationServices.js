/**
 * LocationServices.js - Handles church, clinic, and nursery services
 *
 * Churches: Curse removal, magical debuffs (hypnosis from magic), tithing/charity work
 * Clinics: STDs, addictions, technological hypnosis (visor), abortions
 * Nurseries: Egg laying, giving birth
 */

class LocationServices {
  constructor() {
    this.serviceDefinitions = null;
  }

  /**
   * Initialize with service definitions from datapack
   */
  initialize(serviceDefinitions) {
    this.serviceDefinitions = serviceDefinitions;
  }

  /**
   * Get all services available at a location
   */
  getServicesAtLocation(location, playerState) {
    const services = [];
    const tags = location.tags || [];

    // Check for church services
    if (tags.includes('church') || tags.includes('temple')) {
      services.push(...this.getChurchServices(location, playerState));
    }

    // Check for clinic services
    if (tags.includes('clinic') || tags.includes('hospital')) {
      services.push(...this.getClinicServices(location, playerState));
    }

    // Check for nursery services
    if (tags.includes('nursery') || tags.includes('birthing_center')) {
      services.push(...this.getNurseryServices(location, playerState));
    }

    return services;
  }

  /**
   * Get church-specific services
   * Handles: curses, magical hypnosis, magical debuffs
   */
  getChurchServices(location, playerState) {
    const services = [];
    const churchConfig = location.services?.church || this.serviceDefinitions?.church || {};

    // Curse removal
    const curses = playerState.nsfwStats?.curses || [];
    if (curses.length > 0) {
      services.push({
        id: 'remove_curse',
        type: 'church',
        name: 'Remove Curse',
        description: `You have ${curses.length} active curse(s). The church can lift them through prayer and holy rituals.`,
        cost: churchConfig.curseRemovalCost || 100,
        costType: 'gold',
        alternativeCost: churchConfig.charityWorkHours || 4,
        alternativeCostType: 'charity_hours',
        available: true,
        conditions: this._getCursesForRemoval(curses),
        action: 'removeCurse'
      });
    }

    // Magical hypnosis removal
    const mentalState = playerState.nsfwStats?.mentalState || {};
    if (mentalState.hypnosisDepth > 0 && mentalState.hypnosisSource === 'magical') {
      services.push({
        id: 'break_magical_hypnosis',
        type: 'church',
        name: 'Break Magical Enchantment',
        description: 'Your mind is clouded by magical influence. Holy rites can dispel this enchantment.',
        cost: churchConfig.hypnosisRemovalCost || 150,
        costType: 'gold',
        alternativeCost: churchConfig.charityWorkHours || 6,
        alternativeCostType: 'charity_hours',
        available: true,
        severity: mentalState.hypnosisDepth,
        action: 'removeMagicalHypnosis'
      });
    }

    // Corruption purification
    const corruption = playerState.nsfwStats?.corruption || 0;
    if (corruption > 20) {
      services.push({
        id: 'purify_corruption',
        type: 'church',
        name: 'Purification Ritual',
        description: `Your soul is tainted by corruption (${corruption}%). Seek purification through holy ritual.`,
        cost: churchConfig.purificationCostPerPoint || 5,
        costType: 'gold_per_point',
        alternativeCost: churchConfig.charityWorkHoursPerPoint || 0.5,
        alternativeCostType: 'charity_hours_per_point',
        available: true,
        currentValue: corruption,
        maxReduction: churchConfig.maxPurificationPerVisit || 30,
        action: 'purifyCorruption'
      });
    }

    // General debuff removal (magical only)
    const magicalDebuffs = (playerState.nsfwStats?.debuffs || []).filter(d => d.source === 'magical');
    if (magicalDebuffs.length > 0) {
      services.push({
        id: 'remove_magical_debuffs',
        type: 'church',
        name: 'Dispel Dark Magic',
        description: `${magicalDebuffs.length} magical affliction(s) cloud your being.`,
        cost: churchConfig.debuffRemovalCost || 75,
        costType: 'gold',
        alternativeCost: churchConfig.charityWorkHours || 3,
        alternativeCostType: 'charity_hours',
        available: true,
        debuffs: magicalDebuffs,
        action: 'removeMagicalDebuffs'
      });
    }

    // Tithing option (donate for blessings)
    services.push({
      id: 'tithe',
      type: 'church',
      name: 'Make an Offering',
      description: 'Donate to the church in exchange for blessings and divine favor.',
      costType: 'variable',
      tiers: [
        { amount: 10, blessing: 'minor_blessing', duration: 3600000 },
        { amount: 50, blessing: 'blessing', duration: 7200000 },
        { amount: 200, blessing: 'greater_blessing', duration: 14400000 }
      ],
      available: true,
      action: 'makeTithe'
    });

    // Volunteer work option
    services.push({
      id: 'volunteer',
      type: 'church',
      name: 'Volunteer Service',
      description: 'Work for the church to earn credit toward services. Each hour of work earns charity credit.',
      costType: 'time',
      hoursAvailable: [1, 2, 4, 8],
      creditPerHour: churchConfig.creditPerHour || 25,
      available: true,
      action: 'volunteerWork'
    });

    return services;
  }

  /**
   * Get clinic-specific services
   * Handles: STDs, addictions, technological hypnosis, abortions
   */
  getClinicServices(location, playerState) {
    const services = [];
    const clinicConfig = location.services?.clinic || this.serviceDefinitions?.clinic || {};

    // STD treatment
    const stds = playerState.nsfwStats?.stds || {};
    const activeStds = Object.entries(stds).filter(([id, data]) => data.treatable !== false);
    if (activeStds.length > 0) {
      services.push({
        id: 'treat_stds',
        type: 'clinic',
        name: 'Disease Treatment',
        description: `You have ${activeStds.length} treatable infection(s). Medical treatment is available.`,
        cost: clinicConfig.stdTreatmentCost || 200,
        costType: 'gold',
        available: true,
        conditions: activeStds.map(([id, data]) => ({ id, ...data })),
        action: 'treatStds'
      });
    }

    // Addiction treatment
    const substanceAddictions = playerState.substanceState?.addictions || {};
    const activeAddictions = Object.entries(substanceAddictions).filter(
      ([id, data]) => data.level >= 20
    );
    if (activeAddictions.length > 0) {
      services.push({
        id: 'addiction_treatment',
        type: 'clinic',
        name: 'Addiction Rehabilitation',
        description: `You have ${activeAddictions.length} substance addiction(s). Medical detox program available.`,
        cost: clinicConfig.addictionTreatmentCost || 500,
        costType: 'gold',
        treatmentDuration: clinicConfig.addictionTreatmentHours || 24,
        available: true,
        addictions: activeAddictions.map(([id, data]) => ({ id, ...data })),
        action: 'treatAddiction'
      });
    }

    // Behavioral addiction treatment
    const behavioralAddictions = playerState.nsfwStats?.behavioralAddictions || {};
    const activeBehavioral = Object.entries(behavioralAddictions).filter(
      ([id, data]) => data.level >= 30
    );
    if (activeBehavioral.length > 0) {
      services.push({
        id: 'behavioral_therapy',
        type: 'clinic',
        name: 'Behavioral Therapy',
        description: `${activeBehavioral.length} behavioral pattern(s) require professional intervention.`,
        cost: clinicConfig.behavioralTherapyCost || 300,
        costType: 'gold',
        sessionsRequired: clinicConfig.therapySessions || 3,
        available: true,
        behaviors: activeBehavioral.map(([id, data]) => ({ id, ...data })),
        action: 'behavioralTherapy'
      });
    }

    // Technological hypnosis removal (visor, implants, etc.)
    const mentalState = playerState.nsfwStats?.mentalState || {};
    if (mentalState.hypnosisDepth > 0 && mentalState.hypnosisSource === 'technological') {
      services.push({
        id: 'remove_tech_hypnosis',
        type: 'clinic',
        name: 'Neural Deprogramming',
        description: 'Your mind has been conditioned by technological means. Medical intervention can reverse this.',
        cost: clinicConfig.neuralDeprogrammingCost || 400,
        costType: 'gold',
        available: true,
        device: mentalState.hypnosisDevice,
        severity: mentalState.hypnosisDepth,
        action: 'removeTechHypnosis'
      });
    }

    // Conditioning removal
    const conditioning = mentalState.conditioning || [];
    if (conditioning.length > 0) {
      services.push({
        id: 'remove_conditioning',
        type: 'clinic',
        name: 'Cognitive Reconditioning',
        description: `You have ${conditioning.length} conditioned response(s) implanted. Therapy can help remove them.`,
        cost: clinicConfig.conditioningRemovalCost || 250,
        costType: 'gold_per_condition',
        available: true,
        conditions: conditioning,
        action: 'removeConditioning'
      });
    }

    // Abortion for male pregnancy
    const pregnancy = playerState.nsfwStats?.pregnancy || {};
    if (pregnancy.isPregnant && pregnancy.type !== 'eggs') {
      // Only for non-egg pregnancies that haven't reached late stage
      if (pregnancy.trimester < 3) {
        services.push({
          id: 'terminate_pregnancy',
          type: 'clinic',
          name: 'Pregnancy Termination',
          description: 'Medical procedure to safely terminate the pregnancy.',
          cost: clinicConfig.terminationCost || 350,
          costType: 'gold',
          available: true,
          trimester: pregnancy.trimester,
          recoveryTime: clinicConfig.terminationRecoveryHours || 8,
          action: 'terminatePregnancy'
        });
      }
    }

    // General medical checkup
    services.push({
      id: 'medical_checkup',
      type: 'clinic',
      name: 'Medical Examination',
      description: 'A thorough medical examination to identify any health issues.',
      cost: clinicConfig.checkupCost || 50,
      costType: 'gold',
      available: true,
      action: 'medicalCheckup'
    });

    // Healing
    if (playerState.currentHp < playerState.maxHp) {
      services.push({
        id: 'medical_healing',
        type: 'clinic',
        name: 'Medical Treatment',
        description: `Heal your wounds (${playerState.currentHp}/${playerState.maxHp} HP).`,
        cost: clinicConfig.healingCostPerHp || 2,
        costType: 'gold_per_hp',
        available: true,
        currentHp: playerState.currentHp,
        maxHp: playerState.maxHp,
        action: 'medicalHealing'
      });
    }

    return services;
  }

  /**
   * Get nursery-specific services
   * Handles: egg laying, giving birth
   */
  getNurseryServices(location, playerState) {
    const services = [];
    const nurseryConfig = location.services?.nursery || this.serviceDefinitions?.nursery || {};
    const pregnancy = playerState.nsfwStats?.pregnancy || {};

    // Egg laying
    if (pregnancy.isPregnant && pregnancy.type === 'eggs' && pregnancy.eggCount > 0) {
      services.push({
        id: 'lay_eggs',
        type: 'nursery',
        name: 'Egg Laying Assistance',
        description: `You have ${pregnancy.eggCount} egg(s) ready to be laid. The nursery can assist with safe delivery.`,
        cost: nurseryConfig.eggLayingCost || 100,
        costType: 'gold',
        available: true,
        eggCount: pregnancy.eggCount,
        complications: pregnancy.complications,
        action: 'layEggs'
      });
    }

    // Give birth
    if (pregnancy.isPregnant && pregnancy.type !== 'eggs' && pregnancy.trimester >= 3) {
      services.push({
        id: 'give_birth',
        type: 'nursery',
        name: 'Assisted Birth',
        description: `You are ready to give birth to ${pregnancy.fetusCount} child(ren). Professional midwives can assist.`,
        cost: nurseryConfig.birthCost || 200,
        costType: 'gold',
        available: true,
        fetusCount: pregnancy.fetusCount,
        type: pregnancy.type,
        fatherType: pregnancy.fatherType,
        complications: pregnancy.complications,
        action: 'giveBirth'
      });
    }

    // Pregnancy checkup
    if (pregnancy.isPregnant) {
      services.push({
        id: 'pregnancy_checkup',
        type: 'nursery',
        name: 'Pregnancy Checkup',
        description: 'Monitor the health of your pregnancy and check for complications.',
        cost: nurseryConfig.checkupCost || 30,
        costType: 'gold',
        available: true,
        currentPregnancy: pregnancy,
        action: 'pregnancyCheckup'
      });
    }

    // Post-birth care
    const recentBirth = this._hasRecentBirth(playerState);
    if (recentBirth) {
      services.push({
        id: 'postpartum_care',
        type: 'nursery',
        name: 'Postpartum Recovery',
        description: 'Rest and recover after giving birth with professional care.',
        cost: nurseryConfig.postpartumCareCost || 150,
        costType: 'gold',
        recoveryBonus: nurseryConfig.recoveryBonus || 2.0,
        available: true,
        action: 'postpartumCare'
      });
    }

    // Fertility consultation
    services.push({
      id: 'fertility_consultation',
      type: 'nursery',
      name: 'Fertility Consultation',
      description: 'Learn about your fertility status and options.',
      cost: nurseryConfig.consultationCost || 25,
      costType: 'gold',
      available: true,
      action: 'fertilityConsultation'
    });

    return services;
  }

  /**
   * Process a service request
   */
  processService(serviceId, playerState, options = {}) {
    const result = {
      success: false,
      message: '',
      effects: [],
      stateChanges: {}
    };

    switch (serviceId) {
      // Church services
      case 'remove_curse':
        return this._processRemoveCurse(playerState, options);
      case 'break_magical_hypnosis':
        return this._processRemoveMagicalHypnosis(playerState, options);
      case 'purify_corruption':
        return this._processPurifyCorruption(playerState, options);
      case 'remove_magical_debuffs':
        return this._processRemoveMagicalDebuffs(playerState, options);
      case 'tithe':
        return this._processTithe(playerState, options);
      case 'volunteer':
        return this._processVolunteerWork(playerState, options);

      // Clinic services
      case 'treat_stds':
        return this._processTreatStds(playerState, options);
      case 'addiction_treatment':
        return this._processTreatAddiction(playerState, options);
      case 'behavioral_therapy':
        return this._processBehavioralTherapy(playerState, options);
      case 'remove_tech_hypnosis':
        return this._processRemoveTechHypnosis(playerState, options);
      case 'remove_conditioning':
        return this._processRemoveConditioning(playerState, options);
      case 'terminate_pregnancy':
        return this._processTerminatePregnancy(playerState, options);
      case 'medical_checkup':
        return this._processMedicalCheckup(playerState, options);
      case 'medical_healing':
        return this._processMedicalHealing(playerState, options);

      // Nursery services
      case 'lay_eggs':
        return this._processLayEggs(playerState, options);
      case 'give_birth':
        return this._processGiveBirth(playerState, options);
      case 'pregnancy_checkup':
        return this._processPregnancyCheckup(playerState, options);
      case 'postpartum_care':
        return this._processPostpartumCare(playerState, options);
      case 'fertility_consultation':
        return this._processFertilityConsultation(playerState, options);

      default:
        result.message = 'Unknown service.';
        return result;
    }
  }

  // ============================================================================
  // CHURCH SERVICE PROCESSORS
  // ============================================================================

  _processRemoveCurse(playerState, options) {
    const result = { success: true, message: '', effects: [], stateChanges: {} };
    const curseId = options.curseId;

    if (curseId) {
      // Remove specific curse
      result.stateChanges['nsfwStats.curses'] = (playerState.nsfwStats?.curses || [])
        .filter(c => c.id !== curseId);
      result.message = 'The curse has been lifted through holy prayer.';
      result.effects.push({ type: 'curse_removed', curseId });
    } else {
      // Remove all curses
      const curseCount = (playerState.nsfwStats?.curses || []).length;
      result.stateChanges['nsfwStats.curses'] = [];
      result.message = `${curseCount} curse(s) have been purged from your soul.`;
      result.effects.push({ type: 'all_curses_removed', count: curseCount });
    }

    result.stateChanges['statistics.cursesRemoved'] =
      (playerState.statistics?.cursesRemoved || 0) + 1;

    return result;
  }

  _processRemoveMagicalHypnosis(playerState, options) {
    const result = { success: true, message: '', effects: [], stateChanges: {} };

    result.stateChanges['nsfwStats.mentalState.hypnosisDepth'] = 0;
    result.stateChanges['nsfwStats.mentalState.hypnosisSource'] = null;
    result.stateChanges['nsfwStats.mentalState.suggestionVulnerability'] =
      Math.max(0, (playerState.nsfwStats?.mentalState?.suggestionVulnerability || 0) - 20);

    result.message = 'The holy light dispels the magical enchantment clouding your mind.';
    result.effects.push({ type: 'magical_hypnosis_removed' });

    return result;
  }

  _processPurifyCorruption(playerState, options) {
    const result = { success: true, message: '', effects: [], stateChanges: {} };
    const amount = options.amount || 10;
    const currentCorruption = playerState.nsfwStats?.corruption || 0;
    const newCorruption = Math.max(0, currentCorruption - amount);

    result.stateChanges['nsfwStats.corruption'] = newCorruption;
    result.stateChanges['nsfwStats.purity'] = Math.min(100, (playerState.nsfwStats?.purity || 0) + (amount / 2));

    result.message = `Corruption reduced by ${currentCorruption - newCorruption}%. Your soul feels lighter.`;
    result.effects.push({ type: 'corruption_reduced', amount: currentCorruption - newCorruption });

    return result;
  }

  _processRemoveMagicalDebuffs(playerState, options) {
    const result = { success: true, message: '', effects: [], stateChanges: {} };

    const debuffs = playerState.nsfwStats?.debuffs || [];
    const remaining = debuffs.filter(d => d.source !== 'magical');
    const removed = debuffs.filter(d => d.source === 'magical');

    result.stateChanges['nsfwStats.debuffs'] = remaining;
    result.message = `${removed.length} magical affliction(s) have been dispelled.`;
    result.effects.push({ type: 'magical_debuffs_removed', count: removed.length, debuffs: removed });

    return result;
  }

  _processTithe(playerState, options) {
    const result = { success: true, message: '', effects: [], stateChanges: {} };
    const tier = options.tier;

    result.stateChanges.gold = playerState.gold - tier.amount;
    result.effects.push({
      type: 'blessing_received',
      blessing: tier.blessing,
      duration: tier.duration
    });
    result.message = `You receive the ${tier.blessing.replace('_', ' ')}. May it guide you.`;

    return result;
  }

  _processVolunteerWork(playerState, options) {
    const result = { success: true, message: '', effects: [], stateChanges: {} };
    const hours = options.hours || 1;
    const creditPerHour = options.creditPerHour || 25;
    const earnedCredit = hours * creditPerHour;

    // Store charity credit for future use
    result.stateChanges['charityCredit'] = (playerState.charityCredit || 0) + earnedCredit;
    result.effects.push({
      type: 'time_passed',
      hours,
      activity: 'charity_work'
    });
    result.effects.push({
      type: 'charity_credit_earned',
      amount: earnedCredit
    });
    result.message = `You spend ${hours} hour(s) helping the church. Earned ${earnedCredit} charity credit.`;

    return result;
  }

  // ============================================================================
  // CLINIC SERVICE PROCESSORS
  // ============================================================================

  _processTreatStds(playerState, options) {
    const result = { success: true, message: '', effects: [], stateChanges: {} };
    const stdId = options.stdId;

    if (stdId) {
      // Treat specific STD
      const stds = { ...playerState.nsfwStats?.stds };
      delete stds[stdId];
      result.stateChanges['nsfwStats.stds'] = stds;
      result.message = `Treatment successful. The infection has been cured.`;
      result.effects.push({ type: 'std_cured', stdId });
    } else {
      // Treat all STDs
      const stdCount = Object.keys(playerState.nsfwStats?.stds || {}).length;
      result.stateChanges['nsfwStats.stds'] = {};
      result.message = `All ${stdCount} infection(s) have been treated successfully.`;
      result.effects.push({ type: 'all_stds_cured', count: stdCount });
    }

    return result;
  }

  _processTreatAddiction(playerState, options) {
    const result = { success: true, message: '', effects: [], stateChanges: {} };
    const addictionId = options.addictionId;

    if (addictionId) {
      // Treat specific addiction
      const addictions = { ...playerState.substanceState?.addictions };
      if (addictions[addictionId]) {
        addictions[addictionId] = {
          ...addictions[addictionId],
          level: Math.max(0, addictions[addictionId].level - 50),
          withdrawalActive: false
        };
        if (addictions[addictionId].level < 10) {
          delete addictions[addictionId];
        }
      }
      result.stateChanges['substanceState.addictions'] = addictions;
      result.message = 'Detox treatment complete. Your cravings have diminished significantly.';
      result.effects.push({ type: 'addiction_treated', addictionId });
    } else {
      // Reduce all addictions
      const addictions = { ...playerState.substanceState?.addictions };
      let treated = 0;
      for (const id of Object.keys(addictions)) {
        addictions[id] = {
          ...addictions[id],
          level: Math.max(0, addictions[id].level - 30),
          withdrawalActive: false
        };
        treated++;
      }
      result.stateChanges['substanceState.addictions'] = addictions;
      result.message = `${treated} addiction(s) have been treated.`;
      result.effects.push({ type: 'addictions_treated', count: treated });
    }

    result.effects.push({ type: 'time_passed', hours: options.treatmentDuration || 24 });
    return result;
  }

  _processBehavioralTherapy(playerState, options) {
    const result = { success: true, message: '', effects: [], stateChanges: {} };
    const behaviorId = options.behaviorId;

    const behaviors = { ...playerState.nsfwStats?.behavioralAddictions };

    if (behaviorId && behaviors[behaviorId]) {
      behaviors[behaviorId] = {
        ...behaviors[behaviorId],
        level: Math.max(0, behaviors[behaviorId].level - 25)
      };
      result.message = `Therapy session complete. Your ${behaviorId.replace(/([A-Z])/g, ' $1').trim()} urges are more manageable.`;
    } else {
      // Reduce all behavioral addictions
      for (const id of Object.keys(behaviors)) {
        behaviors[id] = {
          ...behaviors[id],
          level: Math.max(0, behaviors[id].level - 15)
        };
      }
      result.message = 'Group therapy session complete. You feel more in control.';
    }

    result.stateChanges['nsfwStats.behavioralAddictions'] = behaviors;
    result.effects.push({ type: 'behavioral_therapy_complete' });

    return result;
  }

  _processRemoveTechHypnosis(playerState, options) {
    const result = { success: true, message: '', effects: [], stateChanges: {} };

    result.stateChanges['nsfwStats.mentalState.hypnosisDepth'] = 0;
    result.stateChanges['nsfwStats.mentalState.hypnosisSource'] = null;
    result.stateChanges['nsfwStats.mentalState.hypnosisDevice'] = null;
    result.stateChanges['nsfwStats.mentalState.brainwashingProgress'] =
      Math.max(0, (playerState.nsfwStats?.mentalState?.brainwashingProgress || 0) - 30);

    result.message = 'Neural deprogramming successful. The technological conditioning has been reversed.';
    result.effects.push({ type: 'tech_hypnosis_removed', device: options.device });

    return result;
  }

  _processRemoveConditioning(playerState, options) {
    const result = { success: true, message: '', effects: [], stateChanges: {} };
    const conditionIndex = options.conditionIndex;

    const conditioning = [...(playerState.nsfwStats?.mentalState?.conditioning || [])];

    if (conditionIndex !== undefined && conditioning[conditionIndex]) {
      const removed = conditioning.splice(conditionIndex, 1)[0];
      result.message = `Conditioned response to "${removed.trigger}" has been eliminated.`;
      result.effects.push({ type: 'conditioning_removed', trigger: removed.trigger });
    } else {
      const count = conditioning.length;
      result.stateChanges['nsfwStats.mentalState.conditioning'] = [];
      result.message = `All ${count} conditioned responses have been removed.`;
      result.effects.push({ type: 'all_conditioning_removed', count });
      return result;
    }

    result.stateChanges['nsfwStats.mentalState.conditioning'] = conditioning;
    return result;
  }

  _processTerminatePregnancy(playerState, options) {
    const result = { success: true, message: '', effects: [], stateChanges: {} };

    const pregnancy = playerState.nsfwStats?.pregnancy || {};
    const history = [...(pregnancy.history || [])];

    history.push({
      type: pregnancy.type,
      fatherType: pregnancy.fatherType,
      outcome: 'terminated',
      date: Date.now()
    });

    result.stateChanges['nsfwStats.pregnancy'] = {
      isPregnant: false,
      type: null,
      fatherType: null,
      fatherId: null,
      conceptionDate: null,
      dueDate: null,
      trimester: 0,
      fetusCount: 1,
      eggCount: 0,
      complications: [],
      visible: false,
      history
    };

    result.message = 'The procedure was completed successfully. Take time to recover.';
    result.effects.push({ type: 'pregnancy_terminated' });
    result.effects.push({ type: 'time_passed', hours: options.recoveryTime || 8 });

    return result;
  }

  _processMedicalCheckup(playerState, options) {
    const result = { success: true, message: '', effects: [], stateChanges: {} };

    const issues = [];

    // Check for hidden STDs
    const stds = playerState.nsfwStats?.stds || {};
    if (Object.keys(stds).length > 0) {
      issues.push(`${Object.keys(stds).length} infection(s) detected`);
    }

    // Check for hidden conditions
    if (playerState.nsfwStats?.pregnancy?.isPregnant && !playerState.nsfwStats?.pregnancy?.visible) {
      issues.push('Early pregnancy detected');
    }

    // Check corruption
    if ((playerState.nsfwStats?.corruption || 0) > 50) {
      issues.push('High corruption levels detected');
    }

    // Check addictions
    const addictionCount = Object.keys(playerState.substanceState?.addictions || {}).length;
    if (addictionCount > 0) {
      issues.push(`${addictionCount} substance addiction(s) detected`);
    }

    if (issues.length === 0) {
      result.message = 'Clean bill of health! No issues detected.';
    } else {
      result.message = `Medical examination complete. Issues found: ${issues.join(', ')}.`;
    }

    result.effects.push({ type: 'medical_checkup_complete', issues });
    return result;
  }

  _processMedicalHealing(playerState, options) {
    const result = { success: true, message: '', effects: [], stateChanges: {} };
    const healAmount = options.amount || (playerState.maxHp - playerState.currentHp);

    const newHp = Math.min(playerState.maxHp, playerState.currentHp + healAmount);
    const actualHealed = newHp - playerState.currentHp;

    result.stateChanges.currentHp = newHp;
    result.message = `Healed ${actualHealed} HP. You feel much better.`;
    result.effects.push({ type: 'healed', amount: actualHealed });

    return result;
  }

  // ============================================================================
  // NURSERY SERVICE PROCESSORS
  // ============================================================================

  _processLayEggs(playerState, options) {
    const result = { success: true, message: '', effects: [], stateChanges: {} };

    const pregnancy = playerState.nsfwStats?.pregnancy || {};
    const eggCount = pregnancy.eggCount || 0;
    const history = [...(pregnancy.history || [])];

    history.push({
      type: 'eggs',
      fatherType: pregnancy.fatherType,
      outcome: 'laid',
      count: eggCount,
      date: Date.now()
    });

    result.stateChanges['nsfwStats.pregnancy'] = {
      isPregnant: false,
      type: null,
      fatherType: null,
      fatherId: null,
      conceptionDate: null,
      dueDate: null,
      trimester: 0,
      fetusCount: 1,
      eggCount: 0,
      complications: [],
      visible: false,
      history
    };

    result.message = `Successfully laid ${eggCount} egg(s). The nursery will care for them.`;
    result.effects.push({ type: 'eggs_laid', count: eggCount });
    result.effects.push({ type: 'time_passed', hours: 2 });

    return result;
  }

  _processGiveBirth(playerState, options) {
    const result = { success: true, message: '', effects: [], stateChanges: {} };

    const pregnancy = playerState.nsfwStats?.pregnancy || {};
    const fetusCount = pregnancy.fetusCount || 1;
    const history = [...(pregnancy.history || [])];

    history.push({
      type: pregnancy.type,
      fatherType: pregnancy.fatherType,
      outcome: 'birth',
      count: fetusCount,
      date: Date.now()
    });

    result.stateChanges['nsfwStats.pregnancy'] = {
      isPregnant: false,
      type: null,
      fatherType: null,
      fatherId: null,
      conceptionDate: null,
      dueDate: null,
      trimester: 0,
      fetusCount: 1,
      eggCount: 0,
      complications: [],
      visible: false,
      history
    };

    // Mark as recent birth for postpartum care eligibility
    result.stateChanges['nsfwStats.recentBirthDate'] = Date.now();

    const childType = pregnancy.fatherType || 'unknown';
    result.message = `Successfully gave birth to ${fetusCount} ${childType} child${fetusCount > 1 ? 'ren' : ''}. The nursery will provide care.`;
    result.effects.push({ type: 'gave_birth', count: fetusCount, childType });
    result.effects.push({ type: 'time_passed', hours: 6 });

    return result;
  }

  _processPregnancyCheckup(playerState, options) {
    const result = { success: true, message: '', effects: [], stateChanges: {} };

    const pregnancy = playerState.nsfwStats?.pregnancy || {};
    const info = [];

    info.push(`Type: ${pregnancy.type || 'normal'}`);
    info.push(`Trimester: ${pregnancy.trimester}`);
    info.push(`Count: ${pregnancy.type === 'eggs' ? pregnancy.eggCount + ' eggs' : pregnancy.fetusCount + ' fetus(es)'}`);

    if (pregnancy.complications?.length > 0) {
      info.push(`Complications: ${pregnancy.complications.join(', ')}`);
    } else {
      info.push('No complications detected');
    }

    if (pregnancy.fatherType) {
      info.push(`Father type: ${pregnancy.fatherType}`);
    }

    result.message = `Pregnancy checkup complete.\n${info.join('\n')}`;
    result.effects.push({ type: 'pregnancy_checkup_complete', pregnancy });

    return result;
  }

  _processPostpartumCare(playerState, options) {
    const result = { success: true, message: '', effects: [], stateChanges: {} };

    // Clear recent birth flag
    result.stateChanges['nsfwStats.recentBirthDate'] = null;

    // Heal and recover
    result.stateChanges.currentHp = playerState.maxHp;
    result.stateChanges.currentStamina = playerState.maxStamina;

    result.message = 'Postpartum recovery complete. You feel fully restored.';
    result.effects.push({ type: 'postpartum_care_complete' });
    result.effects.push({ type: 'time_passed', hours: 24 });

    return result;
  }

  _processFertilityConsultation(playerState, options) {
    const result = { success: true, message: '', effects: [], stateChanges: {} };

    const pregnancy = playerState.nsfwStats?.pregnancy || {};
    const fertility = playerState.nsfwStats?.orificeStats?.vagina?.fertility ?? 100;
    const pregnancyCount = pregnancy.history?.length || 0;

    const info = [
      `Current fertility: ${fertility}%`,
      `Previous pregnancies: ${pregnancyCount}`,
      `Currently pregnant: ${pregnancy.isPregnant ? 'Yes' : 'No'}`
    ];

    result.message = `Fertility consultation complete.\n${info.join('\n')}`;
    result.effects.push({ type: 'fertility_consultation_complete', fertility, pregnancyCount });

    return result;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  _getCursesForRemoval(curses) {
    return curses.map(c => ({
      id: c.id,
      name: c.name || c.id,
      description: c.description || 'A dark curse'
    }));
  }

  _hasRecentBirth(playerState) {
    const recentBirthDate = playerState.nsfwStats?.recentBirthDate;
    if (!recentBirthDate) return false;

    // Within last 48 hours of game time
    const hoursSinceBirth = (Date.now() - recentBirthDate) / (1000 * 60 * 60);
    return hoursSinceBirth < 48;
  }

  /**
   * Calculate service cost based on payment method
   */
  calculateCost(service, playerState, paymentMethod = 'gold') {
    if (paymentMethod === 'charity' && service.alternativeCost) {
      const charityCredit = playerState.charityCredit || 0;
      const needed = service.alternativeCost * (service.alternativeCostType?.includes('per') ? 10 : 1);
      return {
        type: 'charity',
        cost: needed,
        canAfford: charityCredit >= needed,
        current: charityCredit
      };
    }

    // Gold payment
    let goldCost = service.cost || 0;

    if (service.costType === 'gold_per_point') {
      goldCost *= Math.min(service.currentValue || 10, service.maxReduction || 30);
    } else if (service.costType === 'gold_per_hp') {
      goldCost *= (playerState.maxHp - playerState.currentHp);
    } else if (service.costType === 'gold_per_condition') {
      goldCost *= (service.conditions?.length || 1);
    }

    return {
      type: 'gold',
      cost: goldCost,
      canAfford: playerState.gold >= goldCost,
      current: playerState.gold
    };
  }
}

export default LocationServices;
