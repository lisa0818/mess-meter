import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../components/ui';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { C, shadow } from '../lib/theme';

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
    await refreshProfile();
    setBusy(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[C.navy, C.navy2]} style={s.hero}>
        <Text style={{ fontSize: 48 }}>🏠</Text>
        <Text style={s.title}>Join your hostel</Text>
        <Text style={s.sub}>Enter the code shared by your mess committee.</Text>
      </LinearGradient>

      <View style={[s.card, shadow]}>
        <TextInput
          style={s.input} placeholder="MESS01" placeholderTextColor="#9CA3AF"
          autoCapitalize="characters" value={code} onChangeText={setCode}
        />
        <PrimaryButton label="Join hostel" onPress={submit} busy={busy} />
        <Pressable style={{ padding: 16, alignItems: 'center' }} onPress={() => supabase.auth.signOut()}>
          <Text style={{ color: C.muted }}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  hero: {
    alignItems: 'center', paddingTop: 90, paddingBottom: 80, paddingHorizontal: 24,
    borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
  },
  title: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 8 },
  sub: { color: C.onDark, marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: C.card, borderRadius: 22, padding: 22, marginHorizontal: 20,
    marginTop: -40, borderWidth: 1, borderColor: C.border,
  },
  input: {
    backgroundColor: '#F6F2EB', borderRadius: 12, padding: 16, fontSize: 22,
    letterSpacing: 4, textAlign: 'center', color: C.text, marginBottom: 14,
  },
});