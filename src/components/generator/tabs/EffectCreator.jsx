import React, { useState, useEffect, useMemo } from 'react';
import { collectTags } from '../DatapackLoader';
import { FormInput, FormSelect, TagInput, Button, NumericModifierInput, CollapsibleSection } from '../../ui/shared';
import { useFormDraft } from '../../../hooks/useFormDraft';
import './CreatorStyles.css';

const DRAFT_KEY = 'contentGenerator_draft_effects';

const EFFECT_TYPES = [
  { value: 'buff', label: 'Buff' },
  { value: 'debuff', label: 'Debuff' },
  { value: 'status', label: 'Status' },
  { value: 'curse', label: 'Curse' },
  { value: 'addiction', label: 'Addiction' },
  { value: 'restraint', label: 'Restraint' },
  { value: 'environment', label: 'Environment' },
  { value: 'instant', label: 'Instant' },
];

const EFFECT_TYPE_COLORS = {
  buff: 'var(--color-accent-success)',
  debuff: 'var(--color-accent-danger)',
  status: 'var(--color-accent-warning)',
  curse: 'var(--color-accent-secondary)',
  addiction: 'var(--color-accent-info)',
  restraint: 'var(--color-text-muted)',
  environment: '#4a7c7c',
  instant: 'var(--color-border)',
};

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


const TAG_CATEGORIES = {
  type: ['buff', 'debuff', 'dot', 'hot', 'status'],
  element: ['poison', 'fire', 'ice', 'lightning', 'holy'],
  special: ['curse', 'nsfw', 'arousal', 'corruption', 'restraint', 'stun', 'slow', 'bleed'],
};

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
  operation: 'add',
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
  datapackContent = {},
  datapackLoading = false,
}) => {
  const [formData, setFormData] = useState({ ...DEFAULT_EFFECT });
  const [hoveredItem, setHoveredItem] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({
    duration: false,
    icon: true,
    modifiers: false,
    tags: false,
  });

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const { clearDraft } = useFormDraft(DRAFT_KEY, formData, setFormData, editingItem, {
    defaultValues: DEFAULT_EFFECT,
  });

  const suggestedTags = useMemo(() => {
    return collectTags({
      datapackContent,
      userContent: items,
      commonTags: Object.values(TAG_CATEGORIES).flat(),
      contentType: 'effects',
    });
  }, [datapackContent, items]);

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
      clearDraft();
    }

    setFormData({ ...DEFAULT_EFFECT });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_EFFECT });
    onCancelEdit();
  };

  return (
    <div className="creator-container">
      {/* Form Section */}
      <div className="creator-form">
        <h3 className="creator-form-section-title">
          {editingItem ? 'Edit Effect' : 'Create New Effect'}
        </h3>

        {/* Basic Info */}
        <div className="creator-form-section">
          <div className="creator-form-row">
            <FormInput
              label="ID"
              required
              value={formData.id}
              onChange={(v) => handleChange('id', String(v).toLowerCase().replace(/\s/g, '_'))}
              placeholder="unique_effect_id"
            />
            <FormInput
              label="Name"
              required
              value={formData.name}
              onChange={(v) => handleChange('name', v)}
              placeholder="Effect Name"
            />
          </div>

          <FormInput
            label="Description"
            type="textarea"
            value={formData.description}
            onChange={(v) => handleChange('description', v)}
            placeholder="What this effect does..."
            rows={3}
          />

          <div className="creator-form-row">
            <FormSelect
              label="Type"
              value={formData.type}
              onChange={(v) => handleChange('type', v)}
              options={EFFECT_TYPES}
            />
            <FormSelect
              label="Stack Behavior"
              value={formData.stackBehavior}
              onChange={(v) => handleChange('stackBehavior', v)}
              options={STACK_BEHAVIORS}
            />
          </div>

          {formData.stackBehavior === 'stack' && (
            <FormInput
              label="Max Stacks"
              type="number"
              value={formData.maxStacks}
              onChange={(v) => handleChange('maxStacks', v)}
              min={1}
            />
          )}
        </div>

        {/* Duration */}
        <CollapsibleSection
          title="Duration"
          isCollapsed={collapsedSections.duration}
          onToggle={() => toggleSection('duration')}
        >
          <div className="creator-form-row">
            <FormSelect
              label="Duration Type"
              value={formData.duration.type}
              onChange={(v) => handleNestedChange('duration', 'type', v)}
              options={DURATION_TYPES}
            />
            {formData.duration.type === 'turns' && (
              <FormInput
                label="Turn Count"
                type="number"
                value={formData.duration.value}
                onChange={(v) => handleNestedChange('duration', 'value', v)}
                min={1}
              />
            )}
          </div>
        </CollapsibleSection>

        {/* Icon */}
        <CollapsibleSection
          title="Icon"
          isCollapsed={collapsedSections.icon}
          onToggle={() => toggleSection('icon')}
        >
          <div className="creator-form-row">
            <FormInput
              label="Sprite Sheet ID"
              value={formData.icon.sheetId}
              onChange={(v) => handleNestedChange('icon', 'sheetId', v)}
              placeholder="effects"
            />
            <FormInput
              label="Icon ID"
              value={formData.icon.iconId}
              onChange={(v) => handleNestedChange('icon', 'iconId', v)}
              placeholder="effect_icon"
            />
          </div>
        </CollapsibleSection>

        {/* Stat Modifiers */}
        <CollapsibleSection
          title="Stat Modifiers"
          isCollapsed={collapsedSections.modifiers}
          onToggle={() => toggleSection('modifiers')}
          badge={formData.modifiers.length > 0 ? formData.modifiers.length : null}
        >
          {formData.modifiers.map((mod, index) => (
            <div key={index} className="array-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <span className="text-secondary text-sm">Modifier #{index + 1}</span>
                <Button variant="danger" size="sm" onClick={() => handleRemoveModifier(index)}>
                  Remove
                </Button>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-start' }}>
                <FormSelect
                  value={mod.stat}
                  onChange={(v) => handleUpdateModifier(index, { stat: v })}
                  options={STAT_MODIFIERS.map(s => ({ value: s, label: s }))}
                  style={{ minWidth: '160px' }}
                />
                <NumericModifierInput
                  value={mod}
                  onChange={(newMod) => handleUpdateModifier(index, newMod)}
                  showLabel={false}
                  allowRandom={true}
                />
              </div>
            </div>
          ))}

          <Button variant="success" size="sm" onClick={handleAddModifier} className="mt-sm">
            + Add Modifier
          </Button>
        </CollapsibleSection>

        {/* Tags */}
        <CollapsibleSection
          title="Tags"
          isCollapsed={collapsedSections.tags}
          onToggle={() => toggleSection('tags')}
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
            {editingItem ? 'Update Effect' : 'Add Effect'}
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
          Created Effects
          <span className="count-badge">{items.length}</span>
        </h3>

        {items.length === 0 ? (
          <div className="empty-list">
            No effects created yet.
            <br />
            Use the form to create your first effect.
          </div>
        ) : (
          items.map(item => (
            <div
              key={item._id}
              className={`creator-item-card ${hoveredItem === item._id ? 'hovered' : ''} ${editingItem?._id === item._id ? 'editing' : ''}`}
              onMouseEnter={() => setHoveredItem(item._id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className="creator-item-info">
                <div className="creator-item-name">
                  {item.name}
                  <span
                    className="rarity-badge"
                    style={{ backgroundColor: EFFECT_TYPE_COLORS[item.type] || 'var(--color-border)' }}
                  >
                    {item.type}
                  </span>
                </div>
                <div className="creator-item-id">
                  ID: {item.id} | {item.duration?.type === 'turns' ? `${item.duration.value} turns` : item.duration?.type}
                </div>
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

export default EffectCreator;
