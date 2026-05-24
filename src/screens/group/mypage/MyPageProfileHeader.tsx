import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components';
import { primitiveColors, radius, spacing, typography } from '@/lib/token';

import TURTLE_IMG from '@assets/turtle-hi.png';

const { brown, gray, green } = primitiveColors;

interface ProfileChipProps {
  label: string;
}

function ProfileChip({ label }: ProfileChipProps) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

interface MyPageProfileHeaderProps {
  isFriend: boolean;
  displayName: string;
  dayCount: number;
  achievementRate: number;
  displayProfileImageUri: string | null;
  hasProfileBackground: boolean;
  isUpdatingProfileImage: boolean;
  onBack: () => void;
  onSettings: () => void;
  onEditName: () => void;
  onEditProfileImage: () => void;
}

export function MyPageProfileHeader({
  isFriend,
  displayName,
  dayCount,
  achievementRate,
  displayProfileImageUri,
  hasProfileBackground,
  isUpdatingProfileImage,
  onBack,
  onSettings,
  onEditName,
  onEditProfileImage,
}: MyPageProfileHeaderProps) {
  const foregroundColor = hasProfileBackground ? '#FFFFFF' : gray[800];

  return (
    <View style={styles.profileCard}>
      {hasProfileBackground && displayProfileImageUri ? (
        <>
          <Image
            source={{ uri: displayProfileImageUri }}
            style={styles.profileBackgroundImage}
            resizeMode="cover"
          />
          <View style={styles.profileBackgroundDim} />
        </>
      ) : null}
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={onBack} hitSlop={8} style={styles.headerLeft}>
            <Icon name="caretLeft" size={24} color={foregroundColor} />
            <Text style={[styles.headerTitle, hasProfileBackground && styles.photoText]}>
              {isFriend ? displayName : '마이페이지'}
            </Text>
          </Pressable>
          {!isFriend && (
            <Pressable onPress={onSettings} hitSlop={8}>
              <Icon name="gearSix" size={24} color={foregroundColor} />
            </Pressable>
          )}
        </View>
      </SafeAreaView>

      <View style={styles.turtleWrap}>
        {!hasProfileBackground && (
          <Image source={TURTLE_IMG} style={styles.turtle} resizeMode="contain" />
        )}
      </View>

      <View style={styles.profileMeta}>
        {isFriend ? (
          <View style={styles.nameRow}>
            <Text style={[styles.nameText, hasProfileBackground && styles.photoText]}>
              {displayName}
            </Text>
          </View>
        ) : (
          <Pressable onPress={onEditName} style={styles.nameRow} hitSlop={8}>
            <Text style={[styles.nameText, hasProfileBackground && styles.photoText]}>
              {displayName}
            </Text>
            <Icon name="pencilSimple" size={16} color={foregroundColor} />
          </Pressable>
        )}

        <View style={styles.chipRow}>
          <View style={styles.chipGroup}>
            <ProfileChip label={`D+${dayCount}`} />
            <ProfileChip label={`달성률 ${String(achievementRate).padStart(2, '0')}%`} />
          </View>
          {!isFriend && (
            <Pressable
              onPress={onEditProfileImage}
              disabled={isUpdatingProfileImage}
              style={[styles.cameraButton, isUpdatingProfileImage && styles.cameraButtonDisabled]}
              hitSlop={8}
            >
              <Icon name="camera" size={20} color={gray[900]} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: brown[100],
    borderBottomLeftRadius: spacing[20],
    borderBottomRightRadius: spacing[20],
    paddingBottom: spacing[16],
    overflow: 'hidden',
  },
  profileBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  profileBackgroundDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
  },
  header: {
    height: 54,
    paddingHorizontal: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  headerTitle: {
    ...typography.accent.title2,
    color: gray[800],
  },
  photoText: {
    color: '#FFFFFF',
  },
  turtleWrap: {
    height: 232,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turtle: {
    width: 174,
    height: 232,
  },
  profileMeta: {
    paddingHorizontal: spacing[16],
    gap: spacing[8],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    alignSelf: 'flex-start',
  },
  nameText: {
    ...typography.accent.h2,
    color: gray[800],
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    height: 36,
    paddingHorizontal: spacing[12],
    backgroundColor: '#FFFFFF',
    borderRadius: radius.full,
  },
  chipText: {
    ...typography.primary.body2B,
    color: green[300],
  },
  cameraButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: gray[100],
    borderRadius: radius.full,
  },
  cameraButtonDisabled: {
    opacity: 0.5,
  },
});
