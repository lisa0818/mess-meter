import { LinearGradient } from 'expo-linear-gradient';
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
import { PrimaryButton } from '../components/ui';
import { supabase } from '../lib/supabase';
import { C, shadow } from '../lib/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.includes('@') || password.length < 6) {
      Alert.alert('Check your details', 'Enter a valid email and a password of at least 6 characters.');
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient colors={[C.navy, C.navy2]} style={s.hero}>
          <View style={s.logo}><Text style={{ fontSize: 38 }}>🍛</Text></View>
          <Text style={s.brand}>Mess Meter</Text>
          <Text style={s.tag}>Rate every meal in 10 seconds.</Text>
        </LinearGradient>

        <View style={[s.card, shadow]}>
          <Text style={s.h}>{mode === 'in' ? 'Welcome back' : 'Create your account'}</Text>
          <TextInput
            style={s.input} placeholder="Email" placeholderTextColor="#9CA3AF"
            autoCapitalize="none" keyboardType="email-address"
            value={email} onChangeText={setEmail}
          />
          <TextInput
            style={s.input} placeholder="Password" placeholderTextColor="#9CA3AF"
            secureTextEntry value={password} onChangeText={setPassword}
          />
          <PrimaryButton label={mode === 'in' ? 'Sign in' : 'Create account'} onPress={submit} busy={busy} />
          <Pressable onPress={() => setMode(mode === 'in' ? 'up' : 'in')} style={{ alignItems: 'center', paddingTop: 16 }}>
            <Text style={{ color: C.primary, fontWeight: '700' }}>
              {mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}
            </Text>
          </Pressable>
        </View>

        <Text style={s.foot}>Anonymous ratings. Real change.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  hero: {
    alignItems: 'center', paddingTop: 90, paddingBottom: 90,
    borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
  },
  logo: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  brand: { color: '#fff', fontSize: 32, fontWeight: '800' },
  tag: { color: C.onDark, marginTop: 4 },
  card: {
    backgroundColor: C.card, borderRadius: 22, padding: 22, marginHorizontal: 20,
    marginTop: -50, borderWidth: 1, borderColor: C.border,
  },
  h: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 16 },
  input: {
    backgroundColor: '#F6F2EB', borderRadius: 12, padding: 16, fontSize: 16,
    marginBottom: 12, color: C.text,
  },
  foot: { textAlign: 'center', color: C.muted, marginVertical: 24 },
});