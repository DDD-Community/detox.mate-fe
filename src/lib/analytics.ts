import {
  Identify,
  Types,
  identify,
  init,
  reset,
  setUserId,
  track,
} from '@amplitude/analytics-react-native';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { env } from '@/config/env';

type AnalyticsValue = string | number | boolean | null | undefined;
export type AnalyticsProperties = Record<string, AnalyticsValue>;

const CURRENT_USER_ID_KEY = 'currentUserId';

let initialized = false;

const getBaseProperties = (): AnalyticsProperties => ({
  app_env: env.appEnv,
  app_version: env.appVersion,
  build_channel: env.buildChannel,
  git_sha: env.gitSha,
  platform: Platform.OS,
});

const getSanitizedProperties = (properties: AnalyticsProperties = {}) => {
  const entries = Object.entries(properties).filter(([, value]) => value !== undefined);

  return Object.fromEntries(entries);
};

const getEventProperties = (properties?: AnalyticsProperties) =>
  getSanitizedProperties({
    ...getBaseProperties(),
    ...properties,
  });

export async function initAnalytics(): Promise<void> {
  if (initialized || !env.amplitudeApiKey) return;

  const currentUserId = await SecureStore.getItemAsync(CURRENT_USER_ID_KEY);

  init(env.amplitudeApiKey, currentUserId ?? undefined, {
    logLevel: env.appEnv === 'development' ? Types.LogLevel.Warn : Types.LogLevel.Error,
    minIdLength: 1,
    trackingOptions: {
      ipAddress: false,
      adid: false,
    },
  });

  initialized = true;
}

export function trackEvent(eventName: string, properties?: AnalyticsProperties): void {
  if (!initialized) return;

  track(eventName, getEventProperties(properties));
}

export function trackScreenView(route: string, properties?: AnalyticsProperties): void {
  trackEvent('Screen Viewed', {
    route,
    ...properties,
  });
}

export function identifyUser(userId: string | number, properties?: AnalyticsProperties): void {
  if (!initialized) return;

  setUserId(String(userId));

  if (!properties) return;

  const identifyEvent = new Identify();
  Object.entries(getSanitizedProperties(properties)).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      identifyEvent.set(key, value);
    }
  });
  identify(identifyEvent);
}

export function resetAnalyticsUser(): void {
  if (!initialized) return;

  reset();
}
