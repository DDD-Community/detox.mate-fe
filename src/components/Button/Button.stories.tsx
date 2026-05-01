import { View } from 'react-native';

import { Button, type ButtonProps } from './Button';

type StoryArgs = Partial<ButtonProps>;
type Meta = {
  title: string;
  component: typeof Button;
  args?: StoryArgs;
  argTypes?: Record<string, unknown>;
};
type Story = {
  args?: StoryArgs;
  render?: (args: StoryArgs) => React.ReactElement;
};

const meta: Meta = {
  title: 'Components/Button',
  component: Button,
  args: {
    label: 'Button',
    variant: 'solid',
    color: 'primary',
    size: 'md',
    disabled: false,
  },
  argTypes: {
    variant: { control: 'select', options: ['solid', 'outlined', 'text'] },
    color: { control: 'select', options: ['primary', 'assistive'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    iconOnly: { control: 'select', options: [false, true, 'circle'] },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    onPress: { action: 'onPress' },
  },
};

export default meta;

export const Playground: Story = {};

export const SolidPrimary: Story = {
  args: { variant: 'solid', color: 'primary' },
};

export const SolidAssistive: Story = {
  args: { variant: 'solid', color: 'assistive' },
};

export const Outlined: Story = {
  args: { variant: 'outlined' },
};

export const TextOnly: Story = {
  args: { variant: 'text', label: 'Text Button' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

const Row = ({ children }: { children: React.ReactNode }) => (
  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
    {children}
  </View>
);
const Stack = ({ children }: { children: React.ReactNode }) => (
  <View style={{ gap: 12 }}>{children}</View>
);

export const Sizes: Story = {
  render: () => (
    <Stack>
      <Row>
        <Button label="sm" size="sm" />
        <Button label="md" size="md" />
        <Button label="lg" size="lg" />
      </Row>
    </Stack>
  ),
};

export const Matrix: Story = {
  render: () => (
    <Stack>
      <Row>
        <Button label="solid" variant="solid" color="primary" />
        <Button label="outlined" variant="outlined" color="primary" />
        <Button label="text" variant="text" color="primary" />
        <Button label="disabled" variant="solid" color="primary" disabled />
      </Row>
      <Row>
        <Button label="solid" variant="solid" color="assistive" />
        <Button label="outlined" variant="outlined" color="assistive" />
        <Button label="text" variant="text" color="assistive" />
        <Button label="disabled" variant="solid" color="assistive" disabled />
      </Row>
    </Stack>
  ),
};
