import React, { useState, useEffect, useMemo } from 'react';
import { FormInput, FormSelect, TagInput, Button, FormTabs, FormTabPanel } from '../../ui/shared';
import { CreatorItemsList, IdNameFields, DescriptionField } from '../shared';
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
  const [activeTab, setActiveTab] = useState('basic');

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

  // Define tabs with badges
  const tabs = useMemo(() => {
    const hasLevelRange = formData.levelRange.min > 1 || formData.levelRange.max > 10;
    const hasDangerRange = formData.dangerRange.min > 1 || formData.dangerRange.max > 3;
    const hasMapSettings = formData.mapPosition.x !== 0 || formData.mapPosition.y !== 0 || formData.travelCost.gold > 0;

    return [
      { id: 'basic', label: 'Basic' },
      { id: 'difficulty', label: 'Difficulty', badge: hasLevelRange || hasDangerRange ? `Lvl ${formData.levelRange.min}-${formData.levelRange.max}` : null },
      { id: 'mapTravel', label: 'Map & Travel', badge: hasMapSettings ? (formData.travelCost.gold > 0 ? `${formData.travelCost.gold}g` : null) : null },
      { id: 'connections', label: 'Connections', badge: formData.neighborRegions.length > 0 ? `${formData.neighborRegions.length} links` : null },
      { id: 'tags', label: 'Tags', badge: formData.tags.length > 0 ? `${formData.tags.length} tags` : null },
      { id: 'audio', label: 'Audio', badge: formData.ambientMusic ? '✓' : null },
    ];
  }, [formData.levelRange, formData.dangerRange, formData.mapPosition, formData.travelCost, formData.neighborRegions.length, formData.tags.length, formData.ambientMusic]);

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

        <FormTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Basic Tab */}
        <FormTabPanel id="basic" activeTab={activeTab}>
          <IdNameFields
            idValue={formData.id}
            nameValue={formData.name}
            onIdChange={(v) => handleChange('id', v)}
            onNameChange={(v) => handleChange('name', v)}
            idPlaceholder="unique_region_id"
            namePlaceholder="Region Name"
          />

          <DescriptionField
            value={formData.description}
            onChange={(v) => handleChange('description', v)}
            placeholder="Describe this region..."
          />

          <FormInput
            label="Theme"
            value={formData.theme}
            onChange={(v) => handleChange('theme', v)}
            placeholder="A brief thematic description"
          />
        </FormTabPanel>

        {/* Difficulty Tab */}
        <FormTabPanel id="difficulty" activeTab={activeTab}>
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
        </FormTabPanel>

        {/* Map & Travel Tab */}
        <FormTabPanel id="mapTravel" activeTab={activeTab}>
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
        </FormTabPanel>

        {/* Connections Tab */}
        <FormTabPanel id="connections" activeTab={activeTab}>
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
        </FormTabPanel>

        {/* Tags Tab */}
        <FormTabPanel id="tags" activeTab={activeTab}>
          <TagInput
            value={formData.tags}
            onChange={(v) => handleChange('tags', v)}
            suggestions={suggestedTags}
            categories={TAG_CATEGORIES}
            placeholder="Add tag..."
            showSuggestions
          />
        </FormTabPanel>

        {/* Audio Tab */}
        <FormTabPanel id="audio" activeTab={activeTab}>
          <FormInput
            label="Ambient Music"
            value={formData.ambientMusic}
            onChange={(v) => handleChange('ambientMusic', v)}
            placeholder="region_ambient_music"
          />
        </FormTabPanel>

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
      <CreatorItemsList
        items={items}
        title="Created Regions"
        itemType="region"
        editingItem={editingItem}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        renderItemContent={(item) => (
          <>
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
          </>
        )}
      />
    </div>
  );
};

export default RegionCreator;
