import React, { useState, useEffect, useMemo } from 'react';
import { collectTags } from '../DatapackLoader';
import { FormInput, FormSelect, TagInput, Button, FormTabs, FormTabPanel } from '../../ui/shared';
import { CreatorItemsList, IdNameFields, DescriptionField } from '../shared';
import { useFormDraft } from '../../../hooks/useFormDraft';
import './CreatorStyles.css';

const DRAFT_KEY = 'contentGenerator_draft_dialogues';

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

const SPEAKER_OPTIONS = [
  { value: 'npc', label: 'NPC' },
  { value: 'player', label: 'Player' },
  { value: 'narrator', label: 'Narrator' },
];

const TAG_CATEGORIES = {
  type: ['greeting', 'quest', 'shop', 'combat', 'romance', 'nsfw'],
  tone: ['friendly', 'hostile', 'neutral', 'mysterious', 'urgent'],
  topic: ['lore', 'merchant', 'trainer', 'guard', 'villager'],
};

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
  const [expandedNodes, setExpandedNodes] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

  const { clearDraft } = useFormDraft(DRAFT_KEY, formData, setFormData, editingItem, {
    defaultValues: DEFAULT_DIALOGUE,
  });

  // Combine datapack content with user-created content
  const allNPCs = [...(datapackContent.npcs || []), ...(allContent?.npcs || [])];
  const allItems = [...(datapackContent.items || []), ...(allContent?.items || [])];
  const allLocations = [...(datapackContent.locations || []), ...(allContent?.locations || [])]
    .filter(loc => {
      const hasLocationFields = loc.locationType || loc.parentRegion || loc.connectedLocations || loc.navigation;
      const hasEnemyFields = loc.tier !== undefined || loc.maxHp !== undefined || loc.nsfwActions !== undefined || loc.loot !== undefined;
      return hasLocationFields || !hasEnemyFields;
    });
  const allQuests = allContent?.quests || [];

  const suggestedTags = useMemo(() => {
    return collectTags({
      datapackContent,
      userContent: items,
      commonTags: Object.values(TAG_CATEGORIES).flat(),
      contentType: 'dialogues',
    });
  }, [datapackContent, items]);

  // Build NPC options for dropdown
  const npcOptions = useMemo(() => {
    return allNPCs.map(npc => ({
      value: npc.id,
      label: npc.name || npc.id,
    }));
  }, [allNPCs]);

  // Define tabs with badges
  const tabs = useMemo(() => {
    const hasConditions = formData.triggerConditions?.length > 0;
    const totalResponses = formData.nodes.reduce((sum, node) => sum + (node.responses?.length || 0), 0);
    const totalActions = formData.nodes.reduce((sum, node) => sum + (node.actions?.length || 0), 0);

    return [
      { id: 'basic', label: 'Basic' },
      { id: 'conditions', label: 'Conditions', badge: hasConditions ? formData.triggerConditions.length : null },
      { id: 'responses', label: 'Responses', badge: formData.nodes.length > 0 ? formData.nodes.length : null },
      { id: 'actions', label: 'Actions', badge: totalActions > 0 ? totalActions : null },
    ];
  }, [formData.triggerConditions, formData.nodes]);

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

  // Get node options for "next node" dropdowns
  const getNodeOptions = (excludeIndex = -1) => {
    return formData.nodes
      .filter((_, i) => i !== excludeIndex)
      .map(node => ({ value: node.id, label: node.id }));
  };

  const handleSubmit = () => {
    if (!formData.id || !formData.name) {
      alert('Dialogue ID and Name are required');
      return;
    }

    if (!editingItem && items.some(item => item.id === formData.id)) {
      alert('A dialogue with this ID already exists');
      return;
    }

    if (editingItem) {
      onUpdate(editingItem._id, formData);
    } else {
      onAdd(formData);
      clearDraft();
    }

    setFormData({ ...DEFAULT_DIALOGUE });
    setExpandedNodes({});
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_DIALOGUE });
    setExpandedNodes({});
    if (onCancelEdit) onCancelEdit();
  };

  return (
    <div className="creator-container">
      {/* Form Section */}
      <div className="creator-form">
        <h3 className="creator-form-section-title">
          {editingItem ? 'Edit Dialogue' : 'Create New Dialogue'}
        </h3>

        <FormTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Basic Tab */}
        <FormTabPanel id="basic" activeTab={activeTab}>
          <div className="creator-form-section">
            <IdNameFields
              idValue={formData.id}
              nameValue={formData.name}
              onIdChange={(v) => handleChange('id', v)}
              onNameChange={(v) => handleChange('name', v)}
              idPlaceholder="innkeeper_greeting"
              namePlaceholder="Innkeeper Greeting"
            />

            <div className="creator-form-row">
              <FormSelect
                label="Associated NPC"
                value={formData.npcId}
                onChange={(v) => handleChange('npcId', v)}
                options={npcOptions}
                placeholder="Select NPC..."
              />
              <FormInput
                label="Priority"
                type="number"
                value={formData.priority}
                onChange={(v) => handleChange('priority', v)}
                helper="Higher = shown first"
              />
            </div>

            <DescriptionField
              value={formData.description}
              onChange={(v) => handleChange('description', v)}
              placeholder="Brief description of this dialogue tree..."
              rows={2}
            />

            <div className="checkbox-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isRepeatable}
                  onChange={(e) => handleChange('isRepeatable', e.target.checked)}
                />
                <span className="checkbox-text">Can be repeated (player can trigger this dialogue again)</span>
              </label>
            </div>

            {/* Tags */}
            <h4 style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-lg)', marginBottom: 'var(--space-sm)' }}>
              Tags
            </h4>
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

        {/* Conditions Tab */}
        <FormTabPanel id="conditions" activeTab={activeTab}>
          <div className="creator-form-section">
            <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
              Display Conditions
            </h4>
            <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-md)' }}>
              Configure conditions that must be met for this dialogue to be available to the player.
            </p>

            <div style={{ marginBottom: 'var(--space-md)' }}>
              <Button variant="success" size="sm" onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  triggerConditions: [...prev.triggerConditions, { type: 'none', value: '' }],
                }));
              }}>
                + Add Condition
              </Button>
            </div>

            {formData.triggerConditions.length === 0 ? (
              <div className="empty-list">
                No display conditions set.
                <br />
                This dialogue will always be available.
              </div>
            ) : (
              formData.triggerConditions.map((condition, index) => (
                <div key={index} className="array-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                    <span className="text-secondary text-sm">Condition {index + 1}</span>
                    <Button variant="danger" size="sm" onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        triggerConditions: prev.triggerConditions.filter((_, i) => i !== index),
                      }));
                    }}>
                      x
                    </Button>
                  </div>
                  <div className="creator-form-row">
                    <FormSelect
                      label="Type"
                      value={condition.type}
                      onChange={(v) => {
                        setFormData(prev => ({
                          ...prev,
                          triggerConditions: prev.triggerConditions.map((c, i) =>
                            i === index ? { ...c, type: v } : c
                          ),
                        }));
                      }}
                      options={CONDITION_TYPES}
                    />
                    <FormInput
                      label="Value"
                      value={condition.value || ''}
                      onChange={(v) => {
                        setFormData(prev => ({
                          ...prev,
                          triggerConditions: prev.triggerConditions.map((c, i) =>
                            i === index ? { ...c, value: v } : c
                          ),
                        }));
                      }}
                      placeholder="Condition value..."
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </FormTabPanel>

        {/* Responses Tab (Dialogue Nodes) */}
        <FormTabPanel id="responses" activeTab={activeTab}>
          <div className="creator-form-section">
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <Button variant="success" size="sm" onClick={handleAddNode}>
                + Add Node
              </Button>
            </div>

            {formData.nodes.length === 0 ? (
              <div className="empty-list">
                No dialogue nodes yet.
                <br />
                Click "Add Node" to create your first dialogue node.
              </div>
            ) : (
              formData.nodes.map((node, nodeIndex) => (
                <div key={node.id || nodeIndex} className="collapsible">
                  <div
                    className="collapsible-header"
                    onClick={() => toggleNodeExpanded(nodeIndex)}
                  >
                    <div className="collapsible-title">
                      <span style={{ marginRight: 'var(--space-sm)' }}>
                        {expandedNodes[nodeIndex] ? '▼' : '▶'}
                      </span>
                      Node {nodeIndex + 1}: {node.id || '(no id)'}
                      <span className="text-muted text-sm" style={{ marginLeft: 'var(--space-sm)' }}>
                        ({node.speaker === 'npc' ? 'NPC' : node.speaker === 'player' ? 'Player' : 'Narrator'})
                        {node.isEndNode && ' [END]'}
                      </span>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleRemoveNode(nodeIndex); }}
                    >
                      Delete
                    </Button>
                  </div>

                  {expandedNodes[nodeIndex] && (
                    <div className="collapsible-content">
                      <div className="creator-form-row cols-4">
                        <FormInput
                          label="Node ID"
                          value={node.id}
                          onChange={(v) => handleUpdateNode(nodeIndex, 'id', v)}
                          placeholder="node_1"
                        />
                        <FormSelect
                          label="Speaker"
                          value={node.speaker}
                          onChange={(v) => handleUpdateNode(nodeIndex, 'speaker', v)}
                          options={SPEAKER_OPTIONS}
                        />
                        <FormSelect
                          label="Next Node"
                          value={node.nextNode}
                          onChange={(v) => handleUpdateNode(nodeIndex, 'nextNode', v)}
                          options={getNodeOptions(nodeIndex)}
                          placeholder="None (End or use responses)"
                          helper="If no responses"
                        />
                        <div className="checkbox-row" style={{ marginTop: 'var(--space-lg)' }}>
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={node.isEndNode}
                              onChange={(e) => handleUpdateNode(nodeIndex, 'isEndNode', e.target.checked)}
                            />
                            <span className="checkbox-text">End Node</span>
                          </label>
                        </div>
                      </div>

                      <FormInput
                        label="Dialogue Text"
                        type="textarea"
                        value={node.text}
                        onChange={(v) => handleUpdateNode(nodeIndex, 'text', v)}
                        placeholder="What the speaker says..."
                        rows={3}
                      />

                      {/* Player Responses */}
                      <div className="subsection">
                        <div className="subsection-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Player Responses ({node.responses.length})</span>
                          <Button variant="success" size="sm" onClick={() => handleAddResponse(nodeIndex)}>
                            + Response
                          </Button>
                        </div>

                        {node.responses.map((response, respIndex) => (
                          <div key={respIndex} className="array-item" style={{ flexDirection: 'column', alignItems: 'stretch', borderLeft: '3px solid var(--color-accent-success)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                              <span className="text-secondary text-sm">Response {respIndex + 1}</span>
                              <Button variant="danger" size="sm" onClick={() => handleRemoveResponse(nodeIndex, respIndex)}>
                                x
                              </Button>
                            </div>
                            <FormInput
                              value={response.text}
                              onChange={(v) => handleUpdateResponse(nodeIndex, respIndex, 'text', v)}
                              placeholder="Player's response text..."
                            />
                            <div className="creator-form-row">
                              <FormSelect
                                label="Goes to Node"
                                value={response.nextNode}
                                onChange={(v) => handleUpdateResponse(nodeIndex, respIndex, 'nextNode', v)}
                                options={[{ value: '', label: 'End Dialogue' }, ...formData.nodes.map(n => ({ value: n.id, label: n.id }))]}
                              />
                              <FormSelect
                                label="Condition"
                                value={response.condition?.type || 'none'}
                                onChange={(v) => handleUpdateResponse(nodeIndex, respIndex, 'condition', { type: v })}
                                options={CONDITION_TYPES}
                              />
                            </div>
                          </div>
                        ))}

                        {node.responses.length === 0 && (
                          <div className="text-muted text-sm" style={{ fontStyle: 'italic' }}>
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
        </FormTabPanel>

        {/* Actions Tab */}
        <FormTabPanel id="actions" activeTab={activeTab}>
          <div className="creator-form-section">
            <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
              Node Actions
            </h4>
            <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-md)' }}>
              Actions are triggered when a dialogue node is displayed. Select a node to configure its actions.
            </p>

            {formData.nodes.length === 0 ? (
              <div className="empty-list">
                No dialogue nodes yet.
                <br />
                Create nodes in the Responses tab first.
              </div>
            ) : (
              formData.nodes.map((node, nodeIndex) => (
                <div key={node.id || nodeIndex} className="collapsible">
                  <div
                    className="collapsible-header"
                    onClick={() => toggleNodeExpanded(nodeIndex)}
                  >
                    <div className="collapsible-title">
                      <span style={{ marginRight: 'var(--space-sm)' }}>
                        {expandedNodes[nodeIndex] ? '▼' : '▶'}
                      </span>
                      {node.id || `Node ${nodeIndex + 1}`}
                      <span className="text-muted text-sm" style={{ marginLeft: 'var(--space-sm)' }}>
                        ({node.actions?.length || 0} actions)
                      </span>
                    </div>
                  </div>

                  {expandedNodes[nodeIndex] && (
                    <div className="collapsible-content">
                      <div style={{ marginBottom: 'var(--space-md)' }}>
                        <Button variant="success" size="sm" onClick={() => {
                          handleUpdateNode(nodeIndex, 'actions', [...(node.actions || []), { type: 'none', value: '' }]);
                        }}>
                          + Add Action
                        </Button>
                      </div>

                      {(!node.actions || node.actions.length === 0) ? (
                        <div className="text-muted text-sm" style={{ fontStyle: 'italic' }}>
                          No actions for this node.
                        </div>
                      ) : (
                        node.actions.map((action, actionIndex) => (
                          <div key={actionIndex} className="array-item" style={{ flexDirection: 'column', alignItems: 'stretch', borderLeft: '3px solid var(--color-accent-info)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                              <span className="text-secondary text-sm">Action {actionIndex + 1}</span>
                              <Button variant="danger" size="sm" onClick={() => {
                                handleUpdateNode(nodeIndex, 'actions', node.actions.filter((_, i) => i !== actionIndex));
                              }}>
                                x
                              </Button>
                            </div>
                            <div className="creator-form-row">
                              <FormSelect
                                label="Action Type"
                                value={action.type}
                                onChange={(v) => {
                                  const newActions = [...node.actions];
                                  newActions[actionIndex] = { ...action, type: v };
                                  handleUpdateNode(nodeIndex, 'actions', newActions);
                                }}
                                options={ACTION_TYPES}
                              />
                              <FormInput
                                label="Value"
                                value={action.value || ''}
                                onChange={(v) => {
                                  const newActions = [...node.actions];
                                  newActions[actionIndex] = { ...action, value: v };
                                  handleUpdateNode(nodeIndex, 'actions', newActions);
                                }}
                                placeholder="Action value..."
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </FormTabPanel>

        {/* Action Buttons */}
        <div className="creator-actions">
          <Button variant="success" onClick={handleSubmit}>
            {editingItem ? 'Update Dialogue' : 'Add Dialogue'}
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
        title="Created Dialogues"
        itemType="dialogue tree"
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        editingItem={editingItem}
        renderItemContent={(item) => (
          <>
            <div className="creator-item-name">
              {item.name}
            </div>
            <div className="creator-item-id">
              ID: {item.id} | {item.nodes?.length || 0} nodes | NPC: {allNPCs.find(n => n.id === item.npcId)?.name || item.npcId || 'None'}
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

export default DialogueCreator;
