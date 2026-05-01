import { View } from 'react-native';

import { Chip, type ChipProps } from './Chip';

type StoryArgs = Partial<ChipProps>;
type Meta = {
  title: string;
  component: typeof Chip;
  args?: StoryArgs;
  argTypes?: Record<string, unknown>;
};
type Story = {
  args?: StoryArgs;
  render?: (args: StoryArgs) => React.ReactElement;
};

const meta: Meta = {
  title: 'Components/Chip',
  component: Chip,
  args: {
    label: 'Chip',
    variant: 'solid',
    size: 'md',
    active: false,
    disabled: false,
  },
  argTypes: {
    variant: { control: 'select', options: ['solid', 'outline'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    active: { control: 'boolean' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    onPress: { action: 'onPress' },
  },
};

export default meta;

export const Playground: Story = {};

export const Solid: Story = {
  args: { variant: 'solid' },
};

export const Outline: Story = {
  args: { variant: 'outline' },
};

export const Active: Story = {
  args: { active: true },
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

export const Matrix: Story = {
  render: () => (
    <Stack>
      <Row>
        <Chip label="sm" size="sm" />
        <Chip label="md" size="md" />
        <Chip label="lg" size="lg" />
      </Row>
      <Row>
        <Chip label="solid" variant="solid" />
        <Chip label="solid press" variant="solid" />
        <Chip label="solid active" variant="solid" active />
        <Chip label="solid disabled" variant="solid" disabled />
        <Chip label="solid active-disabled" variant="solid" active disabled />
      </Row>
      <Row>
        <Chip label="outline" variant="outline" />
        <Chip label="outline active" variant="outline" active />
        <Chip label="outline disabled" variant="outline" disabled />
        <Chip label="outline active-disabled" variant="outline" active disabled />
      </Row>
    </Stack>
  ),
};
