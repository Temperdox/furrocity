import React from 'react';
import './shared.css';

/**
 * NumericModifierInput - Input for numeric modifiers with operation selection and random range support
 *
 * @param {object} value - Current value: { operation: 'add'|'subtract'|'multiply'|'divide', value: number, random?: boolean, min?: number, max?: number }
 * @param {function} onChange - Change handler (receives full value object)
 * @param {string} label - Optional label
 * @param {boolean} showLabel - Whether to show the label (default: true)
 * @param {boolean} allowRandom - Whether to show the random toggle (default: true)
 * @param {boolean} compact - Compact mode for inline use (default: false)
 * @param {string} className - Additional CSS classes
 */
const NumericModifierInput = ({
  value = { operation: 'add', value: 0 },
  onChange,
  label,
  showLabel = true,
  allowRandom = true,
  compact = false,
  className = '',
  disabled = false,
}) => {
  const operations = [
    { id: 'add', symbol: '+', label: 'Add' },
    { id: 'subtract', symbol: '−', label: 'Subtract' },
    { id: 'multiply', symbol: '×', label: 'Multiply' },
    { id: 'divide', symbol: '÷', label: 'Divide' },
  ];

  const handleOperationChange = (op) => {
    if (disabled) return;
    onChange({ ...value, operation: op });
  };

  const handleValueChange = (newValue) => {
    if (disabled) return;
    onChange({ ...value, value: newValue === '' ? 0 : Number(newValue) });
  };

  const handleRandomToggle = () => {
    if (disabled) return;
    if (value.random) {
      // Switching from random to fixed - use min as the value
      const { random, min, max, ...rest } = value;
      onChange({ ...rest, value: min || 0 });
    } else {
      // Switching from fixed to random - use value as both min and max
      const { value: fixedValue, ...rest } = value;
      onChange({ ...rest, random: true, min: fixedValue || 0, max: fixedValue || 0 });
    }
  };

  const handleMinChange = (min) => {
    if (disabled) return;
    onChange({ ...value, min: min === '' ? 0 : Number(min) });
  };

  const handleMaxChange = (max) => {
    if (disabled) return;
    onChange({ ...value, max: max === '' ? 0 : Number(max) });
  };

  const containerClass = [
    'numeric-modifier-input',
    compact ? 'compact' : '',
    disabled ? 'disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClass}>
      {showLabel && label && (
        <label className="form-label">{label}</label>
      )}

      <div className="numeric-modifier-controls">
        {/* Operation buttons */}
        <div className="numeric-modifier-operations">
          {operations.map(op => (
            <button
              key={op.id}
              type="button"
              className={`numeric-modifier-op-btn ${value.operation === op.id ? 'active' : ''}`}
              onClick={() => handleOperationChange(op.id)}
              title={op.label}
              disabled={disabled}
            >
              {op.symbol}
            </button>
          ))}
        </div>

        {/* Value input(s) */}
        <div className="numeric-modifier-values">
          {value.random ? (
            <>
              <input
                type="number"
                className="form-input numeric-modifier-value"
                value={value.min ?? 0}
                onChange={(e) => handleMinChange(e.target.value)}
                placeholder="Min"
                disabled={disabled}
              />
              <span className="numeric-modifier-range-separator">to</span>
              <input
                type="number"
                className="form-input numeric-modifier-value"
                value={value.max ?? 0}
                onChange={(e) => handleMaxChange(e.target.value)}
                placeholder="Max"
                disabled={disabled}
              />
            </>
          ) : (
            <input
              type="number"
              className="form-input numeric-modifier-value single"
              value={value.value ?? 0}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder="Value"
              disabled={disabled}
            />
          )}
        </div>

        {/* Random toggle */}
        {allowRandom && (
          <button
            type="button"
            className={`numeric-modifier-random-btn ${value.random ? 'active' : ''}`}
            onClick={handleRandomToggle}
            title={value.random ? 'Using random range' : 'Click for random range'}
            disabled={disabled}
          >
            🎲
          </button>
        )}
      </div>

      {/* Preview of what this modifier does */}
      <div className="numeric-modifier-preview">
        {value.random ? (
          <span>
            {value.operation === 'add' && `+${value.min} to +${value.max}`}
            {value.operation === 'subtract' && `-${value.min} to -${value.max}`}
            {value.operation === 'multiply' && `×${value.min} to ×${value.max}`}
            {value.operation === 'divide' && `÷${value.min} to ÷${value.max}`}
            <span className="random-indicator"> (random)</span>
          </span>
        ) : (
          <span>
            {value.operation === 'add' && `+${value.value || 0}`}
            {value.operation === 'subtract' && `-${value.value || 0}`}
            {value.operation === 'multiply' && `×${value.value || 0}`}
            {value.operation === 'divide' && `÷${value.value || 0}`}
          </span>
        )}
      </div>
    </div>
  );
};

export default NumericModifierInput;
