import Constants from 'expo-constants';

type ExpoExtra = {
  apiBaseUrl?: unknown;
};

const extra = Constants.expoConfig?.extra as ExpoExtra | undefined;
const apiBaseUrl = extra?.apiBaseUrl;

if (typeof apiBaseUrl !== 'string' || apiBaseUrl.length === 0) {
  throw new Error('Missing Expo config value: extra.apiBaseUrl');
}

export const env = {
  apiBaseUrl,
} as const;
