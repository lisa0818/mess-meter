import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PrimaryButton } from '../components/ui';
import { supabase } from '../lib/supabase';
import {
  COLORS,
  GLOBAL_STYLES,
  RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../theme/designSystem';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.includes('@') || password.length < 6) {
      Alert.alert(
        'Check your details',
        'Enter a valid email and a password of at least 6 characters.'
      );
      return;
    }
    setBusy(true);
    const creds = { email: email.trim(), password };
    const { error } =
      mode === 'in'
        ? await supabase.auth.signInWithPassword(creds)
        : await supabase.auth.signUp(creds);
    setBusy(false);
    if (error) Alert.alert('Could not continue', error.message);
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient
          colors={['#0F172A', '#1E293B']}
          style={styles.heroSection}
        >
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🍛</Text>
          </View>
          <Text style={styles.brandTitle}>Mess Meter</Text>
          <Text style={styles.brandSubtitle}>Rate every meal in 10 seconds.</Text>
        </LinearGradient>

        <View style={[GLOBAL_STYLES.card, SHADOWS.card, styles.authCard]}>
          <Text style={styles.authTitle}>
            {mode === 'in' ? 'Welcome back' : 'Create your account'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Student email"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password (min 6 characters)"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <PrimaryButton
            label={mode === 'in' ? 'Sign in' : 'Create account'}
            onPress={submit}
            busy={busy}
            style={styles.submitBtn}
          />

          <Pressable
            onPress={() => setMode(mode === 'in' ? 'up' : 'in')}
            style={styles.switchModeButton}
            accessibilityRole="button"
          >
            <Text style={styles.switchModeText}>
              {mode === 'in'
                ? 'New here? Create an account'
                : 'Have an account? Sign in'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.footerNote}>
          Anonymous ratings. Real mess improvement.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 80,
    borderBottomLeftRadius: RADIUS.lg * 2,
    borderBottomRightRadius: RADIUS.lg * 2,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  logoEmoji: {
    fontSize: 38,
  },
  brandTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textInverse,
    fontSize: 30,
  },
  brandSubtitle: {
    ...TYPOGRAPHY.body,
    color: '#94A3B8',
    marginTop: SPACING.xs,
  },
  authCard: {
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginTop: -SPACING.xxl,
  },
  authTitle: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    marginBottom: SPACING.sm + 2,
    color: COLORS.textMain,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  submitBtn: {
    marginTop: SPACING.xs,
    minHeight: 52,
  },
  switchModeButton: {
    alignItems: 'center',
    paddingTop: SPACING.md,
  },
  switchModeText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primary,
  },
  footerNote: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    color: COLORS.textMuted,
    marginVertical: SPACING.lg,
  },
});
