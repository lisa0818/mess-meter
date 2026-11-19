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
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useTheme } from '../theme/ThemeContext';
import {
  COLORS,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
} from '../theme/designSystem';

export default function Join() {
  const { colors } = useTheme();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const { refreshProfile } = useAuth();

  const submit = async () => {
    if (!code.trim()) {
      Alert.alert('Enter code', 'Please enter your hostel invite code.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc('join_hostel', { code: code.trim().toUpperCase() });
    if (error) {
      setBusy(false);
      Alert.alert('Invalid code', 'Ask your mess committee or warden for your hostel code.');
      return;
    }
    await refreshProfile();
    setBusy(false);
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
        <View style={s.hero}>
          <View style={[s.brandBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
            <Text style={s.brandBadgeEmoji}>🏠</Text>
          </View>
          <Text style={[TYPOGRAPHY.h1, { color: colors.textMain }]}>Join Your Hostel</Text>
          <Text style={[s.tagline, { color: colors.textSecondary }]}>
            Enter the 6-character code provided by your mess committee or warden.
          </Text>
        </View>

        <Card variant="bordered" style={s.card}>
          <Text style={[s.inputLabel, { color: colors.textMuted }]}>HOSTEL INVITE CODE</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textMain }]}
            placeholder="MESS01"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
          />

          <PrimaryButton
            label="Join Hostel"
            onPress={submit}
            busy={busy}
            style={s.submitBtn}
          />

          <Pressable
            style={s.signoutBtn}
            onPress={() => supabase.auth.signOut()}
            hitSlop={8}
          >
            <Text style={[s.signoutText, { color: colors.textMuted }]}>Sign out of this account</Text>
          </Pressable>
        </Card>
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
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
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
    paddingHorizontal: SPACING.md,
  },
  card: {
    padding: SPACING.lg,
  },
  inputLabel: {
    ...TYPOGRAPHY.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 6,
    textAlign: 'center',
    color: COLORS.textMain,
    marginBottom: SPACING.md,
  },
  submitBtn: {
    marginTop: SPACING.sm,
  },
  signoutBtn: {
    marginTop: SPACING.lg,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  signoutText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
