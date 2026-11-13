import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PrimaryButton } from '../components/ui';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import {
  COLORS,
  GLOBAL_STYLES,
  RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../theme/designSystem';

export default function Join() {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const { refreshProfile } = useAuth();

  const submit = async () => {
    if (!code.trim()) return;
    setBusy(true);
    const { error } = await supabase.rpc('join_hostel', {
      code: code.trim(),
    });
    if (error) {
      setBusy(false);
      Alert.alert(
        'Invalid code',
        'Ask your mess committee or warden for your hostel code.'
      );
      return;
    }
    await refreshProfile();
    setBusy(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        style={styles.heroSection}
      >
        <Text style={styles.heroIcon}>🏠</Text>
        <Text style={styles.heroTitle}>Join your hostel</Text>
        <Text style={styles.heroSubtitle}>
          Enter the code shared by your mess committee.
        </Text>
      </LinearGradient>

      <View style={[GLOBAL_STYLES.card, SHADOWS.card, styles.card]}>
        <TextInput
          style={styles.input}
          placeholder="MESS01"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="characters"
          value={code}
          onChangeText={setCode}
        />
        <PrimaryButton
          label="Join hostel"
          onPress={submit}
          busy={busy}
          style={styles.submitBtn}
        />
        <Pressable
          style={styles.signOutButton}
          onPress={() => supabase.auth.signOut()}
          accessibilityRole="button"
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 70,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: RADIUS.lg * 2,
    borderBottomRightRadius: RADIUS.lg * 2,
  },
  heroIcon: {
    fontSize: 48,
    marginBottom: SPACING.xs,
  },
  heroTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textInverse,
    fontSize: 28,
  },
  heroSubtitle: {
    ...TYPOGRAPHY.body,
    color: '#94A3B8',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  card: {
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginTop: -SPACING.xl,
  },
  input: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 22,
    letterSpacing: 4,
    textAlign: 'center',
    color: COLORS.textMain,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    fontWeight: '700',
  },
  submitBtn: {
    minHeight: 52,
  },
  signOutButton: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  signOutText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
