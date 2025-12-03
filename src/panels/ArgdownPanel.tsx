import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { GitBranch, Filter, X, Loader2 } from 'lucide-react';
import { ThemeProvider, useTheme } from '@principal-ade/industry-theme';
import { ArgdownRenderer } from '@principal-ade/argdown-renderer';
import { processArgdown } from '@principal-ade/argdown-parser-browser';
import type { ArgdownMapData, FilterOptions, NodeMutation } from '@principal-ade/argdown-renderer';
import type { PanelComponentProps } from '../types';

const PANEL_ID = 'industry-theme.argdown-panel';

interface ArgdownPanelState {
  data: ArgdownMapData | null;
  title: string | null;
  filters: FilterOptions;
  highlightedNode: string | null;
  showFilterPanel: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: ArgdownPanelState = {
  data: null,
  title: null,
  filters: {},
  highlightedNode: null,
  showFilterPanel: false,
  isLoading: false,
  error: null,
};

/**
 * Check if a file path is an argdown file
 */
function isArgdownFile(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.endsWith('.argdown') || lower.endsWith('.ad');
}

/**
 * Check if content looks like argdown syntax
 */
function looksLikeArgdown(content: string): boolean {
  // Check for common argdown patterns:
  // - Claims in brackets: [Claim text]
  // - Arguments in angle brackets: <Argument name>
  // - Support/attack relations: + or -
  // - Inference indicators: ----
  const argdownPatterns = [
    /\[.+\]:/,           // Claim definition
    /<.+>:/,             // Argument definition
    /^\s*\+\s*</m,       // Support relation
    /^\s*-\s*</m,        // Attack relation
    /^-{3,}$/m,          // Inference line
    /^\(\d+\)/m,         // Numbered premises
  ];

  return argdownPatterns.some(pattern => pattern.test(content));
}

// Type for items with tags
interface TaggedItem {
  tags?: string[];
}

/**
 * Extract available speakers from Argdown data by looking at tags
 */
function extractSpeakers(data: ArgdownMapData): string[] {
  const speakers = new Set<string>();
  const response = data.response;

  if (!response) return [];

  // Check tags array (might be array or object)
  if (response.tags && Array.isArray(response.tags)) {
    for (const tag of response.tags) {
      const tagStr = typeof tag === 'string' ? tag : tag?.tag || tag?.title || '';
      if (tagStr.startsWith('speaker-')) {
        speakers.add(tagStr.replace('speaker-', ''));
      }
    }
  } else if (response.tags && typeof response.tags === 'object') {
    // Handle object format where keys are tag names
    for (const tagKey of Object.keys(response.tags)) {
      if (tagKey.startsWith('speaker-')) {
        speakers.add(tagKey.replace('speaker-', ''));
      }
    }
  }

  // Check argument tags
  if (response.arguments) {
    for (const arg of Object.values(response.arguments) as TaggedItem[]) {
      if (arg.tags) {
        for (const tag of arg.tags) {
          if (tag.startsWith('speaker-')) {
            speakers.add(tag.replace('speaker-', ''));
          } else if (!tag.includes('-')) {
            // Treat simple tags as potential speaker names
            speakers.add(tag);
          }
        }
      }
    }
  }

  // Check statement tags
  if (response.statements) {
    for (const stmt of Object.values(response.statements) as TaggedItem[]) {
      if (stmt.tags) {
        for (const tag of stmt.tags) {
          if (tag.startsWith('speaker-')) {
            speakers.add(tag.replace('speaker-', ''));
          } else if (!tag.includes('-')) {
            speakers.add(tag);
          }
        }
      }
    }
  }

  return Array.from(speakers).sort();
}

/**
 * Build node mutations based on speaker filter
 * Nodes matching the filter get emphasized; non-matching nodes get dimmed
 */
function buildSpeakerMutations(
  data: ArgdownMapData,
  filters: FilterOptions
): NodeMutation[] {
  if (!data.response || !filters.speakers?.length) {
    return [];
  }

  const response = data.response;
  const speakerTags = filters.speakers.map(s => `speaker-${s}`);
  const allFilterTags = [...speakerTags, ...filters.speakers];

  const matchingNodeIds: string[] = [];
  const nonMatchingNodeIds: string[] = [];

  // Check arguments
  if (response.arguments) {
    for (const [id, arg] of Object.entries(response.arguments)) {
      const argTags = (arg as TaggedItem).tags || [];
      if (allFilterTags.some(tag => argTags.includes(tag))) {
        matchingNodeIds.push(id);
      } else {
        nonMatchingNodeIds.push(id);
      }
    }
  }

  // Check statements
  if (response.statements) {
    for (const [id, stmt] of Object.entries(response.statements)) {
      const stmtTags = (stmt as TaggedItem).tags || [];
      // Central claims (no speaker tags) should be emphasized when filtering
      const hasSpeakerTag = stmtTags.some((t: string) => t.startsWith('speaker-') || !t.includes('-'));
      if (!hasSpeakerTag || allFilterTags.some(tag => stmtTags.includes(tag))) {
        matchingNodeIds.push(id);
      } else {
        nonMatchingNodeIds.push(id);
      }
    }
  }

  // Also check map nodes directly (they have IDs that may differ from argument/statement IDs)
  if (response.map?.nodes) {
    for (const node of response.map.nodes) {
      const nodeId = node.id;
      const nodeTags = node.tags || [];
      // Only add if not already in our lists
      if (!matchingNodeIds.includes(nodeId) && !nonMatchingNodeIds.includes(nodeId)) {
        if (allFilterTags.some(tag => nodeTags.includes(tag))) {
          matchingNodeIds.push(nodeId);
        } else {
          // Don't auto-dim nodes we haven't explicitly checked
        }
      }
    }
  }

  const mutations: NodeMutation[] = [];

  // Emphasize matching nodes
  if (matchingNodeIds.length > 0) {
    mutations.push({
      nodeIds: matchingNodeIds,
      effect: 'emphasize',
      reason: `Speaker: ${filters.speakers.join(', ')}`,
      priority: 10,
    });
  }

  // Dim non-matching nodes
  if (nonMatchingNodeIds.length > 0) {
    mutations.push({
      nodeIds: nonMatchingNodeIds,
      effect: 'dim',
      reason: 'Not matching filter',
      priority: 0,
    });
  }

  return mutations;
}

/**
 * ArgdownPanelContent - Internal component that uses theme
 */
const ArgdownPanelContent: React.FC<PanelComponentProps> = ({
  context,
  actions: _actions,
  events,
}) => {
  const [state, setState] = useState<ArgdownPanelState>(initialState);
  const { theme } = useTheme();
  const hasInitialized = React.useRef(false);

  // Handle load argdown event
  const handleLoadArgdown = useCallback((payload: { data: ArgdownMapData; title?: string }) => {
    setState((prev) => ({
      ...prev,
      data: payload.data,
      title: payload.title || null,
      filters: {}, // Reset filters when loading new data
    }));
  }, []);

  // Handle set filters event
  const handleSetFilters = useCallback((payload: FilterOptions) => {
    setState((prev) => ({
      ...prev,
      filters: payload,
    }));
  }, []);

  // Handle highlight node event
  const handleHighlightNode = useCallback((payload: { nodeId: string; scrollTo?: boolean }) => {
    setState((prev) => ({
      ...prev,
      highlightedNode: payload.nodeId,
    }));
  }, []);

  // Handle reset view event
  const handleResetView = useCallback((payload: { resetFilters?: boolean }) => {
    setState((prev) => ({
      ...prev,
      highlightedNode: null,
      filters: payload.resetFilters ? {} : prev.filters,
    }));
  }, []);

  // Handle file selection - parse argdown content from file
  const handleFileSelected = useCallback(async (payload: { path: string; content?: string }) => {
    const { path, content } = payload;

    // Skip if no content provided
    if (!content) {
      console.log('[ArgdownPanel] file:selected received but no content provided');
      return;
    }

    console.log('[ArgdownPanel] Processing content from:', path);

    // Set loading state
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      // Parse the argdown content
      const data = await processArgdown(content);

      // Extract title from path
      const filename = path.split('/').pop() || path;
      const title = filename.replace(/\.(argdown|ad|md)$/i, '');

      setState((prev) => ({
        ...prev,
        data,
        title,
        filters: {},
        isLoading: false,
        error: null,
      }));

      console.log('[ArgdownPanel] Successfully parsed argdown content');
    } catch (error) {
      console.error('[ArgdownPanel] Failed to parse argdown content:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to parse argdown content',
      }));
    }
  }, []);

  // Subscribe to panel events
  useEffect(() => {
    const unsubscribers = [
      events.on<{ data: ArgdownMapData; title?: string }>(
        `${PANEL_ID}:load-argdown`,
        (event) => {
          if (event.payload) {
            handleLoadArgdown(event.payload);
          }
        }
      ),
      events.on<FilterOptions>(`${PANEL_ID}:set-filters`, (event) => {
        if (event.payload) {
          handleSetFilters(event.payload);
        }
      }),
      events.on<{ nodeId: string; scrollTo?: boolean }>(
        `${PANEL_ID}:highlight-node`,
        (event) => {
          if (event.payload) {
            handleHighlightNode(event.payload);
          }
        }
      ),
      events.on<{ resetFilters?: boolean }>(`${PANEL_ID}:reset-view`, (event) => {
        handleResetView(event.payload || {});
      }),
      // Listen for file selection events to auto-parse argdown content
      events.on<{ path: string; content?: string }>('file:selected', (event) => {
        if (event.payload) {
          handleFileSelected(event.payload);
        }
      }),
      events.on<{ path: string; content?: string }>('file:opened', (event) => {
        if (event.payload) {
          handleFileSelected(event.payload);
        }
      }),
    ];

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [events, handleLoadArgdown, handleSetFilters, handleHighlightNode, handleResetView, handleFileSelected]);

  // Check for existing content in active-file slice on mount
  useEffect(() => {
    if (hasInitialized.current || state.data) return;
    hasInitialized.current = true;

    // Try to get content from the active-file slice
    const activeFileSlice = context.getSlice?.('active-file');
    if (activeFileSlice?.data) {
      const { path, content } = activeFileSlice.data as { path?: string; content?: string };
      if (path && content) {
        console.log('[ArgdownPanel] Found existing content in active-file slice:', path);
        handleFileSelected({ path, content });
      }
    }
  }, [context, handleFileSelected, state.data]);

  // Extract available speakers from data
  const availableSpeakers = useMemo(() => {
    if (!state.data) return [];
    return extractSpeakers(state.data);
  }, [state.data]);

  // Build node mutations based on current filters
  const nodeMutations = useMemo(() => {
    if (!state.data) return [];
    return buildSpeakerMutations(state.data, state.filters);
  }, [state.data, state.filters]);

  // Extract metadata from data (not filtered, since we now use mutations)
  const metadata = state.data?.response
    ? {
        nodeCount: state.data.response.map?.nodes?.length || 0,
        edgeCount: state.data.response.map?.edges?.length || 0,
        tags: state.data.response.tags || [],
      }
    : null;

  // Toggle speaker filter
  const toggleSpeakerFilter = (speaker: string) => {
    setState((prev) => {
      const currentSpeakers = prev.filters.speakers || [];
      const newSpeakers = currentSpeakers.includes(speaker)
        ? currentSpeakers.filter(s => s !== speaker)
        : [...currentSpeakers, speaker];
      return {
        ...prev,
        filters: {
          ...prev.filters,
          speakers: newSpeakers.length > 0 ? newSpeakers : undefined,
        },
      };
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setState((prev) => ({
      ...prev,
      filters: {},
    }));
  };

  const hasActiveFilters = (state.filters.speakers?.length || 0) > 0;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderBottom: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.surface,
        }}
      >
        <GitBranch size={18} color={theme.colors.primary} />
        <span style={{ fontWeight: 500, fontSize: theme.fontSizes[3] }}>
          {state.title || 'Argdown Viewer'}
        </span>

        {metadata && (
          <span
            style={{
              marginLeft: '8px',
              fontSize: theme.fontSizes[1],
              color: theme.colors.textSecondary,
            }}
          >
            {metadata.nodeCount} nodes, {metadata.edgeCount} edges
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* Filter toggle button */}
        {availableSpeakers.length > 0 && (
          <button
            onClick={() => setState(prev => ({ ...prev, showFilterPanel: !prev.showFilterPanel }))}
            style={{
              padding: '4px 12px',
              border: `1px solid ${hasActiveFilters ? theme.colors.primary : theme.colors.border}`,
              borderRadius: theme.radii[1],
              background: hasActiveFilters ? theme.colors.primary : theme.colors.surface,
              color: hasActiveFilters ? theme.colors.background : theme.colors.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: theme.fontSizes[1],
            }}
          >
            <Filter size={14} />
            {hasActiveFilters ? `Filtered (${state.filters.speakers?.length})` : 'Filter'}
          </button>
        )}

        {/* Clear filters button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              padding: '4px 8px',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radii[1],
              background: theme.colors.surface,
              color: theme.colors.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Clear filters"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter panel */}
      {state.showFilterPanel && availableSpeakers.length > 0 && (
        <div
          style={{
            padding: '12px',
            borderBottom: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.backgroundSecondary,
          }}
        >
          <div style={{ fontSize: theme.fontSizes[1], color: theme.colors.textSecondary, marginBottom: '8px' }}>
            Filter by speaker:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {availableSpeakers.map((speaker) => {
              const isActive = state.filters.speakers?.includes(speaker);
              return (
                <button
                  key={speaker}
                  onClick={() => toggleSpeakerFilter(speaker)}
                  style={{
                    padding: '4px 12px',
                    border: `1px solid ${isActive ? theme.colors.primary : theme.colors.border}`,
                    borderRadius: theme.radii[2],
                    background: isActive ? theme.colors.primary : theme.colors.surface,
                    color: isActive ? theme.colors.background : theme.colors.text,
                    cursor: 'pointer',
                    fontSize: theme.fontSizes[1],
                    textTransform: 'capitalize',
                  }}
                >
                  {speaker}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {state.isLoading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: theme.colors.textMuted,
              gap: '16px',
            }}
          >
            <Loader2 size={48} strokeWidth={1} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: theme.fontSizes[3] }}>
              Parsing Argdown content...
            </div>
          </div>
        ) : state.error ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: theme.colors.error || '#ef4444',
              gap: '16px',
              padding: '24px',
            }}
          >
            <X size={48} strokeWidth={1} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: theme.fontSizes[3], marginBottom: '8px' }}>
                Failed to parse Argdown
              </div>
              <div style={{ fontSize: theme.fontSizes[2], color: theme.colors.textMuted }}>
                {state.error}
              </div>
            </div>
          </div>
        ) : state.data ? (
          <ArgdownRenderer
            theme={theme}
            data={state.data}
            config={{
              showToolbar: false,
              interactive: true,
              nodeMutations,
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: theme.colors.textMuted,
              gap: '16px',
            }}
          >
            <GitBranch size={48} strokeWidth={1} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: theme.fontSizes[3], marginBottom: '8px' }}>
                No Argdown data loaded
              </div>
              <div style={{ fontSize: theme.fontSizes[2] }}>
                Select an <code style={{ fontFamily: theme.fonts.monospace }}>.argdown</code> or <code style={{ fontFamily: theme.fonts.monospace }}>.ad</code> file,
                or use the <code style={{ fontFamily: theme.fonts.monospace }}>load_argdown</code> tool
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * ArgdownPanel - Argdown argument map visualization panel
 *
 * This panel renders pre-parsed Argdown data as interactive argument maps.
 * It supports:
 * - Multiple view modes (map, source, split)
 * - Filtering by speakers, argument types, and tags
 * - Zoom and pan controls
 * - Node highlighting
 */
export const ArgdownPanel: React.FC<PanelComponentProps> = (props) => {
  return (
    <ThemeProvider>
      <ArgdownPanelContent {...props} />
    </ThemeProvider>
  );
};
