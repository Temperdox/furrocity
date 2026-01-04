/**
 * @fileoverview InventoryItem - Single item display component
 *
 * Displays a single item in the inventory grid with:
 * - Rarity-colored border and glow effects
 * - Stack count badge for stackable items
 * - Status badges (favorite, junk, cursed, quest)
 * - Price display for merchant contexts
 * - Hover tooltip with item name and level
 *
 * @module components/inventory/InventoryItem
 */

import React, { useCallback } from 'react';

/**
 * Rarity tier colors for item borders and names.
 * @constant {Object.<string, string>}
 */
const RARITY_COLORS = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f97316',
  mythic: '#ffd700',
  divine: '#fef3c7'
};

// Rarity glow intensity
const RARITY_GLOW = {
  common: 'none',
  uncommon: '0 0 4px #22c55e40',
  rare: '0 0 6px #3b82f640',
  epic: '0 0 8px #a855f750',
  legendary: '0 0 10px #f9731660',
  mythic: '0 0 12px #ffd70070',
  divine: '0 0 15px #fef3c780'
};

/**
 * InventoryItem - Single item display in the inventory grid
 *
 * @param {Object} props
 * @param {Object} props.item - Item data
 * @param {string} props.mode - Inventory mode
 * @param {boolean} props.disabled - Whether item is greyed out
 * @param {string} props.disabledReason - Tooltip reason for being disabled
 * @param {boolean} props.selected - Whether item is selected
 * @param {number} props.price - Price to display (optional)
 * @param {boolean} props.isBuying - Whether this is a buy context
 * @param {Function} props.onClick - Click handler
 * @param {Function} props.onDoubleClick - Double-click handler
 * @param {Function} props.onContextMenu - Right-click handler
 */
const InventoryItem = ({
  item,
  mode = 'player',
  disabled = false,
  disabledReason,
  selected = false,
  price,
  isBuying = false,
  onClick,
  onDoubleClick,
  onContextMenu,
  onMouseEnter,
  onMouseLeave
}) => {
  const handleClick = useCallback((e) => {
    if (onClick) onClick(item, e);
  }, [item, onClick]);

  const handleDoubleClick = useCallback((e) => {
    if (onDoubleClick) onDoubleClick(item, e);
  }, [item, onDoubleClick]);

  const handleContextMenu = useCallback((e) => {
    if (onContextMenu) onContextMenu(item, e);
  }, [item, onContextMenu]);

  const handleMouseEnter = useCallback((e) => {
    if (onMouseEnter) onMouseEnter(item, e);
  }, [item, onMouseEnter]);

  const handleMouseLeave = useCallback((e) => {
    if (onMouseLeave) onMouseLeave(item, e);
  }, [item, onMouseLeave]);

  // Get rarity color and glow
  const rarityColor = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
  const rarityGlow = RARITY_GLOW[item.rarity] || RARITY_GLOW.common;

  // Build class name
  const classNames = [
    'inventory-item',
    `inventory-item--${mode}`,
    `inventory-item--${item.rarity || 'common'}`
  ];

  if (disabled) classNames.push('inventory-item--disabled');
  if (selected) classNames.push('inventory-item--selected');
  if (item.userFlags?.favorite) classNames.push('inventory-item--favorite');
  if (item.userFlags?.junk) classNames.push('inventory-item--junk');
  if (item.isCursed) classNames.push('inventory-item--cursed');
  if (item.questItem) classNames.push('inventory-item--quest');

  // Get item icon
  const getItemIcon = () => {
    if (item.icon?.type === 'sprite') {
      // Sprite-based icon (future implementation)
      return <div className="item-icon-sprite" data-icon={item.icon.iconId} />;
    }
    // Emoji or text fallback
    return item.icon || item.name?.[0] || '?';
  };

  // Format price display
  const formatPrice = (value) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  return (
    <div
      className={classNames.join(' ')}
      style={{
        '--rarity-color': rarityColor,
        '--rarity-glow': rarityGlow
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Icon */}
      <div className="item-icon">
        {getItemIcon()}
      </div>

      {/* Quantity badge */}
      {(item.count || 1) > 1 && (
        <div className="item-quantity">
          {item.count}
        </div>
      )}

      {/* Favorite star */}
      {item.userFlags?.favorite && (
        <div className="item-badge item-badge--favorite">
          *
        </div>
      )}

      {/* Junk marker */}
      {item.userFlags?.junk && (
        <div className="item-badge item-badge--junk">
          J
        </div>
      )}

      {/* Cursed indicator */}
      {item.isCursed && (
        <div className="item-badge item-badge--cursed">
          C
        </div>
      )}

      {/* Quest item indicator */}
      {item.questItem && (
        <div className="item-badge item-badge--quest">
          !
        </div>
      )}

      {/* Price display */}
      {price !== undefined && (
        <div className={`item-price ${isBuying ? 'item-price--buy' : 'item-price--sell'}`}>
          {formatPrice(price)}g
        </div>
      )}

      {/* Item name (shown on hover) */}
      <div className="item-name-tooltip">
        <span className="item-name" style={{ color: rarityColor }}>
          {item.name}
        </span>
        {item.level && (
          <span className="item-level">Lv.{item.level}</span>
        )}
      </div>
    </div>
  );
};

export default InventoryItem;
