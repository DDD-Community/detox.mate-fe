import {
  Identify,
  identify as amplitudeIdentify,
  init,
  setUserId,
  track,
  Types,
} from '@amplitude/analytics-react-native';
import { env } from '@/config/env';

export const ANALYTICS_EVENT_NAMES = [
  'Splash Viewed',
  'Onboarding Viewed',
  'Terms Agreement Viewed',
  'Login Viewed',
  'App Access Permission Guide Modal Viewed',
  'Group Home Viewed',
  'Group Create Viewed',
  'Group Join Viewed',
  'Feed Home Viewed',
  'Calendar Viewed',
  'Calendar History Viewed',
  'Feed Post Detail Viewed',
  'Notification List Viewed',
  'My Page Viewed',
  'Settings Viewed',
  'Group Info Viewed',
  'Edit Nickname Viewed',
  'Goal Setup Viewed',
  'Post Feed Viewed',
  'Verify How To Viewed',
  'Verify Method Viewed',
  'Verify Upload Viewed',
  'Verify Done Viewed',
  'Verify Error Viewed',
  'Verify Wrong Time Viewed',
  'Retro Viewed',
  'Verify Complete Viewed',
  'Onboarding Previous Clicked',
  'Onboarding Next Clicked',
  'Onboarding Start Clicked',
  'Terms Agreement Agree All Clicked',
  'Terms Agreement Privacy Agree Toggle Clicked',
  'Terms Agreement Terms Agree Toggle Clicked',
  'Terms Agreement Privacy Open Clicked',
  'Terms Agreement Terms Open Clicked',
  'Terms Agreement Confirm Clicked',
  'Login Test Key Login Open Clicked',
  'Login Test Id Login Open Clicked',
  'App Access Permission Guide Modal Confirm Clicked',
  'Group Home Mypage Open Clicked',
  'Group Home Group Create Start Clicked',
  'Group Home Group Join Start Clicked',
  'Group Create Previous Clicked',
  'Group Create Invite Code Copy Clicked',
  'Group Create Go Feed Clicked',
  'Group Join Previous Clicked',
  'Group Join Invite Code Copy Clicked',
  'Group Join Go Feed Clicked',
  'Feed Home Notification Open Clicked',
  'Feed Home Calendar Open Clicked',
  'Feed Home Mypage Open Clicked',
  'Feed Home Goal Setup Start Clicked',
  'Feed Home Daily Verification Start Clicked',
  'Feed Home Member Avatar Press Clicked',
  'Feed Home Feed Card Open Clicked',
  'Feed Home Feed Card Profile Open Clicked',
  'Feed Home Poke Clicked',
  'Feed Home Reaction Picker Open Clicked',
  'Feed Home Reaction Select Clicked',
  'Feed Post Detail Back Clicked',
  'Feed Post Detail Profile Open Clicked',
  'Feed Post Detail Poke Clicked',
  'Feed Post Detail Reaction User Profile Open Clicked',
  'Feed Post Detail Poke User Profile Open Clicked',
  'Feed Post Detail Comment Submit Clicked',
  'Feed Post Detail Reaction Picker Open Clicked',
  'Feed Post Detail Reaction Select Clicked',
  'Calendar Back Clicked',
  'Calendar Streak Info Open Clicked',
  'Calendar Previous Month Clicked',
  'Calendar Next Month Clicked',
  'Calendar Date Select Clicked',
  'Calendar History Back Clicked',
  'Calendar History Previous Date Clicked',
  'Calendar History Next Date Clicked',
  'Calendar History Feed Card Open Clicked',
  'Calendar History Feed Card Profile Open Clicked',
  'Notification List Close Clicked',
  'Notification List Notification Item Open Clicked',
  'My Page Back Clicked',
  'My Page Home Open Clicked',
  'My Page Settings Open Clicked',
  'My Page Nickname Edit Open Clicked',
  'My Page Profile Image Edit Open Clicked',
  'My Page Poke Clicked',
  'My Page Goal Setup Start Clicked',
  'My Page Group Create Start Clicked',
  'My Page Group Join Start Clicked',
  'My Page Group Info Open Clicked',
  'My Page Goal Time Edit Open Clicked',
  'Profile Image Bottom Sheet Profile Image Default Select Clicked',
  'Profile Image Bottom Sheet Profile Image Gallery Select Clicked',
  'Settings Back Clicked',
  'Settings Contact Open Clicked',
  'Settings Terms Open Clicked',
  'Settings Privacy Open Clicked',
  'Settings Logout Alert Open Clicked',
  'Settings Withdraw Alert Open Clicked',
  'Notification Permission Alert App Settings Open Clicked',
  'Notification Permission Alert Cancel Clicked',
  'Logout Confirm Alert Cancel Clicked',
  'Logout Confirm Alert Logout Confirm Clicked',
  'Withdraw Confirm Alert Cancel Clicked',
  'Withdraw Confirm Alert Withdraw Confirm Clicked',
  'Group Info Back Clicked',
  'Group Info Invite Code Copy Clicked',
  'Group Info Member Profile Open Clicked',
  'Group Info Leave Group Alert Open Clicked',
  'Leave Group Alert Cancel Clicked',
  'Leave Group Alert Leave Group Confirm Clicked',
  'Edit Nickname Back Clicked',
  'Edit Nickname Nickname Submit Clicked',
  'Goal Setup Back Clicked',
  'Verify How To Dismiss Clicked',
  'Verify How To Hide Forever Clicked',
  'Verify How To Confirm Clicked',
  'Verify Method Gallery Open Clicked',
  'Verify Method Screen Time Settings Open Clicked',
  'Verify Upload Screenshot Upload Select Clicked',
  'Verify Upload Screenshot Scan Start Clicked',
  'Verify Done Goal Setup Start After Scan Clicked',
  'Verify Done Verification Skip Post Clicked',
  'Verify Done Post Feed Start Clicked',
  'Verify Done Retro Start Clicked',
  'Verify Done Wrong Time Report Start Clicked',
  'Verify Error Retake Screenshot Clicked',
  'Verify Wrong Time Close Clicked',
  'Verify Wrong Time Confirm Clicked',
  'Post Feed Back Clicked',
  'Post Feed Skip Clicked',
  'Post Feed Photo Upload Select Clicked',
  'Post Feed Post Submit Clicked',
  'Retro Back Clicked',
  'Retro Photo Upload Select Clicked',
  'Retro Retro Submit Clicked',
  'Verify Complete Go Home Clicked',
  'App Opened',
  'Login Completed',
  'Group Created',
  'Group Joined',
  'Invite Share Button Clicked',
  'Goal Time Set',
  'Verification Completed',
  'Push Notification Setting Updated',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export type AnalyticsPropertyValue = string | number | boolean | null | undefined;
export type AnalyticsProperties = Record<string, AnalyticsPropertyValue>;

export type AnalyticsDebugEvent = {
  eventName: AnalyticsEventName;
  properties: AnalyticsProperties;
};

export type AnalyticsGroupRole = 'OWNER' | 'MEMBER';

export type AnalyticsUserProperties = {
  group_role?: AnalyticsGroupRole | null;
  push_notification_enabled?: boolean | null;
};

let initialized = false;
const debugEvents: AnalyticsDebugEvent[] = [];

function logAnalyticsDebug(action: string, payload: AnalyticsProperties = {}) {
  if (env.appEnv !== 'development') return;

  // eslint-disable-next-line no-console
  console.info(`[Amplitude] ${action}`, payload);
}

export function initAnalytics() {
  if (initialized) return;

  init(env.amplitudeApiKey, undefined, {
    logLevel: env.appEnv === 'development' ? Types.LogLevel.Debug : Types.LogLevel.Warn,
  });

  logAnalyticsDebug('init', {
    has_api_key: env.amplitudeApiKey.length > 0,
  });

  initialized = true;
}

export function setAnalyticsUserId(userId: number | string) {
  const rawUserId = String(userId);
  const analyticsUserId = rawUserId.startsWith('user_') ? rawUserId : `user_${rawUserId}`;

  setUserId(analyticsUserId);
  logAnalyticsDebug('setUserId', {
    user_id: analyticsUserId,
  });
}

export function setAnalyticsUserProperties(properties: AnalyticsUserProperties) {
  const identify = new Identify();
  let hasProperty = false;

  Object.entries(properties).forEach(([key, value]) => {
    if (value == null) return;

    identify.set(key, value);
    hasProperty = true;
  });

  if (!hasProperty) return;

  amplitudeIdentify(identify);
  logAnalyticsDebug('identify', properties);
}

export function setAnalyticsGroupRole(role: string | null | undefined) {
  if (role !== 'OWNER' && role !== 'MEMBER') return;

  setAnalyticsUserProperties({ group_role: role });
}

function syncUserPropertiesFromEvent(eventName: AnalyticsEventName) {
  if (eventName === 'Group Created') {
    setAnalyticsGroupRole('OWNER');
    return;
  }

  if (eventName === 'Group Joined') {
    setAnalyticsGroupRole('MEMBER');
  }
}

export function trackEvent(eventName: AnalyticsEventName, properties: AnalyticsProperties = {}) {
  syncUserPropertiesFromEvent(eventName);

  const eventProperties = { ...properties };

  debugEvents.push({
    eventName,
    properties: eventProperties,
  });

  track(eventName, eventProperties);
  logAnalyticsDebug('track', {
    event_name: eventName,
    ...eventProperties,
  });
}

export function trackScreenView(
  eventName: AnalyticsEventName,
  pageName: string,
  properties: AnalyticsProperties = {}
) {
  trackEvent(eventName, {
    ...properties,
    event_type: 'screen_view',
    page_name: pageName,
  });
}

export function getAnalyticsDebugEvents() {
  return debugEvents.map((event) => ({
    ...event,
    properties: { ...event.properties },
  }));
}

export function clearAnalyticsDebugEvents() {
  debugEvents.length = 0;
}

export function trackButtonClick(
  eventName: AnalyticsEventName,
  pageName: string,
  buttonName: string,
  properties: AnalyticsProperties = {}
) {
  trackEvent(eventName, {
    ...properties,
    event_type: 'button_click',
    page_name: pageName,
    button_name: buttonName,
  });
}
