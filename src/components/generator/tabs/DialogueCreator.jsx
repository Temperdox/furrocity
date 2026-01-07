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
  nodeCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    marginBottom: '12px',
    border: '1px solid #3a3a5a',
    overflow: 'hidden',
  },
  nodeHeader: {
    padding: '10px 15px',
    backgroundColor: '#252540',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
  },
  nodeBody: {
    padding: '15px',
  },
  responseCard: {
    backgroundColor: '#252540',
    borderRadius: '6px',
    padding: '10px',
    marginBottom: '8px',
    marginLeft: '20px',
    borderLeft: '3px solid #4a7c4a',
  },
  conditionBadge: {
    display: 'inline-block',
    padding: '2px 6px',
    backgroundColor: '#3a5a7a',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#a0c0e0',
    marginRight: '5px',
  },
};

const CONDITION_TYPES = [
  { value: 'none', label: 'No Condition' },
  { value: 'flag', label: 'Has Flag' },
  { value: 'quest', label: 'Quest Status' },
  { value: 'item', label: 'Has Item' },
  { value: 'stat', label: 'Stat Check' },
  { value: 'level', label: 'Level Check' },
  { value: 'reputation', label: 'Reputation' },
  { value: 'random', label: 'Random Chance' },
];

const ACTION_TYPES = [
  { value: 'none', label: 'No Action' },
  { value: 'setFlag', label: 'Set Flag' },
  { value: 'giveItem', label: 'Give Item' },
  { value: 'removeItem', label: 'Remove Item' },
  { value: 'giveGold', label: 'Give Gold' },
  { value: 'startQuest', label: 'Start Quest' },
  { value: 'modifyReputation', label: 'Modify Reputation' },
  { value: 'teleport', label: 'Teleport' },
  { value: 'startCombat', label: 'Start Combat' },
  { value: 'openShop', label: 'Open Shop' },
];

const DEFAULT_DIALOGUE = {
  id: '',
  name: '',
  description: '',
  npcId: '',
  isRepeatable: true,
  priority: 0,
  triggerConditions: [],
  nodes: [],
  tags: [],
};

const DEFAULT_NODE = {
  id: '',
  speaker: 'npc',
  text: '',
  portrait: '',
  responses: [],
  actions: [],
  nextNode: '',
  isEndNode: false,
};

const DEFAULT_RESPONSE = {
  text: '',
  nextNode: '',
  condition: { type: 'none' },
  actions: [],
  isHidden: false,
};

const DialogueCreator = ({
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
  const [formData, setFormData] = useState({ ...DEFAULT_DIALOGUE });
  const [tagInput, setTagInput] = useState('');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState({});

  // Combine datapack content with user-created content
  const allNPCs = [...(datapackContent.npcs || []), ...(allContent?.npcs || [])];
  const allItems = [...(datapackContent.items || []), ...(allContent?.items || [])];
  const allLocations = [...(datapackContent.locations || []), ...(allContent?.locations || [])];
  const allQuests = allContent?.quests || [];

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...DEFAULT_DIALOGUE,
        ...editingItem,
        nodes: editingItem.nodes || [],
        triggerConditions: editingItem.triggerConditions || [],
        tags: editingItem.tags || [],
      });
      // Expand all nodes by default when editing
      const expanded = {};
      (editingItem.nodes || []).forEach((node, i) => {
        expanded[i] = true;
      });
      setExpandedNodes(expanded);
    } else {
      setFormData({ ...DEFAULT_DIALOGUE });
      setExpandedNodes({});
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

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  // Node handlers
  const handleAddNode = () => {
    const newNode = {
      ...DEFAULT_NODE,
      id: `node_${formData.nodes.length + 1}`,
    };
    setFormData(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
    setExpandedNodes(prev => ({ ...prev, [formData.nodes.length]: true }));
  };

  const handleRemoveNode = (index) => {
    setFormData(prev => ({
      ...prev,
      nodes: prev.nodes.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateNode = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      nodes: prev.nodes.map((node, i) =>
        i === index ? { ...node, [field]: value } : node
      ),
    }));
  };

  // Response handlers
  const handleAddResponse = (nodeIndex) => {
    const newResponse = { ...DEFAULT_RESPONSE };
    setFormData(prev => ({
      ...prev,
      nodes: prev.nodes.map((node, i) =>
        i === nodeIndex
          ? { ...node, responses: [...node.responses, newResponse] }
          : node
      ),
    }));
  };

  const handleRemoveResponse = (nodeIndex, responseIndex) => {
    setFormData(prev => ({
      ...prev,
      nodes: prev.nodes.map((node, i) =>
        i === nodeIndex
          ? { ...node, responses: node.responses.filter((_, ri) => ri !== responseIndex) }
          : node
      ),
    }));
  };

  const handleUpdateResponse = (nodeIndex, responseIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      nodes: prev.nodes.map((node, i) =>
        i === nodeIndex
          ? {
            ...node,
            responses: node.responses.map((resp, ri) =>
              ri === responseIndex ? { ...resp, [field]: value } : resp
            ),
          }
          : node
      ),
    }));
  };

  const toggleNodeExpanded = (index) => {
    setExpandedNodes(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleSubmit = () => {
    if (!formData.id || !formData.name) {
      alert('Dialogue ID and Name are required');
      return;
    }

    const dialogueData = { ...formData };

    if (editingItem) {
      onUpdate(editingItem._id, dialogueData);
    } else {
      onAdd(dialogueData);
    }

    setFormData({ ...DEFAULT_DIALOGUE });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_DIALOGUE });
    if (onCancelEdit) onCancelEdit();
  };

  return (
    <div style={styles.container}>
      {/* Form Section */}
      <div style={styles.formSection}>
        <h3 style={styles.sectionTitle}>
          {editingItem ? 'Edit Dialogue' : 'Create New Dialogue'}
        </h3>

        {/* Basic Info */}
        <div style={styles.row}>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Dialogue ID *</label>
              <input
                style={styles.input}
                value={formData.id}
                onChange={(e) => handleChange('id', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                placeholder="innkeeper_greeting"
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
                placeholder="Innkeeper Greeting"
              />
            </div>
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Associated NPC</label>
              <select
                style={styles.select}
                value={formData.npcId}
                onChange={(e) => handleChange('npcId', e.target.value)}
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
              <label style={styles.label}>Priority (higher = shown first)</label>
              <input
                style={styles.input}
                type="number"
                value={formData.priority}
                onChange={(e) => handleChange('priority', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Description</label>
          <textarea
            style={{ ...styles.textarea, minHeight: '60px' }}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Brief description of this dialogue tree..."
          />
        </div>

        <div style={styles.formGroup}>
          <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={formData.isRepeatable}
              onChange={(e) => handleChange('isRepeatable', e.target.checked)}
            />
            Can be repeated (player can trigger this dialogue again)
          </label>
        </div>

        {/* Dialogue Nodes */}
        <div style={styles.subsection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div style={styles.subsectionTitle}>Dialogue Nodes</div>
            <button
              style={{ ...styles.button, ...styles.primaryButton, padding: '6px 12px' }}
              onClick={handleAddNode}
            >
              + Add Node
            </button>
          </div>

          {formData.nodes.length === 0 ? (
            <div style={{ color: '#606080', textAlign: 'center', padding: '20px', fontSize: '13px' }}>
              No dialogue nodes yet. Click "Add Node" to create your first dialogue node.
            </div>
          ) : (
            formData.nodes.map((node, nodeIndex) => (
              <div key={node.id || nodeIndex} style={styles.nodeCard}>
                <div
                  style={styles.nodeHeader}
                  onClick={() => toggleNodeExpanded(nodeIndex)}
                >
                  <div>
                    <span style={{ color: '#ffd700', fontWeight: 'bold' }}>
                      {expandedNodes[nodeIndex] ? '▼' : '▶'} Node {nodeIndex + 1}: {node.id}
                    </span>
                    <span style={{ color: '#808090', marginLeft: '10px', fontSize: '12px' }}>
                      ({node.speaker === 'npc' ? 'NPC' : 'Player'})
                      {node.isEndNode && ' [END]'}
                    </span>
                  </div>
                  <button
                    style={{ ...styles.smallButton, backgroundColor: '#7c4a4a', color: 'white' }}
                    onClick={(e) => { e.stopPropagation(); handleRemoveNode(nodeIndex); }}
                  >
                    Delete
                  </button>
                </div>

                {expandedNodes[nodeIndex] && (
                  <div style={styles.nodeBody}>
                    <div style={styles.row}>
                      <div style={{ width: '150px' }}>
                        <label style={styles.label}>Node ID</label>
                        <input
                          style={styles.input}
                          value={node.id}
                          onChange={(e) => handleUpdateNode(nodeIndex, 'id', e.target.value)}
                          placeholder="node_1"
                        />
                      </div>
                      <div style={{ width: '120px' }}>
                        <label style={styles.label}>Speaker</label>
                        <select
                          style={styles.select}
                          value={node.speaker}
                          onChange={(e) => handleUpdateNode(nodeIndex, 'speaker', e.target.value)}
                        >
                          <option value="npc">NPC</option>
                          <option value="player">Player</option>
                          <option value="narrator">Narrator</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={styles.label}>Next Node (if no responses)</label>
                        <select
                          style={styles.select}
                          value={node.nextNode}
                          onChange={(e) => handleUpdateNode(nodeIndex, 'nextNode', e.target.value)}
                        >
                          <option value="">None (End or use responses)</option>
                          {formData.nodes.filter((_, i) => i !== nodeIndex).map(n => (
                            <option key={n.id} value={n.id}>{n.id}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ width: '80px' }}>
                        <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '5px', marginTop: '25px' }}>
                          <input
                            type="checkbox"
                            checked={node.isEndNode}
                            onChange={(e) => handleUpdateNode(nodeIndex, 'isEndNode', e.target.checked)}
                          />
                          End
                        </label>
                      </div>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Dialogue Text</label>
                      <textarea
                        style={styles.textarea}
                        value={node.text}
                        onChange={(e) => handleUpdateNode(nodeIndex, 'text', e.target.value)}
                        placeholder="What the speaker says..."
                      />
                    </div>

                    {/* Player Responses */}
                    <div style={{ marginTop: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <label style={{ ...styles.label, margin: 0, fontWeight: 'bold' }}>Player Responses</label>
                        <button
                          style={{ ...styles.smallButton, backgroundColor: '#4a7c4a', color: 'white' }}
                          onClick={() => handleAddResponse(nodeIndex)}
                        >
                          + Response
                        </button>
                      </div>

                      {node.responses.map((response, respIndex) => (
                        <div key={respIndex} style={styles.responseCard}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: '#4aca4a', fontSize: '12px' }}>Response {respIndex + 1}</span>
                            <button
                              style={{ ...styles.smallButton, backgroundColor: '#7c4a4a', color: 'white' }}
                              onClick={() => handleRemoveResponse(nodeIndex, respIndex)}
                            >
                              ×
                            </button>
                          </div>
                          <div style={styles.formGroup}>
                            <input
                              style={styles.input}
                              value={response.text}
                              onChange={(e) => handleUpdateResponse(nodeIndex, respIndex, 'text', e.target.value)}
                              placeholder="Player's response text..."
                            />
                          </div>
                          <div style={styles.row}>
                            <div style={styles.halfWidth}>
                              <label style={styles.label}>Goes to Node</label>
                              <select
                                style={styles.select}
                                value={response.nextNode}
                                onChange={(e) => handleUpdateResponse(nodeIndex, respIndex, 'nextNode', e.target.value)}
                              >
                                <option value="">End Dialogue</option>
                                {formData.nodes.map(n => (
                                  <option key={n.id} value={n.id}>{n.id}</option>
                                ))}
                              </select>
                            </div>
                            <div style={styles.halfWidth}>
                              <label style={styles.label}>Condition</label>
                              <select
                                style={styles.select}
                                value={response.condition?.type || 'none'}
                                onChange={(e) => handleUpdateResponse(nodeIndex, respIndex, 'condition', { type: e.target.value })}
                              >
                                {CONDITION_TYPES.map(cond => (
                                  <option key={cond.value} value={cond.value}>{cond.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}

                      {node.responses.length === 0 && (
                        <div style={{ color: '#606080', fontSize: '12px', fontStyle: 'italic', marginLeft: '20px' }}>
                          No responses. Dialogue will automatically continue to next node or end.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
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
        </div>

        {/* Actions */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleSubmit}
          >
            {editingItem ? 'Update Dialogue' : 'Create Dialogue'}
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
        <h3 style={styles.sectionTitle}>Created Dialogues ({items.length})</h3>

        {items.length === 0 ? (
          <div style={styles.emptyList}>
            No dialogues created yet.<br />
            Use the form to create your first dialogue tree.
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
                {item.nodes?.length || 0} nodes | NPC: {allNPCs.find(n => n.id === item.npcId)?.name || item.npcId || 'None'}
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

export default DialogueCreator;
