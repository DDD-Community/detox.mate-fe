import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';

import {
  trackScreenView,
  type AnalyticsEventName,
  type AnalyticsProperties,
} from '../../lib/analytics';

type LoggingPageProperties = AnalyticsProperties & {
  pageName: string;
};

interface LoggingPageProps {
  eventName: AnalyticsEventName;
  properties: LoggingPageProperties;
  enabled?: boolean;
  logKey?: string | number | boolean | null;
  children: ReactNode;
}

export function LoggingPage({
  eventName,
  properties,
  enabled = true,
  logKey = null,
  children,
}: LoggingPageProps) {
  const latestLoggingRef = useRef({ eventName, properties, enabled });
  const focusedRef = useRef(false);
  const previousEnabledRef = useRef(enabled);
  const previousLogKeyRef = useRef(logKey);

  const trackCurrentScreenView = useCallback(() => {
    const current = latestLoggingRef.current;
    if (!current.enabled) return;

    const { pageName, ...eventProperties } = current.properties;

    trackScreenView(current.eventName, pageName, eventProperties);
  }, []);

  useEffect(() => {
    latestLoggingRef.current = { eventName, properties, enabled };

    if (!previousEnabledRef.current && enabled && focusedRef.current) {
      trackCurrentScreenView();
    } else if (previousLogKeyRef.current !== logKey && enabled && focusedRef.current) {
      trackCurrentScreenView();
    }

    previousEnabledRef.current = enabled;
    previousLogKeyRef.current = logKey;
  }, [enabled, eventName, logKey, properties, trackCurrentScreenView]);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      trackCurrentScreenView();

      return () => {
        focusedRef.current = false;
      };
    }, [trackCurrentScreenView])
  );

  return <>{children}</>;
}
