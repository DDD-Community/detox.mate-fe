import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '../../components/Icon';
import { setShowcaseSection } from '../../lib/sharedDisplayConfig';
import { primitiveColors, radius, spacing, typography } from '../../lib/token';
import { useLockStore } from '../../stores/lockStore';
import { ScreenTimeReportView } from '../../../modules/screen-time-report';

const { gray, green } = primitiveColors;

// ShowcaseReportScene.swift의 section 번호와 같은 순서여야 한다.
const SECTIONS = [
  '연결 확인',
  '아이콘/이름',
  '아이콘 크기·모양',
  '이름 폰트',
  '시간 표기',
  '진행도',
  '추가 지표',
  '랭킹',
  '배경',
  '안 되는 것',
];

/**
 * [임시] 스크린타임 리포트(앱 로고/이름/사용 시간) UI를 어디까지 커스텀할 수 있는지
 * 보여주는 샘플 페이지. 본문은 리포트 익스텐션이 그리는 네이티브 뷰 하나이고
 * (targets/DeviceActivityReportExtension/ShowcaseReportScene.swift), 어느 섹션을 그릴지는
 * 앱 그룹 UserDefaults로 넘긴다. 확인이 끝나면 이 파일과 라우트, 현황 화면의 임시 버튼을
 * 같이 지우면 된다.
 */
export default function UiShowcaseScreen() {
  const router = useRouter();
  const { familyActivitySelectionsByAppId } = useLockStore();
  const tokens = Object.values(familyActivitySelectionsByAppId);
  // null = 아직 앱 그룹에 값을 쓰기 전(쓰기 전에 네이티브 뷰를 먼저 띄우면 이전 값을 읽는다).
  const [section, setSection] = useState<number | null>(null);

  useEffect(() => {
    setShowcaseSection(0);
    setSection(0);
  }, []);

  const handleSelect = (next: number) => {
    setShowcaseSection(next);
    setSection(next);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable hitSlop={8} onPress={() => router.back()}>
            <Icon name="caretLeft" size={22} color={gray[800]} />
          </Pressable>
          <Text style={styles.headerTitle}>리포트 UI 커스텀 샘플</Text>
        </View>

        <View style={styles.chipsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {SECTIONS.map((label, index) => (
              <Pressable
                key={label}
                style={[styles.chip, section === index && styles.chipActive]}
                onPress={() => handleSelect(index)}
              >
                <Text style={[styles.chipText, section === index && styles.chipTextActive]}>
                  {index}. {label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {tokens.length === 0 ? (
          <Text style={styles.empty}>먼저 잠글 앱을 하나 이상 등록해주세요.</Text>
        ) : section === null ? null : (
          // key: 섹션이 바뀔 때마다 새로 마운트해야 익스텐션이 새 값을 읽어 다시 그린다.
          <ScreenTimeReportView
            key={section}
            selectionTokens={tokens}
            reportStyle="showcase"
            style={styles.report}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    height: 54,
    paddingHorizontal: spacing[16],
  },
  headerTitle: {
    ...typography.primary.title1M,
    color: gray[800],
  },
  chipsWrap: {
    height: 44,
  },
  chips: {
    paddingHorizontal: spacing[16],
    gap: spacing[8],
    alignItems: 'center',
  },
  chip: {
    height: 32,
    paddingHorizontal: spacing[12],
    borderRadius: radius.full,
    backgroundColor: gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: green[300],
  },
  chipText: {
    ...typography.primary.body3M,
    color: gray[800],
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  report: {
    flex: 1,
  },
  empty: {
    ...typography.primary.body2R,
    color: gray[400],
    padding: spacing[16],
  },
});
