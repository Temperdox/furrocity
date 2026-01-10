/**
 * @fileoverview LogicBuilder - Visual block-based logic editor using Blockly
 *
 * A Scratch-like visual programming interface for creating game logic conditions.
 * Blocks snap together to form logical expressions (AND, OR, NOT) with various
 * condition checks (items, stats, quests, etc.).
 *
 * @module components/generator/LogicBuilder
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as Blockly from 'blockly';
import { registerBlocks, workspaceToCondition, setGameData, TOOLBOX } from './blocks';
import './LogicBuilder.css';

// Register custom blocks on module load
let blocksRegistered = false;
if (!blocksRegistered) {
  registerBlocks();
  blocksRegistered = true;
}

/**
 * LogicBuilder - Visual block-based condition editor
 *
 * @param {Object} props
 * @param {Object} props.value - Current condition JSON
 * @param {Function} props.onChange - Called when conditions change
 * @param {string} props.title - Optional title for the builder
 * @param {number} props.height - Height of the workspace (default: 400)
 * @param {Array} props.items - Items for searchable dropdowns
 * @param {Array} props.quests - Quests for searchable dropdowns
 * @param {Array} props.scenes - Scenes for searchable dropdowns
 * @param {Array} props.locations - Locations for searchable dropdowns
 */
const LogicBuilder = ({
  value,
  onChange,
  title = 'Logic Builder',
  height = 400,
  items = [],
  quests = [],
  scenes = [],
  locations = [],
}) => {
  const containerRef = useRef(null);
  const workspaceRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Update game data for searchable dropdowns whenever props change
  useEffect(() => {
    setGameData({ items, quests, scenes, locations });
  }, [items, quests, scenes, locations]);

  // Initialize Blockly workspace
  useEffect(() => {
    if (!containerRef.current || workspaceRef.current) return;

    const workspace = Blockly.inject(containerRef.current, {
      toolbox: TOOLBOX,
      trashcan: true,
      zoom: {
        controls: true,
        wheel: true,
        startScale: 0.9,
        maxScale: 2,
        minScale: 0.5,
        scaleSpeed: 1.1,
      },
      move: {
        scrollbars: true,
        drag: true,
        wheel: true,
      },
      theme: Blockly.Theme.defineTheme('darkTheme', {
        base: Blockly.Themes.Classic,
        componentStyles: {
          workspaceBackgroundColour: '#1a1a2e',
          toolboxBackgroundColour: '#16213e',
          toolboxForegroundColour: '#fff',
          flyoutBackgroundColour: '#252a48',
          flyoutForegroundColour: '#ccc',
          flyoutOpacity: 0.9,
          scrollbarColour: '#4a4a6a',
          scrollbarOpacity: 0.7,
        },
        fontStyle: {
          family: 'sans-serif',
          weight: 'bold',
          size: 12,
        },
        startHats: true,
      }),
      renderer: 'zelos',
      sounds: false,
    });

    workspaceRef.current = workspace;

    // Listen for workspace changes
    workspace.addChangeListener((event) => {
      if (event.type === Blockly.Events.BLOCK_CHANGE ||
          event.type === Blockly.Events.BLOCK_CREATE ||
          event.type === Blockly.Events.BLOCK_DELETE ||
          event.type === Blockly.Events.BLOCK_MOVE) {
        const condition = workspaceToCondition(workspace);
        onChange(condition);
      }
    });

    // Resize workspace when container size changes
    const resizeObserver = new ResizeObserver(() => {
      Blockly.svgResize(workspace);
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      workspace.dispose();
      workspaceRef.current = null;
    };
  }, []);

  // Handle clear button
  const handleClear = useCallback(() => {
    if (workspaceRef.current) {
      workspaceRef.current.clear();
      onChange(null);
    }
  }, [onChange]);

  // Toggle expanded state
  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
    // Trigger resize after animation
    setTimeout(() => {
      if (workspaceRef.current) {
        Blockly.svgResize(workspaceRef.current);
      }
    }, 300);
  }, []);

  // Get summary of current condition for collapsed view
  const getConditionSummary = () => {
    if (!value) return 'No conditions set';

    const summarize = (node) => {
      if (!node) return '';
      if (node.type === 'group') {
        const op = node.operator === 'and' ? ' AND ' : ' OR ';
        const children = node.children.map(summarize).filter(Boolean);
        return children.length > 0 ? `(${children.join(op)})` : '';
      }
      if (node.type === 'not') {
        return `NOT ${summarize(node.child)}`;
      }
      if (node.type === 'condition') {
        return `${node.category}:${node.check}`;
      }
      return '';
    };

    const summary = summarize(value);
    return summary.length > 60 ? summary.substring(0, 57) + '...' : summary;
  };

  return (
    <div className="logic-builder">
      <div className="logic-builder-header">
        <button
          type="button"
          className="logic-builder-toggle"
          onClick={handleToggle}
        >
          <span className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}>
            {isExpanded ? '\u25BC' : '\u25B6'}
          </span>
          <span className="logic-builder-title">{title}</span>
          {!isExpanded && value && (
            <span className="logic-builder-summary">{getConditionSummary()}</span>
          )}
        </button>
        {isExpanded && value && (
          <button
            type="button"
            className="logic-builder-clear"
            onClick={handleClear}
          >
            Clear All
          </button>
        )}
      </div>

      <div
        className={`logic-builder-workspace ${isExpanded ? 'expanded' : 'collapsed'}`}
        style={{ height: isExpanded ? height : 0 }}
      >
        <div
          ref={containerRef}
          className="blockly-container"
          style={{ height: '100%', width: '100%' }}
        />
      </div>

      {!isExpanded && value && (
        <div className="logic-builder-preview">
          <code>{JSON.stringify(value, null, 2)}</code>
        </div>
      )}
    </div>
  );
};

export default LogicBuilder;
