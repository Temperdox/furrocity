import React, { useState, useEffect, useMemo } from 'react';
import { collectTags } from '../DatapackLoader';
import { FormInput, FormSelect, TagInput, Button, NumericModifierInput, CollapsibleSection } from '../../ui/shared';
import { useFormDraft } from '../../../hooks/useFormDraft';
import './CreatorStyles.css';

const DRAFT_KEY = 'contentGenerator_draft_substances';

const DELIVERY_METHODS = [
  { value: 'consumable', label: 'Consumable (Pill/Drink)' },
  { value: 'injectable', label: 'Injectable' },
  { value: 'inhalant', label: 'Inhalant' },
  { value: 'ambient', label: 'Ambient (AoE)' },
  { value: 'contact', label: 'Contact' },
  { value: 'topical', label: 'Topical' },
];

const CATEGORIES = [
  { value: 'aphrodisiac', label: 'Aphrodisiac' },
  { value: 'sedative', label: 'Sedative' },
  { value: 'stimulant', label: 'Stimulant' },
  { value: 'pheromone', label: 'Pheromone' },
  { value: 'corruption', label: 'Corruption' },
  { value: 'antidote', label: 'Antidote' },
  { value: 'hallucinogen', label: 'Hallucinogen' },
  { value: 'poison', label: 'Poison' },
  { value: 'medicine', label: 'Medicine' },
];

const CATEGORY_COLORS = {
  aphrodisiac: '#e91e63',
  sedative: '#9c27b0',
  stimulant: '#ff5722',
  pheromone: '#e91e63',
  corruption: '#7c3aed',
  antidote: '#4caf50',
  hallucinogen: '#00bcd4',
  poison: '#8bc34a',
  medicine: '#2196f3',
};

const RARITIES = [
  { value: 'common', label: 'Common' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'rare', label: 'Rare' },
  { value: 'epic', label: 'Epic' },
  { value: 'legendary', label: 'Legendary' },
];

const LEGAL_STATUSES = [
  { value: 'legal', label: 'Legal' },
  { value: 'controlled', label: 'Controlled' },
  { value: 'illegal', label: 'Illegal' },
  { value: 'forbidden', label: 'Forbidden' },
];

const STATS = [
  'strength', 'vitality', 'intelligence', 'willpower',
  'charisma', 'perception', 'agility', 'endurance',
  'arousal', 'corruption', 'all',
];


const EFFECT_PHASES = ['onset', 'peak', 'plateau', 'comedown', 'aftermath'];

const WITHDRAWAL_LEVELS = ['mild', 'moderate', 'severe', 'extreme'];

const TAG_CATEGORIES = {
  type: ['street_drug', 'medical', 'combat_drug', 'aphrodisiac', 'sedative'],
  effect: ['euphoric', 'arousing', 'suggestible', 'compliant', 'aggressive', 'hallucinogenic'],
  legality: ['legal', 'controlled', 'illegal', 'forbidden'],
  special: ['addictive', 'permanent', 'transformation', 'pheromone', 'aoe'],
};

const DEFAULT_SUBSTANCE = {
  id: '',
  name: '',
  description: '',
  deliveryMethod: 'consumable',
  category: 'aphrodisiac',
  tags: [],
  rarity: 'uncommon',
  streetValue: 50,
  legalStatus: 'illegal',
  intoxicationValue: 25,
  dosing: {
    standardDose: 1,
    maxDosesBeforeOD: 4,
    maxDosesBeforeDeath: 8,
    doseDecayTime: 28800000,
    stackable: true,
    maxStacks: 3,
  },
  timing: {
    onsetDuration: 30000,
    peakDuration: 300000,
    plateauDuration: 600000,
    comedownDuration: 300000,
    aftermathDuration: 600000,
    totalDuration: 1800000,
  },
  effects: {
    onset: { statModifiers: {}, statusEffects: [], messages: [] },
    peak: { statModifiers: {}, statusEffects: [], encounterModifiers: {}, messages: [] },
    plateau: { statModifiers: {}, statusEffects: [] },
    comedown: { statModifiers: {}, statusEffects: [], messages: [] },
    aftermath: { statModifiers: {}, statusEffects: [], messages: [] },
  },
  toleranceScaling: {
    minEffectiveness: 0.2,
    toleranceGainPerUse: 8,
    maxToleranceGainPerDay: 20,
    toleranceDecayPerHour: 2,
    buildsCategoryTolerance: true,
    categoryToleranceGain: 3,
  },
  addiction: {
    addictiveness: 50,
    addictionGainPerUse: 5,
    maxAddictionGainPerDay: 15,
    addictionDecayPerDay: 2,
    withdrawalEffects: {},
  },
  overdose: {
    effects: { statusEffects: [], duration: 3600000 },
    encounterModifiers: { passedOutChance: 100 },
  },
  resistance: {
    baseResistDifficulty: 40,
    partialResistThreshold: 20,
    fullResistThreshold: 80,
    canBeResisted: true,
    resistanceStat: 'willpower',
  },
};

const SubstanceCreator = ({
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
  const [formData, setFormData] = useState({ ...DEFAULT_SUBSTANCE });
  const [hoveredItem, setHoveredItem] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({
    dosing: true,
    timing: true,
    effects: true,
    tolerance: true,
    addiction: true,
    overdose: true,
    resistance: true,
  });

  const { clearDraft } = useFormDraft(DRAFT_KEY, formData, setFormData, editingItem, {
    defaultValues: DEFAULT_SUBSTANCE,
  });

  const suggestedTags = useMemo(() => {
    return collectTags({
      datapackContent,
      userContent: items,
      commonTags: Object.values(TAG_CATEGORIES).flat(),
      contentType: 'substances',
    });
  }, [datapackContent, items]);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...DEFAULT_SUBSTANCE,
        ...editingItem,
        dosing: { ...DEFAULT_SUBSTANCE.dosing, ...editingItem.dosing },
        timing: { ...DEFAULT_SUBSTANCE.timing, ...editingItem.timing },
        effects: {
          onset: { ...DEFAULT_SUBSTANCE.effects.onset, ...editingItem.effects?.onset },
          peak: { ...DEFAULT_SUBSTANCE.effects.peak, ...editingItem.effects?.peak },
          plateau: { ...DEFAULT_SUBSTANCE.effects.plateau, ...editingItem.effects?.plateau },
          comedown: { ...DEFAULT_SUBSTANCE.effects.comedown, ...editingItem.effects?.comedown },
          aftermath: { ...DEFAULT_SUBSTANCE.effects.aftermath, ...editingItem.effects?.aftermath },
        },
        toleranceScaling: { ...DEFAULT_SUBSTANCE.toleranceScaling, ...editingItem.toleranceScaling },
        addiction: { ...DEFAULT_SUBSTANCE.addiction, ...editingItem.addiction },
        overdose: { ...DEFAULT_SUBSTANCE.overdose, ...editingItem.overdose },
        resistance: { ...DEFAULT_SUBSTANCE.resistance, ...editingItem.resistance },
      });
    } else {
      setFormData({ ...DEFAULT_SUBSTANCE });
    }
  }, [editingItem]);

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
  };

  const handleEffectPhaseChange = (phase, field, value) => {
    setFormData(prev => ({
      ...prev,
      effects: {
        ...prev.effects,
        [phase]: { ...prev.effects[phase], [field]: value },
      },
    }));
  };

  const handleStatModifierChange = (phase, stat, newModifier) => {
    setFormData(prev => {
      const currentMods = prev.effects[phase]?.statModifiers || {};

      return {
        ...prev,
        effects: {
          ...prev.effects,
          [phase]: {
            ...prev.effects[phase],
            statModifiers: {
              ...currentMods,
              [stat]: newModifier,
            },
          },
        },
      };
    });
  };

  const handleAddStatModifier = (phase, stat) => {
    setFormData(prev => ({
      ...prev,
      effects: {
        ...prev.effects,
        [phase]: {
          ...prev.effects[phase],
          statModifiers: {
            ...prev.effects[phase].statModifiers,
            [stat]: { operation: 'add', value: 0 },
          },
        },
      },
    }));
  };

  const handleRemoveStatModifier = (phase, stat) => {
    setFormData(prev => {
      const newMods = { ...prev.effects[phase].statModifiers };
      delete newMods[stat];
      return {
        ...prev,
        effects: {
          ...prev.effects,
          [phase]: {
            ...prev.effects[phase],
            statModifiers: newMods,
          },
        },
      };
    });
  };

  const handleAddStatusEffect = (phase, effect) => {
    if (!effect) return;
    setFormData(prev => ({
      ...prev,
      effects: {
        ...prev.effects,
        [phase]: {
          ...prev.effects[phase],
          statusEffects: [...(prev.effects[phase].statusEffects || []), effect],
        },
      },
    }));
  };

  const handleRemoveStatusEffect = (phase, index) => {
    setFormData(prev => ({
      ...prev,
      effects: {
        ...prev.effects,
        [phase]: {
          ...prev.effects[phase],
          statusEffects: prev.effects[phase].statusEffects.filter((_, i) => i !== index),
        },
      },
    }));
  };

  const handleAddMessage = (phase, message) => {
    if (!message) return;
    setFormData(prev => ({
      ...prev,
      effects: {
        ...prev.effects,
        [phase]: {
          ...prev.effects[phase],
          messages: [...(prev.effects[phase].messages || []), message],
        },
      },
    }));
  };

  const handleRemoveMessage = (phase, index) => {
    setFormData(prev => ({
      ...prev,
      effects: {
        ...prev.effects,
        [phase]: {
          ...prev.effects[phase],
          messages: prev.effects[phase].messages.filter((_, i) => i !== index),
        },
      },
    }));
  };

  const handleSubmit = () => {
    if (!formData.id || !formData.name) {
      alert('ID and Name are required');
      return;
    }

    if (!editingItem && items.some(item => item.id === formData.id)) {
      alert('A substance with this ID already exists');
      return;
    }

    // Calculate total duration from phase durations
    const calculatedTotal =
      (formData.timing.onsetDuration || 0) +
      (formData.timing.peakDuration || 0) +
      (formData.timing.plateauDuration || 0) +
      (formData.timing.comedownDuration || 0) +
      (formData.timing.aftermathDuration || 0);

    const finalData = {
      ...formData,
      timing: {
        ...formData.timing,
        totalDuration: calculatedTotal,
      },
    };

    if (editingItem) {
      onUpdate(editingItem._id, finalData);
    } else {
      onAdd(finalData);
      clearDraft();
    }

    setFormData({ ...DEFAULT_SUBSTANCE });
  };

  const handleCancel = () => {
    setFormData({ ...DEFAULT_SUBSTANCE });
    onCancelEdit();
  };

  const formatDuration = (ms) => {
    if (ms < 60000) return `${ms / 1000}s`;
    if (ms < 3600000) return `${ms / 60000}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  return (
    <div className="creator-container">
      {/* Form Section */}
      <div className="creator-form">
        <h3 className="creator-form-section-title">
          {editingItem ? 'Edit Substance' : 'Create New Substance'}
        </h3>

        {/* Basic Info Section - Not collapsible */}
        <div className="creator-form-section">
          <h4 className="creator-form-section-title">Basic Info</h4>
          <div className="creator-form-row">
            <FormInput
              label="ID"
              required
              value={formData.id}
              onChange={(v) => handleChange('id', String(v).toLowerCase().replace(/\s/g, '_'))}
              placeholder="unique_substance_id"
            />
            <FormInput
              label="Name"
              required
              value={formData.name}
              onChange={(v) => handleChange('name', v)}
              placeholder="Substance Name"
            />
          </div>

          <FormInput
            label="Description"
            type="textarea"
            value={formData.description}
            onChange={(v) => handleChange('description', v)}
            placeholder="What this substance does and its effects..."
            rows={3}
          />

          <div className="creator-form-row cols-3">
            <FormSelect
              label="Delivery Method"
              value={formData.deliveryMethod}
              onChange={(v) => handleChange('deliveryMethod', v)}
              options={DELIVERY_METHODS}
            />
            <FormSelect
              label="Category"
              value={formData.category}
              onChange={(v) => handleChange('category', v)}
              options={CATEGORIES}
            />
            <FormSelect
              label="Rarity"
              value={formData.rarity}
              onChange={(v) => handleChange('rarity', v)}
              options={RARITIES}
            />
          </div>

          <div className="creator-form-row cols-3">
            <FormInput
              label="Street Value"
              type="number"
              value={formData.streetValue}
              onChange={(v) => handleChange('streetValue', v)}
              min={0}
            />
            <FormSelect
              label="Legal Status"
              value={formData.legalStatus}
              onChange={(v) => handleChange('legalStatus', v)}
              options={LEGAL_STATUSES}
            />
            <FormInput
              label="Intoxication Value"
              type="number"
              value={formData.intoxicationValue}
              onChange={(v) => handleChange('intoxicationValue', v)}
              min={0}
              max={100}
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
        </div>

        {/* Dosing Section */}
        <CollapsibleSection
          title="Dosing"
          isCollapsed={collapsedSections.dosing}
          onToggle={() => toggleSection('dosing')}
        >
          <div className="creator-form-row cols-3">
            <FormInput
              label="Standard Dose"
              type="number"
              value={formData.dosing.standardDose}
              onChange={(v) => handleNestedChange('dosing', 'standardDose', v)}
              min={1}
            />
            <FormInput
              label="Max Before OD"
              type="number"
              value={formData.dosing.maxDosesBeforeOD}
              onChange={(v) => handleNestedChange('dosing', 'maxDosesBeforeOD', v)}
              min={1}
            />
            <FormInput
              label="Max Before Death"
              type="number"
              value={formData.dosing.maxDosesBeforeDeath}
              onChange={(v) => handleNestedChange('dosing', 'maxDosesBeforeDeath', v)}
              min={1}
            />
          </div>

          <div className="creator-form-row">
            <FormInput
              label="Dose Decay Time (ms)"
              type="number"
              value={formData.dosing.doseDecayTime}
              onChange={(v) => handleNestedChange('dosing', 'doseDecayTime', v)}
              min={0}
              helper={`= ${formatDuration(formData.dosing.doseDecayTime)}`}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <input
                  type="checkbox"
                  checked={formData.dosing.stackable}
                  onChange={(e) => handleNestedChange('dosing', 'stackable', e.target.checked)}
                />
                Stackable
              </label>
              {formData.dosing.stackable && (
                <FormInput
                  label="Max Stacks"
                  type="number"
                  value={formData.dosing.maxStacks}
                  onChange={(v) => handleNestedChange('dosing', 'maxStacks', v)}
                  min={1}
                  style={{ width: '100px' }}
                />
              )}
            </div>
          </div>
        </CollapsibleSection>

        {/* Timing Section */}
        <CollapsibleSection
          title="Timing"
          isCollapsed={collapsedSections.timing}
          onToggle={() => toggleSection('timing')}
        >
          <div className="creator-form-row cols-2">
            <FormInput
              label="Onset Duration (ms)"
              type="number"
              value={formData.timing.onsetDuration}
              onChange={(v) => handleNestedChange('timing', 'onsetDuration', v)}
              min={0}
              helper={`= ${formatDuration(formData.timing.onsetDuration)}`}
            />
            <FormInput
              label="Peak Duration (ms)"
              type="number"
              value={formData.timing.peakDuration}
              onChange={(v) => handleNestedChange('timing', 'peakDuration', v)}
              min={0}
              helper={`= ${formatDuration(formData.timing.peakDuration)}`}
            />
          </div>
          <div className="creator-form-row cols-2">
            <FormInput
              label="Plateau Duration (ms)"
              type="number"
              value={formData.timing.plateauDuration}
              onChange={(v) => handleNestedChange('timing', 'plateauDuration', v)}
              min={0}
              helper={`= ${formatDuration(formData.timing.plateauDuration)}`}
            />
            <FormInput
              label="Comedown Duration (ms)"
              type="number"
              value={formData.timing.comedownDuration}
              onChange={(v) => handleNestedChange('timing', 'comedownDuration', v)}
              min={0}
              helper={`= ${formatDuration(formData.timing.comedownDuration)}`}
            />
          </div>
          <FormInput
            label="Aftermath Duration (ms)"
            type="number"
            value={formData.timing.aftermathDuration}
            onChange={(v) => handleNestedChange('timing', 'aftermathDuration', v)}
            min={0}
            helper={`= ${formatDuration(formData.timing.aftermathDuration)}`}
          />
          <div style={{
            padding: 'var(--space-sm)',
            background: 'var(--color-bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            marginTop: 'var(--space-sm)',
          }}>
            <strong>Total Duration:</strong>{' '}
            {formatDuration(
              (formData.timing.onsetDuration || 0) +
              (formData.timing.peakDuration || 0) +
              (formData.timing.plateauDuration || 0) +
              (formData.timing.comedownDuration || 0) +
              (formData.timing.aftermathDuration || 0)
            )}
          </div>
        </CollapsibleSection>

        {/* Effects Section */}
        <CollapsibleSection
          title="Phase Effects"
          isCollapsed={collapsedSections.effects}
          onToggle={() => toggleSection('effects')}
        >
          {EFFECT_PHASES.map(phase => (
            <div key={phase} style={{
              marginBottom: 'var(--space-md)',
              padding: 'var(--space-md)',
              background: 'var(--color-bg-tertiary)',
              borderRadius: 'var(--radius-md)',
            }}>
              <h5 style={{
                margin: '0 0 var(--space-sm) 0',
                textTransform: 'capitalize',
                color: 'var(--color-accent-primary)',
              }}>
                {phase} Phase
              </h5>

              {/* Stat Modifiers */}
              <div style={{ marginBottom: 'var(--space-sm)' }}>
                <label className="form-label">Stat Modifiers</label>
                {Object.entries(formData.effects[phase]?.statModifiers || {}).map(([stat, mod]) => (
                  <div key={stat} className="array-item" style={{ marginBottom: 'var(--space-xs)', alignItems: 'flex-start' }}>
                    <span style={{ minWidth: '100px', paddingTop: '8px' }}>{stat}</span>
                    <NumericModifierInput
                      value={mod}
                      onChange={(newMod) => handleStatModifierChange(phase, stat, newMod)}
                      showLabel={false}
                      allowRandom={true}
                      compact
                    />
                    <Button variant="danger" size="sm" onClick={() => handleRemoveStatModifier(phase, stat)}>
                      ×
                    </Button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-xs)' }}>
                  <FormSelect
                    value=""
                    onChange={(v) => v && handleAddStatModifier(phase, v)}
                    options={[{ value: '', label: '+ Add stat modifier...' }, ...STATS.filter(s => !formData.effects[phase]?.statModifiers?.[s]).map(s => ({ value: s, label: s }))]}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              {/* Status Effects */}
              <div style={{ marginBottom: 'var(--space-sm)' }}>
                <label className="form-label">Status Effects</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)', marginBottom: 'var(--space-xs)' }}>
                  {(formData.effects[phase]?.statusEffects || []).map((effect, idx) => (
                    <span key={idx} className="tag-chip" onClick={() => handleRemoveStatusEffect(phase, idx)} style={{ cursor: 'pointer' }}>
                      {effect} ×
                    </span>
                  ))}
                </div>
                <FormInput
                  placeholder="Add status effect and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value) {
                      handleAddStatusEffect(phase, e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
              </div>

              {/* Messages */}
              {['onset', 'peak', 'comedown', 'aftermath'].includes(phase) && (
                <div>
                  <label className="form-label">Messages</label>
                  {(formData.effects[phase]?.messages || []).map((msg, idx) => (
                    <div key={idx} className="array-item" style={{ marginBottom: 'var(--space-xs)' }}>
                      <span style={{ flex: 1, fontSize: 'var(--font-sm)' }}>{msg}</span>
                      <Button variant="danger" size="sm" onClick={() => handleRemoveMessage(phase, idx)}>
                        ×
                      </Button>
                    </div>
                  ))}
                  <FormInput
                    placeholder="Add message and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value) {
                        handleAddMessage(phase, e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </CollapsibleSection>

        {/* Tolerance Section */}
        <CollapsibleSection
          title="Tolerance Scaling"
          isCollapsed={collapsedSections.tolerance}
          onToggle={() => toggleSection('tolerance')}
        >
          <div className="creator-form-row cols-2">
            <FormInput
              label="Min Effectiveness"
              type="number"
              value={formData.toleranceScaling.minEffectiveness}
              onChange={(v) => handleNestedChange('toleranceScaling', 'minEffectiveness', v)}
              min={0}
              max={1}
              step={0.1}
              helper="0-1 scale"
            />
            <FormInput
              label="Tolerance Gain Per Use"
              type="number"
              value={formData.toleranceScaling.toleranceGainPerUse}
              onChange={(v) => handleNestedChange('toleranceScaling', 'toleranceGainPerUse', v)}
              min={0}
            />
          </div>
          <div className="creator-form-row cols-2">
            <FormInput
              label="Max Tolerance Gain/Day"
              type="number"
              value={formData.toleranceScaling.maxToleranceGainPerDay}
              onChange={(v) => handleNestedChange('toleranceScaling', 'maxToleranceGainPerDay', v)}
              min={0}
            />
            <FormInput
              label="Tolerance Decay/Hour"
              type="number"
              value={formData.toleranceScaling.toleranceDecayPerHour}
              onChange={(v) => handleNestedChange('toleranceScaling', 'toleranceDecayPerHour', v)}
              min={0}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <input
                type="checkbox"
                checked={formData.toleranceScaling.buildsCategoryTolerance}
                onChange={(e) => handleNestedChange('toleranceScaling', 'buildsCategoryTolerance', e.target.checked)}
              />
              Builds Category Tolerance
            </label>
            {formData.toleranceScaling.buildsCategoryTolerance && (
              <FormInput
                label="Category Tolerance Gain"
                type="number"
                value={formData.toleranceScaling.categoryToleranceGain}
                onChange={(v) => handleNestedChange('toleranceScaling', 'categoryToleranceGain', v)}
                min={0}
                style={{ width: '150px' }}
              />
            )}
          </div>
        </CollapsibleSection>

        {/* Addiction Section */}
        <CollapsibleSection
          title="Addiction"
          isCollapsed={collapsedSections.addiction}
          onToggle={() => toggleSection('addiction')}
        >
          <div className="creator-form-row cols-2">
            <FormInput
              label="Addictiveness"
              type="number"
              value={formData.addiction.addictiveness}
              onChange={(v) => handleNestedChange('addiction', 'addictiveness', v)}
              min={0}
              max={100}
              helper="0-100 scale"
            />
            <FormInput
              label="Addiction Gain Per Use"
              type="number"
              value={formData.addiction.addictionGainPerUse}
              onChange={(v) => handleNestedChange('addiction', 'addictionGainPerUse', v)}
              min={0}
            />
          </div>
          <div className="creator-form-row cols-2">
            <FormInput
              label="Max Addiction Gain/Day"
              type="number"
              value={formData.addiction.maxAddictionGainPerDay}
              onChange={(v) => handleNestedChange('addiction', 'maxAddictionGainPerDay', v)}
              min={0}
            />
            <FormInput
              label="Addiction Decay/Day"
              type="number"
              value={formData.addiction.addictionDecayPerDay}
              onChange={(v) => handleNestedChange('addiction', 'addictionDecayPerDay', v)}
              min={0}
            />
          </div>
        </CollapsibleSection>

        {/* Overdose Section */}
        <CollapsibleSection
          title="Overdose"
          isCollapsed={collapsedSections.overdose}
          onToggle={() => toggleSection('overdose')}
        >
          <FormInput
            label="OD Duration (ms)"
            type="number"
            value={formData.overdose.effects?.duration || 3600000}
            onChange={(v) => setFormData(prev => ({
              ...prev,
              overdose: {
                ...prev.overdose,
                effects: { ...prev.overdose.effects, duration: v },
              },
            }))}
            min={0}
            helper={`= ${formatDuration(formData.overdose.effects?.duration || 3600000)}`}
          />
          <FormInput
            label="Passed Out Chance %"
            type="number"
            value={formData.overdose.encounterModifiers?.passedOutChance || 100}
            onChange={(v) => setFormData(prev => ({
              ...prev,
              overdose: {
                ...prev.overdose,
                encounterModifiers: { ...prev.overdose.encounterModifiers, passedOutChance: v },
              },
            }))}
            min={0}
            max={100}
          />
        </CollapsibleSection>

        {/* Resistance Section */}
        <CollapsibleSection
          title="Resistance"
          isCollapsed={collapsedSections.resistance}
          onToggle={() => toggleSection('resistance')}
        >
          <div style={{ marginBottom: 'var(--space-sm)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <input
                type="checkbox"
                checked={formData.resistance.canBeResisted}
                onChange={(e) => handleNestedChange('resistance', 'canBeResisted', e.target.checked)}
              />
              Can Be Resisted
            </label>
          </div>
          {formData.resistance.canBeResisted && (
            <>
              <div className="creator-form-row cols-2">
                <FormInput
                  label="Base Resist Difficulty"
                  type="number"
                  value={formData.resistance.baseResistDifficulty}
                  onChange={(v) => handleNestedChange('resistance', 'baseResistDifficulty', v)}
                  min={0}
                  max={100}
                />
                <FormSelect
                  label="Resistance Stat"
                  value={formData.resistance.resistanceStat}
                  onChange={(v) => handleNestedChange('resistance', 'resistanceStat', v)}
                  options={STATS.filter(s => s !== 'all').map(s => ({ value: s, label: s }))}
                />
              </div>
              <div className="creator-form-row cols-2">
                <FormInput
                  label="Partial Resist Threshold"
                  type="number"
                  value={formData.resistance.partialResistThreshold}
                  onChange={(v) => handleNestedChange('resistance', 'partialResistThreshold', v)}
                  min={0}
                  max={100}
                />
                <FormInput
                  label="Full Resist Threshold"
                  type="number"
                  value={formData.resistance.fullResistThreshold}
                  onChange={(v) => handleNestedChange('resistance', 'fullResistThreshold', v)}
                  min={0}
                  max={100}
                />
              </div>
            </>
          )}
        </CollapsibleSection>

        {/* Action Buttons */}
        <div className="creator-actions">
          <Button variant="success" onClick={handleSubmit}>
            {editingItem ? 'Update Substance' : 'Add Substance'}
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
          Created Substances
          <span className="count-badge">{items.length}</span>
        </h3>

        {items.length === 0 ? (
          <div className="empty-list">
            No substances created yet.
            <br />
            Use the form to create your first substance.
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
                  <span
                    className="rarity-badge"
                    style={{ backgroundColor: CATEGORY_COLORS[item.category] || 'var(--color-border)' }}
                  >
                    {item.category}
                  </span>
                  <span
                    className="rarity-badge"
                    style={{
                      backgroundColor: item.legalStatus === 'legal' ? 'var(--color-accent-success)' :
                                       item.legalStatus === 'illegal' ? 'var(--color-accent-danger)' :
                                       item.legalStatus === 'forbidden' ? '#7c3aed' : 'var(--color-accent-warning)',
                    }}
                  >
                    {item.legalStatus}
                  </span>
                </div>
                <div className="creator-item-id">
                  ID: {item.id} | {item.deliveryMethod} | {item.rarity} | ${item.streetValue}
                </div>
                <div className="creator-item-id">
                  Addiction: {item.addiction?.addictiveness || 0}% | Intox: {item.intoxicationValue}
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

export default SubstanceCreator;
