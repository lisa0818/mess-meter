import NetInfo from '@react-native-community/netinfo';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Platform,
  StyleSheet,
  ToastAndroid,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AuthProvider, useAuth } from '../lib/auth';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { setupReminders, useNotificationTap } from '../lib/notifications';
import { hasCompletedOnboarding } from '../lib/onboarding';
import { flushQueue } from '../lib/ratings';
import { supabase } from '../lib/supabase';
import { COLORS } from '../theme/designSystem';
import { todayStr } from '../lib/utils';

function Gate() {
  const { session, hostelId, loading } = useAuth();
  const { isDark, colors } = useTheme();
  const rootNavigationState = useRootNavigationState();
  const segments = useSegments();
  const router = useRouter();
  const lastResponse = useNotificationTap();
  const handled = useRef<string | null>(null);
  const uid = session?.user.id;

  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [seenOnboarding, setSeenOnboarding] = useState(false);

  useEffect(() => {
    hasCompletedOnboarding().then((done) => {
      setSeenOnboarding(done);
      setOnboardingChecked(true);
    });

    const sub = DeviceEventEmitter.addListener('onboarding-completed', () => {
      setSeenOnboarding(true);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    // Ensure the root navigation container is mounted and hydrated before redirecting
    if (!rootNavigationState?.key || loading || !onboardingChecked) return;

    const seg = segments[0] as string | undefined;
    let target: string | null = null;

    if (!seenOnboarding) {
      if (seg !== 'onboarding') {
        target = '/onboarding';
      }
    } else if (seg === 'onboarding') {
      // If user is currently on onboarding, allow onboarding.tsx to handle its own navigation
      return;
    } else if (!session) {
      if (seg !== 'login') {
        target = '/login';
      }
    } else if (!hostelId) {
      if (seg !== 'join') {
        target = '/join';
      }
    } else if (seg === 'login' || seg === 'join') {
      target = '/';
    }

    if (target) {
      const timer = setTimeout(() => {
        router.replace(target as any);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [rootNavigationState?.key, session, hostelId, loading, onboardingChecked, seenOnboarding, segments]);

  useEffect(() => {
    if (uid && hostelId) setupReminders().catch(() => {});
  }, [uid, hostelId]);

  useEffect(() => {
    if (!uid) return;
    const run = async () => {
      const n = await flushQueue(uid);
      if (n > 0) {
        if (Platform.OS === 'android') {
          ToastAndroid.show(`Synced ${n} offline rating${n > 1 ? 's' : ''} ✅`, ToastAndroid.SHORT);
        }
        DeviceEventEmitter.emit('ratings-synced');
      }
    };
    run();
    const unsub = NetInfo.addEventListener((s) => {
      if (s.isConnected) run();
    });
    return unsub;
  }, [uid]);

  useEffect(() => {
    if (!uid || !hostelId || !lastResponse) return;
    const n = lastResponse.notification;
    const key = n.request.identifier + n.date;
    if (handled.current === key) return;
    handled.current = key;

    const type = n.request.content.data?.meal as string | undefined;
    if (!type) return;

    (async () => {
      const { data: meal } = await supabase
        .from('meals')
        .select('id, meal_type')
        .eq('meal_date', todayStr())
        .eq('meal_type', type)
        .maybeSingle();
      if (!meal) return;
      const { data: done } = await supabase
        .from('ratings').select('id').eq('meal_id', meal.id).maybeSingle();
      if (done) return;
      router.push({ pathname: '/rate', params: { mealId: meal.id, mealType: meal.meal_type } });
    })();
  }, [lastResponse, uid, hostelId]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
      {(loading || !onboardingChecked) && (
        <View style={[s.overlay, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <AuthProvider>
            <Gate />
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
