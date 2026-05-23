import type { IconWeight } from 'phosphor-react-native';

import { primitiveColors } from '../../lib/token';
import { iconComponents, type IconName } from '../../lib/token/icons';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  weight?: IconWeight;
  mirrored?: boolean;
  testID?: string;
}

export function Icon({
  name,
  size = 24,
  color = primitiveColors.gray[900],
  weight = 'regular',
  mirrored,
  testID,
}: IconProps) {
  const IconComponent = iconComponents[name];

  return (
    <IconComponent size={size} color={color} weight={weight} mirrored={mirrored} testID={testID} />
  );
}
