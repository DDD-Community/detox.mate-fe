import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import detoxLogo from '@assets/brand/detox.svg';
import mateLogo from '@assets/brand/mate.svg';

export function BrandHeader() {
  return (
    <View style={styles.header} accessible accessibilityRole="image" accessibilityLabel="Detoxmate">
      <View style={styles.logo}>
        <Image source={detoxLogo} style={styles.detox} contentFit="contain" />
        <Image source={mateLogo} style={styles.mate} contentFit="contain" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  logo: { flexDirection: 'row', alignItems: 'flex-start', gap: 4.9983 },
  detox: { width: 47.7617, height: 13.5168 },
  mate: { width: 45.5715, height: 13.0564, marginTop: 0.71 },
});
