import React from 'react';
import { useDroppable } from '@dnd-kit/core';

const DropSlot = ({ id, path, slotIndex, isRoot = false }) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      path,
      slotIndex,
      isRoot,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`drop-slot ${isOver ? 'drag-over' : ''}`}
    >
      <div className="drop-slot-icon">+</div>
      <span className="drop-slot-text">Drop piece here</span>
    </div>
  );
};

export default DropSlot;
