/**
 * @fileoverview InventoryFilters - Tag filter and search component
 *
 * Provides filtering capabilities for inventory views:
 * - Dynamic tag buttons extracted from item data
 * - Category filters (weapon, armor, consumable, etc.)
 * - Text search for item names and descriptions
 * - Special filters for favorites and junk items
 *
 * Tags are sorted by priority (common gameplay tags first)
 * and limited to prevent UI overflow.
 *
 * @module components/inventory/InventoryFilters
 */

import React, { useMemo, useCallback } from 'react';

/**
 * Display information for item categories.
 * @constant {Object.<string, {name: string, icon: string}>}
 */
const CATEGORY_INFO = {
  weapon: { name: 'Weapons', icon: '/' },
  armor: { name: 'Armor', icon: 'A' },
  accessory: { name: 'Accessories', icon: 'o' },
  consumable: { name: 'Consumables', icon: '+' },
  material: { name: 'Materials', icon: '#' },
  key: { name: 'Keys', icon: 'K' },
  clothing: { name: 'Clothing', icon: 'C' },
  tool: { name: 'Tools', icon: 'T' },
  misc: { name: 'Misc', icon: '?' }
};

// Common tags that should be displayed prominently
const PRIORITY_TAGS = [
  'weapon', 'armor', 'consumable', 'material', 'magic',
  'rare', 'epic', 'legendary', 'quest', 'cursed'
];

/**
 * InventoryFilters - Tag filter buttons and search bar for inventory
 *
 * @param {Object} props
 * @param {Array} props.items - Items to extract tags from
 * @param {Array} props.activeFilters - Currently active filter tags
 * @param {Function} props.onFilterChange - Callback when filters change
 * @param {string} props.searchTerm - Current search term
 * @param {Function} props.onSearchChange - Callback when search changes
 */
const InventoryFilters = ({
  items = [],
  activeFilters = [],
  onFilterChange,
  searchTerm = '',
  onSearchChange
}) => {
  // Extract unique tags from items, organized by type
  const availableTags = useMemo(() => {
    const tagCounts = new Map();
    const categories = new Set();

    for (const item of items) {
      // Count categories
      if (item.category) {
        categories.add(item.category);
      }

      // Count tags
      if (item.tags) {
        for (const tag of item.tags) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      }
    }

    // Build sorted tag list
    const allTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({
        tag,
        count,
        priority: PRIORITY_TAGS.includes(tag) ? PRIORITY_TAGS.indexOf(tag) : 999
      }))
      .sort((a, b) => {
        // Sort by priority first, then by count
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.count - a.count;
      });

    // Build categories list
    const categoryList = Array.from(categories)
      .map(cat => ({
        tag: cat,
        count: items.filter(i => i.category === cat).length,
        isCategory: true,
        info: CATEGORY_INFO[cat] || { name: cat, icon: '?' }
      }))
      .sort((a, b) => b.count - a.count);

    return { categories: categoryList, tags: allTags };
  }, [items]);

  // Toggle a filter
  const toggleFilter = useCallback((tag) => {
    if (activeFilters.includes(tag)) {
      onFilterChange(activeFilters.filter(f => f !== tag));
    } else {
      onFilterChange([...activeFilters, tag]);
    }
  }, [activeFilters, onFilterChange]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    onFilterChange([]);
    onSearchChange('');
  }, [onFilterChange, onSearchChange]);

  // Handle search input
  const handleSearchChange = useCallback((e) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  const hasActiveFilters = activeFilters.length > 0 || searchTerm.length > 0;

  return (
    <div className="inventory-filters">
      {/* Search bar */}
      <div className="filter-search">
        <input
          type="text"
          className="filter-search-input"
          placeholder="Search items..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        {searchTerm && (
          <button
            className="filter-search-clear"
            onClick={() => onSearchChange('')}
            title="Clear search"
          >
            x
          </button>
        )}
      </div>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <button
          className="filter-clear-all"
          onClick={clearFilters}
        >
          Clear Filters
        </button>
      )}

      {/* Category filters */}
      {availableTags.categories.length > 0 && (
        <div className="filter-section">
          <div className="filter-section-title">Categories</div>
          <div className="filter-tags">
            {availableTags.categories.map(({ tag, count, info }) => (
              <button
                key={`cat-${tag}`}
                className={`filter-tag filter-tag--category ${
                  activeFilters.includes(tag) ? 'filter-tag--active' : ''
                }`}
                onClick={() => toggleFilter(tag)}
                title={`${info.name} (${count})`}
              >
                <span className="filter-tag-icon">{info.icon}</span>
                <span className="filter-tag-name">{info.name}</span>
                <span className="filter-tag-count">{count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tag filters */}
      {availableTags.tags.length > 0 && (
        <div className="filter-section">
          <div className="filter-section-title">Tags</div>
          <div className="filter-tags">
            {availableTags.tags.slice(0, 15).map(({ tag, count }) => (
              <button
                key={`tag-${tag}`}
                className={`filter-tag ${
                  activeFilters.includes(tag) ? 'filter-tag--active' : ''
                }`}
                onClick={() => toggleFilter(tag)}
                title={`${tag} (${count})`}
              >
                <span className="filter-tag-name">{tag}</span>
                <span className="filter-tag-count">{count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Special filters */}
      <div className="filter-section">
        <div className="filter-section-title">Special</div>
        <div className="filter-tags">
          <button
            className={`filter-tag filter-tag--special ${
              activeFilters.includes('_favorite') ? 'filter-tag--active' : ''
            }`}
            onClick={() => toggleFilter('_favorite')}
          >
            <span className="filter-tag-icon">*</span>
            <span className="filter-tag-name">Favorites</span>
          </button>
          <button
            className={`filter-tag filter-tag--special ${
              activeFilters.includes('_junk') ? 'filter-tag--active' : ''
            }`}
            onClick={() => toggleFilter('_junk')}
          >
            <span className="filter-tag-icon">J</span>
            <span className="filter-tag-name">Junk</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryFilters;
