import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import LOGO_BLACK from '@assets/logo-black.png';
import LOGO_KR from '@assets/logo-kr.png';

type AppLogoProps = {
  style?: StyleProp<ViewStyle>;
  scale?: number;
};

export function AppLogo({ style, scale = 1 }: AppLogoProps) {
  return (
    <View style={[styles.root, style]}>
      <Image
        source={LOGO_BLACK}
        style={[styles.mark, { width: 17 * scale, height: 16 * scale }]}
        resizeMode="contain"
      />
      <Image
        source={LOGO_KR}
        style={[styles.wordmark, { width: 87 * scale, height: 14 * scale }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mark: {
    width: 17,
    height: 16,
  },
  wordmark: {
    width: 87,
    height: 14,
  },
});
