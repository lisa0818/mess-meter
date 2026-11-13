import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert, KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text, TextInput,
    View,
} from 'react-native';
import { BackLink, Card, Header, PrimaryButton } from '../components/ui';
import { supabase } from '../lib/supabase';
import { C } from '../lib/theme';

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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <Header
          title="Send feedback"
          subtitle="We read everything"
          left={<BackLink onPress={() => router.back()} />}
          pad={56}
        />
        <View style={{ paddingHorizontal: 20, marginTop: -34 }}>
          <Card>
            <View style={s.kinds}>
              {KINDS.map((k) => (
                <Pressable
                  key={k.id}
                  onPress={() => setKind(k.id)}
                  style={[s.kind, kind === k.id && { backgroundColor: C.primary, borderColor: C.primary }]}
                >
                  <Text style={{ color: kind === k.id ? '#fff' : C.text, fontWeight: '700' }}>{k.label}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={s.input}
              placeholder="What's on your mind?"
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={1000}
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />
            <PrimaryButton label="Send" onPress={submit} busy={busy} style={{ marginTop: 14 }} />
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  kinds: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  kind: {
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
    borderRadius: 22, paddingHorizontal: 16, minHeight: 44, justifyContent: 'center',
  },
  input: {
    backgroundColor: '#F6F2EB', borderRadius: 12, padding: 16, fontSize: 16,
    minHeight: 150, color: C.text,
  },
});