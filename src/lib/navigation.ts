import { router } from 'expo-router';

type RouterReplaceTarget = Parameters<typeof router.replace>[0];

export function goBackOrReplace(fallback: RouterReplaceTarget) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback);
}

export function getVerifyExitRoute(verifyRoot?: string): RouterReplaceTarget {
  return verifyRoot === 'feed' ? '/(feed)/home' : '/(group)/home';
}
