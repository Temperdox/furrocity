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
  modifierItem: {
    backgroundColor: '#252540',
    borderRadius: '6px',
    padding: '10px',
    marginTop: '8px',
    border: '1px solid #3a3a5a',
  },
};

const EFFECT_TYPES = [
  { value: 'buff', label: 'Buff', color: '#4a7c4a' },
  { value: 'debuff', label: 'Debuff', color: '#7c4a4a' },
  { value: 'status', label: 'Status', color: '#7c7c4a' },
  { value: 'curse', label: 'Curse', color: '#7c4a7c' },
  { value: 'addiction', label: 'Addiction', color: '#4a4a7c' },
  { value: 'restraint', label: 'Restraint', color: '#5a5a5a' },
  { value: 'environment', label: 'Environment', color: '#4a7c7c' },
  { value: 'instant', label: 'Instant', color: '#7c7c7c' },
];

const STACK_BEHAVIORS = [
  { value: 'refresh', label: 'Refresh Duration' },
  { value: 'stack', label: 'Stack (add stacks)' },
  { value: 'intensify', label: 'Intensify (increase severity)' },
  { value: 'replace', label: 'Replace (override)' },
];

const DURATION_TYPES = [
  { value: 'turns', label: 'Turns' },
  { value: 'permanent', label: 'Permanent' },
  { value: 'untilCombatEnd', label: 'Until Combat End' },
  { value: 'instant', label: 'Instant' },
];

const STAT_MODIFIERS = [
  'strength', 'vitality', 'intelligence', 'willpower',
  'speed', 'evasion', 'attack', 'defense',
  'charm', 'luck', 'corruptionResistance',
];

const OPERATIONS = [
  { value: 'flat', label: 'Flat (+/-)' },
  { value: 'percent', label: 'Percent (+/- %)' },
  { value: 'set', label: 'Set (=)' },
];

const COMMON_TAGS = [
  'buff', 'debuff', 'dot', 'hot', 'status',
  'poison', 'fire', 'ice', 'lightning', 'holy',
  'curse', 'nsfw', 'arousal', 'corruption',
  'restraint', 'stun', 'slow', 'bleed',
];

const DEFAULT_EFFECT = {
  id: '',
  name: '',
  description: '',
  type: 'buff',
  tags: [],
  icon: {
    type: 'sprite',
    sheetId: 'effects',
    iconId: 'default',
  },
  stackBehavior: 'refresh',
  maxStacks: 1,
  duration: {
    type: 'turns',
    value: 5,
  },
  modifiers: [],
  triggers: {},
};

const DEFAULT_MODIFIER = {
  stat: 'attack',
  operation: 'flat',
  value: 10,
};

const EffectCreator = ({
  items = [],
  onAdd,
  onUpdate,
  onDelete,
  onDuplicate,
  onEdit,
  editingItem,
  onCancelEdit,
}) => {
  const [formData, setFormData] = useState({ ...DEFAULT_EFFECT });
  const [tagInput, setTagInput] = useState('');
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...DEFAULT_EFFECT,
        ...editingItem,
        icon: { ...DEFAULT_EFFECT.icon, ...editingItem.icon },
        duration: { ...DEFAULT_EFFECT.duration, ...editingItem.duration },
        modifiers: editingItem.modifiers || [],
      });
    } else {
      setFormData({ ...DEFAULT_EFFECT });
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

  // Modifier management
  const handleAddModifier = () => {
    setFormData(prev => ({
      ...prev,
      modifiers: [...prev.modifiers, { ...DEFAULT_MODIFIER }],
    }));
  };

  const handleUpdateModifier = (index, updates) => {
    setFormData(prev => ({
      ...prev,
      modifiers: prev.modifiers.map((mod, i) =>
        i === index ? { ...mod, ...updates } : mod
      ),
    }));
  };

  const handleRemoveModifier = (index) => {
    setFormData(prev => ({
      ...prev,
      modifiers: prev.modifiers.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    if (!formData.id || !formData.name) {
      alert('ID and Name are required');
      return;
    }

    if (!editingItem && items.some(item => item.id === formData.id)) {
      alert('An effect with this ID already exists');
      return;
    }

    if (editingItem) {
      onUpdate(editingItem._id, formData);
    } else {
      onAdd(formData);
    }

    setFormData({ ...DEFAULT_EFFECT });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_EFFECT });
    onCancelEdit();
  };

  return (
    <div style={styles.container}>
      {/* Form Section */}
      <div style={styles.formSection}>
        <h3 style={styles.sectionTitle}>
          {editingItem ? '✏️ Edit Effect' : '➕ Create New Effect'}
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
                placeholder="unique_effect_id"
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
                placeholder="Effect Name"
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
            placeholder="What this effect does..."
          />
        </div>

        <div style={styles.row}>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Type</label>
              <select
                style={styles.select}
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
              >
                {EFFECT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Stack Behavior</label>
              <select
                style={styles.select}
                value={formData.stackBehavior}
                onChange={(e) => handleChange('stackBehavior', e.target.value)}
              >
                {STACK_BEHAVIORS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {formData.stackBehavior === 'stack' && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Max Stacks</label>
            <input
              style={styles.input}
              type="number"
              min="1"
              value={formData.maxStacks}
              onChange={(e) => handleChange('maxStacks', parseInt(e.target.value) || 1)}
            />
          </div>
        )}

        {/* Duration */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Duration</div>
          <div style={styles.row}>
            <div style={styles.halfWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Duration Type</label>
                <select
                  style={styles.select}
                  value={formData.duration.type}
                  onChange={(e) => handleNestedChange('duration', 'type', e.target.value)}
                >
                  {DURATION_TYPES.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {formData.duration.type === 'turns' && (
              <div style={styles.halfWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Turn Count</label>
                  <input
                    style={styles.input}
                    type="number"
                    min="1"
                    value={formData.duration.value}
                    onChange={(e) => handleNestedChange('duration', 'value', parseInt(e.target.value) || 5)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Icon */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Icon</div>
          <div style={styles.row}>
            <div style={styles.halfWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Sprite Sheet ID</label>
                <input
                  style={styles.input}
                  value={formData.icon.sheetId}
                  onChange={(e) => handleNestedChange('icon', 'sheetId', e.target.value)}
                  placeholder="effects"
                />
              </div>
            </div>
            <div style={styles.halfWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Icon ID</label>
                <input
                  style={styles.input}
                  value={formData.icon.iconId}
                  onChange={(e) => handleNestedChange('icon', 'iconId', e.target.value)}
                  placeholder="effect_icon"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stat Modifiers */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Stat Modifiers</div>
          {formData.modifiers.map((mod, index) => (
            <div key={index} style={styles.modifierItem}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#a0a0c0', fontSize: '12px' }}>Modifier #{index + 1}</span>
                <button
                  style={{ ...styles.smallButton, backgroundColor: '#7c4a4a', color: 'white' }}
                  onClick={() => handleRemoveModifier(index)}
                >
                  Remove
                </button>
              </div>
              <div style={styles.row}>
                <div style={styles.thirdWidth}>
                  <select
                    style={styles.select}
                    value={mod.stat}
                    onChange={(e) => handleUpdateModifier(index, { stat: e.target.value })}
                  >
                    {STAT_MODIFIERS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.thirdWidth}>
                  <select
                    style={styles.select}
                    value={mod.operation}
                    onChange={(e) => handleUpdateModifier(index, { operation: e.target.value })}
                  >
                    {OPERATIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.thirdWidth}>
                  <input
                    style={styles.input}
                    type="number"
                    value={mod.value}
                    onChange={(e) => handleUpdateModifier(index, { value: parseInt(e.target.value) || 0 })}
                    placeholder="Value"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            style={{ ...styles.smallButton, backgroundColor: '#4a7c4a', color: 'white', marginTop: '10px' }}
            onClick={handleAddModifier}
          >
            + Add Modifier
          </button>
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
            {editingItem ? '💾 Update Effect' : '➕ Add Effect'}
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
        <h3 style={styles.sectionTitle}>📋 Created Effects ({items.length})</h3>

        {items.length === 0 ? (
          <div style={styles.emptyList}>
            No effects created yet.<br />
            Use the form to create your first effect.
          </div>
        ) : (
          items.map(item => {
            const effectType = EFFECT_TYPES.find(t => t.value === item.type);
            return (
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
                  ✨ {item.name}
                  <span style={{
                    marginLeft: '8px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    backgroundColor: effectType?.color || '#4a4a6a',
                    color: 'white',
                  }}>
                    {item.type}
                  </span>
                </div>
                <div style={styles.listItemDetails}>
                  ID: {item.id} | {item.duration?.type === 'turns' ? `${item.duration.value} turns` : item.duration?.type}
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
            );
          })
        )}
      </div>
    </div>
  );
};

export default EffectCreator;
