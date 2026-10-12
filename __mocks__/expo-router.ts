import { vi } from 'vitest';
import type * as ExpoRouter from 'expo-router';

export const router = {
  back: vi.fn<typeof ExpoRouter.router.back>(),
  canGoBack: vi.fn<typeof ExpoRouter.router.canGoBack>(),
  replace: vi.fn<typeof ExpoRouter.router.replace>(),
};
export const useRouter = () => router;
export const useLocalSearchParams = vi.fn<() => Record<string, string | string[]>>(() => ({}));
export const useFocusEffect = vi.fn<typeof ExpoRouter.useFocusEffect>();
