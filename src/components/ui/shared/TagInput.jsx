import React, { useState, useRef, useCallback, useMemo } from 'react';
import './shared.css';

/**
 * TagInput - Tag management component with clickable suggestions
 *
 * @param {Array} value - Current array of tags
 * @param {function} onChange - Change handler (receives array of tags)
 * @param {Array} suggestions - Array of suggested tags or object with categories
 * @param {Object} categories - Optional tag categories for grouping suggestions
 *   Example: { type: ['weapon', 'armor'], rarity: ['common', 'rare'] }
 * @param {boolean} allowCustom - Allow typing custom tags (default: true)
 * @param {string} placeholder - Placeholder text
 * @param {string} label - Label text
 * @param {string} helper - Helper text
 * @param {boolean} required - Show required indicator
 * @param {boolean} disabled - Disable input
 * @param {number} maxTags - Maximum number of tags allowed
 * @param {boolean} showSuggestions - Show suggestion buttons (default: true)
 * @param {number} maxSuggestionsVisible - Max suggestions shown per category (default: 20)
 */
const TagInput = ({
  value = [],
  onChange,
  suggestions = [],
  categories = null,
  allowCustom = true,
  placeholder = 'Add tag...',
  label,
  helper,
  required = false,
  disabled = false,
  maxTags,
  showSuggestions = true,
  maxSuggestionsVisible = 20,
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  // Normalize value to array
  const tags = Array.isArray(value) ? value : [];

  // Filter suggestions based on input and already selected tags
  const filteredSuggestions = useMemo(() => {
    const normalizedInput = inputValue.toLowerCase().trim();

    // If categories provided, use them
    if (categories && typeof categories === 'object') {
      const result = {};
      Object.entries(categories).forEach(([category, categoryTags]) => {
        if (Array.isArray(categoryTags)) {
          const filtered = categoryTags.filter(tag => {
            const tagStr = String(tag).toLowerCase();
            // Show if matches search or no search, and not already selected
            const matchesSearch = !normalizedInput || tagStr.includes(normalizedInput);
            const notSelected = !tags.includes(tag);
            return matchesSearch && notSelected;
          }).slice(0, maxSuggestionsVisible);

          if (filtered.length > 0) {
            result[category] = filtered;
          }
        }
      });
      return result;
    }

    // Flat array of suggestions
    if (Array.isArray(suggestions)) {
      return suggestions.filter(tag => {
        const tagStr = String(tag).toLowerCase();
        const matchesSearch = !normalizedInput || tagStr.includes(normalizedInput);
        const notSelected = !tags.includes(tag);
        return matchesSearch && notSelected;
      }).slice(0, maxSuggestionsVisible);
    }

    return [];
  }, [suggestions, categories, tags, inputValue, maxSuggestionsVisible]);

  // Add a tag
  const addTag = useCallback((tag) => {
    if (!tag || disabled) return;

    const normalizedTag = String(tag).trim();
    if (!normalizedTag) return;

    // Check if already exists
    if (tags.includes(normalizedTag)) return;

    // Check max tags
    if (maxTags && tags.length >= maxTags) return;

    onChange([...tags, normalizedTag]);
    setInputValue('');
    inputRef.current?.focus();
  }, [tags, onChange, disabled, maxTags]);

  // Remove a tag
  const removeTag = useCallback((tagToRemove) => {
    if (disabled) return;
    onChange(tags.filter(tag => tag !== tagToRemove));
  }, [tags, onChange, disabled]);

  // Handle keyboard input
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (allowCustom && inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove last tag when backspace on empty input
      removeTag(tags[tags.length - 1]);
    }
  }, [inputValue, tags, addTag, removeTag, allowCustom]);

  // Check if there are any suggestions to show
  const hasSuggestions = useMemo(() => {
    if (categories) {
      return Object.keys(filteredSuggestions).length > 0;
    }
    return Array.isArray(filteredSuggestions) && filteredSuggestions.length > 0;
  }, [filteredSuggestions, categories]);

  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      <div className="tag-input-container">
        {/* Input field with tag chips */}
        <div className="tag-input-field" onClick={() => inputRef.current?.focus()}>
          {tags.map((tag, index) => (
            <span key={`${tag}-${index}`} className="tag-chip">
              {tag}
              {!disabled && (
                <button
                  type="button"
                  className="tag-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                  aria-label={`Remove ${tag}`}
                >
                  &times;
                </button>
              )}
            </span>
          ))}

          {(allowCustom || tags.length === 0) && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={tags.length === 0 ? placeholder : ''}
              disabled={disabled || (maxTags && tags.length >= maxTags)}
            />
          )}
        </div>

        {/* Tag Suggestions */}
        {showSuggestions && hasSuggestions && (
          <div className="tag-suggestions">
            {categories ? (
              // Categorized suggestions
              Object.entries(filteredSuggestions).map(([category, categoryTags]) => (
                <div key={category} className="tag-suggestions-category">
                  <div className="tag-suggestions-header">{category}</div>
                  <div className="tag-suggestions-list">
                    {categoryTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={`tag-suggestion-btn ${tags.includes(tag) ? 'selected' : ''}`}
                        onClick={() => addTag(tag)}
                        disabled={disabled || tags.includes(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              // Flat suggestions
              <div className="tag-suggestions-list">
                {filteredSuggestions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-suggestion-btn ${tags.includes(tag) ? 'selected' : ''}`}
                    onClick={() => addTag(tag)}
                    disabled={disabled || tags.includes(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {helper && <div className="form-helper">{helper}</div>}
    </div>
  );
};

export default TagInput;
