import { vi } from 'vitest';
import type * as AppleAuthentication from 'expo-apple-authentication';

export const isAvailableAsync = vi.fn<typeof AppleAuthentication.isAvailableAsync>();
export const signInAsync = vi.fn<typeof AppleAuthentication.signInAsync>();
export const AppleAuthenticationScope = { FULL_NAME: 0, EMAIL: 1 } as const;
