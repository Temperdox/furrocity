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
    minHeight: '60px',
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
  entryCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '10px',
    border: '1px solid #3a3a5a',
  },
  weightBar: {
    height: '6px',
    backgroundColor: '#1a1a2e',
    borderRadius: '3px',
    marginTop: '8px',
    overflow: 'hidden',
  },
  weightFill: {
    height: '100%',
    backgroundColor: '#4aca4a',
    borderRadius: '3px',
  },
};

const RARITY_OPTIONS = [
  { value: 'any', label: 'Any Rarity' },
  { value: 'common', label: 'Common' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'rare', label: 'Rare' },
  { value: 'epic', label: 'Epic' },
  { value: 'legendary', label: 'Legendary' },
  { value: 'mythic', label: 'Mythic' },
];

const RARITY_COLORS = {
  any: '#a0a0c0',
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f97316',
  mythic: '#ffd700',
};

const DEFAULT_LOOT_TABLE = {
  id: '',
  name: '',
  description: '',
  entries: [],
  guaranteedDrops: [],
  goldRange: { min: 0, max: 0 },
  rolls: 1,
  bonusRollChance: 0,
  levelScaling: false,
  tags: [],
};

const DEFAULT_ENTRY = {
  type: 'item',
  itemId: '',
  weight: 100,
  minCount: 1,
  maxCount: 1,
  rarity: 'any',
  conditions: [],
};

const LootTableCreator = ({
  items = [],
  allContent = {},
  onAdd,
  onUpdate,
  onDelete,
  onDuplicate,
  onEdit,
  editingItem,
  onCancelEdit,
  datapackContent = {},
  datapackLoading = false,
}) => {
  const [formData, setFormData] = useState({ ...DEFAULT_LOOT_TABLE });
  const [tagInput, setTagInput] = useState('');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [newEntry, setNewEntry] = useState({ ...DEFAULT_ENTRY });
  const [newGuaranteed, setNewGuaranteed] = useState({ itemId: '', count: 1 });

  // Combine datapack content with user-created content
  const allItems = [...(datapackContent.items || []), ...(allContent?.items || [])];

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...DEFAULT_LOOT_TABLE,
        ...editingItem,
        goldRange: { ...DEFAULT_LOOT_TABLE.goldRange, ...editingItem.goldRange },
        entries: editingItem.entries || [],
        guaranteedDrops: editingItem.guaranteedDrops || [],
        tags: editingItem.tags || [],
      });
    } else {
      setFormData({ ...DEFAULT_LOOT_TABLE });
    }
  }, [editingItem]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGoldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      goldRange: { ...prev.goldRange, [field]: value },
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

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  // Entry handlers
  const handleAddEntry = () => {
    if (newEntry.itemId) {
      setFormData(prev => ({
        ...prev,
        entries: [...prev.entries, { ...newEntry }],
      }));
      setNewEntry({ ...DEFAULT_ENTRY });
    }
  };

  const handleRemoveEntry = (index) => {
    setFormData(prev => ({
      ...prev,
      entries: prev.entries.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateEntry = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      entries: prev.entries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  // Guaranteed drop handlers
  const handleAddGuaranteed = () => {
    if (newGuaranteed.itemId) {
      setFormData(prev => ({
        ...prev,
        guaranteedDrops: [...prev.guaranteedDrops, { ...newGuaranteed }],
      }));
      setNewGuaranteed({ itemId: '', count: 1 });
    }
  };

  const handleRemoveGuaranteed = (index) => {
    setFormData(prev => ({
      ...prev,
      guaranteedDrops: prev.guaranteedDrops.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    if (!formData.id || !formData.name) {
      alert('Loot Table ID and Name are required');
      return;
    }

    const lootTableData = { ...formData };

    if (editingItem) {
      onUpdate(editingItem._id, lootTableData);
    } else {
      onAdd(lootTableData);
    }

    setFormData({ ...DEFAULT_LOOT_TABLE });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_LOOT_TABLE });
    if (onCancelEdit) onCancelEdit();
  };

  // Calculate total weight for probability display
  const totalWeight = formData.entries.reduce((sum, entry) => sum + entry.weight, 0);

  return (
    <div style={styles.container}>
      {/* Form Section */}
      <div style={styles.formSection}>
        <h3 style={styles.sectionTitle}>
          {editingItem ? 'Edit Loot Table' : 'Create New Loot Table'}
        </h3>

        {/* Basic Info */}
        <div style={styles.row}>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Loot Table ID *</label>
              <input
                style={styles.input}
                value={formData.id}
                onChange={(e) => handleChange('id', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                placeholder="forest_common_loot"
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
                placeholder="Forest Common Loot"
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
            placeholder="Describe when this loot table is used..."
          />
        </div>

        {/* Roll Settings */}
        <div style={styles.row}>
          <div style={styles.thirdWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Number of Rolls</label>
              <input
                style={styles.input}
                type="number"
                value={formData.rolls}
                onChange={(e) => handleChange('rolls', parseInt(e.target.value) || 1)}
                min="1"
              />
            </div>
          </div>
          <div style={styles.thirdWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Bonus Roll Chance (%)</label>
              <input
                style={styles.input}
                type="number"
                value={formData.bonusRollChance}
                onChange={(e) => handleChange('bonusRollChance', parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
              />
            </div>
          </div>
          <div style={styles.thirdWidth}>
            <div style={styles.formGroup}>
              <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '8px', marginTop: '25px' }}>
                <input
                  type="checkbox"
                  checked={formData.levelScaling}
                  onChange={(e) => handleChange('levelScaling', e.target.checked)}
                />
                Scale with Level
              </label>
            </div>
          </div>
        </div>

        {/* Gold Range */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Gold Drops</div>
          <div style={styles.row}>
            <div style={styles.halfWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Minimum Gold</label>
                <input
                  style={styles.input}
                  type="number"
                  value={formData.goldRange.min}
                  onChange={(e) => handleGoldChange('min', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
            </div>
            <div style={styles.halfWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Maximum Gold</label>
                <input
                  style={styles.input}
                  type="number"
                  value={formData.goldRange.max}
                  onChange={(e) => handleGoldChange('max', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Guaranteed Drops */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Guaranteed Drops (Always drop)</div>

          {formData.guaranteedDrops.map((drop, index) => {
            const itemData = allItems.find(i => i.id === drop.itemId);
            return (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ color: '#4aca4a', flex: 1 }}>
                  {drop.count}x {itemData?.name || drop.itemId}
                </span>
                <button
                  style={{ ...styles.smallButton, backgroundColor: '#7c4a4a', color: 'white' }}
                  onClick={() => handleRemoveGuaranteed(index)}
                >
                  ×
                </button>
              </div>
            );
          })}

          <div style={styles.row}>
            <div style={styles.halfWidth}>
              <select
                style={styles.select}
                value={newGuaranteed.itemId}
                onChange={(e) => setNewGuaranteed(prev => ({ ...prev, itemId: e.target.value }))}
              >
                <option value="">Select item...</option>
                {allItems.map(item => (
                  <option key={item.id} value={item.id}>{item.name || item.id}</option>
                ))}
              </select>
            </div>
            <div style={{ width: '100px' }}>
              <input
                style={styles.input}
                type="number"
                value={newGuaranteed.count}
                onChange={(e) => setNewGuaranteed(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                min="1"
                placeholder="Count"
              />
            </div>
            <button
              style={{ ...styles.button, ...styles.primaryButton, padding: '8px 16px' }}
              onClick={handleAddGuaranteed}
              disabled={!newGuaranteed.itemId}
            >
              + Add
            </button>
          </div>
        </div>

        {/* Loot Entries */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>
            Loot Pool (Weighted Random)
            {totalWeight > 0 && <span style={{ fontWeight: 'normal', color: '#808090' }}> - Total Weight: {totalWeight}</span>}
          </div>

          {formData.entries.map((entry, index) => {
            const itemData = allItems.find(i => i.id === entry.itemId);
            const probability = totalWeight > 0 ? ((entry.weight / totalWeight) * 100).toFixed(1) : 0;
            return (
              <div key={index} style={styles.entryCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: RARITY_COLORS[entry.rarity] || '#a0a0c0', fontWeight: 'bold' }}>
                        {itemData?.name || entry.itemId}
                      </span>
                      {entry.rarity !== 'any' && (
                        <span style={{ fontSize: '11px', color: RARITY_COLORS[entry.rarity], textTransform: 'capitalize' }}>
                          ({entry.rarity})
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#808090', fontSize: '12px', marginTop: '4px' }}>
                      {entry.minCount === entry.maxCount ? `${entry.minCount}x` : `${entry.minCount}-${entry.maxCount}x`}
                      {' | '}Weight: {entry.weight} ({probability}%)
                    </div>
                    <div style={styles.weightBar}>
                      <div style={{ ...styles.weightFill, width: `${probability}%` }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <input
                      style={{ ...styles.input, width: '70px', padding: '4px 8px' }}
                      type="number"
                      value={entry.weight}
                      onChange={(e) => handleUpdateEntry(index, 'weight', parseInt(e.target.value) || 1)}
                      min="1"
                      title="Weight"
                    />
                    <button
                      style={{ ...styles.smallButton, backgroundColor: '#7c4a4a', color: 'white' }}
                      onClick={() => handleRemoveEntry(index)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add New Entry */}
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#252540', borderRadius: '6px' }}>
            <div style={styles.row}>
              <div style={{ flex: 2 }}>
                <label style={styles.label}>Item</label>
                <select
                  style={styles.select}
                  value={newEntry.itemId}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, itemId: e.target.value }))}
                >
                  <option value="">Select item...</option>
                  {allItems.map(item => (
                    <option key={item.id} value={item.id}>{item.name || item.id} ({item.rarity || 'common'})</option>
                  ))}
                </select>
              </div>
              <div style={{ width: '120px' }}>
                <label style={styles.label}>Rarity Filter</label>
                <select
                  style={styles.select}
                  value={newEntry.rarity}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, rarity: e.target.value }))}
                >
                  {RARITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.thirdWidth}>
                <label style={styles.label}>Weight</label>
                <input
                  style={styles.input}
                  type="number"
                  value={newEntry.weight}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, weight: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>
              <div style={styles.thirdWidth}>
                <label style={styles.label}>Min Count</label>
                <input
                  style={styles.input}
                  type="number"
                  value={newEntry.minCount}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, minCount: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>
              <div style={styles.thirdWidth}>
                <label style={styles.label}>Max Count</label>
                <input
                  style={styles.input}
                  type="number"
                  value={newEntry.maxCount}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, maxCount: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  style={{ ...styles.button, ...styles.primaryButton, padding: '8px 16px' }}
                  onClick={handleAddEntry}
                  disabled={!newEntry.itemId}
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Tags</label>
          <div style={styles.tagInput}>
            {formData.tags.map(tag => (
              <span key={tag} style={styles.tag}>
                {tag}
                <span style={styles.tagRemove} onClick={() => handleRemoveTag(tag)}>×</span>
              </span>
            ))}
            <input
              style={{ border: 'none', background: 'transparent', color: 'white', outline: 'none', minWidth: '100px', flex: 1 }}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagInput.trim()) {
                  e.preventDefault();
                  handleAddTag(tagInput.trim());
                }
              }}
              placeholder="Add tag..."
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleSubmit}
          >
            {editingItem ? 'Update Loot Table' : 'Create Loot Table'}
          </button>
          {editingItem && (
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={handleCancel}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* List Section */}
      <div style={styles.listSection}>
        <h3 style={styles.sectionTitle}>Created Loot Tables ({items.length})</h3>

        {items.length === 0 ? (
          <div style={styles.emptyList}>
            No loot tables created yet.<br />
            Use the form to create your first loot table.
          </div>
        ) : (
          items.map(item => (
            <div
              key={item._id || item.id}
              style={{
                ...styles.listItem,
                ...(hoveredItem === item._id ? styles.listItemHover : {}),
              }}
              onMouseEnter={() => setHoveredItem(item._id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => onEdit(item)}
            >
              <div style={styles.listItemName}>{item.name}</div>
              <div style={styles.listItemDetails}>
                {item.entries?.length || 0} items | {item.rolls || 1} roll(s)
              </div>
              {(item.goldRange?.min > 0 || item.goldRange?.max > 0) && (
                <div style={styles.listItemDetails}>
                  Gold: {item.goldRange.min}-{item.goldRange.max}
                </div>
              )}
              <div style={styles.listItemActions}>
                <button
                  style={{ ...styles.smallButton, backgroundColor: '#4a4a6a', color: 'white' }}
                  onClick={(e) => { e.stopPropagation(); onDuplicate(item); }}
                >
                  Duplicate
                </button>
                <button
                  style={{ ...styles.smallButton, backgroundColor: '#7c4a4a', color: 'white' }}
                  onClick={(e) => { e.stopPropagation(); onDelete(item._id); }}
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

export default LootTableCreator;
