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
    width: '350px',
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
  },
  select: {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #4a4a6a',
    backgroundColor: '#1a1a2e',
    color: 'white',
    fontSize: '14px',
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
  },
  row: {
    display: 'flex',
    gap: '15px',
  },
  halfWidth: {
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
  statRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  statLabel: {
    width: '100px',
    color: '#a0a0c0',
    fontSize: '13px',
  },
  statInput: {
    width: '80px',
    padding: '6px',
    borderRadius: '4px',
    border: '1px solid #4a4a6a',
    backgroundColor: '#1a1a2e',
    color: 'white',
    fontSize: '13px',
    textAlign: 'center',
  },
  iconPreview: {
    width: '48px',
    height: '48px',
    backgroundColor: '#1a1a2e',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #4a4a6a',
    color: '#808090',
    fontSize: '24px',
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
  emptyList: {
    color: '#606080',
    textAlign: 'center',
    padding: '30px',
    fontSize: '14px',
  },
};

const ITEM_TYPES = [
  { value: 'weapon', label: 'Weapon' },
  { value: 'armor', label: 'Armor' },
  { value: 'accessory', label: 'Accessory' },
  { value: 'consumable', label: 'Consumable' },
  { value: 'material', label: 'Material' },
  { value: 'quest', label: 'Quest Item' },
  { value: 'misc', label: 'Miscellaneous' },
  { value: 'toy', label: 'Toy (NSFW)' },
  { value: 'clothing', label: 'Clothing' },
];

const RARITY_LEVELS = [
  { value: 'common', label: 'Common', color: '#a0a0a0' },
  { value: 'uncommon', label: 'Uncommon', color: '#4a9c4a' },
  { value: 'rare', label: 'Rare', color: '#4a4a9c' },
  { value: 'epic', label: 'Epic', color: '#9c4a9c' },
  { value: 'legendary', label: 'Legendary', color: '#ffa500' },
];

const EQUIPMENT_SLOTS = [
  // Standard slots
  { value: 'main_hand', label: 'Main Hand', category: 'weapon' },
  { value: 'off_hand', label: 'Off Hand', category: 'weapon' },
  { value: 'head', label: 'Head', category: 'armor' },
  { value: 'face', label: 'Face', category: 'armor' },
  { value: 'neck', label: 'Neck', category: 'armor' },
  { value: 'chest', label: 'Chest', category: 'armor' },
  { value: 'back', label: 'Back', category: 'armor' },
  { value: 'arms', label: 'Arms', category: 'armor' },
  { value: 'hands', label: 'Hands', category: 'armor' },
  { value: 'waist', label: 'Waist', category: 'armor' },
  { value: 'legs', label: 'Legs', category: 'armor' },
  { value: 'feet', label: 'Feet', category: 'armor' },
  { value: 'underwear_top', label: 'Underwear (Top)', category: 'clothing' },
  { value: 'underwear_bottom', label: 'Underwear (Bottom)', category: 'clothing' },

  // Accessory slots
  { value: 'accessory_1', label: 'Accessory 1', category: 'accessory' },
  { value: 'accessory_2', label: 'Accessory 2', category: 'accessory' },
  { value: 'ring_left', label: 'Ring (Left)', category: 'accessory' },
  { value: 'ring_right', label: 'Ring (Right)', category: 'accessory' },

  // Special slots
  { value: 'implant_head', label: 'Implant (Head)', category: 'special' },
  { value: 'implant_body', label: 'Implant (Body)', category: 'special' },
  { value: 'implant_limbs', label: 'Implant (Limbs)', category: 'special' },

  // NSFW Body part slots
  { value: 'nipple_left', label: 'Nipple (Left)', category: 'nsfw' },
  { value: 'nipple_right', label: 'Nipple (Right)', category: 'nsfw' },
  { value: 'nipples', label: 'Nipples (Both)', category: 'nsfw' },
  { value: 'mouth', label: 'Mouth', category: 'nsfw' },
  { value: 'ears', label: 'Ears', category: 'nsfw' },
  { value: 'nose', label: 'Nose', category: 'nsfw' },

  // NSFW Genital slots
  { value: 'dick', label: 'Dick/Penis', category: 'nsfw' },
  { value: 'balls', label: 'Balls/Testicles', category: 'nsfw' },
  { value: 'pussy', label: 'Pussy/Vagina', category: 'nsfw' },
  { value: 'clitoris', label: 'Clitoris', category: 'nsfw' },
  { value: 'urethra', label: 'Urethra', category: 'nsfw' },
  { value: 'ass', label: 'Ass/Anus', category: 'nsfw' },

  // NSFW Special slots
  { value: 'plug', label: 'Plug (Anal/Vaginal)', category: 'nsfw' },
  { value: 'chastity', label: 'Chastity Device', category: 'nsfw' },
  { value: 'genital', label: 'Genital (Generic)', category: 'nsfw' },
];

const COMMON_TAGS = [
  'weapon', 'armor', 'consumable', 'material', 'quest', 'misc',
  'sword', 'axe', 'bow', 'staff', 'dagger', 'mace',
  'light', 'medium', 'heavy', 'shield',
  'healing', 'buff', 'debuff', 'poison',
  'cursed', 'blessed', 'magical', 'rare',
  'nsfw', 'toy', 'clothing', 'jewelry',
  'crafting', 'cooking', 'alchemy',
  // NSFW specific tags
  'piercing', 'vibrator', 'plug', 'restraint', 'gag',
  'chastity', 'collar', 'leash', 'blindfold', 'clamps',
];

const DEFAULT_ITEM = {
  id: '',
  name: '',
  description: '',
  type: 'weapon',
  rarity: 'common',
  value: 10,
  stackable: false,
  maxStack: 1,
  equipSlots: [],  // Array of slots this item can be equipped in
  tags: [],
  icon: {
    type: 'sprite',
    sheetId: 'items',
    iconId: 'default',
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
}) => {
  const [formData, setFormData] = useState({ ...DEFAULT_ITEM });
  const [tagInput, setTagInput] = useState('');
  const [hoveredItem, setHoveredItem] = useState(null);

  // Load editing item when it changes
  useEffect(() => {
    if (editingItem) {
      // Handle legacy single equipSlot conversion to array
      let equipSlots = editingItem.equipSlots || [];
      if (editingItem.equipSlot && !editingItem.equipSlots) {
        equipSlots = [editingItem.equipSlot];
      }

      setFormData({
        ...DEFAULT_ITEM,
        ...editingItem,
        equipSlots,
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

  const handleSubmit = () => {
    if (!formData.id || !formData.name) {
      alert('ID and Name are required');
      return;
    }

    // Check for duplicate ID if not editing
    if (!editingItem && items.some(item => item.id === formData.id)) {
      alert('An item with this ID already exists');
      return;
    }

    if (editingItem) {
      onUpdate(editingItem._id, formData);
    } else {
      onAdd(formData);
    }

    setFormData({ ...DEFAULT_ITEM });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_ITEM });
    onCancelEdit();
  };

  return (
    <div style={styles.container}>
      {/* Form Section */}
      <div style={styles.formSection}>
        <h3 style={styles.sectionTitle}>
          {editingItem ? '✏️ Edit Item' : '➕ Create New Item'}
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
                placeholder="unique_item_id"
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
                placeholder="Item Name"
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
            placeholder="A detailed description of the item..."
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
                {ITEM_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Rarity</label>
              <select
                style={styles.select}
                value={formData.rarity}
                onChange={(e) => handleChange('rarity', e.target.value)}
              >
                {RARITY_LEVELS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Value (Gold)</label>
              <input
                style={styles.input}
                type="number"
                value={formData.value}
                onChange={(e) => handleChange('value', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <input
                  type="checkbox"
                  checked={formData.stackable}
                  onChange={(e) => handleChange('stackable', e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Stackable
              </label>
            </div>
          </div>
          {formData.stackable && (
            <div style={styles.halfWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Max Stack</label>
                <input
                  style={styles.input}
                  type="number"
                  value={formData.maxStack}
                  onChange={(e) => handleChange('maxStack', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Equipment Slots - Multi-select */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>
            Equipment Slots
            {formData.equipSlots.length > 0 && (
              <span style={{ fontWeight: 'normal', color: '#4a7c4a', marginLeft: '10px' }}>
                ({formData.equipSlots.length} selected)
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#808090', marginBottom: '15px' }}>
            Select all slots where this item can be equipped. Leave empty if not equippable.
          </div>

          {/* Slot chip styles */}
          {(() => {
            const chipBase = {
              padding: '6px 12px',
              borderRadius: '16px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              border: '2px solid transparent',
              userSelect: 'none',
            };
            const chipUnselected = {
              ...chipBase,
              backgroundColor: '#2a2a45',
              color: '#808090',
              borderColor: '#3a3a5a',
            };
            const chipSelected = {
              ...chipBase,
              backgroundColor: '#3a5a3a',
              color: '#90ff90',
              borderColor: '#4a7c4a',
            };
            const chipNsfwUnselected = {
              ...chipBase,
              backgroundColor: '#352a35',
              color: '#a080a0',
              borderColor: '#4a3a4a',
            };
            const chipNsfwSelected = {
              ...chipBase,
              backgroundColor: '#5a3a5a',
              color: '#ff90ff',
              borderColor: '#8a4a8a',
            };
            const categoryLabel = {
              color: '#a0a0c0',
              fontSize: '11px',
              marginBottom: '8px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            };
            const categoryLabelNsfw = {
              ...categoryLabel,
              color: '#ff9999',
            };

            return (
              <>
                {/* Weapons */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={categoryLabel}>Weapons</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {EQUIPMENT_SLOTS.filter(s => s.category === 'weapon').map(slot => {
                      const isSelected = formData.equipSlots.includes(slot.value);
                      return (
                        <div
                          key={slot.value}
                          style={isSelected ? chipSelected : chipUnselected}
                          onClick={() => handleToggleEquipSlot(slot.value)}
                        >
                          {isSelected && <span style={{ marginRight: '4px' }}>✓</span>}
                          {slot.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Armor */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={categoryLabel}>Armor</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {EQUIPMENT_SLOTS.filter(s => s.category === 'armor').map(slot => {
                      const isSelected = formData.equipSlots.includes(slot.value);
                      return (
                        <div
                          key={slot.value}
                          style={isSelected ? chipSelected : chipUnselected}
                          onClick={() => handleToggleEquipSlot(slot.value)}
                        >
                          {isSelected && <span style={{ marginRight: '4px' }}>✓</span>}
                          {slot.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Clothing & Accessories */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={categoryLabel}>Clothing & Accessories</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {EQUIPMENT_SLOTS.filter(s => s.category === 'clothing' || s.category === 'accessory').map(slot => {
                      const isSelected = formData.equipSlots.includes(slot.value);
                      return (
                        <div
                          key={slot.value}
                          style={isSelected ? chipSelected : chipUnselected}
                          onClick={() => handleToggleEquipSlot(slot.value)}
                        >
                          {isSelected && <span style={{ marginRight: '4px' }}>✓</span>}
                          {slot.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Special/Implants */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={categoryLabel}>Special / Implants</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {EQUIPMENT_SLOTS.filter(s => s.category === 'special').map(slot => {
                      const isSelected = formData.equipSlots.includes(slot.value);
                      return (
                        <div
                          key={slot.value}
                          style={isSelected ? chipSelected : chipUnselected}
                          onClick={() => handleToggleEquipSlot(slot.value)}
                        >
                          {isSelected && <span style={{ marginRight: '4px' }}>✓</span>}
                          {slot.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* NSFW Body Parts */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={categoryLabelNsfw}>NSFW - Body Parts</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {EQUIPMENT_SLOTS.filter(s => s.category === 'nsfw').map(slot => {
                      const isSelected = formData.equipSlots.includes(slot.value);
                      return (
                        <div
                          key={slot.value}
                          style={isSelected ? chipNsfwSelected : chipNsfwUnselected}
                          onClick={() => handleToggleEquipSlot(slot.value)}
                        >
                          {isSelected && <span style={{ marginRight: '4px' }}>✓</span>}
                          {slot.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            );
          })()}

          {formData.equipSlots.length > 0 && (
            <button
              style={{
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                cursor: 'pointer',
                backgroundColor: '#4a2a2a',
                color: '#ff9999',
                border: '2px solid #6a3a3a',
                marginTop: '8px',
              }}
              onClick={() => handleChange('equipSlots', [])}
            >
              Clear All Slots
            </button>
          )}
        </div>

        {/* Icon */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Icon</div>
          <div style={styles.row}>
            <div style={styles.iconPreview}>
              🎴
            </div>
            <div style={{ flex: 1 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Sprite Sheet ID</label>
                <input
                  style={styles.input}
                  value={formData.icon.sheetId}
                  onChange={(e) => handleNestedChange('icon', 'sheetId', e.target.value)}
                  placeholder="items"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Icon ID</label>
                <input
                  style={styles.input}
                  value={formData.icon.iconId}
                  onChange={(e) => handleNestedChange('icon', 'iconId', e.target.value)}
                  placeholder="sword_icon"
                />
              </div>
            </div>
          </div>
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
            {COMMON_TAGS.filter(t => !formData.tags.includes(t)).slice(0, 15).map(tag => (
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

        {/* Base Stats (for equipment) */}
        {formData.equipSlots.length > 0 && (
          <div style={styles.subsection}>
            <div style={styles.subsectionTitle}>Base Stats</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {Object.entries(formData.baseStats).map(([stat, value]) => (
                <div key={stat} style={styles.statRow}>
                  <span style={styles.statLabel}>{stat.charAt(0).toUpperCase() + stat.slice(1)}</span>
                  <input
                    style={styles.statInput}
                    type="number"
                    value={value}
                    onChange={(e) => handleNestedChange('baseStats', stat, parseInt(e.target.value) || 0)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Requirements */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Requirements</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>Level</span>
              <input
                style={styles.statInput}
                type="number"
                value={formData.requirements.level}
                onChange={(e) => handleNestedChange('requirements', 'level', parseInt(e.target.value) || 1)}
              />
            </div>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>Strength</span>
              <input
                style={styles.statInput}
                type="number"
                value={formData.requirements.strength}
                onChange={(e) => handleNestedChange('requirements', 'strength', parseInt(e.target.value) || 0)}
              />
            </div>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>Intelligence</span>
              <input
                style={styles.statInput}
                type="number"
                value={formData.requirements.intelligence}
                onChange={(e) => handleNestedChange('requirements', 'intelligence', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: '20px' }}>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleSubmit}
          >
            {editingItem ? '💾 Update Item' : '➕ Add Item'}
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
        <h3 style={styles.sectionTitle}>📋 Created Items ({items.length})</h3>

        {items.length === 0 ? (
          <div style={styles.emptyList}>
            No items created yet.<br />
            Use the form to create your first item.
          </div>
        ) : (
          items.map(item => (
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
                {item.name}
                <span style={{
                  marginLeft: '8px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  backgroundColor: RARITY_LEVELS.find(r => r.value === item.rarity)?.color || '#4a4a6a',
                  color: 'white',
                }}>
                  {item.rarity}
                </span>
              </div>
              <div style={styles.listItemDetails}>
                ID: {item.id} | Type: {item.type} | Value: {item.value}g
              </div>
              {(item.equipSlots?.length > 0 || item.equipSlot) && (
                <div style={{ ...styles.listItemDetails, color: '#4a7c9a' }}>
                  Slots: {(item.equipSlots || [item.equipSlot]).join(', ')}
                </div>
              )}
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
          ))
        )}
      </div>
    </div>
  );
};

export default ItemCreator;
