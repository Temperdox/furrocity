/**
 * @fileoverview DescriptionField - Reusable description textarea
 *
 * Standard description field used across all creator tabs.
 *
 * @module components/generator/shared/DescriptionField
 */

import React from 'react';
import { FormInput } from '../../ui/shared';

/**
 * DescriptionField - Description textarea field
 *
 * @param {Object} props
 * @param {string} props.value - Current description value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.label - Field label (default: "Description")
 * @param {string} props.placeholder - Placeholder text
 * @param {number} props.rows - Number of rows (default: 3)
 * @param {boolean} props.required - Whether field is required
 */
const DescriptionField = ({
  value,
  onChange,
  label = 'Description',
  placeholder = 'Enter a description...',
  rows = 3,
  required = false,
}) => {
  return (
    <FormInput
      label={label}
      type="textarea"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      required={required}
    />
  );
};

export default DescriptionField;
