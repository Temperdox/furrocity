import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { collectTags } from '../DatapackLoader';
import { FormInput, FormSelect, TagInput, Button, FormTabs, FormTabPanel } from '../../ui/shared';
import { CreatorItemsList, IdNameFields, DescriptionField } from '../shared';
import { useFormDraft } from '../../../hooks/useFormDraft';
import { LogicBuilder } from '../LogicBuilder';
import './CreatorStyles.css';

const DRAFT_KEY = 'contentGenerator_draft_locations';

const TAG_CATEGORIES = {
  safety: ['safe', 'dangerous', 'hidden', 'locked'],
  type: ['town', 'wilderness', 'dungeon', 'shop', 'rest'],
  terrain: ['forest', 'mountain', 'water', 'cave', 'ruins'],
  special: ['nsfw', 'corruption', 'quest', 'combat', 'exploration'],
};

const SUGGESTED_LOCATION_TYPES = [
  'outdoor', 'indoor', 'dungeon', 'town', 'cave', 'building', 'forest',
  'water', 'region', 'mountain', 'desert', 'swamp', 'ruins', 'castle',
];

const LOCATION_SCOPES = [
  { value: 'kingdom', label: 'Kingdom' },
  { value: 'region', label: 'Region' },
  { value: 'local', label: 'Local' },
  { value: 'sub', label: 'Sub-location' },
];

const SCOPE_DESCRIPTIONS = {
  kingdom: 'A top-level realm containing multiple regions',
  region: 'A large area within a kingdom containing multiple locations',
  local: 'A location within a region, shown on the local map',
  sub: 'A location inside another location (e.g., cellar, upper floor)',
};

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

const ICON_SIZES = [
  { value: 'small', label: 'Small (20px)' },
  { value: 'medium', label: 'Medium (32px)' },
  { value: 'large', label: 'Large (48px)' },
];

// Three simple map tiers - always available
const MAP_TABS = [
  { id: 'global', label: 'Global Map', icon: '🌍', description: 'Place kingdoms on the world map', folder: 'global' },
  { id: 'kingdom', label: 'Kingdom Map', icon: '🏰', description: 'Place villages, towns, ruins, forests, etc.', folder: 'kingdom' },
  { id: 'local', label: 'Local Map', icon: '📍', description: 'Place buildings, rooms, points of interest', folder: 'local' },
];

// Known map images - these get loaded from public/images/maps/
const MAP_IMAGE_PATHS = {
  global: '/images/maps/global/',
  kingdom: '/images/maps/kingdom/',
  local: '/images/maps/local/',
};

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
  parentRegion: '',
  parentKingdom: '',
  type: 'outdoor',
  dangerLevel: 1,
  tags: [],
  hidden: false,
  discoveryConditions: null,
  services: [],
  npcs: [],
  encounterChance: 0,
  maxEnemyCount: 1,
  enemyTables: [],
  onEnter: [],
  requirements: null,
  background: '',
  ambientSound: '',
  navigation: {},
  parentLocation: '',
  locationType: 'local',
  childRegions: [],
  neighborKingdoms: [],
  governance: { ruler: '', rulerTitle: '', rulingHouse: '' },
  capital: '',
  childLocations: [],
  neighborRegions: [],
  mapPlacement: { mapType: null, x: 0, y: 0 },
  iconSize: 'medium',
  icon: { type: 'default', data: null, spriteSheet: null, cellRow: 0, cellCol: 0 },
};

// Note: Condition builder constants are now in ConditionBuilder/constants.js

// Icon Selection Modal
const IconSelectorModal = ({ isOpen, onClose, sprites = [], currentIcon, onSave }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedSprite, setSelectedSprite] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [uploadedIcon, setUploadedIcon] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (currentIcon && isOpen) {
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
    reader.onload = (ev) => setUploadedIcon(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setUploadedIcon(ev.target.result);
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

  return createPortal(
    <div className="location-modal-overlay" onClick={onClose}>
      <div className="location-modal" onClick={e => e.stopPropagation()}>
        <div className="location-modal-header">
          <h3>Select Location Icon</h3>
          <Button variant="danger" size="sm" onClick={onClose}>X</Button>
        </div>
        <div className="location-modal-body">
          <div className="location-modal-tabs">
            <button
              className={`location-modal-tab ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              Upload Icon
            </button>
            <button
              className={`location-modal-tab ${activeTab === 'sprite' ? 'active' : ''}`}
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
                className={`location-upload-area ${isDragging ? 'dragging' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                {uploadedIcon ? (
                  <div>
                    <img src={uploadedIcon} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px', marginBottom: '10px' }} />
                    <div className="text-success">Icon uploaded - Click to change</div>
                  </div>
                ) : (
                  <div className="text-muted">
                    Click or drag to upload icon<br />
                    <span className="text-sm">Recommended: 32x32 or 48x48 PNG</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sprite' && (
            <div>
              <FormSelect
                label="Select Sprite Sheet"
                value={selectedSprite || ''}
                onChange={(val) => { setSelectedSprite(val); setSelectedCell(null); }}
                options={[
                  { value: '', label: 'Choose a sprite sheet...' },
                  ...sprites.map(s => ({ value: s.id, label: `${s.name} (${s.columns}x${s.rows} cells)` }))
                ]}
              />

              {selectedSpriteData && (
                <div className="mt-md">
                  <label className="form-label">Click to select a cell:</label>
                  <div className="location-sprite-grid">
                    {Array.from({ length: selectedSpriteData.rows * selectedSpriteData.columns }).map((_, i) => {
                      const row = Math.floor(i / selectedSpriteData.columns);
                      const col = i % selectedSpriteData.columns;
                      const x = (selectedSpriteData.offsetX || 0) + col * (selectedSpriteData.cellWidth + (selectedSpriteData.marginX || 0));
                      const y = (selectedSpriteData.offsetY || 0) + row * (selectedSpriteData.cellHeight + (selectedSpriteData.marginY || 0));
                      const isSelected = selectedCell?.row === row && selectedCell?.col === col;

                      return (
                        <div
                          key={`${row}_${col}`}
                          className={`location-sprite-cell ${isSelected ? 'selected' : ''}`}
                          style={{
                            backgroundImage: `url(${selectedSpriteData.imageData})`,
                            backgroundPosition: `-${x}px -${y}px`,
                          }}
                          onClick={() => setSelectedCell({ row, col })}
                          title={`Cell (${row}, ${col})`}
                        />
                      );
                    })}
                  </div>
                  {selectedCell && (
                    <div className="form-helper mt-sm">
                      Selected: Row {selectedCell.row}, Column {selectedCell.col}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="location-modal-footer">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="success"
            onClick={handleSave}
            disabled={(activeTab === 'upload' && !uploadedIcon) || (activeTab === 'sprite' && (!selectedSprite || !selectedCell))}
          >
            Save Icon
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Fuzzy search helper
const getFuzzyScore = (text, search) => {
  if (!text || !search) return 0;
  const textLower = text.toLowerCase();
  const searchLower = search.toLowerCase();
  if (textLower === searchLower) return 1000;
  if (textLower.startsWith(searchLower)) return 900;
  if (textLower.includes(searchLower)) return 700;
  return 0;
};

// Location Selection Modal
const LocationSelectModal = ({ isOpen, onClose, onSelect, locations, currentLocationId, directionInfo }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
    else setSearchQuery('');
  }, [isOpen]);

  const filteredLocations = useMemo(() => {
    const filtered = locations.filter(loc => loc.id !== currentLocationId);
    if (!searchQuery.trim()) return filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered
      .map(loc => ({ ...loc, score: Math.max(getFuzzyScore(loc.id, searchQuery), getFuzzyScore(loc.name, searchQuery)) }))
      .filter(loc => loc.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [locations, currentLocationId, searchQuery]);

  if (!isOpen) return null;

  return createPortal(
    <div className="location-modal-overlay" onClick={onClose}>
      <div className="location-modal location-modal-small" onClick={e => e.stopPropagation()}>
        <div className="location-modal-header">
          <h3>{directionInfo?.icon} Select Location for "{directionInfo?.label}"</h3>
          <button className="location-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="location-modal-search">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search locations by name or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="location-modal-list">
          <div className="location-modal-list-item location-modal-clear" onClick={() => { onSelect(''); onClose(); }}>
            <span>🚫</span><span>No link (clear)</span>
          </div>
          {filteredLocations.length === 0 ? (
            <div className="location-modal-empty">No locations found matching "{searchQuery}"</div>
          ) : (
            filteredLocations.map(loc => (
              <div
                key={loc.id}
                className="location-modal-list-item"
                onClick={() => { onSelect(loc.id); onClose(); }}
              >
                <div>
                  <div className="location-modal-item-name">{loc.name}</div>
                  <div className="location-modal-item-id">{loc.id}</div>
                </div>
                <div className="location-modal-item-type">{loc.locationType || 'local'}</div>
              </div>
            ))
          )}
        </div>
        <div className="location-modal-footer">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
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
  const [mapTab, setMapTab] = useState('global');
  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [selectedNpc, setSelectedNpc] = useState('');
  const [selectedEnemy, setSelectedEnemy] = useState('');
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [editingDirection, setEditingDirection] = useState(null);
  const [availableMaps, setAvailableMaps] = useState({ global: [], kingdom: [], local: [] });
  const [selectedMaps, setSelectedMaps] = useState({ global: '', kingdom: '', local: '' });
  const [activeTab, setActiveTab] = useState('basic');
  const [mapZoom, setMapZoom] = useState(1);
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 }); // percentage
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  // Use useEffect to attach wheel handler with { passive: false } to properly prevent default
  useEffect(() => {
    const viewport = mapContainerRef.current;
    if (!viewport) return;

    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Calculate cursor position relative to the image container
      const container = mapRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setZoomOrigin({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
      }

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setMapZoom(prev => Math.max(0.25, Math.min(3, prev + delta)));
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMapMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle click or Alt+click for pan
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - mapPan.x, y: e.clientY - mapPan.y });
    }
  };

  const handleMapMouseMove = (e) => {
    if (isPanning) {
      setMapPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleMapMouseUp = () => {
    setIsPanning(false);
  };

  const resetMapView = () => {
    setMapZoom(1);
    setMapPan({ x: 0, y: 0 });
    setZoomOrigin({ x: 50, y: 50 });
  };

  // Load available map images from manifest on mount
  useEffect(() => {
    const loadMapImages = async () => {
      try {
        const response = await fetch('/images/maps/manifest.json');
        if (!response.ok) {
          console.warn('Map manifest not found');
          return;
        }

        const manifest = await response.json();
        const newAvailableMaps = { global: [], kingdom: [], local: [] };

        for (const mapType of ['global', 'kingdom', 'local']) {
          const maps = manifest[mapType] || [];
          newAvailableMaps[mapType] = maps.map(m => ({
            filename: m.filename,
            path: `${MAP_IMAGE_PATHS[mapType]}${m.filename}`,
            name: m.name || m.filename.replace('.png', '').replace(/_/g, ' '),
          }));
        }

        setAvailableMaps(newAvailableMaps);

        // Set default selected maps to first available
        setSelectedMaps({
          global: newAvailableMaps.global[0]?.path || '',
          kingdom: newAvailableMaps.kingdom[0]?.path || '',
          local: newAvailableMaps.local[0]?.path || '',
        });
      } catch (e) {
        console.warn('Failed to load map manifest:', e);
      }
    };

    loadMapImages();
  }, []);

  const { clearDraft } = useFormDraft(DRAFT_KEY, formData, setFormData, editingItem, {
    defaultValues: DEFAULT_LOCATION,
  });

  const suggestedTags = useMemo(() => {
    return collectTags({
      datapackContent,
      userContent: items,
      commonTags: Object.values(TAG_CATEGORIES).flat(),
      contentType: 'locations',
    });
  }, [datapackContent, items]);

  const sprites = allContent.sprites || [];
  const allNPCs = [...(datapackContent.npcs || []), ...npcs];
  const allEnemies = [...(datapackContent.enemies || []), ...enemies];
  const allItems = [...(datapackContent.items || []), ...(allContent.items || [])];
  const allQuests = [...(datapackContent.quests || []), ...(allContent.quests || [])];
  const allScenes = [...(datapackContent.scenes || []), ...(allContent.scenes || [])];

  const allLocations = useMemo(() => {
    const locMap = new Map();
    const isValidLocation = (loc) => {
      const hasLocationFields = loc.locationType || loc.parentRegion || loc.connectedLocations || loc.navigation;
      const hasEnemyFields = loc.tier !== undefined || loc.maxHp !== undefined || loc.nsfwActions !== undefined || loc.loot !== undefined;
      return hasLocationFields || !hasEnemyFields;
    };
    (datapackContent.locations || []).filter(isValidLocation).forEach(loc => locMap.set(loc.id, loc));
    items.filter(isValidLocation).forEach(loc => locMap.set(loc.id, loc));
    return Array.from(locMap.values());
  }, [datapackContent.locations, items]);

  const kingdoms = allLocations.filter(loc => loc.locationType === 'kingdom');
  const regions = allLocations.filter(loc => loc.locationType === 'region');
  const localLocations = allLocations.filter(loc => loc.locationType === 'local' || loc.locationType === 'region');

  // Define tabs with badges
  const tabs = useMemo(() => {
    const navigationCount = Object.keys(formData.navigation).length;
    const encounterBadge = formData.encounterChance > 0 ? `${formData.encounterChance}%` : null;
    const servicesCount = formData.services.length + formData.npcs.length;
    const hasVisuals = formData.background || formData.ambientSound || formData.mapPlacement.mapType;

    return [
      { id: 'basic', label: 'Basic' },
      { id: 'navigation', label: 'Navigation', badge: navigationCount || null },
      { id: 'encounters', label: 'Encounters', badge: encounterBadge },
      { id: 'services', label: 'Services', badge: servicesCount || null },
      { id: 'nsfw', label: 'NSFW', badge: formData.tags.includes('nsfw') ? '!' : null },
      { id: 'visuals', label: 'Visuals', badge: hasVisuals ? '✓' : null },
    ];
  }, [formData.navigation, formData.encounterChance, formData.services.length, formData.npcs.length, formData.background, formData.ambientSound, formData.mapPlacement.mapType, formData.tags]);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...DEFAULT_LOCATION,
        ...editingItem,
        services: editingItem.services || [],
        npcs: editingItem.npcs || [],
        enemyTables: editingItem.enemyTables || [],
        navigation: editingItem.navigation || {},
        mapPlacement: editingItem.mapPlacement || { mapType: null, x: 0, y: 0 },
        icon: editingItem.icon || { type: 'default', data: null },
      });
      if (editingItem.mapPlacement?.mapType) setMapTab(editingItem.mapPlacement.mapType);
    } else {
      setFormData({ ...DEFAULT_LOCATION });
    }
  }, [editingItem]);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const toggleService = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  const handleAddNpc = (npcId) => {
    if (npcId && !formData.npcs.includes(npcId)) {
      setFormData(prev => ({ ...prev, npcs: [...prev.npcs, npcId] }));
    }
    setSelectedNpc('');
  };

  const handleRemoveNpc = (npc) => {
    setFormData(prev => ({ ...prev, npcs: prev.npcs.filter(n => n !== npc) }));
  };

  const handleAddEnemyToTable = (enemyId) => {
    if (!enemyId || formData.enemyTables.some(e => e.enemyId === enemyId)) return;
    setFormData(prev => ({
      ...prev,
      enemyTables: [...prev.enemyTables, {
        enemyId,
        weight: 50,
        variantChances: { weak: 15, normal: 60, strong: 20, elite: 5 },
      }],
    }));
    setSelectedEnemy('');
  };

  const handleRemoveEnemyFromTable = (enemyId) => {
    setFormData(prev => ({ ...prev, enemyTables: prev.enemyTables.filter(e => e.enemyId !== enemyId) }));
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
        e.enemyId === enemyId ? { ...e, variantChances: { ...e.variantChances, [variant]: Math.max(0, Math.min(100, parseInt(chance) || 0)) } } : e
      ),
    }));
  };

  const handleNavigationChange = (direction, locationId) => {
    setFormData(prev => {
      const newNavigation = { ...prev.navigation };
      if (locationId) newNavigation[direction] = locationId;
      else delete newNavigation[direction];
      return { ...prev, navigation: newNavigation };
    });
  };

  const handleMapClick = (e) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFormData(prev => ({ ...prev, mapPlacement: { mapType: mapTab, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 } }));
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
      clearDraft();
    }
    setFormData({ ...DEFAULT_LOCATION });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_LOCATION });
    onCancelEdit();
  };

  const getIconPreview = () => {
    if (formData.icon.type === 'uploaded' && formData.icon.data) {
      return <img src={formData.icon.data} alt="Icon" style={{ maxWidth: '100%', maxHeight: '100%' }} />;
    } else if (formData.icon.type === 'sprite' && formData.icon.data) {
      const x = (formData.icon.offsetX || 0) + formData.icon.cellCol * (formData.icon.cellWidth + (formData.icon.marginX || 0));
      const y = (formData.icon.offsetY || 0) + formData.icon.cellRow * (formData.icon.cellHeight + (formData.icon.marginY || 0));
      return (
        <div style={{
          width: formData.icon.cellWidth || 32,
          height: formData.icon.cellHeight || 32,
          backgroundImage: `url(${formData.icon.data})`,
          backgroundPosition: `-${x}px -${y}px`,
        }} />
      );
    }
    return <span style={{ color: '#606080', fontSize: '24px' }}>🏠</span>;
  };

  return (
    <div className="creator-container">
      <div className="creator-form">
        <h3 className="creator-form-section-title">
          {editingItem ? 'Edit Location' : 'Create New Location'}
        </h3>

        <FormTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Basic Tab */}
        <FormTabPanel id="basic" activeTab={activeTab}>
          <div className="creator-form-section">
            <IdNameFields
              idValue={formData.id}
              nameValue={formData.name}
              onIdChange={(v) => handleChange('id', v)}
              onNameChange={(v) => handleChange('name', v)}
              idPlaceholder="unique_location_id"
              namePlaceholder="Location Name"
            />

            <DescriptionField
              value={formData.description}
              onChange={(v) => handleChange('description', v)}
              placeholder="Describe this location..."
            />

            <div className="creator-form-row">
              <FormSelect
                label="Location Scope"
                value={formData.locationType}
                onChange={(v) => handleChange('locationType', v)}
                options={LOCATION_SCOPES}
                helperText={SCOPE_DESCRIPTIONS[formData.locationType]}
              />
              <div>
                <FormInput
                  label="Type"
                  value={formData.type}
                  onChange={(v) => handleChange('type', v)}
                  placeholder="e.g., outdoor, dungeon, town"
                />
                <div className="location-type-suggestions">
                  {SUGGESTED_LOCATION_TYPES.filter(t => t !== formData.type).slice(0, 8).map(type => (
                    <button key={type} className="location-type-btn" onClick={() => handleChange('type', type)}>
                      + {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {formData.locationType === 'region' && (
              <FormSelect
                label="Parent Kingdom"
                value={formData.parentKingdom}
                onChange={(v) => handleChange('parentKingdom', v)}
                options={[{ value: '', label: 'Select Parent Kingdom...' }, ...kingdoms.map(k => ({ value: k.id, label: `${k.name} (${k.id})` }))]}
                helperText="The kingdom this region belongs to"
              />
            )}

            {formData.locationType === 'local' && (
              <FormSelect
                label="Parent Region"
                value={formData.parentRegion}
                onChange={(v) => handleChange('parentRegion', v)}
                options={[{ value: '', label: 'Select Parent Region...' }, ...regions.map(r => ({ value: r.id, label: `${r.name} (${r.id})` }))]}
                helperText="The region this location is in"
              />
            )}

            <div className="creator-form-row">
              <FormInput
                label="Danger Level (1-5)"
                type="number"
                value={formData.dangerLevel}
                onChange={(v) => handleChange('dangerLevel', parseInt(v) || 1)}
                min={1}
                max={5}
              />
              <div className="checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.hidden}
                    onChange={(e) => handleChange('hidden', e.target.checked)}
                  />
                  Hidden (requires discovery)
                </label>
              </div>
            </div>
          </div>

          {/* Discovery Conditions */}
          {formData.hidden && (
            <div className="creator-form-section">
              <h4 className="creator-form-section-title">Discovery Requirements</h4>
              <div className="form-helper mb-sm">
                Define conditions that must be met before this location can be discovered.
              </div>
              <LogicBuilder
                value={formData.discoveryConditions}
                onChange={(conditions) => handleChange('discoveryConditions', conditions)}
                title="Discovery Conditions"
                height={350}
                items={allItems}
                quests={allQuests}
                scenes={allScenes}
                locations={allLocations}
              />
            </div>
          )}

          {/* Tags */}
          <div className="creator-form-section">
            <h4 className="creator-form-section-title">Tags</h4>
            <TagInput
              value={formData.tags}
              onChange={(v) => handleChange('tags', v)}
              suggestions={suggestedTags}
              categories={TAG_CATEGORIES}
              placeholder="Add tag..."
              showSuggestions
            />
          </div>
        </FormTabPanel>

        {/* Navigation Tab */}
        <FormTabPanel id="navigation" activeTab={activeTab}>
          <div className="form-helper mb-sm">Link directions to other locations for navigation.</div>

          {formData.locationType === 'sub' && (
            <FormSelect
              label="Parent Location"
              value={formData.parentLocation}
              onChange={(v) => handleChange('parentLocation', v)}
              options={[{ value: '', label: 'Select parent location...' }, ...localLocations.filter(loc => loc.id !== formData.id).map(loc => ({ value: loc.id, label: `${loc.name} (${loc.id})` }))]}
            />
          )}

          <div className="location-navigation-grid">
            {NAVIGATION_DIRECTIONS.map(dir => {
              const linkedLoc = allLocations.find(l => l.id === formData.navigation[dir.id]);
              return (
                <div key={dir.id}>
                  <label className="form-label">{dir.icon} {dir.label}</label>
                  <button
                    className={`location-nav-btn ${linkedLoc ? 'has-link' : ''}`}
                    onClick={() => { setEditingDirection(dir); setLocationModalOpen(true); }}
                  >
                    <span>{linkedLoc ? linkedLoc.name : '-- No link --'}</span>
                    <span className="text-muted">▼</span>
                  </button>
                </div>
              );
            })}
          </div>
        </FormTabPanel>

        {/* Encounters Tab */}
        <FormTabPanel id="encounters" activeTab={activeTab}>
          <div className="creator-form-row">
            <FormInput
              label="Encounter Chance (%)"
              type="number"
              value={formData.encounterChance}
              onChange={(v) => handleChange('encounterChance', Math.max(0, Math.min(100, parseInt(v) || 0)))}
              min={0}
              max={100}
              helperText="0 = No encounters, 100 = Always"
            />
            <FormInput
              label="Max Enemies per Encounter"
              type="number"
              value={formData.maxEnemyCount}
              onChange={(v) => handleChange('maxEnemyCount', Math.max(1, Math.min(10, parseInt(v) || 1)))}
              min={1}
              max={10}
            />
          </div>

          <div className="creator-form-row">
            <FormInput
              label="Danger Level (1-5)"
              type="number"
              value={formData.dangerLevel}
              onChange={(v) => handleChange('dangerLevel', parseInt(v) || 1)}
              min={1}
              max={5}
            />
          </div>

          <div className="mt-md">
            <label className="form-label">Enemy Spawn Table</label>
            <div className="location-add-row">
              <FormSelect
                value={selectedEnemy}
                onChange={setSelectedEnemy}
                options={[{ value: '', label: 'Select an enemy to add...' }, ...allEnemies.filter(e => !formData.enemyTables.some(et => et.enemyId === e.id)).map(enemy => ({ value: enemy.id, label: `${enemy.name} (${enemy.id})` }))]}
              />
              <Button variant="success" onClick={() => handleAddEnemyToTable(selectedEnemy)} disabled={!selectedEnemy}>+ Add Enemy</Button>
            </div>

            {formData.enemyTables.length > 0 ? (
              <div className="location-enemy-table">
                {formData.enemyTables.map(entry => {
                  const enemyData = allEnemies.find(e => e.id === entry.enemyId);
                  const totalVariant = Object.values(entry.variantChances).reduce((a, b) => a + b, 0);
                  return (
                    <div key={entry.enemyId} className="location-enemy-card">
                      <div className="location-enemy-header">
                        <span>👹 <strong style={{ color: 'var(--color-accent-primary)' }}>{enemyData?.name || entry.enemyId}</strong></span>
                        <Button variant="danger" size="sm" onClick={() => handleRemoveEnemyFromTable(entry.enemyId)}>Remove</Button>
                      </div>
                      <div className="location-enemy-weight">
                        <span>Spawn Weight:</span>
                        <input type="number" value={entry.weight} onChange={(e) => handleUpdateEnemyWeight(entry.enemyId, e.target.value)} min={1} max={100} />
                        <span className="text-muted text-sm">Higher = more likely</span>
                      </div>
                      <div className="location-variant-grid">
                        {ENEMY_VARIANTS.map(variant => (
                          <div key={variant.value} className="location-variant-item">
                            <div style={{ color: variant.color }}>{variant.label}</div>
                            <input
                              type="number"
                              value={entry.variantChances[variant.value]}
                              onChange={(e) => handleUpdateVariantChance(entry.enemyId, variant.value, e.target.value)}
                              min={0}
                              max={100}
                            />
                            <div className="text-muted text-sm">{variant.modifier}x</div>
                          </div>
                        ))}
                      </div>
                      {totalVariant !== 100 && (
                        <div className="text-danger text-sm">Variant chances total {totalVariant}% - should equal 100%</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-list text-sm">No enemies in spawn table.</div>
            )}
          </div>
        </FormTabPanel>

        {/* Services Tab */}
        <FormTabPanel id="services" activeTab={activeTab}>
          <h4 className="creator-form-section-title">Available Services</h4>
          <div className="location-services-grid">
            {SERVICES.map(service => (
              <label key={service.id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.services.includes(service.id)}
                  onChange={() => toggleService(service.id)}
                />
                {service.icon} {service.label}
              </label>
            ))}
          </div>

          <h4 className="creator-form-section-title mt-lg">NPCs at this Location</h4>
          <div className="location-add-row">
            <FormSelect
              value={selectedNpc}
              onChange={setSelectedNpc}
              options={[{ value: '', label: 'Select an NPC to add...' }, ...allNPCs.filter(npc => !formData.npcs.includes(npc.id)).map(npc => ({ value: npc.id, label: `${npc.name} (${npc.id})` }))]}
            />
            <Button variant="success" onClick={() => handleAddNpc(selectedNpc)} disabled={!selectedNpc}>+ Add</Button>
          </div>
          {formData.npcs.length > 0 ? (
            <div className="location-tags-display">
              {formData.npcs.map(npcId => {
                const npcData = allNPCs.find(n => n.id === npcId);
                return (
                  <div key={npcId} className="location-tag-item">
                    <span>👤 {npcData?.name || npcId}</span>
                    <span className="location-tag-remove" onClick={() => handleRemoveNpc(npcId)}>×</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-list text-sm">No NPCs added.</div>
          )}
        </FormTabPanel>

        {/* NSFW Tab */}
        <FormTabPanel id="nsfw" activeTab={activeTab}>
          <div className="creator-form-section">
            <h4 className="creator-form-section-title">NSFW Settings</h4>
            <div className="form-helper mb-md">
              Configure adult content settings for this location.
            </div>

            <div className="checkbox-row mb-md">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.tags.includes('nsfw')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleChange('tags', [...formData.tags.filter(t => t !== 'nsfw'), 'nsfw']);
                    } else {
                      handleChange('tags', formData.tags.filter(t => t !== 'nsfw'));
                    }
                  }}
                />
                Enable NSFW Content
              </label>
            </div>

            {formData.tags.includes('nsfw') && (
              <>
                <div className="form-helper mb-sm">
                  NSFW-specific services available at this location:
                </div>
                <div className="location-services-grid">
                  {SERVICES.filter(s => s.id === 'brothel').map(service => (
                    <label key={service.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.services.includes(service.id)}
                        onChange={() => toggleService(service.id)}
                      />
                      {service.icon} {service.label}
                    </label>
                  ))}
                </div>

                <div className="form-helper mt-md mb-sm">
                  Additional NSFW tags:
                </div>
                <div className="location-services-grid">
                  {['corruption', 'lust_zone', 'breeding_ground', 'slave_market'].map(tag => (
                    <label key={tag} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.tags.includes(tag)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleChange('tags', [...formData.tags, tag]);
                          } else {
                            handleChange('tags', formData.tags.filter(t => t !== tag));
                          }
                        }}
                      />
                      {tag.replace(/_/g, ' ')}
                    </label>
                  ))}
                </div>
              </>
            )}

            {!formData.tags.includes('nsfw') && (
              <div className="empty-list">
                Enable NSFW content above to configure adult settings.
              </div>
            )}
          </div>
        </FormTabPanel>

        {/* Visuals Tab */}
        <FormTabPanel id="visuals" activeTab={activeTab}>
          {/* Icon & Map Placement */}
          <div className="creator-form-section">
            <h4 className="creator-form-section-title">Location Icon</h4>
            <div className="creator-form-row">
              <div>
                <label className="form-label">Location Icon</label>
                <div className="location-icon-row">
                  <div className="location-icon-preview">{getIconPreview()}</div>
                  <Button variant="secondary" onClick={() => setIconModalOpen(true)}>Change Icon</Button>
                </div>
              </div>
              <FormSelect
                label="Icon Size on Map"
                value={formData.iconSize}
                onChange={(v) => handleChange('iconSize', v)}
                options={ICON_SIZES}
              />
            </div>
          </div>

          <div className="creator-form-section">
            <h4 className="creator-form-section-title">Map Placement</h4>
            <div className="map-controls-row">
              <div className="location-map-tabs">
                {MAP_TABS.map(tab => (
                  <button
                    key={tab.id}
                    className={`location-map-tab ${mapTab === tab.id ? 'active' : ''}`}
                    onClick={() => setMapTab(tab.id)}
                    title={tab.description}
                  >
                    {tab.icon} {tab.label}
                    {availableMaps[tab.id]?.length > 0 && (
                      <span className="map-count-badge">{availableMaps[tab.id].length}</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="map-zoom-controls">
                <Button size="sm" onClick={() => setMapZoom(prev => Math.min(3, prev + 0.25))} title="Zoom In">+</Button>
                <span className="zoom-level">{Math.round(mapZoom * 100)}%</span>
                <Button size="sm" onClick={() => setMapZoom(prev => Math.max(0.25, prev - 0.25))} title="Zoom Out">−</Button>
                <Button size="sm" variant="secondary" onClick={resetMapView} title="Reset View">⟲</Button>
                {formData.mapPlacement.mapType && (
                  <Button variant="danger" size="sm" onClick={() => setFormData(prev => ({ ...prev, mapPlacement: { mapType: null, x: 0, y: 0 } }))}>
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Map image selector */}
            {availableMaps[mapTab]?.length > 0 && (
              <div className="location-map-selector">
                <FormSelect
                  value={selectedMaps[mapTab] || ''}
                  onChange={(v) => setSelectedMaps(prev => ({ ...prev, [mapTab]: v }))}
                  options={[
                    ...availableMaps[mapTab].map(m => ({ value: m.path, label: m.name }))
                  ]}
                />
              </div>
            )}

            {(() => {
              const currentTab = MAP_TABS.find(t => t.id === mapTab) || MAP_TABS[0];
              const currentMapImage = selectedMaps[mapTab];
              const hasMapImage = currentMapImage && availableMaps[mapTab]?.length > 0;

              return (
                <div
                  ref={mapContainerRef}
                  className="location-map-viewport"
                  onMouseDown={handleMapMouseDown}
                  onMouseMove={handleMapMouseMove}
                  onMouseUp={handleMapMouseUp}
                  onMouseLeave={handleMapMouseUp}
                >
                  <div
                    ref={mapRef}
                    className={`location-map-container ${hasMapImage ? 'has-image' : ''} ${isPanning ? 'panning' : ''}`}
                    onClick={!isPanning ? handleMapClick : undefined}
                    style={{
                      transform: `scale(${mapZoom}) translate(${mapPan.x / mapZoom}px, ${mapPan.y / mapZoom}px)`,
                      transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                    }}
                  >
                    {hasMapImage ? (
                      <img src={currentMapImage} alt={currentTab.label} draggable={false} />
                    ) : (
                      <div className="location-map-placeholder">
                        <div className="location-map-icon">{currentTab.icon}</div>
                        <div>{currentTab.label}</div>
                        <div className="text-sm">{currentTab.description}</div>
                        <div className="text-sm text-muted mt-sm">
                          Add map images to: public/images/maps/{currentTab.folder}/
                        </div>
                      </div>
                    )}
                    {formData.mapPlacement.mapType === mapTab && (
                      <div
                        className="location-map-marker"
                        style={{ left: `${formData.mapPlacement.x}%`, top: `${formData.mapPlacement.y}%` }}
                      >
                        {getIconPreview()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
            <div className="map-help-text">
              {formData.mapPlacement.mapType ? (
                <span>Placed on <strong>{formData.mapPlacement.mapType}</strong> map at ({formData.mapPlacement.x.toFixed(1)}%, {formData.mapPlacement.y.toFixed(1)}%)</span>
              ) : (
                <span className="text-muted">Click to place icon | Scroll to zoom | Alt+drag to pan</span>
              )}
            </div>
          </div>

          {/* Background & Audio */}
          <div className="creator-form-section">
            <h4 className="creator-form-section-title">Background & Audio</h4>
            <FormInput
              label="Background Image"
              value={formData.background}
              onChange={(v) => handleChange('background', v)}
              placeholder="/backgrounds/location_bg.png"
            />
            <FormInput
              label="Ambient Sound"
              value={formData.ambientSound}
              onChange={(v) => handleChange('ambientSound', v)}
              placeholder="forest_ambience"
            />
          </div>
        </FormTabPanel>

        {/* Action Buttons */}
        <div className="creator-actions">
          <Button variant="success" onClick={handleSubmit}>
            {editingItem ? 'Update Location' : 'Add Location'}
          </Button>
          {editingItem && (
            <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
          )}
        </div>
      </div>

      {/* List Section */}
      <CreatorItemsList
        items={items}
        title="Created Locations"
        itemType="location"
        editingItem={editingItem}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        renderItemContent={(item) => (
          <>
            <div className="creator-item-name">
              {item.name}
              <span className="rarity-badge" style={{ backgroundColor: 'var(--color-accent-info)' }}>
                {item.locationType || 'local'}
              </span>
            </div>
            <div className="creator-item-id">
              ID: {item.id} | Type: {item.type}
              {item.parentRegion && ` | Region: ${item.parentRegion}`}
            </div>
            {item.encounterChance > 0 && (
              <div className="creator-item-id" style={{ color: 'var(--color-accent-danger)' }}>
                {item.encounterChance}% encounter | {item.enemyTables?.length || 0} enemy types
              </div>
            )}
            {item.npcs?.length > 0 && (
              <div className="creator-item-id" style={{ color: 'var(--color-accent-success)' }}>
                NPCs: {item.npcs.length}
              </div>
            )}
          </>
        )}
      />

      <IconSelectorModal
        isOpen={iconModalOpen}
        onClose={() => setIconModalOpen(false)}
        sprites={sprites}
        currentIcon={formData.icon}
        onSave={(iconData) => setFormData(prev => ({ ...prev, icon: iconData }))}
      />

      <LocationSelectModal
        isOpen={locationModalOpen}
        onClose={() => { setLocationModalOpen(false); setEditingDirection(null); }}
        onSelect={(locationId) => { if (editingDirection) handleNavigationChange(editingDirection.id, locationId); }}
        locations={allLocations}
        currentLocationId={formData.id}
        directionInfo={editingDirection}
      />
    </div>
  );
};

export default LocationCreator;
