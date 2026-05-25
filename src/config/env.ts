import Constants from 'expo-constants';

type ExpoExtra = {
  appEnv?: unknown;
  apiBaseUrl?: unknown;
};

const extra = Constants.expoConfig?.extra as ExpoExtra | undefined;
const appEnv = extra?.appEnv;
const apiBaseUrl = extra?.apiBaseUrl;

if (appEnv !== 'development' && appEnv !== 'production') {
  throw new Error('Missing Expo config value: extra.appEnv');
}

if (typeof apiBaseUrl !== 'string' || apiBaseUrl.length === 0) {
  throw new Error('Missing Expo config value: extra.apiBaseUrl');
}

export const env = {
  appEnv,
  apiBaseUrl,
} as const;
