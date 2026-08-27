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
const iosBundleIdentifier = isProduction ? 'com.detoxmate.app' : 'com.detoxmate.app.dev';
// AASA/IPA에 공개되는 값이라 시크릿으로 숨기지 않는다(commit e5754b4의 Directive).
// @bacons/apple-targets가 익스텐션 타겟의 DEVELOPMENT_TEAM을 채우는 데 ios.appleTeamId를 요구한다.
const appleTeamId = '6G3B344SZD';
// 앱 잠금(Screen Time)용 App Group. 메인 앱과 iOS 익스텐션 3개
// (ActivityMonitorExtension / ShieldAction / ShieldConfiguration)가
// UserDefaults를 공유하는 컨테이너 이름이며, 양쪽이 동일해야 통신이 된다.
// dev/prod 데이터가 섞이지 않도록 번들ID를 따라 분기한다.
const deviceActivityAppGroup = `group.${iosBundleIdentifier}`;
const sentryPlugin: [string, Record<string, string | undefined>] = [
  '@sentry/react-native',
  {
    organization: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    url: sentryUrl,
  },
];

const deviceActivityPlugin: [string, Record<string, string>] = [
  'react-native-device-activity',
  {
    appleTeamId,
    appGroup: deviceActivityAppGroup,
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
    imageWidth: 152,
  },
  ios: {
    bundleIdentifier: iosBundleIdentifier,
    appleTeamId,
    googleServicesFile: iosGoogleServicesFile,
    supportsTablet: false,
    associatedDomains: ['applinks:detoxmate.airbridge.io'],
    entitlements: {
      'aps-environment': 'production',
      'com.apple.developer.applesignin': ['Default'],
      // 앱 잠금(Screen Time API). 이 선언이 빠지면 EAS가 빌드/credentials 실행 시
      // App ID의 FAMILY_CONTROLS capability를 지우고, 프로비저닝 프로파일에서도 빠진다.
      // 한 번 지워지면 App Store Connect API로는 되살릴 수 없어 포털 수동 작업이 필요하다.
      // 운영 App ID(com.detoxmate.app)는 아직 엔타이틀먼트 미승인이라 dev에만 켠다.
      ...(isProduction ? {} : { 'com.apple.developer.family-controls': true }),
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
        kakaoAppKey: isProduction
          ? '505929376ad06505fbd4c9f27529a2b1'
          : '9fee24e132d201aa33e5fdd08f435726',
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
          // Screen Time API(FamilyControls/DeviceActivity)는 iOS 15+ 필요.
          // RN 0.83의 기본 최소 버전과 동일해 현재는 명시적 하한선 문서화 역할.
          deploymentTarget: '15.1',
        },
      },
    ],
    'expo-router',
    'expo-apple-authentication',
    'expo-notifications',
    '@react-native-community/datetimepicker',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/splash_logo.png',
        resizeMode: 'contain',
        backgroundColor: '#1D9E75',
        imageWidth: 152,
      },
    ],
    './plugins/with-sdk55-app-delegate-fixes',
    // 이 플러그인은 메인 앱 entitlements에 family-controls를 조건 없이 켠다.
    // 운영 App ID(com.detoxmate.app)는 아직 엔타이틀먼트 미승인이라,
    // ios.entitlements의 dev 한정 분기와 어긋나지 않도록 플러그인 자체를 dev에서만 등록한다.
    ...(isProduction ? [] : [deviceActivityPlugin]),
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
