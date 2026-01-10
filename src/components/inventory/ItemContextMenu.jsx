/**
 * @fileoverview ItemContextMenu - Right-click context menu for items
 *
 * Provides context-aware actions for inventory items. The menu content
 * changes based on the inventory mode (player, merchant, storage, quest).
 *
 * IMPORTANT: Favorite and Junk options are ALWAYS displayed at the top
 * of the menu for quick access (per user requirement).
 *
 * Uses Floating UI for intelligent positioning that stays within viewport.
 *
 * @module components/inventory/ItemContextMenu
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
} from '@floating-ui/react';

/**
 * ItemContextMenu - Right-click context menu for inventory items
 * @component
 *
 * Menu Structure (Favorite and Junk always at top):
 * - Toggle Favorite
 * - Toggle Junk
 * - separator
 * - Use (if consumable)
 * - Equip/Unequip (if equippable)
 * - Drop
 * - Examine
 *
 * Different modes show different options:
 * - player: All options
 * - merchant: Buy/Sell only
 * - storage: Take/Store
 * - quest: Examine only
 */
const ItemContextMenu = ({
  item,
  mode = 'player',
  position,
  onAction,
  onClose
}) => {
  const menuRef = useRef(null);

  // Create a virtual reference element at the click position for Floating UI
  const virtualRef = useRef({
    getBoundingClientRect() {
      return {
        x: position.x,
        y: position.y,
        top: position.y,
        left: position.x,
        bottom: position.y,
        right: position.x,
        width: 0,
        height: 0,
      };
    },
  });

  // Update virtual reference when position changes
  useEffect(() => {
    virtualRef.current = {
      getBoundingClientRect() {
        return {
          x: position.x,
          y: position.y,
          top: position.y,
          left: position.x,
          bottom: position.y,
          right: position.x,
          width: 0,
          height: 0,
        };
      },
    };
  }, [position]);

  // Use Floating UI for intelligent positioning
  const { refs, floatingStyles } = useFloating({
    elements: {
      reference: virtualRef.current,
    },
    placement: 'bottom-start',
    middleware: [
      offset(4), // Small offset from click point
      flip({ padding: 10 }), // Flip to opposite side if not enough space
      shift({ padding: 10 }), // Shift along axis to stay in viewport
    ],
    whileElementsMounted: autoUpdate,
  });

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (refs.floating.current && !refs.floating.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, refs.floating]);

  const handleAction = useCallback((action) => {
    onAction(action, item);
  }, [item, onAction]);

  // Build menu items based on mode
  const buildMenuItems = () => {
    const items = [];

    // FAVORITE AND JUNK ALWAYS AT TOP (per user requirement)
    if (mode === 'player') {
      items.push({
        id: 'favorite',
        label: item.userFlags?.favorite ? 'Unfavorite' : 'Favorite',
        icon: item.userFlags?.favorite ? '[-]' : '[+]',
        action: 'toggleFavorite'
      });

      items.push({
        id: 'junk',
        label: item.userFlags?.junk ? 'Unmark Junk' : 'Mark as Junk',
        icon: 'J',
        action: 'toggleJunk'
      });

      items.push({ id: 'sep1', separator: true });
    }

    // Mode-specific options
    switch (mode) {
      case 'player':
        // Use option (for consumables)
        if (item.category === 'consumable' || item.useEffect) {
          items.push({
            id: 'use',
            label: 'Use',
            icon: 'U',
            action: 'use'
          });
        }

        // Equip option (for equippable items)
        if (item.slot) {
          items.push({
            id: 'equip',
            label: 'Equip',
            icon: 'E',
            action: 'equip'
          });
        }

        // Drop option (unless quest item)
        if (!item.questItem && !item.playerBound) {
          items.push({
            id: 'drop',
            label: 'Drop',
            icon: 'D',
            action: 'drop'
          });
        }
        break;

      case 'merchant':
        // Sell option (player inventory at merchant)
        if (!item.questItem && !item.playerBound && item.canSell !== false) {
          items.push({
            id: 'sell',
            label: 'Sell',
            icon: 'S',
            action: 'sell'
          });
        }
        break;

      case 'merchant-stock':
        // Buy option (merchant inventory)
        items.push({
          id: 'buy',
          label: 'Buy',
          icon: 'B',
          action: 'buy'
        });
        break;

      case 'storage':
        items.push({
          id: 'take',
          label: 'Take',
          icon: 'T',
          action: 'take'
        });
        break;

      case 'player-storage':
        items.push({
          id: 'store',
          label: 'Store',
          icon: 'S',
          action: 'store'
        });
        break;

      case 'quest':
        // Quest mode only allows examine
        break;
    }

    // Examine option (always available)
    items.push({
      id: 'examine',
      label: 'Examine',
      icon: '?',
      action: 'examine'
    });

    return items;
  };

  const menuItems = buildMenuItems();

  // Use portal to render at document.body level to avoid transform issues
  return createPortal(
    <div
      ref={refs.setFloating}
      className="context-menu"
      style={{
        ...floatingStyles,
        zIndex: 10000
      }}
    >
      {/* Item header */}
      <div className="context-menu-header">
        <span
          className="context-menu-item-name"
          style={{ color: item.rarityColor || '#e0e0e0' }}
        >
          {item.name}
        </span>
        {item.count > 1 && (
          <span className="context-menu-item-count">x{item.count}</span>
        )}
      </div>

      {/* Menu items */}
      <div className="context-menu-items">
        {menuItems.map((menuItem) => {
          if (menuItem.separator) {
            return <div key={menuItem.id} className="context-menu-separator" />;
          }

          return (
            <button
              key={menuItem.id}
              className="context-menu-item"
              onClick={() => handleAction(menuItem.action)}
            >
              <span className="context-menu-icon">{menuItem.icon}</span>
              <span className="context-menu-label">{menuItem.label}</span>
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
};

export default ItemContextMenu;
