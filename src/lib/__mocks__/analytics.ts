import { vi } from 'vitest';
import type * as Analytics from '../analytics';

export const trackEvent = vi.fn<typeof Analytics.trackEvent>();
export const trackButtonClick = vi.fn<typeof Analytics.trackButtonClick>();
export const setAnalyticsUserId = vi.fn<typeof Analytics.setAnalyticsUserId>();
