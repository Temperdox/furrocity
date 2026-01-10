import React, { useState, useEffect, useMemo } from 'react';
import { collectTags } from '../DatapackLoader';
import { FormInput, FormSelect, TagInput, Button, FormTabs, FormTabPanel } from '../../ui/shared';
import { CreatorItemsList, IdNameFields, DescriptionField } from '../shared';
import { useFormDraft } from '../../../hooks/useFormDraft';
import './CreatorStyles.css';

const DRAFT_KEY = 'contentGenerator_draft_skills';

const TAG_CATEGORIES = {
  combat: ['combat', 'defense', 'magic', 'utility', 'recovery'],
  element: ['fire', 'ice', 'lightning', 'holy', 'dark', 'poison'],
  target: ['aoe', 'single_target', 'self', 'buff', 'debuff'],
  special: ['nsfw', 'corruption', 'seduction', 'restraint'],
};

const SKILL_TYPES = [
  { value: 'active', label: 'Active' },
  { value: 'passive', label: 'Passive' },
  { value: 'toggle', label: 'Toggle' },
  { value: 'reaction', label: 'Reaction' },
  { value: 'charged', label: 'Charged' },
  { value: 'channeled', label: 'Channeled' },
];

const SKILL_TYPE_COLORS = {
  active: 'var(--color-accent-success)',
  passive: 'var(--color-accent-info)',
  toggle: '#7a5a3a',
  reaction: 'var(--color-accent-secondary)',
  charged: 'var(--color-accent-warning)',
  channeled: '#3a7a7a',
};

const CATEGORIES = [
  { value: 'combat', label: 'Combat' },
  { value: 'defense', label: 'Defense' },
  { value: 'magic', label: 'Magic' },
  { value: 'utility', label: 'Utility' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'resistance', label: 'Resistance' },
  { value: 'stealth', label: 'Stealth' },
  { value: 'movement', label: 'Movement' },
  { value: 'nsfw', label: 'NSFW' },
  { value: 'support', label: 'Support' },
  { value: 'debuff', label: 'Debuff' },
];

const TARGET_TYPES = [
  { value: 'self', label: 'Self' },
  { value: 'enemy', label: 'Enemy' },
  { value: 'ally', label: 'Ally' },
  { value: 'all_enemies', label: 'All Enemies' },
  { value: 'all_allies', label: 'All Allies' },
  { value: 'everyone', label: 'Everyone' },
  { value: 'area', label: 'Area' },
  { value: 'random', label: 'Random' },
];

const DAMAGE_TYPES = [
  { value: 'physical', label: 'Physical' },
  { value: 'fire', label: 'Fire' },
  { value: 'ice', label: 'Ice' },
  { value: 'lightning', label: 'Lightning' },
  { value: 'poison', label: 'Poison' },
  { value: 'psychic', label: 'Psychic' },
  { value: 'holy', label: 'Holy' },
  { value: 'dark', label: 'Dark' },
  { value: 'true', label: 'True' },
  { value: 'chaos', label: 'Chaos' },
  { value: 'nature', label: 'Nature' },
  { value: 'arcane', label: 'Arcane' },
];

const EFFECT_TYPES = [
  { value: 'damage', label: 'Deal Damage' },
  { value: 'heal', label: 'Heal HP' },
  { value: 'restore_stamina', label: 'Restore Stamina' },
  { value: 'buff_stat', label: 'Buff Stat' },
  { value: 'debuff_stat', label: 'Debuff Stat' },
  { value: 'apply_effect', label: 'Apply Status Effect' },
  { value: 'remove_effect', label: 'Remove Status Effect' },
  { value: 'restrain', label: 'Restrain Target' },
  { value: 'break_restrain', label: 'Break Restraint' },
  { value: 'corruption', label: 'Modify Corruption' },
  { value: 'arousal', label: 'Modify Arousal' },
  { value: 'shield', label: 'Apply Shield' },
  { value: 'taunt', label: 'Taunt' },
  { value: 'stealth', label: 'Enter Stealth' },
  { value: 'teleport', label: 'Teleport' },
];

const STATS = [
  { value: 'strength', label: 'Strength' },
  { value: 'vitality', label: 'Vitality' },
  { value: 'evasion', label: 'Evasion' },
  { value: 'speed', label: 'Speed' },
  { value: 'willpower', label: 'Willpower' },
  { value: 'charm', label: 'Charm' },
  { value: 'intelligence', label: 'Intelligence' },
  { value: 'defense', label: 'Defense' },
  { value: 'attack', label: 'Attack' },
];

const DEFAULT_SKILL = {
  id: '',
  name: '',
  description: '',
  type: 'active',
  category: 'combat',
  icon: '',
  targetType: 'enemy',
  range: 1,
  cost: {
    stamina: 0,
    hp: 0,
    corruption: 0,
  },
  cooldown: 0,
  castTime: 0,
  effects: [],
  requirements: {
    level: 1,
    stats: {},
  },
  unlockConditions: [],
  isNSFW: false,
  tags: [],
};

const DEFAULT_EFFECT = {
  type: 'damage',
  value: 10,
  scaling: { stat: '', multiplier: 0 },
  damageType: 'physical',
  duration: 0,
  chance: 100,
  targetStat: '',
  effectId: '',
};

const SkillCreator = ({
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
  const [formData, setFormData] = useState({ ...DEFAULT_SKILL });
  const [newEffect, setNewEffect] = useState({ ...DEFAULT_EFFECT });
  const [activeTab, setActiveTab] = useState('basic');

  const { clearDraft } = useFormDraft(DRAFT_KEY, formData, setFormData, editingItem, {
    defaultValues: DEFAULT_SKILL,
  });

  // Compute dynamic tag suggestions
  const suggestedTags = useMemo(() => {
    return collectTags({
      datapackContent,
      userContent: items,
      commonTags: Object.values(TAG_CATEGORIES).flat(),
      contentType: 'skills',
    });
  }, [datapackContent, items]);

  // Combine datapack content with user-created content
  const allEffects = [...(datapackContent.effects || []), ...(allContent?.effects || [])];
  const effectOptions = useMemo(() => {
    return allEffects.map(eff => ({ value: eff.id, label: eff.name || eff.id }));
  }, [allEffects]);

  // Define tabs with badges
  const tabs = useMemo(() => {
    const hasRequirements = formData.requirements.level > 1 || Object.keys(formData.requirements.stats || {}).length > 0;

    return [
      { id: 'basic', label: 'Basic' },
      { id: 'effects', label: 'Effects', badge: formData.effects.length || null },
      { id: 'requirements', label: 'Requirements', badge: hasRequirements || formData.isNSFW ? '!' : null },
    ];
  }, [formData.effects.length, formData.requirements, formData.isNSFW]);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...DEFAULT_SKILL,
        ...editingItem,
        cost: { ...DEFAULT_SKILL.cost, ...editingItem.cost },
        requirements: { ...DEFAULT_SKILL.requirements, ...editingItem.requirements },
        effects: editingItem.effects || [],
        tags: editingItem.tags || [],
      });
    } else {
      setFormData({ ...DEFAULT_SKILL });
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

  // Effect handlers
  const handleAddEffect = () => {
    if (newEffect.type) {
      setFormData(prev => ({
        ...prev,
        effects: [...prev.effects, { ...newEffect }],
      }));
      setNewEffect({ ...DEFAULT_EFFECT });
    }
  };

  const handleRemoveEffect = (index) => {
    setFormData(prev => ({
      ...prev,
      effects: prev.effects.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    if (!formData.id || !formData.name) {
      alert('Skill ID and Name are required');
      return;
    }

    if (!editingItem && items.some(item => item.id === formData.id)) {
      alert('A skill with this ID already exists');
      return;
    }

    if (editingItem) {
      onUpdate(editingItem._id, formData);
    } else {
      onAdd(formData);
      clearDraft();
    }

    setFormData({ ...DEFAULT_SKILL });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_SKILL });
    if (onCancelEdit) onCancelEdit();
  };

  const getEffectDescription = (effect) => {
    switch (effect.type) {
      case 'damage':
        return `Deal ${effect.value} ${effect.damageType} damage`;
      case 'heal':
        return `Heal ${effect.value} HP`;
      case 'restore_stamina':
        return `Restore ${effect.value} Stamina`;
      case 'buff_stat':
        return `+${effect.value} ${effect.targetStat} for ${effect.duration} turns`;
      case 'debuff_stat':
        return `-${effect.value} ${effect.targetStat} for ${effect.duration} turns`;
      case 'apply_effect':
        return `Apply "${effect.effectId}" for ${effect.duration} turns`;
      case 'corruption':
        return `${effect.value > 0 ? '+' : ''}${effect.value} Corruption`;
      case 'arousal':
        return `${effect.value > 0 ? '+' : ''}${effect.value} Arousal`;
      default:
        return `${effect.type}: ${effect.value}`;
    }
  };

  return (
    <div className="creator-container">
      {/* Form Section */}
      <div className="creator-form">
        <h3 className="creator-form-section-title">
          {editingItem ? 'Edit Skill' : 'Create New Skill'}
        </h3>

        <FormTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Basic Tab */}
        <FormTabPanel id="basic" activeTab={activeTab}>
          <IdNameFields
            idValue={formData.id}
            nameValue={formData.name}
            onIdChange={(v) => handleChange('id', v)}
            onNameChange={(v) => handleChange('name', v)}
            idPlaceholder="unique_skill_id"
            namePlaceholder="Skill Name"
          />

          <DescriptionField
            value={formData.description}
            onChange={(v) => handleChange('description', v)}
            placeholder="Describe this skill..."
          />

          <div className="creator-form-row cols-3">
            <FormSelect
              label="Skill Type"
              value={formData.type}
              onChange={(v) => handleChange('type', v)}
              options={SKILL_TYPES}
            />
            <FormSelect
              label="Category"
              value={formData.category}
              onChange={(v) => handleChange('category', v)}
              options={CATEGORIES}
            />
            <FormSelect
              label="Target"
              value={formData.targetType}
              onChange={(v) => handleChange('targetType', v)}
              options={TARGET_TYPES}
            />
          </div>

          {/* Cost (only for non-passive skills) */}
          {formData.type !== 'passive' && (
            <>
              <h4 style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-lg)', marginBottom: 'var(--space-sm)' }}>
                Skill Cost
              </h4>
              <div className="creator-form-row cols-3">
                <FormInput
                  label="Stamina Cost"
                  type="number"
                  value={formData.cost.stamina}
                  onChange={(v) => handleNestedChange('cost', 'stamina', v)}
                  min={0}
                />
                <FormInput
                  label="HP Cost"
                  type="number"
                  value={formData.cost.hp}
                  onChange={(v) => handleNestedChange('cost', 'hp', v)}
                  min={0}
                />
                <FormInput
                  label="Cooldown (turns)"
                  type="number"
                  value={formData.cooldown}
                  onChange={(v) => handleChange('cooldown', v)}
                  min={0}
                />
              </div>
            </>
          )}

          {/* Tags */}
          <h4 style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-lg)', marginBottom: 'var(--space-sm)' }}>
            Tags
            {formData.tags.length > 0 && <span className="count-badge" style={{ marginLeft: 'var(--space-sm)' }}>{formData.tags.length}</span>}
          </h4>
          <TagInput
            value={formData.tags}
            onChange={(v) => handleChange('tags', v)}
            suggestions={suggestedTags}
            categories={TAG_CATEGORIES}
            placeholder="Add tag..."
            showSuggestions
          />
        </FormTabPanel>

        {/* Effects Tab */}
        <FormTabPanel id="effects" activeTab={activeTab}>
          {formData.effects.length > 0 && (
            <>
              <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
                Current Effects
              </h4>
              {formData.effects.map((effect, index) => (
                <div key={index} className="array-item">
                  <div className="array-item-content">
                    <span style={{ color: 'var(--color-accent-success)' }}>
                      {getEffectDescription(effect)}
                      {effect.chance < 100 && ` (${effect.chance}% chance)`}
                    </span>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => handleRemoveEffect(index)}>
                    x
                  </Button>
                </div>
              ))}
            </>
          )}

          {formData.effects.length === 0 && (
            <div className="empty-list" style={{ marginBottom: 'var(--space-lg)' }}>
              No effects added yet. Add effects below.
            </div>
          )}

          {/* Add New Effect */}
          <div className="subsection">
            <div className="subsection-title">Add Effect</div>
            <div className="creator-form-row cols-3">
              <FormSelect
                label="Effect Type"
                value={newEffect.type}
                onChange={(v) => setNewEffect(prev => ({ ...prev, type: v }))}
                options={EFFECT_TYPES}
              />
              <FormInput
                label="Value"
                type="number"
                value={newEffect.value}
                onChange={(v) => setNewEffect(prev => ({ ...prev, value: v }))}
              />
              <FormInput
                label="Chance (%)"
                type="number"
                value={newEffect.chance}
                onChange={(v) => setNewEffect(prev => ({ ...prev, chance: v }))}
                min={0}
                max={100}
              />
            </div>

            <div className="creator-form-row cols-3">
              {newEffect.type === 'damage' && (
                <FormSelect
                  label="Damage Type"
                  value={newEffect.damageType}
                  onChange={(v) => setNewEffect(prev => ({ ...prev, damageType: v }))}
                  options={DAMAGE_TYPES}
                />
              )}
              {['buff_stat', 'debuff_stat'].includes(newEffect.type) && (
                <FormSelect
                  label="Target Stat"
                  value={newEffect.targetStat}
                  onChange={(v) => setNewEffect(prev => ({ ...prev, targetStat: v }))}
                  options={STATS}
                  placeholder="Select stat..."
                />
              )}
              {['buff_stat', 'debuff_stat', 'apply_effect'].includes(newEffect.type) && (
                <FormInput
                  label="Duration (turns)"
                  type="number"
                  value={newEffect.duration}
                  onChange={(v) => setNewEffect(prev => ({ ...prev, duration: v }))}
                  min={0}
                />
              )}
              {newEffect.type === 'apply_effect' && (
                <FormSelect
                  label="Status Effect"
                  value={newEffect.effectId}
                  onChange={(v) => setNewEffect(prev => ({ ...prev, effectId: v }))}
                  options={effectOptions}
                  placeholder="Select effect..."
                />
              )}
            </div>

            <Button variant="success" size="sm" onClick={handleAddEffect} className="mt-sm">
              + Add Effect
            </Button>
          </div>
        </FormTabPanel>

        {/* Requirements Tab */}
        <FormTabPanel id="requirements" activeTab={activeTab}>
          <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
            Level & Flags
          </h4>
          <div className="creator-form-row">
            <FormInput
              label="Required Level"
              type="number"
              value={formData.requirements.level}
              onChange={(v) => handleNestedChange('requirements', 'level', v)}
              min={1}
            />
            <div className="form-group" style={{ marginTop: 'var(--space-lg)' }}>
              <label className="form-label checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isNSFW}
                  onChange={(e) => handleChange('isNSFW', e.target.checked)}
                />
                <span className="checkbox-text">NSFW Skill</span>
              </label>
            </div>
          </div>
        </FormTabPanel>

        {/* Action Buttons */}
        <div className="creator-actions">
          <Button variant="success" onClick={handleSubmit}>
            {editingItem ? 'Update Skill' : 'Add Skill'}
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
        title="Created Skills"
        itemType="skill"
        editingItem={editingItem}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        renderItemContent={(item) => (
          <>
            <div className="creator-item-name">
              {item.name}
              <span
                className="rarity-badge"
                style={{ backgroundColor: SKILL_TYPE_COLORS[item.type] || 'var(--color-border)' }}
              >
                {item.type}
              </span>
            </div>
            <div className="creator-item-id">
              ID: {item.id} | {item.category}
              {item.cost?.stamina > 0 && ` | ${item.cost.stamina} Stamina`}
              {item.cooldown > 0 && ` | ${item.cooldown}t CD`}
            </div>
            <div className="creator-item-id">
              {item.effects?.length || 0} effects
              {item.isNSFW && ' | NSFW'}
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

export default SkillCreator;
