import type { Preview } from '@storybook/react-vite';
import React from 'react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: ['Introduction', 'Panels', '*'],
      },
    },
  },
  decorators: [
    (Story) => (
      React.createElement('div', {
        style: {
          height: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }
      }, React.createElement(Story))
    ),
  ],
};

export default preview;
