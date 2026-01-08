import React, { useState, useEffect, useMemo } from 'react';
import { collectTags } from '../DatapackLoader';

// Fallback quest tags when no dynamic tags available
const FALLBACK_QUEST_TAGS = [
  'main', 'side', 'daily', 'repeatable', 'hidden',
  'combat', 'exploration', 'fetch', 'delivery', 'escort',
  'nsfw', 'romance', 'faction', 'tutorial',
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
  objectiveCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '10px',
    border: '1px solid #3a3a5a',
  },
  rewardCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: '6px',
    padding: '10px',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
};

// Suggested quest types - users can also type custom values
const SUGGESTED_QUEST_TYPES = [
  'main', 'side', 'daily', 'repeatable', 'hidden', 'event',
  'story', 'tutorial', 'faction', 'bounty', 'nsfw',
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
  const [tagInput, setTagInput] = useState('');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [newObjective, setNewObjective] = useState({ ...DEFAULT_OBJECTIVE });

  // Compute dynamic tag suggestions
  const suggestedTags = useMemo(() => {
    return collectTags({
      datapackContent,
      userContent: items,
      commonTags: FALLBACK_QUEST_TAGS,
    });
  }, [datapackContent, items]);
  const [newReward, setNewReward] = useState({ ...DEFAULT_REWARD });

  // Combine datapack content with user-created content
  const allNPCs = [...(datapackContent.npcs || []), ...(allContent?.npcs || [])];
  // Filter locations to exclude any enemy objects that may have been incorrectly included
  const allLocations = [...(datapackContent.locations || []), ...(allContent?.locations || [])]
    .filter(loc => {
      // A valid location should have locationType OR should NOT have enemy-specific fields
      const hasLocationFields = loc.locationType || loc.parentRegion || loc.connectedLocations || loc.navigation;
      const hasEnemyFields = loc.tier !== undefined || loc.maxHp !== undefined || loc.nsfwActions !== undefined || loc.loot !== undefined;
      return hasLocationFields || !hasEnemyFields;
    });
  const allEnemies = [...(datapackContent.enemies || []), ...(allContent?.enemies || [])];
  const allItems = [...(datapackContent.items || []), ...(allContent?.items || [])];
  const allQuests = [...items];

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

  const handleUpdateObjective = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.map((obj, i) =>
        i === index ? { ...obj, [field]: value } : obj
      ),
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

    const questData = { ...formData };

    if (editingItem) {
      onUpdate(editingItem._id, questData);
    } else {
      onAdd(questData);
    }

    setFormData({ ...DEFAULT_QUEST });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_QUEST });
    if (onCancelEdit) onCancelEdit();
  };

  // Render objective target field based on type
  const renderObjectiveTarget = () => {
    switch (newObjective.type) {
      case 'kill':
        return (
          <select
            style={styles.select}
            value={newObjective.target}
            onChange={(e) => setNewObjective(prev => ({ ...prev, target: e.target.value }))}
          >
            <option value="">Select enemy...</option>
            {allEnemies.map(enemy => (
              <option key={enemy.id} value={enemy.id}>{enemy.name || enemy.id}</option>
            ))}
          </select>
        );
      case 'collect':
      case 'deliver':
      case 'craft':
        return (
          <select
            style={styles.select}
            value={newObjective.target}
            onChange={(e) => setNewObjective(prev => ({ ...prev, target: e.target.value }))}
          >
            <option value="">Select item...</option>
            {allItems.map(item => (
              <option key={item.id} value={item.id}>{item.name || item.id}</option>
            ))}
          </select>
        );
      case 'talk':
      case 'escort':
        return (
          <select
            style={styles.select}
            value={newObjective.target}
            onChange={(e) => setNewObjective(prev => ({ ...prev, target: e.target.value }))}
          >
            <option value="">Select NPC...</option>
            {allNPCs.map(npc => (
              <option key={npc.id} value={npc.id}>{npc.name || npc.id}</option>
            ))}
          </select>
        );
      case 'visit':
      case 'explore':
        return (
          <select
            style={styles.select}
            value={newObjective.target}
            onChange={(e) => setNewObjective(prev => ({ ...prev, target: e.target.value }))}
          >
            <option value="">Select location...</option>
            {allLocations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name || loc.id}</option>
            ))}
          </select>
        );
      default:
        return (
          <input
            style={styles.input}
            value={newObjective.target}
            onChange={(e) => setNewObjective(prev => ({ ...prev, target: e.target.value }))}
            placeholder="Target value"
          />
        );
    }
  };

  return (
    <div style={styles.container}>
      {/* Form Section */}
      <div style={styles.formSection}>
        <h3 style={styles.sectionTitle}>
          {editingItem ? 'Edit Quest' : 'Create New Quest'}
        </h3>

        {/* Basic Info */}
        <div style={styles.row}>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Quest ID *</label>
              <input
                style={styles.input}
                value={formData.id}
                onChange={(e) => handleChange('id', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                placeholder="unique_quest_id"
              />
            </div>
          </div>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Quest Name *</label>
              <input
                style={styles.input}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Quest Name"
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
            placeholder="Describe the quest objectives and story..."
          />
        </div>

        <div style={styles.row}>
          <div style={styles.thirdWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Quest Type</label>
              <input
                style={styles.input}
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                placeholder="e.g., main, side, daily"
              />
              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {SUGGESTED_QUEST_TYPES.filter(t => t !== formData.type).map(type => (
                  <button
                    key={type}
                    type="button"
                    style={{ ...styles.smallButton, backgroundColor: '#3a3a5a', color: '#a0a0c0' }}
                    onClick={() => handleChange('type', type)}
                  >
                    + {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={styles.thirdWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Required Level</label>
              <input
                style={styles.input}
                type="number"
                value={formData.level}
                onChange={(e) => handleChange('level', parseInt(e.target.value) || 1)}
                min="1"
              />
            </div>
          </div>
          <div style={styles.thirdWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Time Limit (turns, 0=none)</label>
              <input
                style={styles.input}
                type="number"
                value={formData.timeLimit}
                onChange={(e) => handleChange('timeLimit', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Quest Givers */}
        <div style={styles.row}>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Quest Giver NPC</label>
              <select
                style={styles.select}
                value={formData.npcGiver}
                onChange={(e) => handleChange('npcGiver', e.target.value)}
              >
                <option value="">Select NPC...</option>
                {allNPCs.map(npc => (
                  <option key={npc.id} value={npc.id}>{npc.name || npc.id}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Turn-in NPC (if different)</label>
              <select
                style={styles.select}
                value={formData.npcTurnIn}
                onChange={(e) => handleChange('npcTurnIn', e.target.value)}
              >
                <option value="">Same as giver</option>
                {allNPCs.map(npc => (
                  <option key={npc.id} value={npc.id}>{npc.name || npc.id}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Flags */}
        <div style={styles.row}>
          <div style={styles.thirdWidth}>
            <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={formData.isRepeatable}
                onChange={(e) => handleChange('isRepeatable', e.target.checked)}
              />
              Repeatable
            </label>
          </div>
          <div style={styles.thirdWidth}>
            <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={formData.isHidden}
                onChange={(e) => handleChange('isHidden', e.target.checked)}
              />
              Hidden Quest
            </label>
          </div>
          <div style={styles.thirdWidth}>
            <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={formData.autoStart}
                onChange={(e) => handleChange('autoStart', e.target.checked)}
              />
              Auto-start
            </label>
          </div>
        </div>

        {formData.isRepeatable && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Cooldown (hours, 0=none)</label>
            <input
              style={styles.input}
              type="number"
              value={formData.cooldownHours}
              onChange={(e) => handleChange('cooldownHours', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
        )}

        {/* Objectives */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Quest Objectives</div>

          {formData.objectives.map((obj, index) => (
            <div key={obj.id || index} style={styles.objectiveCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#ffd700', fontSize: '13px', fontWeight: 'bold' }}>
                    {index + 1}. {obj.description || OBJECTIVE_TYPES.find(t => t.value === obj.type)?.label}
                    {obj.optional && <span style={{ color: '#808090', fontWeight: 'normal' }}> (Optional)</span>}
                  </div>
                  <div style={{ color: '#a0a0c0', fontSize: '12px', marginTop: '4px' }}>
                    Target: {obj.target} | Count: {obj.count}
                  </div>
                </div>
                <button
                  style={{ ...styles.smallButton, backgroundColor: '#7c4a4a', color: 'white' }}
                  onClick={() => handleRemoveObjective(index)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {/* Add New Objective */}
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#252540', borderRadius: '6px' }}>
            <div style={styles.row}>
              <div style={styles.halfWidth}>
                <label style={styles.label}>Objective Type</label>
                <select
                  style={styles.select}
                  value={newObjective.type}
                  onChange={(e) => setNewObjective(prev => ({ ...prev, type: e.target.value, target: '' }))}
                >
                  {OBJECTIVE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div style={styles.halfWidth}>
                <label style={styles.label}>Target</label>
                {renderObjectiveTarget()}
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.halfWidth}>
                <label style={styles.label}>Description</label>
                <input
                  style={styles.input}
                  value={newObjective.description}
                  onChange={(e) => setNewObjective(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Kill 5 wolves in the forest"
                />
              </div>
              <div style={{ width: '100px' }}>
                <label style={styles.label}>Count</label>
                <input
                  style={styles.input}
                  type="number"
                  value={newObjective.count}
                  onChange={(e) => setNewObjective(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    checked={newObjective.optional}
                    onChange={(e) => setNewObjective(prev => ({ ...prev, optional: e.target.checked }))}
                  />
                  Optional
                </label>
                <button
                  style={{ ...styles.button, ...styles.primaryButton, padding: '8px 16px' }}
                  onClick={handleAddObjective}
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Quest Rewards</div>

          {formData.rewards.map((reward, index) => (
            <div key={index} style={styles.rewardCard}>
              <span style={{ color: '#4aca4a' }}>
                {reward.type === 'gold' && `${reward.value} Gold`}
                {reward.type === 'experience' && `${reward.value} XP`}
                {reward.type === 'item' && `${reward.count}x ${allItems.find(i => i.id === reward.itemId)?.name || reward.itemId}`}
                {reward.type === 'reputation' && `${reward.value > 0 ? '+' : ''}${reward.value} Reputation`}
                {reward.type === 'skill_point' && `${reward.value} Skill Point(s)`}
                {!['gold', 'experience', 'item', 'reputation', 'skill_point'].includes(reward.type) &&
                  `${REWARD_TYPES.find(t => t.value === reward.type)?.label}: ${reward.value || reward.itemId}`}
              </span>
              <button
                style={{ ...styles.smallButton, backgroundColor: '#7c4a4a', color: 'white' }}
                onClick={() => handleRemoveReward(index)}
              >
                ×
              </button>
            </div>
          ))}

          {/* Add New Reward */}
          <div style={{ marginTop: '10px' }}>
            <div style={styles.row}>
              <div style={styles.thirdWidth}>
                <label style={styles.label}>Reward Type</label>
                <select
                  style={styles.select}
                  value={newReward.type}
                  onChange={(e) => setNewReward(prev => ({ ...prev, type: e.target.value, value: 100, itemId: '' }))}
                >
                  {REWARD_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div style={styles.thirdWidth}>
                {newReward.type === 'item' ? (
                  <>
                    <label style={styles.label}>Item</label>
                    <select
                      style={styles.select}
                      value={newReward.itemId}
                      onChange={(e) => setNewReward(prev => ({ ...prev, itemId: e.target.value }))}
                    >
                      <option value="">Select item...</option>
                      {allItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name || item.id}</option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <label style={styles.label}>Value</label>
                    <input
                      style={styles.input}
                      type="number"
                      value={newReward.value}
                      onChange={(e) => setNewReward(prev => ({ ...prev, value: parseInt(e.target.value) || 0 }))}
                    />
                  </>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                {newReward.type === 'item' && (
                  <div style={{ width: '80px', marginRight: '10px' }}>
                    <label style={styles.label}>Count</label>
                    <input
                      style={styles.input}
                      type="number"
                      value={newReward.count}
                      onChange={(e) => setNewReward(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                      min="1"
                    />
                  </div>
                )}
                <button
                  style={{ ...styles.button, ...styles.primaryButton, padding: '8px 16px' }}
                  onClick={handleAddReward}
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dialogue */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Quest Dialogue</div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Start Dialogue</label>
            <textarea
              style={{ ...styles.textarea, minHeight: '60px' }}
              value={formData.dialogue.start}
              onChange={(e) => handleNestedChange('dialogue', 'start', e.target.value)}
              placeholder="What the NPC says when giving the quest..."
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Progress Dialogue</label>
            <textarea
              style={{ ...styles.textarea, minHeight: '60px' }}
              value={formData.dialogue.progress}
              onChange={(e) => handleNestedChange('dialogue', 'progress', e.target.value)}
              placeholder="What the NPC says while quest is in progress..."
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Completion Dialogue</label>
            <textarea
              style={{ ...styles.textarea, minHeight: '60px' }}
              value={formData.dialogue.complete}
              onChange={(e) => handleNestedChange('dialogue', 'complete', e.target.value)}
              placeholder="What the NPC says when quest is complete..."
            />
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
            {editingItem ? 'Update Quest' : 'Create Quest'}
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
        <h3 style={styles.sectionTitle}>Created Quests ({items.length})</h3>

        {items.length === 0 ? (
          <div style={styles.emptyList}>
            No quests created yet.<br />
            Use the form to create your first quest.
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
              <div style={styles.listItemName}>{item.name}</div>
              <div style={styles.listItemDetails}>
                {item.type} | Level {item.level}
              </div>
              <div style={styles.listItemDetails}>
                {item.objectives?.length || 0} objectives | {item.rewards?.length || 0} rewards
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

export default QuestCreator;
