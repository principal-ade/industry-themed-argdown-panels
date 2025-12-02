import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect, useRef } from 'react';
import { ArgdownPanel } from './ArgdownPanel';
import { simpleDebateData, complexDebateData } from '../mocks/sampleArgdownData';
import { createMockPanelContext } from '../mocks/panelContext';
import type { ArgdownMapData } from '@principal-ade/argdown-renderer';

const PANEL_ID = 'industry-theme.argdown-panel';

/**
 * Wrapper component that loads data on mount
 */
const ArgdownPanelWithData: React.FC<{
  data: ArgdownMapData;
  title?: string;
}> = ({ data, title }) => {
  const { context, actions, events } = createMockPanelContext();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Load data after a short delay to simulate async loading
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      setTimeout(() => {
        events.emit(`${PANEL_ID}:load-argdown`, { data, title });
      }, 100);
    }
  }, [data, title, events]);

  return (
    <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
      <ArgdownPanel context={context} actions={actions} events={events} />
    </div>
  );
};

/**
 * Empty state wrapper
 */
const ArgdownPanelEmpty: React.FC = () => {
  const { context, actions, events } = createMockPanelContext();

  return (
    <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
      <ArgdownPanel context={context} actions={actions} events={events} />
    </div>
  );
};

const meta: Meta<typeof ArgdownPanel> = {
  title: 'Panels/ArgdownPanel',
  component: ArgdownPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Argdown Panel

An interactive argument map visualization panel that renders pre-parsed Argdown data.

## Features

- **Multiple view modes**: Map, Source, and Split views
- **Interactive controls**: Zoom, pan, and node selection
- **Filtering**: Filter by speakers, argument types, and tags
- **UTCP Tools**: Integrate with AI agents via tools like \`load_argdown\`, \`set_filters\`, etc.

## Usage

The panel receives pre-parsed \`ArgdownMapData\` via the \`load_argdown\` tool event.
The data should be generated server-side using \`@principal-ade/argdown-parser\`.

\`\`\`typescript
// Emit event to load data
events.emit('industry-theme.argdown-panel:load-argdown', {
  data: argdownMapData,
  title: 'My Debate'
});
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ArgdownPanel>;

/**
 * Empty state when no data is loaded
 */
export const Empty: Story = {
  render: () => <ArgdownPanelEmpty />,
  parameters: {
    docs: {
      description: {
        story: 'The panel in its initial empty state, before any Argdown data is loaded.',
      },
    },
  },
};

/**
 * Simple debate with two speakers
 */
export const SimpleDebate: Story = {
  render: () => (
    <ArgdownPanelWithData
      data={simpleDebateData}
      title="Should AI Be Regulated?"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'A simple debate between two speakers about AI regulation, with one supporting and one opposing argument.',
      },
    },
  },
};

/**
 * Complex debate with multiple speakers and nested arguments
 */
export const ComplexDebate: Story = {
  render: () => (
    <ArgdownPanelWithData
      data={complexDebateData}
      title="Climate Policy Debate"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'A more complex debate about climate policy with multiple speakers (economist, activist, scientist, business) and nested counter-arguments.',
      },
    },
  },
};

/**
 * Interactive demo showing tool usage
 */
export const InteractiveDemo: Story = {
  render: () => {
    const InteractiveDemoComponent: React.FC = () => {
      const { context, actions, events } = createMockPanelContext();
      const hasLoadedRef = useRef(false);

      useEffect(() => {
        if (!hasLoadedRef.current) {
          hasLoadedRef.current = true;
          setTimeout(() => {
            events.emit(`${PANEL_ID}:load-argdown`, {
              data: complexDebateData,
              title: 'Interactive Demo',
            });
          }, 100);
        }
      }, [events]);

      const handleFilterBySpeaker = (speaker: string) => {
        events.emit(`${PANEL_ID}:set-filters`, {
          speakers: [speaker],
        });
      };

      const handleClearFilters = () => {
        events.emit(`${PANEL_ID}:set-filters`, {
          speakers: undefined,
          argumentTypes: undefined,
          tags: undefined,
        });
      };

      const handleSetViewMode = (mode: 'map' | 'source' | 'split') => {
        events.emit(`${PANEL_ID}:set-view-mode`, { mode });
      };

      return (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Control panel */}
          <div
            style={{
              padding: '12px',
              background: '#f5f5f5',
              borderBottom: '1px solid #ddd',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <strong>Filter by Speaker:</strong>{' '}
              <button onClick={() => handleFilterBySpeaker('economist')}>Economist</button>{' '}
              <button onClick={() => handleFilterBySpeaker('activist')}>Activist</button>{' '}
              <button onClick={() => handleFilterBySpeaker('scientist')}>Scientist</button>{' '}
              <button onClick={() => handleFilterBySpeaker('business')}>Business</button>{' '}
              <button onClick={handleClearFilters}>Clear</button>
            </div>
            <div>
              <strong>View Mode:</strong>{' '}
              <button onClick={() => handleSetViewMode('map')}>Map</button>{' '}
              <button onClick={() => handleSetViewMode('source')}>Source</button>{' '}
              <button onClick={() => handleSetViewMode('split')}>Split</button>
            </div>
          </div>

          {/* Panel */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <ArgdownPanel context={context} actions={actions} events={events} />
          </div>
        </div>
      );
    };

    return <InteractiveDemoComponent />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing how to use the panel tools to filter by speaker and change view modes.',
      },
    },
  },
};
