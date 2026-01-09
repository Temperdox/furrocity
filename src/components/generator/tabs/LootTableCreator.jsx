import React, { useState, useEffect, useMemo } from 'react';
import { collectTags } from '../DatapackLoader';
import { FormInput, FormSelect, TagInput, Button, CollapsibleSection } from '../../ui/shared';
import { useFormDraft } from '../../../hooks/useFormDraft';
import './CreatorStyles.css';

const DRAFT_KEY = 'contentGenerator_draft_lootTables';

const TAG_CATEGORIES = {
  source: ['enemy', 'boss', 'chest', 'fishing', 'mining', 'gathering'],
  tier: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
  region: ['forest', 'dungeon', 'cave', 'village', 'castle'],
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
  any: 'var(--color-text-secondary)',
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f97316',
  mythic: 'var(--color-accent-primary)',
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
  const [hoveredItem, setHoveredItem] = useState(null);
  const [newEntry, setNewEntry] = useState({ ...DEFAULT_ENTRY });
  const [newGuaranteed, setNewGuaranteed] = useState({ itemId: '', count: 1 });
  const [collapsedSections, setCollapsedSections] = useState({
    rollSettings: false,
    goldDrops: false,
    guaranteedDrops: false,
    lootPool: false,
    tags: true,
  });

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const { clearDraft } = useFormDraft(DRAFT_KEY, formData, setFormData, editingItem, {
    defaultValues: DEFAULT_LOOT_TABLE,
  });

  const suggestedTags = useMemo(() => {
    return collectTags({
      datapackContent,
      userContent: items,
      commonTags: Object.values(TAG_CATEGORIES).flat(),
      contentType: 'lootTables',
    });
  }, [datapackContent, items]);

  // Combine datapack content with user-created content
  const allItems = [...(datapackContent.items || []), ...(allContent?.items || [])];
  const itemOptions = useMemo(() => {
    return allItems.map(item => ({
      value: item.id,
      label: `${item.name || item.id} (${item.rarity || 'common'})`,
    }));
  }, [allItems]);

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

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
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

    if (!editingItem && items.some(item => item.id === formData.id)) {
      alert('A loot table with this ID already exists');
      return;
    }

    if (editingItem) {
      onUpdate(editingItem._id, formData);
    } else {
      onAdd(formData);
      clearDraft();
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
    <div className="creator-container">
      {/* Form Section */}
      <div className="creator-form">
        <h3 className="creator-form-section-title">
          {editingItem ? 'Edit Loot Table' : 'Create New Loot Table'}
        </h3>

        {/* Basic Info */}
        <div className="creator-form-section">
          <div className="creator-form-row">
            <FormInput
              label="ID"
              required
              value={formData.id}
              onChange={(v) => handleChange('id', String(v).toLowerCase().replace(/\s/g, '_'))}
              placeholder="forest_common_loot"
            />
            <FormInput
              label="Name"
              required
              value={formData.name}
              onChange={(v) => handleChange('name', v)}
              placeholder="Forest Common Loot"
            />
          </div>

          <FormInput
            label="Description"
            type="textarea"
            value={formData.description}
            onChange={(v) => handleChange('description', v)}
            placeholder="Describe when this loot table is used..."
            rows={2}
          />
        </div>

        {/* Roll Settings */}
        <CollapsibleSection
          title="Roll Settings"
          isCollapsed={collapsedSections.rollSettings}
          onToggle={() => toggleSection('rollSettings')}
        >
          <div className="creator-form-row cols-3">
            <FormInput
              label="Number of Rolls"
              type="number"
              value={formData.rolls}
              onChange={(v) => handleChange('rolls', v)}
              min={1}
            />
            <FormInput
              label="Bonus Roll Chance (%)"
              type="number"
              value={formData.bonusRollChance}
              onChange={(v) => handleChange('bonusRollChance', v)}
              min={0}
              max={100}
            />
            <div className="checkbox-row" style={{ marginTop: 'var(--space-lg)' }}>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.levelScaling}
                  onChange={(e) => handleChange('levelScaling', e.target.checked)}
                />
                <span className="checkbox-text">Scale with Level</span>
              </label>
            </div>
          </div>
        </CollapsibleSection>

        {/* Gold Range */}
        <CollapsibleSection
          title="Gold Drops"
          isCollapsed={collapsedSections.goldDrops}
          onToggle={() => toggleSection('goldDrops')}
        >
          <div className="creator-form-row">
            <FormInput
              label="Minimum Gold"
              type="number"
              value={formData.goldRange.min}
              onChange={(v) => handleNestedChange('goldRange', 'min', v)}
              min={0}
            />
            <FormInput
              label="Maximum Gold"
              type="number"
              value={formData.goldRange.max}
              onChange={(v) => handleNestedChange('goldRange', 'max', v)}
              min={0}
            />
          </div>
        </CollapsibleSection>

        {/* Guaranteed Drops */}
        <CollapsibleSection
          title="Guaranteed Drops"
          isCollapsed={collapsedSections.guaranteedDrops}
          onToggle={() => toggleSection('guaranteedDrops')}
          badge={formData.guaranteedDrops.length > 0 ? formData.guaranteedDrops.length : null}
        >
          {formData.guaranteedDrops.map((drop, index) => {
            const itemData = allItems.find(i => i.id === drop.itemId);
            return (
              <div key={index} className="array-item">
                <div className="array-item-content">
                  <span style={{ color: 'var(--color-accent-success)' }}>
                    {drop.count}x {itemData?.name || drop.itemId}
                  </span>
                </div>
                <Button variant="danger" size="sm" onClick={() => handleRemoveGuaranteed(index)}>
                  ×
                </Button>
              </div>
            );
          })}

          <div className="subsection">
            <div className="creator-form-row cols-3">
              <FormSelect
                label="Item"
                value={newGuaranteed.itemId}
                onChange={(v) => setNewGuaranteed(prev => ({ ...prev, itemId: v }))}
                options={itemOptions}
                placeholder="Select item..."
              />
              <FormInput
                label="Count"
                type="number"
                value={newGuaranteed.count}
                onChange={(v) => setNewGuaranteed(prev => ({ ...prev, count: v }))}
                min={1}
              />
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleAddGuaranteed}
                  disabled={!newGuaranteed.itemId}
                >
                  + Add Guaranteed
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Loot Entries */}
        <CollapsibleSection
          title="Loot Pool (Weighted Random)"
          isCollapsed={collapsedSections.lootPool}
          onToggle={() => toggleSection('lootPool')}
          badge={formData.entries.length > 0 ? `${formData.entries.length}${totalWeight > 0 ? ` | ${totalWeight}w` : ''}` : null}
        >
          {formData.entries.map((entry, index) => {
            const itemData = allItems.find(i => i.id === entry.itemId);
            const probability = totalWeight > 0 ? ((entry.weight / totalWeight) * 100).toFixed(1) : 0;
            return (
              <div key={index} className="array-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <span style={{ color: RARITY_COLORS[entry.rarity] || 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-semibold)' }}>
                        {itemData?.name || entry.itemId}
                      </span>
                      {entry.rarity !== 'any' && (
                        <span className="rarity-badge" style={{ backgroundColor: RARITY_COLORS[entry.rarity], textTransform: 'capitalize' }}>
                          {entry.rarity}
                        </span>
                      )}
                    </div>
                    <div className="text-muted text-sm" style={{ marginTop: 'var(--space-xxs)' }}>
                      {entry.minCount === entry.maxCount ? `${entry.minCount}x` : `${entry.minCount}-${entry.maxCount}x`}
                      {' | '}Weight: {entry.weight} ({probability}%)
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'var(--color-bg-primary)', borderRadius: 'var(--radius-full)', marginTop: 'var(--space-xs)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${probability}%`, backgroundColor: 'var(--color-accent-success)', borderRadius: 'var(--radius-full)' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-xs)', alignItems: 'center' }}>
                    <input
                      type="number"
                      className="stat-input"
                      value={entry.weight}
                      onChange={(e) => handleUpdateEntry(index, 'weight', parseInt(e.target.value) || 1)}
                      min={1}
                      title="Weight"
                    />
                    <Button variant="danger" size="sm" onClick={() => handleRemoveEntry(index)}>
                      ×
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add New Entry */}
          <div className="subsection">
            <div className="subsection-title">Add Loot Entry</div>
            <div className="creator-form-row">
              <FormSelect
                label="Item"
                value={newEntry.itemId}
                onChange={(v) => setNewEntry(prev => ({ ...prev, itemId: v }))}
                options={itemOptions}
                placeholder="Select item..."
              />
              <FormSelect
                label="Rarity Filter"
                value={newEntry.rarity}
                onChange={(v) => setNewEntry(prev => ({ ...prev, rarity: v }))}
                options={RARITY_OPTIONS}
              />
            </div>
            <div className="creator-form-row cols-4">
              <FormInput
                label="Weight"
                type="number"
                value={newEntry.weight}
                onChange={(v) => setNewEntry(prev => ({ ...prev, weight: v }))}
                min={1}
              />
              <FormInput
                label="Min Count"
                type="number"
                value={newEntry.minCount}
                onChange={(v) => setNewEntry(prev => ({ ...prev, minCount: v }))}
                min={1}
              />
              <FormInput
                label="Max Count"
                type="number"
                value={newEntry.maxCount}
                onChange={(v) => setNewEntry(prev => ({ ...prev, maxCount: v }))}
                min={1}
              />
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleAddEntry}
                  disabled={!newEntry.itemId}
                >
                  + Add Entry
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Tags */}
        <CollapsibleSection
          title="Tags"
          isCollapsed={collapsedSections.tags}
          onToggle={() => toggleSection('tags')}
          badge={formData.tags.length > 0 ? formData.tags.length : null}
        >
          <TagInput
            value={formData.tags}
            onChange={(v) => handleChange('tags', v)}
            suggestions={suggestedTags}
            categories={TAG_CATEGORIES}
            placeholder="Add tag..."
            showSuggestions
          />
        </CollapsibleSection>

        {/* Action Buttons */}
        <div className="creator-actions">
          <Button variant="success" onClick={handleSubmit}>
            {editingItem ? 'Update Loot Table' : 'Add Loot Table'}
          </Button>
          {editingItem && (
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* List Section */}
      <div className="creator-list">
        <h3 className="creator-form-section-title">
          Created Loot Tables
          <span className="count-badge">{items.length}</span>
        </h3>

        {items.length === 0 ? (
          <div className="empty-list">
            No loot tables created yet.
            <br />
            Use the form to create your first loot table.
          </div>
        ) : (
          items.map(item => (
            <div
              key={item._id || item.id}
              className={`creator-item-card ${hoveredItem === item._id ? 'hovered' : ''} ${editingItem?._id === item._id ? 'editing' : ''}`}
              onMouseEnter={() => setHoveredItem(item._id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className="creator-item-info">
                <div className="creator-item-name">
                  {item.name}
                </div>
                <div className="creator-item-id">
                  ID: {item.id} | {item.entries?.length || 0} items | {item.rolls || 1} roll(s)
                </div>
                {(item.goldRange?.min > 0 || item.goldRange?.max > 0) && (
                  <div className="creator-item-id">
                    Gold: {item.goldRange.min}-{item.goldRange.max}
                  </div>
                )}
                {item.tags?.length > 0 && (
                  <div className="creator-item-tags">
                    {item.tags.slice(0, 4).map(tag => (
                      <span key={tag} className="tag-chip">{tag}</span>
                    ))}
                    {item.tags.length > 4 && (
                      <span className="tag-chip more">+{item.tags.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="creator-item-actions">
                <Button variant="success" size="sm" onClick={() => onEdit(item)}>
                  Edit
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onDuplicate(item)}>
                  Duplicate
                </Button>
                <Button variant="danger" size="sm" onClick={() => onDelete(item._id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LootTableCreator;
