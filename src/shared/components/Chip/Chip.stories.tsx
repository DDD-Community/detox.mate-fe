import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { Chip } from './Chip';

const LeftIcon = () => <Text style={{ color: '#fff', fontSize: 12 }}>◉</Text>;

const meta = {
  title: 'Shared/Chip',
  component: Chip,
  args: {
    label: 'Chip',
    colorScheme: 'green500',
    isSelected: false,
    disabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    colorScheme: { control: 'select', options: ['green300', 'green400', 'green500'] },
    isSelected: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <View style={{ gap: 12 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithLeftIcon: Story = {
  args: {
    leftIcon: <LeftIcon />,
  },
};

export const Closable: Story = {
  args: {
    onClose: () => undefined,
  },
};

export const Selected: Story = {
  args: {
    isSelected: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
