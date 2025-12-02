# Argdown Panel Design Document

## Overview

This document outlines the design for creating an Argdown Visualization panel that integrates the `@principal-ade/argdown-renderer` package into the industry-themed panel framework. The panel enables interactive visualization of argument maps from Argdown source text.

## Project Context

This panel is part of a larger **Debate Visualization Pipeline**:

```
Debate Transcript → Knowledge Graph → Argdown Format → Interactive Visualization
                                                              ↑
                                                        (This Panel)
```

The panel serves as the final visualization layer, consuming Argdown-formatted content and rendering interactive argument maps.

## Source Package

**Package:** `@principal-ade/argdown-renderer`
**Location:** `/Users/griever/Developer/Pixel/packages/argdown-renderer`
**Version:** 0.1.0

### Package Features

- React 19+ with TypeScript
- Industry theme integration (`@principal-ade/industry-theme`)
- D3-based visualization (d3-selection, d3-zoom, d3-transition)
- Dagre for graph layout
- Configurable view modes (map, source, split)
- Speaker and argument type filtering
- Zoom and pan controls
- CSS theming via custom properties

### Key Exports

```typescript
// Components
import { ArgdownRenderer, ArgdownRendererWithProvider } from '@principal-ade/argdown-renderer';

// Hooks
import { useArgdownRenderer } from '@principal-ade/argdown-renderer';

// Utilities
import { processArgdown, validateArgdown, extractMetadata } from '@principal-ade/argdown-renderer';

// Styles
import '@principal-ade/argdown-renderer/styles.css';
```

---

## Panel Design

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Argdown Panel Container                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      Toolbar                             │    │
│  │  [View: Map ▾] [Zoom: + -] [Filter ▾] [Export ▾]        │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │                   Argument Map View                      │    │
│  │                                                          │    │
│  │      ┌──────────────┐                                   │    │
│  │      │ Central Claim │                                   │    │
│  │      └───────┬──────┘                                   │    │
│  │              │                                           │    │
│  │     ┌───────┴───────┐                                   │    │
│  │     │               │                                   │    │
│  │  ┌──▼───┐       ┌───▼──┐                                │    │
│  │  │ Pro  │       │ Con  │                                │    │
│  │  │ Arg  │       │ Arg  │                                │    │
│  │  └──────┘       └──────┘                                │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌───────────┐                                                  │
│  │  Minimap  │                                                  │
│  └───────────┘                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
ArgdownPanel/
├── ArgdownPanel.tsx           # Main panel entry point
├── components/
│   ├── ArgdownToolbar.tsx     # Toolbar with controls
│   ├── ArgdownViewer.tsx      # Wraps ArgdownRenderer
│   ├── FilterPanel.tsx        # Speaker/type filtering UI
│   ├── ExportMenu.tsx         # Export options (SVG, PNG, PDF)
│   └── SourceEditor.tsx       # Argdown source editor (split view)
├── hooks/
│   ├── useArgdownSource.ts    # Manage Argdown source state
│   ├── useFilters.ts          # Filter state management
│   └── useExport.ts           # Export functionality
├── types/
│   └── panel.types.ts         # Panel-specific types
└── stories/
    └── ArgdownPanel.stories.tsx # Storybook stories
```

### Data Flow

```
┌─────────────────┐
│ Argdown Source  │  (from tool call, file, or editor)
│ (string)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ processArgdown  │  (validate & parse)
│ validateArgdown │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│ Panel State     │◄────►│ User Actions    │
│ - source        │      │ - filter        │
│ - filters       │      │ - zoom/pan      │
│ - viewMode      │      │ - export        │
│ - config        │      │ - edit source   │
└────────┬────────┘      └─────────────────┘
         │
         ▼
┌─────────────────┐
│ ArgdownRenderer │
│ (visualization) │
└─────────────────┘
```

---

## Features

### Core Features (MVP)

1. **Argdown Rendering**
   - Render Argdown source as interactive argument map
   - Support all Argdown syntax (claims, arguments, relations)
   - Apply industry theme styling

2. **View Modes**
   - Map view (default): Interactive argument visualization
   - Source view: Argdown text with syntax highlighting
   - Split view: Side-by-side source and map

3. **Interactive Controls**
   - Zoom in/out with controls and mouse wheel
   - Pan by dragging
   - Fit to view / reset zoom
   - Select and highlight nodes

4. **Filtering**
   - Filter by speaker (using Argdown tags like `#speaker-a`)
   - Filter by argument type (support/attack)
   - Show/hide specific claims or arguments

5. **Tool Integration**
   - `loadArgdown`: Load Argdown content into the panel
   - `setFilters`: Programmatically set active filters
   - `getMetadata`: Extract speakers, tags, structure info
   - `export`: Export current view to image/PDF

### Extended Features (Post-MVP)

1. **Export Options**
   - Export to SVG
   - Export to PNG
   - Export to PDF
   - Copy Argdown source

2. **Minimap Navigation**
   - Overview of full argument structure
   - Click to navigate to region
   - Visual indicator of current viewport

3. **Source Editing**
   - Edit Argdown source directly in panel
   - Live preview of changes
   - Syntax validation with error highlighting

4. **Debate-Specific Features**
   - Timeline slider for temporal debates
   - Speaker comparison view
   - Argument strength indicators

5. **Accessibility**
   - Keyboard navigation
   - Screen reader support
   - High contrast mode

---

## UTCP Tool Definitions

### Tool: `loadArgdown`

Load Argdown content into the panel for visualization.

```typescript
interface LoadArgdownParams {
  source: string;           // Argdown source text
  title?: string;           // Optional title for the visualization
  config?: RendererConfig;  // Optional renderer configuration
}

interface LoadArgdownResult {
  success: boolean;
  metadata: {
    title?: string;
    speakers: string[];
    tags: string[];
    claimCount: number;
    argumentCount: number;
  };
  errors?: string[];
}
```

### Tool: `setFilters`

Apply filters to the visualization.

```typescript
interface SetFiltersParams {
  speakers?: string[];                    // Filter to specific speakers
  argumentTypes?: ('support' | 'attack')[];  // Filter by argument type
  tags?: string[];                        // Filter by tags
  showClaims?: boolean;                   // Show/hide claims
  showArguments?: boolean;                // Show/hide arguments
}

interface SetFiltersResult {
  success: boolean;
  activeFilters: SetFiltersParams;
  visibleNodeCount: number;
}
```

### Tool: `setViewMode`

Change the panel view mode.

```typescript
interface SetViewModeParams {
  mode: 'map' | 'source' | 'split';
}

interface SetViewModeResult {
  success: boolean;
  currentMode: string;
}
```

### Tool: `getArgdownMetadata`

Extract metadata from the current Argdown content.

```typescript
interface GetMetadataResult {
  title?: string;
  speakers: Array<{
    id: string;
    claimCount: number;
    argumentCount: number;
  }>;
  tags: string[];
  structure: {
    claims: number;
    arguments: number;
    supportRelations: number;
    attackRelations: number;
  };
}
```

### Tool: `exportView`

Export the current visualization.

```typescript
interface ExportViewParams {
  format: 'svg' | 'png' | 'pdf' | 'argdown';
  filename?: string;
}

interface ExportViewResult {
  success: boolean;
  data?: string;          // Base64 encoded data or raw text
  mimeType: string;
  filename: string;
}
```

### Tool: `highlightNode`

Highlight a specific node in the visualization.

```typescript
interface HighlightNodeParams {
  nodeId: string;         // ID of claim or argument to highlight
  scrollTo?: boolean;     // Whether to pan the view to the node
}

interface HighlightNodeResult {
  success: boolean;
  nodeType: 'claim' | 'argument';
  nodeLabel: string;
}
```

---

## Configuration

### Panel Configuration

```typescript
interface ArgdownPanelConfig {
  // Initial content
  initialSource?: string;

  // View settings
  defaultViewMode: 'map' | 'source' | 'split';
  showToolbar: boolean;
  showMinimap: boolean;

  // Renderer settings
  renderer: {
    interactive: boolean;
    zoom: {
      enabled: boolean;
      initialZoom: number;
      minZoom: number;
      maxZoom: number;
    };
    layout: {
      rankDir: 'TB' | 'BT' | 'LR' | 'RL';
      nodeSep: number;
      rankSep: number;
    };
  };

  // Feature toggles
  enableEditing: boolean;
  enableExport: boolean;
  enableFiltering: boolean;

  // Theme
  themeOverrides?: Partial<ArgdownTheme>;
}
```

### Default Configuration

```typescript
const defaultConfig: ArgdownPanelConfig = {
  defaultViewMode: 'map',
  showToolbar: true,
  showMinimap: true,
  renderer: {
    interactive: true,
    zoom: {
      enabled: true,
      initialZoom: 1.0,
      minZoom: 0.1,
      maxZoom: 3.0,
    },
    layout: {
      rankDir: 'TB',
      nodeSep: 50,
      rankSep: 50,
    },
  },
  enableEditing: false,
  enableExport: true,
  enableFiltering: true,
};
```

---

## Implementation Plan

### Phase 1: Foundation

- [ ] Set up project dependencies (link argdown-renderer from Pixel)
- [ ] Create basic panel structure with ArgdownRenderer integration
- [ ] Implement `loadArgdown` tool
- [ ] Add basic toolbar with view mode toggle
- [ ] Create Storybook stories with sample Argdown content
- [ ] Verify industry theme integration

### Phase 2: Core Interactivity

- [ ] Implement zoom and pan controls
- [ ] Add filter panel UI (speakers, argument types)
- [ ] Implement `setFilters` and `setViewMode` tools
- [ ] Add node selection and highlighting
- [ ] Implement `highlightNode` tool
- [ ] Add minimap component

### Phase 3: Extended Features

- [ ] Implement source view with syntax highlighting
- [ ] Add split view mode
- [ ] Implement export functionality (SVG, PNG)
- [ ] Add `exportView` tool
- [ ] Implement `getArgdownMetadata` tool

### Phase 4: Polish & Integration

- [ ] Add loading and error states
- [ ] Implement keyboard shortcuts
- [ ] Add accessibility features
- [ ] Performance optimization for large argument maps
- [ ] Documentation and usage examples
- [ ] Integration testing with upstream pipeline

---

## Sample Argdown Content

### Simple Debate

```argdown
# Should AI Be Regulated?

[AI should be regulated]: AI regulation is necessary. #speaker-a

  + <Existential Risk Argument>: AI poses risks to humanity. #speaker-a
    (1) AI systems could harm humans
    (2) Oversight prevents harmful decisions
    ----
    (3) Therefore, AI should be regulated

  - <Innovation Argument>: Regulation harms progress. #speaker-b
    (1) Technology develops too quickly
    (2) Regulation cannot keep pace
    ----
    (3) Therefore, AI should not be regulated
```

### Complex Debate with Nested Arguments

```argdown
# Climate Policy Debate

[We should implement carbon tax]: A carbon tax is the most effective climate policy. #economist

  + <Economic Efficiency>: Market-based solutions are efficient. #economist
    (1) Carbon tax creates price signal
    (2) Markets allocate resources efficiently
    (3) Companies will innovate to reduce costs
    ----
    (4) Carbon tax achieves emissions reduction at lowest cost

    - <Market Failure>: Markets fail with externalities. #environmentalist
      (1) Climate change is a negative externality
      (2) Markets don't price externalities correctly
      ----
      (3) Carbon tax may not be sufficient alone

  - <Regressive Impact>: Carbon tax hurts the poor. #activist
    (1) Low-income households spend more on energy
    (2) Carbon tax increases energy prices
    ----
    (3) Carbon tax is regressive

    + <Revenue Recycling>: Tax revenue can offset impact. #economist
      (1) Revenue can fund direct payments to households
      (2) Progressive rebates possible
      ----
      (3) Regressive impact can be mitigated
```

---

## Dependencies

### Required Dependencies

```json
{
  "dependencies": {
    "@principal-ade/argdown-renderer": "file:../../../Pixel/packages/argdown-renderer",
    "@principal-ade/industry-theme": "^0.1.3",
    "d3-selection": "^3.0.0",
    "d3-transition": "^3.0.1",
    "d3-zoom": "^3.0.0",
    "react": "^19.1.1",
    "react-dom": "^19.1.1"
  }
}
```

### Dev Dependencies

```json
{
  "devDependencies": {
    "@types/d3-selection": "^3.0.0",
    "@types/d3-transition": "^3.0.0",
    "@types/d3-zoom": "^3.0.0"
  }
}
```

---

## Technical Considerations

### 1. Local Package Linking

The `@principal-ade/argdown-renderer` package is not published to npm. We'll use a file-based dependency:

```json
"@principal-ade/argdown-renderer": "file:../../../Pixel/packages/argdown-renderer"
```

Ensure the package is built before linking:
```bash
cd /Users/griever/Developer/Pixel/packages/argdown-renderer
bun run build
```

### 2. CSS Loading

The renderer requires its CSS to be imported:

```typescript
import '@principal-ade/argdown-renderer/styles.css';
```

Ensure Vite/Storybook config handles CSS imports from node_modules.

### 3. D3 Compatibility

The renderer uses D3 for visualization. Ensure D3 modules are available as peer dependencies and properly bundled.

### 4. Theme Integration

The panel should respect the industry theme context. Use `ArgdownRendererWithProvider` for automatic theme integration, or pass theme explicitly with `ArgdownRenderer`.

### 5. Browser Compatibility

The renderer uses modern browser APIs. Ensure target browsers support:
- ES2020+ features
- CSS custom properties
- SVG manipulation

---

## Success Criteria

### MVP Success

- [ ] Panel renders Argdown content as interactive argument map
- [ ] View mode switching works (map/source/split)
- [ ] Zoom and pan controls function correctly
- [ ] Basic filtering by speaker works
- [ ] `loadArgdown` tool works via UTCP
- [ ] Industry theme is applied correctly

### Full Release Success

- [ ] All defined tools are implemented and working
- [ ] Export to SVG/PNG works
- [ ] Minimap navigation functions
- [ ] Keyboard shortcuts implemented
- [ ] Accessible to screen readers
- [ ] Handles large argument maps (50+ nodes) without lag
- [ ] Integration with upstream pipeline verified

---

## References

- [Argdown Syntax Documentation](https://argdown.org)
- [@principal-ade/argdown-renderer README](/Users/griever/Developer/Pixel/packages/argdown-renderer/README.md)
- [Pixel Project DESIGN.md](/Users/griever/Developer/Pixel/DESIGN.md)
- [Industry Theme Package](https://github.com/a24z/industry-theme)
- [D3.js Documentation](https://d3js.org)
- [Dagre Graph Layout](https://github.com/dagrejs/dagre)
