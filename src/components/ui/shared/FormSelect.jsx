import React, { forwardRef } from 'react';
import './shared.css';

/**
 * FormSelect - Reusable select/dropdown component
 *
 * @param {string} label - Label text
 * @param {string|number} value - Current value
 * @param {function} onChange - Change handler (receives value, not event)
 * @param {Array} options - Array of options: strings, or objects with { value, label, disabled }
 * @param {Object} groups - Optional grouped options: { groupLabel: [options], ... }
 * @param {string} placeholder - Placeholder option text
 * @param {string} helper - Helper text
 * @param {string} error - Error message
 * @param {boolean} required - Show required indicator
 * @param {boolean} disabled - Disable select
 * @param {string} size - Select size: 'sm', 'md', 'lg'
 * @param {string} className - Additional CSS classes
 */
const FormSelect = forwardRef(({
  label,
  value,
  onChange,
  options = [],
  groups = null,
  placeholder = 'Select...',
  helper,
  error,
  required = false,
  disabled = false,
  size = 'md',
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const selectClassName = [
    'form-select',
    size !== 'md' ? size : '',
    error ? 'error' : '',
    className
  ].filter(Boolean).join(' ');

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

  // Render options
  const renderOptions = (opts) => {
    return opts.map((opt) => {
      const { value: optValue, label: optLabel, disabled: optDisabled } = normalizeOption(opt);
      return (
        <option key={optValue} value={optValue} disabled={optDisabled}>
          {optLabel}
        </option>
      );
    });
  };

  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={selectId}>
          {label}
          {required && <span className="required">*</span>}
          {!required && <span className="optional">(optional)</span>}
        </label>
      )}

      <select
        ref={ref}
        id={selectId}
        className={selectClassName}
        value={value ?? ''}
        onChange={handleChange}
        disabled={disabled}
        {...props}
      >
        {placeholder && (
          <option value="" disabled={required}>
            {placeholder}
          </option>
        )}

        {groups ? (
          // Render grouped options
          Object.entries(groups).map(([groupLabel, groupOptions]) => (
            <optgroup key={groupLabel} label={groupLabel}>
              {renderOptions(groupOptions)}
            </optgroup>
          ))
        ) : (
          // Render flat options
          renderOptions(options)
        )}
      </select>

      {error && <div className="form-error">{error}</div>}
      {!error && helper && <div className="form-helper">{helper}</div>}
    </div>
  );
});

FormSelect.displayName = 'FormSelect';

export default FormSelect;
