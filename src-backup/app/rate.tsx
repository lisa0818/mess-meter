import NetInfo from '@react-native-community/netinfo';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, Alert, Image,
  Pressable, ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../lib/auth';
import { submitRating } from '../lib/ratings';
import { supabase } from '../lib/supabase';
import { C } from '../lib/theme';

const TAGS = ['Great taste', 'Undercooked', 'Too oily', 'Too salty', 'Cold', 'Small portion', 'Hygiene issue'];
const POSITIVE = ['Great taste'];

export default function Rate() {
  const { mealId, mealType } = useLocalSearchParams<{ mealId: string; mealType: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [skipped, setSkipped] = useState(false);
  const [photo, setPhoto] = useState<{ uri: string; base64: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | 'sent' | 'queued'>(null);

  const toggleTag = (t: string) =>
    setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera permission needed', 'Allow camera access to attach a plate photo.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.4, base64: true });
    if (!res.canceled) {
      setPhoto({ uri: res.assets[0].uri, base64: res.assets[0].base64 ?? '' });
    }
  };

  const submit = async () => {
    if (!skipped && stars === 0) {
      Alert.alert('Pick a rating', 'Tap a star first, or choose "I skipped this meal".');
      return;
    }
    const uid = session?.user.id;
    if (!uid) return;
    setBusy(true);

    try {
      // Upload photo only when online; ratings still work offline without it
      let photoPath: string | null = null;
      if (photo?.base64 && !skipped) {
        const net = await NetInfo.fetch();
        if (net.isConnected !== false) {
          const path = `${uid}/${mealId}-${Date.now()}.jpg`;
          const { error: upErr } = await supabase.storage
            .from('plate-photos')
            .upload(path, decode(photo.base64), { contentType: 'image/jpeg' });
          if (!upErr) photoPath = path;
        }
      }

      const res = await submitRating({
        meal_id: mealId,
        user_id: uid,
        stars: skipped ? null : stars,
        tags: skipped ? [] : tags,
        skipped,
        photo_url: photoPath,
      });
      setDone(res.queued ? 'queued' : 'sent');
      setTimeout(() => router.back(), 1400);
    } catch (e: any) {
      if (e?.message === 'ALREADY_RATED') {
        Alert.alert('Already rated', 'You have already rated this meal.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Could not submit', e?.message ?? 'Something went wrong. Try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <View style={s.center}>
        <Text style={{ fontSize: 64 }}>{done === 'queued' ? '⏳' : '✅'}</Text>
        <Text style={s.thanks}>
          {done === 'queued' ? 'Saved offline' : 'Thanks! Your voice counts.'}
        </Text>
        {done === 'queued' && (
          <Text style={s.sub}>We'll send it automatically when you're back online.</Text>
        )}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={{ color: C.muted, fontSize: 16 }}>← Back</Text>
      </Pressable>

      <Text style={s.title}>How was {mealType ?? 'meal'}?</Text>

      <View style={[s.stars, skipped && { opacity: 0.3 }]}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => !skipped && setStars(n)} hitSlop={6} style={s.starBtn}>
            <Text style={[s.star, { color: n <= stars ? '#F59F00' : '#CED4DA' }]}>★</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.section}>What stood out? (optional)</Text>
      <View style={[s.tagWrap, skipped && { opacity: 0.3 }]} pointerEvents={skipped ? 'none' : 'auto'}>
        {TAGS.map((t) => {
          const on = tags.includes(t);
          const color = POSITIVE.includes(t) ? C.good : C.bad;
          return (
            <Pressable
              key={t}
              onPress={() => toggleTag(t)}
              style={[s.tag, on && { backgroundColor: color, borderColor: color }]}
            >
              <Text style={[s.tagText, on && { color: '#fff' }]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Photo */}
      <View style={[{ marginTop: 22 }, skipped && { opacity: 0.3 }]} pointerEvents={skipped ? 'none' : 'auto'}>
        {photo ? (
          <View style={s.photoRow}>
            <Image source={{ uri: photo.uri }} style={s.thumb} />
            <Pressable onPress={() => setPhoto(null)} hitSlop={10}>
              <Text style={{ color: C.bad, fontWeight: '600' }}>Remove photo</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={s.photoBtn} onPress={takePhoto}>
            <Text style={{ color: C.text, fontWeight: '600' }}>📷 Add a plate photo (optional)</Text>
          </Pressable>
        )}
      </View>

      <Pressable
        style={s.skipRow}
        onPress={() => {
          setSkipped(!skipped);
          setStars(0);
          setTags([]);
          setPhoto(null);
        }}
      >
        <View style={[s.check, skipped && { backgroundColor: C.primary, borderColor: C.primary }]}>
          {skipped && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
        </View>
        <Text style={{ color: C.text, fontSize: 15 }}>I skipped this meal</Text>
      </Pressable>

      <Pressable style={[s.submit, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Submit</Text>}
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 24, paddingTop: 56 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  thanks: { fontSize: 20, fontWeight: '700', color: C.text, marginTop: 12 },
  sub: { color: C.muted, marginTop: 6, textAlign: 'center' },
  title: { fontSize: 30, fontWeight: '800', color: C.text, marginTop: 24, textTransform: 'capitalize' },
  stars: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 28 },
  starBtn: { padding: 4 },
  star: { fontSize: 52 },
  section: { fontWeight: '700', color: C.text, marginBottom: 10 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
    borderRadius: 22, paddingHorizontal: 14, minHeight: 44, justifyContent: 'center',
  },
  tagText: { color: C.text, fontWeight: '500' },
  photoBtn: {
    borderWidth: 1, borderColor: C.border, borderStyle: 'dashed', borderRadius: 12,
    minHeight: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card,
  },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  thumb: { width: 84, height: 84, borderRadius: 12 },
  skipRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 28, minHeight: 44 },
  check: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  submit: { backgroundColor: C.primary, borderRadius: 14, minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});