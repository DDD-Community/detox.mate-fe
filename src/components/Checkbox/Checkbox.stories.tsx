import { useState } from 'react';
import { View } from 'react-native';

import { Checkbox, type CheckboxProps } from './Checkbox';

type StoryArgs = Partial<CheckboxProps>;
type Meta = {
  title: string;
  component: typeof Checkbox;
  args?: StoryArgs;
  argTypes?: Record<string, unknown>;
};
type Story = {
  args?: StoryArgs;
  render?: (args: StoryArgs) => React.ReactElement;
};

const Controlled = ({ initial = false, ...rest }: StoryArgs & { initial?: boolean }) => {
  const [checked, setChecked] = useState(initial);
  return <Checkbox {...(rest as CheckboxProps)} checked={checked} onChange={setChecked} />;
};

const meta: Meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  args: {
    label: 'Checkbox',
    disabled: false,
  },
  argTypes: {
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    onChange: { action: 'onChange' },
  },
};

export default meta;

export const Playground: Story = {
  render: (args) => <Controlled {...args} />,
};

export const Normal: Story = {
  render: () => <Checkbox checked={false} onChange={() => {}} label="Checkbox" />,
};

export const Checked: Story = {
  render: () => <Checkbox checked={true} onChange={() => {}} label="Checkbox" />,
};

export const Disabled: Story = {
  render: () => <Checkbox checked={false} onChange={() => {}} label="Checkbox" disabled />,
};

export const CheckedDisabled: Story = {
  render: () => <Checkbox checked={true} onChange={() => {}} label="Checkbox" disabled />,
};

const Stack = ({ children }: { children: React.ReactNode }) => (
  <View style={{ gap: 12 }}>{children}</View>
);

export const Matrix: Story = {
  render: () => (
    <Stack>
      <Checkbox checked={false} onChange={() => {}} label="normal" />
      <Checkbox checked={true} onChange={() => {}} label="checked" />
      <Checkbox checked={false} onChange={() => {}} label="disabled" disabled />
      <Checkbox checked={true} onChange={() => {}} label="checked-disabled" disabled />
    </Stack>
  ),
};
