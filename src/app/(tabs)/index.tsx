import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  DeviceEventEmitter,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Card, Header, PrimaryButton, VegDot } from '../../components/ui';
import { TodayScreenSkeleton } from '../../components/Skeleton';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../theme/ThemeContext';
import { getActivePolls, Poll } from '../../lib/polls';
import { getQueue } from '../../lib/ratings';
import { supabase } from '../../lib/supabase';
import {
  COLORS,
  GLOBAL_STYLES,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
} from '../../theme/designSystem';
import { MIN_RATINGS, todayStr } from '../../lib/utils';

const ORDER = ['breakfast', 'lunch', 'snacks', 'dinner'];
const TIMINGS: Record<string, string> = {
  breakfast: '7:30 AM – 9:30 AM',
  lunch: '12:30 PM – 2:30 PM',
  snacks: '5:00 PM – 6:15 PM',
  dinner: '8:00 PM – 10:00 PM',
};
const EMOJI: Record<string, string> = {
  breakfast: '🍳',
  lunch: '🍛',
  snacks: '☕',
  dinner: '🍽️',
};

type Meal = { id: string; meal_type: string; menu_items: string[] };
type Score = { meal_id: string; avg_stars: number; n: number };
type Mine = { stars: number | null; skipped: boolean };

const isMealNonVeg = (items: string[]) => {
  const nonVegKeywords = ['chicken', 'egg', 'fish', 'mutton', 'meat', 'prawn', 'beef', 'pork'];
  const text = items.join(' ').toLowerCase();
  return nonVegKeywords.some((k) => text.includes(k));
};

const emptySubscribe = () => () => {};

export default function Today() {
  const router = useRouter();
  const { session, hostelId, email, role } = useAuth();
  const { isDark, colors } = useTheme();
  const uid = session?.user.id;
  const [meals, setMeals] = useState<Meal[]>([]);
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [mine, setMine] = useState<Record<string, Mine>>({});
  const [pending, setPending] = useState<Record<string, Mine>>({});
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const q = (await getQueue()).filter((x) => x.user_id === uid);
    setPending(Object.fromEntries(q.map((x) => [x.meal_id, { stars: x.stars, skipped: x.skipped }])));

    const today = todayStr();
    const [m, s, r, polls] = await Promise.all([
      supabase.from('meals').select('id, meal_type, menu_items').eq('meal_date', today),
      supabase.rpc('meal_scores', { p_from: today, p_min: MIN_RATINGS }),
      supabase.from('ratings').select('meal_id, stars, skipped'),
      getActivePolls(hostelId).catch(() => []),
    ]);

    if (m.error || s.error || r.error) {
      setError((m.error || s.error || r.error)!.message);
      return;
    }
    setError(null);
    setMeals(
      ((m.data ?? []) as Meal[]).sort((a, b) => ORDER.indexOf(a.meal_type) - ORDER.indexOf(b.meal_type))
    );
    setScores(Object.fromEntries((s.data ?? []).map((x: Score) => [x.meal_id, x])));
    setMine(Object.fromEntries((r.data ?? []).map((x: any) => [x.meal_id, x])));
    if (polls && polls.length > 0) {
      setActivePoll(polls[0]);
    }
  }, [uid, hostelId]);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('ratings-synced', () => load());
    // Supabase Realtime subscription for live score updates
    const channel = supabase
      .channel('today-ratings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ratings' },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      sub.remove();
      supabase.removeChannel(channel);
    };
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const clientMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const pendingCount = Object.keys(pending).length;
  const hr = clientMounted ? new Date().getHours() : 12;
  const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const date = clientMounted
    ? new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
    : '';
  const headerSubtitle = clientMounted ? `${greet} · ${date} · Live` : "Today's Mess · Live";

  // Determine current active meal slot
  const currentSlot = useMemo(() => {
    if (hr < 11) return 'breakfast';
    if (hr < 16) return 'lunch';
    if (hr < 18) return 'snacks';
    return 'dinner';
  }, [hr]);

  // The active meal is the currently matching time slot if unrated, or the first unrated meal
  const activeMealId = useMemo(() => {
    if (meals.length === 0) return null;
    const currentMeal = meals.find((m) => m.meal_type === currentSlot);
    if (currentMeal && !(mine[currentMeal.id] || pending[currentMeal.id])) {
      return currentMeal.id;
    }
    const firstUnrated = meals.find((m) => !(mine[m.id] || pending[m.id]));
    return firstUnrated?.id || meals[0]?.id;
  }, [meals, currentSlot, mine, pending]);

  const userInitial = (email?.[0] || session?.user.email?.[0] || 'U').toUpperCase();

  const top = (
    <View style={s.topContainer}>
      <View style={s.actions}>
        {role === 'admin' ? (
          <>
            <Pressable
              style={[s.pillGhost, { backgroundColor: colors.surfaceSubtle }]}
              onPress={() => router.push('/(tabs)/admin')}
              hitSlop={6}
            >
              <Text style={[s.pillGhostText, { color: colors.textSecondary }]}>📊 View Analytics</Text>
            </Pressable>
            <Pressable
              style={[s.pillGhost, { backgroundColor: colors.surfaceSubtle }]}
              onPress={() => router.push('/admin-poll')}
              hitSlop={6}
            >
              <Text style={[s.pillGhostText, { color: colors.textSecondary }]}>🗳️ Create Poll</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              style={[s.pillGhost, { backgroundColor: colors.surfaceSubtle }]}
              onPress={() => router.push('/feedback')}
              hitSlop={6}
            >
              <Text style={[s.pillGhostText, { color: colors.textSecondary }]}>💬 Send Feedback</Text>
            </Pressable>
            <Pressable
              style={[s.pillGhost, { backgroundColor: colors.surfaceSubtle }]}
              onPress={() => router.push('/voting')}
              hitSlop={6}
            >
              <Text style={[s.pillGhostText, { color: colors.textSecondary }]}>🗳️ Weekly Vote</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Weekly Menu Vote Banner */}
      <Pressable
        style={[s.pollBannerCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}
        onPress={() =>
          router.push(
            activePoll
              ? { pathname: '/voting', params: { pollId: activePoll.id } }
              : role === 'admin'
              ? { pathname: '/admin-poll' }
              : { pathname: '/voting' }
          )
        }
      >
        <View style={GLOBAL_STYLES.rowBetween}>
          <View style={{ flex: 1, marginRight: SPACING.sm }}>
            <Text style={s.pollBadgeText}>
              {role === 'admin' ? '🗳️ STUDENT POLL STATUS' : '🗳️ WEEKLY MENU VOTE'}
            </Text>
            <Text style={[TYPOGRAPHY.h3, { color: colors.textMain }]} numberOfLines={1}>
              {activePoll ? activePoll.title : "Sunday's Special Feast"}
            </Text>
            <Text style={[s.pollClosesText, { color: colors.textMuted }]}>
              {activePoll
                ? `Closes ${activePoll.closes_at}`
                : role === 'admin'
                ? 'Tap to publish a student poll'
                : 'Vote for your favorite dishes'}
            </Text>
          </View>
          <View style={[s.voteNowBtn, role === 'admin' && { backgroundColor: colors.surfaceSubtle }]}>
            <Text style={[s.voteNowBtnText, role === 'admin' && { color: colors.primary }]}>
              {role === 'admin' ? 'Results →' : 'Vote →'}
            </Text>
          </View>
        </View>
      </Pressable>

      {pendingCount > 0 && (
        <View style={[s.banner, { backgroundColor: colors.primaryLight }]}>
          <Text style={[s.bannerText, { color: colors.primary }]}>
            ⏳ {pendingCount} rating{pendingCount > 1 ? 's' : ''} saved offline. Will sync automatically.
          </Text>
        </View>
      )}

      {meals.length > 0 && (
        <Text style={[s.sectionHeader, { color: colors.textMuted }]}>TODAY&apos;S SCHEDULE</Text>
      )}
    </View>
  );

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <Header
        title="Today's Mess"
        subtitle={headerSubtitle}
        right={
          <Pressable
            style={[s.avatarBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
            onPress={() => router.push('/profile')}
            hitSlop={8}
          >
            <Text style={[s.avatarBtnText, { color: colors.primary }]}>{userInitial}</Text>
          </Pressable>
        }
      />

      {loading ? (
        <TodayScreenSkeleton />
      ) : (
        <FlatList
          style={s.list}
          contentContainerStyle={s.listContent}
          data={meals}
          keyExtractor={(m) => m.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={top}
          ListEmptyComponent={
            <Text style={[s.empty, { color: colors.textMuted }]}>
              {error ? `Couldn't load meals:\n${error}\n\nPull down to retry.` : 'No meals scheduled for today.'}
            </Text>
          }
          renderItem={({ item }) => {
            const sc = scores[item.id];
            const my = mine[item.id] ?? pending[item.id];
            const isPending = !mine[item.id] && !!pending[item.id];
            const isActive = item.id === activeMealId && !my;
            const isNonVeg = isMealNonVeg(item.menu_items);
            const mealTitle = item.meal_type[0].toUpperCase() + item.meal_type.slice(1);
            const mainDish = item.menu_items[0] || mealTitle;
            const otherItems = item.menu_items.slice(1);

            return (
              <Card
                elevated={isActive}
                variant={my ? 'subtle' : 'bordered'}
                style={[s.cardWrapper, isActive ? s.activeCard : s.mutedCard]}
              >
                {/* Header row: veg dot + title + rating badge */}
                <View style={GLOBAL_STYLES.rowBetween}>
                  <View style={[GLOBAL_STYLES.rowStart, { flex: 1, marginRight: SPACING.sm }]}>
                    <VegDot isVeg={!isNonVeg} style={{ marginRight: SPACING.sm }} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          isActive ? TYPOGRAPHY.h2 : TYPOGRAPHY.h3,
                          { color: colors.textMain },
                        ]}
                        numberOfLines={1}
                      >
                        {mainDish}
                      </Text>
                      <Text style={[s.mealMeta, { color: colors.textMuted }]}>
                        {EMOJI[item.meal_type]} {mealTitle} · {TIMINGS[item.meal_type] || 'Standard timings'}
                      </Text>
                    </View>
                  </View>

                  {sc && sc.avg_stars > 0 ? (
                    <View style={[s.scoreChip, { backgroundColor: colors.surfaceSubtle }]}>
                      <Text style={[s.scoreChipText, { color: colors.textSecondary }]}>
                        ★ {Number(sc.avg_stars).toFixed(1)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Secondary items list */}
                {otherItems.length > 0 ? (
                  <Text style={[s.menuDetails, { color: colors.textSecondary }]} numberOfLines={2}>
                    {otherItems.join(' • ')}
                  </Text>
                ) : null}

                {/* CTA / status row */}
                <View style={s.ctaContainer}>
                  {role === 'admin' ? (
                    <Text style={[TYPOGRAPHY.caption, { color: colors.textMuted }]}>
                      Admin View · {sc?.n ? `${sc.n} student rating${sc.n > 1 ? 's' : ''}` : 'No student ratings yet'}
                    </Text>
                  ) : my ? (
                    <View style={[GLOBAL_STYLES.successBadge, { backgroundColor: isDark ? '#064E3B' : '#DCFCE7' }]}>
                      <Text style={[GLOBAL_STYLES.successBadgeText, { color: colors.success }]}>
                        {my.skipped
                          ? 'Marked as skipped ✓'
                          : `Rated ${'★'.repeat(my.stars ?? 0)} ✓`}
                        {isPending ? ' (syncing…)' : ''}
                      </Text>
                    </View>
                  ) : (
                    <PrimaryButton
                      label="Rate this meal"
                      variant={isActive ? 'primary' : 'soft'}
                      style={{ minHeight: isActive ? 46 : 40 }}
                      onPress={() =>
                        router.push({
                          pathname: '/rate',
                          params: { mealId: item.id, mealType: item.meal_type },
                        })
                      }
                    />
                  )}
                </View>
              </Card>
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  topContainer: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  pillGhost: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  pillGhostText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  avatarBtnText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 14,
  },
  pollBannerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  pollBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  pollClosesText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  voteNowBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
  },
  voteNowBtnText: {
    color: COLORS.textInverse,
    fontWeight: '700',
    fontSize: 13,
  },
  signout: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  signoutText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  banner: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  bannerText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  sectionHeader: {
    ...TYPOGRAPHY.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  empty: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: SPACING.xxl,
    lineHeight: 22,
    fontSize: 14,
  },
  cardWrapper: {
    marginBottom: SPACING.md,
  },
  activeCard: {
    marginBottom: SPACING.lg,
  },
  mutedCard: {
    opacity: 0.95,
  },
  mealMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  scoreChip: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    alignSelf: 'flex-start',
  },
  scoreChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  menuDetails: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  ctaContainer: {
    marginTop: SPACING.md,
  },
});
