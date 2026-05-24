import type { ExpoConfig } from 'expo/config';

const appEnv = process.env.APP_ENV === 'production' ? 'production' : 'development';
const isProduction = appEnv === 'production';
const appVersion = isProduction ? (process.env.APP_VERSION ?? '1.0.0') : '1.0.0';
const iosGoogleServicesFile =
  process.env.GOOGLE_SERVICES_PLIST ?? `./firebase/GoogleService-Info.${appEnv}.plist`;
const androidGoogleServicesFile =
  process.env.GOOGLE_SERVICES_JSON ?? `./firebase/google-services.${appEnv}.json`;

const config: ExpoConfig = {
  name: isProduction ? 'DetoxMate' : 'detox-mate-fe',
  slug: 'detox-mate-fe',
  owner: 'detoxmate',
  scheme: 'detoxmate',
  version: appVersion,
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    bundleIdentifier: isProduction ? 'com.detoxmate.app' : 'com.detoxmate.app.dev',
    googleServicesFile: iosGoogleServicesFile,
    entitlements: {
      'aps-environment': 'production',
    },
    infoPlist: {
      LSApplicationQueriesSchemes: ['kakaokompassauth', 'storykompassauth', 'kakaolink'],
      ITSAppUsesNonExemptEncryption: false,
      UIBackgroundModes: ['remote-notification'],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    predictiveBackGestureEnabled: false,
    package: 'com.detoxmate.fe',
    googleServicesFile: androidGoogleServicesFile,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    [
      'expo-secure-store',
      {
        faceIDPermission: 'Allow $(PRODUCT_NAME) to access your Face ID biometric data.',
      },
    ],
    [
      '@react-native-seoul/kakao-login',
      {
        kakaoAppKey: '9fee24e132d201aa33e5fdd08f435726',
      },
    ],
    '@react-native-firebase/app',
    '@react-native-firebase/messaging',
    'expo-router',
    'expo-notifications',
    '@react-native-community/datetimepicker',
    'expo-font',
    './plugins/with-sdk55-app-delegate-fixes',
  ],
  extra: {
    appEnv,
    apiBaseUrl: isProduction ? 'https://api.detoxmate.co.kr' : 'https://api-dev.detoxmate.co.kr',
    router: {},
    eas: {
      projectId: '0387da46-8602-45c5-b927-229815033a44',
    },
  },
};

export default config;
