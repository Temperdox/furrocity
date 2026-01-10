import React, { useState, useEffect, useMemo } from 'react';
import { collectTags } from '../DatapackLoader';
import { FormInput, FormSelect, TagInput, Button, FormTabs, FormTabPanel } from '../../ui/shared';
import { CreatorItemsList, IdNameFields, DescriptionField } from '../shared';
import { useFormDraft } from '../../../hooks/useFormDraft';
import './CreatorStyles.css';

const DRAFT_KEY = 'contentGenerator_draft_merchants';

const SELL_MODES = [
  { value: 'static', label: 'Static (Fixed Inventory)' },
  { value: 'dynamic', label: 'Dynamic (Generated)' },
];

const RARITIES = [
  { value: 'common', label: 'Common' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'rare', label: 'Rare' },
  { value: 'epic', label: 'Epic' },
  { value: 'legendary', label: 'Legendary' },
];

const TAG_CATEGORIES = {
  type: ['general', 'blacksmith', 'alchemist', 'temple', 'tavern', 'traveling', 'black_market'],
  behavior: ['can_be_seduced', 'nsfw_enabled', 'faction_merchant'],
  special: ['random_encounter', 'hidden', 'requires_reputation'],
};

const COMMON_ITEM_TAGS = [
  'food', 'drink', 'ingredient', 'material', 'weapon', 'armor',
  'consumable', 'tool', 'cursed', 'contraband', 'nsfw', 'holy',
  'blessed', 'magical', 'alchemical', 'rare', 'exotic', 'stolen',
  'poison', 'lockpick', 'organic', 'metal', 'ore',
];

const DEFAULT_INVENTORY_ITEM = {
  itemId: '',
  quantity: 1,
  minLevel: null,
  requiresFlag: null,
};

const DEFAULT_MERCHANT = {
  id: '',
  name: '',
  description: '',
  locationId: '',
  factionId: '',
  tags: [],
  schedule: [],
  nsfwEnabled: false,
  canBeSeduced: false,
  seductionDifficulty: 50,
  rumorAwareness: 0.5,
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
    // Dynamic mode fields
    saleTags: [],
    maxRarity: 'rare',
    stockSize: 10,
  },
  dialogue: {
    greeting: '',
    cannotBuy: '',
    farewell: '',
  },
  inventory: [],
};

const MerchantCreator = ({
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
  const [formData, setFormData] = useState({ ...DEFAULT_MERCHANT });
  const [activeTab, setActiveTab] = useState('basic');

  const { clearDraft } = useFormDraft(DRAFT_KEY, formData, setFormData, editingItem, {
    defaultValues: DEFAULT_MERCHANT,
  });

  const suggestedTags = useMemo(() => {
    return collectTags({
      datapackContent,
      userContent: items,
      commonTags: Object.values(TAG_CATEGORIES).flat(),
      contentType: 'merchants',
    });
  }, [datapackContent, items]);

  // Get available locations from datapack
  const availableLocations = useMemo(() => {
    const locations = datapackContent.locations || [];
    return locations.map(l => ({ value: l.id, label: l.name || l.id }));
  }, [datapackContent.locations]);

  // Get available items from datapack
  const availableItems = useMemo(() => {
    const itemList = datapackContent.items || [];
    return itemList.map(i => ({ value: i.id, label: i.name || i.id }));
  }, [datapackContent.items]);

  // Generate hour options for schedule
  const hourOptions = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      value: i,
      label: `${i.toString().padStart(2, '0')}:00`,
    }));
  }, []);

  // Define tabs with badges
  const tabs = useMemo(() => {
    const hasDialogue = formData.dialogue.greeting || formData.dialogue.cannotBuy || formData.dialogue.farewell;
    const hasNsfw = formData.nsfwEnabled || formData.canBeSeduced;

    return [
      { id: 'basic', label: 'Basic' },
      { id: 'schedule', label: 'Schedule', badge: formData.schedule?.length || null },
      { id: 'trading', label: 'Trading' },
      { id: 'dialogue', label: 'Dialogue', badge: hasDialogue ? '...' : null },
      { id: 'inventory', label: 'Inventory', badge: formData.inventory.length || null },
      { id: 'nsfw', label: 'NSFW', badge: hasNsfw ? '!' : null },
    ];
  }, [formData.schedule?.length, formData.dialogue, formData.inventory.length, formData.nsfwEnabled, formData.canBeSeduced]);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...DEFAULT_MERCHANT,
        ...editingItem,
        schedule: editingItem.schedule || [],
        buyConfig: { ...DEFAULT_MERCHANT.buyConfig, ...editingItem.buyConfig },
        sellConfig: { ...DEFAULT_MERCHANT.sellConfig, ...editingItem.sellConfig },
        dialogue: { ...DEFAULT_MERCHANT.dialogue, ...editingItem.dialogue },
        inventory: editingItem.inventory || [],
      });
    } else {
      setFormData({ ...DEFAULT_MERCHANT });
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

  const handleAddAcceptedTag = (tag) => {
    if (!tag || formData.buyConfig.acceptedTags.includes(tag)) return;
    handleNestedChange('buyConfig', 'acceptedTags', [...formData.buyConfig.acceptedTags, tag]);
  };

  const handleRemoveAcceptedTag = (index) => {
    handleNestedChange('buyConfig', 'acceptedTags', formData.buyConfig.acceptedTags.filter((_, i) => i !== index));
  };

  const handleAddRejectedTag = (tag) => {
    if (!tag || formData.buyConfig.rejectedTags.includes(tag)) return;
    handleNestedChange('buyConfig', 'rejectedTags', [...formData.buyConfig.rejectedTags, tag]);
  };

  const handleRemoveRejectedTag = (index) => {
    handleNestedChange('buyConfig', 'rejectedTags', formData.buyConfig.rejectedTags.filter((_, i) => i !== index));
  };

  const handleAddInventoryItem = () => {
    setFormData(prev => ({
      ...prev,
      inventory: [...prev.inventory, { ...DEFAULT_INVENTORY_ITEM }],
    }));
  };

  const handleUpdateInventoryItem = (index, updates) => {
    setFormData(prev => ({
      ...prev,
      inventory: prev.inventory.map((item, i) =>
        i === index ? { ...item, ...updates } : item
      ),
    }));
  };

  const handleRemoveInventoryItem = (index) => {
    setFormData(prev => ({
      ...prev,
      inventory: prev.inventory.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    if (!formData.id || !formData.name) {
      alert('ID and Name are required');
      return;
    }

    if (!editingItem && items.some(item => item.id === formData.id)) {
      alert('A merchant with this ID already exists');
      return;
    }

    // Generate stock ID from merchant ID if using static mode and no stock ID set
    const stockId = formData.sellConfig.mode === 'static' && !formData.sellConfig.stockId
      ? `${formData.id}_stock`
      : formData.sellConfig.stockId;

    const finalData = {
      ...formData,
      sellConfig: {
        ...formData.sellConfig,
        stockId: formData.sellConfig.mode === 'static' ? stockId : undefined,
        saleTags: formData.sellConfig.mode === 'dynamic' ? formData.sellConfig.saleTags : undefined,
        maxRarity: formData.sellConfig.mode === 'dynamic' ? formData.sellConfig.maxRarity : undefined,
        stockSize: formData.sellConfig.mode === 'dynamic' ? formData.sellConfig.stockSize : undefined,
      },
      seductionDifficulty: formData.canBeSeduced ? formData.seductionDifficulty : undefined,
    };

    if (editingItem) {
      onUpdate(editingItem._id, finalData);
    } else {
      onAdd(finalData);
      clearDraft();
    }

    setFormData({ ...DEFAULT_MERCHANT });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_MERCHANT });
    onCancelEdit();
  };

  return (
    <div className="creator-container">
      {/* Form Section */}
      <div className="creator-form">
        <h3 className="creator-form-section-title">
          {editingItem ? 'Edit Merchant' : 'Create New Merchant'}
        </h3>

        <FormTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Basic Tab */}
        <FormTabPanel id="basic" activeTab={activeTab}>
          <IdNameFields
            idValue={formData.id}
            nameValue={formData.name}
            onIdChange={(v) => handleChange('id', v)}
            onNameChange={(v) => handleChange('name', v)}
            idPlaceholder="merchant_id"
            namePlaceholder="Joe the Merchant"
          />

          <DescriptionField
            value={formData.description}
            onChange={(v) => handleChange('description', v)}
            placeholder="A friendly merchant who sells various goods..."
            rows={2}
          />

          <div className="creator-form-row">
            {availableLocations.length > 0 ? (
              <FormSelect
                label="Location"
                value={formData.locationId}
                onChange={(v) => handleChange('locationId', v)}
                options={[{ value: '', label: 'None (Traveling)' }, ...availableLocations]}
              />
            ) : (
              <FormInput
                label="Location ID"
                value={formData.locationId}
                onChange={(v) => handleChange('locationId', v)}
                placeholder="town_square"
              />
            )}
            <FormInput
              label="Faction ID"
              value={formData.factionId}
              onChange={(v) => handleChange('factionId', v)}
              placeholder="traders_guild"
            />
          </div>

          <FormInput
            label="Rumor Awareness"
            type="number"
            value={formData.rumorAwareness}
            onChange={(v) => handleChange('rumorAwareness', v)}
            min={0}
            max={1}
            step={0.1}
            helper="0-1: How likely to know rumors"
          />

          <TagInput
            value={formData.tags}
            onChange={(v) => handleChange('tags', v)}
            suggestions={suggestedTags}
            categories={TAG_CATEGORIES}
            placeholder="Add tag..."
            showSuggestions
          />
        </FormTabPanel>

        {/* Schedule Tab */}
        <FormTabPanel id="schedule" activeTab={activeTab}>
          <div style={{ marginBottom: 'var(--space-sm)' }}>
            <Button variant="success" size="sm" onClick={handleAddScheduleSlot}>
              + Add Time Slot
            </Button>
          </div>

          {(formData.schedule || []).length === 0 ? (
            <div className="empty-list" style={{ padding: 'var(--space-md)' }}>
              No schedule defined - merchant will always be at default location
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
                  {availableLocations.length > 0 ? (
                    <FormSelect
                      label="Location"
                      value={slot.locationId}
                      onChange={(v) => handleUpdateScheduleSlot(index, 'locationId', v)}
                      options={[{ value: '', label: 'Select Location...' }, ...availableLocations]}
                    />
                  ) : (
                    <FormInput
                      label="Location ID"
                      value={slot.locationId}
                      onChange={(v) => handleUpdateScheduleSlot(index, 'locationId', v)}
                      placeholder="location_id"
                    />
                  )}
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <Button variant="danger" size="sm" onClick={() => handleRemoveScheduleSlot(index)}>
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </FormTabPanel>

        {/* Trading Tab */}
        <FormTabPanel id="trading" activeTab={activeTab}>
          {/* Buy Configuration */}
          <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
            Buy Configuration
          </h4>
          <div className="creator-form-row">
            <FormInput
              label="Buy Price Multiplier"
              type="number"
              value={formData.buyConfig.buyPriceMultiplier}
              onChange={(v) => handleNestedChange('buyConfig', 'buyPriceMultiplier', v)}
              min={0.1}
              max={1}
              step={0.05}
              helper="% of item value paid to player"
            />
            <FormInput
              label="Max Buy Value"
              type="number"
              value={formData.buyConfig.maxBuyValue}
              onChange={(v) => handleNestedChange('buyConfig', 'maxBuyValue', v)}
              min={0}
              helper="Max gold spent per item"
            />
          </div>

          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label className="form-label">Accepted Item Tags</label>
            <FormSelect
              value=""
              onChange={(v) => handleAddAcceptedTag(v)}
              options={[
                { value: '', label: '+ Add accepted tag...' },
                ...COMMON_ITEM_TAGS.filter(t => !formData.buyConfig.acceptedTags.includes(t)).map(t => ({ value: t, label: t }))
              ]}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)', marginTop: 'var(--space-xs)' }}>
              {formData.buyConfig.acceptedTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="tag-chip"
                  onClick={() => handleRemoveAcceptedTag(idx)}
                  style={{ cursor: 'pointer', backgroundColor: 'var(--color-accent-success)' }}
                >
                  {tag} x
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label className="form-label">Rejected Item Tags</label>
            <FormSelect
              value=""
              onChange={(v) => handleAddRejectedTag(v)}
              options={[
                { value: '', label: '+ Add rejected tag...' },
                ...COMMON_ITEM_TAGS.filter(t => !formData.buyConfig.rejectedTags.includes(t)).map(t => ({ value: t, label: t }))
              ]}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)', marginTop: 'var(--space-xs)' }}>
              {formData.buyConfig.rejectedTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="tag-chip"
                  onClick={() => handleRemoveRejectedTag(idx)}
                  style={{ cursor: 'pointer', backgroundColor: 'var(--color-accent-danger)' }}
                >
                  {tag} x
                </span>
              ))}
            </div>
          </div>

          {/* Sell Configuration */}
          <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
            Sell Configuration
          </h4>
          <div className="creator-form-row">
            <FormSelect
              label="Inventory Mode"
              value={formData.sellConfig.mode}
              onChange={(v) => handleNestedChange('sellConfig', 'mode', v)}
              options={SELL_MODES}
            />
            <FormInput
              label="Sell Price Multiplier"
              type="number"
              value={formData.sellConfig.sellPriceMultiplier}
              onChange={(v) => handleNestedChange('sellConfig', 'sellPriceMultiplier', v)}
              min={0.5}
              max={3}
              step={0.1}
              helper="Price multiplier for items sold"
            />
          </div>

          {formData.sellConfig.mode === 'static' && (
            <FormInput
              label="Stock ID"
              value={formData.sellConfig.stockId}
              onChange={(v) => handleNestedChange('sellConfig', 'stockId', v)}
              placeholder={`${formData.id || 'merchant'}_stock`}
              helper="Reference to inventory stock"
            />
          )}

          {formData.sellConfig.mode === 'dynamic' && (
            <>
              <div className="creator-form-row">
                <FormSelect
                  label="Max Rarity"
                  value={formData.sellConfig.maxRarity}
                  onChange={(v) => handleNestedChange('sellConfig', 'maxRarity', v)}
                  options={RARITIES}
                />
                <FormInput
                  label="Stock Size"
                  type="number"
                  value={formData.sellConfig.stockSize}
                  onChange={(v) => handleNestedChange('sellConfig', 'stockSize', v)}
                  min={1}
                  max={50}
                  helper="Number of items generated"
                />
              </div>
              <div>
                <label className="form-label">Sale Tags (items to generate)</label>
                <FormSelect
                  value=""
                  onChange={(v) => {
                    if (v && !formData.sellConfig.saleTags.includes(v)) {
                      handleNestedChange('sellConfig', 'saleTags', [...formData.sellConfig.saleTags, v]);
                    }
                  }}
                  options={[
                    { value: '', label: '+ Add sale tag...' },
                    ...COMMON_ITEM_TAGS.filter(t => !formData.sellConfig.saleTags?.includes(t)).map(t => ({ value: t, label: t }))
                  ]}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)', marginTop: 'var(--space-xs)' }}>
                  {(formData.sellConfig.saleTags || []).map((tag, idx) => (
                    <span
                      key={idx}
                      className="tag-chip"
                      onClick={() => handleNestedChange('sellConfig', 'saleTags', formData.sellConfig.saleTags.filter((_, i) => i !== idx))}
                      style={{ cursor: 'pointer' }}
                    >
                      {tag} x
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </FormTabPanel>

        {/* Dialogue Tab */}
        <FormTabPanel id="dialogue" activeTab={activeTab}>
          <FormInput
            label="Greeting"
            type="textarea"
            value={formData.dialogue.greeting}
            onChange={(v) => handleNestedChange('dialogue', 'greeting', v)}
            placeholder="Welcome to my shop! Take a look around..."
            rows={2}
          />
          <FormInput
            label="Cannot Buy Response"
            type="textarea"
            value={formData.dialogue.cannotBuy}
            onChange={(v) => handleNestedChange('dialogue', 'cannotBuy', v)}
            placeholder="I'm afraid I can't buy that from you."
            rows={2}
          />
          <FormInput
            label="Farewell"
            type="textarea"
            value={formData.dialogue.farewell}
            onChange={(v) => handleNestedChange('dialogue', 'farewell', v)}
            placeholder="Come back soon!"
            rows={2}
          />
        </FormTabPanel>

        {/* Inventory Tab */}
        <FormTabPanel id="inventory" activeTab={activeTab}>
          {formData.sellConfig.mode === 'static' ? (
            <>
              {formData.inventory.map((item, index) => (
                <div key={index} style={{
                  marginBottom: 'var(--space-md)',
                  padding: 'var(--space-md)',
                  background: 'var(--color-bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                    <span className="text-secondary text-sm">Item #{index + 1}</span>
                    <Button variant="danger" size="sm" onClick={() => handleRemoveInventoryItem(index)}>
                      Remove
                    </Button>
                  </div>

                  <div className="creator-form-row">
                    {availableItems.length > 0 ? (
                      <FormSelect
                        label="Item"
                        value={item.itemId}
                        onChange={(v) => handleUpdateInventoryItem(index, { itemId: v })}
                        options={[{ value: '', label: 'Select item...' }, ...availableItems]}
                      />
                    ) : (
                      <FormInput
                        label="Item ID"
                        value={item.itemId}
                        onChange={(v) => handleUpdateInventoryItem(index, { itemId: v })}
                        placeholder="item_id"
                      />
                    )}
                    <FormInput
                      label="Quantity"
                      type="number"
                      value={item.quantity}
                      onChange={(v) => handleUpdateInventoryItem(index, { quantity: v })}
                      min={1}
                    />
                  </div>

                  <div className="creator-form-row">
                    <FormInput
                      label="Min Level"
                      type="number"
                      value={item.minLevel || ''}
                      onChange={(v) => handleUpdateInventoryItem(index, { minLevel: v || null })}
                      min={1}
                      placeholder="Any"
                    />
                    <FormInput
                      label="Requires Flag"
                      value={item.requiresFlag || ''}
                      onChange={(v) => handleUpdateInventoryItem(index, { requiresFlag: v || null })}
                      placeholder="None"
                    />
                  </div>
                </div>
              ))}

              <Button variant="success" size="sm" onClick={handleAddInventoryItem}>
                + Add Inventory Item
              </Button>
            </>
          ) : (
            <div className="empty-list" style={{ padding: 'var(--space-md)' }}>
              Inventory items are only available in Static inventory mode.
              <br />
              Switch to Static mode in the Trading tab to define specific items.
            </div>
          )}
        </FormTabPanel>

        {/* NSFW Tab */}
        <FormTabPanel id="nsfw" activeTab={activeTab}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <input
                type="checkbox"
                checked={formData.nsfwEnabled}
                onChange={(e) => handleChange('nsfwEnabled', e.target.checked)}
              />
              NSFW Content Enabled
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <input
                type="checkbox"
                checked={formData.canBeSeduced}
                onChange={(e) => handleChange('canBeSeduced', e.target.checked)}
              />
              Can Be Seduced
            </label>
          </div>
          {formData.canBeSeduced && (
            <FormInput
              label="Seduction Difficulty"
              type="number"
              value={formData.seductionDifficulty}
              onChange={(v) => handleChange('seductionDifficulty', v)}
              min={0}
              max={100}
              helper="0-100: Lower = easier"
            />
          )}
        </FormTabPanel>

        {/* Action Buttons */}
        <div className="creator-actions">
          <Button variant="success" onClick={handleSubmit}>
            {editingItem ? 'Update Merchant' : 'Add Merchant'}
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
        title="Created Merchants"
        itemType="merchant"
        editingItem={editingItem}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        renderItemContent={(item) => (
          <>
            <div className="creator-item-name">
              {item.name}
              {item.nsfwEnabled && (
                <span className="rarity-badge" style={{ backgroundColor: '#e91e63' }}>
                  NSFW
                </span>
              )}
              {item.canBeSeduced && (
                <span className="rarity-badge" style={{ backgroundColor: 'var(--color-accent-secondary)' }}>
                  Seducible
                </span>
              )}
            </div>
            <div className="creator-item-id">
              ID: {item.id} | {item.locationId || 'Traveling'} | {item.sellConfig?.mode || 'static'}
            </div>
            <div className="creator-item-id">
              Buys: {item.buyConfig?.acceptedTags?.slice(0, 3).join(', ') || 'none'}
              {item.buyConfig?.acceptedTags?.length > 3 && ` +${item.buyConfig.acceptedTags.length - 3}`}
            </div>
            {item.tags?.length > 0 && (
              <div className="creator-item-tags">
                {item.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="tag-chip">{tag}</span>
                ))}
                {item.tags.length > 3 && (
                  <span className="tag-chip more">+{item.tags.length - 3}</span>
                )}
              </div>
            )}
          </>
        )}
      />
    </div>
  );
};

export default MerchantCreator;
