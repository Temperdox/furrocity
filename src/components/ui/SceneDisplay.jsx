/**
 * SceneDisplay.jsx - Comprehensive scene rendering component
 *
 * Handles all scene node types:
 * - dialogue: NPC/narrator text
 * - choice: Player choices (with optional inputType)
 * - textInput: Text input fields
 * - numberInput: Number input with validation
 * - dropdown: Selection from options
 * - branch: Auto-branch based on conditions
 * - action: Execute actions
 * - end: End scene
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import SceneInput, { ChoiceInput, SceneTextInput, SceneNumberInput, SceneDropdown } from './SceneInputs';
import './SceneDisplay.css';

/**
 * Main SceneDisplay component
 */
export default function SceneDisplay({
  scene,
  player,
  gameState,
  onComplete,
  onAction,
  validationSystem,
  conditionEvaluator
}) {
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [sceneVariables, setSceneVariables] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Get nodes array from scene
  const nodes = useMemo(() => {
    if (!scene) return [];
    // Support both array and object node formats
    if (Array.isArray(scene.nodes)) {
      return scene.nodes;
    }
    // If nodes is an object with named keys, convert to array
    if (scene.nodes && typeof scene.nodes === 'object') {
      return Object.values(scene.nodes);
    }
    // Fallback to dialogue array for simple scenes
    if (scene.dialogue) {
      return scene.dialogue.map((line, i) => ({
        type: 'dialogue',
        ...line,
        _index: i
      }));
    }
    return [];
  }, [scene]);

  const currentNode = nodes[currentNodeIndex];

  // Context for validation and conditions
  const context = useMemo(() => ({
    player,
    gameState,
    game: gameState,
    variables: sceneVariables,
    scene
  }), [player, gameState, sceneVariables, scene]);

  // Reset when scene changes
  useEffect(() => {
    setCurrentNodeIndex(0);
    setSceneVariables({});
  }, [scene?.id]);

  // Process node when it changes (for auto-advance nodes like branch/action)
  useEffect(() => {
    if (!currentNode || isProcessing) return;

    const processNode = async () => {
      switch (currentNode.type) {
        case 'branch':
          handleBranchNode(currentNode);
          break;
        case 'action':
          await handleActionNode(currentNode);
          break;
        case 'end':
          handleEndNode(currentNode);
          break;
        default:
          // Interactive nodes - wait for user input
          break;
      }
    };

    processNode();
  }, [currentNodeIndex, currentNode]);

  // Navigate to a specific node
  const goToNode = useCallback((target) => {
    if (typeof target === 'number') {
      setCurrentNodeIndex(target);
    } else if (typeof target === 'string') {
      // Find node by label
      const index = nodes.findIndex(n => n.label === target);
      if (index >= 0) {
        setCurrentNodeIndex(index);
      } else {
        console.warn(`Node label not found: ${target}`);
        advanceNode();
      }
    } else {
      advanceNode();
    }
  }, [nodes]);

  // Advance to next node
  const advanceNode = useCallback(() => {
    if (currentNodeIndex < nodes.length - 1) {
      setCurrentNodeIndex(prev => prev + 1);
    } else {
      onComplete?.();
    }
  }, [currentNodeIndex, nodes.length, onComplete]);

  // Handle dialogue node click
  const handleDialogueClick = () => {
    if (currentNode?.goto !== undefined) {
      goToNode(currentNode.goto);
    } else if (currentNode?.next !== undefined) {
      goToNode(currentNode.next);
    } else {
      advanceNode();
    }
  };

  // Handle choice selection
  const handleChoiceSelect = (choice, inputValue = null) => {
    // Store any input value in scene variables
    if (choice.inputConfig?.variable && inputValue !== null) {
      setSceneVariables(prev => ({
        ...prev,
        [choice.inputConfig.variable]: inputValue
      }));
    }

    // Execute choice actions if any
    if (choice.actions && onAction) {
      choice.actions.forEach(action => {
        const resolvedAction = resolveActionVariables(action, inputValue);
        onAction(resolvedAction);
      });
    }

    // Navigate to target
    if (choice.goto !== undefined) {
      goToNode(choice.goto);
    } else if (choice.next !== undefined) {
      goToNode(choice.next);
    } else {
      advanceNode();
    }
  };

  // Handle standalone input submission
  const handleInputSubmit = (variable, value) => {
    setSceneVariables(prev => ({
      ...prev,
      [variable]: value
    }));

    if (currentNode?.goto !== undefined) {
      goToNode(currentNode.goto);
    } else {
      advanceNode();
    }
  };

  // Handle branch node
  const handleBranchNode = (node) => {
    const branches = node.branches || [];

    for (const branch of branches) {
      if (branch.default) {
        goToNode(branch.goto || branch.next);
        return;
      }

      if (branch.condition || branch.conditions) {
        const conditions = branch.conditions || [branch.condition];
        const passed = evaluateConditions(conditions);
        if (passed) {
          goToNode(branch.goto || branch.next);
          return;
        }
      }
    }

    // No branch matched, check for default
    if (node.default?.goto) {
      goToNode(node.default.goto);
    } else {
      advanceNode();
    }
  };

  // Handle action node
  const handleActionNode = async (node) => {
    setIsProcessing(true);

    const actions = node.actions || [];
    for (const action of actions) {
      const resolvedAction = resolveActionVariables(action, null);
      await onAction?.(resolvedAction);
    }

    setIsProcessing(false);

    if (node.goto !== undefined) {
      goToNode(node.goto);
    } else {
      advanceNode();
    }
  };

  // Handle end node
  const handleEndNode = (node) => {
    onComplete?.(node.outcome || 'completed');
  };

  // Evaluate conditions
  const evaluateConditions = (conditions) => {
    if (!conditionEvaluator || !conditions) return true;

    for (const condition of conditions) {
      // Check flag conditions against scene variables
      if (condition.type === 'flag') {
        const varValue = sceneVariables[condition.flag];
        if (condition.operator === 'equals') {
          if (varValue !== condition.value) return false;
        } else if (condition.operator === 'gte') {
          if (!(varValue >= condition.value)) return false;
        } else if (condition.operator === 'gt') {
          if (!(varValue > condition.value)) return false;
        } else if (varValue === undefined) {
          return false;
        }
      } else {
        // Use condition evaluator for other types
        const result = conditionEvaluator.evaluate(condition, context);
        if (!result) return false;
      }
    }
    return true;
  };

  // Resolve action variable placeholders
  const resolveActionVariables = (action, inputValue) => {
    const resolved = { ...action };

    for (const [key, value] of Object.entries(resolved)) {
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        const varName = value.slice(1, -1);
        if (sceneVariables[varName] !== undefined) {
          resolved[key] = sceneVariables[varName];
        } else if (varName === 'value' && inputValue !== null) {
          resolved[key] = inputValue;
        }
      }
    }

    return resolved;
  };

  // Filter choices based on showIf conditions
  const getVisibleChoices = (choices) => {
    if (!choices) return [];

    return choices.filter(choice => {
      if (!choice.showIf) return true;
      return evaluateConditions([choice.showIf]);
    });
  };

  // Check if choice is enabled
  const isChoiceEnabled = (choice) => {
    if (!choice.enableIf) return true;
    return evaluateConditions([choice.enableIf]);
  };

  // Interpolate text with variables
  const interpolateText = (text) => {
    if (!text) return '';

    return text.replace(/\{(\w+)\}/g, (match, varName) => {
      if (sceneVariables[varName] !== undefined) {
        return sceneVariables[varName];
      }
      if (player && player[varName] !== undefined) {
        return player[varName];
      }
      return match;
    });
  };

  if (!scene || !currentNode) {
    return null;
  }

  // Render based on node type
  switch (currentNode.type) {
    case 'dialogue':
      return (
        <DialogueNode
          node={currentNode}
          onClick={handleDialogueClick}
          interpolateText={interpolateText}
          currentIndex={currentNodeIndex}
          totalNodes={nodes.length}
        />
      );

    case 'choice':
      return (
        <ChoiceNode
          node={currentNode}
          choices={getVisibleChoices(currentNode.choices)}
          onSelect={handleChoiceSelect}
          isChoiceEnabled={isChoiceEnabled}
          interpolateText={interpolateText}
          validationSystem={validationSystem}
          context={context}
        />
      );

    case 'textInput':
      return (
        <div className="scene-display scene-input-node">
          <SceneTextInput
            prompt={interpolateText(currentNode.prompt)}
            placeholder={currentNode.placeholder}
            defaultValue={interpolateText(currentNode.defaultValue || '')}
            validation={currentNode.validation}
            multiline={currentNode.multiline}
            maxLines={currentNode.maxLines}
            onSubmit={(value) => handleInputSubmit(currentNode.variable, value)}
            validationSystem={validationSystem}
            context={context}
          />
        </div>
      );

    case 'numberInput':
      return (
        <div className="scene-display scene-input-node">
          <SceneNumberInput
            prompt={interpolateText(currentNode.prompt)}
            placeholder={currentNode.placeholder}
            defaultValue={currentNode.defaultValue}
            validation={currentNode.validation}
            showCost={currentNode.showCost}
            costFormula={currentNode.costFormula}
            costLabel={currentNode.costLabel}
            showSlider={currentNode.showSlider}
            onSubmit={(value) => handleInputSubmit(currentNode.variable, value)}
            validationSystem={validationSystem}
            context={context}
          />
        </div>
      );

    case 'dropdown':
      return (
        <div className="scene-display scene-input-node">
          <SceneDropdown
            prompt={interpolateText(currentNode.prompt)}
            options={currentNode.options}
            defaultValue={currentNode.defaultValue}
            required={currentNode.required !== false}
            onSubmit={(value) => handleInputSubmit(currentNode.variable, value)}
            context={context}
          />
        </div>
      );

    case 'branch':
    case 'action':
    case 'end':
      // These are auto-processed, show loading state
      return (
        <div className="scene-display scene-processing">
          <div className="processing-indicator">...</div>
        </div>
      );

    default:
      // Unknown node type, try to render as dialogue
      if (currentNode.text) {
        return (
          <DialogueNode
            node={currentNode}
            onClick={handleDialogueClick}
            interpolateText={interpolateText}
            currentIndex={currentNodeIndex}
            totalNodes={nodes.length}
          />
        );
      }
      return null;
  }
}

/**
 * Dialogue Node Component
 */
function DialogueNode({ node, onClick, interpolateText, currentIndex, totalNodes }) {
  const speaker = node.speaker || node.speakerName;
  const isNarrator = speaker === 'narrator' || !speaker;

  return (
    <div className="scene-display scene-dialogue" onClick={onClick}>
      <div className="dialogue-backdrop">
        <div className="dialogue-portrait">
          {node.speakerImage ? (
            <img src={node.speakerImage} alt={speaker} />
          ) : (
            <span className="portrait-placeholder">
              {isNarrator ? '📜' : '👤'}
            </span>
          )}
        </div>
      </div>

      <div className="dialogue-box">
        {!isNarrator && speaker && (
          <div className="dialogue-speaker">{speaker}</div>
        )}
        <p className={`dialogue-text ${isNarrator ? 'narrator' : ''}`}>
          {interpolateText(node.text)}
        </p>
        <div className="dialogue-footer">
          <span className="dialogue-progress">
            {currentIndex + 1}/{totalNodes}
          </span>
          <span className="dialogue-hint">Click to continue</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Choice Node Component
 */
function ChoiceNode({
  node,
  choices,
  onSelect,
  isChoiceEnabled,
  interpolateText,
  validationSystem,
  context
}) {
  return (
    <div className="scene-display scene-choice">
      {node.prompt && (
        <div className="choice-prompt">
          <p>{interpolateText(node.prompt)}</p>
        </div>
      )}

      <div className="choice-list">
        {choices.map((choice, index) => {
          const enabled = isChoiceEnabled(choice);
          const inputType = choice.inputType || 'button';

          if (inputType !== 'button') {
            return (
              <ChoiceInput
                key={choice.id || index}
                choice={{
                  ...choice,
                  text: interpolateText(choice.text),
                  disabled: !enabled,
                  disabledReason: choice.disabledReason
                }}
                onSubmit={(value) => onSelect(choice, value)}
                validationSystem={validationSystem}
                context={context}
              />
            );
          }

          return (
            <button
              key={choice.id || index}
              className={`choice-button ${!enabled ? 'disabled' : ''}`}
              onClick={() => enabled && onSelect(choice)}
              disabled={!enabled}
            >
              <span className="choice-text">{interpolateText(choice.text)}</span>
              {!enabled && choice.disabledReason && (
                <span className="choice-disabled-reason">{choice.disabledReason}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
