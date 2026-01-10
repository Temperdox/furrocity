import React, { useState, useCallback } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import PuzzlePalette from './PuzzlePalette';
import PuzzlePiece from './PuzzlePiece';
import DropSlot from './DropSlot';
import { createConditionNode, CONDITION_CATEGORIES } from './constants';
import './ConditionBuilder.css';

// Drag overlay preview component
const DragPreview = ({ data }) => {
  if (!data) return null;

  const getColorClass = () => {
    if (data.pieceType === 'group') {
      return data.operator === 'and' ? 'palette-piece--and' : 'palette-piece--or';
    }
    if (data.pieceType === 'not') return 'palette-piece--not';
    if (data.pieceType === 'condition') return `palette-piece--${data.category}`;
    // For existing pieces
    if (data.node?.type === 'group') {
      return data.node.operator === 'and' ? 'palette-piece--and' : 'palette-piece--or';
    }
    if (data.node?.type === 'not') return 'palette-piece--not';
    if (data.node?.type === 'condition') return `palette-piece--${data.node.category}`;
    return 'palette-piece--item';
  };

  const getLabel = () => {
    if (data.pieceType === 'group') {
      return data.operator === 'and' ? '∧ AND' : '∨ OR';
    }
    if (data.pieceType === 'not') return '¬ NOT';
    if (data.pieceType === 'condition') {
      const cat = CONDITION_CATEGORIES.find(c => c.id === data.category);
      return cat ? `${cat.icon} ${cat.label}` : data.category;
    }
    // For existing pieces
    if (data.node?.type === 'group') {
      return data.node.operator === 'and' ? '∧ AND Group' : '∨ OR Group';
    }
    if (data.node?.type === 'not') return '¬ NOT';
    if (data.node?.type === 'condition') {
      const cat = CONDITION_CATEGORIES.find(c => c.id === data.node.category);
      return cat ? `${cat.icon} ${cat.label}` : data.node.category;
    }
    return 'Piece';
  };

  return (
    <div className={`drag-preview ${getColorClass()}`}>
      {getLabel()}
    </div>
  );
};

const ConditionBuilder = ({
  conditions,
  onChange,
  items = [],
  quests = [],
  scenes = [],
  locations = [],
}) => {
  const [activeDragData, setActiveDragData] = useState(null);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require 5px movement before drag starts
      },
    })
  );

  // Create a new node from palette piece data
  const createNodeFromPalette = useCallback((data) => {
    if (data.pieceType === 'group') {
      const node = createConditionNode('group');
      node.operator = data.operator || 'and';
      return node;
    }
    if (data.pieceType === 'not') {
      return createConditionNode('not');
    }
    return createConditionNode('condition', data.category || 'item');
  }, []);

  // Insert a node at a specific path and slot
  const insertNodeAt = useCallback((targetPath, slotIndex, newNode) => {
    if (targetPath.length === 0 && slotIndex === 'root') {
      // Dropping on empty canvas
      onChange(newNode);
      return;
    }

    const newConditions = JSON.parse(JSON.stringify(conditions));
    let target = newConditions;

    // Navigate to the target node
    for (const key of targetPath) {
      if (key === 'child') {
        target = target.child;
      } else {
        target = target.children[key];
      }
    }

    // Insert the new node
    if (slotIndex === 'child') {
      target.child = newNode;
    } else if (typeof slotIndex === 'number') {
      if (!target.children) target.children = [];
      target.children[slotIndex] = newNode;
    }

    onChange(newConditions);
  }, [conditions, onChange]);

  // Remove a node at a specific path
  const removeNodeAt = useCallback((path) => {
    if (path.length === 0) {
      onChange(null);
      return;
    }

    const newConditions = JSON.parse(JSON.stringify(conditions));
    let target = newConditions;

    // Navigate to parent of the target node
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (key === 'child') {
        target = target.child;
      } else {
        target = target.children[key];
      }
    }

    const lastKey = path[path.length - 1];
    if (lastKey === 'child') {
      target.child = null;
    } else if (typeof lastKey === 'number') {
      target.children.splice(lastKey, 1);
    }

    onChange(newConditions);
  }, [conditions, onChange]);

  // Update a node at a specific path
  const updateNodeAt = useCallback((path, updates) => {
    if (path.length === 0) {
      onChange({ ...conditions, ...updates });
      return;
    }

    const newConditions = JSON.parse(JSON.stringify(conditions));
    let target = newConditions;

    // Navigate to the target node
    for (let i = 0; i < path.length; i++) {
      const key = path[i];
      if (i === path.length - 1) {
        // Apply updates to this node
        if (key === 'child') {
          Object.assign(target.child, updates);
        } else {
          Object.assign(target.children[key], updates);
        }
      } else {
        if (key === 'child') {
          target = target.child;
        } else {
          target = target.children[key];
        }
      }
    }

    onChange(newConditions);
  }, [conditions, onChange]);

  // Handle drag start - store the active drag data for overlay
  const handleDragStart = useCallback((event) => {
    setActiveDragData(event.active.data.current);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveDragData(null); // Clear drag preview

    if (!over) return;

    const dragData = active.data.current;
    const dropData = over.data.current;

    if (dragData.isNew) {
      // Dragging from palette - create new node
      const newNode = createNodeFromPalette(dragData);

      if (dropData.isRoot) {
        // Dropping on empty canvas root
        onChange(newNode);
      } else {
        // Dropping into a slot
        insertNodeAt(dropData.path, dropData.slotIndex, newNode);
      }
    } else {
      // Moving existing node - more complex, for now just create copy
      // TODO: Implement proper move logic
      const newNode = JSON.parse(JSON.stringify(dragData.node));
      if (dropData.isRoot) {
        onChange(newNode);
      } else {
        insertNodeAt(dropData.path, dropData.slotIndex, newNode);
      }
    }
  }, [createNodeFromPalette, insertNodeAt, onChange]);

  // Handle drag cancel
  const handleDragCancel = useCallback(() => {
    setActiveDragData(null);
  }, []);

  // Clear all conditions
  const handleClear = () => {
    onChange(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="puzzle-builder">
        <PuzzlePalette />

        <div className="puzzle-builder-header">
          <span className="puzzle-builder-title">Discovery Conditions</span>
          {conditions && (
            <button
              type="button"
              className="puzzle-builder-clear"
              onClick={handleClear}
              title="Clear all conditions"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="puzzle-canvas">
          {conditions ? (
            <PuzzlePiece
              node={conditions}
              path={[]}
              onUpdate={updateNodeAt}
              onRemove={removeNodeAt}
              items={items}
              quests={quests}
              scenes={scenes}
              locations={locations}
            />
          ) : (
            <div className="puzzle-canvas-empty">
              <DropSlot id="root-slot" path={[]} slotIndex="root" isRoot />
            </div>
          )}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDragData && <DragPreview data={activeDragData} />}
      </DragOverlay>
    </DndContext>
  );
};

export default ConditionBuilder;
