import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { Suspense, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { getUserErrorMessage, normalizeError } from '../../../api/errors';
import { ErrorBoundary } from '../../../components/AppErrorBoundary/AppErrorBoundary';
import { fontFamily } from '../../../lib/token/primitive/fonts';

export function FriendsQueryFeedback({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <View
      style={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}
      accessibilityLiveRegion="polite"
    >
      <Text style={{ color: '#9d4e4e', fontFamily: fontFamily.primary.regular }}>
        {getUserErrorMessage(normalizeError(error))}
      </Text>
      <Pressable accessibilityRole="button" onPress={onRetry}>
        <Text style={{ color: '#5a8974', fontFamily: fontFamily.primary.bold }}>다시 시도</Text>
      </Pressable>
    </View>
  );
}

export function FriendsQuerySection({ children, label }: { children: ReactNode; label: string }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallback={(error, onRetry) => (
            <View style={{ marginTop: 23 }}>
              <Text style={{ fontFamily: fontFamily.primary.medium, marginHorizontal: 16 }}>
                {label}
              </Text>
              <FriendsQueryFeedback error={error} onRetry={onRetry} />
            </View>
          )}
        >
          <Suspense
            fallback={
              <ActivityIndicator
                color="#5a8974"
                style={{ padding: 24 }}
                accessibilityLabel={`${label} 불러오는 중`}
              />
            }
          >
            {children}
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
