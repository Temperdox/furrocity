/**
 * SceneInputs.jsx - Input components for scene system
 *
 * Provides TextInput, NumberInput, and Dropdown components for scenes
 * with support for validation, dynamic formulas, and cost display.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './SceneInputs.css';

/**
 * Text Input Component for scenes
 */
export function SceneTextInput({
  prompt,
  placeholder,
  defaultValue,
  validation,
  multiline,
  maxLines,
  onSubmit,
  onCancel,
  validationSystem,
  context
}) {
  const [value, setValue] = useState(defaultValue || '');
  const [errors, setErrors] = useState([]);
  const [touched, setTouched] = useState(false);

  // Validate on change
  useEffect(() => {
    if (!touched) return;

    if (validationSystem && validation) {
      const result = validationSystem.validate(value, validation, context);
      setErrors(result.errors);
    }
  }, [value, validation, validationSystem, context, touched]);

  const handleSubmit = () => {
    setTouched(true);

    if (validationSystem && validation) {
      const result = validationSystem.validate(value, validation, context);
      if (!result.valid) {
        setErrors(result.errors);
        return;
      }
      onSubmit(result.sanitizedValue);
    } else {
      onSubmit(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const summary = useMemo(() => {
    if (!validationSystem || !validation) return null;
    return validationSystem.getValidationSummary(validation, context);
  }, [validationSystem, validation, context]);

  return (
    <div className="scene-input scene-text-input">
      {prompt && <p className="scene-input-prompt">{prompt}</p>}

      <div className="scene-input-field-wrapper">
        {multiline ? (
          <textarea
            className={`scene-input-field ${errors.length > 0 ? 'has-errors' : ''}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={placeholder}
            rows={maxLines || 4}
          />
        ) : (
          <input
            type="text"
            className={`scene-input-field ${errors.length > 0 ? 'has-errors' : ''}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => setTouched(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
          />
        )}
      </div>

      {summary && (
        <div className="scene-input-hint">
          {summary.minLength && <span>Min: {summary.minLength} chars</span>}
          {summary.maxLength && <span>Max: {summary.maxLength} chars</span>}
        </div>
      )}

      {touched && errors.length > 0 && (
        <div className="scene-input-errors">
          {errors.map((err, i) => (
            <span key={i} className="scene-input-error">{err}</span>
          ))}
        </div>
      )}

      <div className="scene-input-buttons">
        {onCancel && (
          <button className="scene-input-btn cancel" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          className="scene-input-btn submit"
          onClick={handleSubmit}
          disabled={touched && errors.length > 0}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

/**
 * Number Input Component for scenes
 */
export function SceneNumberInput({
  prompt,
  placeholder,
  defaultValue,
  validation,
  showCost,
  costFormula,
  costLabel,
  showSlider,
  onSubmit,
  onCancel,
  validationSystem,
  context
}) {
  const [value, setValue] = useState(defaultValue || 1);
  const [errors, setErrors] = useState([]);
  const [touched, setTouched] = useState(false);

  // Resolve validation rules
  const resolvedValidation = useMemo(() => {
    if (!validationSystem || !validation) return validation || {};
    return validationSystem.resolveRules(validation, context);
  }, [validationSystem, validation, context]);

  const min = resolvedValidation?.min ?? 0;
  const max = resolvedValidation?.max ?? 999;
  const step = resolvedValidation?.step ?? 1;

  // Calculate cost
  const calculatedCost = useMemo(() => {
    if (!showCost || !costFormula || !validationSystem) return null;
    return validationSystem.calculateCost(value, costFormula, context);
  }, [showCost, costFormula, value, validationSystem, context]);

  // Validate on change
  useEffect(() => {
    if (!touched) return;

    if (validationSystem && validation) {
      const result = validationSystem.validate(value, validation, context);
      setErrors(result.errors);
    }
  }, [value, validation, validationSystem, context, touched]);

  const handleChange = (newValue) => {
    const numValue = parseInt(newValue, 10);
    if (!isNaN(numValue)) {
      setValue(Math.max(min, Math.min(max, numValue)));
    }
  };

  const handleSubmit = () => {
    setTouched(true);

    if (validationSystem && validation) {
      const result = validationSystem.validate(value, validation, context);
      if (!result.valid) {
        setErrors(result.errors);
        return;
      }
      onSubmit(result.sanitizedValue);
    } else {
      onSubmit(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const incrementValue = () => handleChange(value + step);
  const decrementValue = () => handleChange(value - step);

  // Format cost label
  const formattedCostLabel = useMemo(() => {
    if (!costLabel || calculatedCost === null) return null;
    return costLabel.replace('{cost}', calculatedCost);
  }, [costLabel, calculatedCost]);

  // Check if player can afford
  const canAfford = useMemo(() => {
    if (calculatedCost === null) return true;
    return (context?.player?.gold ?? 0) >= calculatedCost;
  }, [calculatedCost, context]);

  return (
    <div className="scene-input scene-number-input">
      {prompt && <p className="scene-input-prompt">{prompt}</p>}

      <div className="scene-number-controls">
        <button
          className="scene-number-btn decrement"
          onClick={decrementValue}
          disabled={value <= min}
        >
          −
        </button>

        <input
          type="number"
          className={`scene-input-field number-field ${errors.length > 0 ? 'has-errors' : ''}`}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => setTouched(true)}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
          step={step}
        />

        <button
          className="scene-number-btn increment"
          onClick={incrementValue}
          disabled={value >= max}
        >
          +
        </button>
      </div>

      {showSlider && (
        <input
          type="range"
          className="scene-number-slider"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          min={min}
          max={max}
          step={step}
        />
      )}

      <div className="scene-input-hint">
        <span>Range: {min} - {max}</span>
        {step > 1 && <span>Step: {step}</span>}
      </div>

      {showCost && calculatedCost !== null && (
        <div className={`scene-cost-display ${!canAfford ? 'unaffordable' : ''}`}>
          <span className="cost-label">{formattedCostLabel || `Cost: ${calculatedCost}g`}</span>
          {!canAfford && <span className="cost-warning">Not enough gold!</span>}
        </div>
      )}

      {touched && errors.length > 0 && (
        <div className="scene-input-errors">
          {errors.map((err, i) => (
            <span key={i} className="scene-input-error">{err}</span>
          ))}
        </div>
      )}

      <div className="scene-input-buttons">
        {onCancel && (
          <button className="scene-input-btn cancel" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          className="scene-input-btn submit"
          onClick={handleSubmit}
          disabled={(touched && errors.length > 0) || (showCost && !canAfford)}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

/**
 * Dropdown Component for scenes
 */
export function SceneDropdown({
  prompt,
  options,
  defaultValue,
  required,
  onSubmit,
  onCancel,
  context
}) {
  const [value, setValue] = useState(defaultValue || '');
  const [touched, setTouched] = useState(false);

  const hasValidSelection = value !== '' || !required;

  // Check if selected option is affordable
  const selectedOption = useMemo(() => {
    return options?.find(opt => opt.value === value);
  }, [options, value]);

  const canAfford = useMemo(() => {
    if (!selectedOption?.cost) return true;
    return (context?.player?.gold ?? 0) >= selectedOption.cost;
  }, [selectedOption, context]);

  const handleSubmit = () => {
    setTouched(true);

    if (required && !value) return;
    if (!canAfford) return;

    onSubmit(value);
  };

  return (
    <div className="scene-input scene-dropdown">
      {prompt && <p className="scene-input-prompt">{prompt}</p>}

      <div className="scene-dropdown-wrapper">
        <select
          className={`scene-dropdown-field ${!hasValidSelection && touched ? 'has-errors' : ''}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setTouched(true)}
        >
          <option value="">-- Select an option --</option>
          {options?.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
            >
              {opt.label}
              {opt.cost ? ` (${opt.cost}g)` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedOption?.description && (
        <div className="scene-dropdown-description">
          {selectedOption.description}
        </div>
      )}

      {selectedOption?.cost && (
        <div className={`scene-cost-display ${!canAfford ? 'unaffordable' : ''}`}>
          <span className="cost-label">Cost: {selectedOption.cost}g</span>
          {!canAfford && <span className="cost-warning">Not enough gold!</span>}
        </div>
      )}

      {touched && required && !value && (
        <div className="scene-input-errors">
          <span className="scene-input-error">Please select an option</span>
        </div>
      )}

      <div className="scene-input-buttons">
        {onCancel && (
          <button className="scene-input-btn cancel" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          className="scene-input-btn submit"
          onClick={handleSubmit}
          disabled={!hasValidSelection || !canAfford}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

/**
 * Choice Input Component - renders input within a choice button context
 * Used when a choice has inputType other than 'button'
 */
export function ChoiceInput({
  choice,
  onSubmit,
  validationSystem,
  context
}) {
  const { inputType, inputConfig, text, disabled, disabledReason } = choice;

  const handleSubmit = useCallback((value) => {
    onSubmit(value);
  }, [onSubmit]);

  if (disabled) {
    return (
      <div className="choice-input choice-input-disabled">
        <span className="choice-text">{text}</span>
        {disabledReason && <span className="disabled-reason">{disabledReason}</span>}
      </div>
    );
  }

  switch (inputType) {
    case 'textInput':
      return (
        <div className="choice-input choice-input-text">
          <span className="choice-text">{text}</span>
          <SceneTextInput
            {...inputConfig}
            onSubmit={handleSubmit}
            validationSystem={validationSystem}
            context={context}
          />
        </div>
      );

    case 'numberInput':
      return (
        <div className="choice-input choice-input-number">
          <span className="choice-text">{text}</span>
          <SceneNumberInput
            {...inputConfig}
            onSubmit={handleSubmit}
            validationSystem={validationSystem}
            context={context}
          />
        </div>
      );

    case 'dropdown':
      return (
        <div className="choice-input choice-input-dropdown">
          <span className="choice-text">{text}</span>
          <SceneDropdown
            {...inputConfig}
            onSubmit={handleSubmit}
            context={context}
          />
        </div>
      );

    default:
      return null;
  }
}

/**
 * Main SceneInput component that renders based on scene state type
 */
export default function SceneInput({
  sceneState,
  onSubmit,
  onCancel,
  validationSystem,
  context
}) {
  if (!sceneState) return null;

  switch (sceneState.type) {
    case 'textInput':
      return (
        <SceneTextInput
          prompt={sceneState.prompt}
          placeholder={sceneState.placeholder}
          defaultValue={sceneState.defaultValue}
          validation={sceneState.validation}
          multiline={sceneState.multiline}
          maxLines={sceneState.maxLines}
          onSubmit={onSubmit}
          onCancel={onCancel}
          validationSystem={validationSystem}
          context={context}
        />
      );

    case 'numberInput':
      return (
        <SceneNumberInput
          prompt={sceneState.prompt}
          placeholder={sceneState.placeholder}
          defaultValue={sceneState.defaultValue}
          validation={sceneState.validation}
          showCost={sceneState.showCost}
          costFormula={sceneState.costFormula}
          costLabel={sceneState.costLabel}
          showSlider={sceneState.showSlider}
          onSubmit={onSubmit}
          onCancel={onCancel}
          validationSystem={validationSystem}
          context={context}
        />
      );

    case 'dropdown':
      return (
        <SceneDropdown
          prompt={sceneState.prompt}
          options={sceneState.options}
          defaultValue={sceneState.defaultValue}
          required={sceneState.required}
          onSubmit={onSubmit}
          onCancel={onCancel}
          context={context}
        />
      );

    default:
      return null;
  }
}
