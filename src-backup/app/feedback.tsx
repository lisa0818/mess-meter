import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator, Alert, KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text, TextInput,
    View,
} from 'react-native';
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
    <KeyboardAvoidingView style={s.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={{ color: C.muted, fontSize: 16 }}>← Back</Text>
      </Pressable>
      <Text style={s.title}>Send feedback</Text>
      <Text style={s.sub}>Found a bug or have an idea? We read everything.</Text>

      <View style={s.kinds}>
        {KINDS.map((k) => (
          <Pressable
            key={k.id}
            onPress={() => setKind(k.id)}
            style={[s.kind, kind === k.id && { backgroundColor: C.primary, borderColor: C.primary }]}
          >
            <Text style={{ color: kind === k.id ? '#fff' : C.text, fontWeight: '600' }}>{k.label}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={s.input}
        placeholder="What's on your mind?"
        placeholderTextColor={C.muted}
        multiline
        maxLength={1000}
        value={message}
        onChangeText={setMessage}
        textAlignVertical="top"
      />

      <Pressable style={[s.btn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Send</Text>}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 24, paddingTop: 56 },
  title: { fontSize: 28, fontWeight: '800', color: C.text, marginTop: 20 },
  sub: { color: C.muted, marginTop: 4, marginBottom: 20 },
  kinds: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  kind: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 22, paddingHorizontal: 16, minHeight: 44, justifyContent: 'center' },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 16, fontSize: 16, minHeight: 140, color: C.text },
  btn: { backgroundColor: C.primary, borderRadius: 12, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});