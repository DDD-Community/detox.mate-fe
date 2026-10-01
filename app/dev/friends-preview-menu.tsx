import { Redirect, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const scenarios = [
  ['base', '기본 목록'],
  ['received', '받은 요청 1개'],
  ['search', '이름 검색 결과'],
  ['noresults', '검색 결과 없음'],
  ['delete', '친구 삭제 확인'],
  ['empty', '빈 친구 목록'],
  ['long', '친구 40명 스크롤'],
  ['error', '조회 실패'],
  ['failDelete', '삭제 실패'],
  ['failReject', '거절 실패'],
  ['failAccept', '수락 실패'],
] as const;

export default function FriendsPreviewMenu() {
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>친구 목록 검증</Text>
        <Text style={styles.description}>
          개발용 예시 데이터입니다. 실제 친구 관계는 변경하지 않습니다.
        </Text>
        {scenarios.map(([state, title]) => (
          <Pressable
            key={state}
            accessibilityRole="button"
            style={styles.button}
            onPress={() => router.push({ pathname: '/dev/friends-preview', params: { state } })}
          >
            <Text style={styles.label}>{title}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'white' },
  content: { padding: 20, gap: 12 },
  title: { fontFamily: 'FriendsPretendardBold', fontSize: 24, color: '#2b2f38' },
  description: {
    fontFamily: 'FriendsPretendardRegular',
    fontSize: 14,
    lineHeight: 20,
    color: '#667085',
    marginBottom: 8,
  },
  button: { padding: 16, borderRadius: 12, backgroundColor: '#f0f1f3' },
  label: { fontFamily: 'FriendsPretendardMedium', fontSize: 16, color: '#383e49' },
});
