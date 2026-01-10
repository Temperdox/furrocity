import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import DropSlot from './DropSlot';
import {
  CONDITION_CATEGORIES,
  CONDITION_CHECKS,
  OPERATORS,
  PLAYER_STATS,
  EQUIPMENT_SLOTS,
} from './constants';

const PuzzlePiece = ({
  node,
  path,
  onUpdate,
  onRemove,
  items = [],
  quests = [],
  scenes = [],
  locations = [],
}) => {
  const pathKey = path.join('-') || 'root';

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `piece-${pathKey}`,
    data: {
      isNew: false,
      path,
      node,
    },
  });

  if (!node) return null;

  // Get color class based on node type
  const getColorClass = () => {
    if (node.type === 'group') {
      return node.operator === 'and' ? 'puzzle-piece--and' : 'puzzle-piece--or';
    }
    if (node.type === 'not') return 'puzzle-piece--not';
    return `puzzle-piece--${node.category || 'item'}`;
  };

  // Handle parameter updates
  const handleParamChange = (paramName, value) => {
    onUpdate(path, {
      params: { ...node.params, [paramName]: value },
    });
  };

  // Handle category change
  const handleCategoryChange = (newCategory) => {
    const checks = CONDITION_CHECKS[newCategory] || [];
    onUpdate(path, {
      category: newCategory,
      check: checks[0]?.id || 'hasItem',
      params: {},
    });
  };

  // Handle check change
  const handleCheckChange = (newCheck) => {
    onUpdate(path, { check: newCheck, params: {} });
  };

  // Handle operator toggle for groups
  const handleOperatorToggle = (newOperator) => {
    onUpdate(path, { operator: newOperator });
  };

  // Render group piece (AND/OR)
  if (node.type === 'group') {
    const filledCount = node.children?.length || 0;
    const slotCount = Math.max(2, filledCount + 1); // Always show one extra empty slot

    return (
      <div
        ref={setNodeRef}
        className={`puzzle-piece ${getColorClass()} ${isDragging ? 'dragging' : ''}`}
      >
        <div className="puzzle-piece-header" {...listeners} {...attributes}>
          <div className="puzzle-piece-title">
            <span className="puzzle-piece-title-icon">{node.operator === 'and' ? '∧' : '∨'}</span>
            <div className="puzzle-operator-toggle">
              <button
                type="button"
                className={`puzzle-operator-btn ${node.operator === 'and' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleOperatorToggle('and'); }}
              >
                AND
              </button>
              <button
                type="button"
                className={`puzzle-operator-btn ${node.operator === 'or' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleOperatorToggle('or'); }}
              >
                OR
              </button>
            </div>
          </div>
          <div className="puzzle-piece-actions">
            <button
              type="button"
              className="puzzle-piece-btn puzzle-piece-btn--danger"
              onClick={() => onRemove(path)}
              title="Remove group"
            >
              ×
            </button>
          </div>
        </div>
        <div className="puzzle-piece-body">
          <div className="puzzle-piece-slots">
            {Array.from({ length: slotCount }, (_, i) => (
              <div key={i} className="puzzle-piece-slot">
                {i < filledCount ? (
                  <PuzzlePiece
                    node={node.children[i]}
                    path={[...path, i]}
                    onUpdate={onUpdate}
                    onRemove={onRemove}
                    items={items}
                    quests={quests}
                    scenes={scenes}
                    locations={locations}
                  />
                ) : (
                  <DropSlot
                    id={`slot-${pathKey}-${i}`}
                    path={path}
                    slotIndex={i}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render NOT piece
  if (node.type === 'not') {
    return (
      <div
        ref={setNodeRef}
        className={`puzzle-piece ${getColorClass()} ${isDragging ? 'dragging' : ''}`}
      >
        <div className="puzzle-piece-header" {...listeners} {...attributes}>
          <div className="puzzle-piece-title">
            <span className="puzzle-piece-title-icon">¬</span>
            <span>NOT</span>
          </div>
          <div className="puzzle-piece-actions">
            <button
              type="button"
              className="puzzle-piece-btn puzzle-piece-btn--danger"
              onClick={() => onRemove(path)}
              title="Remove NOT"
            >
              ×
            </button>
          </div>
        </div>
        <div className="puzzle-piece-body">
          <div className="puzzle-piece-slots">
            <div className="puzzle-piece-slot">
              {node.child ? (
                <PuzzlePiece
                  node={node.child}
                  path={[...path, 'child']}
                  onUpdate={onUpdate}
                  onRemove={onRemove}
                  items={items}
                  quests={quests}
                  scenes={scenes}
                  locations={locations}
                />
              ) : (
                <DropSlot
                  id={`slot-${pathKey}-child`}
                  path={path}
                  slotIndex="child"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render condition piece (leaf)
  const category = node.category || 'item';
  const checks = CONDITION_CHECKS[category] || [];
  const currentCheck = checks.find(c => c.id === node.check) || checks[0];
  const categoryInfo = CONDITION_CATEGORIES.find(c => c.id === category);
  const hasParams = currentCheck?.params?.length > 0;

  return (
    <div
      ref={setNodeRef}
      className={`puzzle-piece puzzle-piece--leaf ${!hasParams ? 'puzzle-piece--no-params' : ''} ${getColorClass()} ${isDragging ? 'dragging' : ''}`}
    >
      <div className="puzzle-piece-header" {...listeners} {...attributes}>
        <div className="puzzle-piece-title">
          <span className="puzzle-piece-title-icon">{categoryInfo?.icon}</span>
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          >
            {CONDITION_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
          <select
            value={node.check}
            onChange={(e) => handleCheckChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          >
            {checks.map(check => (
              <option key={check.id} value={check.id}>{check.label}</option>
            ))}
          </select>
        </div>
        <div className="puzzle-piece-actions">
          <button
            type="button"
            className="puzzle-piece-btn puzzle-piece-btn--danger"
            onClick={() => onRemove(path)}
            title="Remove condition"
          >
            ×
          </button>
        </div>
      </div>
      {hasParams && (
        <div className="puzzle-piece-params">
          {/* Item ID selector */}
          {currentCheck.params.includes('itemId') && (
            <select
              value={node.params.itemId || ''}
              onChange={(e) => handleParamChange('itemId', e.target.value)}
              className={!node.params.itemId ? 'param-missing' : ''}
            >
              <option value="">Select item...</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          )}

          {/* Quest ID selector */}
          {currentCheck.params.includes('questId') && (
            <select
              value={node.params.questId || ''}
              onChange={(e) => handleParamChange('questId', e.target.value)}
              className={!node.params.questId ? 'param-missing' : ''}
            >
              <option value="">Select quest...</option>
              {quests.map(q => (
                <option key={q.id} value={q.id}>{q.name}</option>
              ))}
            </select>
          )}

          {/* Scene ID selector */}
          {currentCheck.params.includes('sceneId') && (
            <select
              value={node.params.sceneId || ''}
              onChange={(e) => handleParamChange('sceneId', e.target.value)}
              className={!node.params.sceneId ? 'param-missing' : ''}
            >
              <option value="">Select scene...</option>
              {scenes.map(scene => (
                <option key={scene.id} value={scene.id}>{scene.name || scene.id}</option>
              ))}
            </select>
          )}

          {/* Location ID selector */}
          {currentCheck.params.includes('locationId') && (
            <select
              value={node.params.locationId || ''}
              onChange={(e) => handleParamChange('locationId', e.target.value)}
              className={!node.params.locationId ? 'param-missing' : ''}
            >
              <option value="">Select location...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          )}

          {/* Stat name selector */}
          {currentCheck.params.includes('statName') && (
            <select
              value={node.params.statName || ''}
              onChange={(e) => handleParamChange('statName', e.target.value)}
              className={!node.params.statName ? 'param-missing' : ''}
            >
              <option value="">Select stat...</option>
              {PLAYER_STATS.map(stat => (
                <option key={stat} value={stat}>{stat}</option>
              ))}
            </select>
          )}

          {/* Equipment slot selector */}
          {currentCheck.params.includes('slot') && (
            <select
              value={node.params.slot || ''}
              onChange={(e) => handleParamChange('slot', e.target.value)}
              className={!node.params.slot ? 'param-missing' : ''}
            >
              <option value="">Select slot...</option>
              {EQUIPMENT_SLOTS.map(slot => (
                <option key={slot.value} value={slot.value}>{slot.label}</option>
              ))}
            </select>
          )}

          {/* Choice ID input */}
          {currentCheck.params.includes('choiceId') && (
            <input
              type="text"
              placeholder="Choice ID..."
              value={node.params.choiceId || ''}
              onChange={(e) => handleParamChange('choiceId', e.target.value)}
              className={!node.params.choiceId ? 'param-missing' : ''}
            />
          )}

          {/* Objective index input */}
          {currentCheck.params.includes('objectiveIndex') && (
            <input
              type="number"
              placeholder="Obj #"
              value={node.params.objectiveIndex ?? ''}
              onChange={(e) => handleParamChange('objectiveIndex', parseInt(e.target.value) || 0)}
              min={0}
              style={{ width: '60px' }}
              title="Objective index (0-based)"
            />
          )}

          {/* Flag name input */}
          {currentCheck.params.includes('flagName') && (
            <input
              type="text"
              placeholder="Flag name..."
              value={node.params.flagName || ''}
              onChange={(e) => handleParamChange('flagName', e.target.value)}
              className={!node.params.flagName ? 'param-missing' : ''}
            />
          )}

          {/* Operator selector */}
          {currentCheck.params.includes('operator') && (
            <select
              value={node.params.operator || 'eq'}
              onChange={(e) => handleParamChange('operator', e.target.value)}
            >
              {OPERATORS.map(op => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
          )}

          {/* Value input */}
          {currentCheck.params.includes('value') && (
            <input
              type="number"
              placeholder="Value"
              value={node.params.value ?? ''}
              onChange={(e) => handleParamChange('value', parseInt(e.target.value) || 0)}
              style={{ width: '60px' }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PuzzlePiece;
