import { ArgdownPanel } from './panels/ArgdownPanel';
import type { PanelDefinition, PanelContextValue } from './types';
import { argdownPanelTools, argdownPanelToolsMetadata } from './tools';

/**
 * Export array of panel definitions.
 * This is the required export for panel extensions.
 */
export const panels: PanelDefinition[] = [
  {
    metadata: {
      id: 'industry-theme.argdown-panel',
      name: 'Argdown Panel',
      icon: '🗺️',
      version: '0.1.0',
      author: 'Industry Theme',
      description: 'Interactive Argdown argument map visualization panel',
      slices: [], // This panel doesn't depend on framework data slices
      tools: argdownPanelTools,
    },
    component: ArgdownPanel,

    // Optional: Called when this specific panel is mounted
    onMount: async (_context: PanelContextValue) => {
      // eslint-disable-next-line no-console
      console.log('Argdown Panel mounted');
    },

    // Optional: Called when this specific panel is unmounted
    onUnmount: async (_context: PanelContextValue) => {
      // eslint-disable-next-line no-console
      console.log('Argdown Panel unmounting');
    },
  },
];

/**
 * Optional: Called once when the entire package is loaded.
 * Use this for package-level initialization.
 */
export const onPackageLoad = async () => {
  // eslint-disable-next-line no-console
  console.log('Argdown Panel package loaded');
};

/**
 * Optional: Called once when the package is unloaded.
 * Use this for package-level cleanup.
 */
export const onPackageUnload = async () => {
  // eslint-disable-next-line no-console
  console.log('Argdown Panel package unloading');
};

/**
 * Export tools for server-safe imports.
 * Use '@industry-theme/argdown-panels/tools' to import without React dependencies.
 */
export {
  argdownPanelTools,
  argdownPanelToolsMetadata,
  loadArgdownTool,
  setFiltersTool,
  setViewModeTool,
  highlightNodeTool,
  getMetadataTool,
  resetViewTool,
} from './tools';
