import React, { useState, useEffect, useMemo } from 'react';
import { collectTags } from '../DatapackLoader';
import { FormInput, FormSelect, TagInput, Button, CollapsibleSection } from '../../ui/shared';
import { useFormDraft } from '../../../hooks/useFormDraft';
import './CreatorStyles.css';

const DRAFT_KEY = 'contentGenerator_draft_quests';

const TAG_CATEGORIES = {
  type: ['main', 'side', 'daily', 'repeatable', 'hidden', 'event'],
  activity: ['combat', 'exploration', 'fetch', 'delivery', 'escort'],
  special: ['nsfw', 'romance', 'faction', 'tutorial', 'story'],
};

const QUEST_TYPE_OPTIONS = [
  { value: 'main', label: 'Main Quest' },
  { value: 'side', label: 'Side Quest' },
  { value: 'daily', label: 'Daily' },
  { value: 'repeatable', label: 'Repeatable' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'event', label: 'Event' },
  { value: 'story', label: 'Story' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'faction', label: 'Faction' },
  { value: 'bounty', label: 'Bounty' },
  { value: 'nsfw', label: 'NSFW' },
];

const OBJECTIVE_TYPES = [
  { value: 'kill', label: 'Kill Enemies' },
  { value: 'collect', label: 'Collect Items' },
  { value: 'deliver', label: 'Deliver Item' },
  { value: 'talk', label: 'Talk to NPC' },
  { value: 'visit', label: 'Visit Location' },
  { value: 'explore', label: 'Explore Area' },
  { value: 'survive', label: 'Survive Encounter' },
  { value: 'escort', label: 'Escort NPC' },
  { value: 'craft', label: 'Craft Item' },
  { value: 'reach_level', label: 'Reach Level' },
  { value: 'reach_stat', label: 'Reach Stat Value' },
  { value: 'flag', label: 'Set Flag' },
  { value: 'custom', label: 'Custom Condition' },
];

const REWARD_TYPES = [
  { value: 'gold', label: 'Gold' },
  { value: 'experience', label: 'Experience' },
  { value: 'item', label: 'Item' },
  { value: 'reputation', label: 'Reputation' },
  { value: 'unlock_location', label: 'Unlock Location' },
  { value: 'unlock_quest', label: 'Unlock Quest' },
  { value: 'skill_point', label: 'Skill Point' },
  { value: 'stat_boost', label: 'Stat Boost' },
  { value: 'title', label: 'Title' },
  { value: 'flag', label: 'Set Flag' },
];

const DEFAULT_QUEST = {
  id: '',
  name: '',
  description: '',
  type: 'side',
  level: 1,
  isRepeatable: false,
  cooldownHours: 0,
  isHidden: false,
  autoStart: false,
  prerequisites: {
    quests: [],
    level: 0,
    flags: [],
    items: [],
  },
  objectives: [],
  rewards: [],
  failConditions: [],
  dialogue: {
    start: '',
    progress: '',
    complete: '',
    fail: '',
  },
  npcGiver: '',
  npcTurnIn: '',
  timeLimit: 0,
  tags: [],
};

const DEFAULT_OBJECTIVE = {
  id: '',
  type: 'kill',
  description: '',
  target: '',
  count: 1,
  currentCount: 0,
  optional: false,
  hidden: false,
  order: 0,
};

const DEFAULT_REWARD = {
  type: 'gold',
  value: 100,
  itemId: '',
  count: 1,
};

const QuestCreator = ({
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
  const [formData, setFormData] = useState({ ...DEFAULT_QUEST });
  const [hoveredItem, setHoveredItem] = useState(null);
  const [newObjective, setNewObjective] = useState({ ...DEFAULT_OBJECTIVE });
  const [newReward, setNewReward] = useState({ ...DEFAULT_REWARD });
  const [collapsedSections, setCollapsedSections] = useState({
    objectives: false,
    rewards: false,
    dialogue: true,
    tags: true,
  });

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const { clearDraft } = useFormDraft(DRAFT_KEY, formData, setFormData, editingItem, {
    defaultValues: DEFAULT_QUEST,
  });

  const suggestedTags = useMemo(() => {
    return collectTags({
      datapackContent,
      userContent: items,
      commonTags: Object.values(TAG_CATEGORIES).flat(),
      contentType: 'quests',
    });
  }, [datapackContent, items]);

  // Combine datapack content with user-created content
  const allNPCs = useMemo(() => {
    return [...(datapackContent.npcs || []), ...(allContent?.npcs || [])]
      .filter(item => item && item.id && (!item.contentType || item.contentType === 'npc'));
  }, [datapackContent.npcs, allContent?.npcs]);

  const allLocations = useMemo(() => {
    return [...(datapackContent.locations || []), ...(allContent?.locations || [])]
      .filter(item => item && item.id && (!item.contentType || item.contentType === 'location'));
  }, [datapackContent.locations, allContent?.locations]);

  const allEnemies = useMemo(() => {
    return [...(datapackContent.enemies || []), ...(allContent?.enemies || [])]
      .filter(item => item && item.id && (!item.contentType || item.contentType === 'enemy'));
  }, [datapackContent.enemies, allContent?.enemies]);

  const allItems = useMemo(() => {
    return [...(datapackContent.items || []), ...(allContent?.items || [])]
      .filter(item => item && item.id && (!item.contentType || item.contentType === 'item'));
  }, [datapackContent.items, allContent?.items]);

  const npcOptions = useMemo(() => {
    return allNPCs.map(n => ({ value: n.id, label: n.name || n.id }));
  }, [allNPCs]);

  const enemyOptions = useMemo(() => {
    return allEnemies.map(e => ({ value: e.id, label: e.name || e.id }));
  }, [allEnemies]);

  const locationOptions = useMemo(() => {
    return allLocations.map(l => ({ value: l.id, label: l.name || l.id }));
  }, [allLocations]);

  const itemOptions = useMemo(() => {
    return allItems.map(i => ({ value: i.id, label: i.name || i.id }));
  }, [allItems]);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...DEFAULT_QUEST,
        ...editingItem,
        prerequisites: { ...DEFAULT_QUEST.prerequisites, ...editingItem.prerequisites },
        dialogue: { ...DEFAULT_QUEST.dialogue, ...editingItem.dialogue },
        objectives: editingItem.objectives || [],
        rewards: editingItem.rewards || [],
        tags: editingItem.tags || [],
      });
    } else {
      setFormData({ ...DEFAULT_QUEST });
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

  // Objective handlers
  const handleAddObjective = () => {
    if (newObjective.description || newObjective.target) {
      const objective = {
        ...newObjective,
        id: `obj_${Date.now()}`,
        order: formData.objectives.length,
      };
      setFormData(prev => ({
        ...prev,
        objectives: [...prev.objectives, objective],
      }));
      setNewObjective({ ...DEFAULT_OBJECTIVE });
    }
  };

  const handleRemoveObjective = (index) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index),
    }));
  };

  // Reward handlers
  const handleAddReward = () => {
    if (newReward.type) {
      setFormData(prev => ({
        ...prev,
        rewards: [...prev.rewards, { ...newReward }],
      }));
      setNewReward({ ...DEFAULT_REWARD });
    }
  };

  const handleRemoveReward = (index) => {
    setFormData(prev => ({
      ...prev,
      rewards: prev.rewards.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    if (!formData.id || !formData.name) {
      alert('Quest ID and Name are required');
      return;
    }

    if (!editingItem && items.some(item => item.id === formData.id)) {
      alert('A quest with this ID already exists');
      return;
    }

    if (editingItem) {
      onUpdate(editingItem._id, formData);
    } else {
      onAdd(formData);
      clearDraft();
    }

    setFormData({ ...DEFAULT_QUEST });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_QUEST });
    if (onCancelEdit) onCancelEdit();
  };

  // Get target options based on objective type
  const getTargetOptions = (type) => {
    switch (type) {
      case 'kill': return enemyOptions;
      case 'collect':
      case 'deliver':
      case 'craft': return itemOptions;
      case 'talk':
      case 'escort': return npcOptions;
      case 'visit':
      case 'explore': return locationOptions;
      default: return [];
    }
  };

  const getRewardDescription = (reward) => {
    switch (reward.type) {
      case 'gold': return `${reward.value} Gold`;
      case 'experience': return `${reward.value} XP`;
      case 'item': return `${reward.count}x ${allItems.find(i => i.id === reward.itemId)?.name || reward.itemId}`;
      case 'reputation': return `${reward.value > 0 ? '+' : ''}${reward.value} Reputation`;
      case 'skill_point': return `${reward.value} Skill Point(s)`;
      default: return `${REWARD_TYPES.find(t => t.value === reward.type)?.label}: ${reward.value || reward.itemId}`;
    }
  };

  const targetNeedsSelect = ['kill', 'collect', 'deliver', 'craft', 'talk', 'escort', 'visit', 'explore'].includes(newObjective.type);

  return (
    <div className="creator-container">
      {/* Form Section */}
      <div className="creator-form">
        <h3 className="creator-form-section-title">
          {editingItem ? 'Edit Quest' : 'Create New Quest'}
        </h3>

        {/* Basic Info */}
        <div className="creator-form-section">
          <div className="creator-form-row">
            <FormInput
              label="ID"
              required
              value={formData.id}
              onChange={(v) => handleChange('id', String(v).toLowerCase().replace(/\s+/g, '_'))}
              placeholder="unique_quest_id"
            />
            <FormInput
              label="Name"
              required
              value={formData.name}
              onChange={(v) => handleChange('name', v)}
              placeholder="Quest Name"
            />
          </div>

          <FormInput
            label="Description"
            type="textarea"
            value={formData.description}
            onChange={(v) => handleChange('description', v)}
            placeholder="Describe the quest objectives and story..."
            rows={3}
          />

          <div className="creator-form-row cols-3">
            <FormSelect
              label="Quest Type"
              value={formData.type}
              onChange={(v) => handleChange('type', v)}
              options={QUEST_TYPE_OPTIONS}
            />
            <FormInput
              label="Required Level"
              type="number"
              value={formData.level}
              onChange={(v) => handleChange('level', v)}
              min={1}
            />
            <FormInput
              label="Time Limit (turns)"
              type="number"
              value={formData.timeLimit}
              onChange={(v) => handleChange('timeLimit', v)}
              min={0}
              helper="0 = no limit"
            />
          </div>

          <div className="creator-form-row">
            <FormSelect
              label="Quest Giver NPC"
              value={formData.npcGiver}
              onChange={(v) => handleChange('npcGiver', v)}
              options={npcOptions}
              placeholder="Select NPC..."
            />
            <FormSelect
              label="Turn-in NPC"
              value={formData.npcTurnIn}
              onChange={(v) => handleChange('npcTurnIn', v)}
              options={npcOptions}
              placeholder="Same as giver"
            />
          </div>

          <div className="creator-form-row cols-3">
            <div className="checkbox-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isRepeatable}
                  onChange={(e) => handleChange('isRepeatable', e.target.checked)}
                />
                <span className="checkbox-text">Repeatable</span>
              </label>
            </div>
            <div className="checkbox-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isHidden}
                  onChange={(e) => handleChange('isHidden', e.target.checked)}
                />
                <span className="checkbox-text">Hidden Quest</span>
              </label>
            </div>
            <div className="checkbox-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.autoStart}
                  onChange={(e) => handleChange('autoStart', e.target.checked)}
                />
                <span className="checkbox-text">Auto-start</span>
              </label>
            </div>
          </div>

          {formData.isRepeatable && (
            <FormInput
              label="Cooldown (hours)"
              type="number"
              value={formData.cooldownHours}
              onChange={(v) => handleChange('cooldownHours', v)}
              min={0}
              helper="0 = no cooldown"
            />
          )}
        </div>

        {/* Objectives */}
        <CollapsibleSection
          title="Quest Objectives"
          isCollapsed={collapsedSections.objectives}
          onToggle={() => toggleSection('objectives')}
          badge={formData.objectives.length > 0 ? formData.objectives.length : null}
        >
          {formData.objectives.map((obj, index) => (
            <div key={obj.id || index} className="array-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--color-accent-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
                    {index + 1}. {obj.description || OBJECTIVE_TYPES.find(t => t.value === obj.type)?.label}
                    {obj.optional && <span className="text-muted"> (Optional)</span>}
                  </div>
                  <div className="text-muted text-sm" style={{ marginTop: 'var(--space-xxs)' }}>
                    Target: {obj.target} | Count: {obj.count}
                  </div>
                </div>
                <Button variant="danger" size="sm" onClick={() => handleRemoveObjective(index)}>
                  Remove
                </Button>
              </div>
            </div>
          ))}

          {/* Add New Objective */}
          <div className="subsection">
            <div className="subsection-title">Add Objective</div>
            <div className="creator-form-row">
              <FormSelect
                label="Type"
                value={newObjective.type}
                onChange={(v) => setNewObjective(prev => ({ ...prev, type: v, target: '' }))}
                options={OBJECTIVE_TYPES}
              />
              {targetNeedsSelect ? (
                <FormSelect
                  label="Target"
                  value={newObjective.target}
                  onChange={(v) => setNewObjective(prev => ({ ...prev, target: v }))}
                  options={getTargetOptions(newObjective.type)}
                  placeholder="Select target..."
                />
              ) : (
                <FormInput
                  label="Target"
                  value={newObjective.target}
                  onChange={(v) => setNewObjective(prev => ({ ...prev, target: v }))}
                  placeholder="Target value"
                />
              )}
            </div>
            <div className="creator-form-row cols-4">
              <FormInput
                label="Description"
                value={newObjective.description}
                onChange={(v) => setNewObjective(prev => ({ ...prev, description: v }))}
                placeholder="Kill 5 wolves"
              />
              <FormInput
                label="Count"
                type="number"
                value={newObjective.count}
                onChange={(v) => setNewObjective(prev => ({ ...prev, count: v }))}
                min={1}
              />
              <div className="checkbox-row" style={{ marginTop: 'var(--space-lg)' }}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newObjective.optional}
                    onChange={(e) => setNewObjective(prev => ({ ...prev, optional: e.target.checked }))}
                  />
                  <span className="checkbox-text">Optional</span>
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button variant="success" size="sm" onClick={handleAddObjective}>
                  + Add
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Rewards */}
        <CollapsibleSection
          title="Quest Rewards"
          isCollapsed={collapsedSections.rewards}
          onToggle={() => toggleSection('rewards')}
          badge={formData.rewards.length > 0 ? formData.rewards.length : null}
        >
          {formData.rewards.map((reward, index) => (
            <div key={index} className="array-item">
              <div className="array-item-content">
                <span style={{ color: 'var(--color-accent-success)' }}>
                  {getRewardDescription(reward)}
                </span>
              </div>
              <Button variant="danger" size="sm" onClick={() => handleRemoveReward(index)}>
                ×
              </Button>
            </div>
          ))}

          {/* Add New Reward */}
          <div className="subsection">
            <div className="creator-form-row cols-4">
              <FormSelect
                label="Type"
                value={newReward.type}
                onChange={(v) => setNewReward(prev => ({ ...prev, type: v, value: 100, itemId: '' }))}
                options={REWARD_TYPES}
              />
              {newReward.type === 'item' ? (
                <>
                  <FormSelect
                    label="Item"
                    value={newReward.itemId}
                    onChange={(v) => setNewReward(prev => ({ ...prev, itemId: v }))}
                    options={itemOptions}
                    placeholder="Select item..."
                  />
                  <FormInput
                    label="Count"
                    type="number"
                    value={newReward.count}
                    onChange={(v) => setNewReward(prev => ({ ...prev, count: v }))}
                    min={1}
                  />
                </>
              ) : (
                <FormInput
                  label="Value"
                  type="number"
                  value={newReward.value}
                  onChange={(v) => setNewReward(prev => ({ ...prev, value: v }))}
                />
              )}
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button variant="success" size="sm" onClick={handleAddReward}>
                  + Add
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Dialogue */}
        <CollapsibleSection
          title="Quest Dialogue"
          isCollapsed={collapsedSections.dialogue}
          onToggle={() => toggleSection('dialogue')}
        >
          <FormInput
            label="Start Dialogue"
            type="textarea"
            value={formData.dialogue.start}
            onChange={(v) => handleNestedChange('dialogue', 'start', v)}
            placeholder="What the NPC says when giving the quest..."
            rows={2}
          />
          <FormInput
            label="Progress Dialogue"
            type="textarea"
            value={formData.dialogue.progress}
            onChange={(v) => handleNestedChange('dialogue', 'progress', v)}
            placeholder="What the NPC says while quest is in progress..."
            rows={2}
          />
          <FormInput
            label="Completion Dialogue"
            type="textarea"
            value={formData.dialogue.complete}
            onChange={(v) => handleNestedChange('dialogue', 'complete', v)}
            placeholder="What the NPC says when quest is complete..."
            rows={2}
          />
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
            {editingItem ? 'Update Quest' : 'Add Quest'}
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
          Created Quests
          <span className="count-badge">{items.length}</span>
        </h3>

        {items.length === 0 ? (
          <div className="empty-list">
            No quests created yet.
            <br />
            Use the form to create your first quest.
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
                  {item.isHidden && (
                    <span className="rarity-badge" style={{ backgroundColor: 'var(--color-text-muted)' }}>
                      Hidden
                    </span>
                  )}
                </div>
                <div className="creator-item-id">
                  {item.type} | Level {item.level}
                </div>
                <div className="creator-item-id">
                  {item.objectives?.length || 0} objectives | {item.rewards?.length || 0} rewards
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
              </div>
              <div className="creator-item-actions">
                <Button variant="success" size="sm" onClick={() => onEdit(item)}>
                  Edit
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onDuplicate(item)}>
                  Dup
                </Button>
                <Button variant="danger" size="sm" onClick={() => onDelete(item._id)}>
                  Del
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuestCreator;
