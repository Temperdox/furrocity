/**
 * @fileoverview CreatorItemsList - Reusable list component for creator tabs
 *
 * Renders a list of created items with Edit, Duplicate, Delete actions.
 * Used across all creator tabs to eliminate duplicate list rendering code.
 *
 * @module components/generator/shared/CreatorItemsList
 */

import React, { useState } from 'react';
import { Button } from '../../ui/shared';

/**
 * CreatorItemsList - Displays list of created items with CRUD actions
 *
 * @param {Object} props
 * @param {Array} props.items - Array of items to display
 * @param {string} props.title - Section title (e.g., "Created Items")
 * @param {string} props.emptyMessage - Message when list is empty
 * @param {string} props.itemType - Type name for empty message (e.g., "item")
 * @param {Function} props.renderItemContent - Render function for custom item content
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDuplicate - Duplicate handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Object} props.editingItem - Currently editing item (for highlighting)
 * @param {string} props.idField - Field name for item ID (default: '_id')
 */
const CreatorItemsList = ({
  items = [],
  title = 'Created Items',
  emptyMessage,
  itemType = 'item',
  renderItemContent,
  onEdit,
  onDuplicate,
  onDelete,
  editingItem = null,
  idField = '_id',
}) => {
  const [hoveredItem, setHoveredItem] = useState(null);

  const getItemId = (item) => item[idField];

  const defaultEmptyMessage = emptyMessage || (
    <>
      No {itemType}s created yet.
      <br />
      Use the form to create your first {itemType}.
    </>
  );

  return (
    <div className="creator-list">
      <h3 className="creator-form-section-title">
        {title}
        <span className="count-badge">{items.length}</span>
      </h3>

      {items.length === 0 ? (
        <div className="empty-list">
          {defaultEmptyMessage}
        </div>
      ) : (
        items.map(item => {
          const itemId = getItemId(item);
          const isHovered = hoveredItem === itemId;
          const isEditing = editingItem && getItemId(editingItem) === itemId;

          return (
            <div
              key={itemId}
              className={`creator-item-card ${isHovered ? 'hovered' : ''} ${isEditing ? 'editing' : ''}`}
              onMouseEnter={() => setHoveredItem(itemId)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className="creator-item-info">
                {renderItemContent ? renderItemContent(item) : (
                  <>
                    <div className="creator-item-name">{item.name || item.id}</div>
                    <div className="creator-item-id">ID: {item.id}</div>
                  </>
                )}
              </div>
              <div className="creator-item-actions">
                {onEdit && (
                  <Button variant="success" size="sm" onClick={() => onEdit(item)}>
                    Edit
                  </Button>
                )}
                {onDuplicate && (
                  <Button variant="secondary" size="sm" onClick={() => onDuplicate(item)}>
                    Duplicate
                  </Button>
                )}
                {onDelete && (
                  <Button variant="danger" size="sm" onClick={() => onDelete(itemId)}>
                    Delete
                  </Button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default CreatorItemsList;
