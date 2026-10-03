import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as ReactNativeDeviceActivity from 'react-native-device-activity';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SHIELD_ACTIONS, SHIELD_CONFIGURATION } from '../../lib/shieldConfig';
import { primitiveColors, typography } from '../../lib/token';
import { useLockStore } from '../../stores/lockStore';

const { gray } = primitiveColors;

const DARK_BG = '#0B0B0C';

/**
 * 실제 iOS 앱 선택 화면(FamilyActivityPicker)을 바로 띄운다. 앱 이름/아이콘은
 * 토큰만으로는 절대 읽을 수 없어서(애플 정책), 화면 표시용 이름은 "잠긴 앱 N"으로
 * 자동으로 붙인다 — 실제 이름/아이콘이 필요한 곳(리포트 화면)은 ScreenTimeReportView가
 * Label(token)로 따로 보여준다.
 */
export default function SelectAppsScreen() {
  const router = useRouter();
  const { selectedAppIds, registerAppSelection } = useLockStore();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  useEffect(() => {
    const openPicker = async () => {
      if (
        ReactNativeDeviceActivity.getAuthorizationStatus() !==
        ReactNativeDeviceActivity.AuthorizationStatus.approved
      ) {
        try {
          await ReactNativeDeviceActivity.requestAuthorization('individual');
        } catch {
          router.back();
          return;
        }
      }
      setIsPickerOpen(true);
    };

    openPicker();
  }, [router]);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Text style={styles.hint}>앱 선택 화면을 불러오는 중이에요…</Text>
      </SafeAreaView>

      {isPickerOpen && (
        <ReactNativeDeviceActivity.DeviceActivitySelectionSheetView
          style={{ width: 1, height: 1, position: 'absolute' }}
          familyActivitySelection={pendingToken}
          onDismissRequest={() => {
            const token = pendingToken;
            setIsPickerOpen(false);
            setPendingToken(null);

            if (token) {
              const appId = `app-${Date.now()}`;

              ReactNativeDeviceActivity.blockSelection(
                { activitySelectionToken: token },
                'app-registered'
              );
              // 쉴드 화면 문구/버튼과, 버튼을 눌렀을 때 우리 앱으로 돌아오는 동작을 설정한다.
              ReactNativeDeviceActivity.updateShield(
                SHIELD_CONFIGURATION,
                SHIELD_ACTIONS,
                'app-registered'
              );
              registerAppSelection(appId, token, `잠긴 앱 ${selectedAppIds.length + 1}`);
              router.push('/(lock)/goal-time');
            } else {
              router.back();
            }
          }}
          onSelectionChange={(event) => setPendingToken(event.nativeEvent.familyActivitySelection)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    ...typography.primary.body2R,
    color: gray[400],
  },
});
