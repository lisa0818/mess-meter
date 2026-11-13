import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { C } from '../lib/theme';

export default function Join() {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const { refreshProfile } = useAuth();

  const submit = async () => {
    if (!code.trim()) return;
    setBusy(true);
    const { error } = await supabase.rpc('join_hostel', { code: code.trim() });
    if (error) {
      setBusy(false);
      Alert.alert('Invalid code', 'Ask your mess committee or warden for your hostel code.');
      return;
    }
    await refreshProfile(); // the route guard then sends us to Today
    setBusy(false);
  };

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Join your hostel</Text>
      <Text style={s.sub}>Enter the code shared by your mess committee.</Text>

      <TextInput
        style={s.input}
        placeholder="e.g. MESS01"
        placeholderTextColor={C.muted}
        autoCapitalize="characters"
        value={code}
        onChangeText={setCode}
      />

      <Pressable style={[s.btn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Join</Text>}
      </Pressable>

      <Pressable style={{ padding: 16, alignItems: 'center' }} onPress={() => supabase.auth.signOut()}>
        <Text style={{ color: C.muted }}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '800', color: C.text },
  sub: { color: C.muted, marginTop: 4, marginBottom: 24 },
  input: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12,
    padding: 16, fontSize: 20, letterSpacing: 3, textAlign: 'center', color: C.text, marginBottom: 12,
  },
  btn: { backgroundColor: C.primary, borderRadius: 12, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});