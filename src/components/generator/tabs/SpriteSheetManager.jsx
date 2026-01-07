import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

const styles = {
  container: {
    display: 'flex',
    gap: '20px',
    height: '100%',
  },
  formSection: {
    flex: '1',
    backgroundColor: '#252540',
    borderRadius: '8px',
    padding: '20px',
    overflowY: 'auto',
  },
  listSection: {
    width: '300px',
    backgroundColor: '#252540',
    borderRadius: '8px',
    padding: '15px',
    overflowY: 'auto',
  },
  sectionTitle: {
    color: '#ffd700',
    fontSize: '18px',
    marginBottom: '15px',
    borderBottom: '1px solid #4a4a6a',
    paddingBottom: '10px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    color: '#a0a0c0',
    marginBottom: '5px',
    fontSize: '13px',
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #4a4a6a',
    backgroundColor: '#1a1a2e',
    color: 'white',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  row: {
    display: 'flex',
    gap: '15px',
  },
  halfWidth: {
    flex: 1,
  },
  quarterWidth: {
    flex: 0.5,
  },
  button: {
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    marginRight: '10px',
  },
  primaryButton: {
    backgroundColor: '#4a7c4a',
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: '#4a4a6a',
    color: 'white',
  },
  dangerButton: {
    backgroundColor: '#7c4a4a',
    color: 'white',
  },
  smallButton: {
    padding: '4px 8px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '11px',
  },
  listItem: {
    padding: '12px',
    backgroundColor: '#1a1a2e',
    borderRadius: '6px',
    marginBottom: '8px',
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'all 0.2s ease',
  },
  listItemHover: {
    borderColor: '#4a4a6a',
  },
  listItemName: {
    color: '#ffd700',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  listItemDetails: {
    color: '#808090',
    fontSize: '12px',
    marginTop: '4px',
  },
  listItemActions: {
    display: 'flex',
    gap: '5px',
    marginTop: '8px',
  },
  emptyList: {
    color: '#606080',
    textAlign: 'center',
    padding: '30px',
    fontSize: '14px',
  },
  subsection: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#1e1e35',
    borderRadius: '6px',
  },
  subsectionTitle: {
    color: '#c0c0e0',
    fontSize: '14px',
    marginBottom: '12px',
    fontWeight: 'bold',
  },
  uploadArea: {
    border: '2px dashed #4a4a6a',
    borderRadius: '8px',
    padding: '30px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: '#1a1a2e',
  },
  uploadAreaHover: {
    borderColor: '#ffd700',
    backgroundColor: '#252540',
  },
  spritePreview: {
    position: 'relative',
    overflow: 'auto',
    maxHeight: '400px',
    backgroundColor: '#0a0a15',
    borderRadius: '8px',
    border: '1px solid #4a4a6a',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
  cellHighlight: {
    position: 'absolute',
    border: '2px solid #ffd700',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
    boxSizing: 'border-box',
  },
  cellLinked: {
    backgroundColor: 'rgba(74, 124, 74, 0.4)',
    border: '2px solid #4a7c4a',
  },
  cellHovered: {
    backgroundColor: 'rgba(255, 215, 0, 0.4)',
  },
  infoBox: {
    padding: '10px 15px',
    backgroundColor: '#1a1a2e',
    borderRadius: '6px',
    border: '1px solid #4a4a6a',
    color: '#a0a0c0',
    fontSize: '12px',
    marginTop: '10px',
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20000,
  },
  modal: {
    backgroundColor: '#1a1a2e',
    borderRadius: '12px',
    border: '2px solid #4a4a6a',
    width: '600px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    padding: '15px 20px',
    borderBottom: '1px solid #4a4a6a',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#ffd700',
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
  },
  modalBody: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
  },
  modalFooter: {
    padding: '15px 20px',
    borderTop: '1px solid #4a4a6a',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  tabs: {
    display: 'flex',
    gap: '5px',
    marginBottom: '15px',
  },
  tab: {
    padding: '8px 16px',
    backgroundColor: '#252540',
    border: 'none',
    borderRadius: '4px',
    color: '#a0a0c0',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s ease',
  },
  tabActive: {
    backgroundColor: '#4a4a6a',
    color: '#ffd700',
  },
  linkList: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  linkItem: {
    padding: '10px',
    backgroundColor: '#252540',
    borderRadius: '4px',
    marginBottom: '5px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  linkItemHover: {
    backgroundColor: '#3a3a5a',
  },
  linkItemSelected: {
    backgroundColor: '#4a7c4a',
    color: 'white',
  },
  cellPreview: {
    width: '64px',
    height: '64px',
    backgroundColor: '#0a0a15',
    borderRadius: '4px',
    border: '1px solid #4a4a6a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
};

const DEFAULT_SPRITE_SHEET = {
  id: '',
  name: '',
  imagePath: '',
  imageData: '', // base64 for preview
  cellWidth: 32,
  cellHeight: 32,
  marginX: 0,
  marginY: 0,
  offsetX: 0,
  offsetY: 0,
  columns: 0,
  rows: 0,
  linkedCells: {}, // { "row_col": { type: "item"|"location", targetId: "...", name: "..." } }
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

  // Calculate cell preview
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

  return createPortal(
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Link Cell ({cellPosition.row}, {cellPosition.col})</h3>
          <button
            style={{ ...styles.button, ...styles.dangerButton, marginRight: 0 }}
            onClick={onClose}
          >
            X
          </button>
        </div>

        <div style={styles.modalBody}>
          {/* Cell Preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <div style={{ ...styles.cellPreview, ...getCellStyle() }} />
            <div>
              <div style={{ color: '#ffd700', fontSize: '14px', fontWeight: 'bold' }}>
                Cell Position: Row {cellPosition.row}, Column {cellPosition.col}
              </div>
              <div style={{ color: '#808090', fontSize: '12px', marginTop: '4px' }}>
                {currentLink ? `Currently linked to: ${currentLink.name}` : 'Not linked'}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={styles.tabs}>
            <button
              style={{ ...styles.tab, ...(activeTab === 'items' ? styles.tabActive : {}) }}
              onClick={() => setActiveTab('items')}
            >
              Items ({items.length})
            </button>
            <button
              style={{ ...styles.tab, ...(activeTab === 'locations' ? styles.tabActive : {}) }}
              onClick={() => setActiveTab('locations')}
            >
              Locations ({locations.length})
            </button>
          </div>

          {/* List */}
          <div style={styles.linkList}>
            {filteredItems.length === 0 ? (
              <div style={styles.emptyList}>
                No {activeTab} created yet.<br />
                Create some {activeTab} first to link them.
              </div>
            ) : (
              filteredItems.map(item => {
                const isSelected = selectedTarget?.id === item.id && selectedTarget?.type === activeTab.slice(0, -1);
                return (
                  <div
                    key={item._id || item.id}
                    style={{
                      ...styles.linkItem,
                      ...(hoveredItem === item.id && !isSelected ? styles.linkItemHover : {}),
                      ...(isSelected ? styles.linkItemSelected : {}),
                    }}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={() => setSelectedTarget({
                      type: activeTab === 'items' ? 'item' : 'location',
                      id: item.id,
                      name: item.name
                    })}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', color: isSelected ? 'white' : '#ffd700' }}>
                        {activeTab === 'items' ? '⚔️' : '🏠'} {item.name}
                      </div>
                      <div style={{ fontSize: '11px', color: isSelected ? '#ccc' : '#808090', marginTop: '2px' }}>
                        ID: {item.id}
                      </div>
                    </div>
                    {isSelected && <span style={{ fontSize: '16px' }}>✓</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div style={styles.modalFooter}>
          {currentLink && (
            <button
              style={{ ...styles.button, ...styles.dangerButton }}
              onClick={handleClear}
            >
              Remove Link
            </button>
          )}
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleSave}
            disabled={!selectedTarget}
          >
            Save Link
          </button>
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

  // Get items and locations from allContent
  const contentItems = allContent.items || [];
  const contentLocations = allContent.locations || [];

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...DEFAULT_SPRITE_SHEET,
        ...editingItem,
        linkedCells: editingItem.linkedCells || {},
      });
      // If editing and has image, calculate size
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

    // Recalculate grid size if cell dimensions change
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
    }

    setFormData({ ...DEFAULT_SPRITE_SHEET });
    setImageSize({ width: 0, height: 0 });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_SPRITE_SHEET });
    setImageSize({ width: 0, height: 0 });
    onCancelEdit();
  };

  // Generate cell grid
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
              ...styles.cellHighlight,
              ...(isLinked ? styles.cellLinked : {}),
              ...(isHovered ? styles.cellHovered : {}),
              left: `${x}px`,
              top: `${y}px`,
              width: `${formData.cellWidth}px`,
              height: `${formData.cellHeight}px`,
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
    <div style={styles.container}>
      {/* Form Section */}
      <div style={styles.formSection}>
        <h3 style={styles.sectionTitle}>
          {editingItem ? '✏️ Edit Sprite Sheet' : '➕ Add Sprite Sheet'}
        </h3>

        {/* Basic Info */}
        <div style={styles.row}>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>ID *</label>
              <input
                style={styles.input}
                value={formData.id}
                onChange={(e) => handleChange('id', e.target.value.toLowerCase().replace(/\s/g, '_'))}
                placeholder="unique_sheet_id"
              />
            </div>
          </div>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Name *</label>
              <input
                style={styles.input}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Sprite Sheet Name"
              />
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Sprite Sheet Image</div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <div
            style={{
              ...styles.uploadArea,
              ...(isDragging ? styles.uploadAreaHover : {}),
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {formData.imageData ? (
              <div style={{ color: '#4a7c4a' }}>
                ✓ Image loaded: {formData.imagePath}<br />
                <span style={{ fontSize: '12px', color: '#808090' }}>
                  {imageSize.width}x{imageSize.height}px
                </span>
              </div>
            ) : (
              <div style={{ color: '#a0a0c0' }}>
                📁 Click or drag to upload sprite sheet<br />
                <span style={{ fontSize: '12px', color: '#606080' }}>
                  Supports PNG, JPG, GIF
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Cell Configuration */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Cell Configuration</div>
          <div style={styles.row}>
            <div style={styles.quarterWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Cell Width</label>
                <input
                  style={styles.input}
                  type="number"
                  value={formData.cellWidth}
                  onChange={(e) => handleChange('cellWidth', parseInt(e.target.value) || 1)}
                  min="1"
                />
              </div>
            </div>
            <div style={styles.quarterWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Cell Height</label>
                <input
                  style={styles.input}
                  type="number"
                  value={formData.cellHeight}
                  onChange={(e) => handleChange('cellHeight', parseInt(e.target.value) || 1)}
                  min="1"
                />
              </div>
            </div>
            <div style={styles.quarterWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Margin X</label>
                <input
                  style={styles.input}
                  type="number"
                  value={formData.marginX}
                  onChange={(e) => handleChange('marginX', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
            </div>
            <div style={styles.quarterWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Margin Y</label>
                <input
                  style={styles.input}
                  type="number"
                  value={formData.marginY}
                  onChange={(e) => handleChange('marginY', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
            </div>
          </div>
          <div style={styles.row}>
            <div style={styles.quarterWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Offset X</label>
                <input
                  style={styles.input}
                  type="number"
                  value={formData.offsetX}
                  onChange={(e) => handleChange('offsetX', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
            </div>
            <div style={styles.quarterWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Offset Y</label>
                <input
                  style={styles.input}
                  type="number"
                  value={formData.offsetY}
                  onChange={(e) => handleChange('offsetY', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
            </div>
            <div style={styles.halfWidth}>
              <div style={styles.infoBox}>
                Grid: {formData.columns} x {formData.rows} = {formData.columns * formData.rows} cells<br />
                Linked: {linkedCount} cells
              </div>
            </div>
          </div>
        </div>

        {/* Sprite Preview with Grid */}
        {formData.imageData && (
          <div style={styles.subsection}>
            <div style={styles.subsectionTitle}>
              Preview - Click cells to link them to Items or Locations
            </div>
            <div style={styles.spritePreview}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  ref={imageRef}
                  src={formData.imageData}
                  alt="Sprite Sheet"
                  style={{ display: 'block' }}
                />
                <div style={styles.gridOverlay}>
                  {renderCells()}
                </div>
              </div>
            </div>
            <div style={styles.infoBox}>
              🟡 Yellow = Hoverable cell | 🟢 Green = Linked cell<br />
              Click a cell to open the link modal
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ marginTop: '20px' }}>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleSubmit}
          >
            {editingItem ? '💾 Update Sprite Sheet' : '➕ Add Sprite Sheet'}
          </button>
          {editingItem && (
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* List Section */}
      <div style={styles.listSection}>
        <h3 style={styles.sectionTitle}>📋 Sprite Sheets ({items.length})</h3>

        {items.length === 0 ? (
          <div style={styles.emptyList}>
            No sprite sheets added yet.<br />
            Upload a sprite sheet to get started.
          </div>
        ) : (
          items.map(item => (
            <div
              key={item._id}
              style={{
                ...styles.listItem,
                ...(hoveredItem === item._id ? styles.listItemHover : {}),
                ...(editingItem?._id === item._id ? { borderColor: '#ffd700' } : {}),
              }}
              onMouseEnter={() => setHoveredItem(item._id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div style={styles.listItemName}>
                🖼️ {item.name}
              </div>
              <div style={styles.listItemDetails}>
                ID: {item.id} | {item.cellWidth}x{item.cellHeight} | {item.columns}x{item.rows} cells
              </div>
              <div style={{ ...styles.listItemDetails, color: '#4a7c4a' }}>
                {Object.keys(item.linkedCells || {}).length} linked cells
              </div>
              <div style={styles.listItemActions}>
                <button
                  style={{ ...styles.smallButton, backgroundColor: '#4a7c4a', color: 'white' }}
                  onClick={() => onEdit(item)}
                >
                  Edit
                </button>
                <button
                  style={{ ...styles.smallButton, backgroundColor: '#4a4a7c', color: 'white' }}
                  onClick={() => onDuplicate(item)}
                >
                  Duplicate
                </button>
                <button
                  style={{ ...styles.smallButton, backgroundColor: '#7c4a4a', color: 'white' }}
                  onClick={() => onDelete(item._id)}
                >
                  Delete
                </button>
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
