/**
 * @fileoverview useArrayField - Hook for managing array fields in forms
 *
 * Provides add, remove, update, and reorder handlers for array fields.
 * Reduces boilerplate in creator components.
 *
 * @module hooks/useArrayField
 */

import { useCallback } from 'react';

/**
 * useArrayField - Manage array fields in form state
 *
 * @param {Function} setFormData - Form state setter function
 * @param {string} fieldName - Name of the array field in form data
 * @returns {Object} Array field handlers
 *
 * @example
 * const { addItem, removeItem, updateItem } = useArrayField(setFormData, 'rewards');
 * addItem({ type: 'gold', amount: 100 });
 * removeItem(0);
 * updateItem(1, { amount: 200 });
 */
const useArrayField = (setFormData, fieldName) => {
  /**
   * Add an item to the array
   * @param {*} item - Item to add
   */
  const addItem = useCallback((item) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: [...(prev[fieldName] || []), item],
    }));
  }, [setFormData, fieldName]);

  /**
   * Remove an item at index
   * @param {number} index - Index to remove
   */
  const removeItem = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((_, i) => i !== index),
    }));
  }, [setFormData, fieldName]);

  /**
   * Update an item at index
   * @param {number} index - Index to update
   * @param {Object} updates - Partial updates to apply
   */
  const updateItem = useCallback((index, updates) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].map((item, i) =>
        i === index ? { ...item, ...updates } : item
      ),
    }));
  }, [setFormData, fieldName]);

  /**
   * Replace an item at index entirely
   * @param {number} index - Index to replace
   * @param {*} newItem - New item value
   */
  const replaceItem = useCallback((index, newItem) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].map((item, i) =>
        i === index ? newItem : item
      ),
    }));
  }, [setFormData, fieldName]);

  /**
   * Move an item from one index to another
   * @param {number} fromIndex - Source index
   * @param {number} toIndex - Destination index
   */
  const moveItem = useCallback((fromIndex, toIndex) => {
    setFormData(prev => {
      const arr = [...prev[fieldName]];
      const [removed] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, removed);
      return { ...prev, [fieldName]: arr };
    });
  }, [setFormData, fieldName]);

  /**
   * Clear all items in the array
   */
  const clearItems = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: [],
    }));
  }, [setFormData, fieldName]);

  /**
   * Set the entire array
   * @param {Array} items - New array value
   */
  const setItems = useCallback((items) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: items,
    }));
  }, [setFormData, fieldName]);

  return {
    addItem,
    removeItem,
    updateItem,
    replaceItem,
    moveItem,
    clearItems,
    setItems,
  };
};

export default useArrayField;
