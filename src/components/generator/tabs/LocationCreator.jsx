import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { collectTags } from '../DatapackLoader';

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
    width: '320px',
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
  select: {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #4a4a6a',
    backgroundColor: '#1a1a2e',
    color: 'white',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #4a4a6a',
    backgroundColor: '#1a1a2e',
    color: 'white',
    fontSize: '14px',
    minHeight: '80px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  row: {
    display: 'flex',
    gap: '15px',
  },
  halfWidth: {
    flex: 1,
  },
  thirdWidth: {
    flex: 1,
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
  smallButton: {
    padding: '4px 8px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '11px',
  },
  tagInput: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
    padding: '8px',
    backgroundColor: '#1a1a2e',
    borderRadius: '4px',
    border: '1px solid #4a4a6a',
    minHeight: '40px',
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 8px',
    backgroundColor: '#3a3a5a',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#d0d0e0',
  },
  tagRemove: {
    marginLeft: '5px',
    cursor: 'pointer',
    color: '#ff6666',
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
  checkboxGroup: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    color: '#a0a0c0',
    fontSize: '13px',
  },
  // Map placement styles
  mapContainer: {
    position: 'relative',
    backgroundColor: '#0a0a15',
    borderRadius: '8px',
    border: '1px solid #4a4a6a',
    overflow: 'hidden',
    cursor: 'crosshair',
  },
  mapImage: {
    display: 'block',
    maxWidth: '100%',
    height: 'auto',
  },
  mapPlaceholder: {
    width: '100%',
    height: '300px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#606080',
    fontSize: '14px',
    textAlign: 'center',
  },
  mapMarker: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    border: '2px solid #ffd700',
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    cursor: 'move',
    transition: 'all 0.2s ease',
  },
  mapMarkerSmall: {
    width: '20px',
    height: '20px',
  },
  mapMarkerMedium: {
    width: '32px',
    height: '32px',
  },
  mapMarkerLarge: {
    width: '48px',
    height: '48px',
  },
  tabs: {
    display: 'flex',
    gap: '5px',
    marginBottom: '10px',
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
  iconPreview: {
    width: '48px',
    height: '48px',
    backgroundColor: '#1a1a2e',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #4a4a6a',
    overflow: 'hidden',
  },
  uploadArea: {
    border: '2px dashed #4a4a6a',
    borderRadius: '8px',
    padding: '15px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: '#1a1a2e',
    fontSize: '12px',
  },
  uploadAreaHover: {
    borderColor: '#ffd700',
    backgroundColor: '#252540',
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
    width: '700px',
    maxHeight: '85vh',
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
  spriteGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
    gap: '5px',
    maxHeight: '300px',
    overflowY: 'auto',
    padding: '10px',
    backgroundColor: '#0a0a15',
    borderRadius: '4px',
  },
  spriteCell: {
    width: '48px',
    height: '48px',
    border: '1px solid #4a4a6a',
    borderRadius: '4px',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
  },
  spriteCellSelected: {
    border: '2px solid #ffd700',
    boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
  },
};

// Suggested location types - users can also type custom values
const SUGGESTED_LOCATION_TYPES = [
  'outdoor', 'indoor', 'dungeon', 'town', 'cave', 'building', 'forest',
  'water', 'region', 'mountain', 'desert', 'swamp', 'ruins', 'castle',
];

const LOCATION_SCOPES = [
  { value: 'region', label: 'Region', description: 'A large area on the world map containing multiple locations' },
  { value: 'local', label: 'Local', description: 'A location within a region, shown on the local map' },
  { value: 'sub', label: 'Sub-location', description: 'A location inside another location (e.g., cellar, upper floor)' },
];

const ENEMY_VARIANTS = [
  { value: 'weak', label: 'Weak', modifier: 0.7, color: '#6a9a6a' },
  { value: 'normal', label: 'Normal', modifier: 1.0, color: '#a0a0c0' },
  { value: 'strong', label: 'Strong', modifier: 1.3, color: '#ca8a4a' },
  { value: 'elite', label: 'Elite', modifier: 1.6, color: '#ca6a6a' },
];

const SERVICES = [
  { id: 'shop', label: 'Shop', icon: '🛒' },
  { id: 'inn', label: 'Inn/Rest', icon: '🛏️' },
  { id: 'quest', label: 'Quest Giver', icon: '❗' },
  { id: 'blacksmith', label: 'Blacksmith', icon: '⚒️' },
  { id: 'healer', label: 'Healer', icon: '💚' },
  { id: 'save', label: 'Save Point', icon: '💾' },
  { id: 'tavern', label: 'Tavern', icon: '🍺' },
  { id: 'temple', label: 'Temple', icon: '⛪' },
  { id: 'library', label: 'Library', icon: '📚' },
  { id: 'guild', label: 'Guild Hall', icon: '🏛️' },
  { id: 'brothel', label: 'Brothel (NSFW)', icon: '🔞' },
  { id: 'dungeon_entrance', label: 'Dungeon Entrance', icon: '🚪' },
];

// Fallback tags when no dynamic tags available
const FALLBACK_TAGS = [
  'safe', 'dangerous', 'town', 'wilderness', 'dungeon',
  'shop', 'rest', 'quest', 'combat', 'exploration',
  'nsfw', 'corruption', 'hidden', 'locked',
  'forest', 'mountain', 'water', 'cave', 'ruins',
];

const ICON_SIZES = [
  { value: 'small', label: 'Small', size: 20 },
  { value: 'medium', label: 'Medium', size: 32 },
  { value: 'large', label: 'Large', size: 48 },
];

const NAVIGATION_DIRECTIONS = [
  { id: 'up', label: 'Up', icon: '⬆️' },
  { id: 'down', label: 'Down', icon: '⬇️' },
  { id: 'left', label: 'Left', icon: '⬅️' },
  { id: 'right', label: 'Right', icon: '➡️' },
  { id: 'forward', label: 'Forward', icon: '⏩' },
  { id: 'back', label: 'Back', icon: '↩️' },
  { id: 'in', label: 'Enter', icon: '🚪' },
  { id: 'out', label: 'Exit', icon: '🚶' },
];

const DEFAULT_LOCATION = {
  id: '',
  name: '',
  description: '',
  parentRegion: '', // For local locations - which region they belong to
  type: 'outdoor',
  dangerLevel: 1,
  tags: [],
  hidden: false,
  services: [],
  npcs: [], // Array of NPC IDs
  // Enemy encounter configuration
  encounterChance: 0, // 0-100 percentage
  maxEnemyCount: 1, // 1-5 max enemies per encounter
  enemyTables: [], // Array of { enemyId, weight, variantChances: { weak, normal, strong, elite } }
  onEnter: [],
  requirements: null,
  background: '',
  ambientSound: '',
  // Navigation to sub-locations
  navigation: {},
  parentLocation: '', // For sub-locations - which location they're inside
  locationType: 'local', // 'region', 'local', or 'sub'
  // For regions - child locations
  childLocations: [],
  neighborRegions: [],
  // Map placement properties
  mapPlacement: {
    mapType: null, // 'local' or 'world'
    x: 0,
    y: 0,
  },
  iconSize: 'medium',
  icon: {
    type: 'default', // 'default', 'uploaded', 'sprite'
    data: null, // base64 for uploaded, or sprite reference
    spriteSheet: null,
    cellRow: 0,
    cellCol: 0,
  },
};

// Icon Selection Modal
const IconSelectorModal = ({
  isOpen,
  onClose,
  sprites = [],
  currentIcon,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedSprite, setSelectedSprite] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [uploadedIcon, setUploadedIcon] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (currentIcon) {
      if (currentIcon.type === 'uploaded' && currentIcon.data) {
        setUploadedIcon(currentIcon.data);
        setActiveTab('upload');
      } else if (currentIcon.type === 'sprite' && currentIcon.spriteSheet) {
        setSelectedSprite(currentIcon.spriteSheet);
        setSelectedCell({ row: currentIcon.cellRow, col: currentIcon.cellCol });
        setActiveTab('sprite');
      }
    }
  }, [currentIcon, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedIcon(ev.target.result);
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
        setUploadedIcon(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (activeTab === 'upload' && uploadedIcon) {
      onSave({ type: 'uploaded', data: uploadedIcon });
    } else if (activeTab === 'sprite' && selectedSprite && selectedCell) {
      const sprite = sprites.find(s => s.id === selectedSprite);
      onSave({
        type: 'sprite',
        spriteSheet: selectedSprite,
        cellRow: selectedCell.row,
        cellCol: selectedCell.col,
        data: sprite?.imageData,
        cellWidth: sprite?.cellWidth,
        cellHeight: sprite?.cellHeight,
        offsetX: sprite?.offsetX,
        offsetY: sprite?.offsetY,
        marginX: sprite?.marginX,
        marginY: sprite?.marginY,
      });
    }
    onClose();
  };

  const selectedSpriteData = sprites.find(s => s.id === selectedSprite);

  const renderSpriteCells = () => {
    if (!selectedSpriteData) return null;

    const cells = [];
    for (let row = 0; row < selectedSpriteData.rows; row++) {
      for (let col = 0; col < selectedSpriteData.columns; col++) {
        const x = (selectedSpriteData.offsetX || 0) + col * (selectedSpriteData.cellWidth + (selectedSpriteData.marginX || 0));
        const y = (selectedSpriteData.offsetY || 0) + row * (selectedSpriteData.cellHeight + (selectedSpriteData.marginY || 0));
        const isSelected = selectedCell?.row === row && selectedCell?.col === col;

        cells.push(
          <div
            key={`${row}_${col}`}
            style={{
              ...styles.spriteCell,
              ...(isSelected ? styles.spriteCellSelected : {}),
              backgroundImage: `url(${selectedSpriteData.imageData})`,
              backgroundPosition: `-${x}px -${y}px`,
              backgroundSize: 'auto',
            }}
            onClick={() => setSelectedCell({ row, col })}
            title={`Cell (${row}, ${col})`}
          />
        );
      }
    }
    return cells;
  };

  return createPortal(
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Select Location Icon</h3>
          <button
            style={{ ...styles.button, backgroundColor: '#7c4a4a', color: 'white', marginRight: 0 }}
            onClick={onClose}
          >
            X
          </button>
        </div>

        <div style={styles.modalBody}>
          <div style={styles.tabs}>
            <button
              style={{ ...styles.tab, ...(activeTab === 'upload' ? styles.tabActive : {}) }}
              onClick={() => setActiveTab('upload')}
            >
              Upload Icon
            </button>
            <button
              style={{ ...styles.tab, ...(activeTab === 'sprite' ? styles.tabActive : {}) }}
              onClick={() => setActiveTab('sprite')}
              disabled={sprites.length === 0}
            >
              From Sprite Sheet ({sprites.length})
            </button>
          </div>

          {activeTab === 'upload' && (
            <div>
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
                  padding: '30px',
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                {uploadedIcon ? (
                  <div>
                    <img
                      src={uploadedIcon}
                      alt="Preview"
                      style={{ maxWidth: '100px', maxHeight: '100px', marginBottom: '10px' }}
                    />
                    <div style={{ color: '#4a7c4a' }}>Icon uploaded - Click to change</div>
                  </div>
                ) : (
                  <div style={{ color: '#a0a0c0' }}>
                    📁 Click or drag to upload icon<br />
                    <span style={{ fontSize: '11px', color: '#606080' }}>
                      Recommended: 32x32 or 48x48 PNG
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sprite' && (
            <div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Select Sprite Sheet</label>
                <select
                  style={styles.select}
                  value={selectedSprite || ''}
                  onChange={(e) => {
                    setSelectedSprite(e.target.value);
                    setSelectedCell(null);
                  }}
                >
                  <option value="">Choose a sprite sheet...</option>
                  {sprites.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.columns}x{s.rows} cells)
                    </option>
                  ))}
                </select>
              </div>

              {selectedSpriteData && (
                <div>
                  <label style={styles.label}>Click to select a cell:</label>
                  <div style={styles.spriteGrid}>
                    {renderSpriteCells()}
                  </div>
                  {selectedCell && (
                    <div style={styles.infoBox}>
                      Selected: Row {selectedCell.row}, Column {selectedCell.col}
                    </div>
                  )}
                </div>
              )}

              {sprites.length === 0 && (
                <div style={styles.emptyList}>
                  No sprite sheets available.<br />
                  Add sprite sheets in the Sprites tab first.
                </div>
              )}
            </div>
          )}
        </div>

        <div style={styles.modalFooter}>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleSave}
            disabled={
              (activeTab === 'upload' && !uploadedIcon) ||
              (activeTab === 'sprite' && (!selectedSprite || !selectedCell))
            }
          >
            Save Icon
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const LocationCreator = ({
  items = [],
  allContent = {},
  npcs = [],
  enemies = [],
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
  const [formData, setFormData] = useState({ ...DEFAULT_LOCATION });
  const [tagInput, setTagInput] = useState('');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [mapTab, setMapTab] = useState('local');
  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [selectedNpc, setSelectedNpc] = useState('');
  const [selectedEnemy, setSelectedEnemy] = useState('');
  const mapRef = useRef(null);

  // Compute dynamic tag suggestions from datapack content and user-created locations
  const suggestedTags = useMemo(() => {
    return collectTags({
      datapackContent,
      userContent: items,
      commonTags: FALLBACK_TAGS,
      contentType: 'locations',
    });
  }, [datapackContent, items]);

  const sprites = allContent.sprites || [];

  // Combine datapack content with user-created content for selection dropdowns
  const allNPCs = [...(datapackContent.npcs || []), ...npcs];
  const allEnemies = [...(datapackContent.enemies || []), ...enemies];
  const allLocations = [...(datapackContent.locations || []), ...items];

  // Get regions from all locations (locations with locationType === 'region')
  const regions = allLocations.filter(loc => loc.locationType === 'region');

  // Get local locations (for parent location selection)
  const localLocations = allLocations.filter(loc => loc.locationType === 'local' || loc.locationType === 'region');

  // Placeholder map images - in real app these would come from game data
  const LOCAL_MAP = '/maps/local_map.png';
  const GLOBAL_MAP = '/maps/global_map.png';

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...DEFAULT_LOCATION,
        ...editingItem,
        services: editingItem.services || [],
        npcs: editingItem.npcs || [],
        enemyTables: editingItem.enemyTables || [],
        encounterChance: editingItem.encounterChance || 0,
        maxEnemyCount: editingItem.maxEnemyCount || 1,
        navigation: editingItem.navigation || {},
        parentLocation: editingItem.parentLocation || '',
        parentRegion: editingItem.parentRegion || '',
        locationType: editingItem.locationType || 'local',
        childLocations: editingItem.childLocations || [],
        neighborRegions: editingItem.neighborRegions || [],
        mapPlacement: editingItem.mapPlacement || { mapType: null, x: 0, y: 0 },
        icon: editingItem.icon || { type: 'default', data: null },
      });
      if (editingItem.mapPlacement?.mapType) {
        setMapTab(editingItem.mapPlacement.mapType);
      }
    } else {
      setFormData({ ...DEFAULT_LOCATION });
    }
  }, [editingItem]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = (tag) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove),
    }));
  };

  const toggleService = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  // NPC handlers - using selectable list
  const handleAddNpc = (npcId) => {
    if (npcId && !formData.npcs.includes(npcId)) {
      setFormData(prev => ({
        ...prev,
        npcs: [...prev.npcs, npcId],
      }));
    }
    setSelectedNpc('');
  };

  const handleRemoveNpc = (npc) => {
    setFormData(prev => ({
      ...prev,
      npcs: prev.npcs.filter(n => n !== npc),
    }));
  };

  // Enemy table handlers - weighted encounter system
  const handleAddEnemyToTable = (enemyId) => {
    if (!enemyId) return;
    // Check if enemy is already in the table
    if (formData.enemyTables.some(e => e.enemyId === enemyId)) return;

    const newEntry = {
      enemyId,
      weight: 50, // Default weight
      variantChances: {
        weak: 15,
        normal: 60,
        strong: 20,
        elite: 5,
      },
    };

    setFormData(prev => ({
      ...prev,
      enemyTables: [...prev.enemyTables, newEntry],
    }));
    setSelectedEnemy('');
  };

  const handleRemoveEnemyFromTable = (enemyId) => {
    setFormData(prev => ({
      ...prev,
      enemyTables: prev.enemyTables.filter(e => e.enemyId !== enemyId),
    }));
  };

  const handleUpdateEnemyWeight = (enemyId, weight) => {
    setFormData(prev => ({
      ...prev,
      enemyTables: prev.enemyTables.map(e =>
        e.enemyId === enemyId ? { ...e, weight: Math.max(1, Math.min(100, parseInt(weight) || 1)) } : e
      ),
    }));
  };

  const handleUpdateVariantChance = (enemyId, variant, chance) => {
    setFormData(prev => ({
      ...prev,
      enemyTables: prev.enemyTables.map(e =>
        e.enemyId === enemyId
          ? { ...e, variantChances: { ...e.variantChances, [variant]: Math.max(0, Math.min(100, parseInt(chance) || 0)) } }
          : e
      ),
    }));
  };

  const handleNavigationChange = (direction, locationId) => {
    setFormData(prev => {
      const newNavigation = { ...prev.navigation };
      if (locationId) {
        newNavigation[direction] = locationId;
      } else {
        delete newNavigation[direction];
      }
      return { ...prev, navigation: newNavigation };
    });
  };

  const handleMapClick = (e) => {
    if (!mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setFormData(prev => ({
      ...prev,
      mapPlacement: {
        mapType: mapTab,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
      },
    }));
  };

  const handleClearPlacement = () => {
    setFormData(prev => ({
      ...prev,
      mapPlacement: { mapType: null, x: 0, y: 0 },
    }));
  };

  const handleIconSave = (iconData) => {
    setFormData(prev => ({
      ...prev,
      icon: iconData,
    }));
  };

  const handleSubmit = () => {
    if (!formData.id || !formData.name) {
      alert('ID and Name are required');
      return;
    }

    if (!editingItem && items.some(item => item.id === formData.id)) {
      alert('A location with this ID already exists');
      return;
    }

    if (editingItem) {
      onUpdate(editingItem._id, formData);
    } else {
      onAdd(formData);
    }

    setFormData({ ...DEFAULT_LOCATION });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_LOCATION });
    onCancelEdit();
  };

  const getIconPreview = () => {
    if (formData.icon.type === 'uploaded' && formData.icon.data) {
      return (
        <img
          src={formData.icon.data}
          alt="Icon"
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        />
      );
    } else if (formData.icon.type === 'sprite' && formData.icon.data) {
      const x = (formData.icon.offsetX || 0) + formData.icon.cellCol * (formData.icon.cellWidth + (formData.icon.marginX || 0));
      const y = (formData.icon.offsetY || 0) + formData.icon.cellRow * (formData.icon.cellHeight + (formData.icon.marginY || 0));
      return (
        <div
          style={{
            width: formData.icon.cellWidth || 32,
            height: formData.icon.cellHeight || 32,
            backgroundImage: `url(${formData.icon.data})`,
            backgroundPosition: `-${x}px -${y}px`,
            backgroundSize: 'auto',
          }}
        />
      );
    }
    return <span style={{ color: '#606080', fontSize: '24px' }}>🏠</span>;
  };

  const getMarkerSize = () => {
    const sizeData = ICON_SIZES.find(s => s.value === formData.iconSize);
    return sizeData?.size || 32;
  };

  return (
    <div style={styles.container}>
      {/* Form Section */}
      <div style={styles.formSection}>
        <h3 style={styles.sectionTitle}>
          {editingItem ? '✏️ Edit Location' : '➕ Create New Location'}
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
                placeholder="unique_location_id"
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
                placeholder="Location Name"
              />
            </div>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Description</label>
          <textarea
            style={styles.textarea}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe this location..."
          />
        </div>

        <div style={styles.row}>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Location Scope</label>
              <select
                style={styles.select}
                value={formData.locationType}
                onChange={(e) => handleChange('locationType', e.target.value)}
              >
                {LOCATION_SCOPES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <div style={{ fontSize: '11px', color: '#808090', marginTop: '4px' }}>
                {LOCATION_SCOPES.find(s => s.value === formData.locationType)?.description}
              </div>
            </div>
          </div>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Type</label>
              <input
                style={styles.input}
                list="location-type-suggestions"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                placeholder="e.g., outdoor, dungeon, town"
              />
              <datalist id="location-type-suggestions">
                {SUGGESTED_LOCATION_TYPES.map(type => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* Parent Region (for local locations) */}
        {formData.locationType === 'local' && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Parent Region</label>
            <select
              style={styles.select}
              value={formData.parentRegion}
              onChange={(e) => handleChange('parentRegion', e.target.value)}
            >
              <option value="">Select Parent Region...</option>
              {regions.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
              ))}
            </select>
          </div>
        )}

        <div style={styles.row}>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Danger Level (1-5)</label>
              <input
                style={styles.input}
                type="number"
                min="1"
                max="5"
                value={formData.dangerLevel}
                onChange={(e) => handleChange('dangerLevel', parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <div style={styles.halfWidth}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <input
                  type="checkbox"
                  checked={formData.hidden}
                  onChange={(e) => handleChange('hidden', e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Hidden (requires discovery)
              </label>
            </div>
          </div>
        </div>

        {/* Icon & Map Placement */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Icon & Map Placement</div>

          <div style={styles.row}>
            <div style={{ ...styles.halfWidth, maxWidth: '200px' }}>
              <label style={styles.label}>Location Icon</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={styles.iconPreview}>
                  {getIconPreview()}
                </div>
                <button
                  style={{ ...styles.smallButton, backgroundColor: '#4a4a6a', color: 'white', padding: '8px 12px' }}
                  onClick={() => setIconModalOpen(true)}
                >
                  Change Icon
                </button>
              </div>
            </div>
            <div style={styles.halfWidth}>
              <label style={styles.label}>Icon Size on Map</label>
              <select
                style={styles.select}
                value={formData.iconSize}
                onChange={(e) => handleChange('iconSize', e.target.value)}
              >
                {ICON_SIZES.map(s => (
                  <option key={s.value} value={s.value}>{s.label} ({s.size}px)</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label style={styles.label}>Map Placement - Click on map to place icon</label>
            <div style={styles.tabs}>
              <button
                style={{ ...styles.tab, ...(mapTab === 'local' ? styles.tabActive : {}) }}
                onClick={() => setMapTab('local')}
              >
                Local Map
              </button>
              <button
                style={{ ...styles.tab, ...(mapTab === 'global' ? styles.tabActive : {}) }}
                onClick={() => setMapTab('global')}
              >
                Global Map
              </button>
              {formData.mapPlacement.mapType && (
                <button
                  style={{ ...styles.smallButton, backgroundColor: '#7c4a4a', color: 'white', marginLeft: 'auto', padding: '8px 12px' }}
                  onClick={handleClearPlacement}
                >
                  Clear Placement
                </button>
              )}
            </div>

            <div
              ref={mapRef}
              style={styles.mapContainer}
              onClick={handleMapClick}
            >
              {/* Placeholder map - in production this would load actual map images */}
              <div style={styles.mapPlaceholder}>
                <div>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                    {mapTab === 'local' ? '🗺️' : '🌍'}
                  </div>
                  <div>
                    {mapTab === 'local' ? 'Local Map' : 'Global Map'}<br />
                    <span style={{ fontSize: '11px' }}>
                      Click anywhere to place location icon<br />
                      (Map image: {mapTab === 'local' ? LOCAL_MAP : GLOBAL_MAP})
                    </span>
                  </div>
                </div>
              </div>

              {/* Show marker if placed on current map */}
              {formData.mapPlacement.mapType === mapTab && (
                <div
                  style={{
                    ...styles.mapMarker,
                    ...(formData.iconSize === 'small' ? styles.mapMarkerSmall :
                      formData.iconSize === 'large' ? styles.mapMarkerLarge :
                        styles.mapMarkerMedium),
                    left: `${formData.mapPlacement.x}%`,
                    top: `${formData.mapPlacement.y}%`,
                  }}
                >
                  {getIconPreview()}
                </div>
              )}
            </div>

            {formData.mapPlacement.mapType && (
              <div style={styles.infoBox}>
                Placed on <strong>{formData.mapPlacement.mapType}</strong> map at
                position ({formData.mapPlacement.x.toFixed(1)}%, {formData.mapPlacement.y.toFixed(1)}%)
              </div>
            )}
          </div>
        </div>

        {/* Navigation - Sub-location Links */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Navigation (Sub-locations)</div>
          <div style={{ marginBottom: '15px', fontSize: '12px', color: '#808090' }}>
            Link directions to other locations. Players can navigate using these directions when at this location.
          </div>

          {/* Parent Location (for sub-locations) */}
          {formData.locationType === 'sub' && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Parent Location</label>
              <select
                style={styles.select}
                value={formData.parentLocation}
                onChange={(e) => handleChange('parentLocation', e.target.value)}
              >
                <option value="">Select parent location...</option>
                {localLocations.filter(loc => loc.id !== formData.id).map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name} ({loc.id})</option>
                ))}
              </select>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            marginTop: '10px'
          }}>
            {NAVIGATION_DIRECTIONS.map(dir => (
              <div key={dir.id} style={styles.formGroup}>
                <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '16px' }}>{dir.icon}</span> {dir.label}
                </label>
                <select
                  style={styles.select}
                  value={formData.navigation[dir.id] || ''}
                  onChange={(e) => handleNavigationChange(dir.id, e.target.value)}
                >
                  <option value="">-- No link --</option>
                  {items.filter(loc => loc.id !== formData.id).map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.id})</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {Object.keys(formData.navigation).length > 0 && (
            <div style={styles.infoBox}>
              <strong>Active Navigation Links:</strong>
              <div style={{ marginTop: '5px' }}>
                {Object.entries(formData.navigation).map(([dir, locId]) => {
                  const dirInfo = NAVIGATION_DIRECTIONS.find(d => d.id === dir);
                  const targetLoc = items.find(l => l.id === locId);
                  return (
                    <div key={dir} style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                      <span>{dirInfo?.icon}</span>
                      <span>{dirInfo?.label}:</span>
                      <span style={{ color: '#ffd700' }}>{targetLoc?.name || locId}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Services */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Available Services</div>
          <div style={styles.checkboxGroup}>
            {SERVICES.map(service => (
              <label key={service.id} style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.services.includes(service.id)}
                  onChange={() => toggleService(service.id)}
                />
                {service.icon} {service.label}
              </label>
            ))}
          </div>
        </div>

        {/* NPCs */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>NPCs at this Location</div>
          <div style={{ marginBottom: '10px', fontSize: '12px', color: '#808090' }}>
            Select NPCs that can be found at this location. Create NPCs in the NPCs tab first.
          </div>

          {/* NPC Selection */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <select
              style={{ ...styles.select, flex: 1 }}
              value={selectedNpc}
              onChange={(e) => setSelectedNpc(e.target.value)}
            >
              <option value="">Select an NPC to add...</option>
              {allNPCs.filter(npc => !formData.npcs.includes(npc.id)).map(npc => (
                <option key={npc.id} value={npc.id}>{npc.name} ({npc.id})</option>
              ))}
            </select>
            <button
              style={{ ...styles.button, ...styles.primaryButton, padding: '8px 16px' }}
              onClick={() => handleAddNpc(selectedNpc)}
              disabled={!selectedNpc}
            >
              + Add
            </button>
          </div>

          {/* Selected NPCs */}
          {formData.npcs.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {formData.npcs.map(npcId => {
                const npcData = allNPCs.find(n => n.id === npcId);
                return (
                  <div key={npcId} style={{
                    ...styles.tag,
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>👤</span>
                    <span>{npcData?.name || npcId}</span>
                    <span
                      style={{ ...styles.tagRemove, marginLeft: '4px', cursor: 'pointer' }}
                      onClick={() => handleRemoveNpc(npcId)}
                    >×</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: '#606080', fontSize: '12px', fontStyle: 'italic' }}>
              No NPCs added. {allNPCs.length === 0 && 'Create NPCs in the NPCs tab or add them in datapacks.'}
            </div>
          )}
        </div>

        {/* Enemy Encounters */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Enemy Encounters</div>
          <div style={{ marginBottom: '15px', fontSize: '12px', color: '#808090' }}>
            Configure random enemy encounters. Set encounter chance, max enemies, and weighted enemy spawn tables.
          </div>

          {/* Encounter Settings */}
          <div style={styles.row}>
            <div style={styles.halfWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Encounter Chance (%)</label>
                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  max="100"
                  value={formData.encounterChance}
                  onChange={(e) => handleChange('encounterChance', Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                />
                <div style={{ fontSize: '11px', color: '#808090', marginTop: '4px' }}>
                  0 = No encounters, 100 = Always encounter
                </div>
              </div>
            </div>
            <div style={styles.halfWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Max Enemies per Encounter</label>
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  max="10"
                  value={formData.maxEnemyCount}
                  onChange={(e) => handleChange('maxEnemyCount', Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                />
                <div style={{ fontSize: '11px', color: '#808090', marginTop: '4px' }}>
                  Random between 1 and this value
                </div>
              </div>
            </div>
          </div>

          {/* Enemy Selection */}
          <div style={{ marginTop: '15px' }}>
            <label style={styles.label}>Enemy Spawn Table</label>
            <div style={{ marginBottom: '10px', fontSize: '12px', color: '#808090' }}>
              Add enemies with weights (higher weight = more likely to spawn). Create enemies in the Enemies tab first.
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <select
                style={{ ...styles.select, flex: 1 }}
                value={selectedEnemy}
                onChange={(e) => setSelectedEnemy(e.target.value)}
              >
                <option value="">Select an enemy to add...</option>
                {allEnemies.filter(e => !formData.enemyTables.some(et => et.enemyId === e.id)).map(enemy => (
                  <option key={enemy.id} value={enemy.id}>{enemy.name} ({enemy.id})</option>
                ))}
              </select>
              <button
                style={{ ...styles.button, ...styles.primaryButton, padding: '8px 16px' }}
                onClick={() => handleAddEnemyToTable(selectedEnemy)}
                disabled={!selectedEnemy}
              >
                + Add Enemy
              </button>
            </div>

            {/* Enemy Table */}
            {formData.enemyTables.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {formData.enemyTables.map(entry => {
                  const enemyData = allEnemies.find(e => e.id === entry.enemyId);
                  const totalVariantChance = Object.values(entry.variantChances).reduce((a, b) => a + b, 0);
                  return (
                    <div key={entry.enemyId} style={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #4a4a6a',
                      borderRadius: '6px',
                      padding: '12px',
                    }}>
                      {/* Enemy Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px' }}>👹</span>
                          <span style={{ color: '#ffd700', fontWeight: 'bold' }}>{enemyData?.name || entry.enemyId}</span>
                        </div>
                        <button
                          style={{ ...styles.smallButton, backgroundColor: '#7c4a4a', color: 'white', padding: '4px 8px' }}
                          onClick={() => handleRemoveEnemyFromTable(entry.enemyId)}
                        >
                          Remove
                        </button>
                      </div>

                      {/* Weight */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <label style={{ ...styles.label, marginBottom: 0, minWidth: '100px' }}>Spawn Weight:</label>
                        <input
                          style={{ ...styles.input, width: '80px' }}
                          type="number"
                          min="1"
                          max="100"
                          value={entry.weight}
                          onChange={(e) => handleUpdateEnemyWeight(entry.enemyId, e.target.value)}
                        />
                        <span style={{ fontSize: '12px', color: '#808090' }}>Higher = more likely</span>
                      </div>

                      {/* Variant Chances */}
                      <div>
                        <label style={{ ...styles.label, marginBottom: '8px' }}>
                          Variant Chances (total: {totalVariantChance}%)
                          {totalVariantChance !== 100 && (
                            <span style={{ color: '#ca6a6a', marginLeft: '8px' }}>Should equal 100%</span>
                          )}
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                          {ENEMY_VARIANTS.map(variant => (
                            <div key={variant.value} style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '11px', color: variant.color, marginBottom: '4px' }}>
                                {variant.label}
                              </div>
                              <input
                                style={{ ...styles.input, width: '60px', textAlign: 'center', padding: '4px' }}
                                type="number"
                                min="0"
                                max="100"
                                value={entry.variantChances[variant.value]}
                                onChange={(e) => handleUpdateVariantChance(entry.enemyId, variant.value, e.target.value)}
                              />
                              <div style={{ fontSize: '10px', color: '#606080', marginTop: '2px' }}>
                                {variant.modifier}x stats
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Total Weight Summary */}
                <div style={styles.infoBox}>
                  <strong>Spawn Probabilities:</strong>
                  <div style={{ marginTop: '5px' }}>
                    {(() => {
                      const totalWeight = formData.enemyTables.reduce((sum, e) => sum + e.weight, 0);
                      return formData.enemyTables.map(entry => {
                        const enemyData = allEnemies.find(e => e.id === entry.enemyId);
                        const percentage = totalWeight > 0 ? ((entry.weight / totalWeight) * 100).toFixed(1) : 0;
                        return (
                          <div key={entry.enemyId} style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                            <span style={{ color: '#a0a0c0' }}>{enemyData?.name || entry.enemyId}:</span>
                            <span style={{ color: '#ffd700' }}>{percentage}%</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#606080', fontSize: '12px', fontStyle: 'italic', padding: '10px', textAlign: 'center' }}>
                No enemies in spawn table. {allEnemies.length === 0 ? 'Create enemies in the Enemies tab or add them in datapacks.' : 'Add enemies above.'}
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Tags</div>
          <div style={styles.tagInput}>
            {formData.tags.map(tag => (
              <span key={tag} style={styles.tag}>
                {tag}
                <span style={styles.tagRemove} onClick={() => handleRemoveTag(tag)}>×</span>
              </span>
            ))}
            <input
              style={{ ...styles.input, border: 'none', backgroundColor: 'transparent', flex: 1, minWidth: '100px', padding: '2px' }}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag(tagInput)}
              placeholder="Add tag..."
            />
          </div>
          <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {suggestedTags.filter(t => !formData.tags.includes(t)).slice(0, 20).map(tag => (
              <button
                key={tag}
                style={{ ...styles.smallButton, backgroundColor: '#3a3a5a', color: '#a0a0c0' }}
                onClick={() => handleAddTag(tag)}
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Visuals */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Visuals & Audio</div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Background Image</label>
            <input
              style={styles.input}
              value={formData.background}
              onChange={(e) => handleChange('background', e.target.value)}
              placeholder="/backgrounds/location_bg.png"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Ambient Sound</label>
            <input
              style={styles.input}
              value={formData.ambientSound}
              onChange={(e) => handleChange('ambientSound', e.target.value)}
              placeholder="forest_ambience"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: '20px' }}>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleSubmit}
          >
            {editingItem ? '💾 Update Location' : '➕ Add Location'}
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
        <h3 style={styles.sectionTitle}>📋 Created Locations ({items.length})</h3>

        {items.length === 0 ? (
          <div style={styles.emptyList}>
            No locations created yet.<br />
            Use the form to create your first location.
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
                🏠 {item.name}
              </div>
              <div style={styles.listItemDetails}>
                ID: {item.id} | Type: {item.type} | Scope: {item.locationType || 'local'}
                {item.locationType === 'sub' && item.parentLocation && ` (in ${item.parentLocation})`}
                {item.locationType === 'local' && item.parentRegion && ` (${item.parentRegion})`}
              </div>
              {item.encounterChance > 0 && (
                <div style={{ ...styles.listItemDetails, color: '#ca6a6a' }}>
                  ⚔️ {item.encounterChance}% encounter | Max {item.maxEnemyCount} enemies | {item.enemyTables?.length || 0} enemy types
                </div>
              )}
              {item.npcs?.length > 0 && (
                <div style={{ ...styles.listItemDetails, color: '#6aca8a' }}>
                  👤 NPCs: {item.npcs.length}
                </div>
              )}
              {item.mapPlacement?.mapType && (
                <div style={{ ...styles.listItemDetails, color: '#4a7c4a' }}>
                  📍 {item.mapPlacement.mapType} map ({item.mapPlacement.x.toFixed(1)}%, {item.mapPlacement.y.toFixed(1)}%)
                </div>
              )}
              {item.navigation && Object.keys(item.navigation).length > 0 && (
                <div style={{ ...styles.listItemDetails, color: '#6a8cca' }}>
                  🧭 Navigation: {Object.entries(item.navigation).map(([dir, loc]) => `${dir}→${loc}`).join(', ')}
                </div>
              )}
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

      {/* Icon Selection Modal */}
      <IconSelectorModal
        isOpen={iconModalOpen}
        onClose={() => setIconModalOpen(false)}
        sprites={sprites}
        currentIcon={formData.icon}
        onSave={handleIconSave}
      />
    </div>
  );
};

export default LocationCreator;
