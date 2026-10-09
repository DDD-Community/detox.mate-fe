import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import detoxLogo from '@assets/brand/detox.svg';
import mateLogo from '@assets/brand/mate.svg';

interface BrandHeaderProps {
  actions?: ReactNode;
  // 오른쪽 액션이 없어도 로고를 왼쪽에 둔다. 액션이 있으면 항상 왼쪽이다.
  alignStart?: boolean;
}

export function BrandHeader({ actions, alignStart = false }: BrandHeaderProps) {
  return (
    <View style={[styles.header, actions || alignStart ? styles.logoAtStart : undefined]}>
      <View style={styles.logo} accessible accessibilityRole="image" accessibilityLabel="Detoxmate">
        <Image source={detoxLogo} style={styles.detox} contentFit="contain" />
        <Image source={mateLogo} style={styles.mate} contentFit="contain" />
      </View>
      {actions}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  logoAtStart: { justifyContent: 'space-between' },
  logo: { flexDirection: 'row', alignItems: 'flex-start', gap: 4.9983 },
  detox: { width: 47.7617, height: 13.5168 },
  mate: { width: 45.5715, height: 13.0564, marginTop: 0.71 },
});
