import type { Preview } from '@storybook/react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const preview: Preview = {
  decorators: [
    (Story) => (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#2f3136', padding: 16 }}>
        <Story />
      </SafeAreaView>
    ),
  ],
  parameters: {
    controls: {
      expanded: true,
      sort: 'requiredFirst',
    },
  },
};

export default preview;
