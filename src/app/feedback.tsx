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
      style={s.screen}
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
          <Text style={s.label}>CATEGORY</Text>
          <View style={s.kinds}>
            {KINDS.map((k) => {
              const isSelected = kind === k.id;
              return (
                <Pressable
                  key={k.id}
                  onPress={() => setKind(k.id)}
                  style={[
                    s.kindPill,
                    isSelected ? s.kindPillSelected : s.kindPillUnselected,
                  ]}
                >
                  <Text
                    style={[
                      s.kindText,
                      isSelected ? s.kindTextSelected : s.kindTextUnselected,
                    ]}
                  >
                    {k.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[s.label, { marginTop: SPACING.lg }]}>MESSAGE</Text>
          <TextInput
            style={s.input}
            placeholder="What's on your mind?"
            placeholderTextColor={COLORS.textMuted}
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
