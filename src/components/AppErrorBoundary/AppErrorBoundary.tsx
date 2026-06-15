import { router } from 'expo-router';
import { Component, ReactNode, useState, type ErrorInfo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { logError, normalizeError } from '@/api/errors';
import { primitiveColors, radius, spacing, typography } from '@/lib/token';

type ErrorBoundaryProps = {
  children: ReactNode;
  onReset: () => void;
};

type ErrorBoundaryState = {
  error: Error | null;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(normalizeError(error), {
      scope: 'render',
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({ error: null });
    this.props.onReset();
  };

  handleGoHome = () => {
    this.handleRetry();
    router.replace('/');
  };

  render() {
    if (!this.state.error) return this.props.children;

    return <FallbackScreen onRetry={this.handleRetry} onGoHome={this.handleGoHome} />;
  }
}

type FallbackScreenProps = {
  onRetry: () => void;
  onGoHome: () => void;
};

function FallbackScreen({ onRetry, onGoHome }: FallbackScreenProps) {
  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.title}>화면을 불러오지 못했어요</Text>
        <Text style={styles.description}>잠시 후 다시 시도해 주세요.</Text>
      </View>
      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.secondaryButton]} onPress={onGoHome}>
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>홈으로 이동</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.primaryButton]} onPress={onRetry}>
          <Text style={[styles.buttonText, styles.primaryButtonText]}>다시 시도</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  const [boundaryKey, setBoundaryKey] = useState(0);

  return (
    <ErrorBoundary key={boundaryKey} onReset={() => setBoundaryKey((current) => current + 1)}>
      {children}
    </ErrorBoundary>
  );
}

const { brown, gray } = primitiveColors;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brown[50],
    justifyContent: 'center',
    paddingHorizontal: spacing[24],
  },
  content: {
    gap: spacing[8],
  },
  title: {
    ...typography.accent.h3,
    color: gray[900],
    textAlign: 'center',
  },
  description: {
    ...typography.primary.body2R,
    color: gray[600],
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[8],
    marginTop: spacing[32],
  },
  button: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius[8],
  },
  primaryButton: {
    backgroundColor: brown[900],
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: gray[200],
  },
  buttonText: {
    ...typography.primary.body2B,
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: gray[800],
  },
});
