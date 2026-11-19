import NetInfo from '@react-native-community/netinfo';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BackLink, Card, Header, PrimaryButton } from '../components/ui';
import { useAuth } from '../lib/auth';
import { haptic } from '../lib/haptics';
import { useTheme } from '../theme/ThemeContext';
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

function StarItem({
  n,
  active,
  disabled,
  onPress,
}: {
  n: number;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (disabled) return;
    haptic.light();
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.35, duration: 90, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Pressable onPress={handlePress} hitSlop={8} style={s.starTouch} disabled={disabled}>
      <Animated.Text
        style={[
          s.starGlyph,
          { color: active ? colors.star : colors.border, transform: [{ scale }] },
        ]}
      >
        ★
      </Animated.Text>
    </Pressable>
  );
}

export default function Rate() {
  const { mealId, mealType } = useLocalSearchParams<{ mealId: string; mealType: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { isDark, colors } = useTheme();
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [skipped, setSkipped] = useState(false);
  const [photo, setPhoto] = useState<{ uri: string; base64: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | 'sent' | 'queued'>(null);

  const toggleTag = (t: string) => {
    haptic.selection();
    setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  };

  const takePhoto = async () => {
    haptic.light();
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
      haptic.warning();
      Alert.alert('Pick a rating', 'Tap a star first, or choose "I skipped this meal".');
      return;
    }
    const uid = session?.user.id;
    if (!uid) return;
    haptic.medium();
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
        comment: skipped ? null : (comment.trim() || null),
        skipped,
        photo_url: photoPath,
      });

      haptic.success();
      setDone(res.queued ? 'queued' : 'sent');
      setTimeout(() => router.back(), 1400);
    } catch (e: any) {
      haptic.warning();
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
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <View
          style={[
            s.bigIcon,
            { backgroundColor: done === 'queued' ? colors.primaryLight : isDark ? '#064E3B' : '#DCFCE7' },
          ]}
        >
          <Text style={{ fontSize: 48 }}>{done === 'queued' ? '⏳' : '✓'}</Text>
        </View>
        <Text style={[TYPOGRAPHY.h2, { marginTop: SPACING.lg, textAlign: 'center', color: colors.textMain }]}>
          {done === 'queued' ? 'Saved offline' : 'Thanks! Your voice counts.'}
        </Text>
        {done === 'queued' && (
          <Text style={[TYPOGRAPHY.body, { color: colors.textMuted, marginTop: SPACING.xs, textAlign: 'center' }]}>
            We'll send it automatically when you're back online.
          </Text>
        )}
      </View>
    );
  }

  const titleMeal = mealType ? mealType[0].toUpperCase() + mealType.slice(1) : 'Meal';

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
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
              <StarItem
                key={n}
                n={n}
                active={n <= stars}
                disabled={skipped}
                onPress={() => setStars(n)}
              />
            ))}
          </View>
          <Text style={[s.wordLabel, { color: colors.textSecondary }]}>{WORDS[stars]}</Text>
        </Card>

        {/* Feedback Tags */}
        <View style={s.sectionWrap}>
          <Text style={[s.sectionTitle, { color: colors.textMain }]}>What stood out? (optional)</Text>
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
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    on && (isPositive ? s.tagPillPositive : s.tagPillNegative),
                  ]}
                >
                  <Text
                    style={[
                      s.tagPillText,
                      { color: on ? COLORS.textInverse : colors.textMain },
                      on && { fontWeight: '700' },
                    ]}
                  >
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Optional Free-Text Comment */}
        <View
          style={[s.sectionWrap, skipped && { opacity: 0.35 }]}
          pointerEvents={skipped ? 'none' : 'auto'}
        >
          <View style={[GLOBAL_STYLES.rowBetween, { marginBottom: SPACING.xs }]}>
            <Text style={[s.sectionTitle, { color: colors.textMain }]}>Add a note (optional)</Text>
            <Text style={[TYPOGRAPHY.caption, { color: colors.textMuted }]}>
              {comment.length}/140
            </Text>
          </View>
          <TextInput
            style={[
              s.commentInput,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textMain },
            ]}
            placeholder="e.g. Chapati was cold, loved the dessert..."
            placeholderTextColor={colors.textMuted}
            value={comment}
            onChangeText={(t) => setComment(t.slice(0, 140))}
            multiline
            numberOfLines={3}
            maxLength={140}
            editable={!skipped && !busy}
          />
        </View>

        {/* Optional Photo */}
        <View
          style={[s.sectionWrap, skipped && { opacity: 0.35 }]}
          pointerEvents={skipped ? 'none' : 'auto'}
        >
          {photo ? (
            <View style={s.photoRow}>
              <Image source={{ uri: photo.uri }} style={s.thumb} />
              <Pressable
                onPress={() => {
                  haptic.light();
                  setPhoto(null);
                }}
                hitSlop={10}
              >
                <Text style={s.removePhotoText}>Remove photo</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={[s.photoBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={takePhoto}
            >
              <Text style={[s.photoBtnText, { color: colors.textMuted }]}>📷  Add a plate photo (optional)</Text>
            </Pressable>
          )}
        </View>

        {/* Skip Option */}
        <Pressable
          style={s.skipRow}
          onPress={() => {
            haptic.selection();
            setSkipped(!skipped);
            if (!skipped) {
              setStars(0);
              setTags([]);
              setComment('');
              setPhoto(null);
            }
          }}
        >
          <View
            style={[
              s.checkbox,
              { backgroundColor: colors.surface, borderColor: colors.border },
              skipped && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            {skipped ? <Text style={s.checkmark}>✓</Text> : null}
          </View>
          <Text style={[s.skipText, { color: colors.textSecondary }]}>I skipped this meal</Text>
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
  commentInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.textMain,
    minHeight: 76,
    textAlignVertical: 'top',
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
