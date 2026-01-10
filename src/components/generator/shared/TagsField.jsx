/**
 * @fileoverview TagsField - Reusable tags input section
 *
 * Standard tags field with suggestions used across creator tabs.
 *
 * @module components/generator/shared/TagsField
 */

import React, { useMemo } from 'react';
import { TagInput } from '../../ui/shared';
import { collectTags } from '../DatapackLoader';

/**
 * TagsField - Tags input with auto-suggestions
 *
 * @param {Object} props
 * @param {Array} props.value - Current tags array
 * @param {Function} props.onChange - Change handler
 * @param {Object} props.categories - Tag categories for suggestions
 * @param {Object} props.datapackContent - Datapack content for tag collection
 * @param {Array} props.existingItems - User's existing items for tag collection
 * @param {string} props.contentType - Content type for tag collection (e.g., 'items')
 * @param {string} props.label - Field label (default: "Tags")
 * @param {string} props.placeholder - Placeholder text
 */
const TagsField = ({
  value = [],
  onChange,
  categories = {},
  datapackContent,
  existingItems = [],
  contentType,
  label = 'Tags',
  placeholder = 'Add tag...',
}) => {
  // Compute suggested tags from datapack and existing items
  const suggestedTags = useMemo(() => {
    if (!contentType) {
      // If no content type, just use category values
      return Object.values(categories).flat();
    }

    return collectTags({
      datapackContent,
      userContent: existingItems,
      commonTags: Object.values(categories).flat(),
      contentType,
    });
  }, [datapackContent, existingItems, categories, contentType]);

  return (
    <div className="tags-field">
      {label && (
        <label className="form-label">{label}</label>
      )}
      <TagInput
        value={value}
        onChange={onChange}
        suggestions={suggestedTags}
        categories={categories}
        placeholder={placeholder}
        showSuggestions
      />
    </div>
  );
};

export default TagsField;
