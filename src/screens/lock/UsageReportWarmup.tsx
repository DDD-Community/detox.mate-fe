import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenTimeReportView } from '../../../modules/screen-time-report';
import { useLockStore } from '../../stores/lockStore';

// 첫 화면이 뜰 때까지 익스텐션이 깨어 있도록 앱 시작 직후 잠깐만 띄워 둔다.
const WARMUP_DURATION_MS = 20000;

/**
 * 제한 앱 화면의 사용 시간은 리포트 익스텐션이 계산해서 처음 뜰 때 느리다. 앱을 열자마자 잠근 앱
 * 전체 요약 리포트를 보이지 않게 미리 그려 익스텐션을 먼저 깨워 둔다. 윈도우 안에 있어야 iOS가
 * 렌더링해서 opacity만 거의 0으로 둔다.
 */
export function UsageReportWarmup() {
  const selectionTokens = Object.values(
    useLockStore((state) => state.familyActivitySelectionsByAppId)
  );
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setExpired(true), WARMUP_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (expired || selectionTokens.length === 0) return null;

  return (
    <View pointerEvents="none" style={styles.container}>
      <ScreenTimeReportView
        selectionTokens={selectionTokens}
        reportStyle="summary"
        style={styles.view}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, width: 200, height: 36, opacity: 0.01 },
  view: { width: 200, height: 36 },
});
