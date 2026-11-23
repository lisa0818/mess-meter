import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from './ui';
import { useTheme } from '../theme/ThemeContext';
import {
  COLORS,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
} from '../theme/designSystem';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function DefaultErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const { colors } = useTheme();

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={s.content}>
        <View style={s.iconCircle}>
          <Text style={s.iconEmoji}>⚠️</Text>
        </View>

        <Text style={[s.title, { color: colors.textMain }]}>Something went wrong</Text>
        <Text style={[s.description, { color: colors.textSecondary }]}>
          Mess Meter encountered an unexpected issue. Tap below to refresh and try again.
        </Text>

        {error ? (
          <View style={[s.errorBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
            <Text style={s.errorText} numberOfLines={3}>
              {error.message || String(error)}
            </Text>
          </View>
        ) : null}

        <PrimaryButton
          label="Try Again"
          onPress={onReset}
          style={s.retryButton}
        />
      </View>
    </View>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('ErrorBoundary captured an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error, this.resetError);
      }
      return <DefaultErrorFallback error={this.state.error} onReset={this.resetError} />;
    }

    return this.props.children;
  }
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  iconEmoji: {
    fontSize: 40,
  },
  title: {
    ...TYPOGRAPHY.h2,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  errorBox: {
    width: '100%',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  retryButton: {
    width: '100%',
  },
});
