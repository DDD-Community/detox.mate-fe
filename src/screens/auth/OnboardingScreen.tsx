import { useRouter } from 'expo-router';
import { useState } from 'react';
import { LoggingPage } from '@/components';
import { PermissionGuide } from '../onboarding/PermissionGuide';
import {
  useOnboardingPermission,
  type OnboardingPermission,
} from '../onboarding/useOnboardingPermission';

export default function OnboardingScreen() {
  const [permission, setPermission] = useState<OnboardingPermission>('screen-time');
  const router = useRouter();
  return (
    <PermissionStep
      key={permission}
      permission={permission}
      onGranted={() => {
        if (permission === 'screen-time') setPermission('notifications');
        else router.replace({ pathname: '/(lock)/select-apps', params: { mode: 'onboarding' } });
      }}
    />
  );
}
function PermissionStep({
  permission,
  onGranted,
}: {
  permission: OnboardingPermission;
  onGranted: () => void;
}) {
  const { pending, request } = useOnboardingPermission(permission, onGranted);
  const notification = permission === 'notifications';
  return (
    <LoggingPage
      eventName="Onboarding Viewed"
      properties={{ pageName: 'Onboarding', step: permission }}
    >
      <PermissionGuide
        title={
          notification ? '잠긴 앱을 풀기 위해 꼭 필요해요.' : '스크린타임 관리를 위해 꼭 필요해요.'
        }
        image={
          notification
            ? require('@assets/onboarding/notifications.png')
            : require('@assets/onboarding/screen-time.png')
        }
        notification={notification}
        pending={pending}
        onContinue={request}
      />
    </LoggingPage>
  );
}
