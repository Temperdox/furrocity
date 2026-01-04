/**
 * @fileoverview UniversalInventory - Reusable inventory grid component
 *
 * This component provides a flexible inventory display that can be used in
 * multiple contexts: player inventory, merchant shops, storage containers,
 * and quest item slots.
 *
 * Features:
 * - Grid display with item icons and rarity borders
 * - Tag-based filtering with dynamic filter buttons
 * - Search bar for name/description filtering
 * - Context menu for item actions (favorite, junk, use, etc.)
 * - Price display for merchant contexts
 * - Disabled items with tooltip reasons
 * - Multi-select support
 * - Built-in item tooltip on hover
 *
 * @module components/inventory/UniversalInventory
 * @see InventoryItem - Individual item display
 * @see InventoryFilters - Filter sidebar
 * @see ItemContextMenu - Right-click menu
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import InventoryItem from './InventoryItem.jsx';
import InventoryFilters from './InventoryFilters.jsx';
import ItemContextMenu from './ItemContextMenu.jsx';
import './UniversalInventory.css';

/**
 * Rarity colors for item display
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

/**
 * UniversalInventory - Reusable inventory grid component
 *
 * Modes:
 * - player: Player's personal inventory (full actions available)
 * - merchant: Viewing items at a merchant (buy context)
 * - merchant-stock: Merchant's wares for sale
 * - storage: Chest or storage container
 * - quest: Quest item slots (restricted actions)
 *
 * @component
 * @param {Object} props
 * @param {string} props.mode - 'player' | 'merchant' | 'storage' | 'quest'
 * @param {Array} props.items - Array of items to display
 * @param {string} props.title - Header text
 * @param {Function} props.onItemClick - Click handler (item, event)
 * @param {Function} props.onItemDoubleClick - Double-click handler (item, event)
 * @param {Function} props.onContextAction - Context menu action handler (action, item)
 * @param {Function} props.disabledCheck - Function to check if item is greyed out (item) => { disabled, reason }
 * @param {Array} props.selectedItems - Array of selected item uniqueIds
 * @param {Function} props.onSelectionChange - Selection change handler
 * @param {number} props.gold - Gold amount to display (optional)
 * @param {boolean} props.showFilters - Whether to show filter sidebar (default true)
 * @param {Object} props.priceInfo - Price information for each item { [uniqueId]: price }
 * @param {boolean} props.isBuying - True if viewing items to buy (affects price display)
 */
const UniversalInventory = ({
  mode = 'player',
  items = [],
  title = 'Inventory',
  onItemClick,
  onItemDoubleClick,
  onContextAction,
  onItemHover,
  onItemHoverEnd,
  disabledCheck,
  selectedItems = [],
  onSelectionChange,
  gold,
  showFilters = true,
  priceInfo = {},
  isBuying = false,
  emptyMessage = 'No items',
  showTooltip = true // Enable built-in tooltip by default
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Built-in tooltip state
  const [hoveredItem, setHoveredItem] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Track mouse movement globally when hovering an item
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (hoveredItem) {
        setTooltipPosition({ x: e.clientX, y: e.clientY });
      }
    };

    if (hoveredItem) {
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [hoveredItem]);

  // Filter items based on active filters and search
  const filteredItems = useMemo(() => {
    let result = items;

    // Apply tag/category filters
    if (activeFilters.length > 0) {
      result = result.filter(item => {
        const itemTags = [...(item.tags || []), item.category].filter(Boolean);
        return activeFilters.some(filter => itemTags.includes(filter));
      });
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      result = result.filter(item =>
        item.name?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search)
      );
    }

    return result;
  }, [items, activeFilters, searchTerm]);

  // Handle item click
  const handleItemClick = useCallback((item, event) => {
    // Close context menu if open
    if (contextMenu) {
      setContextMenu(null);
    }

    if (onItemClick) {
      onItemClick(item, event);
    }
  }, [contextMenu, onItemClick]);

  // Handle item double click
  const handleItemDoubleClick = useCallback((item, event) => {
    if (onItemDoubleClick) {
      onItemDoubleClick(item, event);
    }
  }, [onItemDoubleClick]);

  // Handle item hover (mouse enter)
  const handleItemHover = useCallback((item, event) => {
    // Set local hover state for built-in tooltip
    if (showTooltip) {
      setHoveredItem(item);
      if (event) {
        setTooltipPosition({ x: event.clientX, y: event.clientY });
      }
    }
    // Also call external handler if provided
    if (onItemHover) {
      onItemHover(item, event);
    }
  }, [onItemHover, showTooltip]);

  // Handle item hover end (mouse leave)
  const handleItemHoverEnd = useCallback((item, event) => {
    // Clear local hover state
    if (showTooltip) {
      setHoveredItem(null);
    }
    // Also call external handler if provided
    if (onItemHoverEnd) {
      onItemHoverEnd(item, event);
    }
  }, [onItemHoverEnd, showTooltip]);

  // Handle context menu (right-click)
  const handleContextMenu = useCallback((item, event) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      item,
      x: event.clientX,
      y: event.clientY
    });
  }, []);

  // Handle context menu action
  const handleContextAction = useCallback((action, item) => {
    setContextMenu(null);

    if (onContextAction) {
      onContextAction(action, item);
    }
  }, [onContextAction]);

  // Close context menu when clicking outside
  const handleContainerClick = useCallback((event) => {
    if (contextMenu && !event.target.closest('.context-menu')) {
      setContextMenu(null);
    }
  }, [contextMenu]);

  // Check if item is disabled
  const getItemState = useCallback((item) => {
    if (disabledCheck) {
      return disabledCheck(item);
    }
    return { disabled: false, reason: null };
  }, [disabledCheck]);

  // Check if item is selected
  const isSelected = useCallback((item) => {
    return selectedItems.includes(item.uniqueId);
  }, [selectedItems]);

  return (
    <div
      className={`universal-inventory universal-inventory--${mode}`}
      onClick={handleContainerClick}
    >
      {/* Header */}
      <div className="inventory-header">
        <h3 className="inventory-title">{title}</h3>
        {gold !== undefined && (
          <div className="inventory-gold">
            <span className="gold-icon">G</span>
            <span className="gold-amount">{gold.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="inventory-content">
        {/* Filters sidebar */}
        {showFilters && (
          <InventoryFilters
            items={items}
            activeFilters={activeFilters}
            onFilterChange={setActiveFilters}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        )}

        {/* Item grid */}
        <div className="inventory-grid-container">
          {filteredItems.length === 0 ? (
            <div className="inventory-empty">
              {searchTerm || activeFilters.length > 0
                ? 'No matching items'
                : emptyMessage}
            </div>
          ) : (
            <div className="inventory-grid">
              {filteredItems.map((item) => {
                const itemState = getItemState(item);
                const price = priceInfo[item.uniqueId];

                return (
                  <InventoryItem
                    key={item.uniqueId}
                    item={item}
                    mode={mode}
                    disabled={itemState.disabled}
                    disabledReason={itemState.reason}
                    selected={isSelected(item)}
                    price={price}
                    isBuying={isBuying}
                    onClick={handleItemClick}
                    onDoubleClick={handleItemDoubleClick}
                    onContextMenu={handleContextMenu}
                    onMouseEnter={handleItemHover}
                    onMouseLeave={handleItemHoverEnd}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ItemContextMenu
          item={contextMenu.item}
          mode={mode}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onAction={handleContextAction}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Built-in item tooltip (rendered via portal) */}
      {showTooltip && hoveredItem && createPortal(
        <div
          className="item-preview item-preview--floating"
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y - 20}px`,
            transform: 'translate(-50%, -100%)',
            zIndex: 10001,
            pointerEvents: 'none'
          }}
        >
          <ItemTooltip
            item={hoveredItem}
            price={priceInfo[hoveredItem.uniqueId]}
            isBuying={isBuying}
          />
        </div>,
        document.body
      )}
    </div>
  );
};

/**
 * ItemTooltip - Shows detailed item info from item data (JSON-driven)
 * All item info displayed here comes from the item object itself,
 * allowing datapacks to define descriptions, effects, and stats.
 */
const ItemTooltip = ({ item, price, isBuying }) => {
  if (!item) return null;

  const rarityColor = item.rarityColor || RARITY_COLORS[item.rarity] || RARITY_COLORS.common;

  // Format effect text from item effects array (from JSON)
  const formatEffectText = (effect) => {
    if (typeof effect === 'string') return effect;

    // Handle effect objects with type, target, value, duration
    if (effect.type && effect.value !== undefined) {
      const sign = effect.value >= 0 ? '+' : '';
      const duration = effect.duration ? ` (${effect.duration} turns)` : '';
      const target = effect.target ? ` ${effect.target}` : '';
      return `${sign}${effect.value}${target} ${effect.type}${duration}`;
    }

    // Handle simple key-value effects
    if (typeof effect === 'object') {
      return Object.entries(effect)
        .map(([key, val]) => {
          if (key === 'type' || key === 'chance') return null;
          const sign = typeof val === 'number' && val >= 0 ? '+' : '';
          return `${sign}${val} ${key}`;
        })
        .filter(Boolean)
        .join(', ');
    }

    return JSON.stringify(effect);
  };

  // Get effects to display - check multiple possible locations in item data
  const effects = item.effects || item.useEffects || item.equipEffects || [];
  const hasEffects = Array.isArray(effects) && effects.length > 0;

  // Get stats to display (for equipment)
  const stats = item.finalStats || item.stats || item.bonuses || {};
  const hasStats = Object.keys(stats).length > 0;

  return (
    <div className="item-preview-content">
      <div className="preview-header">
        <span className="preview-name" style={{ color: rarityColor }}>
          {item.name}
        </span>
        {item.level && <span className="preview-level">Lv.{item.level}</span>}
      </div>

      <div className="preview-meta">
        <span className="preview-rarity" style={{ color: rarityColor }}>
          {item.rarity?.charAt(0).toUpperCase() + item.rarity?.slice(1)}
        </span>
        {item.category && (
          <span className="preview-category"> - {item.category}</span>
        )}
        {item.slot && (
          <span className="preview-slot"> ({item.slot})</span>
        )}
      </div>

      {/* Description from item data */}
      {item.description && (
        <p className="preview-description">{item.description}</p>
      )}

      {/* Item effects from JSON (for consumables, etc.) */}
      {hasEffects && (
        <div className="preview-effects">
          <span className="effects-label">Effects:</span>
          <ul className="effects-list">
            {effects.map((effect, index) => (
              <li key={index} className="effect-item">
                {formatEffectText(effect)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Equipment stats from JSON */}
      {hasStats && (
        <div className="preview-stats">
          {Object.entries(stats).map(([stat, value]) => (
            <div key={stat} className="preview-stat">
              <span className="stat-name">{stat}:</span>
              <span className={`stat-value ${value >= 0 ? 'positive' : 'negative'}`}>
                {value >= 0 ? '+' : ''}{value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Item tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="preview-tags">
          {item.tags.slice(0, 4).map(tag => (
            <span key={tag} className="preview-tag">{tag}</span>
          ))}
        </div>
      )}

      {/* Price display (for merchant contexts) */}
      {price !== undefined && (
        <div className="preview-price">
          <span className="price-label">{isBuying ? 'Buy:' : 'Sell:'}</span>
          <span className="price-value">{price}g</span>
        </div>
      )}

      {/* Base value (for non-merchant contexts) */}
      {price === undefined && item.baseValue && (
        <div className="preview-value">
          <span className="value-label">Value:</span>
          <span className="value-amount">{item.baseValue}g</span>
        </div>
      )}
    </div>
  );
};

export default UniversalInventory;
