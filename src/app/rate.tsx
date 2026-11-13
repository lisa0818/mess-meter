import NetInfo from '@react-native-community/netinfo';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BackLink, Header, PrimaryButton, StarRating } from '../components/ui';
import { useAuth } from '../lib/auth';
import { submitRating } from '../lib/ratings';
import { supabase } from '../lib/supabase';
import {
  COLORS,
  GLOBAL_STYLES,
  RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../theme/designSystem';

const TAGS = [
  'Great taste',
  'Undercooked',
  'Too oily',
  'Too salty',
  'Cold',
  'Small portion',
  'Hygiene issue',
];
const POSITIVE = ['Great taste'];
const WORDS = ['Tap a star', 'Poor', 'Okay', 'Good', 'Great', 'Loved it'];

const capitalize = (s?: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Meal';

export default function Rate() {
  const { mealId, mealType } = useLocalSearchParams<{
    mealId: string;
    mealType: string;
  }>();
  const router = useRouter();
  const { session } = useAuth();
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [skipped, setSkipped] = useState(false);
  const [photo, setPhoto] = useState<{ uri: string; base64: string } | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | 'sent' | 'queued'>(null);

  const toggleTag = (t: string) =>
    setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Camera permission needed',
        'Allow camera access to attach a plate photo.'
      );
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.4,
      base64: true,
    });
    if (!res.canceled) {
      setPhoto({
        uri: res.assets[0].uri,
        base64: res.assets[0].base64 ?? '',
      });
    }
  };

  const submit = async () => {
    if (!skipped && stars === 0) {
      Alert.alert(
        'Pick a rating',
        'Tap a star first, or choose "I skipped this meal".'
      );
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
        Alert.alert(
          'Could not submit',
          e?.message ?? 'Something went wrong. Try again.'
        );
      }
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <View style={styles.centerFeedback}>
        <View
          style={[
            styles.successIconCircle,
            done === 'queued'
              ? styles.queuedIconCircle
              : styles.sentIconCircle,
          ]}
        >
          <Text style={styles.successEmoji}>
            {done === 'queued' ? '⏳' : '✅'}
          </Text>
        </View>
        <Text style={styles.successTitle}>
          {done === 'queued' ? 'Saved offline' : 'Thanks! Your voice counts.'}
        </Text>
        {done === 'queued' ? (
          <Text style={styles.successSubtitle}>
            We'll send it automatically when you're back online.
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Header
        title={`How was ${capitalize(mealType)}?`}
        subtitle="10 seconds · 100% anonymous"
        left={<BackLink onPress={() => router.back()} />}
        padBottom={SPACING.xxl + SPACING.md}
      />

      <View style={styles.contentWrapper}>
        {/* Rating Card with Interactive Stars */}
        <View
          style={[
            GLOBAL_STYLES.card,
            SHADOWS.card,
            styles.starsCard,
            skipped && styles.disabledCard,
          ]}
        >
          <View style={styles.starRatingRow}>
            {/* Active stars use COLORS.star (#F59E0B), unselected use COLORS.border (#E2E8F0) */}
            <StarRating
              rating={stars}
              maxStars={5}
              size={44}
              interactive={!skipped}
              onRate={(selectedStars) => {
                if (!skipped) setStars(selectedStars);
              }}
            />
          </View>
          <Text style={styles.ratingWordLabel}>{WORDS[stars]}</Text>
        </View>

        {/* Tags Selection */}
        <Text style={styles.sectionHeading}>What stood out? (optional)</Text>
        <View
          style={[styles.tagWrap, skipped && styles.disabledSection]}
          pointerEvents={skipped ? 'none' : 'auto'}
        >
          {TAGS.map((t) => {
            const on = tags.includes(t);
            const isPos = POSITIVE.includes(t);
            const activeColor = isPos ? COLORS.success : COLORS.danger;

            return (
              <Pressable
                key={t}
                onPress={() => toggleTag(t)}
                accessibilityRole="button"
                style={[
                  styles.tagPill,
                  on && {
                    backgroundColor: activeColor,
                    borderColor: activeColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    on && styles.tagTextActive,
                  ]}
                >
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Plate Photo Attachment */}
        <View
          style={[styles.photoSection, skipped && styles.disabledSection]}
          pointerEvents={skipped ? 'none' : 'auto'}
        >
          {photo ? (
            <View style={styles.photoPreviewRow}>
              <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
              <Pressable
                onPress={() => setPhoto(null)}
                hitSlop={SPACING.sm}
                accessibilityRole="button"
              >
                <Text style={styles.removePhotoText}>Remove photo</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.photoButton}
              onPress={takePhoto}
              accessibilityRole="button"
            >
              <Text style={styles.photoButtonText}>
                📷 Add a plate photo (optional)
              </Text>
            </Pressable>
          )}
        </View>

        {/* Skipped Meal Option */}
        <Pressable
          style={styles.skipRow}
          onPress={() => {
            setSkipped(!skipped);
            setStars(0);
            setTags([]);
            setPhoto(null);
          }}
          accessibilityRole="checkbox"
        >
          <View
            style={[
              styles.checkboxBox,
              skipped && styles.checkboxBoxChecked,
            ]}
          >
            {skipped ? <Text style={styles.checkboxCheck}>✓</Text> : null}
          </View>
          <Text style={styles.skipText}>I skipped this meal</Text>
        </Pressable>

        {/* Submit Button */}
        <PrimaryButton
          label="Submit rating"
          onPress={submit}
          busy={busy}
          style={styles.submitButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  contentWrapper: {
    paddingHorizontal: SPACING.md,
    marginTop: -SPACING.xl,
  },
  centerFeedback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  successIconCircle: {
    width: 104,
    height: 104,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  sentIconCircle: {
    backgroundColor: '#DCFCE7',
  },
  queuedIconCircle: {
    backgroundColor: '#FEF3C7',
  },
  successEmoji: {
    fontSize: 52,
  },
  successTitle: {
    ...TYPOGRAPHY.h2,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  successSubtitle: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
  },
  starsCard: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  disabledCard: {
    opacity: 0.35,
  },
  starRatingRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  ratingWordLabel: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  sectionHeading: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  disabledSection: {
    opacity: 0.35,
  },
  tagPill: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  tagText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMain,
    fontWeight: '600',
  },
  tagTextActive: {
    color: COLORS.textInverse,
  },
  photoSection: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  photoButton: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  photoButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  photoPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
  },
  removePhotoText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.danger,
  },
  skipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
    marginVertical: SPACING.md,
    minHeight: 44,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  checkboxBoxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxCheck: {
    color: COLORS.textInverse,
    fontSize: 12,
    fontWeight: '700',
  },
  skipText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMain,
    fontSize: 15,
  },
  submitButton: {
    marginTop: SPACING.xs,
    minHeight: 52,
  },
});
