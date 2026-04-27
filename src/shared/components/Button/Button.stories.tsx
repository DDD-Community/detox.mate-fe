import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { primitiveColors } from 'src/lib/token';

import { Button, type ButtonColor, type ButtonIconOption, type ButtonState, type ButtonVariant } from './Button';

const { green, gray } = primitiveColors;

const Icon = ({ color = '#fff' }: { color?: string }) => (
  <View
    style={{
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: color + 'aa',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Text style={{ color, fontSize: 9 }}>i</Text>
  </View>
);

const MATRIX_ROWS: ReadonlyArray<{ variant: ButtonVariant; color: ButtonColor; iconColor: string }> = [
  { variant: 'solid',    color: 'primary',   iconColor: '#fff' },
  { variant: 'outlined', color: 'primary',   iconColor: green[300] },
  { variant: 'solid',    color: 'assistive', iconColor: '#fff' },
  { variant: 'outlined', color: 'assistive', iconColor: gray[700] },
  { variant: 'text',     color: 'primary',   iconColor: green[300] },
  { variant: 'text',     color: 'assistive', iconColor: gray[800] },
];

const MATRIX_COLS: ReadonlyArray<{ state: ButtonState; iconOption: ButtonIconOption }> = [
  { state: 'normal', iconOption: 'icon' },
  { state: 'hover', iconOption: 'icon' },
  { state: 'press', iconOption: 'icon' },
  { state: 'disabled', iconOption: 'icon' },
  { state: 'normal', iconOption: 'iconOnly' },
  { state: 'normal', iconOption: 'iconOnlyCircle' },
];

const meta = {
  title: 'Shared/Button',
  component: Button,
  args: {
    children: 'Button',
    variant: 'solid',
    size: 'md',
    color: 'primary',
    iconOption: 'icon',
    state: 'normal',
    fullWidth: false,
  },
  argTypes: {
    variant: { control: 'select', options: ['solid', 'outlined', 'text'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    color: { control: 'select', options: ['primary', 'assistive'] },
    iconOption: { control: 'select', options: ['icon', 'iconOnly', 'iconOnlyCircle'] },
    state: { control: 'select', options: ['normal', 'hover', 'press', 'disabled'] },
    children: { control: 'text' },
    fullWidth: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <View style={{ gap: 12 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const VariantStateMatrix: Story = {
  render: () => (
    <ScrollView horizontal>
      <ScrollView>
        <View style={{ gap: 12, padding: 8 }}>
          {MATRIX_ROWS.map((row) => (
            <View key={`${row.variant}-${row.color}`} style={{ flexDirection: 'row', gap: 12 }}>
              {MATRIX_COLS.map((col) => {
                const isIconOnly = col.iconOption !== 'icon';
                return (
                  <Button
                    key={`${row.variant}-${row.color}-${col.state}-${col.iconOption}`}
                    variant={row.variant}
                    color={row.color}
                    size="md"
                    iconOption={col.iconOption}
                    state={col.state}
                    icon={<Icon color={row.iconColor} />}
                    children={isIconOnly ? undefined : 'Button'}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  ),
  parameters: {
    controls: { disable: true },
  },
};

export const Playground: Story = {};

export const WithIcons: Story = {
  args: {
    iconOption: 'icon',
    icon: <Icon />,
    children: 'Icon Button',
  },
};

export const IconOnly: Story = {
  args: {
    iconOption: 'iconOnly',
    children: undefined,
    icon: <Icon />,
  },
};

export const IconOnlyCircle: Story = {
  args: {
    iconOption: 'iconOnlyCircle',
    children: undefined,
    icon: <Icon />,
  },
};

export const Disabled: Story = {
  args: {
    state: 'disabled',
  },
};
