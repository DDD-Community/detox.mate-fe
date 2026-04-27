import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { Checkbox } from './Checkbox';

const meta = {
  title: 'Shared/Checkbox',
  component: Checkbox,
  args: {
    checked: false,
    label: 'Checkbox',
    disabled: false,
    onChange: () => undefined,
  },
  argTypes: {
    checked: { control: 'boolean' },
    label: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <View style={{ gap: 12 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => {
    const [checked, setChecked] = React.useState(Boolean(args.checked));

    React.useEffect(() => {
      setChecked(Boolean(args.checked));
    }, [args.checked]);

    return <Checkbox {...args} checked={checked} onChange={setChecked} />;
  },
};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    checked: true,
    disabled: true,
  },
};

export const CustomCheckIcon: Story = {
  args: {
    checked: true,
    checkIcon: <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>✔</Text>,
  },
};
