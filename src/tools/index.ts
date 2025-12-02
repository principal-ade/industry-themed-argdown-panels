/**
 * Argdown Panel Tools
 *
 * UTCP-compatible tools for the Argdown visualization panel.
 * These tools can be invoked by AI agents and emit events that panels listen for.
 *
 * IMPORTANT: This file should NOT import any React components to ensure
 * it can be imported server-side without pulling in React dependencies.
 */

import type { PanelTool, PanelToolsMetadata } from '@principal-ade/utcp-panel-event';

const PANEL_ID = 'industry-theme.argdown-panel';

/**
 * Tool: Load Argdown Data
 * Loads pre-parsed Argdown data into the panel for visualization.
 */
export const loadArgdownTool: PanelTool = {
  name: 'load_argdown',
  description: 'Loads pre-parsed Argdown data into the panel for visualization',
  inputs: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        description: 'The parsed ArgdownMapData structure to visualize',
      },
      title: {
        type: 'string',
        description: 'Optional title for the visualization',
      },
    },
    required: ['data'],
  },
  outputs: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      nodeCount: { type: 'number' },
      edgeCount: { type: 'number' },
    },
  },
  tags: ['argdown', 'load', 'visualization'],
  tool_call_template: {
    call_template_type: 'panel_event',
    event_type: `${PANEL_ID}:load-argdown`,
  },
};

/**
 * Tool: Set Filters
 * Applies filters to the Argdown visualization.
 */
export const setFiltersTool: PanelTool = {
  name: 'set_filters',
  description: 'Applies filters to the Argdown visualization (speakers, argument types, tags)',
  inputs: {
    type: 'object',
    properties: {
      speakers: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter to show only arguments from specific speakers',
      },
      argumentTypes: {
        type: 'array',
        items: { type: 'string', enum: ['support', 'attack', 'undercut'] },
        description: 'Filter by argument/relation type',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by tags',
      },
    },
  },
  outputs: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      activeFilters: { type: 'object' },
      visibleNodeCount: { type: 'number' },
    },
  },
  tags: ['argdown', 'filter', 'speakers'],
  tool_call_template: {
    call_template_type: 'panel_event',
    event_type: `${PANEL_ID}:set-filters`,
  },
};

/**
 * Tool: Set View Mode
 * Changes the panel view mode (map, source, split).
 */
export const setViewModeTool: PanelTool = {
  name: 'set_view_mode',
  description: 'Changes the panel view mode between map, source, and split views',
  inputs: {
    type: 'object',
    properties: {
      mode: {
        type: 'string',
        enum: ['map', 'source', 'split'],
        description: 'The view mode to switch to',
      },
    },
    required: ['mode'],
  },
  outputs: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      currentMode: { type: 'string' },
    },
  },
  tags: ['argdown', 'view', 'ui'],
  tool_call_template: {
    call_template_type: 'panel_event',
    event_type: `${PANEL_ID}:set-view-mode`,
  },
};

/**
 * Tool: Highlight Node
 * Highlights a specific node in the visualization.
 */
export const highlightNodeTool: PanelTool = {
  name: 'highlight_node',
  description: 'Highlights a specific claim or argument node in the visualization',
  inputs: {
    type: 'object',
    properties: {
      nodeId: {
        type: 'string',
        description: 'The ID of the node to highlight',
      },
      scrollTo: {
        type: 'boolean',
        description: 'Whether to pan the view to center on the node',
      },
    },
    required: ['nodeId'],
  },
  outputs: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      nodeType: { type: 'string' },
      nodeLabel: { type: 'string' },
    },
  },
  tags: ['argdown', 'highlight', 'navigation'],
  tool_call_template: {
    call_template_type: 'panel_event',
    event_type: `${PANEL_ID}:highlight-node`,
  },
};

/**
 * Tool: Get Metadata
 * Retrieves metadata about the current Argdown visualization.
 */
export const getMetadataTool: PanelTool = {
  name: 'get_argdown_metadata',
  description: 'Retrieves metadata about the current Argdown visualization (speakers, tags, structure)',
  inputs: {
    type: 'object',
    properties: {},
  },
  outputs: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      speakers: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            claimCount: { type: 'number' },
            argumentCount: { type: 'number' },
          },
        },
      },
      tags: { type: 'array', items: { type: 'string' } },
      structure: {
        type: 'object',
        properties: {
          claims: { type: 'number' },
          arguments: { type: 'number' },
          supportRelations: { type: 'number' },
          attackRelations: { type: 'number' },
        },
      },
    },
  },
  tags: ['argdown', 'metadata', 'info'],
  tool_call_template: {
    call_template_type: 'panel_event',
    event_type: `${PANEL_ID}:get-metadata`,
  },
};

/**
 * Tool: Reset View
 * Resets the visualization to its default state.
 */
export const resetViewTool: PanelTool = {
  name: 'reset_view',
  description: 'Resets the visualization zoom, pan, and filters to default state',
  inputs: {
    type: 'object',
    properties: {
      resetFilters: {
        type: 'boolean',
        description: 'Whether to also reset active filters',
      },
    },
  },
  outputs: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
    },
  },
  tags: ['argdown', 'reset', 'view'],
  tool_call_template: {
    call_template_type: 'panel_event',
    event_type: `${PANEL_ID}:reset-view`,
  },
};

/**
 * All tools exported as an array.
 */
export const argdownPanelTools: PanelTool[] = [
  loadArgdownTool,
  setFiltersTool,
  setViewModeTool,
  highlightNodeTool,
  getMetadataTool,
  resetViewTool,
];

/**
 * Panel tools metadata for registration with PanelToolRegistry.
 */
export const argdownPanelToolsMetadata: PanelToolsMetadata = {
  id: PANEL_ID,
  name: 'Argdown Panel',
  description: 'Tools for visualizing and interacting with Argdown argument maps',
  tools: argdownPanelTools,
};
