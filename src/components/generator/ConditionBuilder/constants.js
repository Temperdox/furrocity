// Condition Builder Constants

export const CONDITION_CATEGORIES = [
  { id: 'item', label: 'Item', icon: '📦' },
  { id: 'equipment', label: 'Equipment', icon: '⚔️' },
  { id: 'stat', label: 'Player Stat', icon: '📊' },
  { id: 'quest', label: 'Quest', icon: '📜' },
  { id: 'scene', label: 'Scene', icon: '🎬' },
  { id: 'flag', label: 'Game Flag', icon: '🚩' },
  { id: 'location', label: 'Location', icon: '📍' },
];

export const CONDITION_CHECKS = {
  item: [
    { id: 'hasItem', label: 'Has Item', params: ['itemId'] },
    { id: 'hasItemCount', label: 'Has Item Count', params: ['itemId', 'operator', 'value'] },
  ],
  equipment: [
    { id: 'hasEquipped', label: 'Has Equipped', params: ['itemId'] },
    { id: 'hasSlotEquipped', label: 'Slot Has Equipment', params: ['slot'] },
  ],
  stat: [
    { id: 'statCheck', label: 'Stat Value', params: ['statName', 'operator', 'value'] },
    { id: 'levelCheck', label: 'Player Level', params: ['operator', 'value'] },
  ],
  quest: [
    { id: 'questCompleted', label: 'Quest Completed', params: ['questId'] },
    { id: 'questActive', label: 'Quest Active', params: ['questId'] },
    { id: 'questObjective', label: 'Quest Objective Done', params: ['questId', 'objectiveIndex'] },
  ],
  scene: [
    { id: 'sceneCompleted', label: 'Scene Completed', params: ['sceneId'] },
    { id: 'sceneChoice', label: 'Scene Choice Made', params: ['sceneId', 'choiceId'] },
  ],
  flag: [
    { id: 'flagSet', label: 'Flag Is Set', params: ['flagName'] },
    { id: 'flagValue', label: 'Flag Value', params: ['flagName', 'operator', 'value'] },
  ],
  location: [
    { id: 'visitedLocation', label: 'Visited Location', params: ['locationId'] },
    { id: 'currentLocation', label: 'Is At Location', params: ['locationId'] },
  ],
};

export const OPERATORS = [
  { value: 'eq', label: '=' },
  { value: 'ne', label: '≠' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
];

export const PLAYER_STATS = [
  'hp', 'maxHp', 'stamina', 'maxStamina', 'level', 'experience',
  'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
  'gold', 'corruption', 'lust', 'arousal',
];

export const EQUIPMENT_SLOTS = [
  { value: 'main_hand', label: 'Main Hand' },
  { value: 'off_hand', label: 'Off Hand' },
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
  { value: 'accessory_1', label: 'Accessory 1' },
  { value: 'accessory_2', label: 'Accessory 2' },
  { value: 'ring_left', label: 'Ring (Left)' },
  { value: 'ring_right', label: 'Ring (Right)' },
];

// Create a new condition node
export const createConditionNode = (type = 'condition', category = 'item') => {
  if (type === 'group') return { type: 'group', operator: 'and', children: [] };
  if (type === 'not') return { type: 'not', child: null };
  const checks = CONDITION_CHECKS[category] || [];
  return { type: 'condition', category, check: checks[0]?.id || 'hasItem', params: {} };
};

// Palette pieces configuration
export const PALETTE_PIECES = [
  { type: 'group', operator: 'and', label: 'AND', icon: '∧' },
  { type: 'group', operator: 'or', label: 'OR', icon: '∨' },
  { type: 'not', label: 'NOT', icon: '¬' },
  ...CONDITION_CATEGORIES.map(cat => ({
    type: 'condition',
    category: cat.id,
    label: cat.label,
    icon: cat.icon,
  })),
];
