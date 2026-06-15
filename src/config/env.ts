import Constants from 'expo-constants';

type ExpoExtra = {
  appEnv?: unknown;
  appVersion?: unknown;
  buildChannel?: unknown;
  gitSha?: unknown;
  sentryDsn?: unknown;
  apiBaseUrl?: unknown;
  amplitudeApiKey?: unknown;
};

const extra = Constants.expoConfig?.extra as ExpoExtra | undefined;
const appEnv = extra?.appEnv;
const appVersion = extra?.appVersion;
const buildChannel = extra?.buildChannel;
const gitSha = extra?.gitSha;
const sentryDsn = extra?.sentryDsn;
const apiBaseUrl = extra?.apiBaseUrl;
const amplitudeApiKey = extra?.amplitudeApiKey;

if (appEnv !== 'development' && appEnv !== 'production') {
  throw new Error('Missing Expo config value: extra.appEnv');
}

if (typeof appVersion !== 'string' || appVersion.length === 0) {
  throw new Error('Missing Expo config value: extra.appVersion');
}

if (buildChannel !== 'local' && buildChannel !== 'testflight' && buildChannel !== 'production') {
  throw new Error('Missing Expo config value: extra.buildChannel');
}

if (gitSha !== null && gitSha !== undefined && typeof gitSha !== 'string') {
  throw new Error('Invalid Expo config value: extra.gitSha');
}

if (sentryDsn !== null && sentryDsn !== undefined && typeof sentryDsn !== 'string') {
  throw new Error('Invalid Expo config value: extra.sentryDsn');
}

if (typeof apiBaseUrl !== 'string' || apiBaseUrl.length === 0) {
  throw new Error('Missing Expo config value: extra.apiBaseUrl');
}

if (
  amplitudeApiKey !== null &&
  amplitudeApiKey !== undefined &&
  typeof amplitudeApiKey !== 'string'
) {
  throw new Error('Invalid Expo config value: extra.amplitudeApiKey');
}

export const env = {
  appEnv,
  appVersion,
  buildChannel,
  gitSha: gitSha ?? null,
  sentryDsn: sentryDsn ?? null,
  apiBaseUrl,
  amplitudeApiKey: amplitudeApiKey && amplitudeApiKey.length > 0 ? amplitudeApiKey : null,
} as const;
