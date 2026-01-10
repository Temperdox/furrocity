import React, { useState, useEffect, useMemo } from 'react';
import { FormInput, FormSelect, TagInput, Button, FormTabs, FormTabPanel } from '../../ui/shared';
import { CreatorItemsList, IdNameFields, DescriptionField } from '../shared';
import { useFormDraft } from '../../../hooks/useFormDraft';
import './CreatorStyles.css';

const DRAFT_KEY = 'contentGenerator_draft_characters';

// Generate cup sizes from Flat to ZZ
const generateCupSizes = () => {
  const sizes = [
    { value: 'flat', label: 'Flat', index: 0 },
    { value: 'bee_sting', label: 'Bee Sting', index: 1 },
  ];
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let index = 2;
  for (let i = 0; i < letters.length; i++) {
    sizes.push({ value: letters[i].toLowerCase(), label: `${letters[i]} Cup`, index: index++ });
    sizes.push({ value: `${letters[i]}${letters[i]}`.toLowerCase(), label: `${letters[i]}${letters[i]} Cup`, index: index++ });
  }
  return sizes;
};

const CUP_SIZES = generateCupSizes();

const SPECIES_OPTIONS = [
  { value: 'human', label: 'Human' },
  { value: 'wolf', label: 'Wolf' },
  { value: 'fox', label: 'Fox' },
  { value: 'cat', label: 'Cat' },
  { value: 'rabbit', label: 'Rabbit' },
  { value: 'dragon', label: 'Dragon' },
  { value: 'demon', label: 'Demon' },
  { value: 'elf', label: 'Elf' },
  { value: 'dog', label: 'Dog' },
  { value: 'bear', label: 'Bear' },
  { value: 'horse', label: 'Horse' },
  { value: 'deer', label: 'Deer' },
  { value: 'shark', label: 'Shark' },
  { value: 'kobold', label: 'Kobold' },
  { value: 'succubus', label: 'Succubus' },
  { value: 'vampire', label: 'Vampire' },
];

const BODY_TYPE_OPTIONS = [
  { value: 'slender', label: 'Slender' },
  { value: 'average', label: 'Average' },
  { value: 'athletic', label: 'Athletic' },
  { value: 'curvy', label: 'Curvy' },
  { value: 'muscular', label: 'Muscular' },
  { value: 'petite', label: 'Petite' },
  { value: 'thick', label: 'Thick' },
  { value: 'slim', label: 'Slim' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'futa', label: 'Futa' },
  { value: 'nonbinary', label: 'Non-Binary' },
  { value: 'androgynous', label: 'Androgynous' },
  { value: 'fluid', label: 'Fluid' },
];

const GENITALIA_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'penis', label: 'Penis' },
  { value: 'vagina', label: 'Vagina' },
  { value: 'both', label: 'Both (Futa)' },
];

const FACE_STYLE_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'cute', label: 'Cute' },
  { value: 'fierce', label: 'Fierce' },
  { value: 'mysterious', label: 'Mysterious' },
  { value: 'seductive', label: 'Seductive' },
  { value: 'gentle', label: 'Gentle' },
  { value: 'stern', label: 'Stern' },
  { value: 'playful', label: 'Playful' },
];

const DEFAULT_CHARACTER = {
  id: '',
  name: '',
  description: '',
  species: 'human',
  gender: 'female',
  bodyType: 'average',
  paperdollFolder: '',
  baseStats: {
    strength: 5,
    vitality: 5,
    intelligence: 5,
    willpower: 5,
    speed: 5,
    charm: 5,
    luck: 5,
  },
  paperdoll: {
    startingBase: 0,
    hasBreasts: true,
    maxBreastSize: 'c',
    breastImageCount: 0,
    hasGenitalia: true,
    genitaliaType: 'vagina',
    faceStyle: 'default',
    faceVariants: 1,
  },
  appearance: {
    skinColor: '#e8c4a0',
    hairColor: '#3d2314',
    eyeColor: '#4a90d9',
    furColor: '#8b6914',
  },
  startingEquipment: [],
  startingItems: [],
  backstory: '',
  personality: '',
};

const getBreastImageCount = (cupSize) => {
  const cupData = CUP_SIZES.find(c => c.value === cupSize);
  return cupData ? cupData.index + 1 : 1;
};

const CharacterCreator = ({
  items = [],
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
  const [formData, setFormData] = useState({ ...DEFAULT_CHARACTER });
  const [activeTab, setActiveTab] = useState('basic');

  const { clearDraft } = useFormDraft(DRAFT_KEY, formData, setFormData, editingItem, {
    defaultValues: DEFAULT_CHARACTER,
  });

  const cupSizeOptions = useMemo(() => {
    return CUP_SIZES.map(c => ({ value: c.value, label: c.label }));
  }, []);

  // Define tabs with badges
  const tabs = useMemo(() => {
    const hasStats = Object.values(formData.baseStats).some(v => v !== 5);
    const hasBackground = formData.backstory || formData.personality;
    const hasEquipment = formData.startingEquipment.length > 0 || formData.startingItems.length > 0;

    return [
      { id: 'basic', label: 'Basic' },
      { id: 'paperdoll', label: 'Paperdoll' },
      { id: 'stats', label: 'Stats', badge: hasStats ? '!' : null },
      { id: 'colors', label: 'Colors' },
      { id: 'background', label: 'Background', badge: hasBackground ? '!' : null },
    ];
  }, [formData.baseStats, formData.backstory, formData.personality, formData.startingEquipment.length, formData.startingItems.length]);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...DEFAULT_CHARACTER,
        ...editingItem,
        baseStats: { ...DEFAULT_CHARACTER.baseStats, ...editingItem.baseStats },
        paperdoll: { ...DEFAULT_CHARACTER.paperdoll, ...editingItem.paperdoll },
        appearance: { ...DEFAULT_CHARACTER.appearance, ...editingItem.appearance },
      });
    } else {
      setFormData({ ...DEFAULT_CHARACTER });
    }
  }, [editingItem]);

  // Auto-generate folder name from character name
  useEffect(() => {
    if (formData.name && !editingItem) {
      const folderName = formData.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      setFormData(prev => ({ ...prev, paperdollFolder: folderName }));
    }
  }, [formData.name, editingItem]);

  // Update breast image count when cup size changes
  useEffect(() => {
    const count = getBreastImageCount(formData.paperdoll.maxBreastSize);
    if (count !== formData.paperdoll.breastImageCount) {
      setFormData(prev => ({
        ...prev,
        paperdoll: { ...prev.paperdoll, breastImageCount: count },
      }));
    }
  }, [formData.paperdoll.maxBreastSize]);

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

    if (!formData.paperdollFolder) {
      alert('Paperdoll folder name is required');
      return;
    }

    if (!editingItem && items.some(item => item.id === formData.id)) {
      alert('A character with this ID already exists');
      return;
    }

    if (editingItem) {
      onUpdate(editingItem._id, formData);
    } else {
      onAdd(formData);
      clearDraft();
    }

    setFormData({ ...DEFAULT_CHARACTER });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_CHARACTER });
    onCancelEdit();
  };

  const getImagePathPreview = () => {
    const folder = formData.paperdollFolder || '[folder_name]';
    return `public/images/${folder}/`;
  };

  return (
    <div className="creator-container">
      {/* Form Section */}
      <div className="creator-form">
        <h3 className="creator-form-section-title">
          {editingItem ? 'Edit Character' : 'Create New Character'}
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
              idPlaceholder="unique_character_id"
              namePlaceholder="Character Name"
            />

            <div className="creator-form-row cols-3">
              <FormSelect
                label="Species"
                value={formData.species}
                onChange={(v) => handleChange('species', v)}
                options={SPECIES_OPTIONS}
              />
              <FormSelect
                label="Gender"
                value={formData.gender}
                onChange={(v) => handleChange('gender', v)}
                options={GENDER_OPTIONS}
              />
              <FormSelect
                label="Body Type"
                value={formData.bodyType}
                onChange={(v) => handleChange('bodyType', v)}
                options={BODY_TYPE_OPTIONS}
              />
            </div>

            <DescriptionField
              value={formData.description}
              onChange={(v) => handleChange('description', v)}
              placeholder="A brief description of the character..."
            />
          </div>
        </FormTabPanel>

        {/* Paperdoll Tab */}
        <FormTabPanel id="paperdoll" activeTab={activeTab}>
          {/* Image Folder Section */}
          <div className="creator-form-section">
            <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
              Image Folder
            </h4>
            <FormInput
              label="Paperdoll Folder Name"
              required
              value={formData.paperdollFolder}
              onChange={(v) => handleChange('paperdollFolder', String(v).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))}
              placeholder="character_folder_name"
            />
            <div className="path-preview">
              <div className="path-preview-label">Image Path:</div>
              <div className="path-preview-value valid">{getImagePathPreview()}</div>
            </div>
          </div>

          {/* Breast Configuration Section */}
          <div className="creator-form-section">
            <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
              Breast Configuration
            </h4>
            <div className="creator-form-row">
              <div className="checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.paperdoll.hasBreasts}
                    onChange={(e) => handleNestedChange('paperdoll', 'hasBreasts', e.target.checked)}
                  />
                  <span className="checkbox-text">Has Breast Images</span>
                </label>
              </div>
              <FormSelect
                label="Maximum Breast Size"
                value={formData.paperdoll.maxBreastSize}
                onChange={(v) => handleNestedChange('paperdoll', 'maxBreastSize', v)}
                options={cupSizeOptions}
                disabled={!formData.paperdoll.hasBreasts}
              />
            </div>
            {formData.paperdoll.hasBreasts && (
              <div className="form-helper mt-sm">
                Required: {formData.paperdoll.breastImageCount} breast images (breast_flat.png through breast_{formData.paperdoll.maxBreastSize}.png)
              </div>
            )}
          </div>

          {/* Genitalia Configuration Section */}
          <div className="creator-form-section">
            <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
              Genitalia Configuration
            </h4>
            <div className="creator-form-row">
              <div className="checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.paperdoll.hasGenitalia}
                    onChange={(e) => handleNestedChange('paperdoll', 'hasGenitalia', e.target.checked)}
                  />
                  <span className="checkbox-text">Has Genitalia Images</span>
                </label>
              </div>
              <FormSelect
                label="Genitalia Type"
                value={formData.paperdoll.genitaliaType}
                onChange={(v) => handleNestedChange('paperdoll', 'genitaliaType', v)}
                options={GENITALIA_OPTIONS}
                disabled={!formData.paperdoll.hasGenitalia}
              />
            </div>
          </div>

          {/* Face Configuration Section */}
          <div className="creator-form-section">
            <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
              Face Configuration
            </h4>
            <div className="creator-form-row">
              <FormSelect
                label="Face Style"
                value={formData.paperdoll.faceStyle}
                onChange={(v) => handleNestedChange('paperdoll', 'faceStyle', v)}
                options={FACE_STYLE_OPTIONS}
              />
              <FormInput
                label="Face Variants Count"
                type="number"
                value={formData.paperdoll.faceVariants}
                onChange={(v) => handleNestedChange('paperdoll', 'faceVariants', v)}
                min={1}
                max={20}
              />
            </div>
          </div>
        </FormTabPanel>

        {/* Stats Tab */}
        <FormTabPanel id="stats" activeTab={activeTab}>
          <div className="creator-form-section">
            <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
              Base Stats
            </h4>
            <div className="stats-grid">
              {Object.entries(formData.baseStats).map(([stat, value]) => (
                <div key={stat} className="stat-row">
                  <span className="stat-label">{stat.charAt(0).toUpperCase() + stat.slice(1)}</span>
                  <input
                    type="number"
                    className="stat-input"
                    min={1}
                    max={10}
                    value={value}
                    onChange={(e) => handleNestedChange('baseStats', stat, parseInt(e.target.value) || 5)}
                  />
                </div>
              ))}
            </div>
          </div>
        </FormTabPanel>

        {/* Colors Tab */}
        <FormTabPanel id="colors" activeTab={activeTab}>
          <div className="creator-form-section">
            <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
              Appearance Colors
            </h4>
            {Object.entries(formData.appearance).map(([colorKey, colorValue]) => (
              <div key={colorKey} className="creator-form-row" style={{ alignItems: 'flex-end' }}>
                <div style={{ width: '50px' }}>
                  <label className="form-label">{colorKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                  <input
                    type="color"
                    value={colorValue}
                    onChange={(e) => handleNestedChange('appearance', colorKey, e.target.value)}
                    style={{ width: '40px', height: '30px', padding: 0, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                  />
                </div>
                <FormInput
                  value={colorValue}
                  onChange={(v) => handleNestedChange('appearance', colorKey, v)}
                  placeholder="#FFFFFF"
                />
              </div>
            ))}
          </div>
        </FormTabPanel>

        {/* Background Tab */}
        <FormTabPanel id="background" activeTab={activeTab}>
          <div className="creator-form-section">
            <FormInput
              label="Backstory"
              type="textarea"
              value={formData.backstory}
              onChange={(v) => handleChange('backstory', v)}
              placeholder="The character's history and origins..."
              rows={5}
            />
            <FormInput
              label="Personality"
              type="textarea"
              value={formData.personality}
              onChange={(v) => handleChange('personality', v)}
              placeholder="Personality traits, behaviors, quirks..."
              rows={3}
            />
          </div>
        </FormTabPanel>

        {/* Action Buttons */}
        <div className="creator-actions">
          <Button variant="success" onClick={handleSubmit}>
            {editingItem ? 'Update Character' : 'Add Character'}
          </Button>
          {editingItem && (
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Preview Section */}
      <div className="creator-list" style={{ width: '300px' }}>
        <h3 className="creator-form-section-title">Preview</h3>

        <div style={{
          width: '256px',
          height: '300px',
          backgroundColor: 'var(--color-bg-primary)',
          borderRadius: 'var(--radius-lg)',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid var(--color-border)',
          marginBottom: 'var(--space-md)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-sm)' }}>&#129489;</div>
          <div style={{ color: 'var(--color-accent-primary)', marginBottom: 'var(--space-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
            {formData.name || 'Unnamed'}
          </div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: '1.6' }}>
            <div>Base: masc_base_0 → fem_base_10</div>
            <div>Max Chest: {CUP_SIZES.find(c => c.value === formData.paperdoll.maxBreastSize)?.label || 'C Cup'}</div>
            <div>Genitalia: {formData.paperdoll.genitaliaType}</div>
            <div>Face: {formData.paperdoll.faceStyle}</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-sm)' }}>
            {formData.species} | {formData.gender} | {formData.bodyType}
          </div>
        </div>

        <div className="path-preview">
          <div className="path-preview-label">Folder:</div>
          <div className="path-preview-value valid">{getImagePathPreview()}</div>
        </div>

        {/* Characters List */}
        <CreatorItemsList
          items={items}
          title="Characters"
          itemType="character"
          emptyMessage="No characters created yet."
          editingItem={editingItem}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          renderItemContent={(item) => (
            <>
              <div className="creator-item-name">{item.name}</div>
              <div className="creator-item-id">
                {item.species} | {item.gender} | {item.paperdoll?.maxBreastSize?.toUpperCase() || 'C'} Cup
              </div>
              <div className="creator-item-id" style={{ color: 'var(--color-accent-success)' }}>
                {item.paperdollFolder || 'no folder'}
              </div>
            </>
          )}
        />
      </div>
    </div>
  );
};

export default CharacterCreator;
