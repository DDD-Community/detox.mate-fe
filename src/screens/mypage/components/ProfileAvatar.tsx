import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { primitiveColors } from '@/lib/token';

import defaultAvatar from '@assets/avatars/default.svg';

interface ProfileAvatarProps {
  uri?: string | null;
  size: number;
}

export function ProfileAvatar({ uri, size }: ProfileAvatarProps) {
  return (
    <Image
      source={uri ? { uri } : defaultAvatar}
      style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      contentFit="cover"
      accessibilityIgnoresInvertColors
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: primitiveColors.gray[50],
  },
});
