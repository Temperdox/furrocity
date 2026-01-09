import React, { useState, useEffect, useMemo } from 'react';
import { collectTags } from '../DatapackLoader';
import { FormInput, FormSelect, TagInput, ChipSelect, Button, CollapsibleSection } from '../../ui/shared';
import { useFormDraft } from '../../../hooks/useFormDraft';
import './CreatorStyles.css';

const DRAFT_KEY = 'contentGenerator_draft_items';

// Suggested item types
const ITEM_TYPES = [
  'weapon', 'armor', 'accessory', 'consumable', 'material',
  'quest', 'misc', 'toy', 'clothing', 'tool', 'key',
];

// Suggested rarities
const RARITIES = [
  'common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unique',
];

// Rarity colors for display
const RARITY_COLORS = {
  common: 'var(--color-rarity-common)',
  uncommon: 'var(--color-rarity-uncommon)',
  rare: 'var(--color-rarity-rare)',
  epic: 'var(--color-rarity-epic)',
  legendary: 'var(--color-rarity-legendary)',
  mythic: 'var(--color-rarity-mythic)',
  unique: 'var(--color-accent-info)',
};

const getRarityColor = (rarity) => RARITY_COLORS[rarity] || 'var(--color-border)';

// Equipment slots grouped by category
const EQUIPMENT_SLOTS = {
  weapon: [
    { value: 'main_hand', label: 'Main Hand' },
    { value: 'off_hand', label: 'Off Hand' },
  ],
  armor: [
    { value: 'head', label: 'Head' },
    { value: 'face', label: 'Face' },
    { value: 'neck', label: 'Neck' },
    { value: 'chest', label: 'Chest' },
    { value: 'back', label: 'Back' },
    { value: 'arms', label: 'Arms' },
    { value: 'hands', label: 'Hands' },
    { value: 'waist', label: 'Waist' },
    { value: 'legs', label: 'Legs' },
    { value: 'feet', label: 'Feet' },
  ],
  clothing: [
    { value: 'underwear_top', label: 'Underwear (Top)' },
    { value: 'underwear_bottom', label: 'Underwear (Bottom)' },
  ],
  accessory: [
    { value: 'accessory_1', label: 'Accessory 1' },
    { value: 'accessory_2', label: 'Accessory 2' },
    { value: 'ring_left', label: 'Ring (Left)' },
    { value: 'ring_right', label: 'Ring (Right)' },
  ],
  special: [
    { value: 'implant_head', label: 'Implant (Head)' },
    { value: 'implant_body', label: 'Implant (Body)' },
    { value: 'implant_limbs', label: 'Implant (Limbs)' },
  ],
  nsfw: [
    { value: 'nipple_left', label: 'Nipple (Left)' },
    { value: 'nipple_right', label: 'Nipple (Right)' },
    { value: 'nipples', label: 'Nipples (Both)' },
    { value: 'mouth', label: 'Mouth' },
    { value: 'ears', label: 'Ears' },
    { value: 'nose', label: 'Nose' },
    { value: 'dick', label: 'Dick/Penis' },
    { value: 'balls', label: 'Balls/Testicles' },
    { value: 'pussy', label: 'Pussy/Vagina' },
    { value: 'clitoris', label: 'Clitoris' },
    { value: 'urethra', label: 'Urethra' },
    { value: 'ass', label: 'Ass/Anus' },
    { value: 'chastity', label: 'Chastity Device' },
    { value: 'genital', label: 'Genital (Generic)' },
  ],
};

// Paperdoll layer options
const PAPERDOLL_LAYERS = [
  { value: '', label: 'None (No paperdoll display)' },
  { value: 'underwear_bottom', label: 'Underwear (Bottom)' },
  { value: 'underwear_top', label: 'Underwear (Top)' },
  { value: 'pants', label: 'Pants/Skirt' },
  { value: 'shirt', label: 'Shirt/Top' },
  { value: 'jacket', label: 'Jacket/Coat' },
  { value: 'socks', label: 'Socks/Stockings' },
  { value: 'shoes', label: 'Footwear' },
  { value: 'gloves', label: 'Gloves' },
  { value: 'belt', label: 'Belt' },
  { value: 'cape', label: 'Cape/Cloak' },
  { value: 'armor_chest', label: 'Chest Armor' },
  { value: 'armor_legs', label: 'Leg Armor' },
  { value: 'armor_arms', label: 'Arm Armor' },
  { value: 'helmet', label: 'Helmet' },
  { value: 'mask', label: 'Mask' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'necklace', label: 'Necklace' },
  { value: 'earrings', label: 'Earrings' },
  { value: 'glasses', label: 'Glasses' },
  { value: 'collar', label: 'Collar' },
];

const PAPERDOLL_LAYERS_NSFW = [
  { value: 'chastity', label: 'Chastity Device' },
  { value: 'genital_piercings', label: 'Genital Piercings' },
  { value: 'piercings_body', label: 'Body Piercings' },
  { value: 'lewd_accessories', label: 'Lewd Accessories' },
  { value: 'pasties', label: 'Pasties' },
  { value: 'harness', label: 'Harness' },
  { value: 'cock_ring', label: 'Cock Ring' },
  { value: 'plug', label: 'Plug (Anal/Vaginal)' },
  { value: 'tail', label: 'Tail Plug' },
  { value: 'restraints', label: 'Restraints' },
  { value: 'gag', label: 'Gag' },
  { value: 'blindfold', label: 'Blindfold' },
  { value: 'fluids', label: 'Fluids' },
];

// Tag categories for suggestions
const TAG_CATEGORIES = {
  type: ['weapon', 'armor', 'consumable', 'material', 'quest', 'misc'],
  weapon: ['sword', 'axe', 'bow', 'staff', 'dagger', 'mace'],
  weight: ['light', 'medium', 'heavy'],
  effect: ['healing', 'buff', 'debuff', 'poison'],
  quality: ['cursed', 'blessed', 'magical', 'rare'],
  nsfw: ['nsfw', 'toy', 'piercing', 'vibrator', 'plug', 'restraint', 'gag', 'chastity', 'collar', 'leash', 'blindfold', 'clamps'],
  crafting: ['crafting', 'cooking', 'alchemy'],
};

const DEFAULT_ITEM = {
  id: '',
  name: '',
  description: '',
  type: 'weapon',
  rarity: 'common',
  value: 10,
  stackable: false,
  maxStack: 1,
  isEquippable: false,
  equipSlots: [],
  tags: [],
  icon: {
    type: 'sprite',
    sheetId: 'items',
    iconId: 'default',
  },
  paperdoll: {
    enabled: false,
    folder: '',
    filename: '',
    layer: '',
    zIndexOffset: 0,
  },
  baseStats: {
    attack: 0,
    defense: 0,
    strength: 0,
    vitality: 0,
    intelligence: 0,
    willpower: 0,
    speed: 0,
    evasion: 0,
  },
  effects: [],
  requirements: {
    level: 1,
    strength: 0,
    intelligence: 0,
  },
};

const ItemCreator = ({
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
  const [formData, setFormData] = useState({ ...DEFAULT_ITEM });
  const [hoveredItem, setHoveredItem] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({
    equipment: true,
    icon: true,
    paperdoll: true,
    tags: true,
    stats: true,
    requirements: true,
  });

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Use the draft persistence hook
  const { clearDraft } = useFormDraft(DRAFT_KEY, formData, setFormData, editingItem, {
    defaultValues: DEFAULT_ITEM,
  });

  // Compute dynamic tag suggestions from datapack content and user-created items
  const suggestedTags = useMemo(() => {
    return collectTags({
      datapackContent,
      userContent: items,
      commonTags: Object.values(TAG_CATEGORIES).flat(),
      contentType: 'items',
    });
  }, [datapackContent, items]);

  // Load editing item when it changes
  useEffect(() => {
    if (editingItem) {
      let equipSlots = editingItem.equipSlots || [];
      if (editingItem.equipSlot && !editingItem.equipSlots) {
        equipSlots = [editingItem.equipSlot];
      }

      const isEquippable = editingItem.isEquippable || equipSlots.length > 0;

      let paperdoll = { ...DEFAULT_ITEM.paperdoll };
      if (editingItem.paperdoll) {
        paperdoll = { ...DEFAULT_ITEM.paperdoll, ...editingItem.paperdoll };
        if (editingItem.paperdoll.imagePath && !editingItem.paperdoll.folder) {
          const parts = editingItem.paperdoll.imagePath.split('/');
          if (parts.length > 1) {
            paperdoll.folder = parts.slice(0, -1).join('/');
            paperdoll.filename = parts[parts.length - 1].replace(/\.[^/.]+$/, '');
          } else {
            paperdoll.filename = parts[0].replace(/\.[^/.]+$/, '');
          }
        }
      } else if (editingItem.paperdollImage) {
        const parts = editingItem.paperdollImage.split('/');
        paperdoll = {
          enabled: true,
          folder: parts.length > 1 ? parts.slice(0, -1).join('/') : '',
          filename: parts[parts.length - 1].replace(/\.[^/.]+$/, ''),
          layer: editingItem.paperdollLayer || '',
          zIndexOffset: 0,
        };
      }

      setFormData({
        ...DEFAULT_ITEM,
        ...editingItem,
        isEquippable,
        equipSlots,
        paperdoll,
        baseStats: { ...DEFAULT_ITEM.baseStats, ...editingItem.baseStats },
        icon: { ...DEFAULT_ITEM.icon, ...editingItem.icon },
        requirements: { ...DEFAULT_ITEM.requirements, ...editingItem.requirements },
      });
    } else {
      setFormData({ ...DEFAULT_ITEM });
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

  const handleToggleEquipSlot = (slot) => {
    setFormData(prev => ({
      ...prev,
      equipSlots: prev.equipSlots.includes(slot)
        ? prev.equipSlots.filter(s => s !== slot)
        : [...prev.equipSlots, slot],
    }));
  };

  const handleSubmit = () => {
    if (!formData.id || !formData.name) {
      alert('ID and Name are required');
      return;
    }

    if (!editingItem && items.some(item => item.id === formData.id)) {
      alert('An item with this ID already exists');
      return;
    }

    if (editingItem) {
      onUpdate(editingItem._id, formData);
    } else {
      onAdd(formData);
      clearDraft();
    }

    setFormData({ ...DEFAULT_ITEM });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_ITEM });
    onCancelEdit();
  };

  // Convert EQUIPMENT_SLOTS object to flat array for ChipSelect
  const getSlotOptions = (category) => {
    return EQUIPMENT_SLOTS[category] || [];
  };

  return (
    <div className="creator-container">
      {/* Form Section */}
      <div className="creator-form">
        <h3 className="creator-form-section-title">
          {editingItem ? 'Edit Item' : 'Create New Item'}
        </h3>

        {/* Basic Info */}
        <div className="creator-form-section">
          <div className="creator-form-row">
            <FormInput
              label="ID"
              required
              value={formData.id}
              onChange={(v) => handleChange('id', String(v).toLowerCase().replace(/\s/g, '_'))}
              placeholder="unique_item_id"
              helper="Unique identifier for this item"
            />
            <FormInput
              label="Name"
              required
              value={formData.name}
              onChange={(v) => handleChange('name', v)}
              placeholder="Item Name"
            />
          </div>

          <FormInput
            label="Description"
            type="textarea"
            value={formData.description}
            onChange={(v) => handleChange('description', v)}
            placeholder="A detailed description of the item..."
            rows={3}
          />

          <div className="creator-form-row">
            <FormSelect
              label="Type"
              value={formData.type}
              onChange={(v) => handleChange('type', v)}
              options={ITEM_TYPES}
              placeholder="Select type..."
            />
            <FormSelect
              label="Rarity"
              value={formData.rarity}
              onChange={(v) => handleChange('rarity', v)}
              options={RARITIES}
              placeholder="Select rarity..."
            />
          </div>

          <div className="creator-form-row cols-3">
            <FormInput
              label="Value (Gold)"
              type="number"
              value={formData.value}
              onChange={(v) => handleChange('value', v)}
              min={0}
            />
            <div className="form-group">
              <label className="form-label">Stackable</label>
              <div className="checkbox-row">
                <input
                  type="checkbox"
                  checked={formData.stackable}
                  onChange={(e) => handleChange('stackable', e.target.checked)}
                  id="stackable-check"
                />
                <label htmlFor="stackable-check">Allow stacking</label>
              </div>
            </div>
            {formData.stackable && (
              <FormInput
                label="Max Stack"
                type="number"
                value={formData.maxStack}
                onChange={(v) => handleChange('maxStack', v)}
                min={1}
              />
            )}
          </div>
        </div>

        {/* Equippable Toggle */}
        <div className={`creator-form-section highlight-section ${formData.isEquippable ? 'active' : ''}`}>
          <div className="form-group">
            <label className="form-label checkbox-label">
              <input
                type="checkbox"
                checked={formData.isEquippable}
                onChange={(e) => {
                  handleChange('isEquippable', e.target.checked);
                  if (!e.target.checked) {
                    handleChange('equipSlots', []);
                    handleNestedChange('paperdoll', 'enabled', false);
                  }
                }}
              />
              <span className="checkbox-text">Equippable Item</span>
            </label>
            <div className="form-helper">
              Check this if the item can be equipped by the player
            </div>
          </div>
        </div>

        {/* Equipment Slots */}
        {formData.isEquippable && (
          <CollapsibleSection
            title="Equipment Slots"
            isCollapsed={collapsedSections.equipment}
            onToggle={() => toggleSection('equipment')}
            badge={formData.equipSlots.length > 0 ? `${formData.equipSlots.length} selected` : null}
          >
            {Object.entries(EQUIPMENT_SLOTS).map(([category, slots]) => (
              <div key={category} className={`slot-category ${category === 'nsfw' ? 'nsfw' : ''}`}>
                <div className="slot-category-label">{category}</div>
                <ChipSelect
                  value={formData.equipSlots}
                  onChange={(v) => handleChange('equipSlots', v)}
                  options={slots}
                  multiple
                  showCheckbox
                />
              </div>
            ))}

            {formData.equipSlots.length > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleChange('equipSlots', [])}
                className="mt-sm"
              >
                Clear All Slots
              </Button>
            )}
          </CollapsibleSection>
        )}

        {/* Icon Configuration */}
        <CollapsibleSection
          title="Icon"
          isCollapsed={collapsedSections.icon}
          onToggle={() => toggleSection('icon')}
          badge={formData.icon.iconId && formData.icon.iconId !== 'default' ? formData.icon.iconId : null}
        >
          <div className="creator-form-row">
            <FormInput
              label="Sprite Sheet ID"
              value={formData.icon.sheetId}
              onChange={(v) => handleNestedChange('icon', 'sheetId', v)}
              placeholder="items"
            />
            <FormInput
              label="Icon ID"
              value={formData.icon.iconId}
              onChange={(v) => handleNestedChange('icon', 'iconId', v)}
              placeholder="sword_icon"
            />
          </div>
        </CollapsibleSection>

        {/* Paperdoll Configuration */}
        {formData.isEquippable && (
          <CollapsibleSection
            title="Equipment Image (Paperdoll)"
            isCollapsed={collapsedSections.paperdoll}
            onToggle={() => toggleSection('paperdoll')}
            badge={formData.paperdoll.enabled ? 'Enabled' : null}
          >
            <div className="form-group">
              <label className="form-label checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.paperdoll.enabled}
                  onChange={(e) => handleNestedChange('paperdoll', 'enabled', e.target.checked)}
                />
                <span className="checkbox-text">Show on Character Portrait</span>
              </label>
            </div>

            {formData.paperdoll.enabled && (
              <>
                <div className="creator-form-row">
                  <FormInput
                    label="Image Folder"
                    value={formData.paperdoll.folder}
                    onChange={(v) => handleNestedChange('paperdoll', 'folder', String(v).toLowerCase().replace(/\s/g, '_'))}
                    placeholder="chastity, armor, toys, etc."
                    helper="Subfolder in public/images/equipment/"
                  />
                  <FormInput
                    label="Image Filename"
                    value={formData.paperdoll.filename}
                    onChange={(v) => handleNestedChange('paperdoll', 'filename', String(v).toLowerCase().replace(/\s/g, '_'))}
                    placeholder="steel_cage, leather_armor, etc."
                    helper="Without file extension (.png added automatically)"
                  />
                </div>

                <div className="creator-form-row">
                  <FormSelect
                    label="Render Layer"
                    value={formData.paperdoll.layer}
                    onChange={(v) => handleNestedChange('paperdoll', 'layer', v)}
                    groups={{
                      'Standard Layers': PAPERDOLL_LAYERS,
                      'NSFW Layers': PAPERDOLL_LAYERS_NSFW,
                    }}
                    placeholder="Select layer..."
                    helper="Which paperdoll layer to render on"
                  />
                  <FormInput
                    label="Z-Index Offset"
                    type="number"
                    value={formData.paperdoll.zIndexOffset}
                    onChange={(v) => handleNestedChange('paperdoll', 'zIndexOffset', v)}
                    helper="Adjust rendering order (+/-)"
                  />
                </div>

                {/* Path Preview */}
                <div className="path-preview">
                  <div className="path-preview-label">Full Image Path:</div>
                  <div className={`path-preview-value ${formData.paperdoll.folder && formData.paperdoll.filename ? 'valid' : 'invalid'}`}>
                    {formData.paperdoll.folder && formData.paperdoll.filename
                      ? `/images/equipment/${formData.paperdoll.folder}/${formData.paperdoll.filename}.png`
                      : '(Please enter folder and filename)'}
                  </div>
                  {formData.paperdoll.layer && (
                    <div className="path-preview-layer">
                      <strong>Render Layer:</strong> {formData.paperdoll.layer}
                    </div>
                  )}
                </div>
              </>
            )}
          </CollapsibleSection>
        )}

        {/* Tags */}
        <CollapsibleSection
          title="Tags"
          isCollapsed={collapsedSections.tags}
          onToggle={() => toggleSection('tags')}
          badge={formData.tags.length > 0 ? `${formData.tags.length} tags` : null}
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

        {/* Base Stats */}
        {formData.equipSlots.length > 0 && (
          <CollapsibleSection
            title="Base Stats"
            isCollapsed={collapsedSections.stats}
            onToggle={() => toggleSection('stats')}
            badge={Object.values(formData.baseStats).some(v => v !== 0) ? '✓' : null}
          >
            <div className="stats-grid">
              {Object.entries(formData.baseStats).map(([stat, value]) => (
                <div key={stat} className="stat-row">
                  <span className="stat-label">{stat.charAt(0).toUpperCase() + stat.slice(1)}</span>
                  <input
                    type="number"
                    className="stat-input"
                    value={value}
                    onChange={(e) => handleNestedChange('baseStats', stat, parseInt(e.target.value) || 0)}
                  />
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Requirements */}
        <CollapsibleSection
          title="Requirements"
          isCollapsed={collapsedSections.requirements}
          onToggle={() => toggleSection('requirements')}
          badge={formData.requirements.level > 1 || formData.requirements.strength > 0 || formData.requirements.intelligence > 0 ? '✓' : null}
        >
          <div className="creator-form-row cols-3">
            <FormInput
              label="Level"
              type="number"
              value={formData.requirements.level}
              onChange={(v) => handleNestedChange('requirements', 'level', v)}
              min={1}
            />
            <FormInput
              label="Strength"
              type="number"
              value={formData.requirements.strength}
              onChange={(v) => handleNestedChange('requirements', 'strength', v)}
              min={0}
            />
            <FormInput
              label="Intelligence"
              type="number"
              value={formData.requirements.intelligence}
              onChange={(v) => handleNestedChange('requirements', 'intelligence', v)}
              min={0}
            />
          </div>
        </CollapsibleSection>

        {/* Action Buttons */}
        <div className="creator-actions">
          <Button variant="success" onClick={handleSubmit}>
            {editingItem ? 'Update Item' : 'Add Item'}
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
          Created Items
          <span className="count-badge">{items.length}</span>
        </h3>

        {items.length === 0 ? (
          <div className="empty-list">
            No items created yet.
            <br />
            Use the form to create your first item.
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
                    style={{ backgroundColor: getRarityColor(item.rarity) }}
                  >
                    {item.rarity}
                  </span>
                </div>
                <div className="creator-item-id">
                  ID: {item.id} | Type: {item.type} | Value: {item.value}g
                </div>
                {(item.equipSlots?.length > 0 || item.equipSlot) && (
                  <div className="creator-item-slots">
                    Slots: {(item.equipSlots || [item.equipSlot]).join(', ')}
                  </div>
                )}
                {item.tags?.length > 0 && (
                  <div className="creator-item-tags">
                    {item.tags.slice(0, 5).map(tag => (
                      <span key={tag} className="tag-chip">{tag}</span>
                    ))}
                    {item.tags.length > 5 && (
                      <span className="tag-chip more">+{item.tags.length - 5}</span>
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

export default ItemCreator;
