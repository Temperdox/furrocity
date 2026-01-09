import React, { useState, useEffect, useMemo } from 'react';
import { FormInput, FormSelect, TagInput, Button, CollapsibleSection } from '../../ui/shared';
import { useFormDraft } from '../../../hooks/useFormDraft';
import './CreatorStyles.css';

const DRAFT_KEY = 'contentGenerator_draft_regions';

const TAG_CATEGORIES = {
  difficulty: ['starter', 'safe', 'dangerous', 'corruption', 'nsfw'],
  terrain: ['forest', 'mountain', 'plains', 'swamp', 'desert', 'coastal', 'underground'],
  atmosphere: ['demonic', 'holy', 'magical', 'cursed', 'peaceful'],
};

const DEFAULT_REGION = {
  id: '',
  name: '',
  description: '',
  theme: '',
  dangerRange: { min: 1, max: 3 },
  levelRange: { min: 1, max: 10 },
  tags: [],
  unlockRequirements: null,
  mapPosition: { x: 0, y: 0 },
  mapIcon: '',
  neighborRegions: [],
  ambientMusic: '',
  travelCost: {
    gold: 0,
    time: 1,
  },
};

const RegionCreator = ({
  items = [],
  onAdd,
  onUpdate,
  onDelete,
  onDuplicate,
  onEdit,
  editingItem,
  onCancelEdit,
}) => {
  const [formData, setFormData] = useState({ ...DEFAULT_REGION });
  const [hoveredItem, setHoveredItem] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({
    difficulty: true,
    mapTravel: true,
    connectedRegions: true,
    tags: true,
    audio: true,
  });

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const { clearDraft } = useFormDraft(DRAFT_KEY, formData, setFormData, editingItem, {
    defaultValues: DEFAULT_REGION,
  });

  const suggestedTags = useMemo(() => {
    const allTags = new Set(Object.values(TAG_CATEGORIES).flat());
    items.forEach(item => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach(tag => allTags.add(tag));
      }
    });
    return Array.from(allTags).sort();
  }, [items]);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...DEFAULT_REGION,
        ...editingItem,
        dangerRange: editingItem.dangerRange || { min: 1, max: 3 },
        levelRange: editingItem.levelRange || { min: 1, max: 10 },
        mapPosition: editingItem.mapPosition || { x: 0, y: 0 },
        travelCost: editingItem.travelCost || { gold: 0, time: 1 },
        neighborRegions: editingItem.neighborRegions || [],
      });
    } else {
      setFormData({ ...DEFAULT_REGION });
    }
  }, [editingItem]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
  };

  const handleSubmit = () => {
    if (!formData.id || !formData.name) {
      alert('ID and Name are required');
      return;
    }

    if (!editingItem && items.some(item => item.id === formData.id)) {
      alert('A region with this ID already exists');
      return;
    }

    if (editingItem) {
      onUpdate(editingItem._id, formData);
    } else {
      onAdd(formData);
      clearDraft();
    }

    setFormData({ ...DEFAULT_REGION });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_REGION });
    onCancelEdit();
  };

  // Available regions to connect to
  const availableNeighbors = items.filter(r => r.id !== formData.id && !formData.neighborRegions.includes(r.id));

  return (
    <div className="creator-container">
      {/* Form Section */}
      <div className="creator-form">
        <h3 className="creator-form-section-title">
          {editingItem ? 'Edit Region' : 'Create New Region'}
        </h3>

        {/* Basic Info */}
        <div className="creator-form-section">
          <div className="creator-form-row">
            <FormInput
              label="ID"
              required
              value={formData.id}
              onChange={(v) => handleChange('id', String(v).toLowerCase().replace(/\s/g, '_'))}
              placeholder="unique_region_id"
            />
            <FormInput
              label="Name"
              required
              value={formData.name}
              onChange={(v) => handleChange('name', v)}
              placeholder="Region Name"
            />
          </div>

          <FormInput
            label="Description"
            type="textarea"
            value={formData.description}
            onChange={(v) => handleChange('description', v)}
            placeholder="Describe this region..."
            rows={3}
          />

          <FormInput
            label="Theme"
            value={formData.theme}
            onChange={(v) => handleChange('theme', v)}
            placeholder="A brief thematic description"
          />
        </div>

        {/* Difficulty Settings */}
        <CollapsibleSection
          title="Difficulty Settings"
          isCollapsed={collapsedSections.difficulty}
          onToggle={() => toggleSection('difficulty')}
          badge={`Lvl ${formData.levelRange.min}-${formData.levelRange.max}`}
        >
          <div className="creator-form-row">
            <FormInput
              label="Min Level"
              type="number"
              value={formData.levelRange.min}
              onChange={(v) => handleNestedChange('levelRange', 'min', v)}
              min={1}
            />
            <FormInput
              label="Max Level"
              type="number"
              value={formData.levelRange.max}
              onChange={(v) => handleNestedChange('levelRange', 'max', v)}
              min={1}
            />
          </div>
          <div className="creator-form-row">
            <FormInput
              label="Min Danger (1-5)"
              type="number"
              value={formData.dangerRange.min}
              onChange={(v) => handleNestedChange('dangerRange', 'min', v)}
              min={1}
              max={5}
            />
            <FormInput
              label="Max Danger (1-5)"
              type="number"
              value={formData.dangerRange.max}
              onChange={(v) => handleNestedChange('dangerRange', 'max', v)}
              min={1}
              max={5}
            />
          </div>
        </CollapsibleSection>

        {/* Map & Travel */}
        <CollapsibleSection
          title="Map & Travel"
          isCollapsed={collapsedSections.mapTravel}
          onToggle={() => toggleSection('mapTravel')}
          badge={formData.travelCost.gold > 0 ? `${formData.travelCost.gold}g` : null}
        >
          <div className="creator-form-row">
            <FormInput
              label="Map Position X"
              type="number"
              value={formData.mapPosition.x}
              onChange={(v) => handleNestedChange('mapPosition', 'x', v)}
            />
            <FormInput
              label="Map Position Y"
              type="number"
              value={formData.mapPosition.y}
              onChange={(v) => handleNestedChange('mapPosition', 'y', v)}
            />
          </div>
          <div className="creator-form-row">
            <FormInput
              label="Travel Cost (Gold)"
              type="number"
              value={formData.travelCost.gold}
              onChange={(v) => handleNestedChange('travelCost', 'gold', v)}
              min={0}
            />
            <FormInput
              label="Travel Time (hours)"
              type="number"
              value={formData.travelCost.time}
              onChange={(v) => handleNestedChange('travelCost', 'time', v)}
              min={1}
            />
          </div>
          <FormInput
            label="Map Icon"
            value={formData.mapIcon}
            onChange={(v) => handleChange('mapIcon', v)}
            placeholder="/icons/region_icon.png"
          />
        </CollapsibleSection>

        {/* Connected Regions */}
        <CollapsibleSection
          title="Connected Regions"
          isCollapsed={collapsedSections.connectedRegions}
          onToggle={() => toggleSection('connectedRegions')}
          badge={formData.neighborRegions.length > 0 ? `${formData.neighborRegions.length} links` : null}
        >
          <TagInput
            value={formData.neighborRegions}
            onChange={(v) => handleChange('neighborRegions', v)}
            suggestions={availableNeighbors.map(r => r.id)}
            placeholder="Add region ID..."
            showSuggestions
          />
          {availableNeighbors.length > 0 && (
            <div className="form-helper mt-sm">
              Click regions above to connect them, or type a region ID.
            </div>
          )}
        </CollapsibleSection>

        {/* Tags */}
        <CollapsibleSection
          title="Tags"
          isCollapsed={collapsedSections.tags}
          onToggle={() => toggleSection('tags')}
          badge={formData.tags.length > 0 ? `${formData.tags.length} tags` : null}
        >
          <TagInput
            value={formData.tags}
            onChange={(v) => handleChange('tags', v)}
            suggestions={suggestedTags}
            categories={TAG_CATEGORIES}
            placeholder="Add tag..."
            showSuggestions
          />
        </CollapsibleSection>

        {/* Audio */}
        <CollapsibleSection
          title="Audio"
          isCollapsed={collapsedSections.audio}
          onToggle={() => toggleSection('audio')}
          badge={formData.ambientMusic ? '✓' : null}
        >
          <FormInput
            label="Ambient Music"
            value={formData.ambientMusic}
            onChange={(v) => handleChange('ambientMusic', v)}
            placeholder="region_ambient_music"
          />
        </CollapsibleSection>

        {/* Action Buttons */}
        <div className="creator-actions">
          <Button variant="success" onClick={handleSubmit}>
            {editingItem ? 'Update Region' : 'Add Region'}
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
          Created Regions
          <span className="count-badge">{items.length}</span>
        </h3>

        {items.length === 0 ? (
          <div className="empty-list">
            No regions created yet.
            <br />
            Use the form to create your first region.
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
                <div className="creator-item-name">
                  {item.name}
                </div>
                <div className="creator-item-id">
                  ID: {item.id} | Levels: {item.levelRange?.min}-{item.levelRange?.max}
                </div>
                {item.tags?.length > 0 && (
                  <div className="creator-item-tags">
                    {item.tags.slice(0, 4).map(tag => (
                      <span key={tag} className="tag-chip">{tag}</span>
                    ))}
                    {item.tags.length > 4 && (
                      <span className="tag-chip more">+{item.tags.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="creator-item-actions">
                <Button variant="success" size="sm" onClick={() => onEdit(item)}>
                  Edit
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onDuplicate(item)}>
                  Duplicate
                </Button>
                <Button variant="danger" size="sm" onClick={() => onDelete(item._id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RegionCreator;
