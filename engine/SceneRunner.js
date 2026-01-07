/**
 * SceneRunner - State machine for scenes, dialogues, and branching narratives
 * 
 * Handles:
 * - Linear and branching dialogue
 * - Conditions for showing/hiding choices
 * - Variable interpolation in text
 * - Scene transitions
 * - Event triggers
 * - Tag-based content filtering
 */

// Node types in a scene
export const NODE_TYPES = {
  DIALOGUE: 'dialogue',
  CHOICE: 'choice',
  BRANCH: 'branch',
  ACTION: 'action',
  SCENE_CHANGE: 'sceneChange',
  COMBAT: 'combat',
  ITEM_GET: 'itemGet',
  STAT_CHECK: 'statCheck',
  RANDOM: 'random',
  SET_FLAG: 'setFlag',
  TRIGGER_EVENT: 'triggerEvent',
  END: 'end',
  // Input node types
  TEXT_INPUT: 'textInput',
  DROPDOWN: 'dropdown',
  NUMBER_INPUT: 'numberInput'
};

// Input types for choice nodes
export const INPUT_TYPES = {
  BUTTON: 'button',         // Default - standard clickable choice
  TEXT_INPUT: 'textInput',  // Text input field
  NUMBER_INPUT: 'numberInput', // Number input with validation
  DROPDOWN: 'dropdown'      // Dropdown selection
};

/**
 * Interpolate variables in text
 * Supports: {player.name}, {npc.name}, {flag.questStarted}, etc.
 */
function interpolateText(text, context) {
  if (!text || typeof text !== 'string') return text;
  
  return text.replace(/\{([^}]+)\}/g, (match, path) => {
    const parts = path.split('.');
    let value = context;
    
    for (const part of parts) {
      if (value === undefined || value === null) return match;
      value = value[part];
    }
    
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Evaluate a condition for scene logic
 */
function evaluateSceneCondition(condition, context) {
  if (!condition) return true;
  
  const { player, gameState, flags, npc, sceneData } = context;
  
  // Array = AND
  if (Array.isArray(condition)) {
    return condition.every(c => evaluateSceneCondition(c, context));
  }
  
  // OR condition
  if (condition.or) {
    return condition.or.some(c => evaluateSceneCondition(c, context));
  }
  
  // NOT condition
  if (condition.not) {
    return !evaluateSceneCondition(condition.not, context);
  }
  
  switch (condition.type) {
    case 'flag':
      const flagValue = flags?.[condition.flag];
      if (condition.operator === 'equals') return flagValue === condition.value;
      if (condition.operator === 'notEquals') return flagValue !== condition.value;
      if (condition.operator === 'gt') return flagValue > condition.value;
      if (condition.operator === 'lt') return flagValue < condition.value;
      if (condition.operator === 'gte') return flagValue >= condition.value;
      if (condition.operator === 'lte') return flagValue <= condition.value;
      return !!flagValue === (condition.value !== false);
      
    case 'stat':
      const statValue = player?.stats?.[condition.stat] || 0;
      if (condition.operator === 'gt') return statValue > condition.value;
      if (condition.operator === 'lt') return statValue < condition.value;
      if (condition.operator === 'gte') return statValue >= condition.value;
      if (condition.operator === 'lte') return statValue <= condition.value;
      return statValue === condition.value;
      
    case 'nsfwStat':
      const nsfwValue = player?.nsfwStats?.[condition.stat] || 0;
      if (condition.operator === 'gt') return nsfwValue > condition.value;
      if (condition.operator === 'lt') return nsfwValue < condition.value;
      if (condition.operator === 'gte') return nsfwValue >= condition.value;
      if (condition.operator === 'lte') return nsfwValue <= condition.value;
      return nsfwValue === condition.value;
      
    case 'hasItem':
      return player?.inventory?.some(i => i.id === condition.itemId);
      
    case 'hasItemCount':
      const itemCount = player?.inventory?.filter(i => i.id === condition.itemId)
        .reduce((sum, i) => sum + (i.count || 1), 0) || 0;
      return itemCount >= (condition.count || 1);
      
    case 'hasGold':
      return (player?.gold || 0) >= condition.amount;
      
    case 'level':
      if (condition.operator === 'gte') return player?.level >= condition.value;
      if (condition.operator === 'lte') return player?.level <= condition.value;
      return player?.level === condition.value;
      
    case 'hasEffect':
      return player?.activeEffects?.some(e => e.id === condition.effectId);
      
    case 'hasTag':
      return player?.tags?.includes(condition.tag);
      
    case 'tagEnabled':
      return gameState?.enabledTags?.includes(condition.tag);
      
    case 'tagDisabled':
      return gameState?.disabledTags?.includes(condition.tag) || 
             !gameState?.enabledTags?.includes(condition.tag);
      
    case 'visitedLocation':
      return player?.visitedLocations?.includes(condition.locationId);
      
    case 'questActive':
      return player?.activeQuests?.some(q => q.id === condition.questId);
      
    case 'questComplete':
      return player?.completedQuests?.includes(condition.questId);
      
    case 'achievementUnlocked':
      return player?.unlockedAchievements?.includes(condition.achievementId);
      
    case 'relationshipLevel':
      const relLevel = gameState?.npcRelationships?.[condition.npcId] || 0;
      if (condition.operator === 'gte') return relLevel >= condition.value;
      if (condition.operator === 'lte') return relLevel <= condition.value;
      return relLevel === condition.value;
      
    case 'corruption':
      const corruption = player?.nsfwStats?.corruption || 0;
      if (condition.operator === 'gte') return corruption >= condition.value;
      if (condition.operator === 'lte') return corruption <= condition.value;
      return corruption === condition.value;
      
    case 'random':
      return Math.random() < (condition.chance || 0.5);
      
    case 'characterId':
      return player?.characterId === condition.characterId;
      
    case 'difficulty':
      return gameState?.difficulty === condition.difficulty;
      
    case 'always':
      return true;
      
    case 'never':
      return false;
      
    default:
      console.warn(`Unknown scene condition type: ${condition.type}`);
      return true;
  }
}

/**
 * Scene Runner class
 */
export class SceneRunner {
  constructor(registry, options = {}) {
    this.registry = registry;
    this.currentScene = null;
    this.currentNodeIndex = 0;
    this.sceneHistory = [];
    this.choiceHistory = [];
    this.localFlags = {};
    this.callbacks = options.callbacks || {};
    
    // Tag filtering
    this.enabledTags = options.enabledTags || [];
    this.disabledTags = options.disabledTags || [];
  }

  /**
   * Start a scene
   */
  async startScene(sceneId, context = {}) {
    const scene = await this.registry.getScene(sceneId);
    if (!scene) {
      console.error(`Scene not found: ${sceneId}`);
      return { success: false, error: 'Scene not found' };
    }
    
    // Check tag requirements
    if (!this.isSceneAllowed(scene)) {
      // Try to find alternative scene
      if (scene.alternativeSceneId) {
        return this.startScene(scene.alternativeSceneId, context);
      }
      return { success: false, error: 'Scene blocked by tag settings' };
    }
    
    // Push to history
    if (this.currentScene) {
      this.sceneHistory.push({
        sceneId: this.currentScene.id,
        nodeIndex: this.currentNodeIndex
      });
    }
    
    this.currentScene = scene;
    this.currentNodeIndex = 0;
    this.localFlags = {};
    
    // Trigger onSceneStart callback
    if (this.callbacks.onSceneStart) {
      await this.callbacks.onSceneStart(scene, context);
    }
    
    // Process entry actions
    if (scene.onEnter) {
      await this.processActions(scene.onEnter, context);
    }
    
    return this.getCurrentState(context);
  }

  /**
   * Check if a scene is allowed based on tag settings
   */
  isSceneAllowed(scene) {
    if (!scene.tags || scene.tags.length === 0) return true;
    
    // Check if any tag is blocked
    for (const tag of scene.tags) {
      if (this.disabledTags.includes(tag)) return false;
    }
    
    // Check if requires enabled tag
    if (scene.requiresAnyTag) {
      return scene.tags.some(tag => this.enabledTags.includes(tag));
    }
    
    return true;
  }

  /**
   * Get current scene state for rendering
   */
  getCurrentState(context = {}) {
    if (!this.currentScene) {
      return { type: 'idle', scene: null };
    }
    
    const nodes = this.currentScene.nodes || [];
    if (this.currentNodeIndex >= nodes.length) {
      return { type: 'end', scene: this.currentScene };
    }
    
    const node = nodes[this.currentNodeIndex];
    const fullContext = this.buildContext(context);
    
    return this.processNode(node, fullContext);
  }

  /**
   * Build full context object
   */
  buildContext(baseContext = {}) {
    return {
      player: baseContext.player,
      gameState: baseContext.gameState,
      flags: {
        ...baseContext.gameState?.worldFlags,
        ...this.localFlags
      },
      npc: baseContext.npc,
      scene: this.currentScene,
      sceneData: this.currentScene?.data,
      enabledTags: this.enabledTags,
      disabledTags: this.disabledTags
    };
  }

  /**
   * Process a scene node
   */
  processNode(node, context) {
    switch (node.type) {
      case NODE_TYPES.DIALOGUE:
        return this.processDialogue(node, context);
        
      case NODE_TYPES.CHOICE:
        return this.processChoice(node, context);
        
      case NODE_TYPES.BRANCH:
        return this.processBranch(node, context);
        
      case NODE_TYPES.ACTION:
        return this.processActionNode(node, context);
        
      case NODE_TYPES.STAT_CHECK:
        return this.processStatCheck(node, context);
        
      case NODE_TYPES.RANDOM:
        return this.processRandom(node, context);
        
      case NODE_TYPES.SCENE_CHANGE:
        return { type: 'sceneChange', nextScene: node.sceneId, transition: node.transition };
        
      case NODE_TYPES.COMBAT:
        return { type: 'combat', enemies: node.enemies, options: node.options };
        
      case NODE_TYPES.ITEM_GET:
        return { type: 'itemGet', items: node.items };
        
      case NODE_TYPES.END:
        return { type: 'end', scene: this.currentScene, outcome: node.outcome };

      case NODE_TYPES.TEXT_INPUT:
        return this.processTextInput(node, context);

      case NODE_TYPES.NUMBER_INPUT:
        return this.processNumberInput(node, context);

      case NODE_TYPES.DROPDOWN:
        return this.processDropdown(node, context);

      default:
        console.warn(`Unknown node type: ${node.type}`);
        return this.advance(context);
    }
  }

  /**
   * Process dialogue node
   */
  processDialogue(node, context) {
    // Check if this dialogue should be shown
    if (node.condition && !evaluateSceneCondition(node.condition, context)) {
      // Skip to next node
      this.currentNodeIndex++;
      return this.getCurrentState(context);
    }
    
    // Handle multiple dialogue variants
    let text = node.text;
    if (node.variants) {
      const validVariant = node.variants.find(v => 
        !v.condition || evaluateSceneCondition(v.condition, context)
      );
      if (validVariant) {
        text = validVariant.text;
      }
    }
    
    return {
      type: 'dialogue',
      text: interpolateText(text, context),
      speaker: node.speaker ? interpolateText(node.speaker, context) : null,
      speakerImage: node.speakerImage,
      emotion: node.emotion,
      effects: node.effects,
      autoAdvance: node.autoAdvance,
      autoAdvanceDelay: node.autoAdvanceDelay
    };
  }

  /**
   * Process choice node
   */
  processChoice(node, context) {
    // Filter choices based on conditions
    const availableChoices = (node.choices || []).filter(choice => {
      // Check visibility condition
      if (choice.showIf && !evaluateSceneCondition(choice.showIf, context)) {
        return false;
      }
      // Check tag requirements
      if (choice.requiresTags) {
        const hasAllTags = choice.requiresTags.every(tag => this.enabledTags.includes(tag));
        if (!hasAllTags) return false;
      }
      return true;
    }).map(choice => {
      const processedChoice = {
        ...choice,
        text: interpolateText(choice.text, context),
        disabled: choice.enableIf ? !evaluateSceneCondition(choice.enableIf, context) : false,
        disabledReason: choice.disabledReason ? interpolateText(choice.disabledReason, context) : null,
        // Default to button if no inputType specified
        inputType: choice.inputType || INPUT_TYPES.BUTTON
      };

      // Process inputConfig if present (for non-button input types)
      if (choice.inputConfig) {
        processedChoice.inputConfig = this.resolveInputConfig(choice.inputConfig, context);
      }

      return processedChoice;
    });

    return {
      type: 'choice',
      prompt: node.prompt ? interpolateText(node.prompt, context) : null,
      choices: availableChoices,
      allowBack: node.allowBack,
      timeLimit: node.timeLimit
    };
  }

  /**
   * Resolve input configuration with dynamic values
   */
  resolveInputConfig(config, context) {
    if (!config) return config;

    const resolved = { ...config };

    // Resolve defaultValue if it contains placeholders
    if (resolved.defaultValue && typeof resolved.defaultValue === 'string') {
      resolved.defaultValue = interpolateText(resolved.defaultValue, context);
    }

    // Resolve validation rules with dynamic formulas
    if (resolved.validation) {
      resolved.validation = this.resolveValidationRules(resolved.validation, context);
    }

    // Resolve costFormula preview if provided
    if (resolved.costFormula) {
      resolved.costFormulaResolved = resolved.costFormula;
    }

    // Resolve dropdown options
    if (resolved.options) {
      resolved.options = resolved.options.filter(opt => {
        if (opt.showIf && !evaluateSceneCondition(opt.showIf, context)) {
          return false;
        }
        return true;
      }).map(opt => ({
        ...opt,
        label: interpolateText(opt.label, context),
        disabled: opt.enableIf ? !evaluateSceneCondition(opt.enableIf, context) : false
      }));
    }

    return resolved;
  }

  /**
   * Resolve validation rules, evaluating any dynamic formulas
   */
  resolveValidationRules(rules, context) {
    if (!rules) return rules;

    const resolved = { ...rules };

    // Evaluate dynamic min/max using safe formula evaluation
    if (rules.dynamicMin !== undefined) {
      resolved.min = this.evaluateFormula(rules.dynamicMin, context);
    }
    if (rules.dynamicMax !== undefined) {
      resolved.max = this.evaluateFormula(rules.dynamicMax, context);
    }
    if (rules.dynamicMinLength !== undefined) {
      resolved.minLength = this.evaluateFormula(rules.dynamicMinLength, context);
    }
    if (rules.dynamicMaxLength !== undefined) {
      resolved.maxLength = this.evaluateFormula(rules.dynamicMaxLength, context);
    }

    return resolved;
  }

  /**
   * Safe formula evaluation for dynamic validation rules
   */
  evaluateFormula(formula, context) {
    if (formula === undefined || formula === null) return undefined;
    if (typeof formula === 'number') return formula;
    if (typeof formula !== 'string') return formula;

    // Simple number string
    if (/^-?\d+(\.\d+)?$/.test(formula)) {
      return parseFloat(formula);
    }

    try {
      const safeContext = {
        player: context.player || {},
        gameState: context.gameState || {},
        flags: context.flags || {},
        Math: Math,
        parseInt: parseInt,
        parseFloat: parseFloat,
        Number: Number,
        String: String,
        Boolean: Boolean
      };

      const contextKeys = Object.keys(safeContext);
      const contextValues = Object.values(safeContext);

      const fn = new Function(...contextKeys, `return ${formula}`);
      return fn(...contextValues);
    } catch (error) {
      console.warn(`SceneRunner: Failed to evaluate formula "${formula}":`, error);
      return undefined;
    }
  }

  /**
   * Process text input node
   */
  processTextInput(node, context) {
    // Check condition
    if (node.condition && !evaluateSceneCondition(node.condition, context)) {
      this.currentNodeIndex++;
      return this.getCurrentState(context);
    }

    const resolved = this.resolveInputConfig({
      validation: node.validation,
      defaultValue: node.defaultValue
    }, context);

    return {
      type: 'textInput',
      prompt: node.prompt ? interpolateText(node.prompt, context) : null,
      variable: node.variable,
      placeholder: node.placeholder ? interpolateText(node.placeholder, context) : null,
      defaultValue: resolved.defaultValue || '',
      validation: resolved.validation || {},
      multiline: node.multiline || false,
      maxLines: node.maxLines,
      goto: node.goto
    };
  }

  /**
   * Process number input node
   */
  processNumberInput(node, context) {
    // Check condition
    if (node.condition && !evaluateSceneCondition(node.condition, context)) {
      this.currentNodeIndex++;
      return this.getCurrentState(context);
    }

    const resolved = this.resolveInputConfig({
      validation: node.validation,
      defaultValue: node.defaultValue,
      costFormula: node.costFormula
    }, context);

    return {
      type: 'numberInput',
      prompt: node.prompt ? interpolateText(node.prompt, context) : null,
      variable: node.variable,
      placeholder: node.placeholder ? interpolateText(node.placeholder, context) : null,
      defaultValue: resolved.defaultValue || 1,
      validation: resolved.validation || {},
      showCost: node.showCost || false,
      costFormula: node.costFormula,
      costLabel: node.costLabel ? interpolateText(node.costLabel, context) : 'Cost: {cost}g',
      showSlider: node.showSlider || false,
      goto: node.goto
    };
  }

  /**
   * Process dropdown node
   */
  processDropdown(node, context) {
    // Check condition
    if (node.condition && !evaluateSceneCondition(node.condition, context)) {
      this.currentNodeIndex++;
      return this.getCurrentState(context);
    }

    // Filter and resolve options
    const options = (node.options || []).filter(opt => {
      if (opt.showIf && !evaluateSceneCondition(opt.showIf, context)) {
        return false;
      }
      return true;
    }).map(opt => ({
      value: opt.value,
      label: interpolateText(opt.label, context),
      disabled: opt.enableIf ? !evaluateSceneCondition(opt.enableIf, context) : false,
      disabledReason: opt.disabledReason ? interpolateText(opt.disabledReason, context) : null,
      cost: opt.cost,
      description: opt.description ? interpolateText(opt.description, context) : null
    }));

    return {
      type: 'dropdown',
      prompt: node.prompt ? interpolateText(node.prompt, context) : null,
      variable: node.variable,
      options,
      defaultValue: node.defaultValue,
      required: node.required !== false,
      goto: node.goto
    };
  }

  /**
   * Process branch node (automatic condition-based branching)
   */
  processBranch(node, context) {
    for (const branch of node.branches || []) {
      if (evaluateSceneCondition(branch.condition, context)) {
        if (branch.goto !== undefined) {
          this.currentNodeIndex = branch.goto;
        } else if (branch.gotoLabel) {
          const labelIndex = this.findLabel(branch.gotoLabel);
          if (labelIndex !== -1) this.currentNodeIndex = labelIndex;
        }
        return this.getCurrentState(context);
      }
    }
    
    // Default branch
    if (node.default) {
      if (node.default.goto !== undefined) {
        this.currentNodeIndex = node.default.goto;
      } else if (node.default.gotoLabel) {
        const labelIndex = this.findLabel(node.default.gotoLabel);
        if (labelIndex !== -1) this.currentNodeIndex = labelIndex;
      }
    } else {
      this.currentNodeIndex++;
    }
    
    return this.getCurrentState(context);
  }

  /**
   * Process action node
   */
  async processActionNode(node, context) {
    await this.processActions(node.actions, context);
    this.currentNodeIndex++;
    return this.getCurrentState(context);
  }

  /**
   * Process stat check node
   */
  processStatCheck(node, context) {
    const statValue = context.player?.stats?.[node.stat] || 0;
    const success = statValue >= node.difficulty;
    
    // Determine next node
    if (success && node.onSuccess) {
      if (node.onSuccess.goto !== undefined) {
        this.currentNodeIndex = node.onSuccess.goto;
      }
    } else if (!success && node.onFailure) {
      if (node.onFailure.goto !== undefined) {
        this.currentNodeIndex = node.onFailure.goto;
      }
    } else {
      this.currentNodeIndex++;
    }
    
    return {
      type: 'statCheck',
      stat: node.stat,
      difficulty: node.difficulty,
      roll: statValue,
      success,
      // Continue to next state
      next: this.getCurrentState(context)
    };
  }

  /**
   * Process random node
   */
  processRandom(node, context) {
    const roll = Math.random();
    let cumulative = 0;
    
    for (const outcome of node.outcomes || []) {
      cumulative += outcome.weight || (1 / node.outcomes.length);
      if (roll < cumulative) {
        if (outcome.goto !== undefined) {
          this.currentNodeIndex = outcome.goto;
        } else if (outcome.gotoLabel) {
          const labelIndex = this.findLabel(outcome.gotoLabel);
          if (labelIndex !== -1) this.currentNodeIndex = labelIndex;
        }
        return this.getCurrentState(context);
      }
    }
    
    this.currentNodeIndex++;
    return this.getCurrentState(context);
  }

  /**
   * Find label index in current scene
   */
  findLabel(label) {
    if (!this.currentScene?.nodes) return -1;
    return this.currentScene.nodes.findIndex(n => n.label === label);
  }

  /**
   * Process an array of actions
   */
  async processActions(actions, context) {
    if (!actions) return [];
    const results = [];
    
    for (const action of actions) {
      const result = await this.processAction(action, context);
      if (result) results.push(result);
    }
    
    return results;
  }

  /**
   * Process a single action
   */
  async processAction(action, context) {
    switch (action.type) {
      case 'setFlag':
        if (action.scope === 'local') {
          this.localFlags[action.flag] = action.value;
        } else if (this.callbacks.setFlag) {
          await this.callbacks.setFlag(action.flag, action.value);
        }
        break;
        
      case 'modifyRelationship':
        if (this.callbacks.modifyRelationship) {
          await this.callbacks.modifyRelationship(action.npcId, action.amount);
        }
        break;
        
      case 'giveItem':
        if (this.callbacks.giveItem) {
          await this.callbacks.giveItem(action.itemId, action.count || 1);
        }
        break;
        
      case 'removeItem':
        if (this.callbacks.removeItem) {
          await this.callbacks.removeItem(action.itemId, action.count || 1);
        }
        break;
        
      case 'giveGold':
        if (this.callbacks.giveGold) {
          await this.callbacks.giveGold(action.amount);
        }
        break;
        
      case 'modifyCorruption':
        if (this.callbacks.modifyCorruption) {
          await this.callbacks.modifyCorruption(action.amount);
        }
        break;
        
      case 'modifyPurity':
        if (this.callbacks.modifyPurity) {
          await this.callbacks.modifyPurity(action.amount);
        }
        break;
        
      case 'applyEffect':
        if (this.callbacks.applyEffect) {
          await this.callbacks.applyEffect(action.effectId, action.options);
        }
        break;
        
      case 'removeEffect':
        if (this.callbacks.removeEffect) {
          await this.callbacks.removeEffect(action.effectId);
        }
        break;
        
      case 'startQuest':
        if (this.callbacks.startQuest) {
          await this.callbacks.startQuest(action.questId);
        }
        break;
        
      case 'completeQuest':
        if (this.callbacks.completeQuest) {
          await this.callbacks.completeQuest(action.questId);
        }
        break;
        
      case 'unlockAchievement':
        if (this.callbacks.unlockAchievement) {
          await this.callbacks.unlockAchievement(action.achievementId);
        }
        break;
        
      case 'showToast':
        if (this.callbacks.showToast) {
          await this.callbacks.showToast(action.toastType, action.title, action.message);
        }
        break;
        
      case 'playSound':
        if (this.callbacks.playSound) {
          await this.callbacks.playSound(action.soundId);
        }
        break;
        
      case 'playMusic':
        if (this.callbacks.playMusic) {
          await this.callbacks.playMusic(action.trackId, action.options);
        }
        break;
        
      case 'teleport':
        if (this.callbacks.teleport) {
          await this.callbacks.teleport(action.locationId);
        }
        break;
        
      case 'heal':
        if (this.callbacks.heal) {
          await this.callbacks.heal(action.amount);
        }
        break;
        
      case 'damage':
        if (this.callbacks.damage) {
          await this.callbacks.damage(action.amount, action.damageType);
        }
        break;
        
      case 'wait':
        await new Promise(resolve => setTimeout(resolve, action.duration || 1000));
        break;
        
      case 'custom':
        if (this.callbacks.customAction) {
          await this.callbacks.customAction(action.handler, action.data);
        }
        break;

      // Lodging actions
      case 'rentRoom':
        if (this.callbacks.rentRoom) {
          // Resolve days if it's a variable reference
          let days = action.days;
          if (typeof days === 'string' && days.startsWith('{') && days.endsWith('}')) {
            const varName = days.slice(1, -1);
            days = this.localFlags[varName] || context.flags?.[varName] || 1;
          }
          await this.callbacks.rentRoom(action.roomId, days);
        }
        break;

      case 'extendStay':
        if (this.callbacks.extendStay) {
          let days = action.days;
          if (typeof days === 'string' && days.startsWith('{') && days.endsWith('}')) {
            const varName = days.slice(1, -1);
            days = this.localFlags[varName] || context.flags?.[varName] || 1;
          }
          await this.callbacks.extendStay(action.roomId, days);
        }
        break;

      case 'rentProperty':
        if (this.callbacks.rentProperty) {
          await this.callbacks.rentProperty(action.propertyId);
        }
        break;

      case 'makeRentPayment':
        if (this.callbacks.makeRentPayment) {
          await this.callbacks.makeRentPayment(action.propertyId);
        }
        break;

      case 'cancelRental':
        if (this.callbacks.cancelRental) {
          await this.callbacks.cancelRental(action.propertyId);
        }
        break;

      // Time manipulation actions
      case 'setTimeOfDay':
        if (this.callbacks.setTimeOfDay) {
          await this.callbacks.setTimeOfDay(action.target);
        }
        break;

      case 'modifyTime':
        if (this.callbacks.modifyTime) {
          await this.callbacks.modifyTime(action.minutes);
        }
        break;

      // NPC location actions
      case 'teleportNPC':
        if (this.callbacks.teleportNPC) {
          await this.callbacks.teleportNPC(action.npcId, action.locationId);
        }
        break;

      case 'hideNPC':
        if (this.callbacks.hideNPC) {
          await this.callbacks.hideNPC(action.npcId);
        }
        break;

      case 'showNPC':
        if (this.callbacks.showNPC) {
          await this.callbacks.showNPC(action.npcId);
        }
        break;
    }

    return { type: action.type, ...action };
  }

  /**
   * Advance to next dialogue (user clicked continue)
   */
  async advance(context = {}) {
    this.currentNodeIndex++;
    return this.getCurrentState(context);
  }

  /**
   * Submit an input value (for textInput, numberInput, dropdown nodes)
   * @param {any} value - The submitted value
   * @param {Object} context - Current context
   * @returns {Object} Next scene state
   */
  async submitInput(value, context = {}) {
    const state = this.getCurrentState(context);

    // Validate this is an input node
    if (!['textInput', 'numberInput', 'dropdown'].includes(state.type)) {
      console.warn(`submitInput called on non-input node type: ${state.type}`);
      return state;
    }

    // Store the value in local flags
    if (state.variable) {
      this.localFlags[state.variable] = value;
    }

    // Call onInputSubmit callback if provided
    const fullContext = this.buildContext(context);
    if (this.callbacks.onInputSubmit) {
      await this.callbacks.onInputSubmit(state.variable, value, state, fullContext);
    }

    // Navigate to next node
    if (state.goto !== undefined) {
      this.currentNodeIndex = state.goto;
    } else {
      this.currentNodeIndex++;
    }

    return this.getCurrentState(context);
  }

  /**
   * Select a choice (supports both button and input-type choices)
   * @param {number} choiceIndex - Index of the choice
   * @param {Object} context - Current context
   * @param {any} inputValue - Optional input value (for non-button choices)
   */
  async selectChoice(choiceIndex, context = {}, inputValue = null) {
    const state = this.getCurrentState(context);
    if (state.type !== 'choice') {
      console.warn('Not at a choice node');
      return state;
    }

    const choice = state.choices[choiceIndex];
    if (!choice) {
      console.warn(`Invalid choice index: ${choiceIndex}`);
      return state;
    }

    if (choice.disabled) {
      console.warn('Choice is disabled');
      return state;
    }

    // Handle input-type choices
    if (choice.inputType && choice.inputType !== INPUT_TYPES.BUTTON && choice.inputConfig) {
      // Store the input value in local flags
      if (choice.inputConfig.variable && inputValue !== null) {
        this.localFlags[choice.inputConfig.variable] = inputValue;
      }
    }

    // Record choice
    this.choiceHistory.push({
      sceneId: this.currentScene.id,
      nodeIndex: this.currentNodeIndex,
      choiceIndex,
      choiceId: choice.id,
      inputValue: inputValue
    });

    // Process choice actions
    const fullContext = this.buildContext(context);
    if (choice.actions) {
      await this.processActions(choice.actions, fullContext);
    }

    // Callback
    if (this.callbacks.onChoice) {
      await this.callbacks.onChoice(choice, fullContext, inputValue);
    }

    // Determine next node
    if (choice.goto !== undefined) {
      this.currentNodeIndex = choice.goto;
    } else if (choice.gotoLabel) {
      const labelIndex = this.findLabel(choice.gotoLabel);
      if (labelIndex !== -1) {
        this.currentNodeIndex = labelIndex;
      } else {
        this.currentNodeIndex++;
      }
    } else if (choice.nextScene) {
      return this.startScene(choice.nextScene, context);
    } else {
      this.currentNodeIndex++;
    }

    return this.getCurrentState(context);
  }

  /**
   * End current scene
   */
  async endScene(context = {}) {
    if (!this.currentScene) return null;
    
    const fullContext = this.buildContext(context);
    
    // Process exit actions
    if (this.currentScene.onExit) {
      await this.processActions(this.currentScene.onExit, fullContext);
    }
    
    // Callback
    if (this.callbacks.onSceneEnd) {
      await this.callbacks.onSceneEnd(this.currentScene, fullContext);
    }
    
    const endedScene = this.currentScene;
    this.currentScene = null;
    this.currentNodeIndex = 0;
    
    return { scene: endedScene, choiceHistory: [...this.choiceHistory] };
  }

  /**
   * Go back to previous scene (if allowed)
   */
  async goBack(context = {}) {
    if (this.sceneHistory.length === 0) {
      return { success: false, error: 'No scene history' };
    }
    
    const previous = this.sceneHistory.pop();
    return this.startScene(previous.sceneId, context);
  }

  /**
   * Update tag settings
   */
  setTags(enabledTags, disabledTags) {
    this.enabledTags = enabledTags || [];
    this.disabledTags = disabledTags || [];
  }

  /**
   * Get scene history
   */
  getHistory() {
    return {
      sceneHistory: [...this.sceneHistory],
      choiceHistory: [...this.choiceHistory]
    };
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.sceneHistory = [];
    this.choiceHistory = [];
    this.localFlags = {};
  }
}

export default SceneRunner;
