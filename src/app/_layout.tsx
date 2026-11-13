import NetInfo from '@react-native-community/netinfo';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Platform,
  StyleSheet,
  ToastAndroid,
  View,
} from 'react-native';
import { AuthProvider, useAuth } from '../lib/auth';
import { setupReminders, useNotificationTap } from '../lib/notifications';
import { flushQueue } from '../lib/ratings';
import { supabase } from '../lib/supabase';
import {
  COLORS,
} from '../theme/designSystem';
import { todayStr } from '../lib/utils';

function Gate() {
  const { session, hostelId, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const lastResponse = useNotificationTap();
  const handled = useRef<string | null>(null);
  const uid = session?.user.id;

  useEffect(() => {
    if (loading) return;
    const seg = segments[0] as string | undefined;
    if (!session) {
      if (seg !== 'login') router.replace('/login');
    } else if (!hostelId) {
      if (seg !== 'join') router.replace('/join');
    } else if (seg === 'login' || seg === 'join') {
      router.replace('/');
    }
  }, [session, hostelId, loading, segments]);

  useEffect(() => {
    if (uid && hostelId) setupReminders().catch(() => {});
  }, [uid, hostelId]);

  useEffect(() => {
    if (!uid) return;
    const run = async () => {
      const n = await flushQueue(uid);
      if (n > 0) {
        if (Platform.OS === 'android') {
          ToastAndroid.show(
            `Synced ${n} offline rating${n > 1 ? 's' : ''} ✅`,
            ToastAndroid.SHORT
          );
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
        .from('ratings')
        .select('id')
        .eq('meal_id', meal.id)
        .maybeSingle();
      if (done) return;
      router.push({
        pathname: '/rate',
        params: { mealId: meal.id, mealType: meal.meal_type },
      });
    })();
  }, [lastResponse, uid, hostelId]);

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
        }}
      />
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Gate />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
