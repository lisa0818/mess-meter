import { useState } from 'react';
import {
  ActivityIndicator,
  Alert, KeyboardAvoidingView, Platform,
  Pressable,
  StyleSheet,
  Text, TextInput
} from 'react-native';
import { supabase } from '../lib/supabase';
import { C } from '../lib/theme';

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
    // On success, the route guard moves us forward automatically.
  };

  return (
    <KeyboardAvoidingView
      style={s.wrap}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={s.logo}>🍛 Mess Meter</Text>
      <Text style={s.tag}>Rate every meal in 10 seconds.</Text>

      <TextInput
        style={s.input}
        placeholder="Email"
        placeholderTextColor={C.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={s.input}
        placeholder="Password"
        placeholderTextColor={C.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={[s.btn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.btnText}>{mode === 'in' ? 'Sign in' : 'Create account'}</Text>
        )}
      </Pressable>

      <Pressable onPress={() => setMode(mode === 'in' ? 'up' : 'in')} style={s.link}>
        <Text style={{ color: C.primary, fontWeight: '600' }}>
          {mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 34, fontWeight: '800', color: C.text, textAlign: 'center' },
  tag: { color: C.muted, textAlign: 'center', marginBottom: 32, marginTop: 4 },
  input: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 12, color: C.text,
  },
  btn: {
    backgroundColor: C.primary, borderRadius: 12, minHeight: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  link: { alignItems: 'center', padding: 16 },
});