import React, { useState, useEffect } from 'react';

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
  previewSection: {
    width: '300px',
    backgroundColor: '#252540',
    borderRadius: '8px',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
  },
  listSection: {
    width: '280px',
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
  statRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  statLabel: {
    width: '100px',
    color: '#a0a0c0',
    fontSize: '13px',
  },
  statInput: {
    width: '80px',
    padding: '6px',
    borderRadius: '4px',
    border: '1px solid #4a4a6a',
    backgroundColor: '#1a1a2e',
    color: 'white',
    fontSize: '13px',
    textAlign: 'center',
  },
  paperdollContainer: {
    position: 'relative',
    width: '256px',
    height: '384px',
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    margin: '0 auto',
    overflow: 'hidden',
    border: '2px solid #4a4a6a',
  },
  colorPicker: {
    width: '40px',
    height: '30px',
    padding: '0',
    border: '1px solid #4a4a6a',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  slider: {
    width: '100%',
    accentColor: '#ffd700',
  },
  infoBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: '6px',
    padding: '10px',
    marginTop: '10px',
    border: '1px solid #3a3a5a',
  },
  infoText: {
    color: '#808090',
    fontSize: '11px',
    lineHeight: '1.4',
  },
  pathPreview: {
    fontFamily: 'monospace',
    backgroundColor: '#0d0d1a',
    padding: '8px',
    borderRadius: '4px',
    color: '#4a9c4a',
    fontSize: '11px',
    marginTop: '5px',
    wordBreak: 'break-all',
  },
};

// Generate cup sizes from Flat to ZZ
const generateCupSizes = () => {
  const sizes = [
    { value: 'flat', label: 'Flat', index: 0 },
    { value: 'bee_sting', label: 'Bee Sting', index: 1 },
  ];

  // Single letters A-Z
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
];

const BODY_TYPES = [
  { value: 'slender', label: 'Slender' },
  { value: 'average', label: 'Average' },
  { value: 'athletic', label: 'Athletic' },
  { value: 'curvy', label: 'Curvy' },
  { value: 'muscular', label: 'Muscular' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'futa', label: 'Futa' },
  { value: 'nonbinary', label: 'Non-binary' },
];

const GENITALIA_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'penis', label: 'Penis' },
  { value: 'vagina', label: 'Vagina' },
  { value: 'both', label: 'Both (Futa)' },
];

const FACE_STYLES = [
  { value: 'default', label: 'Default' },
  { value: 'cute', label: 'Cute' },
  { value: 'fierce', label: 'Fierce' },
  { value: 'mysterious', label: 'Mysterious' },
  { value: 'seductive', label: 'Seductive' },
];

const DEFAULT_CHARACTER = {
  id: '',
  name: '',
  description: '',
  species: 'human',
  gender: 'female',
  bodyType: 'average',

  // Paperdoll folder settings
  paperdollFolder: '', // Will be set based on character name

  baseStats: {
    strength: 5,
    vitality: 5,
    intelligence: 5,
    willpower: 5,
    speed: 5,
    charm: 5,
    luck: 5,
  },

  // Paperdoll image configuration
  paperdoll: {
    // All characters start at masc_0, progress to fem_10
    startingBase: 0, // 0 = masc_base_0

    // Character-specific images in the character folder
    hasBreasts: true,
    maxBreastSize: 'c', // Cup size - determines available breast images
    breastImageCount: 0, // Auto-calculated based on cup size

    hasGenitalia: true,
    genitaliaType: 'vagina', // none, penis, vagina, both

    faceStyle: 'default',
    faceVariants: 1, // Number of face variants available
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

// Calculate breast image count based on cup size
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
}) => {
  const [formData, setFormData] = useState({ ...DEFAULT_CHARACTER });
  const [hoveredItem, setHoveredItem] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

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
    }

    setFormData({ ...DEFAULT_CHARACTER });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_CHARACTER });
    onCancelEdit();
  };

  // Get the image path preview
  const getImagePathPreview = () => {
    const folder = formData.paperdollFolder || '[folder_name]';
    return `public/images/${folder}/`;
  };

  // Render paperdoll preview
  const renderPaperdoll = () => {
    const folder = formData.paperdollFolder || 'character';
    const cupData = CUP_SIZES.find(c => c.value === formData.paperdoll.maxBreastSize);

    return (
      <div style={styles.paperdollContainer}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#808090',
          fontSize: '12px',
          textAlign: 'center',
          padding: '20px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🧑</div>
          <div style={{ color: '#ffd700', marginBottom: '10px' }}>{formData.name || 'Unnamed'}</div>
          <div style={{ fontSize: '10px', lineHeight: '1.6' }}>
            <div>Base: masc_base_0 → fem_base_10</div>
            <div>Max Chest: {cupData?.label || 'C Cup'}</div>
            <div>Genitalia: {formData.paperdoll.genitaliaType}</div>
            <div>Face: {formData.paperdoll.faceStyle}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Form Section */}
      <div style={styles.formSection}>
        <h3 style={styles.sectionTitle}>
          {editingItem ? '✏️ Edit Character' : '➕ Create New Character'}
        </h3>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {['basic', 'paperdoll', 'stats', 'colors', 'background'].map(tab => (
            <button
              key={tab}
              style={{
                ...styles.smallButton,
                backgroundColor: activeTab === tab ? '#4a4a7c' : '#3a3a5a',
                color: activeTab === tab ? '#ffd700' : '#a0a0c0',
                padding: '8px 16px',
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Basic Tab */}
        {activeTab === 'basic' && (
          <>
            <div style={styles.row}>
              <div style={styles.halfWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>ID *</label>
                  <input
                    style={styles.input}
                    value={formData.id}
                    onChange={(e) => handleChange('id', e.target.value.toLowerCase().replace(/\s/g, '_'))}
                    placeholder="unique_character_id"
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
                    placeholder="Character Name"
                  />
                </div>
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.thirdWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Species</label>
                  <select
                    style={styles.select}
                    value={formData.species}
                    onChange={(e) => handleChange('species', e.target.value)}
                  >
                    {SPECIES_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.thirdWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Gender</label>
                  <select
                    style={styles.select}
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                  >
                    {GENDER_OPTIONS.map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.thirdWidth}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Body Type</label>
                  <select
                    style={styles.select}
                    value={formData.bodyType}
                    onChange={(e) => handleChange('bodyType', e.target.value)}
                  >
                    {BODY_TYPES.map(b => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                style={styles.textarea}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="A brief description of the character..."
              />
            </div>
          </>
        )}

        {/* Paperdoll Tab */}
        {activeTab === 'paperdoll' && (
          <>
            <div style={styles.subsection}>
              <div style={styles.subsectionTitle}>📁 Image Folder</div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Paperdoll Folder Name *</label>
                <input
                  style={styles.input}
                  value={formData.paperdollFolder}
                  onChange={(e) => handleChange('paperdollFolder', e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))}
                  placeholder="character_folder_name"
                />
                <div style={styles.pathPreview}>
                  {getImagePathPreview()}
                </div>
              </div>

              <div style={styles.infoBox}>
                <div style={styles.infoText}>
                  <strong>Required Base Images:</strong><br/>
                  • masc_base_0.png through masc_base_10.png<br/>
                  • fem_base_1.png through fem_base_10.png<br/>
                  <br/>
                  All characters start at masc_base_0 and can transform up to fem_base_10.
                </div>
              </div>
            </div>

            <div style={styles.subsection}>
              <div style={styles.subsectionTitle}>👙 Breast Configuration</div>
              <div style={styles.row}>
                <div style={styles.halfWidth}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      <input
                        type="checkbox"
                        checked={formData.paperdoll.hasBreasts}
                        onChange={(e) => handleNestedChange('paperdoll', 'hasBreasts', e.target.checked)}
                        style={{ marginRight: '8px' }}
                      />
                      Has Breast Images
                    </label>
                  </div>
                </div>
                <div style={styles.halfWidth}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Maximum Breast Size</label>
                    <select
                      style={styles.select}
                      value={formData.paperdoll.maxBreastSize}
                      onChange={(e) => handleNestedChange('paperdoll', 'maxBreastSize', e.target.value)}
                      disabled={!formData.paperdoll.hasBreasts}
                    >
                      {CUP_SIZES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {formData.paperdoll.hasBreasts && (
                <div style={styles.infoBox}>
                  <div style={styles.infoText}>
                    <strong>Required Breast Images ({formData.paperdoll.breastImageCount} files):</strong><br/>
                    {CUP_SIZES.slice(0, formData.paperdoll.breastImageCount).map((cup, i) => (
                      <span key={cup.value}>breast_{cup.value}.png{i < formData.paperdoll.breastImageCount - 1 ? ', ' : ''}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={styles.subsection}>
              <div style={styles.subsectionTitle}>🍆 Genitalia Configuration</div>
              <div style={styles.row}>
                <div style={styles.halfWidth}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      <input
                        type="checkbox"
                        checked={formData.paperdoll.hasGenitalia}
                        onChange={(e) => handleNestedChange('paperdoll', 'hasGenitalia', e.target.checked)}
                        style={{ marginRight: '8px' }}
                      />
                      Has Genitalia Images
                    </label>
                  </div>
                </div>
                <div style={styles.halfWidth}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Genitalia Type</label>
                    <select
                      style={styles.select}
                      value={formData.paperdoll.genitaliaType}
                      onChange={(e) => handleNestedChange('paperdoll', 'genitaliaType', e.target.value)}
                      disabled={!formData.paperdoll.hasGenitalia}
                    >
                      {GENITALIA_TYPES.map(g => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {formData.paperdoll.hasGenitalia && (
                <div style={styles.infoBox}>
                  <div style={styles.infoText}>
                    <strong>Required Genitalia Images:</strong><br/>
                    {formData.paperdoll.genitaliaType === 'penis' && '• penis_[size].png (multiple sizes)'}
                    {formData.paperdoll.genitaliaType === 'vagina' && '• vagina.png'}
                    {formData.paperdoll.genitaliaType === 'both' && '• penis_[size].png, vagina.png'}
                    {formData.paperdoll.genitaliaType === 'none' && 'No genitalia images needed'}
                  </div>
                </div>
              )}
            </div>

            <div style={styles.subsection}>
              <div style={styles.subsectionTitle}>😊 Face Configuration</div>
              <div style={styles.row}>
                <div style={styles.halfWidth}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Face Style</label>
                    <select
                      style={styles.select}
                      value={formData.paperdoll.faceStyle}
                      onChange={(e) => handleNestedChange('paperdoll', 'faceStyle', e.target.value)}
                    >
                      {FACE_STYLES.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={styles.halfWidth}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Face Variants Count</label>
                    <input
                      style={styles.input}
                      type="number"
                      min="1"
                      max="20"
                      value={formData.paperdoll.faceVariants}
                      onChange={(e) => handleNestedChange('paperdoll', 'faceVariants', parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.infoBox}>
                <div style={styles.infoText}>
                  <strong>Required Face Images:</strong><br/>
                  face_{formData.paperdoll.faceStyle}_0.png
                  {formData.paperdoll.faceVariants > 1 && ` through face_${formData.paperdoll.faceStyle}_${formData.paperdoll.faceVariants - 1}.png`}
                </div>
              </div>
            </div>

            <div style={styles.infoBox}>
              <div style={styles.infoText}>
                <strong>📝 Note:</strong> Shared images (clothes, piercings, cum stains, etc.) are located in <code>public/images/shared/</code> and don't need to be specified per-character since all characters use the same height and pose.
              </div>
            </div>
          </>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div style={styles.subsection}>
            <div style={styles.subsectionTitle}>Base Stats</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {Object.entries(formData.baseStats).map(([stat, value]) => (
                <div key={stat} style={styles.statRow}>
                  <span style={styles.statLabel}>{stat.charAt(0).toUpperCase() + stat.slice(1)}</span>
                  <input
                    style={styles.statInput}
                    type="number"
                    min="1"
                    max="10"
                    value={value}
                    onChange={(e) => handleNestedChange('baseStats', stat, parseInt(e.target.value) || 5)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div style={styles.subsection}>
            <div style={styles.subsectionTitle}>Appearance Colors</div>
            {Object.entries(formData.appearance).map(([colorKey, colorValue]) => (
              <div key={colorKey} style={styles.formGroup}>
                <label style={styles.label}>{colorKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="color"
                    style={styles.colorPicker}
                    value={colorValue}
                    onChange={(e) => handleNestedChange('appearance', colorKey, e.target.value)}
                  />
                  <input
                    style={{ ...styles.input, flex: 1 }}
                    value={colorValue}
                    onChange={(e) => handleNestedChange('appearance', colorKey, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Background Tab */}
        {activeTab === 'background' && (
          <>
            <div style={styles.formGroup}>
              <label style={styles.label}>Backstory</label>
              <textarea
                style={{ ...styles.textarea, minHeight: '120px' }}
                value={formData.backstory}
                onChange={(e) => handleChange('backstory', e.target.value)}
                placeholder="The character's history and origins..."
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Personality</label>
              <textarea
                style={styles.textarea}
                value={formData.personality}
                onChange={(e) => handleChange('personality', e.target.value)}
                placeholder="Personality traits, behaviors, quirks..."
              />
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div style={{ marginTop: '20px' }}>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleSubmit}
          >
            {editingItem ? '💾 Update Character' : '➕ Add Character'}
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

      {/* Preview Section */}
      <div style={styles.previewSection}>
        <h3 style={styles.sectionTitle}>👤 Preview</h3>
        {renderPaperdoll()}
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <div style={{ color: '#ffd700', fontSize: '16px', fontWeight: 'bold' }}>
            {formData.name || 'Unnamed Character'}
          </div>
          <div style={{ color: '#a0a0c0', fontSize: '12px', marginTop: '5px' }}>
            {formData.species} • {formData.gender} • {formData.bodyType}
          </div>
        </div>

        <div style={{ ...styles.infoBox, marginTop: '15px' }}>
          <div style={styles.infoText}>
            <strong>Folder:</strong><br/>
            <code style={{ color: '#4a9c4a' }}>{getImagePathPreview()}</code>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div style={styles.listSection}>
        <h3 style={styles.sectionTitle}>📋 Characters ({items.length})</h3>

        {items.length === 0 ? (
          <div style={styles.emptyList}>
            No characters created yet.<br />
            Use the form to create your first character.
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
                🧑 {item.name}
              </div>
              <div style={styles.listItemDetails}>
                {item.species} • {item.gender} • {item.paperdoll?.maxBreastSize?.toUpperCase() || 'C'} Cup
              </div>
              <div style={{ ...styles.listItemDetails, color: '#4a9c4a', fontSize: '10px' }}>
                📁 {item.paperdollFolder || 'no folder'}
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
    </div>
  );
};

export default CharacterCreator;
