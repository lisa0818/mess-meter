import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AuthProvider, useAuth } from '../lib/auth';
import { C } from '../lib/theme';

function Gate() {
  const { session, hostelId, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

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

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Slot />
      {loading && (
        <View style={s.overlay}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Gate />
    </AuthProvider>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
