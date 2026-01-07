import React, { useState } from 'react';
import { getAvailableFieldsForMapping, applyFieldMapping } from './ImportSystem';

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  modal: {
    backgroundColor: '#1a1a2e',
    borderRadius: '12px',
    width: '800px',
    maxWidth: '90vw',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #3a3a5a',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #3a3a5a',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#ffd700',
    fontSize: '20px',
    fontWeight: 'bold',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#808090',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '5px 10px',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '20px',
  },
  summary: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  summaryCard: {
    padding: '15px 20px',
    borderRadius: '8px',
    minWidth: '120px',
    textAlign: 'center',
  },
  summaryNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  summaryLabel: {
    fontSize: '12px',
    color: '#808090',
  },
  tabs: {
    display: 'flex',
    gap: '5px',
    marginBottom: '15px',
    borderBottom: '1px solid #3a3a5a',
    paddingBottom: '10px',
  },
  tab: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
  },
  tabActive: {
    backgroundColor: '#4a7c4a',
    color: 'white',
  },
  tabInactive: {
    backgroundColor: '#2a2a45',
    color: '#a0a0c0',
  },
  issueList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  issueCard: {
    backgroundColor: '#252540',
    borderRadius: '8px',
    padding: '15px',
    border: '1px solid #3a3a5a',
  },
  issueHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px',
  },
  issueTitle: {
    color: '#e0e0e0',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  issueType: {
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '10px',
    fontWeight: 'bold',
  },
  issueDetails: {
    backgroundColor: '#1a1a2e',
    borderRadius: '4px',
    padding: '10px',
    marginTop: '10px',
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#a0a0c0',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  issueActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
    flexWrap: 'wrap',
  },
  actionButton: {
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
  },
  footer: {
    padding: '15px 20px',
    borderTop: '1px solid #3a3a5a',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerButtons: {
    display: 'flex',
    gap: '10px',
  },
  primaryButton: {
    backgroundColor: '#4a7c4a',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#4a4a6a',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  selectField: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #4a4a6a',
    backgroundColor: '#1a1a2e',
    color: 'white',
    fontSize: '12px',
    minWidth: '150px',
  },
  resolvedBadge: {
    backgroundColor: '#2a4a2a',
    color: '#90ff90',
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#808090',
  },
};

const ImportWarningsModal = ({
  isOpen,
  onClose,
  importResult,
  onApplyImport,
  importedData,
  setImportedData,
}) => {
  const [activeTab, setActiveTab] = useState('unmapped');
  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen || !importResult) return null;

  const { warnings, errors, unmappedFields } = importResult;

  const handleCopyValue = (value) => {
    const textValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    navigator.clipboard.writeText(textValue);
    setCopiedField(value);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleMapField = (unmappedItem, targetField, contentType) => {
    // Find the item in importedData and apply the mapping
    const dataKey = `${contentType}s`; // items, characters, etc.
    const items = importedData[dataKey] || [];
    const itemIndex = items.findIndex(i => i.id === unmappedItem.itemId);

    if (itemIndex !== -1) {
      const updatedItems = [...items];
      applyFieldMapping(contentType, updatedItems[itemIndex], targetField, unmappedItem.value);
      setImportedData({
        ...importedData,
        [dataKey]: updatedItems,
      });
    }

    // Mark as resolved
    unmappedItem.resolved = true;
    unmappedItem.resolution = 'mapped';
    unmappedItem.mappedTo = targetField;
  };

  const handleIgnoreField = (unmappedItem) => {
    unmappedItem.resolved = true;
    unmappedItem.resolution = 'ignored';
  };

  const handleResolveWarning = (warning) => {
    warning.resolved = true;
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'error': return { bg: '#4a2a2a', color: '#ff9999' };
      case 'warning': return { bg: '#4a4a2a', color: '#ffff99' };
      case 'unmapped': return { bg: '#2a2a4a', color: '#9999ff' };
      default: return { bg: '#3a3a5a', color: '#a0a0c0' };
    }
  };

  const unresolvedUnmapped = unmappedFields.filter(f => !f.resolved);
  const unresolvedWarnings = warnings.filter(w => !w.resolved);

  const renderUnmappedFields = () => {
    if (unmappedFields.length === 0) {
      return (
        <div style={styles.emptyState}>
          No unmapped fields. All fields were recognized or migrated automatically.
        </div>
      );
    }

    return (
      <div style={styles.issueList}>
        {unmappedFields.map((item) => {
          const typeColor = getTypeColor('unmapped');
          const availableFields = getAvailableFieldsForMapping(item.contentType,
            (importedData[`${item.contentType}s`] || []).find(i => i.id === item.itemId) || {}
          );

          return (
            <div key={item.id} style={{
              ...styles.issueCard,
              opacity: item.resolved ? 0.6 : 1,
              borderColor: item.resolved ? '#2a4a2a' : '#3a3a5a',
            }}>
              <div style={styles.issueHeader}>
                <div>
                  <div style={styles.issueTitle}>
                    Unknown field: <span style={{ color: '#ff9999' }}>{item.fieldName}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#808090', marginTop: '3px' }}>
                    In {item.contentType}: <span style={{ color: '#ffd700' }}>{item.itemId}</span>
                  </div>
                </div>
                {item.resolved ? (
                  <span style={styles.resolvedBadge}>
                    {item.resolution === 'mapped' ? `Mapped to ${item.mappedTo}` : 'Ignored'}
                  </span>
                ) : (
                  <span style={{
                    ...styles.issueType,
                    backgroundColor: typeColor.bg,
                    color: typeColor.color,
                  }}>
                    UNMAPPED
                  </span>
                )}
              </div>

              <div style={styles.issueDetails}>
                {typeof item.value === 'object'
                  ? JSON.stringify(item.value, null, 2)
                  : String(item.value)}
              </div>

              {!item.resolved && (
                <div style={styles.issueActions}>
                  <select
                    style={styles.selectField}
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleMapField(item, e.target.value, item.contentType);
                      }
                    }}
                  >
                    <option value="">Map to field...</option>
                    <optgroup label="Empty Fields">
                      {availableFields.filter(f => f.isEmpty).map(f => (
                        <option key={f.field} value={f.field}>{f.field}</option>
                      ))}
                    </optgroup>
                    <optgroup label="All Fields (will overwrite)">
                      {availableFields.filter(f => !f.isEmpty).map(f => (
                        <option key={f.field} value={f.field}>{f.field} (has value)</option>
                      ))}
                    </optgroup>
                  </select>

                  <button
                    style={{
                      ...styles.actionButton,
                      backgroundColor: copiedField === item.value ? '#2a4a2a' : '#3a3a5a',
                      color: copiedField === item.value ? '#90ff90' : '#a0a0c0',
                    }}
                    onClick={() => handleCopyValue(item.value)}
                  >
                    {copiedField === item.value ? 'Copied!' : 'Copy Value'}
                  </button>

                  <button
                    style={{
                      ...styles.actionButton,
                      backgroundColor: '#4a2a2a',
                      color: '#ff9999',
                    }}
                    onClick={() => handleIgnoreField(item)}
                  >
                    Ignore
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderWarnings = () => {
    if (warnings.length === 0) {
      return (
        <div style={styles.emptyState}>
          No warnings. Import completed cleanly.
        </div>
      );
    }

    return (
      <div style={styles.issueList}>
        {warnings.map((warning) => {
          const typeColor = getTypeColor('warning');

          return (
            <div key={warning.id} style={{
              ...styles.issueCard,
              opacity: warning.resolved ? 0.6 : 1,
            }}>
              <div style={styles.issueHeader}>
                <div>
                  <div style={styles.issueTitle}>{warning.message}</div>
                  <div style={{ fontSize: '12px', color: '#808090', marginTop: '3px' }}>
                    In {warning.contentType}: <span style={{ color: '#ffd700' }}>{warning.itemId}</span>
                  </div>
                </div>
                {warning.resolved ? (
                  <span style={styles.resolvedBadge}>Acknowledged</span>
                ) : (
                  <span style={{
                    ...styles.issueType,
                    backgroundColor: typeColor.bg,
                    color: typeColor.color,
                  }}>
                    WARNING
                  </span>
                )}
              </div>

              {warning.data && (
                <div style={styles.issueDetails}>
                  {JSON.stringify(warning.data, null, 2)}
                </div>
              )}

              {!warning.resolved && (
                <div style={styles.issueActions}>
                  <button
                    style={{
                      ...styles.actionButton,
                      backgroundColor: '#4a4a2a',
                      color: '#ffff99',
                    }}
                    onClick={() => handleResolveWarning(warning)}
                  >
                    Acknowledge
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderErrors = () => {
    if (errors.length === 0) {
      return (
        <div style={styles.emptyState}>
          No errors. All files were parsed successfully.
        </div>
      );
    }

    return (
      <div style={styles.issueList}>
        {errors.map((error, index) => {
          const typeColor = getTypeColor('error');

          return (
            <div key={index} style={styles.issueCard}>
              <div style={styles.issueHeader}>
                <div>
                  <div style={styles.issueTitle}>{error.message}</div>
                  <div style={{ fontSize: '12px', color: '#808090', marginTop: '3px' }}>
                    {error.contentType}: <span style={{ color: '#ffd700' }}>{error.itemId}</span>
                  </div>
                </div>
                <span style={{
                  ...styles.issueType,
                  backgroundColor: typeColor.bg,
                  color: typeColor.color,
                }}>
                  ERROR
                </span>
              </div>

              {error.data && (
                <div style={styles.issueDetails}>
                  {JSON.stringify(error.data, null, 2)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const totalImported = importResult.items.length + importResult.characters.length +
                        importResult.locations.length + importResult.enemies.length +
                        importResult.scenes.length;

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Import Results</h2>
          <button style={styles.closeButton} onClick={onClose}>&times;</button>
        </div>

        <div style={styles.content}>
          {/* Summary Cards */}
          <div style={styles.summary}>
            <div style={{ ...styles.summaryCard, backgroundColor: '#2a4a2a' }}>
              <div style={{ ...styles.summaryNumber, color: '#90ff90' }}>{totalImported}</div>
              <div style={styles.summaryLabel}>Items Imported</div>
            </div>
            <div style={{ ...styles.summaryCard, backgroundColor: '#4a4a2a' }}>
              <div style={{ ...styles.summaryNumber, color: '#ffff99' }}>{warnings.length}</div>
              <div style={styles.summaryLabel}>Warnings</div>
            </div>
            <div style={{ ...styles.summaryCard, backgroundColor: '#4a2a2a' }}>
              <div style={{ ...styles.summaryNumber, color: '#ff9999' }}>{errors.length}</div>
              <div style={styles.summaryLabel}>Errors</div>
            </div>
            <div style={{ ...styles.summaryCard, backgroundColor: '#2a2a4a' }}>
              <div style={{ ...styles.summaryNumber, color: '#9999ff' }}>{unresolvedUnmapped.length}</div>
              <div style={styles.summaryLabel}>Unmapped Fields</div>
            </div>
          </div>

          {/* Breakdown */}
          {totalImported > 0 && (
            <div style={{
              backgroundColor: '#252540',
              padding: '12px 15px',
              borderRadius: '8px',
              marginBottom: '15px',
              display: 'flex',
              gap: '20px',
              flexWrap: 'wrap',
              fontSize: '13px',
            }}>
              {importResult.items.length > 0 && (
                <span style={{ color: '#a0a0c0' }}>Items: <span style={{ color: '#90ff90' }}>{importResult.items.length}</span></span>
              )}
              {importResult.characters.length > 0 && (
                <span style={{ color: '#a0a0c0' }}>Characters: <span style={{ color: '#90ff90' }}>{importResult.characters.length}</span></span>
              )}
              {importResult.locations.length > 0 && (
                <span style={{ color: '#a0a0c0' }}>Locations: <span style={{ color: '#90ff90' }}>{importResult.locations.length}</span></span>
              )}
              {importResult.enemies.length > 0 && (
                <span style={{ color: '#a0a0c0' }}>Enemies: <span style={{ color: '#90ff90' }}>{importResult.enemies.length}</span></span>
              )}
              {importResult.scenes.length > 0 && (
                <span style={{ color: '#a0a0c0' }}>Scenes: <span style={{ color: '#90ff90' }}>{importResult.scenes.length}</span></span>
              )}
            </div>
          )}

          {/* Tabs */}
          <div style={styles.tabs}>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 'unmapped' ? styles.tabActive : styles.tabInactive),
              }}
              onClick={() => setActiveTab('unmapped')}
            >
              Unmapped Fields ({unmappedFields.length})
            </button>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 'warnings' ? styles.tabActive : styles.tabInactive),
              }}
              onClick={() => setActiveTab('warnings')}
            >
              Warnings ({warnings.length})
            </button>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 'errors' ? styles.tabActive : styles.tabInactive),
              }}
              onClick={() => setActiveTab('errors')}
            >
              Errors ({errors.length})
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'unmapped' && renderUnmappedFields()}
          {activeTab === 'warnings' && renderWarnings()}
          {activeTab === 'errors' && renderErrors()}
        </div>

        <div style={styles.footer}>
          <div style={{ color: '#808090', fontSize: '13px' }}>
            {unresolvedUnmapped.length + unresolvedWarnings.length > 0
              ? `${unresolvedUnmapped.length + unresolvedWarnings.length} unresolved issues`
              : 'All issues resolved'}
          </div>
          <div style={styles.footerButtons}>
            <button style={styles.secondaryButton} onClick={onClose}>
              Cancel Import
            </button>
            <button
              style={{
                ...styles.primaryButton,
                opacity: errors.length > 0 ? 0.5 : 1,
              }}
              onClick={onApplyImport}
              disabled={errors.length > 0 && totalImported === 0}
            >
              Apply Import ({totalImported} items)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportWarningsModal;
