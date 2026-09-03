import { usePathname, useRouter } from 'expo-router';

import { BottomTabBar, type BottomTabItem } from '../components/BottomTabBar';

const TABS: BottomTabItem[] = [
  { key: 'feed', label: '피드', icon: 'house' },
  { key: 'lock', label: '제한 앱', icon: 'squaresFour' },
  { key: 'mypage', label: '마이페이지', icon: 'user' },
];

const TAB_ROUTES: Record<string, string> = {
  feed: '/(feed)/home',
  lock: '/(lock)/restricted-apps',
  mypage: '/(group)/mypage',
};

// usePathname()은 라우트 그룹 세그먼트(괄호)를 제거한 실제 URL 경로를 돌려준다.
// 예: (feed)/home.tsx, (group)/home.tsx 둘 다 pathname은 "/home"으로 동일하게 관찰된다.
const ACTIVE_KEY_BY_PATHNAME: Record<string, string> = {
  '/home': 'feed',
  '/restricted-apps': 'lock',
  '/mypage': 'mypage',
};

export function RootTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const activeKey = ACTIVE_KEY_BY_PATHNAME[pathname];

  if (!activeKey) return null;

  return (
    <BottomTabBar
      tabs={TABS}
      activeKey={activeKey}
      onTabPress={(key) => {
        if (key === activeKey) return;
        router.replace(TAB_ROUTES[key] as Parameters<typeof router.replace>[0]);
      }}
    />
  );
}
