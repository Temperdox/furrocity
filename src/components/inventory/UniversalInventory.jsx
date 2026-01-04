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
 *
 * @module components/inventory/UniversalInventory
 * @see InventoryItem - Individual item display
 * @see InventoryFilters - Filter sidebar
 * @see ItemContextMenu - Right-click menu
 */

import React, { useState, useMemo, useCallback } from 'react';
import InventoryItem from './InventoryItem.jsx';
import InventoryFilters from './InventoryFilters.jsx';
import ItemContextMenu from './ItemContextMenu.jsx';
import './UniversalInventory.css';

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
  disabledCheck,
  selectedItems = [],
  onSelectionChange,
  gold,
  showFilters = true,
  priceInfo = {},
  isBuying = false,
  emptyMessage = 'No items'
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

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
    </div>
  );
};

export default UniversalInventory;
