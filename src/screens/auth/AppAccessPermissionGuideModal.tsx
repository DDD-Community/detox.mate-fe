import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components';
import { primitiveColors, radius, spacing, typography } from '@/lib/token';

const { brown, gray } = primitiveColors;

interface PermissionItemProps {
  icon: 'imageSquare' | 'bellRinging';
  title: string;
  description: string;
}

interface AppAccessPermissionGuideModalProps {
  visible: boolean;
  onConfirm: () => void;
  confirming?: boolean;
}

function PermissionItem({ icon, title, description }: PermissionItemProps) {
  return (
    <View style={styles.permissionItem}>
      <Icon name={icon} size={24} color={gray[900]} />
      <View style={styles.permissionCopy}>
        <Text style={styles.permissionTitle}>{title}</Text>
        <Text style={styles.permissionDescription}>{description}</Text>
      </View>
    </View>
  );
}

export function AppAccessPermissionGuideModal({
  visible,
  onConfirm,
  confirming,
}: AppAccessPermissionGuideModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onConfirm}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <SafeAreaView edges={['bottom']} style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <View style={styles.grabberWrap}>
              <View style={styles.grabber} />
            </View>

            <View style={styles.content}>
              <View style={styles.topContent}>
                <Text style={styles.title}>앱 접근 권한 안내</Text>

                <View style={styles.permissionBlock}>
                  <View style={styles.permissionCard}>
                    <PermissionItem
                      icon="imageSquare"
                      title="갤러리"
                      description="스크린타임 사진 인증 시 필요해요."
                    />
                    <PermissionItem
                      icon="bellRinging"
                      title="알림"
                      description="팀원 현황, 인증 마감 알림 수신 시 필요해요."
                    />
                  </View>

                  <Text style={styles.note}>
                    허용 상태는 휴대폰 설정 메뉴 &gt; 디톡스메이트 앱 &gt; 디톡스메이트 접근
                    허용에서 권한 설정을 변경할 수 있습니다.
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={onConfirm}
                disabled={confirming}
                style={({ pressed }) => [styles.confirmButton, pressed && styles.confirmPressed]}
              >
                <Text style={styles.confirmText}>확인</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    paddingHorizontal: spacing[8],
    paddingBottom: spacing[8],
  },
  sheet: {
    width: '100%',
    backgroundColor: brown[50],
    borderRadius: 24,
    paddingHorizontal: spacing[20],
    paddingBottom: spacing[20],
    gap: spacing[24],
  },
  grabberWrap: {
    height: 16,
    paddingTop: 5,
    alignItems: 'center',
  },
  grabber: {
    width: 52,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: gray[100],
  },
  content: {
    width: '100%',
    gap: spacing[32],
  },
  topContent: {
    width: '100%',
    gap: spacing[20],
  },
  title: {
    ...typography.accent.h3,
    color: gray[900],
    letterSpacing: -0.52,
  },
  permissionBlock: {
    width: '100%',
    gap: spacing[12],
  },
  permissionCard: {
    width: '100%',
    backgroundColor: gray[50],
    borderRadius: radius[12],
    padding: spacing[20],
    gap: spacing[20],
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  permissionCopy: {
    justifyContent: 'center',
    gap: spacing[4],
  },
  permissionTitle: {
    ...typography.accent.body1,
    color: gray[900],
    letterSpacing: -0.36,
  },
  permissionDescription: {
    ...typography.primary.body3R,
    color: gray[500],
    letterSpacing: -0.24,
  },
  note: {
    ...typography.primary.caption,
    color: gray[400],
    letterSpacing: -0.22,
  },
  confirmButton: {
    width: '100%',
    height: 50,
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: brown[900],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[16],
  },
  confirmPressed: {
    opacity: 0.85,
  },
  confirmText: {
    fontFamily: typography.primary.body1B.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.32,
  },
});
