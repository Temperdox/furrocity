import React, { useState, useEffect, useMemo } from 'react';
import { collectTags } from '../DatapackLoader';
import { FormInput, FormSelect, TagInput, Button, CollapsibleSection } from '../../ui/shared';
import { useFormDraft } from '../../../hooks/useFormDraft';
import './CreatorStyles.css';

const DRAFT_KEY = 'contentGenerator_draft_scenes';

const NODE_TYPES = [
  { value: 'dialogue', label: 'Dialogue', color: 'var(--color-accent-success)', icon: '💬' },
  { value: 'choice', label: 'Choice', color: '#7c7c4a', icon: '❓' },
  { value: 'action', label: 'Action', color: 'var(--color-accent-secondary)', icon: '⚡' },
  { value: 'branch', label: 'Branch', color: '#4a7c7c', icon: '🔀' },
  { value: 'statCheck', label: 'Stat Check', color: 'var(--color-accent-danger)', icon: '🎲' },
  { value: 'end', label: 'End', color: '#4a4a7c', icon: '🏁' },
];

const TAG_CATEGORIES = {
  type: ['story', 'intro', 'combat', 'quest', 'ending', 'exploration'],
  tone: ['vanilla', 'romance', 'dialogue', 'nsfw'],
  special: ['demon', 'wolf', 'tentacle', 'corruption', 'transformation'],
};

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
  { value: 'setTimeOfDay', label: 'Set Time of Day' },
  { value: 'modifyTime', label: 'Modify Time' },
  { value: 'teleportNPC', label: 'Teleport NPC' },
  { value: 'hideNPC', label: 'Hide NPC' },
  { value: 'showNPC', label: 'Show NPC' },
];

const STATS_LIST = [
  { value: 'strength', label: 'Strength' },
  { value: 'vitality', label: 'Vitality' },
  { value: 'intelligence', label: 'Intelligence' },
  { value: 'willpower', label: 'Willpower' },
  { value: 'speed', label: 'Speed' },
  { value: 'evasion', label: 'Evasion' },
  { value: 'charm', label: 'Charm' },
  { value: 'luck', label: 'Luck' },
];

const EMOTIONS = [
  { value: '', label: 'Default' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'angry', label: 'Angry' },
  { value: 'sad', label: 'Sad' },
  { value: 'surprised', label: 'Surprised' },
  { value: 'seductive', label: 'Seductive' },
  { value: 'scared', label: 'Scared' },
  { value: 'amused', label: 'Amused' },
];

const TOAST_TYPES = [
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
  { value: 'buff', label: 'Buff' },
  { value: 'debuff', label: 'Debuff' },
  { value: 'item', label: 'Item' },
  { value: 'heal', label: 'Heal' },
  { value: 'curse', label: 'Curse' },
];

const INTERPOLATION_TAGS = {
  player: {
    label: 'Player',
    color: 'var(--color-accent-success)',
    tags: [
      { tag: '{player_name}', label: 'Name', desc: "Player's name" },
      { tag: '{player_possessive}', label: 'Possessive', desc: 'your/his/her/their' },
      { tag: '{pronoun_subject}', label: 'Subject', desc: 'he/she/they' },
      { tag: '{pronoun_object}', label: 'Object', desc: 'him/her/them' },
      { tag: '{pronoun_possessive}', label: 'Poss. Pronoun', desc: 'his/her/their' },
      { tag: '{pronoun_reflexive}', label: 'Reflexive', desc: 'himself/herself/themself' },
    ],
  },
  enemy: {
    label: 'Enemy',
    color: 'var(--color-accent-danger)',
    tags: [
      { tag: '{enemy_name}', label: 'Name', desc: 'The wolf / Zander (capitalized)' },
      { tag: '{enemy_name_mid}', label: 'Name (mid)', desc: 'the wolf (lowercase for mid-sentence)' },
      { tag: '{enemy_possessive}', label: 'Possessive', desc: "the wolf's / Zander's" },
      { tag: '{enemy_possessive_mid}', label: 'Poss. (mid)', desc: "the wolf's (lowercase)" },
      { tag: '{enemy_type}', label: 'Type', desc: 'creature/humanoid/etc.' },
    ],
  },
  body: {
    label: 'Body Parts',
    color: 'var(--color-accent-secondary)',
    tags: [
      { tag: '{chest_descriptor}', label: 'Chest', desc: 'Contextual chest description' },
      { tag: '{dick_descriptor}', label: 'Dick', desc: 'Penis descriptor' },
      { tag: '{pussy_descriptor}', label: 'Pussy', desc: 'Vagina descriptor' },
      { tag: '{ass_descriptor}', label: 'Ass', desc: 'Buttocks descriptor' },
      { tag: '{balls_descriptor}', label: 'Balls', desc: 'Testicle descriptor' },
      { tag: '{mouth_descriptor}', label: 'Mouth', desc: 'Mouth descriptor' },
      { tag: '{thighs_descriptor}', label: 'Thighs', desc: 'Thighs descriptor' },
      { tag: '{nipples_descriptor}', label: 'Nipples', desc: 'Nipples descriptor' },
      { tag: '{anus_descriptor}', label: 'Anus', desc: 'Rear entrance descriptor' },
    ],
  },
  state: {
    label: 'States',
    color: '#4a4a7c',
    tags: [
      { tag: '{arousal_state}', label: 'Arousal', desc: 'calm/flushed/aroused/overwhelmed' },
      { tag: '{lust_state}', label: 'Lust', desc: 'Lust level description' },
      { tag: '{corruption_state}', label: 'Corruption', desc: 'pure/tainted/corrupted' },
    ],
  },
  checks: {
    label: 'Body Checks',
    color: '#7c7c4a',
    tags: [
      { tag: '{has_dick}', label: 'Has Dick', desc: 'true/false' },
      { tag: '{has_pussy}', label: 'Has Pussy', desc: 'true/false' },
      { tag: '{has_breasts}', label: 'Has Breasts', desc: 'true/false' },
      { tag: '{has_balls}', label: 'Has Balls', desc: 'true/false' },
      { tag: '{is_naked}', label: 'Is Naked', desc: 'true/false' },
      { tag: '{chest_exposure}', label: 'Chest Exposed', desc: 'exposed/covered' },
      { tag: '{groin_exposure}', label: 'Groin Exposed', desc: 'exposed/covered' },
    ],
  },
  equipment: {
    label: 'Equipment',
    color: '#4a7c7c',
    tags: [
      { tag: '{has_plug}', label: 'Has Plug', desc: 'true/false' },
      { tag: '{plug_name}', label: 'Plug Name', desc: 'Name of equipped plug' },
      { tag: '{has_nipple_toys}', label: 'Has Nipple Toys', desc: 'true/false' },
      { tag: '{has_chastity}', label: 'Has Chastity', desc: 'true/false' },
      { tag: '{has_collar}', label: 'Has Collar', desc: 'true/false' },
    ],
  },
  conditionals: {
    label: 'Conditionals',
    color: 'var(--color-text-muted)',
    tags: [
      { tag: '{if condition}', label: 'If', desc: 'Start conditional block' },
      { tag: '{else}', label: 'Else', desc: 'Else branch' },
      { tag: '{/if}', label: 'End If', desc: 'End conditional block' },
      { tag: '{if has_dick}', label: 'If Has Dick', desc: 'Example: check body part' },
      { tag: '{if arousal >= 50}', label: 'If Arousal >= 50', desc: 'Example: stat comparison' },
    ],
  },
};

const NSFW_ACTION_CATEGORIES = [
  { value: 'grope', label: 'Grope' },
  { value: 'fondle', label: 'Fondle' },
  { value: 'kiss', label: 'Kiss' },
  { value: 'lick', label: 'Lick' },
  { value: 'penetrate', label: 'Penetrate' },
  { value: 'oral', label: 'Oral' },
  { value: 'breed', label: 'Breed' },
  { value: 'corrupt', label: 'Corrupt' },
  { value: 'restrain', label: 'Restrain' },
  { value: 'hypnotize', label: 'Hypnotize' },
];

const DEFAULT_SCENE = {
  id: '',
  name: '',
  description: '',
  tags: [],
  isNSFW: false,
  nsfwActionTypes: [],
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
  datapackContent = {},
  datapackLoading = false,
}) => {
  // Combine datapack content with user-created content
  const allItems = [...(datapackContent.items || []), ...(allContent?.items || [])];
  const allLocations = [...(datapackContent.locations || []), ...(allContent?.locations || [])]
    .filter(loc => {
      const hasLocationFields = loc.locationType || loc.parentRegion || loc.connectedLocations || loc.navigation;
      const hasEnemyFields = loc.tier !== undefined || loc.maxHp !== undefined || loc.nsfwActions !== undefined || loc.loot !== undefined;
      return hasLocationFields || !hasEnemyFields;
    });
  const allEffects = [...(datapackContent.effects || []), ...(allContent?.effects || [])];
  const allNPCs = [...(datapackContent.npcs || []), ...(allContent?.npcs || [])];
  const allCharacters = [...(datapackContent.characters || []), ...(allContent?.characters || [])];

  const [formData, setFormData] = useState({ ...DEFAULT_SCENE });
  const [hoveredItem, setHoveredItem] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [activeTagCategory, setActiveTagCategory] = useState(null);
  const [activeNodeIndex, setActiveNodeIndex] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({
    nsfw: true,
    tags: true,
    nodes: false,
  });

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const { clearDraft } = useFormDraft(DRAFT_KEY, formData, setFormData, editingItem, {
    defaultValues: DEFAULT_SCENE,
  });

  const suggestedTags = useMemo(() => {
    return collectTags({
      datapackContent,
      userContent: items,
      commonTags: Object.values(TAG_CATEGORIES).flat(),
      contentType: 'scenes',
    });
  }, [datapackContent, items]);

  useEffect(() => {
    if (editingItem) {
      let nsfwActionTypes = editingItem.nsfwActionTypes || [];
      if (!nsfwActionTypes.length && editingItem.nsfwActionType) {
        nsfwActionTypes = [editingItem.nsfwActionType];
      }
      setFormData({
        ...DEFAULT_SCENE,
        ...editingItem,
        isNSFW: editingItem.isNSFW || false,
        nsfwActionTypes,
        nodes: editingItem.nodes || [],
      });
    } else {
      setFormData({ ...DEFAULT_SCENE });
    }
  }, [editingItem]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const insertTagIntoNode = (nodeIndex, field, tag) => {
    const node = formData.nodes[nodeIndex];
    const currentValue = node[field] || '';
    updateNode(nodeIndex, { [field]: currentValue + tag });
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

  // Choice management
  const addChoice = (nodeIndex) => {
    const node = formData.nodes[nodeIndex];
    const newChoice = { ...DEFAULT_CHOICE, id: `choice_${Date.now()}` };
    updateNode(nodeIndex, { choices: [...(node.choices || []), newChoice] });
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
    updateNode(nodeIndex, { choices: node.choices.filter((_, i) => i !== choiceIndex) });
  };

  // Action management
  const addAction = (nodeIndex) => {
    const node = formData.nodes[nodeIndex];
    const newAction = { type: 'showToast', toastType: 'info', title: '', message: '' };
    updateNode(nodeIndex, { actions: [...(node.actions || []), newAction] });
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
    updateNode(nodeIndex, { actions: node.actions.filter((_, i) => i !== actionIndex) });
  };

  const handleSubmit = () => {
    if (!formData.id || !formData.name) {
      alert('ID and Name are required');
      return;
    }

    if (!editingItem && items.some(item => item.id === formData.id)) {
      alert('A scene with this ID already exists');
      return;
    }

    if (editingItem) {
      onUpdate(editingItem._id, formData);
    } else {
      onAdd(formData);
      clearDraft();
    }

    setFormData({ ...DEFAULT_SCENE });
    setExpandedNodes({});
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_SCENE });
    setExpandedNodes({});
    onCancelEdit();
  };

  // Render action fields based on action type
  const renderActionFields = (action, nodeIndex, actionIndex) => {
    const itemOptions = allItems.map(item => ({
      value: item.id,
      label: `${item.name || item.id} (${item.type || 'item'})`,
    }));

    const locationOptions = allLocations.map(loc => ({
      value: loc.id,
      label: `${loc.name || loc.id} (${loc.parentRegion || 'unknown'})`,
    }));

    const effectOptions = allEffects.map(effect => ({
      value: effect.id,
      label: `${effect.name || effect.id} (${effect.type || 'effect'})`,
    }));

    const npcOptions = allNPCs.map(npc => ({
      value: npc.id,
      label: npc.name || npc.id,
    }));

    switch (action.type) {
      case 'giveItem':
      case 'removeItem':
        return (
          <>
            <FormSelect
              label="Item"
              value={action.itemId || ''}
              onChange={(val) => updateAction(nodeIndex, actionIndex, { itemId: val })}
              options={[{ value: '', label: 'Select item...' }, ...itemOptions]}
            />
            <FormInput
              label="Count"
              type="number"
              value={action.count || 1}
              onChange={(val) => updateAction(nodeIndex, actionIndex, { count: parseInt(val) || 1 })}
              min={1}
            />
          </>
        );

      case 'giveGold':
      case 'removeGold':
        return (
          <FormInput
            label="Gold Amount"
            type="number"
            value={action.amount || 0}
            onChange={(val) => updateAction(nodeIndex, actionIndex, { amount: parseInt(val) || 0 })}
          />
        );

      case 'heal':
      case 'damage':
        return (
          <FormInput
            label={action.type === 'heal' ? 'Heal Amount' : 'Damage Amount'}
            type="number"
            value={action.amount || 0}
            onChange={(val) => updateAction(nodeIndex, actionIndex, { amount: parseInt(val) || 0 })}
          />
        );

      case 'modifyCorruption':
      case 'modifyArousal':
        return (
          <FormInput
            label={`${action.type === 'modifyCorruption' ? 'Corruption' : 'Arousal'} Change`}
            type="number"
            value={action.amount || 0}
            onChange={(val) => updateAction(nodeIndex, actionIndex, { amount: parseInt(val) || 0 })}
            helperText="Can be negative"
          />
        );

      case 'modifyStat':
        return (
          <>
            <FormSelect
              label="Stat"
              value={action.stat || ''}
              onChange={(val) => updateAction(nodeIndex, actionIndex, { stat: val })}
              options={[{ value: '', label: 'Select stat...' }, ...STATS_LIST]}
            />
            <FormInput
              label="Amount"
              type="number"
              value={action.amount || 0}
              onChange={(val) => updateAction(nodeIndex, actionIndex, { amount: parseInt(val) || 0 })}
              helperText="Can be negative"
            />
          </>
        );

      case 'setFlag':
        return (
          <div className="creator-form-row">
            <FormInput
              label="Flag Name"
              value={action.flag || ''}
              onChange={(val) => updateAction(nodeIndex, actionIndex, { flag: val })}
              placeholder="flag_name"
            />
            <FormSelect
              label="Value"
              value={action.value === false ? 'false' : 'true'}
              onChange={(val) => updateAction(nodeIndex, actionIndex, { value: val === 'true' })}
              options={[
                { value: 'true', label: 'True' },
                { value: 'false', label: 'False' },
              ]}
            />
          </div>
        );

      case 'startQuest':
      case 'completeQuest':
        return (
          <FormInput
            label="Quest ID"
            value={action.questId || ''}
            onChange={(val) => updateAction(nodeIndex, actionIndex, { questId: val })}
            placeholder="quest_id"
          />
        );

      case 'applyEffect':
      case 'removeEffect':
        return (
          <>
            {effectOptions.length > 0 ? (
              <FormSelect
                label="Effect"
                value={action.effectId || ''}
                onChange={(val) => updateAction(nodeIndex, actionIndex, { effectId: val })}
                options={[{ value: '', label: 'Select effect...' }, ...effectOptions]}
              />
            ) : (
              <FormInput
                label="Effect ID"
                value={action.effectId || ''}
                onChange={(val) => updateAction(nodeIndex, actionIndex, { effectId: val })}
                placeholder="effect_id"
              />
            )}
            {action.type === 'applyEffect' && (
              <div className="creator-form-row">
                <FormInput
                  label="Duration (turns)"
                  type="number"
                  value={action.duration || 0}
                  onChange={(val) => updateAction(nodeIndex, actionIndex, { duration: parseInt(val) || 0 })}
                  min={0}
                  helperText="0 = permanent"
                />
                <FormInput
                  label="Stacks"
                  type="number"
                  value={action.stacks || 1}
                  onChange={(val) => updateAction(nodeIndex, actionIndex, { stacks: parseInt(val) || 1 })}
                  min={1}
                />
              </div>
            )}
          </>
        );

      case 'unlockLocation':
      case 'teleport':
        return locationOptions.length > 0 ? (
          <FormSelect
            label={action.type === 'unlockLocation' ? 'Location to Unlock' : 'Destination'}
            value={action.locationId || ''}
            onChange={(val) => updateAction(nodeIndex, actionIndex, { locationId: val })}
            options={[{ value: '', label: 'Select location...' }, ...locationOptions]}
          />
        ) : (
          <FormInput
            label="Location ID"
            value={action.locationId || ''}
            onChange={(val) => updateAction(nodeIndex, actionIndex, { locationId: val })}
            placeholder="location_id"
          />
        );

      case 'showToast':
        return (
          <>
            <div className="creator-form-row">
              <FormSelect
                label="Toast Type"
                value={action.toastType || 'info'}
                onChange={(val) => updateAction(nodeIndex, actionIndex, { toastType: val })}
                options={TOAST_TYPES}
              />
              <FormInput
                label="Title"
                value={action.title || ''}
                onChange={(val) => updateAction(nodeIndex, actionIndex, { title: val })}
                placeholder="Toast Title"
              />
            </div>
            <FormInput
              label="Message"
              value={action.message || ''}
              onChange={(val) => updateAction(nodeIndex, actionIndex, { message: val })}
              placeholder="Toast message..."
            />
          </>
        );

      case 'playSound':
        return (
          <FormInput
            label="Sound ID or Path"
            value={action.soundId || ''}
            onChange={(val) => updateAction(nodeIndex, actionIndex, { soundId: val })}
            placeholder="sound_id or /sounds/effect.mp3"
          />
        );

      case 'playMusic':
        return (
          <FormInput
            label="Music ID or Path"
            value={action.musicId || ''}
            onChange={(val) => updateAction(nodeIndex, actionIndex, { musicId: val })}
            placeholder="music_id or /music/track.mp3"
          />
        );

      case 'modifyRelationship':
        return (
          <>
            {npcOptions.length > 0 ? (
              <FormSelect
                label="NPC"
                value={action.npcId || ''}
                onChange={(val) => updateAction(nodeIndex, actionIndex, { npcId: val })}
                options={[{ value: '', label: 'Select NPC...' }, ...npcOptions]}
              />
            ) : (
              <FormInput
                label="NPC ID"
                value={action.npcId || ''}
                onChange={(val) => updateAction(nodeIndex, actionIndex, { npcId: val })}
                placeholder="npc_id"
              />
            )}
            <FormInput
              label="Relationship Change"
              type="number"
              value={action.amount || 0}
              onChange={(val) => updateAction(nodeIndex, actionIndex, { amount: parseInt(val) || 0 })}
              helperText="Can be negative"
            />
          </>
        );

      case 'setTimeOfDay':
        return (
          <FormSelect
            label="Set Time To"
            value={action.target || 'day'}
            onChange={(val) => updateAction(nodeIndex, actionIndex, { target: val })}
            options={[
              { value: 'day', label: 'Day (7:00 AM)' },
              { value: 'night', label: 'Night (9:00 PM)' },
            ]}
            helperText="Day increments only when going backwards"
          />
        );

      case 'modifyTime':
        return (
          <FormInput
            label="Minutes to Add/Subtract"
            type="number"
            value={action.minutes || 0}
            onChange={(val) => updateAction(nodeIndex, actionIndex, { minutes: parseInt(val) || 0 })}
            placeholder="60 = 1 hour"
            helperText="Positive = forward, Negative = backward"
          />
        );

      case 'teleportNPC':
        return (
          <>
            {npcOptions.length > 0 ? (
              <FormSelect
                label="NPC to Teleport"
                value={action.npcId || ''}
                onChange={(val) => updateAction(nodeIndex, actionIndex, { npcId: val })}
                options={[{ value: '', label: 'Select NPC...' }, ...npcOptions]}
              />
            ) : (
              <FormInput
                label="NPC ID"
                value={action.npcId || ''}
                onChange={(val) => updateAction(nodeIndex, actionIndex, { npcId: val })}
                placeholder="npc_id"
              />
            )}
            {locationOptions.length > 0 ? (
              <FormSelect
                label="Destination"
                value={action.locationId || ''}
                onChange={(val) => updateAction(nodeIndex, actionIndex, { locationId: val })}
                options={[{ value: '', label: 'Select location...' }, ...locationOptions]}
              />
            ) : (
              <FormInput
                label="Location ID"
                value={action.locationId || ''}
                onChange={(val) => updateAction(nodeIndex, actionIndex, { locationId: val })}
                placeholder="location_id"
              />
            )}
            <div className="form-helper">Temporary - NPC returns to schedule on next time period change</div>
          </>
        );

      case 'hideNPC':
      case 'showNPC':
        return (
          <>
            {npcOptions.length > 0 ? (
              <FormSelect
                label={`NPC to ${action.type === 'hideNPC' ? 'Hide' : 'Show'}`}
                value={action.npcId || ''}
                onChange={(val) => updateAction(nodeIndex, actionIndex, { npcId: val })}
                options={[{ value: '', label: 'Select NPC...' }, ...npcOptions]}
              />
            ) : (
              <FormInput
                label="NPC ID"
                value={action.npcId || ''}
                onChange={(val) => updateAction(nodeIndex, actionIndex, { npcId: val })}
                placeholder="npc_id"
              />
            )}
            <div className="form-helper">
              {action.type === 'hideNPC'
                ? 'NPC will be removed from all locations until shown again'
                : 'Restores a hidden NPC to their scheduled location'}
            </div>
          </>
        );

      default:
        return (
          <FormInput
            label="Value"
            value={action.value || action.itemId || action.effectId || action.questId || action.locationId || ''}
            onChange={(val) => {
              const key = action.type.includes('Item') ? 'itemId' :
                action.type.includes('Effect') ? 'effectId' :
                  action.type.includes('Quest') ? 'questId' :
                    action.type.includes('Location') ? 'locationId' : 'value';
              updateAction(nodeIndex, actionIndex, { [key]: val });
            }}
            placeholder="Value"
          />
        );
    }
  };

  // Render node content
  const renderNodeContent = (node, index) => {
    const sceneOptions = items.filter(s => s.id !== formData.id).map(scene => ({
      value: scene.id,
      label: scene.name || scene.id,
    }));

    switch (node.type) {
      case 'dialogue':
        return (
          <div>
            <div className="creator-form-row">
              <FormInput
                label="Label (for jumps)"
                value={node.label || ''}
                onChange={(val) => updateNode(index, { label: val })}
                placeholder="optional_label"
              />
              <FormInput
                label="Speaker"
                value={node.speaker || ''}
                onChange={(val) => updateNode(index, { speaker: val })}
                placeholder="Character Name"
              />
            </div>
            <FormInput
              label="Dialogue Text"
              type="textarea"
              required
              value={node.text || ''}
              onChange={(val) => updateNode(index, { text: val })}
              onFocus={() => setActiveNodeIndex(index)}
              placeholder="What the character says... Use tags like {player_name} for dynamic text."
              rows={4}
            />

            {/* Text Tag Insertion Toolbar */}
            <div className="scene-tag-toolbar">
              <div className="form-helper mb-sm">
                Insert Tags: Click a category, then click a tag to append
              </div>
              <div className="scene-tag-categories">
                {Object.entries(INTERPOLATION_TAGS).map(([key, category]) => (
                  <button
                    key={key}
                    className={`scene-tag-category-btn ${activeTagCategory === key && activeNodeIndex === index ? 'active' : ''}`}
                    style={{
                      '--category-color': category.color,
                      backgroundColor: activeTagCategory === key && activeNodeIndex === index ? category.color : undefined,
                    }}
                    onClick={() => {
                      setActiveNodeIndex(index);
                      setActiveTagCategory(activeTagCategory === key && activeNodeIndex === index ? null : key);
                    }}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              {activeTagCategory && activeNodeIndex === index && INTERPOLATION_TAGS[activeTagCategory] && (
                <div
                  className="scene-tag-list"
                  style={{ borderColor: INTERPOLATION_TAGS[activeTagCategory].color }}
                >
                  {INTERPOLATION_TAGS[activeTagCategory].tags.map((tagInfo, idx) => (
                    <button
                      key={idx}
                      className="scene-tag-btn"
                      style={{ color: INTERPOLATION_TAGS[activeTagCategory].color }}
                      onClick={() => insertTagIntoNode(index, 'text', tagInfo.tag)}
                      title={tagInfo.desc}
                    >
                      {tagInfo.tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="creator-form-row">
              <FormInput
                label="Speaker Image"
                value={node.speakerImage || ''}
                onChange={(val) => updateNode(index, { speakerImage: val })}
                placeholder="/npcs/character.png"
              />
              <FormSelect
                label="Emotion"
                value={node.emotion || ''}
                onChange={(val) => updateNode(index, { emotion: val })}
                options={EMOTIONS}
              />
            </div>
          </div>
        );

      case 'choice':
        return (
          <div>
            <FormInput
              label="Prompt (optional)"
              value={node.prompt || ''}
              onChange={(val) => updateNode(index, { prompt: val })}
              placeholder="What do you do?"
            />

            <div className="creator-form-section-title mt-md">
              Choices
              {node.choices?.length > 0 && <span className="count-badge">{node.choices.length}</span>}
            </div>

            {(node.choices || []).map((choice, choiceIndex) => (
              <div key={choiceIndex} className="array-item">
                <div className="array-item-header">
                  <span className="text-secondary text-sm">Choice #{choiceIndex + 1}</span>
                  <Button variant="danger" size="sm" onClick={() => removeChoice(index, choiceIndex)}>
                    Remove
                  </Button>
                </div>
                <div className="creator-form-row">
                  <FormInput
                    value={choice.id || ''}
                    onChange={(val) => updateChoice(index, choiceIndex, { id: val })}
                    placeholder="choice_id"
                  />
                  <FormInput
                    value={choice.text || ''}
                    onChange={(val) => updateChoice(index, choiceIndex, { text: val })}
                    placeholder="Choice text"
                  />
                </div>
                <div className="creator-form-row mt-sm">
                  <FormInput
                    label="Go to Label"
                    value={choice.gotoLabel || ''}
                    onChange={(val) => updateChoice(index, choiceIndex, { gotoLabel: val })}
                    placeholder="label_name"
                  />
                  <FormSelect
                    label="Or Next Scene"
                    value={choice.nextScene || ''}
                    onChange={(val) => updateChoice(index, choiceIndex, { nextScene: val })}
                    options={[{ value: '', label: 'Same scene' }, ...sceneOptions]}
                  />
                </div>
              </div>
            ))}

            <Button variant="success" size="sm" onClick={() => addChoice(index)} className="mt-sm">
              + Add Choice
            </Button>
          </div>
        );

      case 'action':
        return (
          <div>
            <div className="creator-form-section-title">
              Actions
              {node.actions?.length > 0 && <span className="count-badge">{node.actions.length}</span>}
            </div>

            {(node.actions || []).map((action, actionIndex) => (
              <div key={actionIndex} className="array-item">
                <div className="array-item-header">
                  <FormSelect
                    value={action.type}
                    onChange={(val) => updateAction(index, actionIndex, { type: val })}
                    options={ACTION_TYPES}
                    style={{ width: 'auto', minWidth: '180px' }}
                  />
                  <Button variant="danger" size="sm" onClick={() => removeAction(index, actionIndex)}>
                    Remove
                  </Button>
                </div>
                {renderActionFields(action, index, actionIndex)}
              </div>
            ))}

            <Button variant="success" size="sm" onClick={() => addAction(index)} className="mt-sm">
              + Add Action
            </Button>
          </div>
        );

      case 'branch':
        return (
          <div>
            <FormInput
              label="Default Go to Label"
              value={node.default?.gotoLabel || ''}
              onChange={(val) => updateNode(index, { default: { gotoLabel: val } })}
              placeholder="default_label"
            />
            <div className="form-helper mt-sm">
              Branch conditions can be edited in JSON export
            </div>
          </div>
        );

      case 'statCheck':
        return (
          <div>
            <div className="creator-form-row">
              <FormSelect
                label="Stat to Check"
                value={node.stat || 'willpower'}
                onChange={(val) => updateNode(index, { stat: val })}
                options={STATS_LIST}
              />
              <FormInput
                label="Difficulty"
                type="number"
                value={node.difficulty || 5}
                onChange={(val) => updateNode(index, { difficulty: parseInt(val) || 5 })}
              />
            </div>
            <div className="creator-form-row">
              <FormInput
                label="On Success → Label"
                value={node.onSuccess?.gotoLabel || ''}
                onChange={(val) => updateNode(index, { onSuccess: { gotoLabel: val } })}
                placeholder="success_label"
              />
              <FormInput
                label="On Failure → Label"
                value={node.onFailure?.gotoLabel || ''}
                onChange={(val) => updateNode(index, { onFailure: { gotoLabel: val } })}
                placeholder="failure_label"
              />
            </div>
          </div>
        );

      case 'end':
        return (
          <FormInput
            label="Outcome ID"
            value={node.outcome || ''}
            onChange={(val) => updateNode(index, { outcome: val })}
            placeholder="scene_outcome"
          />
        );

      default:
        return <div className="text-muted">Unknown node type</div>;
    }
  };

  // Render node card
  const renderNode = (node, index) => {
    const nodeType = NODE_TYPES.find(t => t.value === node.type);
    const isExpanded = expandedNodes[index];

    return (
      <div key={index} className="scene-node-card">
        <div className="scene-node-header">
          <div className="scene-node-info">
            <span className="scene-node-index">#{index}</span>
            <span
              className="scene-node-type-badge"
              style={{ backgroundColor: nodeType?.color || 'var(--color-border)' }}
            >
              {nodeType?.icon} {nodeType?.label || node.type}
            </span>
            {node.label && (
              <span className="scene-node-label">📍 {node.label}</span>
            )}
          </div>
          <div className="scene-node-controls">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => moveNode(index, -1)}
              disabled={index === 0}
            >
              ↑
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => moveNode(index, 1)}
              disabled={index === formData.nodes.length - 1}
            >
              ↓
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toggleNodeExpanded(index)}
            >
              {isExpanded ? '▼' : '▶'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => removeNode(index)}
            >
              ×
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="scene-node-content">
            {renderNodeContent(node, index)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="creator-container">
      {/* Form Section */}
      <div className="creator-form">
        <h3 className="creator-form-section-title">
          {editingItem ? 'Edit Scene' : 'Create New Scene'}
        </h3>

        {/* Basic Info */}
        <div className="creator-form-section">
          <div className="creator-form-row">
            <FormInput
              label="ID"
              required
              value={formData.id}
              onChange={(v) => handleChange('id', String(v).toLowerCase().replace(/\s/g, '_'))}
              placeholder="unique_scene_id"
            />
            <FormInput
              label="Name"
              required
              value={formData.name}
              onChange={(v) => handleChange('name', v)}
              placeholder="Scene Name"
            />
          </div>

          <FormInput
            label="Description"
            type="textarea"
            value={formData.description}
            onChange={(v) => handleChange('description', v)}
            placeholder="Scene description for reference..."
            rows={3}
          />

          <FormInput
            label="Required Location (optional)"
            value={formData.location}
            onChange={(v) => handleChange('location', v)}
            placeholder="location_id"
          />
        </div>

        {/* NSFW Settings */}
        <CollapsibleSection
          title="NSFW Settings"
          isCollapsed={collapsedSections.nsfw}
          onToggle={() => toggleSection('nsfw')}
          badge={formData.isNSFW ? 'NSFW' : null}
        >
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.isNSFW}
              onChange={(e) => handleChange('isNSFW', e.target.checked)}
            />
            <span style={{ color: formData.isNSFW ? '#ff6b9d' : undefined }}>
              Mark as NSFW Scene
            </span>
          </label>
          <div className="form-helper ml-lg">
            NSFW scenes can be linked to enemy NSFW actions
          </div>

          {formData.isNSFW && (
            <div className="mt-md">
              <TagInput
                label="NSFW Action Categories"
                value={formData.nsfwActionTypes}
                onChange={(v) => handleChange('nsfwActionTypes', v)}
                suggestions={NSFW_ACTION_CATEGORIES.map(c => c.value)}
                placeholder="Add action type..."
                showSuggestions
              />
              <div className="form-helper mt-sm">
                A scene can have multiple action types (e.g., penetrate + infest)
              </div>
            </div>
          )}
        </CollapsibleSection>

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

        {/* Scene Nodes */}
        <CollapsibleSection
          title="Scene Nodes"
          isCollapsed={collapsedSections.nodes}
          onToggle={() => toggleSection('nodes')}
          badge={formData.nodes.length > 0 ? `${formData.nodes.length} nodes` : null}
        >
          <div className="scene-add-node-bar">
            {NODE_TYPES.map(type => (
              <button
                key={type.value}
                className="scene-add-node-btn"
                style={{ backgroundColor: type.color }}
                onClick={() => addNode(type.value)}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>

          {formData.nodes.length === 0 ? (
            <div className="empty-list">
              No nodes yet. Add dialogue, choices, actions, etc.
            </div>
          ) : (
            formData.nodes.map((node, index) => renderNode(node, index))
          )}
        </CollapsibleSection>

        {/* Action Buttons */}
        <div className="creator-actions">
          <Button variant="success" onClick={handleSubmit}>
            {editingItem ? 'Update Scene' : 'Add Scene'}
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
          Created Scenes
          <span className="count-badge">{items.length}</span>
        </h3>

        {items.length === 0 ? (
          <div className="empty-list">
            No scenes created yet.
            <br />
            Use the form to create your first scene.
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
                  {item.isNSFW && (
                    <span className="rarity-badge" style={{ backgroundColor: '#7c4a6a', color: '#ff9dbd' }}>
                      NSFW
                    </span>
                  )}
                </div>
                <div className="creator-item-id">
                  ID: {item.id} | Nodes: {item.nodes?.length || 0}
                  {(item.nsfwActionTypes?.length > 0 || item.nsfwActionType) && (
                    <> | Actions: {(item.nsfwActionTypes || [item.nsfwActionType].filter(Boolean)).join(', ')}</>
                  )}
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

export default SceneCreator;
