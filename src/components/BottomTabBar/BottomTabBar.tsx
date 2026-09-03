import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import type { IconName } from '../../lib/token/icons';
import { Icon } from '../Icon';

const { gray } = primitiveColors;
const WHITE = '#FFFFFF';

export interface BottomTabItem {
  key: string;
  label: string;
  icon: IconName;
}

export interface BottomTabBarProps {
  tabs: BottomTabItem[];
  activeKey: string;
  onTabPress: (key: string) => void;
}

export function BottomTabBar({ tabs, activeKey, onTabPress }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing[12]) }]}>
      {tabs.map((tab) => {
        const active = tab.key === activeKey;

        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            style={styles.touchArea}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <View style={[styles.pill, active && styles.pillActive]}>
              <Icon
                name={tab.icon}
                size={24}
                color={active ? gray[900] : gray[400]}
                weight={active ? 'fill' : 'regular'}
              />
              <Text
                style={[
                  active ? typography.primary.body3B : typography.primary.body3R,
                  active ? styles.labelActive : styles.labelInactive,
                ]}
              >
                {tab.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    paddingTop: spacing[12],
    paddingHorizontal: spacing[16],
    borderTopLeftRadius: radius[16],
    borderTopRightRadius: radius[16],
  },
  touchArea: {
    flex: 1,
    alignItems: 'center',
  },
  pill: {
    alignItems: 'center',
    gap: spacing[4],
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[20],
    borderRadius: radius.full,
  },
  pillActive: {
    backgroundColor: gray[50],
  },
  labelActive: {
    color: gray[900],
  },
  labelInactive: {
    color: gray[400],
  },
});
