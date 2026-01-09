import React, { useCallback } from 'react';
import './shared.css';

/**
 * ChipSelect - Multi-select component using chip/button UI
 *
 * @param {Array} value - Current selected values (array for multi, single value for single select)
 * @param {function} onChange - Change handler (receives array for multi, single value for single)
 * @param {Array} options - Array of options: strings, or objects with { value, label, disabled }
 * @param {boolean} multiple - Allow multiple selections (default: false)
 * @param {string} label - Label text
 * @param {string} helper - Helper text
 * @param {boolean} required - Show required indicator
 * @param {boolean} disabled - Disable all options
 * @param {boolean} showCheckbox - Show checkbox indicator for multi-select (default: true for multiple)
 * @param {string} className - Additional CSS classes
 */
const ChipSelect = ({
  value,
  onChange,
  options = [],
  multiple = false,
  label,
  helper,
  required = false,
  disabled = false,
  showCheckbox = true,
  className = '',
}) => {
  // Normalize value to array for easier comparison
  const selectedValues = Array.isArray(value)
    ? value
    : (value !== undefined && value !== null && value !== '' ? [value] : []);

  // Normalize option to { value, label, disabled }
  const normalizeOption = (opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: String(opt), disabled: false };
    }
    return {
      value: opt.value ?? opt.id ?? '',
      label: opt.label ?? opt.name ?? String(opt.value),
      disabled: opt.disabled ?? false
    };
  };

  // Check if a value is selected
  const isSelected = useCallback((optValue) => {
    return selectedValues.includes(optValue);
  }, [selectedValues]);

  // Handle option click
  const handleOptionClick = useCallback((optValue, optDisabled) => {
    if (disabled || optDisabled) return;

    if (multiple) {
      // Toggle selection for multi-select
      const newValue = isSelected(optValue)
        ? selectedValues.filter(v => v !== optValue)
        : [...selectedValues, optValue];
      onChange(newValue);
    } else {
      // Single select - just set the value (or deselect if clicking same)
      onChange(isSelected(optValue) ? '' : optValue);
    }
  }, [multiple, isSelected, selectedValues, onChange, disabled]);

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      <div className="chip-select-container">
        <div className="chip-select-options">
          {options.map((opt) => {
            const { value: optValue, label: optLabel, disabled: optDisabled } = normalizeOption(opt);
            const selected = isSelected(optValue);

            return (
              <button
                key={optValue}
                type="button"
                className={`chip-select-option ${selected ? 'selected' : ''}`}
                onClick={() => handleOptionClick(optValue, optDisabled)}
                disabled={disabled || optDisabled}
              >
                {multiple && showCheckbox && (
                  <span className="chip-checkbox">
                    {selected && '\u2713'}
                  </span>
                )}
                {optLabel}
              </button>
            );
          })}
        </div>
      </div>

      {helper && <div className="form-helper">{helper}</div>}
    </div>
  );
};

export default ChipSelect;
