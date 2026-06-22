import type { ExpoConfig } from 'expo/config';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const appEnv = process.env.APP_ENV === 'production' ? 'production' : 'development';
const isProduction = appEnv === 'production';
const appVersion = process.env.APP_VERSION ?? '1.0.0';
const buildChannel = process.env.APP_BUILD_CHANNEL ?? 'local';
const easProjectId = '0387da46-8602-45c5-b927-229815033a44';
const sentryDsn = isProduction ? process.env.EXPO_PUBLIC_SENTRY_DSN || undefined : undefined;
const sentryUrl = process.env.SENTRY_URL ?? 'https://sentry.io/';
const gitSha =
  process.env.APP_GIT_SHA ??
  (() => {
    try {
      return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return null;
    }
  })();
const iosGoogleServicesFile =
  process.env.GOOGLE_SERVICES_PLIST ?? `./firebase/GoogleService-Info.${appEnv}.plist`;
const androidGoogleServicesFile =
  process.env.GOOGLE_SERVICES_JSON ?? `./firebase/google-services.${appEnv}.json`;
const sentryPlugin: [string, Record<string, string | undefined>] = [
  '@sentry/react-native',
  {
    organization: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    url: sentryUrl,
  },
];

const config: ExpoConfig = {
  name: isProduction ? 'DetoxMate' : 'detox-mate-fe',
  slug: 'detox-mate-fe',
  owner: 'detoxmate',
  scheme: 'detoxmate',
  version: appVersion,
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    url: `https://u.expo.dev/${easProjectId}`,
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
  },
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash_logo.png',
    resizeMode: 'contain',
    backgroundColor: '#1D9E75',
  },
  ios: {
    bundleIdentifier: isProduction ? 'com.detoxmate.app' : 'com.detoxmate.app.dev',
    googleServicesFile: iosGoogleServicesFile,
    supportsTablet: false,
    associatedDomains: ['applinks:detoxmate.airbridge.io'],
    entitlements: {
      'aps-environment': 'production',
      'com.apple.developer.applesignin': ['Default'],
    },
    infoPlist: {
      LSApplicationQueriesSchemes: ['kakaokompassauth', 'storykompassauth', 'kakaolink'],
      ITSAppUsesNonExemptEncryption: false,
      UIBackgroundModes: ['remote-notification'],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#ffffff',
    },
    predictiveBackGestureEnabled: false,
    package: 'com.detoxmate.fe',
    ...(existsSync(androidGoogleServicesFile)
      ? { googleServicesFile: androidGoogleServicesFile }
      : {}),
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    ...(isProduction ? [sentryPlugin] : []),
    [
      'airbridge-expo-sdk',
      {
        appName: 'detoxmate',
        appToken: 'de33f6fd010d4db794542d3a0c05b7a4',
      },
    ],
    [
      'expo-secure-store',
      {
        faceIDPermission: 'Allow $(PRODUCT_NAME) to access your Face ID biometric data.',
      },
    ],
    [
      '@react-native-seoul/kakao-login',
      {
        kakaoAppKey: isProduction ? '505929376ad06505fbd4c9f27529a2b1' : '9fee24e132d201aa33e5fdd08f435726',
      },
    ],
    '@react-native-firebase/app',
    '@react-native-firebase/messaging',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
          forceStaticLinking: ['RNFBApp', 'RNFBMessaging'],
        },
      },
    ],
    'expo-router',
    'expo-apple-authentication',
    'expo-notifications',
    '@react-native-community/datetimepicker',
    'expo-font',
    './plugins/with-sdk55-app-delegate-fixes',
  ],
  extra: {
    appEnv,
    appVersion,
    buildChannel,
    gitSha,
    amplitudeApiKey: process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY,
    ...(sentryDsn ? { sentryDsn } : {}),
    apiBaseUrl: isProduction ? 'https://api.detoxmate.co.kr' : 'https://api-dev.detoxmate.co.kr',
    router: {},
    eas: {
      projectId: easProjectId,
    },
  },
};

export default config;
