import React, { useState, useEffect, useMemo } from 'react';
import { collectTags } from '../DatapackLoader';
import { FormInput, FormSelect, TagInput, Button, FormTabs, FormTabPanel } from '../../ui/shared';
import { CreatorItemsList, IdNameFields, DescriptionField } from '../shared';
import { useFormDraft } from '../../../hooks/useFormDraft';
import './CreatorStyles.css';

const DRAFT_KEY = 'contentGenerator_draft_npcs';

const TAG_CATEGORIES = {
  type: ['merchant', 'quest', 'companion', 'romance', 'nsfw'],
  disposition: ['friendly', 'hostile', 'neutral', 'mysterious'],
  species: ['human', 'elf', 'demon', 'beast', 'undead'],
};

const ROLE_OPTIONS = [
  { value: 'merchant', label: 'Merchant' },
  { value: 'quest_giver', label: 'Quest Giver' },
  { value: 'companion', label: 'Companion' },
  { value: 'innkeeper', label: 'Innkeeper' },
  { value: 'blacksmith', label: 'Blacksmith' },
  { value: 'healer', label: 'Healer' },
  { value: 'guard', label: 'Guard' },
  { value: 'villager', label: 'Villager' },
  { value: 'romance', label: 'Romance' },
  { value: 'antagonist', label: 'Antagonist' },
  { value: 'bartender', label: 'Bartender' },
  { value: 'trainer', label: 'Trainer' },
  { value: 'banker', label: 'Banker' },
  { value: 'mayor', label: 'Mayor' },
  { value: 'priest', label: 'Priest' },
  { value: 'thief', label: 'Thief' },
  { value: 'scholar', label: 'Scholar' },
];

const ITEM_TAG_CATEGORIES = {
  type: ['weapon', 'armor', 'consumable', 'material', 'quest', 'misc'],
  nsfw: ['nsfw', 'toy', 'clothing', 'jewelry'],
  general: ['food', 'potion', 'scroll', 'key'],
};

const DEFAULT_NPC = {
  id: '',
  name: '',
  description: '',
  role: 'villager',
  defaultLocationId: '',
  schedule: [],
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
  datapackContent = {},
  datapackLoading = false,
}) => {
  const [formData, setFormData] = useState({ ...DEFAULT_NPC });
  const [activeTab, setActiveTab] = useState('basic');

  const { clearDraft } = useFormDraft(DRAFT_KEY, formData, setFormData, editingItem, {
    defaultValues: DEFAULT_NPC,
  });

  // Combine datapack locations with user-created locations
  const allLocations = useMemo(() => {
    return [...(datapackContent.locations || []), ...locations]
      .filter(loc => {
        const hasLocationFields = loc.locationType || loc.parentRegion || loc.connectedLocations || loc.navigation;
        const hasEnemyFields = loc.tier !== undefined || loc.maxHp !== undefined || loc.nsfwActions !== undefined || loc.loot !== undefined;
        return hasLocationFields || !hasEnemyFields;
      });
  }, [datapackContent.locations, locations]);

  const locationOptions = useMemo(() => {
    return allLocations.map(l => ({ value: l.id, label: l.name }));
  }, [allLocations]);

  const suggestedTags = useMemo(() => {
    return collectTags({
      datapackContent,
      userContent: items,
      commonTags: Object.values(TAG_CATEGORIES).flat(),
      contentType: 'npcs',
    });
  }, [datapackContent, items]);

  const suggestedItemTags = useMemo(() => {
    return collectTags({
      datapackContent,
      userContent: [],
      commonTags: Object.values(ITEM_TAG_CATEGORIES).flat(),
      contentType: 'items',
    });
  }, [datapackContent]);

  const isMerchant = formData.role === 'merchant' || formData.role === 'blacksmith' || formData.role === 'innkeeper';

  // Define tabs with badges
  const tabs = useMemo(() => {
    const tabList = [
      { id: 'basic', label: 'Basic' },
      { id: 'schedule', label: 'Schedule', badge: formData.schedule?.length > 0 ? formData.schedule.length : null },
      { id: 'dialogue', label: 'Dialogue' },
    ];

    // Only show merchant tab if role is merchant-related
    if (isMerchant) {
      tabList.push({ id: 'merchant', label: 'Merchant' });
    }

    tabList.push(
      { id: 'nsfw', label: 'NSFW', badge: formData.nsfwEnabled ? 'On' : null },
      { id: 'tags', label: 'Tags', badge: formData.tags?.length > 0 ? formData.tags.length : null }
    );

    return tabList;
  }, [formData.schedule?.length, formData.nsfwEnabled, formData.tags?.length, isMerchant]);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...DEFAULT_NPC,
        ...editingItem,
        defaultLocationId: editingItem.defaultLocationId || editingItem.locationId || '',
        schedule: editingItem.schedule || [],
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

  // Schedule handlers
  const handleAddScheduleSlot = () => {
    const newSchedule = [...(formData.schedule || []), { startHour: 6, endHour: 18, locationId: '' }];
    handleChange('schedule', newSchedule);
  };

  const handleUpdateScheduleSlot = (index, field, value) => {
    const newSchedule = [...formData.schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    handleChange('schedule', newSchedule);
  };

  const handleRemoveScheduleSlot = (index) => {
    const newSchedule = formData.schedule.filter((_, i) => i !== index);
    handleChange('schedule', newSchedule);
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
      clearDraft();
    }

    setFormData({ ...DEFAULT_NPC });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_NPC });
    onCancelEdit();
  };

  // Generate hour options for schedule
  const hourOptions = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      value: i,
      label: `${i.toString().padStart(2, '0')}:00`,
    }));
  }, []);

  return (
    <div className="creator-container">
      {/* Form Section */}
      <div className="creator-form">
        <h3 className="creator-form-section-title">
          {editingItem ? 'Edit NPC' : 'Create New NPC'}
        </h3>

        <FormTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Basic Tab */}
        <FormTabPanel id="basic" activeTab={activeTab}>
          <IdNameFields
            idValue={formData.id}
            nameValue={formData.name}
            onIdChange={(v) => handleChange('id', v)}
            onNameChange={(v) => handleChange('name', v)}
            idPlaceholder="unique_npc_id"
            namePlaceholder="NPC Name"
          />

          <DescriptionField
            value={formData.description}
            onChange={(v) => handleChange('description', v)}
            placeholder="Describe this NPC..."
          />

          <div className="creator-form-row">
            <FormSelect
              label="Role"
              value={formData.role}
              onChange={(v) => handleChange('role', v)}
              options={ROLE_OPTIONS}
            />
            <FormSelect
              label="Default Location"
              value={formData.defaultLocationId || formData.locationId || ''}
              onChange={(v) => handleChange('defaultLocationId', v)}
              options={locationOptions}
              placeholder="Select Default Location"
              helper="Where NPC is when no schedule applies"
            />
          </div>

          <FormInput
            label="Portrait Image"
            value={formData.portrait}
            onChange={(v) => handleChange('portrait', v)}
            placeholder="/npcs/character.png"
          />
        </FormTabPanel>

        {/* Schedule Tab */}
        <FormTabPanel id="schedule" activeTab={activeTab}>
          <div className="creator-form-section">
            <div style={{ marginBottom: 'var(--space-sm)' }}>
              <Button variant="success" size="sm" onClick={handleAddScheduleSlot}>
                + Add Time Slot
              </Button>
            </div>

            {(formData.schedule || []).length === 0 ? (
              <div className="empty-list" style={{ padding: 'var(--space-md)' }}>
                No schedule defined - NPC will always be at default location
              </div>
            ) : (
              formData.schedule.map((slot, index) => (
                <div key={index} className="array-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div className="creator-form-row cols-4">
                    <FormSelect
                      label="From"
                      value={slot.startHour}
                      onChange={(v) => handleUpdateScheduleSlot(index, 'startHour', parseInt(v))}
                      options={hourOptions}
                    />
                    <FormSelect
                      label="To"
                      value={slot.endHour}
                      onChange={(v) => handleUpdateScheduleSlot(index, 'endHour', parseInt(v))}
                      options={hourOptions}
                    />
                    <FormSelect
                      label="Location"
                      value={slot.locationId}
                      onChange={(v) => handleUpdateScheduleSlot(index, 'locationId', v)}
                      options={locationOptions}
                      placeholder="Select Location"
                    />
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <Button variant="danger" size="sm" onClick={() => handleRemoveScheduleSlot(index)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </FormTabPanel>

        {/* Dialogue Tab */}
        <FormTabPanel id="dialogue" activeTab={activeTab}>
          <div className="creator-form-section">
            <div className="creator-form-row">
              <FormInput
                label="Greeting (First Time)"
                value={formData.dialogue.greeting}
                onChange={(v) => handleNestedChange('dialogue', 'greeting', v)}
                placeholder="Hello, traveler!"
              />
              <FormInput
                label="Greeting (Repeat)"
                value={formData.dialogue.greeting_repeat}
                onChange={(v) => handleNestedChange('dialogue', 'greeting_repeat', v)}
                placeholder="Back again?"
              />
            </div>
            <FormInput
              label="Farewell"
              value={formData.dialogue.farewell}
              onChange={(v) => handleNestedChange('dialogue', 'farewell', v)}
              placeholder="Safe travels!"
            />
            {isMerchant && (
              <div className="creator-form-row">
                <FormInput
                  label="Cannot Buy Item"
                  value={formData.dialogue.cannotBuy}
                  onChange={(v) => handleNestedChange('dialogue', 'cannotBuy', v)}
                  placeholder="I can't accept that."
                />
                <FormInput
                  label="Cannot Afford"
                  value={formData.dialogue.cannotAfford}
                  onChange={(v) => handleNestedChange('dialogue', 'cannotAfford', v)}
                  placeholder="You don't have enough gold."
                />
              </div>
            )}
          </div>
        </FormTabPanel>

        {/* Merchant Tab (only if merchant role) */}
        <FormTabPanel id="merchant" activeTab={activeTab}>
          <div className="creator-form-section">
            <div className="subsection">
              <div className="subsection-title">Accepted Item Tags</div>
              <TagInput
                value={formData.buyConfig.acceptedTags}
                onChange={(v) => handleNestedChange('buyConfig', 'acceptedTags', v)}
                suggestions={suggestedItemTags}
                categories={ITEM_TAG_CATEGORIES}
                placeholder="Add accepted tag..."
                showSuggestions
              />
            </div>

            <div className="subsection mt-md">
              <div className="subsection-title">Rejected Item Tags</div>
              <TagInput
                value={formData.buyConfig.rejectedTags}
                onChange={(v) => handleNestedChange('buyConfig', 'rejectedTags', v)}
                suggestions={suggestedItemTags}
                categories={ITEM_TAG_CATEGORIES}
                placeholder="Add rejected tag..."
                showSuggestions
              />
            </div>

            <div className="creator-form-row mt-md">
              <FormInput
                label="Buy Price Multiplier"
                type="number"
                value={formData.buyConfig.buyPriceMultiplier}
                onChange={(v) => handleNestedChange('buyConfig', 'buyPriceMultiplier', v)}
                min={0}
                max={1}
                step={0.1}
                helper="0.4 = 40% of item value"
              />
              <FormInput
                label="Max Buy Value"
                type="number"
                value={formData.buyConfig.maxBuyValue}
                onChange={(v) => handleNestedChange('buyConfig', 'maxBuyValue', v)}
                min={0}
              />
            </div>

            <div className="creator-form-row">
              <FormInput
                label="Stock ID"
                value={formData.sellConfig.stockId}
                onChange={(v) => handleNestedChange('sellConfig', 'stockId', v)}
                placeholder="shop_stock_id"
              />
              <FormInput
                label="Sell Price Multiplier"
                type="number"
                value={formData.sellConfig.sellPriceMultiplier}
                onChange={(v) => handleNestedChange('sellConfig', 'sellPriceMultiplier', v)}
                min={0}
                step={0.1}
                helper="1.0 = base price"
              />
            </div>
          </div>
        </FormTabPanel>

        {/* NSFW Tab */}
        <FormTabPanel id="nsfw" activeTab={activeTab}>
          <div className="creator-form-section">
            <div className="creator-form-row">
              <div className="checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.nsfwEnabled}
                    onChange={(e) => handleChange('nsfwEnabled', e.target.checked)}
                  />
                  <span className="checkbox-text">NSFW Content Enabled</span>
                </label>
              </div>
              <div className="checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.canBeSeduced}
                    onChange={(e) => handleChange('canBeSeduced', e.target.checked)}
                  />
                  <span className="checkbox-text">Can Be Seduced</span>
                </label>
              </div>
            </div>
            {formData.canBeSeduced && (
              <FormInput
                label="Seduction Difficulty"
                type="number"
                value={formData.seductionDifficulty}
                onChange={(v) => handleChange('seductionDifficulty', v)}
                min={0}
                max={100}
                helper="0-100, higher = harder"
              />
            )}
          </div>
        </FormTabPanel>

        {/* Tags Tab */}
        <FormTabPanel id="tags" activeTab={activeTab}>
          <div className="creator-form-section">
            <TagInput
              value={formData.tags}
              onChange={(v) => handleChange('tags', v)}
              suggestions={suggestedTags}
              categories={TAG_CATEGORIES}
              placeholder="Add tag..."
              showSuggestions
            />
          </div>
        </FormTabPanel>

        {/* Action Buttons */}
        <div className="creator-actions">
          <Button variant="success" onClick={handleSubmit}>
            {editingItem ? 'Update NPC' : 'Add NPC'}
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
        title="Created NPCs"
        itemType="NPC"
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        editingItem={editingItem}
        renderItemContent={(item) => (
          <>
            <div className="creator-item-name">
              {item.name}
              {item.nsfwEnabled && (
                <span className="rarity-badge" style={{ backgroundColor: 'var(--color-accent-danger)' }}>
                  NSFW
                </span>
              )}
            </div>
            <div className="creator-item-id">
              ID: {item.id} | Role: {item.role}
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

export default NPCCreator;
