import * as Sentry from '@sentry/react-native';

import type { ErrorLogContext } from '@/api/errors/logger';
import type { AppError } from '@/api/errors/types';
import { env } from '@/config/env';

const ALWAYS_REPORTABLE_SCOPES = new Set(['render', 'auth.refresh']);

const BLOCKING_FLOW_SCOPES = new Set([
  'app.bootstrap',
  'group.home',
  'feed.home',
  'goal.setup',
  'verify.upload',
]);

const SENSITIVE_CONTEXT_KEYS = new Set([
  'accessToken',
  'refreshToken',
  'token',
  'authorization',
  'cookie',
  'password',
  'requestBody',
  'body',
  'providerAccessToken',
  'identityToken',
  'authorizationCode',
  'inviteCode',
  'commentBody',
]);

let initialized = false;

const hasSentryDsn = () => Boolean(env.sentryDsn);

const sanitizeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sanitizeValue);

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
      key,
      SENSITIVE_CONTEXT_KEYS.has(key) ? '[Filtered]' : sanitizeValue(nestedValue),
    ])
  );
};

const scrubEvent = (event: Sentry.ErrorEvent): Sentry.ErrorEvent => {
  if (event.request) {
    event.request = {
      ...event.request,
      cookies: undefined,
      data: undefined,
      headers: undefined,
      query_string: undefined,
    };
  }

  if (event.contexts) {
    event.contexts = sanitizeValue(event.contexts) as typeof event.contexts;
  }

  if (event.extra) {
    event.extra = sanitizeValue(event.extra) as typeof event.extra;
  }

  return event;
};

const toSentryContext = (error: AppError, context?: ErrorLogContext) => ({
  ...context,
  type: error.type,
  status: context?.status ?? error.status,
  code: context?.code ?? error.code,
  message: error.message,
});

export function initSentry() {
  if (initialized || !hasSentryDsn()) return;

  Sentry.init({
    dsn: env.sentryDsn!,
    environment: env.appEnv,
    release: `detox-mate-fe@${env.appVersion}`,
    dist: env.gitSha ?? env.buildChannel,
    sendDefaultPii: false,
    enableAutoSessionTracking: true,
    tracesSampleRate: 0,
    beforeSend: scrubEvent,
  });

  Sentry.setTag('app_env', env.appEnv);
  Sentry.setTag('build_channel', env.buildChannel);
  if (env.gitSha) {
    Sentry.setTag('git_sha', env.gitSha);
  }

  initialized = true;
}

const shouldCapture = (error: AppError, context?: ErrorLogContext) => {
  if (!hasSentryDsn()) return false;
  if (context?.scope && ALWAYS_REPORTABLE_SCOPES.has(context.scope)) return true;
  if (context?.scope && BLOCKING_FLOW_SCOPES.has(context.scope)) {
    return (
      error.type === 'network' ||
      error.type === 'timeout' ||
      error.type === 'auth' ||
      error.type === 'server' ||
      error.type === 'upload' ||
      error.type === 'permission' ||
      error.type === 'unknown'
    );
  }
  if (context?.scope === 'auth.login') {
    return error.type === 'auth' || error.type === 'server' || error.type === 'unknown';
  }
  if (context?.scope === 'verify.retro') {
    return error.type === 'upload' || error.type === 'server' || error.type === 'unknown';
  }
  if (
    context?.scope === 'feed.comment' ||
    context?.scope === 'notification.list' ||
    context?.scope === 'notification.navigation' ||
    context?.scope === 'notification.push'
  ) {
    return error.type === 'server' || error.type === 'unknown' || error.type === 'permission';
  }
  if (context?.scope === 'feed' || context?.scope?.startsWith('group.')) {
    return error.type === 'server' || error.type === 'unknown';
  }
  return false;
};

const getReportableError = (error: AppError, context?: ErrorLogContext) => {
  if (context?.scope === 'render' && error.originalError instanceof Error) {
    return error.originalError;
  }

  const reportableError = new Error(error.message);
  reportableError.name = `AppError.${error.type}`;
  return reportableError;
};

export function captureObservedError(error: AppError, context?: ErrorLogContext) {
  initSentry();

  if (!shouldCapture(error, context)) return;

  const sanitizedContext = toSentryContext(error, context);

  Sentry.withScope((scope) => {
    scope.setTag('error_type', error.type);
    if (error.status) scope.setTag('status', String(error.status));
    if (error.code) scope.setTag('code', error.code);
    if (context?.scope) scope.setTag('scope', context.scope);
    if (context?.operation) scope.setTag('operation', context.operation);
    if (context?.method) scope.setTag('method', context.method);

    scope.setContext('app_error', sanitizeValue(sanitizedContext) as Record<string, unknown>);
    Sentry.captureException(getReportableError(error, context));
  });
}
