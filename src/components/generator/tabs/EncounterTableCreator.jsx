import React, { useState, useEffect, useMemo } from 'react';
import { collectTags } from '../DatapackLoader';
import { FormInput, FormSelect, TagInput, Button, FormTabs, FormTabPanel } from '../../ui/shared';
import { CreatorItemsList, IdNameFields, DescriptionField } from '../shared';
import { useFormDraft } from '../../../hooks/useFormDraft';
import './CreatorStyles.css';

const DRAFT_KEY = 'contentGenerator_draft_encounterTables';

const ENCOUNTER_TYPES = [
  { value: 'enemy', label: 'Enemy' },
  { value: 'ambient', label: 'Ambient' },
  { value: 'event', label: 'Event' },
  { value: 'social', label: 'Social (NPC)' },
  { value: 'trap', label: 'Trap' },
  { value: 'lustful', label: 'Lustful' },
  { value: 'predatory', label: 'Predatory' },
  { value: 'helpful', label: 'Helpful' },
];

const ENCOUNTER_TYPE_COLORS = {
  enemy: 'var(--color-accent-danger)',
  ambient: 'var(--color-text-muted)',
  event: 'var(--color-accent-warning)',
  social: 'var(--color-accent-success)',
  trap: '#ff6b6b',
  lustful: '#e91e63',
  predatory: '#9c27b0',
  helpful: '#4caf50',
};

const TIME_OF_DAY_OPTIONS = [
  { value: 'dawn', label: 'Dawn' },
  { value: 'day', label: 'Day' },
  { value: 'dusk', label: 'Dusk' },
  { value: 'night', label: 'Night' },
  { value: 'midnight', label: 'Midnight' },
];

const TAG_CATEGORIES = {
  location: ['forest', 'town', 'dungeon', 'road', 'cave', 'swamp', 'mountain'],
  time: ['daytime', 'night', 'night_active'],
  danger: ['common', 'dangerous', 'rare', 'special'],
  type: ['attracts_feral', 'attracts_beast', 'attracts_humanoid', 'attracts_lustful', 'attracts_predatory', 'attracts_demon', 'attracts_corrupted'],
  special: ['nsfw', 'corrupted', 'attracts_opportunistic'],
};

const DEFAULT_ENCOUNTER_ENTRY = {
  type: 'enemy',
  enemyId: '',
  npcId: '',
  eventId: '',
  trapId: '',
  description: '',
  weight: 20,
  count: null,
  pack_behavior: false,
};

const DEFAULT_ENCOUNTER_TABLE = {
  id: '',
  name: '',
  tags: [],
  conditions: {
    time_of_day: [],
    player_conditions: [],
    location_tags: [],
    player_level_min: null,
    player_level_max: null,
  },
  encounters: [],
  loot_tables: [],
  rate_multiplier: 1.0,
};

const EncounterTableCreator = ({
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
  const [formData, setFormData] = useState({ ...DEFAULT_ENCOUNTER_TABLE });
  const [activeTab, setActiveTab] = useState('basic');

  const { clearDraft } = useFormDraft(DRAFT_KEY, formData, setFormData, editingItem, {
    defaultValues: DEFAULT_ENCOUNTER_TABLE,
  });

  const suggestedTags = useMemo(() => {
    return collectTags({
      datapackContent,
      userContent: items,
      commonTags: Object.values(TAG_CATEGORIES).flat(),
      contentType: 'encounterTables',
    });
  }, [datapackContent, items]);

  // Define tabs with badges
  const tabs = useMemo(() => {
    const hasConditions = (formData.conditions.time_of_day?.length > 0) ||
      (formData.conditions.location_tags?.length > 0) ||
      formData.conditions.player_level_min ||
      formData.conditions.player_level_max;

    return [
      { id: 'basic', label: 'Basic' },
      { id: 'conditions', label: 'Conditions', badge: hasConditions ? '✓' : null },
      { id: 'encounters', label: 'Encounters', badge: formData.encounters.length || null },
      { id: 'loot', label: 'Loot', badge: formData.loot_tables.length || null },
    ];
  }, [formData.conditions, formData.encounters.length, formData.loot_tables.length]);

  // Get enemy IDs from datapack content
  const availableEnemies = useMemo(() => {
    const enemies = datapackContent.enemies || [];
    return enemies.map(e => ({ value: e.id, label: e.name || e.id }));
  }, [datapackContent.enemies]);

  // Get NPC IDs from datapack content
  const availableNPCs = useMemo(() => {
    const npcs = datapackContent.npcs || [];
    return npcs.map(n => ({ value: n.id, label: n.name || n.id }));
  }, [datapackContent.npcs]);

  // Get loot table IDs from datapack content
  const availableLootTables = useMemo(() => {
    const tables = datapackContent.lootTables || [];
    return tables.map(t => ({ value: t.id, label: t.name || t.id }));
  }, [datapackContent.lootTables]);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...DEFAULT_ENCOUNTER_TABLE,
        ...editingItem,
        conditions: {
          ...DEFAULT_ENCOUNTER_TABLE.conditions,
          ...editingItem.conditions,
        },
        encounters: editingItem.encounters || [],
        loot_tables: editingItem.loot_tables || [],
      });
    } else {
      setFormData({ ...DEFAULT_ENCOUNTER_TABLE });
    }
  }, [editingItem]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConditionChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      conditions: { ...prev.conditions, [field]: value },
    }));
  };

  const handleAddEncounter = () => {
    setFormData(prev => ({
      ...prev,
      encounters: [...prev.encounters, { ...DEFAULT_ENCOUNTER_ENTRY }],
    }));
  };

  const handleUpdateEncounter = (index, updates) => {
    setFormData(prev => ({
      ...prev,
      encounters: prev.encounters.map((enc, i) =>
        i === index ? { ...enc, ...updates } : enc
      ),
    }));
  };

  const handleRemoveEncounter = (index) => {
    setFormData(prev => ({
      ...prev,
      encounters: prev.encounters.filter((_, i) => i !== index),
    }));
  };

  const handleAddLootTable = (tableId) => {
    if (!tableId || formData.loot_tables.includes(tableId)) return;
    setFormData(prev => ({
      ...prev,
      loot_tables: [...prev.loot_tables, tableId],
    }));
  };

  const handleRemoveLootTable = (index) => {
    setFormData(prev => ({
      ...prev,
      loot_tables: prev.loot_tables.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    if (!formData.id || !formData.name) {
      alert('ID and Name are required');
      return;
    }

    if (formData.encounters.length === 0) {
      alert('At least one encounter is required');
      return;
    }

    if (!editingItem && items.some(item => item.id === formData.id)) {
      alert('An encounter table with this ID already exists');
      return;
    }

    // Clean up empty conditions
    const cleanedConditions = {};
    if (formData.conditions.time_of_day?.length > 0) {
      cleanedConditions.time_of_day = formData.conditions.time_of_day;
    }
    if (formData.conditions.location_tags?.length > 0) {
      cleanedConditions.location_tags = formData.conditions.location_tags;
    }
    if (formData.conditions.player_level_min) {
      cleanedConditions.player_level_min = formData.conditions.player_level_min;
    }
    if (formData.conditions.player_level_max) {
      cleanedConditions.player_level_max = formData.conditions.player_level_max;
    }
    if (formData.conditions.player_conditions?.length > 0) {
      cleanedConditions.player_conditions = formData.conditions.player_conditions;
    }

    const finalData = {
      ...formData,
      conditions: Object.keys(cleanedConditions).length > 0 ? cleanedConditions : undefined,
    };

    if (editingItem) {
      onUpdate(editingItem._id, finalData);
    } else {
      onAdd(finalData);
      clearDraft();
    }

    setFormData({ ...DEFAULT_ENCOUNTER_TABLE });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_ENCOUNTER_TABLE });
    onCancelEdit();
  };

  const calculateTotalWeight = () => {
    return formData.encounters.reduce((sum, enc) => sum + (enc.weight || 0), 0);
  };


  return (
    <div className="creator-container">
      {/* Form Section */}
      <div className="creator-form">
        <h3 className="creator-form-section-title">
          {editingItem ? 'Edit Encounter Table' : 'Create New Encounter Table'}
        </h3>

        <FormTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Basic Tab */}
        <FormTabPanel id="basic" activeTab={activeTab}>
          <IdNameFields
            idValue={formData.id}
            nameValue={formData.name}
            onIdChange={(v) => handleChange('id', v)}
            onNameChange={(v) => handleChange('name', v)}
            idPlaceholder="forest_day_common"
            namePlaceholder="Forest Daytime Common"
          />

          <div className="creator-form-row">
            <FormInput
              label="Rate Multiplier"
              type="number"
              value={formData.rate_multiplier}
              onChange={(v) => handleChange('rate_multiplier', v)}
              min={0.1}
              max={5}
              step={0.1}
              helper="1.0 = normal, higher = more frequent"
            />
          </div>

          <TagInput
            value={formData.tags}
            onChange={(v) => handleChange('tags', v)}
            suggestions={suggestedTags}
            categories={TAG_CATEGORIES}
            placeholder="Add tag..."
            showSuggestions
          />
        </FormTabPanel>

        {/* Conditions Tab */}
        <FormTabPanel id="conditions" activeTab={activeTab}>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label className="form-label">Time of Day</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
              {TIME_OF_DAY_OPTIONS.map(opt => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                  <input
                    type="checkbox"
                    checked={(formData.conditions.time_of_day || []).includes(opt.value)}
                    onChange={(e) => {
                      const current = formData.conditions.time_of_day || [];
                      if (e.target.checked) {
                        handleConditionChange('time_of_day', [...current, opt.value]);
                      } else {
                        handleConditionChange('time_of_day', current.filter(t => t !== opt.value));
                      }
                    }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="creator-form-row">
            <FormInput
              label="Min Player Level"
              type="number"
              value={formData.conditions.player_level_min || ''}
              onChange={(v) => handleConditionChange('player_level_min', v || null)}
              min={1}
              placeholder="Any"
            />
            <FormInput
              label="Max Player Level"
              type="number"
              value={formData.conditions.player_level_max || ''}
              onChange={(v) => handleConditionChange('player_level_max', v || null)}
              min={1}
              placeholder="Any"
            />
          </div>

          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label className="form-label">Required Location Tags</label>
            <FormInput
              placeholder="Add location tag and press Enter"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                  const current = formData.conditions.location_tags || [];
                  if (!current.includes(e.target.value)) {
                    handleConditionChange('location_tags', [...current, e.target.value]);
                  }
                  e.target.value = '';
                }
              }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)', marginTop: 'var(--space-xs)' }}>
              {(formData.conditions.location_tags || []).map((tag, idx) => (
                <span
                  key={idx}
                  className="tag-chip"
                  onClick={() => handleConditionChange('location_tags', formData.conditions.location_tags.filter((_, i) => i !== idx))}
                  style={{ cursor: 'pointer' }}
                >
                  {tag} ×
                </span>
              ))}
            </div>
          </div>
        </FormTabPanel>

        {/* Encounters Tab */}
        <FormTabPanel id="encounters" activeTab={activeTab}>
          <div style={{
            padding: 'var(--space-sm)',
            background: 'var(--color-bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-md)',
          }}>
            <strong>Total Weight:</strong> {calculateTotalWeight()}
          </div>

          {formData.encounters.map((encounter, index) => {
            const percentage = calculateTotalWeight() > 0
              ? ((encounter.weight / calculateTotalWeight()) * 100).toFixed(1)
              : 0;

            return (
              <div key={index} style={{
                marginBottom: 'var(--space-md)',
                padding: 'var(--space-md)',
                background: 'var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                borderLeft: `3px solid ${ENCOUNTER_TYPE_COLORS[encounter.type] || 'var(--color-border)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                  <span className="text-secondary text-sm">
                    Encounter #{index + 1} ({percentage}% chance)
                  </span>
                  <Button variant="danger" size="sm" onClick={() => handleRemoveEncounter(index)}>
                    Remove
                  </Button>
                </div>

                <div className="creator-form-row cols-3">
                  <FormSelect
                    label="Type"
                    value={encounter.type}
                    onChange={(v) => handleUpdateEncounter(index, { type: v })}
                    options={ENCOUNTER_TYPES}
                  />
                  <FormInput
                    label="Weight"
                    type="number"
                    value={encounter.weight}
                    onChange={(v) => handleUpdateEncounter(index, { weight: v })}
                    min={1}
                  />
                  {['enemy', 'lustful', 'predatory'].includes(encounter.type) && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)' }}>
                      <input
                        type="checkbox"
                        checked={encounter.pack_behavior || false}
                        onChange={(e) => handleUpdateEncounter(index, { pack_behavior: e.target.checked })}
                      />
                      Pack Behavior
                    </label>
                  )}
                </div>

                {/* Type-specific fields */}
                {['enemy', 'lustful', 'predatory'].includes(encounter.type) && (
                  <>
                    <div className="creator-form-row">
                      {availableEnemies.length > 0 ? (
                        <FormSelect
                          label="Enemy ID"
                          value={encounter.enemyId || ''}
                          onChange={(v) => handleUpdateEncounter(index, { enemyId: v })}
                          options={[{ value: '', label: 'Select enemy...' }, ...availableEnemies]}
                        />
                      ) : (
                        <FormInput
                          label="Enemy ID"
                          value={encounter.enemyId || ''}
                          onChange={(v) => handleUpdateEncounter(index, { enemyId: v })}
                          placeholder="enemy_id"
                        />
                      )}
                    </div>
                    <div className="creator-form-row cols-2">
                      <FormInput
                        label="Min Count"
                        type="number"
                        value={encounter.count?.min || 1}
                        onChange={(v) => handleUpdateEncounter(index, {
                          count: { ...(encounter.count || {}), min: v }
                        })}
                        min={1}
                      />
                      <FormInput
                        label="Max Count"
                        type="number"
                        value={encounter.count?.max || 1}
                        onChange={(v) => handleUpdateEncounter(index, {
                          count: { ...(encounter.count || {}), max: v }
                        })}
                        min={1}
                      />
                    </div>
                  </>
                )}

                {['social', 'helpful'].includes(encounter.type) && (
                  <div className="creator-form-row">
                    {availableNPCs.length > 0 ? (
                      <FormSelect
                        label="NPC ID"
                        value={encounter.npcId || ''}
                        onChange={(v) => handleUpdateEncounter(index, { npcId: v })}
                        options={[{ value: '', label: 'Select NPC...' }, ...availableNPCs]}
                      />
                    ) : (
                      <FormInput
                        label="NPC ID"
                        value={encounter.npcId || ''}
                        onChange={(v) => handleUpdateEncounter(index, { npcId: v })}
                        placeholder="npc_id"
                      />
                    )}
                  </div>
                )}

                {encounter.type === 'event' && (
                  <FormInput
                    label="Event ID"
                    value={encounter.eventId || ''}
                    onChange={(v) => handleUpdateEncounter(index, { eventId: v })}
                    placeholder="event_id"
                  />
                )}

                {encounter.type === 'trap' && (
                  <FormInput
                    label="Trap ID"
                    value={encounter.trapId || ''}
                    onChange={(v) => handleUpdateEncounter(index, { trapId: v })}
                    placeholder="trap_id"
                  />
                )}

                {encounter.type === 'ambient' && (
                  <FormInput
                    label="Description"
                    type="textarea"
                    value={encounter.description || ''}
                    onChange={(v) => handleUpdateEncounter(index, { description: v })}
                    placeholder="A gentle breeze rustles through the leaves."
                    rows={2}
                  />
                )}
              </div>
            );
          })}

          <Button variant="success" size="sm" onClick={handleAddEncounter}>
            + Add Encounter
          </Button>
        </FormTabPanel>

        {/* Loot Tab */}
        <FormTabPanel id="loot" activeTab={activeTab}>
          <div style={{ marginBottom: 'var(--space-sm)' }}>
            {availableLootTables.length > 0 ? (
              <FormSelect
                value=""
                onChange={(v) => handleAddLootTable(v)}
                options={[
                  { value: '', label: '+ Add loot table...' },
                  ...availableLootTables.filter(t => !formData.loot_tables.includes(t.value))
                ]}
              />
            ) : (
              <FormInput
                placeholder="Add loot table ID and press Enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    handleAddLootTable(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
            {formData.loot_tables.map((tableId, idx) => (
              <span
                key={idx}
                className="tag-chip"
                onClick={() => handleRemoveLootTable(idx)}
                style={{ cursor: 'pointer' }}
              >
                {tableId} ×
              </span>
            ))}
          </div>
        </FormTabPanel>

        {/* Action Buttons */}
        <div className="creator-actions">
          <Button variant="success" onClick={handleSubmit}>
            {editingItem ? 'Update Encounter Table' : 'Add Encounter Table'}
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
        title="Created Encounter Tables"
        itemType="encounter table"
        editingItem={editingItem}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        renderItemContent={(item) => (
          <>
            <div className="creator-item-name">
              {item.name}
              <span
                className="rarity-badge"
                style={{
                  backgroundColor: item.rate_multiplier > 1.5 ? 'var(--color-accent-danger)' :
                                   item.rate_multiplier > 1 ? 'var(--color-accent-warning)' :
                                   item.rate_multiplier < 1 ? 'var(--color-accent-secondary)' :
                                   'var(--color-border)',
                }}
              >
                {item.rate_multiplier}x
              </span>
            </div>
            <div className="creator-item-id">
              ID: {item.id} | {item.encounters?.length || 0} encounters
            </div>
            {item.conditions?.time_of_day?.length > 0 && (
              <div className="creator-item-id">
                Time: {item.conditions.time_of_day.join(', ')}
              </div>
            )}
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

export default EncounterTableCreator;
