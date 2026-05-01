import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Share, StyleSheet, Text, View } from 'react-native';
import apiClient from '../../api/client';
import { Button } from '../../components/Button';
import { primitiveColors, spacing, typography } from '../../lib/token';
import FeedHeader from './FeedHeader';

const { brown, gray } = primitiveColors;

type GroupInfo = {
  name: string;
  inviteCode: string;
  members: unknown[];
};

export default function FeedHome() {
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [isGroupActive, setIsGroupActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await apiClient.get<GroupInfo[]>('/me/groups');
        const groups = res.data;
        if (groups.length > 0) {
          const g = groups[0];
          setGroup(g);
          setIsGroupActive(g.members.length >= 2);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, []);

  const handleInvite = async () => {
    if (!group) return;
    await Share.share({
      message: `우리 함께 디지털 디톡스해요! 💉\n디톡스 메이트 그룹 초대 코드: ${group.inviteCode}`,
    });
  };

  return (
    <View style={styles.root}>
      <FeedHeader groupName={group?.name} />
      {loading ? (
        <View style={styles.body}>
          <ActivityIndicator color={gray[400]} />
        </View>
      ) : isGroupActive ? (
        <InactiveFeed onInvite={handleInvite} />
      ) : (
        <ActiveFeed />
      )}
    </View>
  );
}

function InactiveFeed({ onInvite }: { onInvite: () => void }) {
  return (
    <View style={styles.body}>
      <Image
        source={require('../../../assets/onboarding-none-feed.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptySubtitle}>
        피드가 없어요{'\n'}친구를 초대하여 함께 디톡스를 시작해 보세요
      </Text>
      <Button
        label="친구 초대하기"
        leadingIcon={
          <Image
            source={require('../../../assets/onboarding-share-white.png')}
            style={{ width: 18, height: 18 }}
            resizeMode="contain"
          />
        }
        onPress={onInvite}
        size="md"
      />
    </View>
  );
}

function ActiveFeed() {
  return (
    <View style={styles.body}>
      <Text style={styles.emptySubtitle}>그룹 활성화 화면 (임시)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[24],
    gap: spacing[16],
  },
  emptyImage: {
    width: 100,
    height: 100,
    marginBottom: spacing[8],
  },
  emptySubtitle: {
    ...typography.primary.body2R,
    color: gray[600],
    textAlign: 'center',
  },
});
