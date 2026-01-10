/**
 * @fileoverview StatsGrid - Reusable stats editing grid
 *
 * Displays a grid of stat inputs for editing base stats.
 * Used in EnemyCreator, NPCCreator, CharacterCreator, etc.
 *
 * @module components/generator/shared/StatsGrid
 */

import React from 'react';

/**
 * Format stat name for display (capitalize first letter)
 * @param {string} stat - Stat name
 * @returns {string} Formatted stat name
 */
const formatStatName = (stat) => {
  return stat.charAt(0).toUpperCase() + stat.slice(1).replace(/_/g, ' ');
};

/**
 * StatsGrid - Grid of stat input fields
 *
 * @param {Object} props
 * @param {Object} props.stats - Object of stat name -> value pairs
 * @param {Function} props.onChange - Handler called with (statName, value)
 * @param {string} props.title - Section title (optional)
 * @param {number} props.min - Minimum value (default: 0)
 * @param {number} props.max - Maximum value (optional)
 * @param {number} props.columns - Number of columns (default: 3)
 * @param {boolean} props.showZero - Whether to show stats with value 0 (default: true)
 */
const StatsGrid = ({
  stats,
  onChange,
  title,
  min = 0,
  max,
  columns = 3,
  showZero = true,
}) => {
  const handleChange = (statName, value) => {
    let numValue = parseInt(value) || 0;
    if (min !== undefined) numValue = Math.max(min, numValue);
    if (max !== undefined) numValue = Math.min(max, numValue);
    onChange(statName, numValue);
  };

  const filteredStats = showZero
    ? Object.entries(stats)
    : Object.entries(stats).filter(([, value]) => value !== 0);

  return (
    <div className="stats-grid-container">
      {title && (
        <h4 className="creator-form-section-title" style={{ marginBottom: 'var(--space-sm)' }}>
          {title}
        </h4>
      )}
      <div
        className="stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 'var(--space-sm)',
        }}
      >
        {filteredStats.map(([stat, value]) => (
          <div key={stat} className="stat-row">
            <span className="stat-label">{formatStatName(stat)}</span>
            <input
              type="number"
              className="stat-input"
              value={value}
              onChange={(e) => handleChange(stat, e.target.value)}
              min={min}
              max={max}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsGrid;
