/**
 * @fileoverview Custom Blockly blocks for game logic conditions
 *
 * Defines blocks for:
 * - Logical operators (AND, OR, NOT)
 * - Item checks (has item, item count)
 * - Equipment checks (has equipped, slot equipped)
 * - Stat checks (stat value, level)
 * - Quest checks (completed, active, objective)
 * - Scene checks (completed, choice made)
 * - Flag checks (is set, value)
 * - Location checks (visited, current)
 */

import * as Blockly from 'blockly';

// Color palette for different block categories - darker shades for white text visibility
const COLORS = {
  logic: '#4a6a8a',      // Logic operators (AND, OR, NOT) - darker blue-grey
  item: '#4a7c24',       // Item checks - darker green
  equipment: '#b8860b',  // Equipment checks - darker gold/brown
  stat: '#0277bd',       // Stat checks - darker blue
  quest: '#6a1b9a',      // Quest checks - darker purple
  scene: '#ad1457',      // Scene checks - darker pink
  flag: '#455a64',       // Flag checks - darker grey
  location: '#00695c',   // Location checks - darker teal
};

// Player stats options
const STAT_OPTIONS = [
  ['HP', 'hp'],
  ['Max HP', 'maxHp'],
  ['Stamina', 'stamina'],
  ['Max Stamina', 'maxStamina'],
  ['Level', 'level'],
  ['Experience', 'experience'],
  ['Strength', 'strength'],
  ['Dexterity', 'dexterity'],
  ['Constitution', 'constitution'],
  ['Intelligence', 'intelligence'],
  ['Wisdom', 'wisdom'],
  ['Charisma', 'charisma'],
  ['Gold', 'gold'],
  ['Corruption', 'corruption'],
  ['Lust', 'lust'],
  ['Arousal', 'arousal'],
];

// Comparison operators
const OPERATOR_OPTIONS = [
  ['=', 'eq'],
  ['\u2260', 'ne'],  // ≠
  ['>', 'gt'],
  ['\u2265', 'gte'], // ≥
  ['<', 'lt'],
  ['\u2264', 'lte'], // ≤
];

// Equipment slot options
const SLOT_OPTIONS = [
  ['Main Hand', 'main_hand'],
  ['Off Hand', 'off_hand'],
  ['Head', 'head'],
  ['Face', 'face'],
  ['Neck', 'neck'],
  ['Chest', 'chest'],
  ['Back', 'back'],
  ['Arms', 'arms'],
  ['Hands', 'hands'],
  ['Waist', 'waist'],
  ['Legs', 'legs'],
  ['Feet', 'feet'],
  ['Accessory 1', 'accessory_1'],
  ['Accessory 2', 'accessory_2'],
  ['Ring (Left)', 'ring_left'],
  ['Ring (Right)', 'ring_right'],
];

// Equipment slot options with "Any" option for equipped checks
const SLOT_OPTIONS_WITH_ANY = [
  ['Any Slot', 'any'],
  ...SLOT_OPTIONS,
];

// Global game data store - populated by setGameData()
let gameData = {
  items: [],
  quests: [],
  scenes: [],
  locations: [],
};

/**
 * Set the game data for searchable dropdowns
 * @param {Object} data - Game data containing items, quests, scenes, locations
 */
export function setGameData(data) {
  gameData = {
    items: data.items || [],
    quests: data.quests || [],
    scenes: data.scenes || [],
    locations: data.locations || [],
  };
}

// Item type categories for filtering
const ITEM_CATEGORIES = {
  all: 'All Items',
  weapon: 'Weapons',
  armor: 'Armor',
  helmet: 'Helmets',
  accessory: 'Accessories',
  consumable: 'Consumables',
  material: 'Materials',
  quest: 'Quest Items',
  misc: 'Misc',
};

/**
 * Custom searchable dropdown field for Blockly
 * Shows a modal with search input and category filters
 */
class FieldSearchableDropdown extends Blockly.Field {
  constructor(defaultValue, dataType, validator) {
    super(defaultValue || '', validator);
    this.dataType = dataType; // 'item', 'quest', 'scene', 'location'
    this.SERIALIZABLE = true;
    this.CURSOR = 'pointer';
  }

  static fromJson(options) {
    return new FieldSearchableDropdown(
      options.value,
      options.dataType
    );
  }

  initView() {
    this.createBorderRect_();
    this.createTextElement_();
    // Ensure text is visible on colored blocks
    if (this.textElement_) {
      this.textElement_.style.fill = 'white';
      this.textElement_.setAttribute('fill', 'white');
    }
    this.updateDisplay_();
  }

  updateDisplay_() {
    const value = this.getValue();
    let displayText = value || 'Select...';

    // Try to find the name for this ID
    const dataList = this.getDataList();
    const item = dataList.find(d => d.id === value);
    if (item) {
      displayText = item.name || value;
      // Truncate if too long
      if (displayText.length > 20) {
        displayText = displayText.substring(0, 17) + '...';
      }
    }

    if (this.textElement_) {
      this.textElement_.textContent = displayText;
      // Ensure text stays white
      this.textElement_.style.fill = 'white';
      this.textElement_.setAttribute('fill', 'white');
      this.textElement_.classList.add('blocklyText');
    }
    this.forceRerender();
  }

  getDataList() {
    switch (this.dataType) {
      case 'item': return gameData.items;
      case 'quest': return gameData.quests;
      case 'scene': return gameData.scenes;
      case 'location': return gameData.locations;
      default: return [];
    }
  }

  showEditor_() {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'blockly-search-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'blockly-search-modal';
    modal.style.cssText = `
      background: #1a1a2e;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      width: 450px;
      max-height: 500px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    `;

    // Header with title
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <span style="color: #f5f5f5; font-weight: 600;">Select ${this.dataType.charAt(0).toUpperCase() + this.dataType.slice(1)}</span>
      <button class="close-btn" style="background: #ef4444; border: none; color: white; width: 24px; height: 24px; border-radius: 4px; cursor: pointer; font-size: 14px;">×</button>
    `;

    // Search input
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = `padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);`;

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search by name or ID...';
    searchInput.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      background: #16213e;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      color: #f5f5f5;
      font-size: 14px;
      outline: none;
      box-sizing: border-box;
    `;
    searchContainer.appendChild(searchInput);

    // Category filters (only for items)
    let categoryFilter = 'all';
    let filterContainer = null;

    if (this.dataType === 'item') {
      filterContainer = document.createElement('div');
      filterContainer.style.cssText = `
        padding: 8px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      `;

      Object.entries(ITEM_CATEGORIES).forEach(([key, label]) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.dataset.category = key;
        btn.style.cssText = `
          padding: 4px 10px;
          background: ${key === 'all' ? '#4a4a6a' : '#2a2a4a'};
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          color: #f5f5f5;
          font-size: 12px;
          cursor: pointer;
          transition: background 150ms;
        `;
        btn.addEventListener('click', () => {
          categoryFilter = key;
          filterContainer.querySelectorAll('button').forEach(b => {
            b.style.background = b.dataset.category === key ? '#4a4a6a' : '#2a2a4a';
          });
          renderList();
        });
        filterContainer.appendChild(btn);
      });
    }

    // Results list
    const listContainer = document.createElement('div');
    listContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      max-height: 300px;
    `;

    const renderList = () => {
      const searchTerm = searchInput.value.toLowerCase();
      let dataList = this.getDataList();

      // Filter by category for items
      if (this.dataType === 'item' && categoryFilter !== 'all') {
        dataList = dataList.filter(item => {
          const itemType = (item.type || item.itemType || '').toLowerCase();
          const slot = (item.slot || '').toLowerCase();
          const tags = (item.tags || []).map(t => t.toLowerCase());

          switch (categoryFilter) {
            case 'weapon':
              return itemType === 'weapon' || slot === 'main_hand' || slot === 'off_hand' || tags.includes('weapon');
            case 'armor':
              return itemType === 'armor' || ['chest', 'legs', 'arms', 'back'].includes(slot) || tags.includes('armor');
            case 'helmet':
              return slot === 'head' || slot === 'face' || tags.includes('helmet');
            case 'accessory':
              return itemType === 'accessory' || ['accessory_1', 'accessory_2', 'ring_left', 'ring_right', 'neck'].includes(slot) || tags.includes('accessory');
            case 'consumable':
              return itemType === 'consumable' || tags.includes('consumable') || tags.includes('potion') || tags.includes('food');
            case 'material':
              return itemType === 'material' || tags.includes('material') || tags.includes('crafting');
            case 'quest':
              return itemType === 'quest' || tags.includes('quest');
            case 'misc':
              return itemType === 'misc' || (!item.type && !item.slot);
            default:
              return true;
          }
        });
      }

      // Filter by search term
      if (searchTerm) {
        dataList = dataList.filter(item =>
          (item.name || '').toLowerCase().includes(searchTerm) ||
          (item.id || '').toLowerCase().includes(searchTerm)
        );
      }

      // Sort alphabetically by name
      dataList = [...dataList].sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));

      listContainer.innerHTML = '';

      if (dataList.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = `
          padding: 20px;
          text-align: center;
          color: #9ca3af;
          font-size: 14px;
        `;
        empty.textContent = searchTerm ? `No ${this.dataType}s found matching "${searchTerm}"` : `No ${this.dataType}s available`;
        listContainer.appendChild(empty);
        return;
      }

      dataList.forEach(item => {
        const row = document.createElement('div');
        row.style.cssText = `
          padding: 10px 16px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: background 150ms;
        `;
        row.addEventListener('mouseenter', () => row.style.background = 'rgba(255, 255, 255, 0.1)');
        row.addEventListener('mouseleave', () => row.style.background = 'transparent');

        // Name and extra info
        const nameCol = document.createElement('div');
        nameCol.style.cssText = `display: flex; flex-direction: column; gap: 2px;`;

        const name = document.createElement('span');
        name.style.cssText = `color: #f5f5f5; font-size: 14px;`;
        name.textContent = item.name || item.id;

        const idSpan = document.createElement('span');
        idSpan.style.cssText = `color: #9ca3af; font-size: 11px; font-family: monospace;`;
        idSpan.textContent = item.id;

        nameCol.appendChild(name);
        nameCol.appendChild(idSpan);

        // Type badge (for items)
        const typeCol = document.createElement('div');
        if (this.dataType === 'item' && (item.type || item.slot)) {
          const badge = document.createElement('span');
          badge.style.cssText = `
            padding: 2px 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            color: #9ca3af;
            font-size: 11px;
          `;
          badge.textContent = item.type || item.slot || '';
          typeCol.appendChild(badge);
        }

        row.appendChild(nameCol);
        row.appendChild(typeCol);

        row.addEventListener('click', () => {
          this.setValue(item.id);
          this.updateDisplay_();
          document.body.removeChild(overlay);
        });

        listContainer.appendChild(row);
      });
    };

    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(searchContainer);
    if (filterContainer) modal.appendChild(filterContainer);
    modal.appendChild(listContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Event handlers
    searchInput.addEventListener('input', renderList);
    searchInput.focus();

    header.querySelector('.close-btn').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });

    // Handle escape key
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);

    // Initial render
    renderList();
  }

  doClassValidation_(newValue) {
    if (typeof newValue !== 'string') {
      return null;
    }
    return newValue;
  }

  getText_() {
    const value = this.getValue();
    const dataList = this.getDataList();
    const item = dataList.find(d => d.id === value);
    return item ? item.name : value;
  }
}

// Register the custom field
Blockly.fieldRegistry.register('field_searchable_dropdown', FieldSearchableDropdown);

/**
 * Custom dropdown field that renders in a modal (same as searchable but simpler)
 * Used for slot selection and other fixed option lists
 */
class FieldModalDropdown extends Blockly.Field {
  constructor(defaultValue, options, validator) {
    super(defaultValue || options[0]?.[1] || '', validator);
    this.options_ = options; // Array of [label, value] pairs
    this.SERIALIZABLE = true;
    this.CURSOR = 'pointer';
  }

  static fromJson(options) {
    return new FieldModalDropdown(options.value, options.options);
  }

  initView() {
    this.createBorderRect_();
    this.createTextElement_();
    if (this.textElement_) {
      this.textElement_.style.fill = 'white';
      this.textElement_.setAttribute('fill', 'white');
    }
    this.updateDisplay_();
  }

  updateDisplay_() {
    const value = this.getValue();
    const option = this.options_.find(([, val]) => val === value);
    const displayText = option ? option[0] : value || 'Select...';

    if (this.textElement_) {
      this.textElement_.textContent = displayText;
      this.textElement_.style.fill = 'white';
      this.textElement_.setAttribute('fill', 'white');
    }
    this.forceRerender();
  }

  showEditor_() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: #1a1a2e;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      width: 280px;
      max-height: 400px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <span style="color: #f5f5f5; font-weight: 600;">Select Slot</span>
      <button class="close-btn" style="background: #ef4444; border: none; color: white; width: 24px; height: 24px; border-radius: 4px; cursor: pointer; font-size: 14px;">×</button>
    `;

    const listContainer = document.createElement('div');
    listContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      max-height: 320px;
    `;

    const currentValue = this.getValue();

    this.options_.forEach(([label, value]) => {
      const row = document.createElement('div');
      const isSelected = value === currentValue;
      row.style.cssText = `
        padding: 10px 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        background: ${isSelected ? 'rgba(255, 215, 0, 0.2)' : 'transparent'};
        transition: background 150ms;
      `;
      row.addEventListener('mouseenter', () => {
        if (!isSelected) row.style.background = 'rgba(255, 255, 255, 0.1)';
      });
      row.addEventListener('mouseleave', () => {
        row.style.background = isSelected ? 'rgba(255, 215, 0, 0.2)' : 'transparent';
      });

      const checkmark = document.createElement('span');
      checkmark.style.cssText = `width: 16px; color: #ffd700;`;
      checkmark.textContent = isSelected ? '✓' : '';

      const text = document.createElement('span');
      text.style.cssText = `color: #f5f5f5; font-size: 14px;`;
      text.textContent = label;

      row.appendChild(checkmark);
      row.appendChild(text);

      row.addEventListener('click', () => {
        this.setValue(value);
        this.updateDisplay_();
        document.body.removeChild(overlay);
      });

      listContainer.appendChild(row);
    });

    modal.appendChild(header);
    modal.appendChild(listContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    header.querySelector('.close-btn').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });

    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);
  }

  doClassValidation_(newValue) {
    if (typeof newValue !== 'string') return null;
    return newValue;
  }

  getText_() {
    const option = this.options_.find(([, val]) => val === this.getValue());
    return option ? option[0] : this.getValue();
  }
}

Blockly.fieldRegistry.register('field_modal_dropdown', FieldModalDropdown);

/**
 * Register all custom blocks with Blockly
 */
export function registerBlocks() {
  // ========== LOGIC BLOCKS ==========

  // AND block - combines multiple conditions
  Blockly.Blocks['logic_and'] = {
    init: function() {
      this.appendValueInput('CONDITION0')
          .setCheck('Boolean');
      this.appendValueInput('CONDITION1')
          .setCheck('Boolean')
          .appendField('and');
      this.setInputsInline(true);
      this.setOutput(true, 'Boolean');
      this.setColour(COLORS.logic);
      this.setTooltip('Returns true if ALL conditions are true');
      this.setMutator(new Blockly.icons.MutatorIcon(['logic_and_item'], this));
      this.itemCount_ = 2;
    },
    mutationToDom: function() {
      const container = Blockly.utils.xml.createElement('mutation');
      container.setAttribute('items', this.itemCount_);
      return container;
    },
    domToMutation: function(xmlElement) {
      this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10) || 2;
      this.updateShape_();
    },
    decompose: function(workspace) {
      const containerBlock = workspace.newBlock('logic_and_container');
      containerBlock.initSvg();
      let connection = containerBlock.getInput('STACK').connection;
      for (let i = 0; i < this.itemCount_; i++) {
        const itemBlock = workspace.newBlock('logic_and_item');
        itemBlock.initSvg();
        connection.connect(itemBlock.previousConnection);
        connection = itemBlock.nextConnection;
      }
      return containerBlock;
    },
    compose: function(containerBlock) {
      let itemBlock = containerBlock.getInputTargetBlock('STACK');
      const connections = [];
      while (itemBlock) {
        connections.push(itemBlock.valueConnection_);
        itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
      }
      for (let i = 0; i < this.itemCount_; i++) {
        const connection = this.getInput('CONDITION' + i).connection.targetConnection;
        if (connection && connections.indexOf(connection) === -1) {
          connection.disconnect();
        }
      }
      this.itemCount_ = connections.length;
      this.updateShape_();
      for (let i = 0; i < this.itemCount_; i++) {
        Blockly.icons.MutatorIcon.reconnect(connections[i], this, 'CONDITION' + i);
      }
    },
    saveConnections: function(containerBlock) {
      let itemBlock = containerBlock.getInputTargetBlock('STACK');
      let i = 0;
      while (itemBlock) {
        const input = this.getInput('CONDITION' + i);
        itemBlock.valueConnection_ = input && input.connection.targetConnection;
        itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
        i++;
      }
    },
    updateShape_: function() {
      for (let i = 0; this.getInput('CONDITION' + i); i++) {
        this.removeInput('CONDITION' + i);
      }
      for (let i = 0; i < this.itemCount_; i++) {
        const input = this.appendValueInput('CONDITION' + i).setCheck('Boolean');
        if (i > 0) input.appendField('and');
      }
    },
  };

  Blockly.Blocks['logic_and_container'] = {
    init: function() {
      this.appendDummyInput().appendField('conditions');
      this.appendStatementInput('STACK');
      this.setColour(COLORS.logic);
      this.contextMenu = false;
    },
  };

  Blockly.Blocks['logic_and_item'] = {
    init: function() {
      this.appendDummyInput().appendField('condition');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(COLORS.logic);
      this.contextMenu = false;
    },
  };

  // OR block - any condition can be true
  Blockly.Blocks['logic_or'] = {
    init: function() {
      this.appendValueInput('CONDITION0')
          .setCheck('Boolean');
      this.appendValueInput('CONDITION1')
          .setCheck('Boolean')
          .appendField('or');
      this.setInputsInline(true);
      this.setOutput(true, 'Boolean');
      this.setColour(COLORS.logic);
      this.setTooltip('Returns true if ANY condition is true');
    },
  };

  // NOT block - inverts condition
  Blockly.Blocks['logic_not'] = {
    init: function() {
      this.appendValueInput('CONDITION')
          .setCheck('Boolean')
          .appendField('not');
      this.setOutput(true, 'Boolean');
      this.setColour(COLORS.logic);
      this.setTooltip('Returns true if the condition is false');
    },
  };

  // ========== ITEM BLOCKS ==========

  // Has item check - with searchable dropdown
  Blockly.Blocks['condition_has_item'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('has item')
          .appendField(new FieldSearchableDropdown('', 'item'), 'ITEM_ID');
      this.setOutput(true, 'Boolean');
      this.setColour(COLORS.item);
      this.setTooltip('Check if player has the specified item');
    },
  };

  // Item count check - with searchable dropdown
  Blockly.Blocks['condition_item_count'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('item')
          .appendField(new FieldSearchableDropdown('', 'item'), 'ITEM_ID')
          .appendField('count')
          .appendField(new FieldModalDropdown('gte', OPERATOR_OPTIONS), 'OPERATOR')
          .appendField(new Blockly.FieldNumber(1, 0), 'VALUE');
      this.setOutput(true, 'Boolean');
      this.setColour(COLORS.item);
      this.setTooltip('Check if player has a specific count of an item');
    },
  };

  // ========== EQUIPMENT BLOCKS ==========

  // Has equipped item - with searchable dropdown and slot selector
  Blockly.Blocks['condition_has_equipped'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('has')
          .appendField(new FieldSearchableDropdown('', 'item'), 'ITEM_ID')
          .appendField('equipped in')
          .appendField(new FieldModalDropdown('any', SLOT_OPTIONS_WITH_ANY), 'SLOT');
      this.setOutput(true, 'Boolean');
      this.setColour(COLORS.equipment);
      this.setTooltip('Check if player has the specified item equipped in a slot');
    },
  };

  // Slot has equipment
  Blockly.Blocks['condition_slot_equipped'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('slot')
          .appendField(new FieldModalDropdown('main_hand', SLOT_OPTIONS), 'SLOT')
          .appendField('has equipment');
      this.setOutput(true, 'Boolean');
      this.setColour(COLORS.equipment);
      this.setTooltip('Check if the specified slot has any equipment');
    },
  };

  // ========== STAT BLOCKS ==========

  // Stat check
  Blockly.Blocks['condition_stat'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('stat')
          .appendField(new FieldModalDropdown('hp', STAT_OPTIONS), 'STAT')
          .appendField(new FieldModalDropdown('gte', OPERATOR_OPTIONS), 'OPERATOR')
          .appendField(new Blockly.FieldNumber(0), 'VALUE');
      this.setOutput(true, 'Boolean');
      this.setColour(COLORS.stat);
      this.setTooltip('Check if a player stat meets the condition');
    },
  };

  // Level check
  Blockly.Blocks['condition_level'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('player level')
          .appendField(new FieldModalDropdown('gte', OPERATOR_OPTIONS), 'OPERATOR')
          .appendField(new Blockly.FieldNumber(1, 1), 'VALUE');
      this.setOutput(true, 'Boolean');
      this.setColour(COLORS.stat);
      this.setTooltip('Check if player level meets the condition');
    },
  };

  // ========== QUEST BLOCKS ==========

  // Quest completed - with searchable dropdown
  Blockly.Blocks['condition_quest_completed'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('quest')
          .appendField(new FieldSearchableDropdown('', 'quest'), 'QUEST_ID')
          .appendField('completed');
      this.setOutput(true, 'Boolean');
      this.setColour(COLORS.quest);
      this.setTooltip('Check if the specified quest is completed');
    },
  };

  // Quest active - with searchable dropdown
  Blockly.Blocks['condition_quest_active'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('quest')
          .appendField(new FieldSearchableDropdown('', 'quest'), 'QUEST_ID')
          .appendField('is active');
      this.setOutput(true, 'Boolean');
      this.setColour(COLORS.quest);
      this.setTooltip('Check if the specified quest is currently active');
    },
  };

  // Quest objective complete - with searchable dropdown
  Blockly.Blocks['condition_quest_objective'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('quest')
          .appendField(new FieldSearchableDropdown('', 'quest'), 'QUEST_ID')
          .appendField('objective')
          .appendField(new Blockly.FieldNumber(0, 0), 'OBJECTIVE')
          .appendField('done');
      this.setOutput(true, 'Boolean');
      this.setColour(COLORS.quest);
      this.setTooltip('Check if a specific quest objective is complete');
    },
  };

  // ========== SCENE BLOCKS ==========

  // Scene completed - with searchable dropdown
  Blockly.Blocks['condition_scene_completed'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('scene')
          .appendField(new FieldSearchableDropdown('', 'scene'), 'SCENE_ID')
          .appendField('completed');
      this.setOutput(true, 'Boolean');
      this.setColour(COLORS.scene);
      this.setTooltip('Check if the specified scene was completed');
    },
  };

  // Scene choice made - with searchable dropdown for scene
  Blockly.Blocks['condition_scene_choice'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('scene')
          .appendField(new FieldSearchableDropdown('', 'scene'), 'SCENE_ID')
          .appendField('choice')
          .appendField(new Blockly.FieldTextInput('choice_id'), 'CHOICE_ID')
          .appendField('was made');
      this.setOutput(true, 'Boolean');
      this.setColour(COLORS.scene);
      this.setTooltip('Check if a specific choice was made in a scene');
    },
  };

  // ========== FLAG BLOCKS ==========

  // Flag is set
  Blockly.Blocks['condition_flag_set'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('flag')
          .appendField(new Blockly.FieldTextInput('flag_name'), 'FLAG_NAME')
          .appendField('is set');
      this.setOutput(true, 'Boolean');
      this.setColour(COLORS.flag);
      this.setTooltip('Check if a game flag is set (truthy)');
    },
  };

  // Flag value check
  Blockly.Blocks['condition_flag_value'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('flag')
          .appendField(new Blockly.FieldTextInput('flag_name'), 'FLAG_NAME')
          .appendField(new FieldModalDropdown('eq', OPERATOR_OPTIONS), 'OPERATOR')
          .appendField(new Blockly.FieldNumber(0), 'VALUE');
      this.setOutput(true, 'Boolean');
      this.setColour(COLORS.flag);
      this.setTooltip('Check if a flag value meets the condition');
    },
  };

  // ========== LOCATION BLOCKS ==========

  // Visited location - with searchable dropdown
  Blockly.Blocks['condition_visited_location'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('visited location')
          .appendField(new FieldSearchableDropdown('', 'location'), 'LOCATION_ID');
      this.setOutput(true, 'Boolean');
      this.setColour(COLORS.location);
      this.setTooltip('Check if player has visited the location');
    },
  };

  // Current location - with searchable dropdown
  Blockly.Blocks['condition_current_location'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('is at location')
          .appendField(new FieldSearchableDropdown('', 'location'), 'LOCATION_ID');
      this.setOutput(true, 'Boolean');
      this.setColour(COLORS.location);
      this.setTooltip('Check if player is currently at the location');
    },
  };
}

/**
 * Convert Blockly workspace to condition JSON structure
 * @param {Blockly.Workspace} workspace - The Blockly workspace
 * @returns {Object|null} The condition JSON or null if empty
 */
export function workspaceToCondition(workspace) {
  const topBlocks = workspace.getTopBlocks(true);
  if (topBlocks.length === 0) return null;

  // Get the first connected block
  const rootBlock = topBlocks[0];
  return blockToCondition(rootBlock);
}

/**
 * Convert a single block to condition JSON
 * @param {Blockly.Block} block - The block to convert
 * @returns {Object|null} The condition JSON
 */
function blockToCondition(block) {
  if (!block) return null;

  const type = block.type;

  // Logic blocks
  if (type === 'logic_and') {
    const children = [];
    let i = 0;
    while (block.getInput('CONDITION' + i)) {
      const inputBlock = block.getInputTargetBlock('CONDITION' + i);
      if (inputBlock) {
        const child = blockToCondition(inputBlock);
        if (child) children.push(child);
      }
      i++;
    }
    return { type: 'group', operator: 'and', children };
  }

  if (type === 'logic_or') {
    const children = [];
    const cond0 = block.getInputTargetBlock('CONDITION0');
    const cond1 = block.getInputTargetBlock('CONDITION1');
    if (cond0) children.push(blockToCondition(cond0));
    if (cond1) children.push(blockToCondition(cond1));
    return { type: 'group', operator: 'or', children: children.filter(Boolean) };
  }

  if (type === 'logic_not') {
    const child = block.getInputTargetBlock('CONDITION');
    return { type: 'not', child: blockToCondition(child) };
  }

  // Condition blocks
  if (type === 'condition_has_item') {
    return {
      type: 'condition',
      category: 'item',
      check: 'hasItem',
      params: { itemId: block.getFieldValue('ITEM_ID') },
    };
  }

  if (type === 'condition_item_count') {
    return {
      type: 'condition',
      category: 'item',
      check: 'hasItemCount',
      params: {
        itemId: block.getFieldValue('ITEM_ID'),
        operator: block.getFieldValue('OPERATOR'),
        value: parseInt(block.getFieldValue('VALUE')) || 0,
      },
    };
  }

  if (type === 'condition_has_equipped') {
    const slot = block.getFieldValue('SLOT');
    return {
      type: 'condition',
      category: 'equipment',
      check: 'hasEquipped',
      params: {
        itemId: block.getFieldValue('ITEM_ID'),
        slot: slot === 'any' ? null : slot,
      },
    };
  }

  if (type === 'condition_slot_equipped') {
    return {
      type: 'condition',
      category: 'equipment',
      check: 'hasSlotEquipped',
      params: { slot: block.getFieldValue('SLOT') },
    };
  }

  if (type === 'condition_stat') {
    return {
      type: 'condition',
      category: 'stat',
      check: 'statCheck',
      params: {
        statName: block.getFieldValue('STAT'),
        operator: block.getFieldValue('OPERATOR'),
        value: parseInt(block.getFieldValue('VALUE')) || 0,
      },
    };
  }

  if (type === 'condition_level') {
    return {
      type: 'condition',
      category: 'stat',
      check: 'levelCheck',
      params: {
        operator: block.getFieldValue('OPERATOR'),
        value: parseInt(block.getFieldValue('VALUE')) || 1,
      },
    };
  }

  if (type === 'condition_quest_completed') {
    return {
      type: 'condition',
      category: 'quest',
      check: 'questCompleted',
      params: { questId: block.getFieldValue('QUEST_ID') },
    };
  }

  if (type === 'condition_quest_active') {
    return {
      type: 'condition',
      category: 'quest',
      check: 'questActive',
      params: { questId: block.getFieldValue('QUEST_ID') },
    };
  }

  if (type === 'condition_quest_objective') {
    return {
      type: 'condition',
      category: 'quest',
      check: 'questObjective',
      params: {
        questId: block.getFieldValue('QUEST_ID'),
        objectiveIndex: parseInt(block.getFieldValue('OBJECTIVE')) || 0,
      },
    };
  }

  if (type === 'condition_scene_completed') {
    return {
      type: 'condition',
      category: 'scene',
      check: 'sceneCompleted',
      params: { sceneId: block.getFieldValue('SCENE_ID') },
    };
  }

  if (type === 'condition_scene_choice') {
    return {
      type: 'condition',
      category: 'scene',
      check: 'sceneChoice',
      params: {
        sceneId: block.getFieldValue('SCENE_ID'),
        choiceId: block.getFieldValue('CHOICE_ID'),
      },
    };
  }

  if (type === 'condition_flag_set') {
    return {
      type: 'condition',
      category: 'flag',
      check: 'flagSet',
      params: { flagName: block.getFieldValue('FLAG_NAME') },
    };
  }

  if (type === 'condition_flag_value') {
    return {
      type: 'condition',
      category: 'flag',
      check: 'flagValue',
      params: {
        flagName: block.getFieldValue('FLAG_NAME'),
        operator: block.getFieldValue('OPERATOR'),
        value: parseInt(block.getFieldValue('VALUE')) || 0,
      },
    };
  }

  if (type === 'condition_visited_location') {
    return {
      type: 'condition',
      category: 'location',
      check: 'visitedLocation',
      params: { locationId: block.getFieldValue('LOCATION_ID') },
    };
  }

  if (type === 'condition_current_location') {
    return {
      type: 'condition',
      category: 'location',
      check: 'currentLocation',
      params: { locationId: block.getFieldValue('LOCATION_ID') },
    };
  }

  return null;
}

/**
 * Toolbox configuration for the logic builder
 */
export const TOOLBOX = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Logic',
      colour: COLORS.logic,
      contents: [
        { kind: 'block', type: 'logic_and' },
        { kind: 'block', type: 'logic_or' },
        { kind: 'block', type: 'logic_not' },
      ],
    },
    {
      kind: 'category',
      name: 'Items',
      colour: COLORS.item,
      contents: [
        { kind: 'block', type: 'condition_has_item' },
        { kind: 'block', type: 'condition_item_count' },
      ],
    },
    {
      kind: 'category',
      name: 'Equipment',
      colour: COLORS.equipment,
      contents: [
        { kind: 'block', type: 'condition_has_equipped' },
        { kind: 'block', type: 'condition_slot_equipped' },
      ],
    },
    {
      kind: 'category',
      name: 'Stats',
      colour: COLORS.stat,
      contents: [
        { kind: 'block', type: 'condition_stat' },
        { kind: 'block', type: 'condition_level' },
      ],
    },
    {
      kind: 'category',
      name: 'Quests',
      colour: COLORS.quest,
      contents: [
        { kind: 'block', type: 'condition_quest_completed' },
        { kind: 'block', type: 'condition_quest_active' },
        { kind: 'block', type: 'condition_quest_objective' },
      ],
    },
    {
      kind: 'category',
      name: 'Scenes',
      colour: COLORS.scene,
      contents: [
        { kind: 'block', type: 'condition_scene_completed' },
        { kind: 'block', type: 'condition_scene_choice' },
      ],
    },
    {
      kind: 'category',
      name: 'Flags',
      colour: COLORS.flag,
      contents: [
        { kind: 'block', type: 'condition_flag_set' },
        { kind: 'block', type: 'condition_flag_value' },
      ],
    },
    {
      kind: 'category',
      name: 'Locations',
      colour: COLORS.location,
      contents: [
        { kind: 'block', type: 'condition_visited_location' },
        { kind: 'block', type: 'condition_current_location' },
      ],
    },
  ],
};
