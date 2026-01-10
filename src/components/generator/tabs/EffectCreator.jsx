import React, { useState, useEffect, useMemo } from 'react';
import { collectTags } from '../DatapackLoader';
import { FormInput, FormSelect, TagInput, Button, NumericModifierInput, FormTabs, FormTabPanel } from '../../ui/shared';
import { CreatorItemsList, IdNameFields, DescriptionField } from '../shared';
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
  const [activeTab, setActiveTab] = useState('basic');

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

  const tabs = useMemo(() => {
    const hasModifiers = formData.modifiers.length > 0;
    const hasTags = formData.tags.length > 0;

    return [
      { id: 'basic', label: 'Basic' },
      { id: 'stats', label: 'Stats', badge: hasModifiers ? formData.modifiers.length : null },
      { id: 'timing', label: 'Timing' },
      { id: 'stacking', label: 'Stacking', badge: formData.stackBehavior === 'stack' ? formData.maxStacks : null },
      { id: 'tags', label: 'Tags', badge: hasTags ? formData.tags.length : null },
    ];
  }, [formData.modifiers.length, formData.tags.length, formData.stackBehavior, formData.maxStacks]);

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

        <FormTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Basic Tab */}
        <FormTabPanel id="basic" activeTab={activeTab}>
          <IdNameFields
            idValue={formData.id}
            nameValue={formData.name}
            onIdChange={(v) => handleChange('id', v)}
            onNameChange={(v) => handleChange('name', v)}
            idPlaceholder="unique_effect_id"
            namePlaceholder="Effect Name"
          />

          <DescriptionField
            value={formData.description}
            onChange={(v) => handleChange('description', v)}
            placeholder="What this effect does..."
          />

          <FormSelect
            label="Type"
            value={formData.type}
            onChange={(v) => handleChange('type', v)}
            options={EFFECT_TYPES}
          />

          {/* Icon Configuration */}
          <h4 style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-lg)', marginBottom: 'var(--space-sm)' }}>
            Icon
          </h4>
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
        </FormTabPanel>

        {/* Stats Tab */}
        <FormTabPanel id="stats" activeTab={activeTab}>
          <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
            Stat Modifiers
          </h4>
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

          {formData.modifiers.length === 0 && (
            <div className="empty-list" style={{ marginTop: 'var(--space-md)' }}>
              No stat modifiers configured.
              <br />
              Click the button above to add stat modifications.
            </div>
          )}
        </FormTabPanel>

        {/* Timing Tab */}
        <FormTabPanel id="timing" activeTab={activeTab}>
          <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
            Duration
          </h4>
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
        </FormTabPanel>

        {/* Stacking Tab */}
        <FormTabPanel id="stacking" activeTab={activeTab}>
          <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
            Stack Behavior
          </h4>
          <FormSelect
            label="Stack Behavior"
            value={formData.stackBehavior}
            onChange={(v) => handleChange('stackBehavior', v)}
            options={STACK_BEHAVIORS}
          />

          {formData.stackBehavior === 'stack' && (
            <FormInput
              label="Max Stacks"
              type="number"
              value={formData.maxStacks}
              onChange={(v) => handleChange('maxStacks', v)}
              min={1}
            />
          )}

          <div className="form-helper" style={{ marginTop: 'var(--space-md)' }}>
            <strong>Behavior descriptions:</strong>
            <ul style={{ marginTop: 'var(--space-xs)', paddingLeft: 'var(--space-md)' }}>
              <li><strong>Refresh:</strong> Reapplying resets the duration</li>
              <li><strong>Stack:</strong> Each application adds a stack up to max</li>
              <li><strong>Intensify:</strong> Each application increases severity</li>
              <li><strong>Replace:</strong> New application overwrites the old one</li>
            </ul>
          </div>
        </FormTabPanel>

        {/* Tags Tab */}
        <FormTabPanel id="tags" activeTab={activeTab}>
          <TagInput
            value={formData.tags}
            onChange={(v) => handleChange('tags', v)}
            suggestions={suggestedTags}
            categories={TAG_CATEGORIES}
            placeholder="Add tag..."
            showSuggestions
          />
        </FormTabPanel>

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
      <CreatorItemsList
        items={items}
        title="Created Effects"
        itemType="effect"
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        editingItem={editingItem}
        renderItemContent={(item) => (
          <>
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
          </>
        )}
      />
    </div>
  );
};

export default EffectCreator;
