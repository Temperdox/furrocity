import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Import system
import { ImportSystem } from './ImportSystem';
import ImportWarningsModal from './ImportWarningsModal';

// Datapack loader for accessing existing game content
import { datapackLoader } from './DatapackLoader';

// Import tab components
import ItemCreator from './tabs/ItemCreator';
import SceneCreator from './tabs/SceneCreator';
import LocationCreator from './tabs/LocationCreator';
import NPCCreator from './tabs/NPCCreator';
import EnemyCreator from './tabs/EnemyCreator';
import EffectCreator from './tabs/EffectCreator';
import CharacterCreator from './tabs/CharacterCreator';
import SpriteSheetManager from './tabs/SpriteSheetManager';
import QuestCreator from './tabs/QuestCreator';
import LootTableCreator from './tabs/LootTableCreator';
import SkillCreator from './tabs/SkillCreator';

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  container: {
    width: '95vw',
    height: '90vh',
    backgroundColor: '#1a1a2e',
    borderRadius: '12px',
    border: '2px solid #4a4a6a',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    backgroundColor: '#252540',
    borderBottom: '2px solid #4a4a6a',
  },
  title: {
    color: '#ffd700',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0,
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
  },
  headerButtons: {
    display: 'flex',
    gap: '10px',
  },
  mainContent: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  sidebar: {
    width: '200px',
    backgroundColor: '#1e1e35',
    borderRight: '2px solid #4a4a6a',
    display: 'flex',
    flexDirection: 'column',
    padding: '10px 0',
  },
  tabButton: {
    padding: '12px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#a0a0c0',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    borderLeft: '3px solid transparent',
  },
  tabButtonActive: {
    backgroundColor: '#2a2a4a',
    color: '#ffd700',
    borderLeft: '3px solid #ffd700',
  },
  tabButtonHover: {
    backgroundColor: '#252540',
    color: '#d0d0e0',
  },
  contentArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  workArea: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
  },
  button: {
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
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
  closeButton: {
    backgroundColor: '#5a3a3a',
    color: '#ff9999',
  },
  statusBar: {
    padding: '10px 20px',
    backgroundColor: '#252540',
    borderTop: '1px solid #4a4a6a',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#a0a0c0',
    fontSize: '12px',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    backgroundColor: '#4a4a6a',
    color: '#ffd700',
    fontSize: '11px',
    marginLeft: '8px',
  },
  importButton: {
    backgroundColor: '#3a5a7a',
    color: 'white',
  },
  dropZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(74, 124, 74, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    zIndex: 100,
    border: '4px dashed #90ff90',
    borderRadius: '12px',
  },
  dropZoneText: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '10px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
  },
  dropZoneSubtext: {
    color: '#c0ffc0',
    fontSize: '14px',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 150,
  },
  loadingSpinner: {
    width: '60px',
    height: '60px',
    border: '4px solid #2a2a4a',
    borderTop: '4px solid #ffd700',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  loadingText: {
    color: '#ffd700',
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  loadingSubtext: {
    color: '#a0a0c0',
    fontSize: '14px',
  },
  loadingProgressBar: {
    width: '300px',
    height: '6px',
    backgroundColor: '#2a2a4a',
    borderRadius: '3px',
    marginTop: '20px',
    overflow: 'hidden',
  },
  loadingProgressFill: {
    height: '100%',
    backgroundColor: '#ffd700',
    borderRadius: '3px',
    animation: 'loadingProgress 2s ease-in-out infinite',
  },
};

const TABS = [
  { id: 'items', label: 'Items', icon: '⚔️' },
  { id: 'scenes', label: 'Scenes', icon: '📜' },
  { id: 'quests', label: 'Quests', icon: '📋' },
  { id: 'locations', label: 'Locations', icon: '🏠' },
  { id: 'npcs', label: 'NPCs', icon: '👤' },
  { id: 'enemies', label: 'Enemies', icon: '👹' },
  { id: 'skills', label: 'Skills', icon: '⚡' },
  { id: 'effects', label: 'Effects', icon: '✨' },
  { id: 'lootTables', label: 'Loot Tables', icon: '🎁' },
  { id: 'characters', label: 'Characters', icon: '🧑' },
  { id: 'sprites', label: 'Sprites', icon: '🖼️' },
];

// Storage keys
const STORAGE_KEY = 'contentGenerator_data';
const STORAGE_TIMESTAMP_KEY = 'contentGenerator_lastSave';
const STORAGE_SETTINGS_KEY = 'contentGenerator_settings';
const STORAGE_SLOTS_INDEX_KEY = 'contentGenerator_slots';
const STORAGE_SLOT_PREFIX = 'contentGenerator_slot_';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

const ContentGenerator = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('items');
  const [hoveredTab, setHoveredTab] = useState(null);

  // Import system state
  const [isDragging, setIsDragging] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedData, setImportedData] = useState(null);
  const fileInputRef = useRef(null);
  const importSystem = useRef(new ImportSystem());

  // Recovery modal state
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryData, setRecoveryData] = useState(null);
  const [lastSaveTime, setLastSaveTime] = useState(null);

  // Save system state
  const [saveSettings, setSaveSettings] = useState(() => {
    const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
    return saved ? JSON.parse(saved) : { autoSaveEnabled: true };
  });
  const [saveSlots, setSaveSlots] = useState(() => {
    const saved = localStorage.getItem(STORAGE_SLOTS_INDEX_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newSlotName, setNewSlotName] = useState('');

  // Datapack content from game datapacks (for selection dropdowns)
  const [datapackContent, setDatapackContent] = useState({
    items: [],
    locations: [],
    enemies: [],
    effects: [],
    npcs: [],
    scenes: [],
    characters: [],
    merchants: [],
    substances: [],
    lootTables: [],
    encounterTables: [],
  });
  const [datapackLoading, setDatapackLoading] = useState(true);

  // Content storage for all types
  const [content, setContent] = useState({
    items: [],
    scenes: [],
    quests: [],
    locations: [],
    npcs: [],
    enemies: [],
    skills: [],
    effects: [],
    lootTables: [],
    characters: [],
    sprites: [],
  });

  // Track what's being edited
  const [editingItem, setEditingItem] = useState(null);

  // Load datapack content on mount
  useEffect(() => {
    const loadDatapacks = async () => {
      setDatapackLoading(true);
      try {
        const loaded = await datapackLoader.loadAll();
        setDatapackContent(loaded);
      } catch (error) {
        console.error('Failed to load datapack content:', error);
      } finally {
        setDatapackLoading(false);
      }
    };
    loadDatapacks();
  }, []);

  // Check for recoverable session on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedTimestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);

    if (saved && savedTimestamp) {
      try {
        const parsed = JSON.parse(saved);
        const timestamp = parseInt(savedTimestamp, 10);
        const hasContent = Object.values(parsed).some(arr => arr && arr.length > 0);

        if (hasContent) {
          // Show recovery modal
          setRecoveryData(parsed);
          setLastSaveTime(new Date(timestamp));
          setShowRecoveryModal(true);
        }
      } catch (e) {
        console.error('Failed to parse saved content:', e);
      }
    }
  }, []);

  // Handle recovery decision
  const handleRecoverSession = useCallback(() => {
    if (recoveryData) {
      setContent(prev => ({ ...prev, ...recoveryData }));
    }
    setShowRecoveryModal(false);
    setRecoveryData(null);
  }, [recoveryData]);

  const handleDiscardSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
    setShowRecoveryModal(false);
    setRecoveryData(null);
  }, []);

  // Auto-save content to localStorage with timestamp
  const saveToStorage = useCallback(() => {
    const hasContent = Object.values(content).some(arr => arr && arr.length > 0);
    if (hasContent) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
      localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
      setLastSaveTime(new Date());
    }
  }, [content]);

  // Save on content change (debounced by React's batching) - only if auto-save enabled
  useEffect(() => {
    if (saveSettings.autoSaveEnabled) {
      saveToStorage();
    }
  }, [content, saveToStorage, saveSettings.autoSaveEnabled]);

  // Persist save settings
  useEffect(() => {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(saveSettings));
  }, [saveSettings]);

  // Toggle auto-save
  const toggleAutoSave = useCallback(() => {
    setSaveSettings(prev => ({ ...prev, autoSaveEnabled: !prev.autoSaveEnabled }));
  }, []);

  // Manual save (for when auto-save is disabled or just to force a save)
  const handleManualSave = useCallback(() => {
    saveToStorage();
  }, [saveToStorage]);

  // Save to named slot
  const handleSaveToSlot = useCallback((slotName) => {
    if (!slotName.trim()) return;

    const slotId = `slot_${Date.now()}`;
    const slotData = {
      id: slotId,
      name: slotName.trim(),
      savedAt: new Date().toISOString(),
      data: content
    };

    // Save slot data
    localStorage.setItem(`${STORAGE_SLOT_PREFIX}${slotId}`, JSON.stringify(slotData));

    // Update slots index
    const newSlots = [...saveSlots, { id: slotId, name: slotName.trim(), savedAt: slotData.savedAt }];
    setSaveSlots(newSlots);
    localStorage.setItem(STORAGE_SLOTS_INDEX_KEY, JSON.stringify(newSlots));

    setNewSlotName('');
    setShowSaveModal(false);
  }, [content, saveSlots]);

  // Load from named slot
  const handleLoadFromSlot = useCallback((slotId) => {
    const slotData = localStorage.getItem(`${STORAGE_SLOT_PREFIX}${slotId}`);
    if (slotData) {
      try {
        const parsed = JSON.parse(slotData);
        if (parsed.data) {
          if (window.confirm(`Load "${parsed.name}"? This will replace your current work.`)) {
            setContent(parsed.data);
            setShowSaveModal(false);
          }
        }
      } catch (e) {
        console.error('Failed to load slot:', e);
      }
    }
  }, []);

  // Delete named slot
  const handleDeleteSlot = useCallback((slotId) => {
    if (window.confirm('Delete this save slot? This cannot be undone.')) {
      // Remove slot data
      localStorage.removeItem(`${STORAGE_SLOT_PREFIX}${slotId}`);

      // Update slots index
      const newSlots = saveSlots.filter(s => s.id !== slotId);
      setSaveSlots(newSlots);
      localStorage.setItem(STORAGE_SLOTS_INDEX_KEY, JSON.stringify(newSlots));
    }
  }, [saveSlots]);

  // Periodic auto-save every 30 seconds (only if enabled)
  useEffect(() => {
    if (!saveSettings.autoSaveEnabled) return;

    const interval = setInterval(() => {
      saveToStorage();
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [saveToStorage, saveSettings.autoSaveEnabled]);

  // Save before unload (browser close/refresh)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      saveToStorage();
      // Show warning if there's unsaved content
      const hasContent = Object.values(content).some(arr => arr && arr.length > 0);
      if (hasContent) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [content, saveToStorage]);

  // Import handling
  const handleImportFiles = useCallback(async (files) => {
    const result = await importSystem.current.importFiles(files);
    setImportResult(result);

    // Prepare the imported data for editing
    setImportedData({
      items: result.items,
      characters: result.characters,
      locations: result.locations,
      enemies: result.enemies,
      scenes: result.scenes,
    });

    setShowImportModal(true);
  }, []);

  const handleApplyImport = useCallback(() => {
    if (!importedData) return;

    setContent(prev => ({
      ...prev,
      items: [...prev.items, ...importedData.items.map(item => ({ ...item, _id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }))],
      characters: [...prev.characters, ...importedData.characters.map(char => ({ ...char, _id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }))],
      locations: [...prev.locations, ...importedData.locations.map(loc => ({ ...loc, _id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }))],
      enemies: [...prev.enemies, ...importedData.enemies.map(enemy => ({ ...enemy, _id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }))],
      scenes: [...prev.scenes, ...importedData.scenes.map(scene => ({ ...scene, _id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }))],
    }));

    setShowImportModal(false);
    setImportResult(null);
    setImportedData(null);
  }, [importedData]);

  const handleCancelImport = useCallback(() => {
    setShowImportModal(false);
    setImportResult(null);
    setImportedData(null);
  }, []);

  // File input change handler
  const handleFileInputChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleImportFiles(files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [handleImportFiles]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if leaving the container
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(
      file => file.name.endsWith('.json') || file.name.endsWith('.zip')
    );

    if (files.length > 0) {
      handleImportFiles(files);
    }
  }, [handleImportFiles]);

  // Add new content item
  const handleAddContent = useCallback((type, item) => {
    setContent(prev => ({
      ...prev,
      [type]: [...prev[type], { ...item, _id: Date.now().toString() }],
    }));
    setEditingItem(null);
  }, []);

  // Update existing content item
  const handleUpdateContent = useCallback((type, itemId, updatedItem) => {
    setContent(prev => ({
      ...prev,
      [type]: prev[type].map(item =>
        item._id === itemId ? { ...updatedItem, _id: itemId } : item
      ),
    }));
    setEditingItem(null);
  }, []);

  // Delete content item
  const handleDeleteContent = useCallback((type, itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setContent(prev => ({
        ...prev,
        [type]: prev[type].filter(item => item._id !== itemId),
      }));
      if (editingItem?._id === itemId) {
        setEditingItem(null);
      }
    }
  }, [editingItem]);

  // Duplicate content item
  const handleDuplicateContent = useCallback((type, item) => {
    const duplicated = {
      ...item,
      id: `${item.id}_copy`,
      name: `${item.name} (Copy)`,
      _id: Date.now().toString(),
    };
    setContent(prev => ({
      ...prev,
      [type]: [...prev[type], duplicated],
    }));
  }, []);

  // Edit content item
  const handleEditContent = useCallback((type, item) => {
    setEditingItem({ type, item });
  }, []);

  // Clear all content
  const handleClearAll = useCallback(() => {
    if (window.confirm('Are you sure you want to clear ALL created content? This cannot be undone.')) {
      setContent({
        items: [],
        scenes: [],
        quests: [],
        locations: [],
        npcs: [],
        enemies: [],
        skills: [],
        effects: [],
        lootTables: [],
        characters: [],
        sprites: [],
      });
      setEditingItem(null);
    }
  }, []);

  // Export to ZIP
  const handleExport = useCallback(async () => {
    const zip = new JSZip();

    // Create folder structure matching datapack layout
    const datapack = zip.folder('custom_datapack');

    // Pack manifest
    const packJson = {
      id: 'custom_content',
      name: 'Custom Content Pack',
      version: '1.0.0',
      author: 'Content Generator',
      description: 'Custom content created with the Content Generator',
      gameVersion: '>=0.7.0',
      priority: 100,
      content: {}
    };

    // Items
    if (content.items.length > 0) {
      const itemsFolder = datapack.folder('items');
      const itemsByType = {};

      content.items.forEach(item => {
        const cleanItem = { ...item };
        delete cleanItem._id;

        const type = item.type || 'misc';
        if (!itemsByType[type]) itemsByType[type] = [];
        itemsByType[type].push(cleanItem);
      });

      Object.entries(itemsByType).forEach(([type, items]) => {
        itemsFolder.file(`custom_${type}.json`, JSON.stringify(items, null, 2));
      });

      packJson.content.items = { path: 'items/', autoLoad: true };
    }

    // Scenes
    if (content.scenes.length > 0) {
      const scenesFolder = datapack.folder('scenes');
      const cleanScenes = content.scenes.map(scene => {
        const clean = { ...scene };
        delete clean._id;
        return clean;
      });
      scenesFolder.file('custom_scenes.json', JSON.stringify(cleanScenes, null, 2));
      packJson.content.scenes = { path: 'scenes/', autoLoad: true };
    }

    // Locations
    if (content.locations.length > 0) {
      const locationsFolder = datapack.folder('locations');
      const cleanLocations = content.locations.map(loc => {
        const clean = { ...loc };
        delete clean._id;
        return clean;
      });
      locationsFolder.file('custom_locations.json', JSON.stringify(cleanLocations, null, 2));
      packJson.content.locations = { path: 'locations/', autoLoad: true };
    }

    // NPCs/Merchants
    if (content.npcs.length > 0) {
      const merchantsFolder = datapack.folder('merchants');
      const cleanNpcs = content.npcs.map(npc => {
        const clean = { ...npc };
        delete clean._id;
        return clean;
      });
      merchantsFolder.file('custom_npcs.json', JSON.stringify(cleanNpcs, null, 2));
      packJson.content.merchants = { path: 'merchants/', autoLoad: true };
    }

    // Enemies
    if (content.enemies.length > 0) {
      const enemiesFolder = datapack.folder('enemies');
      const cleanEnemies = content.enemies.map(enemy => {
        const clean = { ...enemy };
        delete clean._id;
        return clean;
      });
      enemiesFolder.file('custom_enemies.json', JSON.stringify(cleanEnemies, null, 2));
      packJson.content.enemies = { path: 'enemies/', autoLoad: true };
    }

    // Effects
    if (content.effects.length > 0) {
      const effectsFolder = datapack.folder('effects');
      const cleanEffects = content.effects.map(effect => {
        const clean = { ...effect };
        delete clean._id;
        return clean;
      });
      effectsFolder.file('custom_effects.json', JSON.stringify(cleanEffects, null, 2));
      packJson.content.effects = { path: 'effects/', autoLoad: true };
    }

    // Quests
    if (content.quests.length > 0) {
      const questsFolder = datapack.folder('quests');
      const cleanQuests = content.quests.map(quest => {
        const clean = { ...quest };
        delete clean._id;
        return clean;
      });
      questsFolder.file('custom_quests.json', JSON.stringify(cleanQuests, null, 2));
      packJson.content.quests = { path: 'quests/', autoLoad: true };
    }

    // Skills
    if (content.skills.length > 0) {
      const skillsFolder = datapack.folder('skills');
      const cleanSkills = content.skills.map(skill => {
        const clean = { ...skill };
        delete clean._id;
        return clean;
      });
      skillsFolder.file('custom_skills.json', JSON.stringify(cleanSkills, null, 2));
      packJson.content.skills = { path: 'skills/', autoLoad: true };
    }

    // Loot Tables
    if (content.lootTables.length > 0) {
      const lootTablesFolder = datapack.folder('loot_tables');
      const cleanLootTables = content.lootTables.map(table => {
        const clean = { ...table };
        delete clean._id;
        return clean;
      });
      lootTablesFolder.file('custom_loot_tables.json', JSON.stringify(cleanLootTables, null, 2));
      packJson.content.lootTables = { path: 'loot_tables/', autoLoad: true };
    }

    // Characters (special handling - exports player template)
    if (content.characters.length > 0) {
      const charactersFolder = datapack.folder('characters');
      const cleanCharacters = content.characters.map(char => {
        const clean = { ...char };
        delete clean._id;
        return clean;
      });
      charactersFolder.file('custom_characters.json', JSON.stringify(cleanCharacters, null, 2));
    }

    // Sprite Sheets
    if (content.sprites.length > 0) {
      const spritesFolder = datapack.folder('sprites');
      const cleanSprites = content.sprites.map(sprite => {
        const clean = { ...sprite };
        delete clean._id;
        // Don't include the base64 imageData in export - just the metadata
        delete clean.imageData;
        return clean;
      });
      spritesFolder.file('custom_sprites.json', JSON.stringify(cleanSprites, null, 2));
      packJson.content.sprites = { path: 'sprites/', autoLoad: true };
    }

    // Write pack.json
    datapack.file('pack.json', JSON.stringify(packJson, null, 2));

    // Generate and download
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'custom_datapack.zip');
  }, [content]);

  // Get total content count
  const getTotalCount = useCallback(() => {
    return Object.values(content).reduce((sum, arr) => sum + arr.length, 0);
  }, [content]);

  // Render tab content
  const renderTabContent = () => {
    const commonProps = {
      items: content[activeTab],
      allContent: content,
      onAdd: (item) => handleAddContent(activeTab, item),
      onUpdate: (itemId, item) => handleUpdateContent(activeTab, itemId, item),
      onDelete: (itemId) => handleDeleteContent(activeTab, itemId),
      onDuplicate: (item) => handleDuplicateContent(activeTab, item),
      onEdit: (item) => handleEditContent(activeTab, item),
      editingItem: editingItem?.type === activeTab ? editingItem.item : null,
      onCancelEdit: () => setEditingItem(null),
      // Datapack content for selection dropdowns (existing game content)
      datapackContent,
      datapackLoading,
    };

    switch (activeTab) {
      case 'items':
        return <ItemCreator {...commonProps} />;
      case 'scenes':
        return <SceneCreator {...commonProps} />;
      case 'quests':
        return <QuestCreator {...commonProps} />;
      case 'locations':
        return <LocationCreator {...commonProps} npcs={content.npcs} enemies={content.enemies} />;
      case 'npcs':
        return <NPCCreator {...commonProps} locations={content.locations} />;
      case 'enemies':
        return <EnemyCreator {...commonProps} scenes={content.scenes} />;
      case 'skills':
        return <SkillCreator {...commonProps} />;
      case 'effects':
        return <EffectCreator {...commonProps} />;
      case 'lootTables':
        return <LootTableCreator {...commonProps} />;
      case 'characters':
        return <CharacterCreator {...commonProps} />;
      case 'sprites':
        return <SpriteSheetManager {...commonProps} />;
      default:
        return <div style={{ color: '#a0a0c0' }}>Select a tab to begin creating content.</div>;
    }
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  // Count items in recovery data
  const getRecoveryCount = () => {
    if (!recoveryData) return 0;
    return Object.values(recoveryData).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  };

  return createPortal(
    <div style={styles.overlay}>
      <div
        style={{ ...styles.container, position: 'relative' }}
        onClick={e => e.stopPropagation()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag and Drop Overlay */}
        {isDragging && (
          <div style={styles.dropZone}>
            <div style={styles.dropZoneText}>Drop files to import</div>
            <div style={styles.dropZoneSubtext}>Supports .json and .zip files</div>
          </div>
        )}

        {/* Loading Screen for Datapack Resources */}
        {datapackLoading && (
          <div style={styles.loadingOverlay}>
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                @keyframes loadingProgress {
                  0% { width: 0%; margin-left: 0; }
                  50% { width: 70%; margin-left: 15%; }
                  100% { width: 0%; margin-left: 100%; }
                }
              `}
            </style>
            <div style={styles.loadingSpinner} />
            <div style={styles.loadingText}>Loading Datapack Resources</div>
            <div style={styles.loadingSubtext}>
              Fetching items, locations, NPCs, enemies, and more...
            </div>
            <div style={styles.loadingProgressBar}>
              <div style={styles.loadingProgressFill} />
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".json,.zip"
          multiple
          onChange={handleFileInputChange}
        />

        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>🛠️ Content Generator</h2>
          <div style={styles.headerButtons}>
            {/* Save Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '10px', padding: '4px 10px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
              <button
                style={{ ...styles.button, backgroundColor: '#3a6a9a', color: 'white', padding: '8px 12px' }}
                onClick={handleManualSave}
                title="Save progress now"
              >
                💾 Save
              </button>
              <button
                style={{ ...styles.button, backgroundColor: '#4a5a6a', color: 'white', padding: '8px 12px' }}
                onClick={() => setShowSaveModal(true)}
                title="Manage save slots"
              >
                📁 Slots
              </button>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: '#a0a0c0' }}>
                <input
                  type="checkbox"
                  checked={saveSettings.autoSaveEnabled}
                  onChange={toggleAutoSave}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                Auto-save
              </label>
            </div>
            <button
              style={{ ...styles.button, ...styles.importButton }}
              onClick={() => fileInputRef.current?.click()}
            >
              📥 Import
            </button>
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={handleClearAll}
            >
              Clear All
            </button>
            <button
              style={{ ...styles.button, ...styles.primaryButton }}
              onClick={handleExport}
              disabled={getTotalCount() === 0}
            >
              📦 Export ZIP ({getTotalCount()} items)
            </button>
            <button
              style={{ ...styles.button, ...styles.closeButton }}
              onClick={onClose}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={styles.mainContent}>
          {/* Sidebar */}
          <div style={styles.sidebar}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === tab.id ? styles.tabButtonActive : {}),
                  ...(hoveredTab === tab.id && activeTab !== tab.id ? styles.tabButtonHover : {}),
                }}
                onClick={() => setActiveTab(tab.id)}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                {tab.icon} {tab.label}
                {content[tab.id]?.length > 0 && (
                  <span style={styles.badge}>{content[tab.id].length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div style={styles.contentArea}>
            <div style={styles.workArea}>
              {renderTabContent()}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div style={styles.statusBar}>
          <span>
            {saveSettings.autoSaveEnabled
              ? (lastSaveTime ? `Auto-saved ${formatTimeAgo(lastSaveTime)}` : 'Auto-save enabled')
              : 'Auto-save disabled'
            } | Drag & drop files to import | {saveSlots.length} save slot{saveSlots.length !== 1 ? 's' : ''}
          </span>
          <span>
            Total: {getTotalCount()} items
            {datapackLoading ? ' | Loading datapacks...' : ` | ${Object.values(datapackContent).reduce((sum, arr) => sum + arr.length, 0)} datapack resources loaded`}
          </span>
        </div>

        {/* Session Recovery Modal */}
        {showRecoveryModal && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}>
            <div style={{
              backgroundColor: '#252540',
              borderRadius: '12px',
              border: '2px solid #4a7c4a',
              padding: '30px',
              maxWidth: '500px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>💾</div>
              <h3 style={{ color: '#ffd700', margin: '0 0 15px 0', fontSize: '20px' }}>
                Recover Previous Session?
              </h3>
              <p style={{ color: '#a0a0c0', margin: '0 0 10px 0', fontSize: '14px' }}>
                Found unsaved content from a previous session:
              </p>
              <p style={{ color: '#4a9f4a', margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>
                {getRecoveryCount()} items
              </p>
              <p style={{ color: '#808090', margin: '0 0 25px 0', fontSize: '12px' }}>
                Last saved: {lastSaveTime ? lastSaveTime.toLocaleString() : 'Unknown'}
              </p>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button
                  style={{
                    ...styles.button,
                    backgroundColor: '#4a7c4a',
                    color: 'white',
                    padding: '12px 30px',
                  }}
                  onClick={handleRecoverSession}
                >
                  ✓ Recover Session
                </button>
                <button
                  style={{
                    ...styles.button,
                    backgroundColor: '#5a3a3a',
                    color: '#ff9999',
                    padding: '12px 30px',
                  }}
                  onClick={handleDiscardSession}
                >
                  ✕ Start Fresh
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Slots Modal */}
        {showSaveModal && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}>
            <div style={{
              backgroundColor: '#252540',
              borderRadius: '12px',
              border: '2px solid #4a4a6a',
              padding: '25px',
              width: '500px',
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <h3 style={{ color: '#ffd700', margin: '0 0 20px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                📁 Save Slots
              </h3>

              {/* New Save Slot */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                  type="text"
                  value={newSlotName}
                  onChange={(e) => setNewSlotName(e.target.value)}
                  placeholder="Enter save name..."
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #4a4a6a',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                    fontSize: '14px',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newSlotName.trim()) {
                      handleSaveToSlot(newSlotName);
                    }
                  }}
                />
                <button
                  style={{
                    ...styles.button,
                    backgroundColor: '#4a7c4a',
                    color: 'white',
                    padding: '10px 20px',
                  }}
                  onClick={() => handleSaveToSlot(newSlotName)}
                  disabled={!newSlotName.trim()}
                >
                  + New Save
                </button>
              </div>

              {/* Existing Slots */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                marginBottom: '15px',
              }}>
                {saveSlots.length === 0 ? (
                  <p style={{ color: '#6a6a8a', textAlign: 'center', padding: '30px' }}>
                    No saved slots yet. Create one above.
                  </p>
                ) : (
                  saveSlots.map(slot => (
                    <div
                      key={slot.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        backgroundColor: '#1e1e35',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        border: '1px solid #3a3a5a',
                      }}
                    >
                      <div>
                        <div style={{ color: '#e0e0e0', fontWeight: 'bold', marginBottom: '4px' }}>
                          {slot.name}
                        </div>
                        <div style={{ color: '#6a6a8a', fontSize: '12px' }}>
                          Saved: {new Date(slot.savedAt).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          style={{
                            ...styles.button,
                            backgroundColor: '#3a6a9a',
                            color: 'white',
                            padding: '6px 12px',
                            fontSize: '12px',
                          }}
                          onClick={() => handleLoadFromSlot(slot.id)}
                        >
                          Load
                        </button>
                        <button
                          style={{
                            ...styles.button,
                            backgroundColor: '#7c4a4a',
                            color: 'white',
                            padding: '6px 12px',
                            fontSize: '12px',
                          }}
                          onClick={() => handleDeleteSlot(slot.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Close Button */}
              <button
                style={{
                  ...styles.button,
                  backgroundColor: '#4a4a6a',
                  color: 'white',
                  padding: '10px',
                }}
                onClick={() => setShowSaveModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Import Warnings Modal */}
        <ImportWarningsModal
          isOpen={showImportModal}
          onClose={handleCancelImport}
          importResult={importResult}
          onApplyImport={handleApplyImport}
          importedData={importedData}
          setImportedData={setImportedData}
        />
      </div>
    </div>,
    document.body
  );
};

export default ContentGenerator;
