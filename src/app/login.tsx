import { useState } from 'react';
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
import { Card, PrimaryButton } from '../components/ui';
import { supabase } from '../lib/supabase';
import { useTheme } from '../theme/ThemeContext';
import {
  COLORS,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
} from '../theme/designSystem';

export default function Login() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.includes('@') || password.length < 6) {
      Alert.alert(
        'Invalid details',
        'Enter a valid email address and a password of at least 6 characters.'
      );
      return;
    }
    setBusy(true);
    const creds = { email: email.trim(), password };
    if (mode === 'in') {
      const { error } = await supabase.auth.signInWithPassword(creds);
      setBusy(false);
      if (error) Alert.alert('Could not continue', error.message);
    } else {
      const { data, error } = await supabase.auth.signUp(creds);
      setBusy(false);
      if (error) {
        Alert.alert('Could not continue', error.message);
      } else if (!data.session) {
        Alert.alert(
          'Check your email ✉️',
          `We sent a verification link to ${email.trim()}. Open it to activate your account, then come back and sign in.`
        );
        setMode('in');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={[s.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Hero */}
        <View style={s.hero}>
          <View style={[s.brandBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
            <Text style={s.brandBadgeEmoji}>🍛</Text>
          </View>
          <Text style={[TYPOGRAPHY.h1, { color: colors.textMain }]}>Mess Meter</Text>
          <Text style={[s.tagline, { color: colors.textSecondary }]}>Rate every meal in 10 seconds. Real quality change.</Text>
        </View>

        {/* Auth Form Card */}
        <Card variant="bordered" style={s.authCard}>
          {/* Segmented Mode Selector */}
          <View style={[s.segmentContainer, { backgroundColor: colors.surfaceSubtle }]}>
            <Pressable
              style={[
                s.segmentTab,
                mode === 'in'
                  ? [s.segmentTabActive, { backgroundColor: colors.surface }]
                  : s.segmentTabInactive,
              ]}
              onPress={() => setMode('in')}
            >
              <Text
                style={[
                  s.segmentText,
                  mode === 'in'
                    ? [s.segmentTextActive, { color: colors.textMain }]
                    : [s.segmentTextInactive, { color: colors.textMuted }],
                ]}
              >
                Sign In
              </Text>
            </Pressable>

            <Pressable
              style={[
                s.segmentTab,
                mode === 'up'
                  ? [s.segmentTabActive, { backgroundColor: colors.surface }]
                  : s.segmentTabInactive,
              ]}
              onPress={() => setMode('up')}
            >
              <Text
                style={[
                  s.segmentText,
                  mode === 'up'
                    ? [s.segmentTextActive, { color: colors.textMain }]
                    : [s.segmentTextInactive, { color: colors.textMuted }],
                ]}
              >
                Create Account
              </Text>
            </Pressable>
          </View>

          <Text style={[s.inputLabel, { color: colors.textMuted }]}>CAMPUS EMAIL</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textMain }]}
            placeholder="student@university.edu"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[s.inputLabel, { color: colors.textMuted, marginTop: SPACING.md }]}>PASSWORD</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textMain }]}
            placeholder="At least 6 characters"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <PrimaryButton
            label={mode === 'in' ? 'Sign In' : 'Create Account'}
            onPress={submit}
            busy={busy}
            style={s.submitBtn}
          />
        </Card>

        {/* Footer info */}
        <View style={s.footer}>
          <Text style={[s.footerText, { color: colors.textMuted }]}>
            🔒 100% Anonymous Ratings · Direct to Mess Management
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: SPACING.xl,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  brandBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  brandBadgeEmoji: {
    fontSize: 32,
  },
  tagline: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  authCard: {
    padding: SPACING.lg,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: 3,
    marginBottom: SPACING.lg,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
  },
  segmentTabActive: {
    backgroundColor: COLORS.surface,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  segmentTabInactive: {},
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: COLORS.textMain,
    fontWeight: '700',
  },
  segmentTextInactive: {
    color: COLORS.textMuted,
  },
  inputLabel: {
    ...TYPOGRAPHY.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textMain,
  },
  submitBtn: {
    marginTop: SPACING.lg,
  },
  footer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
