/**
 * Debug Menu Component
 * Allows manipulation of saved game data, stats, inventory, etc.
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const DebugMenu = ({
  onClose,
  SaveSystem,
  GameData,
  onLoadAndEdit
}) => {
  const [activeTab, setActiveTab] = useState('saves');
  const [saves, setSaves] = useState([]);
  const [selectedSave, setSelectedSave] = useState(null);
  const [editedPlayer, setEditedPlayer] = useState(null);
  const [editedGameState, setEditedGameState] = useState(null);
  const [itemSearch, setItemSearch] = useState('');
  const [addItemId, setAddItemId] = useState('');
  const [addItemCount, setAddItemCount] = useState(1);
  const [message, setMessage] = useState(null);

  // Load saves on mount
  useEffect(() => {
    const loadedSaves = SaveSystem.listSaves();
    setSaves(loadedSaves);
  }, [SaveSystem]);

  // Load selected save data
  const handleLoadSave = (slot) => {
    const saveData = SaveSystem.load(slot);
    if (saveData) {
      setSelectedSave(slot);
      setEditedPlayer(JSON.parse(JSON.stringify(saveData.player)));
      setEditedGameState(JSON.parse(JSON.stringify(saveData.game)));
      setMessage({ type: 'success', text: `Loaded save: ${saveData.player.name}` });
    } else {
      setMessage({ type: 'error', text: 'Failed to load save' });
    }
  };

  // Save changes
  const handleSaveChanges = () => {
    if (!selectedSave || !editedPlayer) return;

    const success = SaveSystem.save(selectedSave, editedPlayer, editedGameState);
    if (success) {
      setMessage({ type: 'success', text: 'Changes saved successfully!' });
      setSaves(SaveSystem.listSaves());
    } else {
      setMessage({ type: 'error', text: 'Failed to save changes' });
    }
  };

  // Update stat
  const handleStatChange = (statPath, value) => {
    setEditedPlayer(prev => {
      const newPlayer = { ...prev };
      const parts = statPath.split('.');
      let current = newPlayer;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      return newPlayer;
    });
  };

  // Add item to inventory
  const handleAddItem = () => {
    if (!addItemId || !editedPlayer) return;

    const itemDef = GameData?.items?.find(i => i.id === addItemId);
    if (!itemDef) {
      setMessage({ type: 'error', text: `Item not found: ${addItemId}` });
      return;
    }

    const newItem = {
      ...itemDef,
      instanceId: `${addItemId}_${Date.now()}`,
      count: addItemCount
    };

    setEditedPlayer(prev => ({
      ...prev,
      inventory: [...(prev.inventory || []), newItem]
    }));
    setMessage({ type: 'success', text: `Added ${addItemCount}x ${itemDef.name}` });
    setAddItemId('');
    setAddItemCount(1);
  };

  // Remove item from inventory
  const handleRemoveItem = (index) => {
    setEditedPlayer(prev => ({
      ...prev,
      inventory: prev.inventory.filter((_, i) => i !== index)
    }));
  };

  // Available items for adding
  const availableItems = GameData?.items || [];
  const filteredItems = availableItems.filter(item =>
    item.name?.toLowerCase().includes(itemSearch.toLowerCase()) ||
    item.id?.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const tabs = [
    { id: 'saves', label: 'Save Files' },
    { id: 'stats', label: 'Player Stats' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'flags', label: 'Game Flags' },
    { id: 'locations', label: 'Locations' },
    { id: 'nsfw', label: 'NSFW Stats' }
  ];

  const modalContent = (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Debug Menu</h2>
          <button style={styles.closeBtn} onClick={onClose}>X</button>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            ...styles.message,
            background: message.type === 'success' ? 'rgba(0, 200, 100, 0.2)' : 'rgba(200, 50, 50, 0.2)',
            borderColor: message.type === 'success' ? '#00c864' : '#c83232'
          }}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div style={styles.tabs}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : {})
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={styles.content}>
          {activeTab === 'saves' && (
            <div>
              <h3 style={styles.sectionTitle}>Select a Save to Edit</h3>
              <div style={styles.saveList}>
                {saves.length === 0 ? (
                  <p style={styles.emptyText}>No saves found</p>
                ) : (
                  saves.map(save => (
                    <div
                      key={save.slot}
                      style={{
                        ...styles.saveItem,
                        ...(selectedSave === save.slot ? styles.saveItemSelected : {})
                      }}
                      onClick={() => handleLoadSave(save.slot)}
                    >
                      <div style={styles.saveName}>{save.playerName || 'Unknown'}</div>
                      <div style={styles.saveInfo}>
                        Level {save.level} - {save.location || 'Unknown'}
                      </div>
                      <div style={styles.saveDate}>
                        {new Date(save.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'stats' && editedPlayer && (
            <div>
              <h3 style={styles.sectionTitle}>Player Stats</h3>
              <div style={styles.statsGrid}>
                <StatInput
                  label="Name"
                  value={editedPlayer.name || ''}
                  onChange={(v) => handleStatChange('name', v)}
                  type="text"
                />
                <StatInput
                  label="Level"
                  value={editedPlayer.level || 1}
                  onChange={(v) => handleStatChange('level', parseInt(v) || 1)}
                  type="number"
                />
                <StatInput
                  label="Experience"
                  value={editedPlayer.experience || 0}
                  onChange={(v) => handleStatChange('experience', parseInt(v) || 0)}
                  type="number"
                />
                <StatInput
                  label="Gold"
                  value={editedPlayer.gold || 0}
                  onChange={(v) => handleStatChange('gold', parseInt(v) || 0)}
                  type="number"
                />
                <StatInput
                  label="Current HP"
                  value={editedPlayer.currentHp || 100}
                  onChange={(v) => handleStatChange('currentHp', parseInt(v) || 100)}
                  type="number"
                />
                <StatInput
                  label="Max HP"
                  value={editedPlayer.maxHp || 100}
                  onChange={(v) => handleStatChange('maxHp', parseInt(v) || 100)}
                  type="number"
                />
                <StatInput
                  label="Current Stamina"
                  value={editedPlayer.currentStamina || 100}
                  onChange={(v) => handleStatChange('currentStamina', parseInt(v) || 100)}
                  type="number"
                />
                <StatInput
                  label="Max Stamina"
                  value={editedPlayer.maxStamina || 100}
                  onChange={(v) => handleStatChange('maxStamina', parseInt(v) || 100)}
                  type="number"
                />
              </div>

              <h4 style={styles.subTitle}>Base Stats</h4>
              <div style={styles.statsGrid}>
                {editedPlayer.stats && Object.keys(editedPlayer.stats).map(stat => (
                  <StatInput
                    key={stat}
                    label={stat.charAt(0).toUpperCase() + stat.slice(1)}
                    value={editedPlayer.stats[stat] || 0}
                    onChange={(v) => handleStatChange(`stats.${stat}`, parseInt(v) || 0)}
                    type="number"
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && editedPlayer && (
            <div>
              <h3 style={styles.sectionTitle}>Inventory Management</h3>

              {/* Add Item Section */}
              <div style={styles.addItemSection}>
                <h4 style={styles.subTitle}>Add Item</h4>
                <input
                  type="text"
                  placeholder="Search items..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  style={styles.searchInput}
                />
                <div style={styles.itemSelect}>
                  <select
                    value={addItemId}
                    onChange={(e) => setAddItemId(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">Select an item...</option>
                    {filteredItems.slice(0, 50).map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.id})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={addItemCount}
                    onChange={(e) => setAddItemCount(parseInt(e.target.value) || 1)}
                    style={styles.countInput}
                  />
                  <button style={styles.addBtn} onClick={handleAddItem}>Add</button>
                </div>
              </div>

              {/* Current Inventory */}
              <h4 style={styles.subTitle}>Current Inventory ({editedPlayer.inventory?.length || 0} items)</h4>
              <div style={styles.inventoryList}>
                {(!editedPlayer.inventory || editedPlayer.inventory.length === 0) ? (
                  <p style={styles.emptyText}>Inventory is empty</p>
                ) : (
                  editedPlayer.inventory.map((item, index) => (
                    <div key={item.instanceId || index} style={styles.inventoryItem}>
                      <span style={styles.itemName}>
                        {item.name || item.id} {item.count > 1 ? `x${item.count}` : ''}
                      </span>
                      <span style={styles.itemRarity}>{item.rarity || 'common'}</span>
                      <button
                        style={styles.removeBtn}
                        onClick={() => handleRemoveItem(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'flags' && editedGameState && (
            <div>
              <h3 style={styles.sectionTitle}>Game Flags</h3>
              <div style={styles.flagsContainer}>
                <h4 style={styles.subTitle}>Current Flags</h4>
                <div style={styles.flagsList}>
                  {editedGameState.flags && Object.entries(editedGameState.flags).map(([key, value]) => (
                    <div key={key} style={styles.flagItem}>
                      <span style={styles.flagKey}>{key}</span>
                      <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => {
                          setEditedGameState(prev => ({
                            ...prev,
                            flags: { ...prev.flags, [key]: e.target.checked }
                          }));
                        }}
                        style={styles.checkbox}
                      />
                    </div>
                  ))}
                </div>

                <h4 style={styles.subTitle}>Add New Flag</h4>
                <div style={styles.addFlagRow}>
                  <input
                    type="text"
                    placeholder="Flag name..."
                    id="newFlagName"
                    style={styles.flagInput}
                  />
                  <button
                    style={styles.addBtn}
                    onClick={() => {
                      const input = document.getElementById('newFlagName');
                      if (input.value) {
                        setEditedGameState(prev => ({
                          ...prev,
                          flags: { ...prev.flags, [input.value]: true }
                        }));
                        input.value = '';
                      }
                    }}
                  >
                    Add Flag
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'locations' && editedPlayer && (
            <div>
              <h3 style={styles.sectionTitle}>Location Management</h3>
              <StatInput
                label="Current Location"
                value={editedPlayer.currentLocation || ''}
                onChange={(v) => handleStatChange('currentLocation', v)}
                type="text"
              />
              <StatInput
                label="Current Region"
                value={editedPlayer.currentRegion || ''}
                onChange={(v) => handleStatChange('currentRegion', v)}
                type="text"
              />

              <h4 style={styles.subTitle}>Discovered Locations</h4>
              <div style={styles.locationsList}>
                {editedGameState?.locations_discovered?.map((loc, i) => (
                  <div key={i} style={styles.locationItem}>
                    <span>{loc}</span>
                    <button
                      style={styles.removeBtn}
                      onClick={() => {
                        setEditedGameState(prev => ({
                          ...prev,
                          locations_discovered: prev.locations_discovered.filter((_, idx) => idx !== i)
                        }));
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'nsfw' && editedPlayer && (
            <div>
              <h3 style={styles.sectionTitle}>NSFW Stats</h3>
              <div style={styles.statsGrid}>
                <StatInput
                  label="Corruption"
                  value={editedPlayer.nsfwStats?.corruption || 0}
                  onChange={(v) => handleStatChange('nsfwStats.corruption', parseInt(v) || 0)}
                  type="number"
                  min={0}
                  max={100}
                />
                <StatInput
                  label="Arousal"
                  value={editedPlayer.nsfwStats?.arousal || 0}
                  onChange={(v) => handleStatChange('nsfwStats.arousal', parseInt(v) || 0)}
                  type="number"
                  min={0}
                  max={100}
                />
                <StatInput
                  label="Lust"
                  value={editedPlayer.nsfwStats?.lust || 0}
                  onChange={(v) => handleStatChange('nsfwStats.lust', parseInt(v) || 0)}
                  type="number"
                  min={0}
                  max={100}
                />
                <StatInput
                  label="Sensitivity"
                  value={editedPlayer.nsfwStats?.sensitivity || 50}
                  onChange={(v) => handleStatChange('nsfwStats.sensitivity', parseInt(v) || 50)}
                  type="number"
                  min={0}
                  max={100}
                />
              </div>

              <h4 style={styles.subTitle}>Body Modifications</h4>
              <div style={styles.statsGrid}>
                <StatInput
                  label="Bust Size"
                  value={editedPlayer.nsfwStats?.bodyMods?.bustSize || 0}
                  onChange={(v) => handleStatChange('nsfwStats.bodyMods.bustSize', parseFloat(v) || 0)}
                  type="number"
                  step="0.5"
                />
                <StatInput
                  label="Hip Size"
                  value={editedPlayer.nsfwStats?.bodyMods?.hipSize || 0}
                  onChange={(v) => handleStatChange('nsfwStats.bodyMods.hipSize', parseFloat(v) || 0)}
                  type="number"
                  step="0.5"
                />
                <StatInput
                  label="Masculinity"
                  value={editedPlayer.nsfwStats?.bodyMods?.masculinity || 50}
                  onChange={(v) => handleStatChange('nsfwStats.bodyMods.masculinity', parseInt(v) || 50)}
                  type="number"
                  min={0}
                  max={100}
                />
              </div>
            </div>
          )}

          {!editedPlayer && activeTab !== 'saves' && (
            <div style={styles.noSaveSelected}>
              <p>Please select a save file to edit from the "Save Files" tab</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {editedPlayer && (
          <div style={styles.footer}>
            <button style={styles.saveBtn} onClick={handleSaveChanges}>
              Save Changes
            </button>
            <button style={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// Stat Input Component
const StatInput = ({ label, value, onChange, type = 'number', min, max, step }) => (
  <div style={styles.statInput}>
    <label style={styles.statLabel}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={min}
      max={max}
      step={step}
      style={styles.input}
    />
  </div>
);

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '2rem'
  },
  modal: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #2d1f3d 100%)',
    borderRadius: '12px',
    border: '2px solid #8b5cf6',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 0 50px rgba(139, 92, 246, 0.3)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid rgba(139, 92, 246, 0.3)'
  },
  title: {
    color: '#fff',
    fontSize: '1.5rem',
    fontFamily: '"Cinzel", serif',
    margin: 0
  },
  closeBtn: {
    background: 'rgba(200, 50, 50, 0.6)',
    border: 'none',
    color: 'white',
    width: '32px',
    height: '32px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold'
  },
  message: {
    margin: '0.5rem 1rem',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid',
    color: 'white',
    fontSize: '0.9rem'
  },
  tabs: {
    display: 'flex',
    gap: '0.25rem',
    padding: '0.5rem 1rem',
    borderBottom: '1px solid rgba(139, 92, 246, 0.3)',
    overflowX: 'auto'
  },
  tab: {
    background: 'rgba(139, 92, 246, 0.2)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    color: '#c9a0b8',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease'
  },
  tabActive: {
    background: 'rgba(139, 92, 246, 0.5)',
    color: 'white',
    borderColor: '#8b5cf6'
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '1.5rem'
  },
  sectionTitle: {
    color: '#fff',
    fontSize: '1.1rem',
    marginBottom: '1rem',
    fontFamily: '"Cinzel", serif'
  },
  subTitle: {
    color: '#c9a0b8',
    fontSize: '0.95rem',
    marginTop: '1.5rem',
    marginBottom: '0.75rem'
  },
  saveList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  saveItem: {
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    borderRadius: '6px',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  saveItemSelected: {
    background: 'rgba(139, 92, 246, 0.3)',
    borderColor: '#8b5cf6'
  },
  saveName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1rem'
  },
  saveInfo: {
    color: '#c9a0b8',
    fontSize: '0.85rem',
    marginTop: '0.25rem'
  },
  saveDate: {
    color: '#6b4a5a',
    fontSize: '0.75rem',
    marginTop: '0.25rem'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '0.75rem'
  },
  statInput: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  statLabel: {
    color: '#c9a0b8',
    fontSize: '0.8rem'
  },
  input: {
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '4px',
    padding: '0.5rem',
    color: 'white',
    fontSize: '0.9rem'
  },
  addItemSection: {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '6px',
    padding: '1rem',
    marginBottom: '1rem'
  },
  searchInput: {
    width: '100%',
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '4px',
    padding: '0.5rem',
    color: 'white',
    marginBottom: '0.5rem'
  },
  itemSelect: {
    display: 'flex',
    gap: '0.5rem'
  },
  select: {
    flex: 1,
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '4px',
    padding: '0.5rem',
    color: 'white'
  },
  countInput: {
    width: '70px',
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '4px',
    padding: '0.5rem',
    color: 'white',
    textAlign: 'center'
  },
  addBtn: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '4px',
    padding: '0.5rem 1rem',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  inventoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    maxHeight: '300px',
    overflow: 'auto'
  },
  inventoryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '4px',
    padding: '0.5rem 0.75rem'
  },
  itemName: {
    flex: 1,
    color: 'white',
    fontSize: '0.9rem'
  },
  itemRarity: {
    color: '#8b5cf6',
    fontSize: '0.75rem',
    textTransform: 'uppercase'
  },
  removeBtn: {
    background: 'rgba(200, 50, 50, 0.6)',
    border: 'none',
    borderRadius: '4px',
    padding: '0.25rem 0.5rem',
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.75rem'
  },
  flagsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  flagsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '0.5rem',
    maxHeight: '250px',
    overflow: 'auto'
  },
  flagItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '4px',
    padding: '0.5rem 0.75rem'
  },
  flagKey: {
    color: '#c9a0b8',
    fontSize: '0.85rem'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  addFlagRow: {
    display: 'flex',
    gap: '0.5rem'
  },
  flagInput: {
    flex: 1,
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '4px',
    padding: '0.5rem',
    color: 'white'
  },
  locationsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem'
  },
  locationItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '4px',
    padding: '0.25rem 0.5rem',
    color: '#c9a0b8',
    fontSize: '0.85rem'
  },
  noSaveSelected: {
    textAlign: 'center',
    color: '#6b4a5a',
    padding: '3rem'
  },
  emptyText: {
    color: '#6b4a5a',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '1rem'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    padding: '1rem 1.5rem',
    borderTop: '1px solid rgba(139, 92, 246, 0.3)'
  },
  saveBtn: {
    background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    border: 'none',
    borderRadius: '6px',
    padding: '0.75rem 1.5rem',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.95rem'
  },
  cancelBtn: {
    background: 'rgba(100, 100, 100, 0.4)',
    border: '1px solid rgba(150, 150, 150, 0.3)',
    borderRadius: '6px',
    padding: '0.75rem 1.5rem',
    color: '#ccc',
    cursor: 'pointer',
    fontSize: '0.95rem'
  }
};

export default DebugMenu;
