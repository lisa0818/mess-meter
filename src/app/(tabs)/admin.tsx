import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Card, Header, StatCard } from '../../components/ui';
import { AdminScreenSkeleton } from '../../components/Skeleton';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../theme/ThemeContext';
import { getPlatePhotoUrl, getRecentMealComments, MealComment } from '../../lib/ratings';
import { supabase } from '../../lib/supabase';
import { dayLabel } from '../../lib/utils';
import {
  COLORS,
  GLOBAL_STYLES,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
} from '../../theme/designSystem';

type Summary = {
  total_ratings: number;
  raters: number;
  members: number;
  avg_stars: number | null;
};
type Tag = { tag: string; n: number };
type TypeAvg = { meal_type: string; avg_stars: number; n: number };
type Worst = { meal_date: string; meal_type: string; avg_stars: number; n: number };

const ratingColor = (v: number) =>
  v >= 4 ? COLORS.success : v >= 3 ? COLORS.warning : COLORS.danger;

export default function Admin() {
  const { hostelName, role } = useAuth();
  const router = useRouter();
  const { isDark, colors } = useTheme();

  useEffect(() => {
    if (role !== 'admin') {
      router.replace('/');
    }
  }, [role, router]);

  const [sum, setSum] = useState<Summary | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [types, setTypes] = useState<TypeAvg[]>([]);
  const [worst, setWorst] = useState<Worst[]>([]);
  const [comments, setComments] = useState<MealComment[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string;
    title: string;
    rating: number;
    comment?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [a, b, c, d, recentComments] = await Promise.all([
      supabase.rpc('admin_summary', { p_days: 7 }),
      supabase.rpc('admin_tag_counts', { p_days: 7 }),
      supabase.rpc('admin_meal_type_avg', { p_days: 7 }),
      supabase.rpc('admin_worst_meals', { p_days: 7 }),
      getRecentMealComments(15),
    ]);
    const err = a.error || b.error || c.error || d.error;
    if (err) {
      setError(err.message);
      return;
    }
    setError(null);
    setSum((a.data?.[0] as Summary) ?? null);
    setTags((b.data ?? []) as Tag[]);
    setTypes((c.data ?? []) as TypeAvg[]);
    setWorst((d.data ?? []) as Worst[]);
    setComments(recentComments);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  useEffect(() => {
    // Realtime listener for incoming ratings
    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ratings' },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  if (role !== 'admin') return null;

  if (loading) {
    return (
      <View style={[s.screen, { backgroundColor: colors.background }]}>
        <Header
          title="Admin Dashboard"
          subtitle={`Last 7 days · ${hostelName || 'Hostel'}`}
        />
        <AdminScreenSkeleton />
      </View>
    );
  }

  const participation =
    sum && sum.members > 0 ? Math.round((sum.raters / sum.members) * 100) : 0;
  const maxTag = Math.max(1, ...tags.map((t) => t.n));
  const lowestAvg = worst.length > 0 ? `★ ${worst[0].avg_stars}` : 'None';

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <Header
        title="Admin Dashboard"
        subtitle={`Last 7 days · ${hostelName || 'Hostel'}`}
      />

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        {error && (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>Couldn&apos;t load: {error}</Text>
          </View>
        )}

        {/* 2x2 Bento-Style KPI Grid */}
        <View style={s.bentoGrid}>
          <View style={s.bentoRow}>
            <StatCard
              label="TODAY'S AVG"
              value={sum?.avg_stars !== null && sum?.avg_stars !== undefined ? `★ ${sum.avg_stars}` : '–'}
            />
            <StatCard
              label="PARTICIPATION"
              value={`${participation}%`}
            />
          </View>
          <View style={s.bentoRow}>
            <StatCard
              label="TOTAL RATINGS"
              value={sum?.total_ratings ?? 0}
            />
            <StatCard
              label="LOWEST RATED"
              value={lowestAvg}
              accent={worst.length > 0 ? colors.danger : colors.secondary}
            />
          </View>
        </View>

        {/* Actionable Insights First: Requires Attention with left-border accent */}
        <View style={s.sectionWrap}>
          <Text style={[s.sectionHeader, { color: colors.textMuted }]}>REQUIRES ATTENTION</Text>
          {worst.length === 0 ? (
            <Card variant="bordered">
              <Text style={[s.emptyNotice, { color: colors.textMuted }]}>No meals flagged for attention this week.</Text>
            </Card>
          ) : (
            worst.map((w, i) => (
              <View key={`${w.meal_date}-${w.meal_type}-${i}`} style={[s.attentionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={GLOBAL_STYLES.rowBetween}>
                  <View style={{ flex: 1, marginRight: SPACING.sm }}>
                    <Text style={[TYPOGRAPHY.bodyBold, { color: colors.textMain }]} numberOfLines={1}>
                      {dayLabel(w.meal_date)} · {w.meal_type[0].toUpperCase() + w.meal_type.slice(1)}
                    </Text>
                    <Text style={[TYPOGRAPHY.caption, { marginTop: 2, color: colors.textMuted }]}>
                      {w.n} student{w.n !== 1 ? 's' : ''} reported issues
                    </Text>
                  </View>

                  <View style={[s.alertBadge, { backgroundColor: isDark ? '#450A0A' : '#FEE2E2' }]}>
                    <Text style={s.alertBadgeText}>
                      ★ {Number(w.avg_stars).toFixed(1)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Clean Data Lists: Average by Meal */}
        <View style={s.sectionWrap}>
          <Text style={[s.sectionHeader, { color: colors.textMuted }]}>AVERAGE BY MEAL</Text>
          <Card variant="bordered">
            {types.length === 0 ? (
              <Text style={[s.emptyNotice, { color: colors.textMuted }]}>No meal data available.</Text>
            ) : (
              types.map((t) => (
                <View key={t.meal_type} style={s.mealItemRow}>
                  <View style={GLOBAL_STYLES.rowBetween}>
                    <Text style={[s.mealTypeName, { color: colors.textMain }]}>
                      {t.meal_type[0].toUpperCase() + t.meal_type.slice(1)}
                    </Text>
                    <View style={[s.ratingPill, { backgroundColor: colors.surfaceSubtle }]}>
                      <Text
                        style={[
                          s.ratingPillText,
                          { color: ratingColor(Number(t.avg_stars)) },
                        ]}
                      >
                        ★ {Number(t.avg_stars).toFixed(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={[GLOBAL_STYLES.progressBarTrack, { backgroundColor: colors.surfaceSubtle }]}>
                    <View
                      style={[
                        GLOBAL_STYLES.progressBarFill,
                        {
                          width: `${Math.min(100, (Number(t.avg_stars) / 5) * 100)}%`,
                          backgroundColor: ratingColor(Number(t.avg_stars)),
                        },
                      ]}
                    />
                  </View>
                </View>
              ))
            )}
          </Card>
        </View>

        {/* Top Feedback Tags */}
        <View style={s.sectionWrap}>
          <Text style={[s.sectionHeader, { color: colors.textMuted }]}>TOP FEEDBACK TAGS</Text>
          <Card variant="bordered">
            {tags.length === 0 ? (
              <Text style={[s.emptyNotice, { color: colors.textMuted }]}>No student tags recorded yet.</Text>
            ) : (
              tags.map((t) => {
                const isPositive = t.tag === 'Great taste';
                return (
                  <View key={t.tag} style={s.tagItemRow}>
                    <View style={GLOBAL_STYLES.rowBetween}>
                      <Text style={[TYPOGRAPHY.body, { color: colors.textMain }]} numberOfLines={1}>
                        {t.tag}
                      </Text>
                      <Text style={[TYPOGRAPHY.bodyBold, { color: colors.textMain }]}>{t.n}</Text>
                    </View>

                    <View style={[GLOBAL_STYLES.progressBarTrack, { backgroundColor: colors.surfaceSubtle }]}>
                      <View
                        style={[
                          GLOBAL_STYLES.progressBarFill,
                          {
                            width: `${(t.n / maxTag) * 100}%`,
                            backgroundColor: isPositive ? colors.success : colors.danger,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </Card>
        </View>

        {/* Recent Plate Photos Feed */}
        {comments.some((c) => !!c.photo_url) && (
          <View style={s.sectionWrap}>
            <Text style={[s.sectionHeader, { color: colors.textMuted }]}>RECENT PLATE PHOTOS</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.photoStrip}
            >
              {comments
                .filter((c) => !!c.photo_url)
                .map((c) => {
                  const url = getPlatePhotoUrl(c.photo_url);
                  if (!url) return null;
                  return (
                    <Pressable
                      key={`strip-${c.rating_id}`}
                      onPress={() =>
                        setSelectedPhoto({
                          url,
                          title: `${c.meal_type ? c.meal_type[0].toUpperCase() + c.meal_type.slice(1) : 'Meal'} · ${c.meal_date ? dayLabel(c.meal_date) : ''}`,
                          rating: c.rating,
                          comment: c.comment,
                        })
                      }
                      style={[s.photoStripItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                      <Image source={{ uri: url }} style={s.photoStripImg} />
                      <View style={s.photoStripBadge}>
                        <Text style={s.photoStripBadgeText}>★ {c.rating}</Text>
                      </View>
                      <Text style={[s.photoStripLabel, { color: colors.textMuted }]} numberOfLines={1}>
                        {c.meal_type ? c.meal_type[0].toUpperCase() + c.meal_type.slice(1) : 'Meal'}
                      </Text>
                    </Pressable>
                  );
                })}
            </ScrollView>
          </View>
        )}

        {/* Recent Student Notes / Comments */}
        <View style={s.sectionWrap}>
          <Text style={[s.sectionHeader, { color: colors.textMuted }]}>RECENT STUDENT NOTES (ANONYMOUS)</Text>
          {comments.length === 0 ? (
            <Card variant="bordered">
              <Text style={[s.emptyNotice, { color: colors.textMuted }]}>No individual notes submitted recently.</Text>
            </Card>
          ) : (
            comments.map((c) => {
              const photoUrl = getPlatePhotoUrl(c.photo_url);
              return (
                <View key={c.rating_id} style={[s.commentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[GLOBAL_STYLES.rowBetween, { marginBottom: SPACING.xs }]}>
                    <Text style={[TYPOGRAPHY.caption, { color: colors.textMuted }]}>
                      {c.meal_type ? c.meal_type[0].toUpperCase() + c.meal_type.slice(1) : 'Meal'} ·{' '}
                      {c.meal_date ? dayLabel(c.meal_date) : ''}
                    </Text>
                    {c.rating > 0 ? (
                      <Text
                        style={[
                          s.ratingPillText,
                          { color: ratingColor(c.rating) },
                        ]}
                      >
                        ★ {c.rating}
                      </Text>
                    ) : null}
                  </View>
                  {c.comment ? (
                    <Text style={[s.commentText, { color: colors.textMain }]}>&quot;{c.comment}&quot;</Text>
                  ) : null}

                  {photoUrl ? (
                    <Pressable
                      onPress={() =>
                        setSelectedPhoto({
                          url: photoUrl,
                          title: `${c.meal_type ? c.meal_type[0].toUpperCase() + c.meal_type.slice(1) : 'Meal'} · ${c.meal_date ? dayLabel(c.meal_date) : ''}`,
                          rating: c.rating,
                          comment: c.comment,
                        })
                      }
                      style={s.commentPhotoBtn}
                    >
                      <Image source={{ uri: photoUrl }} style={s.commentPhotoThumb} />
                      <View style={s.photoTapOverlay}>
                        <Text style={s.photoTapText}>🔍 Tap to view plate</Text>
                      </View>
                    </Pressable>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Fullscreen Photo Modal */}
      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={s.modalOverlay}>
          <Pressable style={s.modalDismiss} onPress={() => setSelectedPhoto(null)} />
          <View style={[s.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[GLOBAL_STYLES.rowBetween, { marginBottom: SPACING.sm }]}>
              <Text style={[TYPOGRAPHY.h3, { color: colors.textMain, flex: 1, marginRight: SPACING.sm }]} numberOfLines={1}>
                {selectedPhoto?.title}
              </Text>
              <Pressable
                onPress={() => setSelectedPhoto(null)}
                hitSlop={12}
                style={[s.modalCloseBtn, { backgroundColor: colors.surfaceSubtle }]}
              >
                <Text style={[s.modalCloseText, { color: colors.textMain }]}>✕</Text>
              </Pressable>
            </View>

            {selectedPhoto?.url ? (
              <Image
                source={{ uri: selectedPhoto.url }}
                style={s.modalImage}
                resizeMode="cover"
              />
            ) : null}

            <View style={{ marginTop: SPACING.md }}>
              {selectedPhoto?.rating && selectedPhoto.rating > 0 ? (
                <Text style={[s.modalRating, { color: ratingColor(selectedPhoto.rating) }]}>
                  ★ {selectedPhoto.rating} Stars
                </Text>
              ) : null}
              {selectedPhoto?.comment ? (
                <Text style={[s.modalComment, { color: colors.textSecondary, marginTop: SPACING.xs }]}>
                  &quot;{selectedPhoto.comment}&quot;
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.danger,
    fontWeight: '600',
    fontSize: 13,
  },
  bentoGrid: {
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  sectionWrap: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    ...TYPOGRAPHY.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  attentionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3.5,
    borderLeftColor: COLORS.danger,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alertBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
  },
  alertBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
  },
  emptyNotice: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    paddingVertical: SPACING.xs,
  },
  mealItemRow: {
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  mealTypeName: {
    ...TYPOGRAPHY.bodyBold,
  },
  ratingPill: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  ratingPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tagItemRow: {
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  commentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  commentText: {
    ...TYPOGRAPHY.body,
    fontStyle: 'italic',
    color: COLORS.textMain,
  },
  commentPhotoBtn: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
    height: 120,
    backgroundColor: COLORS.surfaceSubtle,
  },
  commentPhotoThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoTapOverlay: {
    position: 'absolute',
    bottom: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  photoTapText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  photoStrip: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  photoStripItem: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  photoStripImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoStripBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  photoStripBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  photoStripLabel: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textTransform: 'capitalize',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    zIndex: 10,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalImage: {
    width: '100%',
    height: 240,
    borderRadius: RADIUS.md,
  },
  modalRating: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalComment: {
    ...TYPOGRAPHY.body,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
});
