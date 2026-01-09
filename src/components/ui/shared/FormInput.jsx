import React, { forwardRef } from 'react';
import './shared.css';

/**
 * FormInput - Reusable input component for text, number, and textarea
 *
 * @param {string} label - Label text for the input
 * @param {string} type - Input type: 'text', 'number', 'password', 'email', 'textarea'
 * @param {string} value - Current value
 * @param {function} onChange - Change handler (receives value, not event)
 * @param {string} placeholder - Placeholder text
 * @param {string} helper - Helper text displayed below input
 * @param {string} error - Error message (displays instead of helper when present)
 * @param {boolean} required - Show required indicator
 * @param {boolean} disabled - Disable input
 * @param {string} size - Input size: 'sm', 'md', 'lg'
 * @param {number} min - Minimum value for number inputs
 * @param {number} max - Maximum value for number inputs
 * @param {number} step - Step value for number inputs
 * @param {number} rows - Number of rows for textarea
 * @param {string} className - Additional CSS classes
 * @param {string} id - Input ID (auto-generated from label if not provided)
 */
const FormInput = forwardRef(({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  helper,
  error,
  required = false,
  disabled = false,
  size = 'md',
  min,
  max,
  step,
  rows = 3,
  className = '',
  id,
  onBlur,
  onFocus,
  onKeyDown,
  autoFocus,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const handleChange = (e) => {
    if (onChange) {
      const newValue = type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
      onChange(newValue);
    }
  };

  const inputClassName = [
    'form-input',
    type === 'textarea' ? 'textarea' : '',
    size !== 'md' ? size : '',
    error ? 'error' : '',
    className
  ].filter(Boolean).join(' ');

  const InputComponent = type === 'textarea' ? 'textarea' : 'input';

  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={inputId}>
          {label}
          {required && <span className="required">*</span>}
          {!required && <span className="optional">(optional)</span>}
        </label>
      )}

      <InputComponent
        ref={ref}
        id={inputId}
        type={type === 'textarea' ? undefined : type}
        className={inputClassName}
        value={value ?? ''}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        rows={type === 'textarea' ? rows : undefined}
        autoFocus={autoFocus}
        {...props}
      />

      {error && <div className="form-error">{error}</div>}
      {!error && helper && <div className="form-helper">{helper}</div>}
    </div>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput;
