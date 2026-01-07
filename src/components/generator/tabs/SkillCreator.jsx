import React, { useState, useEffect, useMemo } from 'react';
import { collectTags } from '../DatapackLoader';

// Fallback skill tags when no dynamic tags available
const FALLBACK_SKILL_TAGS = [
  'combat', 'defense', 'magic', 'utility', 'recovery',
  'fire', 'ice', 'lightning', 'holy', 'dark',
  'aoe', 'single_target', 'self', 'buff', 'debuff',
  'nsfw', 'corruption', 'seduction',
];

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
    minHeight: '80px',
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
  effectCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: '6px',
    padding: '10px',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
};

// Suggested skill types - users can also type custom values
const SUGGESTED_SKILL_TYPES = [
  'active', 'passive', 'toggle', 'reaction', 'charged', 'channeled',
];

// Suggested categories - users can also type custom values
const SUGGESTED_CATEGORIES = [
  'combat', 'defense', 'magic', 'utility', 'recovery', 'resistance',
  'stealth', 'movement', 'nsfw', 'support', 'debuff',
];

// Suggested target types - users can also type custom values
const SUGGESTED_TARGET_TYPES = [
  'self', 'enemy', 'ally', 'all_enemies', 'all_allies', 'everyone', 'area', 'random',
];

// Suggested damage types - users can also type custom values
const SUGGESTED_DAMAGE_TYPES = [
  'physical', 'fire', 'ice', 'lightning', 'poison', 'psychic',
  'holy', 'dark', 'true', 'chaos', 'nature', 'arcane',
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

const STATS = ['strength', 'vitality', 'evasion', 'speed', 'willpower', 'charm', 'intelligence', 'defense', 'attack'];

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
  const [tagInput, setTagInput] = useState('');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [newEffect, setNewEffect] = useState({ ...DEFAULT_EFFECT });

  // Compute dynamic tag suggestions
  const suggestedTags = useMemo(() => {
    return collectTags({
      datapackContent,
      userContent: items,
      commonTags: FALLBACK_SKILL_TAGS,
    });
  }, [datapackContent, items]);

  // Combine datapack content with user-created content
  const allEffects = [...(datapackContent.effects || []), ...(allContent?.effects || [])];

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

  const handleCostChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      cost: { ...prev.cost, [field]: value },
    }));
  };

  const handleRequirementChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      requirements: { ...prev.requirements, [field]: value },
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

    const skillData = { ...formData };

    if (editingItem) {
      onUpdate(editingItem._id, skillData);
    } else {
      onAdd(skillData);
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

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'active': return '#4a7c4a';
      case 'passive': return '#3a5a7a';
      case 'toggle': return '#7a5a3a';
      case 'reaction': return '#5a3a7a';
      default: return '#4a4a6a';
    }
  };

  return (
    <div style={styles.container}>
      {/* Form Section */}
      <div style={styles.formSection}>
        <h3 style={styles.sectionTitle}>
          {editingItem ? 'Edit Skill' : 'Create New Skill'}
        </h3>

        {/* Basic Info */}
        <div style={styles.row}>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Skill ID *</label>
              <input
                style={styles.input}
                value={formData.id}
                onChange={(e) => handleChange('id', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                placeholder="power_strike"
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
                placeholder="Power Strike"
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
            placeholder="Describe what this skill does..."
          />
        </div>

        <div style={styles.row}>
          <div style={styles.thirdWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Skill Type</label>
              <input
                style={styles.input}
                list="skill-type-suggestions"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                placeholder="e.g., active, passive, toggle"
              />
              <datalist id="skill-type-suggestions">
                {SUGGESTED_SKILL_TYPES.map(type => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </div>
          </div>
          <div style={styles.thirdWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <input
                style={styles.input}
                list="skill-category-suggestions"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                placeholder="e.g., combat, magic, utility"
              />
              <datalist id="skill-category-suggestions">
                {SUGGESTED_CATEGORIES.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
          </div>
          <div style={styles.thirdWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Target</label>
              <input
                style={styles.input}
                list="skill-target-suggestions"
                value={formData.targetType}
                onChange={(e) => handleChange('targetType', e.target.value)}
                placeholder="e.g., self, enemy, all_enemies"
              />
              <datalist id="skill-target-suggestions">
                {SUGGESTED_TARGET_TYPES.map(target => (
                  <option key={target} value={target} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* Cost */}
        {formData.type !== 'passive' && (
          <div style={styles.subsection}>
            <div style={styles.subsectionTitle}>Skill Cost</div>
            <div style={styles.row}>
              <div style={styles.thirdWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Stamina Cost</label>
                  <input
                    style={styles.input}
                    type="number"
                    value={formData.cost.stamina}
                    onChange={(e) => handleCostChange('stamina', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </div>
              <div style={styles.thirdWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>HP Cost</label>
                  <input
                    style={styles.input}
                    type="number"
                    value={formData.cost.hp}
                    onChange={(e) => handleCostChange('hp', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </div>
              <div style={styles.thirdWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Cooldown (turns)</label>
                  <input
                    style={styles.input}
                    type="number"
                    value={formData.cooldown}
                    onChange={(e) => handleChange('cooldown', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Effects */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Skill Effects</div>

          {formData.effects.map((effect, index) => (
            <div key={index} style={styles.effectCard}>
              <span style={{ color: '#4aca4a' }}>
                {getEffectDescription(effect)}
                {effect.chance < 100 && ` (${effect.chance}% chance)`}
              </span>
              <button
                style={{ ...styles.smallButton, backgroundColor: '#7c4a4a', color: 'white' }}
                onClick={() => handleRemoveEffect(index)}
              >
                ×
              </button>
            </div>
          ))}

          {/* Add New Effect */}
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#252540', borderRadius: '6px' }}>
            <div style={styles.row}>
              <div style={styles.thirdWidth}>
                <label style={styles.label}>Effect Type</label>
                <select
                  style={styles.select}
                  value={newEffect.type}
                  onChange={(e) => setNewEffect(prev => ({ ...prev, type: e.target.value }))}
                >
                  {EFFECT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div style={styles.thirdWidth}>
                <label style={styles.label}>Value</label>
                <input
                  style={styles.input}
                  type="number"
                  value={newEffect.value}
                  onChange={(e) => setNewEffect(prev => ({ ...prev, value: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div style={styles.thirdWidth}>
                <label style={styles.label}>Chance (%)</label>
                <input
                  style={styles.input}
                  type="number"
                  value={newEffect.chance}
                  onChange={(e) => setNewEffect(prev => ({ ...prev, chance: parseInt(e.target.value) || 100 }))}
                  min="0"
                  max="100"
                />
              </div>
            </div>
            <div style={styles.row}>
              {newEffect.type === 'damage' && (
                <div style={styles.thirdWidth}>
                  <label style={styles.label}>Damage Type</label>
                  <input
                    style={styles.input}
                    list="damage-type-suggestions"
                    value={newEffect.damageType}
                    onChange={(e) => setNewEffect(prev => ({ ...prev, damageType: e.target.value }))}
                    placeholder="e.g., physical, fire, ice"
                  />
                  <datalist id="damage-type-suggestions">
                    {SUGGESTED_DAMAGE_TYPES.map(type => (
                      <option key={type} value={type} />
                    ))}
                  </datalist>
                </div>
              )}
              {['buff_stat', 'debuff_stat'].includes(newEffect.type) && (
                <div style={styles.thirdWidth}>
                  <label style={styles.label}>Target Stat</label>
                  <select
                    style={styles.select}
                    value={newEffect.targetStat}
                    onChange={(e) => setNewEffect(prev => ({ ...prev, targetStat: e.target.value }))}
                  >
                    <option value="">Select stat...</option>
                    {STATS.map(stat => (
                      <option key={stat} value={stat}>{stat.charAt(0).toUpperCase() + stat.slice(1)}</option>
                    ))}
                  </select>
                </div>
              )}
              {['buff_stat', 'debuff_stat', 'apply_effect'].includes(newEffect.type) && (
                <div style={styles.thirdWidth}>
                  <label style={styles.label}>Duration (turns)</label>
                  <input
                    style={styles.input}
                    type="number"
                    value={newEffect.duration}
                    onChange={(e) => setNewEffect(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
              )}
              {newEffect.type === 'apply_effect' && (
                <div style={styles.thirdWidth}>
                  <label style={styles.label}>Status Effect</label>
                  <select
                    style={styles.select}
                    value={newEffect.effectId}
                    onChange={(e) => setNewEffect(prev => ({ ...prev, effectId: e.target.value }))}
                  >
                    <option value="">Select effect...</option>
                    {allEffects.map(eff => (
                      <option key={eff.id} value={eff.id}>{eff.name || eff.id}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  style={{ ...styles.button, ...styles.primaryButton, padding: '8px 16px' }}
                  onClick={handleAddEffect}
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Requirements</div>
          <div style={styles.row}>
            <div style={styles.halfWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Required Level</label>
                <input
                  style={styles.input}
                  type="number"
                  value={formData.requirements.level}
                  onChange={(e) => handleRequirementChange('level', parseInt(e.target.value) || 1)}
                  min="1"
                />
              </div>
            </div>
            <div style={styles.halfWidth}>
              <div style={styles.formGroup}>
                <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '8px', marginTop: '25px' }}>
                  <input
                    type="checkbox"
                    checked={formData.isNSFW}
                    onChange={(e) => handleChange('isNSFW', e.target.checked)}
                  />
                  NSFW Skill
                </label>
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
          <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {suggestedTags.filter(t => !formData.tags.includes(t)).slice(0, 15).map(tag => (
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

        {/* Actions */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleSubmit}
          >
            {editingItem ? 'Update Skill' : 'Create Skill'}
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
        <h3 style={styles.sectionTitle}>Created Skills ({items.length})</h3>

        {items.length === 0 ? (
          <div style={styles.emptyList}>
            No skills created yet.<br />
            Use the form to create your first skill.
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={styles.listItemName}>{item.name}</div>
                <span style={{ ...styles.typeBadge, backgroundColor: getTypeBadgeColor(item.type) }}>
                  {item.type}
                </span>
              </div>
              <div style={styles.listItemDetails}>
                {item.category}
                {item.cost?.stamina > 0 && ` | ${item.cost.stamina} Stamina`}
                {item.cooldown > 0 && ` | ${item.cooldown}t CD`}
              </div>
              <div style={styles.listItemDetails}>
                {item.effects?.length || 0} effects
                {item.isNSFW && ' | NSFW'}
              </div>
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

export default SkillCreator;
