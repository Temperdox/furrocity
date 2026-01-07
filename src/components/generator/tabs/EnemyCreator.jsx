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
  thirdWidth: {
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
  statRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  statLabel: {
    width: '100px',
    color: '#a0a0c0',
    fontSize: '13px',
  },
  statInput: {
    width: '80px',
    padding: '6px',
    borderRadius: '4px',
    border: '1px solid #4a4a6a',
    backgroundColor: '#1a1a2e',
    color: 'white',
    fontSize: '13px',
    textAlign: 'center',
  },
  actionItem: {
    backgroundColor: '#252540',
    borderRadius: '6px',
    padding: '10px',
    marginTop: '8px',
    border: '1px solid #3a3a5a',
  },
};

const ENEMY_TYPES = [
  { value: 'humanoid', label: 'Humanoid' },
  { value: 'beast', label: 'Beast' },
  { value: 'demon', label: 'Demon' },
  { value: 'undead', label: 'Undead' },
  { value: 'plant', label: 'Plant/Tentacle' },
  { value: 'elemental', label: 'Elemental' },
  { value: 'construct', label: 'Construct' },
  { value: 'dragon', label: 'Dragon' },
  { value: 'slime', label: 'Slime/Ooze' },
];

const ENEMY_VARIANTS = [
  { value: 'normal', label: 'Normal' },
  { value: 'elite', label: 'Elite' },
  { value: 'boss', label: 'Boss' },
  { value: 'miniboss', label: 'Mini-Boss' },
];

const COMMON_TAGS = [
  'humanoid', 'beast', 'demon', 'undead', 'boss', 'elite',
  'nsfw', 'corruption', 'male', 'female', 'futa',
  'wolf', 'goblin', 'orc', 'tentacle', 'slime',
];

const NSFW_ACTION_TYPES = [
  { value: 'grope', label: 'Grope' },
  { value: 'fondle', label: 'Fondle' },
  { value: 'kiss', label: 'Kiss' },
  { value: 'lick', label: 'Lick' },
  { value: 'penetrate', label: 'Penetrate' },
  { value: 'oral', label: 'Oral' },
  { value: 'breed', label: 'Breed' },
  { value: 'corrupt', label: 'Corrupt' },
  { value: 'restrain', label: 'Restrain' },
  { value: 'hypnotize', label: 'Hypnotize' },
];

const DEFAULT_ENEMY = {
  id: '',
  name: '',
  description: '',
  type: 'humanoid',
  variant: 'normal',
  level: 1,
  tags: [],
  sprite: '',
  portrait: '',
  baseStats: {
    hp: 50,
    attack: 10,
    defense: 5,
    speed: 5,
    evasion: 5,
  },
  rewards: {
    xp: 20,
    gold: { min: 5, max: 15 },
    drops: [],
  },
  abilities: [],
  nsfwEnabled: false,
  nsfwActionData: {
    actions: [],
    grappleChance: 0.3,
    arousalDamage: 5,
  },
};

const DEFAULT_NSFW_ACTION = {
  id: '',
  type: 'grope',
  name: '',
  arousalDamage: 5,
  corruptionDamage: 0,
  weight: 1,
  requiresGrapple: false,
  tags: [],
};

const EnemyCreator = ({
  items = [],
  onAdd,
  onUpdate,
  onDelete,
  onDuplicate,
  onEdit,
  editingItem,
  onCancelEdit,
}) => {
  const [formData, setFormData] = useState({ ...DEFAULT_ENEMY });
  const [tagInput, setTagInput] = useState('');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [dropInput, setDropInput] = useState({ itemId: '', chance: 0.1 });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...DEFAULT_ENEMY,
        ...editingItem,
        baseStats: { ...DEFAULT_ENEMY.baseStats, ...editingItem.baseStats },
        rewards: {
          ...DEFAULT_ENEMY.rewards,
          ...editingItem.rewards,
          gold: { ...DEFAULT_ENEMY.rewards.gold, ...editingItem.rewards?.gold },
        },
        nsfwActionData: {
          ...DEFAULT_ENEMY.nsfwActionData,
          ...editingItem.nsfwActionData,
          actions: editingItem.nsfwActionData?.actions || [],
        },
      });
    } else {
      setFormData({ ...DEFAULT_ENEMY });
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

  const handleDeepNestedChange = (parent, child, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: { ...prev[parent][child], [field]: value },
      },
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

  const handleAddDrop = () => {
    if (dropInput.itemId) {
      setFormData(prev => ({
        ...prev,
        rewards: {
          ...prev.rewards,
          drops: [...prev.rewards.drops, { ...dropInput }],
        },
      }));
      setDropInput({ itemId: '', chance: 0.1 });
    }
  };

  const handleRemoveDrop = (index) => {
    setFormData(prev => ({
      ...prev,
      rewards: {
        ...prev.rewards,
        drops: prev.rewards.drops.filter((_, i) => i !== index),
      },
    }));
  };

  // NSFW Action management
  const handleAddNsfwAction = () => {
    const newAction = {
      ...DEFAULT_NSFW_ACTION,
      id: `action_${Date.now()}`,
    };
    setFormData(prev => ({
      ...prev,
      nsfwActionData: {
        ...prev.nsfwActionData,
        actions: [...prev.nsfwActionData.actions, newAction],
      },
    }));
  };

  const handleUpdateNsfwAction = (index, updates) => {
    setFormData(prev => ({
      ...prev,
      nsfwActionData: {
        ...prev.nsfwActionData,
        actions: prev.nsfwActionData.actions.map((action, i) =>
          i === index ? { ...action, ...updates } : action
        ),
      },
    }));
  };

  const handleRemoveNsfwAction = (index) => {
    setFormData(prev => ({
      ...prev,
      nsfwActionData: {
        ...prev.nsfwActionData,
        actions: prev.nsfwActionData.actions.filter((_, i) => i !== index),
      },
    }));
  };

  const handleSubmit = () => {
    if (!formData.id || !formData.name) {
      alert('ID and Name are required');
      return;
    }

    if (!editingItem && items.some(item => item.id === formData.id)) {
      alert('An enemy with this ID already exists');
      return;
    }

    if (editingItem) {
      onUpdate(editingItem._id, formData);
    } else {
      onAdd(formData);
    }

    setFormData({ ...DEFAULT_ENEMY });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_ENEMY });
    onCancelEdit();
  };

  return (
    <div style={styles.container}>
      {/* Form Section */}
      <div style={styles.formSection}>
        <h3 style={styles.sectionTitle}>
          {editingItem ? '✏️ Edit Enemy' : '➕ Create New Enemy'}
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
                placeholder="unique_enemy_id"
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
                placeholder="Enemy Name"
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
            placeholder="Describe this enemy..."
          />
        </div>

        <div style={styles.row}>
          <div style={styles.thirdWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Type</label>
              <select
                style={styles.select}
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
              >
                {ENEMY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={styles.thirdWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Variant</label>
              <select
                style={styles.select}
                value={formData.variant}
                onChange={(e) => handleChange('variant', e.target.value)}
              >
                {ENEMY_VARIANTS.map(v => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={styles.thirdWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Level</label>
              <input
                style={styles.input}
                type="number"
                min="1"
                value={formData.level}
                onChange={(e) => handleChange('level', parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Sprite Image</label>
              <input
                style={styles.input}
                value={formData.sprite}
                onChange={(e) => handleChange('sprite', e.target.value)}
                placeholder="/enemies/enemy_sprite.png"
              />
            </div>
          </div>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Portrait Image</label>
              <input
                style={styles.input}
                value={formData.portrait}
                onChange={(e) => handleChange('portrait', e.target.value)}
                placeholder="/enemies/enemy_portrait.png"
              />
            </div>
          </div>
        </div>

        {/* Base Stats */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Base Stats</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {Object.entries(formData.baseStats).map(([stat, value]) => (
              <div key={stat} style={styles.statRow}>
                <span style={styles.statLabel}>{stat.toUpperCase()}</span>
                <input
                  style={styles.statInput}
                  type="number"
                  value={value}
                  onChange={(e) => handleNestedChange('baseStats', stat, parseInt(e.target.value) || 0)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Rewards */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Rewards</div>
          <div style={styles.row}>
            <div style={styles.thirdWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>XP</label>
                <input
                  style={styles.input}
                  type="number"
                  value={formData.rewards.xp}
                  onChange={(e) => handleNestedChange('rewards', 'xp', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div style={styles.thirdWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Gold Min</label>
                <input
                  style={styles.input}
                  type="number"
                  value={formData.rewards.gold.min}
                  onChange={(e) => handleDeepNestedChange('rewards', 'gold', 'min', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div style={styles.thirdWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Gold Max</label>
                <input
                  style={styles.input}
                  type="number"
                  value={formData.rewards.gold.max}
                  onChange={(e) => handleDeepNestedChange('rewards', 'gold', 'max', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          <div style={styles.subsectionTitle}>Item Drops</div>
          {formData.rewards.drops.map((drop, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
              <span style={{ color: '#a0a0c0' }}>{drop.itemId}</span>
              <span style={{ color: '#808090' }}>({(drop.chance * 100).toFixed(0)}%)</span>
              <button
                style={{ ...styles.smallButton, backgroundColor: '#7c4a4a', color: 'white' }}
                onClick={() => handleRemoveDrop(index)}
              >
                ×
              </button>
            </div>
          ))}
          <div style={styles.row}>
            <div style={styles.halfWidth}>
              <input
                style={styles.input}
                value={dropInput.itemId}
                onChange={(e) => setDropInput(prev => ({ ...prev, itemId: e.target.value }))}
                placeholder="item_id"
              />
            </div>
            <div style={styles.halfWidth}>
              <input
                style={styles.input}
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={dropInput.chance}
                onChange={(e) => setDropInput(prev => ({ ...prev, chance: parseFloat(e.target.value) || 0.1 }))}
                placeholder="Chance (0-1)"
              />
            </div>
            <button
              style={{ ...styles.smallButton, backgroundColor: '#4a7c4a', color: 'white' }}
              onClick={handleAddDrop}
            >
              + Add
            </button>
          </div>
        </div>

        {/* NSFW Settings */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>NSFW Settings</div>
          <label style={styles.label}>
            <input
              type="checkbox"
              checked={formData.nsfwEnabled}
              onChange={(e) => handleChange('nsfwEnabled', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            NSFW Content Enabled
          </label>

          {formData.nsfwEnabled && (
            <>
              <div style={styles.row}>
                <div style={styles.halfWidth}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Grapple Chance (0-1)</label>
                    <input
                      style={styles.input}
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={formData.nsfwActionData.grappleChance}
                      onChange={(e) => handleNestedChange('nsfwActionData', 'grappleChance', parseFloat(e.target.value) || 0.3)}
                    />
                  </div>
                </div>
                <div style={styles.halfWidth}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Base Arousal Damage</label>
                    <input
                      style={styles.input}
                      type="number"
                      value={formData.nsfwActionData.arousalDamage}
                      onChange={(e) => handleNestedChange('nsfwActionData', 'arousalDamage', parseInt(e.target.value) || 5)}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.subsectionTitle}>NSFW Actions</div>
              {formData.nsfwActionData.actions.map((action, index) => (
                <div key={index} style={styles.actionItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#ffd700', fontSize: '12px' }}>Action #{index + 1}</span>
                    <button
                      style={{ ...styles.smallButton, backgroundColor: '#7c4a4a', color: 'white' }}
                      onClick={() => handleRemoveNsfwAction(index)}
                    >
                      Remove
                    </button>
                  </div>
                  <div style={styles.row}>
                    <div style={styles.thirdWidth}>
                      <select
                        style={styles.select}
                        value={action.type}
                        onChange={(e) => handleUpdateNsfwAction(index, { type: e.target.value })}
                      >
                        {NSFW_ACTION_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div style={styles.thirdWidth}>
                      <input
                        style={styles.input}
                        value={action.name}
                        onChange={(e) => handleUpdateNsfwAction(index, { name: e.target.value })}
                        placeholder="Action Name"
                      />
                    </div>
                    <div style={styles.thirdWidth}>
                      <input
                        style={styles.input}
                        type="number"
                        value={action.arousalDamage}
                        onChange={(e) => handleUpdateNsfwAction(index, { arousalDamage: parseInt(e.target.value) || 5 })}
                        placeholder="Arousal"
                      />
                    </div>
                  </div>
                  <div style={{ ...styles.row, marginTop: '8px' }}>
                    <div style={styles.halfWidth}>
                      <input
                        style={styles.input}
                        type="number"
                        value={action.corruptionDamage}
                        onChange={(e) => handleUpdateNsfwAction(index, { corruptionDamage: parseInt(e.target.value) || 0 })}
                        placeholder="Corruption"
                      />
                    </div>
                    <div style={styles.halfWidth}>
                      <label style={styles.label}>
                        <input
                          type="checkbox"
                          checked={action.requiresGrapple}
                          onChange={(e) => handleUpdateNsfwAction(index, { requiresGrapple: e.target.checked })}
                          style={{ marginRight: '8px' }}
                        />
                        Requires Grapple
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              <button
                style={{ ...styles.smallButton, backgroundColor: '#4a7c4a', color: 'white', marginTop: '10px' }}
                onClick={handleAddNsfwAction}
              >
                + Add NSFW Action
              </button>
            </>
          )}
        </div>

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
            {editingItem ? '💾 Update Enemy' : '➕ Add Enemy'}
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
        <h3 style={styles.sectionTitle}>📋 Created Enemies ({items.length})</h3>

        {items.length === 0 ? (
          <div style={styles.emptyList}>
            No enemies created yet.<br />
            Use the form to create your first enemy.
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
                👹 {item.name}
                {item.variant !== 'normal' && (
                  <span style={{
                    marginLeft: '8px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    backgroundColor: item.variant === 'boss' ? '#7c4a4a' : '#4a4a7c',
                    color: 'white',
                  }}>
                    {item.variant}
                  </span>
                )}
              </div>
              <div style={styles.listItemDetails}>
                ID: {item.id} | Lvl: {item.level} | Type: {item.type}
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

export default EnemyCreator;
