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
  nodeCard: {
    backgroundColor: '#1e1e35',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '10px',
    border: '1px solid #3a3a5a',
  },
  nodeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  nodeType: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  nodeIndex: {
    color: '#808090',
    fontSize: '12px',
  },
  choiceItem: {
    backgroundColor: '#252540',
    borderRadius: '6px',
    padding: '10px',
    marginTop: '8px',
    border: '1px solid #3a3a5a',
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
  addNodeBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '15px',
    flexWrap: 'wrap',
  },
};

const NODE_TYPES = [
  { value: 'dialogue', label: 'Dialogue', color: '#4a7c4a', icon: '💬' },
  { value: 'choice', label: 'Choice', color: '#7c7c4a', icon: '❓' },
  { value: 'action', label: 'Action', color: '#7c4a7c', icon: '⚡' },
  { value: 'branch', label: 'Branch', color: '#4a7c7c', icon: '🔀' },
  { value: 'statCheck', label: 'Stat Check', color: '#7c4a4a', icon: '🎲' },
  { value: 'end', label: 'End', color: '#4a4a7c', icon: '🏁' },
];

const COMMON_TAGS = [
  'story', 'vanilla', 'nsfw', 'intro', 'combat', 'quest',
  'romance', 'dialogue', 'exploration', 'ending',
  'demon', 'wolf', 'tentacle', 'corruption', 'transformation',
];

const ACTION_TYPES = [
  { value: 'giveItem', label: 'Give Item' },
  { value: 'removeItem', label: 'Remove Item' },
  { value: 'giveGold', label: 'Give Gold' },
  { value: 'removeGold', label: 'Remove Gold' },
  { value: 'modifyStat', label: 'Modify Stat' },
  { value: 'heal', label: 'Heal' },
  { value: 'damage', label: 'Deal Damage' },
  { value: 'modifyCorruption', label: 'Modify Corruption' },
  { value: 'modifyArousal', label: 'Modify Arousal' },
  { value: 'setFlag', label: 'Set Flag' },
  { value: 'startQuest', label: 'Start Quest' },
  { value: 'completeQuest', label: 'Complete Quest' },
  { value: 'applyEffect', label: 'Apply Effect' },
  { value: 'removeEffect', label: 'Remove Effect' },
  { value: 'unlockLocation', label: 'Unlock Location' },
  { value: 'teleport', label: 'Teleport' },
  { value: 'showToast', label: 'Show Toast' },
  { value: 'playSound', label: 'Play Sound' },
  { value: 'playMusic', label: 'Play Music' },
  { value: 'modifyRelationship', label: 'Modify Relationship' },
];

const STATS_LIST = [
  'strength', 'vitality', 'intelligence', 'willpower',
  'speed', 'evasion', 'charm', 'luck',
];

const DEFAULT_SCENE = {
  id: '',
  name: '',
  description: '',
  tags: [],
  location: '',
  onEnter: [],
  nodes: [],
  onExit: [],
};

const DEFAULT_DIALOGUE_NODE = {
  type: 'dialogue',
  speaker: '',
  speakerImage: '',
  text: '',
  emotion: '',
  label: '',
};

const DEFAULT_CHOICE_NODE = {
  type: 'choice',
  prompt: '',
  choices: [],
};

const DEFAULT_CHOICE = {
  id: '',
  text: '',
  goto: null,
  gotoLabel: '',
  nextScene: '',
  actions: [],
  showIf: null,
  requiresTags: [],
};

const DEFAULT_ACTION_NODE = {
  type: 'action',
  actions: [],
};

const DEFAULT_BRANCH_NODE = {
  type: 'branch',
  branches: [],
  default: { gotoLabel: '' },
};

const DEFAULT_STAT_CHECK_NODE = {
  type: 'statCheck',
  stat: 'willpower',
  difficulty: 5,
  onSuccess: { gotoLabel: '' },
  onFailure: { gotoLabel: '' },
};

const DEFAULT_END_NODE = {
  type: 'end',
  outcome: '',
};

const SceneCreator = ({
  items = [],
  allContent,
  onAdd,
  onUpdate,
  onDelete,
  onDuplicate,
  onEdit,
  editingItem,
  onCancelEdit,
}) => {
  const [formData, setFormData] = useState({ ...DEFAULT_SCENE });
  const [tagInput, setTagInput] = useState('');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState({});

  // Load editing item when it changes
  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...DEFAULT_SCENE,
        ...editingItem,
        nodes: editingItem.nodes || [],
      });
    } else {
      setFormData({ ...DEFAULT_SCENE });
    }
  }, [editingItem]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  // Node management
  const addNode = (type) => {
    let newNode;
    switch (type) {
      case 'dialogue':
        newNode = { ...DEFAULT_DIALOGUE_NODE };
        break;
      case 'choice':
        newNode = { ...DEFAULT_CHOICE_NODE, choices: [] };
        break;
      case 'action':
        newNode = { ...DEFAULT_ACTION_NODE, actions: [] };
        break;
      case 'branch':
        newNode = { ...DEFAULT_BRANCH_NODE, branches: [] };
        break;
      case 'statCheck':
        newNode = { ...DEFAULT_STAT_CHECK_NODE };
        break;
      case 'end':
        newNode = { ...DEFAULT_END_NODE };
        break;
      default:
        return;
    }
    setFormData(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
    // Auto-expand new node
    setExpandedNodes(prev => ({ ...prev, [formData.nodes.length]: true }));
  };

  const updateNode = (index, updates) => {
    setFormData(prev => ({
      ...prev,
      nodes: prev.nodes.map((node, i) =>
        i === index ? { ...node, ...updates } : node
      ),
    }));
  };

  const removeNode = (index) => {
    setFormData(prev => ({
      ...prev,
      nodes: prev.nodes.filter((_, i) => i !== index),
    }));
  };

  const moveNode = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= formData.nodes.length) return;

    setFormData(prev => {
      const newNodes = [...prev.nodes];
      [newNodes[index], newNodes[newIndex]] = [newNodes[newIndex], newNodes[index]];
      return { ...prev, nodes: newNodes };
    });
  };

  const toggleNodeExpanded = (index) => {
    setExpandedNodes(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Choice management within choice nodes
  const addChoice = (nodeIndex) => {
    const node = formData.nodes[nodeIndex];
    const newChoice = {
      ...DEFAULT_CHOICE,
      id: `choice_${Date.now()}`,
    };
    updateNode(nodeIndex, {
      choices: [...(node.choices || []), newChoice],
    });
  };

  const updateChoice = (nodeIndex, choiceIndex, updates) => {
    const node = formData.nodes[nodeIndex];
    updateNode(nodeIndex, {
      choices: node.choices.map((choice, i) =>
        i === choiceIndex ? { ...choice, ...updates } : choice
      ),
    });
  };

  const removeChoice = (nodeIndex, choiceIndex) => {
    const node = formData.nodes[nodeIndex];
    updateNode(nodeIndex, {
      choices: node.choices.filter((_, i) => i !== choiceIndex),
    });
  };

  // Action management within action nodes
  const addAction = (nodeIndex) => {
    const node = formData.nodes[nodeIndex];
    const newAction = { type: 'showToast', toastType: 'info', title: '', message: '' };
    updateNode(nodeIndex, {
      actions: [...(node.actions || []), newAction],
    });
  };

  const updateAction = (nodeIndex, actionIndex, updates) => {
    const node = formData.nodes[nodeIndex];
    updateNode(nodeIndex, {
      actions: node.actions.map((action, i) =>
        i === actionIndex ? { ...action, ...updates } : action
      ),
    });
  };

  const removeAction = (nodeIndex, actionIndex) => {
    const node = formData.nodes[nodeIndex];
    updateNode(nodeIndex, {
      actions: node.actions.filter((_, i) => i !== actionIndex),
    });
  };

  const handleSubmit = () => {
    if (!formData.id || !formData.name) {
      alert('ID and Name are required');
      return;
    }

    // Check for duplicate ID if not editing
    if (!editingItem && items.some(item => item.id === formData.id)) {
      alert('A scene with this ID already exists');
      return;
    }

    if (editingItem) {
      onUpdate(editingItem._id, formData);
    } else {
      onAdd(formData);
    }

    setFormData({ ...DEFAULT_SCENE });
    setExpandedNodes({});
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_SCENE });
    setExpandedNodes({});
    onCancelEdit();
  };

  // Render a single node
  const renderNode = (node, index) => {
    const nodeType = NODE_TYPES.find(t => t.value === node.type);
    const isExpanded = expandedNodes[index];

    return (
      <div key={index} style={styles.nodeCard}>
        <div style={styles.nodeHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={styles.nodeIndex}>#{index}</span>
            <span style={{ ...styles.nodeType, backgroundColor: nodeType?.color || '#4a4a6a' }}>
              {nodeType?.icon} {nodeType?.label || node.type}
            </span>
            {node.label && (
              <span style={{ color: '#ffd700', fontSize: '12px' }}>
                📍 {node.label}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              style={{ ...styles.smallButton, backgroundColor: '#3a3a5a', color: 'white' }}
              onClick={() => moveNode(index, -1)}
              disabled={index === 0}
            >
              ↑
            </button>
            <button
              style={{ ...styles.smallButton, backgroundColor: '#3a3a5a', color: 'white' }}
              onClick={() => moveNode(index, 1)}
              disabled={index === formData.nodes.length - 1}
            >
              ↓
            </button>
            <button
              style={{ ...styles.smallButton, backgroundColor: '#3a3a5a', color: 'white' }}
              onClick={() => toggleNodeExpanded(index)}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
            <button
              style={{ ...styles.smallButton, backgroundColor: '#7c4a4a', color: 'white' }}
              onClick={() => removeNode(index)}
            >
              ×
            </button>
          </div>
        </div>

        {isExpanded && renderNodeContent(node, index)}
      </div>
    );
  };

  // Render node-specific content
  const renderNodeContent = (node, index) => {
    switch (node.type) {
      case 'dialogue':
        return (
          <div>
            <div style={styles.row}>
              <div style={styles.halfWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Label (for jumps)</label>
                  <input
                    style={styles.input}
                    value={node.label || ''}
                    onChange={(e) => updateNode(index, { label: e.target.value })}
                    placeholder="optional_label"
                  />
                </div>
              </div>
              <div style={styles.halfWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Speaker</label>
                  <input
                    style={styles.input}
                    value={node.speaker || ''}
                    onChange={(e) => updateNode(index, { speaker: e.target.value })}
                    placeholder="Character Name"
                  />
                </div>
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Dialogue Text *</label>
              <textarea
                style={styles.textarea}
                value={node.text || ''}
                onChange={(e) => updateNode(index, { text: e.target.value })}
                placeholder="What the character says..."
              />
            </div>
            <div style={styles.row}>
              <div style={styles.halfWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Speaker Image</label>
                  <input
                    style={styles.input}
                    value={node.speakerImage || ''}
                    onChange={(e) => updateNode(index, { speakerImage: e.target.value })}
                    placeholder="/npcs/character.png"
                  />
                </div>
              </div>
              <div style={styles.halfWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Emotion</label>
                  <select
                    style={styles.select}
                    value={node.emotion || ''}
                    onChange={(e) => updateNode(index, { emotion: e.target.value })}
                  >
                    <option value="">Default</option>
                    <option value="friendly">Friendly</option>
                    <option value="angry">Angry</option>
                    <option value="sad">Sad</option>
                    <option value="surprised">Surprised</option>
                    <option value="seductive">Seductive</option>
                    <option value="scared">Scared</option>
                    <option value="amused">Amused</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'choice':
        return (
          <div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Prompt (optional)</label>
              <input
                style={styles.input}
                value={node.prompt || ''}
                onChange={(e) => updateNode(index, { prompt: e.target.value })}
                placeholder="What do you do?"
              />
            </div>

            <div style={styles.subsectionTitle}>Choices</div>
            {(node.choices || []).map((choice, choiceIndex) => (
              <div key={choiceIndex} style={styles.choiceItem}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#a0a0c0', fontSize: '12px' }}>Choice #{choiceIndex + 1}</span>
                  <button
                    style={{ ...styles.smallButton, backgroundColor: '#7c4a4a', color: 'white' }}
                    onClick={() => removeChoice(index, choiceIndex)}
                  >
                    Remove
                  </button>
                </div>
                <div style={styles.row}>
                  <div style={styles.halfWidth}>
                    <input
                      style={styles.input}
                      value={choice.id || ''}
                      onChange={(e) => updateChoice(index, choiceIndex, { id: e.target.value })}
                      placeholder="choice_id"
                    />
                  </div>
                  <div style={styles.halfWidth}>
                    <input
                      style={styles.input}
                      value={choice.text || ''}
                      onChange={(e) => updateChoice(index, choiceIndex, { text: e.target.value })}
                      placeholder="Choice text"
                    />
                  </div>
                </div>
                <div style={{ ...styles.row, marginTop: '8px' }}>
                  <div style={styles.halfWidth}>
                    <label style={styles.label}>Go to Label</label>
                    <input
                      style={styles.input}
                      value={choice.gotoLabel || ''}
                      onChange={(e) => updateChoice(index, choiceIndex, { gotoLabel: e.target.value })}
                      placeholder="label_name"
                    />
                  </div>
                  <div style={styles.halfWidth}>
                    <label style={styles.label}>Or Next Scene</label>
                    <select
                      style={styles.select}
                      value={choice.nextScene || ''}
                      onChange={(e) => updateChoice(index, choiceIndex, { nextScene: e.target.value })}
                    >
                      <option value="">Same scene</option>
                      {items.filter(s => s.id !== formData.id).map(scene => (
                        <option key={scene.id} value={scene.id}>{scene.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
            <button
              style={{ ...styles.smallButton, backgroundColor: '#4a7c4a', color: 'white', marginTop: '10px' }}
              onClick={() => addChoice(index)}
            >
              + Add Choice
            </button>
          </div>
        );

      case 'action':
        return (
          <div>
            <div style={styles.subsectionTitle}>Actions</div>
            {(node.actions || []).map((action, actionIndex) => (
              <div key={actionIndex} style={styles.choiceItem}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <select
                    style={{ ...styles.select, width: 'auto' }}
                    value={action.type}
                    onChange={(e) => updateAction(index, actionIndex, { type: e.target.value })}
                  >
                    {ACTION_TYPES.map(at => (
                      <option key={at.value} value={at.value}>{at.label}</option>
                    ))}
                  </select>
                  <button
                    style={{ ...styles.smallButton, backgroundColor: '#7c4a4a', color: 'white' }}
                    onClick={() => removeAction(index, actionIndex)}
                  >
                    Remove
                  </button>
                </div>
                {renderActionFields(action, index, actionIndex)}
              </div>
            ))}
            <button
              style={{ ...styles.smallButton, backgroundColor: '#4a7c4a', color: 'white', marginTop: '10px' }}
              onClick={() => addAction(index)}
            >
              + Add Action
            </button>
          </div>
        );

      case 'branch':
        return (
          <div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Default Go to Label</label>
              <input
                style={styles.input}
                value={node.default?.gotoLabel || ''}
                onChange={(e) => updateNode(index, { default: { gotoLabel: e.target.value } })}
                placeholder="default_label"
              />
            </div>
            <div style={{ color: '#808090', fontSize: '12px', marginTop: '10px' }}>
              Branch conditions can be edited in JSON export
            </div>
          </div>
        );

      case 'statCheck':
        return (
          <div>
            <div style={styles.row}>
              <div style={styles.halfWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Stat to Check</label>
                  <select
                    style={styles.select}
                    value={node.stat || 'willpower'}
                    onChange={(e) => updateNode(index, { stat: e.target.value })}
                  >
                    {STATS_LIST.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.halfWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Difficulty</label>
                  <input
                    style={styles.input}
                    type="number"
                    value={node.difficulty || 5}
                    onChange={(e) => updateNode(index, { difficulty: parseInt(e.target.value) || 5 })}
                  />
                </div>
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.halfWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>On Success → Label</label>
                  <input
                    style={styles.input}
                    value={node.onSuccess?.gotoLabel || ''}
                    onChange={(e) => updateNode(index, { onSuccess: { gotoLabel: e.target.value } })}
                    placeholder="success_label"
                  />
                </div>
              </div>
              <div style={styles.halfWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>On Failure → Label</label>
                  <input
                    style={styles.input}
                    value={node.onFailure?.gotoLabel || ''}
                    onChange={(e) => updateNode(index, { onFailure: { gotoLabel: e.target.value } })}
                    placeholder="failure_label"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'end':
        return (
          <div style={styles.formGroup}>
            <label style={styles.label}>Outcome ID</label>
            <input
              style={styles.input}
              value={node.outcome || ''}
              onChange={(e) => updateNode(index, { outcome: e.target.value })}
              placeholder="scene_outcome"
            />
          </div>
        );

      default:
        return <div style={{ color: '#808090' }}>Unknown node type</div>;
    }
  };

  // Render action-specific fields
  const renderActionFields = (action, nodeIndex, actionIndex) => {
    switch (action.type) {
      case 'giveItem':
      case 'removeItem':
        return (
          <div style={styles.row}>
            <div style={styles.halfWidth}>
              <input
                style={styles.input}
                value={action.itemId || ''}
                onChange={(e) => updateAction(nodeIndex, actionIndex, { itemId: e.target.value })}
                placeholder="item_id"
              />
            </div>
            <div style={styles.halfWidth}>
              <input
                style={styles.input}
                type="number"
                value={action.count || 1}
                onChange={(e) => updateAction(nodeIndex, actionIndex, { count: parseInt(e.target.value) || 1 })}
                placeholder="Count"
              />
            </div>
          </div>
        );

      case 'giveGold':
      case 'removeGold':
      case 'heal':
      case 'damage':
      case 'modifyCorruption':
      case 'modifyArousal':
        return (
          <input
            style={styles.input}
            type="number"
            value={action.amount || 0}
            onChange={(e) => updateAction(nodeIndex, actionIndex, { amount: parseInt(e.target.value) || 0 })}
            placeholder="Amount"
          />
        );

      case 'setFlag':
        return (
          <div style={styles.row}>
            <div style={styles.halfWidth}>
              <input
                style={styles.input}
                value={action.flag || ''}
                onChange={(e) => updateAction(nodeIndex, actionIndex, { flag: e.target.value })}
                placeholder="flag_name"
              />
            </div>
            <div style={styles.halfWidth}>
              <select
                style={styles.select}
                value={action.value === false ? 'false' : 'true'}
                onChange={(e) => updateAction(nodeIndex, actionIndex, { value: e.target.value === 'true' })}
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </div>
          </div>
        );

      case 'showToast':
        return (
          <div>
            <div style={styles.row}>
              <div style={styles.halfWidth}>
                <select
                  style={styles.select}
                  value={action.toastType || 'info'}
                  onChange={(e) => updateAction(nodeIndex, actionIndex, { toastType: e.target.value })}
                >
                  <option value="info">Info</option>
                  <option value="buff">Buff</option>
                  <option value="debuff">Debuff</option>
                  <option value="item">Item</option>
                  <option value="heal">Heal</option>
                  <option value="curse">Curse</option>
                </select>
              </div>
              <div style={styles.halfWidth}>
                <input
                  style={styles.input}
                  value={action.title || ''}
                  onChange={(e) => updateAction(nodeIndex, actionIndex, { title: e.target.value })}
                  placeholder="Title"
                />
              </div>
            </div>
            <input
              style={{ ...styles.input, marginTop: '8px' }}
              value={action.message || ''}
              onChange={(e) => updateAction(nodeIndex, actionIndex, { message: e.target.value })}
              placeholder="Message"
            />
          </div>
        );

      case 'modifyRelationship':
        return (
          <div style={styles.row}>
            <div style={styles.halfWidth}>
              <input
                style={styles.input}
                value={action.npcId || ''}
                onChange={(e) => updateAction(nodeIndex, actionIndex, { npcId: e.target.value })}
                placeholder="npc_id"
              />
            </div>
            <div style={styles.halfWidth}>
              <input
                style={styles.input}
                type="number"
                value={action.amount || 0}
                onChange={(e) => updateAction(nodeIndex, actionIndex, { amount: parseInt(e.target.value) || 0 })}
                placeholder="Amount"
              />
            </div>
          </div>
        );

      default:
        return (
          <input
            style={styles.input}
            value={action.value || action.itemId || action.effectId || action.questId || action.locationId || ''}
            onChange={(e) => {
              const key = action.type.includes('Item') ? 'itemId' :
                action.type.includes('Effect') ? 'effectId' :
                  action.type.includes('Quest') ? 'questId' :
                    action.type.includes('Location') ? 'locationId' : 'value';
              updateAction(nodeIndex, actionIndex, { [key]: e.target.value });
            }}
            placeholder="Value"
          />
        );
    }
  };

  return (
    <div style={styles.container}>
      {/* Form Section */}
      <div style={styles.formSection}>
        <h3 style={styles.sectionTitle}>
          {editingItem ? '✏️ Edit Scene' : '➕ Create New Scene'}
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
                placeholder="unique_scene_id"
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
                placeholder="Scene Name"
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
            placeholder="Scene description for reference..."
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Required Location (optional)</label>
          <input
            style={styles.input}
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="location_id"
          />
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
            {COMMON_TAGS.filter(t => !formData.tags.includes(t)).slice(0, 12).map(tag => (
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

        {/* Nodes */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Scene Nodes ({formData.nodes.length})</div>

          <div style={styles.addNodeBar}>
            {NODE_TYPES.map(type => (
              <button
                key={type.value}
                style={{
                  ...styles.smallButton,
                  backgroundColor: type.color,
                  color: 'white',
                }}
                onClick={() => addNode(type.value)}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>

          {formData.nodes.length === 0 ? (
            <div style={styles.emptyList}>
              No nodes yet. Add dialogue, choices, actions, etc.
            </div>
          ) : (
            formData.nodes.map((node, index) => renderNode(node, index))
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: '20px' }}>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleSubmit}
          >
            {editingItem ? '💾 Update Scene' : '➕ Add Scene'}
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
        <h3 style={styles.sectionTitle}>📋 Created Scenes ({items.length})</h3>

        {items.length === 0 ? (
          <div style={styles.emptyList}>
            No scenes created yet.<br />
            Use the form to create your first scene.
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
                📜 {item.name}
              </div>
              <div style={styles.listItemDetails}>
                ID: {item.id} | Nodes: {item.nodes?.length || 0}
              </div>
              <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                {(item.tags || []).slice(0, 4).map(tag => (
                  <span key={tag} style={{ ...styles.tag, fontSize: '10px', padding: '1px 5px' }}>
                    {tag}
                  </span>
                ))}
              </div>
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

export default SceneCreator;
