/**
 * @fileoverview ChangelogModal - Displays game changelog with version history
 *
 * Features:
 * - Markdown rendering with react-markdown
 * - Shows last 3 versions by default
 * - Infinite scroll to load older versions
 * - Dropdown to jump to specific version
 *
 * @module components/ui/ChangelogModal
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './ChangelogModal.css';

// Number of versions to show initially and load per scroll
const INITIAL_VERSIONS = 3;
const VERSIONS_PER_LOAD = 2;

/**
 * Parse changelog markdown into version sections
 * @param {string} markdown - Full changelog markdown
 * @returns {Array} Array of {version, date, content} objects
 */
const parseChangelog = (markdown) => {
  if (!markdown) return [];

  const sections = [];
  // Match version headers like "## [0.3.0] - 2026-01-04"
  const versionRegex = /^## \[([^\]]+)\] - (\d{4}-\d{2}-\d{2})/gm;

  let match;
  const matches = [];

  while ((match = versionRegex.exec(markdown)) !== null) {
    matches.push({
      version: match[1],
      date: match[2],
      index: match.index
    });
  }

  // Extract content for each version
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i < matches.length - 1 ? matches[i + 1].index : markdown.length;
    const content = markdown.slice(start, end).trim();

    sections.push({
      version: matches[i].version,
      date: matches[i].date,
      content
    });
  }

  return sections;
};

/**
 * ChangelogModal - Main changelog display component
 */
const ChangelogModal = ({ isOpen, onClose }) => {
  const [changelog, setChangelog] = useState('');
  const [versions, setVersions] = useState([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VERSIONS);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const contentRef = useRef(null);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Fetch changelog on mount
  useEffect(() => {
    if (!isOpen) return;

    const fetchChangelog = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/CHANGELOG.md');
        if (!response.ok) {
          throw new Error('Failed to load changelog');
        }
        const text = await response.text();
        setChangelog(text);

        const parsed = parseChangelog(text);
        setVersions(parsed);

        if (parsed.length > 0 && !selectedVersion) {
          setSelectedVersion('all');
        }
      } catch (err) {
        console.error('Error loading changelog:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChangelog();
  }, [isOpen]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || selectedVersion !== 'all') return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < versions.length) {
          setVisibleCount(prev => Math.min(prev + VERSIONS_PER_LOAD, versions.length));
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [visibleCount, versions.length, selectedVersion]);

  // Reset visible count when opening
  useEffect(() => {
    if (isOpen) {
      setVisibleCount(INITIAL_VERSIONS);
      setSelectedVersion('all');
    }
  }, [isOpen]);

  // Get versions to display
  const displayedVersions = useMemo(() => {
    if (selectedVersion === 'all') {
      return versions.slice(0, visibleCount);
    }
    return versions.filter(v => v.version === selectedVersion);
  }, [versions, visibleCount, selectedVersion]);

  // Handle version dropdown change
  const handleVersionChange = useCallback((e) => {
    const value = e.target.value;
    setSelectedVersion(value);

    // Scroll to top when changing version
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, []);

  // Handle close with escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasMoreVersions = selectedVersion === 'all' && visibleCount < versions.length;

  return createPortal(
    <div className="changelog-overlay" onClick={onClose}>
      <div className="changelog-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="changelog-header">
          <div className="changelog-title-section">
            <h2 className="changelog-title">Changelog</h2>
            <span className="changelog-subtitle">Version History</span>
          </div>

          <div className="changelog-controls">
            {/* Version dropdown */}
            <div className="version-select-wrapper">
              <label htmlFor="version-select">Version:</label>
              <select
                id="version-select"
                value={selectedVersion}
                onChange={handleVersionChange}
                className="version-select"
              >
                <option value="all">All Versions</option>
                {versions.map(v => (
                  <option key={v.version} value={v.version}>
                    v{v.version} ({v.date})
                  </option>
                ))}
              </select>
            </div>

            <button className="changelog-close-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="changelog-content" ref={contentRef}>
          {isLoading && (
            <div className="changelog-loading">
              <div className="loading-spinner" />
              <span>Loading changelog...</span>
            </div>
          )}

          {error && (
            <div className="changelog-error">
              <span className="error-icon">!</span>
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          {!isLoading && !error && displayedVersions.length === 0 && (
            <div className="changelog-empty">
              <p>No changelog entries found.</p>
            </div>
          )}

          {!isLoading && !error && displayedVersions.map((version, index) => (
            <div key={version.version} className="version-section">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom heading styling
                  h2: ({ children }) => (
                    <h2 className="version-header">
                      <span className="version-tag">v{version.version}</span>
                      <span className="version-date">{version.date}</span>
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="change-category">{children}</h3>
                  ),
                  // Style lists
                  ul: ({ children }) => (
                    <ul className="change-list">{children}</ul>
                  ),
                  li: ({ children }) => (
                    <li className="change-item">{children}</li>
                  ),
                  // Style code
                  code: ({ inline, children }) => (
                    inline
                      ? <code className="inline-code">{children}</code>
                      : <code className="code-block">{children}</code>
                  ),
                  // Style strong text
                  strong: ({ children }) => (
                    <strong className="highlight-text">{children}</strong>
                  )
                }}
              >
                {version.content}
              </ReactMarkdown>

              {index < displayedVersions.length - 1 && (
                <div className="version-divider" />
              )}
            </div>
          ))}

          {/* Infinite scroll trigger */}
          {hasMoreVersions && (
            <div ref={loadMoreRef} className="load-more-trigger">
              <div className="loading-more">
                <div className="loading-spinner small" />
                <span>Loading more versions...</span>
              </div>
            </div>
          )}

          {/* End of list indicator */}
          {selectedVersion === 'all' && visibleCount >= versions.length && versions.length > 0 && (
            <div className="changelog-end">
              <span>Beginning of changelog</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="changelog-footer">
          <span className="version-count">
            Showing {displayedVersions.length} of {versions.length} version(s)
          </span>
          {selectedVersion === 'all' && visibleCount < versions.length && (
            <button
              className="load-all-btn"
              onClick={() => setVisibleCount(versions.length)}
            >
              Load All
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ChangelogModal;
