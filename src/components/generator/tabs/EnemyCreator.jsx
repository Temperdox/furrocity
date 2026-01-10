import React, { useState, useEffect, useMemo } from 'react';
import { collectTags } from '../DatapackLoader';
import { FormInput, FormSelect, TagInput, ChipSelect, Button, FormTabs, FormTabPanel } from '../../ui/shared';
import { CreatorItemsList, IdNameFields, DescriptionField, StatsGrid } from '../shared';
import { useFormDraft } from '../../../hooks/useFormDraft';
import './CreatorStyles.css';

const DRAFT_KEY = 'contentGenerator_draft_enemies';

// Enemy types
const ENEMY_TYPES = [
  'humanoid', 'beast', 'demon', 'undead', 'plant', 'elemental',
  'construct', 'dragon', 'slime', 'insect', 'aquatic', 'aberration',
];

// Enemy variants
const VARIANTS = [
  'normal', 'elite', 'boss', 'miniboss', 'champion', 'legendary', 'swarm',
];

// NSFW action types
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

// Tag categories for suggestions
const TAG_CATEGORIES = {
  type: ['humanoid', 'beast', 'demon', 'undead', 'boss', 'elite'],
  species: ['wolf', 'goblin', 'orc', 'tentacle', 'slime'],
  nsfw: ['nsfw', 'corruption', 'male', 'female', 'futa'],
};

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
  sceneId: '',
  arousalDamage: 5,
  corruptionDamage: 0,
  weight: 1,
  requiresGrapple: false,
  tags: [],
};

const EnemyCreator = ({
  items = [],
  scenes = [],
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
  const allScenes = [...(datapackContent.scenes || []), ...scenes];
  const allItems = [...(datapackContent.items || [])];

  const [activeTab, setActiveTab] = useState('basic');

  const getNsfwScenesForType = (actionType) => {
    return allScenes.filter(scene => {
      if (!scene.isNSFW) return false;
      if (scene.nsfwActionTypes?.length > 0) {
        return scene.nsfwActionTypes.includes(actionType);
      }
      return scene.nsfwActionType === actionType || !scene.nsfwActionType;
    });
  };

  const allNsfwScenes = allScenes.filter(scene => scene.isNSFW);
  const [formData, setFormData] = useState({ ...DEFAULT_ENEMY });
  const [dropInput, setDropInput] = useState({ itemId: '', chance: 0.1 });

  const { clearDraft } = useFormDraft(DRAFT_KEY, formData, setFormData, editingItem, {
    defaultValues: DEFAULT_ENEMY,
  });

  const suggestedTags = useMemo(() => {
    return collectTags({
      datapackContent,
      userContent: items,
      commonTags: Object.values(TAG_CATEGORIES).flat(),
      contentType: 'enemies',
    });
  }, [datapackContent, items]);

  // Define tabs with badges
  const tabs = useMemo(() => {
    const hasStats = Object.values(formData.baseStats).some(v => v !== 0);
    const hasDrops = formData.rewards.drops.length > 0;
    const hasNsfwActions = formData.nsfwActionData.actions.length > 0;

    return [
      { id: 'basic', label: 'Basic' },
      { id: 'stats', label: 'Stats', badge: hasStats ? '✓' : null },
      { id: 'loot', label: 'Loot', badge: hasDrops ? formData.rewards.drops.length : null },
      { id: 'nsfw', label: 'NSFW', badge: formData.nsfwEnabled ? (hasNsfwActions ? formData.nsfwActionData.actions.length : '✓') : null },
      { id: 'visuals', label: 'Visuals', badge: (formData.sprite || formData.portrait) ? '✓' : null },
      { id: 'tags', label: 'Tags', badge: formData.tags.length || null },
    ];
  }, [formData.baseStats, formData.rewards.drops.length, formData.nsfwEnabled, formData.nsfwActionData.actions.length, formData.sprite, formData.portrait, formData.tags.length]);

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
      clearDraft();
    }

    setFormData({ ...DEFAULT_ENEMY });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_ENEMY });
    onCancelEdit();
  };

  return (
    <div className="creator-container">
      {/* Form Section */}
      <div className="creator-form">
        <h3 className="creator-form-section-title">
          {editingItem ? 'Edit Enemy' : 'Create New Enemy'}
        </h3>

        <FormTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Basic Tab */}
        <FormTabPanel id="basic" activeTab={activeTab}>
          <IdNameFields
            idValue={formData.id}
            nameValue={formData.name}
            onIdChange={(v) => handleChange('id', v)}
            onNameChange={(v) => handleChange('name', v)}
            idPlaceholder="unique_enemy_id"
            namePlaceholder="Enemy Name"
          />

          <DescriptionField
            value={formData.description}
            onChange={(v) => handleChange('description', v)}
            placeholder="Describe this enemy..."
          />

          <div className="creator-form-row cols-3">
            <FormSelect
              label="Type"
              value={formData.type}
              onChange={(v) => handleChange('type', v)}
              options={ENEMY_TYPES}
            />
            <FormSelect
              label="Variant"
              value={formData.variant}
              onChange={(v) => handleChange('variant', v)}
              options={VARIANTS}
            />
            <FormInput
              label="Level"
              type="number"
              value={formData.level}
              onChange={(v) => handleChange('level', v)}
              min={1}
            />
          </div>
        </FormTabPanel>

        {/* Stats Tab */}
        <FormTabPanel id="stats" activeTab={activeTab}>
          <StatsGrid
            stats={formData.baseStats}
            onChange={(stat, value) => handleNestedChange('baseStats', stat, value)}
            title="Base Stats"
          />
        </FormTabPanel>

        {/* Loot Tab */}
        <FormTabPanel id="loot" activeTab={activeTab}>
          <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
            Rewards
          </h4>
          <div className="creator-form-row cols-3">
            <FormInput
              label="XP"
              type="number"
              value={formData.rewards.xp}
              onChange={(v) => handleNestedChange('rewards', 'xp', v)}
              min={0}
            />
            <FormInput
              label="Gold Min"
              type="number"
              value={formData.rewards.gold.min}
              onChange={(v) => handleDeepNestedChange('rewards', 'gold', 'min', v)}
              min={0}
            />
            <FormInput
              label="Gold Max"
              type="number"
              value={formData.rewards.gold.max}
              onChange={(v) => handleDeepNestedChange('rewards', 'gold', 'max', v)}
              min={0}
            />
          </div>

          <div className="subsection">
            <div className="subsection-title">Item Drops</div>
            {formData.rewards.drops.map((drop, index) => {
              const itemData = allItems.find(i => i.id === drop.itemId);
              return (
                <div key={index} className="array-item">
                  <div className="array-item-content">
                    <span className="text-primary">{itemData?.name || drop.itemId}</span>
                    <span className="text-muted ml-sm">({(drop.chance * 100).toFixed(0)}%)</span>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => handleRemoveDrop(index)}>
                    Remove
                  </Button>
                </div>
              );
            })}
            <div className="creator-form-row mt-sm">
              <FormSelect
                value={dropInput.itemId}
                onChange={(v) => setDropInput(prev => ({ ...prev, itemId: v }))}
                options={allItems.map(item => ({ value: item.id, label: `${item.name || item.id} (${item.type || 'item'})` }))}
                placeholder="Select item..."
              />
              <FormInput
                type="number"
                value={dropInput.chance}
                onChange={(v) => setDropInput(prev => ({ ...prev, chance: v }))}
                placeholder="Chance (0-1)"
                min={0}
                max={1}
                step={0.05}
              />
              <Button variant="success" size="sm" onClick={handleAddDrop}>
                Add Drop
              </Button>
            </div>
          </div>
        </FormTabPanel>

        {/* NSFW Tab */}
        <FormTabPanel id="nsfw" activeTab={activeTab}>
          <div className={`highlight-section-inner ${formData.nsfwEnabled ? 'active' : ''}`}>
            <div className="form-group">
              <label className="form-label checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.nsfwEnabled}
                  onChange={(e) => handleChange('nsfwEnabled', e.target.checked)}
                />
                <span className="checkbox-text">NSFW Content Enabled</span>
              </label>
            </div>

            {formData.nsfwEnabled && (
              <>
                <div className="creator-form-row">
                  <FormInput
                    label="Grapple Chance"
                    type="number"
                    value={formData.nsfwActionData.grappleChance}
                    onChange={(v) => handleNestedChange('nsfwActionData', 'grappleChance', v)}
                    min={0}
                    max={1}
                    step={0.1}
                    helper="0-1 probability"
                  />
                  <FormInput
                    label="Base Arousal Damage"
                    type="number"
                    value={formData.nsfwActionData.arousalDamage}
                    onChange={(v) => handleNestedChange('nsfwActionData', 'arousalDamage', v)}
                    min={0}
                  />
                </div>

                <div className="subsection mt-md">
                  <div className="subsection-title">NSFW Actions</div>
                  <div className="form-helper mb-sm">
                    Link actions to NSFW scenes created in the Scenes tab.
                  </div>

                  {formData.nsfwActionData.actions.map((action, index) => {
                    const matchingScenes = getNsfwScenesForType(action.type);
                    const otherScenes = allNsfwScenes.filter(s => {
                      if (s.nsfwActionTypes?.length > 0) {
                        return !s.nsfwActionTypes.includes(action.type);
                      }
                      return s.nsfwActionType !== action.type && s.nsfwActionType;
                    });

                    return (
                      <div key={index} className="array-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                          <span className="text-gold text-sm">Action #{index + 1}</span>
                          <Button variant="danger" size="sm" onClick={() => handleRemoveNsfwAction(index)}>
                            Remove
                          </Button>
                        </div>

                        <div className="creator-form-row">
                          <div className="form-group">
                            <label className="form-label">Action Type</label>
                            <ChipSelect
                              value={action.type}
                              onChange={(v) => handleUpdateNsfwAction(index, { type: v })}
                              options={NSFW_ACTION_TYPES}
                            />
                          </div>
                          <FormInput
                            label="Action Name"
                            value={action.name}
                            onChange={(v) => handleUpdateNsfwAction(index, { name: v })}
                            placeholder="Action Name"
                          />
                        </div>

                        <div className="creator-form-row">
                          <FormInput
                            label="Arousal Damage"
                            type="number"
                            value={action.arousalDamage}
                            onChange={(v) => handleUpdateNsfwAction(index, { arousalDamage: v })}
                            min={0}
                          />
                          <FormInput
                            label="Corruption Damage"
                            type="number"
                            value={action.corruptionDamage}
                            onChange={(v) => handleUpdateNsfwAction(index, { corruptionDamage: v })}
                            min={0}
                          />
                        </div>

                        <FormSelect
                          label="Linked Scene"
                          value={action.sceneId || ''}
                          onChange={(v) => handleUpdateNsfwAction(index, { sceneId: v })}
                          groups={{
                            [`Matching: ${action.type}`]: matchingScenes.map(s => ({ value: s.id, label: `${s.name} (${s.id})` })),
                            'Other NSFW Scenes': otherScenes.map(s => ({ value: s.id, label: `${s.name} (${s.nsfwActionTypes?.join(', ') || s.nsfwActionType || 'untyped'})` })),
                          }}
                          placeholder="-- No scene linked --"
                        />

                        <div className="form-group mt-sm">
                          <label className="form-label checkbox-label">
                            <input
                              type="checkbox"
                              checked={action.requiresGrapple}
                              onChange={(e) => handleUpdateNsfwAction(index, { requiresGrapple: e.target.checked })}
                            />
                            <span className="checkbox-text">Requires Grapple</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}

                  <Button variant="success" size="sm" onClick={handleAddNsfwAction} className="mt-sm">
                    + Add NSFW Action
                  </Button>

                  {allNsfwScenes.length === 0 && (
                    <div className="form-helper mt-sm text-warning">
                      Tip: Create NSFW scenes in the Scenes tab to link them to actions
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </FormTabPanel>

        {/* Visuals Tab */}
        <FormTabPanel id="visuals" activeTab={activeTab}>
          <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
            Enemy Images
          </h4>
          <div className="creator-form-row">
            <FormInput
              label="Sprite Image"
              value={formData.sprite}
              onChange={(v) => handleChange('sprite', v)}
              placeholder="/enemies/enemy_sprite.png"
              helper="Battle sprite image path"
            />
            <FormInput
              label="Portrait Image"
              value={formData.portrait}
              onChange={(v) => handleChange('portrait', v)}
              placeholder="/enemies/enemy_portrait.png"
              helper="Portrait/dialogue image path"
            />
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
            {editingItem ? 'Update Enemy' : 'Add Enemy'}
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
        title="Created Enemies"
        itemType="enemy"
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        editingItem={editingItem}
        renderItemContent={(item) => (
          <>
            <div className="creator-item-name">
              {item.name}
              {item.variant !== 'normal' && (
                <span
                  className="rarity-badge"
                  style={{ backgroundColor: item.variant === 'boss' ? 'var(--color-accent-danger)' : 'var(--color-accent-secondary)' }}
                >
                  {item.variant}
                </span>
              )}
            </div>
            <div className="creator-item-id">
              ID: {item.id} | Lvl: {item.level} | Type: {item.type}
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

export default EnemyCreator;
