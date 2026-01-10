import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { PALETTE_PIECES } from './constants';

const PalettePiece = ({ piece, index }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${piece.type}-${piece.category || piece.operator || index}`,
    data: {
      isNew: true,
      pieceType: piece.type,
      operator: piece.operator,
      category: piece.category,
    },
  });

  const getColorClass = () => {
    if (piece.type === 'group') {
      return piece.operator === 'and' ? 'palette-piece--and' : 'palette-piece--or';
    }
    if (piece.type === 'not') return 'palette-piece--not';
    return `palette-piece--${piece.category}`;
  };

  return (
    <div
      ref={setNodeRef}
      className={`palette-piece ${getColorClass()} ${isDragging ? 'dragging' : ''}`}
      {...listeners}
      {...attributes}
    >
      <span>{piece.icon}</span>
      <span>{piece.label}</span>
    </div>
  );
};

const PuzzlePalette = () => {
  return (
    <div className="puzzle-palette">
      <div className="puzzle-palette-label">Drag pieces to build conditions:</div>
      {PALETTE_PIECES.map((piece, index) => (
        <PalettePiece key={`${piece.type}-${piece.category || piece.operator || index}`} piece={piece} index={index} />
      ))}
    </div>
  );
};

export default PuzzlePalette;
