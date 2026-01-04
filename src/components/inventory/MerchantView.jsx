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

import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
 * @param {Object} props.merchant - Merchant data
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

  return (
    <div className="merchant-view">
      {/* Header */}
      <div className="merchant-header">
        <div className="merchant-info">
          <h2 className="merchant-name">{merchant.name}</h2>
          <p className="merchant-greeting">{greeting}</p>
        </div>
        <div className="player-gold">
          <span className="gold-icon">G</span>
          <span className="gold-amount">{(playerState.gold || 0).toLocaleString()}</span>
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
            gold={undefined}
            onItemClick={handleMerchantItemClick}
            onItemDoubleClick={handleMerchantItemDoubleClick}
            onContextAction={handleMerchantContextAction}
            disabledCheck={canAffordCheck}
            selectedItems={selectedMerchantItem ? [selectedMerchantItem.uniqueId] : []}
            priceInfo={merchantPriceInfo}
            isBuying={true}
            emptyMessage="Nothing for sale"
          />
        </div>

        {/* Player Inventory */}
        <div className="player-panel">
          <UniversalInventory
            mode="merchant"
            items={playerState.inventory || []}
            title="Your Inventory"
            gold={playerState.gold}
            onItemClick={handlePlayerItemClick}
            onItemDoubleClick={handlePlayerItemDoubleClick}
            onContextAction={handlePlayerContextAction}
            disabledCheck={canSellCheck}
            selectedItems={selectedPlayerItem ? [selectedPlayerItem.uniqueId] : []}
            priceInfo={playerPriceInfo}
            isBuying={false}
            emptyMessage="Your inventory is empty"
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

      {/* Selected item preview */}
      {(selectedMerchantItem || selectedPlayerItem) && (
        <div className="item-preview">
          <ItemPreview
            item={selectedMerchantItem || selectedPlayerItem}
            price={selectedMerchantItem
              ? merchantPriceInfo[selectedMerchantItem.uniqueId]
              : playerPriceInfo[selectedPlayerItem?.uniqueId]}
            isBuying={!!selectedMerchantItem}
            merchant={merchant}
            playerState={playerState}
            merchantSystem={merchantSystem}
          />
        </div>
      )}
    </div>
  );
};

/**
 * ItemPreview - Shows detailed item info when selected
 */
const ItemPreview = ({ item, price, isBuying, merchant, playerState, merchantSystem }) => {
  if (!item) return null;

  const dealQuality = merchantSystem.evaluateDeal(item, merchant, playerState, isBuying);

  return (
    <div className="item-preview-content">
      <div className="preview-header">
        <span className="preview-name" style={{ color: item.rarityColor || '#e0e0e0' }}>
          {item.name}
        </span>
        {item.level && <span className="preview-level">Lv.{item.level}</span>}
      </div>

      <div className="preview-rarity" style={{ color: item.rarityColor }}>
        {item.rarity?.charAt(0).toUpperCase() + item.rarity?.slice(1)}
      </div>

      <p className="preview-description">{item.description}</p>

      {item.finalStats && Object.keys(item.finalStats).length > 0 && (
        <div className="preview-stats">
          {Object.entries(item.finalStats).map(([stat, value]) => (
            <div key={stat} className="preview-stat">
              <span className="stat-name">{stat}:</span>
              <span className={`stat-value ${value >= 0 ? 'positive' : 'negative'}`}>
                {value >= 0 ? '+' : ''}{value}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="preview-price">
        <span className="price-label">{isBuying ? 'Buy Price:' : 'Sell Price:'}</span>
        <span className="price-value">{price}g</span>
        <span className="deal-quality" style={{ color: dealQuality.color }}>
          {dealQuality.label}
        </span>
      </div>
    </div>
  );
};

export default MerchantView;
