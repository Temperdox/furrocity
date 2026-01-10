import React from 'react';

/**
 * FormTabs - A tabbed navigation component for forms
 *
 * @param {Array} tabs - Array of tab objects: { id: string, label: string, badge?: number|string }
 * @param {string} activeTab - Currently active tab ID
 * @param {function} onTabChange - Callback when tab is clicked
 */
const FormTabs = ({ tabs, activeTab, onTabChange }) => (
  <div className="form-tabs">
    {tabs.map(tab => (
      <button
        key={tab.id}
        type="button"
        className={`form-tab ${activeTab === tab.id ? 'active' : ''}`}
        onClick={() => onTabChange(tab.id)}
      >
        {tab.label}
        {tab.badge !== undefined && tab.badge !== null && tab.badge !== 0 && (
          <span className="form-tab-badge">{tab.badge}</span>
        )}
      </button>
    ))}
  </div>
);

/**
 * FormTabPanel - Container for tab content (only renders when active)
 *
 * @param {string} id - Tab ID this panel corresponds to
 * @param {string} activeTab - Currently active tab ID
 * @param {React.ReactNode} children - Panel content
 */
export const FormTabPanel = ({ id, activeTab, children }) => {
  if (id !== activeTab) return null;
  return <div className="form-tab-panel">{children}</div>;
};

export default FormTabs;
