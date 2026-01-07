import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Import system
import { ImportSystem } from './ImportSystem';
import ImportWarningsModal from './ImportWarningsModal';

// Import tab components (we'll create these)
import ItemCreator from './tabs/ItemCreator';
import SceneCreator from './tabs/SceneCreator';
import LocationCreator from './tabs/LocationCreator';
import RegionCreator from './tabs/RegionCreator';
import NPCCreator from './tabs/NPCCreator';
import EnemyCreator from './tabs/EnemyCreator';
import EffectCreator from './tabs/EffectCreator';
import CharacterCreator from './tabs/CharacterCreator';
import SpriteSheetManager from './tabs/SpriteSheetManager';

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
};

const TABS = [
  { id: 'items', label: 'Items', icon: '⚔️' },
  { id: 'scenes', label: 'Scenes', icon: '📜' },
  { id: 'locations', label: 'Locations', icon: '🏠' },
  { id: 'regions', label: 'Regions', icon: '🗺️' },
  { id: 'npcs', label: 'NPCs', icon: '👤' },
  { id: 'enemies', label: 'Enemies', icon: '👹' },
  { id: 'effects', label: 'Effects', icon: '✨' },
  { id: 'characters', label: 'Characters', icon: '🧑' },
  { id: 'sprites', label: 'Sprites', icon: '🖼️' },
];

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

  // Content storage for all types
  const [content, setContent] = useState({
    items: [],
    scenes: [],
    locations: [],
    regions: [],
    npcs: [],
    enemies: [],
    effects: [],
    characters: [],
    sprites: [],
  });

  // Track what's being edited
  const [editingItem, setEditingItem] = useState(null);

  // Load saved content from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('contentGenerator_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setContent(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to load saved content:', e);
      }
    }
  }, []);

  // Auto-save content to localStorage
  useEffect(() => {
    localStorage.setItem('contentGenerator_data', JSON.stringify(content));
  }, [content]);

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
        locations: [],
        regions: [],
        npcs: [],
        enemies: [],
        effects: [],
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

    // Regions
    if (content.regions.length > 0) {
      const cleanRegions = content.regions.map(region => {
        const clean = { ...region };
        delete clean._id;
        return clean;
      });
      const locationsFolder = datapack.folder('locations') || datapack.folder('locations');
      locationsFolder.file('custom_regions.json', JSON.stringify(cleanRegions, null, 2));
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
    };

    switch (activeTab) {
      case 'items':
        return <ItemCreator {...commonProps} />;
      case 'scenes':
        return <SceneCreator {...commonProps} />;
      case 'locations':
        return <LocationCreator {...commonProps} regions={content.regions} />;
      case 'regions':
        return <RegionCreator {...commonProps} />;
      case 'npcs':
        return <NPCCreator {...commonProps} locations={content.locations} />;
      case 'enemies':
        return <EnemyCreator {...commonProps} />;
      case 'effects':
        return <EffectCreator {...commonProps} />;
      case 'characters':
        return <CharacterCreator {...commonProps} />;
      case 'sprites':
        return <SpriteSheetManager {...commonProps} />;
      default:
        return <div style={{ color: '#a0a0c0' }}>Select a tab to begin creating content.</div>;
    }
  };

  return createPortal(
    <div style={styles.overlay} onClick={onClose}>
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
            Content auto-saved to browser storage | Drag & drop files to import
          </span>
          <span>
            Total: {getTotalCount()} items |
            Items: {content.items.length} |
            Scenes: {content.scenes.length} |
            Locations: {content.locations.length} |
            NPCs: {content.npcs.length} |
            Enemies: {content.enemies.length}
          </span>
        </div>

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
