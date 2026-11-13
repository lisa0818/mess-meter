import { useRouter } from 'expo-router';
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
import { BackLink, Header, PrimaryButton } from '../components/ui';
import { supabase } from '../lib/supabase';
import {
  COLORS,
  GLOBAL_STYLES,
  RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../theme/designSystem';

const KINDS = [
  { id: 'bug', label: '🐞 Bug' },
  { id: 'idea', label: '💡 Idea' },
  { id: 'other', label: '💬 Other' },
];

export default function Feedback() {
  const router = useRouter();
  const [kind, setKind] = useState('idea');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (message.trim().length < 3) {
      Alert.alert(
        'Add a few words',
        'Tell us what happened or what you would like to see.'
      );
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from('feedback')
      .insert({ kind, message: message.trim() });
    setBusy(false);
    if (error) {
      Alert.alert('Could not send', error.message);
      return;
    }
    Alert.alert('Thank you!', 'Your feedback has been sent.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
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
        <Header
          title="Send feedback"
          subtitle="We read every single note from students"
          left={<BackLink onPress={() => router.back()} />}
          padBottom={SPACING.xxl + SPACING.md}
        />

        <View style={styles.contentWrapper}>
          <View style={[GLOBAL_STYLES.card, SHADOWS.card, styles.card]}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.kindsRow}>
              {KINDS.map((k) => {
                const isActive = kind === k.id;
                return (
                  <Pressable
                    key={k.id}
                    onPress={() => setKind(k.id)}
                    accessibilityRole="button"
                    style={[
                      styles.kindPill,
                      isActive && styles.kindPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.kindText,
                        isActive && styles.kindTextActive,
                      ]}
                    >
                      {k.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Message</Text>
            <TextInput
              style={styles.input}
              placeholder="What's on your mind? Suggestions, food quality, hygiene..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              maxLength={1000}
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />

            <PrimaryButton
              label="Send feedback"
              onPress={submit}
              busy={busy}
              style={styles.submitBtn}
            />
          </View>
        </View>
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
    paddingBottom: SPACING.xxl,
  },
  contentWrapper: {
    paddingHorizontal: SPACING.md,
    marginTop: -SPACING.xl,
  },
  card: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.bodyBold,
    marginBottom: SPACING.xs + 2,
  },
  kindsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  kindPill: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kindPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  kindText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  kindTextActive: {
    color: COLORS.textInverse,
    fontWeight: '700',
  },
  input: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    minHeight: 140,
    color: COLORS.textMain,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  submitBtn: {
    minHeight: 52,
  },
});
