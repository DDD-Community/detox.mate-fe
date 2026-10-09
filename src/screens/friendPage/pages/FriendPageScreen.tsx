import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, LoggingButton, LoggingPage } from '@/components';
import { goBackOrReplace } from '@/lib/navigation';
import { primitiveColors, spacing, typography } from '@/lib/token';
import { ProfileAvatar } from '@/screens/mypage/components/ProfileAvatar';
import { FriendFriendsSection } from '../components/FriendFriendsSection';
import { FriendRemoveSheet } from '../components/FriendRemoveSheet';
import { FriendStatusButton } from '../components/FriendStatusButton';
import { useFriendPageExtras } from '../hooks/useFriendPageExtras';
import { useFriendRelationship } from '../hooks/useFriendRelationship';
import {
  parseFriendPageParams,
  type FriendPageParams,
  type RawFriendPageParams,
} from '../utils/friendPageParams';

const { gray } = primitiveColors;
const AVATAR_SIZE = 128;
const BACK_ROUTE = '/(group)/mypage';

export default function FriendPageScreen() {
  const params = parseFriendPageParams(useLocalSearchParams() as RawFriendPageParams);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => goBackOrReplace(BACK_ROUTE)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <Icon name="caretLeft" size={24} color={gray[800]} />
        </Pressable>
      </View>
      {params ? (
        <FriendPageContent params={params} />
      ) : (
        <Text style={styles.invalid}>친구 정보를 불러오지 못했어요.</Text>
      )}
    </SafeAreaView>
  );
}

function FriendPageContent({ params }: { params: FriendPageParams }) {
  const { userId, displayName, profileImageUrl } = params;
  const [removeSheetVisible, setRemoveSheetVisible] = useState(false);
  const { inviteCode, friends } = useFriendPageExtras(userId);
  const friendship = useFriendRelationship(params);

  const handlePressStatus = () => {
    if (friendship.relationship === 'FRIEND') setRemoveSheetVisible(true);
    else if (friendship.relationship === 'NONE') void friendship.send();
    else if (friendship.relationship === 'PENDING_RECEIVED') void friendship.accept();
  };

  const handleConfirmRemove = async () => {
    if (await friendship.remove()) setRemoveSheetVisible(false);
  };

  return (
    <LoggingPage
      eventName="Friend Page Viewed"
      properties={{ pageName: 'FriendPage', relationship_status: params.relationship }}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profile}>
          <ProfileAvatar uri={profileImageUrl} size={AVATAR_SIZE} />
          <View style={styles.identity}>
            <Text style={styles.name}>{displayName}</Text>
            {inviteCode ? <Text style={styles.inviteCode}>{inviteCode}</Text> : null}
          </View>
          {friendship.relationship === 'FRIEND' ? (
            <LoggingButton
              eventName="Friend Page Remove Sheet Open Clicked"
              properties={{ pageName: 'FriendPage', buttonName: '친구' }}
            >
              <FriendStatusButton
                relationship="FRIEND"
                pending={friendship.pending}
                onPress={handlePressStatus}
              />
            </LoggingButton>
          ) : (
            <FriendStatusButton
              relationship={friendship.relationship}
              pending={friendship.pending}
              onPress={handlePressStatus}
            />
          )}
          {!removeSheetVisible && friendship.error ? (
            <Text accessibilityLiveRegion="polite" style={styles.error}>
              {friendship.error}
            </Text>
          ) : null}
        </View>

        {friends ? <FriendFriendsSection friends={friends} /> : null}
      </ScrollView>

      <FriendRemoveSheet
        visible={removeSheetVisible}
        displayName={displayName}
        profileImageUrl={profileImageUrl}
        removing={friendship.removing}
        error={removeSheetVisible ? friendship.error : null}
        onConfirm={handleConfirmRemove}
        onClose={() => setRemoveSheetVisible(false)}
      />
    </LoggingPage>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { height: 54, paddingHorizontal: spacing[16], justifyContent: 'center' },
  invalid: {
    ...typography.primary.body1R,
    padding: spacing[24],
    textAlign: 'center',
    color: gray[500],
  },
  content: { paddingBottom: spacing[40] },
  profile: { alignItems: 'center', paddingTop: spacing[16], gap: spacing[12] },
  identity: { alignItems: 'center', gap: spacing[4] },
  name: { ...typography.primary.h2, lineHeight: 38, color: gray[900] },
  inviteCode: { ...typography.primary.body2R, fontSize: 15, lineHeight: 22, color: gray[300] },
  error: { ...typography.primary.body2R, textAlign: 'center', color: '#b42318' },
});
