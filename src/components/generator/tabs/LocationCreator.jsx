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
  discoveryConditions: null, // Logic tree for discovery requirements
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

// Fuzzy match scoring function - higher score = better match
const getFuzzyScore = (text, search) => {
  if (!text || !search) return 0;
  const textLower = text.toLowerCase();
  const searchLower = search.toLowerCase();

  // Exact match = highest score
  if (textLower === searchLower) return 1000;

  // Starts with search = very high score
  if (textLower.startsWith(searchLower)) return 900 + (searchLower.length / textLower.length) * 50;

  // Contains search as substring = high score
  if (textLower.includes(searchLower)) return 700 + (searchLower.length / textLower.length) * 50;

  // Word boundary match (search appears after space, underscore, etc)
  const wordBoundaryMatch = textLower.match(new RegExp(`[\\s_-]${searchLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  if (wordBoundaryMatch) return 600 + (searchLower.length / textLower.length) * 50;

  // Fuzzy character match - count matching characters in order
  let score = 0;
  let searchIdx = 0;
  let consecutiveBonus = 0;

  for (let i = 0; i < textLower.length && searchIdx < searchLower.length; i++) {
    if (textLower[i] === searchLower[searchIdx]) {
      score += 10 + consecutiveBonus;
      consecutiveBonus += 5; // Bonus for consecutive matches
      searchIdx++;
    } else {
      consecutiveBonus = 0;
    }
  }

  // Only return score if all search characters were found
  if (searchIdx === searchLower.length) {
    return score;
  }

  return 0;
};

// Location Selection Modal with fuzzy search
const LocationSelectModal = ({
  isOpen,
  onClose,
  onSelect,
  locations,
  currentLocationId,
  directionInfo,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  // Filter and sort locations by match quality
  const filteredLocations = useMemo(() => {
    const filtered = locations.filter(loc => loc.id !== currentLocationId);

    if (!searchQuery.trim()) {
      // No search - sort alphabetically
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Score each location and sort by score descending
    return filtered
      .map(loc => ({
        ...loc,
        score: Math.max(
          getFuzzyScore(loc.id, searchQuery),
          getFuzzyScore(loc.name, searchQuery)
        ),
      }))
      .filter(loc => loc.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [locations, currentLocationId, searchQuery]);

  if (!isOpen) return null;

  return createPortal(
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modal, width: '500px' }} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>
            {directionInfo?.icon} Select Location for "{directionInfo?.label}"
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#a0a0c0', fontSize: '20px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '15px 20px', borderBottom: '1px solid #4a4a6a' }}>
          <input
            ref={searchInputRef}
            style={{
              ...styles.input,
              width: '100%',
              padding: '12px',
              fontSize: '14px',
            }}
            type="text"
            placeholder="Search locations by name or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ ...styles.modalBody, maxHeight: '400px', padding: 0 }}>
          {/* Clear option */}
          <div
            style={{
              padding: '12px 20px',
              cursor: 'pointer',
              borderBottom: '1px solid #3a3a5a',
              color: '#808090',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
            onClick={() => {
              onSelect('');
              onClose();
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2a2a4a'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ fontSize: '16px' }}>🚫</span>
            <span>No link (clear)</span>
          </div>

          {filteredLocations.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#808090' }}>
              No locations found matching "{searchQuery}"
            </div>
          ) : (
            filteredLocations.map(loc => (
              <div
                key={loc.id}
                style={{
                  padding: '12px 20px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #2a2a4a',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onClick={() => {
                  onSelect(loc.id);
                  onClose();
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2a2a4a'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div>
                  <div style={{ color: 'white', fontWeight: 'bold' }}>{loc.name}</div>
                  <div style={{ color: '#808090', fontSize: '12px' }}>{loc.id}</div>
                </div>
                <div style={{ color: '#606080', fontSize: '11px' }}>
                  {loc.locationType || 'local'}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={styles.modalFooter}>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Condition types for discovery requirements
const CONDITION_CATEGORIES = [
  { id: 'item', label: 'Item', icon: '📦' },
  { id: 'equipment', label: 'Equipment', icon: '⚔️' },
  { id: 'stat', label: 'Player Stat', icon: '📊' },
  { id: 'quest', label: 'Quest', icon: '📜' },
  { id: 'scene', label: 'Scene', icon: '🎬' },
  { id: 'flag', label: 'Game Flag', icon: '🚩' },
  { id: 'location', label: 'Location', icon: '📍' },
];

const CONDITION_CHECKS = {
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

const OPERATORS = [
  { id: 'eq', label: '=', description: 'Equal to' },
  { id: 'ne', label: '≠', description: 'Not equal to' },
  { id: 'gt', label: '>', description: 'Greater than' },
  { id: 'gte', label: '≥', description: 'Greater or equal' },
  { id: 'lt', label: '<', description: 'Less than' },
  { id: 'lte', label: '≤', description: 'Less or equal' },
];

const PLAYER_STATS = [
  'hp', 'maxHp', 'stamina', 'maxStamina', 'level', 'experience',
  'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
  'gold', 'corruption', 'lust', 'arousal',
];

const EQUIPMENT_SLOTS = [
  'head', 'body', 'hands', 'feet', 'accessory', 'weapon', 'offhand',
  'neck', 'ring', 'piercings', 'intimate',
];

// Block color scheme
const BLOCK_COLORS = {
  group: { bg: '#4a6fa5', border: '#3a5a8a', text: 'white' },
  and: { bg: '#5a8a5a', border: '#4a7a4a', text: 'white' },
  or: { bg: '#8a6a5a', border: '#7a5a4a', text: 'white' },
  not: { bg: '#8a5a5a', border: '#7a4a4a', text: 'white' },
  condition: { bg: '#5a5a8a', border: '#4a4a7a', text: 'white' },
  item: { bg: '#6a8a6a', border: '#5a7a5a', text: 'white' },
  equipment: { bg: '#8a7a5a', border: '#7a6a4a', text: 'white' },
  stat: { bg: '#5a7a8a', border: '#4a6a7a', text: 'white' },
  quest: { bg: '#7a6a8a', border: '#6a5a7a', text: 'white' },
  scene: { bg: '#8a6a7a', border: '#7a5a6a', text: 'white' },
  flag: { bg: '#6a6a6a', border: '#5a5a5a', text: 'white' },
  location: { bg: '#5a8a7a', border: '#4a7a6a', text: 'white' },
};

// Create a default condition node
const createConditionNode = (type = 'condition', category = 'item') => {
  if (type === 'group') {
    return {
      type: 'group',
      operator: 'and',
      children: [],
    };
  }
  if (type === 'not') {
    return {
      type: 'not',
      child: null,
    };
  }
  // Default condition
  const checks = CONDITION_CHECKS[category] || [];
  const defaultCheck = checks[0]?.id || 'hasItem';
  return {
    type: 'condition',
    category,
    check: defaultCheck,
    params: {},
  };
};

// Condition Builder Component
const ConditionBuilder = ({
  conditions,
  onChange,
  items = [],
  quests = [],
  scenes = [],
  locations = [],
}) => {
  // Render a single condition block
  const renderConditionBlock = (node, path = [], depth = 0) => {
    if (!node) return null;

    const colors = BLOCK_COLORS[node.type === 'condition' ? node.category : node.type] || BLOCK_COLORS.condition;

    const updateNode = (updates) => {
      const newConditions = JSON.parse(JSON.stringify(conditions));
      let target = newConditions;
      for (let i = 0; i < path.length - 1; i++) {
        if (path[i] === 'child') {
          target = target.child;
        } else {
          target = target.children[path[i]];
        }
      }
      if (path.length > 0) {
        const lastKey = path[path.length - 1];
        if (lastKey === 'child') {
          Object.assign(target.child, updates);
        } else {
          Object.assign(target.children[lastKey], updates);
        }
      } else {
        Object.assign(newConditions, updates);
      }
      onChange(newConditions);
    };

    const removeNode = () => {
      if (path.length === 0) {
        onChange(null);
        return;
      }
      const newConditions = JSON.parse(JSON.stringify(conditions));
      let target = newConditions;
      for (let i = 0; i < path.length - 1; i++) {
        if (path[i] === 'child') {
          target = target.child;
        } else {
          target = target.children[path[i]];
        }
      }
      const lastKey = path[path.length - 1];
      if (lastKey === 'child') {
        target.child = null;
      } else {
        target.children.splice(lastKey, 1);
      }
      onChange(newConditions);
    };

    const addChild = (childType = 'condition', category = 'item') => {
      const newChild = createConditionNode(childType, category);
      const newConditions = JSON.parse(JSON.stringify(conditions));
      let target = newConditions;
      for (const key of path) {
        if (key === 'child') {
          target = target.child;
        } else {
          target = target.children[key];
        }
      }
      if (node.type === 'group') {
        target.children.push(newChild);
      } else if (node.type === 'not') {
        target.child = newChild;
      }
      onChange(newConditions);
    };

    // Render GROUP (AND/OR) block
    if (node.type === 'group') {
      return (
        <div
          key={path.join('-')}
          style={{
            backgroundColor: node.operator === 'and' ? BLOCK_COLORS.and.bg : BLOCK_COLORS.or.bg,
            border: `2px solid ${node.operator === 'and' ? BLOCK_COLORS.and.border : BLOCK_COLORS.or.border}`,
            borderRadius: '8px',
            padding: '10px',
            marginLeft: depth * 20,
            marginBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <select
              style={{
                padding: '5px 10px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'rgba(0,0,0,0.3)',
                color: 'white',
                fontWeight: 'bold',
              }}
              value={node.operator}
              onChange={(e) => updateNode({ operator: e.target.value })}
            >
              <option value="and">AND (all must be true)</option>
              <option value="or">OR (any can be true)</option>
            </select>
            <button
              type="button"
              style={{ ...styles.smallButton, backgroundColor: '#5a3a3a' }}
              onClick={removeNode}
              title="Remove this group"
            >
              ×
            </button>
          </div>

          {/* Children */}
          <div style={{ marginLeft: '10px', borderLeft: '2px solid rgba(255,255,255,0.2)', paddingLeft: '10px' }}>
            {node.children.map((child, idx) => renderConditionBlock(child, [...path, idx], depth + 1))}

            {/* Add child buttons */}
            <div style={{ display: 'flex', gap: '5px', marginTop: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                style={{ ...styles.smallButton, backgroundColor: '#4a6a4a' }}
                onClick={() => addChild('group')}
              >
                + Group
              </button>
              <button
                type="button"
                style={{ ...styles.smallButton, backgroundColor: '#6a4a4a' }}
                onClick={() => addChild('not')}
              >
                + NOT
              </button>
              {CONDITION_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  style={{ ...styles.smallButton, backgroundColor: BLOCK_COLORS[cat.id]?.bg || '#5a5a5a' }}
                  onClick={() => addChild('condition', cat.id)}
                  title={cat.label}
                >
                  + {cat.icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Render NOT block
    if (node.type === 'not') {
      return (
        <div
          key={path.join('-')}
          style={{
            backgroundColor: BLOCK_COLORS.not.bg,
            border: `2px solid ${BLOCK_COLORS.not.border}`,
            borderRadius: '8px',
            padding: '10px',
            marginLeft: depth * 20,
            marginBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontWeight: 'bold', color: 'white' }}>NOT (invert result)</span>
            <button
              type="button"
              style={{ ...styles.smallButton, backgroundColor: '#5a3a3a' }}
              onClick={removeNode}
            >
              ×
            </button>
          </div>

          <div style={{ marginLeft: '10px', borderLeft: '2px solid rgba(255,255,255,0.2)', paddingLeft: '10px' }}>
            {node.child ? (
              renderConditionBlock(node.child, [...path, 'child'], depth + 1)
            ) : (
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  style={{ ...styles.smallButton, backgroundColor: '#4a6a4a' }}
                  onClick={() => addChild('group')}
                >
                  + Group
                </button>
                {CONDITION_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    style={{ ...styles.smallButton, backgroundColor: BLOCK_COLORS[cat.id]?.bg || '#5a5a5a' }}
                    onClick={() => addChild('condition', cat.id)}
                    title={cat.label}
                  >
                    + {cat.icon}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Render CONDITION block (leaf node)
    const category = node.category || 'item';
    const checks = CONDITION_CHECKS[category] || [];
    const currentCheck = checks.find(c => c.id === node.check) || checks[0];

    return (
      <div
        key={path.join('-')}
        style={{
          backgroundColor: colors.bg,
          border: `2px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '10px',
          marginLeft: depth * 20,
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Category icon */}
          <span style={{ fontSize: '16px' }}>
            {CONDITION_CATEGORIES.find(c => c.id === category)?.icon}
          </span>

          {/* Category selector */}
          <select
            style={{
              padding: '5px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'rgba(0,0,0,0.3)',
              color: 'white',
              fontSize: '12px',
            }}
            value={category}
            onChange={(e) => {
              const newCategory = e.target.value;
              const newChecks = CONDITION_CHECKS[newCategory] || [];
              updateNode({
                category: newCategory,
                check: newChecks[0]?.id || '',
                params: {},
              });
            }}
          >
            {CONDITION_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>

          {/* Check type selector */}
          <select
            style={{
              padding: '5px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'rgba(0,0,0,0.3)',
              color: 'white',
              fontSize: '12px',
            }}
            value={node.check}
            onChange={(e) => updateNode({ check: e.target.value, params: {} })}
          >
            {checks.map(check => (
              <option key={check.id} value={check.id}>{check.label}</option>
            ))}
          </select>

          {/* Parameters based on check type */}
          {currentCheck?.params?.includes('itemId') && (
            <select
              style={{
                padding: '5px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'rgba(0,0,0,0.3)',
                color: 'white',
                fontSize: '12px',
                maxWidth: '150px',
              }}
              value={node.params.itemId || ''}
              onChange={(e) => updateNode({ params: { ...node.params, itemId: e.target.value } })}
            >
              <option value="">Select item...</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          )}

          {currentCheck?.params?.includes('questId') && (
            <select
              style={{
                padding: '5px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'rgba(0,0,0,0.3)',
                color: 'white',
                fontSize: '12px',
                maxWidth: '150px',
              }}
              value={node.params.questId || ''}
              onChange={(e) => updateNode({ params: { ...node.params, questId: e.target.value } })}
            >
              <option value="">Select quest...</option>
              {quests.map(quest => (
                <option key={quest.id} value={quest.id}>{quest.name}</option>
              ))}
            </select>
          )}

          {currentCheck?.params?.includes('sceneId') && (
            <select
              style={{
                padding: '5px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'rgba(0,0,0,0.3)',
                color: 'white',
                fontSize: '12px',
                maxWidth: '150px',
              }}
              value={node.params.sceneId || ''}
              onChange={(e) => updateNode({ params: { ...node.params, sceneId: e.target.value } })}
            >
              <option value="">Select scene...</option>
              {scenes.map(scene => (
                <option key={scene.id} value={scene.id}>{scene.name || scene.id}</option>
              ))}
            </select>
          )}

          {currentCheck?.params?.includes('locationId') && (
            <select
              style={{
                padding: '5px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'rgba(0,0,0,0.3)',
                color: 'white',
                fontSize: '12px',
                maxWidth: '150px',
              }}
              value={node.params.locationId || ''}
              onChange={(e) => updateNode({ params: { ...node.params, locationId: e.target.value } })}
            >
              <option value="">Select location...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          )}

          {currentCheck?.params?.includes('slot') && (
            <select
              style={{
                padding: '5px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'rgba(0,0,0,0.3)',
                color: 'white',
                fontSize: '12px',
              }}
              value={node.params.slot || ''}
              onChange={(e) => updateNode({ params: { ...node.params, slot: e.target.value } })}
            >
              <option value="">Select slot...</option>
              {EQUIPMENT_SLOTS.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          )}

          {currentCheck?.params?.includes('statName') && (
            <select
              style={{
                padding: '5px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'rgba(0,0,0,0.3)',
                color: 'white',
                fontSize: '12px',
              }}
              value={node.params.statName || ''}
              onChange={(e) => updateNode({ params: { ...node.params, statName: e.target.value } })}
            >
              <option value="">Select stat...</option>
              {PLAYER_STATS.map(stat => (
                <option key={stat} value={stat}>{stat}</option>
              ))}
            </select>
          )}

          {currentCheck?.params?.includes('flagName') && (
            <input
              style={{
                padding: '5px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'rgba(0,0,0,0.3)',
                color: 'white',
                fontSize: '12px',
                width: '120px',
              }}
              type="text"
              placeholder="Flag name..."
              value={node.params.flagName || ''}
              onChange={(e) => updateNode({ params: { ...node.params, flagName: e.target.value } })}
            />
          )}

          {currentCheck?.params?.includes('operator') && (
            <select
              style={{
                padding: '5px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'rgba(0,0,0,0.3)',
                color: 'white',
                fontSize: '12px',
              }}
              value={node.params.operator || 'eq'}
              onChange={(e) => updateNode({ params: { ...node.params, operator: e.target.value } })}
            >
              {OPERATORS.map(op => (
                <option key={op.id} value={op.id}>{op.label} {op.description}</option>
              ))}
            </select>
          )}

          {currentCheck?.params?.includes('value') && (
            <input
              style={{
                padding: '5px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'rgba(0,0,0,0.3)',
                color: 'white',
                fontSize: '12px',
                width: '60px',
              }}
              type="number"
              placeholder="Value"
              value={node.params.value ?? ''}
              onChange={(e) => updateNode({ params: { ...node.params, value: parseInt(e.target.value) || 0 } })}
            />
          )}

          {currentCheck?.params?.includes('objectiveIndex') && (
            <input
              style={{
                padding: '5px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'rgba(0,0,0,0.3)',
                color: 'white',
                fontSize: '12px',
                width: '40px',
              }}
              type="number"
              placeholder="#"
              min="0"
              value={node.params.objectiveIndex ?? 0}
              onChange={(e) => updateNode({ params: { ...node.params, objectiveIndex: parseInt(e.target.value) || 0 } })}
            />
          )}

          {currentCheck?.params?.includes('choiceId') && (
            <input
              style={{
                padding: '5px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'rgba(0,0,0,0.3)',
                color: 'white',
                fontSize: '12px',
                width: '100px',
              }}
              type="text"
              placeholder="Choice ID"
              value={node.params.choiceId || ''}
              onChange={(e) => updateNode({ params: { ...node.params, choiceId: e.target.value } })}
            />
          )}

          {/* Remove button */}
          <button
            type="button"
            style={{ ...styles.smallButton, backgroundColor: '#5a3a3a', marginLeft: 'auto' }}
            onClick={removeNode}
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginTop: '10px' }}>
      {conditions ? (
        renderConditionBlock(conditions)
      ) : (
        <div style={{
          padding: '15px',
          backgroundColor: '#1a1a2e',
          borderRadius: '8px',
          border: '2px dashed #4a4a6a',
          textAlign: 'center',
        }}>
          <div style={{ color: '#808090', marginBottom: '10px' }}>
            No discovery conditions set. Add a condition to require players to meet criteria before discovering this location.
          </div>
          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              style={{ ...styles.smallButton, backgroundColor: BLOCK_COLORS.and.bg }}
              onClick={() => onChange(createConditionNode('group'))}
            >
              + AND Group
            </button>
            <button
              type="button"
              style={{ ...styles.smallButton, backgroundColor: BLOCK_COLORS.or.bg }}
              onClick={() => onChange({ ...createConditionNode('group'), operator: 'or' })}
            >
              + OR Group
            </button>
            {CONDITION_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                style={{ ...styles.smallButton, backgroundColor: BLOCK_COLORS[cat.id]?.bg || '#5a5a5a' }}
                onClick={() => onChange(createConditionNode('condition', cat.id))}
                title={cat.label}
              >
                + {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
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
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [editingDirection, setEditingDirection] = useState(null);
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
  const allItems = [...(datapackContent.items || []), ...(allContent.items || [])];
  const allQuests = [...(datapackContent.quests || []), ...(allContent.quests || [])];
  const allScenes = [...(datapackContent.scenes || []), ...(allContent.scenes || [])];

  // Deduplicate locations by ID (user-created items take precedence)
  // Also filter out any enemy objects that may have been incorrectly included
  const allLocations = useMemo(() => {
    const locMap = new Map();
    // Helper to check if an object is a valid location
    const isValidLocation = (loc) => {
      const hasLocationFields = loc.locationType || loc.parentRegion || loc.connectedLocations || loc.navigation;
      const hasEnemyFields = loc.tier !== undefined || loc.maxHp !== undefined || loc.nsfwActions !== undefined || loc.loot !== undefined;
      return hasLocationFields || !hasEnemyFields;
    };
    // Add datapack locations first
    (datapackContent.locations || []).filter(isValidLocation).forEach(loc => locMap.set(loc.id, loc));
    // User-created items override datapack ones with same ID
    items.filter(isValidLocation).forEach(loc => locMap.set(loc.id, loc));
    return Array.from(locMap.values());
  }, [datapackContent.locations, items]);

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
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                placeholder="e.g., outdoor, dungeon, town"
              />
              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {SUGGESTED_LOCATION_TYPES.filter(t => t !== formData.type).map(type => (
                  <button
                    key={type}
                    type="button"
                    style={{ ...styles.smallButton, backgroundColor: '#3a3a5a', color: '#a0a0c0' }}
                    onClick={() => handleChange('type', type)}
                  >
                    + {type}
                  </button>
                ))}
              </div>
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

        {/* Discovery Conditions - shown when hidden is checked */}
        {formData.hidden && (
          <div style={styles.subsection}>
            <div style={styles.subsectionTitle}>🔓 Discovery Requirements</div>
            <div style={{ marginBottom: '10px', fontSize: '12px', color: '#808090' }}>
              Define conditions that must be met before this location can be discovered by the player.
              Use logic blocks to create complex requirements.
            </div>
            <ConditionBuilder
              conditions={formData.discoveryConditions}
              onChange={(conditions) => handleChange('discoveryConditions', conditions)}
              items={allItems}
              quests={allQuests}
              scenes={allScenes}
              locations={allLocations}
            />
          </div>
        )}

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
            {NAVIGATION_DIRECTIONS.map(dir => {
              const linkedLoc = allLocations.find(l => l.id === formData.navigation[dir.id]);
              return (
                <div key={dir.id} style={styles.formGroup}>
                  <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '16px' }}>{dir.icon}</span> {dir.label}
                  </label>
                  <button
                    type="button"
                    style={{
                      ...styles.input,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'left',
                      backgroundColor: linkedLoc ? '#2a3a4a' : '#1a1a2e',
                      border: linkedLoc ? '1px solid #4a6a8a' : '1px solid #4a4a6a',
                    }}
                    onClick={() => {
                      setEditingDirection(dir);
                      setLocationModalOpen(true);
                    }}
                  >
                    <span style={{ color: linkedLoc ? '#ffd700' : '#808090' }}>
                      {linkedLoc ? linkedLoc.name : '-- No link --'}
                    </span>
                    <span style={{ color: '#606080' }}>▼</span>
                  </button>
                </div>
              );
            })}
          </div>

          {Object.keys(formData.navigation).filter(k => formData.navigation[k]).length > 0 && (
            <div style={styles.infoBox}>
              <strong>Active Navigation Links:</strong>
              <div style={{ marginTop: '5px' }}>
                {Object.entries(formData.navigation).filter(([_, locId]) => locId).map(([dir, locId]) => {
                  const dirInfo = NAVIGATION_DIRECTIONS.find(d => d.id === dir);
                  const targetLoc = allLocations.find(l => l.id === locId);
                  return (
                    <div key={dir} style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                      <span>{dirInfo?.icon}</span>
                      <span>{dirInfo?.label}:</span>
                      <span style={{ color: '#ffd700' }}>{targetLoc?.name || locId}</span>
                      <button
                        type="button"
                        style={{ ...styles.smallButton, backgroundColor: '#5a3a3a', marginLeft: '5px' }}
                        onClick={() => handleNavigationChange(dir, '')}
                      >
                        ×
                      </button>
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

      {/* Location Selection Modal for navigation directions */}
      <LocationSelectModal
        isOpen={locationModalOpen}
        onClose={() => {
          setLocationModalOpen(false);
          setEditingDirection(null);
        }}
        onSelect={(locationId) => {
          if (editingDirection) {
            handleNavigationChange(editingDirection.id, locationId);
          }
        }}
        locations={allLocations}
        currentLocationId={formData.id}
        directionInfo={editingDirection}
      />
    </div>
  );
};

export default LocationCreator;
