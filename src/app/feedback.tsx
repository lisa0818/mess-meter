import { useRouter } from 'expo-router';
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
import { BackLink, Card, Header, PrimaryButton } from '../components/ui';
import { supabase } from '../lib/supabase';
import { useTheme } from '../theme/ThemeContext';
import {
  COLORS,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
} from '../theme/designSystem';

const KINDS = [
  { id: 'bug', label: '🐞 Bug' },
  { id: 'idea', label: '💡 Idea' },
  { id: 'other', label: 'Other' },
];

export default function Feedback() {
  const router = useRouter();
  const { colors } = useTheme();
  const [kind, setKind] = useState('idea');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (message.trim().length < 3) {
      Alert.alert('Add a few words', 'Tell us what happened or what you would like to see.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('feedback').insert({ kind, message: message.trim() });
    setBusy(false);
    if (error) {
      Alert.alert('Could not send', error.message);
      return;
    }
    Alert.alert('Thank you!', 'Your feedback has been sent.', [{ text: 'OK', onPress: () => router.back() }]);
  };

  return (
    <KeyboardAvoidingView
      style={[s.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title="Send Feedback"
        subtitle="We read every single suggestion and report"
        left={<BackLink onPress={() => router.back()} />}
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="bordered">
          <Text style={[s.label, { color: colors.textMuted }]}>CATEGORY</Text>
          <View style={s.kinds}>
            {KINDS.map((k) => {
              const isSelected = kind === k.id;
              return (
                <Pressable
                  key={k.id}
                  onPress={() => setKind(k.id)}
                  style={[
                    s.kindPill,
                    isSelected
                      ? [s.kindPillSelected, { backgroundColor: colors.primary, borderColor: colors.primary }]
                      : [s.kindPillUnselected, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }],
                  ]}
                >
                  <Text
                    style={[
                      s.kindText,
                      isSelected
                        ? [s.kindTextSelected, { color: colors.textInverse }]
                        : [s.kindTextUnselected, { color: colors.textSecondary }],
                    ]}
                  >
                    {k.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[s.label, { color: colors.textMuted, marginTop: SPACING.lg }]}>MESSAGE</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textMain }]}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={1000}
            value={message}
            onChangeText={setMessage}
            textAlignVertical="top"
          />

          <PrimaryButton
            label="Send Feedback"
            onPress={submit}
            busy={busy}
            style={s.submitBtn}
          />
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
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  label: {
    ...TYPOGRAPHY.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  kinds: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  kindPill: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kindPillUnselected: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kindPillSelected: {
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  kindText: {
    fontSize: 13,
    fontWeight: '600',
  },
  kindTextUnselected: {
    color: COLORS.textSecondary,
  },
  kindTextSelected: {
    color: COLORS.textInverse,
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
  },
  submitBtn: {
    marginTop: SPACING.lg,
  },
});
