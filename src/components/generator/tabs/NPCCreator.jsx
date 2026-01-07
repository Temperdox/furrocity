import React, { useState, useEffect } from 'react';

const styles = {
  container: {
    display: 'flex',
    gap: '20px',
    height: '100%',
  },
  formSection: {
    flex: '1',
    backgroundColor: '#252540',
    borderRadius: '8px',
    padding: '20px',
    overflowY: 'auto',
  },
  listSection: {
    width: '320px',
    backgroundColor: '#252540',
    borderRadius: '8px',
    padding: '15px',
    overflowY: 'auto',
  },
  sectionTitle: {
    color: '#ffd700',
    fontSize: '18px',
    marginBottom: '15px',
    borderBottom: '1px solid #4a4a6a',
    paddingBottom: '10px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    color: '#a0a0c0',
    marginBottom: '5px',
    fontSize: '13px',
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #4a4a6a',
    backgroundColor: '#1a1a2e',
    color: 'white',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #4a4a6a',
    backgroundColor: '#1a1a2e',
    color: 'white',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #4a4a6a',
    backgroundColor: '#1a1a2e',
    color: 'white',
    fontSize: '14px',
    minHeight: '80px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  row: {
    display: 'flex',
    gap: '15px',
  },
  halfWidth: {
    flex: 1,
  },
  button: {
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    marginRight: '10px',
  },
  primaryButton: {
    backgroundColor: '#4a7c4a',
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: '#4a4a6a',
    color: 'white',
  },
  smallButton: {
    padding: '4px 8px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '11px',
  },
  tagInput: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
    padding: '8px',
    backgroundColor: '#1a1a2e',
    borderRadius: '4px',
    border: '1px solid #4a4a6a',
    minHeight: '40px',
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 8px',
    backgroundColor: '#3a3a5a',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#d0d0e0',
  },
  tagRemove: {
    marginLeft: '5px',
    cursor: 'pointer',
    color: '#ff6666',
  },
  listItem: {
    padding: '12px',
    backgroundColor: '#1a1a2e',
    borderRadius: '6px',
    marginBottom: '8px',
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'all 0.2s ease',
  },
  listItemHover: {
    borderColor: '#4a4a6a',
  },
  listItemName: {
    color: '#ffd700',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  listItemDetails: {
    color: '#808090',
    fontSize: '12px',
    marginTop: '4px',
  },
  listItemActions: {
    display: 'flex',
    gap: '5px',
    marginTop: '8px',
  },
  emptyList: {
    color: '#606080',
    textAlign: 'center',
    padding: '30px',
    fontSize: '14px',
  },
  subsection: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#1e1e35',
    borderRadius: '6px',
  },
  subsectionTitle: {
    color: '#c0c0e0',
    fontSize: '14px',
    marginBottom: '12px',
    fontWeight: 'bold',
  },
  dialogueItem: {
    backgroundColor: '#252540',
    borderRadius: '6px',
    padding: '10px',
    marginTop: '8px',
    border: '1px solid #3a3a5a',
  },
};

const NPC_ROLES = [
  { value: 'merchant', label: 'Merchant' },
  { value: 'quest_giver', label: 'Quest Giver' },
  { value: 'companion', label: 'Companion' },
  { value: 'innkeeper', label: 'Innkeeper' },
  { value: 'blacksmith', label: 'Blacksmith' },
  { value: 'healer', label: 'Healer' },
  { value: 'guard', label: 'Guard' },
  { value: 'villager', label: 'Villager' },
  { value: 'romance', label: 'Romance Option' },
  { value: 'antagonist', label: 'Antagonist' },
];

const COMMON_TAGS = [
  'merchant', 'quest', 'companion', 'romance', 'nsfw',
  'friendly', 'hostile', 'neutral', 'mysterious',
  'human', 'elf', 'demon', 'beast', 'undead',
];

const DEFAULT_NPC = {
  id: '',
  name: '',
  description: '',
  role: 'villager',
  locationId: '',
  factionId: '',
  nsfwEnabled: false,
  canBeSeduced: false,
  seductionDifficulty: 50,
  rumorAwareness: 0.5,
  portrait: '',
  tags: [],
  dialogue: {
    greeting: '',
    greeting_repeat: '',
    farewell: '',
    cannotBuy: '',
    cannotAfford: '',
  },
  buyConfig: {
    acceptedTags: [],
    rejectedTags: [],
    buyPriceMultiplier: 0.4,
    maxBuyValue: 1000,
  },
  sellConfig: {
    mode: 'static',
    stockId: '',
    sellPriceMultiplier: 1.0,
  },
  relationshipStats: {
    trust: { default: 0, min: -100, max: 100 },
    love: { default: 0, min: 0, max: 100 },
  },
};

const NPCCreator = ({
  items = [],
  locations = [],
  onAdd,
  onUpdate,
  onDelete,
  onDuplicate,
  onEdit,
  editingItem,
  onCancelEdit,
}) => {
  const [formData, setFormData] = useState({ ...DEFAULT_NPC });
  const [tagInput, setTagInput] = useState('');
  const [acceptedTagInput, setAcceptedTagInput] = useState('');
  const [rejectedTagInput, setRejectedTagInput] = useState('');
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...DEFAULT_NPC,
        ...editingItem,
        dialogue: { ...DEFAULT_NPC.dialogue, ...editingItem.dialogue },
        buyConfig: { ...DEFAULT_NPC.buyConfig, ...editingItem.buyConfig },
        sellConfig: { ...DEFAULT_NPC.sellConfig, ...editingItem.sellConfig },
      });
    } else {
      setFormData({ ...DEFAULT_NPC });
    }
  }, [editingItem]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
  };

  const handleAddTag = (tag) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove),
    }));
  };

  const handleAddBuyTag = (type, tag) => {
    if (tag) {
      const field = type === 'accepted' ? 'acceptedTags' : 'rejectedTags';
      if (!formData.buyConfig[field].includes(tag)) {
        handleNestedChange('buyConfig', field, [...formData.buyConfig[field], tag]);
      }
    }
    if (type === 'accepted') setAcceptedTagInput('');
    else setRejectedTagInput('');
  };

  const handleRemoveBuyTag = (type, tag) => {
    const field = type === 'accepted' ? 'acceptedTags' : 'rejectedTags';
    handleNestedChange('buyConfig', field, formData.buyConfig[field].filter(t => t !== tag));
  };

  const handleSubmit = () => {
    if (!formData.id || !formData.name) {
      alert('ID and Name are required');
      return;
    }

    if (!editingItem && items.some(item => item.id === formData.id)) {
      alert('An NPC with this ID already exists');
      return;
    }

    if (editingItem) {
      onUpdate(editingItem._id, formData);
    } else {
      onAdd(formData);
    }

    setFormData({ ...DEFAULT_NPC });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_NPC });
    onCancelEdit();
  };

  const isMerchant = formData.role === 'merchant' || formData.role === 'blacksmith' || formData.role === 'innkeeper';

  return (
    <div style={styles.container}>
      {/* Form Section */}
      <div style={styles.formSection}>
        <h3 style={styles.sectionTitle}>
          {editingItem ? '✏️ Edit NPC' : '➕ Create New NPC'}
        </h3>

        {/* Basic Info */}
        <div style={styles.row}>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>ID *</label>
              <input
                style={styles.input}
                value={formData.id}
                onChange={(e) => handleChange('id', e.target.value.toLowerCase().replace(/\s/g, '_'))}
                placeholder="unique_npc_id"
              />
            </div>
          </div>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Name *</label>
              <input
                style={styles.input}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="NPC Name"
              />
            </div>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Description</label>
          <textarea
            style={styles.textarea}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe this NPC..."
          />
        </div>

        <div style={styles.row}>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Role</label>
              <select
                style={styles.select}
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
              >
                {NPC_ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Location</label>
              <select
                style={styles.select}
                value={formData.locationId}
                onChange={(e) => handleChange('locationId', e.target.value)}
              >
                <option value="">Select Location</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Portrait Image</label>
          <input
            style={styles.input}
            value={formData.portrait}
            onChange={(e) => handleChange('portrait', e.target.value)}
            placeholder="/npcs/character.png"
          />
        </div>

        {/* NSFW Settings */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>NSFW Settings</div>
          <div style={styles.row}>
            <div style={styles.halfWidth}>
              <label style={styles.label}>
                <input
                  type="checkbox"
                  checked={formData.nsfwEnabled}
                  onChange={(e) => handleChange('nsfwEnabled', e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                NSFW Content Enabled
              </label>
            </div>
            <div style={styles.halfWidth}>
              <label style={styles.label}>
                <input
                  type="checkbox"
                  checked={formData.canBeSeduced}
                  onChange={(e) => handleChange('canBeSeduced', e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Can Be Seduced
              </label>
            </div>
          </div>
          {formData.canBeSeduced && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Seduction Difficulty (0-100)</label>
              <input
                style={styles.input}
                type="number"
                min="0"
                max="100"
                value={formData.seductionDifficulty}
                onChange={(e) => handleChange('seductionDifficulty', parseInt(e.target.value) || 50)}
              />
            </div>
          )}
        </div>

        {/* Dialogue */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Dialogue Lines</div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Greeting (First Time)</label>
            <input
              style={styles.input}
              value={formData.dialogue.greeting}
              onChange={(e) => handleNestedChange('dialogue', 'greeting', e.target.value)}
              placeholder="Hello, traveler!"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Greeting (Repeat)</label>
            <input
              style={styles.input}
              value={formData.dialogue.greeting_repeat}
              onChange={(e) => handleNestedChange('dialogue', 'greeting_repeat', e.target.value)}
              placeholder="Back again?"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Farewell</label>
            <input
              style={styles.input}
              value={formData.dialogue.farewell}
              onChange={(e) => handleNestedChange('dialogue', 'farewell', e.target.value)}
              placeholder="Safe travels!"
            />
          </div>
          {isMerchant && (
            <>
              <div style={styles.formGroup}>
                <label style={styles.label}>Cannot Buy Item</label>
                <input
                  style={styles.input}
                  value={formData.dialogue.cannotBuy}
                  onChange={(e) => handleNestedChange('dialogue', 'cannotBuy', e.target.value)}
                  placeholder="I can't accept that."
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Cannot Afford</label>
                <input
                  style={styles.input}
                  value={formData.dialogue.cannotAfford}
                  onChange={(e) => handleNestedChange('dialogue', 'cannotAfford', e.target.value)}
                  placeholder="You don't have enough gold."
                />
              </div>
            </>
          )}
        </div>

        {/* Merchant Config */}
        {isMerchant && (
          <div style={styles.subsection}>
            <div style={styles.subsectionTitle}>Merchant Settings</div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Accepted Item Tags</label>
              <div style={styles.tagInput}>
                {formData.buyConfig.acceptedTags.map(tag => (
                  <span key={tag} style={styles.tag}>
                    ✓ {tag}
                    <span style={styles.tagRemove} onClick={() => handleRemoveBuyTag('accepted', tag)}>×</span>
                  </span>
                ))}
                <input
                  style={{ ...styles.input, border: 'none', backgroundColor: 'transparent', flex: 1, minWidth: '100px', padding: '2px' }}
                  value={acceptedTagInput}
                  onChange={(e) => setAcceptedTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddBuyTag('accepted', acceptedTagInput)}
                  placeholder="Add tag..."
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Rejected Item Tags</label>
              <div style={styles.tagInput}>
                {formData.buyConfig.rejectedTags.map(tag => (
                  <span key={tag} style={{ ...styles.tag, backgroundColor: '#5a3a3a' }}>
                    ✗ {tag}
                    <span style={styles.tagRemove} onClick={() => handleRemoveBuyTag('rejected', tag)}>×</span>
                  </span>
                ))}
                <input
                  style={{ ...styles.input, border: 'none', backgroundColor: 'transparent', flex: 1, minWidth: '100px', padding: '2px' }}
                  value={rejectedTagInput}
                  onChange={(e) => setRejectedTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddBuyTag('rejected', rejectedTagInput)}
                  placeholder="Add tag..."
                />
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.halfWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Buy Price Multiplier</label>
                  <input
                    style={styles.input}
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={formData.buyConfig.buyPriceMultiplier}
                    onChange={(e) => handleNestedChange('buyConfig', 'buyPriceMultiplier', parseFloat(e.target.value) || 0.4)}
                  />
                </div>
              </div>
              <div style={styles.halfWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Max Buy Value</label>
                  <input
                    style={styles.input}
                    type="number"
                    value={formData.buyConfig.maxBuyValue}
                    onChange={(e) => handleNestedChange('buyConfig', 'maxBuyValue', parseInt(e.target.value) || 1000)}
                  />
                </div>
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.halfWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Stock ID</label>
                  <input
                    style={styles.input}
                    value={formData.sellConfig.stockId}
                    onChange={(e) => handleNestedChange('sellConfig', 'stockId', e.target.value)}
                    placeholder="shop_stock_id"
                  />
                </div>
              </div>
              <div style={styles.halfWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Sell Price Multiplier</label>
                  <input
                    style={styles.input}
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.sellConfig.sellPriceMultiplier}
                    onChange={(e) => handleNestedChange('sellConfig', 'sellPriceMultiplier', parseFloat(e.target.value) || 1.0)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Tags</div>
          <div style={styles.tagInput}>
            {formData.tags.map(tag => (
              <span key={tag} style={styles.tag}>
                {tag}
                <span style={styles.tagRemove} onClick={() => handleRemoveTag(tag)}>×</span>
              </span>
            ))}
            <input
              style={{ ...styles.input, border: 'none', backgroundColor: 'transparent', flex: 1, minWidth: '100px', padding: '2px' }}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag(tagInput)}
              placeholder="Add tag..."
            />
          </div>
          <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {COMMON_TAGS.filter(t => !formData.tags.includes(t)).slice(0, 12).map(tag => (
              <button
                key={tag}
                style={{ ...styles.smallButton, backgroundColor: '#3a3a5a', color: '#a0a0c0' }}
                onClick={() => handleAddTag(tag)}
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: '20px' }}>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleSubmit}
          >
            {editingItem ? '💾 Update NPC' : '➕ Add NPC'}
          </button>
          {editingItem && (
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* List Section */}
      <div style={styles.listSection}>
        <h3 style={styles.sectionTitle}>📋 Created NPCs ({items.length})</h3>

        {items.length === 0 ? (
          <div style={styles.emptyList}>
            No NPCs created yet.<br />
            Use the form to create your first NPC.
          </div>
        ) : (
          items.map(item => (
            <div
              key={item._id}
              style={{
                ...styles.listItem,
                ...(hoveredItem === item._id ? styles.listItemHover : {}),
                ...(editingItem?._id === item._id ? { borderColor: '#ffd700' } : {}),
              }}
              onMouseEnter={() => setHoveredItem(item._id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div style={styles.listItemName}>
                👤 {item.name}
                {item.nsfwEnabled && <span style={{ marginLeft: '5px', color: '#ff6b6b' }}>🔞</span>}
              </div>
              <div style={styles.listItemDetails}>
                ID: {item.id} | Role: {item.role}
              </div>
              <div style={styles.listItemActions}>
                <button
                  style={{ ...styles.smallButton, backgroundColor: '#4a7c4a', color: 'white' }}
                  onClick={() => onEdit(item)}
                >
                  Edit
                </button>
                <button
                  style={{ ...styles.smallButton, backgroundColor: '#4a4a7c', color: 'white' }}
                  onClick={() => onDuplicate(item)}
                >
                  Duplicate
                </button>
                <button
                  style={{ ...styles.smallButton, backgroundColor: '#7c4a4a', color: 'white' }}
                  onClick={() => onDelete(item._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NPCCreator;
