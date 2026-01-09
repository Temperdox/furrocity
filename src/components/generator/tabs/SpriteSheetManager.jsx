import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FormInput, Button, ChipSelect } from '../../ui/shared';
import { useFormDraft } from '../../../hooks/useFormDraft';
import './CreatorStyles.css';

const DRAFT_KEY = 'contentGenerator_draft_spriteSheets';

const DEFAULT_SPRITE_SHEET = {
  id: '',
  name: '',
  imagePath: '',
  imageData: '',
  cellWidth: 32,
  cellHeight: 32,
  marginX: 0,
  marginY: 0,
  offsetX: 0,
  offsetY: 0,
  columns: 0,
  rows: 0,
  linkedCells: {},
};

// Cell Link Modal Component
const CellLinkModal = ({
  isOpen,
  onClose,
  cellPosition,
  spriteSheet,
  items,
  locations,
  currentLink,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState('items');
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    if (currentLink) {
      setActiveTab(currentLink.type === 'location' ? 'locations' : 'items');
      setSelectedTarget({ type: currentLink.type, id: currentLink.targetId, name: currentLink.name });
    } else {
      setSelectedTarget(null);
    }
  }, [currentLink, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (selectedTarget) {
      onSave(cellPosition, selectedTarget);
    }
    onClose();
  };

  const handleClear = () => {
    onSave(cellPosition, null);
    onClose();
  };

  const getCellStyle = () => {
    if (!spriteSheet.imageData) return {};
    const { row, col } = cellPosition;
    const x = spriteSheet.offsetX + col * (spriteSheet.cellWidth + spriteSheet.marginX);
    const y = spriteSheet.offsetY + row * (spriteSheet.cellHeight + spriteSheet.marginY);

    return {
      backgroundImage: `url(${spriteSheet.imageData})`,
      backgroundPosition: `-${x}px -${y}px`,
      backgroundSize: 'auto',
      width: `${spriteSheet.cellWidth}px`,
      height: `${spriteSheet.cellHeight}px`,
    };
  };

  const filteredItems = activeTab === 'items' ? items : locations;

  const tabOptions = [
    { value: 'items', label: `Items (${items.length})` },
    { value: 'locations', label: `Locations (${locations.length})` },
  ];

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '600px', maxHeight: '80vh' }}>
        <div className="modal-header">
          <h3 className="modal-title">Link Cell ({cellPosition.row}, {cellPosition.col})</h3>
          <Button variant="danger" size="sm" onClick={onClose}>X</Button>
        </div>

        <div className="modal-body">
          {/* Cell Preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
            <div style={{
              ...getCellStyle(),
              backgroundColor: 'var(--color-bg-primary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              minWidth: '64px',
              minHeight: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }} />
            <div>
              <div style={{ color: 'var(--color-accent-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
                Cell Position: Row {cellPosition.row}, Column {cellPosition.col}
              </div>
              <div className="text-muted text-sm" style={{ marginTop: 'var(--space-xxs)' }}>
                {currentLink ? `Currently linked to: ${currentLink.name}` : 'Not linked'}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <ChipSelect
              value={activeTab}
              onChange={setActiveTab}
              options={tabOptions}
              multiple={false}
              showCheckbox={false}
            />
          </div>

          {/* List */}
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {filteredItems.length === 0 ? (
              <div className="empty-list" style={{ padding: 'var(--space-lg)' }}>
                No {activeTab} created yet.
                <br />
                Create some {activeTab} first to link them.
              </div>
            ) : (
              filteredItems.map(item => {
                const isSelected = selectedTarget?.id === item.id && selectedTarget?.type === activeTab.slice(0, -1);
                return (
                  <div
                    key={item._id || item.id}
                    className={`creator-item-card ${hoveredItem === item.id ? 'hovered' : ''} ${isSelected ? 'editing' : ''}`}
                    style={{ cursor: 'pointer', marginBottom: 'var(--space-xs)' }}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={() => setSelectedTarget({
                      type: activeTab === 'items' ? 'item' : 'location',
                      id: item.id,
                      name: item.name
                    })}
                  >
                    <div className="creator-item-info">
                      <div className="creator-item-name">
                        {activeTab === 'items' ? '' : ''} {item.name}
                        {isSelected && <span style={{ marginLeft: 'var(--space-sm)', color: 'var(--color-accent-success)' }}>Selected</span>}
                      </div>
                      <div className="creator-item-id">ID: {item.id}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="modal-footer">
          {currentLink && (
            <Button variant="danger" onClick={handleClear}>
              Remove Link
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSave} disabled={!selectedTarget}>
            Save Link
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const SpriteSheetManager = ({
  items = [],
  allContent = {},
  onAdd,
  onUpdate,
  onDelete,
  onDuplicate,
  onEdit,
  editingItem,
  onCancelEdit,
}) => {
  const [formData, setFormData] = useState({ ...DEFAULT_SPRITE_SHEET });
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [cellModalOpen, setCellModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);

  const { clearDraft } = useFormDraft(DRAFT_KEY, formData, setFormData, editingItem, {
    defaultValues: DEFAULT_SPRITE_SHEET,
  });

  const contentItems = allContent.items || [];
  const contentLocations = allContent.locations || [];

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...DEFAULT_SPRITE_SHEET,
        ...editingItem,
        linkedCells: editingItem.linkedCells || {},
      });
      if (editingItem.imageData) {
        const img = new Image();
        img.onload = () => {
          setImageSize({ width: img.width, height: img.height });
          updateGridSize(img.width, img.height, editingItem);
        };
        img.src = editingItem.imageData;
      }
    } else {
      setFormData({ ...DEFAULT_SPRITE_SHEET });
      setImageSize({ width: 0, height: 0 });
    }
  }, [editingItem]);

  const updateGridSize = useCallback((imgWidth, imgHeight, data = formData) => {
    const cols = Math.floor((imgWidth - data.offsetX) / (data.cellWidth + data.marginX));
    const rows = Math.floor((imgHeight - data.offsetY) / (data.cellHeight + data.marginY));
    setFormData(prev => ({
      ...prev,
      columns: Math.max(0, cols),
      rows: Math.max(0, rows),
    }));
  }, [formData]);

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    if (['cellWidth', 'cellHeight', 'marginX', 'marginY', 'offsetX', 'offsetY'].includes(field) && imageSize.width > 0) {
      const cols = Math.floor((imageSize.width - newData.offsetX) / (newData.cellWidth + newData.marginX));
      const rows = Math.floor((imageSize.height - newData.offsetY) / (newData.cellHeight + newData.marginY));
      setFormData(prev => ({
        ...prev,
        [field]: value,
        columns: Math.max(0, cols),
        rows: Math.max(0, rows),
      }));
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
        setFormData(prev => {
          const cols = Math.floor((img.width - prev.offsetX) / (prev.cellWidth + prev.marginX));
          const rows = Math.floor((img.height - prev.offsetY) / (prev.cellHeight + prev.marginY));
          return {
            ...prev,
            imageData: dataUrl,
            imagePath: file.name,
            columns: Math.max(0, cols),
            rows: Math.max(0, rows),
          };
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        const img = new Image();
        img.onload = () => {
          setImageSize({ width: img.width, height: img.height });
          setFormData(prev => {
            const cols = Math.floor((img.width - prev.offsetX) / (prev.cellWidth + prev.marginX));
            const rows = Math.floor((img.height - prev.offsetY) / (prev.cellHeight + prev.marginY));
            return {
              ...prev,
              imageData: dataUrl,
              imagePath: file.name,
              columns: Math.max(0, cols),
              rows: Math.max(0, rows),
            };
          });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCellClick = (row, col) => {
    setSelectedCell({ row, col });
    setCellModalOpen(true);
  };

  const handleCellLinkSave = (cellPos, target) => {
    const key = `${cellPos.row}_${cellPos.col}`;
    setFormData(prev => {
      const newLinkedCells = { ...prev.linkedCells };
      if (target) {
        newLinkedCells[key] = {
          type: target.type,
          targetId: target.id,
          name: target.name,
        };
      } else {
        delete newLinkedCells[key];
      }
      return { ...prev, linkedCells: newLinkedCells };
    });
  };

  const handleSubmit = () => {
    if (!formData.id || !formData.name) {
      alert('ID and Name are required');
      return;
    }

    if (!formData.imageData) {
      alert('Please upload a sprite sheet image');
      return;
    }

    if (!editingItem && items.some(item => item.id === formData.id)) {
      alert('A sprite sheet with this ID already exists');
      return;
    }

    if (editingItem) {
      onUpdate(editingItem._id, formData);
    } else {
      onAdd(formData);
      clearDraft();
    }

    setFormData({ ...DEFAULT_SPRITE_SHEET });
    setImageSize({ width: 0, height: 0 });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_SPRITE_SHEET });
    setImageSize({ width: 0, height: 0 });
    onCancelEdit();
  };

  const renderCells = () => {
    const cells = [];
    for (let row = 0; row < formData.rows; row++) {
      for (let col = 0; col < formData.columns; col++) {
        const key = `${row}_${col}`;
        const isLinked = !!formData.linkedCells[key];
        const isHovered = hoveredCell?.row === row && hoveredCell?.col === col;

        const x = formData.offsetX + col * (formData.cellWidth + formData.marginX);
        const y = formData.offsetY + row * (formData.cellHeight + formData.marginY);

        cells.push(
          <div
            key={key}
            style={{
              position: 'absolute',
              left: `${x}px`,
              top: `${y}px`,
              width: `${formData.cellWidth}px`,
              height: `${formData.cellHeight}px`,
              border: isLinked ? '2px solid var(--color-accent-success)' : '2px solid var(--color-accent-primary)',
              backgroundColor: isLinked
                ? 'rgba(74, 124, 74, 0.4)'
                : isHovered
                  ? 'rgba(255, 215, 0, 0.4)'
                  : 'rgba(255, 215, 0, 0.2)',
              cursor: 'pointer',
              boxSizing: 'border-box',
              transition: 'all 0.1s ease',
              pointerEvents: 'auto',
            }}
            onMouseEnter={() => setHoveredCell({ row, col })}
            onMouseLeave={() => setHoveredCell(null)}
            onClick={() => handleCellClick(row, col)}
            title={isLinked ? `Linked to: ${formData.linkedCells[key].name}` : `Cell (${row}, ${col})`}
          />
        );
      }
    }
    return cells;
  };

  const linkedCount = Object.keys(formData.linkedCells).length;

  return (
    <div className="creator-container">
      {/* Form Section */}
      <div className="creator-form">
        <h3 className="creator-form-section-title">
          {editingItem ? 'Edit Sprite Sheet' : 'Add Sprite Sheet'}
        </h3>

        {/* Basic Info */}
        <div className="creator-form-section">
          <div className="creator-form-row">
            <FormInput
              label="ID"
              required
              value={formData.id}
              onChange={(v) => handleChange('id', String(v).toLowerCase().replace(/\s/g, '_'))}
              placeholder="unique_sheet_id"
            />
            <FormInput
              label="Name"
              required
              value={formData.name}
              onChange={(v) => handleChange('name', v)}
              placeholder="Sprite Sheet Name"
            />
          </div>
        </div>

        {/* Upload Area */}
        <div className="creator-form-section">
          <h4 className="creator-form-section-title">Sprite Sheet Image</h4>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <div
            style={{
              border: isDragging ? '2px dashed var(--color-accent-primary)' : '2px dashed var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-xl)',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: isDragging ? 'var(--color-bg-tertiary)' : 'var(--color-bg-primary)',
              transition: 'all var(--transition-normal)',
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {formData.imageData ? (
              <div style={{ color: 'var(--color-accent-success)' }}>
                Image loaded: {formData.imagePath}
                <br />
                <span className="text-muted text-sm">
                  {imageSize.width}x{imageSize.height}px
                </span>
              </div>
            ) : (
              <div className="text-muted">
                Click or drag to upload sprite sheet
                <br />
                <span className="text-sm">Supports PNG, JPG, GIF</span>
              </div>
            )}
          </div>
        </div>

        {/* Cell Configuration */}
        <div className="creator-form-section">
          <h4 className="creator-form-section-title">Cell Configuration</h4>
          <div className="creator-form-row cols-4">
            <FormInput
              label="Cell Width"
              type="number"
              value={formData.cellWidth}
              onChange={(v) => handleChange('cellWidth', v)}
              min={1}
            />
            <FormInput
              label="Cell Height"
              type="number"
              value={formData.cellHeight}
              onChange={(v) => handleChange('cellHeight', v)}
              min={1}
            />
            <FormInput
              label="Margin X"
              type="number"
              value={formData.marginX}
              onChange={(v) => handleChange('marginX', v)}
              min={0}
            />
            <FormInput
              label="Margin Y"
              type="number"
              value={formData.marginY}
              onChange={(v) => handleChange('marginY', v)}
              min={0}
            />
          </div>
          <div className="creator-form-row cols-4">
            <FormInput
              label="Offset X"
              type="number"
              value={formData.offsetX}
              onChange={(v) => handleChange('offsetX', v)}
              min={0}
            />
            <FormInput
              label="Offset Y"
              type="number"
              value={formData.offsetY}
              onChange={(v) => handleChange('offsetY', v)}
              min={0}
            />
            <div style={{ gridColumn: 'span 2' }}>
              <div className="subsection" style={{ marginTop: 0 }}>
                <div className="text-sm">
                  Grid: <strong>{formData.columns} x {formData.rows}</strong> = {formData.columns * formData.rows} cells
                  <br />
                  Linked: <strong style={{ color: 'var(--color-accent-success)' }}>{linkedCount}</strong> cells
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sprite Preview with Grid */}
        {formData.imageData && (
          <div className="creator-form-section">
            <h4 className="creator-form-section-title">
              Preview - Click cells to link to Items or Locations
            </h4>
            <div style={{
              position: 'relative',
              overflow: 'auto',
              maxHeight: '400px',
              backgroundColor: 'var(--color-bg-primary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
            }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  ref={imageRef}
                  src={formData.imageData}
                  alt="Sprite Sheet"
                  style={{ display: 'block' }}
                />
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                  {renderCells()}
                </div>
              </div>
            </div>
            <div className="form-helper mt-sm">
              Yellow = Hoverable cell | Green = Linked cell
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="creator-actions">
          <Button variant="success" onClick={handleSubmit}>
            {editingItem ? 'Update Sprite Sheet' : 'Add Sprite Sheet'}
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
          Sprite Sheets
          <span className="count-badge">{items.length}</span>
        </h3>

        {items.length === 0 ? (
          <div className="empty-list">
            No sprite sheets added yet.
            <br />
            Upload a sprite sheet to get started.
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
                <div className="creator-item-name">{item.name}</div>
                <div className="creator-item-id">
                  ID: {item.id} | {item.cellWidth}x{item.cellHeight} | {item.columns}x{item.rows} cells
                </div>
                <div className="creator-item-id" style={{ color: 'var(--color-accent-success)' }}>
                  {Object.keys(item.linkedCells || {}).length} linked cells
                </div>
              </div>
              <div className="creator-item-actions">
                <Button variant="success" size="sm" onClick={() => onEdit(item)}>
                  Edit
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onDuplicate(item)}>
                  Dup
                </Button>
                <Button variant="danger" size="sm" onClick={() => onDelete(item._id)}>
                  Del
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cell Link Modal */}
      <CellLinkModal
        isOpen={cellModalOpen}
        onClose={() => setCellModalOpen(false)}
        cellPosition={selectedCell || { row: 0, col: 0 }}
        spriteSheet={formData}
        items={contentItems}
        locations={contentLocations}
        currentLink={selectedCell ? formData.linkedCells[`${selectedCell.row}_${selectedCell.col}`] : null}
        onSave={handleCellLinkSave}
      />
    </div>
  );
};

export default SpriteSheetManager;
