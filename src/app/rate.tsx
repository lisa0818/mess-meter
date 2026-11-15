import NetInfo from '@react-native-community/netinfo';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BackLink, Card, Header, PrimaryButton } from '../components/ui';
import { useAuth } from '../lib/auth';
import { submitRating } from '../lib/ratings';
import { supabase } from '../lib/supabase';
import {
  COLORS,
  GLOBAL_STYLES,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
} from '../theme/designSystem';

const TAGS = ['Great taste', 'Undercooked', 'Too oily', 'Too salty', 'Cold', 'Small portion', 'Hygiene issue'];
const POSITIVE = ['Great taste'];
const WORDS = ['Tap a star', 'Poor', 'Okay', 'Good', 'Great', 'Loved it'];

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
        <View
          style={[
            s.bigIcon,
            { backgroundColor: done === 'queued' ? COLORS.primaryLight : '#DCFCE7' },
          ]}
        >
          <Text style={{ fontSize: 48 }}>{done === 'queued' ? '⏳' : '✓'}</Text>
        </View>
        <Text style={[TYPOGRAPHY.h2, { marginTop: SPACING.lg, textAlign: 'center' }]}>
          {done === 'queued' ? 'Saved offline' : 'Thanks! Your voice counts.'}
        </Text>
        {done === 'queued' && (
          <Text style={[TYPOGRAPHY.body, { color: COLORS.textMuted, marginTop: SPACING.xs, textAlign: 'center' }]}>
            We'll send it automatically when you're back online.
          </Text>
        )}
      </View>
    );
  }

  const titleMeal = mealType ? mealType[0].toUpperCase() + mealType.slice(1) : 'Meal';

  return (
    <View style={s.screen}>
      <Header
        title={`How was ${titleMeal}?`}
        subtitle="10 seconds · anonymous"
        left={<BackLink onPress={() => router.back()} />}
      />

      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Interactive Star Rating */}
        <Card elevated style={[s.starCard, skipped && { opacity: 0.35 }]}>
          <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => !skipped && setStars(n)}
                hitSlop={8}
                style={s.starTouch}
              >
                <Text
                  style={[
                    s.starGlyph,
                    { color: n <= stars ? COLORS.star : COLORS.border },
                  ]}
                >
                  ★
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={s.wordLabel}>{WORDS[stars]}</Text>
        </Card>

        {/* Feedback Tags */}
        <View style={s.sectionWrap}>
          <Text style={s.sectionTitle}>What stood out? (optional)</Text>
          <View
            style={[s.tagWrap, skipped && { opacity: 0.35 }]}
            pointerEvents={skipped ? 'none' : 'auto'}
          >
            {TAGS.map((t) => {
              const on = tags.includes(t);
              const isPositive = POSITIVE.includes(t);
              return (
                <Pressable
                  key={t}
                  onPress={() => toggleTag(t)}
                  style={[
                    s.tagPill,
                    on && (isPositive ? s.tagPillPositive : s.tagPillNegative),
                  ]}
                >
                  <Text
                    style={[
                      s.tagPillText,
                      on && { color: COLORS.textInverse, fontWeight: '700' },
                    ]}
                  >
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Optional Photo */}
        <View
          style={[s.sectionWrap, skipped && { opacity: 0.35 }]}
          pointerEvents={skipped ? 'none' : 'auto'}
        >
          {photo ? (
            <View style={s.photoRow}>
              <Image source={{ uri: photo.uri }} style={s.thumb} />
              <Pressable onPress={() => setPhoto(null)} hitSlop={10}>
                <Text style={s.removePhotoText}>Remove photo</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={s.photoBtn} onPress={takePhoto}>
              <Text style={s.photoBtnText}>📷  Add a plate photo (optional)</Text>
            </Pressable>
          )}
        </View>

        {/* Skip Option */}
        <Pressable
          style={s.skipRow}
          onPress={() => {
            setSkipped(!skipped);
            if (!skipped) {
              setStars(0);
              setTags([]);
              setPhoto(null);
            }
          }}
        >
          <View
            style={[
              s.checkbox,
              skipped && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
            ]}
          >
            {skipped ? <Text style={s.checkmark}>✓</Text> : null}
          </View>
          <Text style={s.skipText}>I skipped this meal</Text>
        </Pressable>

        {/* Single Primary CTA */}
        <PrimaryButton
          label="Submit Rating"
          onPress={submit}
          busy={busy}
          style={s.submitBtn}
        />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  bigIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starCard: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  starTouch: {
    padding: SPACING.xs,
  },
  starGlyph: {
    fontSize: 48,
  },
  wordLabel: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  sectionWrap: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.sm,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tagPill: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    justifyContent: 'center',
  },
  tagPillPositive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  tagPillNegative: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },
  tagPillText: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.textMain,
  },
  photoBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  photoBtnText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.md,
  },
  removePhotoText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.danger,
  },
  skipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  checkmark: {
    color: COLORS.textInverse,
    fontSize: 12,
    fontWeight: '700',
  },
  skipText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  submitBtn: {
    marginTop: SPACING.sm,
  },
});
