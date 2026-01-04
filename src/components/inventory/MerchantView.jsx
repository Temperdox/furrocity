/**
 * @fileoverview MerchantView - Side-by-side merchant trading interface
 *
 * This component provides the main trading UI showing:
 * - Merchant's available stock (left panel)
 * - Player's inventory (right panel)
 * - Gold display and transaction messages
 * - Auto-sell junk functionality
 * - Deal quality indicators
 *
 * @module components/inventory/MerchantView
 * @see UniversalInventory - Core inventory component
 * @see MerchantSystem - Trading logic
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import UniversalInventory from './UniversalInventory.jsx';
import './UniversalInventory.css';

/**
 * MerchantView - Side-by-side trading interface
 * @component
 *
 * Layout:
 * +------------------------------------------+
 * | [Merchant Name]       [Player Gold: 500] |
 * +-------------------+----------------------+
 * | MERCHANT STOCK    | YOUR INVENTORY       |
 * | [Filters]         | [Filters]            |
 * | [Items Grid]      | [Items Grid]         |
 * +-------------------+----------------------+
 * | [Auto-sell Junk]               [Close]   |
 * +------------------------------------------+
 *
 * @param {Object} props
 * @param {Object} props.merchant - Merchant data (should include gold property)
 * @param {Array} props.merchantStock - Merchant's items for sale
 * @param {Object} props.playerState - Player state
 * @param {Object} props.merchantSystem - MerchantSystem instance
 * @param {Object} props.inventorySystem - InventorySystem instance
 * @param {Function} props.onTransaction - Callback after buy/sell
 * @param {Function} props.onClose - Close handler
 */
const MerchantView = ({
  merchant,
  merchantStock = [],
  playerState,
  merchantSystem,
  inventorySystem,
  onTransaction,
  onClose
}) => {
  const [selectedMerchantItem, setSelectedMerchantItem] = useState(null);
  const [selectedPlayerItem, setSelectedPlayerItem] = useState(null);
  const [transactionMessage, setTransactionMessage] = useState(null);
  // Hover state for showing item preview on hover
  const [hoveredMerchantItem, setHoveredMerchantItem] = useState(null);
  const [hoveredPlayerItem, setHoveredPlayerItem] = useState(null);
  // Tooltip position tracking - updates live with mouse movement
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Track mouse movement globally when hovering an item
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (hoveredMerchantItem || hoveredPlayerItem) {
        setTooltipPosition({ x: e.clientX, y: e.clientY });
      }
    };

    if (hoveredMerchantItem || hoveredPlayerItem) {
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [hoveredMerchantItem, hoveredPlayerItem]);

  // Calculate prices for merchant stock (player buying)
  const merchantPriceInfo = useMemo(() => {
    const prices = {};
    for (const item of merchantStock) {
      prices[item.uniqueId] = merchantSystem.calculateBuyPrice(item, merchant, playerState);
    }
    return prices;
  }, [merchantStock, merchant, playerState, merchantSystem]);

  // Calculate prices for player inventory (player selling)
  const playerPriceInfo = useMemo(() => {
    const prices = {};
    for (const item of playerState.inventory || []) {
      const canSell = merchantSystem.canPlayerSellItem(item, merchant);
      if (canSell.canSell) {
        prices[item.uniqueId] = merchantSystem.calculateSellPrice(item, merchant, playerState);
      }
    }
    return prices;
  }, [playerState.inventory, merchant, playerState, merchantSystem]);

  // Check if player can afford an item
  const canAffordCheck = useCallback((item) => {
    const price = merchantPriceInfo[item.uniqueId];
    if ((playerState.gold || 0) < price) {
      return { disabled: true, reason: `Not enough gold (need ${price}g)` };
    }
    return { disabled: false, reason: null };
  }, [merchantPriceInfo, playerState.gold]);

  // Check if player can sell an item
  const canSellCheck = useCallback((item) => {
    const result = merchantSystem.canPlayerSellItem(item, merchant);
    return {
      disabled: !result.canSell,
      reason: result.reason
    };
  }, [merchantSystem, merchant]);

  // Handle buying from merchant
  const handleBuy = useCallback(async (item) => {
    const result = await merchantSystem.buyFromMerchant(
      merchant,
      item,
      playerState,
      1
    );

    if (result.success) {
      setTransactionMessage({
        type: 'success',
        text: `Bought ${item.name} for ${result.price}g`
      });
      if (onTransaction) onTransaction('buy', result);
    } else {
      setTransactionMessage({
        type: 'error',
        text: result.error
      });
    }

    // Clear message after 3 seconds
    setTimeout(() => setTransactionMessage(null), 3000);
  }, [merchant, playerState, merchantSystem, onTransaction]);

  // Handle selling to merchant
  const handleSell = useCallback(async (item) => {
    const result = await merchantSystem.sellToMerchant(
      merchant,
      item,
      playerState,
      1
    );

    if (result.success) {
      setTransactionMessage({
        type: 'success',
        text: `Sold ${item.name} for ${result.price}g`
      });
      if (onTransaction) onTransaction('sell', result);
    } else {
      setTransactionMessage({
        type: 'error',
        text: result.error
      });
    }

    setTimeout(() => setTransactionMessage(null), 3000);
  }, [merchant, playerState, merchantSystem, onTransaction]);

  // Handle auto-sell junk
  const handleAutoSellJunk = useCallback(async () => {
    const result = await merchantSystem.autoSellJunk(merchant, playerState);

    if (result.soldCount > 0) {
      setTransactionMessage({
        type: 'success',
        text: `Sold ${result.soldCount} junk items for ${result.totalGold}g`
      });
      if (onTransaction) onTransaction('autoSellJunk', result);
    } else {
      setTransactionMessage({
        type: 'info',
        text: 'No junk items to sell'
      });
    }

    setTimeout(() => setTransactionMessage(null), 3000);
  }, [merchant, playerState, merchantSystem, onTransaction]);

  // Handle item clicks
  const handleMerchantItemClick = useCallback((item) => {
    setSelectedMerchantItem(item);
    setSelectedPlayerItem(null);
  }, []);

  const handlePlayerItemClick = useCallback((item) => {
    setSelectedPlayerItem(item);
    setSelectedMerchantItem(null);
  }, []);

  // Handle item hover (for showing preview tooltip)
  const handleMerchantItemHover = useCallback((item, event) => {
    setHoveredMerchantItem(item);
    setHoveredPlayerItem(null);
    if (event) {
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    }
  }, []);

  const handlePlayerItemHover = useCallback((item, event) => {
    setHoveredPlayerItem(item);
    setHoveredMerchantItem(null);
    if (event) {
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    }
  }, []);

  const handleItemHoverEnd = useCallback(() => {
    setHoveredMerchantItem(null);
    setHoveredPlayerItem(null);
  }, []);

  // Handle double-click to buy/sell
  const handleMerchantItemDoubleClick = useCallback((item) => {
    handleBuy(item);
  }, [handleBuy]);

  const handlePlayerItemDoubleClick = useCallback((item) => {
    const canSell = merchantSystem.canPlayerSellItem(item, merchant);
    if (canSell.canSell) {
      handleSell(item);
    }
  }, [handleSell, merchantSystem, merchant]);

  // Handle context menu actions
  const handleMerchantContextAction = useCallback((action, item) => {
    if (action === 'buy') {
      handleBuy(item);
    } else if (action === 'examine') {
      // Could show item details modal
      console.log('Examine:', item);
    }
  }, [handleBuy]);

  const handlePlayerContextAction = useCallback((action, item) => {
    switch (action) {
      case 'sell':
        handleSell(item);
        break;
      case 'toggleFavorite':
        inventorySystem.toggleFavorite(playerState.inventory, item.uniqueId);
        if (onTransaction) onTransaction('flagChange', { item, action });
        break;
      case 'toggleJunk':
        inventorySystem.toggleJunk(playerState.inventory, item.uniqueId);
        if (onTransaction) onTransaction('flagChange', { item, action });
        break;
      case 'examine':
        console.log('Examine:', item);
        break;
    }
  }, [handleSell, inventorySystem, playerState.inventory, onTransaction]);

  // Count junk items
  const junkCount = useMemo(() => {
    return (playerState.inventory || []).filter(
      item => item.userFlags?.junk && merchantSystem.canPlayerSellItem(item, merchant).canSell
    ).length;
  }, [playerState.inventory, merchantSystem, merchant]);

  // Get merchant dialogue
  const greeting = merchant.dialogue?.greeting || 'What can I do for you?';

  // Merchant's available gold for buying items from player
  const merchantGold = merchant.gold ?? 1000; // Default to 1000 if not specified

  return (
    <div className="merchant-view" ref={containerRef}>
      {/* Header */}
      <div className="merchant-header">
        <div className="merchant-info">
          <h2 className="merchant-name">{merchant.name}</h2>
          <p className="merchant-greeting">{greeting}</p>
        </div>
      </div>

      {/* Transaction message */}
      {transactionMessage && (
        <div className={`transaction-message transaction-message--${transactionMessage.type}`}>
          {transactionMessage.text}
        </div>
      )}

      {/* Side-by-side inventories */}
      <div className="merchant-inventories">
        {/* Merchant Stock */}
        <div className="merchant-panel">
          <UniversalInventory
            mode="merchant-stock"
            items={merchantStock}
            title={`${merchant.name}'s Wares`}
            gold={merchantGold}
            onItemClick={handleMerchantItemClick}
            onItemDoubleClick={handleMerchantItemDoubleClick}
            onContextAction={handleMerchantContextAction}
            onItemHover={handleMerchantItemHover}
            onItemHoverEnd={handleItemHoverEnd}
            disabledCheck={canAffordCheck}
            selectedItems={selectedMerchantItem ? [selectedMerchantItem.uniqueId] : []}
            priceInfo={merchantPriceInfo}
            isBuying={true}
            emptyMessage="Nothing for sale"
            showTooltip={false}
          />
        </div>

        {/* Player Inventory */}
        <div className="player-panel">
          <UniversalInventory
            mode="merchant"
            items={playerState.inventory || []}
            title="Your Inventory"
            gold={playerState.gold || 0}
            onItemClick={handlePlayerItemClick}
            onItemDoubleClick={handlePlayerItemDoubleClick}
            onContextAction={handlePlayerContextAction}
            onItemHover={handlePlayerItemHover}
            onItemHoverEnd={handleItemHoverEnd}
            disabledCheck={canSellCheck}
            selectedItems={selectedPlayerItem ? [selectedPlayerItem.uniqueId] : []}
            priceInfo={playerPriceInfo}
            isBuying={false}
            emptyMessage="Your inventory is empty"
            showTooltip={false}
          />
        </div>
      </div>

      {/* Footer actions */}
      <div className="merchant-footer">
        <div className="merchant-actions-left">
          <button
            className="merchant-btn merchant-btn--junk"
            onClick={handleAutoSellJunk}
            disabled={junkCount === 0}
          >
            Auto-sell Junk ({junkCount})
          </button>
        </div>
        <div className="merchant-actions-right">
          <button
            className="merchant-btn merchant-btn--close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>

      {/* Hovered item preview (shows on hover, rendered via portal, follows cursor) */}
      {(hoveredMerchantItem || hoveredPlayerItem) && createPortal(
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
          <ItemPreview
            item={hoveredMerchantItem || hoveredPlayerItem}
            price={hoveredMerchantItem
              ? merchantPriceInfo[hoveredMerchantItem.uniqueId]
              : playerPriceInfo[hoveredPlayerItem?.uniqueId]}
            isBuying={!!hoveredMerchantItem}
            merchant={merchant}
            playerState={playerState}
            merchantSystem={merchantSystem}
          />
        </div>,
        document.body
      )}
    </div>
  );
};

/**
 * ItemPreview - Shows detailed item info from item data (JSON-driven)
 * All item info displayed here comes from the item object itself,
 * allowing datapacks to define descriptions, effects, and stats.
 */
const ItemPreview = ({ item, price, isBuying, merchant, playerState, merchantSystem }) => {
  if (!item) return null;

  const dealQuality = merchantSystem?.evaluateDeal?.(item, merchant, playerState, isBuying)
    || { label: '', color: '#888' };

  // Get rarity color from item or derive from rarity name
  const RARITY_COLORS = {
    common: '#9ca3af',
    uncommon: '#22c55e',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f97316',
    mythic: '#ffd700',
    divine: '#fef3c7'
  };
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

      {/* Price and deal quality */}
      {price !== undefined && (
        <div className="preview-price">
          <span className="price-label">{isBuying ? 'Buy:' : 'Sell:'}</span>
          <span className="price-value">{price}g</span>
          {dealQuality.label && (
            <span className="deal-quality" style={{ color: dealQuality.color }}>
              {dealQuality.label}
            </span>
          )}
        </div>
      )}

      {/* Base value if available */}
      {item.baseValue && !price && (
        <div className="preview-value">
          <span className="value-label">Value:</span>
          <span className="value-amount">{item.baseValue}g</span>
        </div>
      )}
    </div>
  );
};

export default MerchantView;
