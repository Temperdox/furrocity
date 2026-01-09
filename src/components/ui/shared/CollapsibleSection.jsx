import React from 'react';

/**
 * CollapsibleSection - A reusable collapsible section component for forms
 *
 * @param {string} title - Section title
 * @param {boolean} isCollapsed - Whether the section is collapsed
 * @param {function} onToggle - Callback when header is clicked
 * @param {React.ReactNode} children - Section content
 * @param {string|React.ReactNode} badge - Optional badge to show (e.g., count, icon)
 */
const CollapsibleSection = ({ title, isCollapsed, onToggle, children, badge }) => (
  <div className={`collapsible-section ${isCollapsed ? 'collapsed' : 'expanded'}`}>
    <div className="collapsible-header" onClick={onToggle}>
      <span className="collapsible-arrow">{isCollapsed ? '▶' : '▼'}</span>
      <h4 className="collapsible-title">{title}</h4>
      {badge && <span className="collapsible-badge">{badge}</span>}
    </div>
    {!isCollapsed && <div className="collapsible-content">{children}</div>}
  </div>
);

export default CollapsibleSection;
