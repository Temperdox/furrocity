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
};

const COMMON_TAGS = [
  'starter', 'safe', 'dangerous', 'corruption', 'nsfw',
  'forest', 'mountain', 'plains', 'swamp', 'desert',
  'coastal', 'underground', 'demonic', 'holy', 'magical',
];

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
  const [tagInput, setTagInput] = useState('');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [neighborInput, setNeighborInput] = useState('');

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

  const handleAddNeighbor = () => {
    if (neighborInput && !formData.neighborRegions.includes(neighborInput)) {
      setFormData(prev => ({
        ...prev,
        neighborRegions: [...prev.neighborRegions, neighborInput],
      }));
    }
    setNeighborInput('');
  };

  const handleRemoveNeighbor = (neighbor) => {
    setFormData(prev => ({
      ...prev,
      neighborRegions: prev.neighborRegions.filter(n => n !== neighbor),
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
    }

    setFormData({ ...DEFAULT_REGION });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_REGION });
    onCancelEdit();
  };

  return (
    <div style={styles.container}>
      {/* Form Section */}
      <div style={styles.formSection}>
        <h3 style={styles.sectionTitle}>
          {editingItem ? '✏️ Edit Region' : '➕ Create New Region'}
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
                placeholder="unique_region_id"
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
                placeholder="Region Name"
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
            placeholder="Describe this region..."
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Theme</label>
          <input
            style={styles.input}
            value={formData.theme}
            onChange={(e) => handleChange('theme', e.target.value)}
            placeholder="A brief thematic description"
          />
        </div>

        {/* Level & Danger Ranges */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Difficulty Settings</div>
          <div style={styles.row}>
            <div style={styles.halfWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Min Level</label>
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  value={formData.levelRange.min}
                  onChange={(e) => handleNestedChange('levelRange', 'min', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            <div style={styles.halfWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Max Level</label>
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  value={formData.levelRange.max}
                  onChange={(e) => handleNestedChange('levelRange', 'max', parseInt(e.target.value) || 10)}
                />
              </div>
            </div>
          </div>
          <div style={styles.row}>
            <div style={styles.halfWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Min Danger (1-5)</label>
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  max="5"
                  value={formData.dangerRange.min}
                  onChange={(e) => handleNestedChange('dangerRange', 'min', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            <div style={styles.halfWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Max Danger (1-5)</label>
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  max="5"
                  value={formData.dangerRange.max}
                  onChange={(e) => handleNestedChange('dangerRange', 'max', parseInt(e.target.value) || 3)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Map & Travel */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Map & Travel</div>
          <div style={styles.row}>
            <div style={styles.halfWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Map Position X</label>
                <input
                  style={styles.input}
                  type="number"
                  value={formData.mapPosition.x}
                  onChange={(e) => handleNestedChange('mapPosition', 'x', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div style={styles.halfWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Map Position Y</label>
                <input
                  style={styles.input}
                  type="number"
                  value={formData.mapPosition.y}
                  onChange={(e) => handleNestedChange('mapPosition', 'y', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
          <div style={styles.row}>
            <div style={styles.halfWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Travel Cost (Gold)</label>
                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  value={formData.travelCost.gold}
                  onChange={(e) => handleNestedChange('travelCost', 'gold', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div style={styles.halfWidth}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Travel Time (hours)</label>
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  value={formData.travelCost.time}
                  onChange={(e) => handleNestedChange('travelCost', 'time', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Map Icon</label>
            <input
              style={styles.input}
              value={formData.mapIcon}
              onChange={(e) => handleChange('mapIcon', e.target.value)}
              placeholder="/icons/region_icon.png"
            />
          </div>
        </div>

        {/* Neighbor Regions */}
        <div style={styles.subsection}>
          <div style={styles.subsectionTitle}>Connected Regions</div>
          <div style={styles.tagInput}>
            {formData.neighborRegions.map(neighbor => (
              <span key={neighbor} style={styles.tag}>
                🗺️ {neighbor}
                <span style={styles.tagRemove} onClick={() => handleRemoveNeighbor(neighbor)}>×</span>
              </span>
            ))}
            <input
              style={{ ...styles.input, border: 'none', backgroundColor: 'transparent', flex: 1, minWidth: '100px', padding: '2px' }}
              value={neighborInput}
              onChange={(e) => setNeighborInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddNeighbor()}
              placeholder="Add region ID..."
            />
          </div>
          <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {items.filter(r => r.id !== formData.id && !formData.neighborRegions.includes(r.id)).map(region => (
              <button
                key={region.id}
                style={{ ...styles.smallButton, backgroundColor: '#3a3a5a', color: '#a0a0c0' }}
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    neighborRegions: [...prev.neighborRegions, region.id],
                  }));
                }}
              >
                + {region.name}
              </button>
            ))}
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
            {COMMON_TAGS.filter(t => !formData.tags.includes(t)).slice(0, 12).map(tag => (
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

        {/* Audio */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Ambient Music</label>
          <input
            style={styles.input}
            value={formData.ambientMusic}
            onChange={(e) => handleChange('ambientMusic', e.target.value)}
            placeholder="region_ambient_music"
          />
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: '20px' }}>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleSubmit}
          >
            {editingItem ? '💾 Update Region' : '➕ Add Region'}
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
        <h3 style={styles.sectionTitle}>📋 Created Regions ({items.length})</h3>

        {items.length === 0 ? (
          <div style={styles.emptyList}>
            No regions created yet.<br />
            Use the form to create your first region.
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
                🗺️ {item.name}
              </div>
              <div style={styles.listItemDetails}>
                ID: {item.id} | Levels: {item.levelRange?.min}-{item.levelRange?.max}
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

export default RegionCreator;
