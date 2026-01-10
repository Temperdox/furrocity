/**
 * @fileoverview IdNameFields - Reusable ID and Name form fields
 *
 * Standard ID + Name row used across all creator tabs.
 * Automatically formats ID to lowercase with underscores.
 *
 * @module components/generator/shared/IdNameFields
 */

import React from 'react';
import { FormInput } from '../../ui/shared';

/**
 * IdNameFields - ID and Name input fields in a row
 *
 * @param {Object} props
 * @param {string} props.idValue - Current ID value
 * @param {string} props.nameValue - Current name value
 * @param {Function} props.onIdChange - ID change handler
 * @param {Function} props.onNameChange - Name change handler
 * @param {string} props.idPlaceholder - ID field placeholder
 * @param {string} props.namePlaceholder - Name field placeholder
 * @param {string} props.idLabel - ID field label (default: "ID")
 * @param {string} props.nameLabel - Name field label (default: "Name")
 * @param {boolean} props.idRequired - Whether ID is required (default: true)
 * @param {boolean} props.nameRequired - Whether name is required (default: true)
 */
const IdNameFields = ({
  idValue,
  nameValue,
  onIdChange,
  onNameChange,
  idPlaceholder = 'unique_id',
  namePlaceholder = 'Display Name',
  idLabel = 'ID',
  nameLabel = 'Name',
  idRequired = true,
  nameRequired = true,
}) => {
  // Auto-format ID: lowercase, spaces to underscores
  const handleIdChange = (value) => {
    const formatted = String(value).toLowerCase().replace(/\s/g, '_');
    onIdChange(formatted);
  };

  return (
    <div className="creator-form-row">
      <FormInput
        label={idLabel}
        required={idRequired}
        value={idValue}
        onChange={handleIdChange}
        placeholder={idPlaceholder}
      />
      <FormInput
        label={nameLabel}
        required={nameRequired}
        value={nameValue}
        onChange={onNameChange}
        placeholder={namePlaceholder}
      />
    </div>
  );
};

export default IdNameFields;
