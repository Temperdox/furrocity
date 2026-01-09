import { useEffect, useRef, useCallback } from 'react';

/**
 * useFormDraft - Hook for persisting form drafts to localStorage
 *
 * Automatically saves form state as user types (debounced) and
 * restores from localStorage on mount if not editing an existing item.
 *
 * @param {string} key - localStorage key for this draft
 * @param {Object} formData - Current form state object
 * @param {function} setFormData - Form state setter
 * @param {Object|null} editingItem - Item being edited (if any). Draft won't load/save when editing.
 * @param {Object} options - Additional options
 * @param {number} options.debounceMs - Debounce delay in ms (default: 500)
 * @param {function} options.shouldSave - Function to determine if draft should be saved (receives formData)
 * @param {Object} options.defaultValues - Default form values to merge with loaded draft
 *
 * @returns {Object} { saveDraft, clearDraft, loadDraft, hasDraft }
 */
export function useFormDraft(key, formData, setFormData, editingItem, options = {}) {
  const {
    debounceMs = 500,
    shouldSave = (data) => data.id || data.name || data.description,
    defaultValues = {}
  } = options;

  const draftLoadedRef = useRef(false);
  const saveTimeoutRef = useRef(null);

  // Load draft from localStorage
  const loadDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultValues, ...parsed };
      }
    } catch (e) {
      console.warn(`Failed to load draft from ${key}:`, e);
    }
    return null;
  }, [key, defaultValues]);

  // Save draft to localStorage
  const saveDraft = useCallback((data = formData) => {
    try {
      if (shouldSave(data)) {
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (e) {
      console.warn(`Failed to save draft to ${key}:`, e);
    }
  }, [key, formData, shouldSave]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to clear draft ${key}:`, e);
    }
  }, [key]);

  // Check if draft exists
  const hasDraft = useCallback(() => {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }, [key]);

  // Load draft on mount (only if not editing)
  useEffect(() => {
    if (!editingItem && !draftLoadedRef.current) {
      draftLoadedRef.current = true;
      const draft = loadDraft();
      if (draft && shouldSave(draft)) {
        setFormData(draft);
      }
    }
  }, [editingItem, loadDraft, setFormData, shouldSave]);

  // Reset draft loaded flag when editingItem changes to null
  useEffect(() => {
    if (editingItem === null) {
      draftLoadedRef.current = false;
    }
  }, [editingItem]);

  // Auto-save draft on change (debounced, only when not editing)
  useEffect(() => {
    if (editingItem) return;

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Schedule new save
    saveTimeoutRef.current = setTimeout(() => {
      if (shouldSave(formData)) {
        saveDraft(formData);
      }
    }, debounceMs);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, editingItem, debounceMs, saveDraft, shouldSave]);

  return {
    saveDraft,
    clearDraft,
    loadDraft,
    hasDraft
  };
}

export default useFormDraft;
