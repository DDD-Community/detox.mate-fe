import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import * as ReactNativeDeviceActivity from 'react-native-device-activity';
import { SafeAreaView } from 'react-native-safe-area-context';
import { primitiveColors, radius, typography } from '../../lib/token';

interface AppSelectionViewProps {
  header: ReactNode;
  selection: string | null;
  onSelectionChange: (selection: {
    familyActivitySelection: string | null;
    applicationCount: number;
    categoryCount: number;
    webDomainCount: number;
  }) => void;
  onPermissionDenied?: () => void;
}

export function AppSelectionView({
  header,
  selection,
  onSelectionChange,
  onPermissionDenied,
}: AppSelectionViewProps) {
  const isDark = useColorScheme() !== 'light';
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const deniedHandler = useRef(onPermissionDenied);
  deniedHandler.current = onPermissionDenied;
  const mounted = useRef(true);

  const openPicker = useCallback(async () => {
    setPermissionError(false);
    if (
      ReactNativeDeviceActivity.getAuthorizationStatus() !==
      ReactNativeDeviceActivity.AuthorizationStatus.approved
    ) {
      try {
        await ReactNativeDeviceActivity.requestAuthorization('individual');
      } catch {
        if (!mounted.current) return;
        setPermissionError(true);
        deniedHandler.current?.();
        return;
      }
    }
    if (mounted.current) setIsAuthorized(true);
  }, []);

  useEffect(() => {
    mounted.current = true;
    void openPicker();
    return () => {
      mounted.current = false;
    };
  }, [openPicker]);

  return (
    <View style={[styles.root, !isDark && styles.rootLight]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {header}
        <View style={styles.pickerWrap}>
          {isAuthorized ? (
            <ReactNativeDeviceActivity.DeviceActivitySelectionView
              style={styles.picker}
              familyActivitySelection={selection}
              onSelectionChange={(event) => onSelectionChange(event.nativeEvent)}
            />
          ) : permissionError ? (
            <Pressable accessibilityRole="button" onPress={openPicker}>
              <Text style={styles.hint}>스크린타임 권한을 확인한 뒤 다시 시도해 주세요.</Text>
              <Text style={styles.retry}>다시 시도</Text>
            </Pressable>
          ) : (
            <Text style={styles.hint}>앱 선택 화면을 불러오는 중이에요…</Text>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0C' },
  rootLight: { backgroundColor: '#FFFFFF' },
  safeArea: { flex: 1 },
  pickerWrap: {
    flex: 1,
    borderRadius: radius[16],
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  picker: { flex: 1, alignSelf: 'stretch' },
  hint: { ...typography.primary.body2R, color: primitiveColors.gray[400] },
  retry: { ...typography.primary.body2M, color: primitiveColors.green[300] },
});
